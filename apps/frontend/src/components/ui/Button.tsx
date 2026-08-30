import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "pill" | "pill-primary" | "pill-danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Full-width-ish block CTA — form submits (Log in, Create bookmark).
  primary:
    "rounded-2xl bg-linear-to-b from-blush-400 to-blush-500 px-6 py-4.75 text-white shadow-[0_12px_24px_-12px_rgba(226,105,143,0.8)] hover:from-[#ee7fa4] hover:to-[#d75c84]",
  // Block secondary action next to a primary one (Cancel).
  secondary:
    "rounded-2xl border border-blush-300 bg-surface px-7 py-4.75 text-ink-400 hover:bg-blush-100 hover:text-blush-600",
  // Small inline pill action (Navbar links, card "Edit").
  pill: "rounded-full border border-blush-300 bg-surface px-5.5 py-3.25 text-ink-400 hover:bg-blush-100 hover:text-blush-600",
  // Pill CTA that needs to stand out ("+ New bookmark").
  "pill-primary":
    "rounded-full bg-linear-to-b from-blush-400 to-blush-500 px-7.5 py-4.5 text-white shadow-[0_14px_26px_-14px_rgba(226,105,143,0.85)] hover:from-[#ee7fa4] hover:to-[#d75c84]",
  // Pill action that destroys something (card "Delete").
  "pill-danger":
    "rounded-full border border-danger-border bg-surface px-5 py-3 text-danger-text hover:bg-danger-bg hover:text-danger-text-hover",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`cursor-pointer font-heading font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
