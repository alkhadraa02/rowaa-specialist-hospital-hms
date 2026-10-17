import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getT, money } from "@/lib/i18n";
import { authorize } from "@/lib/session";
import { fmtDate } from "@/lib/time";
import { sumCharges } from "@/lib/billing";
import { invoiceNow, markInvoicePaid, setClaimStatus } from "@/app/actions/clinical";

export const dynamic = "force-dynamic";
export const metadata = { title: "الفوترة والمطالبات" };

type Props = { searchParams: Promise<{ ok?: string; error?: string }> };

const CLAIM_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PAID"] as const;

export default async function BillingPage({ searchParams }: Props) {
  const auth = await authorize("billing.manage");
  if ("error" in auth) redirect("/hms/login");
  const sp = await searchParams;
  const { lang, t } = await getT();
  const [uninvoiced, invoices, claims] = await Promise.all([
    prisma.encounter.findMany({ where: { charges: { some: { invoiced: false } } }, include: { patient: true, charges: { where: { invoiced: false } } }, take: 30, orderBy: { startedAt: "desc" } }),
    prisma.invoice.findMany({ include: { patient: true }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.claim.findMany({ include: { patient: true }, orderBy: { createdAt: "desc" }, take: 40 }),
  ]);
  const openTotal = invoices.filter((i) => i.status !== "PAID").reduce((s, i) => s + i.total, 0);
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">{t("الفوترة والمطالبات", "Billing & claims")}</h1>
      {sp.ok ? <p role="status" className="alert alert-ok">{t("تم التنفيذ.", "Done.")}</p> : null}
      {sp.error ? <p role="alert" className="alert alert-danger">{sp.error === "nothing" ? t("لا رسوم غير مفوترة لهذه الزيارة.", "No uninvoiced charges for this encounter.") : t("تحقق من المدخلات.", "Check the inputs.")}</p> : null}
      <p className="hint">{t("إجمالي الفواتير غير المسدّدة", "Outstanding invoices")}: <strong>{money(openTotal, lang)}</strong> · {t("ضريبة القيمة المضافة 15% على حصة المريض/النقد", "15% VAT applies to patient/cash share")}</p>

      <section aria-labelledby="u-h" className="card">
        <h2 id="u-h" className="text-lg font-bold">{t("زيارات بها رسوم غير مفوترة", "Encounters with uninvoiced charges")} ({uninvoiced.length})</h2>
        {uninvoiced.length === 0 ? <p className="hint mt-2">{t("لا شيء بانتظار الفوترة.", "Nothing awaiting invoicing.")}</p> : (
          <ul className="mt-3 grid gap-2">
            {uninvoiced.map((e) => (
              <li key={e.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-2 text-sm">
                <span className="min-w-0 flex-1 basis-56"><Link className="underline" href={`/hms/encounters/${e.id}`}>{lang === "ar" ? e.patient.nameAr : e.patient.nameEn}</Link> · {e.charges.length} {t("بنود", "items")} · {money(sumCharges(e.charges), lang)} {e.patient.insurer ? <span className="badge badge-info">{e.patient.insurer}</span> : <span className="badge badge-warn">{t("نقدي", "Cash")}</span>}</span>
                <form action={invoiceNow}><input type="hidden" name="encounterId" value={e.id} /><button type="submit" className="btn btn-primary btn-sm">{t("إصدار فاتورة", "Issue invoice")}</button></form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="i-h">
        <h2 id="i-h" className="mb-2 text-lg font-bold">{t("الفواتير", "Invoices")}</h2>
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead><tr><th className="p-2 text-start">{t("الرقم", "Number")}</th><th className="p-2 text-start">{t("المريض", "Patient")}</th><th className="p-2 text-start">{t("المجموع", "Subtotal")}</th><th className="p-2 text-start">{t("الضريبة", "VAT")}</th><th className="p-2 text-start">{t("الإجمالي", "Total")}</th><th className="p-2 text-start">{t("الحالة", "Status")}</th></tr></thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id} className="border-t border-line">
                  <td className="p-2" dir="ltr">{i.number}<span className="hint block">{fmtDate(i.createdAt, lang)}</span></td>
                  <td className="p-2">{lang === "ar" ? i.patient.nameAr : i.patient.nameEn}</td>
                  <td className="p-2">{money(i.subtotal, lang)}</td>
                  <td className="p-2">{money(i.vat, lang)}</td>
                  <td className="p-2 font-semibold">{money(i.total, lang)}</td>
                  <td className="p-2">{i.status === "PAID" ? <span className="badge badge-ok">{t("مدفوعة", "Paid")}</span> : (
                    <form action={markInvoicePaid} className="flex items-center gap-1"><span className="badge badge-warn">{t("مستحقة", "Issued")}</span><input type="hidden" name="invoiceId" value={i.id} /><button type="submit" className="btn btn-outline btn-sm">{t("تسجيل دفع", "Mark paid")}</button></form>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="c-h">
        <h2 id="c-h" className="mb-2 text-lg font-bold">{t("مطالبات التأمين", "Insurance claims")}</h2>
        {claims.length === 0 ? <p className="card hint">{t("لا مطالبات.", "No claims.")}</p> : (
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead><tr><th className="p-2 text-start">{t("الرقم", "Number")}</th><th className="p-2 text-start">{t("المريض", "Patient")}</th><th className="p-2 text-start">{t("شركة التأمين", "Insurer")}</th><th className="p-2 text-start">{t("المبلغ", "Amount")}</th><th className="p-2 text-start">{t("الحالة", "Status")}</th></tr></thead>
              <tbody>
                {claims.map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="p-2" dir="ltr">{c.number}</td>
                    <td className="p-2">{lang === "ar" ? c.patient.nameAr : c.patient.nameEn}</td>
                    <td className="p-2">{c.insurer}</td>
                    <td className="p-2">{money(c.amount, lang)}</td>
                    <td className="p-2">
                      <form action={setClaimStatus} className="flex items-center gap-1">
                        <input type="hidden" name="claimId" value={c.id} />
                        <label htmlFor={`cs-${c.id}`} className="sr-only">{t("حالة المطالبة", "Claim status")}</label>
                        <select id={`cs-${c.id}`} name="status" defaultValue={c.status} className="select">{CLAIM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                        <button type="submit" className="btn btn-outline btn-sm">{t("تحديث", "Update")}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
