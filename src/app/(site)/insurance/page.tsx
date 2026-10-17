import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT, pick } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "شركات التأمين المعتمدة",
  description: "قائمة شركات التأمين الصحي المتعاقد معها في مستشفى رُواء التخصصي وفئات التغطية وكيفية التحقق من وثيقتك قبل الزيارة.",
  alternates: { canonical: "/insurance" },
};

export default async function InsurancePage() {
  const { lang, t } = await getT();
  const list = await prisma.insurer.findMany({ orderBy: { nameEn: "asc" } });
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold">{t("شركات التأمين", "Insurance partners")}</h1>
      <p className="mt-2 max-w-2xl text-soft">{t("أحضر بطاقة التأمين والهوية عند الاستقبال، وسيتحقق فريقنا من التغطية قبل الخدمة. أسماء الشركات خيالية.", "Bring your insurance card and ID to reception and our team will verify coverage before service. Insurer names are fictional.")}</p>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-start text-sm">
          <caption className="sr-only">{t("شركات التأمين", "Insurance partners")}</caption>
          <thead>
            <tr>
              <th scope="col" className="p-3 text-start">{t("الشركة", "Insurer")}</th>
              <th scope="col" className="p-3 text-start">{t("الفئة", "Tier")}</th>
              <th scope="col" className="p-3 text-start">{t("ملاحظات", "Notes")}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id} className="border-t border-line">
                <th scope="row" className="p-3 text-start font-semibold">{pick(lang, i.nameAr, i.nameEn)}</th>
                <td className="p-3">{i.tier}</td>
                <td className="p-3">{pick(lang, i.noteAr, i.noteEn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
