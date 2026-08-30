import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-blush-200 bg-surface/72 px-6 py-5 backdrop-blur-md sm:px-12">
      <Link
        to="/dashboard"
        className="flex items-center gap-3.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2"
      >
        <img src="/bookmark.png" alt="" className="h-11 w-11 object-contain" />
        <span className="font-heading text-2xl font-bold tracking-tight text-ink-900">
          {t("nav.brand")}
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <LanguageSwitcher />
        <Link
          to="/dashboard"
          className="rounded-full border border-blush-300 bg-surface px-5.5 py-3.25 font-heading text-[17px] font-semibold text-ink-400 hover:bg-blush-100 hover:text-blush-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2"
        >
          {t("nav.bookmarks")}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="cursor-pointer rounded-full border border-blush-300 bg-surface px-5.5 py-3.25 font-heading text-[17px] font-semibold text-ink-400 hover:bg-blush-100 hover:text-blush-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2"
        >
          {t("nav.logout")}
        </button>
      </div>
    </header>
  );
}
