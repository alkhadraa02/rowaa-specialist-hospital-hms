import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getT } from "@/lib/i18n";
import { getStaff } from "@/lib/session";
import { can, ROLE_LABELS, type Permission, type Role } from "@/lib/rbac";
import { staffLogout } from "@/app/actions/staff";
import { LangToggle } from "@/components/LangToggle";

export const metadata: Metadata = { title: { default: "النظام الداخلي", template: "%s | HMS رُواء" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV: { href: string; ar: string; en: string; perm: Permission }[] = [
  { href: "/hms", ar: "لوحة المؤشرات", en: "Dashboard", perm: "dashboard.read" },
  { href: "/hms/patients", ar: "المرضى", en: "Patients", perm: "patients.read" },
  { href: "/hms/appointments", ar: "المواعيد", en: "Appointments", perm: "appointments.manage" },
  { href: "/hms/er", ar: "الطوارئ", en: "Emergency", perm: "er.manage" },
  { href: "/hms/beds", ar: "الأسرّة", en: "Beds", perm: "beds.read" },
  { href: "/hms/encounters", ar: "الزيارات (EMR)", en: "Encounters (EMR)", perm: "emr.read" },
  { href: "/hms/orders", ar: "المختبر والأشعة", en: "Lab & radiology", perm: "emr.read" },
  { href: "/hms/pharmacy", ar: "الصيدلية", en: "Pharmacy", perm: "pharmacy.dispense" },
  { href: "/hms/billing", ar: "الفوترة", en: "Billing", perm: "billing.manage" },
  { href: "/hms/audit", ar: "سجل التدقيق", en: "Audit log", perm: "audit.read" },
];

export default async function HmsLayout({ children }: { children: React.ReactNode }) {
  const user = await getStaff();
  if (!user) redirect("/hms/login");
  const { lang, t } = await getT();
  const role = ROLE_LABELS[user.role as Role];
  const items = NAV.filter((n) => can(user.role, n.perm) || (n.href === "/hms/pharmacy" && can(user.role, "pharmacy.prescribe")));
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="container-x flex flex-wrap items-center justify-between gap-3 py-3">
          <Link href="/hms" className="min-w-0 truncate text-lg font-bold">{t("رُواء HMS", "Rowaa HMS")}</Link>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="min-w-0 truncate text-sm">{lang === "ar" ? user.name : user.nameEn ?? user.name} · {role ? (lang === "ar" ? role.ar : role.en) : user.role}</span>
            <LangToggle lang={lang} />
            <Link href="/" className="btn btn-ghost btn-sm">{t("الموقع العام", "Public site")}</Link>
            <form action={staffLogout}><button type="submit" className="btn btn-outline btn-sm">{t("خروج", "Sign out")}</button></form>
          </div>
        </div>
        <nav aria-label={t("أقسام النظام", "System sections")} className="container-x flex gap-1 overflow-x-auto pb-2">
          {items.map((n) => (
            <Link key={n.href} href={n.href} className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-surface-2">{lang === "ar" ? n.ar : n.en}</Link>
          ))}
        </nav>
      </header>
      <div className="container-x pt-3">
        <p className="alert alert-warn text-xs">{t("نظام تجريبي ببيانات خيالية — ليس جهازاً طبياً. مخرجات الذكاء الاصطناعي اقتراحات تتطلب تأكيد مختص.", "Demo system with fictional data — not a medical device. AI output is a suggestion that requires clinician confirmation.")}</p>
      </div>
      <main id="main" tabIndex={-1} className="container-x py-6">{children}</main>
    </div>
  );
}
