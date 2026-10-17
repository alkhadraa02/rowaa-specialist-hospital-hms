import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

const STATIC = ["", "/specialties", "/doctors", "/book", "/branches", "/packages", "/insurance", "/articles", "/news", "/careers", "/portal", "/visitor-guide", "/patient-rights", "/contact", "/about", "/faq"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [specialties, doctors, branches, articles, news, jobs] = await Promise.all([
    prisma.specialty.findMany({ select: { slug: true } }),
    prisma.doctor.findMany({ select: { slug: true } }),
    prisma.branch.findMany({ select: { slug: true } }),
    prisma.article.findMany({ select: { slug: true } }),
    prisma.news.findMany({ select: { slug: true } }),
    prisma.job.findMany({ select: { slug: true } }),
  ]);
  const paths = [
    ...STATIC,
    ...specialties.map((x) => `/specialties/${x.slug}`),
    ...doctors.map((x) => `/doctors/${x.slug}`),
    ...branches.map((x) => `/branches/${x.slug}`),
    ...articles.map((x) => `/articles/${x.slug}`),
    ...news.map((x) => `/news/${x.slug}`),
    ...jobs.map((x) => `/careers/${x.slug}`),
  ];
  return paths.map((p) => ({ url: `${SITE.url}${p}`, lastModified: new Date() }));
}
