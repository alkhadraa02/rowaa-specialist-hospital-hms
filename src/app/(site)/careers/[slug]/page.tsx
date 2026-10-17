import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT, pick } from "@/lib/i18n";
import { ApplyForm } from "@/components/PublicForms";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const j = await prisma.job.findUnique({ where: { slug } });
  if (!j) return { title: "الوظيفة غير موجودة" };
  return {
    title: `${j.titleAr} - وظائف رُواء`.slice(0, 60),
    description: j.descAr.slice(0, 158).padEnd(50, "."),
    alternates: { canonical: `/careers/${j.slug}` },
  };
}

export default async function JobPage({ params }: Props) {
  const { slug } = await params;
  const { lang, t } = await getT();
  const j = await prisma.job.findUnique({ where: { slug } });
  if (!j) notFound();
  const reqs = pick(lang, j.reqAr, j.reqEn).split("|").filter(Boolean);
  return (
    <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_24rem]">
      <article className="min-w-0">
        <p className="text-sm"><Link href="/careers" className="underline">{t("الوظائف", "Careers")}</Link></p>
        <h1 className="mt-2 text-3xl font-bold">{pick(lang, j.titleAr, j.titleEn)}</h1>
        <p className="mt-2 text-sm text-soft">{pick(lang, j.dept, j.deptEn)} · {pick(lang, j.city, j.cityEn)} · {j.type}</p>
        <p className="mt-4 leading-8">{pick(lang, j.descAr, j.descEn)}</p>
        <h2 className="mt-6 text-xl font-bold">{t("المتطلبات", "Requirements")}</h2>
        <ul className="mt-2 list-disc space-y-1 ps-5">{reqs.map((r) => <li key={r}>{r}</li>)}</ul>
      </article>
      <section aria-labelledby="apply-h">
        <h2 id="apply-h" className="mb-3 text-xl font-bold">{t("قدّم الآن", "Apply now")}</h2>
        {j.open ? (
          <ApplyForm
            jobId={j.id}
            l={{
              name: t("الاسم الكامل", "Full name"),
              email: t("البريد الإلكتروني", "Email"),
              phone: t("رقم الجوال", "Mobile number"),
              cover: t("نبذة عن خبرتك (اختياري)", "About your experience (optional)"),
              submit: t("إرسال الطلب", "Submit application"),
              sending: t("جارٍ الإرسال…", "Sending…"),
              success: t("تم استلام طلبك، سنتواصل معك قريباً.", "Application received. We will contact you soon."),
              error: t("تعذّر الإرسال، حاول لاحقاً.", "Could not send. Please try again later."),
              invalid: t("تحقق من البيانات (الجوال بصيغة 05xxxxxxxx).", "Check your details (mobile as 05xxxxxxxx)."),
            }}
          />
        ) : (
          <p className="card p-4">{t("أُغلق باب التقديم لهذه الوظيفة.", "Applications for this job are closed.")}</p>
        )}
      </section>
    </div>
  );
}
