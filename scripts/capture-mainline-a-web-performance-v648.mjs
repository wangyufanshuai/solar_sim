import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = "docs/release/v607/mainline-a-r66-build-20261007-v648web01.json";
const ORIGIN = "http://127.0.0.1:3091";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const RUN = "20261007-v648perf01";
const build = JSON.parse(await readFile(path.join(ROOT, BUILD), "utf8"));
if (build.status !== "passed" || build.sourceStable !== true || build.exitCode !== 0) {
  throw new Error("web-performance-v648:build-not-passed");
}

async function capture(browser, device, viewport, mobile) {
  const context = await browser.newContext({ viewport: { width: viewport[0], height: viewport[1] },
    deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  try {
    const page = await context.newPage();
    await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await page.locator("[data-atlas-app-shell]").waitFor({ state: "visible", timeout: 15_000 });
    await page.getByRole("button", { name: "星云候选" }).click({ timeout: 8_000 });
    await page.locator("[data-mainline-a-nebula-atlas]").waitFor({ state: "visible", timeout: 8_000 });
    const raw = await page.evaluate(async () => {
      const shell = document.querySelector("[data-atlas-app-shell]");
      const atlas = document.querySelector("[data-mainline-a-nebula-atlas]");
      const initialHeapBytes = performance.memory?.usedJSHeapSize ?? null;
      const frames = await new Promise((resolve) => {
        requestAnimationFrame((first) => {
          const startedAt = new Date().toISOString();
          const intervals = [];
          let previous = first;
          function sample(timestamp) {
            intervals.push(Number((timestamp - previous).toFixed(3)));
            previous = timestamp;
            if (intervals.length === 120) {
              resolve({ startedAt, endedAt: new Date().toISOString(), intervals });
            } else requestAnimationFrame(sample);
          }
          requestAnimationFrame(sample);
        });
      });
      return {
        schema: "mainline-a-web-frame-raw-v647",
        surface: "Playwright CLI Chrome local",
        url: location.href,
        startedAt: frames.startedAt,
        endedAt: frames.endedAt,
        visibility: document.visibilityState,
        viewport: [innerWidth, innerHeight],
        runtimeBuildId: shell?.getAttribute("data-mainline-build-id"),
        atlasOpen: Boolean(atlas?.open),
        frameIntervalsMs: frames.intervals,
        initialHeapBytes,
        finalHeapBytes: performance.memory?.usedJSHeapSize ?? null,
        claims: { productionPerformance: false, realUserValidation: false,
          scientificValidity: false, legalClearance: false },
      };
    });
    if (raw.runtimeBuildId !== build.runtimeBuildId
      || JSON.stringify(raw.viewport) !== JSON.stringify(viewport)
      || raw.visibility !== "visible" || raw.atlasOpen !== true
      || raw.frameIntervalsMs.length !== 120) {
      throw new Error(`web-performance-v648:${device}-observation-invalid`);
    }
    const relative = `docs/release/v607/mainline-a-r66-web-performance-${device}-raw-${RUN}.json`;
    await writeFile(path.join(ROOT, relative), `${JSON.stringify(raw, null, 2)}\n`, { flag: "wx" });
    return { path: relative, startedAt: raw.startedAt, endedAt: raw.endedAt,
      frameSamples: raw.frameIntervalsMs.length };
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: false, executablePath: CHROME });
try {
  const mobile = await capture(browser, "mobile", [390, 844], true);
  const desktop = await capture(browser, "desktop", [1280, 720], false);
  console.log(JSON.stringify({ status: "captured-local-short-samples", buildId: build.buildId,
    sourceSha256: build.inputBefore.sha256, mobile, desktop }, null, 2));
} finally {
  await browser.close();
}
