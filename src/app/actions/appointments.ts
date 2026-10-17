"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/session";
import { audit } from "@/lib/audit";
import { addDays, dayKey, startOfDay } from "@/lib/time";

const idSchema = z.object({ appointmentId: z.string().min(5).max(40) });

export async function checkInAppointment(formData: FormData) {
  const auth = await authorize("appointments.manage");
  if ("error" in auth) redirect("/hms/login");
  const p = idSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/appointments");
  const a = await prisma.appointment.findUnique({ where: { id: p.data.appointmentId } });
  if (!a || a.status !== "BOOKED") redirect("/hms/appointments");
  const today = startOfDay();
  const last = await prisma.appointment.aggregate({
    _max: { queueNo: true },
    where: { doctorId: a.doctorId, checkedInAt: { gte: today, lt: addDays(today, 1) } },
  });
  await prisma.appointment.update({ where: { id: a.id }, data: { status: "CHECKED_IN", checkedInAt: new Date(), queueNo: (last._max.queueNo ?? 0) + 1 } });
  await audit(auth.user, "UPDATE", "Appointment", a.id, `Checked in ${a.number}`);
  revalidatePath("/hms/appointments");
  redirect(`/hms/appointments?day=${dayKey(a.start)}`);
}

export async function setAppointmentStatus(formData: FormData) {
  const auth = await authorize("appointments.manage");
  if ("error" in auth) redirect("/hms/login");
  const p = idSchema.extend({ status: z.enum(["CANCELLED", "NO_SHOW", "COMPLETED"]) }).safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/appointments");
  const a = await prisma.appointment.update({ where: { id: p.data.appointmentId }, data: { status: p.data.status } });
  await audit(auth.user, "UPDATE", "Appointment", a.id, `Appointment ${a.number} -> ${p.data.status}`);
  revalidatePath("/hms/appointments");
  redirect(`/hms/appointments?day=${dayKey(a.start)}`);
}

export async function startVisit(formData: FormData) {
  const auth = await authorize("emr.write");
  if ("error" in auth) redirect("/hms/login");
  const p = idSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!p.success) redirect("/hms/appointments");
  const a = await prisma.appointment.findUnique({ where: { id: p.data.appointmentId } });
  if (!a || !a.patientId) redirect("/hms/appointments?error=nopatient");
  const enc = await prisma.encounter.create({
    data: { patientId: a.patientId, doctorId: a.doctorId, branchId: a.branchId, type: "OPD", chiefComplaint: a.notes ?? null, seenAt: new Date() },
  });
  await prisma.charge.create({ data: { encounterId: enc.id, patientId: a.patientId, description: "كشف طبيب", category: "CONSULT", unitPrice: (await prisma.doctor.findUnique({ where: { id: a.doctorId }, select: { fee: true } }))?.fee ?? 0 } });
  await prisma.appointment.update({ where: { id: a.id }, data: { status: "COMPLETED" } });
  await audit(auth.user, "CREATE", "Encounter", enc.id, `Visit started from ${a.number}`);
  redirect(`/hms/encounters/${enc.id}`);
}
