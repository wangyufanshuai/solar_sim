import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { buildMatrixSnapshotV662, pinFileV662,
  safeWorkspacePathV662 } from "./build-mainline-a-r75-matrix-v662.mjs";
import { replayR76ReadinessV663 } from
  "./verify-mainline-a-r76-readiness-v663.mjs";

const READINESS_PATH =
  "app/data/mainlineAWebReadinessV663.generated.json";
const CANONICAL_PATH =
  "app/data/mainlineACanonicalCoverageV622.generated.json";
const V616 = Object.freeze([
  { path: "docs/release/post-v593/source-snapshots/simbad-stellar-24-2026-08-25.json",
    sha256:
      "706be4e043fce25df4cd0e01522dd6ef5863c5cdf902c3e08ab6563e6c7a863b" },
  { path: "app/data/mainlineABetaStellarProjectionV607.generated.ts",
    sha256:
      "8fbb31166d5b96890236da6842ce9f53a4ace3133ffbaabccd9811e8005e0dce" },
]);
export const R77_GROUPS_V664 = Object.freeze({
  "a-star": 12, "a-constellation": 12, "a-nebula": 12,
  "beta-star": 24, "beta-constellation": 12,
  "beta-nebula": 24,
});
export const R77_STAR_HOLDS_V664 =
  Object.freeze(["acrux", "polaris", "regulus", "spica"]);
export const R77_NEBULA_HOLDS_V664 =
  Object.freeze(["bubble-nebula", "cats-eye-nebula",
    "dumbbell-nebula", "omega-nebula", "ring-nebula"]);
export const R77_ROOT_V664 = path.resolve(path.dirname(
  fileURLToPath(import.meta.url)), "..");
export const sha256R77V664 = (bytes) => createHash("sha256")
  .update(bytes).digest("hex");

function check(value, code, detail) {
  if (!value) throw new Error(`r77-freeze:${code}${detail
    ? `:${JSON.stringify(detail)}` : ""}`);
}
function sortStrings(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}
function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
async function readJson(relative) {
  const bytes = await readFile(safeWorkspacePathV662(relative));
  return { data: JSON.parse(bytes.toString("utf8")),
    pin: { path: relative, bytes: bytes.length,
      sha256: sha256R77V664(bytes) } };
}
function groupRows(rows) {
  const groups = Object.fromEntries(
    Object.keys(R77_GROUPS_V664).map((key) => [key, []]));
  for (const row of rows) {
    check(Object.hasOwn(groups, row.group),
      "unexpected-group", row.group);
    groups[row.group].push(row);
  }
  for (const [group, count] of Object.entries(R77_GROUPS_V664)) {
    check(groups[group].length === count,
      "group-count", { group, actual: groups[group].length });
  }
  return groups;
}
function heldIds(rows, state) {
  return sortStrings(rows.filter((row) => row.state === state)
    .map((row) => row.id));
}
function assertCrossSourceHolds(matrix, readiness) {
  const groups = groupRows(matrix.rows);
  const stellar = heldIds(groups["beta-star"], "identity-hold");
  const nebulae = heldIds(groups["beta-nebula"], "source-hold");
  check(same(stellar, R77_STAR_HOLDS_V664)
    && same(stellar, sortStrings(readiness.stars.map((row) =>
      row.id))), "stellar-hold-source-conflict", stellar);
  check(same(nebulae, R77_NEBULA_HOLDS_V664)
    && same(nebulae, sortStrings(readiness.nebulae.map((row) =>
      row.id))), "nebula-hold-source-conflict", nebulae);
  check(groups["beta-nebula"].filter((row) =>
    row.imageRoute !== null).length === 19
    && groups["beta-nebula"].filter((row) =>
      row.imageRoute === null).length === 5
    && groups["beta-star"].filter((row) =>
      row.state === "reviewable").length === 20,
  "beta-gate-count-conflict");
  check(matrix.boundary?.candidateOnly === true
    && matrix.boundary.hold === true
    && matrix.boundary.notAdmitted === true
    && matrix.boundary.scientificPayloadWriteback === false
    && readiness.boundary?.scientificPayloadWriteback === false
    && readiness.gates?.publicWebReleaseAllowed === false,
  "admission-boundary-conflict");
  for (const row of groups["beta-nebula"].filter((item) =>
    item.state === "source-hold")) {
    check(row.imageRoute === null && row.imageSha256 === null,
      "held-image-route-exposed", row.id);
  }
  return groups;
}
function canonicalSceneRows(canonical) {
  check(canonical?.records?.length === 36,
    "canonical-coverage-not-thirty-six");
  const keys = new Set();
  const scenes = canonical.records.map((row) => {
    check(["star", "constellation", "nebula"].includes(row.kind)
      && typeof row.id === "string"
      && row.route && typeof row.route === "object",
    "canonical-row-invalid", row?.id);
    const key = `${row.kind}:${row.id}`;
    check(!keys.has(key), "canonical-duplicate", key);
    keys.add(key);
    return { key, kind: row.kind, id: row.id,
      catalogId: row.kind === "star"
        ? `stellar-hero:${row.id}` : key,
      assetSha256: row.kind === "nebula"
        ? row.route.assetHash : null,
      rightsSigned: false, runtimeAdmission: "candidate-only" };
  });
  for (const kind of ["star", "constellation", "nebula"]) {
    check(scenes.filter((row) => row.kind === kind).length === 12,
      "canonical-kind-count", kind);
  }
  return scenes;
}
export async function buildR77WebFreezeV664() {
  const before = await captureBuildInputs();
  const [matrix, readiness, canonical] = await Promise.all([
    buildMatrixSnapshotV662(),
    readJson(READINESS_PATH), readJson(CANONICAL_PATH),
  ]);
  const sourceReplay = await replayR76ReadinessV663(readiness.data);
  check(sourceReplay.status === "verified-candidate-hold"
    && sourceReplay.sourcePinsChecked === 20,
  "r76-source-replay-failed", sourceReplay.issues);
  const groups = assertCrossSourceHolds(matrix, readiness.data);
  const scenes = canonicalSceneRows(canonical.data);
  const mappedKeys = new Set(matrix.rows.map((row) => row.key));
  check(mappedKeys.size === 96
    && scenes.every((scene) =>
      mappedKeys.has(`a:${scene.key}`)),
  "canonical-matrix-mapping-invalid");
  const v616 = [];
  for (const expected of V616) {
    const actual = await pinFileV662(expected.path);
    check(actual.sha256 === expected.sha256,
      "v616-digest-drift", expected.path);
    v616.push(actual);
  }
  const after = await captureBuildInputs();
  check(before.sha256 === matrix.appSourceSha256
    && before.sha256 === after.sha256,
  "app-source-changed-during-freeze");
  const payload = {
    schema: "mainline-a-r77-web-freeze-v664",
    evidenceClass: "static-source-and-asset-replay-candidate-only",
    repository: { root: R77_ROOT_V664.replaceAll("\\", "/"),
      branch: "codex/solar-sim-mainline-a",
      parentGitTouched: false },
    appSourceSha256: before.sha256,
    sourceScope: before.scope,
    inputs: matrix.inputs,
    assetPins: matrix.assetPins,
    v616Pins: v616,
    readinessPin: readiness.pin,
    readinessFingerprint: readiness.data.fingerprint,
    canonicalPin: canonical.pin,
    matrixRowDigest: matrix.rowDigest,
    matrixRows: matrix.rows,
    scenes,
    counts: {
      ...Object.fromEntries(Object.entries(groups).map(
        ([key, rows]) => [key, rows.length])),
      canonicalScenes: scenes.length,
      betaStarIdentityHolds: 4,
      betaNebulaImageHolds: 5,
      betaNebulaReviewRoutes: 19,
      aRightsSigned: 0,
      betaRightsSigned: 0,
      runtimeAdmitted: 0,
    },
    browserPlan: { desktop: [1280, 720],
      simulatedMobile: [390, 844],
      matrixRowsPerViewport: 96,
      canonicalScenesPerViewport: 36,
      physicalMobile: "not-run" },
    boundary: { candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false,
      publicWebReleaseApproved: false },
    claims: { scientificValidity: false,
      copyrightApproval: false, productionPerformance: false,
      realUserValidation: false, publicWebReleaseApproved: false },
  };
  return { ...payload,
    fingerprint: sha256R77V664(JSON.stringify(payload)),
    generatedAt: new Date().toISOString() };
}
export function parseR77FreezeOptionsV664(argv) {
  check(argv.length === 2 && argv[0] === "--run-id"
    && /^20261013v664r77freeze0[1-9]$/.test(argv[1]), "usage");
  return argv[1];
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  const runId = parseR77FreezeOptionsV664(process.argv.slice(2));
  const result = await buildR77WebFreezeV664();
  const output =
    `docs/release/v607/mainline-a-r77-v664-freeze-${runId}.json`;
  await writeFile(safeWorkspacePathV662(output),
    `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ status: "verified-static-candidate-hold",
    output, sourceSha256: result.appSourceSha256,
    matrixRows: result.matrixRows.length,
    scenes: result.scenes.length,
    assetPins: result.assetPins.length,
    sourcePins: result.inputs.length + 20 }));
}
