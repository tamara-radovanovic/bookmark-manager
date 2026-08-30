import { Link } from "react-router-dom";
import type { Bookmark } from "@bookmark-manager/shared";
import { TagBadge } from "../tags/TagBadge";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function BookmarkCard({ bookmark, onDelete, isDeleting }: BookmarkCardProps) {
  const initial = bookmark.title.charAt(0).toUpperCase() || "?";

  return (
    <article className="flex flex-col gap-5 rounded-3xl border border-blush-100 bg-white/92 p-7 shadow-[0_18px_40px_-30px_rgba(160,90,115,0.4)] hover:border-[#f0bfd2] hover:shadow-[0_22px_44px_-26px_rgba(160,90,115,0.45)] sm:flex-row sm:items-start sm:gap-5.5">
      <div className="flex min-w-0 flex-1 items-start gap-5.5">
        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl border border-blush-200 bg-blush-100 font-heading text-[22px] font-bold text-blush-600">
          {bookmark.favicon_url ? (
            <img src={bookmark.favicon_url} alt="" className="h-7 w-7 object-contain" />
          ) : (
            initial
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noreferrer"
            className="font-heading text-2xl font-bold text-ink-900 no-underline hover:text-blush-600"
          >
            {bookmark.title}
          </a>
          <span className="truncate text-[17px] text-ink-400">{bookmark.url}</span>
          {bookmark.description && (
            <p className="mt-1 max-w-prose text-lg text-ink-500">{bookmark.description}</p>
          )}
          {bookmark.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {bookmark.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-none gap-2.5">
        <Link
          to={`/bookmarks/${bookmark.id}/edit`}
          className="rounded-full border border-blush-200 bg-white px-5 py-3 font-heading text-base font-semibold text-ink-400 no-underline hover:bg-blush-100 hover:text-blush-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={() => onDelete(bookmark.id)}
          disabled={isDeleting}
          className="cursor-pointer rounded-full border border-danger-border bg-white px-5 py-3 font-heading text-base font-semibold text-danger-text hover:bg-danger-bg hover:text-danger-text-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
}
