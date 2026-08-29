import { Navbar } from "../components/layout/Navbar";

// Placeholder — the actual bookmark list, search, and tag filters arrive
// in Phase 3/4. For now this just proves the protected route + Navbar work.
export function DashboardPage() {
  return (
    <div>
      <Navbar />
      <div className="p-6">
        <p>You're logged in. Bookmarks go here in a later phase.</p>
      </div>
    </div>
  );
}
