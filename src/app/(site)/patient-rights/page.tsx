import type { Metadata } from "next";
import { getT } from "@/lib/i18n";
import { RIGHTS } from "@/lib/static-content";

export const metadata: Metadata = {
  title: "حقوق المريض ومسؤولياته",
  description: "حقوق المريض في مستشفى رُواء التخصصي: الرعاية الكريمة والمعلومة والموافقة المستنيرة والخصوصية والرأي الثاني وتقديم الشكوى.",
  alternates: { canonical: "/patient-rights" },
};

export default async function PatientRightsPage() {
  const { lang, t } = await getT();
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="text-3xl font-bold">{t("حقوق المريض", "Patient rights")}</h1>
      <div className="mt-6 space-y-4">
        {RIGHTS.map((r) => (
          <section key={r.h.en} className="card">
            <h2 className="text-lg font-bold">{r.h[lang]}</h2>
            <p className="mt-2 leading-8">{r.p[lang]}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
