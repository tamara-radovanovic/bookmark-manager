import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Bookmark, Tag } from "@bookmark-manager/shared";
import { Navbar } from "../components/layout/Navbar";
import { BookmarkList } from "../components/bookmarks/BookmarkList";
import { BookmarkSearch } from "../components/bookmarks/BookmarkSearch";
import { TagList } from "../components/tags/TagList";
import { deleteBookmark, listBookmarks } from "../services/bookmarks.service";
import { createTag, deleteTag, listTags } from "../services/tags.service";

export function DashboardPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsError, setTagsError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeTagName, setActiveTagName] = useState<string | null>(null);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const loadTags = useCallback(() => {
    listTags()
      .then(setTags)
      .catch(() => setTagsError("Couldn't load your tags."));
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // No isLoading(true) reset here on purpose — only the very first load shows
  // the loading state; search/tag-filter changes swap the list in place
  // without a flicker, which reads better for a debounced search box.
  useEffect(() => {
    let cancelled = false;

    listBookmarks(search || undefined, activeTagName || undefined)
      .then((data) => {
        if (!cancelled) {
          setBookmarks(data);
          setLoadError(null);
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
  }, [search, activeTagName]);

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

  async function handleDeleteTag(id: string) {
    if (!window.confirm("Delete this tag? It will be removed from any bookmarks that use it.")) {
      return;
    }

    try {
      await deleteTag(id);
      const deletedTag = tags.find((tag) => tag.id === id);
      if (deletedTag && deletedTag.name === activeTagName) {
        setActiveTagName(null);
      }
      loadTags();
      setBookmarks((current) =>
        current.map((bookmark) => ({
          ...bookmark,
          tags: bookmark.tags.filter((tag) => tag.id !== id),
        })),
      );
    } catch {
      setTagsError("Couldn't delete that tag. Please try again.");
    }
  }

  async function handleCreateTag(name: string) {
    await createTag({ name });
    loadTags();
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

        <BookmarkSearch onSearch={handleSearch} />

        {tagsError && (
          <p role="alert" className="text-sm text-red-600">
            {tagsError}
          </p>
        )}
        <TagList
          tags={tags}
          activeTagName={activeTagName}
          onSelectTag={setActiveTagName}
          onDeleteTag={handleDeleteTag}
          onCreateTag={handleCreateTag}
        />

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
