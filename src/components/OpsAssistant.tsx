"use client";

import { useState } from "react";

type Reply = { answer: string; provider: string; mock: boolean; label: string };

export function OpsAssistant({ lang }: { lang: "ar" | "en" }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reply, setReply] = useState<Reply | null>(null);
  const ar = lang === "ar";
  const samples = ar
    ? ["كم نسبة إشغال الأسرّة الآن؟", "كم مريضاً ينتظر في الطوارئ؟", "هل هناك أدوية تحتاج إعادة طلب؟"]
    : ["What is the bed occupancy now?", "How many patients wait in the ER?", "Which drugs need reordering?"];

  async function ask(question: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/hms/ops", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question, lang }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "error");
      setReply(data);
    } catch {
      setError(ar ? "تعذّر الحصول على إجابة. حاول مرة أخرى." : "Could not get an answer. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="ops-h" className="card">
      <h2 id="ops-h" className="text-lg font-bold">{ar ? "مساعد العمليات (ذكاء اصطناعي)" : "Operations assistant (AI)"}</h2>
      <p className="hint mt-1">{ar ? "يجيب من مؤشرات اليوم المحسوبة فقط." : "Answers only from today's computed KPIs."}</p>
      <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (q.trim().length >= 2) ask(q.trim()); }}>
        <div className="field min-w-0 flex-1 basis-64">
          <label htmlFor="ops-q" className="sr-only">{ar ? "سؤالك" : "Your question"}</label>
          <input id="ops-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} maxLength={300} placeholder={ar ? "اسأل عن مؤشرات اليوم…" : "Ask about today's KPIs…"} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy || q.trim().length < 2}>{busy ? (ar ? "جارٍ التفكير…" : "Thinking…") : ar ? "اسأل" : "Ask"}</button>
      </form>
      <ul className="mt-2 flex flex-wrap gap-2">
        {samples.map((s) => (
          <li key={s}><button type="button" className="btn btn-ghost btn-sm" onClick={() => { setQ(s); ask(s); }} disabled={busy}>{s}</button></li>
        ))}
      </ul>
      <div aria-live="polite" className="mt-3">
        {error ? <p role="alert" className="alert alert-danger">{error}</p> : null}
        {reply ? (
          <div className="ai-box">
            <p className="text-xs font-bold">{reply.label} · {reply.provider}{reply.mock ? (ar ? " (محاكاة)" : " (mock)") : ""}</p>
            <p className="mt-1 whitespace-pre-line">{reply.answer}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
