import type { Bookmark } from "@bookmark-manager/shared";
import { BookmarkCard } from "./BookmarkCard";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export function BookmarkList({ bookmarks, onDelete, deletingId }: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return <p className="text-lg text-ink-300">No bookmarks yet.</p>;
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
