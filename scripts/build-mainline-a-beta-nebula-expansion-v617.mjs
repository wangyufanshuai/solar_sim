import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { readSealedDocument } from "./mainline-a-nebula-receipt-linker-v614.mjs";

export const PACK_SCHEMA = "mainline-a-beta-nebula-expansion-v617";
export const BASE_PACK_PATH = "app/data/mainlineANebulaRightsPackV613.generated.json";
export const LICENSE_REVIEW_PATH = "docs/release/v592/nebula-item-license-review-v592.json";
export const METADATA_ADMISSION_PATH = "docs/release/v592/nebula-asset-metadata-admission-v592.json";
export const METADATA_RECEIPT_PATH = "docs/release/v592/acquisition-receipt-nebula-item-metadata-v592.json";
export const VISUAL_RECEIPT_PATH = "docs/release/v592/acquisition-receipt-nebula-visual-sources-v592.json";
export const OUTPUT_PATH = "app/data/mainlineABetaNebulaExpansionV617.generated.json";
export const EXPANSION_IDS = Object.freeze([
  "ring-nebula", "dumbbell-nebula", "california-nebula", "bubble-nebula", "cats-eye-nebula", "omega-nebula",
]);
export const EXPECTED_BASE_COUNT = 18;
export const EXPECTED_TOTAL_COUNT = 24;
export const POLICY_URL = "https://www.nasa.gov/nasa-brand-center/images-and-media/";
const SHA256_PATTERN = /^[a-f0-9]{64}$/i;

export function fail(message) { throw new Error(`nebula expansion v617: ${message}`); }
export function assert(condition, message) { if (!condition) fail(message); }
export function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
export function stableJson(value) { return JSON.stringify(value); }

function readJson(root, relativePath) {
  const file = path.join(root, relativePath);
  assert(fs.existsSync(file), `missing ${relativePath}`);
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) { fail(`${relativePath} invalid JSON: ${error.message}`); }
}

function readBytes(root, relativePath) {
  const file = path.join(root, relativePath);
  assert(fs.existsSync(file), `missing ${relativePath}`);
  return fs.readFileSync(file);
}

function unique(values) { return [...new Set(values)]; }

export function readInputs(root = process.cwd()) {
  const base = readJson(root, BASE_PACK_PATH);
  const license = readJson(root, LICENSE_REVIEW_PATH);
  const metadata = readJson(root, METADATA_ADMISSION_PATH);
  const metadataReceipt = readJson(root, METADATA_RECEIPT_PATH);
  const visualReceipt = readJson(root, VISUAL_RECEIPT_PATH);
  const licenseSeal = readSealedDocument(root, LICENSE_REVIEW_PATH, "receiptSha256");
  const metadataSeal = readSealedDocument(root, METADATA_ADMISSION_PATH, "receiptSha256");
  const metadataReceiptSeal = readSealedDocument(root, METADATA_RECEIPT_PATH, "receiptSha256");
  const visualReceiptSeal = readSealedDocument(root, VISUAL_RECEIPT_PATH, "receiptSha256");
  assert(base.schema === "mainline-a-nebula-rights-pack-v613", "base pack schema changed");
  assert(base.candidateCount === EXPECTED_BASE_COUNT && base.records.length === EXPECTED_BASE_COUNT, "base candidate count changed");
  assert(license.version === "v592-nebula-item-license-review-v1", "license review version changed");
  assert(metadata.version === "v592-nebula-asset-metadata-admission-v1", "metadata admission version changed");
  assert(metadataReceipt.version === "v592-nebula-item-metadata-acquisition-v1", "metadata receipt version changed");
  assert(visualReceipt.version === "v592-nebula-visual-source-acquisition-v1", "visual receipt version changed");
  assert(license.receiptSha256 === licenseSeal.declared, "license receipt seal field changed");
  assert(metadata.receiptSha256 === metadataSeal.declared, "metadata receipt seal field changed");
  assert(metadataReceipt.receiptSha256 === metadataReceiptSeal.declared, "metadata acquisition receipt seal field changed");
  assert(visualReceipt.receiptSha256 === visualReceiptSeal.declared, "visual acquisition receipt seal field changed");
  assert(license.policy.visualAssetAdmissionGranted === false && metadata.policy.visualAssetAdmissionGranted === false, "historical admission boundary opened");
  return { base, license, metadata, metadataReceipt, visualReceipt, licenseSeal, metadataSeal, metadataReceiptSeal, visualReceiptSeal };
}

function byTarget(rows) { return new Map(rows.map((row) => [row.target, row])); }

function metadataCandidate(metadataRow) {
  const candidate = metadataRow.acquisitionCandidate;
  return candidate ? {
    httpsUrl: candidate.httpsUrl,
    extension: candidate.extension,
    requested: candidate.requested === true,
    bytes: candidate.bytes ?? null,
    sha256: candidate.sha256 ?? null,
    licenseReview: candidate.licenseReview,
  } : null;
}

function visualPayload(root, target, receipt) {
  const row = receipt.assets.find((asset) => asset.target === target);
  if (!row) return { state: "payload-acquisition-pending", row: null };
  const bytes = readBytes(root, row.outputPath);
  const actualSha256 = sha256(bytes);
  assert(actualSha256 === row.sha256, `${target} payload sha mismatch`);
  assert(bytes.length === row.bytes, `${target} payload byte mismatch`);
  return { state: "local-payload-present", row: { ...row, actualSha256 } };
}

function blockers(review, metadataRow, payload) {
  const values = [];
  if (review.status !== "eligible-for-explicit-single-request-visual-source-acquisition") values.push("license-review-blocked");
  if (Array.isArray(review.blocker)) values.push(...review.blocker.map((value) => `license:${value}`));
  if (metadataRow.state !== "candidate-explicit-https-acquisition-required") values.push("metadata-acquisition-state-blocked");
  if (payload.state !== "local-payload-present") values.push("payload-acquisition-pending");
  values.push("rights-review-pending", "visual-signoff-pending", "runtime-candidate-only");
  return unique(values);
}

function buildExpansionRecord(root, target, rank, inputs, maps) {
  const review = maps.reviews.get(target);
  const metadataRow = maps.metadata.get(target);
  assert(review && metadataRow, `${target} expansion identity missing`);
  assert(review.nasaId === metadataRow.nasaId, `${target} NASA ID mismatch`);
  assert(review.sourceImage.url.startsWith("https://"), `${target} source URL is not HTTPS`);
  const payload = visualPayload(root, target, inputs.visualReceipt);
  const metadataFile = readBytes(root, review.sourceMetadataPath);
  assert(sha256(metadataFile) === review.sourceMetadataSha256, `${target} metadata digest mismatch`);
  const blockerList = blockers(review, metadataRow, payload);
  const source = Object.freeze({
    nasaId: review.nasaId,
    sourceUrl: review.sourceImage.url,
    previewUrl: metadataCandidate(metadataRow)?.httpsUrl ?? review.sourceImage.url,
    metadataPath: review.sourceMetadataPath,
    metadataSha256: review.sourceMetadataSha256,
    creator: review.creator,
    secondaryCreator: review.secondaryCreator,
    credit: review.secondaryCreator || review.creator || "NASA source credit pending confirmation",
    licenseUrl: POLICY_URL,
    declaredLicenseState: review.status,
  });
  return Object.freeze({
    candidateId: target,
    expansionRank: rank,
    status: payload.state === "local-payload-present" ? "payload-present-rights-pending" : "metadata-only-acquisition-blocked",
    acquisitionDecision: review.status,
    source,
    metadata: Object.freeze({ state: metadataRow.state, receiptSha256: inputs.metadataReceipt.receiptSha256, candidate: metadataCandidate(metadataRow) }),
    payload: payload.row ? Object.freeze({ state: payload.state, localPath: payload.row.outputPath, bytes: payload.row.bytes, sha256: payload.row.sha256, width: payload.row.width, height: payload.row.height, format: payload.row.format }) : Object.freeze({ state: payload.state, localPath: null, bytes: null, sha256: null, width: null, height: null, format: null }),
    receipts: Object.freeze({ licenseReviewSha256: inputs.license.receiptSha256, metadataAdmissionSha256: inputs.metadata.receiptSha256, metadataAcquisitionSha256: inputs.metadataReceipt.receiptSha256, visualAcquisitionSha256: inputs.visualReceipt.receiptSha256 }),
    blockers: Object.freeze(blockerList),
    runtime: Object.freeze({ candidateOnly: true, visualAssetAdmitted: false, scienceImagePayloadAllowed: false }),
    nextAction: payload.state === "local-payload-present" ? "补齐逐图权利证据、视觉 signoff，再申请接入" : "先完成明确许可下的单次 HTTPS payload 采集，再做权利与视觉复核",
  });
}

export function buildPack(root = process.cwd()) {
  const inputs = readInputs(root);
  const reviewByTarget = byTarget(inputs.license.reviews);
  const metadataByTarget = byTarget(inputs.metadata.targets);
  const baseIds = new Set(inputs.base.records.map((record) => record.candidateId));
  EXPANSION_IDS.forEach((id) => assert(!baseIds.has(id), `${id} already exists in base pack`));
  const records = EXPANSION_IDS.map((target, index) => buildExpansionRecord(root, target, index + 1, inputs, { reviews: reviewByTarget, metadata: metadataByTarget }));
  assert(new Set(records.map((record) => record.candidateId)).size === EXPANSION_IDS.length, "expansion IDs duplicated");
  return {
    schema: PACK_SCHEMA,
    generatedAt: inputs.base.generatedAt,
    base: { path: BASE_PACK_PATH, sha256: sha256(readBytes(root, BASE_PACK_PATH)), candidateCount: EXPECTED_BASE_COUNT },
    sourceBoundary: { licenseReviewPath: LICENSE_REVIEW_PATH, metadataAdmissionPath: METADATA_ADMISSION_PATH, policyUrl: POLICY_URL, legalDecision: "not-granted", visualAssetAdmission: false, scienceImagePayloadWriteback: false },
    counts: { baseCandidates: EXPECTED_BASE_COUNT, expansionCandidates: records.length, candidateTotal: EXPECTED_TOTAL_COUNT, localPayloadPresent: records.filter((record) => record.payload.state === "local-payload-present").length, payloadAcquisitionPending: records.filter((record) => record.payload.state !== "local-payload-present").length, blocked: records.filter((record) => record.blockers.length > 0).length, runtimeAdmitted: 0 },
    records,
  };
}

export function validateRecord(record) {
  assert(EXPANSION_IDS.includes(record.candidateId), `unknown expansion candidate ${record.candidateId}`);
  assert(record.source.sourceUrl.startsWith("https://"), `${record.candidateId} source URL changed`);
  assert(record.source.previewUrl.startsWith("https://"), `${record.candidateId} preview URL changed`);
  assert(SHA256_PATTERN.test(record.source.metadataSha256), `${record.candidateId} metadata digest invalid`);
  assert(record.runtime.candidateOnly === true, `${record.candidateId} candidate boundary opened`);
  assert(record.runtime.visualAssetAdmitted === false, `${record.candidateId} visual admission opened`);
  assert(record.runtime.scienceImagePayloadAllowed === false, `${record.candidateId} science payload opened`);
  if (record.payload.state === "local-payload-present") {
    assert(record.payload.localPath && record.payload.bytes > 0 && SHA256_PATTERN.test(record.payload.sha256), `${record.candidateId} local payload incomplete`);
  } else {
    assert(record.payload.localPath === null && record.payload.sha256 === null, `${record.candidateId} pending payload fabricated`);
  }
}

export function verifyPack(actual, expected) {
  assert(stableJson(actual) === stableJson(expected), "expansion pack differs from sealed inputs");
  assert(actual.schema === PACK_SCHEMA, "expansion schema changed");
  assert(actual.counts.baseCandidates === EXPECTED_BASE_COUNT, "base count changed");
  assert(actual.counts.candidateTotal === EXPECTED_TOTAL_COUNT, "candidate total changed");
  assert(actual.counts.runtimeAdmitted === 0, "runtime admission opened");
  actual.records.forEach(validateRecord);
  return { status: "verified", expansion: actual.counts.expansionCandidates, total: actual.counts.candidateTotal, payloadPresent: actual.counts.localPayloadPresent, pending: actual.counts.payloadAcquisitionPending, output: OUTPUT_PATH };
}

export function run({ root = process.cwd(), check = false } = {}) {
  const pack = buildPack(root);
  if (check) return verifyPack(readJson(root, OUTPUT_PATH), pack);
  fs.writeFileSync(path.join(root, OUTPUT_PATH), `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  return { status: "generated", expansion: pack.counts.expansionCandidates, total: pack.counts.candidateTotal, payloadPresent: pack.counts.localPayloadPresent, pending: pack.counts.payloadAcquisitionPending, output: OUTPUT_PATH };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(run({ check: process.argv.includes("--check") }), null, 2)); }
  catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
}
