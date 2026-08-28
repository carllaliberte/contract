import { test as base, expect, type Page } from "@playwright/test";

export type IdeaRecord = {
  id: string;
  title: string;
  status: string;
  description?: string;
};

type CreatorFlowFixtures = {
  /** Clears demo flags and persisted ideas before the test. */
  cleanStorage: void;
  /** Opens the marketing landing page. */
  landing: void;
  /** Enters interactive demo mode (dashboard). */
  demoApp: void;
  /** Demo app with pipeline kanban open. */
  pipeline: void;
};

async function clearCreatorFlowStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem("cf-demo");
    localStorage.removeItem("cf-ideas");
    localStorage.removeItem("cf-ai-usage");
    localStorage.removeItem("cf-locale");
    sessionStorage.clear();
  });
}

async function enterDemoFromLanding(page: Page) {
  await page
    .getByRole("button", {
      name: /explorez les scripts clapshot|explore clapshot scripts|on commence|let['’]s go/i,
    })
    .first()
    .click();
  await page.waitForURL(/\/app/);
}

export async function addIdea(page: Page, title: string, description?: string) {
  await page.getByRole("button", { name: /nouvelle idée|new idea/i }).click();
  await page.getByLabel(/titre|title/i).fill(title);
  if (description) {
    await page.getByLabel(/description/i).fill(description);
  }
  await page.getByRole("button", { name: /^Ajouter$|^Add$/i }).click();
  await expect
    .poll(async () => {
      const ideas = await readIdeas(page);
      return ideas.some((idea) => idea.title === title);
    })
    .toBe(true);
}

export async function readIdeas(page: Page): Promise<IdeaRecord[]> {
  return page.evaluate(() => {
    const raw = localStorage.getItem("cf-ideas");
    if (!raw) return [];
    return JSON.parse(raw) as IdeaRecord[];
  });
}

export async function dragIdeaToColumn(
  page: Page,
  ideaTitle: string,
  columnHeading: RegExp,
) {
  const ideaCard = page.locator(".pipeline-card").filter({ hasText: ideaTitle });
  await expect(ideaCard).toBeVisible();

  const columnHeader = page.getByRole("heading", { name: columnHeading });
  const cardBox = await ideaCard.boundingBox();
  const targetBox = await columnHeader.boundingBox();
  expect(cardBox).toBeTruthy();
  expect(targetBox).toBeTruthy();

  await page.mouse.move(cardBox!.x + cardBox!.width / 2, cardBox!.y + cardBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    targetBox!.x + targetBox!.width / 2,
    targetBox!.y + targetBox!.height / 2,
    { steps: 24 },
  );
  await page.mouse.up();
}

export const test = base.extend<CreatorFlowFixtures>({
  cleanStorage: async ({ page }, use) => {
    await page.goto("./");
    await clearCreatorFlowStorage(page);
    await use();
  },

  landing: async ({ page, cleanStorage }, use) => {
    await page.goto("./");
    await use();
  },

  demoApp: async ({ page, cleanStorage }, use) => {
    await page.goto("./");
    await enterDemoFromLanding(page);
    await use();
  },

  pipeline: async ({ page, demoApp }, use) => {
    await page.goto("./app/pipeline");
    await page.waitForURL(/\/app\/pipeline/);
    await use();
  },
});

export { expect };
