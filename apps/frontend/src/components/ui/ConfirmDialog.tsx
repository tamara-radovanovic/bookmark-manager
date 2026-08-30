import { useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal isOpen={isOpen} onClose={onCancel} titleId={titleId} initialFocusRef={cancelRef}>
      <h2 id={titleId} className="font-heading text-2xl font-bold text-ink-900">
        {title}
      </h2>
      <p className="mt-3 text-lg text-ink-400">{message}</p>
      <div className="mt-7 flex justify-end gap-3">
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-full border border-blush-300 bg-surface px-6 py-3.25 font-heading text-base font-semibold text-ink-400 hover:bg-blush-100 hover:text-blush-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2"
        >
          {t("confirmDialog.cancel")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="cursor-pointer rounded-full border border-danger-border bg-surface px-6 py-3.25 font-heading text-base font-semibold text-danger-text hover:bg-danger-bg hover:text-danger-text-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2"
        >
          {confirmLabel ?? t("confirmDialog.confirmDelete")}
        </button>
      </div>
    </Modal>
  );
}
