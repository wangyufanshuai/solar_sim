import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { inspectR79VisualAuditV666 } from
  "./audit-mainline-a-r79-visual-v666.mjs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const VIEWPORTS = Object.freeze({ desktop: { width: 1280,
  height: 720 }, "mobile-viewport": { width: 390, height: 844 } });
const HELD_KEYS = Object.freeze(["beta:nebula:ring-nebula",
  "beta:star:acrux"]);
const sha256 = (bytes) => createHash("sha256").update(bytes)
  .digest("hex");
function check(value, code, detail) {
  if (!value) throw new Error("r80-browser:" + code
    + (detail ? ":" + JSON.stringify(detail) : ""));
}

export function parseR80BrowserOptionsV667(argv) {
  check(argv.length === 10 && argv[0] === "--run-id"
    && argv[2] === "--enabled-port"
    && argv[4] === "--default-off-port"
    && argv[6] === "--build-run-id"
    && argv[8] === "--audit-run-id", "usage");
  const enabledPort = Number(argv[3]);
  const defaultOffPort = Number(argv[5]);
  check(/^20261013v667r80browser0[1-9]$/.test(argv[1])
    && /^20261013v667r80web0[1-9]$/.test(argv[7])
    && /^20261013v666r79visual0[1-9]$/.test(argv[9])
    && Number.isInteger(enabledPort)
    && Number.isInteger(defaultOffPort)
    && enabledPort >= 1024 && enabledPort <= 65535
    && defaultOffPort >= 1024 && defaultOffPort <= 65535
    && enabledPort !== defaultOffPort,
  "run-id-or-ports");
  return { runId: argv[1], buildRunId: argv[7],
    auditRunId: argv[9], enabledPort, defaultOffPort,
    enabledOrigin: "http://127.0.0.1:" + enabledPort,
    defaultOffOrigin: "http://127.0.0.1:" + defaultOffPort };
}

async function json(relative) {
  return JSON.parse(await readFile(safeWorkspacePathV662(relative), "utf8"));
}

function screenshotPath(device, key, runId) {
  check(/^(desktop|mobile-viewport)$/.test(device)
    && /^(a|beta):nebula:[a-z0-9-]+$/.test(key),
  "screenshot-key", { device, key });
  return "docs/release/v607/mainline-a-r80-v667-image-"
    + device + "-" + key.replaceAll(":", "-")
    + "-" + runId + ".png";
}

async function screenshot(imageLocator, device, key, runId) {
  const relative = screenshotPath(device, key, runId);
  const bytes = await imageLocator.screenshot({ type: "png",
    animations: "disabled", timeout: 30_000 });
  const image = await sharp(bytes).metadata();
  check(image.format === "png" && image.width >= 80
    && image.height >= 40 && image.width <= 4000
    && image.height <= 6000,
  "displayed-image-screenshot-dimensions", { key, device,
    width: image.width, height: image.height });
  await writeFile(safeWorkspacePathV662(relative), bytes,
    { flag: "wx" });
  return { path: relative, bytes: bytes.length,
    sha256: sha256(bytes), width: image.width,
    height: image.height, device, key };
}

async function pageScreenshot(page, device, variant, runId) {
  const relative = "docs/release/v607/mainline-a-r80-v667-"
    + device + "-" + variant + "-" + runId + ".png";
  const bytes = await page.screenshot({ type: "png",
    fullPage: false, animations: "disabled" });
  const image = await sharp(bytes).metadata();
  await writeFile(safeWorkspacePathV662(relative), bytes,
    { flag: "wx" });
  return { path: relative, bytes: bytes.length,
    sha256: sha256(bytes), width: image.width,
    height: image.height, device, variant };
}

async function openReview(page, origin, runtimeBuildId) {
  await page.goto(origin + "/", {
    waitUntil: "domcontentloaded", timeout: 30_000 });
  const shell = page.locator("[data-atlas-app-shell]");
  await shell.waitFor({ state: "visible", timeout: 30_000 });
  check(await shell.getAttribute("data-mainline-build-id")
    === runtimeBuildId, "runtime-build-id");
  const selectedBefore = await shell.getAttribute(
    "data-celestial-catalog-selected-id");
  await page.getByRole("button", { name: /^工具/ }).click();
  await page.getByRole("button", { name: "清权审查" }).click();
  const panel = page.locator(
    '[data-mainline-a-r75-acceptance="v662"]');
  await panel.waitFor({ state: "visible" });
  check(await panel.getAttribute("data-mainline-a-r75-release")
    === "blocked"
    && await panel.getAttribute("data-scientific-payload-writeback")
      === "false", "review-boundary");
  await panel.getByRole("button", {
    name: "展开跨入口矩阵" }).click();
  const coverage = panel.locator(
    '[data-mainline-a-r80-coverage="ready"]');
  await coverage.waitFor({ state: "visible" });
  check(await coverage.getAttribute("data-mainline-a-r80-total")
    === "31" && await coverage.getAttribute(
      "data-mainline-a-r80-covered-count") === "0",
  "initial-31-image-queue");
  return { shell, panel, coverage, selectedBefore };
}

async function readLayout(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector(
      '[data-mainline-a-nebula-review="true"]');
    const matrix = document.querySelector(
      '[data-mainline-a-r75-acceptance="v662"]');
    return { viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      dialogWidth: dialog?.clientWidth ?? 0,
      dialogScrollWidth: dialog?.scrollWidth ?? 0,
      matrixWidth: matrix?.clientWidth ?? 0,
      matrixScrollWidth: matrix?.scrollWidth ?? 0 };
  });
}

async function shortFrames(page) {
  return page.evaluate(async () => {
    const intervals = [];
    let previous = performance.now();
    for (let index = 0; index < 120; index++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const now = performance.now();
      intervals.push(now - previous);
      previous = now;
    }
    intervals.sort((a, b) => a - b);
    return { count: intervals.length,
      p95IntervalMs: intervals[Math.ceil(intervals.length * 0.95) - 1],
      maxIntervalMs: intervals.at(-1),
      usedJSHeapBytes: performance.memory?.usedJSHeapSize ?? null,
      evidenceClass: "short-local-browser-diagnostic-only" };
  });
}

function acceptable404(message, policy404Urls, mode) {
  if (mode !== "default-off") return false;
  if (!message.text.includes("404")) return false;
  const url = message.url;
  return !url || policy404Urls.includes(url);
}

async function prepareContext(browser, device, mode, config) {
  const context = await browser.newContext({
    viewport: VIEWPORTS[device], deviceScaleFactor: 1,
    isMobile: device === "mobile-viewport",
    hasTouch: device === "mobile-viewport" });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  const pageErrors = [];
  const consoleErrors = [];
  const manualRequests = [];
  const policy404Urls = [];
  const unexpected404Urls = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push({ text: message.text(),
        url: message.location().url });
    }
  });
  page.on("request", (request) => {
    if (request.headers()["x-mainline-a-r79-visual-inspect"]
      === "manual") manualRequests.push(request.url());
  });
  page.on("response", (response) => {
    if (response.status() !== 404) return;
    const url = response.url();
    const pathname = new URL(url).pathname;
    if (pathname.startsWith("/api/atlas/mainline-a-nebula-review/")
      || pathname.startsWith("/api/atlas/mainline-a-r71-source/")
      || pathname.startsWith("/api/atlas/mainline-a-r72-source/")) {
      policy404Urls.push(url);
    } else unexpected404Urls.push(url);
  });
  const origin = mode === "enabled"
    ? config.enabledOrigin : config.defaultOffOrigin;
  return { context, page, origin, pageErrors,
    consoleErrors, manualRequests,
    policy404Urls, unexpected404Urls };
}

async function inspectEnabled(browser, device, config, build, audit,
  updateProgress) {
  const state = await prepareContext(browser, device,
    "enabled", config);
  try {
    const { page, origin } = state;
    const opened = await openReview(page, origin,
      build.runtimeBuildId);
    const pins = new Map(audit.images.map((pin) => [pin.key, pin]));
    const cycles = [];
    const screenshots = [];
    let contextScreenshot = null;
    for (let index = 0; index < 31; index++) {
      const key = await opened.coverage.getAttribute(
        "data-mainline-a-r80-next-key");
      updateProgress(`${device}:${index + 1}/31:${key}`);
      check(typeof key === "string" && pins.has(key)
        && !cycles.some((cycle) => cycle.key === key),
      "queue-next-key", { key, index });
      const pin = pins.get(key);
      await opened.coverage.getByRole("button", {
        name: "前往下一张待核对图片" }).click();
      const inspector = opened.panel.locator(
        `[data-mainline-a-r79-visual-inspection="${key}"]`);
      await inspector.waitFor({ state: "visible" });
      check(await inspector.getAttribute(
        "data-mainline-a-r79-request-allowed") === "true",
      "requestable-plan-disabled", key);
      check(!state.manualRequests.includes(origin + pin.route),
        "automatic-inspector-request", key);
      const responsePromise = page.waitForResponse((response) =>
        response.url() === origin + pin.route
          && response.request().headers()[
            "x-mainline-a-r79-visual-inspect"] === "manual",
      { timeout: 30_000 });
      await inspector.locator(
        '[data-mainline-a-r79-load-image="true"]').click();
      const response = await responsePromise;
      const body = await response.body();
      const observedSha256 = sha256(body);
      await inspector.locator(
        `[data-mainline-a-r79-loaded-image="${pin.sha256}"]`)
        .waitFor({ state: "visible", timeout: 30_000 });
      check(response.status() === 200
        && response.url() === origin + pin.route
        && observedSha256 === pin.sha256
        && body.length === pin.bytes
        && response.headers()["content-type"]?.startsWith(pin.mimeType)
        && await inspector.locator(
          '[data-mainline-a-r79-image="true"]').count() === 1,
      "manual-image-body-or-dom", { key,
        status: response.status(),
        sha256: observedSha256,
        expectedSha256: pin.sha256 });
      screenshots.push(await screenshot(inspector.locator(
        '[data-mainline-a-r79-scale]'),
        device, key, config.runId));
      if (key === "beta:nebula:heart-nebula") {
        contextScreenshot = await pageScreenshot(page, device,
          "review-context", config.runId);
      }
      await inspector.locator(
        '[data-mainline-a-r79-release-image="true"]').click();
      await page.waitForFunction((expected) =>
        document.querySelector("[data-mainline-a-r80-coverage]")
          ?.getAttribute("data-mainline-a-r80-covered-count")
          === String(expected), index + 1, { timeout: 15_000 });
      const imageRemoved = await inspector.locator(
        '[data-mainline-a-r79-image="true"]').count() === 0;
      check(imageRemoved, "image-not-released", key);
      cycles.push({ key, route: pin.route,
        sha256: observedSha256, bytes: body.length,
        width: pin.width, height: pin.height,
        mimeType: pin.mimeType, httpStatus: response.status(),
        imageWasVisible: true, imageRemovedAfterRelease: true,
        progressAfterRelease: index + 1,
        screenshot: screenshots.at(-1) });
    }
    check(await opened.coverage.getAttribute(
      "data-mainline-a-r80-covered-count") === "31"
      && await opened.coverage.getAttribute(
        "data-mainline-a-r80-next-key") === "none",
    "queue-incomplete");
    const held = [];
    for (const [lane, key] of [
      ["source-holds", HELD_KEYS[0]],
      ["identity-holds", HELD_KEYS[1]],
    ]) {
      await opened.panel.locator(
        `[data-mainline-a-r79-lane="${lane}"]`).click();
      await opened.panel.locator(
        `[data-mainline-a-r75-row="${key}"]`).click();
      const inspector = opened.panel.locator(
        `[data-mainline-a-r79-visual-inspection="${key}"]`);
      await inspector.waitFor({ state: "visible" });
      check(await inspector.getAttribute(
        "data-mainline-a-r79-request-allowed") === "false"
        && await inspector.locator(
          '[data-mainline-a-r79-load-image="true"]').count() === 0,
      "held-object-has-request", key);
      held.push({ key, requestAllowed: false,
        imageRequestCount: 0 });
    }
    const layout = await readLayout(page);
    const diagnostic = await shortFrames(page);
    await opened.panel.getByRole("button",
      { name: "收起跨入口矩阵" }).click();
    await page.getByRole("button", {
      name: "关闭星云清权审查台" }).click();
    check(await opened.shell.getAttribute(
      "data-celestial-catalog-selected-id")
      === opened.selectedBefore, "review-changed-scene");
    check(layout.documentWidth <= layout.viewportWidth
      && layout.dialogScrollWidth <= layout.dialogWidth
      && layout.matrixScrollWidth <= layout.matrixWidth,
    "horizontal-overflow", layout);
    check(state.manualRequests.length === 31
      && state.pageErrors.length === 0
      && state.consoleErrors.length === 0
      && state.unexpected404Urls.length === 0,
    "browser-errors-or-request-count",
    { device, pageErrors: state.pageErrors,
      consoleErrors: state.consoleErrors,
      requests: state.manualRequests.length,
      unexpected404Urls: state.unexpected404Urls });
    return { device, mode: "enabled", origin,
      viewport: VIEWPORTS[device], layout,
      cycles, screenshots, contextScreenshot, held,
      manualRequests: state.manualRequests,
      pageErrors: state.pageErrors,
      consoleErrors: state.consoleErrors,
      policy404Urls: state.policy404Urls,
      unexpected404Urls: state.unexpected404Urls,
      diagnostic, queueComplete: true,
      sceneChangedByReview: false, physicalDevice: false };
  } finally { await state.context.close(); }
}

async function inspectDefaultOff(browser, config, build) {
  const state = await prepareContext(browser,
    "mobile-viewport", "default-off", config);
  try {
    const { page, origin } = state;
    const opened = await openReview(page, origin,
      build.runtimeBuildId);
    const key = "beta:nebula:heart-nebula";
    await opened.panel.locator(
      '[data-mainline-a-r79-lane="beta-images"]').click();
    await opened.panel.locator(
      `[data-mainline-a-r75-row="${key}"]`).click();
    const inspector = opened.panel.locator(
      `[data-mainline-a-r79-visual-inspection="${key}"]`);
    await inspector.waitFor({ state: "visible" });
    const responsePromise = page.waitForResponse((response) =>
      response.request().headers()[
        "x-mainline-a-r79-visual-inspect"] === "manual"
        && response.url() === origin
          + "/api/atlas/mainline-a-nebula-review/heart-nebula/detail",
    { timeout: 30_000 });
    await inspector.locator(
      '[data-mainline-a-r79-load-image="true"]').click();
    const response = await responsePromise;
    await opened.panel.locator(
      `[data-mainline-a-r79-visual-inspection="${key}"]`
        + '[data-mainline-a-r79-visual-phase="error"]')
      .waitFor({ state: "visible" });
    check(response.status() === 404
      && (await inspector.textContent()).includes("HTTP 404")
      && await inspector.locator(
        '[data-mainline-a-r79-image="true"]').count() === 0
      && await opened.coverage.getAttribute(
        "data-mainline-a-r80-covered-count") === "0",
    "default-off-failure-or-false-progress");
    const screen = await pageScreenshot(page,
      "mobile-viewport", "default-off-feedback", config.runId);
    const layout = await readLayout(page);
    const diagnostic = await shortFrames(page);
    await opened.panel.getByRole("button",
      { name: "收起跨入口矩阵" }).click();
    await page.getByRole("button", {
      name: "关闭星云清权审查台" }).click();
    check(await opened.shell.getAttribute(
      "data-celestial-catalog-selected-id")
      === opened.selectedBefore,
    "default-off-review-changed-scene");
    const unexpectedConsoleErrors = state.consoleErrors.filter(
      (message) => !acceptable404(message,
        state.policy404Urls, "default-off"));
    check(state.manualRequests.length === 1
      && state.pageErrors.length === 0
      && unexpectedConsoleErrors.length === 0
      && state.unexpected404Urls.length === 0
      && layout.documentWidth <= layout.viewportWidth
      && layout.dialogScrollWidth <= layout.dialogWidth
      && layout.matrixScrollWidth <= layout.matrixWidth,
    "default-off-errors-or-layout",
    { pageErrors: state.pageErrors,
      unexpectedConsoleErrors,
      unexpected404Urls: state.unexpected404Urls,
      layout });
    return { device: "mobile-viewport",
      mode: "default-off", origin,
      viewport: VIEWPORTS["mobile-viewport"],
      key, httpStatus: response.status(),
      localCoverageCount: 0,
      screenshot: screen, layout,
      manualRequests: state.manualRequests,
      pageErrors: state.pageErrors,
      consoleErrors: state.consoleErrors,
      unexpectedConsoleErrors,
      policy404Urls: state.policy404Urls,
      unexpected404Urls: state.unexpected404Urls,
      diagnostic, sceneChangedByReview: false,
      physicalDevice: false };
  } finally { await state.context.close(); }
}

export function inspectR80BrowserV667(receipt, audit) {
  const issues = [...inspectR79VisualAuditV666(audit).issues];
  if (receipt?.schema !== "mainline-a-r80-browser-v667"
    || receipt?.status !== "passed-31-image-cycles-two-viewports"
    || receipt?.appSourceSha256 !== audit?.appSourceSha256
    || receipt?.buildId !== receipt?.build?.buildId
    || receipt?.runtimeBuildId !== receipt?.build?.runtimeBuildId) {
    issues.push("receipt-or-build-identity");
  }
  if (!Array.isArray(receipt?.observations)
    || receipt.observations.length !== 3) {
    issues.push("observations");
  } else {
    const enabled = receipt.observations.filter((item) =>
      item.mode === "enabled");
    const off = receipt.observations.filter((item) =>
      item.mode === "default-off");
    if (enabled.length !== 2 || off.length !== 1
      || new Set(enabled.map((item) => item.device)).size !== 2
      || !enabled.some((item) => item.device === "desktop")
      || !enabled.some((item) => item.device === "mobile-viewport")
      || off[0]?.device !== "mobile-viewport") {
      issues.push("device-mode-coverage");
    }
    for (const item of enabled) {
      const cycles = item.cycles;
      if (!Array.isArray(cycles) || cycles.length !== 31
        || new Set(cycles.map((cycle) => cycle.key)).size !== 31
        || item.screenshots?.length !== 31
        || item.contextScreenshot?.device !== item.device
        || item.contextScreenshot?.variant !== "review-context"
        || !/^[a-f0-9]{64}$/.test(
          item.contextScreenshot?.sha256 ?? "")
        || item.manualRequests?.length !== 31
        || item.queueComplete !== true) {
        issues.push(`full-cycle-coverage:${item.device}`);
        continue;
      }
      for (const pin of audit.images) {
        const cycle = cycles.find((value) => value.key === pin.key);
        if (!cycle || cycle.route !== pin.route
          || cycle.sha256 !== pin.sha256
          || cycle.bytes !== pin.bytes
          || cycle.width !== pin.width
          || cycle.height !== pin.height
          || cycle.mimeType !== pin.mimeType
          || cycle.httpStatus !== 200
          || cycle.imageWasVisible !== true
          || cycle.imageRemovedAfterRelease !== true
          || !item.manualRequests.includes(item.origin + pin.route)
          || cycle.screenshot?.key !== pin.key
          || cycle.screenshot?.device !== item.device
          || !/^[a-f0-9]{64}$/.test(
            cycle.screenshot?.sha256 ?? "")) {
          issues.push(`image-cycle:${item.device}:${pin.key}`);
        }
      }
      if (cycles.some((cycle, index) =>
        cycle.progressAfterRelease !== index + 1)
        || item.held?.length !== 2
        || item.held.some((held) =>
          !HELD_KEYS.includes(held.key)
            || held.requestAllowed !== false
            || held.imageRequestCount !== 0)
        || item.manualRequests.some((url) =>
          url.includes("/ring-nebula/") || url.includes("/acrux/"))) {
        issues.push(`queue-or-hold:${item.device}`);
      }
    }
    if (off[0]?.key !== "beta:nebula:heart-nebula"
      || off[0].httpStatus !== 404
      || off[0].localCoverageCount !== 0
      || off[0].manualRequests?.length !== 1
      || off[0].screenshot?.device !== "mobile-viewport") {
      issues.push("default-off-failure-boundary");
    }
    for (const item of receipt.observations) {
      if (item.pageErrors?.length
        || item.unexpectedConsoleErrors?.length
        || item.unexpected404Urls?.length
        || item.sceneChangedByReview !== false
        || item.physicalDevice !== false
        || item.layout?.documentWidth > item.layout?.viewportWidth
        || item.layout?.dialogScrollWidth > item.layout?.dialogWidth
        || item.layout?.matrixScrollWidth > item.layout?.matrixWidth
        || item.diagnostic?.count !== 120) {
        issues.push(`browser-state:${item.device}:${item.mode}`);
      }
    }
  }
  if (receipt?.boundary?.candidateOnly !== true
    || receipt.boundary.hold !== true
    || receipt.boundary.notAdmitted !== true
    || receipt.boundary.scientificPayloadWriteback !== false
    || receipt.boundary.publicWebReleaseApproved !== false
    || receipt?.claims?.humanVisualSignoff !== false
    || receipt.claims.copyrightApproval !== false
    || receipt.claims.scientificValidity !== false
    || receipt.claims.realUserValidation !== false
    || receipt.claims.productionPerformance !== false) {
    issues.push("boundary-or-claim-promotion");
  }
  return { ok: issues.length === 0, issues,
    imageCycles: receipt?.observations?.filter((item) =>
      item.mode === "enabled").reduce((sum, item) =>
      sum + (item.cycles?.length ?? 0), 0) ?? 0,
    browserViewports: 2, heldObjectsSampledWithoutRequests: 2,
    humanVisualSignoff: false,
    publicWebReleaseApproved: false };
}

export async function verifyR80ScreenshotsV667(receipt) {
  const issues = [];
  const references = [];
  for (const item of receipt?.observations ?? []) {
    if (item.mode === "enabled") references.push(
      ...(item.screenshots ?? []), item.contextScreenshot);
    else if (item.screenshot) references.push(item.screenshot);
  }
  if (references.length !== 65
    || new Set(references.map((item) => item?.path)).size !== 65) {
    issues.push("screenshot-count-or-path-identity");
  }
  for (const reference of references) {
    try {
      const bytes = await readFile(safeWorkspacePathV662(
        reference.path));
      const metadata = await sharp(bytes).metadata();
      if (bytes.length !== reference.bytes
        || sha256(bytes) !== reference.sha256
        || metadata.format !== "png"
        || metadata.width !== reference.width
        || metadata.height !== reference.height) {
        issues.push(`screenshot-pin:${reference.path}`);
      }
    } catch {
      issues.push(`screenshot-unreadable:${reference.path}`);
    }
  }
  return { ok: issues.length === 0, issues,
    screenshotCount: references.length,
    humanVisualSignoff: false };
}

export async function runR80BrowserV667(config) {
  const buildPath = "docs/release/v607/mainline-a-r80-build-"
    + config.buildRunId + ".json";
  const auditPath = "docs/release/v607/mainline-a-r79-v666-visual-static-"
    + config.auditRunId + ".json";
  const [build, audit, source] = await Promise.all([
    json(buildPath), json(auditPath), captureBuildInputs(),
  ]);
  check(build.status === "passed" && build.sourceStable === true
    && build.inputAfterSha256 === source.sha256
    && audit.appSourceSha256 === source.sha256
    && inspectR79VisualAuditV666(audit).ok,
  "source-build-or-audit-drift");
  const startedAt = new Date().toISOString();
  const progress = { stage: "launch" };
  const browser = await chromium.launch({
    headless: true, executablePath: CHROME });
  try {
    progress.stage = "desktop-enabled";
    const desktop = await inspectEnabled(browser, "desktop",
      config, build, audit, (value) => {
        progress.stage = value;
        console.log(JSON.stringify({ stage: value }));
      });
    progress.stage = "mobile-enabled";
    const mobile = await inspectEnabled(browser,
      "mobile-viewport", config, build, audit, (value) => {
        progress.stage = value;
        console.log(JSON.stringify({ stage: value }));
      });
    progress.stage = "mobile-default-off";
    const defaultOff = await inspectDefaultOff(browser,
      config, build);
    check((await captureBuildInputs()).sha256 === source.sha256,
      "source-drift-during-browser");
    const output = "docs/release/v607/mainline-a-r80-v667-browser-"
      + config.runId + ".json";
    const receipt = { schema: "mainline-a-r80-browser-v667",
      status: "passed-31-image-cycles-two-viewports",
      startedAt, endedAt: new Date().toISOString(),
      appSourceSha256: source.sha256,
      buildId: build.buildId,
      runtimeBuildId: build.runtimeBuildId,
      build: { buildId: build.buildId,
        runtimeBuildId: build.runtimeBuildId,
        buildReceipt: buildPath },
      auditReceipt: auditPath,
      observations: [desktop, mobile, defaultOff],
      physicalMobile: "not-run",
      boundary: { candidateOnly: true, hold: true,
        notAdmitted: true, scientificPayloadWriteback: false,
        publicWebReleaseApproved: false },
      claims: { humanVisualSignoff: false,
        copyrightApproval: false,
        scientificValidity: false,
        realUserValidation: false,
        productionPerformance: false,
        publicWebReleaseApproved: false } };
    const verification = inspectR80BrowserV667(receipt, audit);
    check(verification.ok, "receipt-verification", verification.issues);
    const screenshots = await verifyR80ScreenshotsV667(receipt);
    check(screenshots.ok, "screenshot-verification",
      screenshots.issues);
    await writeFile(safeWorkspacePathV662(output),
      JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
    const visualOutput = "docs/release/v607/mainline-a-r80-v667-visual-"
      + config.runId + ".json";
    await writeFile(safeWorkspacePathV662(visualOutput),
      JSON.stringify({ schema: "mainline-a-r80-visual-v667",
      status: "65-browser-screenshots-rehashed-human-signoff-pending",
        appSourceSha256: source.sha256,
        buildId: build.buildId,
        browserReceipt: output,
        verification: screenshots,
        perItemHumanVisualSignoff: false,
        copyrightApproval: false,
        realUserValidation: false }, null, 2) + "\n",
    { flag: "wx" });
    return { status: receipt.status,
      output, visualOutput,
      verification, screenshots };
  } catch (error) {
    const attempt = "docs/release/v607/mainline-a-r80-v667-browser-attempt-"
      + config.runId + ".json";
    await writeFile(safeWorkspacePathV662(attempt),
      JSON.stringify({ schema: "mainline-a-r80-browser-attempt-v667",
        status: "failed-preserved", startedAt,
        endedAt: new Date().toISOString(),
        appSourceSha256: source.sha256,
        buildId: build.buildId,
        stage: progress.stage,
        errorClass: error?.name ?? "Error",
        errorMessage: error?.message ?? String(error),
        browserQualified: false,
        scientificPayloadWriteback: false }, null, 2) + "\n",
    { flag: "wx" });
    throw error;
  } finally { await browser.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR80BrowserV667(
    parseR80BrowserOptionsV667(process.argv.slice(2)))));
}
