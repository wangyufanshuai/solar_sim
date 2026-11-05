import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { parseM1Options, selectScene, validateM1Build } from "./capture-mainline-a-m1-browser.mjs";
import { compareM4CameraPose, m4Scene, readConstellation } from "./capture-mainline-a-m4-browser.mjs";
import { createBrowserResourceGuard } from "./mainline-a-browser-resource-guard.mjs";
import { waitForActualCameraStable } from "./mainline-a-browser-camera-observation.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const exclusive = (filename, value) => writeFile(filename, value, { flag: "wx" });
const ensure = (value, message) => { if (!value) throw new Error(`m4-mobile-diagnostic:${message}`); };

async function diagnose(options) {
  ensure(options.phase === "after", "after-required");
  const directory = `output/playwright/mainline-a-m4-20261015/diagnostics/${options.runId}`;
  const absolute = path.join(ROOT, directory); await mkdir(absolute, { recursive: true });
  await exclusive(path.join(absolute, "started.json"), json({ ...options, at: new Date().toISOString() }));
  const receipt = { schema: "mainline-a-m4-mobile-viewport-diagnostic-v1", runId: options.runId, status: "running", states: [], errors: [],
    claims: { diagnosticOnly: true, fullM4Passed: false, humanVisualSignoff: false, scientificPayloadWriteback: false, publicReleaseApproved: false } };
  let browser; let page;
  const guard = createBrowserResourceGuard({ onStop: async () => { if (browser) await browser.close(); },
    onSample: (sample, index) => exclusive(path.join(absolute, `resource-guard-${index}.json`), json(sample)) });
  receipt.resourceGuard = guard.evidence;
  try {
    const buildBytes = await readFile(options.buildReceipt); const build = JSON.parse(buildBytes); const input = await captureBuildInputs();
    receipt.build = validateM1Build(build, input, (await readFile(path.join(ROOT, build.distDir, "BUILD_ID"), "utf8")).trim());
    receipt.binding = { buildReceiptSha256: sha(buildBytes), sourceScope: "current-source-before-and-after" };
    await guard.check(); guard.start();
    const { chromium } = await import("playwright"); browser = await chromium.launch({ headless: true, executablePath: options.chrome });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    page = await context.newPage(); page.setDefaultTimeout(20_000);
    page.on("pageerror", (error) => receipt.errors.push({ type: "pageerror", message: error.message }));
    page.on("console", (message) => { if (message.type() === "error") receipt.errors.push({ type: "console", message: message.text() }); });
    await page.goto(options.origin, { waitUntil: "domcontentloaded" }); await selectScene(page, m4Scene("Ori"));
    const record = async (state) => {
      const stability = await waitForActualCameraStable(page, "constellation:Ori");
      const observed = await readConstellation(page, "Ori");
      const viewportEvidence = await page.evaluate(() => ({
        root: Object.fromEntries([...document.querySelector("[data-atlas-app-shell]").attributes]
          .filter((attribute) => /viewport|safe|camera-focus/.test(attribute.name)).map((attribute) => [attribute.name, attribute.value])),
        occluders: [...document.querySelectorAll("[data-atlas-camera-safe-occluder]")].map((node) => ({
          role: node.getAttribute("data-atlas-camera-safe-occluder"), rect: node.getBoundingClientRect().toJSON(),
          display: getComputedStyle(node).display, visibility: getComputedStyle(node).visibility })),
      }));
      const bytes = await page.screenshot(); const filename = `${state}.png`; await exclusive(path.join(absolute, filename), bytes);
      receipt.states.push({ state, stability, observed, viewportEvidence,
        screenshot: { path: `${directory}/${filename}`, sha256: sha(bytes), bytes: bytes.length } });
      await exclusive(path.join(absolute, `${state}.json`), json(receipt.states.at(-1)));
    };
    await record("01-default");
    const passport = page.locator('#atlas-celestial-object-passport[data-celestial-object-passport-open="true"]');
    await passport.getByRole("button", { name: "查看摘要", exact: true }).press("Enter");
    await passport.getByRole("button", { name: "查看图鉴 / 比较", exact: true }).press("Enter");
    await passport.locator('[data-mainline-a-star-chart="Ori"] svg').scrollIntoViewIfNeeded();
    await record("02-comparison-full");
    await passport.getByRole("button", { name: "收起图鉴，继续看场景", exact: true }).press("Enter");
    await record("03-comparison-closed");
    await passport.getByRole("button", { name: "收起详情查看场景", exact: true }).press("Enter");
    await record("04-passport-collapsed");
    // Leave time for any delayed invalidation after returning to the same normal UI layout.
    await page.waitForTimeout(1_200); await record("05-restored-default");
    const initial = receipt.states[0].observed; const final = receipt.states.at(-1).observed;
    receipt.recovery = { initialDistance: initial.camera.targetDistance, finalDistance: final.camera.targetDistance,
      initialSceneState: initial.scene.state, finalSceneState: final.scene.state,
      selectedIdPreserved: final.selectedId === initial.selectedId,
      actualPoseEqual: compareM4CameraPose(initial.camera, final.camera),
      artClosed: final.artExpanded === "false", passportState: final.passportState };
    const after = await captureBuildInputs(); ensure(after.sha256 === input.sha256, "source-changed"); receipt.binding.sourceAfterSha256 = after.sha256;
    await guard.check(); await guard.stop(); guard.assert();
    receipt.status = "completed-diagnostic-only"; receipt.endedAt = new Date().toISOString();
    await exclusive(path.join(absolute, "receipt.json"), json(receipt)); return receipt;
  } catch (error) {
    receipt.status = "failed-diagnostic-preserved"; receipt.error = error.message; receipt.cameraEvidence = error.cameraEvidence ?? null;
    if (page && !page.isClosed()) await page.screenshot().then((bytes) => exclusive(path.join(absolute, "failure.png"), bytes)).catch(() => {});
    await exclusive(path.join(absolute, "failure.json"), json(receipt)); throw error;
  } finally { await guard.stop(); if (browser) await browser.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const receipt = await diagnose(parseM1Options(process.argv.slice(2))); console.log(json({ status: receipt.status, recovery: receipt.recovery }));
}
