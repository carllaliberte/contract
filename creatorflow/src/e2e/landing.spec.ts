import { expect, test } from "./fixtures";

test.describe("Landing page", () => {
  test("shows brand, hero, and OAuth providers", async ({ page, landing }) => {
    await expect(page.getByText("CreatorFlow").first()).toBeVisible();
    await expect(page.locator("h1")).toContainText(/créateurs|creators|pipeline/i);

    await expect(
      page.getByRole("button", { name: /continuer avec google|continue with google/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /continuer avec x|continue with x/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /continuer avec github|continue with github/i }),
    ).toBeVisible();
  });

  test("enters demo mode from primary CTA", async ({ page, demoApp }) => {
    await expect(page.getByText(/mode démo|demo mode/i)).toBeVisible();
    await expect(page.locator("h1")).toContainText(/Bonjour|Hello/);
  });

  test("OAuth buttons route to demo (mock auth)", async ({ page, landing }) => {
    await page
      .getByRole("button", { name: /continuer avec google|continue with google/i })
      .click();
    await page.waitForURL(/\/app/);
    await expect(page.locator("h1")).toContainText(/Bonjour|Hello/);
  });
});
