import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Bookmark, CreateBookmarkInput } from "@bookmark-manager/shared";
import { Navbar } from "../components/layout/Navbar";
import { BookmarkForm } from "../components/bookmarks/BookmarkForm";
import { getBookmark, updateBookmark } from "../services/bookmarks.service";

export function EditBookmarkPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  }

  return (
    <div>
      <Navbar />
      <div className="flex flex-col items-center gap-6 p-6">
        <h1 className="text-2xl font-semibold">Edit bookmark</h1>
        {isLoading && <p>Loading...</p>}
        {loadError && (
          <p role="alert" className="text-red-600">
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
          />
        )}
      </div>
    </div>
  );
}
