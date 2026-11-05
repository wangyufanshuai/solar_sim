import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "docs/release/v592/major-moon-alternative-source-negative-evidence-v592.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function readJson(path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}
function verifySealed(path, field = "receiptSha256") {
  const document = readJson(path);
  const unsigned = { ...document };
  delete unsigned[field];
  assert(document[field] === canonicalSha(unsigned), `v592-major-moon-alternative-seal:${path}`);
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

const definitions = readJson("scripts/v592-major-moon-alternative-metadata-probes.json");
assert(definitions.version === "v592-major-moon-alternative-metadata-probes-v1", "v592-major-moon-alternative-definitions");
const receipts = definitions.probes.map((probe) => verifySealed(`docs/release/v592/metadata-probe-major-moon-alternatives/${probe.id}.json`));
const visualAnalysis = verifySealed("docs/release/v592/major-moon-source-visual-analysis-v592.json");
const secondaryMetadata = verifySealed("docs/release/v592/metadata-probe-major-moon-secondary-products-v592.json");

for (const [index, receipt] of receipts.entries()) {
  const definition = definitions.probes[index];
  assert(receipt.version === "v592-major-moon-alternative-metadata-probe-v1", `v592-major-moon-alternative-version:${definition.id}`);
  assert(receipt.status === "metadata-probe-complete-no-payload", `v592-major-moon-alternative-status:${definition.id}`);
  assert(receipt.probeId === definition.id && receipt.target === definition.target, `v592-major-moon-alternative-identity:${definition.id}`);
  assert(receipt.policy.requestCount === 1, `v592-major-moon-alternative-request-count:${definition.id}`);
  assert(receipt.policy.automaticRetryPerformed === false, `v592-major-moon-alternative-retry:${definition.id}`);
  assert(receipt.policy.automaticReplacementPerformed === false, `v592-major-moon-alternative-replacement:${definition.id}`);
  assert(receipt.policy.payloadDownloaded === false, `v592-major-moon-alternative-payload:${definition.id}`);
  assert(receipt.visualAssetAdmission === false, `v592-major-moon-alternative-admission:${definition.id}`);
}

const triton = receipts.find((receipt) => receipt.target === "triton");
const miranda = receipts.find((receipt) => receipt.target === "miranda");
const titania = receipts.find((receipt) => receipt.target === "titania");
assert(triton?.totalHits === 0 && titania?.totalHits === 0, "v592-major-moon-alternative-zero-results");
assert(miranda?.matchedCandidateCount === 2, "v592-major-moon-alternative-miranda-candidates");
const mirandaIds = miranda.candidates.map((candidate) => candidate.nasaId).sort();
assert(mirandaIds.join(",") === "PIA01354,PIA01490", "v592-major-moon-alternative-miranda-identities");
assert(visualAnalysis.analyses.find((entry) => entry.target === "triton")?.visualInspectionDecision === "blocked-non-equirectangular-coverage", "v592-major-moon-alternative-triton-coverage");
const usgsSearchIds = new Set(secondaryMetadata.assets.map((asset) => asset.id));
for (const id of ["triton-usgs-global-mosaic-search", "miranda-usgs-global-mosaic-search", "titania-usgs-global-mosaic-search"]) {
  assert(usgsSearchIds.has(id), `v592-major-moon-alternative-usgs-search:${id}`);
}

const receipt = writeSealed(outputPath, {
  version: "v592-major-moon-alternative-source-negative-evidence-v1",
  generatedAt: "2026-08-20T00:00:00Z",
  status: "three-target-alternative-metadata-lane-blocked-no-qualified-global-texture",
  targets: ["triton", "miranda", "titania"],
  sourceReceipts: receipts.map((entry) => ({
    probeId: entry.probeId,
    target: entry.target,
    receiptSha256: entry.receiptSha256,
    requestCount: entry.policy.requestCount,
    totalHits: entry.totalHits,
    matchedCandidateCount: entry.matchedCandidateCount,
    payloadDownloaded: entry.policy.payloadDownloaded,
  })),
  findings: [
    {
      target: "triton",
      status: "asset-blocked",
      reason: "alternative-query-zero-results-and-admitted-14k-source-has-non-equirectangular-unobserved-coverage",
      qualifiedGlobalTextureCount: 0,
    },
    {
      target: "miranda",
      status: "asset-blocked",
      reason: "two-official-results-are-south-polar-and-close-range-mosaics-not-global-equirectangular-textures",
      rejectedCandidateIds: mirandaIds,
      qualifiedGlobalTextureCount: 0,
    },
    {
      target: "titania",
      status: "asset-blocked",
      reason: "alternative-query-zero-results",
      qualifiedGlobalTextureCount: 0,
    },
  ],
  summary: {
    metadataRequestCount: receipts.reduce((sum, entry) => sum + entry.policy.requestCount, 0),
    metadataProbeCount: receipts.length,
    officialCandidateCount: receipts.reduce((sum, entry) => sum + entry.matchedCandidateCount, 0),
    qualifiedGlobalTextureCount: 0,
    visualPayloadDownloadedCount: 0,
    runtimeAssetAdmittedCount: 0,
    blockedTargetCount: 3,
  },
  policy: {
    metadataOnly: true,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    noSyntheticCoverageFill: true,
    noProceduralFallback: true,
    noThresholdRelaxation: true,
    scientificPayloadWriteback: false,
  },
});

console.log(JSON.stringify({
  status: receipt.status,
  metadataProbeCount: receipt.summary.metadataProbeCount,
  officialCandidateCount: receipt.summary.officialCandidateCount,
  qualifiedGlobalTextureCount: receipt.summary.qualifiedGlobalTextureCount,
  blockedTargets: receipt.targets,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
