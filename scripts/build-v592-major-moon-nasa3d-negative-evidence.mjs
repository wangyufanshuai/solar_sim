import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const acquisitionPath = resolve(root, "docs/release/v592/acquisition-receipt-major-moon-nasa3d-textures-v592.json");
const analysisPath = resolve(root, "docs/release/v592/major-moon-nasa3d-visual-analysis-v592.json");
const outputPath = resolve(root, "docs/release/v592/major-moon-nasa3d-negative-evidence-v592.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function readSealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  if (document.receiptSha256 !== canonicalSha(unsigned)) throw new Error(`v592-nasa3d-negative-seal:${path}`);
  return document;
}
function atomicWrite(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
}

const acquisition = readSealed(acquisitionPath);
const analysis = readSealed(analysisPath);
if (acquisition.version !== "v592-major-moon-nasa3d-visual-acquisition-v1") throw new Error("v592-nasa3d-negative-acquisition-version");
if (analysis.version !== "v592-major-moon-nasa3d-visual-analysis-v1") throw new Error("v592-nasa3d-negative-analysis-version");
if (analysis.policy.sourceAcquisitionReceiptSha256 !== acquisition.receiptSha256) throw new Error("v592-nasa3d-negative-chain");
if (analysis.summary.analyzedCount !== 3 || analysis.summary.runtimeAssetAdmittedCount !== 0) throw new Error("v592-nasa3d-negative-summary");

const unsigned = {
  version: "v592-major-moon-nasa3d-negative-evidence-v1",
  generatedAt: process.env.ATLAS_V592_GENERATED_AT ?? "2026-08-21T00:00:00Z",
  status: "three-official-nasa3d-global-textures-source-coverage-blocked-no-runtime-admission",
  targets: analysis.analyses.map((entry) => entry.target),
  sourceReceipts: {
    acquisitionReceiptSha256: acquisition.receiptSha256,
    analysisReceiptSha256: analysis.receiptSha256,
  },
  findings: analysis.analyses.map((entry) => ({
    target: entry.target,
    sourceUrl: entry.sourceUrl,
    sourceSha256: entry.sourceSha256,
    sourceGitBlobSha1: entry.sourceGitBlobSha1,
    decision: entry.visualInspectionDecision,
    metrics: entry.metrics,
    reason: entry.metrics.nearBlackPixelFraction > 0.25
      ? "official-global-projection-contains-large-unobserved-near-black-coverage; no-inpainting-or-synthetic-fill"
      : "texture-suitability-review-required",
    runtimeAssetAdmitted: false,
    heroAdmission: false,
  })),
  summary: {
    requestedTargetCount: acquisition.requestedUrls.length,
    acquiredTargetCount: acquisition.assets.length,
    analyzedTargetCount: analysis.summary.analyzedCount,
    qualifiedGlobalTextureCount: analysis.summary.runtimeDerivationCandidateCount,
    sourceCoverageBlockedCount: analysis.summary.sourceCoverageBlockedCount,
    runtimeAssetAdmittedCount: 0,
    scientificPayloadDownloadedCount: 0,
  },
  policy: {
    officialNASA3DRepositoryOnly: true,
    requestCountPerUrl: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    noInpainting: true,
    noSyntheticCoverageFill: true,
    noProceduralFallback: true,
    noThresholdRelaxation: true,
    scientificPayloadWriteback: false,
    measuredAuthorityGranted: false,
    runtimeAssetAdmissionGranted: false,
    heroAdmissionGranted: false,
  },
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(outputPath, receipt);
console.log(JSON.stringify({
  status: receipt.status,
  summary: receipt.summary,
  targets: receipt.targets,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
