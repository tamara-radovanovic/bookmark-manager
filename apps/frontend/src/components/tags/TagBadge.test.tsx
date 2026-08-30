import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { TagBadge } from "./TagBadge";

const tag = { id: "1", name: "reading" };

describe("TagBadge", () => {
  it("renders as plain, non-interactive text when neither onClick nor onRemove is given", () => {
    render(<TagBadge tag={tag} />);

    const chip = screen.getByText("reading");
    expect(chip).not.toHaveAttribute("role");
    expect(chip).not.toHaveAttribute("tabindex");
  });

  it("is keyboard-reachable and toggleable when onClick is given (BookmarkForm/TagList usage)", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<TagBadge tag={tag} onClick={onClick} isActive={false} />);

    const chip = screen.getByRole("button", { name: "reading" });
    expect(chip).toHaveAttribute("aria-pressed", "false");

    await user.click(chip);
    expect(onClick).toHaveBeenCalledTimes(1);

    chip.focus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(2);

    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("reflects isActive via aria-pressed", () => {
    render(<TagBadge tag={tag} onClick={() => {}} isActive />);
    expect(screen.getByRole("button", { name: "reading" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("calls onRemove without also firing onClick (stopPropagation)", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onRemove = vi.fn();
    render(<TagBadge tag={tag} onClick={onClick} onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Remove tag reading" }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });
});
