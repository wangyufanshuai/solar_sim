import { createHash } from "node:crypto";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const R80_PROFILE = process.env.MAINLINE_A_R80_PROFILE === "1";
const R77_PROFILE = process.env.MAINLINE_A_R77_PROFILE === "1";
const R75_PROFILE = !R80_PROFILE && !R77_PROFILE
  && process.env.MAINLINE_A_R75_PROFILE === "1";
const PROFILE = R80_PROFILE ? "r80"
  : R77_PROFILE ? "r77"
  : R75_PROFILE ? "r75" : "r66";
const ORIGIN = R80_PROFILE
  ? process.env.MAINLINE_A_R80_ORIGIN
  : R77_PROFILE
  ? process.env.MAINLINE_A_R77_ORIGIN
  : R75_PROFILE
    ? process.env.MAINLINE_A_R75_ORIGIN
    : "http://127.0.0.1:3091";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BUILD = R80_PROFILE
  ? `docs/release/v607/mainline-a-r80-build-${process.env.MAINLINE_A_R80_BUILD_RUN_ID}.json`
  : R77_PROFILE
  ? `docs/release/v607/mainline-a-r77-build-${process.env.MAINLINE_A_R77_BUILD_RUN_ID}.json`
  : R75_PROFILE
    ? `docs/release/v607/mainline-a-r75-build-${process.env.MAINLINE_A_R75_BUILD_RUN_ID}.json`
  : "docs/release/v607/mainline-a-r66-build-20261007-v648web01.json";
const MANIFEST = "app/data/mainlineACanonicalCoverageV622.generated.json";
const args = process.argv.slice(2);
const device = args[args.indexOf("--device") + 1];
const run = args[args.indexOf("--run") + 1];
if (args.length !== 4 || !["desktop", "mobile"].includes(device)
  || !(R80_PROFILE ? /^\d{8}-v667scene\d{2}$/
    : R77_PROFILE ? /^\d{8}-v664scene\d{2}$/
    : R75_PROFILE ? /^\d{8}-v662scene\d{2}$/
      : /^\d{8}-v648scene\d{2}$/).test(run ?? "")
  || ((R75_PROFILE || R77_PROFILE || R80_PROFILE)
    && !/^http:\/\/127\.0\.0\.1:\d{4,5}$/.test(ORIGIN ?? ""))
  || (R80_PROFILE
    && !/^20261013v667r80web0[1-9]$/.test(
      process.env.MAINLINE_A_R80_BUILD_RUN_ID ?? ""))
  || (R75_PROFILE
    && !/^20261013v662r75web0[1-9]$/.test(
      process.env.MAINLINE_A_R75_BUILD_RUN_ID ?? ""))
  || (R77_PROFILE
    && !/^20261013v664r77web0[1-9]$/.test(
      process.env.MAINLINE_A_R77_BUILD_RUN_ID ?? "")))
  throw new Error("canonical-scene-v648:usage:--device desktop|mobile --run YYYYMMDD-v648sceneNN");
const viewport = device === "desktop" ? { width: 1280, height: 720 } : { width: 390, height: 844 };
const rawPath = `docs/release/v607/mainline-a-${PROFILE}-web-canonical-scene-${device}-raw-${run}.json`;
const attemptPath = `docs/release/v607/mainline-a-${PROFILE}-web-canonical-scene-${device}-attempt-${run}.json`;
const imagePath = (kind, id) => `output/playwright/mainline-a-${PROFILE === "r66" ? "" : PROFILE + "-"}web-canonical-scene-${device}-${kind}-${id}-${run}.png`;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const ensure = (valid, code) => { if (!valid) throw new Error(`canonical-scene-v648:${code}`); };
const build = JSON.parse(await readFile(path.join(ROOT, BUILD), "utf8"));
const manifestBytes = await readFile(path.join(ROOT, MANIFEST));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const sourceBefore = await captureBuildInputs();
const rows = manifest.records;
const byKind = Object.groupBy(rows, (row) => row.kind);
ensure(rows.length === 36 && ["star", "constellation", "nebula"]
  .every((kind) => byKind[kind]?.length === 12), "manifest-coverage-invalid");
ensure(build.status === "passed" && build.sourceStable === true && build.exitCode === 0
  && build.inputBefore?.sha256 === sourceBefore.sha256
  && build.inputAfterSha256 === sourceBefore.sha256
  && build.runtimeBuildId === `mainline-a-${sourceBefore.sha256.slice(0, 16)}`,
"current-build-identity-invalid");
const startedAt = new Date().toISOString();
let lastItem = null;

async function absent(relative) {
  try {
    await access(path.join(ROOT, relative));
    throw new Error(`canonical-scene-v648:output-exists:${relative}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
async function exclusive(relative, bytes) {
  await writeFile(path.join(ROOT, relative), bytes, { flag: "wx" });
}
async function waitForShell(page) {
  await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded", timeout: 20_000 });
  await page.locator("[data-atlas-app-shell]").waitFor({ state: "visible", timeout: 20_000 });
  await page.getByRole("button", { name: "恒星图集" }).waitFor({ state: "visible", timeout: 20_000 });
  await page.locator("[data-mainline-a-tools-toggle]").waitFor({ state: "visible", timeout: 20_000 });
}
async function setupReadout(page) {
  await page.locator("[data-mainline-a-tools-toggle]").click();
  await page.getByRole("button", { name: "性能生命周期" }).click();
  await page.getByRole("combobox", { name: "资源观察范围" }).selectOption("canonical-object");
  await page.locator("[data-mainline-a-resource-observation]").waitFor({ state: "attached" });
  await page.getByRole("button", { name: "收起以选择对象" }).click();
  await page.locator('[data-mainline-a-performance-docked="true"]').waitFor();
}
async function selectStar(page, row) {
  await page.getByRole("button", { name: "恒星图集" }).click({ timeout: 12_000 });
  await page.locator(`[data-mainline-a-atlas-star="${row.id}"]`).click({ timeout: 12_000 });
  await page.getByRole("button", { name: "在星空中定位" }).click({ timeout: 12_000 });
  await page.locator("[data-mainline-a-stellar-atlas]").waitFor({ state: "detached", timeout: 10_000 });
}
async function objectBrowser(page) {
  const browser = page.locator("#universe-object-browser");
  if (!(await browser.count())) {
    await page.locator('button[aria-label="搜索"]').click({ timeout: 12_000 });
    await browser.waitFor({ state: "attached", timeout: 10_000 });
  }
  return browser;
}
async function selectConstellation(page, row) {
  const browser = await objectBrowser(page);
  await browser.locator('[data-mainline-a-constellation-shortcut="canonical"]').click();
  ensure(await browser.locator('[data-mainline-a-constellation-index] [data-mainline-a-current="true"]').count() === 12,
    "constellation-shortcut-not-twelve");
  await browser.locator(`[data-mainline-a-constellation-index] [data-celestial-catalog-entry-id="constellation:${row.id}"]`)
    .click({ timeout: 12_000 });
  if (await browser.count()) {
    const close = browser.getByRole("button", { name: "收起对象浏览器" });
    if (device === "mobile") await close.press("Enter");
    else await close.click();
  }
  await browser.waitFor({ state: "detached", timeout: 8_000 });
}
async function selectNebula(page, row) {
  const browser = await objectBrowser(page);
  const deepSky = browser.locator("button[aria-expanded]").nth(3);
  if (await deepSky.getAttribute("aria-expanded") !== "true") {
    if (device === "mobile") await deepSky.press("Enter");
    else await deepSky.click();
  }
  const entry = browser.locator(`[data-celestial-catalog-entry-id="nebula:${row.id}"]`);
  if (device === "mobile") await entry.press("Enter");
  else await entry.click({ timeout: 12_000 });
  if (await browser.count()) {
    const close = browser.getByRole("button", { name: "收起对象浏览器" });
    if (device === "mobile") await close.press("Enter");
    else await close.click();
  }
  await browser.waitFor({ state: "detached", timeout: 8_000 });
}
async function selectScene(page, row) {
  if (device === "mobile") {
    const closePassport = page.getByRole("button", { name: "关闭天体档案" });
    if (await closePassport.count()) {
      await closePassport.click({ timeout: 8_000 });
      await page.locator("[data-mainline-a-tools-toggle]").waitFor({ state: "visible", timeout: 8_000 });
    }
  }
  if (row.kind === "star") await selectStar(page, row);
  else if (row.kind === "constellation") await selectConstellation(page, row);
  else await selectNebula(page, row);
  const expectedId = row.kind === "star" ? `stellar-hero:${row.id}` : `${row.kind}:${row.id}`;
  await page.waitForFunction((id) => document.querySelector("[data-atlas-app-shell]")
    ?.getAttribute("data-celestial-catalog-selected-id") === id,
  expectedId, { timeout: 12_000 });
}
async function runtimeReadout(page, row) {
  await page.locator("[data-mainline-a-performance-restore]").click({ timeout: 8_000 });
  await page.locator('[data-mainline-a-performance-docked="false"]').waitFor();
  const expected = `运行时对象：${row.kind}:${row.id} · ready`;
  await page.waitForFunction((text) => Array.from(document.querySelectorAll(
    "[data-mainline-a-resource-observation] p"))
    .some((element) => element.textContent?.trim() === text), expected, { timeout: 15_000 });
  const readout = await page.evaluate(() => Array.from(document.querySelectorAll(
    "[data-mainline-a-resource-observation] p"))
    .find((element) => element.textContent?.startsWith("运行时对象："))?.textContent?.trim() ?? null);
  await page.getByRole("button", { name: "收起以选择对象" }).click();
  await page.locator('[data-mainline-a-performance-docked="true"]').waitFor();
  return readout;
}
async function observe(page, row) {
  await selectScene(page, row);
  const runtime = await runtimeReadout(page, row);
  if (row.kind === "nebula") {
    await page.locator(`[data-mainline-a-scene-nebula="${row.id}"][data-mainline-a-scene-image-status="ready"]`)
      .waitFor({ state: "attached", timeout: 15_000 });
  }
  if (row.kind === "constellation") {
    await page.locator(`[data-mainline-a-star-chart="${row.id}"]`)
      .waitFor({ state: "attached", timeout: 12_000 });
  }
  await page.waitForTimeout(1_100);
  const observed = await page.evaluate((target) => {
    const shell = document.querySelector("[data-atlas-app-shell]");
    const passport = document.querySelector("[data-celestial-object-passport-id]");
    const sceneNebula = document.querySelector("[data-mainline-a-scene-nebula]");
    const chart = document.querySelector("[data-mainline-a-star-chart]");
    const resourceRoot = document.querySelector("[data-atlas-resource-total]") ?? shell;
    return { capturedAt: new Date().toISOString(), viewport: [innerWidth, innerHeight],
      visibility: document.visibilityState, domWidth: document.documentElement.scrollWidth,
      url: location.href, selectedCatalogId: shell?.getAttribute("data-celestial-catalog-selected-id"),
      build: { runtimeBuildId: shell?.getAttribute("data-mainline-build-id"),
        branch: shell?.getAttribute("data-mainline-branch"),
        head: shell?.getAttribute("data-mainline-head") },
      boundary: { shell: shell?.getAttribute("data-mainline-a-release-boundary"),
        scientificPayloadWriteback: shell?.getAttribute("data-mainline-a-scientific-payload-writeback") },
      sceneMode: shell?.getAttribute("data-atlas-runtime-scene-focus-performance-scene-mode"),
      passport: { id: passport?.getAttribute("data-celestial-object-passport-id"),
        kind: passport?.getAttribute("data-celestial-object-passport-kind") },
      nebula: sceneNebula ? { id: sceneNebula.getAttribute("data-mainline-a-scene-nebula"),
        state: sceneNebula.getAttribute("data-mainline-a-scene-image-status"),
        sha256: sceneNebula.getAttribute("data-mainline-a-scene-image-sha256"),
        rights: sceneNebula.getAttribute("data-mainline-a-scene-human-rights-signoff"),
        admission: sceneNebula.getAttribute("data-mainline-a-scene-release-admission") } : null,
      constellation: chart ? { id: chart.getAttribute("data-mainline-a-star-chart"),
        source: chart.getAttribute("data-mainline-a-chart-source"),
        writeback: chart.getAttribute("data-mainline-a-chart-scientific-writeback") } : null,
      registry: { total: resourceRoot?.getAttribute("data-atlas-resource-total"),
        identityDigest: resourceRoot?.getAttribute("data-atlas-resource-identity-digest") },
      targetKind: target.kind, targetId: target.id };
  }, { kind: row.kind, id: row.id });
  const selectedId = row.kind === "star" ? `stellar-hero:${row.id}` : `${row.kind}:${row.id}`;
  ensure(observed.selectedCatalogId === selectedId && observed.passport.id
    && observed.sceneMode === "inspect" && runtime === `运行时对象：${row.kind}:${row.id} · ready`,
  `${row.kind}:${row.id}:runtime-not-ready`);
  ensure(observed.build.runtimeBuildId === build.runtimeBuildId
    && observed.build.branch === build.branch && observed.build.head === build.head
    && observed.boundary.shell === "candidate-only-hold-not-admitted"
    && observed.boundary.scientificPayloadWriteback === "false"
    && observed.visibility === "visible" && observed.domWidth <= viewport.width,
  `${row.kind}:${row.id}:build-or-viewport-invalid`);
  if (row.kind === "nebula") ensure(observed.nebula?.id === row.id
    && observed.nebula.state === "ready" && observed.nebula.sha256 === row.route.assetHash
    && observed.nebula.rights === "pending" && observed.nebula.admission === "candidate-only",
  `${row.kind}:${row.id}:scene-image-invalid`);
  if (row.kind === "constellation") ensure(observed.constellation?.id === row.id
    && observed.constellation.source === "candidate-only"
    && observed.constellation.writeback === "false",
  `${row.kind}:${row.id}:scene-chart-invalid`);
  const png = await page.screenshot({ type: "png" });
  const relative = imagePath(row.kind, row.id);
  await exclusive(relative, png);
  return { key: `${row.kind}:${row.id}`, runtime, observed,
    screenshot: { path: relative, bytes: png.length, sha256: hash(png) } };
}

await absent(rawPath);
await absent(attemptPath);
for (const row of rows) await absent(imagePath(row.kind, row.id));
const browser = await chromium.launch({ headless: R77_PROFILE || R80_PROFILE,
  executablePath: CHROME });
try {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1,
    isMobile: device === "mobile", hasTouch: device === "mobile" });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(`page:${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console:${message.text()}`);
    });
    await waitForShell(page);
    await setupReadout(page);
    const items = [];
    for (const row of [...byKind.star, ...byKind.constellation, ...byKind.nebula]) {
      lastItem = `${row.kind}:${row.id}`;
      items.push(await observe(page, row));
      console.log(JSON.stringify({ stage: "captured", device, key: lastItem,
        count: items.length, runtime: items.at(-1).runtime }));
    }
    ensure(errors.length === 0, `browser-errors:${errors.join("|").slice(0, 400)}`);
    const sourceAfter = await captureBuildInputs();
    ensure(sourceAfter.sha256 === sourceBefore.sha256, "source-changed-during-browser-run");
    const raw = { schema: R80_PROFILE
      ? "mainline-a-r80-web-canonical-scene-raw-v667"
      : "mainline-a-r66-web-canonical-scene-raw-v648",
      profile: PROFILE,
      evidenceClass: "browser", startedAt, endedAt: new Date().toISOString(),
      runId: run, device, viewport: [viewport.width, viewport.height],
      build: { buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
        sourceSha256: sourceBefore.sha256, branch: build.branch, head: build.head },
      manifest: { path: MANIFEST, bytes: manifestBytes.length,
        sha256: hash(manifestBytes), schema: manifest.schema },
      counts: { total: items.length, stars: 12, constellations: 12, nebulae: 12,
        humanRightsSigned: 0 }, items, errors, physicalDevice: false,
      boundary: { candidateOnly: true, hold: true, notAdmitted: true,
        scientificPayloadWriteback: false },
      claims: { realUserValidation: false, productionPerformance: false,
        scientificValidity: false, copyrightApproval: false,
        publicWebReleaseApproved: false } };
    await exclusive(rawPath, `${JSON.stringify(raw, null, 2)}\n`);
    console.log(JSON.stringify({ stage: "complete", device, path: rawPath,
      items: items.length, status: "candidate-only" }));
  } finally {
    await context.close();
  }
} catch (error) {
  await exclusive(attemptPath, `${JSON.stringify({
    schema: R80_PROFILE
      ? "mainline-a-r80-web-canonical-scene-attempt-v667"
      : "mainline-a-r66-web-canonical-scene-attempt-v648",
    startedAt, endedAt: new Date().toISOString(), device, runId: run, lastItem,
    errorClass: error?.name ?? "Error", errorMessage: error?.message ?? String(error),
    sourceSha256: sourceBefore.sha256, buildId: build.buildId,
    browserMatrixComplete: false, scientificPayloadWriteback: false,
  }, null, 2)}\n`);
  throw error;
} finally {
  await browser.close();
}
