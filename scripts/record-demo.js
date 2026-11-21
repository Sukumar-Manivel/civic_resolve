import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const TARGET_URL = process.env.APP_URL || "http://localhost:8080";
const OUTPUT_DIR = path.resolve(process.cwd(), "demo-output");

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch {
    return await chromium.launch({ headless: true, channel: "chrome" });
  }
}

async function warmupUrl(url) {
  try {
    await fetch(url);
  } catch {
    // Cold start warm-up attempt; ignore initial network failure
  }
}

async function smoothScrollTo(page, targetY, durationMs = 1500) {
  await page.evaluate(({ target, duration }) => {
    return new Promise((resolve) => {
      const start = window.scrollY;
      const diff = target - start;
      const startTime = performance.now();

      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;

        window.scrollTo(0, start + diff * ease);
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      window.requestAnimationFrame(step);
    });
  }, { target: targetY, duration: durationMs });
}

async function performScrollTour(page) {
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const middleY = Math.max(0, Math.floor((scrollHeight - 720) / 2));
  const bottomY = Math.max(0, scrollHeight - 720);

  await smoothScrollTo(page, middleY, 1500);
  await page.waitForTimeout(2000);

  await smoothScrollTo(page, bottomY, 1500);
  await page.waitForTimeout(2500);

  await smoothScrollTo(page, 0, 1500);
  await page.waitForTimeout(1000);
}

async function waitForInitialRender(page) {
  await page.goto(TARGET_URL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => {
    const bodyText = document.body ? document.body.innerText : "";
    return !bodyText.toLowerCase().includes("loading...");
  });
  await page.waitForTimeout(1800);
}

async function triggerPrimaryAction(page) {
  const input = page.locator("input:visible").first();
  if (await input.count() > 0) {
    await input.fill("Starter Demo");
  }

  const actionBtn = page.locator("button[type='submit'], button.btn-primary, button:visible").first();
  if (await actionBtn.count() > 0) {
    await actionBtn.click();
    await page.waitForFunction(() => {
      const bodyText = document.body ? document.body.innerText : "";
      return !bodyText.toLowerCase().includes("generating...");
    });
    await page.waitForLoadState("networkidle");
  }
}

async function performWalkthrough(page) {
  await waitForInitialRender(page);
  await triggerPrimaryAction(page);
  await performScrollTour(page);
}

async function recordDemo() {
  ensureDirectory(OUTPUT_DIR);
  await warmupUrl(TARGET_URL);

  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: { dir: "demo-output/", size: { width: 1280, height: 720 } }
  });

  try {
    const page = await context.newPage();
    await performWalkthrough(page);
    process.stdout.write("Demo recorded successfully in demo-output/\n");
  } catch (err) {
    process.stderr.write(`Demo recording failed: ${err.message}\n`);
    process.exit(1);
  } finally {
    await context.close();
    await browser.close();
  }
}

recordDemo();
