import { redirect } from "next/navigation";
import { getT, money, num, pick } from "@/lib/i18n";
import { authorize } from "@/lib/session";
import { can } from "@/lib/rbac";
import { computeOps } from "@/lib/kpis";
import { OpsAssistant } from "@/components/OpsAssistant";

export const dynamic = "force-dynamic";

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card min-w-0">
      <p className="hint">{label}</p>
      <p className="mt-1 truncate text-2xl font-bold" dir="ltr" style={{ textAlign: "start" }}>{value}</p>
      {hint ? <p className="hint mt-1">{hint}</p> : null}
    </div>
  );
}

export default async function DashboardPage() {
  const auth = await authorize("dashboard.read");
  if ("error" in auth) redirect("/hms/login");
  const { lang, t } = await getT();
  const { kpis, forecast, lowStock } = await computeOps();
  const level = (p: number) => (p >= 90 ? "badge-danger" : p >= 80 ? "badge-warn" : "badge-ok");
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">{t("لوحة مؤشرات اليوم", "Today's dashboard")}</h1>
      <section aria-label={t("المؤشرات", "KPIs")} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={t("زيارات اليوم", "Visits today")} value={num(kpis.visitsToday, lang)} />
        <Kpi label={t("بانتظار الطوارئ الآن", "Waiting in ER now")} value={num(kpis.erWaitingNow, lang)} hint={t(`متوسط الانتظار حتى المعاينة ${kpis.erAvgWaitMin} د`, `Average wait to be seen ${kpis.erAvgWaitMin} min`)} />
        <Kpi label={t("إشغال الأسرّة", "Bed occupancy")} value={`${kpis.occupancyPct}%`} hint={`${kpis.occupiedBeds} / ${kpis.totalBeds}`} />
        <Kpi label={t("إيراد اليوم (فواتير)", "Revenue today (invoices)")} value={money(kpis.revenueToday, lang)} />
        <Kpi label={t("زمن إنجاز المختبر", "Lab turnaround")} value={t(`${kpis.labTurnaroundMin} د`, `${kpis.labTurnaroundMin} min`)} />
        <Kpi label={t("طلبات مختبر معلّقة", "Pending lab orders")} value={num(kpis.pendingLab, lang)} />
        <Kpi label={t("طلبات أشعة معلّقة", "Pending radiology")} value={num(kpis.pendingRadiology, lang)} />
        <Kpi label={t("أدوية تحت حدّ الطلب", "Drugs at/below reorder")} value={num(kpis.lowStockDrugs, lang)} />
      </section>

      <section aria-labelledby="fc-h" className="card">
        <h2 id="fc-h" className="text-lg font-bold">{t("توقّع الإشغال لـ7 أيام", "7-day occupancy forecast")}</h2>
        <p className="hint mt-1">{t("نموذج مبسّط قابل للتفسير: القائم + متوسط الدخول اليومي − الخروج المجدول − خروج أساسي.", "Simple explainable model: current + average daily admissions − scheduled discharges − baseline discharges.")}</p>
        <div className="table-wrap mt-3">
          <table className="w-full text-sm">
            <thead><tr><th scope="col" className="p-2 text-start">{t("اليوم", "Day")}</th><th scope="col" className="p-2 text-start">{t("الإشغال", "Occupied")}</th><th scope="col" className="p-2 text-start">%</th><th scope="col" className="p-2 text-start">{t("التفسير", "Why")}</th></tr></thead>
            <tbody>
              {forecast.map((d) => (
                <tr key={d.dayOffset} className="border-t border-line">
                  <td className="p-2">+{d.dayOffset}</td>
                  <td className="p-2">{d.occupied}</td>
                  <td className="p-2"><span className={`badge ${level(d.pct)}`}>{Math.round(d.pct)}%</span></td>
                  <td className="p-2">{pick(lang, d.explanationAr, d.explanationEn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {lowStock.length ? (
        <section aria-labelledby="ls-h" className="card">
          <h2 id="ls-h" className="text-lg font-bold">{t("تنبيهات إعادة الطلب", "Reorder alerts")}</h2>
          <ul className="mt-2 grid gap-1 text-sm">
            {lowStock.slice(0, 8).map((d) => (
              <li key={d.name} className="flex min-w-0 justify-between gap-2"><span className="min-w-0 truncate">{d.name}</span><span className="badge badge-warn">{d.stock} / {d.reorderLevel}</span></li>
            ))}
          </ul>
        </section>
      ) : null}

      {can(auth.user.role, "ai.use") ? <OpsAssistant lang={lang} /> : null}
    </div>
  );
}
