import type { Metadata } from "next";
import { getT } from "@/lib/i18n";
import { VISITOR } from "@/lib/static-content";

export const metadata: Metadata = {
  title: "دليل الزائر",
  description: "كل ما يحتاجه زائر مستشفى رُواء التخصصي: ساعات الزيارة والمواقف وخدمات الوصول وإرشادات السلامة والخصوصية داخل الأقسام.",
  alternates: { canonical: "/visitor-guide" },
};

export default async function VisitorGuidePage() {
  const { lang, t } = await getT();
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="text-3xl font-bold">{t("دليل الزائر", "Visitor guide")}</h1>
      {VISITOR.map((s) => (
        <section key={s.h.en} className="card mt-6">
          <h2 className="text-xl font-bold">{s.h[lang]}</h2>
          <ul className="mt-3 list-disc space-y-2 ps-5 leading-8">{s.items.map((i) => <li key={i.en}>{i[lang]}</li>)}</ul>
        </section>
      ))}
    </div>
  );
}
