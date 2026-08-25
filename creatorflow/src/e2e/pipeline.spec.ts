import { dragIdeaToColumn, expect, readIdeas, test } from "./fixtures";

test.describe("Pipeline kanban", () => {
  test("renders all pipeline columns", async ({ page, pipeline }) => {
    await expect(page.getByRole("heading", { name: /^Pipeline$/i })).toBeVisible();

    for (const label of [/Idée|Idea/i, /Script/i, /Production/i, /Prêt|Ready/i, /Publié|Published/i]) {
      await expect(page.getByRole("heading", { name: label })).toBeVisible();
    }
  });

  test("shows seeded demo ideas on the board", async ({ page, pipeline }) => {
    await expect(page.getByText(/5 erreurs de montage/i)).toBeVisible();
    await expect(page.getByText(/Routine créateur 60 secondes/i)).toBeVisible();
    await expect(page.getByText(/Setup streaming minimaliste/i)).toBeVisible();
  });

  test("moves an idea to another column via drag and drop", async ({ page, pipeline }) => {
    await dragIdeaToColumn(page, "Setup streaming minimaliste (unboxing)", /^Script$/i);

    await expect.poll(async () => {
      const ideas = await readIdeas(page);
      return ideas.find((i) => i.title.includes("Setup streaming"))?.status ?? null;
    }).toBe("script");
  });
});
