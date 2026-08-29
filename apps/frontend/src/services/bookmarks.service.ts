import type { Bookmark, CreateBookmarkInput, UpdateBookmarkInput } from "@bookmark-manager/shared";
import { api } from "./api";

export function listBookmarks(search?: string, tag?: string): Promise<Bookmark[]> {
  // axios omits params whose value is undefined, so passing both through
  // unconditionally is fine even when one or both are unset.
  return api.get<Bookmark[]>("/bookmarks", { params: { search, tag } }).then((res) => res.data);
}

export function getBookmark(id: string): Promise<Bookmark> {
  return api.get<Bookmark>(`/bookmarks/${id}`).then((res) => res.data);
}

export function createBookmark(input: CreateBookmarkInput): Promise<Bookmark> {
  return api.post<Bookmark>("/bookmarks", input).then((res) => res.data);
}

export function updateBookmark(id: string, input: UpdateBookmarkInput): Promise<Bookmark> {
  return api.patch<Bookmark>(`/bookmarks/${id}`, input).then((res) => res.data);
}

export function deleteBookmark(id: string): Promise<void> {
  return api.delete(`/bookmarks/${id}`).then(() => undefined);
}
