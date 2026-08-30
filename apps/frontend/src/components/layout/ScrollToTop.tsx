import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router doesn't reset scroll position on navigation — the browser
// just keeps whatever offset the previous page was at. Harmless when the
// header scrolls away with the page, but now that Navbar is sticky, a
// carried-over offset can land the new page's heading underneath it.
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
