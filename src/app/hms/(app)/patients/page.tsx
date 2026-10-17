import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { authorize } from "@/lib/session";
import { can } from "@/lib/rbac";
import { ageYears } from "@/lib/time";
import { registerPatient } from "@/app/actions/patients";

export const dynamic = "force-dynamic";
export const metadata = { title: "المرضى" };

type Props = { searchParams: Promise<{ q?: string; error?: string; created?: string }> };

export default async function PatientsPage({ searchParams }: Props) {
  const auth = await authorize("patients.read");
  if ("error" in auth) redirect("/hms/login");
  const sp = await searchParams;
  const { lang, t } = await getT();
  const q = (sp.q ?? "").trim().slice(0, 60);
  const patients = await prisma.patient.findMany({
    where: q ? { OR: [{ mrn: { contains: q } }, { nameAr: { contains: q } }, { nameEn: { contains: q } }, { nationalId: { contains: q } }, { phone: { contains: q } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const canWrite = can(auth.user.role, "patients.write");
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">{t("المرضى", "Patients")}</h1>
      {sp.created ? <p role="status" className="alert alert-ok">{t(`تم التسجيل. رقم الملف: ${sp.created}`, `Registered. MRN: ${sp.created}`)}</p> : null}
      {sp.error ? <p role="alert" className="alert alert-danger">{sp.error === "duplicate" ? t("رقم الهوية مسجّل مسبقاً.", "National ID already registered.") : t("تحقق من البيانات المدخلة.", "Please check the entered data.")}</p> : null}

      <form className="flex flex-wrap items-end gap-2" role="search">
        <div className="field min-w-0 flex-1 basis-64">
          <label htmlFor="pq">{t("بحث (ملف، اسم، هوية، جوال)", "Search (MRN, name, ID, phone)")}</label>
          <input id="pq" name="q" defaultValue={q} className="input" />
        </div>
        <button type="submit" className="btn btn-primary">{t("بحث", "Search")}</button>
      </form>

      {patients.length === 0 ? (
        <p className="alert alert-info">{t("لا نتائج مطابقة.", "No matching patients.")}</p>
      ) : (
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th scope="col" className="p-2 text-start">MRN</th>
                <th scope="col" className="p-2 text-start">{t("الاسم", "Name")}</th>
                <th scope="col" className="p-2 text-start">{t("العمر", "Age")}</th>
                <th scope="col" className="p-2 text-start">{t("الجوال", "Phone")}</th>
                <th scope="col" className="p-2 text-start">{t("التأمين", "Insurer")}</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="p-2" dir="ltr">{p.mrn}</td>
                  <td className="p-2">{lang === "ar" ? p.nameAr : p.nameEn}</td>
                  <td className="p-2">{ageYears(p.dob)}</td>
                  <td className="p-2" dir="ltr">{p.phone}</td>
                  <td className="p-2">{p.insurer ?? t("نقدي", "Cash")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canWrite ? (
        <section aria-labelledby="reg-h" className="card">
          <h2 id="reg-h" className="text-lg font-bold">{t("تسجيل مريض جديد", "Register a new patient")}</h2>
          <form action={registerPatient} className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="field"><label htmlFor="r-ar">{t("الاسم بالعربية", "Name (Arabic)")}</label><input id="r-ar" name="nameAr" required minLength={3} maxLength={80} className="input" /></div>
            <div className="field"><label htmlFor="r-en">{t("الاسم بالإنجليزية", "Name (English)")}</label><input id="r-en" name="nameEn" required minLength={3} maxLength={80} className="input" dir="ltr" /></div>
            <div className="field"><label htmlFor="r-nid">{t("رقم الهوية (10 أرقام)", "National ID (10 digits)")}</label><input id="r-nid" name="nationalId" required pattern="[12][0-9]{9}" inputMode="numeric" className="input" dir="ltr" /></div>
            <div className="field"><label htmlFor="r-ph">{t("الجوال", "Phone")}</label><input id="r-ph" name="phone" required className="input" dir="ltr" placeholder="05XXXXXXXX" /></div>
            <div className="field"><label htmlFor="r-g">{t("الجنس", "Gender")}</label><select id="r-g" name="gender" className="select" required><option value="M">{t("ذكر", "Male")}</option><option value="F">{t("أنثى", "Female")}</option></select></div>
            <div className="field"><label htmlFor="r-dob">{t("تاريخ الميلاد", "Date of birth")}</label><input id="r-dob" name="dob" type="date" required className="input" /></div>
            <div className="field"><label htmlFor="r-em">{t("البريد (اختياري)", "Email (optional)")}</label><input id="r-em" name="email" type="email" className="input" dir="ltr" /></div>
            <div className="field"><label htmlFor="r-bt">{t("فصيلة الدم", "Blood type")}</label><select id="r-bt" name="bloodType" className="select"><option value="">—</option>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => <option key={b} value={b}>{b}</option>)}</select></div>
            <div className="field"><label htmlFor="r-in">{t("شركة التأمين (اختياري)", "Insurer (optional)")}</label><input id="r-in" name="insurer" maxLength={80} className="input" /></div>
            <div className="field"><label htmlFor="r-po">{t("رقم الوثيقة", "Policy no.")}</label><input id="r-po" name="policyNo" maxLength={40} className="input" dir="ltr" /></div>
            <div className="field sm:col-span-2"><label htmlFor="r-al">{t("الحساسية", "Allergies")}</label><input id="r-al" name="allergies" maxLength={200} className="input" /></div>
            <div className="sm:col-span-2"><button type="submit" className="btn btn-primary">{t("تسجيل", "Register")}</button></div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
