import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT, pick } from "@/lib/i18n";
import { bookedSet, nextSlot } from "@/lib/availability";
import { matchesAvailability, type AvailabilityFilter } from "@/lib/slots";
import { fmtWeekday, fmtTime } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ابحث عن طبيب",
  description: "ابحث عن طبيبك حسب التخصص والفرع والجنس واللغة وأقرب موعد متاح في مستشفى رُواء التخصصي، ثم احجز موعدك.",
  alternates: { canonical: "/doctors" },
};

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const LANGS: [string, string, string][] = [["ar", "العربية", "Arabic"], ["en", "الإنجليزية", "English"], ["ur", "الأردية", "Urdu"], ["fr", "الفرنسية", "French"]];

export default async function DoctorsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { lang, t } = await getT();
  const specialty = one(sp.specialty);
  const branch = one(sp.branch);
  const gender = one(sp.gender);
  const language = one(sp.language);
  const q = one(sp.q).trim().slice(0, 60);
  const avail = (["today", "week"].includes(one(sp.availability)) ? one(sp.availability) : "any") as AvailabilityFilter;

  const [specialties, branches, doctors] = await Promise.all([
    prisma.specialty.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.branch.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.doctor.findMany({
      where: {
        ...(specialty ? { specialty: { slug: specialty } } : {}),
        ...(branch ? { branches: { some: { branch: { slug: branch } } } } : {}),
        ...(gender === "M" || gender === "F" ? { gender } : {}),
        ...(language ? { languages: { contains: language } } : {}),
        ...(q ? { OR: [{ nameAr: { contains: q } }, { nameEn: { contains: q } }] } : {}),
      },
      include: { specialty: true, branches: { include: { branch: true } } },
      orderBy: [{ rating: "desc" }, { nameEn: "asc" }],
    }),
  ]);
  const booked = await bookedSet(doctors.map((d) => d.id));
  const now = new Date();
  const rows = doctors
    .map((d) => {
      const avs = d.branches.filter((b) => !branch || b.branch.slug === branch);
      const next = nextSlot(avs, booked.get(d.id), now);
      return { d, next };
    })
    .filter((r) => matchesAvailability(r.next ? [r.next] : [], avail, now));

  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold">{t("ابحث عن طبيب", "Find a doctor")}</h1>
      <form method="get" className="card mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={t("تصفية الأطباء", "Filter doctors")}>
        <div>
          <label htmlFor="q" className="label">{t("اسم الطبيب", "Doctor name")}</label>
          <input id="q" name="q" defaultValue={q} className="input" maxLength={60} />
        </div>
        <div>
          <label htmlFor="specialty" className="label">{t("التخصص", "Specialty")}</label>
          <select id="specialty" name="specialty" defaultValue={specialty} className="input">
            <option value="">{t("الكل", "All")}</option>
            {specialties.map((s) => <option key={s.id} value={s.slug}>{pick(lang, s.nameAr, s.nameEn)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="branch" className="label">{t("الفرع", "Branch")}</label>
          <select id="branch" name="branch" defaultValue={branch} className="input">
            <option value="">{t("الكل", "All")}</option>
            {branches.map((b) => <option key={b.id} value={b.slug}>{pick(lang, b.nameAr, b.nameEn)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="gender" className="label">{t("الجنس", "Gender")}</label>
          <select id="gender" name="gender" defaultValue={gender} className="input">
            <option value="">{t("الكل", "All")}</option>
            <option value="M">{t("طبيب", "Male")}</option>
            <option value="F">{t("طبيبة", "Female")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="language" className="label">{t("لغة الطبيب", "Language")}</label>
          <select id="language" name="language" defaultValue={language} className="input">
            <option value="">{t("الكل", "All")}</option>
            {LANGS.map(([c, ar, en]) => <option key={c} value={c}>{t(ar, en)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="availability" className="label">{t("التوفر", "Availability")}</label>
          <select id="availability" name="availability" defaultValue={avail} className="input">
            <option value="any">{t("أي وقت", "Any time")}</option>
            <option value="today">{t("اليوم", "Today")}</option>
            <option value="week">{t("خلال أسبوع", "Within a week")}</option>
          </select>
        </div>
        <div className="flex items-end gap-2 sm:col-span-2">
          <button type="submit" className="btn btn-primary">{t("بحث", "Search")}</button>
          <Link href="/doctors" className="btn btn-ghost">{t("مسح التصفية", "Clear")}</Link>
        </div>
      </form>

      <p className="mt-5 text-sm text-soft" role="status">{rows.length} {t("طبيباً مطابقاً", "matching doctors")}</p>
      {rows.length === 0 ? (
        <p className="alert alert-info mt-3">{t("لا يوجد أطباء مطابقون. جرّب تخفيف التصفية.", "No matching doctors. Try loosening the filters.")}</p>
      ) : (
        <ul className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ d, next }) => (
            <li key={d.id} className="card flex min-w-0 flex-col">
              <h2 className="truncate text-lg font-bold">
                <Link href={`/doctors/${d.slug}`} className="underline-offset-4 hover:underline">{pick(lang, d.nameAr, d.nameEn)}</Link>
              </h2>
              <p className="text-sm text-soft">{pick(lang, d.titleAr, d.titleEn)} · {pick(lang, d.specialty.nameAr, d.specialty.nameEn)}</p>
              <p className="mt-1 text-sm">★ {d.rating.toFixed(1)} ({d.reviews}) · {d.experience} {t("سنة خبرة", "yrs")}</p>
              <p className="mt-1 text-sm text-soft">{d.branches.map((b) => pick(lang, b.branch.nameAr, b.branch.nameEn)).join(" · ")}</p>
              <p className="mt-2 text-sm">
                {next ? <>{t("أقرب موعد:", "Next slot:")} <strong>{fmtWeekday(next, lang)} {fmtTime(next, lang)}</strong></> : t("لا مواعيد قريبة", "No upcoming slots")}
              </p>
              <div className="mt-auto flex gap-2 pt-3">
                <Link href={`/book?doctor=${d.slug}`} className="btn btn-primary">{t("احجز", "Book")}</Link>
                <Link href={`/doctors/${d.slug}`} className="btn btn-ghost">{t("الملف الشخصي", "Profile")}</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
