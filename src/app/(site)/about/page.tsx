import type { Metadata } from "next";
import { getT } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import { ABOUT } from "@/lib/static-content";

export const metadata: Metadata = {
  title: "من نحن",
  description: "تعرّف على رسالة مستشفى رُواء التخصصي وقيمنا وأرقامنا: أطباء وتخصصات وأسرّة واعتمادات في ثلاثة فروع، مؤسسة خيالية لأغراض العرض.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const { lang, t } = await getT();
  const ld = {
    "@context": "https://schema.org",
    "@type": "Hospital",
    name: SITE.nameAr,
    alternateName: SITE.nameEn,
    telephone: SITE.hotline,
    foundingDate: String(SITE.foundedYear),
  };
  const stats: [number, string, string][] = [
    [SITE.stats.doctors, "طبيب", "Doctors"],
    [SITE.stats.specialties, "تخصصاً", "Specialties"],
    [SITE.stats.beds, "سريراً", "Beds"],
    [SITE.stats.accreditations, "اعتمادات", "Accreditations"],
  ];
  return (
    <div className="container-x max-w-3xl py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <h1 className="text-3xl font-bold">{t("من نحن", "About us")}</h1>
      <p className="mt-4 leading-8">{ABOUT.mission[lang]}</p>
      <p className="mt-2 text-sm text-soft">{t("تأسس", "Founded")} {SITE.foundedYear}</p>
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([n, ar, en]) => (
          <div key={en} className="card text-center">
            <dd className="text-2xl font-bold">{n}</dd>
            <dt className="text-sm text-soft">{lang === "ar" ? ar : en}</dt>
          </div>
        ))}
      </dl>
      <h2 className="mt-8 text-xl font-bold">{t("قيمنا", "Our values")}</h2>
      <ul className="mt-3 list-disc space-y-2 ps-5">{ABOUT.values.map((v) => <li key={v.en}>{v[lang]}</li>)}</ul>
    </div>
  );
}
