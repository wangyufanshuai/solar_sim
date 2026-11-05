import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const ceresBlockedPath = resolve(root, "docs/release/v591/acquisition-blocked-ceres.json");
const ceresLedgerPath = resolve(root, "docs/release/v591/acquisition-url-ledger-ceres.json");
const venusZeroHitPath = resolve(root, "docs/release/v591/metadata-probe-venus-nasa-cloud.json");
const venusBroadBlockedPath = resolve(root, "docs/release/v591/metadata-probe-venus-nasa-cloud-broad-blocked.json");
const ceresDefinitionPath = resolve(root, "scripts/v591-ceres-visual-sources.json");
const ceresLabelAssetReceiptPath = resolve(root, "docs/release/v591/acquisition-assets-ceres/ceres-albedo-label-source-v591.json");

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
function readSealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v591-cycle13-reconcile-seal:${path}`);
  return document;
}
function writeSealed(path, unsigned) {
  const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, `${JSON.stringify(sealed, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
  return sealed;
}

const ceresBlocked = readSealed(ceresBlockedPath);
const ceresLedger = readSealed(ceresLedgerPath);
assert(ceresBlocked.status === "blocked-no-automatic-retry", "v591-cycle13-ceres-blocked-status");
assert(ceresLedger.entries?.length === 2, "v591-cycle13-ceres-ledger-entry-count");
assert(ceresLedger.entries.every((entry) => entry.httpStatus === 200 && entry.outcome === "response-received"), "v591-cycle13-ceres-ledger-headers");
assert(!existsSync(resolve(root, "source-cache/celestial-convergence-v591/ceres/Ceres_Dawn_FC_DLR_global_20ppd_Oct2015.tif")), "v591-cycle13-ceres-no-final-tiff");
assert(!existsSync(resolve(root, "source-cache/celestial-convergence-v591/ceres/Ceres_Dawn_FC_DLR_global_20ppd_Oct2015.tif.part")), "v591-cycle13-ceres-no-partial-tiff");

let correctedCeres;
if (ceresBlocked.version === "v591-ceres-visual-acquisition-blocked-v2") {
  assert(ceresBlocked.failureClass === "post-stream-partial-missing-cause-undetermined", "v591-cycle13-ceres-v2-failure-class");
  assert(ceresBlocked.claimsNotEstablished?.includes("transport-stalled"), "v591-cycle13-ceres-v2-claims");
  correctedCeres = ceresBlocked;
} else {
  assert(ceresBlocked.version === "v591-ceres-visual-acquisition-blocked-v1" && ceresBlocked.error?.startsWith("ENOENT:"), "v591-cycle13-ceres-original-cause");
  correctedCeres = writeSealed(ceresBlockedPath, {
  version: "v591-ceres-visual-acquisition-blocked-v2",
  failedAt: ceresBlocked.failedAt,
  reconciledAt: "2026-08-12T05:00:00.000Z",
  status: "blocked-no-automatic-retry",
  failureClass: "post-stream-partial-missing-cause-undetermined",
  metadataReceiptSha256: ceresBlocked.metadataReceiptSha256,
  urlLedgerReceiptSha256: ceresLedger.receiptSha256,
  requestedUrls: ceresBlocked.requestedUrls,
  establishedFacts: {
    responseHeadersReceivedForRequestedUrls: true,
    httpStatus: 200,
    expectedContentLengthReported: 27280830,
    finalPayloadCommitted: false,
    partialPayloadPresentAtReconciliation: false,
  },
  claimsNotEstablished: [
    "response-body-completed",
    "transport-stalled",
    "payload-byte-count-verified",
    "payload-sha256-verified",
    "payload-license-admitted",
  ],
  automaticRetryPerformed: false,
  automaticReplacementPerformed: false,
  presentationAdmission: "asset-blocked",
  error: "v591-ceres-acquisition-post-stream-partial-missing-cause-undetermined:ceres-albedo-source-v591",
  supersedesReceiptSha256: ceresBlocked.receiptSha256,
  });
}

const ceresDefinition = JSON.parse(readFileSync(ceresDefinitionPath, "utf8"));
assert(ceresDefinition.assets.every((asset) => asset.license?.id === "unverified-third-party-DLR-product" && asset.license?.admission === "blocked-pending-authoritative-product-license"), "v591-cycle13-ceres-dlr-license-boundary");
const ceresLabelAssetReceipt = readSealed(ceresLabelAssetReceiptPath);
if (ceresLabelAssetReceipt.asset?.license?.id !== "unverified-third-party-DLR-product") {
  const sourceLabelPath = resolve(root, ceresLabelAssetReceipt.asset.outputPath);
  const sourceLabel = readFileSync(sourceLabelPath, "utf8");
  assert(/ProducerInstitutionName\s*=\s*"German Aerospace Center \(DLR\)"/i.test(sourceLabel), "v591-cycle13-ceres-label-dlr-producer");
  const correctedLabelReceipt = { ...ceresLabelAssetReceipt };
  delete correctedLabelReceipt.receiptSha256;
  correctedLabelReceipt.version = "v591-ceres-visual-asset-acquisition-receipt-v2";
  correctedLabelReceipt.status = "committed-metadata-only-license-blocked";
  correctedLabelReceipt.asset = {
    ...correctedLabelReceipt.asset,
    license: {
      id: "unverified-third-party-DLR-product",
      url: null,
      admission: "blocked-pending-authoritative-product-license",
    },
    presentationAdmission: "blocked-license-unverified",
  };
  correctedLabelReceipt.reconciledAt = "2026-08-12T05:00:00.000Z";
  correctedLabelReceipt.supersedesReceiptSha256 = ceresLabelAssetReceipt.receiptSha256;
  writeSealed(ceresLabelAssetReceiptPath, correctedLabelReceipt);
} else {
  assert(ceresLabelAssetReceipt.status === "committed-metadata-only-license-blocked", "v591-cycle13-ceres-label-license-status");
}

const venusZeroHit = readSealed(venusZeroHitPath);
assert(venusZeroHit.totalHits === 0 && venusZeroHit.candidates?.length === 0, "v591-cycle13-venus-zero-hit");
let sealedVenusZeroHit;
if (venusZeroHit.cloudTextureAdmission === "not-admitted-zero-candidates") {
  sealedVenusZeroHit = venusZeroHit;
} else {
  const correctedVenusZeroHit = { ...venusZeroHit };
  delete correctedVenusZeroHit.receiptSha256;
  delete correctedVenusZeroHit.cloudTextureAdmission;
  correctedVenusZeroHit.cloudTextureAdmission = "not-admitted-zero-candidates";
  correctedVenusZeroHit.reconciledAt = "2026-08-12T05:00:00.000Z";
  correctedVenusZeroHit.supersedesReceiptSha256 = venusZeroHit.receiptSha256;
  sealedVenusZeroHit = writeSealed(venusZeroHitPath, correctedVenusZeroHit);
}

const venusBroadBlocked = readSealed(venusBroadBlockedPath);
let correctedVenusBroad;
if (venusBroadBlocked.version === "v591-nasa-images-metadata-probe-blocked-v2") {
  assert(venusBroadBlocked.failureClass === "local-manifest-host-validator-defect", "v591-cycle13-venus-broad-v2-failure-class");
  correctedVenusBroad = venusBroadBlocked;
} else {
  assert(venusBroadBlocked.error === "v591-nasa-images-metadata-url:images-assets.nasa.gov", "v591-cycle13-venus-broad-original-error");
  correctedVenusBroad = writeSealed(venusBroadBlockedPath, {
  version: "v591-nasa-images-metadata-probe-blocked-v2",
  probeId: venusBroadBlocked.probeId,
  failedAt: venusBroadBlocked.failedAt,
  reconciledAt: "2026-08-12T05:00:00.000Z",
  status: "blocked-local-validator-defect-no-automatic-retry",
  failureClass: "local-manifest-host-validator-defect",
  metadataUrl: venusBroadBlocked.metadataUrl,
  requestCount: venusBroadBlocked.requestCount,
  payloadDownloaded: false,
  metadataResponseRetained: false,
  candidatesVerified: false,
  allowedManifestHost: "images-assets.nasa.gov",
  automaticRetryPerformed: false,
  automaticReplacementPerformed: false,
  admission: "not-admitted-unverified-metadata-response",
  originalError: venusBroadBlocked.error,
  supersedesReceiptSha256: venusBroadBlocked.receiptSha256,
  });
}

console.log(JSON.stringify({
  status: "cycle13-negative-evidence-reconciled-without-network",
  networkRequestsPerformed: 0,
  ceresBlockedReceiptSha256: correctedCeres.receiptSha256,
  venusZeroHitReceiptSha256: sealedVenusZeroHit.receiptSha256,
  venusBroadBlockedReceiptSha256: correctedVenusBroad.receiptSha256,
}, null, 2));
