"use client";

import { useEffect, useMemo, useState } from "react";

type Spec = { id: string; nameAr: string; nameEn: string };
type Br = { id: string; nameAr: string; nameEn: string };
type Doc = { id: string; nameAr: string; nameEn: string; specialtyId: string; branches: Br[] };
type Props = {
  lang: "ar" | "en";
  specialties: Spec[];
  doctors: Doc[];
  initial: { specialtyId?: string; doctorId?: string; branchId?: string };
};

const TZ = "Asia/Riyadh";

export default function BookingWizard({ lang, specialties, doctors, initial }: Props) {
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const nm = (x: { nameAr: string; nameEn: string }) => (lang === "ar" ? x.nameAr : x.nameEn);
  const loc = lang === "ar" ? "ar-SA-u-nu-latn" : "en-GB";

  const initDoc = doctors.find((d) => d.id === initial.doctorId);
  const [specialtyId, setSpecialtyId] = useState(initDoc?.specialtyId ?? initial.specialtyId ?? "");
  const [doctorId, setDoctorId] = useState(initDoc?.id ?? "");
  const [branchId, setBranchId] = useState(initDoc && initDoc.branches.some((b) => b.id === initial.branchId) ? initial.branchId! : "");
  const [slot, setSlot] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ number: string; start: string } | null>(null);

  const docs = useMemo(() => doctors.filter((d) => !specialtyId || d.specialtyId === specialtyId), [doctors, specialtyId]);
  const doctor = doctors.find((d) => d.id === doctorId);
  const branch = doctor?.branches.find((b) => b.id === branchId);

  const step = !specialtyId ? 1 : !doctorId ? 2 : !branchId ? 3 : !slot ? 4 : 5;

  useEffect(() => {
    if (!doctorId || !branchId) return;
    let cancelled = false;
    setSlots(null);
    fetch(`/api/slots?doctorId=${encodeURIComponent(doctorId)}&branchId=${encodeURIComponent(branchId)}`)
      .then((r) => r.json())
      .then((j) => !cancelled && setSlots(Array.isArray(j.slots) ? j.slots : []))
      .catch(() => !cancelled && setSlots([]));
    return () => {
      cancelled = true;
    };
  }, [doctorId, branchId]);

  const byDay = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of slots ?? []) {
      const k = new Intl.DateTimeFormat(loc, { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date(s));
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return [...m.entries()];
  }, [slots, loc]);

  const fmtTime = (s: string) => new Intl.DateTimeFormat(loc, { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(s));
  const fmtFull = (s: string) => new Intl.DateTimeFormat(loc, { timeZone: TZ, dateStyle: "full", timeStyle: "short" }).format(new Date(s));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, branchId, start: slot, name, phone, nationalId, notes }),
      });
      const j = await res.json();
      if (res.status === 201) setDone(j);
      else if (res.status === 409) {
        setError(t("هذا الموعد لم يعد متاحاً، اختر وقتاً آخر.", "That slot is no longer available. Please pick another."));
        setSlot("");
      } else if (res.status === 429) setError(t("محاولات كثيرة، حاول بعد دقيقة.", "Too many attempts, try again in a minute."));
      else if (j.fields) setError(t("تحقق من الاسم ورقم الجوال (05xxxxxxxx) والهوية.", "Check the name, mobile number (05xxxxxxxx) and national ID."));
      else setError(t("تعذّر إتمام الحجز، حاول مجدداً.", "Could not complete the booking, please retry."));
    } catch {
      setError(t("تعذّر الاتصال بالخادم.", "Could not reach the server."));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section className="card p-6 text-center" aria-live="polite">
        <h2 className="text-2xl font-bold">{t("تم تأكيد حجزك", "Your booking is confirmed")}</h2>
        <p className="mt-3">{t("رقم الحجز", "Booking number")}</p>
        <p className="my-2 text-3xl font-bold tracking-widest" dir="ltr">{done.number}</p>
        <p>{doctor ? nm(doctor) : ""} — {branch ? nm(branch) : ""}</p>
        <p className="mt-1">{fmtFull(done.start)}</p>
        <p className="mt-4 text-sm opacity-80">{t("احتفظ برقم الحجز. هذه نسخة تجريبية ولا تمثّل مستشفى حقيقياً.", "Keep your booking number. This is a demo, not a real hospital.")}</p>
      </section>
    );
  }

  const steps = [t("التخصص", "Specialty"), t("الطبيب", "Doctor"), t("الفرع", "Branch"), t("الموعد", "Time"), t("بياناتك", "Details")];

  return (
    <div className="grid gap-6">
      <ol className="flex flex-wrap gap-2" aria-label={t("خطوات الحجز", "Booking steps")}>
        {steps.map((s, i) => (
          <li key={s} aria-current={step === i + 1 ? "step" : undefined} className={`badge ${step === i + 1 ? "badge-info" : ""}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <div className="card grid gap-4 p-5">
        <div className="field">
          <label htmlFor="bk-spec">{t("التخصص", "Specialty")}</label>
          <select id="bk-spec" value={specialtyId} onChange={(e) => { setSpecialtyId(e.target.value); setDoctorId(""); setBranchId(""); setSlot(""); }}>
            <option value="">{t("اختر التخصص", "Choose a specialty")}</option>
            {specialties.map((s) => <option key={s.id} value={s.id}>{nm(s)}</option>)}
          </select>
        </div>

        {specialtyId && (
          <div className="field">
            <label htmlFor="bk-doc">{t("الطبيب", "Doctor")}</label>
            <select id="bk-doc" value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setBranchId(""); setSlot(""); }}>
              <option value="">{t("اختر الطبيب", "Choose a doctor")}</option>
              {docs.map((d) => <option key={d.id} value={d.id}>{nm(d)}</option>)}
            </select>
          </div>
        )}

        {doctor && (
          <div className="field">
            <label htmlFor="bk-br">{t("الفرع", "Branch")}</label>
            <select id="bk-br" value={branchId} onChange={(e) => { setBranchId(e.target.value); setSlot(""); }}>
              <option value="">{t("اختر الفرع", "Choose a branch")}</option>
              {doctor.branches.map((b) => <option key={b.id} value={b.id}>{nm(b)}</option>)}
            </select>
          </div>
        )}
      </div>

      {doctorId && branchId && (
        <section className="card p-5" aria-labelledby="bk-slots">
          <h2 id="bk-slots" className="mb-3 text-lg font-bold">{t("اختر الموعد", "Pick a time")}</h2>
          {slots === null && <p role="status">{t("جارٍ تحميل المواعيد…", "Loading slots…")}</p>}
          {slots && slots.length === 0 && <p>{t("لا مواعيد متاحة خلال 14 يوماً. جرّب فرعاً أو طبيباً آخر.", "No slots in the next 14 days. Try another branch or doctor.")}</p>}
          <div className="grid gap-4">
            {byDay.map(([day, list]) => (
              <div key={day}>
                <p className="mb-2 font-semibold">{day}</p>
                <div className="flex flex-wrap gap-2">
                  {list.map((s) => (
                    <button key={s} type="button" aria-pressed={slot === s} onClick={() => setSlot(s)} className={`btn btn-sm ${slot === s ? "btn-primary" : "btn-ghost"}`}>
                      {fmtTime(s)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {slot && (
        <form onSubmit={submit} className="card grid gap-4 p-5" aria-labelledby="bk-details">
          <h2 id="bk-details" className="text-lg font-bold">{t("بيانات المريض", "Patient details")}</h2>
          <p className="text-sm">{fmtFull(slot)}</p>
          <div className="field">
            <label htmlFor="bk-name">{t("الاسم الكامل", "Full name")}</label>
            <input id="bk-name" required minLength={3} maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="bk-phone">{t("رقم الجوال", "Mobile number")}</label>
            <input id="bk-phone" required inputMode="tel" autoComplete="tel" placeholder="05xxxxxxxx" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="bk-nid">{t("رقم الهوية (اختياري، لربط ملفك)", "National ID (optional, links your record)")}</label>
            <input id="bk-nid" inputMode="numeric" maxLength={10} dir="ltr" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="bk-notes">{t("ملاحظات (اختياري)", "Notes (optional)")}</label>
            <textarea id="bk-notes" rows={3} maxLength={400} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p role="alert" className="alert">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? t("جارٍ الحجز…", "Booking…") : t("تأكيد الحجز", "Confirm booking")}
          </button>
        </form>
      )}
    </div>
  );
}
