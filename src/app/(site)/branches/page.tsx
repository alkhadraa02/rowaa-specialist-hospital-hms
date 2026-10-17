import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "فروعنا - مستشفى رُواء التخصصي",
  description: "تعرّف على فروع مستشفى رُواء التخصصي في المدن الرئيسية: العناوين وساعات العمل وأرقام التواصل وعدد الأسرّة والعيادات.",
  alternates: { canonical: "/branches" },
  openGraph: { title: "فروعنا - مستشفى رُواء التخصصي", url: "/branches" },
};

export default async function BranchesPage() {
  const { lang, t } = await getT();
  const branches = await prisma.branch.findMany({ orderBy: { nameAr: "asc" } });
  return (
    <div className="container-x py-8">
      <h1 className="mb-2 text-3xl font-bold">{t("فروعنا", "Our branches")}</h1>
      <p className="mb-6 max-w-2xl">{t("ثلاثة فروع تخدمك بالقرب منك، بنفس معايير الجودة والسلامة.", "Three branches near you, with the same quality and safety standards.")}</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((b) => (
          <article key={b.id} className="card flex flex-col gap-2 p-5">
            <h2 className="text-xl font-bold"><Link href={`/branches/${b.slug}`} className="hover:underline">{lang === "ar" ? b.nameAr : b.nameEn}</Link></h2>
            <p className="text-sm">{lang === "ar" ? b.city : b.cityEn} — {lang === "ar" ? b.addressAr : b.addressEn}</p>
            <p className="text-sm">{lang === "ar" ? b.descAr : b.descEn}</p>
            <p className="text-sm">{t("الأسرّة", "Beds")}: {b.beds} · {t("العيادات", "Clinics")}: {b.clinics}</p>
            <Link href={`/branches/${b.slug}`} className="btn btn-outline btn-sm mt-auto self-start">{t("تفاصيل الفرع", "Branch details")}</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
