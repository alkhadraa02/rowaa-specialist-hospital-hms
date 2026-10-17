import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getT, pick, money } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الباقات والعروض الطبية",
  description: "باقات فحص وعروض طبية متكاملة من مستشفى رُواء التخصصي بأسعار واضحة: فحص شامل وصحة القلب والحمل والطفل والسكري.",
  alternates: { canonical: "/packages" },
};

const AUD: Record<string, [string, string]> = {
  adults: ["للبالغين", "Adults"],
  women: ["للنساء", "Women"],
  children: ["للأطفال", "Children"],
};

export default async function PackagesPage() {
  const { lang, t } = await getT();
  const list = await prisma.package.findMany({ orderBy: { price: "asc" } });
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold">{t("الباقات والعروض", "Packages & offers")}</h1>
      <p className="mt-2 max-w-2xl text-soft">{t("أسعار شاملة وواضحة. الأسعار تجريبية وبيانات العرض خيالية.", "All-inclusive, transparent prices. Prices are fictional demo data.")}</p>
      <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => {
          const items = pick(lang, p.itemsAr, p.itemsEn).split("|");
          const aud = AUD[p.audience];
          return (
            <li key={p.id} className="card flex flex-col gap-3 p-5">
              <p className="text-xs font-semibold text-soft">{aud ? (lang === "ar" ? aud[0] : aud[1]) : p.audience}</p>
              <h2 className="text-xl font-bold">{pick(lang, p.nameAr, p.nameEn)}</h2>
              <p className="text-sm">{pick(lang, p.descAr, p.descEn)}</p>
              <ul className="list-disc space-y-1 ps-5 text-sm">{items.map((i) => <li key={i}>{i}</li>)}</ul>
              <p className="mt-auto text-lg font-bold">
                {p.offerPrice ? (
                  <>
                    <span>{money(p.offerPrice, lang)}</span>{" "}
                    <s className="text-sm font-normal text-soft">{money(p.price, lang)}</s>
                  </>
                ) : (
                  money(p.price, lang)
                )}
              </p>
              <Link href="/book" className="btn btn-primary btn-sm self-start">{t("احجز الآن", "Book now")}</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
