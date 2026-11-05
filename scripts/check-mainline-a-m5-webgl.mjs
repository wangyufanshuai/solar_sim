import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { createBrowserResourceGuard } from "./mainline-a-browser-resource-guard.mjs";
import { M1_VIEWPORTS, inspectM1Observation, observe, selectScene, validateM1Build } from "./capture-mainline-a-m1-browser.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = "output/playwright/mainline-a-m5-20261015/webgl";
const SCENE = { name: "m42", kind: "nebula", id: "m42", selectedId: "nebula:m42", passportId: "nebula:m42" };
const KEY = "__mainlineAM5WebglProbe";
const digest = (value) => createHash("sha256").update(value).digest("hex");
const json = (value) => JSON.stringify(value, null, 2) + "\n";
const ensure = (value, issue) => { if (!value) throw new Error(`m5-webgl:${issue}`); };

export function parseM5WebglOptions(args) {
  const allowed = new Set(["build-receipt", "origin", "run-id", "chrome", "device"]);
  const values = {};
  ensure(args.length % 2 === 0, "paired-arguments-required");
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index].slice(2);
    ensure(args[index].startsWith("--") && allowed.has(key) && !(key in values)
      && args[index + 1] && !args[index + 1].startsWith("--"), "unknown-or-duplicate-argument");
    values[key] = args[index + 1];
  }
  ensure(values["build-receipt"] && values.origin && values["run-id"], "explicit-build-origin-run-id-required");
  const origin = new URL(values.origin);
  ensure(origin.protocol === "http:" && origin.hostname === "127.0.0.1" && origin.port && origin.pathname === "/"
    && !origin.search && !origin.hash && !origin.username && !origin.password, "loopback-origin-required");
  ensure(/^[a-zA-Z0-9-]{8,48}$/.test(values["run-id"]), "invalid-run-id");
  const device = values.device ?? "all";
  ensure(["all", "desktop", "mobile"].includes(device), "invalid-device");
  return { origin: origin.origin, buildReceipt: path.resolve(ROOT, values["build-receipt"]), runId: values["run-id"], device,
    chrome: values.chrome ?? "C:/Program Files/Google/Chrome/Application/chrome.exe" };
}

export function expectedM5ContextMessage(entry) {
  return entry.type !== "pageerror" && (/^THREE\.WebGLRenderer: Context (Lost|Restored)\.$/.test(entry.message)
    || /^WebGL: CONTEXT_LOST_WEBGL: loseContext: context lost\s*$/.test(entry.message));
}

export function inspectM5WebglCase(item) {
  if (item.supported === false) return { status: "not-run-unsupported-extension", issues: ["WEBGL_lose_context-unavailable"] };
  const issues = [...(item.issues ?? [])];
  const before = item.samples?.before; const lost = item.samples?.lost; const restored = item.samples?.restored;
  if (!before || !lost || !restored || before.lost !== false || lost.lost !== true || restored.lost !== false) issues.push("context-state-sequence-invalid");
  if (!restored?.sameCanvas || !restored?.sameContext || restored.canvasCount !== 1) issues.push("canvas-or-context-replaced");
  if (!(restored?.events?.some((event) => event.type === "webglcontextlost" && event.trusted)
    && restored.events.some((event) => event.type === "webglcontextrestored" && event.trusted))) issues.push("real-context-events-missing");
  if (!(before?.draws > 0) || !(restored?.drawsAfterRestore > 0)) issues.push("real-draws-not-observed-after-restoration");
  if (lost?.metrics?.["data-atlas-render-context-status"] !== "context-lost"
    || lost?.metrics?.["data-atlas-render-draw-calls"] !== "unavailable"
    || restored?.metrics?.["data-atlas-render-context-status"] !== "ready") issues.push("raster-context-status-not-observed");
  if (before?.metrics?.["data-atlas-render-gpu-timer"] === "active-ext-disjoint-timer-query-webgl2"
    && (lost?.metrics?.["data-atlas-render-gpu-timer"] !== "context-lost"
      || lost?.metrics?.["data-atlas-render-gpu-frame-samples"] !== "0"
      || restored?.metrics?.["data-atlas-render-gpu-timer"] !== "active-ext-disjoint-timer-query-webgl2"
      || !(Number(restored?.metrics?.["data-atlas-render-gpu-frame-samples"]) > 0))) issues.push("gpu-timer-generation-not-recovered");
  if (!item.viewerOpened || !item.viewerClosed || !item.focusReturned) issues.push("viewer-interaction-not-restored");
  if (!item.before || !item.after || item.before.selectedId !== item.after.selectedId || item.after.canvasCount !== 1
    || item.before.nebula?.sha256 !== item.after.nebula?.sha256) issues.push("selection-or-image-changed");
  if ((item.unexpectedErrors ?? []).length > 0) issues.push("unexpected-browser-errors");
  if (item.instrumentationRestored !== true) issues.push("instrumentation-cleanup-unconfirmed");
  return { status: issues.length ? "failed" : "passed-candidate-only", issues: [...new Set(issues)] };
}

// This fixture observes the existing context. It never synthesizes context events,
// changes application state, or replaces return values from a GL call.
export function installM5WebglProbe(key) {
  if (window[key]) throw new Error("m5-probe-already-installed");
  const canvas = document.querySelector('canvas[data-atlas-canvas-identity="atlas-main-single-canvas-v161"]');
  if (!canvas || document.querySelectorAll("canvas").length !== 1) throw new Error("m5-single-canvas-required");
  const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
  if (!context) throw new Error("m5-existing-context-unavailable");
  const extension = context.getExtension("WEBGL_lose_context");
  if (!extension) return { supported: false };
  const state = { events: [], draws: 0, drawsAfterRestore: 0, phase: "before", restoredAt: null };
  const wrappers = [];
  const onEvent = (event) => {
    state.events.push({ type: event.type, at: performance.now(), trusted: event.isTrusted, lost: context.isContextLost() });
    if (event.type === "webglcontextrestored") { state.phase = "restored"; state.restoredAt = performance.now(); }
  };
  const restoreMethods = () => {
    let restored = true;
    for (const { name, descriptor, wrapper } of wrappers) {
      if (context[name] !== wrapper) { restored = false; continue; }
      if (descriptor) Object.defineProperty(context, name, descriptor); else delete context[name];
    }
    return restored;
  };
  try { for (const name of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
    if (typeof context[name] !== "function") continue;
    const original = context[name]; const descriptor = Object.getOwnPropertyDescriptor(context, name);
    const wrapper = function (...args) {
      const result = Reflect.apply(original, this, args);
      if (this === context && !context.isContextLost()) { state.draws++; if (state.phase === "restored") state.drawsAfterRestore++; }
      return result;
    };
    Object.defineProperty(context, name, { configurable: true, writable: true, value: wrapper });
    wrappers.push({ name, descriptor, wrapper });
  } } catch (error) { restoreMethods(); throw error; }
  canvas.addEventListener("webglcontextlost", onEvent);
  canvas.addEventListener("webglcontextrestored", onEvent);
  const sample = () => ({ supported: true, at: performance.now(), lost: context.isContextLost(),
    sameCanvas: document.querySelector('canvas[data-atlas-canvas-identity="atlas-main-single-canvas-v161"]') === canvas,
    sameContext: (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) === context,
    canvasCount: document.querySelectorAll("canvas").length, draws: state.draws, drawsAfterRestore: state.drawsAfterRestore,
    events: [...state.events], phase: state.phase, restoredAt: state.restoredAt,
    metrics: Object.fromEntries([...(document.querySelector("[data-atlas-browser-acceptance-version]")?.attributes ?? [])]
      .filter((attribute) => attribute.name.startsWith("data-atlas-render-") || attribute.name.startsWith("data-atlas-optional-texture-"))
      .map((attribute) => [attribute.name, attribute.value])) });
  window[key] = {
    sample,
    lose: () => { state.phase = "losing"; extension.loseContext(); },
    restore: () => { if (context.isContextLost()) extension.restoreContext(); },
    cleanup: () => {
      canvas.removeEventListener("webglcontextlost", onEvent); canvas.removeEventListener("webglcontextrestored", onEvent);
      const restored = restoreMethods();
      delete window[key];
      return restored;
    },
  };
  return sample();
}

export async function checkM5Webgl(options) {
  const output = path.join(ROOT, OUTPUT, options.runId);
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, "started.json"), json({ at: new Date().toISOString(), ...options }), { flag: "wx" });
  const receipt = { schema: "mainline-a-m5-webgl-v1", startedAt: new Date().toISOString(), runId: options.runId,
    origin: options.origin, status: "running", cases: [], errors: [],
    boundary: { candidateOnly: true, scientificPayloadWriteback: false, humanVisualSignoff: false,
      physicalMobile: false, gpuDriverCrashRecovery: false, publicReleaseApproved: false } };
  let browser;
  const guard = createBrowserResourceGuard({ onStop: async () => { if (browser) await browser.close(); },
    onSample: async (sample, index) => writeFile(path.join(output, `resource-guard-${String(index).padStart(4, "0")}.json`), json(sample), { flag: "wx" }) });
  receipt.resourceGuard = guard.evidence;
  const screenshot = async (page, item, stage) => {
    const filename = `${item.device}-m42-${stage}.png`;
    const bytes = await page.screenshot(); await writeFile(path.join(output, filename), bytes, { flag: "wx" });
    (item.screenshots ??= []).push({ stage, path: `${OUTPUT}/${options.runId}/${filename}`, sha256: digest(bytes), bytes: bytes.length });
  };
  try {
    const buildBytes = await readFile(options.buildReceipt); const build = JSON.parse(buildBytes); const input = await captureBuildInputs();
    receipt.build = validateM1Build(build, input, (await readFile(path.join(ROOT, build.distDir, "BUILD_ID"), "utf8")).trim());
    receipt.binding = { buildReceipt: path.relative(ROOT, options.buildReceipt).replaceAll("\\", "/"), buildReceiptSha256: digest(buildBytes),
      sourceBeforeSha256: input.sha256, scriptSha256: digest(await readFile(fileURLToPath(import.meta.url))) };
    await guard.check(); guard.start();
    const { chromium } = await import("playwright");
    guard.assert();
    browser = await chromium.launch({ headless: true, executablePath: options.chrome });
    guard.assert();
    for (const device of options.device === "all" ? ["desktop", "mobile"] : [options.device]) {
      guard.assert();
      const viewport = M1_VIEWPORTS[device];
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: device === "mobile", hasTouch: device === "mobile" });
      const page = await context.newPage(); page.setDefaultTimeout(20_000);
      const item = { device, viewport, supported: null, samples: {}, issues: [], unexpectedErrors: [], expectedContextMessages: [], otherMessages: [] };
      receipt.cases.push(item);
      let installed = false;
      const record = (entry) => {
        if (expectedM5ContextMessage(entry)) item.expectedContextMessages.push(entry);
        else if (entry.type === "pageerror" || entry.type === "error" || (entry.type === "warning" && /WebGL|GL_INVALID|CONTEXT_LOST/i.test(entry.message))) item.unexpectedErrors.push(entry);
        else if (entry.type === "warning") item.otherMessages.push(entry);
      };
      page.on("pageerror", (error) => record({ type: "pageerror", message: error.message, stack: error.stack, at: new Date().toISOString() }));
      page.on("console", (message) => record({ type: message.type(), message: message.text(), at: new Date().toISOString() }));
      try {
        await page.goto(options.origin, { waitUntil: "domcontentloaded" }); await page.locator("[data-atlas-app-shell]").waitFor();
        await selectScene(page, SCENE);
        // This existing UI enables only after the focus controller is locked.
        // The mobile summary may be collapsed, so observe its state without opening it.
        await page.waitForFunction(() => {
          const start = document.querySelector('[data-mainline-a-journey-start="orion-clouds-and-stars"]');
          return start instanceof HTMLButtonElement && !start.disabled;
        });
        await page.waitForTimeout(500);
        item.before = await observe(page);
        item.issues.push(...inspectM1Observation(item.before, SCENE, viewport, receipt.build, "after"));
        ensure(item.issues.length === 0, "pre-loss-runtime-binding-or-layout");
        await screenshot(page, item, "before");
        const initial = await page.evaluate(installM5WebglProbe, KEY); item.supported = initial.supported;
        if (!initial.supported) continue;
        installed = true;
        await page.waitForFunction((key) => window[key].sample().draws > 0, KEY);
        item.samples.before = await page.evaluate((key) => window[key].sample(), KEY);
        await page.evaluate((key) => window[key].lose(), KEY);
        await page.waitForFunction((key) => window[key].sample().lost && window[key].sample().events.some((event) => event.type === "webglcontextlost"), KEY);
        // Hold longer than the 200ms renderer metrics poll to expose lost-context reads.
        await page.waitForTimeout(800);
        item.samples.lost = await page.evaluate((key) => window[key].sample(), KEY);
        await screenshot(page, item, "lost");
        await page.evaluate((key) => window[key].restore(), KEY);
        await page.waitForFunction((key) => { const sample = window[key].sample(); return !sample.lost
          && sample.events.some((event) => event.type === "webglcontextrestored") && sample.drawsAfterRestore > 0; }, KEY);
        await page.waitForTimeout(1_200);
        item.samples.restored = await page.evaluate((key) => window[key].sample(), KEY);
        item.after = await observe(page);
        item.issues.push(...inspectM1Observation(item.after, SCENE, viewport, receipt.build, "after"));
        await screenshot(page, item, "restored");
        const opener = page.getByRole("button", { name: "放大观测图", exact: true });
        await opener.press("Enter");
        const dialog = page.locator('dialog[data-mainline-a-nebula-viewer="m42"]'); await dialog.waitFor();
        item.viewerOpened = await dialog.evaluate((node) => node.open && node.querySelector("img")?.complete);
        await screenshot(page, item, "viewer-restored");
        await dialog.getByRole("button", { name: "关闭观测图放大", exact: true }).press("Enter"); await dialog.waitFor({ state: "detached" });
        item.viewerClosed = await page.locator("dialog[data-mainline-a-nebula-viewer]").count() === 0;
        item.focusReturned = await opener.evaluate((node) => document.activeElement === node);
        item.after = await observe(page);
      } catch (error) {
        item.issues.push(error.message); await screenshot(page, item, "failure").catch(() => {});
      } finally {
        if (installed && !page.isClosed()) {
          await page.evaluate((key) => window[key]?.restore(), KEY).catch(() => {});
          item.instrumentationRestored = await page.evaluate((key) => window[key]?.cleanup() === true, KEY).catch(() => false);
        }
        Object.assign(item, inspectM5WebglCase(item));
        await writeFile(path.join(output, `${device}-case.json`), json(item), { flag: "wx" });
        await context.close(); item.contextClosed = true;
      }
      // A failing first device remains an explicit failed attempt; do not hide it in a second run.
      if (item.status === "failed") break;
    }
    const after = await captureBuildInputs(); receipt.binding.sourceAfterSha256 = after.sha256;
    ensure(after.sha256 === input.sha256, "source-changed-during-webgl-check");
    await guard.check(); await guard.stop(); guard.assert();
    receipt.status = receipt.cases.some((item) => item.status === "failed") ? "failed-attempt-preserved"
      : receipt.cases.some((item) => item.status === "not-run-unsupported-extension") ? "not-run-unsupported-extension" : "passed-candidate-only";
  } catch (error) { receipt.status = "failed-attempt-preserved"; receipt.errors.push({ message: error.message, stack: error.stack }); }
  finally { await guard.stop(); if (browser) await browser.close(); receipt.browserClosed = true; }
  receipt.endedAt = new Date().toISOString();
  await writeFile(path.join(output, "receipt.json"), json(receipt), { flag: "wx" });
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkM5Webgl(parseM5WebglOptions(process.argv.slice(2)));
  console.log(json({ status: result.status, cases: result.cases.map(({ device, status, issues }) => ({ device, status, issues })) }));
  if (result.status !== "passed-candidate-only") process.exitCode = 1;
}
