import { useNavigate } from "react-router-dom";
import type { CreateBookmarkInput } from "@bookmark-manager/shared";
import { Navbar } from "../components/layout/Navbar";
import { BookmarkForm } from "../components/bookmarks/BookmarkForm";
import { createBookmark } from "../services/bookmarks.service";

export function NewBookmarkPage() {
  const navigate = useNavigate();

  async function handleSubmit(values: CreateBookmarkInput) {
    await createBookmark(values);
    navigate("/dashboard");
  }

  return (
    <div>
      <Navbar />
      <div className="flex flex-col items-center gap-6 p-6">
        <h1 className="text-2xl font-semibold">New bookmark</h1>
        <BookmarkForm onSubmit={handleSubmit} submitLabel="Create bookmark" />
      </div>
    </div>
  );
}
