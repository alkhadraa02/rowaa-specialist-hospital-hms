import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n";
import BookingWizard from "@/components/BookingWizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "حجز موعد - مستشفى رُواء التخصصي",
  description: "احجز موعدك في مستشفى رُواء التخصصي بخمس خطوات: التخصص والطبيب والفرع والموعد وبياناتك، واحصل على رقم الحجز فوراً.",
  alternates: { canonical: "/book" },
  openGraph: { title: "حجز موعد - مستشفى رُواء التخصصي", url: "/book" },
};

type Props = { searchParams: Promise<{ doctor?: string; branch?: string; specialty?: string }> };

export default async function BookPage({ searchParams }: Props) {
  const q = await searchParams;
  const { lang, t } = await getT();
  const [specialties, doctors] = await Promise.all([
    prisma.specialty.findMany({ orderBy: { nameAr: "asc" }, select: { id: true, slug: true, nameAr: true, nameEn: true } }),
    prisma.doctor.findMany({
      orderBy: { nameAr: "asc" },
      include: { branches: { include: { branch: { select: { id: true, slug: true, nameAr: true, nameEn: true } } } } },
    }),
  ]);
  const docs = doctors.map((d) => ({
    id: d.id,
    slug: d.slug,
    nameAr: d.nameAr,
    nameEn: d.nameEn,
    specialtyId: d.specialtyId,
    branches: d.branches.map((b) => ({ id: b.branch.id, slug: b.branch.slug, nameAr: b.branch.nameAr, nameEn: b.branch.nameEn })),
  }));
  const doc = docs.find((d) => d.slug === q.doctor);
  const initial = {
    specialtyId: doc?.specialtyId ?? specialties.find((s) => s.slug === q.specialty)?.id,
    doctorId: doc?.id,
    branchId: doc?.branches.find((b) => b.slug === q.branch)?.id,
  };
  return (
    <div className="container-x py-8">
      <h1 className="mb-2 text-3xl font-bold">{t("احجز موعداً", "Book an appointment")}</h1>
      <p className="mb-6 max-w-2xl">{t("اختر التخصص ثم الطبيب والفرع والوقت المناسب، وستحصل على رقم الحجز مباشرة.", "Choose a specialty, doctor, branch and time, and get your booking number right away.")}</p>
      <BookingWizard
        lang={lang}
        specialties={specialties.map(({ id, nameAr, nameEn }) => ({ id, nameAr, nameEn }))}
        doctors={docs}
        initial={initial}
      />
    </div>
  );
}
