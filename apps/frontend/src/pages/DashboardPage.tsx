import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Bookmark } from "@bookmark-manager/shared";
import { Navbar } from "../components/layout/Navbar";
import { BookmarkList } from "../components/bookmarks/BookmarkList";
import { deleteBookmark, listBookmarks } from "../services/bookmarks.service";

export function DashboardPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listBookmarks()
      .then((data) => {
        if (!cancelled) {
          setBookmarks(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Couldn't load your bookmarks. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this bookmark?")) {
      return;
    }

    setDeleteError(null);
    setDeletingId(id);
    try {
      await deleteBookmark(id);
      setBookmarks((current) => current.filter((bookmark) => bookmark.id !== id));
    } catch {
      setDeleteError("Couldn't delete this bookmark. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Your bookmarks</h1>
          <Link
            to="/bookmarks/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            New bookmark
          </Link>
        </div>

        {isLoading && <p>Loading...</p>}
        {loadError && (
          <p role="alert" className="text-red-600">
            {loadError}
          </p>
        )}
        {deleteError && (
          <p role="alert" className="text-red-600">
            {deleteError}
          </p>
        )}

        {!isLoading && !loadError && (
          <BookmarkList bookmarks={bookmarks} onDelete={handleDelete} deletingId={deletingId} />
        )}
      </div>
    </div>
  );
}
