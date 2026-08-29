import type { CreateTagInput, Tag } from "@bookmark-manager/shared";
import { api } from "./api";

export function listTags(): Promise<Tag[]> {
  return api.get<Tag[]>("/tags").then((res) => res.data);
}

export function createTag(input: CreateTagInput): Promise<Tag> {
  return api.post<Tag>("/tags", input).then((res) => res.data);
}

export function deleteTag(id: string): Promise<void> {
  return api.delete(`/tags/${id}`).then(() => undefined);
}
