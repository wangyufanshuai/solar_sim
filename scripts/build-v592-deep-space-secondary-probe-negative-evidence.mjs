import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "docs/release/v592/deep-space-secondary-probe-negative-evidence-v592.json");
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

function verifySealed(relativePath) {
  const bytes = readFileSync(resolve(root, relativePath));
  const document = JSON.parse(bytes.toString("utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-deep-space-secondary-probe-seal:${relativePath}`);
  return { relativePath, fileSha256: sha256(bytes), document };
}

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}

const v4Ids = ["centaurus-a", "cigar-galaxy", "pinwheel-galaxy", "virgo-a-galaxy", "black-eye-galaxy", "sunflower-galaxy"];
const v5Ids = ["cigar-galaxy", "pinwheel-galaxy", "virgo-a-galaxy", "black-eye-galaxy", "sunflower-galaxy"];
const v4 = v4Ids.map((id) => verifySealed(`docs/release/v592/metadata-probe-deep-space-alternatives-v4/${id}.json`));
const v5 = v5Ids.map((id) => verifySealed(`docs/release/v592/metadata-probe-deep-space-alternatives-v5/${id}.json`));
for (const probe of [...v4, ...v5]) {
  assert(probe.document.status === "alternative-metadata-probe-complete-no-payload", `v592-deep-space-secondary-probe-status:${probe.relativePath}`);
  assert(probe.document.policy?.requestCount === 1, `v592-deep-space-secondary-probe-request:${probe.relativePath}`);
  assert(probe.document.policy?.automaticRetryPerformed === false, `v592-deep-space-secondary-probe-retry:${probe.relativePath}`);
  assert(probe.document.policy?.automaticReplacementPerformed === false, `v592-deep-space-secondary-probe-replacement:${probe.relativePath}`);
  assert(probe.document.policy?.payloadDownloaded === false, `v592-deep-space-secondary-probe-payload:${probe.relativePath}`);
  assert(probe.document.scientificPayloadWriteback === false, `v592-deep-space-secondary-probe-writeback:${probe.relativePath}`);
}

const centaurusSelectionIds = [
  "centaurus-a--GSFC_20171208_Archive_e002087",
  "centaurus-a--GSFC_20171208_Archive_e001893",
  "centaurus-a--GSFC_20171208_Archive_e000719",
];
const centaurusRows = centaurusSelectionIds.map((selectionId) => {
  const assetManifest = verifySealed(`docs/release/v592/metadata-probe-deep-space-alternative-assets/${selectionId}.json`);
  const metadataReceipt = verifySealed(`docs/release/v592/acquisition-receipt-deep-space-alternative-item-metadata/${selectionId}.json`);
  const metadataBytes = readFileSync(resolve(root, metadataReceipt.document.output.path));
  assert(metadataBytes.byteLength === metadataReceipt.document.output.bytes, `v592-deep-space-secondary-metadata-bytes:${selectionId}`);
  assert(sha256(metadataBytes) === metadataReceipt.document.output.sha256, `v592-deep-space-secondary-metadata-sha:${selectionId}`);
  const metadata = JSON.parse(metadataBytes.toString("utf8"));
  assert(assetManifest.document.selectionId === selectionId, `v592-deep-space-secondary-asset-identity:${selectionId}`);
  assert(metadataReceipt.document.selectionId === selectionId, `v592-deep-space-secondary-item-identity:${selectionId}`);
  assert(metadataReceipt.document.policy?.visualPayloadDownloaded === false, `v592-deep-space-secondary-item-payload:${selectionId}`);
  const description = String(metadata["AVAIL:Description"] ?? "");
  const reason = selectionId.endsWith("e002087")
    ? "blocked-infographic-third-party-capella-component-and-no-verified-source-dimensions"
    : selectionId.endsWith("e001893")
      ? "blocked-restricted-partner-esa-and-no-verified-source-dimensions"
      : "blocked-restricted-partner-esa-and-non-clean-target-frame";
  if (selectionId.endsWith("e002087")) assert(/inset|Capella Observatory/i.test(description), `v592-deep-space-secondary-capella:${selectionId}`);
  else assert(/ESA|European Space Agency/i.test(description), `v592-deep-space-secondary-esa:${selectionId}`);
  return {
    selectionId,
    target: "centaurus-a",
    nasaId: metadata["AVAIL:NASAID"],
    title: metadata["AVAIL:Title"],
    decision: reason,
    assetManifestReceiptSha256: assetManifest.document.receiptSha256,
    itemMetadataReceiptSha256: metadataReceipt.document.receiptSha256,
    itemMetadataSha256: metadataReceipt.document.output.sha256,
    visualPayloadDownloaded: false,
    runtimeAssetAdmitted: false,
  };
});

const v4ById = Object.fromEntries(v4.map((entry) => [entry.document.target, entry.document]));
const v5ById = Object.fromEntries(v5.map((entry) => [entry.document.target, entry.document]));
assert(v4ById["centaurus-a"].matchedCandidateCount === 6, "v592-deep-space-secondary-v4-centaurus-count");
assert(v4ById["cigar-galaxy"].matchedCandidateCount === 2, "v592-deep-space-secondary-v4-cigar-count");
assert(v4ById["pinwheel-galaxy"].matchedCandidateCount === 1, "v592-deep-space-secondary-v4-pinwheel-count");
assert(v4ById["virgo-a-galaxy"].matchedCandidateCount === 0, "v592-deep-space-secondary-v4-virgo-count");
assert(v4ById["black-eye-galaxy"].matchedCandidateCount === 0, "v592-deep-space-secondary-v4-black-eye-count");
assert(v4ById["sunflower-galaxy"].matchedCandidateCount === 0, "v592-deep-space-secondary-v4-sunflower-count");
assert(v4ById["pinwheel-galaxy"].candidates[0]?.nasaId === "GSFC_20171208_Archive_e000389", "v592-deep-space-secondary-v4-pinwheel-identity");
assert(/UGC 4459/i.test(v4ById["pinwheel-galaxy"].candidates[0]?.description ?? ""), "v592-deep-space-secondary-v4-pinwheel-wrong-target");
for (const id of v5Ids) assert(v5ById[id].matchedCandidateCount === 0, `v592-deep-space-secondary-v5-empty:${id}`);

const sourceProbeRows = [...v4, ...v5].map((entry) => ({
  path: entry.relativePath,
  fileSha256: entry.fileSha256,
  receiptSha256: entry.document.receiptSha256,
  phase: entry.document.version,
  target: entry.document.target,
  query: entry.document.query,
  matchedCandidateCount: entry.document.matchedCandidateCount,
  requestCount: 1,
  payloadDownloaded: false,
}));
const unsigned = {
  version: "v592-deep-space-secondary-probe-negative-evidence-v1",
  generatedAt: "2026-08-19T00:00:00Z",
  status: "eleven-metadata-probes-three-centaurus-items-zero-runtime-admissions",
  policy: {
    metadataOnly: true,
    singleRequestPerUrl: true,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    noLicenseThresholdRelaxation: true,
    noIdentityThresholdRelaxation: true,
    noAnnotationRemoval: true,
    visualPayloadDownloaded: false,
    runtimeAssetAdmitted: false,
    scienceImagePayload: false,
    scientificPayloadWriteback: false,
  },
  summary: {
    metadataProbeCount: sourceProbeRows.length,
    itemMetadataAcquisitionCount: centaurusRows.length,
    visualPayloadDownloadedCount: 0,
    runtimeAssetAdmittedCount: 0,
    terminalIdentityConflictCount: 2,
    terminalRestrictedOrThirdPartyCount: 3,
    zeroHitProbeCount: sourceProbeRows.filter((entry) => entry.matchedCandidateCount === 0).length,
  },
  probes: sourceProbeRows,
  reviewedCentaurusItems: centaurusRows,
  explicitNegativeDecisions: [
    {
      target: "pinwheel-galaxy",
      nasaId: "GSFC_20171208_Archive_e000389",
      decision: "blocked-target-identity-conflict-ugc-4459-not-m101",
    },
    {
      target: "cigar-galaxy",
      nasaId: "GSFC_20171208_Archive_e001783",
      decision: "blocked-target-identity-conflict-eta-carinae-not-m82",
    },
  ],
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(outputPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));
console.log(JSON.stringify({ status: receipt.status, summary: receipt.summary, receiptSha256: receipt.receiptSha256 }, null, 2));
