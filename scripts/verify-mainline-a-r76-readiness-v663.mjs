import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildR76ReadinessV663, R76_NEBULA_IDS_V663,
  R76_OUTPUT_V663, R76_STAR_IDS_V663, pinR76V663,
  safePathR76V663, sha256R76V663 } from
  "./build-mainline-a-r76-readiness-v663.mjs";

const SHA = /^[a-f0-9]{64}$/;
function add(issues, code, detail) {
  issues.push(detail ? `${code}:${detail}` : code);
}
function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
export function inspectR76ReadinessShapeV663(snapshot) {
  const issues = [];
  if (snapshot?.schema !== "mainline-a-r76-web-readiness-v663"
    || snapshot.evidenceClass
      !== "offline-replayed-current-web-release-gates"
    || !SHA.test(snapshot.fingerprint ?? "")) {
    add(issues, "schema-or-fingerprint-invalid");
  }
  const unsigned = { ...snapshot };
  delete unsigned.fingerprint;
  delete unsigned.generatedAt;
  if (sha256R76V663(JSON.stringify(unsigned)) !== snapshot?.fingerprint) {
    add(issues, "fingerprint-not-reproducible");
  }
  const pins = snapshot?.sourcePins;
  if (!Array.isArray(pins) || pins.length !== 20
    || new Set(pins.map((pin) => pin.path)).size !== pins.length
    || pins.filter((pin) => pin.role).length !== 6) {
    add(issues, "source-pin-coverage-invalid");
  }
  for (const pin of pins ?? []) {
    try { safePathR76V663(pin.path); }
    catch { add(issues, "unsafe-pin-path", pin.path); }
    if (!Number.isSafeInteger(pin.bytes) || pin.bytes <= 0
      || !SHA.test(pin.sha256 ?? "")) {
      add(issues, "invalid-pin", pin.path);
    }
  }
  const gates = snapshot?.gates ?? {};
  if (!same([gates.aLineRuntimeObjects, gates.betaStarEntries,
    gates.betaConstellationEntries, gates.betaNebulaEntries],
  [36, 24, 12, 24])
    || gates.identityReviewsPending !== 4
    || gates.blockedImageAcquisitions !== 5
    || gates.rawImagesCapturedForBlockedTargets !== 0
    || gates.aNebulaRightsSigned !== 0
    || gates.betaNebulaRightsSigned !== 0
    || gates.humanVisualSignoffs !== 0
    || gates.localLongRuns !== 2
    || gates.physicalMobileRuns !== 0
    || gates.publicWebReleaseAllowed !== false) {
    add(issues, "gate-count-or-promotion-invalid");
  }
  if (snapshot?.boundary?.candidateOnly !== true
    || snapshot.boundary.hold !== true
    || snapshot.boundary.notAdmitted !== true
    || snapshot.boundary.scientificPayloadWriteback !== false
    || snapshot.boundary.runtimeWrites !== false
    || snapshot.boundary.measurementWrites !== false
    || snapshot.boundary.publicWebReleaseApproved !== false
    || snapshot?.claims?.copyrightApproval !== false
    || snapshot.claims.scientificValidity !== false
    || snapshot.claims.productionPerformance !== false
    || snapshot.claims.realUserValidation !== false
    || snapshot.claims.physicalMobile !== false
    || snapshot.claims.publicWebReleaseApproved !== false) {
    add(issues, "boundary-or-claim-promotion-invalid");
  }
  const stars = snapshot?.stars;
  if (!Array.isArray(stars)
    || !same(stars.map((row) => row.id), R76_STAR_IDS_V663)) {
    add(issues, "star-coverage-invalid");
  }
  for (const row of stars ?? []) {
    if (!row.wdsSystemId || !row.primaryCrossId
      || row.crossIdMatched !== true
      || !Number.isInteger(row.pairCount) || row.pairCount <= 0
      || !row.reviewQuestion || !row.rawCsv?.path
      || !row.pairArtifact?.path
      || row.physicalComponentConfirmed !== false
      || row.state !== "component-review-hold"
      || row.runtimeAdmission !== "candidate-only"
      || row.hold !== true || row.notAdmitted !== true
      || row.scientificPayloadWriteback !== false) {
      add(issues, "star-promoted-or-incomplete", row.id);
    }
  }
  const nebulae = snapshot?.nebulae;
  if (!Array.isArray(nebulae)
    || !same(nebulae.map((row) => row.id), R76_NEBULA_IDS_V663)) {
    add(issues, "nebula-coverage-invalid");
  }
  for (const row of nebulae ?? []) {
    let pageSafe = false;
    let imageSafe = false;
    try {
      const url = new URL(row.officialPageUrl);
      pageSafe = url.protocol === "https:"
        && url.hostname === "science.nasa.gov";
      if (row.imageRequestIntent?.url) {
        const image = new URL(row.imageRequestIntent.url);
        imageSafe = image.protocol === "https:"
          && image.hostname === "assets.science.nasa.gov";
      }
    } catch { /* Keep the source link rejected. */ }
    if (!pageSafe || !imageSafe
      || row.pageIdentity !== "page-identity-confirmed"
      || !row.officialPageRaw?.path
      || !Array.isArray(row.oldItemPolicyBlockers)
      || row.oldItemPolicyBlockers.length === 0
      || row.imageAcquisitionAllowed !== false
      || row.imageRequestExecuted !== false
      || row.imageResponseCaptured !== 0
      || row.imageRequestIntent?.requestExecuted !== false
      || row.imageRequestIntent?.responseCaptured !== 0
      || row.imageRequestIntent?.rawArtifact !== null
      || row.rightsSigned !== false
      || row.visualSignoff !== false
      || row.state !== "image-acquisition-policy-hold"
      || row.runtimeAdmission !== "candidate-only"
      || row.hold !== true || row.notAdmitted !== true
      || row.scientificPayloadWriteback !== false) {
      add(issues, "nebula-promoted-or-incomplete", row.id);
    }
  }
  const dumbbell = nebulae?.find((row) => row.id === "dumbbell-nebula");
  if (!dumbbell?.conflictingSources?.some((item) =>
    item.sourceKey === "dumbbell-spitzer"
    && item.issueCodes?.includes("target-identity-conflict"))) {
    add(issues, "dumbbell-conflict-erased");
  }
  return { ok: issues.length === 0, issues,
    sourcePinCount: pins?.length ?? 0,
    starCount: stars?.length ?? 0,
    nebulaCount: nebulae?.length ?? 0 };
}
export async function replayR76ReadinessV663(snapshot) {
  const shape = inspectR76ReadinessShapeV663(snapshot);
  const issues = [...shape.issues];
  let checkedPins = 0;
  for (const expected of snapshot?.sourcePins ?? []) {
    try {
      const actual = await pinR76V663(expected.path);
      checkedPins += 1;
      if (actual.bytes !== expected.bytes
        || actual.sha256 !== expected.sha256) {
        add(issues, "source-bytes-drift", expected.path);
      }
    } catch { add(issues, "source-pin-unreadable", expected?.path); }
  }
  try {
    const fresh = await buildR76ReadinessV663();
    if (!same({ ...fresh, generatedAt: null },
      { ...snapshot, generatedAt: null })) {
      add(issues, "recomputed-source-decision-drift");
    }
  } catch (error) {
    add(issues, "source-recomputation-failed",
      error?.code ?? error?.message);
  }
  return { schema: "mainline-a-r76-readiness-replay-v663",
    status: issues.length ? "rejected-candidate" : "verified-candidate-hold",
    observedAt: new Date().toISOString(),
    inputFingerprint: snapshot?.fingerprint ?? null,
    sourcePinsExpected: snapshot?.sourcePins?.length ?? 0,
    sourcePinsChecked: checkedPins,
    stars: shape.starCount, nebulae: shape.nebulaCount,
    issues,
    boundary: { candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false,
      publicWebReleaseApproved: false } };
}
export function parseReplayOptionsV663(argv) {
  if (argv.length !== 2 || argv[0] !== "--run-id"
    || !/^20261013v663r76[a-z0-9-]{1,24}$/.test(argv[1])) {
    throw new Error("r76-readiness:usage:--run-id 20261013v663r76NAME");
  }
  return argv[1];
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  const runId = parseReplayOptionsV663(process.argv.slice(2));
  const snapshot = JSON.parse(await readFile(
    safePathR76V663(R76_OUTPUT_V663), "utf8"));
  const result = await replayR76ReadinessV663(snapshot);
  const output = `docs/release/v607/mainline-a-r76-v663-readiness-replay-${runId}.json`;
  await writeFile(safePathR76V663(output),
    `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ status: result.status,
    sourcePinsChecked: result.sourcePinsChecked,
    issues: result.issues, output }));
  if (result.issues.length) process.exitCode = 1;
}
