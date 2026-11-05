import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createBrowserResourceGuard } from "./mainline-a-browser-resource-guard.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const ensure = (value, message) => { if (!value) throw new Error(`m5-gallery-browser:${message}`); };
const exclusive = (filename, value) => writeFile(filename, value, { flag: "wx" });

export function parseM5GalleryCheckOptions(args) {
  const options = { galleryDir: "output/playwright/mainline-a-m5-20261015", runId: null,
    chrome: "C:/Program Files/Google/Chrome/Application/chrome.exe" };
  const keys = { "--gallery-dir": "galleryDir", "--run-id": "runId", "--chrome": "chrome" }; const seen = new Set();
  for (let index = 0; index < args.length; index += 2) {
    const key = keys[args[index]]; ensure(key && args[index + 1] && !seen.has(key), "invalid-option");
    seen.add(key); options[key] = args[index + 1];
  }
  ensure(/^output\/playwright\/[a-zA-Z0-9-]+$/.test(options.galleryDir), "unsafe-gallery-directory");
  ensure(typeof options.runId === "string" && /^[a-zA-Z0-9-]+$/.test(options.runId), "run-id-required");
  return options;
}

export async function checkM5Gallery(options) {
  const directory = path.join(ROOT, options.galleryDir);
  const receiptPath = path.join(directory, "gallery-browser-check.json");
  try { await access(receiptPath); throw new Error("m5-gallery-browser:receipt-exists"); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const attemptRelative = `${options.galleryDir}/gallery-check-attempts/${options.runId}`;
  const attempt = path.join(ROOT, attemptRelative); await mkdir(attempt, { recursive: true });
  await exclusive(path.join(attempt, "started.json"), json({ ...options, startedAt: new Date().toISOString() }));
  const receipt = { schema: "mainline-a-m5-gallery-browser-v1", status: "running", runId: options.runId,
    method: "offline HTML in actual Chromium; UI clicks and read-only DOM observations", items: [],
    claims: { applicationRetested: false, physicalDevice: false, humanVisualSignoff: false, longRunPassed: false, publicReleaseApproved: false } };
  let browser;
  const guard = createBrowserResourceGuard({ onStop: async () => { if (browser) await browser.close(); },
    onSample: async (sample, index) => exclusive(path.join(attempt, `resource-guard-${String(index).padStart(4, "0")}.json`), json(sample)) });
  receipt.resourceGuard = guard.evidence;
  try {
    const manifestBytes = await readFile(path.join(directory, "gallery-manifest.json")); const manifest = JSON.parse(manifestBytes);
    ensure(manifest.schema === "mainline-a-m5-gallery-v1" && manifest.matrix.objects === 36 && manifest.matrix.deviceGroups === 72, "incomplete-gallery-manifest");
    const htmlBytes = await readFile(path.join(directory, "gallery.html"));
    ensure(hash(htmlBytes) === manifest.gallery.sha256 && htmlBytes.length === manifest.gallery.bytes, "html-sha-mismatch");
    receipt.binding = { build: manifest.matrix.build, gallerySha256: hash(htmlBytes), manifestSha256: hash(manifestBytes) };
    await guard.check(); guard.start();
    const { chromium } = await import("playwright");
    guard.assert();
    browser = await chromium.launch({ headless: true, executablePath: options.chrome });
    guard.assert();
    for (const [device, viewport] of Object.entries({ desktop: { width: 1280, height: 720 }, mobile: { width: 390, height: 844 } })) {
      guard.assert();
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: device === "mobile", hasTouch: device === "mobile" });
      const page = await context.newPage(); page.setDefaultTimeout(15_000);
      const item = { device, viewport, errors: [], loadedImages: [], clickedImages: [], details: [], screenshots: [] }; receipt.items.push(item);
      page.on("pageerror", (error) => item.errors.push({ type: "pageerror", message: error.message }));
      page.on("console", (message) => { if (message.type() === "error") item.errors.push({ type: "console", message: message.text() }); });
      const screenshot = async (state) => {
        const bytes = await page.screenshot(); const filename = `${device}-${state}.png`;
        await exclusive(path.join(attempt, filename), bytes);
        item.screenshots.push({ state, path: `${attemptRelative}/${filename}`, sha256: hash(bytes), bytes: bytes.length });
      };
      const layout = async () => {
        const result = await page.evaluate(() => ({ viewport: [innerWidth, innerHeight], width: document.documentElement.scrollWidth }));
        ensure(result.viewport[0] === viewport.width && result.width <= viewport.width, `${device}:page-overflow`); return result;
      };
      try {
        await page.goto(pathToFileURL(path.join(directory, "gallery.html")).href, { waitUntil: "load" });
        item.initialLayout = await layout(); await screenshot("overview");
        const images = page.locator("img"); ensure(await images.count() === 12, "featured-image-roster");
        for (let index = 0; index < 12; index++) {
          const image = images.nth(index); await image.scrollIntoViewIfNeeded();
          await image.evaluate((node) => node.decode());
          const observed = await image.evaluate((node) => ({ href: node.getAttribute("src"), complete: node.complete,
            width: node.naturalWidth, height: node.naturalHeight }));
          const expected = manifest.images.find((entry) => entry.href === observed.href);
          ensure(expected && observed.complete && observed.width === expected.width && observed.height === expected.height, "image-natural-dimensions");
          item.loadedImages.push(observed);
        }
        const details = page.locator("details");
        for (let index = 0; index < await details.count(); index++) {
          const section = details.nth(index); const summary = section.locator("summary");
          await summary.press("Enter"); ensure(await section.getAttribute("open") !== null, "details-did-not-open");
          await layout(); if (index === 0) await screenshot("expanded");
          await summary.press("Enter"); ensure(await section.getAttribute("open") === null, "details-did-not-close");
          item.details.push({ label: await summary.textContent(), openThenClosed: true });
        }
        // Six real default-view links, one desktop image for each featured object.
        for (let index = 0; index < 6; index++) {
          const link = page.locator(".pair figure:first-child > a").nth(index);
          const relative = await link.getAttribute("href"); const expected = manifest.images.find((entry) => entry.href === relative);
          await link.click(); await page.waitForURL((url) => url.pathname.endsWith(".png"));
          const natural = await page.locator("img").evaluate((node) => ({ complete: node.complete, width: node.naturalWidth, height: node.naturalHeight }));
          ensure(natural.complete && natural.width === expected.width && natural.height === expected.height, "clicked-original-not-loaded");
          item.clickedImages.push({ href: relative, ...natural }); await page.goBack({ waitUntil: "load" });
        }
        item.finalLayout = await layout(); ensure(item.errors.length === 0, "gallery-console-or-page-errors");
      } catch (error) {
        await page.screenshot().then((bytes) => exclusive(path.join(attempt, `${device}-failure.png`), bytes)).catch(() => {}); throw error;
      } finally { await context.close(); }
    }
    await guard.check(); await guard.stop(); guard.assert();
    receipt.status = "passed-offline-gallery-desktop-mobile-candidate-only"; receipt.endedAt = new Date().toISOString();
    await exclusive(path.join(attempt, "receipt.json"), json(receipt)); await exclusive(receiptPath, json(receipt)); return receipt;
  } catch (error) {
    receipt.status = "failed-attempt-preserved"; receipt.error = error.message; receipt.endedAt = new Date().toISOString();
    await exclusive(path.join(attempt, "failure.json"), json(receipt)); throw error;
  } finally { await guard.stop(); if (browser) await browser.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const receipt = await checkM5Gallery(parseM5GalleryCheckOptions(process.argv.slice(2))); console.log(json({ status: receipt.status, items: receipt.items.length }));
}
