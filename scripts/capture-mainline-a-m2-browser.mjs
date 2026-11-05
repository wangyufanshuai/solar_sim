import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { validateM1Build } from "./capture-mainline-a-m1-browser.mjs";
import { createBrowserResourceGuard } from "./mainline-a-browser-resource-guard.mjs";
import { waitForActualCameraStable } from "./mainline-a-browser-camera-observation.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = "output/playwright/mainline-a-m2-20261015";
export const M2_A12 = Object.freeze(["alpha-centauri-a", "achernar", "betelgeuse", "sirius-a",
  "rigel", "antares", "canopus", "arcturus", "vega", "capella-a", "procyon-a", "aldebaran"]);
export const M2_FOCUS_IDS = Object.freeze(["sirius-a", "betelgeuse", "vega", "achernar"]);
export const M2_ALIASES = Object.freeze([
  { id: "sirius-a", selectedId: "nearby-star:sirius" },
  { id: "alpha-centauri-a", selectedId: "nearby-star:alpha-centauri" },
  { id: "capella-a", selectedId: "nearby-star:capella" },
  { id: "procyon-a", selectedId: "nearby-star:procyon" },
]);
export const M2_VIEWPORTS = Object.freeze({ desktop: { width: 1280, height: 720 }, mobile: { width: 390, height: 844 } });
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const ensure = (condition, message) => { if (!condition) throw new Error(`m2-browser:${message}`); };
const exclusive = (filename, bytes) => writeFile(filename, bytes, { flag: "wx" });

export function parseM2Options(args) {
  const allowed = new Set(["phase", "origin", "build-receipt", "baseline-inputs", "chrome", "run-id", "output-dir"]);
  const values = {};
  ensure(args.length % 2 === 0, "arguments-must-be-pairs");
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    ensure(args[i].startsWith("--") && allowed.has(key) && !(key in values)
      && args[i + 1] && !args[i + 1].startsWith("--"), "unknown-or-duplicate-argument");
    values[key] = args[i + 1];
  }
  ensure(["before", "after"].includes(values.phase), "phase-required");
  const origin = new URL(values.origin ?? "http://invalid");
  ensure(origin.protocol === "http:" && origin.hostname === "127.0.0.1" && origin.port
    && origin.pathname === "/" && !origin.search && !origin.hash && !origin.username && !origin.password,
  "local-origin-required");
  ensure(values["build-receipt"], "build-receipt-required");
  const runId = values["run-id"] ?? new Date().toISOString().replace(/[^0-9]/g, "");
  ensure(/^[a-zA-Z0-9-]{8,48}$/.test(runId), "invalid-run-id");
  const outputDir = values["output-dir"] ?? OUTPUT;
  ensure(/^output\/playwright\/[a-zA-Z0-9-]+$/.test(outputDir), "invalid-output-directory");
  return { phase: values.phase, origin: origin.origin, runId,
    outputDir,
    buildReceipt: path.resolve(ROOT, values["build-receipt"]),
    baselineInputs: path.resolve(ROOT, values["baseline-inputs"] ?? `${OUTPUT}/baseline-inputs.json`),
    chrome: values.chrome ?? "C:/Program Files/Google/Chrome/Application/chrome.exe" };
}

export function inspectM2Observation(observation, starId, viewport, build, phase, mode, selectedId = `stellar-hero:${starId}`) {
  const issues = [];
  const require = (value, issue) => { if (!value) issues.push(issue); };
  require(observation.selectedId === selectedId && observation.passportId,
    "selection-or-passport-mismatch");
  require(observation.runtimeBuildId === build.runtimeBuildId && observation.branch === build.branch
    && observation.head === build.head, "runtime-build-mismatch");
  require(observation.releaseBoundary === "candidate-only-hold-not-admitted"
    && observation.scientificPayloadWriteback === "false", "candidate-boundary-mismatch");
  require(observation.viewport?.[0] === viewport.width && observation.viewport?.[1] === viewport.height
    && observation.documentWidth <= viewport.width && observation.canvasCount === 1
    && observation.visibility === "visible", "layout-or-canvas-invalid");
  require(observation.sceneMode === "inspect", "scene-not-focused");
  const proxy = observation.proxy ?? {};
  require(proxy["data-stellar-hero-id"] === starId
    && proxy["data-atlas-v596-stellar-renderer"] === "v596-stellar-portrait-render-contract-v1"
    && /^[a-f0-9]{64}$/.test(proxy["data-stellar-render-contract-sha256"] ?? ""), "v596-scene-binding-missing");
  require(["scientific-authority", "resolved-surface", "observation-texture", "scientific-payload-writeback"]
    .every((key) => proxy[`data-stellar-${key}`] === "false"), "stellar-boundary-mismatch");
  require(observation.artExpanded === String(mode === "comparison"), "comparison-state-invalid");
  if (mode === "comparison") {
    require(observation.card?.["data-mainline-a-stellar-portrait"] === starId, "comparison-star-mismatch");
    require(observation.svgVisibleRatio >= .98, "comparison-svg-not-fully-visible");
    if (phase === "after") {
      for (const key of ["presentation-id", "presentation-sha256", "color-family", "color-srgb", "model-axis-ratio"]) {
        const attribute = `data-mainline-a-stellar-${key}`;
        require(Boolean(proxy[attribute]) && proxy[attribute] === observation.card?.[attribute],
          `scene-card-${key}-mismatch`);
      }
      require(proxy["data-mainline-a-stellar-presentation-id"] === "m2-shared-v596"
        && /^[a-f0-9]{64}$/.test(proxy["data-mainline-a-stellar-presentation-sha256"] ?? ""),
      "shared-presentation-binding-invalid");
    }
  } else require(observation.card === null && observation.scaleCompact === "true", "default-image-or-scale-invalid");
  return issues;
}

async function ensureAbsent(filename) {
  try { await access(filename); } catch (error) { if (error.code === "ENOENT") return; throw error; }
  throw new Error(`m2-browser:output-exists:${filename}`);
}

async function selectStar(page, id) {
  await page.getByRole("button", { name: "恒星图集", exact: true }).click();
  await page.locator(`[data-mainline-a-atlas-star="${id}"]`).click();
  await page.getByRole("button", { name: "在星空中定位", exact: true }).click();
  await page.locator("[data-mainline-a-stellar-atlas]").waitFor({ state: "detached" });
  await page.waitForFunction((selectedId) => document.querySelector("[data-atlas-app-shell]")
    ?.getAttribute("data-celestial-catalog-selected-id") === selectedId, `stellar-hero:${id}`);
  await page.locator('#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]').waitFor();
  await page.locator(`[data-stellar-hero-id="${id}"]`).waitFor({ state: "attached" });
  await page.waitForFunction(() => document.querySelector("[data-atlas-app-shell]")
    ?.getAttribute("data-atlas-runtime-scene-focus-performance-scene-mode") === "inspect");
  return waitForActualCameraStable(page, `stellar-hero:${id}`);
}

async function selectAlias(page, selectedId, id) {
  await page.locator('button[aria-label="搜索"]').click();
  const panel = page.locator("#universe-object-browser");
  await panel.waitFor();
  const section = panel.locator("button[aria-expanded]").filter({ hasText: "近邻恒星" });
  if (await section.getAttribute("aria-expanded") === "false") await section.press("Enter");
  await panel.locator(`[data-celestial-catalog-entry-id="${selectedId}"]`).press("Enter");
  if (await panel.count()) await panel.getByRole("button", { name: "收起对象浏览器" }).press("Enter");
  await panel.waitFor({ state: "detached" });
  await page.waitForFunction((target) => document.querySelector("[data-atlas-app-shell]")
    ?.getAttribute("data-celestial-catalog-selected-id") === target, selectedId);
  await page.locator('#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]').waitFor();
  await page.locator(`[data-stellar-hero-id="${id}"]`).waitFor({ state: "attached" });
  await page.waitForFunction(() => document.querySelector("[data-atlas-app-shell]")
    ?.getAttribute("data-atlas-runtime-scene-focus-performance-scene-mode") === "inspect");
  return waitForActualCameraStable(page, selectedId);
}

async function observe(page, id) {
  return page.evaluate((starId) => {
    const shell = document.querySelector("[data-atlas-app-shell]");
    const passport = document.querySelector('#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]');
    const proxy = document.querySelector(`[data-stellar-hero-id="${starId}"]`);
    const card = passport?.querySelector(`[data-mainline-a-stellar-portrait="${starId}"]`);
    const svg = card?.querySelector("svg");
    const attrs = (node) => node ? Object.fromEntries([...node.attributes]
      .filter((attribute) => attribute.name.startsWith("data-"))
      .map((attribute) => [attribute.name, attribute.value])) : null;
    const attr = (node, name) => node?.getAttribute(name) ?? null;
    const bounds = svg?.getBoundingClientRect();
    let visible = bounds ? { left: Math.max(0, bounds.left), right: Math.min(innerWidth, bounds.right),
      top: Math.max(0, bounds.top), bottom: Math.min(innerHeight, bounds.bottom) } : null;
    for (let parent = svg?.parentElement; parent && visible; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      const rect = parent.getBoundingClientRect();
      if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
        visible.left = Math.max(visible.left, rect.left); visible.right = Math.min(visible.right, rect.right);
      }
      if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
        visible.top = Math.max(visible.top, rect.top); visible.bottom = Math.min(visible.bottom, rect.bottom);
      }
    }
    const svgVisibleRatio = bounds && visible ? Math.max(0, visible.right - visible.left)
      * Math.max(0, visible.bottom - visible.top) / (bounds.width * bounds.height) : 0;
    return { at: new Date().toISOString(), url: location.href, viewport: [innerWidth, innerHeight],
      documentWidth: document.documentElement.scrollWidth, visibility: document.visibilityState,
      canvasCount: document.querySelectorAll("canvas").length,
      selectedId: attr(shell, "data-celestial-catalog-selected-id"),
      runtimeBuildId: attr(shell, "data-mainline-build-id"), branch: attr(shell, "data-mainline-branch"),
      head: attr(shell, "data-mainline-head"), releaseBoundary: attr(shell, "data-mainline-a-release-boundary"),
      scientificPayloadWriteback: attr(shell, "data-mainline-a-scientific-payload-writeback"),
      sceneMode: attr(shell, "data-atlas-runtime-scene-focus-performance-scene-mode"),
      passportId: attr(passport, "data-celestial-object-passport-id"),
      passportState: attr(passport, "data-mainline-a-passport-state"),
      artExpanded: attr(passport, "data-mainline-a-passport-art-expanded"),
      scaleCompact: attr(document.querySelector('[aria-label="宇宙尺度导航"]'), "data-mainline-a-scale-compact"),
      proxy: attrs(proxy), card: attrs(card), svgBounds: bounds?.toJSON() ?? null, svgVisibleRatio,
      resources: performance.getEntriesByType("resource").filter((entry) => /\.(?:glb|ktx2|png|jpg|webp|svg)(?:\?|$)/.test(entry.name))
        .map((entry) => ({ url: entry.name, transferredBytes: entry.transferSize, decodedBytes: entry.decodedBodySize })) };
  }, id);
}

function createFreshBrowserCaseRunner({ chromium, options, receipt, guard, attempt, setBrowser }) {
  receipt.browserLifecycle = { mode: "fresh-browser-per-case", scope: "functional-and-visual-only",
    durabilityAcceptance: false, sessions: [] };
  return async (caseId, contextOptions, run) => {
    const session = { caseId, browserLaunchId: receipt.runId + ":" + (receipt.browserLifecycle.sessions.length + 1),
      launchRequestedAt: new Date().toISOString(), contextOptions, cleanupErrors: [] };
    receipt.browserLifecycle.sessions.push(session);
    let ownedBrowser; let context; let failure;
    try {
      guard.assert();
      ownedBrowser = await chromium.launch({ headless: true, executablePath: options.chrome });
      setBrowser(ownedBrowser);
      session.launchedAt = new Date().toISOString();
      ownedBrowser.on("disconnected", () => { session.disconnectedAt = new Date().toISOString(); });
      guard.assert();
      context = await ownedBrowser.newContext(contextOptions);
      session.contextCreatedAt = new Date().toISOString();
      return await run(context);
    } catch (error) {
      failure = error; session.failure = error.message;
      const page = context?.pages().find((candidate) => !candidate.isClosed());
      if (page) {
        try {
          const bytes = await page.screenshot();
          const filename = "case-" + caseId + "-failure.png";
          await exclusive(path.join(attempt, filename), bytes);
          session.failureScreenshot = { path: path.relative(ROOT, path.join(attempt, filename)).replaceAll("\\", "/"),
            bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
        } catch (captureError) { session.failureScreenshotError = captureError.message; }
      }
      throw error;
    } finally {
      let cleanupError;
      if (context && ownedBrowser.isConnected()) {
        try { await context.close(); session.contextClosedAt = new Date().toISOString(); }
        catch (error) { cleanupError = error; session.cleanupErrors.push({ stage: "context-close", message: error.message }); }
      } else if (context) {
        session.contextCloseSkipped = "browser-already-disconnected";
        if (!failure) {
          cleanupError = new Error("browser-case-context-close-not-observed:" + caseId);
          session.cleanupErrors.push({ stage: "context-close", message: cleanupError.message });
        }
      }
      if (ownedBrowser) {
        session.closeRequestedAt = new Date().toISOString();
        session.closeReason = guard.evidence.stopReason ? "resource-guard" : failure ? "case-failed" : "case-complete";
        try { await ownedBrowser.close(); session.closedAt = new Date().toISOString(); }
        catch (error) { cleanupError ??= error; session.cleanupErrors.push({ stage: "browser-close", message: error.message }); }
        session.browserConnectedAfterClose = ownedBrowser.isConnected();
        session.connectionObservedAt = new Date().toISOString();
        if (session.browserConnectedAfterClose) {
          const error = new Error("browser-case-still-connected:" + caseId);
          cleanupError ??= error; session.cleanupErrors.push({ stage: "browser-disconnect", message: error.message });
        } else setBrowser(undefined);
      }
      session.endedAt = new Date().toISOString();
      if (cleanupError && !failure) throw cleanupError;
    }
  };
}

export async function captureM2(options) {
  const outputDir = options.outputDir ?? OUTPUT;
  ensure(/^output\/playwright\/[a-zA-Z0-9-]+$/.test(outputDir), "invalid-output-directory");
  const output = path.join(ROOT, outputDir, options.phase);
  await mkdir(output, { recursive: true });
  await ensureAbsent(path.join(output, "receipt.json"));
  const attempt = path.join(output, "attempts", options.runId);
  await mkdir(attempt, { recursive: true });
  await exclusive(path.join(attempt, "started.json"), json({ at: new Date().toISOString(), ...options }));
  const receipt = { schema: "mainline-a-m2-stellar-browser-v1", phase: options.phase, runId: options.runId,
    origin: options.origin, startedAt: new Date().toISOString(), status: "running", items: [], aliasItems: [], errors: [],
    focusIds: M2_FOCUS_IDS, roster: M2_A12, physicalDevice: false,
    claims: { humanVisualSignoff: false, publicReleaseApproved: false, copyrightApproval: false,
      scientificValidity: false, productionPerformance: false } };
  const published = [];
  let browser;
  let currentPage;
  const guard = createBrowserResourceGuard({ onStop: async () => { if (browser) await browser.close(); },
    onSample: async (sample, index) => exclusive(path.join(attempt, `resource-guard-${String(index).padStart(4, "0")}.json`), json(sample)) });
  receipt.resourceGuard = guard.evidence;
  try {
    await guard.check(); guard.start();
    const buildBytes = await readFile(options.buildReceipt);
    const build = JSON.parse(buildBytes);
    const baselineBytes = options.phase === "before" ? await readFile(options.baselineInputs) : null;
    const input = baselineBytes ? JSON.parse(baselineBytes).source : await captureBuildInputs();
    const diskBuildId = (await readFile(path.resolve(ROOT, build.distDir, "BUILD_ID"), "utf8")).trim();
    receipt.build = validateM1Build(build, input, diskBuildId);
    receipt.binding = { buildReceipt: path.relative(ROOT, options.buildReceipt), buildReceiptSha256: sha256(buildBytes),
      sourceScope: baselineBytes ? "frozen-baseline-inputs" : "current-source-before-and-after",
      baselineInputsSha256: baselineBytes ? sha256(baselineBytes) : null };
    const { chromium } = await import("playwright");
    const withCaseContext = createFreshBrowserCaseRunner({ chromium, options, receipt, guard, attempt,
      setBrowser: (owned) => { browser = owned; } });
    for (const [device, viewport] of Object.entries(M2_VIEWPORTS)) {
      const scenarios = M2_A12.map((id) => ({ id, selectedId: `stellar-hero:${id}`, alias: false }));
      if (options.phase === "after" && device === "desktop") scenarios.push(...M2_ALIASES.map((alias) => ({ ...alias, alias: true })));
      for (const scenario of scenarios) {
        const { id, selectedId, alias } = scenario;
        const name = alias ? `alias-${selectedId.replace(":", "-")}` : id;
        await withCaseContext(device + "-" + name, { viewport, deviceScaleFactor: 1,
          isMobile: device === "mobile", hasTouch: device === "mobile" }, async (context) => {
        try {
          const page = await context.newPage(); currentPage = page;
          page.setDefaultTimeout(15_000);
          const errors = [];
          page.on("pageerror", (error) => errors.push({ type: "pageerror", message: error.message }));
          page.on("console", (message) => { if (message.type() === "error") errors.push({ type: "console", message: message.text() }); });
          await page.goto(`${options.origin}/`, { waitUntil: "domcontentloaded", timeout: 30_000 });
          await page.locator("[data-atlas-app-shell]").waitFor();
          if (alias) await selectAlias(page, selectedId, id);
          else await selectStar(page, id);
          const item = { device, id, selectedId, alias, focus: M2_FOCUS_IDS.includes(id), errors, views: [], behaviors: {} };
          (alias ? receipt.aliasItems : receipt.items).push(item);
          const saveView = async (mode) => {
            const cameraStability = await waitForActualCameraStable(page, selectedId);
            const observed = await observe(page, id);
            observed.camera = cameraStability.final; observed.cameraStability = cameraStability;
            const issues = inspectM2Observation(observed, id, viewport, receipt.build, options.phase, mode, selectedId);
            const filename = `${device}-${name}-${mode}.png`;
            const png = await page.screenshot({ type: "png" });
            await exclusive(path.join(attempt, filename), png);
            published.push(filename);
            item.views.push({ mode, observed, issues, screenshot: {
              path: `${outputDir}/${options.phase}/${filename}`, sha256: sha256(png), bytes: png.length } });
            ensure(issues.length === 0, `${device}:${id}:${mode}:${issues.join(",")}`);
          };
          await saveView("default");
          const passport = page.locator('#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]');
          if (device === "mobile") await passport.getByRole("button", { name: "查看摘要", exact: true }).press("Enter");
          await passport.getByRole("button", { name: "查看图鉴 / 比较", exact: true }).press("Enter");
          const portrait = passport.locator(`[data-mainline-a-stellar-portrait="${id}"]`);
          await portrait.locator("svg").scrollIntoViewIfNeeded();
          await saveView("comparison");
          const hideSurface = portrait.getByRole("button", { name: "隐藏表面纹理", exact: true });
          await hideSurface.press("Enter");
          item.behaviors.surfaceDisabled = await portrait.getAttribute("data-mainline-a-stellar-surface") === "false";
          await portrait.getByRole("button", { name: "显示表面纹理", exact: true }).press("Enter");
          item.behaviors.surfaceRestored = await portrait.getAttribute("data-mainline-a-stellar-surface") === "true";
          await page.keyboard.press("Escape");
          await page.locator('[data-mainline-a-passport-art-expanded="false"]').waitFor();
          item.behaviors.comparisonEscapeClosed = await portrait.count() === 0;
          item.behaviors.selectionPreserved = await page.locator("[data-atlas-app-shell]")
            .getAttribute("data-celestial-catalog-selected-id") === selectedId;
          ensure(Object.values(item.behaviors).every(Boolean) && errors.length === 0,
            `${device}:${id}:behavior-or-browser-errors:${json({ behaviors: item.behaviors, errors })}`);
          if (alias) {
            const canonical = receipt.items.find((entry) => entry.device === device && entry.id === id);
            item.behaviors.aliasMatchesHeroPresentation = item.views.every((view) => {
              const hero = canonical?.views.find((entry) => entry.mode === view.mode);
              const key = "data-mainline-a-stellar-presentation-sha256";
              return Boolean(hero?.observed.proxy[key]) && hero.observed.proxy[key] === view.observed.proxy[key];
            });
            ensure(item.behaviors.aliasMatchesHeroPresentation, `alias-hero-presentation-mismatch:${selectedId}`);
          }
          const filename = `${device}-${name}.json`;
          await exclusive(path.join(attempt, filename), json(item)); published.push(filename);
          console.log(JSON.stringify({ stage: "captured", phase: options.phase, device, id, selectedId, views: 2, issues: 0 }));
          await page.close(); currentPage = null;
      } catch (error) {
        if (currentPage && !currentPage.isClosed()) {
          await currentPage.screenshot().then((bytes) => exclusive(path.join(attempt, "failure.png"), bytes)).catch(() => {});
          receipt.failureButtons = await currentPage.locator("button, summary").evaluateAll((nodes) => nodes
            .filter((node) => node.getClientRects().length > 0)
            .map((node) => ({ text: node.textContent, label: node.getAttribute("aria-label") }))).catch(() => []);
        }
        throw error;
      } finally { currentPage = null; }
        });
      }
    }
    if (options.phase === "after") {
      const after = await captureBuildInputs();
      ensure(after.sha256 === input.sha256, "source-changed-during-run");
      receipt.binding.sourceAfterSha256 = after.sha256;
    }
    ensure(receipt.items.length === 24 && receipt.items.every((item) => item.views.length === 2), "incomplete-matrix");
    if (options.phase === "after") ensure(receipt.aliasItems.length === 4, "incomplete-alias-matrix");
    await guard.check(); await guard.stop(); guard.assert();
    receipt.status = "passed-a12-two-viewports-default-and-comparison-candidate-only";
    receipt.endedAt = new Date().toISOString();
    await exclusive(path.join(attempt, "receipt.json"), json(receipt)); published.push("receipt.json");
    for (const filename of published) await copyFile(path.join(attempt, filename), path.join(output, filename), constants.COPYFILE_EXCL);
    return receipt;
  } catch (error) {
    receipt.status = "failed-attempt-preserved"; receipt.endedAt = new Date().toISOString();
    receipt.errors.push({ message: error.message, stack: error.stack, cameraEvidence: error.cameraEvidence ?? null });
    await exclusive(path.join(attempt, "failure.json"), json(receipt));
    throw error;
  } finally { await guard.stop(); if (browser) await browser.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const receipt = await captureM2(parseM2Options(process.argv.slice(2)));
  console.log(JSON.stringify({ status: receipt.status, phase: receipt.phase, items: receipt.items.length }));
}
