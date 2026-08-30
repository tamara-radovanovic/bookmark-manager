import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../../i18n";

const LABELS: Record<SupportedLanguage, string> = {
  en: "EN",
  sr: "SR",
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage;

  return (
    <div className="flex rounded-full border border-blush-300 bg-surface p-0.5" role="group">
      {SUPPORTED_LANGUAGES.map((lang) => {
        const isActive = current === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => i18n.changeLanguage(lang)}
            aria-pressed={isActive}
            className={`cursor-pointer rounded-full px-3.5 py-2 font-heading text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2 ${
              isActive
                ? "bg-linear-to-b from-blush-400 to-blush-500 text-white"
                : "text-ink-400 hover:bg-blush-100 hover:text-blush-600"
            }`}
          >
            {LABELS[lang]}
          </button>
        );
      })}
    </div>
  );
}
