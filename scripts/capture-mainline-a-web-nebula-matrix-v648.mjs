import { createHash } from "node:crypto";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "http://127.0.0.1:3091";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BUILD_PATH = "docs/release/v607/mainline-a-r66-build-20261007-v648web01.json";
const MANIFEST_PATH = "app/data/mainlineACanonicalCoverageV622.generated.json";
const runIndex = process.argv.indexOf("--run");
const RUN = runIndex < 0 ? "20261007-v648matrix01" : process.argv[runIndex + 1];
if (!/^\d{8}-v648matrix\d{2}$/.test(RUN ?? "")
  || (runIndex >= 0 && (runIndex !== 2 || process.argv.length !== 4))
  || (runIndex < 0 && process.argv.length !== 2)) {
  throw new Error("nebula-matrix-v648:invalid-run-id");
}
const RAW_PATH = `docs/release/v607/mainline-a-r66-web-nebula-matrix-raw-${RUN}.json`;
const ATTEMPT_PATH = `docs/release/v607/mainline-a-r66-web-nebula-matrix-attempt-${RUN}.json`;
const shotPath = (device, id) =>
  `output/playwright/mainline-a-web-nebula-matrix-${device}-${id}-${RUN}.png`;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const check = (ok, code) => { if (!ok) throw new Error(`nebula-matrix-v648:${code}`); };
const build = JSON.parse(await readFile(path.join(ROOT, BUILD_PATH), "utf8"));
const manifestBytes = await readFile(path.join(ROOT, MANIFEST_PATH));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const rows = manifest.records.filter((row) => row.kind === "nebula");
const source = await captureBuildInputs();
check(rows.length === 12 && new Set(rows.map((row) => row.id)).size === 12,
  "manifest-nebula-coverage-invalid");
check(build.status === "passed" && build.sourceStable === true && build.exitCode === 0
  && build.inputBefore?.sha256 === source.sha256
  && build.inputAfterSha256 === source.sha256
  && build.runtimeBuildId === `mainline-a-${source.sha256.slice(0, 16)}`,
"current-build-not-stable");
const createdAt = new Date().toISOString();
let lastState = null;

async function exclusive(relative, bytes) {
  await writeFile(path.join(ROOT, relative), bytes, { flag: "wx" });
}
async function absent(relative) {
  try {
    await access(path.join(ROOT, relative));
    throw new Error(`nebula-matrix-v648:output-already-exists:${relative}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
async function loadLocalSources() {
  const files = [];
  for (const row of rows) {
    const relative = row.route?.assetPath;
    check(/^public\/textures\/mainline-a\/[a-z0-9-]+\.jpg$/i.test(relative ?? ""),
      `${row.id}:asset-path-invalid`);
    const bytes = await readFile(path.join(ROOT, relative));
    check(sha(bytes) === row.route.assetHash, `${row.id}:asset-hash-invalid`);
    files.push({ id: row.id, path: relative, bytes: bytes.length,
      sha256: sha(bytes) });
  }
  return files;
}

async function openAtlas(page) {
  await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.locator("[data-atlas-app-shell]").waitFor({ state: "visible", timeout: 15_000 });
  await page.getByRole("button", { name: "星云候选" }).click({ timeout: 8_000 });
  await page.locator("[data-mainline-a-nebula-atlas]").waitFor({ state: "visible", timeout: 8_000 });
  await page.getByRole("combobox", { name: "星云记录范围" }).selectOption("current");
  check(await page.locator("[data-mainline-a-nebula-entry]").count() === 12,
    "current-filter-does-not-show-twelve");
}

async function captureOne(page, device, row) {
  const key = `[data-mainline-a-nebula-selected="${row.id}"]`;
  await page.locator(`[data-mainline-a-nebula-entry="${row.id}"]`)
    .click({ timeout: 10_000 });
  await page.locator(key).waitFor({ state: "attached", timeout: 10_000 });
  await page.locator(`${key} [data-mainline-a-nebula-image-state="loaded"]`)
    .waitFor({ state: "attached", timeout: 15_000 });
  await page.waitForFunction((id) => {
    const selected = document.querySelector(`[data-mainline-a-nebula-selected="${id}"]`);
    const image = selected?.querySelector("[data-mainline-a-nebula-image-state] img");
    return image && image.complete && image.naturalWidth > 0
      && Number(getComputedStyle(image).opacity) >= 0.999;
  }, row.id, { timeout: 15_000 });
  await page.locator(`${key} [data-mainline-a-nebula-image-state] img`)
    .scrollIntoViewIfNeeded({ timeout: 8_000 });
  const observed = await page.evaluate((id) => {
    const shell = document.querySelector("[data-atlas-app-shell]");
    const dialog = document.querySelector("[data-mainline-a-nebula-atlas]");
    const selected = dialog?.querySelector(`[data-mainline-a-nebula-selected="${id}"]`);
    const preview = selected?.querySelector("[data-mainline-a-nebula-image-state]");
    const image = preview?.querySelector("img");
    const rect = dialog?.getBoundingClientRect();
    const imageRect = image?.getBoundingClientRect();
    return {
      capturedAt: new Date().toISOString(),
      viewport: [innerWidth, innerHeight],
      visibility: document.visibilityState,
      url: location.href,
      domWidth: document.documentElement.scrollWidth,
      build: { runtimeBuildId: shell?.getAttribute("data-mainline-build-id"),
        branch: shell?.getAttribute("data-mainline-branch"),
        head: shell?.getAttribute("data-mainline-head") },
      boundary: { shell: shell?.getAttribute("data-mainline-a-release-boundary"),
        scientificPayloadWriteback: shell?.getAttribute("data-mainline-a-scientific-payload-writeback"),
        atlasRelease: dialog?.getAttribute("data-mainline-a-nebula-web-release") },
      selectedId: selected?.getAttribute("data-mainline-a-nebula-selected"),
      scope: dialog?.getAttribute("data-mainline-a-nebula-scope"),
      resultCount: Number(dialog?.querySelector("[data-mainline-a-nebula-result-count]")
        ?.getAttribute("data-mainline-a-nebula-result-count")),
      preview: { state: preview?.getAttribute("data-mainline-a-nebula-image-state"),
        src: image?.currentSrc ?? null,
        complete: image?.complete === true,
        naturalWidth: image?.naturalWidth ?? 0,
        naturalHeight: image?.naturalHeight ?? 0,
        opacity: image ? Number(getComputedStyle(image).opacity) : null,
        imageRect: imageRect ? { x: imageRect.x, y: imageRect.y,
          width: imageRect.width, height: imageRect.height } : null },
      rights: { releaseAdmission: selected?.querySelector("[data-mainline-a-nebula-release-admission]")
        ?.getAttribute("data-mainline-a-nebula-release-admission"),
        humanReview: selected?.querySelector("[data-mainline-a-nebula-rights-review]")
          ?.getAttribute("data-mainline-a-nebula-rights-review"),
        sourceHref: selected?.querySelector('a[href^="https:"]')?.getAttribute("href") ?? null,
        visibleText: selected?.innerText.includes("candidate-only · hold · not-admitted") === true },
      dialogRect: rect ? { x: rect.x, y: rect.y,
        width: rect.width, height: rect.height } : null,
    };
  }, row.id);
  const expectedUrl = `${ORIGIN}/${row.route.assetPath.slice("public/".length)}`;
  check(observed.selectedId === row.id && observed.scope === "current"
    && observed.resultCount === 12 && observed.preview.src === expectedUrl
    && observed.preview.state === "loaded" && observed.preview.complete
    && observed.preview.naturalWidth > 0 && observed.preview.naturalHeight > 0
    && observed.preview.opacity >= 0.999,
  `${device}:${row.id}:preview-not-painted`);
  check(observed.build.runtimeBuildId === build.runtimeBuildId
    && observed.build.branch === build.branch && observed.build.head === build.head
    && observed.boundary.shell === "candidate-only-hold-not-admitted"
    && observed.boundary.scientificPayloadWriteback === "false"
    && observed.boundary.atlasRelease === "blocked-rights-pending"
    && observed.rights.releaseAdmission === "candidate-only"
    && observed.rights.humanReview === "pending"
    && observed.rights.visibleText && observed.rights.sourceHref?.startsWith("https://"),
  `${device}:${row.id}:boundary-or-source-invalid`);
  check(observed.visibility === "visible" && observed.domWidth <= observed.viewport[0],
    `${device}:${row.id}:viewport-or-visibility-invalid`);
  const png = await page.screenshot({ type: "png" });
  const relative = shotPath(device, row.id);
  await exclusive(relative, png);
  return { id: row.id, observed, screenshot: { path: relative,
    bytes: png.length, sha256: sha(png) } };
}

async function captureDevice(browser, device, viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1,
    isMobile: device === "mobile", hasTouch: device === "mobile" });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(`page:${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console:${message.text()}`);
    });
    await openAtlas(page);
    const items = [];
    for (const row of rows) {
      lastState = { device, id: row.id, captured: items.length };
      items.push(await captureOne(page, device, row));
      console.log(JSON.stringify({ stage: "captured", device, id: row.id,
        count: items.length, imageState: items.at(-1).observed.preview.state }));
    }
    check(errors.length === 0, `${device}:browser-errors:${errors.join("|").slice(0, 400)}`);
    return { device, viewport: [viewport.width, viewport.height], items,
      errors, physicalDevice: false };
  } finally {
    await context.close();
  }
}

async function captureFailureRecovery(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const routePattern = "**/textures/mainline-a/opo0205d.jpg";
  try {
    await context.route(routePattern, (route) => route.abort("failed"));
    const page = await context.newPage();
    await openAtlas(page);
    await page.locator('[data-mainline-a-nebula-selected="m42"] img')
      .scrollIntoViewIfNeeded({ timeout: 8_000 });
    await page.locator('[data-mainline-a-nebula-selected="m42"] [data-mainline-a-nebula-image-state="failed"]')
      .waitFor({ timeout: 15_000 });
    const failed = await page.locator('[data-mainline-a-nebula-selected="m42"]')
      .evaluate((element) => ({ state: element.querySelector("[data-mainline-a-nebula-image-state]")
        ?.getAttribute("data-mainline-a-nebula-image-state"),
      retryVisible: Array.from(element.querySelectorAll("button"))
        .some((button) => button.textContent?.includes("重试加载观测图")),
      rights: element.querySelector("[data-mainline-a-nebula-rights-review]")
        ?.getAttribute("data-mainline-a-nebula-rights-review") }));
    check(failed.state === "failed" && failed.retryVisible && failed.rights === "pending",
      "fault-injection-failure-state-missing");
    await context.unroute(routePattern);
    await page.getByRole("button", { name: "重试加载观测图" }).click();
    await page.locator('[data-mainline-a-nebula-selected="m42"] [data-mainline-a-nebula-image-state="loaded"]')
      .waitFor({ timeout: 15_000 });
    const recovered = await page.locator('[data-mainline-a-nebula-selected="m42"] img')
      .evaluate((image) => ({ complete: image.complete, naturalWidth: image.naturalWidth }));
    check(recovered.complete && recovered.naturalWidth > 0,
      "fault-injection-retry-not-recovered");
    return { scope: "browser-fault-injection-only", simulatedNetworkFailure: true,
      realExternalSourceFailure: false, failed, recovered };
  } finally {
    await context.close();
  }
}

await absent(RAW_PATH);
await absent(ATTEMPT_PATH);
for (const row of rows) for (const device of ["desktop", "mobile"])
  await absent(shotPath(device, row.id));
const browser = await chromium.launch({ headless: false, executablePath: CHROME });
try {
  const assets = await loadLocalSources();
  const desktop = await captureDevice(browser, "desktop", { width: 1280, height: 720 });
  const mobile = await captureDevice(browser, "mobile", { width: 390, height: 844 });
  const failureRecovery = await captureFailureRecovery(browser);
  const result = { schema: "mainline-a-r66-web-nebula-matrix-raw-v648",
    evidenceClass: "browser", createdAt, endedAt: new Date().toISOString(),
    build: { buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
      sourceSha256: source.sha256, branch: build.branch, head: build.head },
    manifest: { path: MANIFEST_PATH, bytes: manifestBytes.length,
      sha256: sha(manifestBytes), schema: manifest.schema },
    assetFiles: assets, desktop, mobile, failureRecovery,
    counts: { canonicalNebulae: 12, desktopPainted: desktop.items.length,
      mobilePainted: mobile.items.length, humanRightsSigned: 0 },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false },
    claims: { realUserValidation: false, productionPerformance: false,
      scientificValidity: false, copyrightApproval: false,
      publicWebReleaseApproved: false, physicalMobile: false } };
  await exclusive(RAW_PATH, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ stage: "complete", path: RAW_PATH,
    desktop: desktop.items.length, mobile: mobile.items.length,
    faultInjection: "failed-then-recovered", status: "candidate-only" }));
} catch (error) {
  await exclusive(ATTEMPT_PATH, `${JSON.stringify({
    schema: "mainline-a-r66-web-nebula-matrix-attempt-v648",
    createdAt, endedAt: new Date().toISOString(), lastState,
    errorClass: error?.name ?? "Error", errorMessage: error?.message ?? String(error),
    sourceSha256: source.sha256, buildId: build.buildId,
    browserMatrixComplete: false, scientificPayloadWriteback: false,
  }, null, 2)}\n`);
  throw error;
} finally {
  await browser.close();
}
