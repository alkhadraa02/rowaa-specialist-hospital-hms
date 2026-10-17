import { prisma } from "./db";
import { generateSlots, type Availability } from "./slots";

/** Start times (ms) already taken for a doctor in the coming days. */
export async function bookedSet(doctorIds: string[], daysAhead = 31, now: Date = new Date()) {
  const rows = await prisma.appointment.findMany({
    where: {
      doctorId: { in: doctorIds },
      status: { not: "CANCELLED" },
      start: { gte: now, lte: new Date(now.getTime() + daysAhead * 86400_000) },
    },
    select: { doctorId: true, start: true },
  });
  const map = new Map<string, Set<number>>();
  for (const r of rows) {
    const s = map.get(r.doctorId) ?? new Set<number>();
    s.add(r.start.getTime());
    map.set(r.doctorId, s);
  }
  return map;
}

export function slotsFor(av: Availability, booked: Set<number> | undefined, daysAhead = 14, now: Date = new Date()) {
  return generateSlots(av, { daysAhead, booked: booked ?? new Set<number>(), now });
}

/** First open slot across all of a doctor's branches. */
export function nextSlot(
  branches: Availability[],
  booked: Set<number> | undefined,
  now: Date = new Date(),
): Date | null {
  let best: Date | null = null;
  for (const av of branches) {
    const s = slotsFor(av, booked, 14, now)[0];
    if (s && (!best || s < best)) best = s;
  }
  return best;
}
