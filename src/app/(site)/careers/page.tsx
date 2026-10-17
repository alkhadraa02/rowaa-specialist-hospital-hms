import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT, pick } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الوظائف في مستشفى رُواء",
  description: "انضم إلى فريق مستشفى رُواء التخصصي: وظائف في التمريض والطب والمختبر والصيدلة والإدارة في فروعنا، وقدّم طلبك إلكترونياً.",
  alternates: { canonical: "/careers" },
};

export default async function CareersPage() {
  const { lang, t } = await getT();
  const jobs = await prisma.job.findMany({ where: { open: true }, orderBy: { postedAt: "desc" } });
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold">{t("الوظائف", "Careers")}</h1>
      <p className="mt-2 max-w-2xl text-soft">{t("ابنِ مسيرتك معنا في بيئة تقدّر الكفاءة والتطوير المهني. الوظائف خيالية لأغراض العرض.", "Build your career with us in an environment that values skill and growth. Jobs are fictional demo data.")}</p>
      {jobs.length === 0 ? (
        <p className="card mt-6 p-6">{t("لا توجد وظائف مفتوحة حالياً.", "No open positions right now.")}</p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link href={`/careers/${j.slug}`} className="card card-link h-full">
                <h2 className="text-lg font-bold">{pick(lang, j.titleAr, j.titleEn)}</h2>
                <p className="mt-1 text-sm text-soft">{pick(lang, j.dept, j.deptEn)} · {pick(lang, j.city, j.cityEn)} · {j.type}</p>
                <p className="mt-2 line-clamp-2 text-sm">{pick(lang, j.descAr, j.descEn)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
