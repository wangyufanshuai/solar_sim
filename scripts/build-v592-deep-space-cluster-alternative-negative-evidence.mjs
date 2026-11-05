import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "docs/release/v592/deep-space-cluster-alternative-negative-evidence-v592.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function readJson(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }
function verifySealed(path) {
  const document = readJson(path);
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-cluster-negative-seal:${path}`);
  return document;
}
function writeSealed(path, unsigned) {
  const document = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  writeFileSync(partial, `${JSON.stringify(document, null, 2)}\n`);
  rmSync(path, { force: true });
  renameSync(partial, path);
  return document;
}

const definitions = readJson("scripts/v592-deep-space-cluster-alternative-probes.json");
assert(definitions.version === "v592-deep-space-cluster-alternative-probes-v1", "v592-cluster-negative-definitions");
const receipts = definitions.probes.map((probe) => verifySealed(`docs/release/v592/metadata-probe-deep-space-cluster-alternatives/${probe.id}.json`));
for (const [index, receipt] of receipts.entries()) {
  const probe = definitions.probes[index];
  assert(receipt.version === "v592-deep-space-cluster-alternative-metadata-probe-v1", `v592-cluster-negative-version:${probe.id}`);
  assert(receipt.status === "metadata-probe-complete-no-payload", `v592-cluster-negative-status:${probe.id}`);
  assert(receipt.target === probe.target && receipt.probeId === probe.id, `v592-cluster-negative-identity:${probe.id}`);
  assert(receipt.totalHits === 0 && receipt.matchedCandidateCount === 0, `v592-cluster-negative-nonzero-result:${probe.id}`);
  assert(receipt.policy.requestCount === 1 && receipt.policy.automaticRetryPerformed === false && receipt.policy.automaticReplacementPerformed === false && receipt.policy.payloadDownloaded === false && receipt.visualAssetAdmission === false, `v592-cluster-negative-policy:${probe.id}`);
}

const receipt = writeSealed(outputPath, {
  version: "v592-deep-space-cluster-alternative-negative-evidence-v1",
  generatedAt: "2026-08-20T00:00:00Z",
  status: "six-exact-ngc-alternative-probes-zero-qualified-candidates",
  targets: definitions.probes.map((probe) => probe.target),
  sourceReceipts: receipts.map((entry) => ({ probeId: entry.probeId, target: entry.target, receiptSha256: entry.receiptSha256, query: entry.query, requestCount: entry.policy.requestCount, totalHits: entry.totalHits, matchedCandidateCount: entry.matchedCandidateCount, payloadDownloaded: entry.policy.payloadDownloaded })),
  summary: { metadataProbeCount: receipts.length, metadataRequestCount: receipts.reduce((sum, entry) => sum + entry.policy.requestCount, 0), officialCandidateCount: 0, qualifiedVisualTextureCount: 0, visualPayloadDownloadedCount: 0, runtimeAssetAdmittedCount: 0, blockedTargetCount: receipts.length },
  policy: { metadataOnly: true, automaticRetryPerformed: false, automaticReplacementPerformed: false, noSyntheticStarGeneration: true, noProceduralFallback: true, noIdentityThresholdRelaxation: true, scientificPayloadWriteback: false },
});
console.log(JSON.stringify({ status: receipt.status, metadataProbeCount: receipt.summary.metadataProbeCount, officialCandidateCount: receipt.summary.officialCandidateCount, qualifiedVisualTextureCount: receipt.summary.qualifiedVisualTextureCount, blockedTargetCount: receipt.summary.blockedTargetCount, receiptSha256: receipt.receiptSha256 }, null, 2));
