// Smoke test for the public booking flow against a running server (default http://127.0.0.1:3120).
// Usage: node scripts/smoke-booking.mjs [baseUrl]
import { PrismaClient } from "@prisma/client";

const base = process.argv[2] || "http://127.0.0.1:3120";
const prisma = new PrismaClient();

function fail(msg) {
  console.error("FAIL:", msg);
  process.exitCode = 1;
}

try {
  const link = await prisma.doctorBranch.findFirst();
  if (!link) throw new Error("no doctor/branch link in the database — run npm run db:seed");

  const s = await fetch(`${base}/api/slots?doctorId=${link.doctorId}&branchId=${link.branchId}`);
  const sj = await s.json();
  if (s.status !== 200 || !Array.isArray(sj.slots) || sj.slots.length === 0) throw new Error(`slots: status ${s.status}`);
  console.log("slots ok:", sj.slots.length);

  const bad = await fetch(`${base}/api/appointments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ doctorId: link.doctorId }),
  });
  if (bad.status !== 400) fail(`invalid booking should be 400, got ${bad.status}`);
  else console.log("validation ok: 400");

  const res = await fetch(`${base}/api/appointments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      doctorId: link.doctorId,
      branchId: link.branchId,
      start: sj.slots[sj.slots.length - 1],
      name: "مريض تجريبي",
      phone: "0500000000",
    }),
  });
  const rj = await res.json();
  if (res.status !== 201 || !/^RW-/.test(rj.number ?? "")) fail(`booking: ${res.status} ${JSON.stringify(rj)}`);
  else console.log("booking ok:", rj.number);

  const again = await fetch(`${base}/api/appointments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      doctorId: link.doctorId,
      branchId: link.branchId,
      start: sj.slots[sj.slots.length - 1],
      name: "مريض تجريبي",
      phone: "0500000000",
    }),
  });
  if (again.status !== 409) fail(`double booking should be 409, got ${again.status}`);
  else console.log("double-booking blocked: 409");
} catch (e) {
  fail(String(e.message || e));
} finally {
  await prisma.$disconnect();
}
