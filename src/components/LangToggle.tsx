import { setLang } from "@/app/actions/lang";
import type { Lang } from "@/lib/i18n";

export function LangToggle({ lang }: { lang: Lang }) {
  const next = lang === "ar" ? "en" : "ar";
  return (
    <form action={setLang}>
      <input type="hidden" name="lang" value={next} />
      <button
        type="submit"
        className="btn btn-ghost btn-sm"
        lang={next}
        aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      >
        {lang === "ar" ? "English" : "العربية"}
      </button>
    </form>
  );
}
