import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { BookmarkForm } from "./BookmarkForm";
import { createTag, listTags } from "../../services/tags.service";

vi.mock("../../services/tags.service");

const mockedListTags = vi.mocked(listTags);
const mockedCreateTag = vi.mocked(createTag);

beforeEach(() => {
  mockedListTags.mockResolvedValue([]);
});

describe("BookmarkForm", () => {
  it("shows field errors and never calls onSubmit when URL and title are empty", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <BookmarkForm onSubmit={onSubmit} submitLabel="Create bookmark" onCancel={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "Create bookmark" }));

    expect(screen.getByText("URL is required.")).toBeInTheDocument();
    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the trimmed payload, including undefined for empty optional fields", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <BookmarkForm onSubmit={onSubmit} submitLabel="Create bookmark" onCancel={vi.fn()} />,
    );

    await user.type(screen.getByLabelText("URL"), "https://example.com");
    await user.type(screen.getByLabelText("Title"), "Example");
    await user.click(screen.getByRole("button", { name: "Create bookmark" }));

    expect(onSubmit).toHaveBeenCalledWith({
      url: "https://example.com",
      title: "Example",
      description: undefined,
      favicon_url: undefined,
      tag_ids: [],
    });
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<BookmarkForm onSubmit={vi.fn()} submitLabel="Create bookmark" onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("pre-fills fields and pre-selects tags from initialValues (edit mode)", async () => {
    mockedListTags.mockResolvedValue([
      { id: "tag-1", name: "reading" },
      { id: "tag-2", name: "work" },
    ]);

    render(
      <BookmarkForm
        initialValues={{ url: "https://existing.com", title: "Existing", tag_ids: ["tag-1"] }}
        onSubmit={vi.fn()}
        submitLabel="Save changes"
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("URL")).toHaveValue("https://existing.com");
    expect(screen.getByLabelText("Title")).toHaveValue("Existing");
    expect(await screen.findByRole("button", { name: "reading" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "work" })).toHaveAttribute("aria-pressed", "false");
  });

  it("creates a tag inline and selects it, without submitting the form", async () => {
    const newTag = { id: "tag-new", name: "urgent" };
    mockedCreateTag.mockResolvedValue(newTag);
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<BookmarkForm onSubmit={onSubmit} submitLabel="Create bookmark" onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("New tag name"), "urgent");
    await user.click(screen.getByRole("button", { name: "+ Add tag" }));

    expect(mockedCreateTag).toHaveBeenCalledWith({ name: "urgent" });
    expect(await screen.findByRole("button", { name: "urgent" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("New tag name")).toHaveValue("");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a translated error when creating a duplicate tag fails", async () => {
    mockedCreateTag.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error_code: "TAG_ALREADY_EXISTS" } },
    });
    const user = userEvent.setup();
    render(<BookmarkForm onSubmit={vi.fn()} submitLabel="Create bookmark" onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("New tag name"), "reading");
    await user.click(screen.getByRole("button", { name: "+ Add tag" }));

    expect(
      await screen.findByText("You already have a tag with that name."),
    ).toBeInTheDocument();
  });

  it("shows a translated form error and re-enables the submit button when onSubmit rejects", async () => {
    const onSubmit = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: { data: { error_code: "VALIDATION_FAILED" } },
    });
    const user = userEvent.setup();
    render(<BookmarkForm onSubmit={onSubmit} submitLabel="Create bookmark" onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("URL"), "https://example.com");
    await user.type(screen.getByLabelText("Title"), "Example");
    await user.click(screen.getByRole("button", { name: "Create bookmark" }));

    expect(
      await screen.findByText("Please check your input and try again."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create bookmark" })).toBeEnabled();
  });
});
