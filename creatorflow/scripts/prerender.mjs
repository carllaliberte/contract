import { spawn } from "node:child_process";
import { copyFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const PORT = 4179;
const BASE_PATH = "/contract/creatorflow/";
const PREVIEW_URL = `http://127.0.0.1:${PORT}${BASE_PATH}`;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST_INDEX = join(ROOT, "dist", "index.html");
const DIST_404 = join(ROOT, "dist", "404.html");

async function waitForServer(url, timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // preview not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Preview server did not become ready at ${url}`);
}

function startPreview() {
  return spawn("npm", ["run", "preview", "--", "--port", String(PORT), "--strictPort"], {
    cwd: ROOT,
    stdio: "pipe",
    shell: true,
  });
}

async function stopPreview(child) {
  if (!child.pid) return;
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", resolve);
    setTimeout(() => child.kill("SIGKILL"), 5000);
  });
}

async function prerenderLanding() {
  const preview = startPreview();
  try {
    await waitForServer(PREVIEW_URL);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(PREVIEW_URL, { waitUntil: "networkidle" });
    await page.waitForSelector("h1", { timeout: 30_000 });

    const pathname = await page.evaluate(() => window.location.pathname);
    const onLanding =
      pathname === BASE_PATH ||
      pathname === BASE_PATH.replace(/\/$/, "") ||
      pathname.endsWith("/contract/creatorflow/") ||
      pathname.endsWith("/contract/creatorflow");

    if (!onLanding) {
      throw new Error(`Prerender aborted: expected landing, got ${pathname}`);
    }

    const html = await page.content();
    await browser.close();

    await writeFile(DIST_INDEX, html, "utf8");
    await copyFile(DIST_INDEX, DIST_404);

    console.log(`Prerendered landing → dist/index.html (+ dist/404.html)`);
  } finally {
    await stopPreview(preview);
  }
}

prerenderLanding().catch((error) => {
  console.error(error);
  process.exit(1);
});
