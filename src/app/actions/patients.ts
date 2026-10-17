"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/session";
import { audit } from "@/lib/audit";
import { patientSchema } from "@/lib/validation";

async function nextMrn() {
  let n = (await prisma.patient.count()) + 1;
  for (;;) {
    const mrn = `RWA-${String(n).padStart(6, "0")}`;
    if (!(await prisma.patient.findUnique({ where: { mrn } }))) return mrn;
    n++;
  }
}

export async function registerPatient(formData: FormData) {
  const auth = await authorize("patients.write");
  if ("error" in auth) redirect("/hms/login");
  const raw = Object.fromEntries(formData.entries());
  const parsed = patientSchema.safeParse(raw);
  if (!parsed.success) redirect("/hms/patients?error=validation");
  const d = parsed.data;
  if (await prisma.patient.findUnique({ where: { nationalId: d.nationalId } })) redirect("/hms/patients?error=duplicate");
  const p = await prisma.patient.create({
    data: {
      mrn: await nextMrn(),
      nameAr: d.nameAr,
      nameEn: d.nameEn,
      nationalId: d.nationalId,
      gender: d.gender,
      dob: new Date(`${d.dob}T00:00:00+03:00`),
      phone: d.phone,
      email: d.email || null,
      insurer: d.insurer || null,
      policyNo: d.policyNo || null,
      bloodType: d.bloodType || null,
      allergies: d.allergies || null,
    },
  });
  await audit(auth.user, "CREATE", "Patient", p.id, `Registered patient ${p.mrn}`);
  revalidatePath("/hms/patients");
  redirect(`/hms/patients?created=${p.mrn}`);
}
