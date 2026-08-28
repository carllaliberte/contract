import { expect, test } from "./fixtures";

test.describe("Landing page", () => {
  test("shows brand, hero, and honest entry", async ({ page, landing }) => {
    await expect(page.getByText("clapshot").first()).toBeVisible();
    await expect(page.locator("h1")).toContainText(/clapshot/i);
    await expect(
      page.getByRole("button", { name: /explorez les scripts clapshot|explore clapshot scripts/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /continuer avec google|continue with google/i }),
    ).toHaveCount(0);
  });

  test("enters demo mode from primary CTA", async ({ page, demoApp }) => {
    await expect(page.locator("h1")).toContainText(/scripts/i, { timeout: 15_000 });
  });
});
