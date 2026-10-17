import { cookies } from "next/headers";
import type { Lang } from "./time";

export type { Lang };

export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get("lang")?.value;
  return c === "en" ? "en" : "ar";
}

export type T = {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (ar: string, en: string) => string;
};

export function makeT(lang: Lang): T {
  return { lang, dir: lang === "ar" ? "rtl" : "ltr", t: (ar, en) => (lang === "ar" ? ar : en) };
}

export async function getT(): Promise<T> {
  return makeT(await getLang());
}

export function pick(lang: Lang, ar: string | null | undefined, en: string | null | undefined) {
  return (lang === "ar" ? ar : en) ?? "";
}

export function money(n: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-GB", { maximumFractionDigits: 2 }).format(n) + (lang === "ar" ? " ر.س" : " SAR");
}

export function num(n: number, lang: Lang, digits = 0) {
  return new Intl.NumberFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-GB", { maximumFractionDigits: digits }).format(n);
}
