"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/session";
import { audit } from "@/lib/audit";
import { vitalsSchema } from "@/lib/validation";
import { getAiProvider } from "@/lib/ai";
import { LAB_TESTS, RAD_TESTS, flagResult, labByCode, radByCode } from "@/lib/catalog";
import { checkInteractions, worstSeverity } from "@/lib/interactions";
import { invoiceEncounter } from "@/lib/billing-service";

const id = z.string().min(5).max(40);
const back = (encId: string, q = "") => `/hms/encounters/${encId}${q}`;

export async function saveVitals(formData: FormData) {
  const auth = await authorize("emr.write");
  if ("error" in auth) redirect("/hms/login");
  const raw = Object.fromEntries(formData.entries());
  const eid = id.safeParse(raw.encounterId);
  const v = vitalsSchema.safeParse(raw);
  if (!eid.success) redirect("/hms/encounters");
  if (!v.success) redirect(back(eid.data, "?error=validation"));
  await prisma.encounter.update({ where: { id: eid.data }, data: v.data });
  await audit(auth.user, "UPDATE", "Encounter", eid.data, "Vitals updated");
  revalidatePath(back(eid.data));
  redirect(back(eid.data, "?ok=vitals"));
}

export async function addDiagnosis(formData: FormData) {
  const auth = await authorize("emr.write");
  if ("error" in auth) redirect("/hms/login");
  const p = z.object({ encounterId: id, code: z.string().trim().min(2).max(12) }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/encounters");
  const icd = await prisma.icd10.findUnique({ where: { code: p.data.code } });
  if (!icd) redirect(back(p.data.encounterId, "?error=icd"));
  const has = await prisma.diagnosis.count({ where: { encounterId: p.data.encounterId } });
  const d = await prisma.diagnosis.create({ data: { encounterId: p.data.encounterId, code: icd.code, nameEn: icd.nameEn, nameAr: icd.nameAr, isPrimary: has === 0 } });
  await audit(auth.user, "CREATE", "Diagnosis", d.id, `ICD-10 ${icd.code}`);
  revalidatePath(back(p.data.encounterId));
  redirect(back(p.data.encounterId, "?ok=dx"));
}

export async function saveNotes(formData: FormData) {
  const auth = await authorize("emr.write");
  if ("error" in auth) redirect("/hms/login");
  const p = z.object({ encounterId: id, notes: z.string().trim().max(4000) }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/encounters");
  await prisma.encounter.update({ where: { id: p.data.encounterId }, data: { notes: p.data.notes, aiSummaryConfirmed: null } });
  await audit(auth.user, "UPDATE", "Encounter", p.data.encounterId, "Clinical notes updated");
  revalidatePath(back(p.data.encounterId));
  redirect(back(p.data.encounterId, "?ok=notes"));
}

export async function summarizeNoteAi(formData: FormData) {
  const auth = await authorize("ai.use");
  if ("error" in auth) redirect("/hms/login");
  const p = z.object({ encounterId: id }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/encounters");
  const enc = await prisma.encounter.findUnique({ where: { id: p.data.encounterId }, include: { diagnoses: true, orders: true } });
  if (!enc) redirect("/hms/encounters");
  const out = await getAiProvider().summarizeNote({
    complaint: enc.chiefComplaint,
    vitals: { hr: enc.hr, sbp: enc.sbp, rr: enc.rr, spo2: enc.spo2, temp: enc.temp, gcs: enc.gcs, pain: enc.pain },
    diagnoses: enc.diagnoses.map((d) => `${d.code} ${d.nameAr}`),
    notes: enc.notes ?? "",
    orders: enc.orders.map((o) => o.name),
    lang: "ar",
  });
  await prisma.encounter.update({ where: { id: enc.id }, data: { aiSummary: out.text, aiSummaryBy: out.provider, aiSummaryConfirmed: null } });
  await audit(auth.user, "AI", "Encounter", enc.id, `AI note summary (${out.provider})`);
  revalidatePath(back(enc.id));
  redirect(back(enc.id, "?ok=ai"));
}

export async function confirmSummary(formData: FormData) {
  const auth = await authorize("er.confirm");
  if ("error" in auth) redirect("/hms/login");
  const p = z.object({ encounterId: id }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/encounters");
  await prisma.encounter.update({ where: { id: p.data.encounterId }, data: { aiSummaryConfirmed: `${auth.user.name} · ${new Date().toISOString()}` } });
  await audit(auth.user, "CONFIRM", "Encounter", p.data.encounterId, "AI note summary confirmed by clinician");
  revalidatePath(back(p.data.encounterId));
  redirect(back(p.data.encounterId, "?ok=confirmed"));
}

export async function createOrder(formData: FormData) {
  const auth = await authorize("orders.create");
  if ("error" in auth) redirect("/hms/login");
  const p = z
    .object({ encounterId: id, kind: z.enum(["LAB", "RAD"]), code: z.string().min(2).max(20), priority: z.enum(["ROUTINE", "URGENT", "STAT"]).default("ROUTINE") })
    .safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/encounters");
  const enc = await prisma.encounter.findUnique({ where: { id: p.data.encounterId } });
  const lab = p.data.kind === "LAB" ? labByCode(p.data.code) : null;
  const rad = p.data.kind === "RAD" ? radByCode(p.data.code) : null;
  if (!enc || (!lab && !rad)) redirect(back(p.data.encounterId, "?error=validation"));
  const name = lab?.name ?? rad!.name;
  const o = await prisma.order.create({
    data: { encounterId: enc.id, patientId: enc.patientId, kind: p.data.kind, code: p.data.code, name, priority: p.data.priority, status: "ORDERED", unit: lab?.unit, refLow: lab?.refLow, refHigh: lab?.refHigh, orderedBy: auth.user.name },
  });
  await prisma.charge.create({ data: { encounterId: enc.id, patientId: enc.patientId, description: name, category: p.data.kind, unitPrice: lab?.price ?? rad!.price } });
  await audit(auth.user, "CREATE", "Order", o.id, `${p.data.kind} ${p.data.code}`);
  revalidatePath(back(enc.id));
  redirect(back(enc.id, "?ok=order"));
}

export async function enterLabResult(formData: FormData) {
  const auth = await authorize("lab.result");
  if ("error" in auth) redirect("/hms/login");
  const p = z.object({ orderId: id, value: z.coerce.number().min(-1000000).max(1000000) }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/orders?error=validation");
  const o = await prisma.order.findUnique({ where: { id: p.data.orderId } });
  const t = o ? labByCode(o.code) : null;
  if (!o || o.kind !== "LAB" || !t) redirect("/hms/orders?error=validation");
  const flag = flagResult(p.data.value, t);
  await prisma.order.update({ where: { id: o.id }, data: { status: "RESULTED", value: p.data.value, flag, resultedAt: new Date(), resultedBy: auth.user.name, unit: t.unit, refLow: t.refLow, refHigh: t.refHigh } });
  await audit(auth.user, "UPDATE", "Order", o.id, `Lab result ${o.code}=${p.data.value} flag ${flag}`);
  revalidatePath("/hms/orders");
  redirect("/hms/orders?ok=1");
}

export async function enterRadResult(formData: FormData) {
  const auth = await authorize("rad.result");
  if ("error" in auth) redirect("/hms/login");
  const p = z.object({ orderId: id, resultText: z.string().trim().min(3).max(1500), abnormal: z.string().optional() }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/orders?error=validation");
  const o = await prisma.order.findUnique({ where: { id: p.data.orderId } });
  if (!o || o.kind !== "RAD") redirect("/hms/orders?error=validation");
  await prisma.order.update({ where: { id: o.id }, data: { status: "RESULTED", resultText: p.data.resultText, flag: p.data.abnormal ? "H" : "N", resultedAt: new Date(), resultedBy: auth.user.name } });
  await audit(auth.user, "UPDATE", "Order", o.id, `Radiology report ${o.code}`);
  revalidatePath("/hms/orders");
  redirect("/hms/orders?ok=1");
}

export async function prescribe(formData: FormData) {
  const auth = await authorize("pharmacy.prescribe");
  if ("error" in auth) redirect("/hms/login");
  const p = z
    .object({ encounterId: id, drugId: id, dose: z.string().trim().min(1).max(60), frequency: z.string().trim().min(2).max(60), days: z.coerce.number().int().min(1).max(90), qty: z.coerce.number().int().min(1).max(500), override: z.string().optional() })
    .safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/encounters");
  const [enc, drug, table] = await Promise.all([
    prisma.encounter.findUnique({ where: { id: p.data.encounterId } }),
    prisma.drug.findUnique({ where: { id: p.data.drugId } }),
    prisma.drugInteraction.findMany(),
  ]);
  if (!enc || !drug) redirect("/hms/encounters");
  const active = await prisma.prescription.findMany({ where: { patientId: enc.patientId, status: { in: ["PENDING", "DISPENSED"] }, prescribedAt: { gte: new Date(Date.now() - 30 * 86400_000) } }, include: { drug: true } });
  const hits = checkInteractions(drug.generic, active.map((a) => a.drug.generic), table);
  const worst = worstSeverity(hits);
  if (worst === "CONTRAINDICATED") redirect(back(enc.id, "?error=contraindicated"));
  if (hits.length && !p.data.override) redirect(back(enc.id, `?error=interaction&drug=${encodeURIComponent(drug.id)}`));
  const note = hits.length ? hits.map((h) => `${h.severity}: ${h.noteAr}`).join(" | ") : null;
  const rx = await prisma.prescription.create({
    data: { encounterId: enc.id, patientId: enc.patientId, drugId: drug.id, dose: p.data.dose, frequency: p.data.frequency, days: p.data.days, qty: p.data.qty, interactionNote: note, prescribedBy: auth.user.name },
  });
  await prisma.charge.create({ data: { encounterId: enc.id, patientId: enc.patientId, description: `${drug.name} ${drug.strength}`, category: "PHARMACY", qty: p.data.qty, unitPrice: drug.unitPrice } });
  await audit(auth.user, "CREATE", "Prescription", rx.id, `${drug.generic} x${p.data.qty}${hits.length ? " (interaction acknowledged)" : ""}`);
  revalidatePath(back(enc.id));
  redirect(back(enc.id, "?ok=rx"));
}

export async function dispense(formData: FormData) {
  const auth = await authorize("pharmacy.dispense");
  if ("error" in auth) redirect("/hms/login");
  const p = z.object({ prescriptionId: id }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/pharmacy?error=validation");
  const rx = await prisma.prescription.findUnique({ where: { id: p.data.prescriptionId }, include: { drug: true } });
  if (!rx || rx.status !== "PENDING") redirect("/hms/pharmacy?error=validation");
  if (rx.drug.stock < rx.qty) redirect("/hms/pharmacy?error=stock");
  await prisma.$transaction([
    prisma.drug.update({ where: { id: rx.drugId }, data: { stock: { decrement: rx.qty } } }),
    prisma.prescription.update({ where: { id: rx.id }, data: { status: "DISPENSED", dispensedAt: new Date(), dispensedBy: auth.user.name } }),
  ]);
  await audit(auth.user, "UPDATE", "Prescription", rx.id, `Dispensed ${rx.drug.generic} x${rx.qty}`);
  revalidatePath("/hms/pharmacy");
  redirect("/hms/pharmacy?ok=dispensed");
}

export async function restock(formData: FormData) {
  const auth = await authorize("pharmacy.stock");
  if ("error" in auth) redirect("/hms/login");
  const p = z.object({ drugId: id, qty: z.coerce.number().int().min(1).max(10000) }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/pharmacy?error=validation");
  const d = await prisma.drug.update({ where: { id: p.data.drugId }, data: { stock: { increment: p.data.qty } } });
  await audit(auth.user, "UPDATE", "Drug", d.id, `Restocked ${d.generic} +${p.data.qty}`);
  revalidatePath("/hms/pharmacy");
  redirect("/hms/pharmacy?ok=restocked");
}

export async function invoiceNow(formData: FormData) {
  const auth = await authorize("billing.manage");
  if ("error" in auth) redirect("/hms/login");
  const p = z.object({ encounterId: id }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/billing?error=validation");
  const res = await invoiceEncounter(p.data.encounterId);
  if (!res) redirect("/hms/billing?error=nothing");
  await audit(auth.user, "CREATE", "Invoice", p.data.encounterId, "Invoice issued from encounter charges");
  revalidatePath("/hms/billing");
  redirect("/hms/billing?ok=invoiced");
}

export async function markInvoicePaid(formData: FormData) {
  const auth = await authorize("billing.manage");
  if ("error" in auth) redirect("/hms/login");
  const p = z.object({ invoiceId: id }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/billing?error=validation");
  await prisma.invoice.update({ where: { id: p.data.invoiceId }, data: { status: "PAID", paidAt: new Date() } });
  await audit(auth.user, "UPDATE", "Invoice", p.data.invoiceId, "Invoice marked paid");
  revalidatePath("/hms/billing");
  redirect("/hms/billing?ok=paid");
}

export async function setClaimStatus(formData: FormData) {
  const auth = await authorize("billing.manage");
  if ("error" in auth) redirect("/hms/login");
  const p = z.object({ claimId: id, status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PAID"]) }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/billing?error=validation");
  await prisma.claim.update({ where: { id: p.data.claimId }, data: { status: p.data.status } });
  await audit(auth.user, "UPDATE", "Claim", p.data.claimId, `Claim status ${p.data.status}`);
  revalidatePath("/hms/billing");
  redirect("/hms/billing?ok=claim");
}

export const CATALOG_FOR_UI = { lab: LAB_TESTS.map((t) => ({ code: t.code, name: t.name })), rad: RAD_TESTS.map((t) => ({ code: t.code, name: t.name })) };
