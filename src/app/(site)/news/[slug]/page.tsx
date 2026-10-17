import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT, pick } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const n = await prisma.news.findUnique({ where: { slug } });
  if (!n) return { title: "الخبر غير موجود" };
  return {
    title: n.titleAr.slice(0, 60),
    description: n.excerptAr.slice(0, 158).padEnd(50, "."),
    alternates: { canonical: `/news/${n.slug}` },
    openGraph: { title: n.titleAr, type: "article", url: `/news/${n.slug}` },
  };
}

export default async function NewsItemPage({ params }: Props) {
  const { slug } = await params;
  const { lang, t } = await getT();
  const n = await prisma.news.findUnique({ where: { slug } });
  if (!n) notFound();
  const df = new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-GB", { dateStyle: "long" });
  const paras = pick(lang, n.bodyAr, n.bodyEn).split(/\n{1,2}/).filter(Boolean);
  return (
    <article className="container-x max-w-3xl py-10">
      <p className="text-sm"><Link href="/news" className="underline">{t("الأخبار", "News")}</Link></p>
      <h1 className="mt-2 text-3xl font-bold">{pick(lang, n.titleAr, n.titleEn)}</h1>
      <p className="mt-2 text-sm text-soft">{df.format(n.publishedAt)}</p>
      <div className="mt-6 space-y-4 leading-8">{paras.map((p, i) => <p key={i}>{p}</p>)}</div>
    </article>
  );
}
