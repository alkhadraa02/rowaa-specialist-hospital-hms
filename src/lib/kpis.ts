import { prisma } from "./db";
import { addDays, dayKey, minutesBetween, startOfDay } from "./time";
import { forecastOccupancy, type ForecastDay } from "./forecast";
import type { OpsKpis } from "./ai";

export type OpsSnapshot = { kpis: OpsKpis; forecast: ForecastDay[]; lowStock: { name: string; stock: number; reorderLevel: number }[] };

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** All dashboard numbers are computed from the database; nothing is invented. */
export async function computeOps(now: Date = new Date()): Promise<OpsSnapshot> {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const weekAgo = addDays(today, -7);

  const [visitsToday, erWaitingNow, erSeen, totalBeds, activeAdm, recentAdm, invoices, labDone, pendingLab, pendingRadiology, drugs] = await Promise.all([
    prisma.encounter.count({ where: { startedAt: { gte: today, lt: tomorrow } } }),
    prisma.encounter.count({ where: { type: "ER", status: "OPEN", seenAt: null } }),
    prisma.encounter.findMany({ where: { type: "ER", seenAt: { not: null }, startedAt: { gte: today, lt: tomorrow } }, select: { startedAt: true, seenAt: true } }),
    prisma.bed.count({ where: { status: { not: "MAINTENANCE" } } }),
    prisma.admission.findMany({ where: { status: "ACTIVE" }, select: { expectedDischarge: true } }),
    prisma.admission.count({ where: { admittedAt: { gte: weekAgo } } }),
    prisma.invoice.findMany({ where: { createdAt: { gte: today, lt: tomorrow } }, select: { total: true } }),
    prisma.order.findMany({ where: { kind: "LAB", status: "RESULTED", resultedAt: { gte: addDays(today, -1) } }, select: { orderedAt: true, resultedAt: true } }),
    prisma.order.count({ where: { kind: "LAB", status: "ORDERED" } }),
    prisma.order.count({ where: { kind: "RAD", status: "ORDERED" } }),
    prisma.drug.findMany({ select: { name: true, stock: true, reorderLevel: true } }),
  ]);

  const occupiedBeds = activeAdm.length;
  const scheduled = Array.from({ length: 7 }, () => 0);
  const keys = Array.from({ length: 7 }, (_, i) => dayKey(addDays(today, i + 1)));
  let unscheduled = 0;
  for (const a of activeAdm) {
    if (!a.expectedDischarge) { unscheduled++; continue; }
    const i = keys.indexOf(dayKey(a.expectedDischarge));
    if (i >= 0) scheduled[i]++;
  }
  const forecast = forecastOccupancy({
    capacity: totalBeds,
    occupied: occupiedBeds,
    avgDailyAdmissions: recentAdm / 7,
    scheduledDischarges: scheduled,
    unscheduledShare: occupiedBeds ? unscheduled / occupiedBeds : 0.4,
  });
  const peak = forecast.reduce((m, d) => (d.pct > m.pct ? d : m), forecast[0] ?? { pct: 0, dayOffset: 1 } as ForecastDay);
  const lowStock = drugs.filter((d) => d.stock <= d.reorderLevel).sort((a, b) => a.stock - b.stock);

  const kpis: OpsKpis = {
    visitsToday,
    erWaitingNow,
    erAvgWaitMin: Math.round(avg(erSeen.map((e) => minutesBetween(e.startedAt, e.seenAt as Date)))),
    occupancyPct: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    occupiedBeds,
    totalBeds,
    revenueToday: Math.round(invoices.reduce((s, i) => s + i.total, 0)),
    labTurnaroundMin: Math.round(avg(labDone.map((o) => minutesBetween(o.orderedAt, o.resultedAt as Date)))),
    pendingLab,
    pendingRadiology,
    lowStockDrugs: lowStock.length,
    forecastPeakPct: Math.round(peak?.pct ?? 0),
    forecastPeakDay: peak?.dayOffset ?? 1,
  };
  return { kpis, forecast, lowStock };
}
