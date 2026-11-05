import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const R70_WEB_STAGE = process.env.MAINLINE_A_REVIEW_MATRIX_R70_WEB_STAGE === "1";
const ORIGIN = R70_WEB_STAGE
  ? "http://127.0.0.1:3101" : "http://127.0.0.1:3097";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BUILD = R70_WEB_STAGE
  ? "docs/release/v607/mainline-a-r70-build-20261012v657web02.json"
  : "docs/release/v607/mainline-a-r68-build-20261012v655review03.json";
const MANIFEST = "app/data/mainlineANebulaCandidateReviewV655.generated.json";
const OUTPUT = R70_WEB_STAGE
  ? "docs/release/v607/mainline-a-r70-v657-review-browser-matrix-20261012v657web02.json"
  : "docs/release/v607/mainline-a-r68-v655-browser-matrix-20261012v655review03.json";
const assert = (condition, code) => {
  if (!condition) throw new Error(`review-matrix-v655:${code}`);
};

async function inspectDevice(browser, manifest, build, device) {
  const mobile = device === "mobile-viewport";
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 }
      : { width: 1280, height: 720 },
    deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const create = URL.createObjectURL.bind(URL);
    const revoke = URL.revokeObjectURL.bind(URL);
    const active = new Set();
    let created = 0;
    let revoked = 0;
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      if (blob instanceof Blob && blob.type === "image/webp") {
        active.add(url);
        created += 1;
      }
      return url;
    };
    URL.revokeObjectURL = (url) => {
      if (active.delete(url)) revoked += 1;
      revoke(url);
    };
    window.__r68MatrixBlobs = () => ({ created,
      revoked, active: active.size });
  });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  try {
    await page.goto(ORIGIN, { waitUntil: "domcontentloaded",
      timeout: 20_000 });
    await page.locator("[data-atlas-app-shell]")
      .waitFor({ state: "visible", timeout: 20_000 });
    await page.getByRole("button", { name: /^工具/ }).click();
    await page.getByRole("button", { name: "清权审查" }).click();
    const gallery = page.locator("[data-mainline-a-nebula-review-gallery]");
    await gallery.waitFor({ state: "visible", timeout: 10_000 });
    const buildSeen = await page.locator("[data-atlas-app-shell]")
      .getAttribute("data-mainline-build-id");
    assert(buildSeen === build.runtimeBuildId,
    `${device}:build-identity-invalid`);
    await page.waitForFunction(() => document.querySelectorAll(
      '[data-mainline-a-nebula-review-image-state="loaded"]').length === 12,
    null, { timeout: 30_000 });
    const selections = [];
    for (const row of manifest.rows) {
      const card = gallery.locator(
        `[data-mainline-a-nebula-review-card="${row.id}"]`);
      assert(await card.count() === 1,
      `${device}:${row.id}:card-missing`);
      const start = Date.now();
      await card.locator("button").first().click({ timeout: 10_000 });
      const detail = gallery.locator(
        `[data-mainline-a-nebula-review-detail="${row.id}"]`);
      await gallery.locator(
        `[data-mainline-a-nebula-review-detail="${row.id}"]`
        + '[data-mainline-a-nebula-review-detail-state="loaded"]')
        .waitFor({ state: "visible", timeout: 20_000 });
      await page.locator(`[data-nebula-review-detail="${row.id}"]`)
        .waitFor({ state: "visible", timeout: 8_000 });
      const observed = await detail.evaluate((element) => {
        const image = element.querySelector("img");
        const link = element.querySelector("a[href^='https:']");
        return { imageComplete: image?.complete === true,
          naturalWidth: image?.naturalWidth ?? 0,
          naturalHeight: image?.naturalHeight ?? 0,
          sourceUrl: link?.href ?? null,
          text: element.textContent ?? "" };
      });
      const resources = await page.evaluate(() =>
        window.__r68MatrixBlobs());
      assert(observed.imageComplete
        && observed.naturalWidth === row.preview.detail.width
        && observed.naturalHeight === row.preview.detail.height
        && observed.sourceUrl === row.sourcePageUrl
        && observed.text.includes(row.sourceCredit)
        && observed.text.includes("版权待审")
        && observed.text.includes("scientificPayloadWriteback=false")
        && resources.active === 13,
      `${device}:${row.id}:detail-source-or-lifecycle-invalid`);
      selections.push({ id: row.id, nasaId: row.nasaId,
        batchId: row.batchId, previewWidth: observed.naturalWidth,
        previewHeight: observed.naturalHeight,
        sourceUrl: observed.sourceUrl,
        objectUrlsActive: resources.active,
        localSelectionWallMs: Date.now() - start });
      console.log(JSON.stringify({ stage: "review-browser-selection",
        device, id: row.id, objectUrlsActive: resources.active }));
    }
    await page.getByRole("button", { name: "关闭星云清权审查台" })
      .click();
    await gallery.waitFor({ state: "detached", timeout: 8_000 });
    const released = await page.evaluate(() =>
      window.__r68MatrixBlobs());
    assert(released.active === 0 && released.created === released.revoked,
    `${device}:matrix-close-leaked-blob-urls`);
    assert(pageErrors.length === 0, `${device}:page-errors`);
    return { device, selections,
      counts: { candidateDetailsOpened: selections.length,
        sourceLinksMatched: selections.length,
        decodedImages: selections.length,
        resourceCyclesReleased: selections.length },
      released, pageErrors,
      claims: { realUserValidation: false,
        productionPerformance: false,
        copyrightApproval: false,
        scientificValidity: false } };
  } finally {
    await context.close();
  }
}

const [build, manifest] = await Promise.all([
  readFile(path.join(ROOT, BUILD), "utf8").then(JSON.parse),
  readFile(path.join(ROOT, MANIFEST), "utf8").then(JSON.parse),
]);
assert(build.status === "passed" && build.sourceStable === true
  && manifest.rows?.length === 12
  && manifest.counts?.rightsSigned === 0,
"build-or-manifest-invalid");
const sourceBefore = R70_WEB_STAGE ? await captureBuildInputs() : null;
if (R70_WEB_STAGE) assert(sourceBefore.sha256 === build.inputBefore.sha256
  && sourceBefore.sha256 === build.inputAfterSha256,
"current-source-build-mismatch");
const browser = await chromium.launch({ headless: true,
  executablePath: CHROME });
try {
  const desktop = await inspectDevice(browser, manifest, build,
    "desktop");
  const mobileViewport = await inspectDevice(browser, manifest,
    build, "mobile-viewport");
  if (R70_WEB_STAGE) assert((await captureBuildInputs()).sha256
    === sourceBefore.sha256, "source-changed-during-matrix");
  const report = { schema: R70_WEB_STAGE
    ? "mainline-a-r70-nebula-review-matrix-v657"
    : "mainline-a-r68-nebula-review-matrix-v655",
    status: "passed-twelve-details-per-viewport",
    buildReceipt: BUILD, buildId: build.buildId,
    sourceSha256: build.inputBefore.sha256,
    desktop, mobileViewport,
    totals: { selections: 24,
      pageErrors: desktop.pageErrors.length
        + mobileViewport.pageErrors.length,
      leakedReviewBlobUrls: desktop.released.active
        + mobileViewport.released.active },
    claims: { physicalMobile: false,
      realUserValidation: false,
      productionPerformance: false,
      copyrightApproval: false,
      scientificValidity: false,
      publicWebReleaseApproved: false } };
  await writeFile(path.join(ROOT, OUTPUT),
    `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ status: report.status,
    buildId: report.buildId, totals: report.totals,
    output: OUTPUT }, null, 2));
} finally {
  await browser.close();
}
