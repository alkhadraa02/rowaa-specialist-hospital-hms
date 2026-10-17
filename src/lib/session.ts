import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./db";
import { can, type Permission } from "./rbac";

export const STAFF_COOKIE = "rowaa_staff";
export const PATIENT_COOKIE = "rowaa_patient";
const TTL_MS = 8 * 3600_000;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type StaffUser = { id: string; name: string; nameEn: string | null; email: string; role: string; doctorId: string | null };

async function setCookie(name: string, token: string) {
  (await cookies()).set(name, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function createStaffSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({ data: { tokenHash: hashToken(token), kind: "staff", userId, expiresAt: new Date(Date.now() + TTL_MS) } });
  await setCookie(STAFF_COOKIE, token);
}

export async function createPatientSession(patientId: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({ data: { tokenHash: hashToken(token), kind: "patient", patientId, expiresAt: new Date(Date.now() + TTL_MS) } });
  await setCookie(PATIENT_COOKIE, token);
}

export async function destroySession(name: string) {
  const jar = await cookies();
  const token = jar.get(name)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(name);
}

export const getStaff = cache(async (): Promise<StaffUser | null> => {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!token) return null;
  const s = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { doctor: { select: { id: true } } } } },
  });
  if (!s || s.kind !== "staff" || s.expiresAt < new Date() || !s.user || !s.user.active) return null;
  const u = s.user;
  return { id: u.id, name: u.name, nameEn: u.nameEn, email: u.email, role: u.role, doctorId: u.doctor?.id ?? null };
});

export const getPatient = cache(async () => {
  const token = (await cookies()).get(PATIENT_COOKIE)?.value;
  if (!token) return null;
  const s = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { patient: true } });
  if (!s || s.kind !== "patient" || s.expiresAt < new Date() || !s.patient) return null;
  return s.patient;
});

/** Result of an authorization check usable in server actions and route handlers (no redirects). */
export async function authorize(perm: Permission): Promise<{ user: StaffUser } | { error: "unauthenticated" | "forbidden" }> {
  const user = await getStaff();
  if (!user) return { error: "unauthenticated" };
  if (!can(user.role, perm)) return { error: "forbidden" };
  return { user };
}
