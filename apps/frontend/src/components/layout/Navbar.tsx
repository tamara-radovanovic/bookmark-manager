import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="flex items-center justify-between gap-6 border-b border-blush-200 bg-white/72 px-12 py-5 backdrop-blur-md">
      <Link to="/dashboard" className="flex items-center gap-3.5">
        <img src="/bookmark.png" alt="" className="h-11 w-11 object-contain" />
        <span className="font-heading text-2xl font-bold tracking-tight text-ink-900">
          Bookmark Manager
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="rounded-full border border-blush-300 bg-white px-5.5 py-3.25 font-heading text-[17px] font-semibold text-ink-400 hover:bg-blush-100 hover:text-blush-600"
        >
          Bookmarks
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-blush-300 bg-white px-5.5 py-3.25 font-heading text-[17px] font-semibold text-ink-400 hover:bg-blush-100 hover:text-blush-600"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
