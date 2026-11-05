import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { MANIFEST_PATHS, projectNebulaManifests } from "./project-mainline-a-beta-nebula.mjs";

export const PACK_SCHEMA = "mainline-a-nebula-review-pack-v612";
export const PROJECTION_PATH = "app/data/mainlineABetaNebulaProjectionV609.generated.ts";
export const OUTPUT_PATH = "app/data/mainlineANebulaReviewPackV612.generated.json";
export const EXPECTED_CANDIDATE_COUNT = 18;
export const REQUIRED_BLOCKERS = Object.freeze(["rights-policy-review", "visual-crop-signoff", "runtime-admission"]);
export const REVIEW_STATES = Object.freeze(["source-verified", "rights-review", "visual-review", "admission-ready"]);

const SHA256 = /^[a-f0-9]{64}$/i;

export function fail(message) {
  throw new Error(`nebula review pack v612: ${message}`);
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
  const absolute = path.join(root, relativePath);
  assert(fs.existsSync(absolute), `missing manifest ${relativePath}`);
  try {
    return JSON.parse(fs.readFileSync(absolute, "utf8"));
  } catch (error) {
    fail(`${relativePath} JSON parse failed: ${error.message}`);
  }
}

export function readManifestMetadata(root) {
  return MANIFEST_PATHS.map((relativePath) => {
    const bytes = fs.readFileSync(path.join(root, relativePath));
    const value = readJson(root, relativePath);
    return {
      path: relativePath,
      contentSha256: sha256(bytes),
      generatedAt: value.generatedAt ?? null,
      version: value.version ?? null,
      status: value.status ?? null,
    };
  });
}

export function loadProjectionSource(root) {
  const absolute = path.join(root, PROJECTION_PATH);
  assert(fs.existsSync(absolute), `missing projection ${PROJECTION_PATH}`);
  const source = fs.readFileSync(absolute, "utf8");
  const match = source.match(/Object\.freeze\((\[[\s\S]*\])\s*\);\s*$/);
  assert(match, "projection is not a JSON-shaped generated module");
  let rows;
  try {
    rows = JSON.parse(match[1]);
  } catch (error) {
    fail(`projection JSON parse failed: ${error.message}`);
  }
  assert(Array.isArray(rows), "projection rows missing");
  assert(rows.length === EXPECTED_CANDIDATE_COUNT, `projection count changed: ${rows.length}`);
  return { source, rows, sha256: sha256(source) };
}

function readJpegDimensions(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 2 > bytes.length) return null;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) return null;
    const isFrame = (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);
    if (isFrame && length >= 7) return { height: bytes.readUInt16BE(offset + 3), width: bytes.readUInt16BE(offset + 5) };
    offset += length;
  }
  return null;
}

export function inspectLocalAsset(root, row) {
  const relativePath = row.source.localPath;
  const absolutePath = path.isAbsolute(relativePath) ? relativePath : path.join(root, relativePath);
  if (!SHA256.test(row.source.sha256)) return { status: "mismatch", path: relativePath, bytes: null, sha256: null, dimensions: null, risks: ["source-digest-invalid"] };
  if (!fs.existsSync(absolutePath)) {
    return { status: "missing", path: relativePath, bytes: null, sha256: null, dimensions: null, risks: ["local-payload-missing"] };
  }
  const bytes = fs.readFileSync(absolutePath);
  const digest = sha256(bytes);
  const dimensions = readJpegDimensions(bytes);
  const risks = [];
  if (bytes.length !== row.source.bytes) risks.push("local-bytes-mismatch");
  if (digest !== row.source.sha256) risks.push("local-digest-mismatch");
  if (!dimensions) risks.push("local-format-unreadable");
  if (dimensions && (dimensions.width !== row.source.width || dimensions.height !== row.source.height)) risks.push("local-dimensions-mismatch");
  return { status: risks.length === 0 ? "verified" : "mismatch", path: relativePath, bytes: bytes.length, sha256: digest, dimensions, risks };
}

export function verifyProjectionAgainstManifests(root, projection, manifestRows = projectNebulaManifests(root, { requireLocal: true })) {
  assert(manifestRows.length === EXPECTED_CANDIDATE_COUNT, `manifest row count changed: ${manifestRows.length}`);
  assert(stableJson(projection.rows) === stableJson(manifestRows), "generated projection differs from sealed manifests");
  const seen = new Set();
  for (const row of projection.rows) {
    assert(!seen.has(row.id), `duplicate projection id ${row.id}`);
    seen.add(row.id);
    assert(row.rightsStatus === "review", `${row.id} rights status opened`);
    assert(row.visualAssetAdmitted === false, `${row.id} visual admission opened`);
    assert(row.scienceImagePayloadAllowed === false, `${row.id} science payload opened`);
  }
  return manifestRows;
}

function latestManifestTimestamp(metadata) {
  const dates = metadata.map((item) => item.generatedAt).filter((value) => typeof value === "string");
  assert(dates.length === metadata.length, "manifest generatedAt missing");
  return dates.sort().at(-1);
}

function buildRecord(root, row, projectionSha256) {
  const localEvidence = inspectLocalAsset(root, row);
  assert(localEvidence.status === "verified", `${row.id} local evidence ${localEvidence.risks.join(",")}`);
  return {
    id: row.id,
    target: row.target,
    catalogName: row.catalogName,
    nasaId: row.nasaId,
    state: "rights-review",
    blockers: [...REQUIRED_BLOCKERS],
    source: {
      url: row.source.url,
      localPath: row.source.localPath,
      bytes: row.source.bytes,
      width: row.source.width,
      height: row.source.height,
      sha256: row.source.sha256,
      license: row.source.license,
      licenseUrl: row.source.licenseUrl,
      credit: row.source.credit,
      receiptRefs: row.source.receiptRefs,
    },
    localEvidence,
    provenance: {
      manifestPath: row.manifestPath,
      manifestSha256: row.manifestSha256,
      projectionSha256,
    },
    runtime: {
      visualAssetAdmitted: false,
      scienceImagePayloadAllowed: false,
      candidateOnly: true,
    },
    reviewer: {
      owner: null,
      reviewedAt: null,
      rightsEvidencePath: null,
      visualEvidencePath: null,
      decision: "pending",
    },
  };
}

export function buildPack({ root = process.cwd() } = {}) {
  const projection = loadProjectionSource(root);
  const manifestRows = projectNebulaManifests(root, { requireLocal: true });
  verifyProjectionAgainstManifests(root, projection, manifestRows);
  const metadata = readManifestMetadata(root);
  const records = projection.rows.map((row) => buildRecord(root, row, projection.sha256));
  assert(records.length === EXPECTED_CANDIDATE_COUNT, "record count changed");
  assert(records.every((record) => record.state === "rights-review"), "rights state changed without review evidence");
  return {
    schema: PACK_SCHEMA,
    generatedAt: latestManifestTimestamp(metadata),
    sourceManifests: metadata,
    projection: { path: PROJECTION_PATH, sha256: projection.sha256 },
    candidateCount: records.length,
    states: REVIEW_STATES,
    counts: { "rights-review": records.length, "visual-review": 0, "admission-ready": 0, "runtime-admitted": 0 },
    runtimeAdmissionCount: 0,
    localEvidenceVerifiedCount: records.filter((record) => record.localEvidence.status === "verified").length,
    rightsAdmission: "pending-item-level-review",
    visualSignoff: "pending",
    scienceImagePayloadAllowed: false,
    records,
  };
}

export function readPack(root = process.cwd()) {
  const absolute = path.join(root, OUTPUT_PATH);
  assert(fs.existsSync(absolute), `review pack missing ${OUTPUT_PATH}`);
  try {
    return JSON.parse(fs.readFileSync(absolute, "utf8"));
  } catch (error) {
    fail(`review pack JSON parse failed: ${error.message}`);
  }
}

export function verifyPack(actual, expected) {
  assert(stableJson(actual) === stableJson(expected), "existing pack differs from verified local evidence");
  assert(actual.schema === PACK_SCHEMA, "pack schema changed");
  assert(actual.candidateCount === EXPECTED_CANDIDATE_COUNT, "pack candidate count changed");
  assert(stableJson(actual.states) === stableJson(REVIEW_STATES), "pack review states changed");
  assert(actual.runtimeAdmissionCount === 0, "pack runtime admission opened");
  assert(actual.localEvidenceVerifiedCount === EXPECTED_CANDIDATE_COUNT, "local evidence count changed");
  assert(actual.scienceImagePayloadAllowed === false, "science payload gate opened");
  assert(Array.isArray(actual.records) && actual.records.length === EXPECTED_CANDIDATE_COUNT, "pack records changed");
  actual.records.forEach((record, index) => {
    assert(record.id === expected.records[index].id, `record order changed at ${index}`);
    assert(record.state === "rights-review", `${record.id} rights review closed without evidence`);
    assert(record.localEvidence.status === "verified", `${record.id} local evidence is not verified`);
    assert(record.runtime.candidateOnly === true, `${record.id} candidate boundary opened`);
    assert(record.reviewer.decision === "pending", `${record.id} reviewer decision changed`);
  });
  return { status: "verified", candidateCount: actual.candidateCount, localEvidenceVerifiedCount: actual.localEvidenceVerifiedCount, output: OUTPUT_PATH };
}

export function writePack(root = process.cwd(), pack = buildPack({ root })) {
  fs.writeFileSync(path.join(root, OUTPUT_PATH), `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  return { status: "generated", candidateCount: pack.candidateCount, localEvidenceVerifiedCount: pack.localEvidenceVerifiedCount, output: OUTPUT_PATH };
}

export function run({ root = process.cwd(), check = false } = {}) {
  const pack = buildPack({ root });
  return check ? verifyPack(readPack(root), pack) : writePack(root, pack);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(run({ check: process.argv.includes("--check") }), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
