import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeFile } from "./mainline-a-release-evidence.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = "mainline-a-web-nebula-paint-correction-v648";
const DIR = "docs/release/v607/";
const SHOTS = "output/playwright/";
const PATHS = Object.freeze({
  build: `${DIR}mainline-a-r66-build-20261007-v648web01.json`,
  previousMobile: `${DIR}mainline-a-r66-browser-mobile-raw-20261007-v648web02.json`,
  currentDesktop: `${DIR}mainline-a-r66-browser-desktop-raw-20261007-v648web03.json`,
  currentMobile: `${DIR}mainline-a-r66-browser-mobile-raw-20261007-v648web03.json`,
  previousShot: `${SHOTS}mainline-a-web-v648-detail-mobile-20261007-v648web02.png`,
  currentShot: `${SHOTS}mainline-a-web-v648-detail-mobile-20261007-v648web03.png`,
});
const REGION = Object.freeze({ left: 26, top: 131, width: 338, height: 308 });
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

async function pinned(relative, json) {
  const file = await safeFile(ROOT, relative);
  if (file.stat.size < 1 || file.stat.size > 4 * 1024 * 1024) {
    throw new Error(`paint-v648:input-size:${relative}`);
  }
  const bytes = await readFile(file.absolute);
  return {
    value: json ? JSON.parse(bytes.toString("utf8")) : bytes,
    pin: { path: relative, bytes: bytes.length, sha256: sha(bytes) },
  };
}

async function screenshotRegionMean(bytes) {
  const { data, info } = await sharp(bytes).extract(REGION).removeAlpha()
    .raw().toBuffer({ resolveWithObject: true });
  if (info.width !== REGION.width || info.height !== REGION.height
    || info.channels !== 3 || data.length !== REGION.width * REGION.height * 3) {
    throw new Error("paint-v648:region-shape-invalid");
  }
  let sum = 0;
  for (const channel of data) sum += channel;
  return sum / data.length;
}

export function inspectWebNebulaPaintV648(input) {
  const { build, previousMobile, currentDesktop, currentMobile,
    previousShot, currentShot, oldMean, newMean, sourceSha256 } = input;
  const issues = [];
  const check = (condition, code) => { if (!condition) issues.push(code); };
  const buildId = build?.buildId;
  const runtimeBuildId = build?.runtimeBuildId;
  check(build?.status === "passed" && build.exitCode === 0
    && build.sourceStable === true && build.inputBefore?.sha256 === sourceSha256
    && build.inputAfterSha256 === sourceSha256
    && typeof buildId === "string" && buildId.length > 0
    && runtimeBuildId === `mainline-a-${sourceSha256?.slice(0, 16)}`,
  "build-source-drift");
  for (const [role, raw, viewport] of [
    ["previous-mobile", previousMobile, [390, 844]],
    ["current-desktop", currentDesktop, [1280, 720]],
    ["current-mobile", currentMobile, [390, 844]],
  ]) {
    check(raw?.schema === "mainline-a-browser-raw-dom-v645"
      && raw.documentVisibility === "visible" && same(raw.viewport, viewport)
      && raw.dom?.build?.runtimeBuildId === runtimeBuildId
      && raw.dom?.build?.branch === build?.branch
      && raw.dom?.build?.head === build?.head
      && raw.dom?.markers?.scientificPayloadWriteback === "false"
      && raw.dom?.markers?.releaseBoundary === "candidate-only-hold-not-admitted",
    `${role}:runtime-identity-drift`);
    check(raw?.webRights?.webRelease === "blocked-rights-pending"
      && raw.webRights.selectedAdmission === "candidate-only"
      && raw.webRights.selectedRightsReview === "pending"
      && raw.webRights.clearedClaimVisible === false
      && same(raw.webRights.summaryCounts, [12, 18, 0, 30]),
    `${role}:rights-promotion`);
    check(raw?.preview?.selectedId === "m42"
      && raw.preview.imageComplete === true
      && raw.preview.naturalWidth === 1280
      && raw.preview.naturalHeight === 1378
      && raw.preview.imageSrc?.endsWith("/textures/mainline-a/opo0205d.jpg")
      && raw.preview.sourceHref === "https://esahubble.org/images/opo0205d/",
    `${role}:source-image-drift`);
  }
  for (const [role, raw] of [["current-desktop", currentDesktop],
    ["current-mobile", currentMobile]]) {
    check(raw?.preview?.renderState === "loaded"
      && raw.preview.computedOpacity >= 0.999,
    `${role}:paint-not-stable`);
  }
  check(Number.isFinite(oldMean) && oldMean > 0
    && Number.isFinite(newMean) && newMean > oldMean * 2,
  "screenshot-paint-not-improved");
  check(previousShot?.bytes > 0 && currentShot?.bytes > 0
    && previousShot.sha256 !== currentShot.sha256,
  "screenshot-identical-or-missing");
  return Object.freeze({ status: issues.length === 0
    ? "verified-local-visual-capture-correction" : "blocked",
    issues: Object.freeze(issues), buildId, runtimeBuildId, sourceSha256,
    oldMean, newMean, brightnessRatio: oldMean > 0 ? newMean / oldMean : null,
    region: REGION, physicalMobile: "not-run" });
}

export async function auditWebNebulaPaintV648() {
  const loaded = Object.fromEntries(await Promise.all(Object.entries(PATHS).map(
    async ([role, relative]) => [role, await pinned(relative, role !== "previousShot"
      && role !== "currentShot")])));
  const current = await captureBuildInputs();
  const previousShot = loaded.previousShot.value;
  const currentShot = loaded.currentShot.value;
  const previousMeta = await sharp(previousShot).metadata();
  const currentMeta = await sharp(currentShot).metadata();
  if (!same([previousMeta.width, previousMeta.height], [390, 844])
    || !same([currentMeta.width, currentMeta.height], [390, 844])) {
    throw new Error("paint-v648:screenshot-viewport-drift");
  }
  const inspected = inspectWebNebulaPaintV648({
    build: loaded.build.value,
    previousMobile: loaded.previousMobile.value,
    currentDesktop: loaded.currentDesktop.value,
    currentMobile: loaded.currentMobile.value,
    previousShot: loaded.previousShot.pin,
    currentShot: loaded.currentShot.pin,
    oldMean: await screenshotRegionMean(previousShot),
    newMean: await screenshotRegionMean(currentShot),
    sourceSha256: current.sha256,
  });
  return Object.freeze({ schema: SCHEMA, evidenceClass: "visual", ...inspected,
    inputs: Object.fromEntries(Object.entries(loaded).map(([role, item]) => [role, item.pin])),
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false },
    claims: { realUserValidation: false, productionPerformance: false,
      scientificValidity: false, copyrightApproval: false,
      publicWebReleaseApproved: false },
    note: "The earlier mobile screenshot was captured before the image opacity transition settled; the original image file was not changed." });
}

export function replayWebNebulaPaintV648(saved, fresh) {
  if (saved?.schema !== SCHEMA
    || saved.status !== "verified-local-visual-capture-correction"
    || fresh.status !== saved.status || !same(saved.inputs, fresh.inputs)
    || !same(saved.region, fresh.region)
    || saved.oldMean !== fresh.oldMean || saved.newMean !== fresh.newMean
    || saved.brightnessRatio !== fresh.brightnessRatio
    || saved.sourceSha256 !== fresh.sourceSha256 || saved.buildId !== fresh.buildId
    || saved.runtimeBuildId !== fresh.runtimeBuildId
    || !same(saved.boundary, fresh.boundary)
    || !same(saved.claims, fresh.claims)
    || saved.claims?.publicWebReleaseApproved !== false) {
    throw new Error("paint-v648:saved-replay-mismatch");
  }
  return Object.freeze({ status: "replayed-local-visual-capture-correction",
    buildId: fresh.buildId, runtimeBuildId: fresh.runtimeBuildId,
    sourceSha256: fresh.sourceSha256,
    brightnessRatio: fresh.brightnessRatio, publicWebRelease: "blocked" });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await auditWebNebulaPaintV648();
  const value = (name) => {
    const index = process.argv.indexOf(name);
    return index < 0 ? null : process.argv[index + 1];
  };
  const output = value("--output");
  const replay = value("--replay");
  for (const relative of [output, replay].filter(Boolean)) {
    if (!/^docs\/release\/v607\/[a-z0-9-]+\.json$/i.test(relative)) {
      throw new Error("paint-v648:receipt-path-invalid");
    }
  }
  if (output) await writeFile(path.join(ROOT, output),
    `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  if (replay) console.log(JSON.stringify(replayWebNebulaPaintV648(
    JSON.parse(await readFile(path.join(ROOT, replay), "utf8")), report), null, 2));
  else console.log(JSON.stringify({ status: report.status, issues: report.issues,
    brightnessRatio: report.brightnessRatio, output }, null, 2));
  if (report.status !== "verified-local-visual-capture-correction") process.exitCode = 1;
}
