import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { BETA_IDS, EXPECTED_SEAL, projectSnapshot, digest } from "./project-mainline-a-beta-stellar.mjs";

export const PACK_SCHEMA = "mainline-a-beta-hero-review-pack-v611";
export const PROJECTION_PATH = "app/data/mainlineABetaStellarProjectionV607.generated.ts";
export const OUTPUT_PATH = "app/data/mainlineABetaHeroReviewPackV611.generated.json";
export const SNAPSHOT_PATH = "docs/release/post-v593/source-snapshots/simbad-stellar-24-2026-08-25.json";
export const PENDING_IDS = Object.freeze(["acrux", "spica", "regulus", "polaris"]);
export const RUNTIME_CLEARED_COUNT = 20;

const SHA256 = /^[a-f0-9]{64}$/i;

export function fail(message) {
  throw new Error(`hero review pack: ${message}`);
}

export function assert(condition, message) {
  if (!condition) fail(message);
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function stableJson(value) {
  return JSON.stringify(value);
}

function readJson(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  assert(fs.existsSync(absolutePath), `missing ${relativePath}`);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error.message}`);
  }
}

export function loadSealedSnapshot(root) {
  const snapshot = readJson(root, SNAPSHOT_PATH);
  assert(snapshot.snapshotSha256 === EXPECTED_SEAL, "snapshot seal differs from the sealed Beta source");
  assert(snapshot.service?.license === "ODbL-1.0", "snapshot license is not ODbL-1.0");
  assert(typeof snapshot.service?.citation === "string" && snapshot.service.citation.length > 0, "snapshot citation missing");
  assert(Array.isArray(snapshot.records), "snapshot records missing");
  assert(snapshot.records.length === 24, `snapshot record count changed: ${snapshot.records.length}`);
  const unsignedSnapshot = Object.fromEntries(Object.entries(snapshot).filter(([key]) => key !== "snapshotSha256"));
  assert(digest(unsignedSnapshot) === EXPECTED_SEAL, "snapshot canonical digest mismatch");
  return snapshot;
}

export function loadProjectionSource(root) {
  const absolutePath = path.join(root, PROJECTION_PATH);
  assert(fs.existsSync(absolutePath), `missing ${PROJECTION_PATH}`);
  const source = fs.readFileSync(absolutePath, "utf8");
  const match = source.match(/export const MAINLINE_A_BETA_STELLAR_PROJECTION = (\{[\s\S]*\}) as const;\s*$/);
  assert(match, "projection is not a JSON-shaped generated module");
  let projection;
  try {
    projection = JSON.parse(match[1]);
  } catch (error) {
    fail(`projection JSON cannot be parsed: ${error.message}`);
  }
  assert(projection.schema === "mainline-a-beta-stellar-projection-v1", "projection schema changed");
  assert(projection.snapshotSha256 === EXPECTED_SEAL, "projection snapshot seal changed");
  assert(Array.isArray(projection.rows), "projection rows missing");
  return { source, projection };
}

export function verifyProjectionAgainstSnapshot(root, projection, snapshot = loadSealedSnapshot(root)) {
  const expected = projectSnapshot(snapshot);
  assert(stableJson(projection) === stableJson(expected), "generated projection does not match the sealed source snapshot");
  assert(projection.sourcePath === SNAPSHOT_PATH, "projection source path changed");
  assert(projection.generatedFromExistingSnapshot === true, "projection synthetic-source flag changed");
  assert(projection.scientificPayloadWriteback === false, "projection scientific writeback opened");
  assert(projection.rows.length === BETA_IDS.length, `projection row count changed: ${projection.rows.length}`);
  assert(new Set(projection.rows.map((row) => row.id)).size === projection.rows.length, "projection contains duplicate ids");
  return expected;
}

function verifyPendingRow(row) {
  assert(row && typeof row === "object", "pending row missing");
  assert(PENDING_IDS.includes(row.id), `unexpected pending id ${row.id}`);
  assert(typeof row.simbadIdentifier === "string" && row.simbadIdentifier.startsWith("* "), `${row.id} SIMBAD identifier missing`);
  assert(SHA256.test(row.sourceRecordDigest), `${row.id} source digest invalid`);
  assert(["exact-component", "exact-named-star", "system-only-component-ambiguous"].includes(row.resolutionClass), `${row.id} resolution class unknown`);
  assert(Array.isArray(row.blockingReasons) && row.blockingReasons.length > 0, `${row.id} blockers missing`);
  assert(row.presentationReferenceReady === false, `${row.id} became presentation-ready without review`);
  assert(row.measurementAdmission === "not-admitted", `${row.id} measurement admission changed`);
  return row;
}

export function buildPendingRecord(row) {
  verifyPendingRow(row);
  return {
    id: row.id,
    simbadIdentifier: row.simbadIdentifier,
    resolutionClass: row.resolutionClass,
    sourceRecordDigest: row.sourceRecordDigest,
    parallaxMas: row.parallaxMas,
    errorMas: row.errorMas,
    bibcode: row.bibcode,
    blockingReasons: [...row.blockingReasons],
    state: "evidence-pending",
    runtimeAdmission: "not-admitted",
    measurementAdmission: "not-admitted",
    review: {
      identity: "pending",
      parallax: "pending",
      upstreamReference: "pending",
      reviewer: null,
      reviewedAt: null,
      decision: "hold",
    },
  };
}

export function buildPack({ root = process.cwd(), snapshot = loadSealedSnapshot(root), projectionSource = loadProjectionSource(root) } = {}) {
  const { source, projection } = projectionSource;
  verifyProjectionAgainstSnapshot(root, projection, snapshot);
  const sourceRows = new Map(projection.rows.map((row) => [row.id, row]));
  const records = PENDING_IDS.map((id) => buildPendingRecord(sourceRows.get(id) ?? fail(`missing pending hero ${id}`)));
  assert(records.length === PENDING_IDS.length, "pending record count changed");
  assert(new Set(records.map((row) => row.id)).size === records.length, "duplicate pending hero");
  return {
    schema: PACK_SCHEMA,
    generatedAt: projection.retrievedAt,
    projection: { path: PROJECTION_PATH, sha256: sha256(source) },
    sourceSnapshot: {
      path: SNAPSHOT_PATH,
      sha256: snapshot.snapshotSha256,
      contentSha256: sha256(fs.readFileSync(path.join(root, SNAPSHOT_PATH))),
      retrievedAt: snapshot.retrievedAt,
      license: snapshot.service.license,
      citation: snapshot.service.citation,
    },
    sourceCount: snapshot.records.length,
    pendingCount: records.length,
    runtimeClearedCount: RUNTIME_CLEARED_COUNT,
    measurementWriteback: false,
    generatedFromExistingSnapshot: true,
    records,
  };
}

export function readPack(root = process.cwd()) {
  const absolutePath = path.join(root, OUTPUT_PATH);
  assert(fs.existsSync(absolutePath), `review pack output missing: ${OUTPUT_PATH}`);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    fail(`review pack output is not valid JSON: ${error.message}`);
  }
}

export function verifyPack(actual, expected) {
  assert(actual && typeof actual === "object", "existing pack missing");
  assert(stableJson(actual) === stableJson(expected), "existing hero pack differs from the verified projection");
  assert(actual.schema === PACK_SCHEMA, "existing hero pack schema changed");
  assert(actual.pendingCount === PENDING_IDS.length, "existing hero pack pending count changed");
  assert(actual.runtimeClearedCount === RUNTIME_CLEARED_COUNT, "existing runtime cleared count changed");
  assert(actual.measurementWriteback === false, "existing pack measurement writeback opened");
  assert(actual.generatedFromExistingSnapshot === true, "existing pack source flag changed");
  assert(actual.sourceSnapshot?.sha256 === EXPECTED_SEAL, "existing pack source seal changed");
  assert(Array.isArray(actual.records) && actual.records.length === PENDING_IDS.length, "existing pack record list changed");
  actual.records.forEach((record, index) => {
    assert(record.id === PENDING_IDS[index], `existing pack order changed at ${index}`);
    assert(record.state === "evidence-pending", `${record.id} is no longer pending`);
    assert(record.runtimeAdmission === "not-admitted", `${record.id} runtime gate opened`);
    assert(record.measurementAdmission === "not-admitted", `${record.id} measurement gate opened`);
    assert(record.review?.decision === "hold", `${record.id} review decision changed`);
  });
  return { status: "verified", pendingCount: actual.pendingCount, output: OUTPUT_PATH };
}

export function writePack(root = process.cwd(), pack = buildPack({ root })) {
  const absolutePath = path.join(root, OUTPUT_PATH);
  fs.writeFileSync(absolutePath, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  return { status: "generated", pendingCount: pack.pendingCount, output: OUTPUT_PATH };
}

export function run({ root = process.cwd(), check = false } = {}) {
  const pack = buildPack({ root });
  if (check) return verifyPack(readPack(root), pack);
  return writePack(root, pack);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(run({ check: process.argv.includes("--check") }), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
