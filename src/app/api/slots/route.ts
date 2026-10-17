import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { bookedSet, slotsFor } from "@/lib/availability";

const querySchema = z.object({ doctorId: z.string().min(1), branchId: z.string().min(1) });

/** Open 30-minute slots for one doctor at one branch (next 14 days). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    doctorId: url.searchParams.get("doctorId"),
    branchId: url.searchParams.get("branchId"),
  });
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 400 });
  const { doctorId, branchId } = parsed.data;
  const link = await prisma.doctorBranch.findUnique({ where: { doctorId_branchId: { doctorId, branchId } } });
  if (!link) return NextResponse.json({ error: "doctor_not_at_branch" }, { status: 404 });
  const booked = await bookedSet([doctorId]);
  const slots = slotsFor(link, booked.get(doctorId), 14).map((d) => d.toISOString());
  return NextResponse.json({ slots });
}
