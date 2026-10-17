import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT, pick, money } from "@/lib/i18n";
import { getPatient } from "@/lib/session";
import { patientLogin, patientLogout } from "@/app/actions/portal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "بوابة المريض",
  description: "بوابة المريض في مستشفى رُواء التخصصي: اطّلع على مواعيدك ونتائج التحاليل والأشعة ووصفاتك وفواتيرك بعد تسجيل الدخول.",
  alternates: { canonical: "/portal" },
  robots: { index: false },
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function PortalPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const { lang, t } = await getT();
  const patient = await getPatient();

  if (!patient) {
    const demo = await prisma.patient.findFirst({ where: { passwordHash: { not: null } }, select: { nationalId: true } });
    return (
      <div className="container-x max-w-md py-10">
        <h1 className="text-3xl font-bold">{t("بوابة المريض", "Patient portal")}</h1>
        <p className="mt-2 text-soft">{t("سجّل الدخول برقم الهوية وكلمة المرور.", "Sign in with your national ID and password.")}</p>
        {error ? <p role="alert" className="badge badge-danger mt-4">{t("بيانات الدخول غير صحيحة.", "Incorrect sign-in details.")}</p> : null}
        <form action={patientLogin} className="card mt-4 grid gap-4">
          <div className="field">
            <label htmlFor="p-id">{t("رقم الهوية", "National ID")}</label>
            <input id="p-id" name="nationalId" inputMode="numeric" pattern="[12][0-9]{9}" required className="input" dir="ltr" autoComplete="username" />
          </div>
          <div className="field">
            <label htmlFor="p-pw">{t("كلمة المرور", "Password")}</label>
            <input id="p-pw" name="password" type="password" required className="input" dir="ltr" autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-primary">{t("دخول", "Sign in")}</button>
        </form>
        {demo ? (
          <p className="card mt-4 text-sm">
            {t("حساب تجريبي — رقم الهوية:", "Demo account — national ID:")} <span dir="ltr" className="font-bold">{demo.nationalId}</span>
            <br />
            {t("كلمة المرور مذكورة في ملف README (DEMO_PATIENT_PASSWORD).", "The password is in the README (DEMO_PATIENT_PASSWORD).")}
          </p>
        ) : null}
      </div>
    );
  }

  const [appointments, orders, rx, invoices] = await Promise.all([
    prisma.appointment.findMany({ where: { patientId: patient.id }, orderBy: { start: "desc" }, take: 20, include: { doctor: true, branch: true } }),
    prisma.order.findMany({ where: { patientId: patient.id, status: "RESULTED" }, orderBy: { resultedAt: "desc" }, take: 30 }),
    prisma.prescription.findMany({ where: { patientId: patient.id }, orderBy: { prescribedAt: "desc" }, take: 20, include: { drug: true } }),
    prisma.invoice.findMany({ where: { patientId: patient.id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const dtf = new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" });
  const flagBadge = (f: string | null) => (f === "N" || !f ? "badge-ok" : f.startsWith("C") ? "badge-danger" : "badge-warn");

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold">{t("مرحباً", "Welcome")}، {pick(lang, patient.nameAr, patient.nameEn)}</h1>
          <p className="text-sm text-soft">{t("رقم الملف", "MRN")}: <span dir="ltr">{patient.mrn}</span></p>
        </div>
        <form action={patientLogout}><button type="submit" className="btn btn-outline btn-sm">{t("تسجيل الخروج", "Sign out")}</button></form>
      </div>

      <section aria-labelledby="h-appt" className="mt-8">
        <h2 id="h-appt" className="text-xl font-bold">{t("مواعيدي", "My appointments")}</h2>
        {appointments.length === 0 ? <p className="card mt-3">{t("لا توجد مواعيد.", "No appointments.")}</p> : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {appointments.map((a) => (
              <li key={a.id} className="card">
                <p className="font-bold">{pick(lang, a.doctor.nameAr, a.doctor.nameEn)}</p>
                <p className="text-sm">{pick(lang, a.branch.nameAr, a.branch.nameEn)} · {dtf.format(a.start)}</p>
                <p className="mt-1 text-xs text-soft"><span dir="ltr">{a.number}</span> · {a.status}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="h-lab" className="mt-8">
        <h2 id="h-lab" className="text-xl font-bold">{t("نتائج التحاليل والأشعة", "Lab & radiology results")}</h2>
        {orders.length === 0 ? <p className="card mt-3">{t("لا توجد نتائج.", "No results.")}</p> : (
          <div className="card mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead><tr><th scope="col" className="p-2 text-start">{t("الفحص", "Test")}</th><th scope="col" className="p-2 text-start">{t("النتيجة", "Result")}</th><th scope="col" className="p-2 text-start">{t("المرجع", "Reference")}</th><th scope="col" className="p-2 text-start">{t("التاريخ", "Date")}</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-line">
                    <th scope="row" className="p-2 text-start font-semibold">{o.name}</th>
                    <td className="p-2">
                      {o.value !== null ? <span dir="ltr">{o.value} {o.unit}</span> : o.resultText}{" "}
                      <span className={`badge ${flagBadge(o.flag)}`}>{o.flag ?? "N"}</span>
                    </td>
                    <td className="p-2" dir="ltr">{o.refLow !== null && o.refHigh !== null ? `${o.refLow} – ${o.refHigh}` : "—"}</td>
                    <td className="p-2">{o.resultedAt ? dtf.format(o.resultedAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="h-rx" className="mt-8">
        <h2 id="h-rx" className="text-xl font-bold">{t("وصفاتي", "My prescriptions")}</h2>
        {rx.length === 0 ? <p className="card mt-3">{t("لا توجد وصفات.", "No prescriptions.")}</p> : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {rx.map((p) => (
              <li key={p.id} className="card">
                <p className="font-bold">{pick(lang, p.drug.nameAr, p.drug.name)} <span dir="ltr" className="text-sm font-normal">{p.drug.strength}</span></p>
                <p className="text-sm">{p.dose} · {p.frequency} · {p.days} {t("أيام", "days")}</p>
                <p className="mt-1 text-xs text-soft">{p.status}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="h-inv" className="mt-8">
        <h2 id="h-inv" className="text-xl font-bold">{t("فواتيري", "My invoices")}</h2>
        {invoices.length === 0 ? <p className="card mt-3">{t("لا توجد فواتير.", "No invoices.")}</p> : (
          <div className="card mt-3 overflow-x-auto">
            <table className="w-full min-w-[30rem] text-sm">
              <thead><tr><th scope="col" className="p-2 text-start">{t("الرقم", "Number")}</th><th scope="col" className="p-2 text-start">{t("المجموع", "Subtotal")}</th><th scope="col" className="p-2 text-start">{t("الضريبة", "VAT")}</th><th scope="col" className="p-2 text-start">{t("الإجمالي", "Total")}</th><th scope="col" className="p-2 text-start">{t("الحالة", "Status")}</th></tr></thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id} className="border-t border-line">
                    <th scope="row" className="p-2 text-start font-semibold" dir="ltr">{i.number}</th>
                    <td className="p-2">{money(i.subtotal, lang)}</td>
                    <td className="p-2">{money(i.vat, lang)}</td>
                    <td className="p-2 font-bold">{money(i.total, lang)}</td>
                    <td className="p-2">{i.status}</td>
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
