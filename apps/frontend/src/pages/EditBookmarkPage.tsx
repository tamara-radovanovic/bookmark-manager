import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Bookmark, CreateBookmarkInput } from "@bookmark-manager/shared";
import { Navbar } from "../components/layout/Navbar";
import { BookmarkForm } from "../components/bookmarks/BookmarkForm";
import { Spinner } from "../components/ui/Spinner";
import { useToast } from "../context/ToastContext";
import { getBookmark, updateBookmark } from "../services/bookmarks.service";

export function EditBookmarkPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    getBookmark(id)
      .then(setBookmark)
      .catch(() => setLoadError("Couldn't load this bookmark."))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleSubmit(values: CreateBookmarkInput) {
    if (!id) {
      return;
    }
    await updateBookmark(id, values);
    navigate("/dashboard");
    showSuccess("Bookmark updated.");
  }

  return (
    <div>
      <Navbar />
      <main className="flex justify-center px-8 pt-18 pb-30">
        <div className="w-full max-w-160 rounded-[28px] border border-blush-100 bg-white/90 p-12 shadow-[0_24px_60px_-30px_rgba(160,90,115,0.35)]">
          <h1 className="mb-1.5 font-heading text-[38px] font-bold text-ink-900">Edit bookmark</h1>
          <p className="mb-8.5 text-lg text-ink-300">Update this link on your shelf.</p>

          {isLoading && (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}
          {loadError && (
            <p role="alert" className="font-body text-danger-text">
              {loadError}
            </p>
          )}
          {bookmark && (
            <BookmarkForm
              initialValues={{
                url: bookmark.url,
                title: bookmark.title,
                description: bookmark.description ?? undefined,
                favicon_url: bookmark.favicon_url ?? undefined,
                tag_ids: bookmark.tags.map((tag) => tag.id),
              }}
              onSubmit={handleSubmit}
              submitLabel="Save changes"
              onCancel={() => navigate("/dashboard")}
            />
          )}
        </div>
      </main>
    </div>
  );
}
