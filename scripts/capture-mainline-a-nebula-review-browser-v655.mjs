import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "http://127.0.0.1:3097";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BUILD = "docs/release/v607/mainline-a-r68-build-20261012v655review03.json";
const OUTPUT = "docs/release/v607/mainline-a-r68-v655-browser-20261012v655review03.json";
const SHOTS = {
  desktop: "docs/release/v607/mainline-a-r68-v655-browser-desktop-20261012v655review03.png",
  mobileViewport: "docs/release/v607/mainline-a-r68-v655-browser-mobile-20261012v655review03.png",
};
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const assert = (condition, code) => {
  if (!condition) throw new Error(`review-browser-v655:${code}`);
};

async function instrumentReviewBlobs(page) {
  await page.addInitScript(() => {
    const nativeCreate = URL.createObjectURL.bind(URL);
    const nativeRevoke = URL.revokeObjectURL.bind(URL);
    const active = new Set();
    let created = 0;
    let revoked = 0;
    URL.createObjectURL = (blob) => {
      const address = nativeCreate(blob);
      if (blob instanceof Blob && blob.type === "image/webp") {
        active.add(address);
        created += 1;
      }
      return address;
    };
    URL.revokeObjectURL = (address) => {
      if (active.delete(address)) revoked += 1;
      nativeRevoke(address);
    };
    window.__r68ReviewBlobObservation = {
      read: () => ({ created, revoked, active: active.size }),
    };
  });
}

async function openReview(page) {
  await page.getByRole("button", { name: /^工具/ }).click({ timeout: 10_000 });
  await page.getByRole("button", { name: "清权审查" }).click({ timeout: 10_000 });
  await page.locator('[data-mainline-a-nebula-review-boundary="closed"]')
    .waitFor({ state: "visible", timeout: 10_000 });
  await page.locator('[data-mainline-a-nebula-review-card="heart-nebula"]')
    .scrollIntoViewIfNeeded();
}

async function awaitLoadedGallery(page, device) {
  await page.waitForFunction(() => {
    const gallery = document.querySelector(
      "[data-mainline-a-nebula-review-gallery]");
    const cards = gallery?.querySelectorAll(
      '[data-mainline-a-nebula-review-image-state="loaded"]');
    const detail = gallery?.querySelector(
      '[data-mainline-a-nebula-review-detail-state="loaded"]');
    return cards?.length === 12 && Boolean(detail);
  }, null, { timeout: 30_000 });
  const actual = await page.locator("[data-mainline-a-nebula-review-gallery]")
    .evaluate((gallery) => ({
      cards: gallery.querySelectorAll("[data-mainline-a-nebula-review-card]").length,
      loadedCards: gallery.querySelectorAll(
        '[data-mainline-a-nebula-review-image-state="loaded"]').length,
      decodedImages: [...gallery.querySelectorAll("img")]
        .filter((image) => image.complete && image.naturalWidth > 0).length,
      rightsPending: gallery.querySelectorAll(
        '[data-mainline-a-nebula-review-rights="pending"]').length,
      layout: { viewport: [innerWidth, innerHeight],
        documentWidth: document.documentElement.scrollWidth,
        width: gallery.clientWidth, scrollWidth: gallery.scrollWidth },
      boundary: gallery.getAttribute("data-mainline-a-nebula-review-boundary"),
      writeback: gallery.getAttribute("data-scientific-payload-writeback"),
    }));
  assert(actual.cards === 12 && actual.loadedCards === 12
    && actual.decodedImages === 13 && actual.rightsPending === 12
    && actual.layout.documentWidth <= actual.layout.viewport[0] + 1
    && actual.layout.scrollWidth <= actual.layout.width + 2
    && actual.boundary === "closed" && actual.writeback === "false",
  `${device}:image-decode-layout-or-boundary-invalid`);
  return actual;
}

async function frameSample(page) {
  return page.evaluate(() => new Promise((resolve) => {
    const values = [];
    let before = 0;
    const start = performance.now();
    const tick = (now) => {
      if (before > 0) values.push(now - before);
      before = now;
      if (values.length < 120 && now - start < 8_000) {
        requestAnimationFrame(tick);
      } else {
        values.sort((a, b) => a - b);
        resolve({ count: values.length,
          p95FrameMs: values[Math.max(0,
            Math.ceil(values.length * 0.95) - 1)] ?? null,
          maxFrameMs: values.at(-1) ?? null,
          wallMs: performance.now() - start,
          jsHeapUsedBytes: performance.memory?.usedJSHeapSize ?? null,
          scope: "short-local-browser-diagnostic" });
      }
    };
    requestAnimationFrame(tick);
  }));
}

async function inspectDevice(browser, build, device) {
  const mobile = device === "mobile-viewport";
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 }
      : { width: 1280, height: 720 },
    deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile,
  });
  const page = await context.newPage();
  await instrumentReviewBlobs(page);
  const pageErrors = [];
  const failedRequests = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push({
    url: request.url(), error: request.failure()?.errorText ?? "unknown",
  }));
  try {
    await page.goto(ORIGIN, { waitUntil: "domcontentloaded",
      timeout: 20_000 });
    await page.locator("[data-atlas-app-shell]")
      .waitFor({ state: "visible", timeout: 20_000 });
    await openReview(page);
    const initial = await awaitLoadedGallery(page, device);
    const runtime = await page.locator("[data-atlas-app-shell]")
      .evaluate((element) => ({
        buildId: element.getAttribute("data-mainline-build-id"),
        branch: element.getAttribute("data-mainline-branch"),
        head: element.getAttribute("data-mainline-head"),
      }));
    assert(runtime.buildId === build.runtimeBuildId
      && runtime.branch === build.branch
      && runtime.head === build.head,
    `${device}:runtime-build-identity-invalid`);
    const gallery = page.locator("[data-mainline-a-nebula-review-gallery]");
    await gallery.locator('[data-mainline-a-nebula-review-card="heart-nebula"]')
      .scrollIntoViewIfNeeded();
    const shotPath = SHOTS[mobile ? "mobileViewport" : "desktop"];
    await page.screenshot({ path: path.join(ROOT, shotPath),
      type: "png" });
    const screenshot = await readFile(path.join(ROOT, shotPath));
    const sample = await frameSample(page);
    await page.route("**/api/atlas/mainline-a-nebula-review/jellyfish-nebula/detail",
      async (route) => {
        await route.fulfill({ status: 503, contentType: "application/json",
          body: '{"status":"simulated-browser-failure"}' });
      }, { times: 1 });
    await gallery.locator('[data-mainline-a-nebula-review-card="jellyfish-nebula"]')
      .getByRole("button", { name: /查看水母星云候选图详情/ })
      .click({ timeout: 10_000 });
    await gallery.locator('[data-mainline-a-nebula-review-detail="jellyfish-nebula"]')
      .waitFor({ state: "visible" });
    await page.locator('[data-nebula-review-detail="jellyfish-nebula"]')
      .waitFor({ state: "visible", timeout: 8_000 });
    await gallery.locator('[data-mainline-a-nebula-review-detail-state="failed"]')
      .waitFor({ state: "visible", timeout: 10_000 });
    await gallery.getByRole("button", { name: "重试加载" })
      .click({ timeout: 8_000 });
    await gallery.locator('[data-mainline-a-nebula-review-detail="jellyfish-nebula"]' +
      '[data-mainline-a-nebula-review-detail-state="loaded"]')
      .waitFor({ state: "visible", timeout: 20_000 });
    const jellyfish = await gallery.locator(
      '[data-mainline-a-nebula-review-detail="jellyfish-nebula"]')
      .evaluate((element) => ({ text: element.textContent,
        links: [...element.querySelectorAll("a")].map((link) => link.href) }));
    assert(jellyfish.text?.includes("NASA/JPL-Caltech/UCLA")
      && jellyfish.text?.includes("原始文件字节不同")
      && jellyfish.links.some((url) =>
        url.startsWith("https://science.nasa.gov/photojournal/")),
    `${device}:source-link-or-variant-label-invalid`);
    await gallery.getByRole("textbox", { name: "搜索十二张星云候选" })
      .fill("PIA13449");
    assert(await gallery.locator("[data-mainline-a-nebula-review-card]")
      .count() === 1, `${device}:search-invalid`);
    await gallery.getByRole("textbox", { name: "搜索十二张星云候选" })
      .fill("");
    await page.getByRole("button", { name: "关闭星云清权审查台" })
      .click({ timeout: 8_000 });
    await gallery.waitFor({ state: "detached", timeout: 8_000 });
    const afterClose = await page.evaluate(() =>
      window.__r68ReviewBlobObservation.read());
    assert(afterClose.active === 0 && afterClose.created > 0
      && afterClose.created === afterClose.revoked,
    `${device}:blob-resources-not-released`);
    await openReview(page);
    await awaitLoadedGallery(page, device);
    await page.getByRole("button", { name: "关闭星云清权审查台" })
      .click({ timeout: 8_000 });
    await page.locator("[data-mainline-a-nebula-review-gallery]")
      .waitFor({ state: "detached", timeout: 8_000 });
    const afterSecondClose = await page.evaluate(() =>
      window.__r68ReviewBlobObservation.read());
    assert(afterSecondClose.active === 0
      && afterSecondClose.created === afterSecondClose.revoked
      && afterSecondClose.created > afterClose.created,
    `${device}:repeat-open-blob-leak`);
    assert(pageErrors.length === 0, `${device}:page-errors`);
    return { device, capturedAt: new Date().toISOString(),
      runtime, initial, searchMatched: 1,
      failureRetry: "503-then-loaded",
      blobLifecycle: { afterClose, afterSecondClose },
      frameSample: sample,
      screenshot: { path: shotPath, bytes: screenshot.byteLength,
        sha256: hash(screenshot) },
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
  && build.exitCode === 0 && build.round === 68,
"build-not-passed");
const browser = await chromium.launch({ headless: true,
  executablePath: CHROME });
try {
  const desktop = await inspectDevice(browser, build, "desktop");
  const mobileViewport = await inspectDevice(browser, build,
    "mobile-viewport");
  const report = { schema: "mainline-a-r68-nebula-review-browser-v655",
    status: "passed-local-browser",
    buildReceipt: BUILD, buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId,
    sourceSha256: build.inputBefore.sha256,
    desktop, mobileViewport,
    evidenceClasses: ["visual", "browser", "performance-local-sample"],
    claims: { physicalMobile: false,
      realUserValidation: false,
      productionPerformance: false,
      copyrightApproval: false,
      scientificValidity: false,
      publicWebReleaseApproved: false } };
  await writeFile(path.join(ROOT, OUTPUT),
    `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ status: report.status,
    buildId: report.buildId, sourceSha256: report.sourceSha256,
    desktop: { loaded: desktop.initial.loadedCards,
      screenshot: desktop.screenshot,
      lifecycle: desktop.blobLifecycle },
    mobileViewport: { loaded: mobileViewport.initial.loadedCards,
      screenshot: mobileViewport.screenshot,
      lifecycle: mobileViewport.blobLifecycle },
    output: OUTPUT }, null, 2));
} finally {
  await browser.close();
}
