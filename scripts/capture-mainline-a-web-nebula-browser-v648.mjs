import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD_PATH = "docs/release/v607/mainline-a-r66-build-20261007-v648web01.json";
const runIndex = process.argv.indexOf("--run");
const RUN = runIndex < 0 ? "20261007-v648web02" : process.argv[runIndex + 1];
if (!/^\d{8}-v648web\d{2}$/.test(RUN ?? "")
  || (runIndex >= 0 && (runIndex !== 2 || process.argv.length !== 4))
  || (runIndex < 0 && process.argv.length !== 2)) {
  throw new Error("browser-v648:invalid-run-id");
}
const ORIGIN = "http://127.0.0.1:3091";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const build = JSON.parse(await readFile(path.join(ROOT, BUILD_PATH), "utf8"));
if (build.status !== "passed" || build.sourceStable !== true || build.exitCode !== 0) {
  throw new Error("browser-v648:build-not-passed");
}
if (build.runtimeBuildId !== `mainline-a-${build.inputBefore.sha256.slice(0, 16)}`) {
  throw new Error("browser-v648:build-identity-invalid");
}

const paths = Object.freeze({
  desktopRaw: `docs/release/v607/mainline-a-r66-browser-desktop-raw-${RUN}.json`,
  desktopShot: `output/playwright/mainline-a-web-v648-atlas-desktop-${RUN}.png`,
  mobileRaw: `docs/release/v607/mainline-a-r66-browser-mobile-raw-${RUN}.json`,
  mobileShot: `output/playwright/mainline-a-web-v648-atlas-mobile-${RUN}.png`,
  mobileDetailShot: `output/playwright/mainline-a-web-v648-detail-mobile-${RUN}.png`,
});
async function uniquePath(relative) {
  const absolute = path.join(ROOT, relative);
  try { await access(absolute); throw new Error(`browser-v648:output-already-exists:${relative}`); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  return absolute;
}
async function writeJson(relative, value) {
  await writeFile(await uniquePath(relative), `${JSON.stringify(value, null, 2)}\n`,
    { encoding: "utf8", flag: "wx" });
}
function check(value, code) { if (!value) throw new Error(`browser-v648:${code}`); }

async function observeAtlas(page, device) {
  await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.locator("[data-atlas-app-shell]").waitFor({ state: "visible", timeout: 15_000 });
  await page.getByRole("button", { name: "星云候选" }).click({ timeout: 8_000 });
  await page.locator("[data-mainline-a-nebula-atlas]").waitFor({ state: "visible", timeout: 8_000 });
  await page.locator('[data-mainline-a-nebula-selected="m42"]').waitFor({ state: "attached", timeout: 8_000 });
  if (device === "mobile-viewport") {
    await page.locator('[data-mainline-a-nebula-selected="m42"]')
      .scrollIntoViewIfNeeded({ timeout: 8_000 });
  }
  await page.waitForFunction(() => {
    const image = document.querySelector("[data-mainline-a-nebula-atlas] img");
    return image && image.complete && image.naturalWidth > 0;
  }, null, { timeout: 12_000 });
  await page.waitForFunction(() => {
    const preview = document.querySelector("[data-mainline-a-nebula-image-state]");
    const image = preview?.querySelector("img");
    const bounds = image?.getBoundingClientRect();
    return preview?.getAttribute("data-mainline-a-nebula-image-state") === "loaded"
      && image?.complete === true && image.naturalWidth > 0
      && bounds && bounds.width > 0 && bounds.height > 0
      && Number(getComputedStyle(image).opacity) >= 0.999;
  }, null, { timeout: 12_000 });
  const observed = await page.evaluate((device) => {
    const shell = document.querySelector("[data-atlas-app-shell]");
    const atlas = document.querySelector("[data-mainline-a-nebula-atlas]");
    const aside = document.querySelector("[data-mainline-a-nebula-selected]");
    const image = atlas?.querySelector("img");
    const summary = atlas?.querySelector("[data-mainline-a-nebula-summary]");
    const counts = summary ? [...summary.children].map((row) =>
      Number(row.querySelector(".font-mono")?.textContent?.trim()
        ?? [...row.querySelectorAll("*")].find((part) => /^\d+$/.test(part.textContent?.trim() ?? ""))?.textContent?.trim())) : [];
    const close = atlas?.querySelector('button[aria-label="关闭星云候选图集"]');
    const closeStyle = close ? getComputedStyle(close) : null;
    const closeRect = close?.getBoundingClientRect();
    const dialogRect = atlas?.getBoundingClientRect();
    return {
      schema: "mainline-a-browser-raw-dom-v645",
      capturedAt: new Date().toISOString(),
      surface: "Playwright CLI Chrome local",
      url: location.href,
      documentVisibility: document.visibilityState,
      viewport: [innerWidth, innerHeight],
      dom: {
        clientWidth: document.documentElement.clientWidth,
        clientHeight: document.documentElement.clientHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        markers: {
          shell: Boolean(shell),
          scientificPayloadWriteback: shell?.getAttribute("data-mainline-a-scientific-payload-writeback"),
          releaseBoundary: shell?.getAttribute("data-mainline-a-release-boundary"),
        },
        build: {
          runtimeBuildId: shell?.getAttribute("data-mainline-build-id"),
          branch: shell?.getAttribute("data-mainline-branch"),
          head: shell?.getAttribute("data-mainline-head"),
        },
      },
      webRights: {
        atlasOpen: Boolean(atlas?.hasAttribute("open")),
        webRelease: atlas?.getAttribute("data-mainline-a-nebula-web-release"),
        summaryCounts: counts,
        licenseRecorded: Number(atlas?.querySelector("[data-mainline-a-nebula-license-recorded]")
          ?.getAttribute("data-mainline-a-nebula-license-recorded")),
        selectedAdmission: aside?.querySelector("[data-mainline-a-nebula-release-admission]")
          ?.getAttribute("data-mainline-a-nebula-release-admission"),
        selectedRightsReview: aside?.querySelector("[data-mainline-a-nebula-rights-review]")
          ?.getAttribute("data-mainline-a-nebula-rights-review"),
        clearedClaimVisible: Boolean(atlas?.innerText.includes("版权已签署 12")
          || atlas?.innerText.includes("公开网页版发布已批准")),
        closeButtonNoWrap: closeStyle?.whiteSpace === "nowrap",
      },
      preview: {
        selectedId: aside?.getAttribute("data-mainline-a-nebula-selected"),
        imageSrc: image?.currentSrc ?? null,
        naturalWidth: image?.naturalWidth ?? 0,
        naturalHeight: image?.naturalHeight ?? 0,
        imageComplete: image?.complete === true,
        renderState: image?.closest("[data-mainline-a-nebula-image-state]")
          ?.getAttribute("data-mainline-a-nebula-image-state") ?? null,
        computedOpacity: image ? Number(getComputedStyle(image).opacity) : null,
        rightsText: aside?.querySelector("[data-mainline-a-nebula-rights-review]")?.textContent?.trim() ?? null,
        admissionText: aside?.querySelector("[data-mainline-a-nebula-release-admission]")?.textContent?.trim() ?? null,
        sourceHref: aside?.querySelector('a[href^="https:"]')?.getAttribute("href") ?? null,
        dialogBounds: dialogRect ? { x: dialogRect.x, y: dialogRect.y,
          width: dialogRect.width, height: dialogRect.height } : null,
        closeBounds: closeRect ? { x: closeRect.x, y: closeRect.y,
          width: closeRect.width, height: closeRect.height } : null,
      },
      claims: { realUserValidation: false, productionPerformance: false,
        scientificValidity: false, legalClearance: false },
      device,
    };
  }, device);
  check(observed.dom.build.runtimeBuildId === build.runtimeBuildId
    && observed.dom.build.branch === build.branch
    && observed.dom.build.head === build.head, `${device}:build-drift`);
  check(observed.dom.scrollWidth === observed.viewport[0]
    && observed.dom.scrollHeight >= observed.viewport[1], `${device}:viewport-overflow`);
  check(observed.webRights.webRelease === "blocked-rights-pending"
    && JSON.stringify(observed.webRights.summaryCounts) === JSON.stringify([12, 18, 0, 30])
    && observed.webRights.licenseRecorded === 12
    && observed.webRights.selectedAdmission === "candidate-only"
    && observed.webRights.selectedRightsReview === "pending"
    && observed.webRights.clearedClaimVisible === false, `${device}:rights-state-invalid`);
  check(observed.preview.imageComplete && observed.preview.naturalWidth > 0
    && observed.preview.renderState === "loaded"
    && observed.preview.computedOpacity >= 0.999
    && observed.preview.selectedId === "m42" && observed.preview.imageSrc?.endsWith("/opo0205d.jpg"),
  `${device}:local-image-not-decoded`);
  check(observed.preview.dialogBounds?.x >= 0
    && observed.preview.dialogBounds?.x + observed.preview.dialogBounds?.width <= observed.viewport[0] + 1
    && observed.preview.dialogBounds?.y >= 0
    && observed.preview.dialogBounds?.y + observed.preview.dialogBounds?.height <= observed.viewport[1] + 1,
  `${device}:dialog-clipped`);
  return observed;
}

const browser = await chromium.launch({ headless: false, executablePath: CHROME });
try {
  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1 });
  const desktopPage = await desktopContext.newPage();
  const desktop = await observeAtlas(desktopPage, "desktop");
  await desktopPage.screenshot({ path: await uniquePath(paths.desktopShot), type: "png" });
  await desktopPage.getByRole("button", { name: "下一条" }).click({ timeout: 8_000 });
  await desktopPage.locator('[data-mainline-a-nebula-selected="m1"]').waitFor({ timeout: 8_000 });
  desktop.nextSelection = await desktopPage.evaluate(() => {
    const aside = document.querySelector('[data-mainline-a-nebula-selected="m1"]');
    const image = aside?.querySelector("img");
    return { selectedId: aside?.getAttribute("data-mainline-a-nebula-selected"),
      imageSrc: image?.currentSrc ?? null, naturalWidth: image?.naturalWidth ?? 0,
      release: document.querySelector("[data-mainline-a-nebula-atlas]")
        ?.getAttribute("data-mainline-a-nebula-web-release") };
  });
  check(desktop.nextSelection.imageSrc?.endsWith("/potw1644a.jpg")
    && desktop.nextSelection.release === "blocked-rights-pending", "desktop:second-image-invalid");
  await writeJson(paths.desktopRaw, desktop);
  await desktopContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const mobilePage = await mobileContext.newPage();
  const mobile = await observeAtlas(mobilePage, "mobile-viewport");
  await mobilePage.screenshot({ path: await uniquePath(paths.mobileDetailShot), type: "png" });
  await mobilePage.locator('[data-mainline-a-nebula-atlas] > div > div')
    .evaluate((element) => { element.scrollTop = 0; });
  await mobilePage.screenshot({ path: await uniquePath(paths.mobileShot), type: "png" });
  await writeJson(paths.mobileRaw, mobile);
  await mobileContext.close();
  console.log(JSON.stringify({ status: "captured-current-build", buildId: build.buildId,
    sourceSha256: build.inputBefore.sha256, desktop: desktop.preview,
    nextSelection: desktop.nextSelection, mobile: mobile.preview, paths }, null, 2));
} finally {
  await browser.close();
}
