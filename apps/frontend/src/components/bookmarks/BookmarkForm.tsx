import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import type { CreateBookmarkInput, Tag } from "@bookmark-manager/shared";
import { createTag, listTags } from "../../services/tags.service";

interface FieldErrors {
  url?: string;
  title?: string;
}

function validate(url: string, title: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!url) {
    errors.url = "URL is required.";
  }

  if (!title) {
    errors.title = "Title is required.";
  }

  return errors;
}

interface BookmarkFormProps {
  initialValues?: Partial<CreateBookmarkInput>;
  onSubmit: (values: CreateBookmarkInput) => Promise<void>;
  submitLabel: string;
}

export function BookmarkForm({ initialValues, onSubmit, submitLabel }: BookmarkFormProps) {
  const [url, setUrl] = useState(initialValues?.url ?? "");
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [faviconUrl, setFaviconUrl] = useState(initialValues?.favicon_url ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialValues?.tag_ids ?? []);
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  useEffect(() => {
    listTags()
      .then(setAvailableTags)
      .catch(() => setTagError("Couldn't load your tags."));
  }, []);

  function toggleTag(id: string) {
    setSelectedTagIds((current) =>
      current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id],
    );
  }

  async function handleCreateTag() {
    const name = newTagName.trim();
    if (!name) {
      return;
    }

    setTagError(null);
    setIsCreatingTag(true);
    try {
      const tag = await createTag({ name });
      setAvailableTags((current) => [...current, tag]);
      setSelectedTagIds((current) => [...current, tag.id]);
      setNewTagName("");
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setTagError("You already have a tag with that name.");
      } else {
        setTagError("Couldn't create that tag. Please try again.");
      }
    } finally {
      setIsCreatingTag(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const errors = validate(url, title);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        url,
        title,
        description: description || undefined,
        favicon_url: faviconUrl || undefined,
        tag_ids: selectedTagIds,
      });
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 400) {
        setFormError("Please check the URL and title.");
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="url" className="text-sm font-medium">
          URL
        </label>
        <input
          id="url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          aria-invalid={Boolean(fieldErrors.url)}
          aria-describedby={fieldErrors.url ? "url-error" : undefined}
          className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
        {fieldErrors.url && (
          <p id="url-error" role="alert" className="text-sm text-red-600">
            {fieldErrors.url}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-invalid={Boolean(fieldErrors.title)}
          aria-describedby={fieldErrors.title ? "title-error" : undefined}
          className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
        {fieldErrors.title && (
          <p id="title-error" role="alert" className="text-sm text-red-600">
            {fieldErrors.title}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="favicon_url" className="text-sm font-medium">
          Favicon URL (optional)
        </label>
        <input
          id="favicon_url"
          type="url"
          value={faviconUrl}
          onChange={(event) => setFaviconUrl(event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Tags (optional)</legend>

        {availableTags.length > 0 && (
          <div className="flex flex-col gap-1">
            {availableTags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={() => toggleTag(tag.id)}
                />
                {tag.name}
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(event) => setNewTagName(event.target.value)}
            placeholder="New tag name"
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCreateTag}
            disabled={isCreatingTag || !newTagName.trim()}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            Add tag
          </button>
        </div>

        {tagError && (
          <p role="alert" className="text-sm text-red-600">
            {tagError}
          </p>
        )}
      </fieldset>

      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
