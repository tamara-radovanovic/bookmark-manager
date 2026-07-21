import type { Tag } from "./tag.types";

/** A bookmark as returned by the API. Field names match the JSON contract documented in README.md. */
export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string | null;
  favicon_url: string | null;
  tags: Tag[];
  created_at: string;
}

/** Body for POST /bookmarks */
export interface CreateBookmarkInput {
  url: string;
  title: string;
  description?: string;
  favicon_url?: string;
  tag_ids?: string[];
}

/** Body for PATCH /bookmarks/:id — every field optional. */
export type UpdateBookmarkInput = Partial<CreateBookmarkInput>;
