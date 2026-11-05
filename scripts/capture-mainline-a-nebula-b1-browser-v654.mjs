import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "http://127.0.0.1:3094";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BUILD =
  "docs/release/v607/mainline-a-r67-build-20261012v654b1web01.json";
const OUTPUT =
  "docs/release/v607/mainline-a-r67-v654-browser-20261012v654b1web01.json";
const IMAGES = {
  desktop: "docs/release/v607/mainline-a-r67-v654-browser-desktop-20261012v654b1web01.png",
  mobileViewport: "docs/release/v607/mainline-a-r67-v654-browser-mobile-20261012v654b1web01.png",
};
const sha = (value) => createHash("sha256").update(value).digest("hex");
const assert = (condition, code) => {
  if (!condition) throw new Error(`b1-browser-v654:${code}`);
};

async function openReview(page) {
  await page.goto(ORIGIN, { waitUntil: "domcontentloaded", timeout: 20_000 });
  await page.locator("[data-atlas-app-shell]").waitFor({ state: "visible",
    timeout: 20_000 });
  await page.getByRole("button", { name: /^工具/ }).click({ timeout: 10_000 });
  await page.getByRole("button", { name: "清权审查" }).click({ timeout: 10_000 });
  await page.locator('[data-mainline-a-b1-source-status="verified-local-candidate"]')
    .waitFor({ state: "visible", timeout: 10_000 });
  await page.locator('[data-mainline-a-b1-source-row="heart-nebula"]')
    .scrollIntoViewIfNeeded();
}

async function localFrameSample(page) {
  return page.evaluate(() => new Promise((resolve) => {
    const deltas = [];
    let before = 0;
    const started = performance.now();
    const step = (now) => {
      if (before > 0) deltas.push(now - before);
      before = now;
      if (deltas.length < 120 && now - started < 8_000) {
        requestAnimationFrame(step);
      } else {
        deltas.sort((a, b) => a - b);
        const p95 = deltas.length
          ? deltas[Math.min(deltas.length - 1,
            Math.ceil(deltas.length * 0.95) - 1)] : null;
        resolve({ sampleCount: deltas.length, p95FrameMs: p95,
          maxFrameMs: deltas.at(-1) ?? null,
          wallMs: performance.now() - started,
          jsHeapUsedBytes: performance.memory?.usedJSHeapSize ?? null,
          claim: "short-local-browser-diagnostic-only" });
      }
    };
    requestAnimationFrame(step);
  }));
}

async function inspectDevice(browser, build, device) {
  const mobile = device === "mobile-viewport";
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 }
      : { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    isMobile: mobile, hasTouch: mobile,
  });
  const page = await context.newPage();
  const pageErrors = [];
  const failedRequests = [];
  page.on("pageerror", (error) => pageErrors.push(String(error.message)));
  page.on("requestfailed", (request) => failedRequests.push({
    url: request.url(), error: request.failure()?.errorText ?? "unknown",
  }));
  try {
    await openReview(page);
    const panel = page.locator("[data-mainline-a-b1-source]");
    const rows = await panel.locator("[data-mainline-a-b1-source-row]")
      .evaluateAll((nodes) => nodes.map((node) => ({
        id: node.getAttribute("data-mainline-a-b1-source-row"),
        rights: node.getAttribute("data-mainline-a-b1-source-rights"),
      })));
    assert(rows.length === 6 && rows.every((row) =>
      row.rights === "pending"), `${device}:six-pending-rows-missing`);
    const shell = await page.locator("[data-atlas-app-shell]").evaluate(
      (element) => ({ build: element.getAttribute("data-mainline-build-id"),
        branch: element.getAttribute("data-mainline-branch"),
        head: element.getAttribute("data-mainline-head") }));
    assert(shell.build === build.runtimeBuildId
      && shell.branch === build.branch && shell.head === build.head,
    `${device}:runtime-build-identity-invalid`);
    const heart = await panel.locator('[data-mainline-a-b1-source-detail="heart-nebula"]')
      .innerText();
    assert(heart.includes("原始字节不同")
      && heart.includes("candidate-only")
      && heart.includes("scientificPayloadWriteback=false"),
    `${device}:byte-pixel-or-boundary-text-missing`);
    await panel.locator('[data-mainline-a-b1-source-row="pacman-nebula"]')
      .click({ timeout: 10_000 });
    await panel.locator('[data-mainline-a-b1-source-detail="pacman-nebula"]')
      .waitFor({ state: "visible" });
    const pacman = await panel.locator('[data-mainline-a-b1-source-detail="pacman-nebula"]')
      .evaluate((element) => ({ text: element.textContent,
        hrefs: [...element.querySelectorAll("a")].map((link) => link.href) }));
    assert(pacman.text?.includes("NASA/CXC")
      && pacman.hrefs.length === 2
      && pacman.hrefs[0].startsWith("https://science.nasa.gov/photojournal/")
      && pacman.hrefs[1].startsWith("https://assets.science.nasa.gov/"),
    `${device}:pacman-source-links-invalid`);
    await panel.getByRole("textbox", { name: "搜索 B1 官方来源" })
      .fill("PIA14731");
    const filtered = await panel.locator("[data-mainline-a-b1-source-row]")
      .count();
    assert(filtered === 1, `${device}:search-filter-invalid`);
    await panel.getByRole("textbox", { name: "搜索 B1 官方来源" })
      .fill("");
    const layout = await panel.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { viewport: [innerWidth, innerHeight],
        documentWidth: document.documentElement.scrollWidth,
        panelWidth: element.clientWidth,
        panelScrollWidth: element.scrollWidth,
        visibleWidth: Math.max(0, Math.min(innerWidth, rect.right)
          - Math.max(0, rect.left)),
        scientificPayloadWriteback: element.getAttribute(
          "data-scientific-payload-writeback"),
        status: element.getAttribute("data-mainline-a-b1-source-status") };
    });
    assert(layout.documentWidth <= layout.viewport[0] + 1
      && layout.panelScrollWidth <= layout.panelWidth + 2
      && layout.visibleWidth > 0
      && layout.scientificPayloadWriteback === "false"
      && layout.status === "verified-local-candidate",
    `${device}:layout-or-boundary-invalid`);
    const frame = await localFrameSample(page);
    await panel.locator('[data-mainline-a-b1-source-row="heart-nebula"]')
      .click();
    await panel.scrollIntoViewIfNeeded();
    const shotPath = IMAGES[mobile ? "mobileViewport" : "desktop"];
    await page.screenshot({ path: path.join(ROOT, shotPath),
      type: "png" });
    const screenshotBytes = await readFile(path.join(ROOT, shotPath));
    await page.getByRole("button", { name: "关闭星云清权审查台" })
      .click({ timeout: 8_000 });
    assert(await page.locator("[data-mainline-a-b1-source]").count() === 0,
      `${device}:dialog-did-not-close`);
    return { device, surface: "local-Playwright-Chrome",
      capturedAt: new Date().toISOString(), origin: ORIGIN,
      build: shell, rows, searchedCount: filtered,
      selectedPacman: { sourceLinks: pacman.hrefs,
        creditVisible: true }, layout, frame,
      screenshot: { path: shotPath, bytes: screenshotBytes.byteLength,
        sha256: sha(screenshotBytes) },
      pageErrors, failedRequests,
      claims: { physicalMobile: false, realUserValidation: false,
        productionPerformance: false, copyrightApproval: false,
        scientificValidity: false } };
  } finally {
    await context.close();
  }
}

const build = JSON.parse(await readFile(path.join(ROOT, BUILD), "utf8"));
assert(build.status === "passed" && build.sourceStable === true
  && build.exitCode === 0 && build.round === 67,
"build-not-passed-or-source-drifted");
const browser = await chromium.launch({ headless: true,
  executablePath: CHROME });
try {
  const desktop = await inspectDevice(browser, build, "desktop");
  const mobileViewport = await inspectDevice(browser, build,
    "mobile-viewport");
  const report = { schema: "mainline-a-r67-b1-browser-v654",
    status: "passed-local-browser", buildReceipt: BUILD,
    buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId,
    sourceSha256: build.inputBefore.sha256,
    desktop, mobileViewport,
    evidenceClasses: ["browser", "visual", "performance-local-sample"],
    claims: { physicalMobile: false, realUserValidation: false,
      productionPerformance: false, copyrightApproval: false,
      scientificValidity: false, publicWebReleaseApproved: false } };
  await writeFile(path.join(ROOT, OUTPUT),
    `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ status: report.status,
    buildId: report.buildId, sourceSha256: report.sourceSha256,
    desktop: { rows: desktop.rows.length, layout: desktop.layout,
      screenshot: desktop.screenshot, frame: desktop.frame },
    mobileViewport: { rows: mobileViewport.rows.length,
      layout: mobileViewport.layout,
      screenshot: mobileViewport.screenshot,
      frame: mobileViewport.frame }, output: OUTPUT }, null, 2));
} finally {
  await browser.close();
}
