import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import type { Bookmark } from "@bookmark-manager/shared";
import { BookmarkList } from "./BookmarkList";
import { renderWithRouter } from "../../test/test-utils";

const bookmark: Bookmark = {
  id: "1",
  url: "https://example.com",
  title: "Example",
  description: null,
  favicon_url: null,
  tags: [],
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("BookmarkList", () => {
  it("renders a BookmarkCard per bookmark when the list isn't empty", () => {
    renderWithRouter(
      <BookmarkList
        bookmarks={[bookmark]}
        onDelete={vi.fn()}
        deletingId={null}
        hasFilters={false}
        onClearFilters={vi.fn()}
      />,
    );

    expect(screen.getByText("Example")).toBeInTheDocument();
    expect(screen.queryByText("No bookmarks yet")).not.toBeInTheDocument();
  });

  it("shows the 'no bookmarks yet' empty state with a create link when there are no filters", () => {
    renderWithRouter(
      <BookmarkList
        bookmarks={[]}
        onDelete={vi.fn()}
        deletingId={null}
        hasFilters={false}
        onClearFilters={vi.fn()}
      />,
    );

    expect(screen.getByText("No bookmarks yet")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "+ Add your first bookmark" });
    expect(link).toHaveAttribute("href", "/bookmarks/new");
    expect(screen.queryByText("No matches found")).not.toBeInTheDocument();
  });

  it("shows the 'no matches' empty state with a Clear filters button when filters are active", async () => {
    const onClearFilters = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <BookmarkList
        bookmarks={[]}
        onDelete={vi.fn()}
        deletingId={null}
        hasFilters
        onClearFilters={onClearFilters}
      />,
    );

    expect(screen.getByText("No matches found")).toBeInTheDocument();
    expect(screen.queryByText("No bookmarks yet")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});
