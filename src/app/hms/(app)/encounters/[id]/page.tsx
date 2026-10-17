import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getT, pick } from "@/lib/i18n";
import { authorize } from "@/lib/session";
import { can } from "@/lib/rbac";
import { ageYears, fmtDateTime } from "@/lib/time";
import { AI_LABEL } from "@/lib/ai";
import { FLAG_TEXT, LAB_TESTS, RAD_TESTS, type ResultFlag } from "@/lib/catalog";
import { addDiagnosis, confirmSummary, createOrder, prescribe, saveNotes, saveVitals, summarizeNoteAi } from "@/app/actions/clinical";

export const dynamic = "force-dynamic";
export const metadata = { title: "ملف الزيارة" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string; drug?: string }> };

const VITAL_FIELDS: { k: "hr" | "sbp" | "dbp" | "rr" | "spo2" | "temp" | "gcs" | "pain" | "weight"; ar: string; en: string }[] = [
  { k: "hr", ar: "النبض", en: "HR" }, { k: "sbp", ar: "الانقباضي", en: "SBP" }, { k: "dbp", ar: "الانبساطي", en: "DBP" },
  { k: "rr", ar: "التنفس", en: "RR" }, { k: "spo2", ar: "الأكسجة %", en: "SpO₂ %" }, { k: "temp", ar: "الحرارة", en: "Temp" },
  { k: "gcs", ar: "غلاسكو", en: "GCS" }, { k: "pain", ar: "الألم", en: "Pain" }, { k: "weight", ar: "الوزن كغ", en: "Weight kg" },
];

export default async function EncounterPage({ params, searchParams }: Props) {
  const auth = await authorize("emr.read");
  if ("error" in auth) redirect("/hms/login");
  const { id } = await params;
  const sp = await searchParams;
  const { lang, t } = await getT();
  const enc = await prisma.encounter.findUnique({
    where: { id },
    include: { patient: true, doctor: true, diagnoses: true, orders: { orderBy: { orderedAt: "desc" } }, prescriptions: { include: { drug: true }, orderBy: { prescribedAt: "desc" } } },
  });
  if (!enc) notFound();
  const canWrite = can(auth.user.role, "emr.write");
  const canOrder = can(auth.user.role, "orders.create");
  const canRx = can(auth.user.role, "pharmacy.prescribe");
  const canAi = can(auth.user.role, "ai.use");
  const [icd, drugs] = await Promise.all([
    canWrite ? prisma.icd10.findMany({ orderBy: { code: "asc" } }) : Promise.resolve([]),
    canRx ? prisma.drug.findMany({ orderBy: { name: "asc" } }) : Promise.resolve([]),
  ]);
  const summary = enc.aiSummary ? (JSON.parse(enc.aiSummary) as { provider: string; mock: boolean; text: string }) : null;
  const p = enc.patient;
  const flagBadge = (f: string | null) => (f === "N" || !f ? "badge-ok" : f.length === 2 ? "badge-danger" : "badge-warn");

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/hms/encounters" className="text-sm underline">{t("← كل الزيارات", "← All encounters")}</Link>
        <h1 className="mt-1 text-2xl font-bold">{lang === "ar" ? p.nameAr : p.nameEn}</h1>
        <p className="hint" dir="ltr">MRN {p.mrn} · {p.gender} · {ageYears(p.dob)}y · {enc.type} · {enc.status}</p>
        <p className="hint">{t("بدأت", "Started")}: {fmtDateTime(enc.startedAt, lang)} · {enc.doctor ? pick(lang, enc.doctor.nameAr, enc.doctor.nameEn) : "—"}</p>
        {p.allergies ? <p className="alert alert-danger mt-2">{t("حساسية", "Allergies")}: {p.allergies}</p> : null}
        {enc.chiefComplaint ? <p className="mt-2"><strong>{t("الشكوى", "Complaint")}:</strong> {enc.chiefComplaint}</p> : null}
      </div>

      {sp.ok ? <p role="status" className="alert alert-ok">{t("تم الحفظ.", "Saved.")}</p> : null}
      {sp.error === "contraindicated" ? <p role="alert" className="alert alert-danger">{t("تعارض دوائي مانع: لا يمكن صرف هذا الدواء مع الأدوية الحالية.", "Contraindicated combination: this drug cannot be prescribed with the current medicines.")}</p> : null}
      {sp.error === "validation" ? <p role="alert" className="alert alert-danger">{t("تحقق من المدخلات.", "Check the inputs.")}</p> : null}

      <section aria-labelledby="v-h" className="card">
        <h2 id="v-h" className="text-lg font-bold">{t("العلامات الحيوية", "Vitals")}</h2>
        <form action={saveVitals} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <input type="hidden" name="encounterId" value={enc.id} />
          {VITAL_FIELDS.map((f) => (
            <div key={f.k} className="field">
              <label htmlFor={`v-${f.k}`}>{lang === "ar" ? f.ar : f.en}</label>
              <input id={`v-${f.k}`} name={f.k} type="number" step="any" inputMode="decimal" className="input" defaultValue={enc[f.k] ?? ""} disabled={!canWrite} dir="ltr" />
            </div>
          ))}
          {canWrite ? <div className="flex items-end"><button type="submit" className="btn btn-primary">{t("حفظ", "Save")}</button></div> : null}
        </form>
      </section>

      <section aria-labelledby="d-h" className="card">
        <h2 id="d-h" className="text-lg font-bold">{t("التشخيصات (ICD-10)", "Diagnoses (ICD-10)")}</h2>
        {enc.diagnoses.length === 0 ? <p className="hint mt-2">{t("لا تشخيصات بعد.", "No diagnoses yet.")}</p> : (
          <ul className="mt-2 grid gap-1">{enc.diagnoses.map((d) => <li key={d.id}><span className="badge badge-info" dir="ltr">{d.code}</span> {pick(lang, d.nameAr, d.nameEn)}{d.isPrimary ? ` · ${t("رئيسي", "primary")}` : ""}</li>)}</ul>
        )}
        {canWrite ? (
          <form action={addDiagnosis} className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="encounterId" value={enc.id} />
            <div className="field min-w-0 flex-1 basis-64"><label htmlFor="dx-code">{t("اختر التشخيص", "Pick a diagnosis")}</label>
              <select id="dx-code" name="code" className="select" required defaultValue="">
                <option value="" disabled>—</option>
                {icd.map((c) => <option key={c.code} value={c.code}>{c.code} · {pick(lang, c.nameAr, c.nameEn)}</option>)}
              </select></div>
            <button type="submit" className="btn btn-outline">{t("إضافة", "Add")}</button>
          </form>
        ) : null}
      </section>

      <section aria-labelledby="n-h" className="card">
        <h2 id="n-h" className="text-lg font-bold">{t("الملاحظات السريرية", "Clinical notes")}</h2>
        <form action={saveNotes} className="mt-3 grid gap-2">
          <input type="hidden" name="encounterId" value={enc.id} />
          <div className="field"><label htmlFor="notes" className="sr-only">{t("الملاحظات", "Notes")}</label>
            <textarea id="notes" name="notes" className="textarea" defaultValue={enc.notes ?? ""} maxLength={4000} disabled={!canWrite} /></div>
          {canWrite ? <div><button type="submit" className="btn btn-primary">{t("حفظ الملاحظات", "Save notes")}</button></div> : null}
        </form>
        <div className="ai-box mt-4">
          <p className="text-xs font-bold">{lang === "ar" ? AI_LABEL.ar : AI_LABEL.en}</p>
          {summary ? (
            <>
              <p className="mt-2 whitespace-pre-line">{summary.text}</p>
              <p className="hint mt-1">{summary.provider}{summary.mock ? (lang === "ar" ? " (محاكاة)" : " (mock)") : ""}</p>
              {enc.aiSummaryConfirmed ? <p className="badge badge-ok mt-2">{t("أكّده", "Confirmed by")}: {enc.aiSummaryConfirmed}</p> : canWrite ? (
                <form action={confirmSummary} className="mt-2"><input type="hidden" name="encounterId" value={enc.id} /><button type="submit" className="btn btn-primary btn-sm">{t("أؤكد بعد المراجعة", "I reviewed and confirm")}</button></form>
              ) : <p className="badge badge-warn mt-2">{t("بانتظار تأكيد الطبيب", "Awaiting clinician confirmation")}</p>}
            </>
          ) : <p className="hint mt-1">{t("لم يُولَّد ملخص بعد.", "No summary generated yet.")}</p>}
          {canAi ? <form action={summarizeNoteAi} className="mt-2"><input type="hidden" name="encounterId" value={enc.id} /><button type="submit" className="btn btn-outline btn-sm">{t("توليد ملخص بالذكاء الاصطناعي", "Generate AI summary")}</button></form> : null}
        </div>
      </section>

      <section aria-labelledby="o-h" className="card">
        <h2 id="o-h" className="text-lg font-bold">{t("الطلبات (مختبر وأشعة)", "Orders (lab & radiology)")}</h2>
        {enc.orders.length === 0 ? <p className="hint mt-2">{t("لا طلبات.", "No orders.")}</p> : (
          <div className="table-wrap mt-2"><table className="w-full text-sm"><tbody>
            {enc.orders.map((o) => (
              <tr key={o.id} className="border-t border-line first:border-t-0">
                <td className="p-2">{o.kind}</td><td className="p-2">{o.name}</td>
                <td className="p-2">{o.status === "RESULTED" ? (o.kind === "LAB" ? <span dir="ltr">{o.value} {o.unit}</span> : o.resultText) : <span className="badge badge-warn">{t("بانتظار النتيجة", "Pending")}</span>}</td>
                <td className="p-2">{o.flag ? <span className={`badge ${flagBadge(o.flag)}`}>{FLAG_TEXT[o.flag as ResultFlag]?.[lang] ?? o.flag}</span> : null}</td>
              </tr>
            ))}
          </tbody></table></div>
        )}
        {canOrder ? (
          <form action={createOrder} className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="encounterId" value={enc.id} />
            <div className="field min-w-0 flex-1 basis-56"><label htmlFor="o-code">{t("الفحص", "Test")}</label>
              <select id="o-code" name="code" className="select" required defaultValue="">
                <option value="" disabled>—</option>
                <optgroup label={t("مختبر", "Laboratory")}>{LAB_TESTS.map((x) => <option key={x.code} value={x.code} data-kind="LAB">{pick(lang, x.nameAr, x.name)}</option>)}</optgroup>
                <optgroup label={t("أشعة", "Radiology")}>{RAD_TESTS.map((x) => <option key={x.code} value={x.code}>{pick(lang, x.nameAr, x.name)}</option>)}</optgroup>
              </select></div>
            <div className="field"><label htmlFor="o-kind">{t("النوع", "Kind")}</label>
              <select id="o-kind" name="kind" className="select"><option value="LAB">{t("مختبر", "Lab")}</option><option value="RAD">{t("أشعة", "Radiology")}</option></select></div>
            <div className="field"><label htmlFor="o-pri">{t("الأولوية", "Priority")}</label>
              <select id="o-pri" name="priority" className="select"><option value="ROUTINE">{t("عادي", "Routine")}</option><option value="URGENT">{t("عاجل", "Urgent")}</option><option value="STAT">STAT</option></select></div>
            <button type="submit" className="btn btn-outline">{t("طلب", "Order")}</button>
          </form>
        ) : null}
      </section>

      <section aria-labelledby="r-h" className="card">
        <h2 id="r-h" className="text-lg font-bold">{t("الوصفات", "Prescriptions")}</h2>
        {sp.error === "interaction" ? <p role="alert" className="alert alert-warn mt-2">{t("تم رصد تفاعل دوائي. راجع الوصفة؛ أعد الإرسال مع تأكيد التجاوز إن كان مبرراً سريرياً.", "A drug interaction was detected. Review; resubmit with the override box ticked if clinically justified.")}</p> : null}
        {enc.prescriptions.length === 0 ? <p className="hint mt-2">{t("لا وصفات.", "No prescriptions.")}</p> : (
          <ul className="mt-2 grid gap-1">{enc.prescriptions.map((r) => (
            <li key={r.id} className="text-sm"><strong>{pick(lang, r.drug.nameAr, r.drug.name)}</strong> {r.dose} · {r.frequency} · {r.days}d · ×{r.qty} <span className={`badge ${r.status === "DISPENSED" ? "badge-ok" : "badge-warn"}`}>{r.status}</span>
              {r.interactionNote ? <span className="alert alert-warn mt-1 block text-xs">{r.interactionNote}</span> : null}</li>
          ))}</ul>
        )}
        {canRx ? (
          <form action={prescribe} className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-6">
            <input type="hidden" name="encounterId" value={enc.id} />
            <div className="field col-span-2"><label htmlFor="rx-drug">{t("الدواء", "Drug")}</label>
              <select id="rx-drug" name="drugId" className="select" required defaultValue={sp.drug ?? ""}><option value="" disabled>—</option>{drugs.map((d) => <option key={d.id} value={d.id}>{pick(lang, d.nameAr, d.name)} {d.strength}</option>)}</select></div>
            <div className="field"><label htmlFor="rx-dose">{t("الجرعة", "Dose")}</label><input id="rx-dose" name="dose" className="input" required maxLength={60} /></div>
            <div className="field"><label htmlFor="rx-freq">{t("التكرار", "Frequency")}</label><input id="rx-freq" name="frequency" className="input" required maxLength={60} /></div>
            <div className="field"><label htmlFor="rx-days">{t("الأيام", "Days")}</label><input id="rx-days" name="days" type="number" min={1} max={90} defaultValue={5} className="input" required /></div>
            <div className="field"><label htmlFor="rx-qty">{t("الكمية", "Qty")}</label><input id="rx-qty" name="qty" type="number" min={1} max={500} defaultValue={10} className="input" required /></div>
            <label className="col-span-2 flex items-center gap-2 text-sm lg:col-span-5"><input type="checkbox" name="override" value="1" />{t("أتجاوز تنبيه التفاعل بمسؤوليتي السريرية", "Override interaction warning on my clinical responsibility")}</label>
            <div><button type="submit" className="btn btn-primary">{t("وصف", "Prescribe")}</button></div>
          </form>
        ) : null}
      </section>
    </div>
  );
}
