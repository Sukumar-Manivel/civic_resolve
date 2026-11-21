import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const defaultUrl = pathToFileURL(path.resolve(process.cwd(), "client/index.html")).href;
const TARGET_URL = process.env.APP_URL || defaultUrl;
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"];

async function scanPage(page) {
  const results = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();
  return results.violations;
}

function reportViolations(violations) {
  if (violations.length === 0) {
    process.stdout.write(`a11y check passed: 0 WCAG 2.1 AA violations on ${TARGET_URL}\n`);
    return;
  }
  process.stderr.write(`a11y check failed! Found ${violations.length} violation(s):\n`);
  for (const v of violations) {
    process.stderr.write(`- [${v.id}] ${v.help} (${v.nodes.length} occurrences)\n`);
  }
  process.exit(1);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });
    const violations = await scanPage(page);
    reportViolations(violations);
  } catch (err) {
    process.stderr.write(`a11y check failed with error: ${err.message}\n`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
