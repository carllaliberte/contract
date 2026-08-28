import { expect, test } from "./fixtures";

test.describe("Landing page", () => {
  test("shows brand, hero, and honest entry", async ({ page, landing }) => {
    await expect(page.getByText("Clapshot").first()).toBeVisible();
    await expect(page.locator("h1")).toContainText(/4 idées|4 ideas/i);
    await expect(page.locator("h1")).not.toContainText(/friction|synergy|credit card|publish more content/i);

    await expect(
      page.getByRole("button", { name: /explorez les scripts clapshot|explore clapshot scripts/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /explorer sans compte|explore without account/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /continuer avec google|continue with google/i }),
    ).toHaveCount(0);
  });

  test("enters demo mode from primary CTA", async ({ page, demoApp }) => {
    await expect(page.locator("h1")).toContainText(
      /4 ideas|4 idées|Publie|Publish|Tourne|Film|Écris|Write|Fais avancer|Move/,
      { timeout: 15_000 },
    );
  });

  test("explore without account opens demo", async ({ page, landing }) => {
    await page
      .getByRole("button", { name: /explorer sans compte|explore without account/i })
      .click();
    await page.waitForURL(/\/app/);
    await expect(page.locator("h1")).toBeVisible();
  });
});
