import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT, pick } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "أخبار المستشفى",
  description: "آخر أخبار مستشفى رُواء التخصصي: خدمات جديدة وفعاليات توعوية وإنجازات الفرق الطبية وإعلانات للمرضى والزوار.",
  alternates: { canonical: "/news" },
};

export default async function NewsPage() {
  const { lang, t } = await getT();
  const list = await prisma.news.findMany({ orderBy: { publishedAt: "desc" } });
  const df = new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-GB", { dateStyle: "long" });
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold">{t("الأخبار", "News")}</h1>
      {list.length === 0 ? (
        <p className="card mt-6 p-6">{t("لا توجد أخبار حالياً.", "No news yet.")}</p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {list.map((n) => (
            <li key={n.id}>
              <Link href={`/news/${n.slug}`} className="card card-link h-full">
                <p className="text-xs text-soft">{df.format(n.publishedAt)}</p>
                <h2 className="mt-1 text-lg font-bold">{pick(lang, n.titleAr, n.titleEn)}</h2>
                <p className="mt-2 line-clamp-3 text-sm">{pick(lang, n.excerptAr, n.excerptEn)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
