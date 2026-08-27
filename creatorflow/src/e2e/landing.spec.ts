import { expect, test } from "./fixtures";

test.describe("Landing page", () => {
  test("shows brand, hero, and OAuth providers", async ({ page, landing }) => {
    await expect(page.getByText("CreatorFlow").first()).toBeVisible();
    await expect(page.locator("h1")).toContainText(
      /4 ideas|4 idées|booth|friction|publiez|publish/i,
    );

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
    await expect(page.locator("span.rounded-full", { hasText: /mode démo|demo mode/i })).toBeVisible();
    await expect(page.locator("h1")).toContainText(/Bonjour|Hello/, { timeout: 15_000 });
  });

  test("OAuth buttons route to demo (mock auth)", async ({ page, landing }) => {
    await page
      .getByRole("button", { name: /continuer avec google|continue with google/i })
      .click();
    await page.waitForURL(/\/app/);
    await expect(page.locator("h1")).toContainText(/Bonjour|Hello/);
  });
});
