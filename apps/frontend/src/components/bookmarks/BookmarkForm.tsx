import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { CreateBookmarkInput, Tag } from "@bookmark-manager/shared";
import { getApiErrorMessage } from "../../i18n/get-api-error-message";
import { createTag, listTags } from "../../services/tags.service";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Input";
import { TagBadge } from "../tags/TagBadge";

interface FieldErrors {
  url?: string;
  title?: string;
}

function validate(url: string, title: string, t: TFunction): FieldErrors {
  const errors: FieldErrors = {};

  if (!url) {
    errors.url = t("bookmarkForm.urlRequired");
  }

  if (!title) {
    errors.title = t("bookmarkForm.titleRequired");
  }

  return errors;
}

interface BookmarkFormProps {
  initialValues?: Partial<CreateBookmarkInput>;
  onSubmit: (values: CreateBookmarkInput) => Promise<void>;
  submitLabel: string;
  onCancel: () => void;
}

export function BookmarkForm({
  initialValues,
  onSubmit,
  submitLabel,
  onCancel,
}: BookmarkFormProps) {
  const { t } = useTranslation();
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
      .catch((err) => setTagError(getApiErrorMessage(err, t)));
  }, [t]);

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
      setTagError(getApiErrorMessage(err, t));
    } finally {
      setIsCreatingTag(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const errors = validate(url, title, t);
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
      setFormError(getApiErrorMessage(err, t));
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <label className="flex flex-col gap-2.5 font-heading text-lg font-semibold text-ink-500">
        {t("bookmarkForm.urlLabel")}
        <Input
          id="url"
          type="url"
          placeholder={t("bookmarkForm.urlPlaceholder")}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          hasError={Boolean(fieldErrors.url)}
          aria-describedby={fieldErrors.url ? "url-error" : undefined}
        />
        {fieldErrors.url && (
          <p id="url-error" role="alert" className="font-body text-sm font-normal text-danger-text">
            {fieldErrors.url}
          </p>
        )}
      </label>

      <label className="flex flex-col gap-2.5 font-heading text-lg font-semibold text-ink-500">
        {t("bookmarkForm.titleLabel")}
        <Input
          id="title"
          type="text"
          placeholder={t("bookmarkForm.titlePlaceholder")}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          hasError={Boolean(fieldErrors.title)}
          aria-describedby={fieldErrors.title ? "title-error" : undefined}
        />
        {fieldErrors.title && (
          <p
            id="title-error"
            role="alert"
            className="font-body text-sm font-normal text-danger-text"
          >
            {fieldErrors.title}
          </p>
        )}
      </label>

      <label className="flex flex-col gap-2.5 font-heading text-lg font-semibold text-ink-500">
        {t("bookmarkForm.descriptionLabel")}{" "}
        <span className="font-body font-normal text-ink-200">{t("common.optional")}</span>
        <Textarea
          id="description"
          rows={4}
          placeholder={t("bookmarkForm.descriptionPlaceholder")}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-2.5 font-heading text-lg font-semibold text-ink-500">
        {t("bookmarkForm.faviconLabel")}{" "}
        <span className="font-body font-normal text-ink-200">{t("common.optional")}</span>
        <Input
          id="favicon_url"
          type="url"
          placeholder={t("bookmarkForm.faviconPlaceholder")}
          value={faviconUrl}
          onChange={(event) => setFaviconUrl(event.target.value)}
        />
      </label>

      <div className="flex flex-col gap-2.5">
        <span className="font-heading text-lg font-semibold text-ink-500">
          {t("bookmarkForm.tagsLabel")}{" "}
          <span className="font-body font-normal text-ink-200">{t("common.optional")}</span>
        </span>

        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <TagBadge
                key={tag.id}
                tag={tag}
                isActive={selectedTagIds.includes(tag.id)}
                onClick={() => toggleTag(tag.id)}
              />
            ))}
          </div>
        )}

        <div className="mt-1 flex items-center gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(event) => setNewTagName(event.target.value)}
            placeholder={t("tags.newTagPlaceholder")}
            aria-label={t("tags.newTagPlaceholder")}
            className="min-w-0 max-w-48 rounded-full border-2 border-border-input bg-surface px-4 py-2 font-body text-sm text-ink-700 outline-none placeholder:text-ink-200 focus:border-blush-400 focus:shadow-[0_0_0_3px_rgba(233,140,174,0.18)]"
          />
          <button
            type="button"
            onClick={handleCreateTag}
            disabled={isCreatingTag || !newTagName.trim()}
            className="shrink-0 cursor-pointer rounded-full border border-blush-300 bg-surface px-4 py-2 font-heading text-sm font-semibold whitespace-nowrap text-ink-400 hover:bg-blush-100 hover:text-blush-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("tags.addTag")}
          </button>
        </div>

        {tagError && (
          <p role="alert" className="font-body text-sm text-danger-text">
            {tagError}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="font-body text-base text-danger-text">
          {formError}
        </p>
      )}

      <div className="mt-1.5 flex gap-3.5">
        <Button type="submit" disabled={isSubmitting} className="flex-1 text-lg">
          {isSubmitting ? t("bookmarkForm.saving") : submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="text-lg">
          {t("bookmarkForm.cancel")}
        </Button>
      </div>
    </form>
  );
}
