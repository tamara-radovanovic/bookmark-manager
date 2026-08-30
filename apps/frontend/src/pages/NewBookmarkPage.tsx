import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { CreateBookmarkInput } from "@bookmark-manager/shared";
import { Navbar } from "../components/layout/Navbar";
import { BookmarkForm } from "../components/bookmarks/BookmarkForm";
import { useToast } from "../context/ToastContext";
import { createBookmark } from "../services/bookmarks.service";

export function NewBookmarkPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showSuccess } = useToast();

  async function handleSubmit(values: CreateBookmarkInput) {
    await createBookmark(values);
    navigate("/dashboard");
    showSuccess(t("toast.bookmarkCreated"));
  }

  return (
    <div>
      <Navbar />
      <main className="flex justify-center px-8 pt-18 pb-30">
        <div className="w-full max-w-160 rounded-[28px] border border-blush-100 bg-surface/90 p-12 shadow-[0_24px_60px_-30px_rgba(160,90,115,0.35)]">
          <h1 className="mb-1.5 font-heading text-[38px] font-bold text-ink-900">
            {t("newBookmark.title")}
          </h1>
          <p className="mb-8.5 text-lg text-ink-300">{t("newBookmark.subtitle")}</p>
          <BookmarkForm
            onSubmit={handleSubmit}
            submitLabel={t("newBookmark.submit")}
            onCancel={() => navigate("/dashboard")}
          />
        </div>
      </main>
    </div>
  );
}
