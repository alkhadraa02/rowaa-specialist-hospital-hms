import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bookingSchema } from "@/lib/validation";
import { isValidSlot } from "@/lib/slots";
import { audit } from "@/lib/audit";

const hits = new Map<string, { n: number; t: number }>();

function limited(key: string) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.t > 60_000) {
    hits.set(key, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  return h.n > 10;
}

function bookingNumber() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)];
  return `RW-${s}`;
}

/** Public booking: creates an appointment after validating the doctor, branch and slot. */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return NextResponse.json({ error: "too_many_requests" }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const b = parsed.data;
  const start = new Date(b.start);

  const link = await prisma.doctorBranch.findUnique({
    where: { doctorId_branchId: { doctorId: b.doctorId, branchId: b.branchId } },
    include: { doctor: true },
  });
  if (!link) return NextResponse.json({ error: "doctor_not_at_branch" }, { status: 404 });

  const taken = await prisma.appointment.findMany({
    where: { doctorId: b.doctorId, status: { not: "CANCELLED" }, start: { gte: new Date(), lte: new Date(Date.now() + 31 * 86400_000) } },
    select: { start: true },
  });
  const booked = new Set(taken.map((x) => x.start.getTime()));
  if (!isValidSlot(link, start, booked)) return NextResponse.json({ error: "slot_unavailable" }, { status: 409 });

  const patient = b.nationalId ? await prisma.patient.findUnique({ where: { nationalId: b.nationalId } }) : null;

  let created = null;
  for (let i = 0; i < 5 && !created; i++) {
    try {
      created = await prisma.appointment.create({
        data: {
          number: bookingNumber(),
          patientId: patient?.id ?? null,
          doctorId: b.doctorId,
          branchId: b.branchId,
          specialtyId: link.doctor.specialtyId,
          start,
          name: b.name,
          phone: b.phone,
          nationalId: b.nationalId || null,
          notes: b.notes || null,
        },
      });
    } catch {
      /* number collision: retry */
    }
  }
  if (!created) return NextResponse.json({ error: "could_not_create" }, { status: 500 });

  await audit(null, "CREATE", "Appointment", created.id, `Public booking ${created.number}`);
  return NextResponse.json({ number: created.number, start: created.start.toISOString() }, { status: 201 });
}
