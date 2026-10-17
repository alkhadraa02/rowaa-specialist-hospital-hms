import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT, pick, money } from "@/lib/i18n";
import { bookedSet, nextSlot } from "@/lib/availability";
import { parseDays } from "@/lib/slots";
import { fmtWeekday, fmtTime } from "@/lib/time";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = await prisma.doctor.findUnique({ where: { slug }, include: { specialty: true } });
  if (!d) return { title: "الطبيب غير موجود" };
  return {
    title: `${d.nameAr} - ${d.specialty.nameAr}`.slice(0, 60),
    description: d.bioAr.slice(0, 158),
    alternates: { canonical: `/doctors/${d.slug}` },
    openGraph: { title: d.nameAr, description: d.bioAr.slice(0, 158), url: `/doctors/${d.slug}` },
  };
}

const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LANG_NAMES: Record<string, [string, string]> = { ar: ["العربية", "Arabic"], en: ["الإنجليزية", "English"], ur: ["الأردية", "Urdu"], fr: ["الفرنسية", "French"] };

export default async function DoctorPage({ params }: Props) {
  const { slug } = await params;
  const { lang, t } = await getT();
  const d = await prisma.doctor.findUnique({ where: { slug }, include: { specialty: true, branches: { include: { branch: true } } } });
  if (!d) notFound();
  const booked = await bookedSet([d.id]);
  const rows = d.branches.map((b) => ({ b, next: nextSlot([b], booked.get(d.id)) }));
  const dayNames = lang === "ar" ? DAYS_AR : DAYS_EN;
  const ld = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: d.nameEn,
    medicalSpecialty: d.specialty.nameEn,
    description: d.bioEn,
    worksFor: { "@type": "Hospital", name: "Rowaa Specialist Hospital" },
  };
  return (
    <div className="container-x py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <nav aria-label={t("مسار التنقل", "Breadcrumb")} className="text-sm text-soft">
        <Link href="/doctors" className="underline">{t("الأطباء", "Doctors")}</Link> / {pick(lang, d.nameAr, d.nameEn)}
      </nav>
      <h1 className="mt-2 text-3xl font-bold">{pick(lang, d.nameAr, d.nameEn)}</h1>
      <p className="mt-1 text-soft">
        {pick(lang, d.titleAr, d.titleEn)} ·{" "}
        <Link href={`/specialties/${d.specialty.slug}`} className="underline">{pick(lang, d.specialty.nameAr, d.specialty.nameEn)}</Link>
      </p>
      <p className="mt-2 text-sm">★ {d.rating.toFixed(1)} ({d.reviews} {t("تقييماً", "reviews")}) · {d.experience} {t("سنة خبرة", "years of experience")} · {t("الكشف", "Consultation")}: {money(d.fee, lang)}</p>
      <p className="mt-1 text-sm text-soft">{t("اللغات:", "Languages:")} {d.languages.split(",").map((c) => (LANG_NAMES[c] ? t(LANG_NAMES[c][0], LANG_NAMES[c][1]) : c)).join("، ")}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="text-xl font-bold">{t("نبذة", "About")}</h2>
          <p className="mt-2">{pick(lang, d.bioAr, d.bioEn)}</p>
          <h2 className="mt-6 text-xl font-bold">{t("المؤهلات", "Education")}</h2>
          <p className="mt-2">{pick(lang, d.educationAr, d.educationEn)}</p>
        </section>
        <aside aria-label={t("المواعيد والفروع", "Schedule and branches")}>
          <h2 className="text-xl font-bold">{t("الفروع والمواعيد", "Branches & schedule")}</h2>
          <ul className="mt-2 space-y-3">
            {rows.map(({ b, next }) => (
              <li key={b.id} className="card">
                <p className="font-bold">{pick(lang, b.branch.nameAr, b.branch.nameEn)}</p>
                <p className="text-sm text-soft">{parseDays(b.days).map((x) => dayNames[x]).join(" · ")} · {b.startHour}:00–{b.endHour}:00</p>
                <p className="mt-1 text-sm">{next ? <>{t("أقرب موعد:", "Next slot:")} <strong>{fmtWeekday(next, lang)} {fmtTime(next, lang)}</strong></> : t("لا مواعيد قريبة", "No upcoming slots")}</p>
                <Link href={`/book?doctor=${d.slug}&branch=${b.branch.slug}`} className="btn btn-primary mt-2">{t("احجز في هذا الفرع", "Book at this branch")}</Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
