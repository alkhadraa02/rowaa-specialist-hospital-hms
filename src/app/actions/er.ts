"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/session";
import { audit } from "@/lib/audit";
import { ageYears } from "@/lib/time";
import { suggestTriage } from "@/lib/triage";
import { getAiProvider } from "@/lib/ai";
import { vitalsSchema } from "@/lib/validation";

const arrivalSchema = z.object({ mrn: z.string().trim().min(3).max(30), complaint: z.string().trim().min(2).max(300) });
const idSchema = z.object({ encounterId: z.string().min(5).max(40) });

export async function registerErArrival(formData: FormData) {
  const auth = await authorize("er.manage");
  if ("error" in auth) redirect("/hms/login");
  const raw = Object.fromEntries(formData.entries());
  const head = arrivalSchema.safeParse(raw);
  const vit = vitalsSchema.safeParse(raw);
  if (!head.success || !vit.success) redirect("/hms/er?error=validation");
  const patient = await prisma.patient.findUnique({ where: { mrn: head.data.mrn.toUpperCase() } });
  if (!patient) redirect("/hms/er?error=patient");
  const branch = await prisma.branch.findFirst({ orderBy: { slug: "asc" } });
  const v = vit.data;
  const result = suggestTriage({
    ageYears: ageYears(patient.dob),
    complaint: head.data.complaint,
    vitals: { hr: v.hr, sbp: v.sbp, rr: v.rr, spo2: v.spo2, temp: v.temp, gcs: v.gcs, pain: v.pain, dbp: v.dbp },
  });
  const enc = await prisma.encounter.create({
    data: {
      patientId: patient.id,
      branchId: branch?.id ?? null,
      type: "ER",
      status: "OPEN",
      chiefComplaint: head.data.complaint,
      hr: v.hr ?? null, sbp: v.sbp ?? null, dbp: v.dbp ?? null, rr: v.rr ?? null, spo2: v.spo2 ?? null,
      temp: v.temp ?? null, gcs: v.gcs ?? null, pain: v.pain ?? null, weight: v.weight ?? null,
      triageSuggested: result.level,
      triageReasons: JSON.stringify(result.reasons),
    },
  });
  await audit(auth.user, "CREATE", "Encounter", enc.id, `ER arrival ${patient.mrn}, suggested ESI ${result.level}`);
  revalidatePath("/hms/er");
  redirect(`/hms/er?added=${patient.mrn}`);
}

/** A named clinician confirms (or overrides) the suggested level. Without it the suggestion is not part of the record. */
export async function confirmTriage(formData: FormData) {
  const auth = await authorize("er.confirm");
  if ("error" in auth) redirect("/hms/er?error=forbidden");
  const p = idSchema.extend({ level: z.coerce.number().int().min(1).max(5) }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/er?error=validation");
  await prisma.encounter.update({
    where: { id: p.data.encounterId },
    data: { triageFinal: p.data.level, triageConfirmedBy: auth.user.name, triageConfirmedAt: new Date() },
  });
  await audit(auth.user, "CONFIRM", "Encounter", p.data.encounterId, `Triage confirmed ESI ${p.data.level}`);
  revalidatePath("/hms/er");
  redirect("/hms/er");
}

export async function explainTriageAi(formData: FormData) {
  const auth = await authorize("ai.use");
  if ("error" in auth) redirect("/hms/er?error=forbidden");
  const p = idSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/er?error=validation");
  const enc = await prisma.encounter.findUnique({ where: { id: p.data.encounterId }, include: { patient: true } });
  if (!enc || enc.triageSuggested == null) redirect("/hms/er?error=validation");
  const reasons = enc.triageReasons ? (JSON.parse(enc.triageReasons) as { ar: string }[]).map((r) => r.ar) : [];
  const provider = getAiProvider();
  const out = await provider.explainTriage({
    level: enc.triageSuggested,
    reasons,
    complaint: enc.chiefComplaint ?? "",
    ageYears: ageYears(enc.patient.dob),
    vitals: { hr: enc.hr, sbp: enc.sbp, rr: enc.rr, spo2: enc.spo2, temp: enc.temp, gcs: enc.gcs, pain: enc.pain },
    lang: "ar",
  });
  await prisma.encounter.update({ where: { id: enc.id }, data: { triageAi: JSON.stringify({ provider: out.provider, mock: out.mock, text: out.text }) } });
  await audit(auth.user, "AI", "Encounter", enc.id, `AI triage explanation (${out.provider})`);
  revalidatePath("/hms/er");
  redirect("/hms/er");
}

export async function markSeen(formData: FormData) {
  const auth = await authorize("er.manage");
  if ("error" in auth) redirect("/hms/login");
  const p = idSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/er?error=validation");
  await prisma.encounter.update({ where: { id: p.data.encounterId }, data: { seenAt: new Date(), doctorId: auth.user.doctorId ?? undefined } });
  await audit(auth.user, "UPDATE", "Encounter", p.data.encounterId, "ER patient seen");
  revalidatePath("/hms/er");
  redirect("/hms/er");
}

export async function closeErVisit(formData: FormData) {
  const auth = await authorize("er.manage");
  if ("error" in auth) redirect("/hms/login");
  const p = idSchema.extend({ disposition: z.enum(["DISCHARGED", "ADMITTED", "TRANSFERRED", "LWBS"]) }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/er?error=validation");
  await prisma.encounter.update({ where: { id: p.data.encounterId }, data: { status: "CLOSED", endedAt: new Date(), disposition: p.data.disposition } });
  await audit(auth.user, "UPDATE", "Encounter", p.data.encounterId, `ER visit closed: ${p.data.disposition}`);
  revalidatePath("/hms/er");
  redirect("/hms/er");
}
