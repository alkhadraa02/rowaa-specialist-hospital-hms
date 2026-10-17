"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/session";
import { audit } from "@/lib/audit";

const admitSchema = z.object({
  mrn: z.string().trim().min(3).max(30),
  bedId: z.string().min(5).max(40),
  diagnosis: z.string().trim().max(200).optional(),
  expectedDischarge: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

export async function admitPatient(formData: FormData) {
  const auth = await authorize("beds.manage");
  if ("error" in auth) redirect("/hms/login");
  const p = admitSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/beds?error=validation");
  const patient = await prisma.patient.findUnique({ where: { mrn: p.data.mrn.toUpperCase() } });
  if (!patient) redirect("/hms/beds?error=patient");
  const bed = await prisma.bed.findUnique({ where: { id: p.data.bedId } });
  if (!bed || bed.status !== "AVAILABLE") redirect("/hms/beds?error=bed");
  const already = await prisma.admission.findFirst({ where: { patientId: patient.id, status: "ACTIVE" } });
  if (already) redirect("/hms/beds?error=already");
  const adm = await prisma.$transaction(async (tx) => {
    const a = await tx.admission.create({
      data: {
        patientId: patient.id,
        bedId: bed.id,
        diagnosis: p.data.diagnosis || null,
        admittedAt: new Date(),
        expectedDischarge: p.data.expectedDischarge ? new Date(`${p.data.expectedDischarge}T12:00:00+03:00`) : null,
      },
    });
    await tx.bed.update({ where: { id: bed.id }, data: { status: "OCCUPIED" } });
    await tx.admissionEvent.create({ data: { admissionId: a.id, type: "ADMIT", toBedId: bed.id, byName: auth.user.name } });
    return a;
  });
  await audit(auth.user, "CREATE", "Admission", adm.id, `Admitted ${patient.mrn} to bed ${bed.label}`);
  revalidatePath("/hms/beds");
  redirect("/hms/beds?ok=admit");
}

export async function transferPatient(formData: FormData) {
  const auth = await authorize("beds.manage");
  if ("error" in auth) redirect("/hms/login");
  const p = z.object({ admissionId: z.string().min(5).max(40), toBedId: z.string().min(5).max(40) }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/beds?error=validation");
  const adm = await prisma.admission.findUnique({ where: { id: p.data.admissionId } });
  const to = await prisma.bed.findUnique({ where: { id: p.data.toBedId } });
  if (!adm || adm.status !== "ACTIVE" || !to || to.status !== "AVAILABLE") redirect("/hms/beds?error=bed");
  await prisma.$transaction([
    prisma.bed.update({ where: { id: adm.bedId }, data: { status: "CLEANING" } }),
    prisma.bed.update({ where: { id: to.id }, data: { status: "OCCUPIED" } }),
    prisma.admission.update({ where: { id: adm.id }, data: { bedId: to.id } }),
    prisma.admissionEvent.create({ data: { admissionId: adm.id, type: "TRANSFER", fromBedId: adm.bedId, toBedId: to.id, byName: auth.user.name } }),
  ]);
  await audit(auth.user, "UPDATE", "Admission", adm.id, `Transferred to bed ${to.label}`);
  revalidatePath("/hms/beds");
  redirect("/hms/beds?ok=transfer");
}

export async function dischargePatient(formData: FormData) {
  const auth = await authorize("beds.manage");
  if ("error" in auth) redirect("/hms/login");
  const p = z.object({ admissionId: z.string().min(5).max(40) }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/beds?error=validation");
  const adm = await prisma.admission.findUnique({ where: { id: p.data.admissionId } });
  if (!adm || adm.status !== "ACTIVE") redirect("/hms/beds?error=validation");
  await prisma.$transaction([
    prisma.admission.update({ where: { id: adm.id }, data: { status: "DISCHARGED", dischargedAt: new Date() } }),
    prisma.bed.update({ where: { id: adm.bedId }, data: { status: "CLEANING" } }),
    prisma.admissionEvent.create({ data: { admissionId: adm.id, type: "DISCHARGE", fromBedId: adm.bedId, byName: auth.user.name } }),
  ]);
  await audit(auth.user, "UPDATE", "Admission", adm.id, "Discharged");
  revalidatePath("/hms/beds");
  redirect("/hms/beds?ok=discharge");
}

export async function releaseBed(formData: FormData) {
  const auth = await authorize("beds.manage");
  if ("error" in auth) redirect("/hms/login");
  const p = z.object({ bedId: z.string().min(5).max(40) }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/beds?error=validation");
  const bed = await prisma.bed.findUnique({ where: { id: p.data.bedId } });
  if (!bed || bed.status !== "CLEANING") redirect("/hms/beds?error=bed");
  await prisma.bed.update({ where: { id: bed.id }, data: { status: "AVAILABLE" } });
  await audit(auth.user, "UPDATE", "Bed", bed.id, `Bed ${bed.label} cleaned and available`);
  revalidatePath("/hms/beds");
  redirect("/hms/beds");
}
