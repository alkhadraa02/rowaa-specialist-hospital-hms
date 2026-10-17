import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getT, pick, num } from "@/lib/i18n";
import { authorize } from "@/lib/session";
import { can } from "@/lib/rbac";
import { fmtDateTime } from "@/lib/time";
import { dispense, restock } from "@/app/actions/clinical";

export const dynamic = "force-dynamic";
export const metadata = { title: "الصيدلية والمخزون" };

type Props = { searchParams: Promise<{ ok?: string; error?: string }> };

export default async function PharmacyPage({ searchParams }: Props) {
  const auth = await authorize("pharmacy.prescribe");
  const auth2 = "error" in auth ? await authorize("pharmacy.dispense") : auth;
  if ("error" in auth2) redirect("/hms/login");
  const sp = await searchParams;
  const { lang, t } = await getT();
  const canDispense = can(auth2.user.role, "pharmacy.dispense");
  const canStock = can(auth2.user.role, "pharmacy.stock");
  const [pending, drugs] = await Promise.all([
    prisma.prescription.findMany({ where: { status: "PENDING" }, include: { drug: true, patient: true }, orderBy: { prescribedAt: "asc" }, take: 60 }),
    prisma.drug.findMany({ orderBy: { name: "asc" } }),
  ]);
  const low = drugs.filter((d) => d.stock <= d.reorderLevel);
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">{t("الصيدلية والمخزون", "Pharmacy & stock")}</h1>
      {sp.ok ? <p role="status" className="alert alert-ok">{t("تم التنفيذ.", "Done.")}</p> : null}
      {sp.error === "stock" ? <p role="alert" className="alert alert-danger">{t("المخزون لا يكفي لصرف هذه الوصفة.", "Not enough stock to dispense this prescription.")}</p> : null}
      {sp.error === "validation" ? <p role="alert" className="alert alert-danger">{t("تحقق من المدخلات.", "Check the inputs.")}</p> : null}

      {low.length ? (
        <section aria-labelledby="low-h" className="alert alert-warn">
          <h2 id="low-h" className="font-bold">{t("تنبيه إعادة الطلب", "Reorder alert")} ({low.length})</h2>
          <ul className="mt-1 list-disc ps-5 text-sm">{low.map((d) => <li key={d.id}>{pick(lang, d.nameAr, d.name)} {d.strength} — {t("المتاح", "in stock")} {num(d.stock, lang)} / {t("حد الطلب", "reorder at")} {num(d.reorderLevel, lang)}</li>)}</ul>
        </section>
      ) : null}

      <section aria-labelledby="p-h" className="card">
        <h2 id="p-h" className="text-lg font-bold">{t("وصفات بانتظار الصرف", "Prescriptions awaiting dispensing")} ({pending.length})</h2>
        {pending.length === 0 ? <p className="hint mt-2">{t("لا وصفات معلّقة.", "No pending prescriptions.")}</p> : (
          <ul className="mt-3 grid gap-2">
            {pending.map((r) => (
              <li key={r.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-2">
                <span className="min-w-0 flex-1 basis-60 text-sm">
                  <strong>{pick(lang, r.drug.nameAr, r.drug.name)}</strong> {r.dose} · {r.frequency} · ×{r.qty}
                  <span className="hint block">{lang === "ar" ? r.patient.nameAr : r.patient.nameEn} · {fmtDateTime(r.prescribedAt, lang)} · <Link className="underline" href={`/hms/encounters/${r.encounterId}`}>{t("الزيارة", "Encounter")}</Link></span>
                  {r.interactionNote ? <span className="alert alert-warn mt-1 block text-xs">{r.interactionNote}</span> : null}
                </span>
                {canDispense ? <form action={dispense}><input type="hidden" name="prescriptionId" value={r.id} /><button type="submit" className="btn btn-primary btn-sm" disabled={r.drug.stock < r.qty}>{r.drug.stock < r.qty ? t("مخزون غير كافٍ", "Low stock") : t("صرف", "Dispense")}</button></form> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="s-h">
        <h2 id="s-h" className="mb-2 text-lg font-bold">{t("المخزون", "Stock")}</h2>
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead><tr><th className="p-2 text-start">{t("الدواء", "Drug")}</th><th className="p-2 text-start">{t("الشكل", "Form")}</th><th className="p-2 text-start">{t("المتاح", "Stock")}</th><th className="p-2 text-start">{t("حد الطلب", "Reorder")}</th>{canStock ? <th className="p-2 text-start">{t("توريد", "Restock")}</th> : null}</tr></thead>
            <tbody>
              {drugs.map((d) => (
                <tr key={d.id} className="border-t border-line">
                  <td className="p-2">{pick(lang, d.nameAr, d.name)} {d.strength}<span className="hint block" dir="ltr">{d.generic}</span></td>
                  <td className="p-2">{d.form}</td>
                  <td className="p-2"><span className={`badge ${d.stock <= d.reorderLevel ? "badge-danger" : "badge-ok"}`}>{num(d.stock, lang)}</span></td>
                  <td className="p-2">{num(d.reorderLevel, lang)}</td>
                  {canStock ? (
                    <td className="p-2">
                      <form action={restock} className="flex items-end gap-1">
                        <input type="hidden" name="drugId" value={d.id} />
                        <label htmlFor={`rs-${d.id}`} className="sr-only">{t("الكمية", "Quantity")}</label>
                        <input id={`rs-${d.id}`} name="qty" type="number" min={1} max={10000} defaultValue={50} className="input w-24" dir="ltr" />
                        <button type="submit" className="btn btn-outline btn-sm">{t("إضافة", "Add")}</button>
                      </form>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
