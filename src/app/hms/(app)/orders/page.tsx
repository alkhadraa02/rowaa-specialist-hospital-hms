import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { authorize } from "@/lib/session";
import { can } from "@/lib/rbac";
import { fmtDateTime } from "@/lib/time";
import { FLAG_TEXT, type ResultFlag } from "@/lib/catalog";
import { enterLabResult, enterRadResult } from "@/app/actions/clinical";

export const dynamic = "force-dynamic";
export const metadata = { title: "المختبر والأشعة" };

type Props = { searchParams: Promise<{ kind?: string; status?: string; ok?: string; error?: string }> };

export default async function OrdersPage({ searchParams }: Props) {
  const auth = await authorize("emr.read");
  if ("error" in auth) redirect("/hms/login");
  const sp = await searchParams;
  const { lang, t } = await getT();
  const kind = sp.kind === "LAB" || sp.kind === "RAD" ? sp.kind : undefined;
  const status = sp.status === "ORDERED" || sp.status === "RESULTED" ? sp.status : "ORDERED";
  const orders = await prisma.order.findMany({
    where: { status, ...(kind ? { kind } : {}) },
    include: { patient: true },
    orderBy: [{ priority: "asc" }, { orderedAt: "asc" }],
    take: 80,
  });
  const canLab = can(auth.user.role, "lab.result");
  const canRad = can(auth.user.role, "rad.result");
  const tab = (k: string | undefined, s: string, label: string) => {
    const q = new URLSearchParams();
    if (k) q.set("kind", k);
    q.set("status", s);
    const active = k === kind && s === status;
    return <Link key={label} href={`/hms/orders?${q.toString()}`} aria-current={active ? "page" : undefined} className={`btn btn-sm ${active ? "btn-primary" : "btn-ghost"}`}>{label}</Link>;
  };
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">{t("المختبر والأشعة", "Laboratory & radiology")}</h1>
      <nav aria-label={t("تصفية الطلبات", "Filter orders")} className="flex flex-wrap gap-2">
        {tab(undefined, "ORDERED", t("كل المعلّق", "All pending"))}
        {tab("LAB", "ORDERED", t("مختبر معلّق", "Lab pending"))}
        {tab("RAD", "ORDERED", t("أشعة معلّقة", "Radiology pending"))}
        {tab(undefined, "RESULTED", t("النتائج الصادرة", "Resulted"))}
      </nav>
      {sp.ok ? <p role="status" className="alert alert-ok">{t("تم حفظ النتيجة.", "Result saved.")}</p> : null}
      {sp.error ? <p role="alert" className="alert alert-danger">{t("تحقق من المدخلات.", "Check the inputs.")}</p> : null}
      {orders.length === 0 ? <p className="card hint">{t("لا طلبات في هذه القائمة.", "No orders in this list.")}</p> : (
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead><tr><th className="p-2 text-start">{t("المريض", "Patient")}</th><th className="p-2 text-start">{t("الفحص", "Test")}</th><th className="p-2 text-start">{t("الأولوية", "Priority")}</th><th className="p-2 text-start">{t("وقت الطلب", "Ordered")}</th><th className="p-2 text-start">{t("النتيجة", "Result")}</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-line align-top">
                  <td className="p-2"><Link className="underline" href={`/hms/encounters/${o.encounterId}`}>{lang === "ar" ? o.patient.nameAr : o.patient.nameEn}</Link><span className="hint block" dir="ltr">{o.patient.mrn}</span></td>
                  <td className="p-2">{o.name}<span className="hint block" dir="ltr">{o.kind} · {o.code}</span></td>
                  <td className="p-2"><span className={`badge ${o.priority === "ROUTINE" ? "badge-info" : "badge-danger"}`}>{o.priority}</span></td>
                  <td className="p-2">{fmtDateTime(o.orderedAt, lang)}</td>
                  <td className="p-2">
                    {o.status === "RESULTED" ? (
                      <span>
                        {o.kind === "LAB" ? <span dir="ltr">{o.value} {o.unit} <span className="hint">({o.refLow}–{o.refHigh})</span></span> : o.resultText}{" "}
                        {o.flag ? <span className={`badge ${o.flag === "N" ? "badge-ok" : o.flag.length === 2 ? "badge-danger" : "badge-warn"}`}>{FLAG_TEXT[o.flag as ResultFlag]?.[lang] ?? o.flag}</span> : null}
                      </span>
                    ) : o.kind === "LAB" && canLab ? (
                      <form action={enterLabResult} className="flex items-end gap-2">
                        <input type="hidden" name="orderId" value={o.id} />
                        <div className="field"><label htmlFor={`val-${o.id}`} className="sr-only">{t("القيمة", "Value")}</label>
                          <input id={`val-${o.id}`} name="value" type="number" step="any" required className="input w-28" dir="ltr" placeholder={o.unit ?? ""} /></div>
                        <button type="submit" className="btn btn-primary btn-sm">{t("إدخال", "Enter")}</button>
                      </form>
                    ) : o.kind === "RAD" && canRad ? (
                      <form action={enterRadResult} className="grid gap-1">
                        <input type="hidden" name="orderId" value={o.id} />
                        <label htmlFor={`rep-${o.id}`} className="sr-only">{t("التقرير", "Report")}</label>
                        <textarea id={`rep-${o.id}`} name="resultText" required minLength={3} maxLength={1500} className="textarea" />
                        <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="abnormal" value="1" />{t("نتيجة غير طبيعية", "Abnormal finding")}</label>
                        <div><button type="submit" className="btn btn-primary btn-sm">{t("إصدار التقرير", "Issue report")}</button></div>
                      </form>
                    ) : <span className="badge badge-warn">{t("بانتظار النتيجة", "Pending")}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
