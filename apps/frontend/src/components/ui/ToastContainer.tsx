import { useToast } from "../../context/ToastContext";
import { Toast } from "./Toast";

// Sits below the Navbar (~84px tall) so it never covers the Logout button,
// and above everything else on the page.
export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed top-24 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
