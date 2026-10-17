import Link from "next/link";
import { getT } from "@/lib/i18n";
import { SITE, DEMO_NOTICE } from "@/lib/site";
import { LangToggle } from "@/components/LangToggle";
import { MobileNav } from "@/components/MobileNav";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getT();
  const nav = [
    { href: "/specialties", label: t("التخصصات", "Specialties") },
    { href: "/doctors", label: t("الأطباء", "Doctors") },
    { href: "/branches", label: t("الفروع", "Branches") },
    { href: "/packages", label: t("الباقات والعروض", "Packages & offers") },
    { href: "/insurance", label: t("التأمين", "Insurance") },
    { href: "/articles", label: t("الثقافة الصحية", "Health library") },
    { href: "/news", label: t("الأخبار", "News") },
    { href: "/careers", label: t("الوظائف", "Careers") },
    { href: "/visitor-guide", label: t("دليل الزائر", "Visitor guide") },
    { href: "/contact", label: t("اتصل بنا", "Contact") },
  ];
  const primary = nav.slice(0, 6);
  return (
    <>
      <div className="bg-danger text-brand-ink">
        <div className="container-x flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
          <p className="min-w-0 font-semibold">
            {t("الطوارئ على مدار الساعة:", "24/7 Emergency:")}{" "}
            <a href={`tel:${SITE.emergencyPhone}`} className="underline">{SITE.emergencyPhone}</a>
            {" · "}
            {t("الرقم الموحد", "Hotline")}{" "}
            <a href={`tel:${SITE.hotline}`} className="underline" dir="ltr">{SITE.hotlineDisplay}</a>
          </p>
        </div>
      </div>
      <header className="sticky top-0 border-b border-line bg-surface" style={{ zIndex: "var(--z-header)" }}>
        <div className="container-x flex min-h-16 items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2 font-bold text-brand-deep">
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-brand-ink">ر</span>
            <span className="truncate">{t(SITE.nameAr, SITE.nameEn)}</span>
          </Link>
          <nav aria-label={t("التنقل الرئيسي", "Main navigation")} className="hidden items-center gap-1 lg:flex">
            {primary.map((i) => (
              <Link key={i.href} href={i.href} className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-surface-2">{i.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/book" className="btn btn-primary btn-sm">{t("احجز موعداً", "Book now")}</Link>
            <Link href="/portal" className="btn btn-outline btn-sm hidden sm:inline-flex">{t("بوابة المريض", "Patient portal")}</Link>
            <LangToggle lang={lang} />
            <MobileNav
              items={[...nav, { href: "/portal", label: t("بوابة المريض", "Patient portal") }, { href: "/about", label: t("من نحن", "About us") }, { href: "/faq", label: t("الأسئلة الشائعة", "FAQ") }]}
              openLabel={t("فتح القائمة", "Open menu")}
              closeLabel={t("إغلاق القائمة", "Close menu")}
              menuTitle={t("القائمة", "Menu")}
            />
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}>{children}</main>
      <footer className="mt-16 bg-brand-deep text-brand-ink">
        <div className="container-x grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-bold">{t(SITE.nameAr, SITE.nameEn)}</p>
            <p className="mt-2 text-sm opacity-90">{t("رعاية متخصصة بمعايير عالمية منذ", "Specialist care to international standards since")} {SITE.foundedYear}</p>
            <p className="mt-2 text-sm" dir="ltr">{SITE.hotlineDisplay}</p>
          </div>
          <FooterCol title={t("خدماتنا", "Services")} links={[["/specialties", t("التخصصات", "Specialties")], ["/doctors", t("ابحث عن طبيب", "Find a doctor")], ["/book", t("حجز موعد", "Book an appointment")], ["/packages", t("الباقات", "Packages")]]} />
          <FooterCol title={t("للمرضى والزوار", "Patients & visitors")} links={[["/visitor-guide", t("دليل الزائر", "Visitor guide")], ["/patient-rights", t("حقوق المريض", "Patient rights")], ["/insurance", t("شركات التأمين", "Insurance partners")], ["/faq", t("الأسئلة الشائعة", "FAQ")]]} />
          <FooterCol title={t("المستشفى", "The hospital")} links={[["/about", t("من نحن", "About us")], ["/branches", t("فروعنا", "Our branches")], ["/careers", t("الوظائف", "Careers")], ["/news", t("الأخبار", "News")], ["/contact", t("اتصل بنا", "Contact us")], ["/hms", t("النظام الداخلي (للموظفين)", "Staff system (HMS)")]]} />
        </div>
        <div className="border-t border-brand-ink/20">
          <p className="container-x py-4 text-xs opacity-90">{lang === "ar" ? DEMO_NOTICE.ar : DEMO_NOTICE.en}</p>
        </div>
      </footer>
    </>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="font-bold">{title}</p>
      <ul className="mt-2 space-y-1 text-sm">
        {links.map(([href, label]) => (
          <li key={href}><Link href={href} className="inline-block py-1 underline-offset-4 hover:underline">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
