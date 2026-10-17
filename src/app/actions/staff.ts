"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createStaffSession, destroySession, getStaff, STAFF_COOKIE } from "@/lib/session";
import { loginSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

export async function staffLogin(formData: FormData) {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) redirect("/hms/login?error=1");
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.active || !verifyPassword(parsed.data.password, user.passwordHash)) redirect("/hms/login?error=1");
  await createStaffSession(user.id);
  await audit({ id: user.id, name: user.name, role: user.role }, "LOGIN", "User", user.id, "Staff sign-in");
  redirect("/hms");
}

export async function staffLogout() {
  const u = await getStaff();
  if (u) await audit(u, "LOGOUT", "User", u.id, "Staff sign-out");
  await destroySession(STAFF_COOKIE);
  redirect("/hms/login");
}
