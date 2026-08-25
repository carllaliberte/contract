import { expect, test } from "@playwright/test";
import { enterDemo, openPipeline } from "./helpers";

test.describe("Pipeline kanban", () => {
  test.beforeEach(async ({ page }) => {
    await enterDemo(page);
    await openPipeline(page);
  });

  test("renders all pipeline columns", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /^Pipeline$/i })).toBeVisible();

    for (const label of [/Idée|Idea/i, /Script/i, /Production/i, /Prêt|Ready/i, /Publié|Published/i]) {
      await expect(page.getByRole("heading", { name: label })).toBeVisible();
    }
  });

  test("shows seeded demo ideas on the board", async ({ page }) => {
    await expect(page.getByText(/5 erreurs de montage/i)).toBeVisible();
    await expect(page.getByText(/Routine créateur 60 secondes/i)).toBeVisible();
    await expect(page.getByText(/Setup streaming minimaliste/i)).toBeVisible();
  });

  test("moves an idea to another column via drag and drop", async ({ page }) => {
    const ideaCard = page
      .locator(".pipeline-card")
      .filter({ hasText: "Setup streaming minimaliste (unboxing)" });
    await expect(ideaCard).toBeVisible();

    const scriptHeader = page.getByRole("heading", { name: /^Script$/i });
    const cardBox = await ideaCard.boundingBox();
    const targetBox = await scriptHeader.boundingBox();
    expect(cardBox).toBeTruthy();
    expect(targetBox).toBeTruthy();

    await page.mouse.move(cardBox!.x + cardBox!.width / 2, cardBox!.y + cardBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, {
      steps: 24,
    });
    await page.mouse.up();

    await expect.poll(async () =>
      page.evaluate(() => {
        const raw = localStorage.getItem("cf-ideas");
        if (!raw) return null;
        const ideas = JSON.parse(raw) as { title: string; status: string }[];
        return ideas.find((i) => i.title.includes("Setup streaming"))?.status ?? null;
      }),
    ).toBe("script");
  });
});
