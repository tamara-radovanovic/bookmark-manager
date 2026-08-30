import { Link } from "react-router-dom";
import type { Bookmark } from "@bookmark-manager/shared";
import { BookmarkCard } from "./BookmarkCard";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onDelete: (id: string) => void;
  deletingId: string | null;
  // Distinguishes "you have no bookmarks at all" from "your search/tag
  // filters matched nothing" — they need different messages and actions.
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function BookmarkList({
  bookmarks,
  onDelete,
  deletingId,
  hasFilters,
  onClearFilters,
}: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-blush-200 bg-white/60 px-8 py-16 text-center">
        {hasFilters ? (
          <>
            <p className="font-heading text-xl font-bold text-ink-900">No matches found</p>
            <p className="text-lg text-ink-300">No bookmarks match your search or tag filters.</p>
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-2 cursor-pointer rounded-full border border-blush-300 bg-white px-5.5 py-3.25 font-heading text-base font-semibold text-ink-400 hover:bg-blush-100 hover:text-blush-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2"
            >
              Clear filters
            </button>
          </>
        ) : (
          <>
            <p className="font-heading text-xl font-bold text-ink-900">No bookmarks yet</p>
            <p className="text-lg text-ink-300">Save your first link to start your shelf.</p>
            <Link
              to="/bookmarks/new"
              className="mt-2 rounded-full bg-linear-to-b from-blush-400 to-blush-500 px-6 py-3.25 font-heading text-base font-bold text-white no-underline hover:from-[#ee7fa4] hover:to-[#d75c84] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2"
            >
              + Add your first bookmark
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          onDelete={onDelete}
          isDeleting={deletingId === bookmark.id}
        />
      ))}
    </div>
  );
}
