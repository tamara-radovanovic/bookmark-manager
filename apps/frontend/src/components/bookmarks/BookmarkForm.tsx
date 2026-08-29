import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import type { CreateBookmarkInput } from "@bookmark-manager/shared";

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
