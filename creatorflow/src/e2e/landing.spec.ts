import { expect, test } from "./fixtures";

test.describe("Landing page", () => {
  test("shows brand, hero, and honest entry", async ({ page, landing }) => {
    await expect(page.locator("h1")).toHaveText(/clapshot/i);
    await expect(
      page.getByRole("button", {
        name: /explorez les scripts clapshot|explore clapshot scripts/i,
      }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /continuer avec google|continue with google/i }),
    ).toHaveCount(0);
    await expect(page.getByText(/4 ideas|4 idées/i)).toHaveCount(0);
  });

  test("enters demo mode from primary CTA", async ({ page, demoApp }) => {
    await expect(
      page.getByRole("button", { name: /publier sur x|publish on x/i }).first(),
    ).toBeVisible({
      timeout: 15_000,
    });
  });
});
