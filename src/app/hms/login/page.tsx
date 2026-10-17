import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n";
import { getStaff } from "@/lib/session";
import { staffLogin } from "@/app/actions/staff";

export const metadata: Metadata = { title: "دخول الموظفين", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function StaffLoginPage({ searchParams }: Props) {
  const { error } = await searchParams;
  if (await getStaff()) redirect("/hms");
  const { t } = await getT();
  return (
    <main id="main" className="container-x max-w-md py-12">
      <h1 className="text-3xl font-bold">{t("النظام الداخلي للمستشفى", "Hospital management system")}</h1>
      <p className="mt-2 text-soft">{t("لموظفي مستشفى رُواء التخصصي فقط. نظام تجريبي وليس جهازاً طبياً.", "Rowaa staff only. Demo system — not a medical device.")}</p>
      {error ? <p role="alert" className="alert alert-danger mt-4">{t("البريد أو كلمة المرور غير صحيحة.", "Incorrect email or password.")}</p> : null}
      <form action={staffLogin} className="card mt-4 grid gap-4">
        <div className="field">
          <label htmlFor="s-email">{t("البريد الإلكتروني", "Email")}</label>
          <input id="s-email" name="email" type="email" required className="input" dir="ltr" autoComplete="username" />
        </div>
        <div className="field">
          <label htmlFor="s-pw">{t("كلمة المرور", "Password")}</label>
          <input id="s-pw" name="password" type="password" required className="input" dir="ltr" autoComplete="current-password" />
        </div>
        <button type="submit" className="btn btn-primary">{t("دخول", "Sign in")}</button>
      </form>
      <p className="hint mt-3">{t("بيانات الدخول التجريبية مذكورة في README و.env.example.", "Demo credentials are listed in the README and .env.example.")}</p>
    </main>
  );
}
