import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <span className="font-semibold">Bookmark Manager</span>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium"
      >
        Log out
      </button>
    </nav>
  );
}
