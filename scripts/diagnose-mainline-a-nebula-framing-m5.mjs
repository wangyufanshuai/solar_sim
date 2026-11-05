import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nebulaScene from "../app/lib/mainlineANebulaSceneV607.ts";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { observe, validateM1Build } from "./capture-mainline-a-m1-browser.mjs";
import { parseM5WebglOptions } from "./check-mainline-a-m5-webgl.mjs";
import { createBrowserResourceGuard } from "./mainline-a-browser-resource-guard.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { resolveMainlineANebulaSceneTargetV607 } = nebulaScene;
const options = parseM5WebglOptions(process.argv.slice(2));
const dir = path.join(ROOT, "output/playwright/mainline-a-m5-nebulae-20261015/diagnostics", options.runId);
const json = (value) => JSON.stringify(value, null, 2) + "\n";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const save = (name, value) => writeFile(path.join(dir, name), json(value), { flag: "wx" });
await mkdir(dir, { recursive: true });
await save("started.json", { ...options, at: new Date().toISOString() });
const receipt = { schema: "mainline-a-nebula-framing-diagnostic-v1", status: "running", startedAt: new Date().toISOString(),
  observations: [], errors: [], sourceEdited: false, stateInjected: false, humanSignoff: false };
let browser;
const guard = createBrowserResourceGuard({ onStop: async () => { await browser?.close(); },
  onSample: (sample, index) => save(`resource-${index}.json`, sample) });
receipt.resourceGuard = guard.evidence;
try {
  await guard.check(); guard.start();
  const input = await captureBuildInputs(); const bytes = await readFile(options.buildReceipt); const build = JSON.parse(bytes);
  receipt.build = validateM1Build(build, input, (await readFile(path.join(ROOT, build.distDir, "BUILD_ID"), "utf8")).trim());
  receipt.binding = { sourceBefore: input.sha256, buildReceiptSha256: hash(bytes), scriptSha256: hash(await readFile(fileURLToPath(import.meta.url))) };
  const { chromium } = await import("playwright");
  browser = await chromium.launch({ headless: true, executablePath: options.chrome });
  for (const id of ["m8", "m16", "m42"]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const page = await context.newPage(); page.setDefaultTimeout(20_000);
    const item = { id, worldAnchor: resolveMainlineANebulaSceneTargetV607(`nebula:${id}`).position, samples: [], errors: [] };
    receipt.observations.push(item);
    page.on("pageerror", (error) => item.errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") item.errors.push(message.text()); });
    try {
      await page.goto(options.origin, { waitUntil: "domcontentloaded" });
      await page.locator("[data-atlas-app-shell]").waitFor();
      await page.locator('button[aria-label="搜索"]').click();
      const catalog = page.locator("#universe-object-browser"); await catalog.waitFor();
      const sections = catalog.locator("button[aria-expanded]");
      for (let index = 0; index < await sections.count(); index++) {
        if (await sections.nth(index).getAttribute("aria-expanded") === "false") await sections.nth(index).press("Enter");
      }
      const selectedAt = Date.now();
      await catalog.locator(`[data-celestial-catalog-entry-id="nebula:${id}"]`).press("Enter");
      if (await catalog.count()) await catalog.getByRole("button", { name: "收起对象浏览器" }).press("Enter");
      await catalog.waitFor({ state: "detached" });
      for (const desiredMs of [1200, 4000]) {
        await page.waitForTimeout(Math.max(0, desiredMs - (Date.now() - selectedAt)));
        const observed = await observe(page);
        const pose = await page.locator("[data-atlas-browser-acceptance-version]").evaluate((node) => {
          const vector = (name) => node.getAttribute(`data-atlas-camera-actual-${name}`)?.split(",").map(Number) ?? null;
          const scalar = (name) => Number(node.getAttribute(`data-atlas-camera-actual-${name}`));
          const start = document.querySelector("[data-mainline-a-journey-start]");
          return { position: vector("position"), target: vector("target"), direction: vector("direction"), quaternion: vector("quaternion"),
            up: vector("up"), fov: scalar("fov"), zoom: scalar("zoom"), targetDistance: node.getAttribute("data-atlas-camera-target-distance"),
            startButtonPresent: Boolean(start), startButtonDisabled: start instanceof HTMLButtonElement ? start.disabled : null,
            cameraMarkers: Object.fromEntries([...node.attributes].filter((attribute) => attribute.name.startsWith("data-atlas-camera-")).map((attribute) => [attribute.name, attribute.value])) };
        });
        const delta = item.worldAnchor.map((value, index) => value - pose.position[index]);
        const depth = delta.reduce((sum, value, index) => sum + value * pose.direction[index], 0);
        const unitsPerPixel = 2 * depth * Math.tan(pose.fov * Math.PI / 360) / 720 / pose.zoom;
        const anchorTargetDistance = Math.hypot(...item.worldAnchor.map((value, index) => value - pose.target[index]));
        const screenshot = `${id}-${desiredMs}ms.png`; const image = await page.screenshot();
        await writeFile(path.join(dir, screenshot), image, { flag: "wx" });
        item.samples.push({ desiredMs, elapsedMs: Date.now() - selectedAt, observed, pose, calculated: { depth, unitsPerPixel, anchorTargetDistance,
          worldCapProjectedMaxEdge: 680 * 1.4 / unitsPerPixel }, screenshot, screenshotSha256: hash(image) });
      }
      await save(`${id}.json`, item);
    } finally { await context.close(); item.contextClosed = true; }
    guard.assert();
  }
  const after = await captureBuildInputs(); receipt.binding.sourceAfter = after.sha256;
  if (after.sha256 !== input.sha256) throw new Error("source-changed");
  await guard.check(); guard.assert(); receipt.status = "completed-read-only-diagnostic";
} catch (error) { receipt.status = guard.evidence.stopReason ? "resource-aborted" : "failed"; receipt.errors.push(error.message); }
finally { await guard.stop(); await browser?.close(); receipt.browserClosed = true; receipt.endedAt = new Date().toISOString(); await save("receipt.json", receipt); }
console.log(json({ status: receipt.status, errors: receipt.errors, cases: receipt.observations.map(({ id, samples }) => ({ id, samples: samples.map(({ desiredMs, calculated, pose }) => ({ desiredMs, calculated, pose })) })) }));
if (receipt.status !== "completed-read-only-diagnostic") process.exitCode = 1;
