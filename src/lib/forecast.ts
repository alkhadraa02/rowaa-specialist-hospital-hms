// Simple, explainable 7-day bed occupancy forecast.
//   occupied[d] = occupied[d-1] + expectedAdmissions - scheduledDischarges[d] - baselineDischarges
//   expectedAdmissions  = average daily admissions over the last 7 days
//   scheduledDischarges = patients whose expected discharge date falls on day d
//   baselineDischarges  = 8% of patients without a scheduled date (unplanned discharges)

export type ForecastInput = {
  capacity: number;
  occupied: number;
  avgDailyAdmissions: number;
  scheduledDischarges: number[]; // length 7, index 0 = tomorrow
  unscheduledShare?: number; // share of occupied beds without a planned date (0..1)
  baselineRate?: number;
};

export type ForecastDay = {
  dayOffset: number;
  occupied: number;
  pct: number;
  admissions: number;
  discharges: number;
  explanationAr: string;
  explanationEn: string;
};

export function forecastOccupancy(input: ForecastInput): ForecastDay[] {
  const cap = Math.max(1, input.capacity);
  const unscheduledShare = input.unscheduledShare ?? 0.4;
  const rate = input.baselineRate ?? 0.08;
  const out: ForecastDay[] = [];
  let occ = input.occupied;
  for (let i = 0; i < 7; i++) {
    const scheduled = input.scheduledDischarges[i] ?? 0;
    const baseline = occ * unscheduledShare * rate;
    const discharges = scheduled + baseline;
    const admissions = input.avgDailyAdmissions;
    occ = Math.min(cap, Math.max(0, occ + admissions - discharges));
    const rounded = Math.round(occ * 10) / 10;
    const a = Math.round(admissions * 10) / 10;
    const d = Math.round(discharges * 10) / 10;
    out.push({
      dayOffset: i + 1,
      occupied: rounded,
      pct: Math.round((occ / cap) * 100),
      admissions: a,
      discharges: d,
      explanationAr: `+${a} دخول متوقع (متوسط آخر 7 أيام) − ${d} خروج (${scheduled} مجدول + ${Math.round(baseline * 10) / 10} غير مجدول)`,
      explanationEn: `+${a} expected admissions (7-day average) − ${d} discharges (${scheduled} scheduled + ${Math.round(baseline * 10) / 10} unplanned)`,
    });
  }
  return out;
}
