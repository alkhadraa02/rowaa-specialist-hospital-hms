import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT, pick } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await prisma.specialty.findUnique({ where: { slug } });
  if (!s) return { title: "التخصص غير موجود" };
  return {
    title: `${s.nameAr} | ${s.nameEn}`.slice(0, 60),
    description: s.descAr.slice(0, 158),
    alternates: { canonical: `/specialties/${s.slug}` },
    openGraph: { title: s.nameAr, description: s.descAr.slice(0, 158), url: `/specialties/${s.slug}` },
  };
}

export default async function SpecialtyPage({ params }: Props) {
  const { slug } = await params;
  const { lang, t } = await getT();
  const s = await prisma.specialty.findUnique({ where: { slug }, include: { doctors: { orderBy: { rating: "desc" }, take: 12 } } });
  if (!s) notFound();
  const services = pick(lang, s.servicesAr, s.servicesEn).split("|");
  return (
    <div className="container-x py-10">
      <nav aria-label={t("مسار التنقل", "Breadcrumb")} className="text-sm text-soft">
        <Link href="/specialties" className="underline">{t("التخصصات", "Specialties")}</Link> / {pick(lang, s.nameAr, s.nameEn)}
      </nav>
      <h1 className="mt-2 text-3xl font-bold">
        <span aria-hidden="true">{s.icon} </span>{pick(lang, s.nameAr, s.nameEn)}
      </h1>
      {s.isCenter && <span className="badge badge-info mt-2">{t("مركز تميّز", "Center of excellence")}</span>}
      <p className="mt-3 max-w-3xl">{pick(lang, s.descAr, s.descEn)}</p>
      <div className="mt-4"><Link href={`/book?specialty=${s.slug}`} className="btn btn-primary">{t("احجز في هذا التخصص", "Book in this specialty")}</Link></div>
      <h2 className="mt-8 text-xl font-bold">{t("الخدمات", "Services")}</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((x) => <li key={x} className="card py-3">{x}</li>)}
      </ul>
      <h2 className="mt-8 text-xl font-bold">{t("أطباء التخصص", "Doctors")}</h2>
      {s.doctors.length === 0 ? (
        <p className="alert alert-info mt-3">{t("لا يوجد أطباء مدرجون حالياً.", "No doctors are listed yet.")}</p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {s.doctors.map((d) => (
            <li key={d.id}>
              <Link href={`/doctors/${d.slug}`} className="card card-link h-full">
                <h3 className="font-bold">{pick(lang, d.nameAr, d.nameEn)}</h3>
                <p className="text-sm text-soft">{pick(lang, d.titleAr, d.titleEn)}</p>
                <p className="mt-1 text-sm">{d.experience} {t("سنة خبرة", "years of experience")} · ★ {d.rating.toFixed(1)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
