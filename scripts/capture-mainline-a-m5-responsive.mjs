import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { M1_SCENES, inspectM1Observation, observe, parseM1Options, selectScene, validateM1Build } from "./capture-mainline-a-m1-browser.mjs";
import { inspectM2Observation } from "./capture-mainline-a-m2-browser.mjs";
import { inspectM4Constellation, readConstellation } from "./capture-mainline-a-m4-browser.mjs";
import { readNebulaDisplayObservation, waitForActualCameraStable } from "./mainline-a-browser-camera-observation.mjs";
import { createBrowserResourceGuard } from "./mainline-a-browser-resource-guard.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = "output/playwright/mainline-a-m5-responsive-20261015";
const PROFILES = [
  { id: "wide-1440", width: 1440, height: 900 },
  { id: "intermediate-768", width: 768, height: 1024 },
  { id: "mobile-430", width: 430, height: 932 },
];
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const exclusive = (filename, value) => writeFile(filename, value, { flag: "wx" });
const ensure = (condition, message) => { if (!condition) throw new Error(`m5-responsive:${message}`); };

export function parseM5ResponsiveOptions(args) {
  const outputIndex = args.indexOf("--output-dir");
  ensure(outputIndex < 0 || args.lastIndexOf("--output-dir") === outputIndex, "duplicate-output-directory");
  const outputDir = outputIndex < 0 ? OUTPUT : args[outputIndex + 1];
  ensure(typeof outputDir === "string" && /^output\/playwright\/[a-zA-Z0-9-]+$/.test(outputDir), "invalid-output-directory");
  const options = parseM1Options(outputIndex < 0 ? args : [...args.slice(0, outputIndex), ...args.slice(outputIndex + 2)]);
  ensure(options.phase === "after", "after-required");
  return { ...options, outputDir };
}

async function waitForToplineLayoutStable(page) {
  await page.locator('[data-atlas-cinematic-hud="orbit-atlas-topline"]').waitFor({ state: "visible" });
  return page.evaluate(async () => {
    await document.fonts.ready;
    const started = performance.now(); let previous = ""; let stableSince = started;
    while (performance.now() - started < 8000) {
      await new Promise(requestAnimationFrame);
      const signature = JSON.stringify([...document.querySelectorAll(
        '[data-mainline-a-observation-topline], [data-atlas-cinematic-hud="orbit-atlas-topline"], [data-mainline-a-workspace-navigation], aside#atlas-celestial-object-passport',
      )].map((node) => ({ rect: node.getBoundingClientRect().toJSON(), display: getComputedStyle(node).display,
        placement: node.getAttribute("data-mainline-a-topline-placement") })));
      const now = performance.now();
      if (signature !== previous) { previous = signature; stableSince = now; }
      else if (now - stableSince >= 150) return { status: "actual-topline-layout-stable", stableMs: now - stableSince, elapsedMs: now - started };
    }
    throw new Error("m5-responsive:topline-layout-not-stable");
  });
}

/** Measure painted badge/text boxes, never the potentially full-width transparent wrapper. */
export async function readResponsiveTopline(page) {
  const stability = await waitForToplineLayoutStable(page);
  const measured = await page.evaluate(() => {
    const root = document.querySelector('[data-mainline-a-observation-topline="true"]');
    const badge = root?.querySelector('[data-atlas-cinematic-hud="orbit-atlas-topline"]');
    const rect = (r) => ({ x: r.left, y: r.top, left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
    const viewport = { left: 0, top: 0, right: innerWidth, bottom: innerHeight, width: innerWidth, height: innerHeight };
    const visible = (node) => {
      if (!node?.isConnected || node.closest("[hidden]")) return false;
      for (let p = node; p; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (s.display === "none" || ["hidden", "collapse"].includes(s.visibility) || Number(s.opacity) === 0) return false;
      }
      const r = node.getBoundingClientRect(); return r.width > 0 && r.height > 0;
    };
    const clipped = (node, bounds) => {
      const box = { left: Math.max(0, bounds.left), top: Math.max(0, bounds.top), right: Math.min(innerWidth, bounds.right), bottom: Math.min(innerHeight, bounds.bottom) };
      const overflowAncestors = [];
      for (let p = node; p; p = p.parentElement) {
        const s = getComputedStyle(p); const r = p.getBoundingClientRect();
        const clipX = /^(auto|scroll|hidden|clip)$/.test(s.overflowX); const clipY = /^(auto|scroll|hidden|clip)$/.test(s.overflowY);
        if (clipX || clipY) {
          overflowAncestors.push({ tag: p.tagName, id: p.id || null, bounds: rect(r), overflowX: s.overflowX, overflowY: s.overflowY, clientWidth: p.clientWidth, scrollWidth: p.scrollWidth });
          if (clipX) { box.left = Math.max(box.left, r.left); box.right = Math.min(box.right, r.right); }
          if (clipY) { box.top = Math.max(box.top, r.top); box.bottom = Math.min(box.bottom, r.bottom); }
        }
      }
      return { bounds: box, overflowAncestors, clipped: box.left > bounds.left + 1 || box.top > bounds.top + 1 || box.right < bounds.right - 1 || box.bottom < bounds.bottom - 1 };
    };
    const content = [];
    if (visible(badge)) {
      const bounds = rect(badge.getBoundingClientRect()); const clip = clipped(badge.parentElement, bounds);
      content.push({ kind: "badge", bounds, visibleBounds: clip.bounds, clipped: clip.clipped, overflowAncestors: clip.overflowAncestors });
    }
    if (root) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent.trim() || !visible(node.parentElement)) continue;
        const range = document.createRange(); range.selectNodeContents(node);
        for (const r of range.getClientRects()) if (r.width > 0 && r.height > 0) {
          const bounds = rect(r); const clip = clipped(node.parentElement, bounds);
          content.push({ kind: "text", text: node.textContent.trim(), bounds, visibleBounds: clip.bounds, clipped: clip.clipped, overflowAncestors: clip.overflowAncestors });
        }
      }
    }
    const selectors = [
      ['passport', 'aside#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]'],
      ['passport-reopen-chip', 'div[data-celestial-object-passport-collapsed="true"][aria-label="当前聚焦天体"]'],
      ['header-scale', '[data-mainline-a-workspace-navigation] > nav'],
      ['header-tools', '[data-mainline-a-workspace-navigation] [aria-label="图集与工具"], [data-mainline-a-workspace-navigation] [aria-label="更多图集工具"]'],
      ['workbench', '[data-mainline-a-relativity-launcher="true"]'],
      ['dock', '[data-atlas-cinematic-hud="bottom-dock"]'],
      ['safe-occluder', '[data-atlas-camera-safe-occluder]'],
    ];
    const seen = new Set(); const occluders = [];
    for (const [kind, selector] of selectors) for (const node of document.querySelectorAll(selector)) {
      if (seen.has(node) || !visible(node) || root?.contains(node) || node.contains(root) || node.contains(document.querySelector("canvas"))) continue;
      seen.add(node); const bounds = rect(node.getBoundingClientRect()); const clip = clipped(node.parentElement, bounds);
      occluders.push({ kind, bounds, visibleBounds: clip.bounds, zIndex: getComputedStyle(node).zIndex });
    }
    const intersections = [];
    content.forEach((part, index) => {
      for (const blocker of occluders) {
        const a = part.visibleBounds ?? part.bounds; const b = blocker.visibleBounds;
        const width = Math.min(a.right, b.right) - Math.max(a.left, b.left); const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (width > 1 && height > 1) intersections.push({ contentIndex: index, kind: part.kind, text: part.text ?? null, occluder: blocker.kind, width, height, area: width * height });
      }
    });
    return { source: "actual-current-DOM-badge-and-visible-text-client-rectangles", viewport,
      selectedId: document.querySelector("[data-atlas-app-shell]")?.getAttribute("data-celestial-catalog-selected-id") ?? null,
      // The app shell also publishes a passport-open aggregate; only the actual aside proves panel visibility.
      passportOpen: [...document.querySelectorAll('aside#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]')].some(visible),
      containerBounds: root ? rect(root.getBoundingClientRect()) : null, placement: root?.getAttribute("data-mainline-a-topline-placement") ?? null,
      badgeVisible: visible(badge),
      badgeBounds: badge ? rect(badge.getBoundingClientRect()) : null,
      badgeOverflow: badge ? { clientWidth: badge.clientWidth, scrollWidth: badge.scrollWidth, clientHeight: badge.clientHeight, scrollHeight: badge.scrollHeight } : null,
      content, occluders, intersections, documentWidth: document.documentElement.scrollWidth };
  });
  return { ...measured, stability };
}

export function inspectResponsiveTopline(view, { centered = false, passportOpen, unselected = false } = {}) {
  const issues = [];
  if (!view.badgeVisible || !view.content.some((part) => part.kind === "text" && part.text === "轨道图谱")) issues.push("topline-badge-or-title-not-visible");
  if (!view.content.some((part) => part.kind === "text" && /^(GAIA DR3|PLACEHOLDER)$/.test(part.text))) issues.push("topline-catalog-label-not-visible");
  const explanationVisible = view.content.some((part) => part.kind === "text" && part.text.includes("轨道图层仅用于可视化呈现"));
  if (explanationVisible !== (view.viewport.width >= 640)) issues.push("topline-responsive-explanation-visibility");
  if (view.content.some((part) => part.clipped)) issues.push("topline-content-clipped-by-viewport-or-overflow");
  if (view.badgeOverflow && (view.badgeOverflow.scrollWidth > view.badgeOverflow.clientWidth + 1 || view.badgeOverflow.scrollHeight > view.badgeOverflow.clientHeight + 1)) issues.push("topline-badge-overflow");
  if (view.intersections.length) issues.push(...[...new Set(view.intersections.map((hit) => `topline-overlaps-${hit.occluder}`))]);
  if (view.documentWidth > view.viewport.width + 1) issues.push("topline-document-horizontal-overflow");
  if (centered && (!view.badgeBounds || Math.abs((view.badgeBounds.left + view.badgeBounds.right) / 2 - view.viewport.width / 2) > 2)) issues.push("topline-not-centered-without-passport");
  if (passportOpen !== undefined && view.passportOpen !== passportOpen) issues.push("topline-unexpected-passport-state");
  if (view.placement !== (view.passportOpen && view.viewport.width >= 640 ? "side-panel-safe" : "viewport-centered")) issues.push("topline-placement-state-mismatch");
  if (unselected && view.selectedId && view.selectedId !== "none") issues.push("topline-initial-object-already-selected");
  return issues;
}

async function captureToplineSupplement(page, stage, profile, item, attempt, relative) {
  const observed = await readResponsiveTopline(page);
  const issues = inspectResponsiveTopline(observed, { centered: true, passportOpen: false, unselected: stage === "unselected" });
  const filename = `${profile.id}-topline-${stage}.png`; const bytes = await page.screenshot();
  await exclusive(path.join(attempt, filename), bytes);
  const evidence = { stage, observed, issues, screenshot: { path: `${relative}/${filename}`, sha256: sha(bytes), bytes: bytes.length } };
  item.toplineSupplement ??= {}; item.toplineSupplement[stage] = evidence;
  await exclusive(path.join(attempt, `${profile.id}-topline-${stage}.json`), json(evidence));
  ensure(issues.length === 0, `${profile.id}:topline-${stage}:${issues.join(",")}`);
}

export async function captureM5Responsive(options) {
  const outputDir = options.outputDir ?? OUTPUT;
  ensure(typeof outputDir === "string" && /^output\/playwright\/[a-zA-Z0-9-]+$/.test(outputDir), "invalid-output-directory");
  ensure(options.phase === "after", "after-required");
  const output = path.join(ROOT, outputDir);
  const finalReceipt = path.join(output, "receipt.json");
  try { await access(finalReceipt); throw new Error("m5-responsive:receipt-exists"); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const relative = `${outputDir}/attempts/${options.runId}`; const attempt = path.join(ROOT, relative);
  await mkdir(attempt, { recursive: true });
  await exclusive(path.join(attempt, "started.json"), json({ ...options, actualOutputDir: outputDir, at: new Date().toISOString() }));
  const receipt = { schema: "mainline-a-m5-responsive-supplement-v1", runId: options.runId, status: "running", items: [],
    browserStrategy: "one-owned-browser-per-object-serial-close-before-next-launch", browserLifecycles: [],
    physicalDevice: false, scope: "nine-supplementary-default-layout-views-plus-six-topline-transition-views; not-part-of-the-canonical-306-image-matrix",
    claims: { humanVisualSignoff: false, publicReleaseApproved: false, copyrightApproval: false,
      scientificValidity: false, productionPerformance: false, canonicalMatrixReplacement: false } };
  let activeBrowser; let currentPage;
  const closeOwnedBrowser = async (owner, reason) => {
    if (!owner) return;
    if (!owner.evidence.closeRequestedBy.includes(reason)) owner.evidence.closeRequestedBy.push(reason);
    owner.closePromise ??= (async () => {
      owner.evidence.closeStartedAt = new Date().toISOString();
      try { await owner.browser.close(); owner.evidence.closedAfterAwait = true; }
      catch (error) { owner.evidence.closeError = error.message; throw error; }
      finally {
        owner.evidence.closeEndedAt = new Date().toISOString();
        owner.evidence.browserConnectedAfterClose = owner.browser.isConnected();
        if (!owner.evidence.browserConnectedAfterClose && activeBrowser === owner) activeBrowser = null;
      }
    })();
    await owner.closePromise;
  };
  const guard = createBrowserResourceGuard({ onStop: async () => {
    const owner = activeBrowser; // Snapshot the owned launch; never close another case or enumerate processes.
    if (owner) await closeOwnedBrowser(owner, "resource-guard");
  },
    onSample: (sample, index) => exclusive(path.join(attempt, `resource-guard-${index}.json`), json(sample)) });
  receipt.resourceGuard = guard.evidence;
  try {
    const buildBytes = await readFile(options.buildReceipt); const build = JSON.parse(buildBytes); const input = await captureBuildInputs();
    receipt.build = validateM1Build(build, input, (await readFile(path.join(ROOT, build.distDir, "BUILD_ID"), "utf8")).trim());
    receipt.binding = { buildReceiptSha256: sha(buildBytes), sourceScope: "current-source-before-and-after" };
    await guard.check(); guard.start();
    const { chromium } = await import("playwright");
    guard.assert();
    for (const profile of PROFILES) {
      const mobile = profile.width < 640; const viewport = { width: profile.width, height: profile.height };
      for (const scene of M1_SCENES) {
        guard.assert();
        ensure(!activeBrowser, "previous-owned-browser-not-closed");
        await guard.check();
        const item = { profile: profile.id, viewport, isMobile: mobile, name: scene.name, selectedId: scene.selectedId, errors: [] };
        item.browserLaunchId = `${options.runId}-${profile.id}-${scene.name}`;
        item.browserLifecycle = { browserLaunchId: item.browserLaunchId, executablePath: options.chrome,
          launchRequestedAt: new Date().toISOString(), launched: false, contextCreated: false,
          contextClosedAfterAwait: false, closedAfterAwait: false, closeRequestedBy: [] };
        receipt.browserLifecycles.push(item.browserLifecycle);
        receipt.items.push(item);
        let owner; let context; let caseError;
        try {
          guard.assert();
          const browser = await chromium.launch({ headless: true, executablePath: options.chrome });
          owner = { browser, evidence: item.browserLifecycle, closePromise: null }; activeBrowser = owner;
          Object.assign(item.browserLifecycle, { launched: true, launchedAt: new Date().toISOString(), browserConnectedAfterLaunch: browser.isConnected() });
          guard.assert();
          context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
          item.browserLifecycle.contextCreated = true;
          const page = await context.newPage(); currentPage = page; page.setDefaultTimeout(20_000);
          page.on("pageerror", (error) => item.errors.push({ type: "pageerror", message: error.message }));
          page.on("console", (message) => { if (message.type() === "error") item.errors.push({ type: "console", message: message.text() }); });
          await page.goto(options.origin, { waitUntil: "domcontentloaded" }); await page.locator("[data-atlas-app-shell]").waitFor();
          if (scene.name === "sirius-a") await captureToplineSupplement(page, "unselected", profile, item, attempt, relative);
          await selectScene(page, scene); item.cameraStability = await waitForActualCameraStable(page, scene.selectedId);
          const observed = scene.kind === "constellation" ? await readConstellation(page, scene.id) : await observe(page);
          item.observed = observed; item.issues = inspectM1Observation(observed, scene, viewport, receipt.build, "after");
          if (observed.passportState !== (mobile ? "collapsed" : "half")) item.issues.push("default-responsive-passport-state");
          if (scene.kind === "star") {
            Object.assign(observed, await page.evaluate((id) => {
              const proxy = document.querySelector(`[data-stellar-hero-id="${id}"]`);
              return { proxy: proxy ? Object.fromEntries([...proxy.attributes].filter((attr) => attr.name.startsWith("data-")).map((attr) => [attr.name, attr.value])) : null,
                card: document.querySelector(`[data-mainline-a-stellar-portrait="${id}"]`) ? { present: true } : null };
            }, scene.id));
            item.issues.push(...inspectM2Observation(observed, scene.id, viewport, receipt.build, "after", "default"));
          } else if (scene.kind === "constellation") {
            observed.qualityTier = await page.locator("[data-atlas-app-shell]").getAttribute("data-mainline-a-constellation-quality-tier");
            item.issues.push(...inspectM4Constellation(observed, scene.id, mobile || observed.qualityTier === "mobile", "default"));
          } else {
            item.display = await readNebulaDisplayObservation(page, scene.id);
            const caption = item.display.captionBounds;
            if (!caption || caption.width <= 0 || caption.height <= 0 || caption.left < -1 || caption.top < -1
              || caption.right > viewport.width + 1 || caption.bottom > viewport.height + 1) item.issues.push("nebula-caption-outside-viewport");
          }
          item.topline = await readResponsiveTopline(page);
          item.issues.push(...inspectResponsiveTopline(item.topline, { passportOpen: true }));
          const bytes = await page.screenshot(); const filename = `${profile.id}-${scene.name}-default.png`;
          await exclusive(path.join(attempt, filename), bytes);
          item.screenshot = { path: `${relative}/${filename}`, sha256: sha(bytes), bytes: bytes.length };
          ensure(item.issues.length === 0 && item.errors.length === 0, `${profile.id}:${scene.name}:${item.issues.join(",") || "browser-errors"}`);
          if (scene.name === "sirius-a") {
            const passport = page.locator('aside#atlas-celestial-object-passport');
            await passport.getByRole("button", { name: "关闭天体档案", exact: true }).click();
            await passport.waitFor({ state: "hidden" });
            await captureToplineSupplement(page, "passport-closed", profile, item, attempt, relative);
          }
          console.log(JSON.stringify({ stage: "responsive-captured", profile: profile.id, object: scene.name }));
        } catch (error) {
          caseError = error;
          item.error = { message: error.message };
          if (currentPage && !currentPage.isClosed()) await currentPage.screenshot().then(async (bytes) => {
            const filename = `${profile.id}-${scene.name}-failure.png`; await exclusive(path.join(attempt, filename), bytes);
            item.failureScreenshot = { path: `${relative}/${filename}`, sha256: sha(bytes), bytes: bytes.length };
          }).catch(() => {});
          throw error;
        } finally {
          const cleanupErrors = [];
          try {
            if (context) { await context.close(); item.browserLifecycle.contextClosedAfterAwait = true; }
          } catch (error) { cleanupErrors.push(`context-close:${error.message}`); }
          finally {
            try { await closeOwnedBrowser(owner, "case-finally"); }
            catch (error) { cleanupErrors.push(`browser-close:${error.message}`); }
            currentPage = null;
          }
          item.browserLifecycle.cleanupErrors = cleanupErrors;
          await exclusive(path.join(attempt, `${profile.id}-${scene.name}-browser-closure.json`), json(item.browserLifecycle));
          await exclusive(path.join(attempt, `${profile.id}-${scene.name}.json`), json(item));
          if (!caseError) {
            ensure(cleanupErrors.length === 0 && item.browserLifecycle.closedAfterAwait
              && item.browserLifecycle.browserConnectedAfterClose === false, `${profile.id}:${scene.name}:owned-browser-cleanup-failed`);
          }
        }
      }
    }
    ensure(receipt.items.length === 9, "incomplete-nine-view-matrix");
    ensure(receipt.browserLifecycles.length === 9 && receipt.browserLifecycles.every((entry) => entry.launched
      && entry.contextClosedAfterAwait && entry.closedAfterAwait && entry.browserConnectedAfterClose === false), "incomplete-nine-owned-browser-closures");
    receipt.imageCounts = { defaults: receipt.items.filter((item) => item.screenshot).length,
      toplineSupplement: receipt.items.reduce((sum, item) => sum + Object.keys(item.toplineSupplement ?? {}).length, 0) };
    ensure(receipt.imageCounts.defaults === 9 && receipt.imageCounts.toplineSupplement === 6, "incomplete-topline-transition-evidence");
    const after = await captureBuildInputs(); ensure(after.sha256 === input.sha256, "source-changed-during-run");
    receipt.binding.sourceAfterSha256 = after.sha256;
    await guard.check(); await guard.stop(); guard.assert();
    receipt.status = "passed-nine-supplementary-responsive-views-candidate-only"; receipt.endedAt = new Date().toISOString();
    await exclusive(path.join(attempt, "receipt.json"), json(receipt)); await exclusive(finalReceipt, json(receipt)); return receipt;
  } catch (error) {
    receipt.status = "failed-attempt-preserved"; receipt.endedAt = new Date().toISOString();
    receipt.error = { message: error.message, stack: error.stack, cameraEvidence: error.cameraEvidence ?? null };
    if (currentPage && !currentPage.isClosed()) await currentPage.screenshot()
      .then((bytes) => exclusive(path.join(attempt, "failure.png"), bytes)).catch(() => {});
    await exclusive(path.join(attempt, "failure.json"), json(receipt)); throw error;
  } finally {
    await guard.stop();
    try { if (activeBrowser) await closeOwnedBrowser(activeBrowser, "capture-finally"); }
    finally {
      await exclusive(path.join(attempt, "browser-closure.json"), json({ at: new Date().toISOString(),
        strategy: receipt.browserStrategy, launches: receipt.browserLifecycles,
        browserConnected: Boolean(activeBrowser?.browser.isConnected()),
        closedAfterAwait: receipt.browserLifecycles.some((entry) => entry.launched)
          ? receipt.browserLifecycles.filter((entry) => entry.launched)
            .every((entry) => entry.closedAfterAwait && entry.browserConnectedAfterClose === false) : null }));
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const receipt = await captureM5Responsive(parseM5ResponsiveOptions(process.argv.slice(2))); console.log(json({ status: receipt.status, images: receipt.imageCounts }));
}
