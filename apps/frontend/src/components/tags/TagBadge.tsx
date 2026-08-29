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
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
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
