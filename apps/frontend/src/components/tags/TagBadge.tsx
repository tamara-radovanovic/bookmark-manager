import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Tag } from "@bookmark-manager/shared";

interface TagBadgeProps {
  tag: Tag;
  isActive?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2";

export function TagBadge({ tag, isActive, onClick, onRemove }: TagBadgeProps) {
  const { t } = useTranslation();

  // TagBadge doubles as a plain read-only chip (BookmarkCard's tag list, no
  // onClick) and a clickable filter toggle (TagList/BookmarkForm) — a <span>
  // with onClick isn't reachable or activatable by keyboard on its own, so
  // the toggle case needs its own button semantics bolted on.
  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  }

  return (
    <span
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? isActive : undefined}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-heading text-sm font-semibold ${
        isActive
          ? "bg-linear-to-b from-blush-400 to-blush-500 text-white"
          : "border border-blush-200 bg-blush-100 text-blush-600"
      } ${onClick ? `cursor-pointer ${FOCUS_RING}` : ""}`}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label={t("tags.removeTag", { name: tag.name })}
          className={`ml-0.5 cursor-pointer rounded-full leading-none opacity-70 hover:opacity-100 ${FOCUS_RING}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
