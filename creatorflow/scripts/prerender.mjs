import { spawn } from "node:child_process";
import { copyFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const PORT = 4179;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST_INDEX = join(ROOT, "dist", "index.html");
const DIST_404 = join(ROOT, "dist", "404.html");
const TIMEOUT_MS = Number.parseInt(process.env.PRERENDER_TIMEOUT_MS ?? "120000", 10);

const CHROMIUM_ARGS = [
  "--enable-low-end-device-mode",
  "--renderer-process-limit=1",
  "--disable-dev-shm-usage",
  "--no-sandbox",
];

function resolveBasePath() {
  const configured = process.env.VITE_BASE_PATH?.trim();
  const base = configured && configured.length > 0 ? configured : "/contract/creatorflow/";
  return base.endsWith("/") ? base : `${base}/`;
}

const BASE_PATH = resolveBasePath();
const BASE_PATH_NO_TRAILING = BASE_PATH.replace(/\/$/, "");
const PREVIEW_URL = `http://127.0.0.1:${PORT}${BASE_PATH}`;

function log(message) {
  process.stderr.write(`[prerender] ${message}\n`);
}

function timeoutAfter(ms, label) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
}

async function waitForServer(url, timeoutMs) {
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
  const viteBin = join(ROOT, "node_modules", ".bin", "vite");
  return spawn(viteBin, ["preview", "--port", String(PORT), "--strictPort"], {
    cwd: ROOT,
    stdio: "ignore",
    shell: false,
    env: {
      ...process.env,
      VITE_BASE_PATH: BASE_PATH,
    },
  });
}

async function stopPreview(child) {
  if (!child?.pid) return;

  const exited = new Promise((resolve) => {
    child.once("exit", resolve);
  });

  child.kill("SIGTERM");

  const stoppedInTime = await Promise.race([
    exited.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);

  if (!stoppedInTime && !child.killed) {
    child.kill("SIGKILL");
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 2_000))]);
  }
}

async function prerenderLanding() {
  log(`base path: ${BASE_PATH}`);
  log(`preview url: ${PREVIEW_URL}`);
  log(`timeout: ${TIMEOUT_MS}ms`);

  const preview = startPreview();
  try {
    await waitForServer(PREVIEW_URL, Math.min(TIMEOUT_MS, 30_000));

    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: CHROMIUM_ARGS,
      });
    } catch (error) {
      log(
        `Chromium launch failed — skipping prerender (Pages deploy continues): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return;
    }

    const page = await browser.newPage();

    page.on("console", (message) => {
      if (message.type() === "error") {
        log(`page error: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      log(`page exception: ${error.message}`);
    });

    await page.goto(PREVIEW_URL, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
    await page.waitForSelector("h1", { timeout: 30_000 });

    try {
      await page.waitForSelector("#faq", { timeout: 10_000 });
    } catch (error) {
      log(
        `#faq not found (non-blocking): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    try {
      await page.waitForSelector("#cf-faq-jsonld", { state: "attached", timeout: 10_000 });
    } catch (error) {
      log(
        `#cf-faq-jsonld not found (non-blocking): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const pathname = await page.evaluate(() => window.location.pathname);
    const onLanding =
      pathname === BASE_PATH ||
      pathname === BASE_PATH_NO_TRAILING ||
      pathname.endsWith(BASE_PATH_NO_TRAILING);

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

Promise.race([prerenderLanding(), timeoutAfter(TIMEOUT_MS, "prerender")]).catch((error) => {
  log(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
