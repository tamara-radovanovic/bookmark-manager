import type { Tag } from "@bookmark-manager/shared";

interface TagBadgeProps {
  tag: Tag;
  isActive?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export function TagBadge({ tag, isActive, onClick, onRemove }: TagBadgeProps) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-heading text-sm font-semibold ${
        isActive
          ? "bg-linear-to-b from-blush-400 to-blush-500 text-white"
          : "border border-blush-200 bg-blush-100 text-blush-600"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove tag ${tag.name}`}
          className="ml-0.5 leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  );
}
