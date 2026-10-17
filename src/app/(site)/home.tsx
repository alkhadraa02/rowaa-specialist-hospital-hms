import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT, pick, money } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import { fmtDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "مستشفى رُواء التخصصي | حجز موعد وعيادات وطوارئ" },
  description: "احجز موعدك في مستشفى رُواء التخصصي: أكثر من 20 تخصصاً و40 طبيباً وثلاثة فروع وطوارئ على مدار الساعة. موقع تجريبي لعلامة خيالية.",
  alternates: { canonical: "/" },
  openGraph: { title: "مستشفى رُواء التخصصي", description: "رعاية متخصصة وحجز مواعيد إلكتروني.", url: "/" },
};

export default async function HomePage() {
  const { lang, t } = await getT();
  const [specialties, branches, packages, articles, news, doctorCount] = await Promise.all([
    prisma.specialty.findMany({ orderBy: [{ isCenter: "desc" }, { nameEn: "asc" }], take: 8 }),
    prisma.branch.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.package.findMany({ take: 3, orderBy: { price: "asc" } }),
    prisma.article.findMany({ take: 3, orderBy: { publishedAt: "desc" }, include: { category: true } }),
    prisma.news.findMany({ take: 3, orderBy: { publishedAt: "desc" } }),
    prisma.doctor.count(),
  ]);
  const specAll = await prisma.specialty.count();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hospital",
    name: SITE.nameEn,
    alternateName: SITE.nameAr,
    url: SITE.url,
    telephone: SITE.hotline,
    foundingDate: String(SITE.foundedYear),
    medicalSpecialty: specialties.map((s) => s.nameEn),
    availableService: { "@type": "EmergencyService", name: "Emergency department", hoursAvailable: "24/7" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="bg-brand-deep text-brand-ink">
        <div className="container-x grid gap-8 py-12 lg:grid-cols-2 lg:py-16">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              {t("رعاية متخصصة، بقلب يهتم بك", "Specialist care, with people who care")}
            </h1>
            <p className="mt-4 max-w-xl opacity-95">
              {t(
                `${specAll} تخصصاً و${doctorCount} طبيباً في ${branches.length} فروع، مع طوارئ مفتوحة على مدار الساعة وحجز إلكتروني في دقيقتين.`,
                `${specAll} specialties and ${doctorCount} doctors across ${branches.length} branches, with 24/7 emergency care and online booking in two minutes.`,
              )}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/book" className="btn bg-surface text-brand-deep hover:bg-surface-2">{t("احجز موعداً", "Book an appointment")}</Link>
              <Link href="/portal" className="btn btn-ghost border-brand-ink/60 text-brand-ink hover:bg-brand/60">{t("بوابة المريض", "Patient portal")}</Link>
            </div>
          </div>
          <form action="/doctors" method="get" role="search" className="min-w-0 rounded-2xl bg-surface p-5 text-ink" aria-label={t("البحث عن طبيب", "Find a doctor")}>
            <h2 className="text-lg font-bold">{t("ابحث عن طبيب", "Find a doctor")}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="field sm:col-span-2">
                <label htmlFor="q">{t("اسم الطبيب أو الشكوى", "Doctor name or keyword")}</label>
                <input id="q" name="q" className="input" placeholder={t("مثال: قلب", "e.g. cardiology")} />
              </div>
              <div className="field">
                <label htmlFor="specialty">{t("التخصص", "Specialty")}</label>
                <select id="specialty" name="specialty" className="select" defaultValue="">
                  <option value="">{t("كل التخصصات", "All specialties")}</option>
                  {(await prisma.specialty.findMany({ orderBy: { nameEn: "asc" } })).map((s) => (
                    <option key={s.id} value={s.slug}>{pick(lang, s.nameAr, s.nameEn)}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="branch">{t("الفرع", "Branch")}</label>
                <select id="branch" name="branch" className="select" defaultValue="">
                  <option value="">{t("كل الفروع", "All branches")}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.slug}>{pick(lang, b.nameAr, b.nameEn)}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary mt-4 w-full">{t("بحث", "Search")}</button>
          </form>
        </div>
      </section>

      <section className="container-x mt-10" aria-labelledby="stats-h">
        <h2 id="stats-h" className="sr-only">{t("أرقام عن المستشفى", "Hospital in numbers")}</h2>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            [String(doctorCount), t("طبيباً واستشارياً", "Doctors & consultants")],
            [String(SITE.stats.beds), t("سريراً", "Beds")],
            [String(specAll), t("تخصصاً", "Specialties")],
            [String(SITE.stats.accreditations), t("اعتمادات جودة", "Quality accreditations")],
          ].map(([n, l]) => (
            <div key={l} className="card text-center">
              <dt className="text-sm text-soft">{l}</dt>
              <dd className="text-3xl font-bold text-brand-deep">{n}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="container-x mt-12" aria-labelledby="spec-h">
        <div className="flex items-end justify-between gap-3">
          <h2 id="spec-h" className="text-2xl font-bold">{t("مراكز التميّز والتخصصات", "Centers of excellence & specialties")}</h2>
          <Link href="/specialties" className="text-sm font-semibold text-brand underline">{t("عرض الكل", "View all")}</Link>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {specialties.map((s) => (
            <li key={s.id}>
              <Link href={`/specialties/${s.slug}`} className="card card-link h-full">
                <span aria-hidden="true" className="text-2xl">{s.icon}</span>
                <h3 className="mt-2 font-bold">{pick(lang, s.nameAr, s.nameEn)}</h3>
                {s.isCenter && <span className="badge badge-info mt-1">{t("مركز تميّز", "Center of excellence")}</span>}
                <p className="mt-2 line-clamp-2 text-sm text-soft">{pick(lang, s.descAr, s.descEn)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-x mt-12" aria-labelledby="br-h">
        <h2 id="br-h" className="text-2xl font-bold">{t("فروعنا", "Our branches")}</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {branches.map((b) => (
            <li key={b.id}>
              <Link href={`/branches/${b.slug}`} className="card card-link h-full">
                <h3 className="font-bold">{pick(lang, b.nameAr, b.nameEn)}</h3>
                <p className="text-sm text-soft">{pick(lang, b.city, b.cityEn)} · {b.beds} {t("سرير", "beds")}</p>
                <p className="mt-2 text-sm">{pick(lang, b.addressAr, b.addressEn)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-x mt-12" aria-labelledby="pk-h">
        <div className="flex items-end justify-between gap-3">
          <h2 id="pk-h" className="text-2xl font-bold">{t("باقات وعروض", "Packages & offers")}</h2>
          <Link href="/packages" className="text-sm font-semibold text-brand underline">{t("كل الباقات", "All packages")}</Link>
        </div>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {packages.map((p) => (
            <li key={p.id} className="card">
              <h3 className="font-bold">{pick(lang, p.nameAr, p.nameEn)}</h3>
              <p className="mt-1 text-sm text-soft">{pick(lang, p.descAr, p.descEn)}</p>
              <p className="mt-3 font-bold text-brand-deep">
                {money(p.offerPrice ?? p.price, lang)}
                {p.offerPrice ? <s className="ms-2 text-sm font-normal text-soft">{money(p.price, lang)}</s> : null}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-x mt-12 grid gap-8 lg:grid-cols-2">
        <div aria-labelledby="art-h">
          <div className="flex items-end justify-between gap-3">
            <h2 id="art-h" className="text-2xl font-bold">{t("الثقافة الصحية", "Health library")}</h2>
            <Link href="/articles" className="text-sm font-semibold text-brand underline">{t("المزيد", "More")}</Link>
          </div>
          <ul className="mt-4 space-y-3">
            {articles.map((a) => (
              <li key={a.id}>
                <Link href={`/articles/${a.slug}`} className="card card-link">
                  <span className="badge">{pick(lang, a.category.nameAr, a.category.nameEn)}</span>
                  <h3 className="mt-1 font-bold">{pick(lang, a.titleAr, a.titleEn)}</h3>
                  <p className="text-sm text-soft">{a.readMin} {t("دقائق قراءة", "min read")}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div aria-labelledby="news-h">
          <div className="flex items-end justify-between gap-3">
            <h2 id="news-h" className="text-2xl font-bold">{t("آخر الأخبار", "Latest news")}</h2>
            <Link href="/news" className="text-sm font-semibold text-brand underline">{t("كل الأخبار", "All news")}</Link>
          </div>
          <ul className="mt-4 space-y-3">
            {news.map((n) => (
              <li key={n.id}>
                <Link href={`/news/${n.slug}`} className="card card-link">
                  <p className="text-xs text-soft">{fmtDate(n.publishedAt, lang)}</p>
                  <h3 className="font-bold">{pick(lang, n.titleAr, n.titleEn)}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
