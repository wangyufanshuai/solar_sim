import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { EXPECTED_SEAL, projectSnapshot, digest } from "./project-mainline-a-beta-stellar.mjs";

export const PACK_SCHEMA = "mainline-a-beta-stellar-source-closure-v616";
export const SNAPSHOT_PATH = "docs/release/post-v593/source-snapshots/simbad-stellar-24-2026-08-25.json";
export const PROJECTION_PATH = "app/data/mainlineABetaStellarProjectionV607.generated.ts";
export const OUTPUT_PATH = "app/data/mainlineABetaStellarSourceClosureV616.generated.json";
export const PENDING_IDS = Object.freeze(["acrux", "spica", "regulus", "polaris"]);
export const SOURCE_SERVICE_URL = "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=";

function fail(message) { throw new Error(`stellar source closure: ${message}`); }
function assert(condition, message) { if (!condition) fail(message); }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function stableJson(value) { return JSON.stringify(value); }

function read(root, relativePath) {
  const absolute = path.join(root, relativePath);
  assert(fs.existsSync(absolute), `missing ${relativePath}`);
  return fs.readFileSync(absolute, "utf8");
}

function parseProjection(source) {
  const match = source.match(/export const MAINLINE_A_BETA_STELLAR_PROJECTION = (\{[\s\S]*\}) as const;\s*$/);
  assert(match, "projection object missing");
  return JSON.parse(match[1]);
}

export function loadInputs(root = process.cwd()) {
  const snapshotText = read(root, SNAPSHOT_PATH);
  const snapshot = JSON.parse(snapshotText);
  assert(snapshot.snapshotSha256 === EXPECTED_SEAL, "snapshot seal changed");
  assert(digest(Object.fromEntries(Object.entries(snapshot).filter(([key]) => key !== "snapshotSha256"))) === EXPECTED_SEAL, "snapshot canonical digest changed");
  assert(snapshot.service?.license === "ODbL-1.0", "snapshot license changed");
  const projectionText = read(root, PROJECTION_PATH);
  const projection = parseProjection(projectionText);
  assert(projection.snapshotSha256 === EXPECTED_SEAL, "projection seal changed");
  assert(stableJson(projection) === stableJson(projectSnapshot(snapshot)), "projection is stale against snapshot");
  return { snapshot, snapshotText, projection, projectionText };
}

function sourceUrl(identifier) { return `${SOURCE_SERVICE_URL}${encodeURIComponent(identifier)}`; }

export function requiredEvidenceFor(id) {
  const map = {
    acrux: ["positive-parallax", "parallax-error", "upstream-reference", "component-identity"],
    spica: ["component-identity", "component-source-reference"],
    regulus: ["component-identity", "component-source-reference"],
    polaris: ["component-identity", "component-source-reference"],
  };
  assert(map[id], `unknown pending hero: ${id}`);
  return Object.freeze([...map[id]]);
}

function snapshotCompleteness(record) {
  return {
    sourceIdentifier: typeof record.mainId === "string" && record.mainId.length > 0,
    queryResolved: record.queryStatus === "resolved",
    positiveParallax: typeof record.parallax?.valueMas === "number" && record.parallax.valueMas > 0,
    parallaxError: typeof record.parallax?.errorMas === "number" && record.parallax.errorMas >= 0,
    upstreamReference: typeof record.parallax?.bibcode === "string" && record.parallax.bibcode.length > 0,
    componentIdentity: record.resolutionClass === "exact-component" || record.resolutionClass === "exact-named-star",
  };
}

export function buildClosureRecord(id, projectionRow, snapshotRecord, snapshotSha256) {
  assert(PENDING_IDS.includes(id), `record is not pending: ${id}`);
  assert(projectionRow?.id === id, `projection row missing: ${id}`);
  assert(snapshotRecord?.id === id, `snapshot row missing: ${id}`);
  const completeness = snapshotCompleteness(snapshotRecord);
  const missingFields = requiredEvidenceFor(id).filter((field) => {
    if (field === "positive-parallax") return !completeness.positiveParallax;
    if (field === "parallax-error") return !completeness.parallaxError;
    if (field === "upstream-reference") return !completeness.upstreamReference;
    if (field === "component-identity" || field === "component-source-reference") return !completeness.componentIdentity;
    return true;
  });
  return {
    id,
    queryIdentifier: projectionRow.simbadIdentifier,
    sourcePageUrl: sourceUrl(projectionRow.simbadIdentifier),
    snapshotSha256,
    snapshotRecordDigest: digest(snapshotRecord),
    projectionRecordDigest: projectionRow.sourceRecordDigest,
    resolutionClass: projectionRow.resolutionClass,
    completeness,
    requiredEvidence: requiredEvidenceFor(id),
    missingEvidence: [...new Set(missingFields)],
    status: "fresh-capture-required",
    reviewDecision: "hold",
    runtimeAdmission: "candidate-only",
    measurementAdmission: "not-admitted",
    scientificPayloadWriteback: false,
    freshCapture: { sourceUrl: sourceUrl(projectionRow.simbadIdentifier), capturedAt: null, captureSha256: null, reviewer: null },
  };
}

export function validateClosureRecord(record) {
  assert(PENDING_IDS.includes(record.id), `unexpected closure id: ${record.id}`);
  assert(/^https:\/\//.test(record.sourcePageUrl), `${record.id} source URL is not HTTPS`);
  assert(/^[a-f0-9]{64}$/i.test(record.snapshotSha256), `${record.id} snapshot seal invalid`);
  assert(/^[a-f0-9]{64}$/i.test(record.snapshotRecordDigest), `${record.id} snapshot digest invalid`);
  assert(/^[a-f0-9]{64}$/i.test(record.projectionRecordDigest), `${record.id} projection digest invalid`);
  assert(record.reviewDecision === "hold", `${record.id} review decision opened`);
  assert(record.runtimeAdmission === "candidate-only", `${record.id} runtime admission opened`);
  assert(record.measurementAdmission === "not-admitted", `${record.id} measurement admission opened`);
  assert(record.freshCapture?.capturedAt === null && record.freshCapture?.captureSha256 === null, `${record.id} fresh capture should be empty`);
  return true;
}

export function closureManifestFingerprint(pack) {
  return sha256(stableJson(pack.records.map((record) => ({ id: record.id, snapshotRecordDigest: record.snapshotRecordDigest, projectionRecordDigest: record.projectionRecordDigest, missingEvidence: [...record.missingEvidence].sort(), status: record.status }))));
}

export function buildPack({ root = process.cwd(), inputs = loadInputs(root) } = {}) {
  const sourceRows = new Map(inputs.snapshot.records.map((record) => [record.id, record]));
  const projectionRows = new Map(inputs.projection.rows.map((row) => [row.id, row]));
  const records = PENDING_IDS.map((id) => buildClosureRecord(id, projectionRows.get(id), sourceRows.get(id), inputs.snapshot.snapshotSha256));
  assert(records.length === 4, "closure record count changed");
  assert(records.every((record) => record.status === "fresh-capture-required"), "closure status opened");
  assert(records.every((record) => record.runtimeAdmission === "candidate-only"), "runtime admission opened");
  return {
    schema: PACK_SCHEMA,
    generatedAt: inputs.snapshot.retrievedAt,
    source: { snapshotPath: SNAPSHOT_PATH, projectionPath: PROJECTION_PATH, snapshotSha256: inputs.snapshot.snapshotSha256, snapshotContentSha256: sha256(inputs.snapshotText), projectionContentSha256: sha256(inputs.projectionText), serviceLicense: inputs.snapshot.service.license, citation: inputs.snapshot.service.citation },
    counts: { total: records.length, freshCaptureRequired: records.filter((record) => record.status === "fresh-capture-required").length, missingEvidence: records.reduce((count, record) => count + record.missingEvidence.length, 0), candidateOnly: records.filter((record) => record.runtimeAdmission === "candidate-only").length },
    boundary: { legalDecision: "not-granted", runtimeWrites: false, measurementWrites: false, scientificPayloadWriteback: false },
    records,
  };
}

export function readPack(root = process.cwd()) { return JSON.parse(read(root, OUTPUT_PATH)); }

export function verifyPack(actual, expected) {
  assert(stableJson(actual) === stableJson(expected), "existing closure pack differs from sealed input");
  assert(actual.schema === PACK_SCHEMA, "closure schema changed");
  assert(actual.counts?.total === 4 && actual.counts.freshCaptureRequired === 4, "closure counts changed");
  assert(actual.boundary?.legalDecision === "not-granted" && actual.boundary.runtimeWrites === false && actual.boundary.measurementWrites === false, "closure boundary opened");
  actual.records.forEach((record, index) => {
    validateClosureRecord(record);
    assert(record.id === PENDING_IDS[index], `closure order changed at ${index}`);
    assert(record.status === "fresh-capture-required" && record.reviewDecision === "hold", `${record.id} decision changed`);
    assert(record.runtimeAdmission === "candidate-only" && record.measurementAdmission === "not-admitted", `${record.id} admission changed`);
    assert(record.freshCapture?.capturedAt === null && record.freshCapture?.captureSha256 === null, `${record.id} fake capture appeared`);
  });
  return { status: "verified", total: actual.counts.total, missingEvidence: actual.counts.missingEvidence, fingerprint: closureManifestFingerprint(actual), output: OUTPUT_PATH };
}

export function writePack(root = process.cwd(), pack = buildPack({ root })) { fs.writeFileSync(path.join(root, OUTPUT_PATH), `${JSON.stringify(pack, null, 2)}\n`, "utf8"); return { status: "generated", ...pack.counts, output: OUTPUT_PATH }; }
export function run({ root = process.cwd(), check = false } = {}) { const pack = buildPack({ root }); return check ? verifyPack(readPack(root), pack) : writePack(root, pack); }

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(run({ check: process.argv.includes("--check") }), null, 2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
