import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { M1_VIEWPORTS, inspectM1Observation, observe, selectScene, validateM1Build } from "./capture-mainline-a-m1-browser.mjs";
import { parseM2Options } from "./capture-mainline-a-m2-browser.mjs";
import { createBrowserResourceGuard } from "./mainline-a-browser-resource-guard.mjs";
import { readNebulaDisplayObservation, waitForActualCameraStable } from "./mainline-a-browser-camera-observation.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const M3_OUTPUT = "output/playwright/mainline-a-m3-20261015";
export const M3_A12 = Object.freeze(["m42", "m1", "m8", "m16", "m20", "m57", "ngc7293", "ngc6543", "ngc2237", "ngc6960", "carina", "b33"]);
const MANIFEST = "app/data/mainlineACanonicalCoverageV622.generated.json";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (data) => `${JSON.stringify(data, null, 2)}\n`;
const ensure = (value, message) => { if (!value) throw new Error(`m3-browser:${message}`); };
const exclusive = (filename, bytes) => writeFile(filename, bytes, { flag: "wx" });

export function parseM3Options(args) {
  const withBaseline = args.includes("--baseline-inputs") ? args : [...args, "--baseline-inputs", `${M3_OUTPUT}/baseline-inputs.json`];
  return parseM2Options(withBaseline.includes("--output-dir") ? withBaseline : [...withBaseline, "--output-dir", M3_OUTPUT]);
}

export function m3Scene(id) {
  ensure(M3_A12.includes(id), "outside-a12-roster");
  return { name: id, kind: "nebula", id, selectedId: `nebula:${id}`, passportId: `nebula:${id}` };
}

export function inspectM3Sources(source, row) {
  const issues = [];
  if (source.sourceHref !== row.source.sourceUrl || source.credit !== row.source.credit
    || source.license !== row.source.license) issues.push("source-credit-license-mismatch");
  if (!source.expanded || !source.creditVisible || !source.sourceFocused) issues.push("source-details-not-accessible");
  if (!/^https:\/\//.test(source.licenseHref ?? "") || !source.dimensionText.includes("二维")) issues.push("source-boundaries-missing");
  if (source.rights !== "pending" || source.admission !== "candidate-only") issues.push("rights-boundary-changed");
  return issues;
}

export function inspectM3AssetRow(row, bytes, metadata) {
  const issues = [];
  if (!M3_A12.includes(row.id) || row.kind !== "nebula") issues.push("outside-a12-roster");
  if (!/^public\/textures\/mainline-a\/[a-z0-9-]+\.jpg$/.test(row.route?.assetPath ?? "")) issues.push("asset-path-invalid");
  if (hash(bytes) !== row.route?.assetHash) issues.push("asset-sha256-mismatch");
  if (!metadata?.width || !metadata?.height || Math.max(metadata.width, metadata.height) > 2048) issues.push("asset-dimensions-invalid");
  if (row.scientificPayloadWriteback !== false || row.runtimeAdmission !== "candidate-only"
    || row.status !== "rights-pending") issues.push("asset-boundary-invalid");
  return issues;
}

export function inspectM3FaultErrors(errors, controlledUrl) {
  const controlled = new URL(controlledUrl);
  return errors.filter((error) => {
    let target;
    try { target = new URL(error.url); } catch { return true; }
    return error.type === "pageerror" || target.origin !== controlled.origin || target.pathname !== controlled.pathname
      || !/503|ERR_ABORTED|ERR_FAILED|Failed to load resource/i.test(error.message);
  });
}

export function inspectM3Viewer(view, asset, zoom) {
  const issues = [];
  if (!view.open || view.id !== asset.id || view.zoom !== zoom || view.sha256 !== asset.sha256
    || view.imageSha256 !== asset.sha256 || view.source !== asset.source.sourceUrl) issues.push("viewer-identity-invalid");
  if (!view.complete || view.naturalWidth !== asset.width || view.naturalHeight !== asset.height
    || view.canvasCount !== 1 || view.filter !== "none" || view.opacity < .999) issues.push("viewer-image-invalid");
  if (view.documentWidth > view.viewportWidth || view.dialogBounds.left < -1 || view.dialogBounds.top < -1
    || view.dialogBounds.right > view.viewportWidth + 1 || view.dialogBounds.bottom > view.viewportHeight + 1) issues.push("viewer-overflow");
  if (zoom === 1 && (view.visibleRatio < .99 || view.left > 1 || view.top > 1)) issues.push("viewer-full-composition-clipped");
  return issues;
}

export function m3PanInput(view, magnitude) {
  const horizontal = view.maxLeft >= view.maxTop;
  const position = horizontal ? view.left : view.top;
  const maximum = horizontal ? view.maxLeft : view.maxTop;
  ensure(maximum > 4, "viewer-has-no-pannable-axis");
  const direction = maximum - position >= position ? 1 : -1;
  return { horizontal, amount: direction * magnitude,
    key: horizontal ? (direction > 0 ? "ArrowRight" : "ArrowLeft") : (direction > 0 ? "ArrowDown" : "ArrowUp") };
}

async function readViewer(dialog) {
  return dialog.evaluate((node) => {
    const viewport = node.querySelector("[data-mainline-a-nebula-viewer-viewport]");
    const image = node.querySelector("[data-mainline-a-nebula-borrowed]");
    const rect = image.getBoundingClientRect(); const port = viewport.getBoundingClientRect();
    const visible = Math.max(0, Math.min(rect.right, port.right) - Math.max(rect.left, port.left))
      * Math.max(0, Math.min(rect.bottom, port.bottom) - Math.max(rect.top, port.top));
    return { open: node.open, id: node.getAttribute("data-mainline-a-nebula-viewer"),
      zoom: Number(node.getAttribute("data-mainline-a-nebula-viewer-zoom")), sha256: node.getAttribute("data-image-sha256"),
      source: node.getAttribute("data-image-source"), imageSha256: image.getAttribute("data-image-sha256"),
      complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
      imageWidth: rect.width, imageHeight: rect.height, visibleRatio: visible / (rect.width * rect.height),
      left: viewport.scrollLeft, top: viewport.scrollTop, maxLeft: viewport.scrollWidth - viewport.clientWidth,
      maxTop: viewport.scrollHeight - viewport.clientHeight, bounds: port.toJSON(), dialogBounds: node.getBoundingClientRect().toJSON(),
      canvasCount: document.querySelectorAll("canvas").length, documentWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth, viewportHeight: innerHeight, opacity: Number(getComputedStyle(image).opacity), filter: getComputedStyle(image).filter };
  });
}

async function inspectViewerJourney(page, context, row, asset, device, item, save) {
  const scene = page.locator(`[data-mainline-a-scene-nebula="${row.id}"]`);
  const opener = scene.getByRole("button", { name: "放大观测图", exact: true });
  const attemptBefore = await scene.getAttribute("data-mainline-a-scene-image-attempt");
  const requestCount = item.imageRequests.length;
  await opener.press("Enter");
  const dialog = page.locator(`dialog[data-mainline-a-nebula-viewer="${row.id}"]`); await dialog.waitFor();
  await dialog.locator(`[data-mainline-a-nebula-borrowed="${row.id}"]`).waitFor();
  await page.waitForFunction((id) => document.querySelector(`[data-mainline-a-nebula-borrowed="${id}"]`)
    ?.getBoundingClientRect().width > 0, row.id);
  const borrowed = await dialog.locator("[data-mainline-a-nebula-borrowed]").elementHandle();
  item.viewer = { initial: await readViewer(dialog), checks: {} };
  ensure(inspectM3Viewer(item.viewer.initial, asset, 1).length === 0, `${device}:${row.id}:viewer-fit-invalid`);
  await save("viewer-fit");
  await dialog.getByRole("button", { name: "2× 局部", exact: true }).press("Enter");
  await page.locator(`[data-mainline-a-nebula-viewer="${row.id}"][data-mainline-a-nebula-viewer-zoom="2"]`).waitFor();
  item.viewer.zoomed = await readViewer(dialog);
  ensure(inspectM3Viewer(item.viewer.zoomed, asset, 2).length === 0, `${device}:${row.id}:viewer-zoom-invalid`);
  item.viewer.checks.doubleScale = Math.abs(item.viewer.zoomed.imageWidth / item.viewer.initial.imageWidth - 2) < .02;
  await save("viewer-2x");
  const viewport = dialog.locator("[data-mainline-a-nebula-viewer-viewport]");
  const keyboardInput = m3PanInput(item.viewer.zoomed, 64);
  await viewport.press(keyboardInput.key);
  const keyed = await readViewer(dialog);
  item.viewer.keyed = keyed;
  item.viewer.checks.keyboardPan = Math.abs(keyed.left - item.viewer.zoomed.left) + Math.abs(keyed.top - item.viewer.zoomed.top) > 1;
  const box = keyed.bounds;
  const x = box.x + box.width * .5; const y = box.y + box.height * .5;
  const pointerInput = m3PanInput(keyed, 40);
  const deltaX = pointerInput.horizontal ? -pointerInput.amount : 0;
  const deltaY = pointerInput.horizontal ? 0 : -pointerInput.amount;
  if (device === "mobile") {
    const session = await context.newCDPSession(page);
    try {
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (let step = 1; step <= 4; step++) await session.send("Input.dispatchTouchEvent", {
        type: "touchMove", touchPoints: [{ x: x + deltaX * step / 4, y: y + deltaY * step / 4 }] });
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForTimeout(150);
    } finally { await session.detach(); }
  } else {
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + deltaX, y + deltaY, { steps: 4 }); await page.mouse.up();
  }
  const dragged = await readViewer(dialog);
  item.viewer.dragged = dragged;
  item.viewer.checks.pointerPan = Math.abs(dragged.left - keyed.left) + Math.abs(dragged.top - keyed.top) > 1;
  item.viewer.pointerMode = device === "mobile" ? "browser-native-touch-scroll" : "mouse-drag";
  if (device === "desktop") {
    const wheelInput = m3PanInput(dragged, 35);
    await page.mouse.move(x, y); await page.mouse.wheel(wheelInput.horizontal ? wheelInput.amount : 0,
      wheelInput.horizontal ? 0 : wheelInput.amount);
    await page.waitForTimeout(120); const wheeled = await readViewer(dialog);
    item.viewer.checks.wheelPan = Math.abs(wheeled.left - dragged.left) + Math.abs(wheeled.top - dragged.top) > 1;
  }
  await dialog.getByRole("button", { name: "恢复全图", exact: true }).press("Enter");
  await page.locator(`[data-mainline-a-nebula-viewer="${row.id}"][data-mainline-a-nebula-viewer-zoom="1"]`).waitFor();
  item.viewer.reset = await readViewer(dialog);
  item.viewer.checks.resetFullComposition = inspectM3Viewer(item.viewer.reset, asset, 1).length === 0;
  const provenance = dialog.locator("[data-mainline-a-nebula-viewer-provenance]");
  await provenance.locator("summary").press("Enter");
  const credit = provenance.locator("[data-mainline-a-nebula-viewer-credit]"); await credit.scrollIntoViewIfNeeded();
  item.viewer.checks.fullCredit = (await credit.textContent())?.trim() === row.source.credit;
  const source = provenance.locator(`a[href="${row.source.sourceUrl}"]`); await source.focus();
  item.viewer.checks.sourceFocused = await source.evaluate((node) => document.activeElement === node);
  item.viewer.checks.licensePresent = await provenance.getByRole("link", { name: row.source.license, exact: true }).count() === 1;
  await credit.scrollIntoViewIfNeeded();
  await save("viewer-sources");
  await page.keyboard.press("Escape"); await dialog.waitFor({ state: "detached" });
  item.viewer.checks.escapeRestoresFocus = await opener.evaluate((node) => document.activeElement === node);
  await opener.press("Enter"); await dialog.waitFor();
  const second = dialog.locator("[data-mainline-a-nebula-borrowed]"); await second.waitFor();
  item.viewer.checks.sameBorrowedNode = await second.evaluate((node, original) => node === original, borrowed);
  await dialog.getByRole("button", { name: "关闭观测图放大", exact: true }).press("Enter");
  await dialog.waitFor({ state: "detached" }); await borrowed.dispose();
  item.viewer.checks.buttonRestoresFocus = await opener.evaluate((node) => document.activeElement === node);
  item.viewer.checks.attemptUnchanged = attemptBefore === await scene.getAttribute("data-mainline-a-scene-image-attempt");
  item.viewer.checks.noAdditionalImageRequest = item.imageRequests.length === requestCount;
  item.viewer.checks.borrowedNodeReturned = await page.locator("[data-mainline-a-nebula-borrowed]").count() === 0;
  item.viewer.checks.scenePreserved = (await observe(page)).selectedId === `nebula:${row.id}`;
  ensure(Object.values(item.viewer.checks).every(Boolean), `${device}:${row.id}:viewer-journey-failed:${json(item.viewer.checks)}`);
}

async function selectPendingScene(page, id) {
  await page.locator('button[aria-label="搜索"]').click();
  const panel = page.locator("#universe-object-browser"); await panel.waitFor();
  const section = panel.locator("button[aria-expanded]").filter({ hasText: "深空" });
  if (await section.getAttribute("aria-expanded") === "false") await section.press("Enter");
  await panel.locator(`[data-celestial-catalog-entry-id="nebula:${id}"]`).press("Enter");
  if (await panel.count()) await panel.getByRole("button", { name: "收起对象浏览器" }).press("Enter");
  await panel.waitFor({ state: "detached" });
  await page.waitForFunction((target) => document.querySelector("[data-atlas-app-shell]")
    ?.getAttribute("data-celestial-catalog-selected-id") === `nebula:${target}`, id);
  await page.locator(`[data-mainline-a-scene-nebula="${id}"]`).waitFor();
}

async function faultMatrix(withCaseContext, options, rows, attempt, receipt, publish, guard) {
  const target = rows.find((row) => row.id === "m42");
  const url = `${options.origin}/${target.route.assetPath.replace(/^public\//, "")}`;
  for (const [device, viewport] of Object.entries(M1_VIEWPORTS)) {
    for (const scenario of ["slow-cancel-retry", "http-failure-retry", "timeout-retry", "late-response-switch"]) {
      guard.assert();
      await withCaseContext(device + "-fault-" + scenario, { viewport, deviceScaleFactor: 1,
        isMobile: device === "mobile", hasTouch: device === "mobile" }, async (context) => {
      let release;
      const pending = new Promise((resolve) => { release = resolve; });
      const item = { device, scenario, controlledUrl: url, errors: [], requests: [], screenshots: [], checks: {} };
      receipt.faults.push(item);
      try {
        const page = await context.newPage(); page.setDefaultTimeout(20_000);
        page.on("pageerror", (error) => item.errors.push({ type: "pageerror", message: error.message }));
        page.on("console", (message) => { if (message.type() === "error") item.errors.push({
          type: "console", message: message.text(), url: message.location().url }); });
        let requests = 0;
        await page.route(`${url}?*`, async (route) => {
          const sequence = ++requests;
          item.requests.push({ sequence, url: route.request().url(), at: new Date().toISOString(),
            injected: sequence === 1 ? scenario : "normal-network" });
          if (sequence === 1 && scenario === "http-failure-retry") {
            await route.fulfill({ status: 503, contentType: "text/plain", body: "Controlled local image network failure" });
          } else {
            if (sequence === 1) await pending;
            try { await route.continue(); }
            catch (error) { item.requests.push({ sequence, action: "aborted-before-release", message: error.message }); }
          }
        });
        await page.goto(`${options.origin}/`, { waitUntil: "domcontentloaded" });
        await page.locator("[data-atlas-app-shell]").waitFor();
        await selectPendingScene(page, "m42");
        const figure = page.locator('[data-mainline-a-scene-nebula="m42"]');
        const save = async (state) => {
          const filename = `${device}-fault-${scenario}-${state}.png`;
          const bytes = await page.screenshot(); await exclusive(path.join(attempt, filename), bytes); publish.push(filename);
          item.screenshots.push({ state, path: `${options.outputDir}/${options.phase}/${filename}`,
            attemptPath: `${options.outputDir}/${options.phase}/attempts/${options.runId}/${filename}`, sha256: hash(bytes), bytes: bytes.length });
        };
        if (scenario === "http-failure-retry" || scenario === "timeout-retry") {
          await page.locator('[data-mainline-a-scene-nebula="m42"][data-mainline-a-scene-image-status="failed"]')
            .waitFor({ timeout: 22_000 });
          item.failure = await observe(page);
          item.checks.failureIsExplicit = await figure.getAttribute("data-mainline-a-scene-image-error")
            === (scenario === "http-failure-retry" ? "http" : "timeout");
          item.checks.viewerUnavailableWhileFailed = await figure.getByRole("button", { name: "放大观测图", exact: true }).isDisabled();
          await save("failed"); release();
          await page.getByRole("button", { name: "重试加载观测图", exact: true }).press("Enter");
        } else {
          await page.locator('[data-mainline-a-scene-nebula="m42"][data-mainline-a-scene-image-status="loading"]').waitFor();
          item.checks.loadingIsExplicit = true; await save("loading");
          item.checks.viewerUnavailableWhileLoading = await figure.getByRole("button", { name: "放大观测图", exact: true }).isDisabled();
          if (scenario === "slow-cancel-retry") {
            await page.getByRole("button", { name: "取消加载观测图", exact: true }).press("Enter");
            await page.locator('[data-mainline-a-scene-nebula="m42"][data-mainline-a-scene-image-status="cancelled"]').waitFor();
            item.checks.cancelledIsExplicit = true; await save("cancelled"); release();
            await page.getByRole("button", { name: "重试加载观测图", exact: true }).press("Enter");
          } else {
            await selectPendingScene(page, "m1");
            await page.locator('[data-mainline-a-scene-nebula="m1"][data-mainline-a-scene-image-status="ready"]').waitFor();
            release(); await page.waitForTimeout(750);
            item.checks.oldImageRemoved = await figure.count() === 0;
          }
        }
        const finalId = scenario === "late-response-switch" ? "m1" : "m42";
        await page.locator(`[data-mainline-a-scene-nebula="${finalId}"][data-mainline-a-scene-image-status="ready"]`).waitFor();
        item.final = await observe(page);
        item.checks.finalIdentity = item.final.selectedId === `nebula:${finalId}` && item.final.nebula.id === finalId
          && item.final.sceneMode === "inspect";
        item.checks.binding = item.final.runtimeBuildId === receipt.build.runtimeBuildId
          && item.final.nebula.sha256 === rows.find((row) => row.id === finalId).route.assetHash;
        item.checks.boundary = item.final.canvasCount === 1 && item.final.scientificPayloadWriteback === "false"
          && item.final.releaseBoundary === "candidate-only-hold-not-admitted";
        item.checks.requestsExercised = requests >= (scenario === "late-response-switch" ? 1 : 2);
        item.unexpectedErrors = inspectM3FaultErrors(item.errors, url);
        await save("recovered");
        ensure(Object.values(item.checks).every(Boolean) && item.unexpectedErrors.length === 0, `${device}:${scenario}:failed`);
        console.log(JSON.stringify({ stage: "fault-passed", device, scenario }));
      } finally { release(); }
      });
    }
  }
}

async function absent(filename) {
  try { await access(filename); } catch (error) { if (error.code === "ENOENT") return; throw error; }
  throw new Error(`m3-browser:output-exists:${filename}`);
}

async function sourceDetails(page, id) {
  const figure = page.locator(`[data-mainline-a-scene-nebula="${id}"]`);
  await figure.getByRole("button", { name: "展开观测图说明与署名", exact: true }).press("Enter");
  await figure.locator('[data-mainline-a-nebula-caption-expanded="true"]').waitFor();
  const credit = figure.locator("[data-mainline-a-scene-image-credit]");
  await credit.scrollIntoViewIfNeeded();
  const source = figure.getByRole("link", { name: "官方来源与完整图像", exact: true });
  await source.focus();
  await credit.scrollIntoViewIfNeeded();
  return figure.evaluate((node) => {
    const caption = node.querySelector("[data-mainline-a-nebula-caption-expanded]");
    const creditNode = node.querySelector("[data-mainline-a-scene-image-credit]");
    const sourceNode = node.querySelector('[aria-label="官方来源与完整图像"]');
    const license = [...node.querySelectorAll("a")].find((link) => link.href.includes("creativecommons.org"));
    return { expanded: caption?.getAttribute("data-mainline-a-nebula-caption-expanded") === "true",
      credit: creditNode?.textContent?.trim(), creditVisible: Boolean(creditNode?.getClientRects().length),
      sourceHref: sourceNode?.getAttribute("href"), sourceFocused: document.activeElement === sourceNode,
      license: license?.textContent?.trim(), licenseHref: license?.getAttribute("href"), dimensionText: node.textContent ?? "",
      rights: node.getAttribute("data-mainline-a-scene-human-rights-signoff"),
      admission: node.getAttribute("data-mainline-a-scene-release-admission") };
  });
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

export async function captureM3(options) {
  ensure(/^output\/playwright\/[a-zA-Z0-9-]+$/.test(options.outputDir), "invalid-output-directory");
  const output = path.join(ROOT, options.outputDir, options.phase);
  await mkdir(output, { recursive: true });
  await absent(path.join(output, "receipt.json"));
  const attempt = path.join(output, "attempts", options.runId);
  await mkdir(attempt, { recursive: true });
  await exclusive(path.join(attempt, "started.json"), json({ at: new Date().toISOString(), ...options }));
  const receipt = { schema: "mainline-a-m3-nebula-browser-v1", phase: options.phase, runId: options.runId,
    actualOutputDir: `${options.outputDir}/${options.phase}`,
    status: "running", startedAt: new Date().toISOString(), items: [], faults: [], errors: [], physicalDevice: false,
    claims: { humanVisualSignoff: false, publicReleaseApproved: false, copyrightApproval: false,
      scientificValidity: false, productionPerformance: false } };
  const publish = [];
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
    receipt.build = validateM1Build(build, input, (await readFile(path.join(ROOT, build.distDir, "BUILD_ID"), "utf8")).trim());
    const manifestBytes = await readFile(path.join(ROOT, MANIFEST));
    const declaredManifest = input.inputs.find((file) => file.path === MANIFEST);
    ensure(declaredManifest?.sha256 === hash(manifestBytes), "manifest-differs-from-frozen-source");
    const rows = JSON.parse(manifestBytes).records.filter((row) => row.kind === "nebula");
    ensure(rows.length === 12 && new Set(rows.map((row) => row.id)).size === 12
      && rows.every((row) => M3_A12.includes(row.id)), "manifest-roster-mismatch");
    const sharp = (await import("sharp")).default;
    receipt.assets = [];
    for (const row of rows) {
      ensure(/^public\/textures\/mainline-a\/[a-z0-9-]+\.jpg$/.test(row.route.assetPath), "unsafe-asset-path");
      const bytes = await readFile(path.join(ROOT, row.route.assetPath));
      const metadata = await sharp(bytes).metadata();
      ensure(inspectM3AssetRow(row, bytes, metadata).length === 0, `asset-invalid:${row.id}`);
      receipt.assets.push({ id: row.id, path: row.route.assetPath, sha256: hash(bytes), bytes: bytes.length,
        width: metadata.width, height: metadata.height, source: row.source, rowHash: row.rowHash });
    }
    receipt.binding = { buildReceiptSha256: hash(buildBytes), manifestSha256: hash(manifestBytes),
      baselineInputsSha256: baselineBytes ? hash(baselineBytes) : null,
      sourceScope: baselineBytes ? "frozen-baseline-inputs" : "current-source-before-and-after" };
    const { chromium } = await import("playwright");
    const withCaseContext = createFreshBrowserCaseRunner({ chromium, options, receipt, guard, attempt,
      setBrowser: (owned) => { browser = owned; } });
    for (const [device, viewport] of Object.entries(M1_VIEWPORTS)) {
      for (const row of rows) {
        await withCaseContext(device + "-" + row.id, { viewport, deviceScaleFactor: 1,
          isMobile: device === "mobile", hasTouch: device === "mobile" }, async (context) => {
        try {
          const scene = m3Scene(row.id);
          const page = await context.newPage(); currentPage = page; page.setDefaultTimeout(15_000);
          const item = { device, id: row.id, errors: [], views: [], behaviors: {}, imageRequests: [] };
          receipt.items.push(item);
          page.on("pageerror", (error) => item.errors.push({ type: "pageerror", message: error.message }));
          page.on("console", (message) => { if (message.type() === "error") item.errors.push({ type: "console", message: message.text() }); });
          page.on("request", (request) => {
            if (new URL(request.url()).pathname === `/${row.route.assetPath.replace(/^public\//, "")}`) {
              item.imageRequests.push({ url: request.url(), method: request.method(), at: new Date().toISOString() });
            }
          });
          await page.goto(`${options.origin}/`, { waitUntil: "domcontentloaded", timeout: 30_000 });
          await page.locator("[data-atlas-app-shell]").waitFor();
          await selectScene(page, scene);
          const save = async (mode) => {
            const cameraStability = await waitForActualCameraStable(page, scene.selectedId);
            const observed = await observe(page);
            observed.cameraStability = cameraStability;
            observed.display = await readNebulaDisplayObservation(page, row.id);
            const issues = inspectM1Observation(observed, scene, viewport, receipt.build, "after");
            if (observed.nebula?.sha256 !== row.route.assetHash) issues.push("image-manifest-hash-mismatch");
            const filename = `${device}-${row.id}-${mode}.png`;
            const bytes = await page.screenshot({ type: "png" });
            await exclusive(path.join(attempt, filename), bytes); publish.push(filename);
            item.views.push({ mode, observed, issues, screenshot: { path: `${options.outputDir}/${options.phase}/${filename}`,
              attemptPath: `${options.outputDir}/${options.phase}/attempts/${options.runId}/${filename}`, bytes: bytes.length, sha256: hash(bytes) } });
            ensure(issues.length === 0, `${device}:${row.id}:${mode}:${issues.join(",")}`);
          };
          await save("default");
          if (options.phase === "after") await inspectViewerJourney(page, context, row,
            receipt.assets.find((asset) => asset.id === row.id), device, item, save);
          item.sources = await sourceDetails(page, row.id);
          ensure(inspectM3Sources(item.sources, row).length === 0, `${device}:${row.id}:source-details-invalid`);
          await save("sources");
          await page.getByRole("button", { name: "收起观测图说明与署名", exact: true }).press("Enter");
          await page.locator(`[data-mainline-a-scene-nebula="${row.id}"] [data-mainline-a-nebula-caption-expanded="false"]`).waitFor();
          const final = await observe(page);
          item.behaviors.selectionPreserved = final.selectedId === scene.selectedId && final.sceneMode === "inspect";
          item.behaviors.captionCollapsed = final.nebula.captionExpanded === "false";
          item.behaviors.imageUnchanged = final.nebula.sha256 === row.route.assetHash;
          ensure(Object.values(item.behaviors).every(Boolean) && item.errors.length === 0, `${device}:${row.id}:behavior-or-console-error`);
          const filename = `${device}-${row.id}.json`;
          await exclusive(path.join(attempt, filename), json(item)); publish.push(filename);
          console.log(json({ stage: "captured", phase: options.phase, device, id: row.id, issues: 0 }).trim());
          await page.close(); currentPage = null;
      } catch (error) {
        if (currentPage && !currentPage.isClosed()) {
          await currentPage.screenshot().then((bytes) => exclusive(path.join(attempt, "failure.png"), bytes)).catch(() => {});
        }
        throw error;
      } finally { currentPage = null; }
        });
      }
    }
    ensure(receipt.items.length === 24, "incomplete-a12-matrix");
    if (options.phase === "after") {
      await faultMatrix(withCaseContext, options, rows, attempt, receipt, publish, guard);
      ensure(receipt.faults.length === 8 && receipt.items.every((item) => item.viewer), "after-matrix-incomplete");
      const after = await captureBuildInputs(); ensure(after.sha256 === input.sha256, "source-changed-during-run");
      receipt.binding.sourceAfterSha256 = after.sha256;
    }
    await guard.check(); await guard.stop(); guard.assert();
    receipt.status = options.phase === "before" ? "passed-a12-baseline-scenes-and-sources-candidate-only" : "passed-a12-nebula-viewer-and-faults-candidate-only";
    receipt.endedAt = new Date().toISOString();
    await exclusive(path.join(attempt, "receipt.json"), json(receipt)); publish.push("receipt.json");
    for (const filename of publish) await copyFile(path.join(attempt, filename), path.join(output, filename), constants.COPYFILE_EXCL);
    return receipt;
  } catch (error) {
    receipt.status = "failed-attempt-preserved"; receipt.endedAt = new Date().toISOString();
    receipt.errors.push({ message: error.message, stack: error.stack, cameraEvidence: error.cameraEvidence ?? null });
    if (currentPage && !currentPage.isClosed()) {
      try { await exclusive(path.join(attempt, "failure.png"), await currentPage.screenshot()); } catch { /* Keep original failure. */ }
    }
    await exclusive(path.join(attempt, "failure.json"), json(receipt)); throw error;
  } finally { await guard.stop(); if (browser) await browser.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const receipt = await captureM3(parseM3Options(process.argv.slice(2)));
  console.log(json({ status: receipt.status, items: receipt.items.length }).trim());
}
