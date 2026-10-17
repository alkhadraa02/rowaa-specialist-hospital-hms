import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const b = await prisma.branch.findUnique({ where: { slug } });
  if (!b) return { title: "الفرع غير موجود" };
  return {
    title: `${b.nameAr}`.slice(0, 60),
    description: `${b.descAr} ${b.addressAr}`.slice(0, 158).padEnd(50, "."),
    alternates: { canonical: `/branches/${b.slug}` },
    openGraph: { title: b.nameAr, url: `/branches/${b.slug}` },
  };
}

export default async function BranchPage({ params }: Props) {
  const { slug } = await params;
  const { lang, t } = await getT();
  const b = await prisma.branch.findUnique({
    where: { slug },
    include: { doctors: { include: { doctor: { include: { specialty: true } } } } },
  });
  if (!b) notFound();
  const doctors = b.doctors.map((x) => x.doctor).sort((a, c) => a.nameAr.localeCompare(c.nameAr, "ar"));
  const ld = {
    "@context": "https://schema.org",
    "@type": "Hospital",
    name: b.nameAr,
    telephone: b.phone,
    address: { "@type": "PostalAddress", streetAddress: b.addressAr, addressLocality: b.city, addressCountry: "SA" },
  };
  return (
    <div className="container-x py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav aria-label={t("مسار التنقل", "Breadcrumb")} className="mb-3 text-sm">
        <Link href="/branches" className="underline">{t("فروعنا", "Our branches")}</Link>
      </nav>
      <h1 className="mb-2 text-3xl font-bold">{lang === "ar" ? b.nameAr : b.nameEn}</h1>
      <p className="mb-4 max-w-2xl">{lang === "ar" ? b.descAr : b.descEn}</p>
      <dl className="card mb-6 grid gap-2 p-5 sm:grid-cols-2">
        <div><dt className="font-semibold">{t("العنوان", "Address")}</dt><dd>{lang === "ar" ? b.addressAr : b.addressEn}</dd></div>
        <div><dt className="font-semibold">{t("الهاتف", "Phone")}</dt><dd dir="ltr" className="text-start">{b.phone}</dd></div>
        <div><dt className="font-semibold">{t("ساعات العمل", "Hours")}</dt><dd>{b.hours}</dd></div>
        <div><dt className="font-semibold">{t("السعة", "Capacity")}</dt><dd>{b.beds} {t("سريراً", "beds")} · {b.clinics} {t("عيادة", "clinics")}</dd></div>
      </dl>
      <h2 className="mb-3 text-2xl font-bold">{t("أطباء الفرع", "Doctors at this branch")}</h2>
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {doctors.map((d) => (
          <li key={d.id} className="card p-4">
            <Link href={`/doctors/${d.slug}`} className="font-bold hover:underline">{lang === "ar" ? d.nameAr : d.nameEn}</Link>
            <p className="text-sm">{lang === "ar" ? d.specialty.nameAr : d.specialty.nameEn}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6"><Link href="/book" className="btn btn-primary">{t("احجز موعداً", "Book an appointment")}</Link></div>
    </div>
  );
}
