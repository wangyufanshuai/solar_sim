import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeFile } from "./mainline-a-release-evidence.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = "mainline-a-web-nebula-browser-verification-v648";
const INPUTS = Object.freeze({
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
});
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
function check(issues, value, code) { if (!value) issues.push(code); }
function rectInside(rect, viewport) {
  return rect && Number.isFinite(rect.x) && Number.isFinite(rect.y)
    && Number.isFinite(rect.width) && Number.isFinite(rect.height)
    && rect.x >= 0 && rect.y >= 0 && rect.width > 0 && rect.height > 0
    && rect.x + rect.width <= viewport[0] + 1 && rect.y + rect.height <= viewport[1] + 1;
}
function pngSize(bytes) {
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    || bytes.toString("ascii", 12, 16) !== "IHDR") return null;
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

export function inspectWebNebulaBrowserV648(input) {
  const { build, rights, http, browser, desktop, mobile, search, visual, imageBytes } = input;
  const issues = [];
  const sourceSha = build?.inputBefore?.sha256;
  check(issues, build?.status === "passed" && build?.sourceStable === true
    && sourceSha === build.inputAfterSha256, "build-not-stable");
  check(issues, rights?.status === "passed-local-candidate-rights-pending"
    && rights.sourceSha256 === sourceSha && rights.counts?.previewAvailable === 12
    && rights.counts?.humanRightsSigned === 0 && rights.counts?.releaseAdmitted === 0
    && rights.counts?.currentRuntimeLicensed === 0, "static-rights-not-pending");
  check(issues, http?.status === "passed-local-http-candidate-release-blocked"
    && http.sourceSha256 === sourceSha && http.buildId === build?.buildId
    && http.counts?.matched === 12 && http.counts?.humanRightsSigned === 0, "http-image-binding-invalid");
  check(issues, browser?.status === "observed-local-release-blocked"
    && browser.build?.buildId === build?.buildId
    && browser.build?.runtimeBuildId === build?.runtimeBuildId
    && browser.browserPermissionBypass === false
    && browser.physicalMobile === "not-run", "browser-build-binding-invalid");
  for (const [device, raw, viewport, browserRow] of [
    ["desktop", desktop, [1280, 720], browser?.desktop],
    ["mobile", mobile, [390, 844], browser?.mobileViewport],
  ]) {
    check(issues, raw?.schema === "mainline-a-browser-raw-dom-v645"
      && raw.surface === "Playwright CLI Chrome local"
      && raw.documentVisibility === "visible"
      && same(raw.viewport, viewport)
      && raw.dom?.build?.runtimeBuildId === build?.runtimeBuildId
      && raw.dom?.build?.branch === build?.branch
      && raw.dom?.build?.head === build?.head
      && raw.dom?.scrollWidth === viewport[0]
      && raw.dom?.markers?.scientificPayloadWriteback === "false"
      && raw.dom?.markers?.releaseBoundary === "candidate-only-hold-not-admitted",
    `${device}-dom-identity-invalid`);
    check(issues, raw?.webRights?.atlasOpen === true
      && raw.webRights.webRelease === "blocked-rights-pending"
      && same(raw.webRights.summaryCounts, [12, 18, 0, 30])
      && raw.webRights.licenseRecorded === 12
      && raw.webRights.selectedAdmission === "candidate-only"
      && raw.webRights.selectedRightsReview === "pending"
      && raw.webRights.clearedClaimVisible === false
      && raw.webRights.closeButtonNoWrap === true,
    `${device}-rights-promotion`);
    const m42 = http?.assets?.find((row) => row.id === "m42");
    check(issues, raw?.preview?.selectedId === "m42"
      && raw.preview.imageComplete === true
      && raw.preview.naturalWidth > 0 && raw.preview.naturalHeight > 0
      && raw.preview.imageSrc === m42?.requestedUrl
      && raw.preview.sourceHref === "https://esahubble.org/images/opo0205d/"
      && raw.preview.rightsText?.includes("pending（未签署）")
      && raw.preview.admissionText?.includes("candidate-only · hold · not-admitted"),
    `${device}-decoded-preview-invalid`);
    check(issues, rectInside(raw?.preview?.dialogBounds, viewport)
      && rectInside(raw?.preview?.closeBounds, viewport)
      && browserRow?.status === "passed"
      && same(browserRow?.viewport, viewport), `${device}-visual-bounds-invalid`);
    check(issues, Object.values(raw?.claims ?? {}).every((value) => value === false)
      && raw?.claims?.legalClearance === false, `${device}-claim-promotion`);
  }
  const m1 = http?.assets?.find((row) => row.id === "m1");
  check(issues, desktop?.nextSelection?.selectedId === "m1"
    && desktop.nextSelection.imageSrc === m1?.requestedUrl
    && desktop.nextSelection.naturalWidth > 0
    && desktop.nextSelection.release === "blocked-rights-pending", "second-preview-invalid");
  check(issues, search?.schema === "mainline-a-web-nebula-search-browser-v648"
    && search.buildId === build?.buildId && search.runtimeBuildId === build?.runtimeBuildId
    && search.initial === "30" && search.empty === "0" && search.emptyMessage === true
    && search.restored === "30" && search.gate === "blocked-rights-pending"
    && search.realUserValidation === false && search.publicReleaseApproved === false,
  "search-interaction-invalid");
  check(issues, visual?.schema === "mainline-a-web-nebula-visual-review-v648"
    && visual.sourceSha256 === sourceSha && visual.buildId === build?.buildId
    && visual.rightsDisclosure?.humanSignedCount === 0
    && visual.claims?.copyrightApproval === false
    && visual.claims?.publicReleaseApproved === false, "visual-review-invalid");
  for (const [index, key, viewport] of [
    [0, "desktopPng", [1280, 720]], [1, "mobilePng", [390, 844]],
    [2, "mobileDetailPng", [390, 844]],
  ]) {
    const bytes = imageBytes?.[key];
    const row = visual?.screenshots?.[index];
    check(issues, Buffer.isBuffer(bytes) && same(pngSize(bytes), viewport)
      && row?.path === INPUTS[key] && row.bytes === bytes.length
      && row.sha256 === sha(bytes) && same(row.viewport, viewport), `${key}-png-binding-invalid`);
  }
  check(issues, browser?.desktop?.screenshot?.sha256 === visual?.screenshots?.[0]?.sha256
    && browser?.mobileViewport?.screenshot?.sha256 === visual?.screenshots?.[1]?.sha256,
  "browser-visual-png-drift");
  return Object.freeze({ status: issues.length === 0 ? "verified-local-browser-candidate-release-blocked" : "failed",
    issues: Object.freeze(issues), sourceSha256: sourceSha, buildId: build?.buildId,
    decodedPreviews: 2, signedRights: 0, publicWebRelease: "blocked" });
}

async function loadInput(relative) {
  const file = await safeFile(ROOT, relative);
  const bytes = await readFile(file.absolute);
  if (!bytes.length || bytes.length > 4 * 1024 * 1024) throw new Error(`browser-v648:input-size:${relative}`);
  return { bytes, descriptor: { path: relative, bytes: bytes.length, sha256: sha(bytes) } };
}
export async function auditWebNebulaBrowserV648() {
  const loaded = Object.fromEntries(await Promise.all(Object.entries(INPUTS).map(async ([key, relative]) =>
    [key, await loadInput(relative)])));
  const input = Object.fromEntries(Object.entries(loaded).filter(([key]) => !key.endsWith("Png"))
    .map(([key, item]) => [key, JSON.parse(item.bytes.toString("utf8"))]));
  input.imageBytes = Object.fromEntries(Object.entries(loaded).filter(([key]) => key.endsWith("Png"))
    .map(([key, item]) => [key, item.bytes]));
  const result = inspectWebNebulaBrowserV648(input);
  const current = await captureBuildInputs();
  if (current.sha256 !== result.sourceSha256) throw new Error("browser-v648:current-source-drift");
  return Object.freeze({ schema: SCHEMA, evidenceClass: "browser", ...result,
    inputs: Object.fromEntries(Object.entries(loaded).map(([key, item]) => [key, item.descriptor])),
    physicalMobile: "not-run", longRunStatus: "historical-needs-rerun-for-current-source",
    claims: { realUserValidation: false, productionPerformance: false,
      scientificValidity: false, copyrightApproval: false, publicWebReleaseApproved: false } });
}
export function replayWebNebulaBrowserV648(saved, fresh) {
  if (saved?.schema !== SCHEMA || saved.status !== "verified-local-browser-candidate-release-blocked"
    || fresh.status !== saved.status || !same(saved.inputs, fresh.inputs)
    || saved.sourceSha256 !== fresh.sourceSha256 || saved.buildId !== fresh.buildId
    || saved.signedRights !== 0 || saved.publicWebRelease !== "blocked"
    || saved.claims?.copyrightApproval !== false || saved.claims?.publicWebReleaseApproved !== false) {
    throw new Error("browser-v648:saved-replay-mismatch");
  }
  return Object.freeze({ status: "replayed-local-browser-candidate-release-blocked",
    buildId: fresh.buildId, sourceSha256: fresh.sourceSha256, signedRights: 0 });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await auditWebNebulaBrowserV648();
  const outputIndex = process.argv.indexOf("--output");
  const replayIndex = process.argv.indexOf("--replay");
  if (outputIndex >= 0) {
    const relative = process.argv[outputIndex + 1];
    if (!/^docs\/release\/v607\/[a-z0-9-]+\.json$/i.test(relative ?? "")) throw new Error("browser-v648:output-path-invalid");
    await writeFile(path.join(ROOT, relative), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  }
  if (replayIndex >= 0) {
    const relative = process.argv[replayIndex + 1];
    if (!/^docs\/release\/v607\/[a-z0-9-]+\.json$/i.test(relative ?? "")) throw new Error("browser-v648:replay-path-invalid");
    console.log(JSON.stringify(replayWebNebulaBrowserV648(
      JSON.parse(await readFile(path.join(ROOT, relative), "utf8")), report), null, 2));
  } else console.log(JSON.stringify({ status: report.status, issues: report.issues,
    buildId: report.buildId, decodedPreviews: report.decodedPreviews }, null, 2));
  if (report.status === "failed") process.exitCode = 1;
}
