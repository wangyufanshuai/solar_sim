import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { assertReceiptLinkage, linkReceiptReferences, readManifestSeal, summarizeReceiptLinkage } from "./mainline-a-nebula-receipt-linker-v614.mjs";

export const PACK_SCHEMA = "mainline-a-nebula-rights-pack-v613";
export const INPUT_PACK_PATH = "app/data/mainlineANebulaReviewPackV612.generated.json";
export const PROJECTION_PATH = "app/data/mainlineABetaNebulaProjectionV609.generated.ts";
export const OUTPUT_PATH = "app/data/mainlineANebulaRightsPackV613.generated.json";
export const EXPECTED_COUNT = 18;
export const CANONICAL_POLICY_URL = "https://www.nasa.gov/nasa-brand-center/images-and-media/";

export function fail(message) { throw new Error(`nebula rights pack v613: ${message}`); }
export function assert(condition, message) { if (!condition) fail(message); }
export function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
export function stableJson(value) { return JSON.stringify(value); }

function readJson(root, relativePath) {
  const file = path.join(root, relativePath);
  assert(fs.existsSync(file), `missing ${relativePath}`);
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) { fail(`${relativePath} invalid JSON: ${error.message}`); }
}

export function readReviewPack(root = process.cwd()) {
  const pack = readJson(root, INPUT_PACK_PATH);
  assert(pack.schema === "mainline-a-nebula-review-pack-v612", "input schema changed");
  assert(pack.candidateCount === EXPECTED_COUNT, `input count changed: ${pack.candidateCount}`);
  assert(pack.localEvidenceVerifiedCount === EXPECTED_COUNT, "local evidence is incomplete");
  assert(Array.isArray(pack.records) && pack.records.length === EXPECTED_COUNT, "input records missing");
  return pack;
}

export function readProjection(root = process.cwd()) {
  const source = fs.readFileSync(path.join(root, PROJECTION_PATH), "utf8");
  const match = source.match(/Object\.freeze\((\[[\s\S]*\])\s*\);\s*$/);
  assert(match, "projection body missing");
  const rows = JSON.parse(match[1]);
  assert(Array.isArray(rows) && rows.length === EXPECTED_COUNT, "projection count changed");
  return { rows, sha256: sha256(source) };
}

function pendingEvidence(record, projection) {
  const source = projection.source;
  return {
    schema: PACK_SCHEMA,
    candidateId: record.id,
    sourceSha256: source.sha256,
    sourceUrl: source.url,
    sourceLicense: source.license,
    sourceLicenseUrl: source.licenseUrl ?? CANONICAL_POLICY_URL,
    decision: "unreviewed",
    status: "pending",
    rightsPage: null,
    policyPage: null,
    evidencePath: null,
    evidenceSha256: null,
    reviewer: null,
    reviewedAt: null,
    creditConfirmed: false,
    notes: null,
  };
}

export function buildPack(root = process.cwd()) {
  const reviewPack = readReviewPack(root);
  const projection = readProjection(root);
  const projectionById = new Map(projection.rows.map((row) => [row.id, row]));
  const manifestPaths = [...new Set(reviewPack.records.map((record) => record.provenance.manifestPath))];
  const manifestSeals = manifestPaths.map((manifestPath) => readManifestSeal(root, manifestPath));
  const manifestSealByPath = new Map(manifestSeals.map((seal) => [seal.manifestPath, seal]));
  const records = reviewPack.records.map((record) => {
    const row = projectionById.get(record.id);
    assert(row, `projection row missing ${record.id}`);
    assert(record.state === "rights-review", `${record.id} review state opened`);
    assert(record.runtime.candidateOnly === true, `${record.id} candidate boundary opened`);
    const receiptLinkage = assertReceiptLinkage(linkReceiptReferences(root, {
      id: record.id,
      target: record.target,
      nasaId: record.nasaId,
      sourceUrl: record.source.url,
      bytes: record.source.bytes,
      sha256: record.source.sha256,
      localPath: record.source.localPath,
    }, row.source.receiptRefs ?? {}));
    const manifestSeal = manifestSealByPath.get(record.provenance.manifestPath);
    return {
      candidateId: record.id,
      nasaId: record.nasaId,
      manifestPath: record.provenance.manifestPath,
      manifestSha256: record.provenance.manifestSha256,
      sourceSha256: record.source.sha256,
      sourceUrl: record.source.url,
      sourceLocalPath: record.source.localPath,
      sourceBytes: record.source.bytes,
      sourceWidth: record.source.width,
      sourceHeight: record.source.height,
      sourceLicense: record.source.license,
      sourceCredit: record.source.credit,
      receiptRefs: row.source.receiptRefs ?? {},
      receiptLinkage,
      manifestSealSha256: manifestSeal.manifestSealSha256,
      evidence: pendingEvidence(record, row),
      runtime: { candidateOnly: true, visualAssetAdmitted: false, scienceImagePayloadAllowed: false },
    };
  });
  return {
    schema: PACK_SCHEMA,
    generatedAt: reviewPack.generatedAt,
    inputPack: { path: INPUT_PACK_PATH, sha256: sha256(fs.readFileSync(path.join(root, INPUT_PACK_PATH))) },
    projection: { path: PROJECTION_PATH, sha256: projection.sha256 },
    manifestSeals,
    candidateCount: records.length,
    rightsDecisionCounts: { unreviewed: records.length, cleared: 0, rejected: 0 },
    evidenceStatusCounts: { pending: records.length, verified: 0, rejected: 0 },
    runtimeAdmissionCount: 0,
    rightsPolicy: { requiredLicense: "source-declared item license", requiredLicenseUrl: CANONICAL_POLICY_URL, itemLevelDecisionRequired: true },
    receiptLinkage: { ...summarizeReceiptLinkage(records.map((record) => record.receiptLinkage)), status: "linked-but-not-a-rights-grant", contentHashVerification: "receipt-content-and-item-linkage-checked", itemLevelReviewRequired: true },
    records,
  };
}

export function verifyPack(actual, expected) {
  assert(stableJson(actual) === stableJson(expected), "rights pack differs from sealed review input");
  assert(actual.schema === PACK_SCHEMA, "rights schema changed");
  assert(actual.candidateCount === EXPECTED_COUNT, "rights count changed");
  assert(actual.runtimeAdmissionCount === 0, "runtime admission opened");
  assert(actual.rightsDecisionCounts.unreviewed === EXPECTED_COUNT, "unreviewed count changed");
  assert(actual.evidenceStatusCounts.pending === EXPECTED_COUNT, "pending count changed");
  assert(Array.isArray(actual.manifestSeals) && actual.manifestSeals.every((seal) => seal.manifestSealSha256 && seal.receiptSha256 && seal.receiptManifestSha256 === seal.manifestSealSha256), "manifest seal linkage changed");
  for (const record of actual.records) {
    assert(record.evidence.status === "pending", `${record.candidateId} evidence status changed`);
    assert(record.evidence.decision === "unreviewed", `${record.candidateId} rights decision changed`);
    assert(record.runtime.candidateOnly === true, `${record.candidateId} runtime boundary changed`);
  }
  return { status: "verified", candidateCount: actual.candidateCount, pending: actual.evidenceStatusCounts.pending, output: OUTPUT_PATH };
}

export function run({ root = process.cwd(), check = false } = {}) {
  const pack = buildPack(root);
  if (check) return verifyPack(readJson(root, OUTPUT_PATH), pack);
  fs.writeFileSync(path.join(root, OUTPUT_PATH), `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  return { status: "generated", candidateCount: pack.candidateCount, pending: pack.evidenceStatusCounts.pending, output: OUTPUT_PATH };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(run({ check: process.argv.includes("--check") }), null, 2)); }
  catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
}
