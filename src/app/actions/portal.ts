"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createPatientSession, destroySession, PATIENT_COOKIE } from "@/lib/session";
import { nationalIdSchema } from "@/lib/validation";

export async function patientLogin(formData: FormData) {
  const idParsed = nationalIdSchema.safeParse(String(formData.get("nationalId") ?? "").trim());
  const password = String(formData.get("password") ?? "").slice(0, 200);
  if (!idParsed.success || !password) redirect("/portal?error=1");
  const patient = await prisma.patient.findUnique({ where: { nationalId: idParsed.data } });
  if (!patient || !verifyPassword(password, patient.passwordHash)) redirect("/portal?error=1");
  await createPatientSession(patient.id);
  redirect("/portal");
}

export async function patientLogout() {
  await destroySession(PATIENT_COOKIE);
  redirect("/portal");
}
