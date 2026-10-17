import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { authorize } from "@/lib/session";
import { can } from "@/lib/rbac";
import { minutesBetween } from "@/lib/time";
import { TRIAGE_LABELS, type TriageLevel, type TriageReason } from "@/lib/triage";
import { AI_LABEL } from "@/lib/ai";
import { closeErVisit, confirmTriage, explainTriageAi, markSeen, registerErArrival } from "@/app/actions/er";

export const dynamic = "force-dynamic";
export const metadata = { title: "الطوارئ" };

type Props = { searchParams: Promise<{ error?: string; added?: string }> };

function parseAi(s: string | null): { provider: string; mock: boolean; text: string } | null {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export default async function ErPage({ searchParams }: Props) {
  const auth = await authorize("er.manage");
  if ("error" in auth) redirect("/hms/login");
  const sp = await searchParams;
  const { lang, t } = await getT();
  const role = auth.user.role;
  const open = await prisma.encounter.findMany({ where: { type: "ER", status: "OPEN" }, include: { patient: true }, orderBy: { startedAt: "asc" } });
  const lvl = (e: (typeof open)[number]) => e.triageFinal ?? e.triageSuggested ?? 5;
  const rows = [...open].sort((a, b) => lvl(a) - lvl(b) || a.startedAt.getTime() - b.startedAt.getTime());
  const now = new Date();
  const errors: Record<string, string> = {
    validation: t("تحقق من البيانات المدخلة.", "Please check the entered data."),
    patient: t("لا يوجد مريض بهذا الرقم الطبي.", "No patient with that MRN."),
    forbidden: t("لا تملك صلاحية هذا الإجراء.", "You are not allowed to do that."),
  };
  const vitalField = (name: string, ar: string, en: string) => (
    <div className="field" key={name}>
      <label htmlFor={`v-${name}`}>{t(ar, en)}</label>
      <input id={`v-${name}`} name={name} inputMode="decimal" className="input" dir="ltr" />
    </div>
  );
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">{t("لوحة الطوارئ", "Emergency department board")}</h1>
      <p className="alert alert-info text-sm">{t("مستوى الفرز المقترح (ESI 1–5) محسوب بقواعد ثابتة، ولا يُعتمد إلا بتأكيد طبيب أو ممرض باسمه.", "The suggested ESI level (1–5) comes from fixed rules and only counts once a named clinician confirms it.")}</p>
      {sp.added ? <p role="status" className="alert alert-ok">{t(`سُجّل وصول المريض ${sp.added}.`, `Arrival registered for ${sp.added}.`)}</p> : null}
      {sp.error ? <p role="alert" className="alert alert-danger">{errors[sp.error] ?? errors.validation}</p> : null}

      <section aria-labelledby="er-q" className="grid gap-3">
        <h2 id="er-q" className="text-lg font-bold">{t(`بالانتظار والمعالجة (${rows.length})`, `Waiting and in treatment (${rows.length})`)}</h2>
        {rows.length === 0 ? <p className="alert alert-info">{t("لا يوجد مرضى في الطوارئ حالياً.", "No patients in the ER right now.")}</p> : null}
        {rows.map((e) => {
          const level = lvl(e) as TriageLevel;
          const reasons: TriageReason[] = e.triageReasons ? JSON.parse(e.triageReasons) : [];
          const ai = parseAi(e.triageAi);
          const wait = minutesBetween(e.startedAt, e.seenAt ?? now);
          return (
            <article key={e.id} className="card grid gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className={`badge triage-${level}`}>ESI {level} · {lang === "ar" ? TRIAGE_LABELS[level].ar : TRIAGE_LABELS[level].en}</span>
                <h3 className="min-w-0 truncate font-bold">{lang === "ar" ? e.patient.nameAr : e.patient.nameEn}</h3>
                <span className="hint" dir="ltr">{e.patient.mrn}</span>
                <span className={`badge ${e.seenAt ? "badge-ok" : "badge-warn"}`}>{e.seenAt ? t("تمت المعاينة", "Seen") : t(`ينتظر ${wait} د`, `Waiting ${wait} min`)}</span>
              </div>
              <p>{e.chiefComplaint}</p>
              <p className="hint" dir="ltr" style={{ textAlign: "start" }}>
                HR {e.hr ?? "–"} · SBP {e.sbp ?? "–"} · RR {e.rr ?? "–"} · SpO₂ {e.spo2 ?? "–"} · T {e.temp ?? "–"} · GCS {e.gcs ?? "–"} · Pain {e.pain ?? "–"}
              </p>
              {reasons.length ? (
                <ul className="list-disc ps-5 text-sm">{reasons.map((r) => <li key={r.rule}>{lang === "ar" ? r.ar : r.en}</li>)}</ul>
              ) : null}
              {e.triageConfirmedBy ? (
                <p className="badge badge-ok w-fit">{t(`أكّد الفرز: ${e.triageConfirmedBy}`, `Triage confirmed by ${e.triageConfirmedBy}`)}</p>
              ) : (
                <p className="badge badge-warn w-fit">{t(`المستوى المقترح ${e.triageSuggested} — بانتظار التأكيد`, `Suggested level ${e.triageSuggested} — awaiting confirmation`)}</p>
              )}
              {ai ? (
                <div className="ai-box">
                  <p className="text-xs font-bold">{AI_LABEL[lang]} · {ai.provider}{ai.mock ? (lang === "ar" ? " (محاكاة)" : " (mock)") : ""}</p>
                  <p className="mt-1 whitespace-pre-line">{ai.text}</p>
                </div>
              ) : null}
              <div className="flex flex-wrap items-end gap-2">
                {can(role, "er.confirm") ? (
                  <form action={confirmTriage} className="flex items-end gap-2">
                    <input type="hidden" name="encounterId" value={e.id} />
                    <div className="field">
                      <label htmlFor={`lv-${e.id}`}>{t("المستوى النهائي", "Final level")}</label>
                      <select id={`lv-${e.id}`} name="level" defaultValue={String(e.triageFinal ?? e.triageSuggested ?? 3)} className="select">
                        {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <button className="btn btn-outline btn-sm" type="submit">{t("تأكيد الفرز", "Confirm triage")}</button>
                  </form>
                ) : null}
                {can(role, "ai.use") ? (
                  <form action={explainTriageAi}><input type="hidden" name="encounterId" value={e.id} /><button className="btn btn-ghost btn-sm" type="submit">{t("شرح بالذكاء الاصطناعي", "Explain with AI")}</button></form>
                ) : null}
                {!e.seenAt ? (
                  <form action={markSeen}><input type="hidden" name="encounterId" value={e.id} /><button className="btn btn-primary btn-sm" type="submit">{t("بدء المعاينة", "Mark seen")}</button></form>
                ) : null}
                <form action={closeErVisit} className="flex items-end gap-2">
                  <input type="hidden" name="encounterId" value={e.id} />
                  <div className="field">
                    <label htmlFor={`d-${e.id}`}>{t("المآل", "Disposition")}</label>
                    <select id={`d-${e.id}`} name="disposition" className="select">
                      <option value="DISCHARGED">{t("خروج", "Discharged")}</option>
                      <option value="ADMITTED">{t("تنويم", "Admitted")}</option>
                      <option value="TRANSFERRED">{t("تحويل", "Transferred")}</option>
                      <option value="LWBS">{t("غادر قبل المعاينة", "Left without being seen")}</option>
                    </select>
                  </div>
                  <button className="btn btn-ghost btn-sm" type="submit">{t("إغلاق الزيارة", "Close visit")}</button>
                </form>
              </div>
            </article>
          );
        })}
      </section>

      <section aria-labelledby="er-new" className="card">
        <h2 id="er-new" className="text-lg font-bold">{t("تسجيل وصول مريض", "Register an arrival")}</h2>
        <form action={registerErArrival} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="field"><label htmlFor="e-mrn">{t("الرقم الطبي (MRN)", "MRN")}</label><input id="e-mrn" name="mrn" required className="input" dir="ltr" placeholder="RWA-000001" /></div>
          <div className="field sm:col-span-2 lg:col-span-3"><label htmlFor="e-c">{t("الشكوى الرئيسية", "Chief complaint")}</label><input id="e-c" name="complaint" required maxLength={300} className="input" /></div>
          {vitalField("hr", "النبض", "Heart rate")}
          {vitalField("sbp", "الضغط الانقباضي", "Systolic BP")}
          {vitalField("dbp", "الضغط الانبساطي", "Diastolic BP")}
          {vitalField("rr", "التنفس", "Resp. rate")}
          {vitalField("spo2", "الأكسجة %", "SpO₂ %")}
          {vitalField("temp", "الحرارة", "Temperature")}
          {vitalField("gcs", "غلاسكو", "GCS")}
          {vitalField("pain", "الألم 0–10", "Pain 0–10")}
          <div className="sm:col-span-2 lg:col-span-4"><button type="submit" className="btn btn-primary">{t("تسجيل واقتراح الفرز", "Register and suggest triage")}</button></div>
        </form>
      </section>
    </div>
  );
}
