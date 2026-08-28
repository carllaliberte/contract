import { expect, test } from "./fixtures";

test.describe("Landing page", () => {
  test("shows brand, hero, and honest entry", async ({ page, landing }) => {
    await expect(page.locator("h1")).toHaveText(/clapshot/i);
    await expect(page.getByText(/4 ideas|4 idées/i).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /on commence|let['’]s go/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /continuer avec google|continue with google/i }),
    ).toHaveCount(0);
  });

  test("enters demo mode from primary CTA", async ({ page, demoApp }) => {
    await expect(page.getByRole("button", { name: /filme|film/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
