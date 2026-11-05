import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const build = JSON.parse(await readFile(path.join(root,
  "docs/release/v607/mainline-a-r66-build-20261007-v648web01.json"), "utf8"));
const browser = await chromium.launch({ headless: false,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  try {
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:3091/", { waitUntil: "domcontentloaded", timeout: 15_000 });
    await page.getByRole("button", { name: "星云候选" }).click({ timeout: 8_000 });
    const result = page.locator("[data-mainline-a-nebula-result-count]");
    await result.waitFor({ state: "visible", timeout: 8_000 });
    const initial = await result.getAttribute("data-mainline-a-nebula-result-count");
    await page.getByRole("searchbox", { name: "搜索星云候选" }).fill("__no_match_v648__", { timeout: 8_000 });
    await page.waitForFunction(() => document.querySelector("[data-mainline-a-nebula-result-count]")
      ?.getAttribute("data-mainline-a-nebula-result-count") === "0", null, { timeout: 8_000 });
    const empty = await result.getAttribute("data-mainline-a-nebula-result-count");
    const emptyMessage = await page.getByText("没有匹配的星云候选").isVisible();
    await page.getByRole("button", { name: "清除筛选" }).click({ timeout: 8_000 });
    await page.waitForFunction(() => document.querySelector("[data-mainline-a-nebula-result-count]")
      ?.getAttribute("data-mainline-a-nebula-result-count") === "30", null, { timeout: 8_000 });
    const restored = await result.getAttribute("data-mainline-a-nebula-result-count");
    const gate = await page.locator("[data-mainline-a-nebula-atlas]")
      .getAttribute("data-mainline-a-nebula-web-release");
    const runtimeBuildId = await page.locator("[data-atlas-app-shell]")
      .getAttribute("data-mainline-build-id");
    if (initial !== "30" || empty !== "0" || restored !== "30" || !emptyMessage
      || gate !== "blocked-rights-pending" || runtimeBuildId !== build.runtimeBuildId) {
      throw new Error("web-nebula-search-v648:behavior-invalid");
    }
    const receipt = { schema: "mainline-a-web-nebula-search-browser-v648",
      status: "observed-local", evidenceClass: "browser", capturedAt: new Date().toISOString(),
      buildId: build.buildId, runtimeBuildId, initial, empty, emptyMessage, restored, gate,
      surface: "Playwright CLI Chrome local", realUserValidation: false,
      scientificValidity: false, legalClearance: false, publicReleaseApproved: false };
    const relative = "docs/release/v607/mainline-a-r66-web-nebula-search-20261007-v648web01.json";
    await writeFile(path.join(root, relative), `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
    console.log(JSON.stringify({ path: relative, ...receipt }, null, 2));
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
}
