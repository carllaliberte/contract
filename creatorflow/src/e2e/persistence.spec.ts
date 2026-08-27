import { addIdea, expect, readIdeas, test } from "./fixtures";

const IDEA_TITLE = "E2E Persistence Idea";

test.describe("Idea persistence", () => {
  test("stores ideas in localStorage when adding from dashboard", async ({ page, demoApp }) => {
    await addIdea(page, IDEA_TITLE, "Created by Playwright e2e.");

    const stored = await page.evaluate(() => localStorage.getItem("cf-ideas"));
    expect(stored).toBeTruthy();
    expect(stored).toContain(IDEA_TITLE);
  });

  test("reloads persisted ideas after refresh", async ({ page, demoApp }) => {
    await addIdea(page, IDEA_TITLE);

    await page.reload();
    await page.getByRole("link", { name: /^Pipeline$/i }).click();
    await expect(page.getByText(IDEA_TITLE)).toBeVisible();

    const ideas = await readIdeas(page);
    expect(ideas.some((i) => i.title === IDEA_TITLE)).toBe(true);
  });

  test("pipeline reflects persisted ideas after navigation", async ({ page, demoApp }) => {
    await addIdea(page, IDEA_TITLE);

    await page.getByRole("link", { name: /^Pipeline$/i }).click();
    await expect(page.getByText(IDEA_TITLE)).toBeVisible();
  });
});
