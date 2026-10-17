// AiProvider: every AI output is ASSISTIVE. It is stored with its provider name and must be
// confirmed by a named clinician/staff member before it counts as part of the record.

import type { Lang } from "./time";

export type AiOutput = { text: string; provider: string; mock: boolean };

export type TriageContext = {
  level: number;
  reasons: string[];
  complaint: string;
  ageYears: number;
  vitals: Record<string, number | null | undefined>;
  lang: Lang;
};

export type NoteContext = {
  complaint: string | null;
  vitals: Record<string, number | null | undefined>;
  diagnoses: string[];
  notes: string;
  orders: string[];
  lang: Lang;
};

export type OpsKpis = {
  visitsToday: number;
  erWaitingNow: number;
  erAvgWaitMin: number;
  occupancyPct: number;
  occupiedBeds: number;
  totalBeds: number;
  revenueToday: number;
  labTurnaroundMin: number;
  pendingLab: number;
  pendingRadiology: number;
  lowStockDrugs: number;
  forecastPeakPct: number;
  forecastPeakDay: number;
};

export interface AiProvider {
  readonly name: string;
  readonly mock: boolean;
  explainTriage(ctx: TriageContext): Promise<AiOutput>;
  summarizeNote(ctx: NoteContext): Promise<AiOutput>;
  answerOps(question: string, kpis: OpsKpis, lang: Lang): Promise<AiOutput>;
}

const fmt = (n: number, d = 0) => (Math.round(n * 10 ** d) / 10 ** d).toString();

function vitalsLine(v: Record<string, number | null | undefined>, lang: Lang) {
  const parts: string[] = [];
  const add = (k: string, ar: string, en: string, unit = "") => {
    const x = v[k];
    if (x !== null && x !== undefined) parts.push(`${lang === "ar" ? ar : en} ${x}${unit}`);
  };
  add("hr", "النبض", "HR");
  add("sbp", "الضغط الانقباضي", "SBP");
  add("rr", "التنفس", "RR");
  add("spo2", "الأكسجة", "SpO₂", "%");
  add("temp", "الحرارة", "Temp", "°");
  add("gcs", "غلاسكو", "GCS");
  add("pain", "الألم", "Pain");
  return parts.join(lang === "ar" ? "، " : ", ");
}

export class MockAiProvider implements AiProvider {
  readonly name = "mock-rules";
  readonly mock = true;

  async explainTriage(c: TriageContext): Promise<AiOutput> {
    const vit = vitalsLine(c.vitals, c.lang);
    const text =
      c.lang === "ar"
        ? `اقتراح المستوى ${c.level}. الشكوى: «${c.complaint}». العلامات الحيوية: ${vit || "غير مسجّلة"}. الأسباب: ${c.reasons.join("؛ ")}. هذا شرح آلي للقواعد المطبّقة وليس تشخيصاً، ويجب أن يؤكد الطبيب أو الممرض المستوى النهائي.`
        : `Suggested level ${c.level}. Complaint: "${c.complaint}". Vitals: ${vit || "not recorded"}. Reasons: ${c.reasons.join("; ")}. This is an automated explanation of the rules applied, not a diagnosis; a clinician must confirm the final level.`;
    return { text, provider: this.name, mock: true };
  }

  async summarizeNote(c: NoteContext): Promise<AiOutput> {
    const vit = vitalsLine(c.vitals, c.lang);
    const dx = c.diagnoses.length ? c.diagnoses.join(c.lang === "ar" ? "، " : ", ") : c.lang === "ar" ? "لا تشخيص مسجّل" : "no diagnosis recorded";
    const ord = c.orders.length ? c.orders.join(c.lang === "ar" ? "، " : ", ") : c.lang === "ar" ? "لا طلبات" : "no orders";
    const notes = c.notes.trim().replace(/\s+/g, " ").slice(0, 280);
    const text =
      c.lang === "ar"
        ? `ملخص مقترح: الشكوى الرئيسية «${c.complaint ?? "غير مذكورة"}». العلامات الحيوية: ${vit || "غير مسجّلة"}. التشخيصات: ${dx}. الطلبات: ${ord}. من الملاحظات: ${notes || "لا ملاحظات"}.`
        : `Suggested summary: chief complaint "${c.complaint ?? "not stated"}". Vitals: ${vit || "not recorded"}. Diagnoses: ${dx}. Orders: ${ord}. From the notes: ${notes || "no notes"}.`;
    return { text, provider: this.name, mock: true };
  }

  async answerOps(q: string, k: OpsKpis, lang: Lang): Promise<AiOutput> {
    const s = q.toLowerCase();
    const has = (...w: string[]) => w.some((x) => s.includes(x));
    const ar = lang === "ar";
    let text: string;
    if (has("bed", "occup", "سرير", "أسرّة", "اسرة", "اشغال", "إشغال")) {
      text = ar
        ? `الإشغال الحالي ${fmt(k.occupancyPct)}% (${k.occupiedBeds} من ${k.totalBeds} سريراً). التوقع الأعلى خلال 7 أيام: ${fmt(k.forecastPeakPct)}% في اليوم ${k.forecastPeakDay}.`
        : `Current occupancy is ${fmt(k.occupancyPct)}% (${k.occupiedBeds} of ${k.totalBeds} beds). 7-day forecast peak: ${fmt(k.forecastPeakPct)}% on day ${k.forecastPeakDay}.`;
    } else if (has("er", "emergency", "wait", "طوارئ", "انتظار")) {
      text = ar
        ? `في الطوارئ ${k.erWaitingNow} مريضاً بانتظار الطبيب الآن، ومتوسط الانتظار اليوم ${fmt(k.erAvgWaitMin)} دقيقة.`
        : `${k.erWaitingNow} patients are waiting in the ER now; today's average wait is ${fmt(k.erAvgWaitMin)} minutes.`;
    } else if (has("revenue", "income", "invoice", "إيراد", "ايراد", "فوات", "دخل")) {
      text = ar ? `إيراد اليوم المفوتر ${fmt(k.revenueToday, 2)} ريال شاملاً ضريبة القيمة المضافة.` : `Today's invoiced revenue is SAR ${fmt(k.revenueToday, 2)} including VAT.`;
    } else if (has("lab", "turnaround", "مختبر", "تحليل")) {
      text = ar
        ? `متوسط زمن إنجاز التحاليل اليوم ${fmt(k.labTurnaroundMin)} دقيقة، وهناك ${k.pendingLab} طلب مخبري معلّق و${k.pendingRadiology} طلب أشعة معلّق.`
        : `Average lab turnaround today is ${fmt(k.labTurnaroundMin)} minutes; ${k.pendingLab} lab and ${k.pendingRadiology} radiology orders are pending.`;
    } else if (has("visit", "patient", "زيار", "مرضى", "مريض")) {
      text = ar ? `عدد زيارات اليوم (عيادات وطوارئ) ${k.visitsToday}.` : `Today's visits (outpatient and ER): ${k.visitsToday}.`;
    } else if (has("stock", "drug", "pharm", "مخزون", "دواء", "صيدل")) {
      text = ar ? `${k.lowStockDrugs} صنفاً دوائياً تحت حدّ إعادة الطلب.` : `${k.lowStockDrugs} drugs are at or below their reorder level.`;
    } else {
      text = ar
        ? `ملخص اليوم: ${k.visitsToday} زيارة، ${k.erWaitingNow} بانتظار الطوارئ (متوسط ${fmt(k.erAvgWaitMin)} د)، إشغال الأسرّة ${fmt(k.occupancyPct)}%، الإيراد ${fmt(k.revenueToday, 2)} ريال، زمن المختبر ${fmt(k.labTurnaroundMin)} د، و${k.lowStockDrugs} صنفاً تحت حدّ الطلب.`
        : `Today: ${k.visitsToday} visits, ${k.erWaitingNow} waiting in ER (avg ${fmt(k.erAvgWaitMin)} min), bed occupancy ${fmt(k.occupancyPct)}%, revenue SAR ${fmt(k.revenueToday, 2)}, lab turnaround ${fmt(k.labTurnaroundMin)} min, ${k.lowStockDrugs} drugs below reorder level.`;
    }
    return { text, provider: this.name, mock: true };
  }
}

/** OpenAI-compatible chat completions provider. Only used when AI_API_KEY is set. */
export class HttpAiProvider implements AiProvider {
  readonly mock = false;
  readonly name: string;
  private fallback = new MockAiProvider();

  constructor(
    private apiKey: string,
    private baseUrl: string,
    private model: string,
  ) {
    this.name = `llm:${model}`;
  }

  private async chat(system: string, user: string): Promise<string | null> {
    try {
      const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.2,
          max_tokens: 400,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return null;
      const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      return j.choices?.[0]?.message?.content?.trim() || null;
    } catch {
      return null;
    }
  }

  private sys(lang: Lang) {
    return `You assist hospital staff in a DEMO system. Reply in ${lang === "ar" ? "Arabic" : "English"}, at most 120 words. Never give a diagnosis or treatment instruction; you only explain given data. A clinician makes every decision.`;
  }

  async explainTriage(c: TriageContext): Promise<AiOutput> {
    const base = await this.fallback.explainTriage(c);
    const out = await this.chat(this.sys(c.lang), `Explain this rule-based triage suggestion to a nurse.\n${JSON.stringify(c)}`);
    return out ? { text: out, provider: this.name, mock: false } : { ...base, text: base.text };
  }

  async summarizeNote(c: NoteContext): Promise<AiOutput> {
    const base = await this.fallback.summarizeNote(c);
    const out = await this.chat(this.sys(c.lang), `Summarize this encounter note in 3 short sentences.\n${JSON.stringify(c)}`);
    return out ? { text: out, provider: this.name, mock: false } : base;
  }

  async answerOps(q: string, k: OpsKpis, lang: Lang): Promise<AiOutput> {
    const base = await this.fallback.answerOps(q, k, lang);
    const out = await this.chat(this.sys(lang), `Answer ONLY from these KPIs: ${JSON.stringify(k)}\nQuestion: ${q}`);
    return out ? { text: out, provider: this.name, mock: false } : base;
  }
}

export function getAiProvider(env: Record<string, string | undefined> = process.env): AiProvider {
  const key = env.AI_API_KEY?.trim();
  if (key) return new HttpAiProvider(key, env.AI_BASE_URL?.trim() || "https://api.openai.com/v1", env.AI_MODEL?.trim() || "gpt-4o-mini");
  return new MockAiProvider();
}

export const AI_LABEL = {
  ar: "اقتراح بالذكاء الاصطناعي — يتطلب مراجعة وتأكيد الطبيب",
  en: "AI suggestion — requires clinician review and confirmation",
};
