// Deterministic ESI-style (1–5) triage suggestion from vitals + chief complaint.
// This is an ASSISTIVE rule set for a demo; a clinician must always confirm the final level.

export type Vitals = {
  hr?: number | null;
  sbp?: number | null;
  dbp?: number | null;
  rr?: number | null;
  spo2?: number | null;
  temp?: number | null;
  gcs?: number | null;
  pain?: number | null;
};

export type TriageInput = { ageYears: number; complaint: string; vitals: Vitals };
export type TriageLevel = 1 | 2 | 3 | 4 | 5;
export type TriageReason = { rule: string; ar: string; en: string };
export type TriageResult = { level: TriageLevel; reasons: TriageReason[]; resources: number };

export const TRIAGE_LABELS: Record<TriageLevel, { ar: string; en: string; target: string }> = {
  1: { ar: "إنعاش فوري", en: "Resuscitation", target: "0 min" },
  2: { ar: "طارئ جداً", en: "Emergent", target: "≤ 10 min" },
  3: { ar: "عاجل", en: "Urgent", target: "≤ 30 min" },
  4: { ar: "أقل إلحاحاً", en: "Less urgent", target: "≤ 60 min" },
  5: { ar: "غير عاجل", en: "Non-urgent", target: "≤ 120 min" },
};

export function normalizeText(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

const L1_WORDS = [
  "cardiac arrest", "not breathing", "unresponsive", "unconscious and not", "no pulse",
  "توقف القلب", "لا يتنفس", "لا يستجيب", "بدون نبض", "فاقد الوعي ولا",
];
const L2_WORDS = [
  "chest pain", "stroke", "facial droop", "slurred speech", "one side weakness", "weakness on one side",
  "shortness of breath", "difficulty breathing", "severe bleeding", "overdose", "suicid", "anaphylaxis",
  "seizure", "pregnant and bleeding", "vaginal bleeding", "severe allergic", "head injury", "confusion",
  "الم في الصدر", "الم صدر", "جلطه", "شلل", "ضعف في جهه", "تلعثم", "انحراف الوجه", "ضيق في التنفس", "ضيق تنفس",
  "نزيف شديد", "جرعه زايده", "جرعه زائده", "انتحار", "حساسيه شديده", "تشنج", "نزيف مهبلي", "ارتباك", "اصابه في الراس",
];
const R0_WORDS = [
  "refill", "medication refill", "certificate", "suture removal", "rash", "common cold", "runny nose", "mild cough", "follow up",
  "تجديد", "شهاده", "ازاله غرز", "طفح", "زكام", "رشح", "كحه بسيطه", "متابعه",
];
const R1_WORDS = [
  "laceration", "cut", "sprain", "ankle", "wrist", "sore throat", "ear pain", "earache", "urinary", "burning urination", "eye irritation", "minor burn",
  "جرح", "التواء", "كاحل", "معصم", "التهاب الحلق", "الم في الحلق", "الم الاذن", "حرقه بول", "حرقان", "تهيج العين", "حرق بسيط",
];

function has(text: string, words: string[]) {
  return words.some((w) => text.includes(normalizeText(w)));
}

export function estimateResources(complaint: string): number {
  const t = normalizeText(complaint);
  if (has(t, R0_WORDS)) return 0;
  if (has(t, R1_WORDS)) return 1;
  return 2;
}

const R = (rule: string, ar: string, en: string): TriageReason => ({ rule, ar, en });

export function suggestTriage(input: TriageInput): TriageResult {
  const v = input.vitals;
  const t = normalizeText(input.complaint);
  const child = input.ageYears < 12;
  const infant = input.ageYears < 0.25;
  const reasons: TriageReason[] = [];
  const num = (x: number | null | undefined) => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
  const hr = num(v.hr), sbp = num(v.sbp), rr = num(v.rr), spo2 = num(v.spo2), temp = num(v.temp), gcs = num(v.gcs), pain = num(v.pain);

  // ---- Level 1: immediate life-saving intervention
  if (has(t, L1_WORDS)) reasons.push(R("L1-COMPLAINT", "الشكوى توحي بتوقف التنفس أو القلب أو عدم الاستجابة", "Complaint suggests arrest, apnea or unresponsiveness"));
  if (gcs !== undefined && gcs <= 8) reasons.push(R("L1-GCS", `مقياس غلاسكو ${gcs} (≤ 8)`, `GCS ${gcs} (≤ 8)`));
  if (spo2 !== undefined && spo2 < 85) reasons.push(R("L1-SPO2", `تشبع الأكسجين ${spo2}% (< 85%)`, `SpO₂ ${spo2}% (< 85%)`));
  if (sbp !== undefined && sbp < (child ? 60 : 70)) reasons.push(R("L1-SBP", `الضغط الانقباضي ${sbp} (منخفض جداً)`, `Systolic BP ${sbp} (critically low)`));
  if (hr !== undefined && (hr < 30 || hr > (child ? 200 : 180))) reasons.push(R("L1-HR", `النبض ${hr} (خارج الحدود الحرجة)`, `Heart rate ${hr} (critical range)`));
  if (rr !== undefined && (rr < 6 || rr > 40)) reasons.push(R("L1-RR", `معدل التنفس ${rr} (خارج الحدود الحرجة)`, `Respiratory rate ${rr} (critical range)`));
  if (reasons.length) return { level: 1, reasons, resources: 3 };

  // ---- Level 2: high-risk situation / severe distress / unstable vitals
  if (has(t, L2_WORDS)) reasons.push(R("L2-COMPLAINT", "شكوى عالية الخطورة (صدر/سكتة/تنفس/نزيف/تشنج/جرعة زائدة…)", "High-risk complaint (chest/stroke/breathing/bleeding/seizure/overdose…)"));
  if (gcs !== undefined && gcs <= 13) reasons.push(R("L2-GCS", `تغيّر في الوعي: غلاسكو ${gcs}`, `Altered consciousness: GCS ${gcs}`));
  if (spo2 !== undefined && spo2 < 90) reasons.push(R("L2-SPO2", `نقص أكسجة: ${spo2}%`, `Hypoxia: SpO₂ ${spo2}%`));
  if (sbp !== undefined && sbp < (child ? 70 : 90)) reasons.push(R("L2-SBP", `انخفاض ضغط الدم: ${sbp}`, `Hypotension: ${sbp}`));
  if (hr !== undefined && (hr > (child ? 180 : 130) || hr < (child ? 60 : 45))) reasons.push(R("L2-HR", `النبض غير مستقر: ${hr}`, `Unstable heart rate: ${hr}`));
  if (rr !== undefined && rr > (child ? 40 : 30)) reasons.push(R("L2-RR", `تسرّع التنفس: ${rr}`, `Tachypnea: ${rr}`));
  if (temp !== undefined && temp >= 39.5) reasons.push(R("L2-TEMP", `حمّى شديدة: ${temp}°`, `High fever: ${temp}°`));
  if (temp !== undefined && temp >= 38.5 && hr !== undefined && hr > 110) reasons.push(R("L2-SEPSIS", "حمّى مع تسرّع قلب: يلزم استبعاد تعفّن الدم", "Fever with tachycardia: screen for sepsis"));
  if (infant && temp !== undefined && temp >= 38) reasons.push(R("L2-INFANT-FEVER", "حمّى عند رضيع أقل من 3 أشهر", "Fever in infant under 3 months"));
  if (pain !== undefined && pain >= 8) reasons.push(R("L2-PAIN", `ألم شديد: ${pain}/10`, `Severe pain: ${pain}/10`));
  if (reasons.length) return { level: 2, reasons, resources: 3 };

  // ---- Levels 3-5: expected resource use, then danger-zone vitals
  const resources = estimateResources(input.complaint);
  let level: TriageLevel = resources >= 2 ? 3 : resources === 1 ? 4 : 5;
  reasons.push(
    resources >= 2
      ? R("R-MULTI", "يُتوقَّع احتياج موارد متعددة (تحاليل/أشعة/علاج وريدي)", "Expected to need two or more resources (labs/imaging/IV therapy)")
      : resources === 1
        ? R("R-ONE", "يُتوقَّع احتياج مورد واحد (مثل أشعة أو خياطة)", "Expected to need one resource (e.g. imaging or sutures)")
        : R("R-NONE", "لا يُتوقَّع احتياج موارد (فحص ووصفة فقط)", "No resources expected (exam and prescription only)"),
  );

  const danger: string[] = [];
  if (spo2 !== undefined && spo2 < 92) danger.push("spo2");
  if (hr !== undefined && hr > (child ? 160 : 100)) danger.push("hr");
  if (rr !== undefined && rr > (child ? 34 : 20)) danger.push("rr");
  if (level === 3 && (spo2 !== undefined && spo2 < 92 || (danger.includes("hr") && danger.includes("rr")))) {
    level = 2;
    reasons.push(R("DZ-UP2", "علامات حيوية في منطقة الخطر: رُفع المستوى إلى 2", "Danger-zone vitals: upgraded to level 2"));
  } else if (level >= 4 && danger.length) {
    level = 3;
    reasons.push(R("DZ-UP3", "علامات حيوية في منطقة الخطر: رُفع المستوى إلى 3", "Danger-zone vitals: upgraded to level 3"));
  }
  return { level, reasons, resources };
}

export function formatReasons(reasons: TriageReason[], lang: "ar" | "en") {
  return reasons.map((r) => (lang === "ar" ? r.ar : r.en));
}
