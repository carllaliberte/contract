import { expect, test } from "./fixtures";

test.describe("Calendar", () => {
  test.beforeEach(async ({ page, demoApp }) => {
    await page.goto("./app/calendrier");
    await page.waitForURL(/\/app\/calendrier/);
  });

  test("renders calendar heading and weekday labels", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Calendrier|Calendar/i })).toBeVisible();
    const weekdayHeaders = page.locator(".grid.grid-cols-7.border-b .text-center");
    await expect(weekdayHeaders).toHaveCount(7);
  });

  test("shows scheduled demo ideas in the grid", async ({ page }) => {
    await expect(page.getByText(/Routine créateur 60 secondes|Routine creator/i)).toBeVisible();
  });
}
