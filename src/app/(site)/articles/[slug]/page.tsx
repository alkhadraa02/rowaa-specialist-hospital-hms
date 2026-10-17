import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT, pick } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await prisma.article.findUnique({ where: { slug } });
  if (!a) return { title: "المقال غير موجود" };
  return {
    title: a.titleAr.slice(0, 60),
    description: a.excerptAr.slice(0, 158).padEnd(50, "."),
    alternates: { canonical: `/articles/${a.slug}` },
    openGraph: { title: a.titleAr, type: "article", url: `/articles/${a.slug}` },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const { lang, t } = await getT();
  const a = await prisma.article.findUnique({ where: { slug }, include: { category: true } });
  if (!a) notFound();
  const paras = pick(lang, a.bodyAr, a.bodyEn).split(/\n{1,2}/).filter(Boolean);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.titleAr,
    datePublished: a.publishedAt.toISOString(),
    author: { "@type": "Person", name: a.authorAr },
    publisher: { "@type": "Organization", name: "مستشفى رُواء التخصصي" },
  };
  return (
    <article className="container-x max-w-3xl py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p className="text-sm"><Link href={`/articles?cat=${a.category.slug}`} className="underline">{pick(lang, a.category.nameAr, a.category.nameEn)}</Link></p>
      <h1 className="mt-2 text-3xl font-bold">{pick(lang, a.titleAr, a.titleEn)}</h1>
      <p className="mt-2 text-sm text-soft">{pick(lang, a.authorAr, a.authorEn)} · {a.readMin} {t("دقائق قراءة", "min read")}</p>
      <div className="mt-6 space-y-4 leading-8">{paras.map((p, i) => <p key={i}>{p}</p>)}</div>
      <p className="card mt-8 p-4 text-sm">{t("هذا المحتوى للتثقيف العام ولا يغني عن استشارة الطبيب.", "This content is for general education and does not replace a doctor's advice.")}</p>
      <div className="mt-6"><Link href="/book" className="btn btn-primary">{t("احجز استشارة", "Book a consultation")}</Link></div>
    </article>
  );
}
