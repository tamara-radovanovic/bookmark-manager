import { test, expect } from "@playwright/test";

// Critical-path smoke test — see README.md's Testing Strategy. Runs against
// a real backend + Postgres (start both before running this suite), so a
// fresh, unique account is used each run instead of relying on fixtures.
test("register, log in, manage a bookmark, then log out", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = "correct-horse-battery-staple";

  await test.step("register", async () => {
    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Your bookmarks" })).toBeVisible();
  });

  await test.step("log out, then log back in", async () => {
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  await test.step("create a bookmark", async () => {
    await page.getByRole("link", { name: "+ New bookmark" }).click();
    await page.getByLabel("URL", { exact: true }).fill("https://react.dev");
    await page.getByLabel("Title").fill("React docs");
    await page.getByLabel("Description").fill("Official React documentation.");
    await page.getByRole("button", { name: "Create bookmark" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Bookmark created.")).toBeVisible();
    await expect(page.getByRole("link", { name: "React docs" })).toBeVisible();
  });

  await test.step("search finds it, an unrelated query doesn't", async () => {
    const search = page.getByRole("searchbox", { name: "Search bookmarks" });

    await search.fill("react");
    await expect(page.getByRole("link", { name: "React docs" })).toBeVisible();

    await search.fill("nothing-should-match-this-xyz");
    await expect(page.getByText("No matches found")).toBeVisible();

    await search.fill("");
    await expect(page.getByRole("link", { name: "React docs" })).toBeVisible();
  });

  await test.step("edit the bookmark", async () => {
    await page.getByRole("link", { name: "Edit" }).click();
    await expect(page.getByRole("heading", { name: "Edit bookmark" })).toBeVisible();

    const title = page.getByLabel("Title");
    await title.fill("");
    await title.fill("React documentation");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Bookmark updated.")).toBeVisible();
    await expect(page.getByRole("link", { name: "React documentation" })).toBeVisible();
  });

  await test.step("delete the bookmark via the confirm dialog", async () => {
    await page.getByRole("button", { name: "Delete" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Bookmark deleted.")).toBeVisible();
    await expect(page.getByText("No bookmarks yet")).toBeVisible();
  });

  await test.step("log out", async () => {
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
