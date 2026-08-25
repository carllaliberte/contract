import { expect, test } from "@playwright/test";

test.describe("CreatorFlow smoke", () => {
  test("landing page loads with brand and hero", async ({ page }) => {
    await page.goto("./");
    await expect(page.getByText("CreatorFlow").first()).toBeVisible();
    await expect(page.locator("h1")).toBeVisible();
  });

  test("demo CTA opens the app shell", async ({ page }) => {
    await page.goto("./");
    await page
      .getByRole("button", { name: /explorer sans compte|explore without account/i })
      .first()
      .click();
    await page.waitForURL(/\/app/);
    await expect(page.locator("h1")).toContainText(/Bonjour|Hello/);
  });
});
