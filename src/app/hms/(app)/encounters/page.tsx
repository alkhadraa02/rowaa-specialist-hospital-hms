import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { authorize } from "@/lib/session";
import { fmtDateTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "الزيارات (EMR)" };

type Props = { searchParams: Promise<{ type?: string; status?: string }> };

export default async function EncountersPage({ searchParams }: Props) {
  const auth = await authorize("emr.read");
  if ("error" in auth) redirect("/hms/login");
  const sp = await searchParams;
  const { lang, t } = await getT();
  const type = sp.type === "ER" || sp.type === "OPD" || sp.type === "IPD" ? sp.type : undefined;
  const status = sp.status === "OPEN" || sp.status === "CLOSED" ? sp.status : undefined;
  const list = await prisma.encounter.findMany({
    where: { ...(type ? { type } : {}), ...(status ? { status } : {}), ...(auth.user.doctorId ? { doctorId: auth.user.doctorId } : {}) },
    include: { patient: true, doctor: true },
    orderBy: { startedAt: "desc" },
    take: 60,
  });
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">{t("الزيارات (السجل الطبي)", "Encounters (EMR)")}</h1>
      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="field"><label htmlFor="f-type">{t("النوع", "Type")}</label>
          <select id="f-type" name="type" defaultValue={type ?? ""} className="select"><option value="">{t("الكل", "All")}</option><option value="OPD">{t("عيادات", "Outpatient")}</option><option value="ER">{t("طوارئ", "Emergency")}</option><option value="IPD">{t("تنويم", "Inpatient")}</option></select></div>
        <div className="field"><label htmlFor="f-st">{t("الحالة", "Status")}</label>
          <select id="f-st" name="status" defaultValue={status ?? ""} className="select"><option value="">{t("الكل", "All")}</option><option value="OPEN">{t("مفتوحة", "Open")}</option><option value="CLOSED">{t("مغلقة", "Closed")}</option></select></div>
        <button type="submit" className="btn btn-primary">{t("تصفية", "Filter")}</button>
      </form>
      {list.length === 0 ? <p className="card hint">{t("لا توجد زيارات مطابقة.", "No matching encounters.")}</p> : (
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead><tr><th className="p-2 text-start">{t("المريض", "Patient")}</th><th className="p-2 text-start">{t("النوع", "Type")}</th><th className="p-2 text-start">{t("الشكوى", "Complaint")}</th><th className="p-2 text-start">{t("البداية", "Started")}</th><th className="p-2 text-start">{t("الحالة", "Status")}</th></tr></thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="p-2"><Link className="font-semibold underline" href={`/hms/encounters/${e.id}`}>{lang === "ar" ? e.patient.nameAr : e.patient.nameEn}</Link><span className="hint block" dir="ltr">{e.patient.mrn}</span></td>
                  <td className="p-2">{e.type}</td>
                  <td className="max-w-64 truncate p-2">{e.chiefComplaint ?? "—"}</td>
                  <td className="p-2">{fmtDateTime(e.startedAt, lang)}</td>
                  <td className="p-2"><span className={`badge ${e.status === "OPEN" ? "badge-warn" : "badge-ok"}`}>{e.status === "OPEN" ? t("مفتوحة", "Open") : t("مغلقة", "Closed")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
