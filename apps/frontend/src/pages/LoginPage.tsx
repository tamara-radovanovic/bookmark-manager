import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LoginForm } from "../components/auth/LoginForm";
import { LanguageSwitcher } from "../components/layout/LanguageSwitcher";
import { ThemeToggle } from "../components/layout/ThemeToggle";

export function LoginPage() {
  const { t } = useTranslation();

  return (
    <main className="relative flex justify-center px-8 py-24 pb-30">
      <div className="fixed top-6 right-6 z-10 flex items-center gap-3">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-130 rounded-[28px] border border-blush-100 bg-surface/90 p-12 shadow-[0_24px_60px_-30px_rgba(160,90,115,0.35)]">
        <div className="mb-9.5 flex flex-col items-center gap-2.5">
          <img src="/bookmark.png" alt="" className="h-19 w-19 object-contain" />
          <h1 className="font-heading text-4xl font-bold text-ink-900">{t("auth.login.title")}</h1>
          <p className="text-lg text-ink-300">{t("auth.login.subtitle")}</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-[17px] text-ink-300">
          {t("auth.login.noAccount")}{" "}
          <Link
            to="/register"
            className="rounded-sm font-bold text-blush-600 no-underline hover:text-blush-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2"
          >
            {t("auth.login.registerLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
