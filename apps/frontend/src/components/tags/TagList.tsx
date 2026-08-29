import { useState } from "react";
import type { Tag } from "@bookmark-manager/shared";
import { TagBadge } from "./TagBadge";

interface TagListProps {
  tags: Tag[];
  activeTagNames: string[];
  onToggleTag: (name: string) => void;
  onDeleteTag: (id: string) => void;
  onCreateTag: (name: string) => Promise<void>;
}

// Doubles as the tag management UI: clicking a tag toggles it into/out of
// the active filter set (multiple tags = AND — a bookmark must have all of
// them), each tag carries a delete button, and the input at the bottom
// creates new tags — there's no separate "manage tags" page in the project plan.
export function TagList({
  tags,
  activeTagNames,
  onToggleTag,
  onDeleteTag,
  onCreateTag,
}: TagListProps) {
  const [newTagName, setNewTagName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    const name = newTagName.trim();
    if (!name) {
      return;
    }

    setError(null);
    setIsCreating(true);
    try {
      await onCreateTag(name);
      setNewTagName("");
    } catch {
      setError("Couldn't create that tag.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              isActive={activeTagNames.includes(tag.name)}
              onClick={() => onToggleTag(tag.name)}
              onRemove={() => onDeleteTag(tag.id)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={(event) => setNewTagName(event.target.value)}
          placeholder="New tag name"
          className="rounded-full border-[1.5px] border-border-input bg-[#fffdfe] px-4 py-2 font-body text-sm text-ink-700 outline-none placeholder:text-ink-200 focus:border-blush-400 focus:shadow-[0_0_0_3px_rgba(233,140,174,0.18)]"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || !newTagName.trim()}
          className="rounded-full border border-blush-300 bg-white px-4 py-2 font-heading text-sm font-semibold text-ink-400 hover:bg-blush-100 hover:text-blush-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add tag
        </button>
      </div>

      {error && (
        <p role="alert" className="font-body text-sm text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
