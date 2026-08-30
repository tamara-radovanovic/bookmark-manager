import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type ToastType = "success" | "error";

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: ToastData[];
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((type: ToastType, message: string) => {
    // crypto.randomUUID() needs a secure context (https, or localhost in dev)
    // — true everywhere this app is served, so no extra fallback needed.
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, type, message }]);
  }, []);

  const showSuccess = useCallback((message: string) => show("success", message), [show]);
  const showError = useCallback((message: string) => show("error", message), [show]);

  return (
    <ToastContext.Provider value={{ toasts, showSuccess, showError, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

// Co-locating the hook with its Context/Provider is the standard pattern;
// this only affects Fast Refresh's dev-mode hot-reload, not runtime correctness.
// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
