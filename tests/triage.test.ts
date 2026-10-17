import { describe, expect, it } from "vitest";
import { suggestTriage } from "@/lib/triage";

describe("ESI-style triage rules", () => {
  it("level 1 for GCS <= 8", () => {
    const r = suggestTriage({ ageYears: 40, complaint: "فاقد الوعي", vitals: { gcs: 6 } });
    expect(r.level).toBe(1);
    expect(r.reasons.some((x) => x.rule === "L1-GCS")).toBe(true);
  });

  it("level 1 for critical SpO2", () => {
    expect(suggestTriage({ ageYears: 60, complaint: "cough", vitals: { spo2: 80 } }).level).toBe(1);
  });

  it("level 2 for chest pain in Arabic and English", () => {
    expect(suggestTriage({ ageYears: 55, complaint: "ألم في الصدر", vitals: { hr: 90, sbp: 130 } }).level).toBe(2);
    expect(suggestTriage({ ageYears: 55, complaint: "Chest pain radiating to arm", vitals: {} }).level).toBe(2);
  });

  it("level 2 for hypotension and for high fever", () => {
    expect(suggestTriage({ ageYears: 30, complaint: "dizzy", vitals: { sbp: 80 } }).level).toBe(2);
    expect(suggestTriage({ ageYears: 30, complaint: "fever", vitals: { temp: 40 } }).level).toBe(2);
  });

  it("level 5 for a refill request with normal vitals", () => {
    const r = suggestTriage({ ageYears: 35, complaint: "تجديد وصفة", vitals: { hr: 76, sbp: 120, rr: 16, spo2: 98, temp: 36.8 } });
    expect(r.level).toBe(5);
  });

  it("level 4 for an ankle sprain", () => {
    expect(suggestTriage({ ageYears: 25, complaint: "التواء في الكاحل", vitals: { hr: 80, spo2: 99 } }).level).toBe(4);
  });

  it("level 3 for an undifferentiated complaint needing several resources", () => {
    expect(suggestTriage({ ageYears: 45, complaint: "abdominal pain since morning", vitals: { hr: 88 } }).level).toBe(3);
  });

  it("danger-zone vitals upgrade a low acuity patient", () => {
    const r = suggestTriage({ ageYears: 30, complaint: "sore throat", vitals: { hr: 118 } });
    expect(r.level).toBe(3);
    expect(r.reasons.some((x) => x.rule === "DZ-UP3")).toBe(true);
  });

  it("uses child thresholds", () => {
    expect(suggestTriage({ ageYears: 3, complaint: "cough", vitals: { hr: 130 } }).level).toBeGreaterThanOrEqual(3);
  });

  it("always explains itself bilingually", () => {
    const r = suggestTriage({ ageYears: 50, complaint: "headache", vitals: {} });
    expect(r.reasons.length).toBeGreaterThan(0);
    for (const x of r.reasons) {
      expect(x.ar.length).toBeGreaterThan(3);
      expect(x.en.length).toBeGreaterThan(3);
    }
  });
});
