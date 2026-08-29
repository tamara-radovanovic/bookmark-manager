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
  const [activeTagNames, setActiveTagNames] = useState<string[]>([]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  function handleToggleTag(name: string) {
    setActiveTagNames((current) =>
      current.includes(name) ? current.filter((tagName) => tagName !== name) : [...current, name],
    );
  }

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

    listBookmarks(search || undefined, activeTagNames.length > 0 ? activeTagNames : undefined)
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
  }, [search, activeTagNames]);

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
      if (deletedTag) {
        setActiveTagNames((current) => current.filter((name) => name !== deletedTag.name));
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
      <main className="mx-auto max-w-[1120px] px-12 pt-14 pb-30">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="mb-2 font-heading text-[44px] font-bold tracking-tight text-ink-900">
              Your bookmarks
            </h1>
            <p className="font-heading text-lg font-bold text-blush-700">
              {bookmarks.length} saved {bookmarks.length === 1 ? "link" : "links"}
            </p>
          </div>
          <Link
            to="/bookmarks/new"
            className="rounded-full bg-linear-to-b from-blush-400 to-blush-500 px-7.5 py-4.5 font-heading text-lg font-bold text-white no-underline shadow-[0_14px_26px_-14px_rgba(226,105,143,0.85)] hover:from-[#ee7fa4] hover:to-[#d75c84]"
          >
            + New bookmark
          </Link>
        </div>

        <div className="mb-9 flex flex-col gap-4">
          <BookmarkSearch onSearch={handleSearch} />

          {tagsError && (
            <p role="alert" className="font-body text-sm text-danger-text">
              {tagsError}
            </p>
          )}
          <TagList
            tags={tags}
            activeTagNames={activeTagNames}
            onToggleTag={handleToggleTag}
            onDeleteTag={handleDeleteTag}
            onCreateTag={handleCreateTag}
          />
        </div>

        {isLoading && <p className="text-lg text-ink-300">Loading...</p>}
        {loadError && (
          <p role="alert" className="font-body text-danger-text">
            {loadError}
          </p>
        )}
        {deleteError && (
          <p role="alert" className="font-body text-danger-text">
            {deleteError}
          </p>
        )}

        {!isLoading && !loadError && (
          <BookmarkList bookmarks={bookmarks} onDelete={handleDelete} deletingId={deletingId} />
        )}
      </main>
    </div>
  );
}
