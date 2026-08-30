import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const FIELD_CLASSES =
  "rounded-2xl border-2 bg-surface px-5 py-4.5 font-body text-lg text-ink-700 outline-none placeholder:text-ink-200 focus:border-blush-400 focus:shadow-[0_0_0_4px_rgba(233,140,174,0.18)]";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ hasError, className = "", ...props }: InputProps) {
  return (
    <input
      aria-invalid={hasError}
      className={`${FIELD_CLASSES} ${hasError ? "border-danger-border" : "border-border-input"} ${className}`}
      {...props}
    />
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function Textarea({ hasError, className = "", ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={hasError}
      className={`${FIELD_CLASSES} resize-y ${hasError ? "border-danger-border" : "border-border-input"} ${className}`}
      {...props}
    />
  );
}
