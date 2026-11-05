import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { inspectR79VisualAuditV666 } from
  "./audit-mainline-a-r79-visual-v666.mjs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const VIEWPORTS = Object.freeze({
  desktop: { width: 1280, height: 720 },
  "mobile-viewport": { width: 390, height: 844 },
});
const sha256 = (bytes) => createHash("sha256").update(bytes)
  .digest("hex");
function check(value, code, detail) {
  if (!value) throw new Error("r79-browser:" + code
    + (detail ? ":" + JSON.stringify(detail) : ""));
}

export function parseR79BrowserOptionsV666(argv) {
  check(argv.length === 10 && argv[0] === "--run-id"
    && argv[2] === "--enabled-port"
    && argv[4] === "--default-off-port"
    && argv[6] === "--build-run-id"
    && argv[8] === "--audit-run-id", "usage");
  const enabledPort = Number(argv[3]);
  const defaultOffPort = Number(argv[5]);
  check(/^20261013v666r79browser0[1-9]$/.test(argv[1])
    && /^20261013v666r79web0[1-9]$/.test(argv[7])
    && /^20261013v666r79visual0[1-9]$/.test(argv[9])
    && Number.isInteger(enabledPort) && enabledPort >= 1024
    && enabledPort <= 65535 && Number.isInteger(defaultOffPort)
    && defaultOffPort >= 1024 && defaultOffPort <= 65535
    && enabledPort !== defaultOffPort,
  "run-id-or-ports");
  return { runId: argv[1], enabledPort, defaultOffPort,
    buildRunId: argv[7], auditRunId: argv[9],
    enabledOrigin: "http://127.0.0.1:" + enabledPort,
    defaultOffOrigin: "http://127.0.0.1:" + defaultOffPort };
}

async function json(relative) {
  return JSON.parse(await readFile(safeWorkspacePathV662(relative), "utf8"));
}

async function screenshot(page, device, variant, runId) {
  const relative = "docs/release/v607/mainline-a-r79-v666-browser-"
    + device + "-" + variant + "-" + runId + ".png";
  const bytes = await page.screenshot({ fullPage: false });
  await writeFile(safeWorkspacePathV662(relative), bytes,
    { flag: "wx" });
  return { path: relative, bytes: bytes.length,
    sha256: sha256(bytes), device, variant,
    viewport: VIEWPORTS[device] };
}

async function openReview(page, build) {
  await page.goto(build.origin, { waitUntil: "domcontentloaded",
    timeout: 30_000 });
  const shell = page.locator("[data-atlas-app-shell]");
  await shell.waitFor({ state: "visible", timeout: 30_000 });
  check(await shell.getAttribute("data-mainline-build-id")
    === build.runtimeBuildId, "runtime-build-identity");
  const sceneBefore = await shell.getAttribute(
    "data-celestial-catalog-selected-id");
  await page.getByRole("button", { name: /^工具/ }).click();
  await page.getByRole("button", { name: "清权审查" }).click();
  const panel = page.locator(
    '[data-mainline-a-r75-acceptance="v662"]');
  await panel.waitFor({ state: "visible" });
  await panel.getByRole("button",
    { name: "展开跨入口矩阵" }).click();
  const grid = page.locator(
    '[data-mainline-a-r79-matrix-focus="true"]');
  check(await grid.count() === 1
    && await grid.locator(":scope > aside").count() === 0,
  "matrix-focus-did-not-hide-unrelated-detail");
  check(await panel.locator(
    '[data-mainline-a-r79-lanes="valid"]').count() === 1,
  "visual-lanes-not-valid");
  check(await panel.locator(
    '[data-mainline-a-r79-lane="a-images"]')
    .getAttribute("data-mainline-a-r79-lane-count") === "12"
    && await panel.locator(
      '[data-mainline-a-r79-lane="beta-images"]')
      .getAttribute("data-mainline-a-r79-lane-count") === "19",
  "image-lane-counts");
  return { panel, shell, sceneBefore };
}

async function layout(page) {
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

async function frames(page) {
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
      p95IntervalMs: intervals[Math.ceil(.95 * intervals.length) - 1],
      maxIntervalMs: intervals.at(-1),
      usedJSHeapBytes: performance.memory?.usedJSHeapSize ?? null,
      evidenceClass: "short-local-browser-diagnostic-only" };
  });
}

async function selectLaneAndRow(panel, lane, key) {
  await panel.locator(`[data-mainline-a-r79-lane="${lane}"]`).click();
  const row = panel.locator(
    `[data-mainline-a-r75-row="${key}"]`);
  await row.click();
  const detail = panel.locator(
    `[data-mainline-a-r75-detail="${key}"]`);
  await detail.waitFor({ state: "visible" });
  const inspector = detail.locator(
    `[data-mainline-a-r79-visual-inspection="${key}"]`);
  await inspector.waitFor({ state: "visible" });
  return inspector;
}

async function loadAndRelease(inspector, expectedSha, key) {
  check(await inspector.getAttribute(
    "data-mainline-a-r79-visual-phase") === "idle",
  "image-not-idle-before-manual-request");
  await inspector.locator(
    '[data-mainline-a-r79-load-image="true"]').click();
  await inspector.locator(
    `[data-mainline-a-r79-loaded-image="${expectedSha}"]`)
    .waitFor({ state: "visible", timeout: 25_000 });
  check(await inspector.getAttribute(
    "data-mainline-a-r79-visual-phase") === "ready"
    && await inspector.locator(
      '[data-mainline-a-r79-image="true"]').count() === 1,
  "image-not-ready-after-manual-request");
  const metadata = await inspector.locator(
    '[data-mainline-a-r79-image-metadata="true"]').textContent();
  check(metadata.includes(expectedSha.slice(0, 16)),
    "image-metadata-hash");
  await inspector.locator(
    '[data-mainline-a-r79-release-image="true"]').click();
  check(await inspector.getAttribute(
    "data-mainline-a-r79-visual-phase") === "idle"
    && await inspector.locator(
      '[data-mainline-a-r79-image="true"]').count() === 0,
  "image-not-released");
  return { key, sha256: expectedSha, manuallyLoaded: true,
    visibleBeforeRelease: true, removedAfterRelease: true };
}

function unexpectedConsoleErrors(messages, expected404, policy404Urls) {
  return messages.filter((item) => {
    if (!expected404) return true;
    return !(item.text.includes("404")
      && policy404Urls.length > 0
      && (!item.url || policy404Urls.includes(item.url)));
  });
}

async function inspect(browser, device, mode, config, build, audit) {
  const origin = mode === "enabled"
    ? config.enabledOrigin : config.defaultOffOrigin;
  const context = await browser.newContext({
    viewport: VIEWPORTS[device], deviceScaleFactor: 1,
    isMobile: device === "mobile-viewport",
    hasTouch: device === "mobile-viewport" });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    const pageErrors = [];
    const consoleErrors = [];
    const reviewRequests = [];
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
        === "manual") {
        reviewRequests.push(request.url());
      }
    });
    page.on("response", (response) => {
      if (response.status() !== 404) return;
      const url = response.url();
      const path = new URL(url).pathname;
      if (path.startsWith("/api/atlas/mainline-a-nebula-review/")
        || path.startsWith("/api/atlas/mainline-a-r71-source/")
        || path.startsWith("/api/atlas/mainline-a-r72-source/")) {
        policy404Urls.push(url);
      } else unexpected404Urls.push(url);
    });
    const opened = await openReview(page, {
      origin, runtimeBuildId: build.runtimeBuildId });
    const panel = opened.panel;
    const initialLayout = await layout(page);
    check(initialLayout.documentWidth <= initialLayout.viewportWidth
      && initialLayout.dialogScrollWidth <= initialLayout.dialogWidth
      && initialLayout.matrixScrollWidth <= initialLayout.matrixWidth,
    "layout-overflow", initialLayout);
    const images = new Map(audit.images.map((pin) => [pin.key, pin]));
    const screenshots = [];
    const observed = [];
    if (mode === "enabled") {
      let inspector = await selectLaneAndRow(panel,
        "a-images", "a:nebula:m42");
      observed.push(await loadAndRelease(inspector,
        images.get("a:nebula:m42").sha256, "a:nebula:m42"));
      inspector = await selectLaneAndRow(panel,
        "beta-images", "beta:nebula:heart-nebula");
      check((await inspector.textContent()).includes(
        "心脏星云 · 候选图片检查"),
      "selected-image-title-missing");
      check(!reviewRequests.includes(origin
        + images.get("beta:nebula:heart-nebula").route),
      "candidate-request-before-click", reviewRequests);
      await inspector.locator(
        '[data-mainline-a-r79-load-image="true"]').click();
      await inspector.locator(
        `[data-mainline-a-r79-loaded-image="${images.get(
          "beta:nebula:heart-nebula").sha256}"]`)
        .waitFor({ state: "visible", timeout: 25_000 });
      screenshots.push(await screenshot(page, device,
        "beta-derived-ready", config.runId));
      check(await inspector.locator(
        '[data-mainline-a-r79-image="true"]').count() === 1,
      "derived-preview-not-visible");
      await inspector.locator(
        '[data-mainline-a-r79-release-image="true"]').click();
      observed.push({ key: "beta:nebula:heart-nebula",
        manuallyLoaded: true, sha256: images.get(
          "beta:nebula:heart-nebula").sha256,
        removedAfterRelease: await inspector.locator(
          '[data-mainline-a-r79-image="true"]').count() === 0 });
      for (const key of ["beta:nebula:w40-nebula",
        "beta:nebula:california-nebula"]) {
        const selected = await selectLaneAndRow(panel,
          "beta-images", key);
        observed.push(await loadAndRelease(selected,
          images.get(key).sha256, key));
      }
    } else {
      const inspector = await selectLaneAndRow(panel,
        "beta-images", "beta:nebula:heart-nebula");
      check((await inspector.textContent()).includes(
        "心脏星云 · 候选图片检查"),
      "default-off-selected-title-missing");
      await inspector.locator(
        '[data-mainline-a-r79-load-image="true"]').click();
      await panel.locator(
        '[data-mainline-a-r79-visual-inspection="beta:nebula:heart-nebula"]'
          + '[data-mainline-a-r79-visual-phase="error"]')
        .waitFor({ state: "visible", timeout: 25_000 });
      check((await inspector.textContent()).includes("HTTP 404")
        && await inspector.locator(
          '[data-mainline-a-r79-image="true"]').count() === 0,
      "default-off-failure-feedback");
      screenshots.push(await screenshot(page, device,
        "default-off-feedback", config.runId));
      observed.push({ key: "beta:nebula:heart-nebula",
        expectedFailure: "http-unavailable", httpStatus: 404 });
    }
    let inspector = await selectLaneAndRow(panel,
      "source-holds", "beta:nebula:ring-nebula");
    check(await inspector.getAttribute(
      "data-mainline-a-r79-request-allowed") === "false"
      && await inspector.locator(
        '[data-mainline-a-r79-load-image="true"]').count() === 0,
    "held-nebula-request-available");
    const ringRoute = origin
      + "/api/atlas/mainline-a-nebula-review/ring-nebula/detail";
    check(!reviewRequests.includes(ringRoute),
      "held-nebula-requested");
    inspector = await selectLaneAndRow(panel,
      "identity-holds", "beta:star:acrux");
    check(await inspector.getAttribute(
      "data-mainline-a-r79-request-allowed") === "false"
      && await inspector.locator(
        '[data-mainline-a-r79-load-image="true"]').count() === 0,
    "held-star-request-available");
    const diagnostic = await frames(page);
    await panel.getByRole("button",
      { name: "收起跨入口矩阵" }).click();
    const restored = page.locator(
      '[data-mainline-a-r79-matrix-focus="false"]');
    check(await restored.count() === 1
      && await restored.locator(":scope > aside").count() === 1,
    "candidate-detail-not-restored");
    await page.getByRole("button",
      { name: "关闭星云清权审查台" }).click();
    await panel.waitFor({ state: "detached" });
    check(await opened.shell.getAttribute(
      "data-celestial-catalog-selected-id") === opened.sceneBefore,
    "review-changed-scene");
    const unexpected = unexpectedConsoleErrors(consoleErrors,
      mode === "default-off", policy404Urls);
    check(pageErrors.length === 0 && unexpected.length === 0
      && unexpected404Urls.length === 0,
    "browser-errors", { pageErrors, unexpected,
      unexpected404Urls });
    return { device, mode, origin, viewport: VIEWPORTS[device],
      layout: initialLayout, observed, screenshots,
      reviewRequests, pageErrors, consoleErrors,
      policy404Urls, unexpected404Urls,
      unexpectedConsoleErrors: unexpected,
      diagnostic, physicalDevice: false,
      focusedMatrixLayout: true,
      restoredCandidateDetails: true,
      sceneChangedByReview: false };
  } finally { await context.close(); }
}

export function inspectR79BrowserReceiptV666(receipt, audit) {
  const issues = [];
  if (receipt?.schema !== "mainline-a-r79-browser-v666"
    || receipt?.status !== "passed-local-current-source-candidate-hold"
    || !/^[a-f0-9]{64}$/.test(receipt?.appSourceSha256 ?? "")) {
    issues.push("receipt-shape");
  }
  if (!inspectR79VisualAuditV666(audit).ok
    || receipt?.appSourceSha256 !== audit?.appSourceSha256) {
    issues.push("visual-audit-or-source");
  }
  if (!Array.isArray(receipt?.observations)
    || receipt.observations.length !== 3
    || receipt.observations.filter((item) =>
      item.mode === "enabled").length !== 2
    || receipt.observations.filter((item) =>
      item.mode === "default-off").length !== 1) {
    issues.push("viewport-or-mode-coverage");
  } else {
    const cohort = new Set(receipt.observations.map((item) =>
      `${item.device}:${item.mode}`));
    if (cohort.size !== 3 || !cohort.has("desktop:enabled")
      || !cohort.has("mobile-viewport:enabled")
      || !cohort.has("mobile-viewport:default-off")) {
      issues.push("device-mode-identity");
    }
    const imagePins = new Map((audit?.images ?? []).map((pin) =>
      [pin.key, pin]));
    const enabledKeys = ["a:nebula:m42",
      "beta:nebula:heart-nebula", "beta:nebula:w40-nebula",
      "beta:nebula:california-nebula"];
    for (const item of receipt.observations) {
      if (item.pageErrors?.length || item.unexpectedConsoleErrors?.length
        || item.unexpected404Urls?.length
        || item.sceneChangedByReview !== false
        || item.physicalDevice !== false
        || item.focusedMatrixLayout !== true
        || item.restoredCandidateDetails !== true
        || item.layout?.documentWidth > item.layout?.viewportWidth
        || item.diagnostic?.count !== 120) {
        issues.push(`browser-observation:${item.device}:${item.mode}`);
      }
      if (!Array.isArray(item.screenshots)
        || item.screenshots.length !== 1
        || item.screenshots.some((shot) =>
          !/^[a-f0-9]{64}$/.test(shot.sha256)
            || shot.bytes <= 0 || shot.device !== item.device
            || shot.viewport?.width !== item.viewport?.width
            || shot.viewport?.height !== item.viewport?.height)) {
        issues.push(`screenshot-pin:${item.device}:${item.mode}`);
      }
      if (item.mode === "enabled") {
        if (!Array.isArray(item.observed)
          || item.observed.length !== enabledKeys.length
          || !enabledKeys.every((key) => item.observed.some((seen) =>
            seen.key === key && seen.sha256
              === imagePins.get(key)?.sha256
              && seen.manuallyLoaded === true
              && seen.removedAfterRelease === true))
          || item.reviewRequests?.length !== 4
          || item.reviewRequests.some((url) =>
            !url.startsWith(item.origin + "/"))) {
          issues.push(`manual-image-cycle:${item.device}`);
        }
      } else if (item.observed?.length !== 1
        || item.observed[0]?.key !== "beta:nebula:heart-nebula"
        || item.observed[0]?.httpStatus !== 404
        || item.reviewRequests?.length !== 1
        || item.reviewRequests[0] !== item.origin
          + imagePins.get("beta:nebula:heart-nebula")?.route) {
        issues.push("default-off-browser-failure");
      }
      if (item.reviewRequests?.some((url) =>
        url.includes("/ring-nebula/")
          || url.includes("/acrux/"))) {
        issues.push(`held-object-requested:${item.device}:${item.mode}`);
      }
    }
  }
  if (receipt?.boundary?.candidateOnly !== true
    || receipt.boundary.hold !== true
    || receipt.boundary.notAdmitted !== true
    || receipt.boundary.scientificPayloadWriteback !== false
    || receipt.boundary.publicWebReleaseApproved !== false
    || receipt?.claims?.productionPerformance !== false
    || receipt.claims.humanVisualSignoff !== false) {
    issues.push("boundary-or-claims");
  }
  return { ok: issues.length === 0, issues };
}

export async function runR79BrowserV666(config) {
  const buildPath = "docs/release/v607/mainline-a-r79-build-"
    + config.buildRunId + ".json";
  const auditPath = "docs/release/v607/mainline-a-r79-v666-visual-static-"
    + config.auditRunId + ".json";
  const [build, audit, source] = await Promise.all([
    json(buildPath), json(auditPath), captureBuildInputs(),
  ]);
  check(build.status === "passed" && build.sourceStable
    && build.inputAfterSha256 === source.sha256
    && audit.appSourceSha256 === source.sha256
    && inspectR79VisualAuditV666(audit).ok,
  "source-build-or-audit-drift");
  const startedAt = new Date().toISOString();
  const browser = await chromium.launch({
    headless: true, executablePath: CHROME });
  let observations;
  try {
    observations = [
      await inspect(browser, "desktop", "enabled", config, build, audit),
      await inspect(browser, "mobile-viewport", "enabled", config,
        build, audit),
      await inspect(browser, "mobile-viewport", "default-off", config,
        build, audit),
    ];
  } finally { await browser.close(); }
  check((await captureBuildInputs()).sha256 === source.sha256,
    "source-changed-during-browser");
  const boundary = { candidateOnly: true, hold: true,
    notAdmitted: true, scientificPayloadWriteback: false,
    publicWebReleaseApproved: false };
  const browserPath = "docs/release/v607/mainline-a-r79-v666-browser-"
    + config.runId + ".json";
  const visualPath = "docs/release/v607/mainline-a-r79-v666-visual-"
    + config.runId + ".json";
  const performancePath =
    "docs/release/v607/mainline-a-r79-v666-performance-"
    + config.runId + ".json";
  const receipt = { schema: "mainline-a-r79-browser-v666",
    status: "passed-local-current-source-candidate-hold",
    startedAt, endedAt: new Date().toISOString(),
    appSourceSha256: source.sha256,
    buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId,
    buildReceipt: buildPath, auditReceipt: auditPath,
    observations, physicalMobile: "not-run",
    boundary,
    claims: { productionPerformance: false,
      realUserValidation: false, humanVisualSignoff: false,
      scientificValidity: false, copyrightApproval: false,
      publicWebReleaseApproved: false } };
  check(inspectR79BrowserReceiptV666(receipt, audit).ok,
    "self-inspection-failed");
  const screenshots = observations.flatMap((item) => item.screenshots);
  for (const shot of screenshots) {
    const bytes = await readFile(safeWorkspacePathV662(shot.path));
    check(bytes.length === shot.bytes && sha256(bytes) === shot.sha256,
      "screenshot-byte-drift", shot.path);
  }
  const visual = { schema: "mainline-a-r79-visual-v666",
    status: "current-build-screenshots-rehashed-agent-review-pending",
    appSourceSha256: source.sha256, buildId: build.buildId,
    screenshots, screenshotCount: screenshots.length,
    humanPerItemSignoff: false, realUserValidation: false,
    scientificValidity: false, copyrightApproval: false,
    boundary };
  const performance = { schema: "mainline-a-r79-performance-v666",
    status: "short-local-browser-diagnostic-only",
    appSourceSha256: source.sha256, buildId: build.buildId,
    samples: observations.map((item) => ({ device: item.device,
      mode: item.mode, ...item.diagnostic })),
    currentSourceLongRun: "not-run",
    productionPerformanceEstablished: false,
    physicalMobile: "not-run", boundary };
  await writeFile(safeWorkspacePathV662(browserPath),
    JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
  await writeFile(safeWorkspacePathV662(visualPath),
    JSON.stringify(visual, null, 2) + "\n", { flag: "wx" });
  await writeFile(safeWorkspacePathV662(performancePath),
    JSON.stringify(performance, null, 2) + "\n", { flag: "wx" });
  return { status: receipt.status, browserPath, visualPath,
    performancePath, screenshotCount: screenshots.length };
}

if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR79BrowserV666(
    parseR79BrowserOptionsV666(process.argv.slice(2)))));
}
