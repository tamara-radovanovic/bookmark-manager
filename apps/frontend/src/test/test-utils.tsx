// Test-only helper module, never imported by the running app — the
// react-refresh rule (which cares about Vite's dev-server hot-reload) has
// nothing to protect here, and its `export *` re-export can't satisfy it anyway.
/* eslint-disable react-refresh/only-export-components */
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement, ReactNode } from "react";

function Providers({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

// Most components touch <Link>/useNavigate somewhere in their tree (directly
// or via a child), so route them all through a MemoryRouter by default.
export function renderWithRouter(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: Providers, ...options });
}

export * from "@testing-library/react";
