import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { M1_VIEWPORTS, inspectM1Observation, observe, parseM1Options, selectScene, validateM1Build } from "./capture-mainline-a-m1-browser.mjs";
import { createBrowserResourceGuard } from "./mainline-a-browser-resource-guard.mjs";
import { waitForActualCameraStable } from "./mainline-a-browser-camera-observation.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const M4_OUTPUT = "output/playwright/mainline-a-m4-20261015";
export const M4_A12 = Object.freeze(["Ori", "UMa", "Cas", "Sco", "Cyg", "Gem", "Leo", "Cru", "Lyr", "Aql", "Tau", "Sgr"]);
export const M4_STOPS = Object.freeze(["constellation:Ori", "nebula:m42", "nebula:b33", "nearby-star:betelgeuse", "nearby-star:rigel"]);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const ensure = (value, message) => { if (!value) throw new Error(`m4-browser:${message}`); };
const exclusive = (filename, value) => writeFile(filename, value, { flag: "wx" });
const JOURNEY = '[data-mainline-a-journey="orion-clouds-and-stars"]';

export function parseM4Options(args) {
  const outputIndex = args.indexOf("--output-dir");
  ensure(outputIndex < 0 || args.lastIndexOf("--output-dir") === outputIndex, "duplicate-output-directory");
  const outputDir = outputIndex < 0 ? M4_OUTPUT : args[outputIndex + 1];
  ensure(typeof outputDir === "string" && /^output\/playwright\/[a-zA-Z0-9-]+$/.test(outputDir), "invalid-output-directory");
  if (outputIndex >= 0) args = [...args.slice(0, outputIndex), ...args.slice(outputIndex + 2)];
  const profileIndex = args.indexOf("--probe-profile");
  ensure(profileIndex < 0 || args.lastIndexOf("--probe-profile") === profileIndex, "duplicate-probe-profile");
  const probeProfile = profileIndex < 0 ? "desktop" : args[profileIndex + 1];
  ensure(["desktop", "mobile", "narrow", "reduced-motion"].includes(probeProfile), "invalid-probe-profile");
  if (profileIndex >= 0) args = [...args.slice(0, profileIndex), ...args.slice(profileIndex + 2)];
  const scopeIndex = args.indexOf("--scope");
  ensure(scopeIndex < 0 || args.lastIndexOf("--scope") === scopeIndex, "duplicate-scope");
  const scope = scopeIndex < 0 ? "full" : args[scopeIndex + 1];
  ensure(["full", "journey-probe"].includes(scope), "invalid-scope");
  ensure(profileIndex < 0 || scope === "journey-probe", "profile-requires-probe-scope");
  const options = parseM1Options(scopeIndex < 0 ? args : [...args.slice(0, scopeIndex), ...args.slice(scopeIndex + 2)]);
  ensure(options.phase === "after", "after-phase-required");
  return { ...options, outputDir, scope, probeProfile };
}
export function m4Scene(code) {
  ensure(M4_A12.includes(code), "outside-a12-roster");
  return { name: code, kind: "constellation", id: code, selectedId: `constellation:${code}`, passportId: `constellation:${code}` };
}
/** Independent rectangle proof over the whole visible canvas, not an inferred runtime safe rectangle. */
export function measureM4AvailableSky(measurement) {
  const valid = (rect) => rect && [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)
    && rect.width > 0 && rect.height > 0;
  if (!valid(measurement?.canvas) || !valid(measurement?.viewport) || !Array.isArray(measurement?.blockers)
    || measurement.blockers.some((blocker) => !valid(blocker.rect))) return { valid: false, reason: "missing-or-invalid-client-rectangles" };
  const canvas = measurement.canvas; const viewport = measurement.viewport;
  const bounds = { left: Math.max(canvas.x, viewport.x), top: Math.max(canvas.y, viewport.y),
    right: Math.min(canvas.x + canvas.width, viewport.x + viewport.width),
    bottom: Math.min(canvas.y + canvas.height, viewport.y + viewport.height) };
  if (bounds.right <= bounds.left || bounds.bottom <= bounds.top) return { valid: false, reason: "canvas-outside-visible-viewport" };
  const margin = 8;
  const blockers = measurement.blockers.filter(({ rect }) => rect.x < bounds.right && rect.x + rect.width > bounds.left
    && rect.y < bounds.bottom && rect.y + rect.height > bounds.top).map(({ kind, rect }) => ({ kind,
    left: Math.max(bounds.left, rect.x - margin), top: Math.max(bounds.top, rect.y - margin),
    right: Math.min(bounds.right, rect.x + rect.width + margin), bottom: Math.min(bounds.bottom, rect.y + rect.height + margin) }))
    .filter((rect) => rect.right > rect.left && rect.bottom > rect.top);
  const xs = [...new Set([bounds.left, bounds.right, ...blockers.flatMap((rect) => [rect.left, rect.right])])].sort((a, b) => a - b);
  let maxFreeShortEdgePx = 0; let widestShortEdgeRect = null;
  const consider = (left, right, top, bottom) => {
    const edge = Math.min(right - left, bottom - top);
    if (edge > maxFreeShortEdgePx) { maxFreeShortEdgePx = edge; widestShortEdgeRect = { left, right, top, bottom }; }
  };
  for (let start = 0; start < xs.length - 1; start++) for (let end = start + 1; end < xs.length; end++) {
    const left = xs[start]; const right = xs[end]; let top = bounds.top;
    const covered = blockers.filter((rect) => rect.left < right && rect.right > left).sort((a, b) => a.top - b.top);
    for (const rect of covered) { consider(left, right, top, rect.top); top = Math.max(top, rect.bottom); }
    consider(left, right, top, bounds.bottom);
  }
  return { valid: true, bounds, marginCssPx: margin, maxFreeShortEdgePx, widestShortEdgeRect,
    hasNavigation: blockers.some((rect) => rect.kind === "navigation"), hasPassport: blockers.some((rect) => rect.kind === "passport"),
    scope: "all-empty-axis-aligned-rectangles-in-visible-canvas-after-measured-dom-blockers; runtime-safe-rectangle-not-assumed" };
}

export function inspectM4ChartOcclusion(view, code, mobile, mode, preChart) {
  const geometry = measureM4AvailableSky(view.occlusionMeasurement);
  const eligible = mobile && ["comparison", "boundary"].includes(mode) && view.passportState === "details"
    && view.artExpanded === "true" && geometry.valid && geometry.hasNavigation && geometry.hasPassport
    && geometry.maxFreeShortEdgePx < 64;
  const pose = compareM4CameraPose(preChart?.camera ?? {}, view.camera ?? {});
  const beforeDistance = preChart?.camera?.targetDistance; const distance = view.camera?.targetDistance;
  const distanceDifference = Number.isFinite(beforeDistance) && Number.isFinite(distance) ? Math.abs(beforeDistance - distance) : null;
  const cameraPreserved = pose.ok && beforeDistance > 0 && distance > 0 && distanceDifference !== null && distanceDifference <= .001
    && preChart?.selectedId === `constellation:${code}` && view.selectedId === `constellation:${code}`
    && preChart.passportState === "half" && preChart.artExpanded === "false" && preChart.chart === null
    && preChart.scene?.code === code && preChart.scene.state === "ready" && preChart.scene.visibleSegments === preChart.scene.segments
    && preChart.camera.focusState === "locked" && view.camera.focusState === "locked";
  const allowed = Boolean(eligible && cameraPreserved && view.scene.state === "unobserved");
  return { allowed, eligible: Boolean(eligible), cameraPreserved: Boolean(cameraPreserved), geometry, pose, distanceDifference,
    disposition: allowed ? "chart-primary-scene-occluded" : "scene-required-ready",
    reason: allowed ? "measured-visible-canvas-has-no-64px-composition; complete-chart-and-unchanged-pre-chart-pose-required" : null };
}

export function inspectM4Constellation(view, code, mobile, mode, preChart = null) {
  const issues = [];
  if (!Array.isArray(view.orbitAtlasLabelIds)) issues.push("solar-system-label-observation-missing");
  else if (view.orbitAtlasLabelIds.length !== 0) issues.push("solar-system-labels-mounted-in-constellation-focus");
  const scene = view.scene;
  const occlusion = inspectM4ChartOcclusion(view, code, mobile, mode, preChart);
  if (scene.code !== code || !Number.isInteger(scene.segments) || scene.segments < 1 || !Number.isInteger(scene.visibleSegments)
    || scene.visibleSegments < 0 || scene.visibleSegments > scene.segments || !Number.isInteger(scene.anchors) || scene.anchors < 1 || scene.source !== "candidate-only"
    || (!(scene.state === "ready" && scene.visibleSegments === scene.segments) && !occlusion.allowed)) issues.push("constellation-not-rendered");
  if (occlusion.eligible && !occlusion.cameraPreserved) issues.push("occluded-chart-camera-not-preserved");
  if (scene.boundaryCode !== code || scene.boundaryStyle !== "dashed" || !scene.boundaryVisible
    || scene.boundaryOpacity <= 0 || scene.boundarySegments < 3) issues.push("selected-boundary-missing");
  if (Math.abs(scene.lineWidth - (mobile ? 1.8 : 1.65)) > .001) issues.push("scene-line-width-invalid");
  if (mode !== "default") {
    const chart = view.chart;
    if (!chart || chart.code !== code || chart.source !== "candidate-only" || chart.writeback !== "false"
      || chart.visibleRatio < .98 || chart.lines !== scene.segments || chart.anchors !== scene.anchors
      || chart.lineColor !== "#b9dff6" || Math.abs(chart.lineWidth - scene.lineWidth) > .001
      || chart.lineOpacity !== (mobile ? .78 : .7)) issues.push("chart-scene-contract-mismatch");
    if (mode === "boundary" && (!chart?.boundary || chart.boundary.code !== code
      || chart.boundary.color !== "#8a9cad" || chart.boundary.dash !== "4 5" || chart.boundary.points < 3)) {
      issues.push("chart-boundary-invalid");
    }
  } else if (view.chart !== null) issues.push("comparison-open-by-default");
  return issues;
}
export function inspectM4Journey(view, index, status = "ready") {
  const issues = [];
  if (!view || view.index !== index || view.status !== status || view.target !== M4_STOPS[index]
    || view.selectedId !== M4_STOPS[index] || !(view.request > 0)) issues.push("journey-station-mismatch");
  if (view?.bounds.left < 0 || view?.bounds.right > view?.viewport[0]
    || view?.bounds.top < 0 || view?.bounds.bottom > view?.viewport[1]
    || view?.documentWidth > view?.viewport[0]) issues.push("journey-outside-viewport");
  if (view?.controls.some((control) => control.height < 43.9 || control.width < 43.9)) issues.push("journey-small-touch-target");
  return issues;
}

export function compareM4CameraPose(before, after, tolerance = .001) {
  const differences = {};
  for (const field of ["position", "target", "direction", "up", "quaternion"]) {
    const size = field === "quaternion" ? 4 : 3;
    if (!Array.isArray(before[field]) || !Array.isArray(after[field]) || before[field].length !== size || after[field].length !== size
      || ![...before[field], ...after[field]].every(Number.isFinite)) differences[field] = null;
    else {
      // Opposite quaternion signs represent the same physical orientation.
      const signs = field === "quaternion" ? [1, -1] : [1];
      const delta = Math.min(...signs.map((sign) => Math.max(...before[field].map((value, index) => Math.abs(value - sign * after[field][index])))));
      if (delta > tolerance) differences[field] = delta;
    }
  }
  for (const field of ["fov", "zoom"]) {
    if (!Number.isFinite(before[field]) || !Number.isFinite(after[field])) differences[field] = null;
    else if (Math.abs(before[field] - after[field]) > tolerance) differences[field] = Math.abs(before[field] - after[field]);
  }
  return { ok: Object.keys(differences).length === 0, differences, tolerance };
}

export function inspectM4ComparisonReturn(before, after, code, mobile, tolerance = .001) {
  const issues = inspectM4Constellation(after, code, mobile, "default");
  const selectedId = `constellation:${code}`;
  if (before.selectedId !== selectedId || after.selectedId !== selectedId) issues.push("comparison-return-selection-changed");
  const defaultSheet = mobile ? "collapsed" : "half";
  if (before.passportState !== defaultSheet || after.passportState !== defaultSheet
    || before.artExpanded !== "false" || after.artExpanded !== "false") issues.push("comparison-return-default-ui-not-restored");
  if (before.camera?.focusState !== "locked" || after.camera?.focusState !== "locked") issues.push("comparison-return-camera-not-locked");
  const pose = compareM4CameraPose(before.camera ?? {}, after.camera ?? {}, tolerance);
  if (!pose.ok) issues.push("comparison-return-actual-pose-not-restored");
  const initialDistance = before.camera?.targetDistance;
  const finalDistance = after.camera?.targetDistance;
  const distanceDifference = Number.isFinite(initialDistance) && Number.isFinite(finalDistance)
    ? Math.abs(initialDistance - finalDistance) : null;
  if (!(initialDistance > 0 && finalDistance > 0) || distanceDifference === null || distanceDifference > tolerance) {
    issues.push("comparison-return-actual-distance-not-restored");
  }
  return { ok: issues.length === 0, issues, pose, initialDistance, finalDistance, distanceDifference, tolerance,
    scope: "same-selected-object-after-real-ui-comparison-close-and-default-passport-layout; actual-camera-markers" };
}

export function inspectM4ReturnVisibility(view) {
  const issues = [];
  const notice = view.bounds;
  if (!(notice.width > 0 && notice.height > 0) || notice.left < 0 || notice.top < 0
    || notice.right > view.viewport[0] || notice.bottom > view.viewport[1]) issues.push("returned-notice-not-visible");
  const passport = view.passportBounds;
  if (!view.returnInPassport || !passport || notice.left < passport.left - 1 || notice.right > passport.right + 1
    || notice.top < passport.top - 1 || notice.bottom > passport.bottom + 1 || view.externalRouteOccluders !== 0) {
    issues.push("returned-notice-occupies-new-sky-area");
  }
  if (!view.visibleLabels?.length) issues.push("returned-labels-not-observed");
  const overlaps = (left, right) => Math.min(left.right, right.right) - Math.max(left.left, right.left) > 1
    && Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 1;
  for (const label of view.visibleLabels ?? []) if (overlaps(notice, label.bounds)) issues.push(`returned-notice-obscures-label:${label.id}`);
  return { ok: issues.length === 0, issues,
    scope: "actual-visible-title-and-anchor-label-rectangles-only; WebGL nodes and lines require screenshot review" };
}

async function readCamera(page) {
  return page.locator("[data-atlas-browser-acceptance-version]").evaluate((node) => {
    const vector = (name) => { const value = node.getAttribute(`data-atlas-camera-actual-${name}`); return value ? value.split(",").map(Number) : null; };
    const scalar = (name) => { const value = node.getAttribute(`data-atlas-camera-actual-${name}`); return value ? Number(value) : null; };
    return { position: vector("position"), target: vector("target"), direction: vector("direction"), up: vector("up"),
      quaternion: vector("quaternion"), fov: scalar("fov"), zoom: scalar("zoom"),
      distance: Number(node.getAttribute("data-atlas-camera-target-distance")),
      bookmark: Object.fromEntries([...node.attributes].filter((attribute) => attribute.name.startsWith("data-mainline-a-bookmark-"))
        .map((attribute) => [attribute.name, attribute.value])),
      focusState: document.querySelector("[data-atlas-app-shell]")?.getAttribute("data-atlas-camera-focus-state") ?? null,
      focusStateEvidence: "optional DOM marker only; null means unavailable, never locked" };
  });
}

async function panRealCamera(page, context, mobile) {
  const point = await page.locator("canvas").evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    for (const fy of [.4, .5, .3, .6]) for (const fx of [.5, .4, .6, .3]) {
      const x = rect.x + rect.width * fx; const y = rect.y + rect.height * fy;
      if (document.elementFromPoint(x, y) === canvas && document.elementFromPoint(x + 30, y + 12) === canvas) return { x, y };
    }
    return null;
  });
  ensure(point, "no-uncovered-canvas-for-user-pan");
  if (mobile) {
    const session = await context.newCDPSession(page);
    try {
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
      for (let index = 1; index <= 5; index++) await session.send("Input.dispatchTouchEvent", { type: "touchMove",
        touchPoints: [{ x: point.x + 30 * index / 5, y: point.y + 12 * index / 5 }] });
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } finally { await session.detach(); }
  } else {
    await page.mouse.move(point.x, point.y); await page.mouse.down();
    await page.mouse.move(point.x + 30, point.y + 12, { steps: 5 }); await page.mouse.up();
  }
  await page.waitForTimeout(1_500);
}

async function captureJourneys(withCaseContext, options, receipt, record, attempt, guard) {
  const profiles = [
    { id: "desktop", viewport: M1_VIEWPORTS.desktop },
    { id: "mobile", viewport: M1_VIEWPORTS.mobile, mobile: true },
    { id: "narrow", viewport: { width: 360, height: 800 }, mobile: true },
    { id: "reduced-motion", viewport: M1_VIEWPORTS.desktop, reducedMotion: "reduce" },
  ];
  for (const profile of options.scope === "journey-probe" ? profiles.filter((entry) => entry.id === options.probeProfile) : profiles) {
    guard.assert();
    await withCaseContext(profile.id + "-journey", { viewport: profile.viewport, deviceScaleFactor: 1,
      isMobile: Boolean(profile.mobile), hasTouch: Boolean(profile.mobile), reducedMotion: profile.reducedMotion ?? "no-preference" }, async (context) => {
    const item = { profile: profile.id, viewport: profile.viewport, errors: [], views: [], checks: {} }; receipt.journeys.push(item);
    const page = await context.newPage(); page.setDefaultTimeout(20_000);
    page.on("pageerror", (error) => item.errors.push({ type: "pageerror", message: error.message }));
    page.on("console", (message) => { if (message.type() === "error") item.errors.push({ type: "console", message: message.text() }); });
    const save = async (name, index, status = "ready") => {
      const selectedId = await page.locator("[data-atlas-app-shell]").getAttribute("data-celestial-catalog-selected-id");
      const cameraStability = await waitForActualCameraStable(page, selectedId);
      const observed = await readJourney(page); const base = await observe(page); const camera = await readCamera(page);
      const issues = index === null ? [] : inspectM4Journey(observed, index, status);
      if (base.canvasCount !== 1 || base.releaseBoundary !== "candidate-only-hold-not-admitted"
        || base.runtimeBuildId !== receipt.build.runtimeBuildId || base.scientificPayloadWriteback !== "false"
        || base.documentWidth > profile.viewport.width) issues.push("journey-runtime-boundary-or-layout");
      await record(page, item, `${profile.id}-journey-${name}`, { ...observed, base, camera, cameraStability }, issues);
      return observed;
    };
    const ready = async (index) => {
      await page.locator(`${JOURNEY}[data-mainline-a-journey-status="ready"][data-mainline-a-journey-index="${index}"]`).waitFor();
      if ([1, 2].includes(index)) await page.locator(`[data-mainline-a-scene-nebula="${index === 1 ? "m42" : "b33"}"][data-mainline-a-scene-image-status="ready"]`).waitFor();
      await page.waitForTimeout(250);
    };
    try {
      await page.goto(options.origin, { waitUntil: "domcontentloaded" }); await page.locator("[data-atlas-app-shell]").waitFor();
      await selectScene(page, m4Scene("Ori"));
      const passport = page.locator('#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]');
      if (profile.mobile) await passport.getByRole("button", { name: "查看摘要", exact: true }).press("Enter");
      item.defaultCamera = await readCamera(page);
      await panRealCamera(page, context, profile.mobile);
      await waitForActualCameraStable(page, "constellation:Ori");
      item.departureCamera = await readCamera(page);
      ensure(!compareM4CameraPose(item.defaultCamera, item.departureCamera).ok, `${profile.id}:user-pan-did-not-change-pose`);
      ensure(compareM4CameraPose(item.departureCamera, item.departureCamera).ok, `${profile.id}:actual-camera-markers-incomplete`);
      item.checks.userChangedDeparturePose = true;
      item.checks.reducedMotionMatches = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)
        === (profile.reducedMotion === "reduce");
      await page.locator('[data-mainline-a-journey-start="orion-clouds-and-stars"]').press("Enter");
      await ready(0); await save("station-0", 0);
      const journey = page.locator(JOURNEY);
      item.checks.firstPreviousDisabled = await journey.getByRole("button", { name: "上一站", exact: true }).isDisabled();
      for (let index = 1; index <= 4; index++) {
        await journey.getByRole("button", { name: "下一站", exact: true }).press("Enter"); await ready(index);
        await save(`station-${index}`, index);
        if (index === 1) {
          await journey.locator("summary").press("Enter"); await journey.locator("details[open]").waitFor();
          await page.waitForTimeout(1_200); await save("story-expanded-1", 1);
          await journey.locator("summary").press("Enter"); await journey.locator("details:not([open])").waitFor();
          await page.waitForTimeout(250);
        }
        if (index === 2) {
          await journey.getByRole("button", { name: "上一站", exact: true }).press("Enter"); await ready(1); await save("previous-1", 1);
          await journey.getByRole("button", { name: "下一站", exact: true }).press("Enter"); await ready(2);
          if (profile.mobile) {
            await passport.getByRole("button", { name: "关闭天体档案", exact: true }).press("Enter");
            await passport.waitFor({ state: "hidden" });
            const continued = await readJourney(page);
            item.checks.passportCloseKeepsJourney = continued.status === "ready" && continued.index === 2
              && continued.selectedId === M4_STOPS[2];
          }
          await selectScene(page, { name: "sirius-a", kind: "star", id: "sirius-a", selectedId: "stellar-hero:sirius-a", passportId: "nearby-star:sirius" });
          await page.locator(`${JOURNEY}[data-mainline-a-journey-status="paused"]`).waitFor();
          const paused = await save("external-sirius-paused", null);
          item.checks.externalSelectionPauses = paused.index === 2 && paused.target === M4_STOPS[2] && paused.selectedId === "stellar-hero:sirius-a";
          await journey.getByRole("button", { name: "继续旅程", exact: true }).press("Enter"); await ready(2); await save("resumed-2", 2);
        }
      }
      item.checks.lastNextDisabled = await journey.getByRole("button", { name: "下一站", exact: true }).isDisabled();
      await journey.getByRole("button", { name: "返回出发视点", exact: true }).press("Enter");
      await page.locator(`${JOURNEY}[data-mainline-a-journey-status="returned"]`).waitFor(); await page.waitForTimeout(400);
      const returned = await save("returned", null); item.returnedCamera = await readCamera(page);
      item.poseReturn = compareM4CameraPose(item.departureCamera, item.returnedCamera);
      item.returnVisibility = inspectM4ReturnVisibility(returned);
      item.checks.actualPoseRestored = item.poseReturn.ok;
      item.checks.returnedLabelsNotObscured = item.returnVisibility.ok;
      item.checks.startObjectRestored = returned.selectedId === "constellation:Ori";
      item.checks.returnFocusOnEnd = await page.getByRole("button", { name: "结束观测旅程", exact: true })
        .evaluate((button) => document.activeElement === button);
      await page.getByRole("button", { name: "结束观测旅程", exact: true }).press("Enter"); await journey.waitFor({ state: "detached" });
      await page.waitForFunction(() => document.activeElement === document.querySelector('#atlas-celestial-object-passport h2'));
      item.checks.endFocusOnPassportTitle = await passport.locator("h2").evaluate((title) => document.activeElement === title);
      item.checks.endPreservesSelection = (await observe(page)).selectedId === "constellation:Ori";
      ensure(Object.values(item.checks).every(Boolean) && item.errors.length === 0,
        `${profile.id}:journey-checks:${json({ checks: item.checks, poseReturn: item.poseReturn, returnVisibility: item.returnVisibility, errors: item.errors })}`);
      console.log(JSON.stringify({ stage: "journey-passed", profile: profile.id }));
    } catch (error) {
      await page.screenshot().then((bytes) => exclusive(path.join(attempt, `${profile.id}-journey-failure.png`), bytes)).catch(() => {}); throw error;
    }
    });
  }
}

export async function readConstellation(page, code) {
  const base = await observe(page);
  const detail = await page.evaluate((id) => {
    const shell = document.querySelector("[data-atlas-app-shell]");
    const attr = (name) => shell.getAttribute(`data-mainline-a-constellation-${name}`);
    const scene = { code: attr("selected-code"), state: attr("selected-state"), segments: Number(attr("selected-segments")),
      visibleSegments: Number(attr("selected-visible-segments")), anchors: Number(attr("selected-anchor-count")),
      lineWidth: Number(attr("selected-line-width-css-px")), source: attr("selected-source"),
      boundaryCode: attr("boundary-selected-code"), boundaryStyle: attr("boundary-style"),
      boundaryVisible: attr("boundary-visible") === "true", boundaryOpacity: Number(attr("boundary-opacity")),
      boundarySegments: Number(attr("boundary-segment-count")) };
    const figure = document.querySelector(`[data-mainline-a-star-chart="${id}"]`);
    let chart = null;
    if (figure) {
      const svg = figure.querySelector("svg"); const lines = figure.querySelector("[data-mainline-a-chart-figure-lines]");
      const boundary = figure.querySelector("[data-mainline-a-chart-boundary-code]");
      const rect = svg.getBoundingClientRect();
      const visible = { left: Math.max(0, rect.left), right: Math.min(innerWidth, rect.right),
        top: Math.max(0, rect.top), bottom: Math.min(innerHeight, rect.bottom) };
      for (let ancestor = svg.parentElement; ancestor; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor); const box = ancestor.getBoundingClientRect();
        if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) { visible.left = Math.max(visible.left, box.left); visible.right = Math.min(visible.right, box.right); }
        if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) { visible.top = Math.max(visible.top, box.top); visible.bottom = Math.min(visible.bottom, box.bottom); }
      }
      chart = { code: id, source: figure.getAttribute("data-mainline-a-chart-source"), writeback: figure.getAttribute("data-mainline-a-chart-scientific-writeback"),
        lines: lines?.querySelectorAll("line").length, anchors: figure.querySelectorAll("[data-mainline-a-chart-star]").length,
        lineColor: lines?.getAttribute("stroke"), lineWidth: Number(lines?.getAttribute("stroke-width")), lineOpacity: Number(lines?.getAttribute("stroke-opacity")),
        visibleRatio: Math.max(0, visible.right - visible.left) * Math.max(0, visible.bottom - visible.top) / (rect.width * rect.height),
        boundary: boundary ? { code: boundary.getAttribute("data-mainline-a-chart-boundary-code"), color: boundary.getAttribute("stroke"),
          dash: boundary.getAttribute("stroke-dasharray"), points: boundary.getAttribute("points").split(" ").length } : null };
    }
    const navigation = 'nav[data-atlas-scale-band], [data-mainline-a-workspace-navigation="v637"]';
    const topline = '[data-mainline-a-observation-topline="true"]';
    const passport = '[data-celestial-object-passport-open="true"], [data-atlas-camera-safe-occluder="passport"]';
    const footerBody = '[data-atlas-cinematic-hud="bottom-dock"]';
    const footer = `footer[data-bottom-control-bar="true"], ${footerBody}`;
    const selectors = `${navigation}, ${topline}, ${passport}, ${footer}, [data-atlas-camera-safe-occluder]`;
    const box = (node) => { const rect = node.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }; };
    const visible = (node) => {
      if (!node.isConnected || node.closest("[hidden]")) return false;
      for (let ancestor = node; ancestor; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        if (style.display === "none" || ["hidden", "collapse"].includes(style.visibility) || style.opacity === "0") return false;
      }
      const rect = box(node); return Object.values(rect).every(Number.isFinite) && rect.width > 0 && rect.height > 0;
    };
    const canvas = document.querySelector("canvas");
    const boundaries = [...new Set([...document.querySelectorAll(selectors)]
      .map((node) => node.matches(footerBody) ? node.closest("footer") ?? node : node))]
      .filter((node) => !node.contains(canvas) && !node.matches('[data-atlas-app-shell], [data-atlas-visual-profile-v294]') && visible(node));
    const occlusionMeasurement = canvas && visible(canvas) ? {
      source: "read-only-current-client-css-rectangles", canvas: box(canvas),
      viewport: { x: visualViewport?.offsetLeft ?? 0, y: visualViewport?.offsetTop ?? 0,
        width: visualViewport?.width ?? innerWidth, height: visualViewport?.height ?? innerHeight },
      blockers: boundaries.map((node) => ({ kind: node.matches(navigation) ? "navigation" : node.matches(topline) ? "topline"
        : node.matches(passport) ? "passport" : node.matches(`footer, ${footer}`) ? "footer" : "other", rect: box(node) })),
    } : null;
    // Inspect mounted labels, including hidden ones; visibility filtering could conceal an unremoved solar-system layer.
    const orbitAtlasLabelIds = [...document.querySelectorAll("[data-orbit-atlas-label]")]
      .map((node) => node.getAttribute("data-orbit-atlas-label"));
    return { scene, chart, occlusionMeasurement, orbitAtlasLabelIds };
  }, code);
  return { ...base, ...detail };
}

async function readJourney(page) {
  return page.locator(JOURNEY).evaluate((node) => {
    const shell = document.querySelector("[data-atlas-app-shell]");
    const attr = (name) => node.getAttribute(`data-mainline-a-journey-${name}`);
    return { index: Number(attr("index")), status: attr("status"), target: attr("target"), request: Number(attr("request")),
      selectedId: shell.getAttribute("data-celestial-catalog-selected-id"), bounds: node.getBoundingClientRect().toJSON(),
      viewport: [innerWidth, innerHeight], documentWidth: document.documentElement.scrollWidth,
      returnInPassport: node.getAttribute("data-mainline-a-journey-return-in-passport") === "true",
      passportBounds: document.querySelector('#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]')?.getBoundingClientRect().toJSON() ?? null,
      externalRouteOccluders: document.querySelectorAll('[data-atlas-camera-safe-occluder="observation-route"]').length,
      visibleLabels: [...document.querySelectorAll('[data-constellation-label-selected="true"], [data-mainline-a-constellation-anchor-label]')]
        .filter((label) => getComputedStyle(label).visibility === "visible" && getComputedStyle(label).display !== "none"
          && label.getBoundingClientRect().width > 0 && label.getBoundingClientRect().height > 0)
        .map((label) => ({ id: label.getAttribute("data-mainline-a-constellation-anchor-label") ?? label.getAttribute("data-constellation-label"),
          bounds: label.getBoundingClientRect().toJSON() })),
      safeOccluders: [...document.querySelectorAll("[data-atlas-camera-safe-occluder]")]
        .filter((element) => element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0)
        .map((element) => ({ role: element.getAttribute("data-atlas-camera-safe-occluder"), bounds: element.getBoundingClientRect().toJSON() })),
      controls: [...node.querySelectorAll("button")].map((button) => ({ text: button.textContent.trim(), disabled: button.disabled,
        width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })), text: node.textContent };
  });
}

async function absent(filename) {
  try { await access(filename); } catch (error) { if (error.code === "ENOENT") return; throw error; }
  throw new Error(`m4-browser:output-exists:${filename}`);
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

export async function captureM4(options) {
  const outputDir = options.outputDir ?? M4_OUTPUT;
  ensure(typeof outputDir === "string" && /^output\/playwright\/[a-zA-Z0-9-]+$/.test(outputDir), "invalid-output-directory");
  const outputRelative = options.scope === "journey-probe" ? `${outputDir}/probes/${options.runId}` : outputDir;
  const output = path.join(ROOT, outputRelative); await mkdir(output, { recursive: true });
  await absent(path.join(output, "receipt.json"));
  const attempt = path.join(output, "attempts", options.runId); await mkdir(attempt, { recursive: true });
  await exclusive(path.join(attempt, "started.json"), json({ at: new Date().toISOString(), ...options }));
  const receipt = { schema: "mainline-a-m4-browser-v1", runId: options.runId, scope: options.scope, status: "running", startedAt: new Date().toISOString(),
    items: [], journeys: [], errors: [], physicalDevice: false, claims: { humanVisualSignoff: false, publicReleaseApproved: false,
      copyrightApproval: false, scientificValidity: false, productionPerformance: false } };
  const published = []; let browser; let currentPage;
  const guard = createBrowserResourceGuard({ onStop: async () => { if (browser) await browser.close(); },
    onSample: async (sample, index) => exclusive(path.join(attempt, `resource-guard-${String(index).padStart(4, "0")}.json`), json(sample)) });
  receipt.resourceGuard = guard.evidence;
  async function record(page, item, name, observed, issues = []) {
    const bytes = await page.screenshot(); const filename = `${name}.png`;
    await exclusive(path.join(attempt, filename), bytes); published.push(filename);
    item.views.push({ name, observed, issues, screenshot: { path: `${outputRelative}/${filename}`,
      attemptPath: `${outputRelative}/attempts/${options.runId}/${filename}`, sha256: hash(bytes), bytes: bytes.length } });
    ensure(issues.length === 0, `${name}:${issues.join(",")}`);
  }
  try {
    await guard.check(); guard.start();
    const buildBytes = await readFile(options.buildReceipt); const build = JSON.parse(buildBytes); const input = await captureBuildInputs();
    receipt.build = validateM1Build(build, input, (await readFile(path.join(ROOT, build.distDir, "BUILD_ID"), "utf8")).trim());
    receipt.binding = { buildReceiptSha256: hash(buildBytes), sourceScope: "current-source-before-and-after" };
    const { chromium } = await import("playwright");
    const withCaseContext = createFreshBrowserCaseRunner({ chromium, options, receipt, guard, attempt,
      setBrowser: (owned) => { browser = owned; } });
    for (const [device, viewport] of options.scope === "journey-probe" ? [] : Object.entries(M1_VIEWPORTS)) {
      for (const code of M4_A12) {
        await withCaseContext(device + "-" + code, { viewport, deviceScaleFactor: 1,
          isMobile: device === "mobile", hasTouch: device === "mobile" }, async (context) => {
        try {
          const page = await context.newPage(); currentPage = page; page.setDefaultTimeout(20_000);
          const item = { device, code, errors: [], views: [] }; receipt.items.push(item);
          page.on("pageerror", (error) => item.errors.push({ type: "pageerror", message: error.message }));
          page.on("console", (message) => { if (message.type() === "error") item.errors.push({ type: "console", message: message.text() }); });
          await page.goto(options.origin, { waitUntil: "domcontentloaded" }); await page.locator("[data-atlas-app-shell]").waitFor();
          await selectScene(page, m4Scene(code));
          for (const mode of ["default", "comparison", "boundary"]) {
            const passport = page.locator('#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]');
            if (mode === "comparison") {
              if (device === "mobile") await passport.getByRole("button", { name: "查看摘要", exact: true }).press("Enter");
              await page.locator('#atlas-celestial-object-passport[data-mainline-a-passport-state="half"]').waitFor();
              const cameraStability = await waitForActualCameraStable(page, `constellation:${code}`);
              const observed = await readConstellation(page, code);
              item.preChart = { observed, cameraStability };
              ensure(inspectM4Constellation(observed, code, device === "mobile", "default").length === 0,
                `${device}:${code}:pre-chart-half-scene-not-ready`);
              await passport.getByRole("button", { name: "查看图鉴 / 比较", exact: true }).press("Enter");
            }
            if (mode === "boundary") await passport.getByRole("button", { name: "查看 IAU 边界", exact: true }).press("Enter");
            if (mode !== "default") await passport.locator(`[data-mainline-a-star-chart="${code}"] svg`).scrollIntoViewIfNeeded();
            const cameraStability = await waitForActualCameraStable(page, `constellation:${code}`);
            const observed = await readConstellation(page, code);
            observed.cameraStability = cameraStability;
            observed.sceneVisibility = inspectM4ChartOcclusion(observed, code, device === "mobile", mode, item.preChart?.observed);
            // The generic M1 check expects the comparison to remain collapsed; adapt that one state for this explicit comparison.
            const baseIssues = inspectM1Observation({ ...observed, artExpanded: "false" }, m4Scene(code), viewport, receipt.build, "after");
            const issues = [...baseIssues, ...inspectM4Constellation(observed, code, device === "mobile", mode, item.preChart?.observed)];
            if (observed.artExpanded !== String(mode !== "default")) issues.push("comparison-state-invalid");
            await record(page, item, `${device}-${code}-${mode}`, observed, issues);
          }
          await page.keyboard.press("Escape"); await page.locator('[data-mainline-a-passport-art-expanded="false"]').waitFor();
          const passport = page.locator('#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]');
          if (device === "mobile") await passport.getByRole("button", { name: "收起详情查看场景", exact: true }).press("Enter");
          else await page.keyboard.press("Escape");
          await page.locator(`#atlas-celestial-object-passport[data-mainline-a-passport-state="${device === "mobile" ? "collapsed" : "half"}"]`).waitFor();
          const cameraStability = await waitForActualCameraStable(page, `constellation:${code}`);
          const returned = await readConstellation(page, code);
          const validation = inspectM4ComparisonReturn(item.views[0].observed, returned, code, device === "mobile");
          item.comparisonReturn = { before: item.views[0].observed.camera, observed: returned, cameraStability, validation };
          if (!validation.ok) {
            const bytes = await page.screenshot(); const filename = `${device}-${code}-return-failure.png`;
            await exclusive(path.join(attempt, filename), bytes);
            item.comparisonReturn.failureScreenshot = { path: `${outputRelative}/attempts/${options.runId}/${filename}`,
              sha256: hash(bytes), bytes: bytes.length };
          }
          ensure(validation.ok, `${device}:${code}:comparison-return:${validation.issues.join(",")}`);
          ensure(item.errors.length === 0, `${device}:${code}:page-or-console-errors`);
          const filename = `${device}-${code}.json`; await exclusive(path.join(attempt, filename), json(item)); published.push(filename);
          console.log(JSON.stringify({ stage: "constellation-captured", device, code })); await page.close(); currentPage = null;
      } catch (error) {
        if (currentPage && !currentPage.isClosed()) await currentPage.screenshot()
          .then((bytes) => exclusive(path.join(attempt, "failure.png"), bytes)).catch(() => {});
        throw error;
      } finally { currentPage = null; }
        });
      }
    }
    await captureJourneys(withCaseContext, options, receipt, record, attempt, guard);
    ensure(receipt.journeys.length === (options.scope === "journey-probe" ? 1 : 4), "journey-matrix-incomplete");
    const after = await captureBuildInputs(); ensure(after.sha256 === input.sha256, "source-changed-during-run");
    await guard.check(); await guard.stop(); guard.assert();
    receipt.binding.sourceAfterSha256 = after.sha256;
    receipt.status = options.scope === "journey-probe" ? "passed-journey-probe-candidate-only" : "passed-constellations-and-journey-candidate-only";
    receipt.endedAt = new Date().toISOString(); await exclusive(path.join(attempt, "receipt.json"), json(receipt)); published.push("receipt.json");
    for (const filename of published) await copyFile(path.join(attempt, filename), path.join(output, filename), constants.COPYFILE_EXCL);
    return receipt;
  } catch (error) {
    receipt.status = "failed-attempt-preserved"; receipt.endedAt = new Date().toISOString(); receipt.errors.push({ message: error.message, stack: error.stack, cameraEvidence: error.cameraEvidence ?? null });
    await exclusive(path.join(attempt, "failure.json"), json(receipt)); throw error;
  } finally { await guard.stop(); if (browser) await browser.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const receipt = await captureM4(parseM4Options(process.argv.slice(2))); console.log(json({ status: receipt.status, items: receipt.items.length }));
}
