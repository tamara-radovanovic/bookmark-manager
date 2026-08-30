import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import sr from "./locales/sr.json";

export const SUPPORTED_LANGUAGES = ["en", "sr"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sr: { translation: sr },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      // React already escapes interpolated values — i18next doesn't need to.
      escapeValue: false,
    },
    detection: {
      // Saved choice wins; otherwise fall back to the browser's language.
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
