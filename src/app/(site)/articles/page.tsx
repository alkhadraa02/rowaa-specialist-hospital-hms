import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT, pick } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "التثقيف الصحي",
  description: "مقالات تثقيف صحي كتبها أطباء مستشفى رُواء التخصصي في القلب والسكري والأطفال والتغذية والوقاية، مصنفة حسب الموضوع.",
  alternates: { canonical: "/articles" },
};

type Props = { searchParams: Promise<{ cat?: string }> };

export default async function ArticlesPage({ searchParams }: Props) {
  const { cat } = await searchParams;
  const { lang, t } = await getT();
  const cats = await prisma.articleCategory.findMany({ orderBy: { nameEn: "asc" } });
  const articles = await prisma.article.findMany({
    where: cat ? { category: { slug: cat } } : undefined,
    orderBy: { publishedAt: "desc" },
    include: { category: true },
  });
  const df = new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-GB", { dateStyle: "medium" });
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold">{t("التثقيف الصحي", "Health education")}</h1>
      <nav aria-label={t("تصنيفات المقالات", "Article categories")} className="mt-4 flex flex-wrap gap-2">
        <Link href="/articles" aria-current={!cat ? "page" : undefined} className="btn btn-outline btn-sm">{t("الكل", "All")}</Link>
        {cats.map((c) => (
          <Link key={c.id} href={`/articles?cat=${c.slug}`} aria-current={cat === c.slug ? "page" : undefined} className="btn btn-outline btn-sm">{pick(lang, c.nameAr, c.nameEn)}</Link>
        ))}
      </nav>
      {articles.length === 0 ? (
        <p className="card mt-6 p-6">{t("لا توجد مقالات في هذا التصنيف.", "No articles in this category.")}</p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <li key={a.id}>
              <Link href={`/articles/${a.slug}`} className="card card-link h-full">
                <p className="text-xs text-soft">{pick(lang, a.category.nameAr, a.category.nameEn)} · {a.readMin} {t("دقائق قراءة", "min read")}</p>
                <h2 className="mt-1 text-lg font-bold">{pick(lang, a.titleAr, a.titleEn)}</h2>
                <p className="mt-2 line-clamp-3 text-sm">{pick(lang, a.excerptAr, a.excerptEn)}</p>
                <p className="mt-2 text-xs text-soft">{df.format(a.publishedAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
