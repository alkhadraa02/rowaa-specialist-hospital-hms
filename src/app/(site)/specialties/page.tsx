import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT, pick } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "التخصصات ومراكز التميّز",
  description: "تعرّف على أكثر من 20 تخصصاً طبياً ومراكز التميّز في مستشفى رُواء التخصصي، واحجز مع الطبيب المناسب.",
  alternates: { canonical: "/specialties" },
};

export default async function SpecialtiesPage() {
  const { lang, t } = await getT();
  const list = await prisma.specialty.findMany({ orderBy: { nameEn: "asc" }, include: { _count: { select: { doctors: true } } } });
  const centers = list.filter((s) => s.isCenter);
  const others = list.filter((s) => !s.isCenter);
  const card = (s: (typeof list)[number]) => (
    <li key={s.id}>
      <Link href={`/specialties/${s.slug}`} className="card card-link h-full">
        <span aria-hidden="true" className="text-2xl">{s.icon}</span>
        <h3 className="mt-2 font-bold">{pick(lang, s.nameAr, s.nameEn)}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-soft">{pick(lang, s.descAr, s.descEn)}</p>
        <p className="mt-2 text-xs text-soft">{s._count.doctors} {t("أطباء", "doctors")}</p>
      </Link>
    </li>
  );
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold">{t("التخصصات ومراكز التميّز", "Specialties & centers of excellence")}</h1>
      <p className="mt-2 max-w-2xl text-soft">{t("اختر التخصص لتعرف خدماته وأطبائه، ثم احجز موعدك مباشرة.", "Pick a specialty to see its services and doctors, then book directly.")}</p>
      <h2 className="mt-8 text-xl font-bold">{t("مراكز التميّز", "Centers of excellence")}</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{centers.map(card)}</ul>
      <h2 className="mt-10 text-xl font-bold">{t("بقية التخصصات", "Other specialties")}</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{others.map(card)}</ul>
    </div>
  );
}
