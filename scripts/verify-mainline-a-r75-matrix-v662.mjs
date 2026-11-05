import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { buildMatrixSnapshotV662,
  safeWorkspacePathV662, sha256V662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";

const SHA = /^[a-f0-9]{64}$/;
const EXPECTED_COUNTS = Object.freeze({
  aStars: 12, aConstellations: 12, aNebulae: 12,
  betaStars: 24, betaConstellations: 12, betaNebulae: 24,
  existingStars: 20, identityHolds: 4, reviewImages: 19,
  imageHolds: 5, rightsSigned: 0, runtimeAdmitted: 0,
});

function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function issue(issues, code, detail) {
  issues.push(detail ? `${code}:${detail}` : code);
}
export function verifyR75MatrixShapeV662(snapshot) {
  const issues = [];
  if (!snapshot || snapshot.schema !== "mainline-a-r75-web-acceptance-matrix-v662"
    || snapshot.status !== "verified-static-candidate-hold") {
    issue(issues, "schema-or-status");
  }
  if (!SHA.test(snapshot?.appSourceSha256 ?? "")) {
    issue(issues, "source-hash");
  }
  if (!same(snapshot?.counts, EXPECTED_COUNTS)) {
    issue(issues, "coverage-counts");
  }
  if (snapshot?.boundary?.candidateOnly !== true
    || snapshot?.boundary?.hold !== true
    || snapshot?.boundary?.notAdmitted !== true
    || snapshot?.boundary?.scientificPayloadWriteback !== false
    || snapshot?.boundary?.publicWebReleaseApproved !== false) {
    issue(issues, "candidate-boundary");
  }
  if (snapshot?.claims?.copyrightApproval !== false
    || snapshot?.claims?.scientificValidity !== false
    || snapshot?.claims?.productionPerformance !== false
    || snapshot?.claims?.publicWebReleaseApproved !== false) {
    issue(issues, "claim-promotion");
  }
  const rows = Array.isArray(snapshot?.rows) ? snapshot.rows : [];
  if (rows.length !== 96 || sha256V662(JSON.stringify(rows))
    !== snapshot.rowDigest) issue(issues, "row-digest-or-count");
  const seen = new Set();
  for (const row of rows) {
    if (!row?.key || seen.has(row.key)) issue(issues, "duplicate-row", row?.key);
    seen.add(row?.key);
    if (!row?.sourceUrl?.startsWith("https://")
      || !SHA.test(row?.sourceSha256 ?? "")
      || row?.rights !== "pending") {
      issue(issues, "source-or-rights", row?.key);
    }
    if (row?.state === "identity-hold"
      && (row?.route !== null || row?.componentIdentity !== "pending")) {
      issue(issues, "identity-promoted", row?.key);
    }
    if (row?.group === "beta-nebula" && row?.state === "source-hold"
      && (row?.imageRoute !== null || row?.imageSha256 !== null)) {
      issue(issues, "held-image-promoted", row?.key);
    }
    if (row?.imageRoute !== null && row?.imageRoute !== undefined
      && row?.group === "beta-nebula"
      && !SHA.test(row?.imageSha256 ?? "")) {
      issue(issues, "review-image-sha", row?.key);
    }
    for (const alternative of row?.alternatives ?? []) {
      if (alternative?.imageRequested !== false
        || !alternative?.url?.startsWith("https://")
        || !SHA.test(alternative?.pageSha256 ?? "")) {
        issue(issues, "alternative-promoted-or-unpinned", row?.key);
      }
    }
  }
  const pins = [...(snapshot?.inputs ?? []), ...(snapshot?.assetPins ?? [])];
  if ((snapshot?.inputs ?? []).length !== 4
    || (snapshot?.assetPins ?? []).length < 40) {
    issue(issues, "pin-coverage");
  }
  const seenPins = new Set();
  for (const pin of pins) {
    try { safeWorkspacePathV662(pin?.path); }
    catch { issue(issues, "unsafe-pin-path", pin?.path); }
    if (seenPins.has(pin?.path) || !Number.isSafeInteger(pin?.bytes)
      || pin.bytes <= 0 || !SHA.test(pin?.sha256 ?? "")) {
      issue(issues, "invalid-pin", pin?.path);
    }
    seenPins.add(pin?.path);
  }
  return { ok: issues.length === 0, issues,
    rows: rows.length, pins: pins.length };
}

export async function replayR75MatrixV662(snapshot, options = {}) {
  const issues = [...verifyR75MatrixShapeV662(snapshot).issues];
  const before = await captureBuildInputs();
  if (before.sha256 !== snapshot?.appSourceSha256) {
    issue(issues, "current-source-drift");
  }
  let current;
  try { current = await buildMatrixSnapshotV662(); }
  catch (error) { issue(issues, "current-matrix-build-failed", error.message); }
  if (current) {
    if (!same(current.inputs, snapshot.inputs)) issue(issues, "input-pin-drift");
    if (!same(current.assetPins, snapshot.assetPins)) issue(issues, "asset-pin-drift");
    if (!same(current.rows, snapshot.rows)
      || current.rowDigest !== snapshot.rowDigest) {
      issue(issues, "matrix-row-drift");
    }
    if (!same(current.counts, snapshot.counts)) issue(issues, "matrix-count-drift");
  }
  const build = options.build ?? null;
  if (build && (build.status !== "passed" || build.sourceStable !== true
    || build.inputAfterSha256 !== before.sha256
    || build.runtimeBuildId !== `mainline-a-${before.sha256.slice(0, 16)}`)) {
    issue(issues, "production-build-identity-drift");
  }
  const after = await captureBuildInputs();
  if (before.sha256 !== after.sha256) issue(issues, "source-drift-during-replay");
  return { schema: "mainline-a-r75-web-matrix-replay-v662",
    status: issues.length ? "rejected-candidate" : "verified-candidate-hold",
    observedAt: new Date().toISOString(),
    snapshotSourceSha256: snapshot?.appSourceSha256 ?? null,
    currentSourceSha256: after.sha256,
    buildId: build?.buildId ?? null,
    rows: current?.rows.length ?? 0,
    inputPins: current?.inputs.length ?? 0,
    assetPins: current?.assetPins.length ?? 0,
    issues,
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false,
      publicWebReleaseApproved: false },
    claims: { copyrightApproval: false, scientificValidity: false,
      realUserValidation: false, productionPerformance: false,
      publicWebReleaseApproved: false } };
}

export function parseReplayOptionsV662(argv) {
  if (![2, 4].includes(argv.length) || argv[0] !== "--run-id"
    || !/^20261013v662r75web0[1-9]$/.test(argv[1])
    || (argv.length === 4 && (argv[2] !== "--build-run-id"
      || !/^20261013v662r75web0[1-9]$/.test(argv[3])))) {
    throw new Error("r75-matrix-replay:usage:--run-id RUN [--build-run-id RUN]");
  }
  return { runId: argv[1], buildRunId: argv[3] ?? null };
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  const args = parseReplayOptionsV662(process.argv.slice(2));
  const snapshotPath = `docs/release/v607/mainline-a-r75-v662-matrix-${args.runId}.json`;
  const snapshot = JSON.parse(await readFile(
    safeWorkspacePathV662(snapshotPath), "utf8"));
  const buildPath = args.buildRunId
    ? `docs/release/v607/mainline-a-r75-build-${args.buildRunId}.json`
    : null;
  const build = buildPath ? JSON.parse(await readFile(
    safeWorkspacePathV662(buildPath), "utf8")) : null;
  const result = await replayR75MatrixV662(snapshot, { build });
  const output = `docs/release/v607/mainline-a-r75-v662-matrix-replay-${args.runId}.json`;
  await writeFile(safeWorkspacePathV662(output),
    `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ status: result.status,
    issues: result.issues, output }));
  if (result.issues.length) process.exitCode = 1;
}
