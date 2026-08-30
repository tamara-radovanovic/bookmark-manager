interface SpinnerProps {
  className?: string;
}

// role="status" announces itself to screen readers on its own — no visible
// text needed alongside it.
export function Spinner({ className = "" }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`h-8 w-8 animate-spin rounded-full border-4 border-blush-200 border-t-blush-500 ${className}`}
    />
  );
}
