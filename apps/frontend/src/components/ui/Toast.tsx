import { useEffect, useRef, useState } from "react";
import type { ToastData } from "../../context/ToastContext";

// Error toasts stay up longer than success ones — a failure is more
// important to not miss than a quiet confirmation.
const DURATIONS_MS: Record<ToastData["type"], number> = {
  success: 4000,
  error: 7000,
};

// Must match the transition duration in the className below — the toast is
// only removed from state once its fade/slide-out animation has finished.
const EXIT_ANIMATION_MS = 200;

const VARIANT_CLASSES: Record<ToastData["type"], string> = {
  success: "border-success-border bg-success-bg text-success-text",
  error: "border-danger-border bg-danger-bg text-danger-text",
};

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDismiss() {
    setIsLeaving(true);
    setTimeout(() => onDismiss(toast.id), EXIT_ANIMATION_MS);
  }

  function startAutoDismissTimer() {
    timeoutRef.current = setTimeout(handleDismiss, DURATIONS_MS[toast.type]);
  }

  // Mount transition: render in the "hidden" state first, then flip to
  // visible on the next frame so the browser has a starting point to
  // transition from (toggling both classes in the same render never animates).
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    startAutoDismissTimer();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // Auto-dismiss timer is started once on mount and otherwise only
    // reset by hover handlers below — it must not restart on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleMouseEnter() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }

  function handleMouseLeave() {
    startAutoDismissTimer();
  }

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`flex w-[min(24rem,calc(100vw_-_3rem))] items-start gap-3 rounded-2xl border p-4 pr-3 shadow-[0_18px_40px_-24px_rgba(160,90,115,0.45)] transition-all duration-200 ease-out ${
        VARIANT_CLASSES[toast.type]
      } ${isVisible && !isLeaving ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
    >
      <p className="flex-1 font-body text-sm font-semibold">{toast.message}</p>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 cursor-pointer rounded-full p-1 text-lg leading-none text-current opacity-60 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
      >
        ×
      </button>
    </div>
  );
}
