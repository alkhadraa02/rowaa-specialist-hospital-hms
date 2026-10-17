import { describe, expect, it } from "vitest";
import { cashInvoice, splitBilling, sumCharges } from "@/lib/billing";
import { forecastOccupancy } from "@/lib/forecast";
import { checkInteractions, worstSeverity } from "@/lib/interactions";
import { generateSlots, isValidSlot, matchesAvailability, parseDays } from "@/lib/slots";
import { riyadhDate, riyadhParts, dayKey, parseDayKey } from "@/lib/time";
import { flagResult } from "@/lib/catalog";
import { can, ROLES } from "@/lib/rbac";
import { hashPassword, verifyPassword } from "@/lib/password";
import { MockAiProvider, getAiProvider, HttpAiProvider } from "@/lib/ai";
import { bookingSchema, patientSchema, phoneSchema } from "@/lib/validation";

describe("billing", () => {
  it("adds 15% VAT to cash invoices", () => {
    expect(cashInvoice(200)).toEqual({ subtotal: 200, vat: 30, total: 230 });
  });
  it("sums charges", () => {
    expect(sumCharges([{ qty: 2, unitPrice: 50 }, { qty: 1, unitPrice: 25.5 }])).toBe(125.5);
  });
  it("splits insured billing into 80% claim and 20% co-pay with VAT", () => {
    const s = splitBilling(1000, true);
    expect(s.claimAmount).toBe(800);
    expect(s.invoice).toEqual({ subtotal: 200, vat: 30, total: 230 });
    expect(s.type).toBe("COPAY");
  });
  it("uninsured pays everything in cash", () => {
    const s = splitBilling(1000, false);
    expect(s.claimAmount).toBe(0);
    expect(s.invoice.total).toBe(1150);
  });
});

describe("occupancy forecast", () => {
  it("returns seven explainable days and never exceeds capacity", () => {
    const f = forecastOccupancy({ capacity: 100, occupied: 95, avgDailyAdmissions: 12, scheduledDischarges: [1, 1, 1, 1, 1, 1, 1] });
    expect(f).toHaveLength(7);
    for (const d of f) {
      expect(d.occupied).toBeLessThanOrEqual(100);
      expect(d.explanationAr).toContain("خروج");
      expect(d.explanationEn).toContain("discharges");
    }
  });
  it("falls when discharges exceed admissions", () => {
    const f = forecastOccupancy({ capacity: 100, occupied: 60, avgDailyAdmissions: 1, scheduledDischarges: [10, 10, 10, 0, 0, 0, 0] });
    expect(f[2].occupied).toBeLessThan(60);
  });
});

describe("drug interactions", () => {
  const table = [{ genericA: "warfarin", genericB: "ibuprofen", severity: "MAJOR", noteAr: "x", noteEn: "y" }];
  it("finds a seeded pair in either order", () => {
    expect(checkInteractions("ibuprofen", ["Warfarin"], table)).toHaveLength(1);
    expect(checkInteractions("warfarin", ["ibuprofen"], table)).toHaveLength(1);
  });
  it("finds nothing for unrelated drugs", () => {
    expect(checkInteractions("paracetamol", ["warfarin"], table)).toHaveLength(0);
  });
  it("ranks severity", () => {
    expect(worstSeverity([{ ...table[0], severity: "MODERATE" }, table[0]])).toBe("MAJOR");
  });
});

describe("slots and time", () => {
  const av = { days: "0,1,2,3,4", startHour: 9, endHour: 12 };
  it("parses weekdays", () => {
    expect(parseDays("0, 2,9,x")).toEqual([0, 2]);
  });
  it("uses Riyadh time (UTC+3)", () => {
    const d = riyadhDate(2026, 9, 18, 9, 0);
    expect(d.toISOString()).toBe("2026-10-18T06:00:00.000Z");
    expect(riyadhParts(d).h).toBe(9);
    expect(dayKey(d)).toBe("2026-10-18");
    expect(parseDayKey("2026-10-18")?.toISOString()).toBe("2026-10-17T21:00:00.000Z");
    expect(parseDayKey("bad")).toBeNull();
  });
  it("generates 30 minute slots only on working days and skips the past and booked", () => {
    const now = riyadhDate(2026, 9, 18, 8, 0); // Sunday
    const slots = generateSlots(av, { now, daysAhead: 1 });
    expect(slots).toHaveLength(6);
    const booked = new Set([slots[0].getTime()]);
    expect(generateSlots(av, { now, daysAhead: 1, booked })).toHaveLength(5);
    const late = riyadhDate(2026, 9, 18, 10, 50);
    expect(generateSlots(av, { now: late, daysAhead: 1 })).toHaveLength(1);
    const friday = riyadhDate(2026, 9, 23, 6, 0);
    expect(generateSlots(av, { now: friday, daysAhead: 1 })).toHaveLength(0);
  });
  it("validates a slot server-side", () => {
    const now = riyadhDate(2026, 9, 18, 8, 0);
    const s = generateSlots(av, { now, daysAhead: 2 })[2];
    expect(isValidSlot(av, s, new Set(), now)).toBe(true);
    expect(isValidSlot(av, s, new Set([s.getTime()]), now)).toBe(false);
    expect(isValidSlot(av, new Date(s.getTime() + 60000), new Set(), now)).toBe(false);
  });
  it("filters by availability", () => {
    const now = riyadhDate(2026, 9, 18, 8, 0);
    const slots = generateSlots(av, { now, daysAhead: 14 });
    expect(matchesAvailability(slots, "today", now)).toBe(true);
    expect(matchesAvailability([], "week", now)).toBe(false);
  });
});

describe("lab flags", () => {
  const hgb = { refLow: 12, refHigh: 17.5, critLow: 7, critHigh: 20 };
  it("flags normal, abnormal and critical values", () => {
    expect(flagResult(14, hgb)).toBe("N");
    expect(flagResult(10, hgb)).toBe("L");
    expect(flagResult(18.5, hgb)).toBe("H");
    expect(flagResult(6, hgb)).toBe("LL");
    expect(flagResult(21, hgb)).toBe("HH");
  });
});

describe("rbac", () => {
  it("restricts permissions by role", () => {
    expect(can("admin", "audit.read")).toBe(true);
    expect(can("doctor", "audit.read")).toBe(false);
    expect(can("lab", "lab.result")).toBe(true);
    expect(can("lab", "pharmacy.dispense")).toBe(false);
    expect(can("pharmacy", "pharmacy.dispense")).toBe(true);
    expect(can("billing", "billing.manage")).toBe(true);
    expect(can("reception", "emr.write")).toBe(false);
    expect(can(undefined, "dashboard.read")).toBe(false);
    expect(can("hacker", "dashboard.read")).toBe(false);
  });
  it("defines the eight roles", () => {
    expect(ROLES).toHaveLength(8);
  });
});

describe("passwords", () => {
  it("hashes with salt and verifies", () => {
    const h = hashPassword("correct horse");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(h).not.toContain("correct horse");
    expect(hashPassword("correct horse")).not.toBe(h);
    expect(verifyPassword("correct horse", h)).toBe(true);
    expect(verifyPassword("wrong", h)).toBe(false);
    expect(verifyPassword("x", null)).toBe(false);
    expect(verifyPassword("x", "plaintext")).toBe(false);
  });
});

describe("AiProvider", () => {
  it("defaults to the labelled mock provider without a key", () => {
    const p = getAiProvider({});
    expect(p).toBeInstanceOf(MockAiProvider);
    expect(p.mock).toBe(true);
  });
  it("switches to the real provider only when a key is set", () => {
    const p = getAiProvider({ AI_API_KEY: "k" });
    expect(p).toBeInstanceOf(HttpAiProvider);
    expect(p.mock).toBe(false);
  });
  it("answers ops questions from computed data", async () => {
    const k = {
      visitsToday: 120, erWaitingNow: 4, erAvgWaitMin: 22, occupancyPct: 78, occupiedBeds: 78, totalBeds: 100,
      revenueToday: 12345.5, labTurnaroundMin: 41, pendingLab: 3, pendingRadiology: 2, lowStockDrugs: 5, forecastPeakPct: 85, forecastPeakDay: 4,
    };
    const p = new MockAiProvider();
    expect((await p.answerOps("what is the bed occupancy?", k, "en")).text).toContain("78%");
    expect((await p.answerOps("كم انتظار الطوارئ؟", k, "ar")).text).toContain("22");
    const a = await p.answerOps("revenue?", k, "en");
    expect(a.text).toContain("12345.5");
    expect(a.mock).toBe(true);
  });
});

describe("validation", () => {
  it("normalizes Saudi mobile numbers", () => {
    expect(phoneSchema.parse("050 123 4567")).toBe("0501234567");
    expect(phoneSchema.safeParse("12345").success).toBe(false);
  });
  it("rejects bad bookings", () => {
    expect(bookingSchema.safeParse({ doctorId: "a", branchId: "b", start: "nope", name: "x", phone: "1" }).success).toBe(false);
    expect(
      bookingSchema.safeParse({ doctorId: "a", branchId: "b", start: "2026-10-18T06:00:00.000Z", name: "سارة العتيبي", phone: "0501234567" }).success,
    ).toBe(true);
  });
  it("validates patient registration", () => {
    const base = { nameAr: "خالد", nameEn: "Khalid A", nationalId: "1012345678", gender: "M", dob: "1990-01-01", phone: "0501234567" };
    expect(patientSchema.safeParse(base).success).toBe(true);
    expect(patientSchema.safeParse({ ...base, nationalId: "3012345678" }).success).toBe(false);
  });
});
