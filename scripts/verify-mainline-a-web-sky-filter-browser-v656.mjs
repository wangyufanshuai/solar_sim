import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = "docs/release/v607/mainline-a-r69-build-20261012v656web03.json";
const OUTPUT = "docs/release/v607/mainline-a-r69-v656-browser-filter-20261012v656web03.json";
const ORIGIN = "http://127.0.0.1:3100";
const build = JSON.parse(await readFile(path.join(ROOT, BUILD), "utf8"));
const sourceBefore = await captureBuildInputs();
function ensure(value, reason) {
  if (!value) throw new Error(`web-sky-filter-browser:${reason}`);
}
ensure(build.status === "passed" && build.sourceStable === true
  && sourceBefore.sha256 === build.inputAfterSha256,
"build-source-drift");

const browser = await chromium.launch({ headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const observations = [];
try {
  for (const device of ["desktop", "mobile-viewport"]) {
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
      await page.goto(ORIGIN, { waitUntil: "domcontentloaded" });
      const shell = page.locator("[data-atlas-app-shell]");
      await shell.waitFor({ state: "visible" });
      ensure(await shell.getAttribute("data-mainline-build-id")
        === build.runtimeBuildId, `${device}:build-id`);
      await page.getByRole("button", { name: /^工具/ }).click();
      await page.getByRole("button", { name: "星空导览 · 24+12" }).click();
      const guide = page.locator('[data-mainline-a-web-sky="v656"]');
      await guide.locator('[data-mainline-a-web-sky-star="sirius-a"]')
        .waitFor({ state: "visible" });
      const search = guide.getByRole("textbox", { name: "搜索星空导览" });
      await search.fill("acrux");
      ensure(await guide.locator("[data-mainline-a-web-sky-star]").count()
        === 1, `${device}:search-acrux-count`);
      ensure(await guide.locator('[data-mainline-a-web-sky-star="acrux"]')
        .count() === 1, `${device}:search-acrux-identity`);
      await guide.locator('[data-mainline-a-web-sky-star="acrux"]').click();
      ensure(await guide.locator('[data-mainline-a-web-sky-focus-star="acrux"]')
        .isDisabled(), `${device}:search-cannot-promote-hold`);
      await guide.getByRole("button", { name: "清空" }).click();
      await guide.getByRole("button", { name: "身份待审 4" }).click();
      ensure(await guide.locator("[data-mainline-a-web-sky-star]").count()
        === 4, `${device}:hold-filter-count`);
      ensure(await guide.locator('[data-mainline-a-web-sky-star-phase="runtime-existing"]')
        .count() === 0, `${device}:hold-filter-leak`);
      await guide.getByRole("button", { name: "现有运行时 20" }).click();
      ensure(await guide.locator("[data-mainline-a-web-sky-star]").count()
        === 20, `${device}:runtime-filter-count`);
      ensure(await guide.locator('[data-mainline-a-web-sky-star-phase="candidate-hold"]')
        .count() === 0, `${device}:runtime-filter-leak`);
      await guide.getByRole("button", { name: "星座 12" }).click();
      await search.fill("Ori");
      ensure(await guide.locator("[data-mainline-a-web-sky-constellation]")
        .count() === 1, `${device}:iau-search-count`);
      ensure(await guide.locator('[data-mainline-a-web-sky-constellation="Ori"]')
        .count() === 1, `${device}:iau-search-identity`);
      await search.fill("no-such-canonical-object");
      ensure(await guide.locator("[data-mainline-a-web-sky-constellation]")
        .count() === 0, `${device}:empty-search-count`);
      await guide.getByRole("status", { name: "" }).filter({ hasText: "没有匹配对象" })
        .waitFor({ state: "visible" });
      await guide.getByRole("button", { name: "清空" }).click();
      ensure(await guide.locator("[data-mainline-a-web-sky-constellation]")
        .count() === 12, `${device}:clear-search-restore`);
      await guide.getByRole("button", { name: "关闭星空导览" }).click();
      await guide.waitFor({ state: "detached" });
      ensure(pageErrors.length === 0, `${device}:page-errors`);
      observations.push({ device, viewport: mobile ? [390, 844] : [1280, 720],
        starNameSearch: "acrux:1:hold-disabled", holdFilter: 4,
        runtimeFilter: 20, constellationCodeSearch: "Ori:1",
        emptySearchState: true, clearRestored: 12,
        closedAfterSearch: true, pageErrors });
    } finally {
      await context.close();
    }
  }
  const sourceAfter = await captureBuildInputs();
  ensure(sourceAfter.sha256 === sourceBefore.sha256,
  "app-source-changed-during-observation");
  const report = { schema: "mainline-a-r69-web-sky-filter-browser-v656",
    status: "passed-local-browser", buildReceipt: BUILD,
    buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
    appSourceSha256: sourceAfter.sha256, observations,
    claims: { physicalMobile: false, realUserValidation: false,
      productionPerformance: false, copyrightApproval: false,
      scientificValidity: false, publicWebReleaseApproved: false } };
  await writeFile(path.join(ROOT, OUTPUT), `${JSON.stringify(report, null, 2)}\n`,
    { flag: "wx" });
  console.log(JSON.stringify({ status: report.status, observations, output: OUTPUT }));
} finally {
  await browser.close();
}
