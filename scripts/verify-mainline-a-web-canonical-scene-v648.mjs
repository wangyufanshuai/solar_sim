import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeFile } from "./mainline-a-release-evidence.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const R80_PROFILE = process.env.MAINLINE_A_R80_PROFILE === "1";
const BUILD = R80_PROFILE
  ? `docs/release/v607/mainline-a-r80-build-${process.env.MAINLINE_A_R80_BUILD_RUN_ID}.json`
  : "docs/release/v607/mainline-a-r66-build-20261007-v648web01.json";
const MANIFEST = "app/data/mainlineACanonicalCoverageV622.generated.json";
const ORIGIN = R80_PROFILE
  ? process.env.MAINLINE_A_R80_ORIGIN : "http://127.0.0.1:3091/";
const SCHEMA = R80_PROFILE
  ? "mainline-a-r80-web-canonical-scene-verification-v667"
  : "mainline-a-r66-web-canonical-scene-verification-v648";
const RAW_SCHEMA = R80_PROFILE
  ? "mainline-a-r80-web-canonical-scene-raw-v667"
  : "mainline-a-r66-web-canonical-scene-raw-v648";
const RUN_PATTERN = R80_PROFILE
  ? /^\d{8}-v667scene\d{2}$/
  : /^\d{8}-v648scene\d{2}$/;
const VIEWPORTS = Object.freeze({ desktop: [1280, 720], mobile: [390, 844] });
const KINDS = Object.freeze(["star", "constellation", "nebula"]);
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const add = (issues, valid, code) => { if (!valid) issues.push(code); };
const validTime = (value) => typeof value === "string" && Number.isFinite(Date.parse(value));
const falseClaims = (claims) => claims && Object.keys(claims).length === 5
  && Object.values(claims).every((value) => value === false);
const descriptor = (relative, bytes) => ({ path: relative, bytes: bytes.length, sha256: sha(bytes) });

function pngDimensions(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 24
    || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    || bytes.toString("ascii", 12, 16) !== "IHDR") return null;
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

function rawPath(device, runId) {
  return `docs/release/v607/mainline-a-${R80_PROFILE ? "r80" : "r66"}-web-canonical-scene-${device}-raw-${runId}.json`;
}

function expectedScreenshot(device, row, runId) {
  return `output/playwright/mainline-a-${R80_PROFILE ? "r80-" : ""}web-canonical-scene-${device}-${row.kind}-${row.id}-${runId}.png`;
}

function checkManifest(issues, manifest) {
  const rows = manifest?.records ?? [];
  add(issues, manifest?.schema === "mainline-a-canonical-coverage-v622"
    && rows.length === 36 && KINDS.every((kind) => rows.filter((row) => row.kind === kind).length === 12)
    && new Set(rows.map((row) => `${row.kind}:${row.id}`)).size === 36,
  "manifest-coverage-invalid");
  for (const row of rows) {
    const prefix = `${row.kind}:${row.id}`;
    add(issues, row.candidateOnly === true && row.runtimeAdmission === "candidate-only"
      && row.measurementAdmission === "not-admitted"
      && row.scientificPayloadWriteback === false,
    `${prefix}:manifest-promoted`);
    if (row.kind === "nebula") add(issues, row.status === "rights-pending"
      && /^[a-f0-9]{64}$/.test(row.route?.assetHash ?? "")
      && row.route?.assetPath?.startsWith("public/textures/mainline-a/"),
    `${prefix}:manifest-asset-or-rights-invalid`);
    if (row.kind === "constellation") add(issues,
      row.route?.route === "mainline-a-constellation-lines", `${prefix}:manifest-route-invalid`);
    if (row.kind === "star") add(issues,
      row.route?.route === "mainline-a-stellar-parametric", `${prefix}:manifest-route-invalid`);
  }
  return KINDS.flatMap((kind) => rows.filter((row) => row.kind === kind));
}

function checkItem(issues, input, device, raw, row, item, index) {
  const { build, runId, screenshots } = input;
  const viewport = VIEWPORTS[device];
  const key = `${row.kind}:${row.id}`;
  const observed = item?.observed;
  const selected = row.kind === "star" ? `stellar-hero:${row.id}` : key;
  const expectedRuntime = `运行时对象：${key} · ready`;
  add(issues, item?.key === key && item.runtime === expectedRuntime
    && observed?.targetKind === row.kind && observed?.targetId === row.id,
  `${device}:${key}:runtime-not-ready`);
  add(issues, observed?.selectedCatalogId === selected && observed.sceneMode === "inspect"
    && typeof observed.passport?.id === "string" && observed.passport.id.length > 0
    && typeof observed.passport?.kind === "string" && observed.passport.kind.length > 0,
  `${device}:${key}:selection-or-passport-invalid`);
  add(issues, same(observed?.viewport, viewport) && observed.visibility === "visible"
    && observed.domWidth <= viewport[0] && observed.url === ORIGIN,
  `${device}:${key}:viewport-or-url-invalid`);
  add(issues, observed?.build?.runtimeBuildId === build?.runtimeBuildId
    && observed.build.branch === build.branch && observed.build.head === build.head
    && observed.boundary?.shell === "candidate-only-hold-not-admitted"
    && observed.boundary.scientificPayloadWriteback === "false",
  `${device}:${key}:build-or-boundary-drift`);
  add(issues, validTime(observed?.capturedAt)
    && Date.parse(observed.capturedAt) >= Date.parse(raw.startedAt)
    && Date.parse(observed.capturedAt) <= Date.parse(raw.endedAt)
    && (index === 0 || Date.parse(observed.capturedAt)
      >= Date.parse(raw.items[index - 1]?.observed?.capturedAt)),
  `${device}:${key}:capture-time-invalid`);
  add(issues, /^\d+$/.test(observed?.registry?.total ?? "")
    && /^[a-f0-9]{8}$/.test(observed?.registry?.identityDigest ?? ""),
  `${device}:${key}:resource-readout-invalid`);
  if (row.kind === "constellation") add(issues,
    observed?.passport?.id === key && observed.passport.kind === "constellation"
    && observed.constellation?.id === row.id
    && observed.constellation.source === "candidate-only"
    && observed.constellation.writeback === "false",
  `${device}:${key}:chart-invalid`);
  if (row.kind === "nebula") add(issues,
    observed?.passport?.id === key && observed.passport.kind === "nebula"
    && observed.nebula?.id === row.id && observed.nebula.state === "ready"
    && observed.nebula.sha256 === row.route?.assetHash
    && observed.nebula.rights === "pending"
    && observed.nebula.admission === "candidate-only",
  `${device}:${key}:scene-image-or-rights-invalid`);
  const screenshot = item?.screenshot;
  const bytes = screenshots?.[screenshot?.path];
  add(issues, screenshot?.path === expectedScreenshot(device, row, runId)
    && Buffer.isBuffer(bytes) && screenshot.bytes === bytes.length
    && screenshot.sha256 === sha(bytes)
    && same(pngDimensions(bytes), viewport),
  `${device}:${key}:screenshot-digest-invalid`);
}

export function inspectWebCanonicalSceneV648(input) {
  const { raws, build, manifest, manifestBytes, sourceSha256, runId } = input;
  const issues = [];
  const rows = checkManifest(issues, manifest);
  add(issues, RUN_PATTERN.test(runId ?? ""), "run-id-invalid");
  add(issues, build?.status === "passed" && build.sourceStable === true
    && build.exitCode === 0 && build.inputBefore?.sha256 === sourceSha256
    && build.inputAfterSha256 === sourceSha256
    && build.runtimeBuildId === `mainline-a-${sourceSha256?.slice(0, 16)}`,
  "build-not-current-stable");
  for (const device of Object.keys(VIEWPORTS)) {
    const raw = raws?.[device];
    const viewport = VIEWPORTS[device];
    add(issues, raw?.schema === RAW_SCHEMA
      && (!R80_PROFILE || raw.profile === "r80")
      && raw.evidenceClass === "browser" && raw.device === device
      && raw.runId === runId && same(raw.viewport, viewport)
      && raw.physicalDevice === false, `${device}:raw-identity-invalid`);
    add(issues, validTime(raw?.startedAt) && validTime(raw?.endedAt)
      && Date.parse(raw.endedAt) >= Date.parse(raw.startedAt),
    `${device}:time-invalid`);
    add(issues, raw?.build?.buildId === build?.buildId
      && raw.build.runtimeBuildId === build.runtimeBuildId
      && raw.build.sourceSha256 === sourceSha256
      && raw.build.branch === build.branch && raw.build.head === build.head,
    `${device}:build-drift`);
    add(issues, Buffer.isBuffer(manifestBytes)
      && raw?.manifest?.path === MANIFEST
      && raw.manifest.bytes === manifestBytes.length
      && raw.manifest.sha256 === sha(manifestBytes)
      && raw.manifest.schema === manifest?.schema,
    `${device}:manifest-digest-drift`);
    add(issues, raw?.boundary?.candidateOnly === true && raw.boundary.hold === true
      && raw.boundary.notAdmitted === true
      && raw.boundary.scientificPayloadWriteback === false
      && falseClaims(raw.claims), `${device}:claim-promoted`);
    add(issues, raw?.counts?.total === 36 && raw.counts.stars === 12
      && raw.counts.constellations === 12 && raw.counts.nebulae === 12
      && raw.counts.humanRightsSigned === 0
      && Array.isArray(raw.errors) && raw.errors.length === 0,
    `${device}:counts-or-browser-errors-invalid`);
    add(issues, raw?.items?.length === 36
      && same(raw.items.map((item) => item.key), rows.map((row) => `${row.kind}:${row.id}`)),
    `${device}:coverage-or-order-invalid`);
    for (const [index, row] of rows.entries()) {
      const item = raw?.items?.[index];
      checkItem(issues, input, device, raw ?? {}, row, item, index);
    }
  }
  return Object.freeze({
    status: issues.length ? "failed" : "verified-local-browser-scenes-candidate",
    issues: Object.freeze(issues), sourceSha256, buildId: build?.buildId,
    counts: { desktopSelectedReady: 36, mobileViewportSelectedReady: 36,
      screenshotsHashed: 72, humanRightsSigned: 0 },
    physicalMobile: "not-run", publicWebRelease: "blocked",
  });
}

async function read(relative) {
  return readFile((await safeFile(ROOT, relative)).absolute);
}

export async function auditWebCanonicalSceneV648(runId) {
  if (!RUN_PATTERN.test(runId ?? ""))
    throw new Error("canonical-scene-v648:run-id-invalid");
  const rawPaths = Object.fromEntries(Object.keys(VIEWPORTS)
    .map((device) => [device, rawPath(device, runId)]));
  const [desktopBytes, mobileBytes, buildBytes, manifestBytes, source] = await Promise.all([
    read(rawPaths.desktop), read(rawPaths.mobile), read(BUILD), read(MANIFEST), captureBuildInputs(),
  ]);
  const raws = { desktop: JSON.parse(desktopBytes.toString("utf8")),
    mobile: JSON.parse(mobileBytes.toString("utf8")) };
  const imagePaths = Object.values(raws).flatMap((raw) => raw.items
    .map((item) => item.screenshot?.path).filter(Boolean));
  const screenshots = Object.fromEntries(await Promise.all(imagePaths
    .map(async (relative) => [relative, await read(relative)])));
  const result = inspectWebCanonicalSceneV648({ raws,
    build: JSON.parse(buildBytes.toString("utf8")),
    manifest: JSON.parse(manifestBytes.toString("utf8")), manifestBytes,
    sourceSha256: source.sha256, runId, screenshots });
  return Object.freeze({ schema: SCHEMA, evidenceClass: "browser", ...result,
    inputs: { desktop: descriptor(rawPaths.desktop, desktopBytes),
      mobile: descriptor(rawPaths.mobile, mobileBytes),
      build: descriptor(BUILD, buildBytes), manifest: descriptor(MANIFEST, manifestBytes),
      screenshots: Object.fromEntries(Object.entries(screenshots)
        .map(([relative, bytes]) => [relative, descriptor(relative, bytes)])) },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false },
    claims: { realUserValidation: false, productionPerformance: false,
      scientificValidity: false, copyrightApproval: false,
      publicWebReleaseApproved: false } });
}

export function replayWebCanonicalSceneV648(saved, fresh) {
  if (saved?.schema !== SCHEMA || saved.status !== "verified-local-browser-scenes-candidate"
    || !same(saved, fresh)) throw new Error("canonical-scene-v648:saved-replay-mismatch");
  return Object.freeze({ status: "replayed-local-browser-scenes-candidate",
    sourceSha256: fresh.sourceSha256, buildId: fresh.buildId,
    desktopSelectedReady: 36, mobileViewportSelectedReady: 36,
    publicWebRelease: "blocked" });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const runId = process.argv[process.argv.indexOf("--run") + 1];
  const outputIndex = process.argv.indexOf("--output");
  const replayIndex = process.argv.indexOf("--replay");
  const report = await auditWebCanonicalSceneV648(runId);
  if (outputIndex >= 0) {
    const target = process.argv[outputIndex + 1];
    if (!/^docs\/release\/v607\/[a-z0-9-]+\.json$/i.test(target ?? ""))
      throw new Error("canonical-scene-v648:output-path-invalid");
    await writeFile(path.join(ROOT, target), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  }
  if (replayIndex >= 0) {
    const target = process.argv[replayIndex + 1];
    if (!/^docs\/release\/v607\/[a-z0-9-]+\.json$/i.test(target ?? ""))
      throw new Error("canonical-scene-v648:replay-path-invalid");
    console.log(JSON.stringify(replayWebCanonicalSceneV648(
      JSON.parse((await read(target)).toString("utf8")), report), null, 2));
  } else console.log(JSON.stringify({ status: report.status,
    issues: report.issues, counts: report.counts, buildId: report.buildId }, null, 2));
  if (report.status === "failed") process.exitCode = 1;
}
