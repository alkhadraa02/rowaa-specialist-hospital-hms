import type { Metadata, Viewport } from "next";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "./globals.css";
import { getT } from "@/lib/i18n";
import { SITE } from "@/lib/site";

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b6b5d" };

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "مستشفى رُواء التخصصي | Rowaa Specialist Hospital", template: "%s | رُواء" },
  description: "مستشفى رُواء التخصصي: عيادات وتخصصات متقدمة وحجز مواعيد إلكتروني وطوارئ على مدار الساعة. موقع تجريبي لعلامة خيالية.",
  openGraph: { type: "website", siteName: "Rowaa Specialist Hospital", locale: "ar_SA" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, dir, t } = await getT();
  return (
    <html lang={lang} dir={dir}>
      <body className="min-h-dvh">
        <a href="#main" className="skip-link">{t("تخطَّ إلى المحتوى", "Skip to content")}</a>
        {children}
      </body>
    </html>
  );
}
