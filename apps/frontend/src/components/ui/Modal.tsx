import { useEffect, useRef, type ReactNode, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  children: ReactNode;
  // Which element gets focus on open — defaults to the panel itself.
  // ConfirmDialog points this at its Cancel button so an accidental Enter
  // right after opening can't trigger the destructive action.
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export function Modal({ isOpen, onClose, titleId, children, initialFocusRef }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    (initialFocusRef?.current ?? panelRef.current)?.focus();

    // Prevent the page behind the modal from scrolling while it's open.
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      // Native <dialog>/window.confirm() trap focus inside for free — a
      // hand-rolled overlay has to do it manually, or Tab walks straight
      // into the page content sitting behind the backdrop.
      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [isOpen, onClose, initialFocusRef]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-blush-100 bg-white p-8 shadow-[0_30px_70px_-30px_rgba(160,90,115,0.5)] focus:outline-none"
      >
        {children}
      </div>
    </div>
  );
}
