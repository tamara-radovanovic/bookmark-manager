import { useState } from "react";
import type { Tag } from "@bookmark-manager/shared";
import { TagBadge } from "./TagBadge";

interface TagListProps {
  tags: Tag[];
  activeTagName: string | null;
  onSelectTag: (name: string | null) => void;
  onDeleteTag: (id: string) => void;
  onCreateTag: (name: string) => Promise<void>;
}

// Doubles as the tag management UI: clicking a tag filters the dashboard by
// it (clicking the active one again clears the filter), each tag carries a
// delete button, and the input at the bottom creates new tags — there's no
// separate "manage tags" page in the project plan.
export function TagList({
  tags,
  activeTagName,
  onSelectTag,
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
    <div className="flex flex-col gap-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              isActive={activeTagName === tag.name}
              onClick={() => onSelectTag(activeTagName === tag.name ? null : tag.name)}
              onRemove={() => onDeleteTag(tag.id)}
            />
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={(event) => setNewTagName(event.target.value)}
          placeholder="New tag name"
          className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || !newTagName.trim()}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium disabled:opacity-50"
        >
          Add tag
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
