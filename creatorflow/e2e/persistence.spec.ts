import { expect, test } from "@playwright/test";
import { resetDemoState } from "./helpers";

const IDEA_TITLE = "E2E Persistence Idea";

test.describe("Idea persistence", () => {
  test.beforeEach(async ({ page }) => {
    await resetDemoState(page);
    await page.goto("./app");
  });

  test("stores ideas in localStorage when adding from dashboard", async ({ page }) => {
    await page.getByRole("button", { name: /nouvelle idée|new idea/i }).click();
    await page.getByLabel(/titre|title/i).fill(IDEA_TITLE);
    await page.getByLabel(/description/i).fill("Created by Playwright e2e.");
    await page.getByRole("button", { name: /^Ajouter$|^Add$/i }).click();

    await expect(page.getByText(IDEA_TITLE)).toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem("cf-ideas"));
    expect(stored).toBeTruthy();
    expect(stored).toContain(IDEA_TITLE);
  });

  test("reloads persisted ideas after refresh", async ({ page }) => {
    await page.getByRole("button", { name: /nouvelle idée|new idea/i }).click();
    await page.getByLabel(/titre|title/i).fill(IDEA_TITLE);
    await page.getByRole("button", { name: /^Ajouter$|^Add$/i }).click();
    await expect(page.getByText(IDEA_TITLE)).toBeVisible();

    await page.reload();
    await expect(page.getByText(IDEA_TITLE)).toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem("cf-ideas"));
    expect(stored).toContain(IDEA_TITLE);
  });

  test("pipeline reflects persisted ideas after navigation", async ({ page }) => {
    await page.getByRole("button", { name: /nouvelle idée|new idea/i }).click();
    await page.getByLabel(/titre|title/i).fill(IDEA_TITLE);
    await page.getByRole("button", { name: /^Ajouter$|^Add$/i }).click();

    await page.getByRole("link", { name: /^Pipeline$/i }).click();
    await expect(page.getByText(IDEA_TITLE)).toBeVisible();
  });
});
