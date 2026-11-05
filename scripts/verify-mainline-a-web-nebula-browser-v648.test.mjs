import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  auditWebNebulaBrowserV648, inspectWebNebulaBrowserV648,
  replayWebNebulaBrowserV648,
} from "./verify-mainline-a-web-nebula-browser-v648.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const paths = {
  build: "docs/release/v607/mainline-a-r66-build-20261007-v648web01.json",
  rights: "docs/release/v607/mainline-a-r66-web-nebula-rights-20261007-v648web01.json",
  http: "docs/release/v607/mainline-a-r66-web-nebula-http-20261007-v648web01.json",
  browser: "docs/release/v607/mainline-a-r66-web-browser-20261007-v648web02.json",
  desktop: "docs/release/v607/mainline-a-r66-browser-desktop-raw-20261007-v648web02.json",
  mobile: "docs/release/v607/mainline-a-r66-browser-mobile-raw-20261007-v648web02.json",
  search: "docs/release/v607/mainline-a-r66-web-nebula-search-20261007-v648web01.json",
  visual: "docs/release/v607/mainline-a-r66-web-visual-20261007-v648web02.json",
  desktopPng: "output/playwright/mainline-a-web-v648-atlas-desktop-20261007-v648web02.png",
  mobilePng: "output/playwright/mainline-a-web-v648-atlas-mobile-20261007-v648web02.png",
  mobileDetailPng: "output/playwright/mainline-a-web-v648-detail-mobile-20261007-v648web02.png",
};
async function input() {
  const entries = await Promise.all(Object.entries(paths).map(async ([key, relative]) => {
    const bytes = await readFile(path.join(root, relative));
    return [key, key.endsWith("Png") ? bytes : JSON.parse(bytes.toString("utf8"))];
  }));
  const result = Object.fromEntries(entries);
  result.imageBytes = { desktopPng: result.desktopPng,
    mobilePng: result.mobilePng, mobileDetailPng: result.mobileDetailPng };
  delete result.desktopPng;
  delete result.mobilePng;
  delete result.mobileDetailPng;
  return result;
}

test("current local browser raw, decoded previews and screenshot bytes bind to one blocked build", async () => {
  const result = inspectWebNebulaBrowserV648(await input());
  assert.equal(result.status, "verified-local-browser-candidate-release-blocked");
  assert.deepEqual(result.issues, []);
});
test("a forged rights approval or decoded image cannot pass browser replay", async () => {
  const forged = await input();
  forged.desktop.webRights.summaryCounts[2] = 12;
  forged.desktop.webRights.selectedRightsReview = "signed";
  forged.mobile.preview.imageComplete = false;
  assert.deepEqual(inspectWebNebulaBrowserV648(forged).issues.filter((issue) =>
    issue.endsWith("rights-promotion") || issue.endsWith("decoded-preview-invalid")),
  ["desktop-rights-promotion", "mobile-decoded-preview-invalid"]);
});
test("wrong local image URL, source page, or later selection is rejected", async () => {
  const forged = await input();
  forged.desktop.preview.imageSrc = "http://127.0.0.1:3091/textures/mainline-a/other.jpg";
  forged.mobile.preview.sourceHref = "https://example.invalid/";
  forged.desktop.nextSelection.imageSrc = forged.desktop.preview.imageSrc;
  const issues = inspectWebNebulaBrowserV648(forged).issues;
  assert(issues.includes("desktop-decoded-preview-invalid"));
  assert(issues.includes("mobile-decoded-preview-invalid"));
  assert(issues.includes("second-preview-invalid"));
});
test("altered screenshot bytes, wrong dimensions, and a fake visual receipt are rejected", async () => {
  const forged = await input();
  forged.imageBytes.desktopPng = Buffer.from(forged.imageBytes.mobilePng);
  forged.visual.screenshots[2].sha256 = "0".repeat(64);
  forged.visual.claims.copyrightApproval = true;
  const issues = inspectWebNebulaBrowserV648(forged).issues;
  assert(issues.includes("desktopPng-png-binding-invalid"));
  assert(issues.includes("mobileDetailPng-png-binding-invalid"));
  assert(issues.includes("visual-review-invalid"));
});
test("search reset, build drift and a forged saved receipt cannot become approval", async () => {
  const forged = await input();
  forged.search.restored = "29";
  forged.browser.build.runtimeBuildId = "forged-build";
  const issues = inspectWebNebulaBrowserV648(forged).issues;
  assert(issues.includes("search-interaction-invalid"));
  assert(issues.includes("browser-build-binding-invalid"));
  const fresh = await auditWebNebulaBrowserV648();
  const saved = JSON.parse(await readFile(path.join(root,
    "docs/release/v607/mainline-a-r66-web-nebula-browser-20261007-v648web02.json"), "utf8"));
  assert.equal(replayWebNebulaBrowserV648(saved, fresh).signedRights, 0);
  assert.throws(() => replayWebNebulaBrowserV648(
    { ...saved, claims: { ...saved.claims, copyrightApproval: true } }, fresh),
  /saved-replay-mismatch/);
});
