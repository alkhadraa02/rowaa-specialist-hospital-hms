import type { Metadata } from "next";
import { getT } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import { ContactForm } from "@/components/PublicForms";

export const metadata: Metadata = {
  title: "اتصل بنا",
  description: "تواصل مع مستشفى رُواء التخصصي عبر الرقم الموحد أو النموذج الإلكتروني للاستفسارات والملاحظات، وللطوارئ اتصل بالإسعاف فوراً.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const { t } = await getT();
  return (
    <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_28rem]">
      <section className="min-w-0">
        <h1 className="text-3xl font-bold">{t("اتصل بنا", "Contact us")}</h1>
        <p className="mt-2 max-w-xl text-soft">{t("نسعد باستفساراتك وملاحظاتك. للحالات الطارئة اتصل بالإسعاف مباشرة ولا تستخدم هذا النموذج.", "We welcome your questions and feedback. For emergencies call the ambulance directly; do not use this form.")}</p>
        <dl className="card mt-6 grid gap-3">
          <div><dt className="font-semibold">{t("الرقم الموحد", "Unified hotline")}</dt><dd dir="ltr" className="text-start">{SITE.hotlineDisplay}</dd></div>
          <div><dt className="font-semibold">{t("الطوارئ", "Emergency")}</dt><dd dir="ltr" className="text-start">{SITE.emergencyPhone}</dd></div>
          <div><dt className="font-semibold">{t("البريد", "Email")}</dt><dd dir="ltr" className="text-start">{SITE.email}</dd></div>
        </dl>
      </section>
      <section aria-labelledby="form-h">
        <h2 id="form-h" className="mb-3 text-xl font-bold">{t("أرسل رسالة", "Send a message")}</h2>
        <ContactForm
          l={{
            name: t("الاسم", "Name"),
            email: t("البريد الإلكتروني", "Email"),
            phone: t("رقم الجوال (اختياري)", "Mobile (optional)"),
            subject: t("الموضوع", "Subject"),
            message: t("الرسالة", "Message"),
            submit: t("إرسال", "Send"),
            sending: t("جارٍ الإرسال…", "Sending…"),
            success: t("وصلتنا رسالتك، شكراً لتواصلك.", "Message received. Thank you."),
            error: t("تعذّر الإرسال، حاول لاحقاً.", "Could not send. Please try again later."),
            invalid: t("تحقق من البيانات المدخلة.", "Please check the entered details."),
          }}
        />
      </section>
    </div>
  );
}
