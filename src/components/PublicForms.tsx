"use client";

import { useState } from "react";

type Labels = {
  name: string;
  email: string;
  phone: string;
  subject?: string;
  message?: string;
  cover?: string;
  submit: string;
  sending: string;
  success: string;
  error: string;
  invalid: string;
};

type Status = "idle" | "sending" | "ok" | "error" | "invalid";

async function post(url: string, data: Record<string, string>): Promise<Status> {
  try {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    if (r.ok) return "ok";
    return r.status === 422 ? "invalid" : "error";
  } catch {
    return "error";
  }
}

function Feedback({ status, l }: { status: Status; l: Labels }) {
  if (status === "ok") return <p role="status" className="badge badge-ok">{l.success}</p>;
  if (status === "invalid") return <p role="alert" className="badge badge-warn">{l.invalid}</p>;
  if (status === "error") return <p role="alert" className="badge badge-danger">{l.error}</p>;
  return null;
}

function fromForm(form: HTMLFormElement) {
  const out: Record<string, string> = {};
  new FormData(form).forEach((v, k) => {
    if (typeof v === "string") out[k] = v;
  });
  return out;
}

export function ContactForm({ l }: { l: Labels }) {
  const [status, setStatus] = useState<Status>("idle");
  return (
    <form
      className="card grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setStatus("sending");
        const s = await post("/api/contact", fromForm(form));
        setStatus(s);
        if (s === "ok") form.reset();
      }}
    >
      <div className="field"><label htmlFor="c-name">{l.name}</label><input id="c-name" name="name" className="input" required minLength={2} maxLength={80} autoComplete="name" /></div>
      <div className="field"><label htmlFor="c-email">{l.email}</label><input id="c-email" name="email" type="email" className="input" required autoComplete="email" dir="ltr" /></div>
      <div className="field"><label htmlFor="c-phone">{l.phone}</label><input id="c-phone" name="phone" type="tel" className="input" autoComplete="tel" dir="ltr" placeholder="05xxxxxxxx" /></div>
      <div className="field"><label htmlFor="c-subject">{l.subject}</label><input id="c-subject" name="subject" className="input" required minLength={3} maxLength={120} /></div>
      <div className="field"><label htmlFor="c-message">{l.message}</label><textarea id="c-message" name="message" className="textarea" rows={5} required minLength={10} maxLength={2000} /></div>
      <button type="submit" className="btn btn-primary self-start" disabled={status === "sending"}>{status === "sending" ? l.sending : l.submit}</button>
      <Feedback status={status} l={l} />
    </form>
  );
}

export function ApplyForm({ jobId, l }: { jobId: string; l: Labels }) {
  const [status, setStatus] = useState<Status>("idle");
  return (
    <form
      className="card grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setStatus("sending");
        const s = await post("/api/applications", { ...fromForm(form), jobId });
        setStatus(s);
        if (s === "ok") form.reset();
      }}
    >
      <div className="field"><label htmlFor="a-name">{l.name}</label><input id="a-name" name="name" className="input" required minLength={3} maxLength={80} autoComplete="name" /></div>
      <div className="field"><label htmlFor="a-email">{l.email}</label><input id="a-email" name="email" type="email" className="input" required autoComplete="email" dir="ltr" /></div>
      <div className="field"><label htmlFor="a-phone">{l.phone}</label><input id="a-phone" name="phone" type="tel" className="input" required autoComplete="tel" dir="ltr" placeholder="05xxxxxxxx" /></div>
      <div className="field"><label htmlFor="a-cover">{l.cover}</label><textarea id="a-cover" name="cover" className="textarea" rows={4} maxLength={2000} /></div>
      <button type="submit" className="btn btn-primary self-start" disabled={status === "sending"}>{status === "sending" ? l.sending : l.submit}</button>
      <Feedback status={status} l={l} />
    </form>
  );
}
