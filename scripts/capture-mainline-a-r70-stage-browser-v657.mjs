import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "http://127.0.0.1:3101";
const BUILD = "docs/release/v607/mainline-a-r70-build-20261012v657web02.json";
const MANIFEST = "app/data/mainlineANebulaCandidateReviewV655.generated.json";
const OUTPUT = "docs/release/v607/mainline-a-r70-v657-stage-browser-20261012v657web02.json";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
function check(valid, code) {
  if (!valid) throw new Error(`r70-stage-browser-v657:${code}`);
}

const [build, review, source] = await Promise.all([
  readFile(path.join(ROOT, BUILD), "utf8").then(JSON.parse),
  readFile(path.join(ROOT, MANIFEST), "utf8").then(JSON.parse),
  captureBuildInputs(),
]);
check(build.status === "passed" && build.sourceStable === true
  && source.sha256 === build.inputAfterSha256
  && review.rows?.length === 12 && review.counts?.rightsSigned === 0,
"build-or-review-source-invalid");

async function screenshot(page, device, variant) {
  const relative = `docs/release/v607/mainline-a-r70-v657-stage-${device}-${variant}-20261012v657web02.png`;
  const bytes = await page.screenshot({ path: path.join(ROOT, relative),
    fullPage: false });
  return { path: relative, bytes: bytes.length, sha256: sha(bytes) };
}

async function inspect(browser, device) {
  const mobile = device === "mobile-viewport";
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 }
      : { width: 1280, height: 720 },
    deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile,
  });
  try {
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(ORIGIN, { waitUntil: "domcontentloaded",
      timeout: 20_000 });
    const shell = page.locator("[data-atlas-app-shell]");
    await shell.waitFor({ state: "visible", timeout: 20_000 });
    check(await shell.getAttribute("data-mainline-build-id")
      === build.runtimeBuildId, `${device}:runtime-build-id`);
    const selectedBefore = await shell.getAttribute(
      "data-celestial-catalog-selected-id");
    await page.getByRole("button", { name: /^工具/ }).click();
    await page.getByRole("button", { name: "清权审查" }).click();
    const stage = page.locator('[data-mainline-a-web-stage-freeze="v657"]');
    await stage.waitFor({ state: "visible", timeout: 12_000 });
    check(await stage.getAttribute("data-mainline-a-stage-data")
      === "candidate-data-valid", `${device}:stage-data`);
    check(await stage.getAttribute("data-mainline-a-stage-technical")
      === "pending-runtime-evidence", `${device}:technical-claim`);
    check(await stage.getAttribute("data-mainline-a-stage-release")
      === "blocked", `${device}:release-boundary`);
    check(await stage.getAttribute("data-scientific-payload-writeback")
      === "false", `${device}:writeback-boundary`);
    check(await stage.locator("[data-mainline-a-stage-candidate]")
      .count() === 12, `${device}:candidate-count`);
    const layout = await page.evaluate(() => {
      const dialog = document.querySelector(
        '[data-mainline-a-nebula-review="true"]');
      const search = document.querySelector(
        '[data-mainline-a-web-stage-freeze="v657"] input[aria-label="搜索阶段候选"]');
      return { viewportWidth: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        dialogWidth: dialog?.clientWidth ?? 0,
        dialogScrollWidth: dialog?.scrollWidth ?? 0,
        searchWidth: search?.getBoundingClientRect().width ?? 0 };
    });
    check(layout.documentWidth <= layout.viewportWidth
      && layout.dialogScrollWidth <= layout.dialogWidth
      && layout.searchWidth >= 200,
    `${device}:horizontal-overflow`);
    const overview = await screenshot(page, device, "overview");

    await stage.getByRole("button", { name: "首组六图" }).click();
    check(await stage.locator("[data-mainline-a-stage-candidate]")
      .count() === 6, `${device}:b1-filter`);
    await stage.getByRole("button", { name: "次组六图" }).click();
    check(await stage.locator("[data-mainline-a-stage-candidate]")
      .count() === 6, `${device}:b2-filter`);
    await stage.getByRole("button", { name: "原字节不同" }).click();
    check(await stage.locator("[data-mainline-a-stage-candidate]")
      .count() === 11, `${device}:byte-variant-filter`);
    await stage.getByRole("button", { name: "全部 12" }).click();
    const query = stage.getByRole("textbox", { name: "搜索阶段候选" });
    await query.fill(review.rows[0].nasaId);
    check(await stage.locator("[data-mainline-a-stage-candidate]")
      .count() === 1, `${device}:nasa-search`);
    const row = review.rows[0];
    await stage.locator(`[data-mainline-a-stage-candidate="${row.id}"]`)
      .click();
    const detail = stage.locator(`[data-mainline-a-stage-detail="${row.id}"]`);
    await detail.scrollIntoViewIfNeeded();
    check(await detail.locator(`a[href="${row.sourcePageUrl}"]`)
      .count() === 1, `${device}:source-page-link`);
    const detailText = await detail.textContent();
    check(detailText.includes(row.sourceCredit)
      && detailText.includes(row.candidateRaw.sha256)
      && detailText.includes("版权待签")
      && detailText.includes("scientificPayloadWriteback=false"),
    `${device}:source-or-rights-detail`);
    const detailShot = await screenshot(page, device, "detail");
    await query.fill("not-a-real-nasa-id");
    check(await stage.locator("[data-mainline-a-stage-candidate]")
      .count() === 0, `${device}:empty-search-count`);
    await stage.getByRole("status").filter({ hasText:
      "没有匹配的候选图" }).waitFor({ state: "visible" });
    await query.fill("");
    check(await stage.locator("[data-mainline-a-stage-candidate]")
      .count() === 12, `${device}:clear-restored`);
    check(await shell.getAttribute("data-celestial-catalog-selected-id")
      === selectedBefore, `${device}:static-review-mutated-scene`);
    await page.getByRole("button", { name: "关闭星云清权审查台" })
      .click();
    await stage.waitFor({ state: "detached", timeout: 10_000 });
    check(pageErrors.length === 0, `${device}:page-errors`);
    return { device, viewport: mobile ? [390, 844] : [1280, 720],
      layout, candidateRows: 12, b1Filtered: 6, b2Filtered: 6,
      byteVariantsFiltered: 11, nasaSearch: row.nasaId,
      sourceLinkMatched: true, emptySearchState: true,
      selectedCatalogUnchanged: true, closed: true,
      screenshots: { overview, detail: detailShot }, pageErrors };
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
try {
  const desktop = await inspect(browser, "desktop");
  const mobileViewport = await inspect(browser, "mobile-viewport");
  check((await captureBuildInputs()).sha256 === source.sha256,
  "app-source-changed-during-stage-browser");
  const report = { schema: "mainline-a-r70-web-stage-browser-v657",
    status: "passed-local-desktop-and-mobile-viewport",
    buildReceipt: BUILD, buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId,
    sourceSha256: source.sha256, desktop, mobileViewport,
    totals: { stageCandidateSelections: 2,
      sourceLinksMatched: 2,
      pageErrors: desktop.pageErrors.length
        + mobileViewport.pageErrors.length },
    claims: { physicalMobile: false, realUserValidation: false,
      productionPerformance: false, copyrightApproval: false,
      scientificValidity: false, publicWebReleaseApproved: false } };
  await writeFile(path.join(ROOT, OUTPUT),
    `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ status: report.status,
    totals: report.totals, output: OUTPUT }, null, 2));
} finally {
  await browser.close();
}
