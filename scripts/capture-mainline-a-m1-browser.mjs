import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { readActualCameraObservation, waitForActualCameraStable } from "./mainline-a-browser-camera-observation.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = "output/playwright/mainline-a-m1-20261014";
export const M1_SCENES = Object.freeze([
  { name: "sirius-a", kind: "star", id: "sirius-a", selectedId: "stellar-hero:sirius-a", passportId: "nearby-star:sirius" },
  { name: "Ori", kind: "constellation", id: "Ori", selectedId: "constellation:Ori", passportId: "constellation:Ori" },
  { name: "m42", kind: "nebula", id: "m42", selectedId: "nebula:m42", passportId: "nebula:m42" },
]);
export const M1_VIEWPORTS = Object.freeze({
  desktop: { width: 1280, height: 720 }, mobile: { width: 390, height: 844 },
});
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const ensure = (condition, message) => { if (!condition) throw new Error(`m1-browser:${message}`); };

export function parseM1Options(args) {
  const allowed = new Set(["phase", "origin", "build-receipt", "baseline-inputs", "chrome", "run-id"]);
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
  ensure(origin.protocol === "http:" && origin.hostname === "127.0.0.1"
    && origin.port && origin.pathname === "/" && !origin.search && !origin.hash
    && !origin.username && !origin.password, "local-origin-required");
  ensure(values["build-receipt"], "build-receipt-required");
  const runId = values["run-id"] ?? new Date().toISOString().replace(/[^0-9]/g, "");
  ensure(/^[a-zA-Z0-9-]{8,48}$/.test(runId), "invalid-run-id");
  return { phase: values.phase, origin: origin.origin, runId,
    buildReceipt: path.resolve(ROOT, values["build-receipt"]),
    baselineInputs: path.resolve(ROOT, values["baseline-inputs"] ?? `${OUTPUT}/baseline-inputs.json`),
    chrome: values.chrome ?? "C:/Program Files/Google/Chrome/Application/chrome.exe" };
}

export function validateM1Build(build, input, diskBuildId) {
  ensure(build.status === "passed" && build.sourceStable === true && build.exitCode === 0,
    "build-not-passed-or-stable");
  ensure(/^[a-f0-9]{64}$/.test(input?.sha256 ?? "")
    && build.inputBefore?.sha256 === input.sha256 && build.inputAfterSha256 === input.sha256,
  "build-source-binding-mismatch");
  ensure(build.runtimeBuildId === `mainline-a-${input.sha256.slice(0, 16)}`
    && build.buildId === diskBuildId, "build-id-mismatch");
  return { buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
    sourceSha256: input.sha256, branch: build.branch, head: build.head };
}

export function inspectM1Observation(observation, scene, viewport, build, phase) {
  const issues = [];
  const require = (ok, issue) => { if (!ok) issues.push(issue); };
  require(observation.selectedId === scene.selectedId && observation.passportId === scene.passportId,
    "selection-or-passport-mismatch");
  require(observation.runtimeBuildId === build.runtimeBuildId
    && observation.branch === build.branch && observation.head === build.head, "runtime-build-mismatch");
  require(observation.releaseBoundary === "candidate-only-hold-not-admitted"
    && observation.scientificPayloadWriteback === "false", "candidate-boundary-mismatch");
  require(observation.viewport?.[0] === viewport.width && observation.viewport?.[1] === viewport.height
    && observation.documentWidth <= viewport.width && observation.canvasCount === 1
    && observation.visibility === "visible", "layout-or-canvas-invalid");
  require(observation.sceneMode === "inspect", "scene-not-focused");
  if (scene.kind === "nebula") {
    require(observation.nebula?.id === scene.id && observation.nebula.status === "ready"
      && /^[a-f0-9]{64}$/.test(observation.nebula.sha256 ?? "")
      && observation.nebula.rights === "pending"
      && observation.nebula.admission === "candidate-only", "nebula-not-ready-or-boundary-missing");
  }
  if (phase === "after") {
    require(["collapsed", "half", "details"].includes(observation.passportState), "m1-state-missing");
    require(observation.artExpanded === "false", "second-main-image-open-by-default");
    require(observation.scaleCompact === "true", "scale-not-compact-by-default");
  }
  return issues;
}

export function inspectM1Behaviors(behavior, phase, scene) {
  const issues = [];
  if (!behavior.closeViaKeyboard || !behavior.reopenViaKeyboard
    || !behavior.selectionPreserved) issues.push("passport-keyboard-cycle-incomplete");
  if (!behavior.sources?.length || behavior.sources.some((source) => !/^https?:\/\//.test(source.href))) {
    issues.push("sources-not-reachable");
  }
  if (phase === "after") {
    if (!behavior.scenePreservedAfterInteractions) issues.push("scene-changed-during-ui-interactions");
    if (behavior.mobileTouchTargets && behavior.mobileTouchTargets.some((target) => target.width < 43.9 || target.height < 43.9)) {
      issues.push("mobile-touch-target-below-44px");
    }
    if (!behavior.detailsOpened || !behavior.sourcesExpanded || !behavior.returnedToDefault) {
      issues.push("m1-details-source-cycle-incomplete");
    }
    if (!behavior.scaleExpanded || !behavior.scaleEscapeRestoredFocus) issues.push("scale-keyboard-cycle-incomplete");
    if (!behavior.comparisonOpened || !behavior.comparisonEscapeClosed) issues.push("comparison-keyboard-cycle-incomplete");
    if (scene.kind === "constellation" && behavior.relatedObjectJourney?.length !== 4) {
      issues.push("orion-related-object-return-incomplete");
    }
    if (scene.kind === "nebula" && (!behavior.captionExpanded || !behavior.creditVisible
      || !behavior.captionCollapsedAgain || !behavior.captionImageUnchanged)) {
      issues.push("nebula-caption-cycle-incomplete");
    }
  }
  return issues;
}

async function exclusive(filename, bytes) {
  await writeFile(filename, bytes, { flag: "wx" });
}
async function ensureAbsent(filename) {
  try { await access(filename); } catch (error) { if (error.code === "ENOENT") return; throw error; }
  throw new Error(`m1-browser:output-exists:${filename}`);
}
const jsonBytes = (value) => `${JSON.stringify(value, null, 2)}\n`;

export async function selectScene(page, scene) {
  if (scene.kind === "star") {
    await page.getByRole("button", { name: "恒星图集", exact: true }).click();
    await page.locator(`[data-mainline-a-atlas-star="${scene.id}"]`).click();
    await page.getByRole("button", { name: "在星空中定位", exact: true }).click();
    await page.locator("[data-mainline-a-stellar-atlas]").waitFor({ state: "detached" });
  } else {
    await page.locator('button[aria-label="搜索"]').click();
    const browser = page.locator("#universe-object-browser");
    await browser.waitFor({ state: "visible" });
    if (scene.kind === "constellation") {
      await browser.locator('[data-mainline-a-constellation-shortcut="canonical"]').click();
    } else {
      const sections = browser.locator("button[aria-expanded]");
      for (let index = 0; index < await sections.count(); index++) {
        const section = sections.nth(index);
        if (await section.getAttribute("aria-expanded") === "false") await section.press("Enter");
      }
    }
    await browser.locator(`[data-celestial-catalog-entry-id="${scene.kind}:${scene.id}"]`).press("Enter");
    if (await browser.count()) await browser.getByRole("button", { name: "收起对象浏览器" }).press("Enter");
    await browser.waitFor({ state: "detached" });
  }
  await page.waitForFunction((id) => document.querySelector("[data-atlas-app-shell]")
    ?.getAttribute("data-celestial-catalog-selected-id") === id, scene.selectedId);
  await page.locator('#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]').waitFor({ state: "visible" });
  await page.waitForFunction(() => document.querySelector("[data-atlas-app-shell]")
    ?.getAttribute("data-atlas-runtime-scene-focus-performance-scene-mode") === "inspect");
  if (scene.kind === "nebula") {
    await page.locator(`[data-mainline-a-scene-nebula="${scene.id}"][data-mainline-a-scene-image-status="ready"]`)
      .waitFor({ state: "attached", timeout: 20_000 });
  }
  return waitForActualCameraStable(page, scene.selectedId);
}

export async function observe(page) {
  const observation = await page.evaluate(() => {
    const shell = document.querySelector("[data-atlas-app-shell]");
    const passport = document.querySelector('#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]');
    const nebula = document.querySelector("[data-mainline-a-scene-nebula]");
    const attr = (node, name) => node?.getAttribute(name) ?? null;
    const rect = (node) => {
      if (!node) return null;
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    };
    return { at: new Date().toISOString(), url: location.href, viewport: [innerWidth, innerHeight],
      documentWidth: document.documentElement.scrollWidth, visibility: document.visibilityState,
      canvasCount: document.querySelectorAll("canvas").length,
      selectedId: attr(shell, "data-celestial-catalog-selected-id"),
      runtimeBuildId: attr(shell, "data-mainline-build-id"),
      branch: attr(shell, "data-mainline-branch"), head: attr(shell, "data-mainline-head"),
      releaseBoundary: attr(shell, "data-mainline-a-release-boundary"),
      scientificPayloadWriteback: attr(shell, "data-mainline-a-scientific-payload-writeback"),
      sceneMode: attr(shell, "data-atlas-runtime-scene-focus-performance-scene-mode"),
      passportId: attr(passport, "data-celestial-object-passport-id"),
      passportState: attr(passport, "data-mainline-a-passport-state"),
      artExpanded: attr(passport, "data-mainline-a-passport-art-expanded"),
      scaleCompact: attr(document.querySelector('[aria-label="宇宙尺度导航"]'), "data-mainline-a-scale-compact"),
      passportBounds: rect(passport),
      nebula: nebula ? { id: attr(nebula, "data-mainline-a-scene-nebula"),
        status: attr(nebula, "data-mainline-a-scene-image-status"),
        sha256: attr(nebula, "data-mainline-a-scene-image-sha256"),
        rights: attr(nebula, "data-mainline-a-scene-human-rights-signoff"),
        admission: attr(nebula, "data-mainline-a-scene-release-admission"),
        captionExpanded: attr(nebula.querySelector("[data-mainline-a-nebula-caption-expanded]"), "data-mainline-a-nebula-caption-expanded"), bounds: rect(nebula) } : null };
  });
  return { ...observation, camera: await readActualCameraObservation(page) };
}

async function verifyBehaviors(page, phase, scene, captureInteraction) {
  const result = {};
  const passport = page.locator('#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]');
  if (phase === "after") {
    const scale = page.getByRole("navigation", { name: "宇宙尺度导航", exact: true });
    await scale.getByRole("button", { name: "展开尺度导航", exact: true }).press("Enter");
    await scale.locator('[aria-label="收起尺度导航"][aria-expanded="true"]').waitFor();
    result.scaleExpanded = true;
    await captureInteraction("scale-expanded");
    const range = scale.getByRole("slider", { name: "连续对数尺度" });
    await range.press("Escape");
    const toggle = scale.getByRole("button", { name: "展开尺度导航", exact: true });
    await toggle.waitFor();
    result.scaleEscapeRestoredFocus = await toggle.evaluate((button) => document.activeElement === button);
  }
  await page.getByRole("button", { name: "关闭天体档案", exact: true }).press("Enter");
  await passport.waitFor({ state: "detached" });
  result.closeViaKeyboard = true;
  await page.getByRole("button", { name: "打开天体档案", exact: true }).press("Enter");
  await passport.waitFor({ state: "visible" });
  result.reopenViaKeyboard = true;
  result.selectionPreserved = await page.locator("[data-atlas-app-shell]")
    .getAttribute("data-celestial-catalog-selected-id") === scene.selectedId;
  if (phase === "after") {
    const mobile = page.viewportSize().width < 640;
    if (mobile) {
      await passport.getByRole("button", { name: "查看摘要", exact: true }).press("Enter");
      await passport.getByRole("button", { name: "查看详情", exact: true }).press("Enter");
      await page.locator('[data-mainline-a-passport-state="details"]').waitFor();
    } else {
      await passport.getByRole("button", { name: "数据", exact: true }).press("Enter");
      await passport.locator('[data-celestial-object-passport-section]').first().waitFor();
      await passport.getByRole("button", { name: "概览", exact: true }).press("Enter");
    }
    result.detailsOpened = true;
    result.detailMode = mobile ? "expanded-sheet" : "data-tab";
    const sources = passport.locator("summary").filter({ hasText: "来源与说明" });
    await sources.press("Enter");
    result.sourcesExpanded = await sources.evaluate((summary) => summary.parentElement.open === true);
  } else {
    const expand = passport.getByRole("button", { name: "展开天体详情", exact: true });
    if (await expand.isVisible()) await expand.press("Enter");
  }
  const links = passport.locator("a[data-mainline-a-source]");
  ensure(await links.count() > 0, "no-passport-source-links");
  await links.first().scrollIntoViewIfNeeded();
  await links.first().focus();
  result.sourceKeyboardFocused = await links.first().evaluate((link) => document.activeElement === link);
  result.sources = await links.evaluateAll((nodes) => nodes.map((node) => ({
    href: node.href, source: node.getAttribute("data-mainline-a-source"),
    license: node.getAttribute("data-mainline-a-source-license"),
    credit: node.getAttribute("data-mainline-a-source-credit"),
    visible: node.getClientRects().length > 0,
  })));
  ensure(result.sourceKeyboardFocused && result.sources.every((source) => source.visible), "source-links-not-visible");
  if (phase === "after") {
    await captureInteraction("sources-expanded");
    await passport.getByRole("button", { name: "查看图鉴 / 比较", exact: true }).press("Enter");
    await page.locator('[data-mainline-a-passport-art-expanded="true"]').waitFor();
    result.comparisonOpened = true;
    await captureInteraction("comparison-expanded");
    await page.keyboard.press("Escape");
    await page.locator('[data-mainline-a-passport-art-expanded="false"]').waitFor();
    result.comparisonEscapeClosed = true;
    await passport.getByRole("button", { name: "关闭天体档案", exact: true }).press("Enter");
    await passport.waitFor({ state: "detached" });
    await page.getByRole("button", { name: "打开天体档案", exact: true }).press("Enter");
    const expected = page.viewportSize().width < 640 ? "collapsed" : "half";
    await page.locator(`[data-mainline-a-passport-state="${expected}"]`).waitFor();
    result.returnedToDefault = true;
    if (scene.kind === "nebula") {
      const image = page.locator(`[data-mainline-a-scene-nebula="${scene.id}"]`);
      await page.locator(`[data-mainline-a-scene-nebula="${scene.id}"][data-mainline-a-scene-image-status="ready"]`).waitFor();
      const caption = image.locator("[data-mainline-a-nebula-caption-expanded]");
      const initialAttempt = await image.getAttribute("data-mainline-a-scene-image-attempt");
      await page.getByRole("button", { name: "展开观测图说明与署名", exact: true }).press("Enter");
      await image.locator('[data-mainline-a-nebula-caption-expanded="true"]').waitFor();
      result.captionExpanded = true;
      result.creditVisible = await image.locator("[data-mainline-a-scene-image-credit]").isVisible();
      if (page.viewportSize().width < 640) {
        result.mobileTouchTargets = await image.locator("a, button").evaluateAll((nodes) => nodes
          .filter((node) => node.getClientRects().length > 0)
          .map((node) => ({ label: node.getAttribute("aria-label") ?? node.textContent,
            width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height })));
      }
      await captureInteraction("caption-expanded");
      await page.getByRole("button", { name: "收起观测图说明与署名", exact: true }).press("Enter");
      await image.locator('[data-mainline-a-nebula-caption-expanded="false"]').waitFor();
      result.captionCollapsedAgain = await caption.getAttribute("data-mainline-a-nebula-caption-expanded") === "false";
      result.captionImageUnchanged = initialAttempt === await image.getAttribute("data-mainline-a-scene-image-attempt");
    }
  }
  if (phase === "after") {
    if (scene.kind === "constellation") {
      result.relatedObjectJourney = [];
      for (const step of ["orion-betelgeuse", "orion-sky-map", "orion-m42", "orion-sky-map"]) {
        const peek = passport.getByRole("button", { name: "查看摘要", exact: true });
        if (await peek.isVisible()) await peek.press("Enter");
        await passport.getByRole("button", { name: "查看图鉴 / 比较", exact: true }).press("Enter");
        const route = passport.locator('[data-mainline-a-route="orion-clouds-and-stars"]');
        await route.locator("summary").press("Enter");
        const target = route.locator(`[data-mainline-a-route-step="${step}"] button`);
        const targetId = await target.getAttribute("data-mainline-a-route-target");
        if (page.viewportSize().width < 640) await target.tap();
        else await target.press("Enter");
        await page.waitForFunction((id) => document.querySelector("[data-atlas-app-shell]")
          ?.getAttribute("data-celestial-catalog-selected-id") === id, targetId);
        await page.waitForFunction(() => document.querySelector("[data-atlas-app-shell]")
          ?.getAttribute("data-atlas-runtime-scene-focus-performance-scene-mode") === "inspect");
        await page.waitForTimeout(1_200);
        if (step === "orion-m42") await page.locator('[data-mainline-a-scene-nebula="m42"][data-mainline-a-scene-image-status="ready"]').waitFor();
        const routeObservation = await observe(page);
        ensure(routeObservation.selectedId === targetId && routeObservation.artExpanded === "false", "related-object-selection-or-state-not-reset");
        result.relatedObjectJourney.push({ step, targetId, observed: routeObservation });
        await captureInteraction(`route-${result.relatedObjectJourney.length}-${step}`);
      }
    }
    const final = await observe(page);
    result.scenePreservedAfterInteractions = final.selectedId === scene.selectedId
      && final.passportId === scene.passportId && final.sceneMode === "inspect" && final.canvasCount === 1;
  }
  return result;
}

export async function captureM1(options) {
  const output = path.join(ROOT, OUTPUT, options.phase);
  await mkdir(output, { recursive: true });
  const names = Object.keys(M1_VIEWPORTS).flatMap((device) => M1_SCENES.map((scene) => `${device}-${scene.name}`));
  for (const name of [...names.flatMap((name) => [`${name}.png`, `${name}.json`]), "receipt.json"]) {
    await ensureAbsent(path.join(output, name));
  }
  const attempt = path.join(output, "attempts", options.runId);
  await mkdir(attempt, { recursive: true });
  await exclusive(path.join(attempt, "started.json"), jsonBytes({ at: new Date().toISOString(), ...options }));
  const receipt = { schema: "mainline-a-m1-six-view-browser-v1", phase: options.phase,
    runId: options.runId, startedAt: new Date().toISOString(), origin: options.origin,
    status: "running", items: [], errors: [], physicalDevice: false,
    claims: { humanVisualSignoff: false, publicReleaseApproved: false,
      copyrightApproval: false, scientificValidity: false, productionPerformance: false } };
  let browser;
  let currentPage;
  let lastItem;
  try {
    const buildBytes = await readFile(options.buildReceipt);
    const build = JSON.parse(buildBytes.toString("utf8"));
    const baselineBytes = options.phase === "before" ? await readFile(options.baselineInputs) : null;
    const input = baselineBytes ? JSON.parse(baselineBytes.toString("utf8")).source : await captureBuildInputs();
    const diskBuildId = (await readFile(path.resolve(ROOT, build.distDir, "BUILD_ID"), "utf8")).trim();
    receipt.build = validateM1Build(build, input, diskBuildId);
    receipt.binding = { buildReceipt: path.relative(ROOT, options.buildReceipt), buildReceiptSha256: sha256(buildBytes),
      sourceScope: options.phase === "before" ? "frozen-baseline-inputs" : "current-source-before-and-after",
      baselineInputsSha256: baselineBytes ? sha256(baselineBytes) : null,
      baselineInputPath: baselineBytes ? path.relative(ROOT, options.baselineInputs) : null };
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: true, executablePath: options.chrome });
    for (const [device, viewport] of Object.entries(M1_VIEWPORTS)) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1,
        isMobile: device === "mobile", hasTouch: device === "mobile" });
      try {
        for (const scene of M1_SCENES) {
          lastItem = `${device}-${scene.name}`;
          const page = await context.newPage();
          currentPage = page;
          page.setDefaultTimeout(15_000);
          const errors = [];
          page.on("pageerror", (error) => errors.push({ type: "pageerror", message: error.message }));
          page.on("console", (message) => {
            if (message.type() === "error") errors.push({ type: "console", message: message.text() });
          });
          await page.goto(`${options.origin}/`, { waitUntil: "domcontentloaded", timeout: 30_000 });
          await page.locator("[data-atlas-app-shell]").waitFor({ state: "visible" });
          await selectScene(page, scene);
          const observed = await observe(page);
          const issues = inspectM1Observation(observed, scene, viewport, receipt.build, options.phase);
          const png = await page.screenshot({ type: "png" });
          await exclusive(path.join(attempt, `${lastItem}.png`), png);
          const item = { device, scene, observed, issues, errors, interactionScreenshots: [],
            screenshot: { path: `${OUTPUT}/${options.phase}/${lastItem}.png`, bytes: png.length, sha256: sha256(png) } };
          receipt.items.push(item);
          ensure(issues.length === 0, `${lastItem}:${issues.join(",")}`);
          item.behaviors = await verifyBehaviors(page, options.phase, scene, async (action) => {
            const image = await page.screenshot({ type: "png" });
            const filename = `${lastItem}-${action}.png`;
            await exclusive(path.join(attempt, filename), image);
            item.interactionScreenshots.push({ action, path: `${OUTPUT}/${options.phase}/interactions/${filename}`,
              filename, bytes: image.length, sha256: sha256(image) });
          });
          issues.push(...inspectM1Behaviors(item.behaviors, options.phase, scene));
          ensure(issues.length === 0 && errors.length === 0, `${lastItem}:behavior-or-browser-errors:${JSON.stringify({ issues, errors })}`);
          await exclusive(path.join(attempt, `${lastItem}.json`), jsonBytes(item));
          console.log(JSON.stringify({ stage: "captured", phase: options.phase, scene: lastItem, issues: 0 }));
          await page.close();
          currentPage = null;
        }
      } catch (error) {
        if (currentPage && !currentPage.isClosed()) {
          await exclusive(path.join(attempt, "failure.png"), await currentPage.screenshot({ type: "png" }));
          receipt.failureButtons = await currentPage.locator("button, summary").evaluateAll((nodes) => nodes
            .filter((node) => node.getClientRects().length > 0)
            .map((node) => ({ text: node.textContent, label: node.getAttribute("aria-label") })));
        }
        throw error;
      } finally { await context.close(); currentPage = null; }
    }
    if (options.phase === "after") {
      const after = await captureBuildInputs();
      ensure(after.sha256 === input.sha256, "source-changed-during-run");
      receipt.binding.sourceAfterSha256 = after.sha256;
    }
    receipt.status = "passed-six-real-browser-views-candidate-only";
    receipt.endedAt = new Date().toISOString();
    await exclusive(path.join(attempt, "receipt.json"), jsonBytes(receipt));
    for (const name of [...names.flatMap((name) => [`${name}.png`, `${name}.json`]), "receipt.json"]) {
      await copyFile(path.join(attempt, name), path.join(output, name), constants.COPYFILE_EXCL);
    }
    const interactions = receipt.items.flatMap((item) => item.interactionScreenshots);
    if (interactions.length) await mkdir(path.join(output, "interactions"), { recursive: true });
    for (const item of interactions) {
      await copyFile(path.join(attempt, item.filename), path.join(output, "interactions", item.filename), constants.COPYFILE_EXCL);
    }
    return receipt;
  } catch (error) {
    receipt.status = "failed-attempt-preserved";
    receipt.endedAt = new Date().toISOString();
    receipt.lastItem = lastItem ?? null;
    receipt.errors.push({ message: error.message, stack: error.stack });
    if (currentPage && !currentPage.isClosed()) {
      try { await exclusive(path.join(attempt, "failure.png"), await currentPage.screenshot({ type: "png" })); }
      catch { /* Preserve the original error even if the page was already lost. */ }
    }
    await exclusive(path.join(attempt, "failure.json"), jsonBytes(receipt));
    throw error;
  } finally { if (browser) await browser.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const receipt = await captureM1(parseM1Options(process.argv.slice(2)));
  console.log(JSON.stringify({ status: receipt.status, phase: receipt.phase, views: receipt.items.length }));
}
