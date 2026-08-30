import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Bookmark, Tag } from "@bookmark-manager/shared";
import { Navbar } from "../components/layout/Navbar";
import { BookmarkCardSkeleton } from "../components/bookmarks/BookmarkCardSkeleton";
import { BookmarkList } from "../components/bookmarks/BookmarkList";
import { BookmarkSearch } from "../components/bookmarks/BookmarkSearch";
import { TagList } from "../components/tags/TagList";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useToast } from "../context/ToastContext";
import { deleteBookmark, listBookmarks } from "../services/bookmarks.service";
import { createTag, deleteTag, listTags } from "../services/tags.service";

type PendingDelete = { type: "bookmark"; id: string } | { type: "tag"; id: string; name: string };

export function DashboardPage() {
  const { showSuccess, showError } = useToast();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsError, setTagsError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeTagNames, setActiveTagNames] = useState<string[]>([]);
  // Bumped on "Clear filters" to remount BookmarkSearch — it owns its own
  // input value internally, so resetting `search` here wouldn't otherwise
  // clear the text still shown in the box.
  const [searchResetKey, setSearchResetKey] = useState(0);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  function handleClearFilters() {
    setSearch("");
    setActiveTagNames([]);
    setSearchResetKey((key) => key + 1);
  }

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

  function handleDelete(id: string) {
    setPendingDelete({ type: "bookmark", id });
  }

  function handleDeleteTag(id: string) {
    const tag = tags.find((t) => t.id === id);
    if (!tag) {
      return;
    }
    setPendingDelete({ type: "tag", id, name: tag.name });
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }
    const target = pendingDelete;
    setPendingDelete(null);

    if (target.type === "bookmark") {
      setDeletingId(target.id);
      try {
        await deleteBookmark(target.id);
        setBookmarks((current) => current.filter((bookmark) => bookmark.id !== target.id));
        showSuccess("Bookmark deleted.");
      } catch {
        showError("Couldn't delete this bookmark. Please try again.");
      } finally {
        setDeletingId(null);
      }
      return;
    }

    try {
      await deleteTag(target.id);
      setActiveTagNames((current) => current.filter((name) => name !== target.name));
      loadTags();
      setBookmarks((current) =>
        current.map((bookmark) => ({
          ...bookmark,
          tags: bookmark.tags.filter((tag) => tag.id !== target.id),
        })),
      );
      showSuccess("Tag deleted.");
    } catch {
      showError("Couldn't delete that tag. Please try again.");
    }
  }

  async function handleCreateTag(name: string) {
    await createTag({ name });
    loadTags();
    showSuccess(`Tag "${name}" created.`);
  }

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-360 px-6 pt-14 pb-30 sm:pr-12 sm:pl-20">
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
            className="rounded-full bg-linear-to-b from-blush-400 to-blush-500 px-7.5 py-4.5 font-heading text-lg font-bold text-white no-underline shadow-[0_14px_26px_-14px_rgba(226,105,143,0.85)] hover:from-[#ee7fa4] hover:to-[#d75c84] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2"
          >
            + New bookmark
          </Link>
        </div>

        <div className="mb-9 flex flex-col gap-4">
          <BookmarkSearch key={searchResetKey} onSearch={handleSearch} />

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

        {isLoading && (
          <div className="flex flex-col gap-5">
            <BookmarkCardSkeleton />
            <BookmarkCardSkeleton />
            <BookmarkCardSkeleton />
          </div>
        )}
        {loadError && (
          <p role="alert" className="font-body text-danger-text">
            {loadError}
          </p>
        )}

        {!isLoading && !loadError && (
          <BookmarkList
            bookmarks={bookmarks}
            onDelete={handleDelete}
            deletingId={deletingId}
            hasFilters={Boolean(search) || activeTagNames.length > 0}
            onClearFilters={handleClearFilters}
          />
        )}
      </main>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={pendingDelete?.type === "tag" ? "Delete tag?" : "Delete bookmark?"}
        message={
          pendingDelete?.type === "tag"
            ? `"${pendingDelete.name}" will be removed from any bookmarks that use it.`
            : "Are you sure you want to delete this bookmark?"
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
