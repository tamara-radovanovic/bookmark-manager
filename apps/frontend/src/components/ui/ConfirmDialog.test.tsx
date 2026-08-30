import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { ConfirmDialog } from "./ConfirmDialog";

// Mirrors how DashboardPage actually uses it: a trigger button toggles
// `isOpen`, so we can exercise the real open -> close -> focus-restore cycle.
function Harness() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(0);

  return (
    <div>
      <button type="button" onClick={() => setIsOpen(true)}>
        Delete bookmark
      </button>
      <p>Confirmed {confirmed} times</p>
      <ConfirmDialog
        isOpen={isOpen}
        title="Delete bookmark?"
        message="This can't be undone."
        onConfirm={() => {
          setConfirmed((count) => count + 1);
          setIsOpen(false);
        }}
        onCancel={() => setIsOpen(false)}
      />
    </div>
  );
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole("button", { name: "Delete bookmark" });
  trigger.focus();
  await user.click(trigger);
  await screen.findByRole("dialog");
  return trigger;
}

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(<Harness />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens with focus on Cancel, not the destructive Delete button", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await openDialog(user);

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Delete bookmark?");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("closes on Escape without confirming", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openDialog(user);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Confirmed 0 times")).toBeInTheDocument();
  });

  it("closes on backdrop click but not on a click inside the panel", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    await openDialog(user);

    // Click inside the panel first — must NOT close.
    await user.click(screen.getByText("This can't be undone."));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // The backdrop is the dialog's positioning parent, not the panel itself.
    const backdrop = container.querySelector(".fixed.inset-0") as HTMLElement;
    await user.click(backdrop);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("confirming calls onConfirm and closes", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openDialog(user);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Confirmed 1 times")).toBeInTheDocument();
  });

  it("traps Tab focus inside the dialog", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openDialog(user);

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    const deleteBtn = screen.getByRole("button", { name: "Delete" });

    expect(cancelBtn).toHaveFocus();
    await user.tab();
    expect(deleteBtn).toHaveFocus();
    await user.tab();
    expect(cancelBtn).toHaveFocus(); // wraps forward past the last element

    await user.tab({ shift: true });
    expect(deleteBtn).toHaveFocus(); // wraps backward past the first element
  });

  it("restores focus to the trigger element after closing", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = await openDialog(user);

    await user.keyboard("{Escape}");

    expect(trigger).toHaveFocus();
  });
});
