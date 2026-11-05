import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeFile } from "./mainline-a-release-evidence.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = "app/data/mainlineACanonicalCoverageV622.generated.json";
const SCHEMA = "mainline-a-r66-web-pointer-matrix-verification-v649";
const VIEWPORTS = Object.freeze({ desktop: [1280, 720], mobile: [390, 844] });
const KINDS = Object.freeze(["star", "constellation", "nebula"]);
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const add = (issues, valid, code) => { if (!valid) issues.push(code); };
const timeValid = (value) => typeof value === "string" && Number.isFinite(Date.parse(value));
const descriptor = (relative, bytes) => ({ path: relative, bytes: bytes.length, sha256: sha(bytes) });
const buildPath = (runId) => `docs/release/v607/mainline-a-r66-build-20261011-v649web${runId?.slice(-2) ?? ""}.json`;
const originFor = (runId) => `http://127.0.0.1:${3091 + Number(runId?.slice(-2) ?? NaN)}/`;

function pngSize(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 24
    || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    || bytes.toString("ascii", 12, 16) !== "IHDR") return null;
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

function rawPath(device, runId) {
  return `docs/release/v607/mainline-a-r66-web-pointer-${device}-raw-${runId}.json`;
}

function screenshotPath(device, row, runId) {
  return `output/playwright/mainline-a-web-pointer-${device}-${row.kind}-${row.id}-${runId}.png`;
}

function falseClaims(claims) {
  return claims && Object.keys(claims).length === 5
    && Object.values(claims).every((value) => value === false);
}

function checkManifest(issues, manifest) {
  const rows = KINDS.flatMap((kind) => manifest?.records?.filter((row) => row.kind === kind) ?? []);
  add(issues, manifest?.schema === "mainline-a-canonical-coverage-v622"
    && rows.length === 36 && KINDS.every((kind) => rows.filter((row) => row.kind === kind).length === 12)
    && new Set(rows.map((row) => `${row.kind}:${row.id}`)).size === 36,
  "manifest-coverage-invalid");
  for (const row of rows) {
    add(issues, row.candidateOnly === true && row.runtimeAdmission === "candidate-only"
      && row.measurementAdmission === "not-admitted"
      && row.scientificPayloadWriteback === false,
    `${row.kind}:${row.id}:manifest-promoted`);
    if (row.kind === "nebula") add(issues, row.status === "rights-pending"
      && /^[a-f0-9]{64}$/.test(row.route?.assetHash ?? ""),
    `nebula:${row.id}:manifest-rights-or-asset-invalid`);
  }
  return rows;
}

function checkPointer(issues, device, key, record, viewport) {
  const label = record?.label ?? "missing";
  const center = record?.center;
  add(issues, record?.inputMethod === "pointer"
    && record.targetOwnsHit === true && record.targetConnected === true
    && record.targetTag === "button"
    && Array.isArray(center) && center.length === 2
    && center.every(Number.isFinite)
    && center[0] >= 0 && center[0] < viewport[0]
    && center[1] >= 0 && center[1] < viewport[1]
    && same(record.viewport, viewport),
  `${device}:${key}:pointer-hit-invalid:${label}`);
}

function checkItem(issues, input, device, raw, row, item, index) {
  const { build, runId, screenshots } = input;
  const key = `${row.kind}:${row.id}`;
  const viewport = VIEWPORTS[device];
  const selected = row.kind === "star" ? `stellar-hero:${row.id}` : key;
  const expectedReadout = `运行时对象：${key} · ready`;
  const observed = item?.observed;
  add(issues, item?.key === key && item.readout === expectedReadout
    && observed?.selectedCatalogId === selected && observed.runtimeBuildId === build?.runtimeBuildId
    && observed.releaseBoundary === "candidate-only-hold-not-admitted"
    && observed.scientificPayloadWriteback === "false"
    && observed.sceneMode === "inspect",
  `${device}:${key}:runtime-or-build-invalid`);
  add(issues, same(observed?.viewport, viewport)
    && observed.visibility === "visible" && observed.domWidth <= viewport[0]
    && observed.url === originFor(runId),
  `${device}:${key}:viewport-or-url-invalid`);
  add(issues, timeValid(observed?.capturedAt)
    && Date.parse(observed.capturedAt) >= Date.parse(raw?.startedAt)
    && Date.parse(observed.capturedAt) <= Date.parse(raw?.endedAt)
    && (index === 0 || Date.parse(observed.capturedAt)
      >= Date.parse(raw?.items?.[index - 1]?.observed?.capturedAt)),
  `${device}:${key}:capture-time-invalid`);
  add(issues, typeof observed?.passport?.id === "string"
    && observed.passport.id.length > 0
    && typeof observed.passport.kind === "string"
    && observed.passport.kind.length > 0,
  `${device}:${key}:passport-missing`);
  if (row.kind === "constellation") add(issues,
    observed?.constellation?.id === row.id
    && observed.constellation.source === "candidate-only"
    && observed.constellation.writeback === "false"
    && observed.passport.id === key,
  `${device}:${key}:chart-invalid`);
  if (row.kind === "nebula") add(issues,
    observed?.nebula?.id === row.id && observed.nebula.state === "ready"
    && observed.nebula.sha256 === row.route?.assetHash
    && observed.nebula.rights === "pending"
    && observed.nebula.admission === "candidate-only"
    && observed.passport.id === key,
  `${device}:${key}:scene-image-or-rights-invalid`);

  const selection = item?.selection;
  const pointer = selection?.pointer ?? [];
  const minimumPointerEvents = row.kind === "star" ? 3
    : row.kind === "constellation" ? 2
      : device === "mobile" && index === 24 ? 3 : 1;
  add(issues, pointer.length >= minimumPointerEvents
    && pointer.every((record) => record?.inputMethod === "pointer"),
  `${device}:${key}:pointer-route-incomplete`);
  for (const record of pointer) checkPointer(issues, device, key, record, viewport);
  const required = row.kind === "star" ? `select-star:${row.id}`
    : row.kind === "constellation" ? `select-constellation:${row.id}`
      : `select-nebula:${row.id}`;
  add(issues, pointer.some((record) => record.label === required),
  `${device}:${key}:selection-pointer-missing`);
  if (device === "mobile" && row.kind !== "star") {
    add(issues, selection?.browserAutoClosed === true,
      `${device}:${key}:browser-not-auto-closed`);
  }
  if (device === "mobile" && row.kind === "nebula" && index === 24) {
    add(issues, pointer.some((record) => record.label === "close-object-browser-over-passport-trigger")
      && pointer.some((record) => record.label === "expand-deep-sky-over-passport-trigger"),
    `${device}:${key}:previously-occluded-controls-not-tested`);
  }
  const screenshot = item?.screenshot;
  const bytes = screenshots?.[screenshot?.path];
  add(issues, screenshot?.path === screenshotPath(device, row, runId)
    && Buffer.isBuffer(bytes) && screenshot.bytes === bytes.length
    && screenshot.sha256 === sha(bytes) && same(pngSize(bytes), viewport),
  `${device}:${key}:screenshot-digest-invalid`);
}

export function inspectWebPointerMatrixV649(input) {
  const { raws, build, manifest, manifestBytes, sourceSha256, runId } = input;
  const issues = [];
  const rows = checkManifest(issues, manifest);
  add(issues, /^\d{8}-v649pointer0[1-3]$/.test(runId ?? ""), "run-id-invalid");
  add(issues, build?.status === "passed" && build.sourceStable === true
    && build.exitCode === 0 && build.inputBefore?.sha256 === sourceSha256
    && build.inputAfterSha256 === sourceSha256
    && build.runtimeBuildId === `mainline-a-${sourceSha256?.slice(0, 16)}`,
  "build-not-current-stable");
  for (const device of Object.keys(VIEWPORTS)) {
    const raw = raws?.[device];
    const viewport = VIEWPORTS[device];
    add(issues, raw?.schema === "mainline-a-r66-web-pointer-matrix-v649"
      && raw.evidenceClass === "browser" && raw.device === device
      && raw.runId === runId && same(raw.viewport, viewport)
      && raw.physicalDevice === false,
    `${device}:raw-identity-invalid`);
    add(issues, timeValid(raw?.startedAt) && timeValid(raw?.endedAt)
      && Date.parse(raw.endedAt) >= Date.parse(raw.startedAt),
    `${device}:time-invalid`);
    add(issues, raw?.build?.path === buildPath(runId) && raw.build.buildId === build?.buildId
      && raw.build.runtimeBuildId === build.runtimeBuildId
      && raw.build.sourceSha256 === sourceSha256
      && raw.build.branch === build.branch && raw.build.head === build.head,
    `${device}:build-drift`);
    add(issues, Buffer.isBuffer(manifestBytes)
      && raw?.manifest?.path === MANIFEST
      && raw.manifest.bytes === manifestBytes.length
      && raw.manifest.sha256 === sha(manifestBytes),
    `${device}:manifest-digest-drift`);
    add(issues, raw?.counts?.total === 36 && raw.counts.stars === 12
      && raw.counts.constellations === 12 && raw.counts.nebulae === 12
      && raw.counts.keyboardActivations === 0 && raw.counts.humanRightsSigned === 0
      && Array.isArray(raw.errors) && raw.errors.length === 0,
    `${device}:counts-or-browser-errors-invalid`);
    add(issues, raw?.boundary?.candidateOnly === true && raw.boundary.hold === true
      && raw.boundary.notAdmitted === true
      && raw.boundary.scientificPayloadWriteback === false
      && falseClaims(raw.claims),
    `${device}:claims-or-boundary-promoted`);
    add(issues, raw?.items?.length === 36
      && same(raw.items.map((item) => item.key), rows.map((row) => `${row.kind}:${row.id}`)),
    `${device}:coverage-or-order-invalid`);
    for (const [index, row] of rows.entries()) {
      checkItem(issues, input, device, raw, row, raw?.items?.[index], index);
    }
  }
  return Object.freeze({
    status: issues.length ? "failed" : "verified-local-pointer-matrix-candidate",
    issues: Object.freeze(issues), sourceSha256, buildId: build?.buildId,
    counts: { desktopPointerReady: 36, mobilePointerReady: 36,
      screenshotHashes: 72, keyboardActivations: 0, humanRightsSigned: 0 },
    physicalMobile: "not-run", publicWebRelease: "blocked",
  });
}

async function read(relative) {
  return readFile((await safeFile(ROOT, relative)).absolute);
}

export async function auditWebPointerMatrixV649(runId) {
  if (!/^\d{8}-v649pointer0[1-3]$/.test(runId ?? ""))
    throw new Error("pointer-matrix-v649:run-id-invalid");
  const buildRelative = buildPath(runId);
  const paths = Object.fromEntries(Object.keys(VIEWPORTS)
    .map((device) => [device, rawPath(device, runId)]));
  const [desktopBytes, mobileBytes, buildBytes, manifestBytes, source] = await Promise.all([
    read(paths.desktop), read(paths.mobile), read(buildRelative), read(MANIFEST), captureBuildInputs(),
  ]);
  const raws = { desktop: JSON.parse(desktopBytes.toString("utf8")),
    mobile: JSON.parse(mobileBytes.toString("utf8")) };
  const screenshotPaths = Object.values(raws).flatMap((raw) => raw.items
    .map((item) => item.screenshot?.path).filter(Boolean));
  const screenshots = Object.fromEntries(await Promise.all(screenshotPaths
    .map(async (relative) => [relative, await read(relative)])));
  const result = inspectWebPointerMatrixV649({ raws,
    build: JSON.parse(buildBytes.toString("utf8")),
    manifest: JSON.parse(manifestBytes.toString("utf8")), manifestBytes,
    sourceSha256: source.sha256, runId, screenshots });
  return Object.freeze({ schema: SCHEMA, evidenceClass: "browser", ...result,
    inputs: { desktop: descriptor(paths.desktop, desktopBytes),
      mobile: descriptor(paths.mobile, mobileBytes), build: descriptor(buildRelative, buildBytes),
      manifest: descriptor(MANIFEST, manifestBytes),
      screenshots: Object.fromEntries(Object.entries(screenshots)
        .map(([relative, bytes]) => [relative, descriptor(relative, bytes)])) },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false },
    claims: { realUserValidation: false, productionPerformance: false,
      scientificValidity: false, copyrightApproval: false,
      publicWebReleaseApproved: false } });
}

export function replayWebPointerMatrixV649(saved, fresh) {
  if (saved?.schema !== SCHEMA || saved.status !== "verified-local-pointer-matrix-candidate"
    || !same(saved, fresh)) throw new Error("pointer-matrix-v649:saved-replay-mismatch");
  return Object.freeze({ status: "replayed-local-pointer-matrix-candidate",
    sourceSha256: fresh.sourceSha256, buildId: fresh.buildId,
    desktopPointerReady: 36, mobilePointerReady: 36,
    publicWebRelease: "blocked" });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const runId = process.argv[process.argv.indexOf("--run") + 1];
  const outputIndex = process.argv.indexOf("--output");
  const replayIndex = process.argv.indexOf("--replay");
  const report = await auditWebPointerMatrixV649(runId);
  if (outputIndex >= 0) {
    const target = process.argv[outputIndex + 1];
    if (!/^docs\/release\/v607\/[a-z0-9-]+\.json$/i.test(target ?? ""))
      throw new Error("pointer-matrix-v649:output-path-invalid");
    await writeFile(path.join(ROOT, target), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  }
  if (replayIndex >= 0) {
    const target = process.argv[replayIndex + 1];
    if (!/^docs\/release\/v607\/[a-z0-9-]+\.json$/i.test(target ?? ""))
      throw new Error("pointer-matrix-v649:replay-path-invalid");
    console.log(JSON.stringify(replayWebPointerMatrixV649(
      JSON.parse((await read(target)).toString("utf8")), report), null, 2));
  } else console.log(JSON.stringify({ status: report.status,
    issues: report.issues, counts: report.counts, buildId: report.buildId }, null, 2));
  if (report.status === "failed") process.exitCode = 1;
}
