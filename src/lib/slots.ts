import { addDays, riyadhDate, riyadhParts, startOfDay } from "./time";

export type Availability = { days: string; startHour: number; endHour: number };

export const SLOT_MINUTES = 30;

/** Weekdays use JS numbering (0 = Sunday … 6 = Saturday). `days` is a comma list. */
export function parseDays(days: string): number[] {
  return days
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

/**
 * Generate bookable slots for one doctor at one branch.
 * Slots in the past (or within 30 minutes from now) and already-booked slots are skipped.
 */
export function generateSlots(
  av: Availability,
  opts: { daysAhead?: number; booked?: Set<number>; now?: Date; from?: Date } = {},
): Date[] {
  const now = opts.now ?? new Date();
  const daysAhead = opts.daysAhead ?? 14;
  const booked = opts.booked ?? new Set<number>();
  const base = startOfDay(opts.from ?? now);
  const days = new Set(parseDays(av.days));
  const out: Date[] = [];
  for (let i = 0; i < daysAhead; i++) {
    const day = addDays(base, i);
    const p = riyadhParts(day);
    if (!days.has(p.dow)) continue;
    for (let mins = av.startHour * 60; mins < av.endHour * 60; mins += SLOT_MINUTES) {
      const slot = riyadhDate(p.y, p.m, p.d, Math.floor(mins / 60), mins % 60);
      if (slot.getTime() < now.getTime() + 30 * 60000) continue;
      if (booked.has(slot.getTime())) continue;
      out.push(slot);
    }
  }
  return out;
}

export function isValidSlot(av: Availability, start: Date, booked: Set<number>, now: Date = new Date()) {
  const slots = generateSlots(av, { daysAhead: 30, booked, now });
  return slots.some((s) => s.getTime() === start.getTime());
}

export type AvailabilityFilter = "any" | "today" | "week";

export function matchesAvailability(slots: Date[], filter: AvailabilityFilter, now: Date = new Date()) {
  if (filter === "any") return true;
  if (!slots.length) return false;
  const first = slots[0].getTime();
  const today = startOfDay(now).getTime();
  if (filter === "today") return first < today + 86400_000;
  return first < today + 7 * 86400_000;
}
