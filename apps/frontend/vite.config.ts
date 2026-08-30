import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
    // e2e/ holds Playwright specs — a different test() API entirely, run
    // via `pnpm test:e2e`, not picked up here.
    exclude: ["**/node_modules/**", "e2e/**"],
  },
});
