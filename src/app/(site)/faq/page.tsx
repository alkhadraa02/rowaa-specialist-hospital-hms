import type { Metadata } from "next";
import { getT } from "@/lib/i18n";
import { FAQ } from "@/lib/static-content";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة",
  description: "إجابات موجزة عن الحجز والإلغاء والطوارئ والنتائج والتأمين وما تحتاجه في زيارتك الأولى لمستشفى رُواء التخصصي.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const { lang, t } = await getT();
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q.ar, acceptedAnswer: { "@type": "Answer", text: f.a.ar } })),
  };
  return (
    <div className="container-x max-w-3xl py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <h1 className="text-3xl font-bold">{t("الأسئلة الشائعة", "Frequently asked questions")}</h1>
      <div className="mt-6 space-y-3">
        {FAQ.map((f) => (
          <details key={f.q.en} className="card">
            <summary className="cursor-pointer font-semibold">{f.q[lang]}</summary>
            <p className="mt-3 leading-8">{f.a[lang]}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
