import type { Page } from "@playwright/test";

export async function resetDemoState(page: Page) {
  await page.goto("./");
  await page.evaluate(() => {
    localStorage.setItem("cf-demo", "1");
    localStorage.removeItem("cf-ideas");
    localStorage.removeItem("cf-ai-usage");
  });
}

export async function enterDemo(page: Page) {
  await page.goto("./");
  await page
    .getByRole("button", { name: /explorer sans compte|explore without account/i })
    .first()
    .click();
  await page.waitForURL(/\/app/);
}

export async function openPipeline(page: Page) {
  await page.getByRole("link", { name: /^Pipeline$/i }).click();
  await page.waitForURL(/\/app\/pipeline/);
}
