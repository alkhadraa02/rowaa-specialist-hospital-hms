import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getT, pick } from "@/lib/i18n";
import { authorize } from "@/lib/session";
import { can } from "@/lib/rbac";
import { fmtDate } from "@/lib/time";
import { admitPatient, dischargePatient, releaseBed, transferPatient } from "@/app/actions/beds";

export const dynamic = "force-dynamic";
export const metadata = { title: "إدارة الأسرّة" };

type Props = { searchParams: Promise<{ error?: string; ok?: string }> };

export default async function BedsPage({ searchParams }: Props) {
  const auth = await authorize("beds.read");
  if ("error" in auth) redirect("/hms/login");
  const sp = await searchParams;
  const { lang, t } = await getT();
  const manage = can(auth.user.role, "beds.manage");
  const wards = await prisma.ward.findMany({
    include: { branch: true, rooms: { include: { beds: { include: { admissions: { where: { status: "ACTIVE" }, include: { patient: true } } } }, orderBy: { label: "asc" } }, orderBy: { name: "asc" } } },
    orderBy: [{ branchId: "asc" }, { name: "asc" }],
  });
  const allBeds = wards.flatMap((w) => w.rooms.flatMap((r) => r.beds.map((b) => ({ ...b, ward: pick(lang, w.name, w.nameEn), room: r.name }))));
  const free = allBeds.filter((b) => b.status === "AVAILABLE");
  const total = allBeds.filter((b) => b.status !== "MAINTENANCE").length;
  const occupied = allBeds.filter((b) => b.status === "OCCUPIED").length;
  const statusClass: Record<string, string> = { AVAILABLE: "badge-ok", OCCUPIED: "badge-danger", CLEANING: "badge-warn", MAINTENANCE: "badge-info" };
  const statusLabel: Record<string, string> = {
    AVAILABLE: t("متاح", "Available"),
    OCCUPIED: t("مشغول", "Occupied"),
    CLEANING: t("تنظيف", "Cleaning"),
    MAINTENANCE: t("صيانة", "Maintenance"),
  };
  const msgs: Record<string, string> = {
    validation: t("تحقق من البيانات المدخلة.", "Please check the entered data."),
    patient: t("لا يوجد مريض بهذا الرقم الطبي.", "No patient with that MRN."),
    bed: t("السرير غير متاح لهذا الإجراء.", "The bed is not available for this action."),
    already: t("المريض مقيم حالياً في سرير آخر.", "The patient is already admitted."),
  };
  const bedOptions = free.map((b) => <option key={b.id} value={b.id}>{b.ward} · {b.room} · {b.label}</option>);

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">{t("إدارة الأسرّة", "Bed management")}</h1>
      <p className="badge badge-info w-fit">{t(`الإشغال ${occupied} / ${total} (${total ? Math.round((occupied / total) * 100) : 0}%) — متاح ${free.length}`, `Occupancy ${occupied} / ${total} (${total ? Math.round((occupied / total) * 100) : 0}%) — ${free.length} available`)}</p>
      {sp.ok ? <p role="status" className="alert alert-ok">{t("تم تنفيذ الإجراء.", "Action completed.")}</p> : null}
      {sp.error ? <p role="alert" className="alert alert-danger">{msgs[sp.error] ?? msgs.validation}</p> : null}

      {wards.map((w) => (
        <section key={w.id} aria-labelledby={`w-${w.id}`} className="card">
          <h2 id={`w-${w.id}`} className="text-lg font-bold">{pick(lang, w.name, w.nameEn)} <span className="hint">· {pick(lang, w.branch.nameAr, w.branch.nameEn)}</span></h2>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {w.rooms.flatMap((r) =>
              r.beds.map((b) => {
                const adm = b.admissions[0];
                return (
                  <li key={b.id} className="min-w-0 rounded-lg border border-line p-3">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-semibold">{r.name} · {b.label}</span>
                      <span className={`badge ${statusClass[b.status] ?? "badge-info"}`}>{statusLabel[b.status] ?? b.status}</span>
                    </div>
                    {adm ? (
                      <div className="mt-2 grid gap-2 text-sm">
                        <p className="truncate">{lang === "ar" ? adm.patient.nameAr : adm.patient.nameEn} <span className="hint" dir="ltr">{adm.patient.mrn}</span></p>
                        {adm.expectedDischarge ? <p className="hint">{t("الخروج المتوقع:", "Expected discharge:")} {fmtDate(adm.expectedDischarge, lang)}</p> : null}
                        {manage ? (
                          <div className="flex flex-wrap items-end gap-2">
                            <form action={transferPatient} className="flex items-end gap-1">
                              <input type="hidden" name="admissionId" value={adm.id} />
                              <div className="field min-w-0">
                                <label htmlFor={`t-${adm.id}`} className="sr-only">{t("نقل إلى", "Transfer to")}</label>
                                <select id={`t-${adm.id}`} name="toBedId" className="select" required><option value="">{t("نقل إلى…", "Transfer to…")}</option>{bedOptions}</select>
                              </div>
                              <button type="submit" className="btn btn-ghost btn-sm">{t("نقل", "Move")}</button>
                            </form>
                            <form action={dischargePatient}><input type="hidden" name="admissionId" value={adm.id} /><button type="submit" className="btn btn-outline btn-sm">{t("خروج", "Discharge")}</button></form>
                          </div>
                        ) : null}
                      </div>
                    ) : b.status === "CLEANING" && manage ? (
                      <form action={releaseBed} className="mt-2"><input type="hidden" name="bedId" value={b.id} /><button type="submit" className="btn btn-ghost btn-sm">{t("تم التنظيف", "Mark cleaned")}</button></form>
                    ) : null}
                  </li>
                );
              }),
            )}
          </ul>
        </section>
      ))}

      {manage ? (
        <section aria-labelledby="adm-h" className="card">
          <h2 id="adm-h" className="text-lg font-bold">{t("تنويم مريض", "Admit a patient")}</h2>
          {free.length === 0 ? <p className="alert alert-warn mt-2">{t("لا توجد أسرّة متاحة.", "No beds available.")}</p> : (
            <form action={admitPatient} className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="field"><label htmlFor="a-mrn">{t("الرقم الطبي (MRN)", "MRN")}</label><input id="a-mrn" name="mrn" required className="input" dir="ltr" placeholder="RWA-000001" /></div>
              <div className="field"><label htmlFor="a-bed">{t("السرير", "Bed")}</label><select id="a-bed" name="bedId" required className="select">{bedOptions}</select></div>
              <div className="field"><label htmlFor="a-dx">{t("التشخيص", "Diagnosis")}</label><input id="a-dx" name="diagnosis" maxLength={200} className="input" /></div>
              <div className="field"><label htmlFor="a-ed">{t("تاريخ الخروج المتوقع", "Expected discharge")}</label><input id="a-ed" name="expectedDischarge" type="date" className="input" /></div>
              <div className="sm:col-span-2"><button type="submit" className="btn btn-primary">{t("تنويم", "Admit")}</button></div>
            </form>
          )}
        </section>
      ) : null}
    </div>
  );
}
