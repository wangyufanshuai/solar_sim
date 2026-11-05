import { createHash } from "node:crypto";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const MANIFEST = "app/data/mainlineACanonicalCoverageV622.generated.json";
const R70_WEB_STAGE = process.env.MAINLINE_A_POINTER_R70_WEB_STAGE === "1";
const device = process.argv[process.argv.indexOf("--device") + 1];
const runId = process.argv[process.argv.indexOf("--run") + 1];
if (!["desktop", "mobile"].includes(device)
  || !(R70_WEB_STAGE ? /^20261012-v657pointer0[1-9]$/
    : /^\d{8}-v649pointer0[1-3]$/).test(runId ?? ""))
  throw new Error("pointer-matrix-v649:usage:--device desktop|mobile --run YYYYMMDD-v649pointerNN");
const variant = runId.slice(-2);
const ORIGIN = R70_WEB_STAGE ? "http://127.0.0.1:3101"
  : `http://127.0.0.1:${3091 + Number(variant)}`;
const BUILD = R70_WEB_STAGE
  ? "docs/release/v607/mainline-a-r70-build-20261012v657web02.json"
  : `docs/release/v607/mainline-a-r66-build-20261011-v649web${variant}.json`;
const viewport = device === "desktop" ? [1280, 720] : [390, 844];
const pathPrefix = R70_WEB_STAGE
  ? "mainline-a-r70-v657" : "mainline-a-r66-web";
const rawPath = `docs/release/v607/${pathPrefix}-pointer-${device}-raw-${runId}.json`;
const attemptPath = `docs/release/v607/${pathPrefix}-pointer-${device}-attempt-${runId}.json`;
const screenshotPath = (row) => `output/playwright/${pathPrefix}-pointer-${device}-${row.kind}-${row.id}-${runId}.png`;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const ensure = (valid, code) => { if (!valid) throw new Error(`pointer-matrix-v649:${code}`); };

async function absent(relative) {
  try {
    await access(path.join(ROOT, relative));
    throw new Error(`pointer-matrix-v649:output-exists:${relative}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function exclusive(relative, content) {
  await writeFile(path.join(ROOT, relative), content, { flag: "wx" });
}

const buildBytes = await readFile(path.join(ROOT, BUILD));
const build = JSON.parse(buildBytes.toString("utf8"));
const manifestBytes = await readFile(path.join(ROOT, MANIFEST));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const rows = ["star", "constellation", "nebula"]
  .flatMap((kind) => manifest.records.filter((row) => row.kind === kind));
const sourceBefore = await captureBuildInputs();
ensure(rows.length === 36 && ["star", "constellation", "nebula"]
  .every((kind) => rows.filter((row) => row.kind === kind).length === 12),
"manifest-coverage-invalid");
ensure(build.status === "passed" && build.sourceStable === true
  && build.inputBefore?.sha256 === sourceBefore.sha256
  && build.inputAfterSha256 === sourceBefore.sha256
  && build.runtimeBuildId === `mainline-a-${sourceBefore.sha256.slice(0, 16)}`,
"build-not-current");
await absent(rawPath);
await absent(attemptPath);
for (const row of rows) await absent(screenshotPath(row));

async function clickWithHit(page, locator, label) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await clickStableTarget(page, locator, label, attempt);
    } catch (error) {
      const detached = /Element is not attached to the DOM|element is not stable/i
        .test(String(error?.message ?? error));
      if (!detached || attempt === 4) throw error;
      await page.waitForTimeout(150 * attempt);
    }
  }
  throw new Error(`pointer-matrix-v649:${label}:stable-target-unavailable`);
}

async function clickStableTarget(page, locator, label, attempt) {
  await locator.scrollIntoViewIfNeeded({ timeout: 12_000 });
  const hit = await locator.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const top = document.elementFromPoint(x, y);
    return {
      center: [Math.round(x), Math.round(y)],
      viewport: [innerWidth, innerHeight],
      targetTag: element.tagName.toLowerCase(),
      topTag: top?.tagName.toLowerCase() ?? null,
      topAriaLabel: top?.getAttribute("aria-label") ?? null,
      topText: top?.textContent?.trim().slice(0, 60) ?? null,
      targetOwnsHit: Boolean(top && (top === element || element.contains(top))),
      targetConnected: element.isConnected,
    };
  });
  ensure(hit.targetOwnsHit && hit.targetConnected,
  `${label}:pointer-intercepted-by:${hit.topAriaLabel ?? hit.topText ?? hit.topTag}`);
  await locator.click({ timeout: 12_000 });
  return { label, ...hit, inputMethod: "pointer", attempt };
}

async function openBrowser(page) {
  const browser = page.locator("#universe-object-browser");
  if (!(await browser.count())) {
    await clickWithHit(page, page.locator('button[aria-label="搜索"]'), "open-object-browser");
    await browser.waitFor({ state: "attached", timeout: 10_000 });
  }
  return browser;
}

async function prepareForSelection(page) {
  if (device !== "mobile") return;
  const closePassport = page.getByRole("button", { name: "关闭天体档案" });
  if (await closePassport.count()) {
    await clickWithHit(page, closePassport, "close-mobile-passport");
    await page.locator("[data-mainline-a-tools-toggle]").waitFor({ state: "visible", timeout: 8_000 });
  }
}

async function selectStar(page, row) {
  const pointer = [];
  pointer.push(await clickWithHit(page, page.getByRole("button", { name: "恒星图集" }), "open-stellar-atlas"));
  pointer.push(await clickWithHit(page,
    page.locator(`[data-mainline-a-atlas-star="${row.id}"]`), `select-star:${row.id}`));
  pointer.push(await clickWithHit(page,
    page.getByRole("button", { name: "在星空中定位" }), `locate-star:${row.id}`));
  await page.locator("[data-mainline-a-stellar-atlas]").waitFor({ state: "detached", timeout: 10_000 });
  return { pointer, browserAutoClosed: null };
}

async function selectConstellation(page, row) {
  const pointer = [];
  const browser = await openBrowser(page);
  pointer.push(await clickWithHit(page,
    browser.locator('[data-mainline-a-constellation-shortcut="canonical"]'),
    "canonical-constellation-shortcut"));
  ensure(await browser.locator('[data-mainline-a-constellation-index] [data-mainline-a-current="true"]').count() === 12,
    "canonical-constellation-shortcut-not-twelve");
  pointer.push(await clickWithHit(page,
    browser.locator(`[data-mainline-a-constellation-index] [data-celestial-catalog-entry-id="constellation:${row.id}"]`),
    `select-constellation:${row.id}`));
  const autoClosed = !(await browser.count());
  if (device === "desktop" && !autoClosed) {
    pointer.push(await clickWithHit(page, browser.getByRole("button", { name: "收起对象浏览器" }),
      "close-object-browser"));
  }
  await browser.waitFor({ state: "detached", timeout: 8_000 });
  ensure(device !== "mobile" || autoClosed, `constellation:${row.id}:mobile-browser-not-closed`);
  return { pointer, browserAutoClosed: autoClosed };
}

async function selectNebula(page, row, firstNebula) {
  const pointer = [];
  let browser = await openBrowser(page);
  if (firstNebula && device === "mobile") {
    pointer.push(await clickWithHit(page,
      browser.getByRole("button", { name: "收起对象浏览器" }),
      "close-object-browser-over-passport-trigger"));
    await browser.waitFor({ state: "detached", timeout: 8_000 });
    browser = await openBrowser(page);
  }
  const deepSky = browser.locator("button[aria-expanded]").nth(3);
  if (await deepSky.getAttribute("aria-expanded") !== "true") {
    pointer.push(await clickWithHit(page, deepSky, "expand-deep-sky-over-passport-trigger"));
  }
  pointer.push(await clickWithHit(page,
    browser.locator(`[data-celestial-catalog-entry-id="nebula:${row.id}"]`),
    `select-nebula:${row.id}`));
  const autoClosed = !(await browser.count());
  if (device === "desktop" && !autoClosed) {
    pointer.push(await clickWithHit(page, browser.getByRole("button", { name: "收起对象浏览器" }),
      "close-object-browser"));
  }
  await browser.waitFor({ state: "detached", timeout: 8_000 });
  ensure(device !== "mobile" || autoClosed, `nebula:${row.id}:mobile-browser-not-closed`);
  return { pointer, browserAutoClosed: autoClosed };
}

async function runtimeReadout(page, row) {
  await clickWithHit(page, page.locator("[data-mainline-a-performance-restore]"), "restore-performance-panel");
  await page.locator('[data-mainline-a-performance-docked="false"]').waitFor();
  const expected = `运行时对象：${row.kind}:${row.id} · ready`;
  await page.waitForFunction((value) => Array.from(document.querySelectorAll(
    "[data-mainline-a-resource-observation] p"))
    .some((element) => element.textContent?.trim() === value), expected, { timeout: 15_000 });
  await clickWithHit(page, page.getByRole("button", { name: "收起以选择对象" }), "dock-performance-panel");
  return expected;
}

async function observe(page, row, index) {
  await prepareForSelection(page);
  const selection = row.kind === "star" ? await selectStar(page, row)
    : row.kind === "constellation" ? await selectConstellation(page, row)
      : await selectNebula(page, row, index === 24);
  const selectedId = row.kind === "star" ? `stellar-hero:${row.id}` : `${row.kind}:${row.id}`;
  await page.waitForFunction((id) => document.querySelector("[data-atlas-app-shell]")
    ?.getAttribute("data-celestial-catalog-selected-id") === id,
  selectedId, { timeout: 12_000 });
  const readout = await runtimeReadout(page, row);
  if (row.kind === "nebula") await page.locator(
    `[data-mainline-a-scene-nebula="${row.id}"][data-mainline-a-scene-image-status="ready"]`)
    .waitFor({ state: "attached", timeout: 15_000 });
  if (row.kind === "constellation") await page.locator(
    `[data-mainline-a-star-chart="${row.id}"]`)
    .waitFor({ state: "attached", timeout: 12_000 });
  await page.waitForTimeout(1_100);
  const observed = await page.evaluate(() => {
    const shell = document.querySelector("[data-atlas-app-shell]");
    const passport = document.querySelector("[data-celestial-object-passport-id]");
    const nebula = document.querySelector("[data-mainline-a-scene-nebula]");
    const chart = document.querySelector("[data-mainline-a-star-chart]");
    return { capturedAt: new Date().toISOString(), viewport: [innerWidth, innerHeight],
      domWidth: document.documentElement.scrollWidth, visibility: document.visibilityState,
      url: location.href, selectedCatalogId: shell?.getAttribute("data-celestial-catalog-selected-id"),
      runtimeBuildId: shell?.getAttribute("data-mainline-build-id"),
      releaseBoundary: shell?.getAttribute("data-mainline-a-release-boundary"),
      scientificPayloadWriteback: shell?.getAttribute("data-mainline-a-scientific-payload-writeback"),
      sceneMode: shell?.getAttribute("data-atlas-runtime-scene-focus-performance-scene-mode"),
      passport: { id: passport?.getAttribute("data-celestial-object-passport-id"),
        kind: passport?.getAttribute("data-celestial-object-passport-kind") },
      nebula: nebula ? { id: nebula.getAttribute("data-mainline-a-scene-nebula"),
        state: nebula.getAttribute("data-mainline-a-scene-image-status"),
        sha256: nebula.getAttribute("data-mainline-a-scene-image-sha256"),
        rights: nebula.getAttribute("data-mainline-a-scene-human-rights-signoff"),
        admission: nebula.getAttribute("data-mainline-a-scene-release-admission") } : null,
      constellation: chart ? { id: chart.getAttribute("data-mainline-a-star-chart"),
        source: chart.getAttribute("data-mainline-a-chart-source"),
        writeback: chart.getAttribute("data-mainline-a-chart-scientific-writeback") } : null };
  });
  ensure(observed.selectedCatalogId === selectedId && observed.runtimeBuildId === build.runtimeBuildId
    && observed.releaseBoundary === "candidate-only-hold-not-admitted"
    && observed.scientificPayloadWriteback === "false" && observed.sceneMode === "inspect"
    && observed.visibility === "visible" && observed.domWidth <= viewport[0]
    && readout === `运行时对象：${row.kind}:${row.id} · ready`,
  `${row.kind}:${row.id}:runtime-or-build-invalid`);
  if (row.kind === "nebula") ensure(observed.nebula?.id === row.id
    && observed.nebula.state === "ready" && observed.nebula.sha256 === row.route.assetHash
    && observed.nebula.rights === "pending" && observed.nebula.admission === "candidate-only",
  `nebula:${row.id}:rights-or-scene-invalid`);
  if (row.kind === "constellation") ensure(observed.constellation?.id === row.id
    && observed.constellation.source === "candidate-only"
    && observed.constellation.writeback === "false",
  `constellation:${row.id}:chart-invalid`);
  const screenshot = await page.screenshot({ type: "png" });
  const relative = screenshotPath(row);
  await exclusive(relative, screenshot);
  return { key: `${row.kind}:${row.id}`, readout, selection, observed,
    screenshot: { path: relative, bytes: screenshot.length, sha256: sha(screenshot) } };
}

const startedAt = new Date().toISOString();
let lastItem = null;
const browser = await chromium.launch({ headless: false, executablePath: CHROME });
try {
  const context = await browser.newContext({ viewport: { width: viewport[0], height: viewport[1] },
    deviceScaleFactor: 1, isMobile: device === "mobile", hasTouch: device === "mobile" });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(`page:${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console:${message.text()}`);
    });
    await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await page.locator("[data-atlas-app-shell]").waitFor({ state: "visible", timeout: 20_000 });
    await clickWithHit(page, page.locator("[data-mainline-a-tools-toggle]"), "open-tools");
    await clickWithHit(page, page.getByRole("button", { name: "性能生命周期" }), "open-performance-panel");
    await page.getByRole("combobox", { name: "资源观察范围" }).selectOption("canonical-object");
    await page.locator("[data-mainline-a-resource-observation]").waitFor({ state: "attached" });
    await clickWithHit(page, page.getByRole("button", { name: "收起以选择对象" }), "dock-performance-panel");
    const items = [];
    for (const [index, row] of rows.entries()) {
      lastItem = `${row.kind}:${row.id}`;
      items.push(await observe(page, row, index));
      console.log(JSON.stringify({ stage: "captured", device, key: lastItem, count: items.length }));
    }
    ensure(errors.length === 0, `browser-errors:${errors.join("|").slice(0, 400)}`);
    const sourceAfter = await captureBuildInputs();
    ensure(sourceAfter.sha256 === sourceBefore.sha256, "source-changed-during-capture");
    const raw = { schema: R70_WEB_STAGE ? "mainline-a-r70-web-pointer-matrix-v657"
      : "mainline-a-r66-web-pointer-matrix-v649", evidenceClass: "browser",
      runId, device, startedAt, endedAt: new Date().toISOString(), viewport,
      build: { path: BUILD, buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
        sourceSha256: sourceBefore.sha256, branch: build.branch, head: build.head },
      manifest: { path: MANIFEST, bytes: manifestBytes.length, sha256: sha(manifestBytes) },
      counts: { total: 36, stars: 12, constellations: 12, nebulae: 12,
        keyboardActivations: 0, humanRightsSigned: 0 },
      items, errors, physicalDevice: false,
      boundary: { candidateOnly: true, hold: true, notAdmitted: true,
        scientificPayloadWriteback: false },
      claims: { realUserValidation: false, productionPerformance: false,
        scientificValidity: false, copyrightApproval: false,
        publicWebReleaseApproved: false } };
    await exclusive(rawPath, `${JSON.stringify(raw, null, 2)}\n`);
    console.log(JSON.stringify({ stage: "complete", path: rawPath, device, count: items.length }));
  } finally {
    await context.close();
  }
} catch (error) {
  await exclusive(attemptPath, `${JSON.stringify({
    schema: R70_WEB_STAGE ? "mainline-a-r70-web-pointer-attempt-v657"
      : "mainline-a-r66-web-pointer-attempt-v649", startedAt,
    endedAt: new Date().toISOString(), runId, device, lastItem,
    errorClass: error?.name ?? "Error", errorMessage: error?.message ?? String(error),
    sourceSha256: sourceBefore.sha256, buildId: build.buildId,
    browserMatrixComplete: false, scientificPayloadWriteback: false,
  }, null, 2)}\n`);
  throw error;
} finally {
  await browser.close();
}
