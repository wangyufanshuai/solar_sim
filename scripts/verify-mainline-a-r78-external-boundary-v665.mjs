import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from
  "./build-mainline-a-preserved.mjs";
import { safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { inspectR77FreezeV664,
  replayR77FreezeV664 } from
  "./verify-mainline-a-r77-web-freeze-v664.mjs";

const BASE = "docs/release/v607/";
const RUN = /^20261013v665r78web0[1-9]$/;
const SOURCE = "d9bbd6b9d0d419e2a852cf0f896bf415659483ef7e96989fa961ae003495b528";
const SNAPSHOT = "706be4e043fce25df4cd0e01522dd6ef5863c5cdf902c3e08ab6563e6c7a863b";
const PROJECTION = "8fbb31166d5b96890236da6842ce9f53a4ace3133ffbaabccd9811e8005e0dce";

function sha256(bytes) {
  return createHash("sha256").update(bytes)
    .digest("hex");
}
function check(value, code) {
  if (!value) throw new Error("r78-external:" + code);
}
async function pinned(relative) {
  const absolute = safeWorkspacePathV662(relative);
  const bytes = await readFile(absolute);
  check(bytes.length > 0 && bytes.length < 4 * 1024 * 1024,
    "input-size-invalid");
  return { value: JSON.parse(bytes.toString("utf8")),
    pin: { path: relative, bytes: bytes.length,
      sha256: sha256(bytes) } };
}
function countState(rows, group, state) {
  return rows.filter((row) => row.group === group
    && row.state === state).length;
}
export function inspectR78ExternalBoundaryV665(
  freeze, prior, replay, currentSourceSha256) {
  const issues = [];
  const freezeCheck = inspectR77FreezeV664(freeze);
  const rows = freeze?.matrixRows ?? [];
  if (!freezeCheck.ok
    || freeze.appSourceSha256 !== SOURCE
    || currentSourceSha256 !== SOURCE
    || freeze.v616Pins?.[0]?.sha256 !== SNAPSHOT
    || freeze.v616Pins?.[1]?.sha256 !== PROJECTION) {
    issues.push("source-freeze-or-v616-pin-invalid");
  }
  if (replay?.status !== "verified-candidate-hold"
    || replay.pinChecks !== 57
    || replay.appSourceSha256 !== SOURCE
    || replay.fingerprint !== freeze?.fingerprint) {
    issues.push("prior-byte-replay-invalid");
  }
  if (prior?.status
      !== "prior-raw-evidence-replayed-no-new-acquisition"
    || prior.existingR76RawSourcePinsRecomputedByBuilder !== 20
    || prior.newHttpsRequests !== 0
    || prior.newNebulaImageResponsesCaptured !== 0
    || prior.stellarPhysicalComponentsConfirmed !== 0
    || prior.blockedNebulaImageRequests !== 5
    || prior.aNebulaRightsSigned !== 0
    || prior.betaNebulaRightsSigned !== 0
    || prior.scientificValidityApproved !== false
    || prior.copyrightApproval !== false) {
    issues.push("external-source-or-rights-promotion");
  }
  if (countState(rows, "beta-star", "identity-hold") !== 4
    || countState(rows, "beta-star", "reviewable") !== 20
    || countState(rows, "beta-nebula", "source-hold") !== 5
    || countState(rows, "beta-nebula", "reviewable") !== 19
    || rows.some((row) => row.rights !== "pending"
      || row.rightsSigned === true)
    || rows.filter((row) => row.group === "a-nebula")
      .length !== 12) {
    issues.push("held-items-or-rights-state-invalid");
  }
  return { ok: issues.length === 0,
    issues, priorRawPins: 20,
    verifiedFilePins: replay?.pinChecks ?? 0,
    betaStarReviewable: countState(rows,
      "beta-star", "reviewable"),
    stellarComponentHolds: countState(rows,
      "beta-star", "identity-hold"),
    betaNebulaImageReviewable: countState(rows,
      "beta-nebula", "reviewable"),
    betaNebulaImageHolds: countState(rows,
      "beta-nebula", "source-hold"),
    aNebulaRightsSigned: 0,
    betaNebulaRightsSigned: 0,
    newHttpsRequests: 0,
    newImageResponsesCaptured: 0 };
}
export function parseR78ExternalOptionsV665(argv) {
  check(argv.length === 2 && argv[0] === "--run-id"
    && RUN.test(argv[1]), "usage");
  return argv[1];
}
export async function runR78ExternalBoundaryV665(runId) {
  check(RUN.test(runId), "run-id-invalid");
  const [freeze, savedReplay, prior, source] =
    await Promise.all([
      pinned(BASE
        + "mainline-a-r77-v664-freeze-20261013v664r77freeze01.json"),
      pinned(BASE
        + "mainline-a-r77-v664-freeze-replay-20261013v664r77freeze01.json"),
      pinned(BASE
        + "mainline-a-r77-v664-external-source-20261013v664r77web01.json"),
      captureBuildInputs(),
    ]);
  const freshReplay = await replayR77FreezeV664(
    freeze.value);
  check(freshReplay.status === "verified-candidate-hold"
    && freshReplay.pinChecks === 57
    && freshReplay.fingerprint
      === savedReplay.value.fingerprint,
  "current-file-pin-replay-failed");
  const inspected = inspectR78ExternalBoundaryV665(
    freeze.value, prior.value,
    savedReplay.value, source.sha256);
  check(inspected.ok, "external-boundary-failed");
  check((await captureBuildInputs()).sha256 === source.sha256,
    "source-drift-during-replay");
  const receipt = {
    schema: "mainline-a-r78-external-source-v665",
    evidenceClass: "external-source-prior-raw-replay-only",
    status: "prior-real-raw-pins-verified-no-new-acquisition",
    generatedAt: new Date().toISOString(),
    appSourceSha256: source.sha256,
    freezeFingerprint: freeze.value.fingerprint,
    inputs: [freeze.pin, savedReplay.pin, prior.pin],
    verification: inspected,
    v616SnapshotSha256: SNAPSHOT,
    v616ProjectionSha256: PROJECTION,
    newHttpsRequests: 0,
    scientificValidityApproved: false,
    copyrightApproval: false,
    boundary: { candidateOnly: true, hold: true,
      notAdmitted: true,
      scientificPayloadWriteback: false,
      publicWebReleaseApproved: false },
  };
  const output = BASE
    + `mainline-a-r78-v665-external-source-${runId}.json`;
  await writeFile(safeWorkspacePathV662(output),
    JSON.stringify(receipt, null, 2) + "\n",
  { flag: "wx" });
  return { status: receipt.status, output,
    verifiedFilePins: inspected.verifiedFilePins,
    sourceSha256: source.sha256 };
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR78ExternalBoundaryV665(
    parseR78ExternalOptionsV665(process.argv.slice(2)))));
}
