import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V592_GENERATED_AT ?? "2026-08-15T00:00:00Z";
const docsRoot = resolve(root, "docs/release/v592");
const manifestPath = resolve(root, "public/data/living-universe-v592/manifest.json");
const generatedConstantsPath = resolve(root, "app/data/livingUniverseManifestV592.generated.ts");
const pointerPath = resolve(root, "dist/release/orbit-atlas-current-living-universe-candidate-v592.json");
const freezeBeforePath = resolve(docsRoot, "freeze-before-v592.json");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function atomicWrite(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.part`;
  writeFileSync(temporary, text);
  rmSync(path, { force: true });
  renameSync(temporary, path);
}
function writeSealed(path, unsigned, field) {
  const sealed = { ...unsigned, [field]: canonicalSha(unsigned) };
  atomicWrite(path, `${JSON.stringify(sealed, null, 2)}\n`);
  return sealed;
}
function readJson(path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}
function verifySealed(path, field) {
  const document = readJson(path);
  const unsigned = { ...document };
  delete unsigned[field];
  if (canonicalSha(unsigned) !== document[field]) throw new Error(`v592-baseline-seal:${path}`);
  return document;
}
function normalizePath(path) {
  return path.split(sep).join("/");
}
function walkFiles(relativeDirectory) {
  const absolute = resolve(root, relativeDirectory);
  if (!existsSync(absolute)) return [];
  const result = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) result.push(normalizePath(relative(root, path)));
    }
  };
  visit(absolute);
  return result;
}
function fileRecord(path, expectedSha256 = null) {
  const absolute = resolve(root, path);
  if (!existsSync(absolute)) return {
    path,
    exists: false,
    bytes: 0,
    sha256: null,
    expectedSha256,
    status: expectedSha256 === null ? "matched-missing" : "missing",
  };
  const bytes = readFileSync(absolute);
  const observed = sha256(bytes);
  return {
    path,
    exists: true,
    bytes: bytes.byteLength,
    sha256: observed,
    expectedSha256,
    status: expectedSha256 === null || observed === expectedSha256 ? "matched" : "drift",
  };
}

const v591Manifest = verifySealed("public/data/celestial-convergence-v591/manifest.json", "manifestSha256");
const v591SourceManifest = verifySealed("docs/release/v591/source-manifest-v591.json", "receiptSha256");
const v591FreezeAfter = verifySealed("docs/release/v591/freeze-after-v591.json", "snapshotSha256");
const v591Verification = verifySealed("docs/release/v591/verification-receipt-v591.json", "receiptSha256");
const v591Capability = verifySealed("docs/release/v591/capability-report-v591.json", "reportSha256");
const v591Signoff = verifySealed("docs/release/v591/human-visual-signoff-v591.json", "receiptSha256");
const rotationPacket = verifySealed("public/data/living-universe-v592/rotation-reference.json", "packetSha256");
const rotationReceipt = verifySealed("docs/release/v592/rotation-reference-receipt-v592.json", "receiptSha256");
const acquisitionReceipt = verifySealed("docs/release/v592/acquisition-receipt-rotation-sources-v592.json", "receiptSha256");
const smallBodyRotationMetadataReceipt = verifySealed("docs/release/v592/acquisition-receipt-small-body-rotation-metadata-v592.json", "receiptSha256");
const orxBennuPckProbe = verifySealed("docs/release/v592/metadata-probe-orx-bennu-pck-directory-blocked-v592.json", "receiptSha256");
if (
  orxBennuPckProbe.version !== "v592-orx-bennu-pck-directory-metadata-probe-blocked-v1"
  || orxBennuPckProbe.status !== "blocked-no-automatic-retry"
  || orxBennuPckProbe.target !== "bennu"
  || orxBennuPckProbe.url !== "https://naif.jpl.nasa.gov/pub/naif/ORX/kernels/pck/"
  || orxBennuPckProbe.requestCount !== 1
  || orxBennuPckProbe.automaticRetryPerformed !== false
  || orxBennuPckProbe.automaticReplacementPerformed !== false
  || orxBennuPckProbe.payloadDownloaded !== false
  || orxBennuPckProbe.scientificPayloadWriteback !== false
) throw new Error("v592-orx-bennu-pck-negative-evidence-contract");
const stellarHeroPacket = verifySealed("public/data/living-universe-v592/stellar-heroes.json", "packetSha256");
const stellarHeroReceipt = verifySealed("docs/release/v592/stellar-hero-catalog-receipt-v592.json", "receiptSha256");
const stellarBrowserReceipt = verifySealed("docs/release/v592/stellar-browser-matrix-receipt-v592.json", "receiptSha256");
const constellationPacket = verifySealed("public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json", "packetSha256");
const gaiaSupplementReceipt = verifySealed("docs/release/v592/gaia-stratified-supplement-receipt-v592.json", "receiptSha256");
const gaiaConstellationBrowserReceipt = verifySealed("docs/release/v592/gaia-constellation-browser-matrix-receipt-v592.json", "receiptSha256");
const constellationArtReferenceReceipt = verifySealed("docs/release/v592/constellation-art-reference-receipt-v592.json", "receiptSha256");
const constellationArtBrowserReceipt = verifySealed("docs/release/v592/constellation-art-browser-matrix-receipt-v592.json", "receiptSha256");
const browserUrlPolicyEvidence = verifySealed("docs/release/v592/browser-url-policy-negative-evidence-v592.json", "receiptSha256");
const nebulaAssetMetadataAdmission = verifySealed("docs/release/v592/nebula-asset-metadata-admission-v592.json", "receiptSha256");
const nebulaItemMetadataAcquisition = verifySealed("docs/release/v592/acquisition-receipt-nebula-item-metadata-v592.json", "receiptSha256");
const nebulaLicenseReview = verifySealed("docs/release/v592/nebula-item-license-review-v592.json", "receiptSha256");
const nebulaVisualSourceAcquisition = verifySealed("docs/release/v592/acquisition-receipt-nebula-visual-sources-v592.json", "receiptSha256");
const nebulaVisualAnalysis = verifySealed("docs/release/v592/nebula-source-visual-analysis-v592.json", "receiptSha256");
const nebulaVisualAssets = verifySealed("public/data/living-universe-v592/nebula-visual-assets.json", "manifestSha256");
const nebulaVisualAssetsReceipt = verifySealed("docs/release/v592/nebula-visual-assets-receipt-v592.json", "receiptSha256");
const nebulaBroadMetadataReceipts = [
  verifySealed("docs/release/v592/metadata-probe-nebula-broad-v592.json", "receiptSha256"),
  verifySealed("docs/release/v592/metadata-probe-nebula-broad-page2-v592.json", "receiptSha256"),
  verifySealed("docs/release/v592/metadata-probe-nebula-broad-page3-v592.json", "receiptSha256"),
];
const nebulaExtendedMetadata = verifySealed("docs/release/v592/nebula-extended-item-metadata-v592.json", "receiptSha256");
const nebulaExtendedAcquisition = verifySealed("docs/release/v592/nebula-extended-visual-acquisition-v592.json", "receiptSha256");
const nebulaFinalMetadata = verifySealed("docs/release/v592/nebula-final-item-metadata-v592.json", "receiptSha256");
const nebulaFinalAcquisition = verifySealed("docs/release/v592/nebula-final-visual-acquisition-v592.json", "receiptSha256");
const nebulaClosureMetadata = verifySealed("docs/release/v592/nebula-closure-item-metadata-v592.json", "receiptSha256");
const nebulaClosureAcquisition = verifySealed("docs/release/v592/nebula-closure-visual-acquisition-v592.json", "receiptSha256");
const nebulaClosure2Metadata = verifySealed("docs/release/v592/nebula-closure2-item-metadata-v592.json", "receiptSha256");
const nebulaClosure2Acquisition = verifySealed("docs/release/v592/nebula-closure2-visual-acquisition-v592.json", "receiptSha256");
const nebulaExtendedVisualAssets = verifySealed("public/data/living-universe-v592/nebula-extended-visual-assets.json", "manifestSha256");
const nebulaExtendedVisualAssetsReceipt = verifySealed("docs/release/v592/nebula-extended-visual-assets-receipt-v592.json", "receiptSha256");
const nebulaClosureVisualAssets = verifySealed("public/data/living-universe-v592/nebula-closure-visual-assets.json", "manifestSha256");
const nebulaClosureVisualAssetsReceipt = verifySealed("docs/release/v592/nebula-closure-visual-assets-receipt-v592.json", "receiptSha256");
const nebulaOverlayBrowserReceipt = verifySealed("docs/release/v592/nebula-overlay-browser-matrix-receipt-v592.json", "receiptSha256");
const nebulaBrowserReceipt = verifySealed("docs/release/v592/nebula-browser-matrix-receipt-v592.json", "receiptSha256");
const majorMoonPacket = verifySealed("public/data/living-universe-v592/major-moons-reference.json", "packetSha256");
const majorMoonReceipt = verifySealed("docs/release/v592/major-moons-reference-receipt-v592.json", "receiptSha256");
const majorMoonAssetMetadataAdmission = verifySealed("docs/release/v592/major-moon-asset-metadata-admission-v592.json", "receiptSha256");
const majorMoonItemMetadataReceipt = verifySealed("docs/release/v592/acquisition-receipt-major-moon-item-metadata-v592.json", "receiptSha256");
const majorMoonLicenseReview = verifySealed("docs/release/v592/major-moon-item-license-review-v592.json", "receiptSha256");
const majorMoonVisualSourceAcquisition = verifySealed("docs/release/v592/acquisition-receipt-major-moon-visual-sources-v592.json", "receiptSha256");
const majorMoonVisualAnalysis = verifySealed("docs/release/v592/major-moon-source-visual-analysis-v592.json", "receiptSha256");
const majorMoonOfficialCollectionMetadata = verifySealed("docs/release/v592/metadata-probe-major-moon-official-collections-v592.json", "receiptSha256");
const majorMoonSecondaryProductMetadata = verifySealed("docs/release/v592/metadata-probe-major-moon-secondary-products-v592.json", "receiptSha256");
const majorMoonOfficialPreviewAcquisition = verifySealed("docs/release/v592/acquisition-receipt-major-moon-official-preview-assets-v592.json", "receiptSha256");
const majorMoonVisualAssets = verifySealed("public/data/living-universe-v592/major-moon-visual-assets.json", "manifestSha256");
const majorMoonVisualAssetsReceipt = verifySealed("docs/release/v592/major-moon-visual-assets-receipt-v592.json", "receiptSha256");
const majorMoonBrowserReceipt = verifySealed("docs/release/v592/major-moon-browser-matrix-receipt-v592.json", "receiptSha256");
const majorMoonSecondaryVisualEvidence = verifySealed("docs/release/v592/major-moon-secondary-visual-evidence-v592.json", "receiptSha256");
const majorMoonUsGsFinalAcquisition = verifySealed("docs/release/v592/acquisition-receipt-major-moon-usgs-final-visual-sources-v592.json", "receiptSha256");
const majorMoonUsGsFinalAnalysis = verifySealed("docs/release/v592/major-moon-usgs-final-source-visual-analysis-v592.json", "receiptSha256");
const majorMoonAlternativeNegativeEvidence = verifySealed("docs/release/v592/major-moon-alternative-source-negative-evidence-v592.json", "receiptSha256");
const majorMoonNasa3dAcquisition = verifySealed("docs/release/v592/acquisition-receipt-major-moon-nasa3d-textures-v592.json", "receiptSha256");
const majorMoonNasa3dAnalysis = verifySealed("docs/release/v592/major-moon-nasa3d-visual-analysis-v592.json", "receiptSha256");
const majorMoonNasa3dNegativeEvidence = verifySealed("docs/release/v592/major-moon-nasa3d-negative-evidence-v592.json", "receiptSha256");
const liveBrowserReceipt = verifySealed("docs/release/v592/browser-live-matrix-receipt-v592.json", "receiptSha256");
const browserSoakResourceReceipt = verifySealed("docs/release/v592/browser-soak-resource-receipt-v592.json", "receiptSha256");
const browserSoakTelemetryAvailable = browserSoakResourceReceipt.admission.jsHeapTelemetryAvailable === true;
const browserSoakHeapQualified = browserSoakTelemetryAvailable
  && browserSoakResourceReceipt.admission.jsHeapGrowthGatePassed === true
  && browserSoakResourceReceipt.admission.fullMemoryGatePassed === true;
const browserSoakExpectedStatus = browserSoakHeapQualified
  ? "completed-30-minute-visible-soak-renderer-stable-js-heap-telemetry-qualified"
  : browserSoakTelemetryAvailable
    ? "completed-30-minute-visible-soak-renderer-stable-js-heap-telemetry-available"
    : "completed-30-minute-visible-soak-renderer-stable-js-heap-telemetry-unavailable";
const deepSpaceReference = verifySealed("public/data/living-universe-v592/deep-space-reference.json", "packetSha256");
const deepSpaceReferenceReceipt = verifySealed("docs/release/v592/deep-space-reference-receipt-v592.json", "receiptSha256");
const deepSpaceItemMetadataAcquisition = verifySealed("docs/release/v592/acquisition-receipt-deep-space-item-metadata-v592.json", "receiptSha256");
const deepSpaceLicenseReview = verifySealed("docs/release/v592/deep-space-item-license-review-v592.json", "receiptSha256");
const deepSpaceVisualSourceAcquisition = verifySealed("docs/release/v592/acquisition-receipt-deep-space-visual-sources-v592.json", "receiptSha256");
const deepSpaceVisualAnalysis = verifySealed("docs/release/v592/deep-space-source-visual-analysis-v592.json", "receiptSha256");
const deepSpaceAlternativeLicenseReview = verifySealed("docs/release/v592/deep-space-alternative-item-license-review-v592.json", "receiptSha256");
const deepSpaceAlternativeContactSheetReceipt = verifySealed("docs/release/v592/deep-space-alternative-contact-sheet-receipt-v592.json", "receiptSha256");
const deepSpaceAlternativeVisualAnalysis = verifySealed("docs/release/v592/deep-space-alternative-source-visual-analysis-v592.json", "receiptSha256");
const deepSpaceVisualAssets = verifySealed("public/data/living-universe-v592/deep-space-visual-assets.json", "manifestSha256");
const deepSpaceVisualAssetsReceipt = verifySealed("docs/release/v592/deep-space-visual-assets-receipt-v592.json", "receiptSha256");
const deepSpaceSecondaryProbeNegativeEvidence = verifySealed("docs/release/v592/deep-space-secondary-probe-negative-evidence-v592.json", "receiptSha256");
const deepSpaceClusterAlternativeNegativeEvidence = verifySealed("docs/release/v592/deep-space-cluster-alternative-negative-evidence-v592.json", "receiptSha256");
const deepSpaceBrowserReceipt = verifySealed("docs/release/v592/deep-space-browser-matrix-receipt-v592.json", "receiptSha256");
const deepSpaceBrowserCaptureBytes = readFileSync(resolve(root, "docs/release/v592/deep-space-browser-capture-v592.json"));
const deepSpaceBrowserCapture = JSON.parse(deepSpaceBrowserCaptureBytes.toString("utf8"));
const deepSpaceAnalyticBrowserReceipt = verifySealed("docs/release/v592/deep-space-analytic-browser-matrix-receipt-v592.json", "receiptSha256");
const deepSpaceAnalyticBrowserCaptureBytes = readFileSync(resolve(root, "docs/release/v592/deep-space-analytic-browser-capture-v592.json"));
const deepSpaceAnalyticBrowserCapture = JSON.parse(deepSpaceAnalyticBrowserCaptureBytes.toString("utf8"));
const gaiaPresentationManifest = readJson("public/data/gaia-dr3-presentation-10000000-v9/manifest.json");
const gaiaPresentationManifestFile = fileRecord("public/data/gaia-dr3-presentation-10000000-v9/manifest.json", "c5b8ed92ae72e404ab8c1a9a6be71a214869d8a2de6ee948dfcc276d7199b371");
const gaiaPresentationArchive = fileRecord("public/data/gaia-dr3-presentation-10000000-v9/catalog-v9.bin", gaiaPresentationManifest.archive.sha256);
const openNgcPresentationManifest = readJson("public/data/openngc-v260/manifest.json");
const openNgcPresentationManifestFile = fileRecord("public/data/openngc-v260/manifest.json", null);
const openNgcPresentationArchive = fileRecord("public/data/openngc-v260/openngc-v260.json.gz", openNgcPresentationManifest.output.sha256);
const openNgcPresentationLicense = fileRecord("public/data/openngc-v260/CC-BY-SA-4.0.txt", openNgcPresentationManifest.license.sha256);
const gaiaLitePath = stellarHeroPacket.source.gaiaLitePath;
const gaiaLiteExpectedSha256 = "a312297456bac7190c7a347d281cea12681ad2bbc6c2458434fb882cf61aa802";
const gaiaLite = fileRecord(gaiaLitePath, gaiaLiteExpectedSha256);
const gaiaSupplement = fileRecord(gaiaSupplementReceipt.output.path, gaiaSupplementReceipt.output.sha256);

if (
  stellarBrowserReceipt.status !== "passed-24-of-24-two-mode-browser-matrix"
  || stellarBrowserReceipt.admission.stellarHeroCount !== 24
  || stellarBrowserReceipt.frames.length !== 48
  || stellarBrowserReceipt.admission.singleCanvas !== true
  || stellarBrowserReceipt.admission.scienceCinematicPayloadStable !== true
  || stellarBrowserReceipt.admission.scientificPayloadWriteback !== false
  || stellarBrowserReceipt.admission.consolePageWebglErrorCount !== 0
  || stellarBrowserReceipt.source.stellarPacketSha256 !== stellarHeroPacket.packetSha256
) throw new Error("v592-stellar-browser-matrix-baseline");
if (
  gaiaLite.status !== "matched"
  || gaiaLite.bytes !== 1_104_000
  || constellationPacket.bindings.length !== 88
  || constellationPacket.bindings.reduce((sum, binding) => sum + binding.waypoints.length, 0) !== 484
  || constellationPacket.metrics.maximumAngularDistanceDeg > 1.5
  || gaiaSupplementReceipt.status !== "generated-14000-stratified-no-lite-overlap"
  || gaiaSupplementReceipt.output.recordCount !== 14_000
  || gaiaSupplementReceipt.exclusion.overlapCount !== 0
  || gaiaSupplement.status !== "matched"
  || gaiaConstellationBrowserReceipt.status !== "passed-gaia-60000-and-constellations-88-of-88-browser-matrix"
  || gaiaConstellationBrowserReceipt.admission.gaiaFullDesktopRecordCount !== 60_000
  || gaiaConstellationBrowserReceipt.admission.gaiaFullMobileRecordCount !== 18_000
  || gaiaConstellationBrowserReceipt.admission.retainedAnchorCount !== 420
  || gaiaConstellationBrowserReceipt.admission.constellationCount !== 88
  || gaiaConstellationBrowserReceipt.admission.waypointCount !== 484
  || gaiaConstellationBrowserReceipt.admission.frameCount !== 13
  || gaiaConstellationBrowserReceipt.admission.singleCanvas !== true
  || gaiaConstellationBrowserReceipt.admission.scienceCinematicPayloadStable !== true
  || gaiaConstellationBrowserReceipt.admission.scientificPayloadWriteback !== false
  || gaiaConstellationBrowserReceipt.admission.scientificCoordinateMutation !== false
  || gaiaConstellationBrowserReceipt.admission.consolePageWebglErrorCount !== 0
  || browserUrlPolicyEvidence.status !== "blocked-browser-url-policy-manual-open-required"
  || browserUrlPolicyEvidence.policyCompliance.automaticRetryPerformed !== false
  || browserUrlPolicyEvidence.policyCompliance.alternateBrowserUsed !== false
) throw new Error("v592-gaia-constellation-baseline");
if (
  constellationArtReferenceReceipt.status !== "admitted-88-of-88-data-derived-observatory-engravings"
  || constellationArtReferenceReceipt.admission.requiredCount !== 88
  || constellationArtReferenceReceipt.admission.admittedCount !== 88
  || constellationArtReferenceReceipt.admission.uniqueSignatureCount !== 88
  || constellationArtReferenceReceipt.admission.externalIllustrationAssetCount !== 0
  || constellationArtReferenceReceipt.admission.proceduralFallbackAllowed !== false
  || constellationArtReferenceReceipt.admission.observationImageClaimed !== false
  || constellationArtReferenceReceipt.admission.scientificPayloadWriteback !== false
  || constellationArtBrowserReceipt.status !== "passed-88-of-88-data-derived-art-three-focus-browser-matrix"
  || constellationArtBrowserReceipt.admission.artAdmittedCount !== 88
  || constellationArtBrowserReceipt.admission.frameCount !== 9
  || constellationArtBrowserReceipt.admission.scienceArtLayerDisabled !== true
  || constellationArtBrowserReceipt.admission.singleCanvas !== true
  || constellationArtBrowserReceipt.admission.scienceCinematicPayloadStable !== true
  || constellationArtBrowserReceipt.admission.scientificPayloadWriteback !== false
  || constellationArtBrowserReceipt.admission.consolePageWebglErrorOrWarningCount !== 0
) throw new Error("v592-constellation-art-baseline");
if (
  deepSpaceReference.status !== "reference-24-of-24-visual-metadata-partial"
  || deepSpaceReference.coordinateFrame !== "ICRS/J2000"
  || deepSpaceReference.admission.requiredGalaxyCount !== 12
  || deepSpaceReference.admission.admittedGalaxyReferenceCount !== 12
  || deepSpaceReference.admission.requiredClusterCount !== 12
  || deepSpaceReference.admission.admittedClusterReferenceCount !== 12
  || deepSpaceReference.admission.visualMetadataCandidateCount !== 18
  || deepSpaceReference.admission.visualMetadataBlockedCount !== 6
  || deepSpaceReference.admission.visualAssetAdmittedCount !== 0
  || deepSpaceReference.objects.length !== 24
  || new Set(deepSpaceReference.objects.map((entry) => entry.id)).size !== 24
  || deepSpaceReference.objects.some((entry) => entry.coordinateFrame !== "ICRS/J2000" || entry.presentationOnly !== true || entry.scientificAuthority !== false || entry.scientificPayloadWriteback !== false || entry.visualMetadata.payloadDownloaded !== false || entry.visualMetadata.visualAssetAdmitted !== false)
  || deepSpaceReference.policy.payloadDownloadPerformed !== false
  || deepSpaceReference.policy.scientificPayloadWriteback !== false
  || deepSpaceReferenceReceipt.status !== "admitted-12-galaxy-and-12-cluster-reference-packets"
  || deepSpaceReferenceReceipt.packetSha256 !== deepSpaceReference.packetSha256
  || deepSpaceReferenceReceipt.admission.admittedGalaxyReferenceCount !== 12
  || deepSpaceReferenceReceipt.admission.admittedClusterReferenceCount !== 12
  || deepSpaceReferenceReceipt.scientificPayloadWriteback !== false
) throw new Error("v592-deep-space-reference-baseline");
if (
  deepSpaceItemMetadataAcquisition.status !== "committed-eighteen-metadata-files-single-request-each-no-retry"
  || deepSpaceItemMetadataAcquisition.requestCount !== 18
  || deepSpaceItemMetadataAcquisition.requestCountPerUrl !== 1
  || deepSpaceItemMetadataAcquisition.assets.length !== 18
  || deepSpaceItemMetadataAcquisition.failures.length !== 0
  || deepSpaceItemMetadataAcquisition.policy.visualPayloadDownloaded !== false
  || deepSpaceItemMetadataAcquisition.policy.automaticRetryPerformed !== false
  || deepSpaceItemMetadataAcquisition.policy.automaticReplacementPerformed !== false
  || deepSpaceLicenseReview.status !== "5-visual-source-acquisitions-eligible-13-license-identity-or-suitability-blocked"
  || deepSpaceLicenseReview.sourceReceiptSha256 !== deepSpaceItemMetadataAcquisition.receiptSha256
  || deepSpaceLicenseReview.summary.reviewedCount !== 18
  || deepSpaceLicenseReview.summary.eligibleForAcquisitionCount !== 5
  || deepSpaceLicenseReview.summary.blockedCount !== 13
  || deepSpaceLicenseReview.policy.visualAssetAdmissionGranted !== false
  || deepSpaceVisualSourceAcquisition.status !== "committed-five-visual-sources-single-request-each-no-retry"
  || deepSpaceVisualSourceAcquisition.sourceReviewReceiptSha256 !== deepSpaceLicenseReview.receiptSha256
  || deepSpaceVisualSourceAcquisition.requestCount !== 5
  || deepSpaceVisualSourceAcquisition.requestCountPerUrl !== 1
  || deepSpaceVisualSourceAcquisition.assets.length !== 5
  || deepSpaceVisualSourceAcquisition.failures.length !== 0
  || deepSpaceVisualSourceAcquisition.policy.automaticRetryPerformed !== false
  || deepSpaceVisualSourceAcquisition.policy.automaticReplacementPerformed !== false
  || deepSpaceVisualAnalysis.status !== "three-runtime-derivation-candidates-two-infographic-sources-blocked"
  || deepSpaceVisualAnalysis.sourceAcquisitionReceiptSha256 !== deepSpaceVisualSourceAcquisition.receiptSha256
  || deepSpaceVisualAnalysis.licenseReviewReceiptSha256 !== deepSpaceLicenseReview.receiptSha256
  || deepSpaceVisualAnalysis.summary.analyzedCount !== 5
  || deepSpaceVisualAnalysis.summary.runtimeDerivationCandidateCount !== 3
  || deepSpaceVisualAnalysis.summary.infographicBlockedCount !== 2
  || deepSpaceVisualAnalysis.derivableTargets.join(",") !== "andromeda-galaxy,triangulum-galaxy,omega-centauri"
  || deepSpaceVisualAnalysis.blockedTargets.join(",") !== "cigar-galaxy,virgo-a-galaxy"
  || deepSpaceVisualAnalysis.policy.noInpainting !== true
  || deepSpaceVisualAnalysis.policy.noAnnotationRemoval !== true
  || deepSpaceAlternativeLicenseReview.status !== "9-alternative-visual-sources-eligible-12-blocked"
  || deepSpaceAlternativeLicenseReview.summary.reviewedCount !== 21
  || deepSpaceAlternativeLicenseReview.summary.eligibleForAcquisitionCount !== 9
  || deepSpaceAlternativeLicenseReview.summary.eligibleUniqueTargetCount !== 6
  || deepSpaceAlternativeLicenseReview.summary.blockedCount !== 12
  || deepSpaceAlternativeLicenseReview.policy.automaticRetryAllowed !== false
  || deepSpaceAlternativeLicenseReview.policy.automaticReplacementAllowed !== false
  || deepSpaceAlternativeContactSheetReceipt.status !== "contact-sheet-generated-manual-visual-analysis-required"
  || deepSpaceAlternativeContactSheetReceipt.entries.length !== 9
  || deepSpaceAlternativeContactSheetReceipt.policy.runtimeAssetAdmissionGranted !== false
  || deepSpaceAlternativeContactSheetReceipt.policy.noAnnotationRemoval !== true
  || deepSpaceAlternativeVisualAnalysis.status !== "five-runtime-derivation-candidates-three-clean-redundant-alternates-held-one-scientific-overlay-blocked"
  || deepSpaceAlternativeVisualAnalysis.licenseReviewReceiptSha256 !== deepSpaceAlternativeLicenseReview.receiptSha256
  || deepSpaceAlternativeVisualAnalysis.contactSheetReceiptSha256 !== deepSpaceAlternativeContactSheetReceipt.receiptSha256
  || deepSpaceAlternativeVisualAnalysis.summary.analyzedCount !== 9
  || deepSpaceAlternativeVisualAnalysis.summary.runtimeDerivationCandidateCount !== 5
  || deepSpaceAlternativeVisualAnalysis.summary.cleanRedundantAlternateHeldCount !== 3
  || deepSpaceAlternativeVisualAnalysis.summary.scientificOverlayBlockedCount !== 1
  || deepSpaceAlternativeVisualAnalysis.derivableTargets.join(",") !== "sombrero-galaxy,whirlpool-galaxy,bodes-galaxy,southern-pinwheel-galaxy,pleiades"
  || deepSpaceAlternativeVisualAnalysis.policy.oneRuntimeRepresentationPerTarget !== true
  || deepSpaceAlternativeVisualAnalysis.policy.noInpainting !== true
  || deepSpaceAlternativeVisualAnalysis.policy.noAnnotationRemoval !== true
  || deepSpaceVisualAssets.status !== "24-of-24-deep-space-visual-models-admitted"
  || deepSpaceVisualAssets.admission.requiredGalaxyCount !== 12
  || deepSpaceVisualAssets.admission.admittedGalaxyAssetCount !== 12
  || deepSpaceVisualAssets.admission.requiredClusterCount !== 12
  || deepSpaceVisualAssets.admission.admittedClusterAssetCount !== 12
  || deepSpaceVisualAssets.admission.totalAssetAdmittedCount !== 24
  || deepSpaceVisualAssets.admission.blockedCount !== 0
  || deepSpaceVisualAssets.assets.length !== 24
  || deepSpaceVisualAssets.sourceReceipts.referencePacketSha256 !== deepSpaceReference.packetSha256
  || deepSpaceVisualAssets.sourceReceipts.acquisitionReceiptSha256 !== deepSpaceVisualSourceAcquisition.receiptSha256
  || deepSpaceVisualAssets.sourceReceipts.licenseReviewReceiptSha256 !== deepSpaceLicenseReview.receiptSha256
  || deepSpaceVisualAssets.sourceReceipts.visualAnalysisReceiptSha256 !== deepSpaceVisualAnalysis.receiptSha256
  || deepSpaceVisualAssets.sourceReceipts.alternativeLicenseReviewReceiptSha256 !== deepSpaceAlternativeLicenseReview.receiptSha256
  || deepSpaceVisualAssets.sourceReceipts.alternativeVisualAnalysisReceiptSha256 !== deepSpaceAlternativeVisualAnalysis.receiptSha256
  || deepSpaceVisualAssets.sourceReceipts.alternativeContactSheetReceiptSha256 !== deepSpaceAlternativeContactSheetReceipt.receiptSha256
  || deepSpaceVisualAssets.sourceReceipts.gaiaCatalogManifestSha256 !== gaiaPresentationManifest.manifestSha256
  || deepSpaceVisualAssets.sourceReceipts.openNgcCatalogArchiveSha256 !== openNgcPresentationManifest.output.sha256
  || deepSpaceVisualAssets.sourceReceipts.openNgcCatalogLicenseSha256 !== openNgcPresentationManifest.license.sha256
  || deepSpaceVisualAssets.policy.scienceModeMarkerOnly !== true
  || deepSpaceVisualAssets.policy.onlyFocusedCinematicObjectLoadsImage !== true
  || deepSpaceVisualAssets.policy.scientificPayloadWriteback !== false
  || deepSpaceVisualAssetsReceipt.status !== "committed-twenty-four-deep-space-visual-models-twelve-galaxies-twelve-clusters"
  || deepSpaceVisualAssetsReceipt.manifestSha256 !== deepSpaceVisualAssets.manifestSha256
  || deepSpaceVisualAssetsReceipt.sourceAcquisitionReceiptSha256 !== deepSpaceVisualSourceAcquisition.receiptSha256
  || deepSpaceVisualAssetsReceipt.licenseReviewReceiptSha256 !== deepSpaceLicenseReview.receiptSha256
  || deepSpaceVisualAssetsReceipt.visualAnalysisReceiptSha256 !== deepSpaceVisualAnalysis.receiptSha256
  || deepSpaceVisualAssetsReceipt.referencePacketSha256 !== deepSpaceReference.packetSha256
  || deepSpaceVisualAssetsReceipt.alternativeLicenseReviewReceiptSha256 !== deepSpaceAlternativeLicenseReview.receiptSha256
  || deepSpaceVisualAssetsReceipt.alternativeVisualAnalysisReceiptSha256 !== deepSpaceAlternativeVisualAnalysis.receiptSha256
  || deepSpaceVisualAssetsReceipt.alternativeContactSheetReceiptSha256 !== deepSpaceAlternativeContactSheetReceipt.receiptSha256
  || deepSpaceVisualAssetsReceipt.gaiaCatalogManifestSha256 !== gaiaPresentationManifest.manifestSha256
  || deepSpaceVisualAssetsReceipt.gaiaCatalogArchiveSha256 !== gaiaPresentationManifest.archive.sha256
  || deepSpaceVisualAssetsReceipt.openNgcCatalogArchiveSha256 !== openNgcPresentationManifest.output.sha256
  || deepSpaceVisualAssetsReceipt.openNgcCatalogLicenseSha256 !== openNgcPresentationManifest.license.sha256
  || openNgcPresentationManifestFile.status !== "matched"
  || openNgcPresentationArchive.status !== "matched"
  || openNgcPresentationLicense.status !== "matched"
  || deepSpaceVisualAssetsReceipt.assetCount !== 24
  || deepSpaceVisualAssetsReceipt.ktx2FileCount !== 88
  || deepSpaceVisualAssetsReceipt.webpFileCount !== 106
  || deepSpaceVisualAssetsReceipt.fullRuntimeBytes !== 87_384_877
  || deepSpaceVisualAssetsReceipt.liteIncrementBytes !== 83_064
  || deepSpaceVisualAssetsReceipt.gaiaCatalogDerivedVisualModelCount !== 10
  || deepSpaceVisualAssetsReceipt.gaiaCatalogPayloadReusedFromExistingAdmission !== true
  || gaiaPresentationManifestFile.status !== "matched"
  || gaiaPresentationArchive.status !== "matched"
  || gaiaPresentationArchive.bytes !== 240_000_000
  || deepSpaceVisualAssetsReceipt.scienceImagePayload !== false
  || deepSpaceVisualAssetsReceipt.scientificPayloadWriteback !== false
) throw new Error("v592-deep-space-visual-asset-chain-baseline");
if (
  deepSpaceSecondaryProbeNegativeEvidence.status !== "eleven-metadata-probes-three-centaurus-items-zero-runtime-admissions"
  || deepSpaceSecondaryProbeNegativeEvidence.summary.metadataProbeCount !== 11
  || deepSpaceSecondaryProbeNegativeEvidence.summary.itemMetadataAcquisitionCount !== 3
  || deepSpaceSecondaryProbeNegativeEvidence.summary.visualPayloadDownloadedCount !== 0
  || deepSpaceSecondaryProbeNegativeEvidence.summary.runtimeAssetAdmittedCount !== 0
  || deepSpaceSecondaryProbeNegativeEvidence.summary.terminalIdentityConflictCount !== 2
  || deepSpaceSecondaryProbeNegativeEvidence.summary.terminalRestrictedOrThirdPartyCount !== 3
  || deepSpaceSecondaryProbeNegativeEvidence.policy.noLicenseThresholdRelaxation !== true
  || deepSpaceSecondaryProbeNegativeEvidence.policy.noIdentityThresholdRelaxation !== true
  || deepSpaceSecondaryProbeNegativeEvidence.policy.scientificPayloadWriteback !== false
) throw new Error("v592-deep-space-secondary-probe-negative-evidence-baseline");
if (
  deepSpaceClusterAlternativeNegativeEvidence.version !== "v592-deep-space-cluster-alternative-negative-evidence-v1"
  || deepSpaceClusterAlternativeNegativeEvidence.status !== "six-exact-ngc-alternative-probes-zero-qualified-candidates"
  || deepSpaceClusterAlternativeNegativeEvidence.targets.join(",") !== "hercules-globular-cluster,messier-3,messier-15,beehive-cluster,double-cluster,jewel-box-cluster"
  || deepSpaceClusterAlternativeNegativeEvidence.summary.metadataProbeCount !== 6
  || deepSpaceClusterAlternativeNegativeEvidence.summary.metadataRequestCount !== 6
  || deepSpaceClusterAlternativeNegativeEvidence.summary.officialCandidateCount !== 0
  || deepSpaceClusterAlternativeNegativeEvidence.summary.qualifiedVisualTextureCount !== 0
  || deepSpaceClusterAlternativeNegativeEvidence.summary.visualPayloadDownloadedCount !== 0
  || deepSpaceClusterAlternativeNegativeEvidence.summary.runtimeAssetAdmittedCount !== 0
  || deepSpaceClusterAlternativeNegativeEvidence.summary.blockedTargetCount !== 6
  || deepSpaceClusterAlternativeNegativeEvidence.policy.automaticRetryPerformed !== false
  || deepSpaceClusterAlternativeNegativeEvidence.policy.automaticReplacementPerformed !== false
  || deepSpaceClusterAlternativeNegativeEvidence.policy.noSyntheticStarGeneration !== true
  || deepSpaceClusterAlternativeNegativeEvidence.policy.noProceduralFallback !== true
  || deepSpaceClusterAlternativeNegativeEvidence.policy.noIdentityThresholdRelaxation !== true
  || deepSpaceClusterAlternativeNegativeEvidence.policy.scientificPayloadWriteback !== false
) throw new Error("v592-deep-space-cluster-alternative-negative-evidence");
if (
  nebulaAssetMetadataAdmission.status !== "metadata-candidates-assembled-payload-not-acquired"
  || nebulaAssetMetadataAdmission.summary.selectedTargetCount !== 18
  || nebulaAssetMetadataAdmission.summary.metadataProbeCompleteCount !== 18
  || nebulaAssetMetadataAdmission.summary.assetManifestCompleteCount !== 12
  || nebulaAssetMetadataAdmission.summary.terminalBlockedCount !== 6
  || nebulaAssetMetadataAdmission.summary.explicitHttpsAcquisitionCandidateCount !== 12
  || nebulaAssetMetadataAdmission.summary.payloadDownloadedCount !== 0
  || nebulaAssetMetadataAdmission.summary.assetAdmittedCount !== 0
  || nebulaAssetMetadataAdmission.policy.payloadDownloadAllowedByThisReceipt !== false
  || nebulaAssetMetadataAdmission.policy.measuredAuthorityGranted !== false
  || nebulaAssetMetadataAdmission.policy.visualAssetAdmissionGranted !== false
) throw new Error("v592-nebula-asset-metadata-admission-baseline");
if (
  majorMoonPacket.status !== "12-of-12-motion-reference-admitted-0-of-12-visual-assets-admitted"
  || majorMoonPacket.moons.length !== 12
  || majorMoonPacket.admission.motionReferenceAdmittedCount !== 12
  || majorMoonPacket.admission.orbitReferenceAdmittedCount !== 12
  || majorMoonPacket.admission.visualAssetAdmittedCount !== 0
  || majorMoonPacket.admission.heroAdmittedCount !== 0
  || majorMoonPacket.policy.proceduralFallbackAllowed !== false
  || majorMoonPacket.policy.coloredPlaceholderAllowed !== false
  || majorMoonPacket.authority.scientificPayloadWriteback !== false
  || majorMoonReceipt.packetSha256 !== majorMoonPacket.packetSha256
) throw new Error("v592-major-moon-reference-baseline");
const majorMoonVisualAssetCount = majorMoonVisualAssets.assets.length;
const majorMoonVisualBlockedCount = majorMoonPacket.moons.length - majorMoonVisualAssetCount;
const majorMoonVisualAssetIds = majorMoonVisualAssets.assets.map((asset) => asset.target);
const majorMoonExpectedVisualStatus = `${majorMoonVisualAssetCount}-of-12-albedo-assets-admitted-0-of-12-heroes-admitted`;
const majorMoonExpectedBrowserStatus = `passed-${majorMoonVisualAssetCount}-of-12-runtime-hero-candidates-${majorMoonVisualBlockedCount}-asset-blocked`;
const majorMoonCurrentProgress = `motion-reference-12/12;orbit-reference-12/12;metadata-12/12;source-metadata-8/8;visual-sources-6/6;coverage-blocked-3/6;official-collections-4;secondary-metadata-5;official-preview-assets-6/6-source-resolution-limited;alternative-metadata-3/3-negative-no-payload;nasa3d-tiffs-3/3-acquired-source-coverage-blocked;albedo-assets-${majorMoonVisualAssetCount}/12;asset-hero-admission-0/12;runtime-hero-candidates-${majorMoonVisualAssetCount}/12;browser-${majorMoonVisualAssetCount * 3}/${majorMoonVisualAssetCount * 3};asset-blocked-${majorMoonVisualBlockedCount}/12;usgs-final-tiffs-0/4-terminal-no-retry`;
const majorMoonBlockedGate = `partial:motion-and-orbit-reference-12/12;metadata-12/12;source-metadata-8/8;visual-sources-6/6;coverage-blocked-3/6;official-preview-assets-6/6-source-resolution-limited;alternative-metadata-3/3-negative-no-payload;nasa3d-tiffs-3/3-acquired-source-coverage-blocked;albedo-assets-${majorMoonVisualAssetCount}/12;runtime-hero-candidates-${majorMoonVisualAssetCount}/12;browser-${majorMoonVisualAssetCount * 3}/${majorMoonVisualAssetCount * 3};usgs-final-tiffs-0/4-terminal-no-retry;asset-blocked-${majorMoonVisualBlockedCount}/12`;
if (
  majorMoonAssetMetadataAdmission.status !== "8-of-12-explicit-https-candidates-0-payloads-0-visual-admissions"
  || majorMoonAssetMetadataAdmission.summary.requiredTargetCount !== 12
  || majorMoonAssetMetadataAdmission.summary.metadataProbeCompleteCount !== 12
  || majorMoonAssetMetadataAdmission.summary.explicitHttpsAcquisitionCandidateCount !== 8
  || majorMoonAssetMetadataAdmission.summary.unresolvedTargetCount !== 4
  || majorMoonAssetMetadataAdmission.summary.payloadDownloadedCount !== 0
  || majorMoonAssetMetadataAdmission.summary.visualAssetAdmittedCount !== 0
  || majorMoonAssetMetadataAdmission.policy.payloadDownloadAllowedByThisReceipt !== false
  || majorMoonAssetMetadataAdmission.policy.visualAssetAdmissionGranted !== false
  || majorMoonAssetMetadataAdmission.policy.proceduralFallbackAllowed !== false
) throw new Error("v592-major-moon-asset-metadata-baseline");
if (
  majorMoonItemMetadataReceipt.status !== "committed-eight-metadata-files-single-request-each-no-retry"
  || majorMoonItemMetadataReceipt.requestCount !== 8
  || majorMoonItemMetadataReceipt.requestCountPerUrl !== 1
  || majorMoonItemMetadataReceipt.assets.length !== 8
  || majorMoonItemMetadataReceipt.failures.length !== 0
  || majorMoonItemMetadataReceipt.policy.visualPayloadDownloaded !== false
  || majorMoonItemMetadataReceipt.policy.automaticRetryPerformed !== false
  || majorMoonItemMetadataReceipt.policy.automaticReplacementPerformed !== false
  || majorMoonLicenseReview.status !== "six-visual-source-acquisitions-eligible-two-texture-suitability-blocked"
  || majorMoonLicenseReview.sourceReceipts.metadataAcquisitionReceiptSha256 !== majorMoonItemMetadataReceipt.receiptSha256
  || majorMoonLicenseReview.sourceReceipts.metadataAdmissionReceiptSha256 !== majorMoonAssetMetadataAdmission.receiptSha256
  || majorMoonLicenseReview.summary.reviewedCount !== 8
  || majorMoonLicenseReview.summary.eligibleForAcquisitionCount !== 6
  || majorMoonLicenseReview.summary.blockedCount !== 2
  || majorMoonLicenseReview.policy.visualAssetAdmissionGranted !== false
  || majorMoonVisualSourceAcquisition.status !== "committed-six-visual-sources-single-request-each-no-retry"
  || majorMoonVisualSourceAcquisition.sourceReviewReceiptSha256 !== majorMoonLicenseReview.receiptSha256
  || majorMoonVisualSourceAcquisition.requestCount !== 6
  || majorMoonVisualSourceAcquisition.requestCountPerUrl !== 1
  || majorMoonVisualSourceAcquisition.assets.length !== 6
  || majorMoonVisualSourceAcquisition.failures.length !== 0
  || majorMoonVisualSourceAcquisition.policy.automaticRetryPerformed !== false
  || majorMoonVisualSourceAcquisition.policy.automaticReplacementPerformed !== false
  || majorMoonVisualAnalysis.status !== "three-runtime-derivation-candidates-three-source-coverage-blocked"
  || majorMoonVisualAnalysis.sourceAcquisitionReceiptSha256 !== majorMoonVisualSourceAcquisition.receiptSha256
  || majorMoonVisualAnalysis.summary.runtimeDerivationCandidateCount !== 3
  || majorMoonVisualAnalysis.summary.sourceCoverageBlockedCount !== 3
  || majorMoonVisualAnalysis.derivableTargets.join(",") !== "titan,enceladus,rhea"
  || majorMoonVisualAnalysis.blockedTargets.join(",") !== "iapetus,triton,charon"
  || majorMoonVisualAnalysis.policy.noInpainting !== true
  || majorMoonVisualAnalysis.policy.noSyntheticCoverageFill !== true
) throw new Error("v592-major-moon-original-visual-source-chain-baseline");
if (
  majorMoonOfficialCollectionMetadata.status !== "four-official-usgs-collection-pages-acquired-no-visual-payload"
  || majorMoonOfficialCollectionMetadata.requestCount !== 4
  || majorMoonOfficialCollectionMetadata.assets.length !== 4
  || majorMoonOfficialCollectionMetadata.failures.length !== 0
  || majorMoonOfficialCollectionMetadata.policy.metadataOnly !== true
  || majorMoonOfficialCollectionMetadata.policy.payloadDownloaded !== false
  || majorMoonOfficialCollectionMetadata.policy.scientificPayloadWriteback !== false
  || majorMoonSecondaryProductMetadata.status !== "five-official-usgs-secondary-metadata-probes-complete-no-payload"
  || majorMoonSecondaryProductMetadata.requestCount !== 5
  || majorMoonSecondaryProductMetadata.assets.length !== 5
  || majorMoonSecondaryProductMetadata.failures.length !== 0
  || majorMoonSecondaryProductMetadata.policy.metadataOnly !== true
  || majorMoonSecondaryProductMetadata.policy.payloadDownloaded !== false
  || majorMoonSecondaryProductMetadata.policy.scientificPayloadWriteback !== false
  || majorMoonOfficialPreviewAcquisition.status !== "six-official-preview-assets-acquired-single-request-each"
  || majorMoonOfficialPreviewAcquisition.requestCount !== 6
  || majorMoonOfficialPreviewAcquisition.assets.length !== 6
  || majorMoonOfficialPreviewAcquisition.assets.map((asset) => asset.target).join(",") !== "io,europa,ganymede,callisto,iapetus,charon"
  || majorMoonOfficialPreviewAcquisition.assets.some((asset) => asset.host !== "astrogeology.usgs.gov" || asset.width !== 1024 || asset.height !== 512 || asset.requestCount !== 1 || asset.automaticRetryPerformed !== false || asset.automaticReplacementPerformed !== false || asset.scientificPayload !== false || asset.presentationOnly !== true)
  || majorMoonOfficialPreviewAcquisition.failures.length !== 0
  || majorMoonOfficialPreviewAcquisition.policy.scientificPayloadDownloaded !== false
  || majorMoonOfficialPreviewAcquisition.policy.noInpainting !== true
  || majorMoonOfficialPreviewAcquisition.policy.noSyntheticCoverageFill !== true
  || majorMoonOfficialPreviewAcquisition.policy.scientificAuthorityGranted !== false
  || majorMoonOfficialPreviewAcquisition.policy.scientificPayloadWriteback !== false
) throw new Error("v592-major-moon-official-preview-source-chain-baseline");
for (const entry of [
  ...majorMoonOfficialCollectionMetadata.assets,
  ...majorMoonSecondaryProductMetadata.assets,
  ...majorMoonOfficialPreviewAcquisition.assets,
]) {
  const bytes = readFileSync(resolve(root, entry.outputPath));
  if (bytes.byteLength !== entry.bytes || sha256(bytes) !== entry.sha256) {
    throw new Error(`v592-major-moon-official-source-drift:${entry.id ?? entry.target}`);
  }
}
if (
  majorMoonVisualAssets.status !== majorMoonExpectedVisualStatus
  || majorMoonVisualAssets.admission.albedoAssetAdmittedCount !== majorMoonVisualAssetCount
  || majorMoonVisualAssets.admission.heroAdmittedCount !== 0
  || majorMoonVisualAssets.admission.blockedCount !== majorMoonVisualBlockedCount
  || majorMoonVisualAssets.admission.admittedBodies.join(",") !== majorMoonVisualAssetIds.join(",")
  || majorMoonVisualAssets.admission.blockedBodies.length !== majorMoonVisualBlockedCount
  || new Set(majorMoonVisualAssets.admission.blockedBodies).size !== majorMoonVisualBlockedCount
  || majorMoonVisualAssets.admission.blockedBodies.some((body) => majorMoonVisualAssetIds.includes(body))
  || majorMoonVisualAssets.assets.some((asset) => asset.heroAdmission !== false || asset.derivation.parameters.inpainting !== false || asset.derivation.parameters.syntheticCoverageFill !== false)
  || majorMoonVisualAssets.policy.proceduralFallbackAllowed !== false
  || majorMoonVisualAssets.policy.coloredPlaceholderAllowed !== false
  || majorMoonVisualAssetsReceipt.manifestSha256 !== majorMoonVisualAssets.manifestSha256
  || majorMoonVisualAssetsReceipt.admission.albedoAssetAdmittedCount !== majorMoonVisualAssetCount
  || majorMoonVisualAssets.sourceReceipts.officialPreviewAcquisitionReceiptSha256 !== majorMoonOfficialPreviewAcquisition.receiptSha256
  || majorMoonVisualAssetsReceipt.officialPreviewAssetCount !== 6
  || majorMoonVisualAssetsReceipt.officialPreviewSourceResolutionLimited !== true
  || majorMoonVisualAssetsReceipt.officialPreviewAcquisitionReceiptSha256 !== majorMoonOfficialPreviewAcquisition.receiptSha256
  || majorMoonVisualAssetsReceipt.heroAdmissionGranted !== false
  || majorMoonVisualAssetsReceipt.scientificPayloadWriteback !== false
) throw new Error("v592-major-moon-visual-asset-chain-baseline");
if (
  majorMoonBrowserReceipt.status !== majorMoonExpectedBrowserStatus
  || majorMoonBrowserReceipt.source.visualAssetManifestSha256 !== majorMoonVisualAssets.manifestSha256
  || majorMoonBrowserReceipt.admission.requiredCount !== 12
  || majorMoonBrowserReceipt.admission.runtimeHeroCandidateCount !== majorMoonVisualAssetCount
  || majorMoonBrowserReceipt.admission.runtimeHeroCandidateIds.join(",") !== majorMoonVisualAssetIds.join(",")
  || majorMoonBrowserReceipt.admission.assetBlockedCount !== majorMoonVisualBlockedCount
  || majorMoonBrowserReceipt.frames.length !== majorMoonVisualAssetCount * 3
  || majorMoonBrowserReceipt.admission.singleCanvas !== true
  || majorMoonBrowserReceipt.admission.scienceCinematicPayloadStable !== true
  || majorMoonBrowserReceipt.admission.scientificPayloadWriteback !== false
  || majorMoonBrowserReceipt.admission.consolePageWebglErrorCount !== 0
  || majorMoonBrowserReceipt.admission.releaseRestoreCycleCount !== majorMoonVisualAssetCount
  || majorMoonBrowserReceipt.admission.sceneExitCandidateResources !== 0
  || majorMoonBrowserReceipt.admission.sceneExitRendererTextureDelta !== 0
) throw new Error("v592-major-moon-browser-matrix-baseline");
if (
  majorMoonSecondaryVisualEvidence.status !== "callisto-official-secondary-lane-blocked-no-qualified-global-texture"
  || majorMoonSecondaryVisualEvidence.target !== "callisto"
  || majorMoonSecondaryVisualEvidence.admission.qualifiedGlobalTextureCount !== 0
  || majorMoonSecondaryVisualEvidence.policy.heroAdmissionGranted !== false
  || majorMoonSecondaryVisualEvidence.policy.singleRequestPerUrl !== true
  || majorMoonSecondaryVisualEvidence.policy.automaticRetryPerformed !== false
  || majorMoonSecondaryVisualEvidence.policy.automaticReplacementPerformed !== false
  || majorMoonSecondaryVisualEvidence.policy.noInpainting !== true
  || majorMoonSecondaryVisualEvidence.policy.noSyntheticCoverageFill !== true
  || majorMoonSecondaryVisualEvidence.policy.scientificPayloadWriteback !== false
) throw new Error("v592-major-moon-secondary-visual-evidence");
if (
  majorMoonUsGsFinalAcquisition.version !== "v592-major-moon-usgs-final-visual-source-acquisition-v1"
  || majorMoonUsGsFinalAcquisition.status !== "partial-usgs-pds-tiffs-with-terminal-failures-no-retry"
  || majorMoonUsGsFinalAcquisition.requestedUrls.length !== 4
  || majorMoonUsGsFinalAcquisition.assets.length !== 0
  || majorMoonUsGsFinalAcquisition.failures.length !== 4
  || majorMoonUsGsFinalAcquisition.failures.map((failure) => failure.target).join(",") !== "io,europa,ganymede,callisto"
  || majorMoonUsGsFinalAcquisition.failures.some((failure) => failure.requestCount !== 1 || failure.automaticRetryPerformed !== false || failure.automaticReplacementPerformed !== false)
  || majorMoonUsGsFinalAcquisition.policy.exactHost !== "asc-pds-services.s3.us-west-2.amazonaws.com"
  || majorMoonUsGsFinalAcquisition.policy.requestCountPerUrl !== 1
  || majorMoonUsGsFinalAcquisition.policy.automaticRetryPerformed !== false
  || majorMoonUsGsFinalAcquisition.policy.automaticReplacementPerformed !== false
  || majorMoonUsGsFinalAcquisition.policy.visualAssetAdmissionGrantedByAcquisition !== false
  || majorMoonUsGsFinalAcquisition.policy.scientificAuthorityGranted !== false
  || majorMoonUsGsFinalAnalysis.status !== "no-acquired-usgs-tiffs-terminal-acquisition-blocked"
  || majorMoonUsGsFinalAnalysis.sourceAcquisitionReceiptSha256 !== majorMoonUsGsFinalAcquisition.receiptSha256
  || majorMoonUsGsFinalAnalysis.summary.requestedTargetCount !== 4
  || majorMoonUsGsFinalAnalysis.summary.acquiredTargetCount !== 0
  || majorMoonUsGsFinalAnalysis.summary.terminalFailureCount !== 4
  || majorMoonUsGsFinalAnalysis.summary.analyzedTargetCount !== 0
  || majorMoonUsGsFinalAnalysis.failedTargets.join(",") !== "io,europa,ganymede,callisto"
  || majorMoonUsGsFinalAnalysis.policy.noInpainting !== true
  || majorMoonUsGsFinalAnalysis.policy.noSyntheticCoverageFill !== true
  || majorMoonUsGsFinalAnalysis.policy.runtimeAssetAdmissionGranted !== false
  || majorMoonUsGsFinalAnalysis.policy.heroAdmissionGranted !== false
  || majorMoonUsGsFinalAnalysis.policy.scientificAuthorityGranted !== false
) throw new Error("v592-major-moon-usgs-final-terminal-evidence");
if (
  majorMoonAlternativeNegativeEvidence.version !== "v592-major-moon-alternative-source-negative-evidence-v1"
  || majorMoonAlternativeNegativeEvidence.status !== "three-target-alternative-metadata-lane-blocked-no-qualified-global-texture"
  || majorMoonAlternativeNegativeEvidence.targets.join(",") !== "triton,miranda,titania"
  || majorMoonAlternativeNegativeEvidence.summary.metadataRequestCount !== 3
  || majorMoonAlternativeNegativeEvidence.summary.metadataProbeCount !== 3
  || majorMoonAlternativeNegativeEvidence.summary.officialCandidateCount !== 2
  || majorMoonAlternativeNegativeEvidence.summary.qualifiedGlobalTextureCount !== 0
  || majorMoonAlternativeNegativeEvidence.summary.visualPayloadDownloadedCount !== 0
  || majorMoonAlternativeNegativeEvidence.summary.runtimeAssetAdmittedCount !== 0
  || majorMoonAlternativeNegativeEvidence.summary.blockedTargetCount !== 3
  || majorMoonAlternativeNegativeEvidence.policy.automaticRetryPerformed !== false
  || majorMoonAlternativeNegativeEvidence.policy.automaticReplacementPerformed !== false
  || majorMoonAlternativeNegativeEvidence.policy.noSyntheticCoverageFill !== true
  || majorMoonAlternativeNegativeEvidence.policy.noProceduralFallback !== true
  || majorMoonAlternativeNegativeEvidence.policy.noThresholdRelaxation !== true
  || majorMoonAlternativeNegativeEvidence.policy.scientificPayloadWriteback !== false
) throw new Error("v592-major-moon-alternative-negative-evidence");
if (
  majorMoonNasa3dAcquisition.version !== "v592-major-moon-nasa3d-visual-acquisition-v1"
  || majorMoonNasa3dAcquisition.status !== "three-nasa3d-tiffs-acquired-single-request-each-analysis-required"
  || majorMoonNasa3dAcquisition.requestedUrls.length !== 3
  || majorMoonNasa3dAcquisition.assets.length !== 3
  || majorMoonNasa3dAcquisition.failures.length !== 0
  || majorMoonNasa3dAcquisition.policy.requestCountPerUrl !== 1
  || majorMoonNasa3dAcquisition.policy.automaticRetryPerformed !== false
  || majorMoonNasa3dAcquisition.policy.automaticReplacementPerformed !== false
  || majorMoonNasa3dAcquisition.policy.scientificPayloadDownloaded !== false
  || majorMoonNasa3dAcquisition.policy.visualAssetAdmissionGranted !== false
  || majorMoonNasa3dAcquisition.assets.some((asset) => asset.sourceHost !== "raw.githubusercontent.com" || asset.requestCount !== 1 || asset.scientificPayload !== false || asset.presentationOnly !== true)
  || majorMoonNasa3dAnalysis.version !== "v592-major-moon-nasa3d-visual-analysis-v1"
  || majorMoonNasa3dAnalysis.policy.sourceAcquisitionReceiptSha256 !== majorMoonNasa3dAcquisition.receiptSha256
  || majorMoonNasa3dAnalysis.summary.analyzedCount !== 3
  || majorMoonNasa3dAnalysis.summary.runtimeDerivationCandidateCount !== 0
  || majorMoonNasa3dAnalysis.summary.sourceCoverageBlockedCount !== 3
  || majorMoonNasa3dAnalysis.summary.runtimeAssetAdmittedCount !== 0
  || majorMoonNasa3dAnalysis.policy.noInpainting !== true
  || majorMoonNasa3dAnalysis.policy.noSyntheticCoverageFill !== true
  || majorMoonNasa3dAnalysis.policy.noProceduralFallback !== true
  || majorMoonNasa3dNegativeEvidence.version !== "v592-major-moon-nasa3d-negative-evidence-v1"
  || majorMoonNasa3dNegativeEvidence.status !== "three-official-nasa3d-global-textures-source-coverage-blocked-no-runtime-admission"
  || majorMoonNasa3dNegativeEvidence.sourceReceipts.acquisitionReceiptSha256 !== majorMoonNasa3dAcquisition.receiptSha256
  || majorMoonNasa3dNegativeEvidence.sourceReceipts.analysisReceiptSha256 !== majorMoonNasa3dAnalysis.receiptSha256
  || majorMoonNasa3dNegativeEvidence.summary.qualifiedGlobalTextureCount !== 0
  || majorMoonNasa3dNegativeEvidence.summary.runtimeAssetAdmittedCount !== 0
  || majorMoonNasa3dNegativeEvidence.policy.noInpainting !== true
  || majorMoonNasa3dNegativeEvidence.policy.noSyntheticCoverageFill !== true
  || majorMoonNasa3dNegativeEvidence.policy.noProceduralFallback !== true
  || majorMoonNasa3dNegativeEvidence.policy.noThresholdRelaxation !== true
) throw new Error("v592-major-moon-nasa3d-negative-evidence");
const liveSombreroFrame = liveBrowserReceipt.frames.find((frame) => frame.focus === "sombrero-galaxy");
const liveBrowserReceiptStructurallyQualified = !(
  liveBrowserReceipt.status !== "passed-current-standalone-live-matrix-all-requested-slices-ready"
  || liveBrowserReceipt.route !== "/local-shadow-v592"
  || liveBrowserReceipt.frames.length !== 12
  || liveBrowserReceipt.admission.singleCanvas !== true
  || liveBrowserReceipt.admission.consolePageWebglErrorCount !== 0
  || liveBrowserReceipt.admission.scienceCinematicPayloadStable !== true
  || liveBrowserReceipt.admission.scientificPayloadWriteback !== false
  || liveBrowserReceipt.admission.deepSpaceReadyFrameCount !== 3
  || liveBrowserReceipt.admission.deepSpaceBlockedFrameCount !== 0
  || liveBrowserReceipt.admission.fallbackFrameCount !== 0
  || liveSombreroFrame?.deepState !== "ready-2-ktx2-slices"
  || liveSombreroFrame?.readySlices !== 2
  || (liveSombreroFrame?.blockedSlices ?? 0) !== 0
  || (liveSombreroFrame?.fullFallbackCount ?? 0) !== 0
  || liveBrowserReceipt.policy.browser !== "Codex in-app browser"
  || liveBrowserReceipt.policy.noAlternateBrowser !== true
);
const browserSoakReceiptStructurallyQualified = !(
  browserSoakResourceReceipt.status !== browserSoakExpectedStatus
  || browserSoakResourceReceipt.route !== "/local-shadow-v592"
  || browserSoakResourceReceipt.browser !== "Codex in-app browser"
  || browserSoakResourceReceipt.soak.durationMs < 1_800_000
  || browserSoakResourceReceipt.soak.sampleCount !== 59
  || browserSoakResourceReceipt.soak.visibleSampleCount !== 59
  || browserSoakResourceReceipt.soak.fpsMedian.minimum < 55
  || browserSoakResourceReceipt.soak.rendererResources.sustainedGrowthObserved !== false
  || browserSoakResourceReceipt.soak.memoryTelemetry.state !== (browserSoakTelemetryAvailable ? "available-performance-memory" : "unavailable-performance-memory-not-exposed")
  || browserSoakResourceReceipt.admission.rendererResourceNoGrowthPassed !== true
  || browserSoakResourceReceipt.admission.releaseRestorePassed !== true
  || browserSoakResourceReceipt.admission.jsHeapTelemetryAvailable !== browserSoakTelemetryAvailable
  || browserSoakResourceReceipt.admission.jsHeapGrowthGatePassed !== browserSoakHeapQualified
  || browserSoakResourceReceipt.admission.fullMemoryGatePassed !== browserSoakHeapQualified
  || browserSoakResourceReceipt.admission.payloadIsolationPassed !== true
  || browserSoakResourceReceipt.resourceLifecycle.strictCycleCount !== 4
  || browserSoakResourceReceipt.resourceLifecycle.releaseZeroPassed !== true
  || browserSoakResourceReceipt.resourceLifecycle.restoreBaselinePassed !== true
  || browserSoakResourceReceipt.policy.noHeapClaimWhenUnavailable !== true
  || browserSoakResourceReceipt.policy.scientificPayloadWriteback !== false
);

function verifyNebulaOverlayLane(manifest, receipt, namespace, expectedTargets) {
  if (
    manifest.version !== `v592-nebula-${namespace}-visual-assets-v2`
    || manifest.status !== "additive-presentation-assets-admitted-signoff-pending"
    || manifest.policy.sourceCount !== expectedTargets.length
    || manifest.policy.runtimeAssetAdmittedCount !== expectedTargets.length
    || manifest.policy.proceduralFallbackAllowed !== false
    || manifest.policy.scienceImagePayloadAllowed !== false
    || manifest.policy.presentationOnly !== true
    || manifest.policy.fixedJ2000Direction !== true
    || manifest.policy.noInpainting !== true
    || manifest.policy.noSyntheticCoverageFill !== true
    || manifest.policy.mobileSharesDesktopCore !== true
    || manifest.admission.runtimeAssetAdmittedCount !== expectedTargets.length
    || manifest.admission.admittedTargets.join(",") !== expectedTargets.join(",")
    || manifest.admission.visualSignoffGranted !== false
    || manifest.assets.length !== expectedTargets.length
    || receipt.version !== `v592-nebula-${namespace}-visual-assets-receipt-v2`
    || receipt.status !== "additive-presentation-assets-built-signoff-pending"
    || receipt.manifestSha256 !== manifest.manifestSha256
    || receipt.admittedTargets.join(",") !== expectedTargets.join(",")
    || receipt.visualSignoffGranted !== false
    || receipt.scientificPayloadWriteback !== false
  ) throw new Error(`v592-nebula-overlay-contract:${namespace}`);
  const fullFiles = new Map();
  const liteFiles = new Map();
  for (const asset of manifest.assets) {
    const sourceBytes = readFileSync(resolve(root, asset.source.path));
    if (
      sourceBytes.byteLength !== asset.source.bytes
      || sha256(sourceBytes) !== asset.source.sha256
      || asset.presentationOnly !== true
      || asset.scientificAuthority !== false
      || asset.scientificPayloadWriteback !== false
      || asset.observationEncoding.nakedEyeRepresentationClaimed !== false
      || asset.derivation.parameters.inpainting !== false
      || asset.derivation.parameters.syntheticCoverageFill !== false
      || asset.derivation.parameters.scientificDataClaim !== false
      || asset.tiers.desktop.depthSliceCount !== 4
      || asset.tiers.mobile.depthSliceCount !== 2
      || asset.tiers.lite.depthSliceCount !== 1
    ) throw new Error(`v592-nebula-overlay-asset:${namespace}:${asset.target}`);
    for (const tierName of ["desktop", "mobile"]) for (const slice of asset.tiers[tierName].slices) {
      fullFiles.set(slice.ktx2.url, slice.ktx2);
      fullFiles.set(slice.fallback.url, slice.fallback);
    }
    for (const slice of asset.tiers.lite.slices) {
      liteFiles.set(slice.desktopFallback.url, slice.desktopFallback);
      liteFiles.set(slice.mobileFallback.url, slice.mobileFallback);
    }
  }
  for (const file of [...fullFiles.values(), ...liteFiles.values()]) {
    const bytes = readFileSync(resolve(root, `public${file.url}`));
    if (bytes.byteLength !== file.bytes || sha256(bytes) !== file.sha256) throw new Error(`v592-nebula-overlay-runtime-drift:${namespace}:${file.url}`);
  }
  const fullRuntimeBytes = [...fullFiles.values()].reduce((sum, file) => sum + file.bytes, 0);
  const liteIncrementBytes = [...liteFiles.values()].reduce((sum, file) => sum + file.bytes, 0);
  if (
    fullFiles.size !== receipt.uniqueFullFileCount
    || liteFiles.size !== receipt.uniqueLiteFileCount
    || fullRuntimeBytes !== receipt.fullRuntimeBytes
    || liteIncrementBytes !== receipt.liteIncrementBytes
  ) throw new Error(`v592-nebula-overlay-budget:${namespace}`);
  return { fullRuntimeBytes, liteIncrementBytes };
}

const nebulaExtendedOverlayBudget = verifyNebulaOverlayLane(
  nebulaExtendedVisualAssets,
  nebulaExtendedVisualAssetsReceipt,
  "extended",
  ["jellyfish-nebula", "cocoon-nebula", "rho-ophiuchi-cloud", "cepheus-c-nebula", "dragon-lair-nebula"],
);
const nebulaClosureOverlayBudget = verifyNebulaOverlayLane(
  nebulaClosureVisualAssets,
  nebulaClosureVisualAssetsReceipt,
  "closure",
  ["monkey-head-nebula", "w40-nebula", "sh2-235-nebula", "flaming-star-nebula", "spider-nebula", "tarantula-nebula", "tadpole-nebula"],
);
if (
  nebulaBroadMetadataReceipts.some((receipt) => receipt.status !== "metadata-probe-complete-no-payload")
  || nebulaExtendedMetadata.status !== "twelve-item-metadata-acquired-no-visual-payload"
  || nebulaExtendedMetadata.targets.length !== 12
  || nebulaExtendedAcquisition.status !== "five-presentation-images-acquired-single-request-each"
  || nebulaExtendedAcquisition.assets.length !== 5
  || nebulaFinalMetadata.status !== "7-item-metadata-acquired-no-visual-payload"
  || nebulaFinalMetadata.targets.length !== 7
  || nebulaFinalAcquisition.status !== "5-presentation-images-acquired-single-request-each"
  || nebulaFinalAcquisition.assets.length !== 5
  || nebulaClosureMetadata.status !== "3-item-metadata-acquired-no-visual-payload"
  || nebulaClosureMetadata.targets.length !== 3
  || nebulaClosureAcquisition.status !== "1-presentation-images-acquired-single-request-each"
  || nebulaClosureAcquisition.assets.length !== 1
  || nebulaClosure2Metadata.status !== "4-item-metadata-acquired-no-visual-payload"
  || nebulaClosure2Metadata.targets.length !== 4
  || nebulaClosure2Acquisition.status !== "1-presentation-images-acquired-single-request-each"
  || nebulaClosure2Acquisition.assets.length !== 1
  || nebulaExtendedOverlayBudget.fullRuntimeBytes + nebulaClosureOverlayBudget.fullRuntimeBytes > 20 * 1024 * 1024
  || nebulaExtendedOverlayBudget.liteIncrementBytes + nebulaClosureOverlayBudget.liteIncrementBytes > 64 * 1024
) throw new Error("v592-nebula-overlay-source-and-budget-chain");

if (
  nebulaOverlayBrowserReceipt.status !== "passed-twelve-of-twelve-overlay-four-profile-browser-matrix"
  || nebulaOverlayBrowserReceipt.source.extendedOverlayManifestSha256 !== nebulaExtendedVisualAssets.manifestSha256
  || nebulaOverlayBrowserReceipt.source.closureOverlayManifestSha256 !== nebulaClosureVisualAssets.manifestSha256
  || nebulaOverlayBrowserReceipt.admission.overlayAssetAdmittedCount !== 12
  || nebulaOverlayBrowserReceipt.admission.goalNebulaCoverageCount !== 24
  || nebulaOverlayBrowserReceipt.admission.frameCount !== 48
  || nebulaOverlayBrowserReceipt.admission.desktopCinematicFrameCount !== 12
  || nebulaOverlayBrowserReceipt.admission.mobileCinematicFrameCount !== 12
  || nebulaOverlayBrowserReceipt.admission.desktopScienceFrameCount !== 12
  || nebulaOverlayBrowserReceipt.admission.mobileScienceFrameCount !== 12
  || nebulaOverlayBrowserReceipt.admission.scienceFrameCount !== 24
  || nebulaOverlayBrowserReceipt.admission.cinematicFrameCount !== 24
  || nebulaOverlayBrowserReceipt.admission.nativeKtx2CinematicFrameCount !== 24
  || nebulaOverlayBrowserReceipt.admission.scienceMarkerOnlyFrameCount !== 24
  || nebulaOverlayBrowserReceipt.admission.mobileScienceCollapsedSheetFrameCount !== 12
  || nebulaOverlayBrowserReceipt.admission.uniqueScreenshotCount !== 48
  || nebulaOverlayBrowserReceipt.admission.minimumFpsMedian < 45
  || nebulaOverlayBrowserReceipt.admission.minimumCinematicRoiMeanLuminance < 5.25
  || nebulaOverlayBrowserReceipt.admission.minimumCinematicRoiNonBlackFraction < 0.02
  || nebulaOverlayBrowserReceipt.admission.minimumCinematicRoiBrightFraction < 0.008
  || nebulaOverlayBrowserReceipt.admission.singleCanvas !== true
  || nebulaOverlayBrowserReceipt.admission.scienceCinematicPayloadStable !== true
  || nebulaOverlayBrowserReceipt.admission.scientificPayloadSha256 !== "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674"
  || nebulaOverlayBrowserReceipt.admission.scientificPayloadWriteback !== false
  || nebulaOverlayBrowserReceipt.admission.scientificCoordinateMutation !== false
  || nebulaOverlayBrowserReceipt.admission.scienceImagePayloadLoaded !== false
  || nebulaOverlayBrowserReceipt.admission.consolePageWebglErrorCount !== 0
  || nebulaOverlayBrowserReceipt.admission.fullFallbackCount !== 0
  || nebulaOverlayBrowserReceipt.admission.gpuGateClaimedByThisReceipt !== false
  || nebulaOverlayBrowserReceipt.policy.gpuTelemetryLimitationPreserved !== true
) throw new Error("v592-nebula-overlay-browser-matrix");

if (
  deepSpaceBrowserReceipt.version !== "v592-deep-space-browser-matrix-receipt-v1"
  || deepSpaceBrowserReceipt.status !== "passed-eighteen-of-eighteen-deep-space-four-profile-browser-matrix"
  || deepSpaceBrowserReceipt.route !== "/local-shadow-v592"
  || deepSpaceBrowserReceipt.admission.requiredReferenceCount !== 24
  || deepSpaceBrowserReceipt.admission.runtimeVisualAssetCount !== 18
  || deepSpaceBrowserReceipt.admission.galaxyVisualAssetCount !== 6
  || deepSpaceBrowserReceipt.admission.clusterVisualAssetCount !== 12
  || deepSpaceBrowserReceipt.admission.frameCount !== 72
  || deepSpaceBrowserReceipt.admission.desktopCinematicFrameCount !== 18
  || deepSpaceBrowserReceipt.admission.desktopScienceFrameCount !== 18
  || deepSpaceBrowserReceipt.admission.mobileCinematicFrameCount !== 18
  || deepSpaceBrowserReceipt.admission.mobileScienceFrameCount !== 18
  || deepSpaceBrowserReceipt.admission.cinematicFrameCount !== 36
  || deepSpaceBrowserReceipt.admission.scienceMarkerOnlyFrameCount !== 36
  || deepSpaceBrowserReceipt.admission.nativeKtx2CinematicFrameCount !== 36
  || deepSpaceBrowserReceipt.admission.uniqueScreenshotCount !== 72
  || deepSpaceBrowserReceipt.admission.minimumFpsMedian < 45
  || deepSpaceBrowserReceipt.admission.peakDesktopGpuBytes > 512 * 1024 * 1024
  || deepSpaceBrowserReceipt.admission.peakMobileGpuBytes > 192 * 1024 * 1024
  || deepSpaceBrowserReceipt.admission.peakDrawCalls > 60
  || deepSpaceBrowserReceipt.admission.singleCanvas !== true
  || deepSpaceBrowserReceipt.admission.scienceCinematicPayloadStable !== true
  || deepSpaceBrowserReceipt.admission.scientificPayloadSha256 !== "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674"
  || deepSpaceBrowserReceipt.admission.scientificPayloadWriteback !== false
  || deepSpaceBrowserReceipt.admission.scienceImagePayloadLoaded !== false
  || deepSpaceBrowserReceipt.admission.consolePageWebglErrorCount !== 0
  || deepSpaceBrowserReceipt.admission.fullFallbackCount !== 0
  || deepSpaceBrowserReceipt.admission.releaseRestorePassed !== true
  || deepSpaceBrowserReceipt.admission.releaseStateCandidateResources !== 0
  || deepSpaceBrowserReceipt.admission.releaseStateCandidateBytes !== 0
  || deepSpaceBrowserReceipt.admission.releaseStateSceneNodes !== 0
  || deepSpaceBrowserReceipt.admission.releaseStateProgramDelta !== 0
  || deepSpaceBrowserReceipt.admission.releaseStateTextureDelta !== 0
  || deepSpaceBrowserReceipt.admission.releaseStateGeometryDelta !== 0
  || deepSpaceBrowserReceipt.source.capturePath !== "docs/release/v592/deep-space-browser-capture-v592.json"
  || deepSpaceBrowserReceipt.source.captureBytes !== deepSpaceBrowserCaptureBytes.byteLength
  || deepSpaceBrowserReceipt.source.captureSha256 !== sha256(deepSpaceBrowserCaptureBytes)
  || deepSpaceBrowserCapture.version !== "v592-deep-space-browser-capture-v1"
  || deepSpaceBrowserCapture.frames?.length !== 72
  || deepSpaceBrowserCapture.policy?.alternateBrowserUsed !== false
  || deepSpaceBrowserCapture.policy?.productionDeployment !== false
  || deepSpaceBrowserCapture.policy?.noPayloadDownload !== true
) throw new Error("v592-deep-space-browser-matrix");
for (const frame of deepSpaceBrowserReceipt.frames) {
  const screenshotBytes = readFileSync(resolve(root, frame.screenshotPath));
  if (screenshotBytes.byteLength !== frame.screenshotBytes || sha256(screenshotBytes) !== frame.screenshotSha256) {
    throw new Error(`v592-deep-space-browser-screenshot:${frame.name}`);
  }
}
if (
  deepSpaceAnalyticBrowserReceipt.version !== "v592-deep-space-analytic-browser-matrix-receipt-v1"
  || deepSpaceAnalyticBrowserReceipt.status !== "passed-six-openngc-analytic-galaxies-four-profile-browser-matrix"
  || deepSpaceAnalyticBrowserReceipt.route !== "/local-shadow-v592"
  || deepSpaceAnalyticBrowserReceipt.admission.analyticGalaxyCount !== 6
  || deepSpaceAnalyticBrowserReceipt.admission.frameCount !== 24
  || deepSpaceAnalyticBrowserReceipt.admission.desktopCinematicFrameCount !== 6
  || deepSpaceAnalyticBrowserReceipt.admission.desktopScienceFrameCount !== 6
  || deepSpaceAnalyticBrowserReceipt.admission.mobileCinematicFrameCount !== 6
  || deepSpaceAnalyticBrowserReceipt.admission.mobileScienceFrameCount !== 6
  || deepSpaceAnalyticBrowserReceipt.admission.cinematicFrameCount !== 12
  || deepSpaceAnalyticBrowserReceipt.admission.scienceMarkerOnlyFrameCount !== 12
  || deepSpaceAnalyticBrowserReceipt.admission.uniqueScreenshotCount !== 24
  || deepSpaceAnalyticBrowserReceipt.admission.minimumFpsMedian < 45
  || deepSpaceAnalyticBrowserReceipt.admission.peakDesktopGpuBytes > 512 * 1024 * 1024
  || deepSpaceAnalyticBrowserReceipt.admission.peakMobileGpuBytes > 192 * 1024 * 1024
  || deepSpaceAnalyticBrowserReceipt.admission.peakDrawCalls > 60
  || deepSpaceAnalyticBrowserReceipt.admission.singleCanvas !== true
  || deepSpaceAnalyticBrowserReceipt.admission.scienceCinematicPayloadStable !== true
  || deepSpaceAnalyticBrowserReceipt.admission.scientificPayloadSha256 !== "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674"
  || deepSpaceAnalyticBrowserReceipt.admission.scientificPayloadWriteback !== false
  || deepSpaceAnalyticBrowserReceipt.admission.scienceImagePayloadLoaded !== false
  || deepSpaceAnalyticBrowserReceipt.admission.consolePageWebglErrorCount !== 0
  || deepSpaceAnalyticBrowserReceipt.admission.fullFallbackCount !== 0
  || deepSpaceAnalyticBrowserReceipt.admission.releaseRestorePassed !== true
  || deepSpaceAnalyticBrowserReceipt.admission.releaseStateCandidateResources !== 0
  || deepSpaceAnalyticBrowserReceipt.admission.releaseStateCandidateBytes !== 0
  || deepSpaceAnalyticBrowserReceipt.admission.releaseStateSceneNodes !== 0
  || deepSpaceAnalyticBrowserReceipt.admission.releaseStateProgramDelta !== 0
  || deepSpaceAnalyticBrowserReceipt.admission.releaseStateTextureDelta !== 0
  || deepSpaceAnalyticBrowserReceipt.admission.releaseStateGeometryDelta !== 0
  || deepSpaceAnalyticBrowserReceipt.source.capturePath !== "docs/release/v592/deep-space-analytic-browser-capture-v592.json"
  || deepSpaceAnalyticBrowserReceipt.source.captureBytes !== deepSpaceAnalyticBrowserCaptureBytes.byteLength
  || deepSpaceAnalyticBrowserReceipt.source.captureSha256 !== sha256(deepSpaceAnalyticBrowserCaptureBytes)
  || deepSpaceAnalyticBrowserCapture.version !== "v592-deep-space-analytic-browser-capture-v1"
  || deepSpaceAnalyticBrowserCapture.frames?.length !== 24
  || deepSpaceAnalyticBrowserCapture.policy?.alternateBrowserUsed !== false
  || deepSpaceAnalyticBrowserCapture.policy?.productionDeployment !== false
  || deepSpaceAnalyticBrowserCapture.policy?.noPayloadDownload !== true
) throw new Error("v592-deep-space-analytic-browser-matrix");
for (const frame of deepSpaceAnalyticBrowserReceipt.frames) {
  const screenshotBytes = readFileSync(resolve(root, frame.screenshotPath));
  if (screenshotBytes.byteLength !== frame.screenshotBytes || sha256(screenshotBytes) !== frame.screenshotSha256) {
    throw new Error(`v592-deep-space-analytic-browser-screenshot:${frame.name}`);
  }
}
const nebulaOverlayCaptureBytes = readFileSync(resolve(root, nebulaOverlayBrowserReceipt.source.capturePath));
if (
  nebulaOverlayCaptureBytes.byteLength !== nebulaOverlayBrowserReceipt.source.captureBytes
  || sha256(nebulaOverlayCaptureBytes) !== nebulaOverlayBrowserReceipt.source.captureSha256
) throw new Error("v592-nebula-overlay-browser-capture-drift");
for (const frame of nebulaOverlayBrowserReceipt.frames) {
  const screenshotBytes = readFileSync(resolve(root, frame.screenshotPath));
  if (
    screenshotBytes.byteLength !== frame.screenshotBytes
    || sha256(screenshotBytes) !== frame.screenshotSha256
  ) throw new Error(`v592-nebula-overlay-browser-screenshot-drift:${frame.name}`);
}

if (
  nebulaItemMetadataAcquisition.status !== "committed-twelve-metadata-files-single-request-each-no-retry"
  || nebulaItemMetadataAcquisition.requestCount !== 12
  || nebulaItemMetadataAcquisition.requestCountPerUrl !== 1
  || nebulaItemMetadataAcquisition.assets.length !== 12
  || nebulaItemMetadataAcquisition.failures.length !== 0
  || nebulaItemMetadataAcquisition.policy.visualPayloadDownloaded !== false
  || nebulaItemMetadataAcquisition.policy.automaticRetryPerformed !== false
  || nebulaLicenseReview.status !== "7-visual-source-acquisitions-eligible-5-license-identity-or-suitability-blocked"
  || nebulaLicenseReview.sourceReceipts.metadataAcquisitionReceiptSha256 !== nebulaItemMetadataAcquisition.receiptSha256
  || nebulaLicenseReview.sourceReceipts.metadataAdmissionReceiptSha256 !== nebulaAssetMetadataAdmission.receiptSha256
  || nebulaLicenseReview.summary.reviewedCount !== 12
  || nebulaLicenseReview.summary.eligibleForAcquisitionCount !== 7
  || nebulaLicenseReview.summary.blockedCount !== 5
  || nebulaLicenseReview.summary.sourceImageDownloadedCount !== 0
  || nebulaLicenseReview.policy.visualAssetAdmissionGranted !== false
  || nebulaVisualSourceAcquisition.status !== "committed-seven-visual-sources-single-request-each-no-retry"
  || nebulaVisualSourceAcquisition.sourceReviewReceiptSha256 !== nebulaLicenseReview.receiptSha256
  || nebulaVisualSourceAcquisition.requestCount !== 7
  || nebulaVisualSourceAcquisition.requestCountPerUrl !== 1
  || nebulaVisualSourceAcquisition.assets.length !== 7
  || nebulaVisualSourceAcquisition.failures.length !== 0
  || nebulaVisualSourceAcquisition.policy.automaticRetryPerformed !== false
  || nebulaVisualSourceAcquisition.policy.automaticReplacementPerformed !== false
  || nebulaVisualAnalysis.status !== "six-runtime-derivation-candidates-one-visual-coverage-blocked"
  || nebulaVisualAnalysis.sourceAcquisitionReceiptSha256 !== nebulaVisualSourceAcquisition.receiptSha256
  || nebulaVisualAnalysis.licenseReviewReceiptSha256 !== nebulaLicenseReview.receiptSha256
  || nebulaVisualAnalysis.summary.runtimeDerivationCandidateCount !== 6
  || nebulaVisualAnalysis.summary.visualCoverageBlockedCount !== 1
  || nebulaVisualAnalysis.derivableTargets.join(",") !== "heart-nebula,soul-nebula,witch-head-nebula,flame-nebula,pacman-nebula,running-chicken-nebula"
  || nebulaVisualAnalysis.blockedTargets.join(",") !== "california-nebula"
  || nebulaVisualAnalysis.policy.noInpainting !== true
  || nebulaVisualAnalysis.policy.noSyntheticCoverageFill !== true
  || nebulaVisualAssets.status !== "six-of-seven-source-reviewed-nebula-runtime-assets-admitted"
  || nebulaVisualAssets.policy.runtimeAssetAdmittedCount !== 6
  || nebulaVisualAssets.admission.runtimeAssetAdmittedCount !== 6
  || nebulaVisualAssets.admission.heroAdmissionCount !== 0
  || nebulaVisualAssets.admission.admittedTargets.join(",") !== "heart-nebula,soul-nebula,witch-head-nebula,flame-nebula,pacman-nebula,running-chicken-nebula"
  || nebulaVisualAssets.admission.blockedTargets.includes("california-nebula") !== true
  || nebulaVisualAssets.policy.proceduralFallbackAllowed !== false
  || nebulaVisualAssets.policy.scienceImagePayloadAllowed !== false
  || nebulaVisualAssets.assets.some((asset) => asset.presentationOnly !== true || asset.scientificAuthority !== false || asset.scientificPayloadWriteback !== false || asset.derivation.parameters.inpainting !== false || asset.derivation.parameters.syntheticCoverageFill !== false || asset.derivation.parameters.scientificDataClaim !== false)
  || nebulaVisualAssetsReceipt.manifestSha256 !== nebulaVisualAssets.manifestSha256
  || nebulaVisualAssetsReceipt.admission.runtimeAssetAdmittedCount !== 6
  || nebulaVisualAssetsReceipt.heroAdmissionGranted !== false
  || nebulaVisualAssetsReceipt.scientificPayloadWriteback !== false
) throw new Error("v592-nebula-visual-asset-chain-baseline");
if (
  nebulaBrowserReceipt.status !== "passed-six-of-six-expanded-nebula-three-profile-browser-matrix"
  || nebulaBrowserReceipt.source.nebulaVisualManifestSha256 !== nebulaVisualAssets.manifestSha256
  || nebulaBrowserReceipt.admission.runtimeAssetAdmittedCount !== 6
  || nebulaBrowserReceipt.admission.frameCount !== 18
  || nebulaBrowserReceipt.admission.desktopFrameCount !== 12
  || nebulaBrowserReceipt.admission.mobileFrameCount !== 6
  || nebulaBrowserReceipt.admission.scienceFrameCount !== 6
  || nebulaBrowserReceipt.admission.cinematicFrameCount !== 12
  || nebulaBrowserReceipt.admission.nativeKtx2CinematicFrameCount !== 12
  || nebulaBrowserReceipt.admission.uniqueScreenshotCount !== 18
  || nebulaBrowserReceipt.admission.singleCanvas !== true
  || nebulaBrowserReceipt.admission.scienceCinematicPayloadStable !== true
  || nebulaBrowserReceipt.admission.scientificPayloadWriteback !== false
  || nebulaBrowserReceipt.admission.consolePageWebglErrorOrWarningCount !== 0
  || nebulaBrowserReceipt.admission.fullFallbackCount !== 0
  || nebulaBrowserReceipt.admission.minimumCinematicRoiNonBlackFraction < 0.02
) throw new Error("v592-nebula-browser-matrix-baseline");

if (
  v591Capability.status !== "qualified-additive-3a-celestial-visual-candidate"
  || v591Signoff.status !== "approved-by-workspace-owner"
  || v591Manifest.manifestSha256 !== "1470fa2a9ac00dfbaa9ab7c0fada6ec70fc2d49fc6c2cb074c66036337a29abe"
  || v591SourceManifest.receiptSha256 !== "af5dfe3e644ad3755999616aaaf75eeb99e058c06f46ba9af01d055305cf13f6"
) throw new Error("v592-v591-baseline-identity");

const frozenExpected = new Map(v591FreezeAfter.frozenSnapshot.map((entry) => [entry.path, entry.sha256]));
const v591OwnedPaths = new Set([
  ...walkFiles("docs/release/v591"),
  ...walkFiles("public/data/celestial-convergence-v591"),
  ...walkFiles("public/textures/candidate-v591"),
  ...walkFiles("public/models/candidate-v591"),
  ...walkFiles("public/fonts/candidate-v591"),
  ...walkFiles("app/local-shadow-v591"),
  ...walkFiles("app").filter((path) => /v591/i.test(path)),
  ...walkFiles("scripts").filter((path) => /v591/i.test(path)),
  ...walkFiles("dist/release").filter((path) => /v591/i.test(path)),
]);
for (const path of v591OwnedPaths) {
  if (!frozenExpected.has(path)) frozenExpected.set(path, sha256(readFileSync(resolve(root, path))));
}
const frozenSnapshot = [...frozenExpected]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([path, expected]) => fileRecord(path, expected));
const frozenDrift = frozenSnapshot.filter((entry) => !entry.status.startsWith("matched"));

let freezeBefore;
if (existsSync(freezeBeforePath)) {
  freezeBefore = verifySealed("docs/release/v592/freeze-before-v592.json", "snapshotSha256");
  if (freezeBefore.frozenSnapshot.length !== frozenSnapshot.length) throw new Error("v592-freeze-before-count-drift");
  for (let index = 0; index < frozenSnapshot.length; index += 1) {
    const expected = freezeBefore.frozenSnapshot[index];
    const current = frozenSnapshot[index];
    if (expected.path !== current.path || expected.sha256 !== current.sha256 || !current.status.startsWith("matched")) {
      throw new Error(`v592-freeze-before-drift:${current.path}`);
    }
  }
} else {
  freezeBefore = writeSealed(freezeBeforePath, {
    version: "v592-frozen-boundary-before-v1",
    generatedAt,
    status: frozenDrift.length === 0 ? "matched" : "blocked-frozen-drift",
    formalProductPointer: "v263",
    baselineCandidate: "v591-readonly",
    v591ManifestSha256: v591Manifest.manifestSha256,
    v591SourceManifestSha256: v591SourceManifest.receiptSha256,
    v591VerificationReceiptSha256: v591Verification.receiptSha256,
    v591CapabilityReportSha256: v591Capability.reportSha256,
    v591HumanVisualSignoffSha256: v591Signoff.receiptSha256,
    frozenSnapshot,
  }, "snapshotSha256");
}

const sourcePaths = new Set([
  ...walkFiles("app").filter((path) => /v592/i.test(path) && path !== "app/data/livingUniverseManifestV592.generated.ts"),
  ...walkFiles("scripts").filter((path) => /v592/i.test(path)),
  "public/data/living-universe-v592/rotation-reference.json",
  "docs/release/v592/rotation-reference-receipt-v592.json",
  "docs/release/v592/acquisition-receipt-rotation-sources-v592.json",
  "docs/release/v592/acquisition-receipt-small-body-rotation-metadata-v592.json",
  "docs/release/v592/metadata-probe-orx-bennu-pck-directory-blocked-v592.json",
  ...smallBodyRotationMetadataReceipt.assets.map((asset) => asset.outputPath),
  "public/data/living-universe-v592/stellar-heroes.json",
  "docs/release/v592/stellar-hero-catalog-receipt-v592.json",
  "docs/release/v592/stellar-browser-capture-v592.json",
  "docs/release/v592/stellar-browser-matrix-receipt-v592.json",
  ...stellarBrowserReceipt.frames.map((frame) => frame.screenshotPath),
  gaiaLitePath,
  "public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json",
  "docs/release/v592/gaia-stratified-supplement-receipt-v592.json",
  gaiaSupplementReceipt.output.path,
  "docs/release/v592/gaia-constellation-browser-capture-v592.json",
  "docs/release/v592/gaia-constellation-browser-matrix-receipt-v592.json",
  ...gaiaConstellationBrowserReceipt.frames.map((frame) => frame.screenshotPath),
  "docs/release/v592/constellation-art-reference-receipt-v592.json",
  "docs/release/v592/constellation-art-browser-capture-v592.json",
  "docs/release/v592/constellation-art-browser-matrix-receipt-v592.json",
  ...constellationArtBrowserReceipt.frames.map((frame) => frame.screenshotPath),
  "docs/release/v592/browser-url-policy-negative-evidence-v592.json",
  "docs/release/v592/nebula-asset-metadata-admission-v592.json",
  "docs/release/v592/acquisition-receipt-nebula-item-metadata-v592.json",
  "docs/release/v592/nebula-item-license-review-v592.json",
  "docs/release/v592/acquisition-receipt-nebula-visual-sources-v592.json",
  "docs/release/v592/nebula-source-visual-analysis-v592.json",
  "public/data/living-universe-v592/nebula-visual-assets.json",
  "docs/release/v592/nebula-visual-assets-receipt-v592.json",
  "docs/release/v592/nebula-browser-capture-v592.json",
  "docs/release/v592/nebula-browser-matrix-receipt-v592.json",
  ...nebulaBrowserReceipt.frames.map((frame) => frame.screenshotPath),
  "docs/release/v592/metadata-probe-nebula-broad-v592.json",
  "docs/release/v592/metadata-probe-nebula-broad-page2-v592.json",
  "docs/release/v592/metadata-probe-nebula-broad-page3-v592.json",
  "docs/release/v592/nebula-extended-item-metadata-v592.json",
  "docs/release/v592/nebula-extended-visual-acquisition-v592.json",
  "docs/release/v592/nebula-final-item-metadata-v592.json",
  "docs/release/v592/nebula-final-visual-acquisition-v592.json",
  "docs/release/v592/nebula-closure-item-metadata-v592.json",
  "docs/release/v592/nebula-closure-visual-acquisition-v592.json",
  "docs/release/v592/nebula-closure2-item-metadata-v592.json",
  "docs/release/v592/nebula-closure2-visual-acquisition-v592.json",
  "public/data/living-universe-v592/nebula-extended-visual-assets.json",
  "docs/release/v592/nebula-extended-visual-assets-receipt-v592.json",
  "public/data/living-universe-v592/nebula-closure-visual-assets.json",
  "docs/release/v592/nebula-closure-visual-assets-receipt-v592.json",
  "docs/release/v592/nebula-overlay-browser-capture-v592.json",
  "docs/release/v592/nebula-overlay-browser-matrix-receipt-v592.json",
  ...nebulaOverlayBrowserReceipt.frames.map((frame) => frame.screenshotPath),
  ...walkFiles("source-cache/v592/nebulae/visual-extended"),
  ...walkFiles("public/textures/candidate-v592/nebulae-extended-v592"),
  ...walkFiles("public/textures/candidate-v592/nebulae-closure-v592"),
  ...walkFiles("docs/release/v592/metadata-probe-nebulae"),
  ...walkFiles("docs/release/v592/metadata-probe-nebula-assets"),
  ...nebulaItemMetadataAcquisition.assets.map((asset) => asset.outputPath),
  ...nebulaVisualSourceAcquisition.assets.map((asset) => asset.outputPath),
  ...walkFiles("public/textures/candidate-v592/nebulae-v592"),
  "public/data/living-universe-v592/major-moons-reference.json",
  "docs/release/v592/major-moons-reference-receipt-v592.json",
  "docs/release/v592/major-moon-asset-metadata-admission-v592.json",
  "docs/release/v592/acquisition-receipt-major-moon-item-metadata-v592.json",
  "docs/release/v592/major-moon-item-license-review-v592.json",
  "docs/release/v592/acquisition-receipt-major-moon-visual-sources-v592.json",
  "docs/release/v592/major-moon-source-visual-analysis-v592.json",
  "public/data/living-universe-v592/major-moon-visual-assets.json",
  "docs/release/v592/major-moon-visual-assets-receipt-v592.json",
  "docs/release/v592/major-moon-browser-capture-v592.json",
  "docs/release/v592/major-moon-browser-matrix-receipt-v592.json",
  "docs/release/v592/major-moon-secondary-visual-evidence-v592.json",
  "docs/release/v592/acquisition-receipt-callisto-photojournal-tif-v592.json",
  "docs/release/v592/acquisition-receipt-callisto-hemispherical-tif-v592.json",
  "docs/release/v592/major-moon-secondary-visual-projection-review-v592.json",
  "scripts/v592-major-moon-usgs-final-visual-sources.json",
  "scripts/acquire-v592-major-moon-usgs-final-visual-sources.mjs",
  "scripts/analyze-v592-major-moon-usgs-final-visual-sources.mjs",
  "docs/release/v592/acquisition-receipt-major-moon-usgs-final-visual-sources-v592.json",
  "docs/release/v592/major-moon-usgs-final-source-visual-analysis-v592.json",
  "docs/release/v592/major-moon-alternative-source-negative-evidence-v592.json",
  ...walkFiles("docs/release/v592/metadata-probe-major-moon-alternatives"),
  "docs/release/v592/metadata-probe-major-moon-official-collections-v592.json",
  "docs/release/v592/metadata-probe-major-moon-secondary-products-v592.json",
  "docs/release/v592/acquisition-receipt-major-moon-official-preview-assets-v592.json",
  "docs/release/v592/acquisition-receipt-major-moon-nasa3d-textures-v592.json",
  "docs/release/v592/major-moon-nasa3d-visual-analysis-v592.json",
  "docs/release/v592/major-moon-nasa3d-negative-evidence-v592.json",
  "scripts/probe-v592-major-moon-official-collections.mjs",
  "scripts/probe-v592-major-moon-secondary-products.mjs",
  "scripts/acquire-v592-major-moon-official-preview-assets.mjs",
  "scripts/acquire-v592-major-moon-nasa3d-textures.mjs",
  "scripts/analyze-v592-major-moon-nasa3d-textures.mjs",
  "scripts/build-v592-major-moon-nasa3d-negative-evidence.mjs",
  "scripts/build-v592-major-moon-official-preview-variants.mjs",
  "source-cache/v592/major-moons/official-collections/jupiter-voyager-galileo-global-mosaics.html",
  "source-cache/v592/major-moons/official-collections/saturn-voyager-airbrush-global-products.html",
  "source-cache/v592/major-moons/official-collections/new-horizon-global-mosaics.html",
  "source-cache/v592/major-moons/official-collections/planetary-globes.html",
  ...walkFiles("source-cache/v592/major-moons/secondary-products"),
  ...walkFiles("source-cache/v592/major-moons/official-preview"),
  ...walkFiles("source-cache/v592/major-moons/nasa-3d-resources"),
  "docs/release/v592/metadata-probe-major-moon-official-collections-v592.json",
  "docs/release/v592/metadata-probe-major-moon-secondary-products-v592.json",
  "docs/release/v592/acquisition-receipt-major-moon-official-preview-assets-v592.json",
  "source-cache/v592/major-moons/jpl-photojournal/PIA03876.tif",
  "source-cache/v592/major-moons/jpl-photojournal/details/callisto-hemispherical-globes.html",
  ...majorMoonBrowserReceipt.frames.map((frame) => frame.screenshotPath),
  ...walkFiles("docs/release/v592/metadata-probe-major-moons"),
  ...walkFiles("docs/release/v592/metadata-probe-major-moon-assets"),
  ...majorMoonItemMetadataReceipt.assets.map((asset) => asset.outputPath),
  ...majorMoonVisualSourceAcquisition.assets.map((asset) => asset.outputPath),
  ...walkFiles("public/textures/candidate-v592/major-moons"),
  "public/data/living-universe-v592/deep-space-reference.json",
  "docs/release/v592/deep-space-reference-receipt-v592.json",
  "docs/release/v592/acquisition-receipt-deep-space-item-metadata-v592.json",
  "docs/release/v592/deep-space-item-license-review-v592.json",
  "docs/release/v592/acquisition-receipt-deep-space-visual-sources-v592.json",
  "docs/release/v592/deep-space-source-visual-analysis-v592.json",
  "docs/release/v592/deep-space-alternative-item-license-review-v592.json",
  "docs/release/v592/deep-space-alternative-contact-sheet-receipt-v592.json",
  deepSpaceAlternativeContactSheetReceipt.output.path,
  "docs/release/v592/deep-space-alternative-source-visual-analysis-v592.json",
  "public/data/gaia-dr3-presentation-10000000-v9/manifest.json",
  "public/data/gaia-dr3-presentation-10000000-v9/catalog-v9.bin",
  "public/data/openngc-v260/manifest.json",
  "public/data/openngc-v260/openngc-v260.json.gz",
  "public/data/openngc-v260/CC-BY-SA-4.0.txt",
  "public/data/living-universe-v592/deep-space-visual-assets.json",
  "docs/release/v592/deep-space-visual-assets-receipt-v592.json",
  "docs/release/v592/deep-space-browser-capture-v592.json",
  "docs/release/v592/deep-space-browser-matrix-receipt-v592.json",
  ...deepSpaceBrowserReceipt.frames.map((frame) => frame.screenshotPath),
  "docs/release/v592/deep-space-analytic-browser-capture-v592.json",
  "docs/release/v592/deep-space-analytic-browser-matrix-receipt-v592.json",
  ...deepSpaceAnalyticBrowserReceipt.frames.map((frame) => frame.screenshotPath),
  ...walkFiles("docs/release/v592/metadata-probe-deep-space"),
  ...walkFiles("docs/release/v592/metadata-probe-deep-space-assets"),
  ...walkFiles("docs/release/v592/metadata-probe-deep-space-alternatives"),
  ...walkFiles("docs/release/v592/metadata-probe-deep-space-alternatives-v2"),
  ...walkFiles("docs/release/v592/metadata-probe-deep-space-cluster-alternatives"),
  "docs/release/v592/deep-space-cluster-alternative-negative-evidence-v592.json",
  ...walkFiles("docs/release/v592/metadata-probe-deep-space-alternative-assets"),
  ...walkFiles("docs/release/v592/acquisition-receipt-deep-space-alternative-item-metadata"),
  ...walkFiles("docs/release/v592/acquisition-receipt-deep-space-alternative-visual-sources"),
  ...deepSpaceItemMetadataAcquisition.assets.map((asset) => asset.outputPath),
  ...deepSpaceVisualSourceAcquisition.assets.map((asset) => asset.outputPath),
  ...deepSpaceAlternativeVisualAnalysis.analyses.flatMap((entry) => [entry.sourcePath]),
  ...walkFiles("source-cache/v592/deep-space/alternative-metadata"),
  ...walkFiles("public/textures/candidate-v592/deep-space-v592"),
  majorMoonPacket.sources.rotation.path,
  majorMoonPacket.sources.orbit.path,
  rotationPacket.source.path,
]);
const sourceFiles = [...sourcePaths].sort().map((path) => fileRecord(path));
const sourceManifest = writeSealed(resolve(docsRoot, "source-manifest-v592.json"), {
  version: "v592-source-manifest-v2",
  generatedAt,
  status: sourceFiles.every((entry) => entry.status === "matched") ? "complete" : "blocked-missing-source",
  postBuildEvidencePolicy: {
    excludedFromRuntimeSourceIdentity: true,
    verificationScope: "capability-and-readonly-verifier",
    liveMatrixReceiptPath: "docs/release/v592/browser-live-matrix-receipt-v592.json",
    soakReceiptPath: "docs/release/v592/browser-soak-resource-receipt-v592.json",
    scientificPayloadWriteback: false,
  },
  files: sourceFiles,
}, "receiptSha256");

function readBuildGate(path, expectedTier, expectedDistDir) {
  const absolute = resolve(root, path);
  if (!existsSync(absolute)) return {
    path,
    fileSha256: null,
    status: "not-run",
    qualified: false,
    reason: "receipt-missing",
    buildId: null,
    distDir: expectedDistDir,
    deliveryTier: expectedTier,
    rollbackSlotAvailable: false,
    routeManifestSha256: null,
  };
  const bytes = readFileSync(absolute);
  const receipt = JSON.parse(bytes.toString("utf8"));
  const routeManifestPath = resolve(root, expectedDistDir, "server/app-paths-manifest.json");
  const routeManifestBytes = existsSync(routeManifestPath) ? readFileSync(routeManifestPath) : null;
  let routeIncluded = false;
  if (routeManifestBytes) {
    const routes = JSON.parse(routeManifestBytes.toString("utf8"));
    routeIncluded = routes["/local-shadow-v592/page"] === "app/local-shadow-v592/page.js";
  }
  const qualified = receipt.version === "v562-atlas-build-resource-receipt-v1"
    && receipt.status === "passed"
    && receipt.profile === "local-shadow"
    && receipt.distDir === expectedDistDir
    && receipt.deliveryTier === expectedTier
    && receipt.candidateSourceManifestSha256 === sourceManifest.receiptSha256
    && receipt.heapMb === 8192
    && receipt.lowMemoryMode === true
    && receipt.heapPolicyMaximumReached === true
    && receipt.standaloneTopologyQualified === true
    && receipt.rollbackSlotAvailable === true
    && receipt.browserStarted === false
    && receipt.denseStarted === false
    && receipt.gpuStarted === false
    && routeIncluded;
  return {
    path,
    fileSha256: sha256(bytes),
    status: qualified ? "passed" : receipt.status === "passed" ? "stale-or-incomplete" : receipt.status ?? "invalid",
    qualified,
    reason: qualified ? "none" : receipt.candidateSourceManifestSha256 !== sourceManifest.receiptSha256
      ? "source-manifest-mismatch"
      : !receipt.rollbackSlotAvailable ? "rollback-slot-unavailable"
        : !routeIncluded ? "v592-route-missing" : "receipt-policy-mismatch",
    buildId: typeof receipt.buildId === "string" ? receipt.buildId : null,
    distDir: expectedDistDir,
    deliveryTier: expectedTier,
    rollbackSlotAvailable: receipt.rollbackSlotAvailable === true,
    routeManifestSha256: routeManifestBytes ? sha256(routeManifestBytes) : null,
  };
}

const standaloneBuildGate = readBuildGate(
  "dist/release/atlas-v592-standalone-build-resource.json",
  "standalone-full",
  ".next-atlas-v592-standalone-current",
);
const liteBuildGate = readBuildGate(
  "dist/release/atlas-v592-lite-build-resource.json",
  "vercel-lite",
  ".next-atlas-v592-lite-current",
);
const v591LiteTotalBytes = v591Capability.capabilities.budgetChecks.liteTotal.actualBytes;
const v591FullCompressedBytes = v591Capability.capabilities.budgetChecks.fullCompressed.actualBytes;
const v592LiteIncrementBytes = nebulaVisualAssetsReceipt.liteIncrementBytes
  + nebulaExtendedVisualAssetsReceipt.liteIncrementBytes
  + nebulaClosureVisualAssetsReceipt.liteIncrementBytes
  + majorMoonVisualAssetsReceipt.liteIncrementBytes
  + deepSpaceVisualAssetsReceipt.liteIncrementBytes;
const v592FullIncrementBytes = nebulaVisualAssetsReceipt.fullRuntimeBytes
  + nebulaExtendedVisualAssetsReceipt.fullRuntimeBytes
  + nebulaClosureVisualAssetsReceipt.fullRuntimeBytes
  + majorMoonVisualAssetsReceipt.fullRuntimeBytes
  + deepSpaceVisualAssetsReceipt.fullRuntimeBytes;
const projectedLiteTotalBytes = v591LiteTotalBytes + v592LiteIncrementBytes;
const projectedFullCompressedBytes = v591FullCompressedBytes + v592FullIncrementBytes;
const liteTotalMaximumBytes = 82 * 1024 * 1024;
const fullCompressedMaximumBytes = 750 * 1024 * 1024;

const manifest = writeSealed(manifestPath, {
  version: "v592-living-universe-candidate-v1",
  generatedAt,
  status: "implemented-core-with-blocked-gates",
  route: "/local-shadow-v592",
  namespace: "living-universe-v592",
  formalProductPointer: "v263",
  baseline: {
    candidate: "v591-readonly",
    manifestSha256: v591Manifest.manifestSha256,
    sourceManifestSha256: v591SourceManifest.receiptSha256,
    humanVisualSignoffSha256: v591Signoff.receiptSha256,
  },
  governance: {
    freezeBeforeSha256: freezeBefore.snapshotSha256,
    frozenEntryCount: frozenSnapshot.length,
    frozenDriftCount: frozenDrift.length,
    sourceManifestSha256: sourceManifest.receiptSha256,
    additiveOnly: true,
    v591MutationAllowed: false,
  },
  clock: {
    version: "CelestialClockV592",
    absoluteJulianDate: true,
    perFrameIntegration: false,
    ratesSecondsPerSecond: [-86400, -3600, 0, 1, 60, 3600, 86400],
    reverseTime: true,
  },
  rotation: {
    packetSha256: rotationPacket.packetSha256,
    sourceSha256: rotationPacket.source.sha256,
    admittedCount: rotationPacket.admission.admittedCount,
    kinematicAdmittedCount: rotationPacket.admission.kinematicAdmittedCount,
    requiredCount: rotationPacket.admission.requiredCount,
    incompleteBodies: rotationPacket.admission.incompleteBodies,
    acquisitionStatus: acquisitionReceipt.status,
    bennuOrxPckDirectoryProbe: {
      status: orxBennuPckProbe.status,
      requestCount: orxBennuPckProbe.requestCount,
      payloadDownloaded: orxBennuPckProbe.payloadDownloaded,
      receiptSha256: orxBennuPckProbe.receiptSha256,
    },
    sunDifferentialRotation: "bounded-presentation-physics-model",
  },
  stellarHeroes: {
    packetSha256: stellarHeroPacket.packetSha256,
    browserMatrixReceiptSha256: stellarBrowserReceipt.receiptSha256,
    catalogCount: stellarHeroPacket.admission.catalogPacketCount,
    browserAdmittedCount: stellarBrowserReceipt.admission.stellarHeroCount,
    browserFrameCount: stellarBrowserReceipt.frames.length,
    scienceCinematicPayloadStable: stellarBrowserReceipt.admission.scienceCinematicPayloadStable,
    scientificPayloadWriteback: false,
    humanVisualSignoff: stellarBrowserReceipt.admission.humanVisualSignoff,
  },
  starfield: {
    runtime: "additive-v592-worker-direct-public-sha-verified",
    catalogPath: gaiaLitePath,
    catalogSha256: gaiaLite.sha256,
    catalogBytes: gaiaLite.bytes,
    catalogRecordCount: 46_000,
    fullDesktopBudget: 60_000,
    fullDesktopCurrentCount: 60_000,
    fullSupplementStatus: "qualified-14000-stratified-no-lite-overlap-browser-passed",
    fullSupplementPath: gaiaSupplementReceipt.output.path,
    fullSupplementSha256: gaiaSupplementReceipt.output.sha256,
    fullSupplementBytes: gaiaSupplementReceipt.output.bytes,
    fullSupplementRecordCount: gaiaSupplementReceipt.output.recordCount,
    fullSupplementReceiptSha256: gaiaSupplementReceipt.receiptSha256,
    browserMatrixReceiptSha256: gaiaConstellationBrowserReceipt.receiptSha256,
    browserFrameCount: gaiaConstellationBrowserReceipt.frames.length,
    browserMinimumFpsMedian: gaiaConstellationBrowserReceipt.admission.minimumFpsMedian,
    liteDesktopBudget: 30_000,
    fullMobileBudget: 18_000,
    liteMobileBudget: 10_000,
    randomParallax: false,
    scientificPayloadWriteback: false,
  },
  constellations: {
    inheritedPacketSha256: constellationPacket.packetSha256,
    runtimeScienceLayerImplemented: true,
    constellationCount: constellationPacket.bindings.length,
    waypointCount: constellationPacket.bindings.reduce((sum, binding) => sum + binding.waypoints.length, 0),
    maximumAngularDistanceDeg: constellationPacket.metrics.maximumAngularDistanceDeg,
    defaultDesktopCount: 12,
    defaultMobileCount: 8,
    artAdmissionCount: constellationArtReferenceReceipt.admission.admittedCount,
    artPrimaryModel: constellationArtReferenceReceipt.primaryModel,
    artReferenceReceiptSha256: constellationArtReferenceReceipt.receiptSha256,
    artBrowserGate: "passed-three-focus-science-cinematic-desktop-mobile",
    artBrowserMatrixReceiptSha256: constellationArtBrowserReceipt.receiptSha256,
    artBrowserFrameCount: constellationArtBrowserReceipt.admission.frameCount,
    artBrowserMinimumFpsMedian: constellationArtBrowserReceipt.admission.minimumFpsMedian,
    externalIllustrationAssetCount: constellationArtReferenceReceipt.admission.externalIllustrationAssetCount,
    proceduralArtFallbackAllowed: false,
    browserGate: "passed-88-of-88-science-runtime-focus-matrix",
    browserMatrixReceiptSha256: gaiaConstellationBrowserReceipt.receiptSha256,
    browserFrameCount: gaiaConstellationBrowserReceipt.frames.length,
    focusedCodes: gaiaConstellationBrowserReceipt.admission.focusedConstellationCodes,
    iauBoundaryAdmission: gaiaConstellationBrowserReceipt.admission.iauBoundaryAdmission,
    scientificPayloadWriteback: false,
  },
  deepSpace: {
    inheritedNebulaCount: 6,
    requiredNebulaCount: 24,
    metadataSelectedTargetCount: nebulaAssetMetadataAdmission.summary.selectedTargetCount,
    metadataProbeCompleteCount: nebulaAssetMetadataAdmission.summary.metadataProbeCompleteCount,
    explicitHttpsAcquisitionCandidateCount: nebulaAssetMetadataAdmission.summary.explicitHttpsAcquisitionCandidateCount,
    terminalBlockedNoRetryCount: nebulaAssetMetadataAdmission.summary.terminalBlockedCount,
    payloadDownloadedCount: nebulaAssetMetadataAdmission.summary.payloadDownloadedCount,
    itemMetadataAcquiredCount: nebulaItemMetadataAcquisition.assets.length,
    visualSourceAcquiredCount: nebulaVisualSourceAcquisition.assets.length,
    visualSourceCoverageBlockedCount: nebulaVisualAnalysis.summary.visualCoverageBlockedCount,
    expandedAssetAdmissionCount: nebulaVisualAssets.admission.runtimeAssetAdmittedCount + nebulaExtendedVisualAssets.admission.runtimeAssetAdmittedCount + nebulaClosureVisualAssets.admission.runtimeAssetAdmittedCount,
    expandedAssetGoalCoverageCount: 24,
    visualAssetManifestSha256: nebulaVisualAssets.manifestSha256,
    visualAssetReceiptSha256: nebulaVisualAssetsReceipt.receiptSha256,
    visualFullRuntimeBytes: nebulaVisualAssetsReceipt.fullRuntimeBytes,
    visualLiteIncrementBytes: nebulaVisualAssetsReceipt.liteIncrementBytes,
    visualAssetTargets: nebulaVisualAssets.admission.admittedTargets,
    extendedOverlayManifestSha256: nebulaExtendedVisualAssets.manifestSha256,
    extendedOverlayReceiptSha256: nebulaExtendedVisualAssetsReceipt.receiptSha256,
    extendedOverlayAssetCount: nebulaExtendedVisualAssets.admission.runtimeAssetAdmittedCount,
    extendedOverlayFullRuntimeBytes: nebulaExtendedVisualAssetsReceipt.fullRuntimeBytes,
    extendedOverlayLiteIncrementBytes: nebulaExtendedVisualAssetsReceipt.liteIncrementBytes,
    closureOverlayManifestSha256: nebulaClosureVisualAssets.manifestSha256,
    closureOverlayReceiptSha256: nebulaClosureVisualAssetsReceipt.receiptSha256,
    closureOverlayAssetCount: nebulaClosureVisualAssets.admission.runtimeAssetAdmittedCount,
    closureOverlayFullRuntimeBytes: nebulaClosureVisualAssetsReceipt.fullRuntimeBytes,
    closureOverlayLiteIncrementBytes: nebulaClosureVisualAssetsReceipt.liteIncrementBytes,
    overlayBrowserGate: "passed-12-of-12-four-profile-overlay-matrix",
    overlayBrowserMatrixReceiptSha256: nebulaOverlayBrowserReceipt.receiptSha256,
    overlayBrowserFrameCount: nebulaOverlayBrowserReceipt.admission.frameCount,
    overlayBrowserMinimumFpsMedian: nebulaOverlayBrowserReceipt.admission.minimumFpsMedian,
    overlayBrowserScienceMarkerOnlyFrameCount: nebulaOverlayBrowserReceipt.admission.scienceMarkerOnlyFrameCount,
    overlayBrowserNativeKtx2CinematicFrameCount: nebulaOverlayBrowserReceipt.admission.nativeKtx2CinematicFrameCount,
    overlayBrowserSingleCanvas: nebulaOverlayBrowserReceipt.admission.singleCanvas,
    overlayBrowserPayloadStable: nebulaOverlayBrowserReceipt.admission.scienceCinematicPayloadStable,
    browserGate: "passed-six-of-six-three-profile-native-ktx2-matrix",
    browserMatrixReceiptSha256: nebulaBrowserReceipt.receiptSha256,
    browserFrameCount: nebulaBrowserReceipt.admission.frameCount,
    browserMinimumFpsMedian: nebulaBrowserReceipt.admission.minimumFpsMedian,
    browserPeakDesktopGpuBytes: nebulaBrowserReceipt.admission.peakDesktopGpuBytes,
    browserPeakMobileGpuBytes: nebulaBrowserReceipt.admission.peakMobileGpuBytes,
    browserPeakDrawCalls: nebulaBrowserReceipt.admission.peakDrawCalls,
    metadataAdmissionReceiptSha256: nebulaAssetMetadataAdmission.receiptSha256,
    visualSourceAcquisitionReceiptSha256: nebulaVisualSourceAcquisition.receiptSha256,
    visualAnalysisReceiptSha256: nebulaVisualAnalysis.receiptSha256,
    payloadAdmission: "requires-separate-explicit-https-acquisition-and-license-review",
    scientificPayloadWriteback: false,
    referencePacketSha256: deepSpaceReference.packetSha256,
    referenceReceiptSha256: deepSpaceReferenceReceipt.receiptSha256,
    galaxyReferenceAdmissionCount: deepSpaceReference.admission.admittedGalaxyReferenceCount,
    clusterReferenceAdmissionCount: deepSpaceReference.admission.admittedClusterReferenceCount,
    deepObjectVisualMetadataCandidateCount: deepSpaceReference.admission.visualMetadataCandidateCount,
    deepObjectVisualMetadataBlockedCount: deepSpaceReference.admission.visualMetadataBlockedCount,
    deepObjectReferenceVisualAssetAdmissionCount: deepSpaceReference.admission.visualAssetAdmittedCount,
    deepObjectVisualAssetAdmissionCount: deepSpaceVisualAssets.admission.totalAssetAdmittedCount,
    galaxyVisualAssetAdmissionCount: deepSpaceVisualAssets.admission.admittedGalaxyAssetCount,
    clusterVisualAssetAdmissionCount: deepSpaceVisualAssets.admission.admittedClusterAssetCount,
    deepObjectVisualAssetBlockedCount: deepSpaceVisualAssets.admission.blockedCount,
    deepObjectVisualAssetTargets: [
      ...deepSpaceVisualAssets.admission.admittedGalaxies,
      ...deepSpaceVisualAssets.admission.admittedClusters,
    ],
    deepObjectVisualAssetManifestSha256: deepSpaceVisualAssets.manifestSha256,
    deepObjectVisualAssetReceiptSha256: deepSpaceVisualAssetsReceipt.receiptSha256,
    deepObjectSecondaryProbeNegativeEvidenceReceiptSha256: deepSpaceSecondaryProbeNegativeEvidence.receiptSha256,
    deepObjectSecondaryMetadataProbeCount: deepSpaceSecondaryProbeNegativeEvidence.summary.metadataProbeCount,
    deepObjectSecondaryItemMetadataAcquisitionCount: deepSpaceSecondaryProbeNegativeEvidence.summary.itemMetadataAcquisitionCount,
    deepObjectSecondaryVisualPayloadDownloadedCount: deepSpaceSecondaryProbeNegativeEvidence.summary.visualPayloadDownloadedCount,
    deepObjectSecondaryRuntimeAssetAdmittedCount: deepSpaceSecondaryProbeNegativeEvidence.summary.runtimeAssetAdmittedCount,
    deepObjectClusterAlternativeNegativeEvidenceReceiptSha256: deepSpaceClusterAlternativeNegativeEvidence.receiptSha256,
    deepObjectClusterAlternativeMetadataProbeCount: deepSpaceClusterAlternativeNegativeEvidence.summary.metadataProbeCount,
    deepObjectClusterAlternativeQualifiedVisualTextureCount: deepSpaceClusterAlternativeNegativeEvidence.summary.qualifiedVisualTextureCount,
    deepObjectClusterAlternativeBlockedTargetCount: deepSpaceClusterAlternativeNegativeEvidence.summary.blockedTargetCount,
    deepObjectAlternativeLicenseReviewReceiptSha256: deepSpaceAlternativeLicenseReview.receiptSha256,
    deepObjectAlternativeContactSheetReceiptSha256: deepSpaceAlternativeContactSheetReceipt.receiptSha256,
    deepObjectAlternativeVisualAnalysisReceiptSha256: deepSpaceAlternativeVisualAnalysis.receiptSha256,
    deepObjectGaiaCatalogManifestSha256: gaiaPresentationManifest.manifestSha256,
    deepObjectGaiaCatalogManifestFileSha256: gaiaPresentationManifestFile.sha256,
    deepObjectGaiaCatalogArchiveSha256: gaiaPresentationArchive.sha256,
    deepObjectItemMetadataReceiptSha256: deepSpaceItemMetadataAcquisition.receiptSha256,
    deepObjectLicenseReviewReceiptSha256: deepSpaceLicenseReview.receiptSha256,
    deepObjectVisualSourceReceiptSha256: deepSpaceVisualSourceAcquisition.receiptSha256,
    deepObjectVisualAnalysisReceiptSha256: deepSpaceVisualAnalysis.receiptSha256,
    deepObjectItemMetadataAcquiredCount: deepSpaceItemMetadataAcquisition.assets.length,
    deepObjectVisualSourceAcquiredCount: deepSpaceVisualSourceAcquisition.assets.length + deepSpaceAlternativeVisualAnalysis.analyses.length,
    deepObjectFullRuntimeBytes: deepSpaceVisualAssetsReceipt.fullRuntimeBytes,
    deepObjectLiteIncrementBytes: deepSpaceVisualAssetsReceipt.liteIncrementBytes,
    deepObjectAlternativeVisualDerivationCandidateCount: deepSpaceAlternativeVisualAnalysis.summary.runtimeDerivationCandidateCount,
    deepObjectAlternativeCleanAlternateHeldCount: deepSpaceAlternativeVisualAnalysis.summary.cleanRedundantAlternateHeldCount,
    deepObjectAlternativeScientificOverlayBlockedCount: deepSpaceAlternativeVisualAnalysis.summary.scientificOverlayBlockedCount,
    deepObjectGaiaCatalogDerivedVisualModelCount: deepSpaceVisualAssetsReceipt.gaiaCatalogDerivedVisualModelCount,
    deepObjectGaiaCatalogPayloadReusedFromExistingAdmission: deepSpaceVisualAssetsReceipt.gaiaCatalogPayloadReusedFromExistingAdmission,
    deepObjectBrowserGate: "passed-18-of-18-four-profile-deep-space-browser-matrix",
    deepObjectBrowserMatrixReceiptSha256: deepSpaceBrowserReceipt.receiptSha256,
    deepObjectBrowserCaptureSha256: deepSpaceBrowserReceipt.source.captureSha256,
    deepObjectBrowserFrameCount: deepSpaceBrowserReceipt.admission.frameCount,
    deepObjectBrowserMinimumFpsMedian: deepSpaceBrowserReceipt.admission.minimumFpsMedian,
    deepObjectBrowserPeakDesktopGpuBytes: deepSpaceBrowserReceipt.admission.peakDesktopGpuBytes,
    deepObjectBrowserPeakMobileGpuBytes: deepSpaceBrowserReceipt.admission.peakMobileGpuBytes,
    deepObjectBrowserPeakDrawCalls: deepSpaceBrowserReceipt.admission.peakDrawCalls,
    deepObjectBrowserSingleCanvas: deepSpaceBrowserReceipt.admission.singleCanvas,
    deepObjectBrowserPayloadStable: deepSpaceBrowserReceipt.admission.scienceCinematicPayloadStable,
    deepObjectBrowserReleaseRestorePassed: deepSpaceBrowserReceipt.admission.releaseRestorePassed,
    deepObjectAnalyticBrowserGate: "passed-24-of-24-six-openngc-analytic-galaxies-four-profile-browser-matrix",
    deepObjectAnalyticBrowserMatrixReceiptSha256: deepSpaceAnalyticBrowserReceipt.receiptSha256,
    deepObjectAnalyticBrowserCaptureSha256: deepSpaceAnalyticBrowserReceipt.source.captureSha256,
    deepObjectAnalyticBrowserFrameCount: deepSpaceAnalyticBrowserReceipt.admission.frameCount,
    deepObjectAnalyticBrowserMinimumFpsMedian: deepSpaceAnalyticBrowserReceipt.admission.minimumFpsMedian,
    deepObjectAnalyticBrowserPeakDesktopGpuBytes: deepSpaceAnalyticBrowserReceipt.admission.peakDesktopGpuBytes,
    deepObjectAnalyticBrowserPeakMobileGpuBytes: deepSpaceAnalyticBrowserReceipt.admission.peakMobileGpuBytes,
    deepObjectAnalyticBrowserPeakDrawCalls: deepSpaceAnalyticBrowserReceipt.admission.peakDrawCalls,
    deepObjectAnalyticBrowserSingleCanvas: deepSpaceAnalyticBrowserReceipt.admission.singleCanvas,
    deepObjectAnalyticBrowserPayloadStable: deepSpaceAnalyticBrowserReceipt.admission.scienceCinematicPayloadStable,
    deepObjectAnalyticBrowserReleaseRestorePassed: deepSpaceAnalyticBrowserReceipt.admission.releaseRestorePassed,
    deepObjectPayloadDownloadedCount: 0,
    deepObjectPrimaryVisualSourcePayloadDownloadedCount: deepSpaceVisualSourceAcquisition.assets.length,
    deepObjectAlternativeVisualSourcePayloadDownloadedCount: deepSpaceAlternativeVisualAnalysis.analyses.length,
    deepObjectVisualSourcePayloadDownloadedCount: deepSpaceVisualSourceAcquisition.assets.length + deepSpaceAlternativeVisualAnalysis.analyses.length,
    deepObjectScienceImagePayload: false,
    deepObjectPresentationOnly: true,
  },
  majorMoons: {
    requiredCount: majorMoonPacket.admission.requiredCount,
    motionReferenceAdmittedCount: majorMoonPacket.admission.motionReferenceAdmittedCount,
    orbitReferenceAdmittedCount: majorMoonPacket.admission.orbitReferenceAdmittedCount,
    referencePacketVisualAssetAdmittedCount: majorMoonPacket.admission.visualAssetAdmittedCount,
    visualAssetAdmittedCount: majorMoonVisualAssets.admission.albedoAssetAdmittedCount,
    heroAdmittedCount: majorMoonVisualAssets.admission.heroAdmittedCount,
    runtimeHeroCandidateCount: majorMoonBrowserReceipt.admission.runtimeHeroCandidateCount,
    runtimeHeroCandidateIds: majorMoonBrowserReceipt.admission.runtimeHeroCandidateIds,
    browserMatrixReceiptSha256: majorMoonBrowserReceipt.receiptSha256,
    assetBlockedBodies: majorMoonVisualAssets.admission.blockedBodies,
    packetSha256: majorMoonPacket.packetSha256,
    receiptSha256: majorMoonReceipt.receiptSha256,
    assetMetadataAdmissionReceiptSha256: majorMoonAssetMetadataAdmission.receiptSha256,
    itemMetadataAcquisitionReceiptSha256: majorMoonItemMetadataReceipt.receiptSha256,
    itemLicenseReviewReceiptSha256: majorMoonLicenseReview.receiptSha256,
    visualSourceAcquisitionReceiptSha256: majorMoonVisualSourceAcquisition.receiptSha256,
    visualSourceAnalysisReceiptSha256: majorMoonVisualAnalysis.receiptSha256,
    officialCollectionMetadataReceiptSha256: majorMoonOfficialCollectionMetadata.receiptSha256,
    secondaryProductMetadataReceiptSha256: majorMoonSecondaryProductMetadata.receiptSha256,
    officialPreviewAssetCount: majorMoonOfficialPreviewAcquisition.assets.length,
    officialPreviewSourceResolutionLimited: majorMoonOfficialPreviewAcquisition.assets.every((asset) => asset.width === 1024 && asset.height === 512),
    officialPreviewAcquisitionReceiptSha256: majorMoonOfficialPreviewAcquisition.receiptSha256,
    visualAssetManifestSha256: majorMoonVisualAssets.manifestSha256,
    visualAssetReceiptSha256: majorMoonVisualAssetsReceipt.receiptSha256,
    secondaryVisualEvidenceReceiptSha256: majorMoonSecondaryVisualEvidence.receiptSha256,
    secondaryVisualEvidenceStatus: majorMoonSecondaryVisualEvidence.status,
    secondaryVisualQualifiedGlobalTextureCount: majorMoonSecondaryVisualEvidence.admission.qualifiedGlobalTextureCount,
    usgsFinalSourceAcquisitionStatus: majorMoonUsGsFinalAcquisition.status,
    usgsFinalSourceAcquisitionReceiptSha256: majorMoonUsGsFinalAcquisition.receiptSha256,
    usgsFinalSourceRequestedCount: majorMoonUsGsFinalAcquisition.requestedUrls.length,
    usgsFinalSourceAcquiredCount: majorMoonUsGsFinalAcquisition.assets.length,
    usgsFinalSourceTerminalFailureCount: majorMoonUsGsFinalAcquisition.failures.length,
    usgsFinalSourceFailedTargets: majorMoonUsGsFinalAnalysis.failedTargets,
    usgsFinalSourceAnalysisStatus: majorMoonUsGsFinalAnalysis.status,
    usgsFinalSourceAnalysisReceiptSha256: majorMoonUsGsFinalAnalysis.receiptSha256,
    alternativeMetadataProbeCount: majorMoonAlternativeNegativeEvidence.summary.metadataProbeCount,
    alternativeOfficialCandidateCount: majorMoonAlternativeNegativeEvidence.summary.officialCandidateCount,
    alternativeQualifiedGlobalTextureCount: majorMoonAlternativeNegativeEvidence.summary.qualifiedGlobalTextureCount,
    alternativeBlockedTargets: majorMoonAlternativeNegativeEvidence.targets,
    alternativeNegativeEvidenceReceiptSha256: majorMoonAlternativeNegativeEvidence.receiptSha256,
    nasa3dAcquisitionReceiptSha256: majorMoonNasa3dAcquisition.receiptSha256,
    nasa3dAnalysisReceiptSha256: majorMoonNasa3dAnalysis.receiptSha256,
    nasa3dNegativeEvidenceReceiptSha256: majorMoonNasa3dNegativeEvidence.receiptSha256,
    nasa3dRequestedCount: majorMoonNasa3dAcquisition.requestedUrls.length,
    nasa3dAcquiredCount: majorMoonNasa3dAcquisition.assets.length,
    nasa3dQualifiedGlobalTextureCount: majorMoonNasa3dAnalysis.summary.runtimeDerivationCandidateCount,
    nasa3dSourceCoverageBlockedCount: majorMoonNasa3dAnalysis.summary.sourceCoverageBlockedCount,
    nasa3dRuntimeAssetAdmittedCount: 0,
    metadataProbeCompleteCount: majorMoonAssetMetadataAdmission.summary.metadataProbeCompleteCount,
    explicitHttpsAcquisitionCandidateCount: majorMoonAssetMetadataAdmission.summary.explicitHttpsAcquisitionCandidateCount,
    unresolvedAssetTargetCount: majorMoonAssetMetadataAdmission.summary.unresolvedTargetCount,
    sourceMetadataAcquiredCount: majorMoonItemMetadataReceipt.assets.length,
    visualSourceAcquiredCount: majorMoonVisualSourceAcquisition.assets.length,
    visualSourceCoverageBlockedCount: majorMoonVisualAnalysis.summary.sourceCoverageBlockedCount,
    fullRuntimeBytes: majorMoonVisualAssetsReceipt.fullRuntimeBytes,
    liteIncrementBytes: majorMoonVisualAssetsReceipt.liteIncrementBytes,
    payloadDownloadedCount: majorMoonAssetMetadataAdmission.summary.payloadDownloadedCount,
    proceduralFallbackAllowed: false,
    coloredPlaceholderAllowed: false,
    scientificPayloadWriteback: false,
  },
  budgets: {
    fullCompressed: {
      baselineBytes: v591FullCompressedBytes,
      incrementBytes: v592FullIncrementBytes,
      projectedBytes: projectedFullCompressedBytes,
      maximumBytes: fullCompressedMaximumBytes,
      status: projectedFullCompressedBytes <= fullCompressedMaximumBytes ? "passed" : "blocked",
    },
    liteTotal: {
      baselineBytes: v591LiteTotalBytes,
      incrementBytes: v592LiteIncrementBytes,
      projectedBytes: projectedLiteTotalBytes,
      maximumBytes: liteTotalMaximumBytes,
      status: projectedLiteTotalBytes <= liteTotalMaximumBytes ? "passed" : "blocked",
    },
  },
  browserPolicy: {
    status: browserUrlPolicyEvidence.status,
    receiptSha256: browserUrlPolicyEvidence.receiptSha256,
    manualOpenUrl: browserUrlPolicyEvidence.route,
    automaticRetryPerformed: false,
    alternateBrowserUsed: false,
  },
  postBuildBrowserEvidence: {
    version: "v592-post-build-browser-evidence-contract-v1",
    liveMatrixReceiptPath: "docs/release/v592/browser-live-matrix-receipt-v592.json",
    soakReceiptPath: "docs/release/v592/browser-soak-resource-receipt-v592.json",
    excludedFromRuntimeSourceIdentity: true,
    excludedFromRuntimeManifestIdentity: true,
    capabilityProjectionPath: "docs/release/v592/capability-report-v592.json",
    scientificPayloadWriteback: false,
  },
  contentPacks: {
    "stellar-heroes-v592": "24-of-24-two-mode-browser-matrix-passed-human-full-goal-signoff-pending",
    "constellation-art-v592": "science-runtime-88-of-88-browser-passed;data-derived-observatory-engravings-88-of-88;art-browser-9-of-9-passed;iau-boundaries-blocked-source-not-admitted",
    "deep-sky-v592": "gaia-60k-direct-runtime-browser-passed;18/18-nebula-metadata-selected;12-explicit-https-acquisition-candidates;item-metadata-12/12;visual-sources-12/12;runtime-assets-18-plus-6-inherited;nebula-goal-24/24-coverage;overlay-browser-48/48-four-profile-passed;deep-object-reference-24/24;deep-object-source-images-14;gaia-cluster-primary-models-10;openngc-analytic-galaxy-models-6;deep-object-visual-models-24/24;deep-space-browser-72/72-inherited;analytic-galaxy-browser-24/24-four-profile-passed;secondary-probes-11;secondary-item-metadata-3;secondary-runtime-assets-0;cluster-exact-ngc-alternative-probes-6/6-negative",
    "major-moons-v592": `motion-reference-12/12;orbit-reference-12/12;metadata-12/12;source-metadata-8/8;visual-sources-6/6;official-preview-assets-6/6-source-resolution-limited;alternative-metadata-3/3-negative-no-payload;nasa3d-tiffs-3/3-source-coverage-blocked;albedo-assets-${majorMoonVisualAssetCount}/12;asset-heroes-0/12;runtime-hero-candidates-${majorMoonVisualAssetCount}/12;browser-${majorMoonBrowserReceipt.frames.length}/${majorMoonVisualAssetCount * 3};asset-blocked-${majorMoonVisualBlockedCount}/12;no-procedural-fallback`,
  },
  authority: {
    scientificPayloadSha256: "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674",
    scientificPayloadWriteback: false,
    scientificAuthorityChanged: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    productionReleaseAuthorized: false,
    gitMutationAllowed: false,
  },
}, "manifestSha256");

const generatedConstants = `// Generated by scripts/build-v592-living-universe-candidate.mjs. Do not edit.\n` +
  `export const LIVING_UNIVERSE_MANIFEST_SHA256_V592 = ${JSON.stringify(manifest.manifestSha256)} as const;\n` +
  `export const LIVING_UNIVERSE_SOURCE_MANIFEST_SHA256_V592 = ${JSON.stringify(sourceManifest.receiptSha256)} as const;\n` +
  `export const LIVING_UNIVERSE_FREEZE_BEFORE_SHA256_V592 = ${JSON.stringify(freezeBefore.snapshotSha256)} as const;\n`;
atomicWrite(generatedConstantsPath, generatedConstants);

const liveBrowserCurrentBuildPassed = liveBrowserReceiptStructurallyQualified
  && liveBrowserReceipt.capturedCandidateManifestSha256 === manifest.manifestSha256
  && liveBrowserReceipt.capturedBuildIds?.standalone === standaloneBuildGate.buildId
  && liveBrowserReceipt.capturedBuildIds?.lite === liteBuildGate.buildId;
const browserSoakCurrentBuildPassed = browserSoakReceiptStructurallyQualified
  && browserSoakResourceReceipt.capturedCandidateManifestSha256 === manifest.manifestSha256
  && browserSoakResourceReceipt.capturedBuildIds?.standalone === standaloneBuildGate.buildId
  && browserSoakResourceReceipt.capturedBuildIds?.lite === liteBuildGate.buildId;

const currentState = writeSealed(resolve(docsRoot, "current-state-receipt-v592.json"), {
  version: "v592-current-state-receipt-v1",
  generatedAt,
  status: frozenDrift.length === 0 ? "implemented-core-with-blocked-gates" : "blocked-frozen-boundary-drift",
  formalProduct: { pointer: "v263", changed: false },
  candidate: { route: manifest.route, version: manifest.version, manifestSha256: manifest.manifestSha256, promotion: "additive-only" },
  baseline: { candidate: "v591-readonly", manifestSha256: v591Manifest.manifestSha256 },
  progress: {
    phase: "p6-deep-space-visual-models-24-of-24-analytic-browser-matrix-passed",
    rotationAdmission: `${rotationPacket.admission.admittedCount}/16-absolute`,
    rotationKinematicAdmission: `${rotationPacket.admission.kinematicAdmittedCount}/16`,
    rotationIncompleteBodies: rotationPacket.admission.incompleteBodies,
    bennuOrxPckProbe: `${orxBennuPckProbe.status};single-request;no-retry;no-payload`,
    stellarHeroes: "24/24-two-mode-browser-matrix-passed",
    gaiaStarfield: "60000-desktop;18000-mobile;420-anchors;browser-matrix-passed",
    constellationScience: "88/88;484/484;desktop-12;mobile-8;focus-matrix-passed",
    constellationArt: "88/88-data-derived-observatory-engravings;browser-9/9-passed;iau-boundaries-blocked",
    nebulae: "inherited-6/24-readonly;18/18-metadata-selected;visual-sources-12/12;runtime-assets-18;goal-coverage-24/24;overlay-browser-48/48-four-profile-passed;no-science-writeback",
    galaxies: "reference-12/12;visual-metadata-12/12;visual-models-12/12;source-backed-6/12;openngc-analytic-6/12;browser-18/18-inherited-plus-analytic-24/24-passed;infographic-blocked-2/12;scientific-overlay-blocked-1/12;secondary-probes-11-negative",
    clusters: "reference-12/12;visual-metadata-6/12;visual-source-targets-2/12;visual-assets-12/12;browser-18/18-four-profile-passed;gaia-derived-primary-models-10/12;source-blocked-0/12;exact-ngc-alternative-probes-6/6-negative",
     majorMoons: majorMoonCurrentProgress,
    builds: `standalone-${standaloneBuildGate.status};lite-${liteBuildGate.status}`,
    browserSoak: browserSoakCurrentBuildPassed && browserSoakHeapQualified
      ? "completed-30m-renderer-stable-release-restore-passed-js-heap-telemetry-qualified"
      : !browserSoakCurrentBuildPassed
        ? "blocked-stale-build-identity"
      : browserSoakTelemetryAvailable
        ? "completed-30m-renderer-stable-release-restore-passed-js-heap-growth-blocked"
        : "completed-30m-renderer-stable-release-restore-passed-js-heap-telemetry-unavailable",
  },
  builds: {
    standalone: standaloneBuildGate,
    lite: liteBuildGate,
    policy: {
      heapMb: 8192,
      singleProcessOrchestration: true,
      route: "/local-shadow-v592",
      productionDeployment: false,
    },
  },
  authority: manifest.authority,
  evidence: {
    freezeBeforeSha256: freezeBefore.snapshotSha256,
    sourceManifestSha256: sourceManifest.receiptSha256,
    rotationReceiptSha256: rotationReceipt.receiptSha256,
    bennuOrxPckProbeReceiptSha256: orxBennuPckProbe.receiptSha256,
    stellarBrowserMatrixReceiptSha256: stellarBrowserReceipt.receiptSha256,
    gaiaSupplementReceiptSha256: gaiaSupplementReceipt.receiptSha256,
    gaiaConstellationBrowserMatrixReceiptSha256: gaiaConstellationBrowserReceipt.receiptSha256,
    constellationArtReferenceReceiptSha256: constellationArtReferenceReceipt.receiptSha256,
    constellationArtBrowserMatrixReceiptSha256: constellationArtBrowserReceipt.receiptSha256,
    browserUrlPolicyEvidenceSha256: browserUrlPolicyEvidence.receiptSha256,
    liveBrowserMatrixReceiptSha256: liveBrowserReceipt.receiptSha256,
    browserSoakResourceReceiptSha256: browserSoakResourceReceipt.receiptSha256,
    nebulaAssetMetadataAdmissionReceiptSha256: nebulaAssetMetadataAdmission.receiptSha256,
    nebulaItemMetadataAcquisitionReceiptSha256: nebulaItemMetadataAcquisition.receiptSha256,
    nebulaLicenseReviewReceiptSha256: nebulaLicenseReview.receiptSha256,
    nebulaVisualSourceAcquisitionReceiptSha256: nebulaVisualSourceAcquisition.receiptSha256,
    nebulaVisualAnalysisReceiptSha256: nebulaVisualAnalysis.receiptSha256,
     nebulaVisualAssetManifestSha256: nebulaVisualAssets.manifestSha256,
     nebulaVisualAssetReceiptSha256: nebulaVisualAssetsReceipt.receiptSha256,
     nebulaExtendedVisualAssetManifestSha256: nebulaExtendedVisualAssets.manifestSha256,
     nebulaExtendedVisualAssetReceiptSha256: nebulaExtendedVisualAssetsReceipt.receiptSha256,
     nebulaClosureVisualAssetManifestSha256: nebulaClosureVisualAssets.manifestSha256,
     nebulaClosureVisualAssetReceiptSha256: nebulaClosureVisualAssetsReceipt.receiptSha256,
    nebulaOverlayBrowserCaptureSha256: nebulaOverlayBrowserReceipt.source.captureSha256,
    nebulaOverlayBrowserMatrixReceiptSha256: nebulaOverlayBrowserReceipt.receiptSha256,
    nebulaBrowserMatrixReceiptSha256: nebulaBrowserReceipt.receiptSha256,
    majorMoonReferenceReceiptSha256: majorMoonReceipt.receiptSha256,
    majorMoonAssetMetadataAdmissionReceiptSha256: majorMoonAssetMetadataAdmission.receiptSha256,
    majorMoonItemMetadataAcquisitionReceiptSha256: majorMoonItemMetadataReceipt.receiptSha256,
    majorMoonItemLicenseReviewReceiptSha256: majorMoonLicenseReview.receiptSha256,
    majorMoonVisualSourceAcquisitionReceiptSha256: majorMoonVisualSourceAcquisition.receiptSha256,
    majorMoonVisualSourceAnalysisReceiptSha256: majorMoonVisualAnalysis.receiptSha256,
    majorMoonOfficialCollectionMetadataReceiptSha256: majorMoonOfficialCollectionMetadata.receiptSha256,
    majorMoonSecondaryProductMetadataReceiptSha256: majorMoonSecondaryProductMetadata.receiptSha256,
    majorMoonOfficialPreviewAcquisitionReceiptSha256: majorMoonOfficialPreviewAcquisition.receiptSha256,
    majorMoonVisualAssetManifestSha256: majorMoonVisualAssets.manifestSha256,
    majorMoonVisualAssetReceiptSha256: majorMoonVisualAssetsReceipt.receiptSha256,
    majorMoonSecondaryVisualEvidenceReceiptSha256: majorMoonSecondaryVisualEvidence.receiptSha256,
     majorMoonUsGsFinalAcquisitionReceiptSha256: majorMoonUsGsFinalAcquisition.receiptSha256,
     majorMoonUsGsFinalAnalysisReceiptSha256: majorMoonUsGsFinalAnalysis.receiptSha256,
     majorMoonAlternativeNegativeEvidenceReceiptSha256: majorMoonAlternativeNegativeEvidence.receiptSha256,
     majorMoonNasa3dAcquisitionReceiptSha256: majorMoonNasa3dAcquisition.receiptSha256,
     majorMoonNasa3dAnalysisReceiptSha256: majorMoonNasa3dAnalysis.receiptSha256,
     majorMoonNasa3dNegativeEvidenceReceiptSha256: majorMoonNasa3dNegativeEvidence.receiptSha256,
     majorMoonBrowserMatrixReceiptSha256: majorMoonBrowserReceipt.receiptSha256,
    deepSpaceReferencePacketSha256: deepSpaceReference.packetSha256,
    deepSpaceReferenceReceiptSha256: deepSpaceReferenceReceipt.receiptSha256,
    deepSpaceItemMetadataAcquisitionReceiptSha256: deepSpaceItemMetadataAcquisition.receiptSha256,
    deepSpaceLicenseReviewReceiptSha256: deepSpaceLicenseReview.receiptSha256,
    deepSpaceVisualSourceAcquisitionReceiptSha256: deepSpaceVisualSourceAcquisition.receiptSha256,
    deepSpaceVisualAnalysisReceiptSha256: deepSpaceVisualAnalysis.receiptSha256,
    deepSpaceVisualAssetManifestSha256: deepSpaceVisualAssets.manifestSha256,
    deepSpaceVisualAssetReceiptSha256: deepSpaceVisualAssetsReceipt.receiptSha256,
    deepSpaceBrowserCaptureSha256: deepSpaceBrowserReceipt.source.captureSha256,
    deepSpaceBrowserMatrixReceiptSha256: deepSpaceBrowserReceipt.receiptSha256,
    deepSpaceAnalyticBrowserCaptureSha256: deepSpaceAnalyticBrowserReceipt.source.captureSha256,
    deepSpaceAnalyticBrowserMatrixReceiptSha256: deepSpaceAnalyticBrowserReceipt.receiptSha256,
    deepSpaceSecondaryProbeNegativeEvidenceReceiptSha256: deepSpaceSecondaryProbeNegativeEvidence.receiptSha256,
    deepSpaceClusterAlternativeNegativeEvidenceReceiptSha256: deepSpaceClusterAlternativeNegativeEvidence.receiptSha256,
    deepSpaceAlternativeLicenseReviewReceiptSha256: deepSpaceAlternativeLicenseReview.receiptSha256,
    deepSpaceAlternativeContactSheetReceiptSha256: deepSpaceAlternativeContactSheetReceipt.receiptSha256,
    deepSpaceAlternativeVisualAnalysisReceiptSha256: deepSpaceAlternativeVisualAnalysis.receiptSha256,
    deepSpaceGaiaCatalogManifestFileSha256: gaiaPresentationManifestFile.sha256,
    deepSpaceGaiaCatalogArchiveSha256: gaiaPresentationArchive.sha256,
    standaloneBuildReceiptFileSha256: standaloneBuildGate.fileSha256,
    liteBuildReceiptFileSha256: liteBuildGate.fileSha256,
  },
}, "receiptSha256");

const pointer = writeSealed(pointerPath, {
  version: "v592-current-research-visual-candidate-pointer-v1",
  generatedAt,
  status: currentState.status,
  route: manifest.route,
  candidate: manifest.version,
  manifestSha256: manifest.manifestSha256,
  currentStateReceiptSha256: currentState.receiptSha256,
  formalProductPointer: "v263",
  scientificPayloadSha256: manifest.authority.scientificPayloadSha256,
  scientificPayloadWriteback: false,
  productionPromotionAllowed: false,
}, "pointerSha256");

const capability = writeSealed(resolve(docsRoot, "capability-report-v592.json"), {
  version: "v592-living-universe-capability-report-v1",
  generatedAt,
  status: currentState.status,
  candidate: {
    route: manifest.route,
    manifestSha256: manifest.manifestSha256,
    formalProductPointer: "v263",
    baseline: "v591-readonly",
    scientificPayloadWriteback: false,
  },
  capabilities: {
    namespaceIsolated: true,
    singleCanvasRequired: true,
    celestialClockImplemented: true,
    absoluteTimeOrientation: true,
    reverseTimeImplemented: true,
    admittedRotationCount: rotationPacket.admission.admittedCount,
    admittedRotationKinematicCount: rotationPacket.admission.kinematicAdmittedCount,
    incompleteRotationBodies: rotationPacket.admission.incompleteBodies,
    bennuOrxPckDirectoryProbeStatus: orxBennuPckProbe.status,
    bennuOrxPckDirectoryProbeRequestCount: orxBennuPckProbe.requestCount,
    bennuOrxPckDirectoryProbePayloadDownloaded: orxBennuPckProbe.payloadDownloaded,
    bennuOrxPckDirectoryProbeAutomaticRetryPerformed: orxBennuPckProbe.automaticRetryPerformed,
    sunDifferentialRotationBridge: true,
    stellarHeroCatalogCount: stellarHeroPacket.admission.catalogPacketCount,
    stellarHeroRuntimeImplemented: true,
    stellarHeroPacketSha256: stellarHeroPacket.packetSha256,
    stellarHeroBrowserMatrixPassed: true,
    stellarHeroBrowserAdmittedCount: stellarBrowserReceipt.admission.stellarHeroCount,
    stellarHeroBrowserFrameCount: stellarBrowserReceipt.frames.length,
    stellarHeroBrowserMinimumFpsMedian: stellarBrowserReceipt.admission.minimumFpsMedian,
    stellarHeroBrowserPeakGpuBytes: stellarBrowserReceipt.admission.peakGpuBytes,
    stellarHeroBrowserPeakDrawCalls: stellarBrowserReceipt.admission.peakDrawCalls,
    gaiaDirectRuntimeImplemented: true,
    gaiaBaseCatalogRecordCount: 46_000,
    gaiaFullSupplementRecordCount: gaiaSupplementReceipt.output.recordCount,
    gaiaFullDesktopRecordCount: 46_000 + gaiaSupplementReceipt.output.recordCount,
    gaiaFullSupplementReceiptSha256: gaiaSupplementReceipt.receiptSha256,
    gaiaConstellationBrowserMatrixPassed: true,
    gaiaConstellationBrowserFrameCount: gaiaConstellationBrowserReceipt.frames.length,
    gaiaConstellationBrowserMinimumFpsMedian: gaiaConstellationBrowserReceipt.admission.minimumFpsMedian,
    gaiaConstellationBrowserPeakDesktopGpuBytes: gaiaConstellationBrowserReceipt.admission.peakDesktopGpuBytes,
    gaiaConstellationBrowserPeakMobileGpuBytes: gaiaConstellationBrowserReceipt.admission.peakMobileGpuBytes,
    gaiaConstellationBrowserPeakDrawCalls: gaiaConstellationBrowserReceipt.admission.peakDrawCalls,
    constellationScienceRuntimeImplemented: true,
    constellationScienceCount: constellationPacket.bindings.length,
    constellationWaypointCount: constellationPacket.bindings.reduce((sum, binding) => sum + binding.waypoints.length, 0),
    constellationBrowserMatrixPassed: true,
    constellationBrowserFocusedCodes: gaiaConstellationBrowserReceipt.admission.focusedConstellationCodes,
    constellationIauBoundaryAdmission: gaiaConstellationBrowserReceipt.admission.iauBoundaryAdmission,
    constellationArtAdmissionCount: constellationArtReferenceReceipt.admission.admittedCount,
    constellationArtUniqueSignatureCount: constellationArtReferenceReceipt.admission.uniqueSignatureCount,
    constellationArtBrowserMatrixPassed: true,
    constellationArtBrowserFrameCount: constellationArtBrowserReceipt.admission.frameCount,
    constellationArtBrowserMinimumFpsMedian: constellationArtBrowserReceipt.admission.minimumFpsMedian,
    constellationArtBrowserPeakDesktopGpuBytes: constellationArtBrowserReceipt.admission.peakDesktopGpuBytes,
    constellationArtBrowserPeakMobileGpuBytes: constellationArtBrowserReceipt.admission.peakMobileGpuBytes,
    constellationArtBrowserPeakDrawCalls: constellationArtBrowserReceipt.admission.peakDrawCalls,
    deepSpaceGalaxyReferenceAdmissionCount: deepSpaceReference.admission.admittedGalaxyReferenceCount,
    deepSpaceClusterReferenceAdmissionCount: deepSpaceReference.admission.admittedClusterReferenceCount,
    deepSpaceVisualMetadataCandidateCount: deepSpaceReference.admission.visualMetadataCandidateCount,
    deepSpaceVisualMetadataBlockedCount: deepSpaceReference.admission.visualMetadataBlockedCount,
    deepSpaceReferenceVisualAssetAdmissionCount: deepSpaceReference.admission.visualAssetAdmittedCount,
    deepSpaceItemMetadataAcquiredCount: deepSpaceItemMetadataAcquisition.assets.length,
    deepSpacePrimaryVisualSourceAcquiredCount: deepSpaceVisualSourceAcquisition.assets.length,
    deepSpaceAlternativeVisualSourceAcquiredCount: deepSpaceAlternativeVisualAnalysis.analyses.length,
    deepSpaceVisualSourceAcquiredCount: deepSpaceVisualSourceAcquisition.assets.length + deepSpaceAlternativeVisualAnalysis.analyses.length,
    deepSpacePrimaryVisualDerivationCandidateCount: deepSpaceVisualAnalysis.summary.runtimeDerivationCandidateCount,
    deepSpaceAlternativeVisualDerivationCandidateCount: deepSpaceAlternativeVisualAnalysis.summary.runtimeDerivationCandidateCount,
    deepSpaceVisualDerivationCandidateCount: deepSpaceVisualAnalysis.summary.runtimeDerivationCandidateCount + deepSpaceAlternativeVisualAnalysis.summary.runtimeDerivationCandidateCount,
    deepSpaceInfographicBlockedCount: deepSpaceVisualAnalysis.summary.infographicBlockedCount,
    deepSpaceScientificOverlayBlockedCount: deepSpaceAlternativeVisualAnalysis.summary.scientificOverlayBlockedCount,
    deepSpaceCleanRedundantAlternateHeldCount: deepSpaceAlternativeVisualAnalysis.summary.cleanRedundantAlternateHeldCount,
    deepSpaceGaiaCatalogDerivedVisualModelCount: deepSpaceVisualAssetsReceipt.gaiaCatalogDerivedVisualModelCount,
    deepSpaceGaiaCatalogPayloadReusedFromExistingAdmission: deepSpaceVisualAssetsReceipt.gaiaCatalogPayloadReusedFromExistingAdmission,
    deepSpaceGalaxyVisualAssetAdmissionCount: deepSpaceVisualAssets.admission.admittedGalaxyAssetCount,
    deepSpaceClusterVisualAssetAdmissionCount: deepSpaceVisualAssets.admission.admittedClusterAssetCount,
    deepSpaceVisualAssetAdmissionCount: deepSpaceVisualAssets.admission.totalAssetAdmittedCount,
    deepSpaceVisualAssetBlockedCount: deepSpaceVisualAssets.admission.blockedCount,
    deepSpaceVisualAssetFullRuntimeBytes: deepSpaceVisualAssetsReceipt.fullRuntimeBytes,
    deepSpaceVisualAssetLiteIncrementBytes: deepSpaceVisualAssetsReceipt.liteIncrementBytes,
    deepSpaceSecondaryMetadataProbeCount: deepSpaceSecondaryProbeNegativeEvidence.summary.metadataProbeCount,
    deepSpaceSecondaryItemMetadataAcquisitionCount: deepSpaceSecondaryProbeNegativeEvidence.summary.itemMetadataAcquisitionCount,
    deepSpaceSecondaryVisualPayloadDownloadedCount: deepSpaceSecondaryProbeNegativeEvidence.summary.visualPayloadDownloadedCount,
    deepSpaceSecondaryRuntimeAssetAdmittedCount: deepSpaceSecondaryProbeNegativeEvidence.summary.runtimeAssetAdmittedCount,
    deepSpaceClusterAlternativeNegativeEvidenceReceiptSha256: deepSpaceClusterAlternativeNegativeEvidence.receiptSha256,
    deepSpaceClusterAlternativeMetadataProbeCount: deepSpaceClusterAlternativeNegativeEvidence.summary.metadataProbeCount,
    deepSpaceClusterAlternativeQualifiedVisualTextureCount: deepSpaceClusterAlternativeNegativeEvidence.summary.qualifiedVisualTextureCount,
    deepSpaceClusterAlternativeBlockedTargetCount: deepSpaceClusterAlternativeNegativeEvidence.summary.blockedTargetCount,
    deepSpaceBrowserMatrixPassed: true,
    deepSpaceBrowserMatrixFrameCount: deepSpaceBrowserReceipt.admission.frameCount,
    deepSpaceBrowserMatrixMinimumFpsMedian: deepSpaceBrowserReceipt.admission.minimumFpsMedian,
    deepSpaceBrowserMatrixPeakDesktopGpuBytes: deepSpaceBrowserReceipt.admission.peakDesktopGpuBytes,
    deepSpaceBrowserMatrixPeakMobileGpuBytes: deepSpaceBrowserReceipt.admission.peakMobileGpuBytes,
    deepSpaceBrowserMatrixPeakDrawCalls: deepSpaceBrowserReceipt.admission.peakDrawCalls,
    deepSpaceBrowserMatrixReleaseRestorePassed: deepSpaceBrowserReceipt.admission.releaseRestorePassed,
    deepSpaceAnalyticBrowserMatrixPassed: true,
    deepSpaceAnalyticBrowserMatrixFrameCount: deepSpaceAnalyticBrowserReceipt.admission.frameCount,
    deepSpaceAnalyticBrowserMatrixMinimumFpsMedian: deepSpaceAnalyticBrowserReceipt.admission.minimumFpsMedian,
    deepSpaceAnalyticBrowserMatrixPeakDesktopGpuBytes: deepSpaceAnalyticBrowserReceipt.admission.peakDesktopGpuBytes,
    deepSpaceAnalyticBrowserMatrixPeakMobileGpuBytes: deepSpaceAnalyticBrowserReceipt.admission.peakMobileGpuBytes,
    deepSpaceAnalyticBrowserMatrixPeakDrawCalls: deepSpaceAnalyticBrowserReceipt.admission.peakDrawCalls,
    deepSpaceAnalyticBrowserMatrixReleaseRestorePassed: deepSpaceAnalyticBrowserReceipt.admission.releaseRestorePassed,
    deepSpacePayloadDownloadedCount: 0,
    nebulaMetadataSelectedTargetCount: nebulaAssetMetadataAdmission.summary.selectedTargetCount,
    nebulaMetadataProbeCompleteCount: nebulaAssetMetadataAdmission.summary.metadataProbeCompleteCount,
    nebulaExplicitHttpsAcquisitionCandidateCount: nebulaAssetMetadataAdmission.summary.explicitHttpsAcquisitionCandidateCount,
    nebulaTerminalBlockedNoRetryCount: nebulaAssetMetadataAdmission.summary.terminalBlockedCount,
     nebulaExpandedAssetAdmissionCount: nebulaVisualAssets.admission.runtimeAssetAdmittedCount + nebulaExtendedVisualAssets.admission.runtimeAssetAdmittedCount + nebulaClosureVisualAssets.admission.runtimeAssetAdmittedCount,
     nebulaExpandedAssetGoalCoverageCount: 24,
    nebulaItemMetadataAcquiredCount: nebulaItemMetadataAcquisition.assets.length,
    nebulaVisualSourceAcquiredCount: nebulaVisualSourceAcquisition.assets.length,
    nebulaVisualSourceCoverageBlockedCount: nebulaVisualAnalysis.summary.visualCoverageBlockedCount,
     nebulaVisualAssetFullRuntimeBytes: nebulaVisualAssetsReceipt.fullRuntimeBytes + nebulaExtendedVisualAssetsReceipt.fullRuntimeBytes + nebulaClosureVisualAssetsReceipt.fullRuntimeBytes,
     nebulaVisualAssetLiteIncrementBytes: nebulaVisualAssetsReceipt.liteIncrementBytes + nebulaExtendedVisualAssetsReceipt.liteIncrementBytes + nebulaClosureVisualAssetsReceipt.liteIncrementBytes,
     nebulaExtendedOverlayAssetCount: nebulaExtendedVisualAssets.admission.runtimeAssetAdmittedCount,
     nebulaClosureOverlayAssetCount: nebulaClosureVisualAssets.admission.runtimeAssetAdmittedCount,
     nebulaExtendedOverlayManifestSha256: nebulaExtendedVisualAssets.manifestSha256,
     nebulaClosureOverlayManifestSha256: nebulaClosureVisualAssets.manifestSha256,
     nebulaOverlayBrowserMatrixPassed: true,
     nebulaOverlayBrowserFrameCount: nebulaOverlayBrowserReceipt.admission.frameCount,
     nebulaOverlayBrowserMinimumFpsMedian: nebulaOverlayBrowserReceipt.admission.minimumFpsMedian,
     nebulaOverlayBrowserScienceMarkerOnlyFrameCount: nebulaOverlayBrowserReceipt.admission.scienceMarkerOnlyFrameCount,
     nebulaOverlayBrowserNativeKtx2CinematicFrameCount: nebulaOverlayBrowserReceipt.admission.nativeKtx2CinematicFrameCount,
     nebulaOverlayBrowserSingleCanvas: nebulaOverlayBrowserReceipt.admission.singleCanvas,
     nebulaOverlayBrowserPayloadStable: nebulaOverlayBrowserReceipt.admission.scienceCinematicPayloadStable,
    nebulaBrowserMatrixPassed: true,
    nebulaBrowserFrameCount: nebulaBrowserReceipt.admission.frameCount,
    nebulaBrowserMinimumFpsMedian: nebulaBrowserReceipt.admission.minimumFpsMedian,
    nebulaBrowserPeakDesktopGpuBytes: nebulaBrowserReceipt.admission.peakDesktopGpuBytes,
    nebulaBrowserPeakMobileGpuBytes: nebulaBrowserReceipt.admission.peakMobileGpuBytes,
    nebulaBrowserPeakDrawCalls: nebulaBrowserReceipt.admission.peakDrawCalls,
    nebulaBrowserMinimumRoiNonBlackFraction: nebulaBrowserReceipt.admission.minimumCinematicRoiNonBlackFraction,
    majorMoonMotionReferenceAdmittedCount: majorMoonPacket.admission.motionReferenceAdmittedCount,
    majorMoonOrbitReferenceAdmittedCount: majorMoonPacket.admission.orbitReferenceAdmittedCount,
    majorMoonVisualAssetAdmittedCount: majorMoonVisualAssets.admission.albedoAssetAdmittedCount,
    majorMoonAssetManifestHeroAdmittedCount: majorMoonVisualAssets.admission.heroAdmittedCount,
    majorMoonHeroAdmittedCount: majorMoonBrowserReceipt.admission.runtimeHeroCandidateCount,
    majorMoonRuntimeHeroCandidateCount: majorMoonBrowserReceipt.admission.runtimeHeroCandidateCount,
    majorMoonRuntimeHeroCandidateIds: majorMoonBrowserReceipt.admission.runtimeHeroCandidateIds,
    majorMoonBrowserFrameCount: majorMoonBrowserReceipt.frames.length,
    majorMoonBrowserMinimumFpsMedian: majorMoonBrowserReceipt.admission.minimumFpsMedian,
    majorMoonBrowserPeakDesktopGpuBytes: majorMoonBrowserReceipt.admission.peakDesktopGpuBytes,
    majorMoonBrowserPeakMobileGpuBytes: majorMoonBrowserReceipt.admission.peakMobileGpuBytes,
    majorMoonBrowserPeakDrawCalls: majorMoonBrowserReceipt.admission.peakDrawCalls,
    majorMoonBrowserReleaseRestoreCycleCount: majorMoonBrowserReceipt.admission.releaseRestoreCycleCount,
    majorMoonSecondaryVisualEvidenceStatus: majorMoonSecondaryVisualEvidence.status,
    majorMoonSecondaryQualifiedGlobalTextureCount: majorMoonSecondaryVisualEvidence.admission.qualifiedGlobalTextureCount,
    majorMoonUsGsFinalRequestedCount: majorMoonUsGsFinalAcquisition.requestedUrls.length,
    majorMoonUsGsFinalAcquiredCount: majorMoonUsGsFinalAcquisition.assets.length,
    majorMoonUsGsFinalTerminalFailureCount: majorMoonUsGsFinalAcquisition.failures.length,
    majorMoonUsGsFinalFailedTargets: majorMoonUsGsFinalAnalysis.failedTargets,
    majorMoonMetadataProbeCompleteCount: majorMoonAssetMetadataAdmission.summary.metadataProbeCompleteCount,
    majorMoonExplicitHttpsAcquisitionCandidateCount: majorMoonAssetMetadataAdmission.summary.explicitHttpsAcquisitionCandidateCount,
    majorMoonUnresolvedAssetTargetCount: majorMoonAssetMetadataAdmission.summary.unresolvedTargetCount,
    majorMoonSourceMetadataAcquiredCount: majorMoonItemMetadataReceipt.assets.length,
    majorMoonVisualSourceAcquiredCount: majorMoonVisualSourceAcquisition.assets.length,
    majorMoonVisualSourceCoverageBlockedCount: majorMoonVisualAnalysis.summary.sourceCoverageBlockedCount,
    majorMoonOfficialCollectionMetadataCount: majorMoonOfficialCollectionMetadata.assets.length,
    majorMoonSecondaryProductMetadataCount: majorMoonSecondaryProductMetadata.assets.length,
    majorMoonOfficialPreviewAssetCount: majorMoonOfficialPreviewAcquisition.assets.length,
    majorMoonOfficialPreviewSourceResolutionLimited: majorMoonOfficialPreviewAcquisition.assets.every((asset) => asset.width === 1024 && asset.height === 512),
    majorMoonOfficialPreviewAcquisitionReceiptSha256: majorMoonOfficialPreviewAcquisition.receiptSha256,
    majorMoonAlternativeMetadataProbeCount: majorMoonAlternativeNegativeEvidence.summary.metadataProbeCount,
    majorMoonAlternativeOfficialCandidateCount: majorMoonAlternativeNegativeEvidence.summary.officialCandidateCount,
    majorMoonAlternativeQualifiedGlobalTextureCount: majorMoonAlternativeNegativeEvidence.summary.qualifiedGlobalTextureCount,
     majorMoonAlternativeBlockedTargets: majorMoonAlternativeNegativeEvidence.targets,
     majorMoonAlternativeNegativeEvidenceReceiptSha256: majorMoonAlternativeNegativeEvidence.receiptSha256,
     majorMoonNasa3dRequestedCount: majorMoonNasa3dAcquisition.requestedUrls.length,
     majorMoonNasa3dAcquiredCount: majorMoonNasa3dAcquisition.assets.length,
     majorMoonNasa3dQualifiedGlobalTextureCount: majorMoonNasa3dAnalysis.summary.runtimeDerivationCandidateCount,
     majorMoonNasa3dSourceCoverageBlockedCount: majorMoonNasa3dAnalysis.summary.sourceCoverageBlockedCount,
     majorMoonNasa3dRuntimeAssetAdmittedCount: 0,
     majorMoonNasa3dAcquisitionReceiptSha256: majorMoonNasa3dAcquisition.receiptSha256,
     majorMoonNasa3dAnalysisReceiptSha256: majorMoonNasa3dAnalysis.receiptSha256,
     majorMoonNasa3dNegativeEvidenceReceiptSha256: majorMoonNasa3dNegativeEvidence.receiptSha256,
     majorMoonLiteIncrementBytes: majorMoonVisualAssetsReceipt.liteIncrementBytes,
    standaloneBuildPassed: standaloneBuildGate.qualified,
    liteBuildPassed: liteBuildGate.qualified,
    standaloneBuildReceiptFileSha256: standaloneBuildGate.fileSha256,
    liteBuildReceiptFileSha256: liteBuildGate.fileSha256,
    projectedFullCompressedBytes,
    fullCompressedMaximumBytes,
    projectedLiteTotalBytes,
    liteTotalMaximumBytes,
    browserUrlPolicyBlocked: true,
    liveBrowserMatrixPassed: liveBrowserCurrentBuildPassed,
    liveBrowserMatrixFrameCount: liveBrowserReceipt.frames.length,
    liveBrowserMatrixDesktopMinimumSampledFps: liveBrowserReceipt.admission.desktopMinimumSampledFps,
    liveBrowserMatrixMobileMinimumSampledFps: liveBrowserReceipt.admission.mobileMinimumSampledFps,
    liveBrowserMatrixDeepSpaceMinimumSampledFps: liveBrowserReceipt.admission.deepSpaceMinimumSampledFps,
    liveBrowserMatrixSingleCanvas: liveBrowserReceipt.admission.singleCanvas,
    liveBrowserMatrixConsolePageWebglErrorCount: liveBrowserReceipt.admission.consolePageWebglErrorCount,
    liveBrowserMatrixScientificPayloadWriteback: liveBrowserReceipt.admission.scientificPayloadWriteback,
    browserSoakThirtyMinuteDurationPassed: browserSoakCurrentBuildPassed && browserSoakResourceReceipt.admission.thirtyMinuteDurationPassed,
    browserSoakSampleCount: browserSoakResourceReceipt.soak.sampleCount,
    browserSoakMinimumFpsMedian: browserSoakResourceReceipt.soak.fpsMedian.minimum,
    browserSoakRendererResourceNoGrowthPassed: browserSoakCurrentBuildPassed && browserSoakResourceReceipt.admission.rendererResourceNoGrowthPassed,
    browserSoakReleaseRestorePassed: browserSoakCurrentBuildPassed && browserSoakResourceReceipt.admission.releaseRestorePassed,
    browserSoakStrictReleaseRestoreCycleCount: browserSoakResourceReceipt.resourceLifecycle.strictCycleCount,
    browserSoakJsHeapTelemetryAvailable: browserSoakResourceReceipt.admission.jsHeapTelemetryAvailable,
    browserSoakJsHeapGrowthGatePassed: browserSoakCurrentBuildPassed && browserSoakResourceReceipt.admission.jsHeapGrowthGatePassed,
    browserSoakFullMemoryGatePassed: browserSoakCurrentBuildPassed && browserSoakResourceReceipt.admission.fullMemoryGatePassed,
    v591FrozenEntryCount: frozenSnapshot.length,
    v591FrozenDriftCount: frozenDrift.length,
  },
  blockedGates: {
    allSixteenRotationAdmission: rotationPacket.admission.admittedCount === 16 ? "passed" : `blocked:${rotationPacket.admission.incompleteBodies.join(",")}`,
    allSixteenRotationKinematics: rotationPacket.admission.kinematicAdmittedCount === 16 ? "passed" : "blocked",
    stellarHeroes: "passed:24/24-two-mode-browser-visual-matrix",
    gaiaFullDesktop60k: "passed:60000-desktop;18000-mobile;420-anchors;browser-matrix",
    constellationScience: "passed:88/88;484/484;desktop-12;mobile-8;three-focus-browser-matrix",
    constellationArt: "passed:88/88-data-derived-observatory-engravings;browser-9/9;iau-boundary-blocked-source-not-admitted",
    expandedNebulae: "passed-overlay-browser:24/24-goal-coverage;inherited-6;v592-runtime-18;metadata-18/18;visual-sources-12/12;overlay-browser-48/48-four-profile",
    galaxies: "partial:reference-12/12;visual-metadata-12/12;visual-models-12/12;source-backed-6/12;openngc-analytic-6/12;browser-18/18-inherited-plus-analytic-24/24-passed;infographic-blocked-2/12;scientific-overlay-blocked-1/12;secondary-probes-11-negative",
    clusters: "partial:reference-12/12;visual-metadata-6/12;visual-source-targets-2/12;visual-assets-12/12;browser-18/18-four-profile-passed;gaia-derived-primary-models-10/12;source-blocked-0/12;exact-ngc-alternative-probes-6/6-negative",
    majorMoons: majorMoonBlockedGate,
    browserVisualMatrix: `partial-passed:stellar-48/48;gaia-constellation-13/13;constellation-art-9/9;nebula-48/48-overlay-four-profile;deep-space-72/72-four-profile;analytic-galaxies-24/24-four-profile;major-moons-${majorMoonBrowserReceipt.frames.length}/${majorMoonVisualAssetCount * 3}-for-${majorMoonVisualAssetCount}-runtime-candidates;remaining-goal-matrices-not-run`,
    browserUrlPolicy: "blocked:manual-open-required-no-automatic-retry",
    liveBrowserMatrix: liveBrowserCurrentBuildPassed
      ? "passed-12-frame-current-build-plus-72-frame-deep-space-matrix;zero-errors;single-canvas"
      : "blocked-stale-build-identity",
    soak30Minutes: browserSoakCurrentBuildPassed && browserSoakHeapQualified
      ? "passed:30m-visible-renderer-stable-release-restore-js-heap-growth"
      : !browserSoakCurrentBuildPassed
        ? "blocked-stale-build-identity"
      : browserSoakTelemetryAvailable
        ? "partial-passed:30m-visible-renderer-stable-release-restore-passed;blocked-js-heap-growth-threshold"
        : "partial-passed:30m-visible-renderer-stable-release-restore-passed;blocked-js-heap-telemetry-unavailable",
    standaloneBuild: standaloneBuildGate.qualified ? "passed:8gib-local-shadow-v592-route-and-rollback" : `blocked:${standaloneBuildGate.reason}`,
    liteBuild: liteBuildGate.qualified ? "passed:8gib-local-shadow-v592-route-and-rollback" : `blocked:${liteBuildGate.reason}`,
    humanVisualSignoff: "not-requested",
  },
  evidence: {
    sourceManifestSha256: sourceManifest.receiptSha256,
    freezeBeforeSha256: freezeBefore.snapshotSha256,
    rotationPacketSha256: rotationPacket.packetSha256,
    rotationReceiptSha256: rotationReceipt.receiptSha256,
    bennuOrxPckProbeReceiptSha256: orxBennuPckProbe.receiptSha256,
    stellarHeroReceiptSha256: stellarHeroReceipt.receiptSha256,
    stellarBrowserMatrixReceiptSha256: stellarBrowserReceipt.receiptSha256,
    gaiaSupplementReceiptSha256: gaiaSupplementReceipt.receiptSha256,
    gaiaConstellationBrowserMatrixReceiptSha256: gaiaConstellationBrowserReceipt.receiptSha256,
    constellationArtReferenceReceiptSha256: constellationArtReferenceReceipt.receiptSha256,
    constellationArtBrowserMatrixReceiptSha256: constellationArtBrowserReceipt.receiptSha256,
    deepSpaceReferencePacketSha256: deepSpaceReference.packetSha256,
    deepSpaceReferenceReceiptSha256: deepSpaceReferenceReceipt.receiptSha256,
    deepSpaceItemMetadataAcquisitionReceiptSha256: deepSpaceItemMetadataAcquisition.receiptSha256,
    deepSpaceLicenseReviewReceiptSha256: deepSpaceLicenseReview.receiptSha256,
    deepSpaceVisualSourceAcquisitionReceiptSha256: deepSpaceVisualSourceAcquisition.receiptSha256,
    deepSpaceVisualAnalysisReceiptSha256: deepSpaceVisualAnalysis.receiptSha256,
    deepSpaceVisualAssetManifestSha256: deepSpaceVisualAssets.manifestSha256,
    deepSpaceVisualAssetReceiptSha256: deepSpaceVisualAssetsReceipt.receiptSha256,
    deepSpaceBrowserCaptureSha256: deepSpaceBrowserReceipt.source.captureSha256,
    deepSpaceBrowserMatrixReceiptSha256: deepSpaceBrowserReceipt.receiptSha256,
    deepSpaceAnalyticBrowserCaptureSha256: deepSpaceAnalyticBrowserReceipt.source.captureSha256,
    deepSpaceAnalyticBrowserMatrixReceiptSha256: deepSpaceAnalyticBrowserReceipt.receiptSha256,
    deepSpaceSecondaryProbeNegativeEvidenceReceiptSha256: deepSpaceSecondaryProbeNegativeEvidence.receiptSha256,
    deepSpaceClusterAlternativeNegativeEvidenceReceiptSha256: deepSpaceClusterAlternativeNegativeEvidence.receiptSha256,
    deepSpaceAlternativeLicenseReviewReceiptSha256: deepSpaceAlternativeLicenseReview.receiptSha256,
    deepSpaceAlternativeContactSheetReceiptSha256: deepSpaceAlternativeContactSheetReceipt.receiptSha256,
    deepSpaceAlternativeVisualAnalysisReceiptSha256: deepSpaceAlternativeVisualAnalysis.receiptSha256,
    deepSpaceGaiaCatalogManifestFileSha256: gaiaPresentationManifestFile.sha256,
    deepSpaceGaiaCatalogArchiveSha256: gaiaPresentationArchive.sha256,
    browserUrlPolicyEvidenceSha256: browserUrlPolicyEvidence.receiptSha256,
    liveBrowserMatrixReceiptSha256: liveBrowserReceipt.receiptSha256,
    browserSoakResourceReceiptSha256: browserSoakResourceReceipt.receiptSha256,
    nebulaAssetMetadataAdmissionReceiptSha256: nebulaAssetMetadataAdmission.receiptSha256,
    nebulaItemMetadataAcquisitionReceiptSha256: nebulaItemMetadataAcquisition.receiptSha256,
    nebulaLicenseReviewReceiptSha256: nebulaLicenseReview.receiptSha256,
    nebulaVisualSourceAcquisitionReceiptSha256: nebulaVisualSourceAcquisition.receiptSha256,
    nebulaVisualAnalysisReceiptSha256: nebulaVisualAnalysis.receiptSha256,
    nebulaVisualAssetManifestSha256: nebulaVisualAssets.manifestSha256,
    nebulaVisualAssetReceiptSha256: nebulaVisualAssetsReceipt.receiptSha256,
    nebulaExtendedVisualAssetManifestSha256: nebulaExtendedVisualAssets.manifestSha256,
    nebulaExtendedVisualAssetReceiptSha256: nebulaExtendedVisualAssetsReceipt.receiptSha256,
    nebulaClosureVisualAssetManifestSha256: nebulaClosureVisualAssets.manifestSha256,
    nebulaClosureVisualAssetReceiptSha256: nebulaClosureVisualAssetsReceipt.receiptSha256,
    nebulaOverlayBrowserCaptureSha256: nebulaOverlayBrowserReceipt.source.captureSha256,
    nebulaOverlayBrowserMatrixReceiptSha256: nebulaOverlayBrowserReceipt.receiptSha256,
    nebulaBrowserMatrixReceiptSha256: nebulaBrowserReceipt.receiptSha256,
    majorMoonReferenceReceiptSha256: majorMoonReceipt.receiptSha256,
    majorMoonAssetMetadataAdmissionReceiptSha256: majorMoonAssetMetadataAdmission.receiptSha256,
    majorMoonItemMetadataAcquisitionReceiptSha256: majorMoonItemMetadataReceipt.receiptSha256,
    majorMoonItemLicenseReviewReceiptSha256: majorMoonLicenseReview.receiptSha256,
    majorMoonVisualSourceAcquisitionReceiptSha256: majorMoonVisualSourceAcquisition.receiptSha256,
    majorMoonVisualSourceAnalysisReceiptSha256: majorMoonVisualAnalysis.receiptSha256,
    majorMoonOfficialCollectionMetadataReceiptSha256: majorMoonOfficialCollectionMetadata.receiptSha256,
    majorMoonSecondaryProductMetadataReceiptSha256: majorMoonSecondaryProductMetadata.receiptSha256,
    majorMoonOfficialPreviewAcquisitionReceiptSha256: majorMoonOfficialPreviewAcquisition.receiptSha256,
    majorMoonVisualAssetManifestSha256: majorMoonVisualAssets.manifestSha256,
    majorMoonVisualAssetReceiptSha256: majorMoonVisualAssetsReceipt.receiptSha256,
    majorMoonBrowserMatrixReceiptSha256: majorMoonBrowserReceipt.receiptSha256,
    majorMoonSecondaryVisualEvidenceReceiptSha256: majorMoonSecondaryVisualEvidence.receiptSha256,
    majorMoonUsGsFinalAcquisitionReceiptSha256: majorMoonUsGsFinalAcquisition.receiptSha256,
    majorMoonUsGsFinalAnalysisReceiptSha256: majorMoonUsGsFinalAnalysis.receiptSha256,
    majorMoonAlternativeNegativeEvidenceReceiptSha256: majorMoonAlternativeNegativeEvidence.receiptSha256,
    majorMoonNasa3dAcquisitionReceiptSha256: majorMoonNasa3dAcquisition.receiptSha256,
    majorMoonNasa3dAnalysisReceiptSha256: majorMoonNasa3dAnalysis.receiptSha256,
    majorMoonNasa3dNegativeEvidenceReceiptSha256: majorMoonNasa3dNegativeEvidence.receiptSha256,
    standaloneBuildReceiptFileSha256: standaloneBuildGate.fileSha256,
    liteBuildReceiptFileSha256: liteBuildGate.fileSha256,
    currentStateReceiptSha256: currentState.receiptSha256,
    pointerSha256: pointer.pointerSha256,
  },
  releaseAuthorized: false,
}, "reportSha256");

console.log(JSON.stringify({
  status: capability.status,
  manifestSha256: manifest.manifestSha256,
  sourceManifestSha256: sourceManifest.receiptSha256,
  freezeBeforeSha256: freezeBefore.snapshotSha256,
  frozenCount: frozenSnapshot.length,
  frozenDriftCount: frozenDrift.length,
  rotationAdmission: `${rotationPacket.admission.admittedCount}/16`,
  pointerSha256: pointer.pointerSha256,
  formalProductPointer: "v263",
}, null, 2));
