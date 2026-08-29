import { Link } from "react-router-dom";
import type { Bookmark } from "@bookmark-manager/shared";
import { TagBadge } from "../tags/TagBadge";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function BookmarkCard({ bookmark, onDelete, isDeleting }: BookmarkCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4">
      <div className="flex items-start gap-2">
        {bookmark.favicon_url && <img src={bookmark.favicon_url} alt="" className="mt-1 h-4 w-4" />}
        <div className="min-w-0 flex-1">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-blue-600 hover:underline"
          >
            {bookmark.title}
          </a>
          <p className="truncate text-sm text-gray-500">{bookmark.url}</p>
        </div>
      </div>

      {bookmark.description && <p className="text-sm text-gray-700">{bookmark.description}</p>}

      {bookmark.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {bookmark.tags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      )}

      <div className="flex gap-3 text-sm">
        <Link to={`/bookmarks/${bookmark.id}/edit`} className="text-blue-600 hover:underline">
          Edit
        </Link>
        <button
          type="button"
          onClick={() => onDelete(bookmark.id)}
          disabled={isDeleting}
          className="text-red-600 hover:underline disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
