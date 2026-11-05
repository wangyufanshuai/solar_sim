import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeFile } from "./mainline-a-release-evidence.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = "docs/release/v607/mainline-a-r66-build-20261007-v648web01.json";
const MANIFEST = "app/data/mainlineACanonicalCoverageV622.generated.json";
const SCHEMA = "mainline-a-r66-web-nebula-matrix-verification-v648";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const add = (issues, okay, code) => { if (!okay) issues.push(code); };

function pngSize(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 24
    || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    || bytes.toString("ascii", 12, 16) !== "IHDR") return null;
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}
function intersectsViewport(rect, viewport) {
  return rect && [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)
    && rect.width > 0 && rect.height > 0
    && rect.x < viewport[0] && rect.y < viewport[1]
    && rect.x + rect.width > 0 && rect.y + rect.height > 0;
}
function fitsViewport(rect, viewport) {
  return intersectsViewport(rect, viewport) && rect.x >= -1 && rect.y >= -1
    && rect.x + rect.width <= viewport[0] + 1
    && rect.y + rect.height <= viewport[1] + 1;
}
function descriptor(pathName, bytes) {
  return { path: pathName, bytes: bytes.length, sha256: sha(bytes) };
}
function claimBoundary(issues, raw) {
  add(issues, raw?.boundary?.candidateOnly === true && raw.boundary.hold === true
    && raw.boundary.notAdmitted === true && raw.boundary.scientificPayloadWriteback === false,
  "raw-boundary-promoted");
  add(issues, raw?.claims && Object.values(raw.claims).every((value) => value === false),
    "raw-claim-promoted");
  add(issues, raw?.counts?.canonicalNebulae === 12
    && raw.counts.desktopPainted === 12 && raw.counts.mobilePainted === 12
    && raw.counts.humanRightsSigned === 0, "raw-counts-promoted");
}

export function inspectWebNebulaMatrixV648(input) {
  const { raw, build, manifest, manifestBytes, sourceSha256, runId,
    assetBytes = {}, screenshotBytes = {} } = input;
  const issues = [];
  const rows = manifest?.records?.filter((row) => row.kind === "nebula") ?? [];
  const ids = rows.map((row) => row.id);
  add(issues, raw?.schema === "mainline-a-r66-web-nebula-matrix-raw-v648"
    && raw.evidenceClass === "browser", "raw-schema-invalid");
  add(issues, /^\d{8}-v648matrix\d{2}$/.test(runId ?? ""), "run-id-invalid");
  add(issues, Number.isFinite(Date.parse(raw?.createdAt))
    && Number.isFinite(Date.parse(raw?.endedAt))
    && Date.parse(raw.endedAt) >= Date.parse(raw.createdAt), "raw-time-invalid");
  add(issues, build?.status === "passed" && build.sourceStable === true
    && build.exitCode === 0 && build.inputBefore?.sha256 === sourceSha256
    && build.inputAfterSha256 === sourceSha256
    && build.runtimeBuildId === `mainline-a-${sourceSha256?.slice(0, 16)}`,
  "build-not-current-stable");
  add(issues, raw?.build?.buildId === build?.buildId
    && raw.build.runtimeBuildId === build.runtimeBuildId
    && raw.build.sourceSha256 === sourceSha256
    && raw.build.branch === build.branch && raw.build.head === build.head,
  "raw-build-identity-drift");
  add(issues, Buffer.isBuffer(manifestBytes)
    && raw?.manifest?.path === MANIFEST
    && raw.manifest.bytes === manifestBytes.length
    && raw.manifest.sha256 === sha(manifestBytes)
    && raw.manifest.schema === manifest?.schema, "manifest-digest-drift");
  add(issues, rows.length === 12 && new Set(ids).size === 12,
    "manifest-nebula-count-invalid");
  claimBoundary(issues, raw);

  const assets = raw?.assetFiles ?? [];
  add(issues, assets.length === 12 && same(assets.map((item) => item.id), ids),
    "asset-list-coverage-invalid");
  for (const row of rows) {
    const item = assets.find((asset) => asset.id === row.id);
    const bytes = assetBytes[row.route?.assetPath];
    add(issues, row.status === "rights-pending" && row.candidateOnly === true
      && row.scientificPayloadWriteback === false
      && row.measurementAdmission === "not-admitted"
      && row.runtimeAdmission === "candidate-only", `${row.id}-manifest-promotion`);
    add(issues, item?.path === row.route.assetPath
      && item.bytes === bytes?.length && item.sha256 === sha(bytes ?? Buffer.alloc(0))
      && item.sha256 === row.route.assetHash,
    `${row.id}-asset-digest-drift`);
  }

  for (const [device, viewport] of [["desktop", [1280, 720]], ["mobile", [390, 844]]]) {
    const deviceRaw = raw?.[device];
    add(issues, deviceRaw?.device === device && same(deviceRaw.viewport, viewport)
      && deviceRaw.physicalDevice === false
      && Array.isArray(deviceRaw.errors) && deviceRaw.errors.length === 0,
    `${device}-device-invalid`);
    add(issues, deviceRaw?.items?.length === 12
      && same(deviceRaw.items.map((item) => item.id), ids),
    `${device}-item-coverage-invalid`);
    for (const row of rows) {
      const item = deviceRaw?.items?.find((entry) => entry.id === row.id);
      const observed = item?.observed;
      const preview = observed?.preview;
      const rights = observed?.rights;
      const screenshot = item?.screenshot;
      const png = screenshotBytes[screenshot?.path];
      const expectedPath = `output/playwright/mainline-a-web-nebula-matrix-${device}-${row.id}-${runId}.png`;
      add(issues, same(observed?.viewport, viewport)
        && observed.visibility === "visible"
        && observed.url === "http://127.0.0.1:3091/"
        && observed.domWidth <= viewport[0]
        && observed.selectedId === row.id && observed.scope === "current"
        && observed.resultCount === 12,
      `${device}-${row.id}-selection-invalid`);
      add(issues, observed?.build?.runtimeBuildId === build?.runtimeBuildId
        && observed.build.branch === build.branch && observed.build.head === build.head
        && observed.boundary?.shell === "candidate-only-hold-not-admitted"
        && observed.boundary.scientificPayloadWriteback === "false"
        && observed.boundary.atlasRelease === "blocked-rights-pending",
      `${device}-${row.id}-build-or-boundary-drift`);
      add(issues, preview?.state === "loaded" && preview.complete === true
        && preview.naturalWidth > 0 && preview.naturalHeight > 0
        && preview.opacity >= 0.999
        && preview.src === `http://127.0.0.1:3091/${row.route.assetPath.slice(7)}`
        && intersectsViewport(preview.imageRect, viewport)
        && fitsViewport(observed.dialogRect, viewport),
      `${device}-${row.id}-preview-not-painted`);
      add(issues, rights?.releaseAdmission === "candidate-only"
        && rights.humanReview === "pending"
        && rights.visibleText === true
        && rights.sourceHref === row.source.sourceUrl,
      `${device}-${row.id}-rights-or-source-promoted`);
      add(issues, screenshot?.path === expectedPath
        && Buffer.isBuffer(png) && screenshot.bytes === png.length
        && screenshot.sha256 === sha(png)
        && same(pngSize(png), viewport),
      `${device}-${row.id}-screenshot-digest-drift`);
    }
  }
  add(issues, raw?.failureRecovery?.scope === "browser-fault-injection-only"
    && raw.failureRecovery.simulatedNetworkFailure === true
    && raw.failureRecovery.realExternalSourceFailure === false
    && raw.failureRecovery.failed?.state === "failed"
    && raw.failureRecovery.failed.retryVisible === true
    && raw.failureRecovery.failed.rights === "pending"
    && raw.failureRecovery.recovered?.complete === true
    && raw.failureRecovery.recovered.naturalWidth > 0,
  "fault-injection-recovery-invalid");
  return Object.freeze({ status: issues.length ? "failed" : "verified-local-browser-matrix-candidate",
    issues: Object.freeze(issues), sourceSha256, buildId: build?.buildId,
    counts: { desktopPainted: 12, mobilePainted: 12, rightsSigned: 0 },
    physicalMobile: "not-run", publicWebRelease: "blocked" });
}

async function loadBytes(relative) {
  const file = await safeFile(ROOT, relative);
  return readFile(file.absolute);
}
export async function auditWebNebulaMatrixV648(rawRelative) {
  if (!/^docs\/release\/v607\/mainline-a-r66-web-nebula-matrix-raw-\d{8}-v648matrix\d{2}\.json$/.test(rawRelative))
    throw new Error("matrix-v648:raw-path-invalid");
  const [rawBytes, buildBytes, manifestBytes, source] = await Promise.all([
    loadBytes(rawRelative), loadBytes(BUILD), loadBytes(MANIFEST), captureBuildInputs(),
  ]);
  const raw = JSON.parse(rawBytes.toString("utf8"));
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const rows = manifest.records.filter((row) => row.kind === "nebula");
  const assets = Object.fromEntries(await Promise.all(rows.map(async (row) =>
    [row.route.assetPath, await loadBytes(row.route.assetPath)])));
  const paths = [...(raw.desktop?.items ?? []), ...(raw.mobile?.items ?? [])]
    .map((item) => item.screenshot?.path).filter(Boolean);
  const screenshots = Object.fromEntries(await Promise.all(paths.map(async (relative) =>
    [relative, await loadBytes(relative)])));
  const result = inspectWebNebulaMatrixV648({ raw,
    build: JSON.parse(buildBytes.toString("utf8")), manifest, manifestBytes,
    sourceSha256: source.sha256, runId: path.basename(rawRelative).match(/(\d{8}-v648matrix\d{2})\.json$/)?.[1],
    assetBytes: assets, screenshotBytes: screenshots });
  return Object.freeze({ schema: SCHEMA, evidenceClass: "browser", ...result,
    inputs: { raw: descriptor(rawRelative, rawBytes), build: descriptor(BUILD, buildBytes),
      manifest: descriptor(MANIFEST, manifestBytes),
      assets: Object.fromEntries(Object.entries(assets).map(([key, bytes]) => [key, descriptor(key, bytes)])),
      screenshots: Object.fromEntries(Object.entries(screenshots)
        .map(([key, bytes]) => [key, descriptor(key, bytes)])) },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false },
    claims: { realUserValidation: false, productionPerformance: false,
      scientificValidity: false, copyrightApproval: false, publicWebReleaseApproved: false } });
}
export function replayWebNebulaMatrixV648(saved, fresh) {
  if (saved?.schema !== SCHEMA || saved.status !== "verified-local-browser-matrix-candidate"
    || fresh.status !== saved.status || !same(saved.inputs, fresh.inputs)
    || saved.sourceSha256 !== fresh.sourceSha256 || saved.buildId !== fresh.buildId
    || saved.counts?.desktopPainted !== 12 || saved.counts?.mobilePainted !== 12
    || saved.counts?.rightsSigned !== 0 || saved.publicWebRelease !== "blocked"
    || saved.boundary?.scientificPayloadWriteback !== false
    || Object.values(saved.claims ?? {}).some((value) => value !== false))
    throw new Error("matrix-v648:saved-replay-mismatch");
  return Object.freeze({ status: "replayed-local-browser-matrix-candidate",
    sourceSha256: fresh.sourceSha256, buildId: fresh.buildId,
    desktopPainted: 12, mobilePainted: 12, publicWebRelease: "blocked" });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const raw = process.argv[2];
  const outputIndex = process.argv.indexOf("--output");
  const replayIndex = process.argv.indexOf("--replay");
  const report = await auditWebNebulaMatrixV648(raw);
  if (outputIndex >= 0) {
    const target = process.argv[outputIndex + 1];
    if (!/^docs\/release\/v607\/[a-z0-9-]+\.json$/i.test(target ?? ""))
      throw new Error("matrix-v648:output-path-invalid");
    await writeFile(path.join(ROOT, target), `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  }
  if (replayIndex >= 0) {
    const target = process.argv[replayIndex + 1];
    if (!/^docs\/release\/v607\/[a-z0-9-]+\.json$/i.test(target ?? ""))
      throw new Error("matrix-v648:replay-path-invalid");
    console.log(JSON.stringify(replayWebNebulaMatrixV648(
      JSON.parse(await loadBytes(target).then((bytes) => bytes.toString("utf8"))), report), null, 2));
  } else console.log(JSON.stringify({ status: report.status, issues: report.issues,
    buildId: report.buildId, counts: report.counts }, null, 2));
  if (report.status === "failed") process.exitCode = 1;
}
