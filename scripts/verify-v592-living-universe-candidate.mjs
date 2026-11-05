import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
const read = (path) => readFileSync(resolve(root, path), "utf8");
function readJson(path) {
  return JSON.parse(read(path));
}
function verifySealed(path, field) {
  const document = readJson(path);
  const unsigned = { ...document };
  delete unsigned[field];
  const observed = canonicalSha(unsigned);
  if (observed !== document[field]) throw new Error(`v592-verify-seal:${path}:${observed}:${document[field]}`);
  return document;
}
function verifyFiles(entries, label) {
  for (const entry of entries) {
    const absolute = resolve(root, entry.path);
    const exists = existsSync(absolute);
    if (!exists) {
      if (entry.expectedSha256 === null && entry.sha256 === null) continue;
      throw new Error(`v592-verify-${label}-missing:${entry.path}`);
    }
    const bytes = readFileSync(absolute);
    const observed = sha256(bytes);
    if (observed !== entry.sha256 || bytes.byteLength !== entry.bytes) {
      throw new Error(`v592-verify-${label}-drift:${entry.path}`);
    }
  }
}

const manifest = verifySealed("public/data/living-universe-v592/manifest.json", "manifestSha256");
const sourceManifest = verifySealed("docs/release/v592/source-manifest-v592.json", "receiptSha256");
const freezeBefore = verifySealed("docs/release/v592/freeze-before-v592.json", "snapshotSha256");
const currentState = verifySealed("docs/release/v592/current-state-receipt-v592.json", "receiptSha256");
const capability = verifySealed("docs/release/v592/capability-report-v592.json", "reportSha256");
const pointer = verifySealed("dist/release/orbit-atlas-current-living-universe-candidate-v592.json", "pointerSha256");
const v591Capability = verifySealed("docs/release/v591/capability-report-v591.json", "reportSha256");
const rotation = verifySealed("public/data/living-universe-v592/rotation-reference.json", "packetSha256");
const rotationReceipt = verifySealed("docs/release/v592/rotation-reference-receipt-v592.json", "receiptSha256");
const pckAcquisition = verifySealed("docs/release/v592/acquisition-receipt-rotation-sources-v592.json", "receiptSha256");
const smallBodyAcquisition = verifySealed("docs/release/v592/acquisition-receipt-small-body-rotation-metadata-v592.json", "receiptSha256");
const orxBennuPckProbe = verifySealed("docs/release/v592/metadata-probe-orx-bennu-pck-directory-blocked-v592.json", "receiptSha256");
const stellarHeroes = verifySealed("public/data/living-universe-v592/stellar-heroes.json", "packetSha256");
const stellarHeroReceipt = verifySealed("docs/release/v592/stellar-hero-catalog-receipt-v592.json", "receiptSha256");
const stellarBrowserReceipt = verifySealed("docs/release/v592/stellar-browser-matrix-receipt-v592.json", "receiptSha256");
const constellationPacket = verifySealed("public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json", "packetSha256");
const gaiaLiteBytes = readFileSync(resolve(root, "public/data/celestial-art-v589/gaia-lite-46000-v589.bin"));
const gaiaSupplementReceipt = verifySealed("docs/release/v592/gaia-stratified-supplement-receipt-v592.json", "receiptSha256");
const gaiaSupplementBytes = readFileSync(resolve(root, gaiaSupplementReceipt.output.path));
const gaiaConstellationBrowserReceipt = verifySealed("docs/release/v592/gaia-constellation-browser-matrix-receipt-v592.json", "receiptSha256");
const constellationArtReferenceReceipt = verifySealed("docs/release/v592/constellation-art-reference-receipt-v592.json", "receiptSha256");
const constellationArtBrowserReceipt = verifySealed("docs/release/v592/constellation-art-browser-matrix-receipt-v592.json", "receiptSha256");
const browserUrlPolicyEvidence = verifySealed("docs/release/v592/browser-url-policy-negative-evidence-v592.json", "receiptSha256");
const nebulaAssetMetadataAdmission = verifySealed("docs/release/v592/nebula-asset-metadata-admission-v592.json", "receiptSha256");
const nebulaAssetSelections = readJson("scripts/v592-nebula-asset-selections.json");
const nebulaItemMetadataAcquisition = verifySealed("docs/release/v592/acquisition-receipt-nebula-item-metadata-v592.json", "receiptSha256");
const nebulaLicenseReview = verifySealed("docs/release/v592/nebula-item-license-review-v592.json", "receiptSha256");
const nebulaVisualSourceAcquisition = verifySealed("docs/release/v592/acquisition-receipt-nebula-visual-sources-v592.json", "receiptSha256");
const nebulaVisualAnalysis = verifySealed("docs/release/v592/nebula-source-visual-analysis-v592.json", "receiptSha256");
const nebulaVisualAssets = verifySealed("public/data/living-universe-v592/nebula-visual-assets.json", "manifestSha256");
const nebulaVisualAssetsReceipt = verifySealed("docs/release/v592/nebula-visual-assets-receipt-v592.json", "receiptSha256");
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
const majorMoonVisualAssetCount = majorMoonVisualAssets.assets.length;
const majorMoonVisualBlockedCount = majorMoonPacket.moons.length - majorMoonVisualAssetCount;
const majorMoonVisualAssetIds = majorMoonVisualAssets.assets.map((asset) => asset.target);
const majorMoonExpectedVisualStatus = `${majorMoonVisualAssetCount}-of-12-albedo-assets-admitted-0-of-12-heroes-admitted`;
const majorMoonExpectedBrowserStatus = `passed-${majorMoonVisualAssetCount}-of-12-runtime-hero-candidates-${majorMoonVisualBlockedCount}-asset-blocked`;
 const majorMoonExpectedProgress = `motion-reference-12/12;orbit-reference-12/12;metadata-12/12;source-metadata-8/8;visual-sources-6/6;coverage-blocked-3/6;official-collections-4;secondary-metadata-5;official-preview-assets-6/6-source-resolution-limited;alternative-metadata-3/3-negative-no-payload;nasa3d-tiffs-3/3-acquired-source-coverage-blocked;albedo-assets-${majorMoonVisualAssetCount}/12;asset-hero-admission-0/12;runtime-hero-candidates-${majorMoonVisualAssetCount}/12;browser-${majorMoonVisualAssetCount * 3}/${majorMoonVisualAssetCount * 3};asset-blocked-${majorMoonVisualBlockedCount}/12;usgs-final-tiffs-0/4-terminal-no-retry`;
 const majorMoonExpectedBlockedGate = `partial:motion-and-orbit-reference-12/12;metadata-12/12;source-metadata-8/8;visual-sources-6/6;coverage-blocked-3/6;official-preview-assets-6/6-source-resolution-limited;alternative-metadata-3/3-negative-no-payload;nasa3d-tiffs-3/3-acquired-source-coverage-blocked;albedo-assets-${majorMoonVisualAssetCount}/12;runtime-hero-candidates-${majorMoonVisualAssetCount}/12;browser-${majorMoonVisualAssetCount * 3}/${majorMoonVisualAssetCount * 3};usgs-final-tiffs-0/4-terminal-no-retry;asset-blocked-${majorMoonVisualBlockedCount}/12`;
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
const majorMoonMetadataDefinitions = readJson("scripts/v592-major-moon-metadata-probes.json");
const majorMoonAssetSelections = readJson("scripts/v592-major-moon-asset-selections.json");
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
const gaiaPresentationManifestBytes = readFileSync(resolve(root, "public/data/gaia-dr3-presentation-10000000-v9/manifest.json"));
const gaiaPresentationManifest = JSON.parse(gaiaPresentationManifestBytes.toString("utf8"));
const gaiaPresentationArchiveBytes = readFileSync(resolve(root, "public/data/gaia-dr3-presentation-10000000-v9/catalog-v9.bin"));
function readQualifiedBuildReceipt(path, expectedTier, expectedDistDir) {
  const bytes = readFileSync(resolve(root, path));
  const receipt = JSON.parse(bytes.toString("utf8"));
  const routeManifestPath = resolve(root, expectedDistDir, "server/app-paths-manifest.json");
  const routeManifestBytes = readFileSync(routeManifestPath);
  const routes = JSON.parse(routeManifestBytes.toString("utf8"));
  if (
    receipt.version !== "v562-atlas-build-resource-receipt-v1"
    || receipt.status !== "passed"
    || receipt.profile !== "local-shadow"
    || receipt.distDir !== expectedDistDir
    || receipt.deliveryTier !== expectedTier
    || receipt.candidateSourceManifestSha256 !== sourceManifest.receiptSha256
    || receipt.heapMb !== 8192
    || receipt.lowMemoryMode !== true
    || receipt.heapPolicyMaximumReached !== true
    || receipt.standaloneTopologyQualified !== true
    || receipt.rollbackSlotAvailable !== true
    || receipt.browserStarted !== false
    || receipt.denseStarted !== false
    || receipt.gpuStarted !== false
    || routes["/local-shadow-v592/page"] !== "app/local-shadow-v592/page.js"
  ) throw new Error(`v592-verify-build-receipt:${path}`);
  return {
    path,
    receipt,
    fileSha256: sha256(bytes),
    routeManifestSha256: sha256(routeManifestBytes),
  };
}
const standaloneBuild = readQualifiedBuildReceipt(
  "dist/release/atlas-v592-standalone-build-resource.json",
  "standalone-full",
  ".next-atlas-v592-standalone-current",
);
const liteBuild = readQualifiedBuildReceipt(
  "dist/release/atlas-v592-lite-build-resource.json",
  "vercel-lite",
  ".next-atlas-v592-lite-current",
);
const projectedFullCompressedBytes = v591Capability.capabilities.budgetChecks.fullCompressed.actualBytes
  + nebulaVisualAssetsReceipt.fullRuntimeBytes
  + nebulaExtendedVisualAssetsReceipt.fullRuntimeBytes
  + nebulaClosureVisualAssetsReceipt.fullRuntimeBytes
  + majorMoonVisualAssetsReceipt.fullRuntimeBytes
  + deepSpaceVisualAssetsReceipt.fullRuntimeBytes;
const projectedLiteTotalBytes = v591Capability.capabilities.budgetChecks.liteTotal.actualBytes
  + nebulaVisualAssetsReceipt.liteIncrementBytes
  + nebulaExtendedVisualAssetsReceipt.liteIncrementBytes
  + nebulaClosureVisualAssetsReceipt.liteIncrementBytes
  + majorMoonVisualAssetsReceipt.liteIncrementBytes
  + deepSpaceVisualAssetsReceipt.liteIncrementBytes;
const fullCompressedMaximumBytes = 750 * 1024 * 1024;
const liteTotalMaximumBytes = 82 * 1024 * 1024;

verifyFiles(freezeBefore.frozenSnapshot, "frozen");
verifyFiles(sourceManifest.files, "source");
verifyFiles(deepSpaceReferenceReceipt.sourceFiles, "deep-space-reference-source");

const generated = read("app/data/livingUniverseManifestV592.generated.ts");
const generatedManifestSha = generated.match(/LIVING_UNIVERSE_MANIFEST_SHA256_V592 = "([a-f0-9]{64})"/)?.[1];
const generatedSourceSha = generated.match(/LIVING_UNIVERSE_SOURCE_MANIFEST_SHA256_V592 = "([a-f0-9]{64})"/)?.[1];
const generatedFreezeSha = generated.match(/LIVING_UNIVERSE_FREEZE_BEFORE_SHA256_V592 = "([a-f0-9]{64})"/)?.[1];
if (
  manifest.version !== "v592-living-universe-candidate-v1"
  || manifest.route !== "/local-shadow-v592"
  || manifest.formalProductPointer !== "v263"
  || manifest.authority.scientificPayloadWriteback !== false
  || manifest.authority.productionReleaseAuthorized !== false
  || manifest.governance.frozenDriftCount !== 0
  || manifest.governance.freezeBeforeSha256 !== freezeBefore.snapshotSha256
  || manifest.governance.sourceManifestSha256 !== sourceManifest.receiptSha256
  || currentState.builds.standalone.qualified !== true
  || currentState.builds.standalone.fileSha256 !== standaloneBuild.fileSha256
  || currentState.builds.standalone.routeManifestSha256 !== standaloneBuild.routeManifestSha256
  || currentState.builds.standalone.buildId !== standaloneBuild.receipt.buildId
  || currentState.builds.lite.qualified !== true
  || currentState.builds.lite.fileSha256 !== liteBuild.fileSha256
  || currentState.builds.lite.routeManifestSha256 !== liteBuild.routeManifestSha256
  || currentState.builds.lite.buildId !== liteBuild.receipt.buildId
  || manifest.budgets.fullCompressed.projectedBytes !== projectedFullCompressedBytes
  || manifest.budgets.fullCompressed.maximumBytes !== fullCompressedMaximumBytes
  || manifest.budgets.fullCompressed.status !== "passed"
  || manifest.budgets.liteTotal.projectedBytes !== projectedLiteTotalBytes
  || manifest.budgets.liteTotal.maximumBytes !== liteTotalMaximumBytes
  || manifest.budgets.liteTotal.status !== "passed"
  || sourceManifest.version !== "v592-source-manifest-v2"
  || sourceManifest.postBuildEvidencePolicy?.excludedFromRuntimeSourceIdentity !== true
  || sourceManifest.postBuildEvidencePolicy?.verificationScope !== "capability-and-readonly-verifier"
  || sourceManifest.postBuildEvidencePolicy?.scientificPayloadWriteback !== false
  || manifest.postBuildBrowserEvidence?.version !== "v592-post-build-browser-evidence-contract-v1"
  || manifest.postBuildBrowserEvidence?.liveMatrixReceiptPath !== "docs/release/v592/browser-live-matrix-receipt-v592.json"
  || manifest.postBuildBrowserEvidence?.soakReceiptPath !== "docs/release/v592/browser-soak-resource-receipt-v592.json"
  || manifest.postBuildBrowserEvidence?.excludedFromRuntimeSourceIdentity !== true
  || manifest.postBuildBrowserEvidence?.excludedFromRuntimeManifestIdentity !== true
  || manifest.postBuildBrowserEvidence?.capabilityProjectionPath !== "docs/release/v592/capability-report-v592.json"
  || manifest.postBuildBrowserEvidence?.scientificPayloadWriteback !== false
  || generatedManifestSha !== manifest.manifestSha256
  || generatedSourceSha !== sourceManifest.receiptSha256
  || generatedFreezeSha !== freezeBefore.snapshotSha256
) throw new Error("v592-verify-manifest-chain");

if (
  rotation.admission.absoluteAdmittedCount !== 14
  || rotation.admission.kinematicAdmittedCount !== 16
  || rotation.admission.incompleteBodies.join(",") !== "bennu,kleopatra"
  || rotation.authority.scientificPayloadWriteback !== false
  || rotationReceipt.packetSha256 !== rotation.packetSha256
  || smallBodyAcquisition.status !== "committed-two-urls-single-request-each-no-retry"
  || smallBodyAcquisition.requestCountPerUrl !== 1
  || smallBodyAcquisition.automaticRetryPerformed !== false
  || smallBodyAcquisition.automaticReplacementPerformed !== false
  || pckAcquisition.status !== "blocked-single-request-no-retry"
  || orxBennuPckProbe.version !== "v592-orx-bennu-pck-directory-metadata-probe-blocked-v1"
  || orxBennuPckProbe.status !== "blocked-no-automatic-retry"
  || orxBennuPckProbe.target !== "bennu"
  || orxBennuPckProbe.url !== "https://naif.jpl.nasa.gov/pub/naif/ORX/kernels/pck/"
  || orxBennuPckProbe.requestCount !== 1
  || orxBennuPckProbe.automaticRetryPerformed !== false
  || orxBennuPckProbe.automaticReplacementPerformed !== false
  || orxBennuPckProbe.payloadDownloaded !== false
  || orxBennuPckProbe.scientificPayloadWriteback !== false
  || manifest.rotation.bennuOrxPckDirectoryProbe.status !== orxBennuPckProbe.status
  || manifest.rotation.bennuOrxPckDirectoryProbe.receiptSha256 !== orxBennuPckProbe.receiptSha256
) throw new Error("v592-verify-rotation-chain");

if (
  stellarHeroes.heroes.length !== 24
  || stellarHeroes.admission.catalogPacketCount !== 24
  || stellarHeroes.admission.maximumGaiaAnchorDistanceDeg > 1.5
  || stellarHeroes.policy.closeupUsesPhysicsShader !== true
  || stellarHeroes.policy.noObservationSurfaceTextureClaim !== true
  || stellarHeroes.authority.scientificPayloadWriteback !== false
  || stellarHeroReceipt.packetSha256 !== stellarHeroes.packetSha256
) throw new Error("v592-verify-stellar-chain");

if (
  stellarBrowserReceipt.status !== "passed-24-of-24-two-mode-browser-matrix"
  || stellarBrowserReceipt.source.stellarPacketSha256 !== stellarHeroes.packetSha256
  || stellarBrowserReceipt.admission.stellarHeroCount !== 24
  || stellarBrowserReceipt.frames.length !== 48
  || stellarBrowserReceipt.admission.singleCanvas !== true
  || stellarBrowserReceipt.admission.scienceCinematicPayloadStable !== true
  || stellarBrowserReceipt.admission.scientificPayloadWriteback !== false
  || stellarBrowserReceipt.admission.consolePageWebglErrorCount !== 0
  || manifest.stellarHeroes.browserMatrixReceiptSha256 !== stellarBrowserReceipt.receiptSha256
  || manifest.stellarHeroes.browserAdmittedCount !== 24
  || manifest.stellarHeroes.browserFrameCount !== 48
) throw new Error("v592-verify-stellar-browser-chain");

if (
  gaiaLiteBytes.byteLength !== 1_104_000
  || sha256(gaiaLiteBytes) !== "a312297456bac7190c7a347d281cea12681ad2bbc6c2458434fb882cf61aa802"
  || constellationPacket.bindings.length !== 88
  || constellationPacket.metrics.waypointCount !== 484
  || constellationPacket.metrics.maximumAngularDistanceDeg > 1.5
  || manifest.starfield.catalogRecordCount !== 46_000
  || manifest.starfield.catalogSha256 !== sha256(gaiaLiteBytes)
  || gaiaSupplementReceipt.status !== "generated-14000-stratified-no-lite-overlap"
  || gaiaSupplementReceipt.output.recordCount !== 14_000
  || gaiaSupplementReceipt.exclusion.overlapCount !== 0
  || gaiaSupplementBytes.byteLength !== gaiaSupplementReceipt.output.bytes
  || sha256(gaiaSupplementBytes) !== gaiaSupplementReceipt.output.sha256
  || manifest.starfield.fullDesktopCurrentCount !== 60_000
  || manifest.starfield.fullSupplementRecordCount !== 14_000
  || manifest.starfield.fullSupplementReceiptSha256 !== gaiaSupplementReceipt.receiptSha256
  || gaiaConstellationBrowserReceipt.status !== "passed-gaia-60000-and-constellations-88-of-88-browser-matrix"
  || gaiaConstellationBrowserReceipt.source.constellationPacketSha256 !== constellationPacket.packetSha256
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
  || manifest.starfield.browserMatrixReceiptSha256 !== gaiaConstellationBrowserReceipt.receiptSha256
  || manifest.starfield.browserFrameCount !== 13
  || manifest.starfield.scientificPayloadWriteback !== false
  || manifest.constellations.inheritedPacketSha256 !== constellationPacket.packetSha256
  || manifest.constellations.runtimeScienceLayerImplemented !== true
  || manifest.constellations.constellationCount !== 88
  || manifest.constellations.waypointCount !== 484
  || manifest.constellations.browserGate !== "passed-88-of-88-science-runtime-focus-matrix"
  || manifest.constellations.browserMatrixReceiptSha256 !== gaiaConstellationBrowserReceipt.receiptSha256
  || manifest.constellations.browserFrameCount !== 13
  || manifest.constellations.focusedCodes.join(",") !== "Ori,UMa,Cas"
  || manifest.constellations.iauBoundaryAdmission !== "blocked-source-not-admitted"
  || browserUrlPolicyEvidence.status !== "blocked-browser-url-policy-manual-open-required"
  || browserUrlPolicyEvidence.policyCompliance.automaticRetryPerformed !== false
  || browserUrlPolicyEvidence.policyCompliance.alternateBrowserUsed !== false
  || manifest.browserPolicy.receiptSha256 !== browserUrlPolicyEvidence.receiptSha256
) throw new Error("v592-verify-gaia-constellation-chain");

const constellationArtCaptureBytes = readFileSync(resolve(root, constellationArtBrowserReceipt.source.capturePath));
const constellationArtCapture = JSON.parse(constellationArtCaptureBytes.toString("utf8"));
const constellationArtExpectedCodes = Object.freeze({ orion: "Ori", "ursa-major": "UMa", cassiopeia: "Cas" });
const constellationArtExpectedFrameKeys = new Set();
for (const target of Object.keys(constellationArtExpectedCodes)) {
  constellationArtExpectedFrameKeys.add(`${target}:science:1440x900`);
  constellationArtExpectedFrameKeys.add(`${target}:cinematic:1440x900`);
  constellationArtExpectedFrameKeys.add(`${target}:cinematic:390x844`);
}
const constellationArtObservedFrameKeys = new Set();
const constellationArtScreenshotShas = new Set();
const constellationArtFocusedSignatures = new Map();
if (
  constellationArtReferenceReceipt.status !== "admitted-88-of-88-data-derived-observatory-engravings"
  || constellationArtReferenceReceipt.primaryModel !== "deterministic-tangent-plane-celestial-engraving"
  || constellationArtReferenceReceipt.admission.requiredCount !== 88
  || constellationArtReferenceReceipt.admission.admittedCount !== 88
  || constellationArtReferenceReceipt.admission.uniqueSignatureCount !== 88
  || constellationArtReferenceReceipt.entries.length !== 88
  || new Set(constellationArtReferenceReceipt.entries.map((entry) => entry.code)).size !== 88
  || new Set(constellationArtReferenceReceipt.entries.map((entry) => entry.signature)).size !== 88
  || constellationArtReferenceReceipt.entries.some((entry) => entry.finite !== true || entry.presentationOnly !== true || entry.scientificPayloadWriteback !== false)
  || constellationArtReferenceReceipt.admission.externalIllustrationAssetCount !== 0
  || constellationArtReferenceReceipt.admission.proceduralFallbackAllowed !== false
  || constellationArtReferenceReceipt.admission.observationImageClaimed !== false
  || constellationArtReferenceReceipt.admission.scientificPayloadWriteback !== false
  || constellationArtReferenceReceipt.admission.iauBoundaryAdmission !== "blocked-source-not-admitted"
  || constellationArtBrowserReceipt.status !== "passed-88-of-88-data-derived-art-three-focus-browser-matrix"
  || constellationArtBrowserReceipt.admission.artAdmittedCount !== 88
  || constellationArtBrowserReceipt.admission.requiredCount !== 88
  || constellationArtBrowserReceipt.admission.focusedCodes.join(",") !== "Ori,UMa,Cas"
  || Object.keys(constellationArtBrowserReceipt.admission.focusedArtSignatures).length !== 3
  || new Set(Object.values(constellationArtBrowserReceipt.admission.focusedArtSignatures)).size !== 3
  || constellationArtBrowserReceipt.admission.frameCount !== 9
  || constellationArtBrowserReceipt.frames.length !== 9
  || constellationArtBrowserReceipt.admission.desktopFrameCount !== 6
  || constellationArtBrowserReceipt.admission.mobileFrameCount !== 3
  || constellationArtBrowserReceipt.admission.scienceFrameCount !== 3
  || constellationArtBrowserReceipt.admission.cinematicFrameCount !== 6
  || constellationArtBrowserReceipt.admission.uniqueScreenshotCount !== 9
  || constellationArtBrowserReceipt.admission.scienceArtLayerDisabled !== true
  || constellationArtBrowserReceipt.admission.singleCanvas !== true
  || constellationArtBrowserReceipt.admission.scienceCinematicPayloadStable !== true
  || constellationArtBrowserReceipt.admission.scientificPayloadSha256 !== "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674"
  || constellationArtBrowserReceipt.admission.scientificPayloadWriteback !== false
  || constellationArtBrowserReceipt.admission.scientificCoordinateMutation !== false
  || constellationArtBrowserReceipt.admission.externalIllustrationAssetCount !== 0
  || constellationArtBrowserReceipt.admission.proceduralFallbackAllowed !== false
  || constellationArtBrowserReceipt.admission.observationImageClaimed !== false
  || constellationArtBrowserReceipt.admission.consolePageWebglErrorOrWarningCount !== 0
  || constellationArtBrowserReceipt.admission.iauBoundaryAdmission !== "blocked-source-not-admitted"
  || constellationArtCapture.version !== "v592-constellation-art-browser-capture-v1"
  || constellationArtCapture.observedCandidateManifestSha256 !== constellationArtBrowserReceipt.source.observedCandidateManifestSha256
  || constellationArtCapture.observedSourceManifestSha256 !== constellationArtBrowserReceipt.source.observedSourceManifestSha256
  || constellationArtCaptureBytes.byteLength !== constellationArtBrowserReceipt.source.captureBytes
  || sha256(constellationArtCaptureBytes) !== constellationArtBrowserReceipt.source.captureSha256
  || manifest.constellations.artAdmissionCount !== 88
  || manifest.constellations.artPrimaryModel !== constellationArtReferenceReceipt.primaryModel
  || manifest.constellations.artReferenceReceiptSha256 !== constellationArtReferenceReceipt.receiptSha256
  || manifest.constellations.artBrowserGate !== "passed-three-focus-science-cinematic-desktop-mobile"
  || manifest.constellations.artBrowserMatrixReceiptSha256 !== constellationArtBrowserReceipt.receiptSha256
  || manifest.constellations.artBrowserFrameCount !== 9
  || manifest.constellations.artBrowserMinimumFpsMedian !== constellationArtBrowserReceipt.admission.minimumFpsMedian
  || manifest.constellations.externalIllustrationAssetCount !== 0
  || manifest.constellations.proceduralArtFallbackAllowed !== false
) throw new Error("v592-verify-constellation-art-chain");

for (const frame of constellationArtBrowserReceipt.frames) {
  const frameKey = `${frame.targetId}:${frame.mode}:${frame.viewport?.width}x${frame.viewport?.height}`;
  const expectedCode = constellationArtExpectedCodes[frame.targetId];
  const desktop = frame.viewport?.width === 1440 && frame.viewport?.height === 900;
  const mobile = frame.viewport?.width === 390 && frame.viewport?.height === 844;
  if (
    !constellationArtExpectedFrameKeys.has(frameKey)
    || constellationArtObservedFrameKeys.has(frameKey)
    || (!desktop && !mobile)
    || expectedCode !== frame.expectedCode
    || frame.candidateManifestSha256 !== constellationArtBrowserReceipt.source.observedCandidateManifestSha256
    || frame.sourceManifestSha256 !== constellationArtBrowserReceipt.source.observedSourceManifestSha256
    || frame.scientificPayloadSha256 !== constellationArtBrowserReceipt.admission.scientificPayloadSha256
    || frame.payloadStable !== "true"
    || frame.scientificWriteback !== "false"
    || frame.canvasCount !== 1
    || frame.constellationCount !== 88
    || frame.waypointCount !== 484
    || frame.focusTarget !== frame.targetId
    || frame.focusCode !== expectedCode
    || frame.artAdmission !== "88/88"
    || frame.artPrimaryModel !== constellationArtReferenceReceipt.primaryModel
    || frame.artProceduralFallback !== "false"
    || frame.artObservationImageClaim !== "false"
    || frame.artScientificWriteback !== "false"
    || frame.fpsGate !== "passed"
    || frame.fpsMedian < 45
    || frame.gpuBytes > (desktop ? 512 * 1024 * 1024 : 192 * 1024 * 1024)
    || frame.drawCalls > 60
  ) throw new Error(`v592-verify-constellation-art-frame:${frameKey}`);
  if (frame.mode === "science") {
    if (frame.artActiveCode !== "none" || frame.artSignature !== "none" || frame.artAnchorCount !== 0 || frame.artDrawCalls !== 0) {
      throw new Error(`v592-verify-constellation-art-science-isolation:${frameKey}`);
    }
  } else {
    if (frame.artActiveCode !== expectedCode || frame.artSignature === "none" || frame.artAnchorCount < 2 || frame.artDrawCalls !== 4) {
      throw new Error(`v592-verify-constellation-art-cinematic:${frameKey}`);
    }
    const prior = constellationArtFocusedSignatures.get(expectedCode);
    if (prior && prior !== frame.artSignature) throw new Error(`v592-verify-constellation-art-signature:${frameKey}`);
    constellationArtFocusedSignatures.set(expectedCode, frame.artSignature);
  }
  if (mobile) {
    const expectedLabel = frame.targetId === "orion" ? "Orion" : frame.targetId === "ursa-major" ? "Ursa Major" : "Cassiopeia";
    if (frame.mobileControlsExpanded !== "false" || !frame.mobileFocusLabel?.startsWith(expectedLabel)) {
      throw new Error(`v592-verify-constellation-art-mobile-focus:${frameKey}`);
    }
  }
  const screenshotBytes = readFileSync(resolve(root, frame.screenshotPath));
  if (
    screenshotBytes.byteLength !== frame.screenshotBytes
    || sha256(screenshotBytes) !== frame.screenshotSha256
    || constellationArtScreenshotShas.has(frame.screenshotSha256)
  ) throw new Error(`v592-verify-constellation-art-screenshot:${frameKey}`);
  constellationArtObservedFrameKeys.add(frameKey);
  constellationArtScreenshotShas.add(frame.screenshotSha256);
}
if (
  constellationArtObservedFrameKeys.size !== 9
  || constellationArtScreenshotShas.size !== 9
  || constellationArtFocusedSignatures.size !== 3
  || new Set(constellationArtFocusedSignatures.values()).size !== 3
) throw new Error("v592-verify-constellation-art-coverage");

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
  || deepSpaceReference.objects.filter((entry) => entry.category === "galaxy").length !== 12
  || deepSpaceReference.objects.filter((entry) => entry.category === "cluster").length !== 12
  || deepSpaceReference.objects.some((entry) => (
    entry.coordinateFrame !== "ICRS/J2000"
    || !Number.isFinite(entry.raDeg) || entry.raDeg < 0 || entry.raDeg >= 360
    || !Number.isFinite(entry.decDeg) || entry.decDeg < -90 || entry.decDeg > 90
    || !Number.isFinite(entry.distancePc) || entry.distancePc <= 0
    || !Number.isFinite(entry.angularSize.majorArcmin) || entry.angularSize.majorArcmin <= 0
    || !Number.isFinite(entry.angularSize.minorArcmin) || entry.angularSize.minorArcmin <= 0
    || entry.visualMetadata.payloadDownloaded !== false
    || entry.visualMetadata.visualAssetAdmitted !== false
    || entry.presentationOnly !== true
    || entry.scientificAuthority !== false
    || entry.scientificPayloadWriteback !== false
  ))
  || deepSpaceReference.policy.payloadDownloadPerformed !== false
  || deepSpaceReference.policy.automaticRetryAllowed !== false
  || deepSpaceReference.policy.automaticReplacementAllowed !== false
  || deepSpaceReference.policy.observationImageClaimRequiresAssetAdmission !== true
  || deepSpaceReference.policy.scientificPayloadWriteback !== false
  || deepSpaceReferenceReceipt.status !== "admitted-12-galaxy-and-12-cluster-reference-packets"
  || deepSpaceReferenceReceipt.packetSha256 !== deepSpaceReference.packetSha256
  || deepSpaceReferenceReceipt.admission.admittedGalaxyReferenceCount !== 12
  || deepSpaceReferenceReceipt.admission.admittedClusterReferenceCount !== 12
  || deepSpaceReferenceReceipt.scientificPayloadWriteback !== false
  || manifest.deepSpace.referencePacketSha256 !== deepSpaceReference.packetSha256
  || manifest.deepSpace.referenceReceiptSha256 !== deepSpaceReferenceReceipt.receiptSha256
  || manifest.deepSpace.galaxyReferenceAdmissionCount !== 12
  || manifest.deepSpace.clusterReferenceAdmissionCount !== 12
  || manifest.deepSpace.deepObjectVisualMetadataCandidateCount !== 18
  || manifest.deepSpace.deepObjectVisualMetadataBlockedCount !== 6
  || manifest.deepSpace.deepObjectReferenceVisualAssetAdmissionCount !== 0
  || manifest.deepSpace.deepObjectPayloadDownloadedCount !== 0
) throw new Error("v592-verify-deep-space-reference-chain");

for (const source of deepSpaceReferenceReceipt.sourceFiles.filter((entry) => entry.path.startsWith("docs/release/v592/metadata-probe-deep-space/"))) {
  const metadata = verifySealed(source.path, "receiptSha256");
  if (
    !["metadata-probe-complete-no-payload", "metadata-supplement-complete-no-payload"].includes(metadata.status)
    || metadata.policy.requestCount !== 1
    || metadata.policy.automaticRetryPerformed !== false
    || metadata.policy.automaticReplacementPerformed !== false
    || metadata.policy.payloadDownloaded !== false
    || metadata.scientificPayloadWriteback !== false
    || metadata.metadataRequest.status !== 200
    || metadata.metadataRequest.url !== metadata.metadataRequest.finalUrl
    || !metadata.metadataRequest.url.startsWith("https://images-api.nasa.gov/")
  ) throw new Error(`v592-verify-deep-space-metadata:${source.path}`);
}

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
  || deepSpaceVisualAssets.policy.scienceModeMarkerOnly !== true
  || deepSpaceVisualAssets.policy.onlyFocusedCinematicObjectLoadsImage !== true
  || deepSpaceVisualAssets.policy.scientificPayloadWriteback !== false
  || deepSpaceVisualAssetsReceipt.status !== "committed-twenty-four-deep-space-visual-models-twelve-galaxies-twelve-clusters"
  || deepSpaceVisualAssetsReceipt.manifestSha256 !== deepSpaceVisualAssets.manifestSha256
  || deepSpaceVisualAssetsReceipt.alternativeLicenseReviewReceiptSha256 !== deepSpaceAlternativeLicenseReview.receiptSha256
  || deepSpaceVisualAssetsReceipt.alternativeVisualAnalysisReceiptSha256 !== deepSpaceAlternativeVisualAnalysis.receiptSha256
  || deepSpaceVisualAssetsReceipt.alternativeContactSheetReceiptSha256 !== deepSpaceAlternativeContactSheetReceipt.receiptSha256
  || deepSpaceVisualAssetsReceipt.gaiaCatalogManifestSha256 !== gaiaPresentationManifest.manifestSha256
  || deepSpaceVisualAssetsReceipt.gaiaCatalogArchiveSha256 !== gaiaPresentationManifest.archive.sha256
  || deepSpaceVisualAssetsReceipt.assetCount !== 24
  || deepSpaceVisualAssetsReceipt.ktx2FileCount !== 88
  || deepSpaceVisualAssetsReceipt.webpFileCount !== 106
  || deepSpaceVisualAssetsReceipt.fullRuntimeBytes !== 87_384_877
  || deepSpaceVisualAssetsReceipt.liteIncrementBytes !== 83_064
  || deepSpaceVisualAssetsReceipt.gaiaCatalogDerivedVisualModelCount !== 10
  || deepSpaceVisualAssetsReceipt.gaiaCatalogPayloadReusedFromExistingAdmission !== true
  || sha256(gaiaPresentationManifestBytes) !== "c5b8ed92ae72e404ab8c1a9a6be71a214869d8a2de6ee948dfcc276d7199b371"
  || gaiaPresentationArchiveBytes.byteLength !== 240_000_000
  || sha256(gaiaPresentationArchiveBytes) !== gaiaPresentationManifest.archive.sha256
  || deepSpaceVisualAssetsReceipt.scienceImagePayload !== false
  || deepSpaceVisualAssetsReceipt.scientificPayloadWriteback !== false
  || deepSpaceSecondaryProbeNegativeEvidence.status !== "eleven-metadata-probes-three-centaurus-items-zero-runtime-admissions"
  || deepSpaceSecondaryProbeNegativeEvidence.summary.metadataProbeCount !== 11
  || deepSpaceSecondaryProbeNegativeEvidence.summary.itemMetadataAcquisitionCount !== 3
  || deepSpaceSecondaryProbeNegativeEvidence.summary.visualPayloadDownloadedCount !== 0
  || deepSpaceSecondaryProbeNegativeEvidence.summary.runtimeAssetAdmittedCount !== 0
  || deepSpaceSecondaryProbeNegativeEvidence.summary.terminalIdentityConflictCount !== 2
  || deepSpaceSecondaryProbeNegativeEvidence.summary.terminalRestrictedOrThirdPartyCount !== 3
  || deepSpaceSecondaryProbeNegativeEvidence.policy.noLicenseThresholdRelaxation !== true
  || deepSpaceSecondaryProbeNegativeEvidence.policy.noIdentityThresholdRelaxation !== true
  || deepSpaceSecondaryProbeNegativeEvidence.policy.scientificPayloadWriteback !== false
  || deepSpaceClusterAlternativeNegativeEvidence.version !== "v592-deep-space-cluster-alternative-negative-evidence-v1"
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
  || manifest.deepSpace.deepObjectVisualAssetAdmissionCount !== 24
  || manifest.deepSpace.galaxyVisualAssetAdmissionCount !== 12
  || manifest.deepSpace.clusterVisualAssetAdmissionCount !== 12
  || manifest.deepSpace.deepObjectVisualAssetBlockedCount !== 0
  || manifest.deepSpace.deepObjectVisualAssetManifestSha256 !== deepSpaceVisualAssets.manifestSha256
  || manifest.deepSpace.deepObjectVisualAssetReceiptSha256 !== deepSpaceVisualAssetsReceipt.receiptSha256
  || manifest.deepSpace.deepObjectSecondaryProbeNegativeEvidenceReceiptSha256 !== deepSpaceSecondaryProbeNegativeEvidence.receiptSha256
  || manifest.deepSpace.deepObjectSecondaryMetadataProbeCount !== 11
  || manifest.deepSpace.deepObjectSecondaryItemMetadataAcquisitionCount !== 3
  || manifest.deepSpace.deepObjectSecondaryVisualPayloadDownloadedCount !== 0
  || manifest.deepSpace.deepObjectSecondaryRuntimeAssetAdmittedCount !== 0
  || manifest.deepSpace.deepObjectClusterAlternativeNegativeEvidenceReceiptSha256 !== deepSpaceClusterAlternativeNegativeEvidence.receiptSha256
  || manifest.deepSpace.deepObjectClusterAlternativeMetadataProbeCount !== 6
  || manifest.deepSpace.deepObjectClusterAlternativeQualifiedVisualTextureCount !== 0
  || manifest.deepSpace.deepObjectClusterAlternativeBlockedTargetCount !== 6
  || manifest.deepSpace.deepObjectPrimaryVisualSourcePayloadDownloadedCount !== 5
  || manifest.deepSpace.deepObjectAlternativeVisualSourcePayloadDownloadedCount !== 9
  || manifest.deepSpace.deepObjectVisualSourcePayloadDownloadedCount !== 14
  || manifest.deepSpace.deepObjectAlternativeVisualDerivationCandidateCount !== 5
  || manifest.deepSpace.deepObjectAlternativeCleanAlternateHeldCount !== 3
  || manifest.deepSpace.deepObjectAlternativeScientificOverlayBlockedCount !== 1
  || manifest.deepSpace.deepObjectGaiaCatalogManifestSha256 !== gaiaPresentationManifest.manifestSha256
  || manifest.deepSpace.deepObjectGaiaCatalogManifestFileSha256 !== sha256(gaiaPresentationManifestBytes)
  || manifest.deepSpace.deepObjectGaiaCatalogArchiveSha256 !== gaiaPresentationManifest.archive.sha256
  || manifest.deepSpace.deepObjectGaiaCatalogDerivedVisualModelCount !== 10
  || manifest.deepSpace.deepObjectGaiaCatalogPayloadReusedFromExistingAdmission !== true
  || manifest.deepSpace.deepObjectScienceImagePayload !== false
  || manifest.deepSpace.deepObjectPresentationOnly !== true
) throw new Error("v592-verify-deep-space-visual-asset-chain");

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
  || deepSpaceBrowserReceipt.admission.scientificPayloadSha256 !== manifest.authority.scientificPayloadSha256
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
) throw new Error("v592-verify-deep-space-browser-matrix-contract");
const deepSpaceProfileExpectations = new Map([
  ["desktop-cinematic", [1440, 900, "cinematic", false]],
  ["desktop-science", [1440, 900, "science", false]],
  ["mobile-cinematic", [390, 844, "cinematic", true]],
  ["mobile-science", [390, 844, "science", true]],
]);
const deepSpaceTargetIds = new Set(deepSpaceBrowserReceipt.frames.map((frame) => frame.targetId));
if (deepSpaceTargetIds.size !== 18) throw new Error("v592-verify-deep-space-target-cardinality");
if (new Set(deepSpaceBrowserReceipt.frames.map((frame) => frame.screenshotSha256)).size !== 72) throw new Error("v592-verify-deep-space-screenshot-uniqueness");
for (const [profile, [width, height, mode, mobile]] of deepSpaceProfileExpectations) {
  const frames = deepSpaceBrowserReceipt.frames.filter((frame) => frame.profile === profile);
  if (frames.length !== 18) throw new Error("v592-verify-deep-space-profile:" + profile);
  for (const frame of frames) {
    const screenshot = readFileSync(resolve(root, frame.screenshotPath));
    const metadata = await sharp(resolve(root, frame.screenshotPath)).metadata();
    if (frame.viewport.width !== width || frame.viewport.height !== height || frame.mode !== mode || frame.singleCanvas !== true || frame.canvasCount !== 1 || frame.payloadStable !== true || frame.scientificPayloadSha256 !== manifest.authority.scientificPayloadSha256 || frame.scientificPayloadWriteback !== false || frame.fpsMedian < 45 || frame.fullFallbackCount !== 0 || frame.blockedSliceCount !== 0 || frame.screenshotPath.includes("..") || !frame.screenshotPath.startsWith("docs/release/v592/screenshots/deep-space-matrix/") || screenshot.byteLength !== frame.screenshotBytes || sha256(screenshot) !== frame.screenshotSha256 || metadata.width !== width || metadata.height !== height || metadata.format !== "jpeg") {
      throw new Error("v592-verify-deep-space-frame:" + profile + ":" + frame.targetId);
    }
    if (mode === "cinematic" && (frame.textureSources !== "ktx2" || frame.state !== "ready" || frame.requestedSliceCount !== frame.readySliceCount || frame.requestedSliceCount < 1)) throw new Error("v592-verify-deep-space-cinematic:" + profile + ":" + frame.targetId);
    if (mode === "science" && (frame.textureSources !== "none" || frame.state !== "admitted-science-marker-only" || frame.requestedSliceCount !== 0 || frame.readySliceCount !== 0 || frame.scienceImagePayload !== false)) throw new Error("v592-verify-deep-space-science:" + profile + ":" + frame.targetId);
    if (mobile && frame.mobileSheetState !== "closed-inert") throw new Error("v592-verify-deep-space-mobile-sheet:" + frame.targetId);
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
  || deepSpaceAnalyticBrowserReceipt.admission.scientificPayloadSha256 !== manifest.authority.scientificPayloadSha256
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
) throw new Error("v592-verify-deep-space-analytic-browser-contract");
const analyticTargetIds = new Set(deepSpaceAnalyticBrowserReceipt.frames.map((frame) => frame.targetId));
if (analyticTargetIds.size !== 6 || new Set(deepSpaceAnalyticBrowserReceipt.frames.map((frame) => frame.screenshotSha256)).size !== 24) throw new Error("v592-verify-deep-space-analytic-cardinality");
for (const frame of deepSpaceAnalyticBrowserReceipt.frames) {
  const screenshot = readFileSync(resolve(root, frame.screenshotPath));
  const metadata = await sharp(resolve(root, frame.screenshotPath)).metadata();
  if (frame.visualModelKind !== "openngc-catalog-derived-galaxy-analytic" || frame.analyticModel !== true || frame.singleCanvas !== true || frame.canvasCount !== 1 || frame.payloadStable !== true || frame.scientificPayloadSha256 !== manifest.authority.scientificPayloadSha256 || frame.scientificPayloadWriteback !== false || frame.fpsMedian < 45 || frame.fullFallbackCount !== 0 || frame.blockedSliceCount !== 0 || frame.screenshotPath.includes("..") || !frame.screenshotPath.startsWith("docs/release/v592/screenshots/deep-space-analytic-matrix/") || screenshot.byteLength !== frame.screenshotBytes || sha256(screenshot) !== frame.screenshotSha256 || metadata.width !== frame.viewport.width || metadata.height !== frame.viewport.height || metadata.format !== "jpeg") {
    throw new Error("v592-verify-deep-space-analytic-frame:" + frame.name);
  }
  if (frame.mode === "cinematic" && (frame.textureSources !== "openngc-analytic-shader" || frame.state !== "ready" || frame.requestedSliceCount !== 1 || frame.readySliceCount !== 1)) throw new Error("v592-verify-deep-space-analytic-cinematic:" + frame.name);
  if (frame.mode === "science" && (frame.textureSources !== "none" || frame.state !== "admitted-science-marker-only" || frame.requestedSliceCount !== 0 || frame.readySliceCount !== 0 || frame.scienceImagePayload !== false)) throw new Error("v592-verify-deep-space-analytic-science:" + frame.name);
  if (frame.viewport.width === 390 && frame.mobileSheetState !== "closed-inert") throw new Error("v592-verify-deep-space-analytic-mobile-sheet:" + frame.name);
}
if (
  manifest.deepSpace.deepObjectBrowserGate !== "passed-18-of-18-four-profile-deep-space-browser-matrix"
  || manifest.deepSpace.deepObjectBrowserMatrixReceiptSha256 !== deepSpaceBrowserReceipt.receiptSha256
  || manifest.deepSpace.deepObjectBrowserCaptureSha256 !== deepSpaceBrowserReceipt.source.captureSha256
  || manifest.deepSpace.deepObjectBrowserFrameCount !== 72
  || manifest.deepSpace.deepObjectBrowserReleaseRestorePassed !== true
) throw new Error("v592-verify-deep-space-browser-manifest-link");
if (
  manifest.deepSpace.deepObjectAnalyticBrowserGate !== "passed-24-of-24-six-openngc-analytic-galaxies-four-profile-browser-matrix"
  || manifest.deepSpace.deepObjectAnalyticBrowserMatrixReceiptSha256 !== deepSpaceAnalyticBrowserReceipt.receiptSha256
  || manifest.deepSpace.deepObjectAnalyticBrowserCaptureSha256 !== deepSpaceAnalyticBrowserReceipt.source.captureSha256
  || manifest.deepSpace.deepObjectAnalyticBrowserFrameCount !== 24
  || manifest.deepSpace.deepObjectAnalyticBrowserReleaseRestorePassed !== true
) throw new Error("v592-verify-deep-space-analytic-manifest-link");

let deepSpaceKtx2FileCount = 0;
let deepSpaceWebpFileCount = 0;
for (const asset of deepSpaceVisualAssets.assets) {
  if (asset.visualModelKind === "openngc-catalog-derived-galaxy-analytic") {
    if (asset.variants !== undefined || asset.catalogDerivedVisualModel !== true || asset.observationImageClaim !== false || asset.analyticModel?.explicitPrimaryModel !== true) {
      throw new Error(`v592-verify-deep-space-analytic-contract:${asset.target}`);
    }
    continue;
  }
  for (const tier of ["desktop", "mobile", "lite"]) {
    for (const slice of asset.variants[tier].slices) {
      for (const [kind, variant] of [["ktx2", slice.ktx2], ["webp", slice.fallback]]) {
        if (!variant) continue;
        const relativePath = `public${variant.url}`;
        const bytes = readFileSync(resolve(root, relativePath));
        if (bytes.byteLength !== variant.bytes || sha256(bytes) !== variant.sha256) {
          throw new Error(`v592-verify-deep-space-runtime-drift:${asset.target}:${tier}:${slice.depthIndex}:${kind}`);
        }
        if (kind === "ktx2") deepSpaceKtx2FileCount += 1;
        else deepSpaceWebpFileCount += 1;
      }
    }
  }
}
if (
  deepSpaceKtx2FileCount !== deepSpaceVisualAssetsReceipt.ktx2FileCount
  || deepSpaceWebpFileCount !== deepSpaceVisualAssetsReceipt.webpFileCount
) throw new Error("v592-verify-deep-space-runtime-file-count");

if (
  nebulaAssetSelections.version !== "v592-nebula-asset-selections-v1"
  || nebulaAssetSelections.selections.length !== 18
  || nebulaAssetMetadataAdmission.status !== "metadata-candidates-assembled-payload-not-acquired"
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
  || manifest.deepSpace.metadataAdmissionReceiptSha256 !== nebulaAssetMetadataAdmission.receiptSha256
  || manifest.deepSpace.payloadDownloadedCount !== 0
  || manifest.deepSpace.expandedAssetAdmissionCount !== 18
  || manifest.deepSpace.expandedAssetGoalCoverageCount !== 24
  || manifest.deepSpace.scientificPayloadWriteback !== false
) throw new Error("v592-verify-nebula-metadata-admission-chain");

function verifyNebulaOverlayLane(manifest, receipt, namespace, expectedTargets) {
  if (
    manifest.version !== `v592-nebula-${namespace}-visual-assets-v2`
    || manifest.status !== "additive-presentation-assets-admitted-signoff-pending"
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
    || receipt.manifestSha256 !== manifest.manifestSha256
    || receipt.admittedTargets.join(",") !== expectedTargets.join(",")
    || receipt.visualSignoffGranted !== false
    || receipt.scientificPayloadWriteback !== false
  ) throw new Error(`v592-verify-nebula-overlay-contract:${namespace}`);
  const full = new Map();
  const lite = new Map();
  for (const asset of manifest.assets) {
    const source = readFileSync(resolve(root, asset.source.path));
    if (source.byteLength !== asset.source.bytes || sha256(source) !== asset.source.sha256 || asset.presentationOnly !== true || asset.scientificAuthority !== false || asset.scientificPayloadWriteback !== false) throw new Error(`v592-verify-nebula-overlay-source:${namespace}:${asset.target}`);
    for (const tierName of ["desktop", "mobile"]) for (const slice of asset.tiers[tierName].slices) {
      full.set(slice.ktx2.url, slice.ktx2);
      full.set(slice.fallback.url, slice.fallback);
    }
    for (const slice of asset.tiers.lite.slices) {
      lite.set(slice.desktopFallback.url, slice.desktopFallback);
      lite.set(slice.mobileFallback.url, slice.mobileFallback);
    }
  }
  for (const file of [...full.values(), ...lite.values()]) {
    const bytes = readFileSync(resolve(root, `public${file.url}`));
    if (bytes.byteLength !== file.bytes || sha256(bytes) !== file.sha256) throw new Error(`v592-verify-nebula-overlay-runtime:${namespace}:${file.url}`);
  }
  const fullBytes = [...full.values()].reduce((sum, file) => sum + file.bytes, 0);
  const liteBytes = [...lite.values()].reduce((sum, file) => sum + file.bytes, 0);
  if (full.size !== receipt.uniqueFullFileCount || lite.size !== receipt.uniqueLiteFileCount || fullBytes !== receipt.fullRuntimeBytes || liteBytes !== receipt.liteIncrementBytes) throw new Error(`v592-verify-nebula-overlay-budget:${namespace}`);
  return { fullBytes, liteBytes };
}
const extendedOverlayBudget = verifyNebulaOverlayLane(nebulaExtendedVisualAssets, nebulaExtendedVisualAssetsReceipt, "extended", ["jellyfish-nebula", "cocoon-nebula", "rho-ophiuchi-cloud", "cepheus-c-nebula", "dragon-lair-nebula"]);
const closureOverlayBudget = verifyNebulaOverlayLane(nebulaClosureVisualAssets, nebulaClosureVisualAssetsReceipt, "closure", ["monkey-head-nebula", "w40-nebula", "sh2-235-nebula", "flaming-star-nebula", "spider-nebula", "tarantula-nebula", "tadpole-nebula"]);
if (extendedOverlayBudget.fullBytes + closureOverlayBudget.fullBytes > 20 * 1024 * 1024 || extendedOverlayBudget.liteBytes + closureOverlayBudget.liteBytes > 64 * 1024) throw new Error("v592-verify-nebula-overlay-budget-total");

const nebulaOverlayExpectedTargets = [
  ["jellyfish-nebula", "IC 443"],
  ["cocoon-nebula", "IC 5146"],
  ["rho-ophiuchi-cloud", "Rho Ophiuchi"],
  ["cepheus-c-nebula", "Cepheus C"],
  ["dragon-lair-nebula", "M17 / NGC 6618"],
  ["monkey-head-nebula", "NGC 2174"],
  ["w40-nebula", "W40"],
  ["sh2-235-nebula", "Sh2-235"],
  ["flaming-star-nebula", "IC 405"],
  ["spider-nebula", "IC 417"],
  ["tarantula-nebula", "NGC 2070"],
  ["tadpole-nebula", "IC 410"],
];
const overlayCapturePath = nebulaOverlayBrowserReceipt.source.capturePath;
const overlayCaptureBytes = readFileSync(resolve(root, overlayCapturePath));
if (
  nebulaOverlayBrowserReceipt.version !== "v592-nebula-overlay-browser-matrix-receipt-v1"
  || nebulaOverlayBrowserReceipt.status !== "passed-twelve-of-twelve-overlay-four-profile-browser-matrix"
  || nebulaOverlayBrowserReceipt.route !== "/local-shadow-v592"
  || nebulaOverlayBrowserReceipt.source.captureBytes !== overlayCaptureBytes.byteLength
  || nebulaOverlayBrowserReceipt.source.captureSha256 !== sha256(overlayCaptureBytes)
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
  || nebulaOverlayBrowserReceipt.admission.scientificPayloadSha256 !== manifest.authority.scientificPayloadSha256
  || nebulaOverlayBrowserReceipt.admission.scientificPayloadWriteback !== false
  || nebulaOverlayBrowserReceipt.admission.scientificCoordinateMutation !== false
  || nebulaOverlayBrowserReceipt.admission.scienceImagePayloadLoaded !== false
  || nebulaOverlayBrowserReceipt.admission.consolePageWebglErrorCount !== 0
  || nebulaOverlayBrowserReceipt.admission.fullFallbackCount !== 0
  || nebulaOverlayBrowserReceipt.admission.gpuGateClaimedByThisReceipt !== false
  || nebulaOverlayBrowserReceipt.policy.gpuTelemetryLimitationPreserved !== true
  || nebulaOverlayBrowserReceipt.policy.alternateBrowserUsed !== false
) throw new Error("v592-verify-nebula-overlay-browser-contract");
if (new Set(nebulaOverlayBrowserReceipt.frames.map((frame) => frame.screenshotSha256)).size !== 48) throw new Error("v592-verify-nebula-overlay-browser-screenshot-uniqueness");
for (const profile of [
  { prefix: "desktop-cinematic-", mode: "cinematic", width: 1440, height: 900, slices: 4, mobile: false },
  { prefix: "mobile-cinematic-", mode: "cinematic", width: 390, height: 844, slices: 2, mobile: true },
  { prefix: "desktop-science-", mode: "science", width: 1440, height: 900, slices: 0, mobile: false },
  { prefix: "mobile-science-", mode: "science", width: 390, height: 844, slices: 0, mobile: true },
]) {
  const frames = nebulaOverlayBrowserReceipt.frames.filter((frame) => frame.name.startsWith(profile.prefix));
  if (frames.length !== 12) throw new Error(`v592-verify-nebula-overlay-browser-profile:${profile.prefix}`);
  for (const [targetId, catalogName] of nebulaOverlayExpectedTargets) {
    const frame = frames.find((entry) => entry.targetId === targetId);
    if (!frame || !frame.name.endsWith(catalogName) || frame.mode !== profile.mode || frame.payloadStable !== true || frame.singleCanvas !== true || frame.canvasCount !== 1 || frame.scientificPayloadSha256 !== manifest.authority.scientificPayloadSha256 || frame.scientificPayloadWriteback !== false || frame.fpsMedian < 45 || frame.blockedSliceCount !== 0 || frame.fullFallbackCount !== 0) throw new Error(`v592-verify-nebula-overlay-browser-frame:${profile.prefix}:${targetId}`);
    if (frame.viewport.width !== profile.width || frame.viewport.height !== profile.height || frame.screenshotPath.includes("..") || !frame.screenshotPath.startsWith("docs/release/v592/screenshots/nebula-overlay-matrix/")) throw new Error(`v592-verify-nebula-overlay-browser-path:${profile.prefix}:${targetId}`);
    const screenshot = readFileSync(resolve(root, frame.screenshotPath));
    if (screenshot.byteLength !== frame.screenshotBytes || sha256(screenshot) !== frame.screenshotSha256) throw new Error(`v592-verify-nebula-overlay-browser-screenshot:${profile.prefix}:${targetId}`);
    const metadata = await sharp(resolve(root, frame.screenshotPath)).metadata();
    if (metadata.width !== profile.width || metadata.height !== profile.height) throw new Error(`v592-verify-nebula-overlay-browser-dimensions:${profile.prefix}:${targetId}`);
    if (profile.mode === "cinematic") {
      if (frame.runtime !== "ready" || frame.textureSources !== "ktx2" || frame.requestedSliceCount !== profile.slices || frame.readySliceCount !== profile.slices) throw new Error(`v592-verify-nebula-overlay-browser-cinematic:${profile.prefix}:${targetId}`);
    } else if (frame.runtime !== "science-marker-only" || frame.textureSources !== "none" || frame.requestedSliceCount !== 0 || frame.readySliceCount !== 0 || (profile.mobile && frame.mobileSheetState !== "closed-inert")) throw new Error(`v592-verify-nebula-overlay-browser-science:${profile.prefix}:${targetId}`);
  }
}

for (const selection of nebulaAssetSelections.selections) {
  const aggregate = nebulaAssetMetadataAdmission.targets.find((entry) => entry.target === selection.target);
  if (!aggregate || aggregate.nasaId !== selection.nasaId || aggregate.payloadDownloaded !== false || aggregate.assetAdmitted !== false) {
    throw new Error(`v592-verify-nebula-metadata-target:${selection.target}`);
  }
  const metadata = verifySealed(`docs/release/v592/metadata-probe-nebulae/${selection.metadataProbe}.json`, "receiptSha256");
  if (metadata.receiptSha256 !== aggregate.metadataProbeReceiptSha256) throw new Error(`v592-verify-nebula-metadata-receipt:${selection.target}`);
  if (aggregate.state === "candidate-explicit-https-acquisition-required") {
    const asset = verifySealed(`docs/release/v592/metadata-probe-nebula-assets/${selection.target}.json`, "receiptSha256");
    if (
      asset.receiptSha256 !== aggregate.assetManifestReceiptSha256
      || asset.version !== "v592-nebula-asset-manifest-probe-v2"
      || asset.policy.requestCount !== 1
      || asset.policy.automaticRetryPerformed !== false
      || asset.policy.payloadDownloaded !== false
      || asset.payloadAdmission !== "requires-explicit-https-acquisition"
      || aggregate.acquisitionCandidate?.requested !== false
      || !aggregate.acquisitionCandidate?.httpsUrl?.startsWith("https://")
      || aggregate.acquisitionCandidate?.bytes !== null
      || aggregate.acquisitionCandidate?.sha256 !== null
    ) throw new Error(`v592-verify-nebula-asset-candidate:${selection.target}`);
  } else if (aggregate.state === "blocked-prior-terminal-no-retry") {
    const blocked = verifySealed(`docs/release/v592/metadata-probe-nebula-assets/${selection.target}-blocked.json`, "receiptSha256");
    if (
      blocked.receiptSha256 !== aggregate.assetManifestReceiptSha256
      || blocked.requestCount !== 1
      || blocked.automaticRetryPerformed !== false
      || blocked.payloadDownloaded !== false
      || aggregate.acquisitionCandidate !== null
    ) throw new Error(`v592-verify-nebula-asset-blocked:${selection.target}`);
  } else {
    throw new Error(`v592-verify-nebula-asset-state:${selection.target}`);
  }
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
) throw new Error("v592-verify-nebula-source-acquisition-chain");

for (const entry of [...nebulaItemMetadataAcquisition.assets, ...nebulaVisualSourceAcquisition.assets]) {
  const bytes = readFileSync(resolve(root, entry.outputPath));
  if (bytes.byteLength !== entry.bytes || sha256(bytes) !== entry.sha256) throw new Error(`v592-verify-nebula-source-drift:${entry.target}`);
}

if (
  nebulaVisualAnalysis.status !== "six-runtime-derivation-candidates-one-visual-coverage-blocked"
  || nebulaVisualAnalysis.sourceAcquisitionReceiptSha256 !== nebulaVisualSourceAcquisition.receiptSha256
  || nebulaVisualAnalysis.licenseReviewReceiptSha256 !== nebulaLicenseReview.receiptSha256
  || nebulaVisualAnalysis.summary.analyzedCount !== 7
  || nebulaVisualAnalysis.summary.runtimeDerivationCandidateCount !== 6
  || nebulaVisualAnalysis.summary.visualCoverageBlockedCount !== 1
  || nebulaVisualAnalysis.summary.runtimeAssetAdmittedCount !== 0
  || nebulaVisualAnalysis.derivableTargets.join(",") !== "heart-nebula,soul-nebula,witch-head-nebula,flame-nebula,pacman-nebula,running-chicken-nebula"
  || nebulaVisualAnalysis.blockedTargets.join(",") !== "california-nebula"
  || nebulaVisualAnalysis.policy.noInpainting !== true
  || nebulaVisualAnalysis.policy.noSyntheticCoverageFill !== true
) throw new Error("v592-verify-nebula-source-analysis-chain");

if (
  nebulaVisualAssets.status !== "six-of-seven-source-reviewed-nebula-runtime-assets-admitted"
  || nebulaVisualAssets.policy.runtimeAssetAdmittedCount !== 6
  || nebulaVisualAssets.admission.sourceReviewedCount !== 7
  || nebulaVisualAssets.admission.sourceCoverageBlockedCount !== 1
  || nebulaVisualAssets.admission.runtimeAssetAdmittedCount !== 6
  || nebulaVisualAssets.admission.heroAdmissionCount !== 0
  || nebulaVisualAssets.admission.admittedTargets.join(",") !== "heart-nebula,soul-nebula,witch-head-nebula,flame-nebula,pacman-nebula,running-chicken-nebula"
  || nebulaVisualAssets.admission.blockedTargets.includes("california-nebula") !== true
  || nebulaVisualAssets.assets.length !== 6
  || nebulaVisualAssets.assets.some((asset) => asset.presentationOnly !== true || asset.scientificAuthority !== false || asset.scientificPayloadWriteback !== false || asset.derivation.parameters.inpainting !== false || asset.derivation.parameters.syntheticCoverageFill !== false || asset.derivation.parameters.scientificDataClaim !== false)
  || nebulaVisualAssets.policy.proceduralFallbackAllowed !== false
  || nebulaVisualAssets.policy.scienceImagePayloadAllowed !== false
  || nebulaVisualAssetsReceipt.manifestSha256 !== nebulaVisualAssets.manifestSha256
  || nebulaVisualAssetsReceipt.admission.runtimeAssetAdmittedCount !== 6
  || nebulaVisualAssetsReceipt.heroAdmissionGranted !== false
  || nebulaVisualAssetsReceipt.scientificPayloadWriteback !== false
  || manifest.deepSpace.visualAssetManifestSha256 !== nebulaVisualAssets.manifestSha256
  || manifest.deepSpace.visualAssetReceiptSha256 !== nebulaVisualAssetsReceipt.receiptSha256
  || manifest.deepSpace.visualSourceAcquisitionReceiptSha256 !== nebulaVisualSourceAcquisition.receiptSha256
  || manifest.deepSpace.visualAnalysisReceiptSha256 !== nebulaVisualAnalysis.receiptSha256
  || manifest.deepSpace.visualAssetTargets.join(",") !== nebulaVisualAssets.admission.admittedTargets.join(",")
  || manifest.deepSpace.extendedOverlayManifestSha256 !== nebulaExtendedVisualAssets.manifestSha256
  || manifest.deepSpace.extendedOverlayReceiptSha256 !== nebulaExtendedVisualAssetsReceipt.receiptSha256
  || manifest.deepSpace.extendedOverlayAssetCount !== 5
  || manifest.deepSpace.closureOverlayManifestSha256 !== nebulaClosureVisualAssets.manifestSha256
  || manifest.deepSpace.closureOverlayReceiptSha256 !== nebulaClosureVisualAssetsReceipt.receiptSha256
  || manifest.deepSpace.closureOverlayAssetCount !== 7
  || manifest.deepSpace.overlayBrowserGate !== "passed-12-of-12-four-profile-overlay-matrix"
  || manifest.deepSpace.overlayBrowserMatrixReceiptSha256 !== nebulaOverlayBrowserReceipt.receiptSha256
  || manifest.deepSpace.overlayBrowserFrameCount !== 48
  || manifest.deepSpace.overlayBrowserScienceMarkerOnlyFrameCount !== 24
  || manifest.deepSpace.overlayBrowserNativeKtx2CinematicFrameCount !== 24
  || manifest.deepSpace.overlayBrowserSingleCanvas !== true
  || manifest.deepSpace.overlayBrowserPayloadStable !== true
) throw new Error("v592-verify-nebula-visual-asset-chain");

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
  || nebulaBrowserReceipt.admission.scientificCoordinateMutation !== false
  || nebulaBrowserReceipt.admission.consolePageWebglErrorOrWarningCount !== 0
  || nebulaBrowserReceipt.admission.fullFallbackCount !== 0
  || nebulaBrowserReceipt.admission.minimumCinematicRoiMeanLuminance < 5.25
  || nebulaBrowserReceipt.admission.minimumCinematicRoiNonBlackFraction < 0.02
  || nebulaBrowserReceipt.admission.minimumCinematicRoiBrightFraction < 0.008
  || manifest.deepSpace.browserGate !== "passed-six-of-six-three-profile-native-ktx2-matrix"
  || manifest.deepSpace.browserMatrixReceiptSha256 !== nebulaBrowserReceipt.receiptSha256
  || manifest.deepSpace.browserFrameCount !== 18
) throw new Error("v592-verify-nebula-browser-matrix");

for (const frame of nebulaBrowserReceipt.frames) {
  const screenshot = readFileSync(resolve(root, frame.screenshotPath));
  if (screenshot.byteLength !== frame.screenshotBytes || sha256(screenshot) !== frame.screenshotSha256) {
    throw new Error(`v592-verify-nebula-browser-screenshot:${frame.name}`);
  }
}

for (const asset of nebulaVisualAssets.assets) {
  for (const tier of Object.values(asset.tiers)) {
    for (const slice of tier.slices) {
      for (const variant of Object.values(slice).filter((value) => value && typeof value === "object" && "url" in value)) {
        const path = `public${variant.url}`;
        const bytes = readFileSync(resolve(root, path));
        if (bytes.byteLength !== variant.bytes || sha256(bytes) !== variant.sha256) throw new Error(`v592-verify-nebula-runtime-drift:${asset.target}:${variant.role}`);
      }
    }
  }
}

if (
  majorMoonPacket.status !== "12-of-12-motion-reference-admitted-0-of-12-visual-assets-admitted"
  || majorMoonPacket.moons.length !== 12
  || new Set(majorMoonPacket.moons.map((moon) => moon.bodyId)).size !== 12
  || majorMoonPacket.admission.motionReferenceAdmittedCount !== 12
  || majorMoonPacket.admission.orbitReferenceAdmittedCount !== 12
  || majorMoonPacket.admission.visualAssetAdmittedCount !== 0
  || majorMoonPacket.admission.heroAdmittedCount !== 0
  || majorMoonPacket.admission.assetBlockedBodies.length !== 12
  || majorMoonPacket.policy.proceduralFallbackAllowed !== false
  || majorMoonPacket.policy.coloredPlaceholderAllowed !== false
  || majorMoonPacket.moons.some((moon) => moon.visualAsset.status !== "asset-blocked" || moon.visualAsset.proceduralFallbackAllowed !== false || moon.scientificPayloadWriteback !== false)
  || majorMoonReceipt.packetSha256 !== majorMoonPacket.packetSha256
  || manifest.majorMoons.packetSha256 !== majorMoonPacket.packetSha256
  || manifest.majorMoons.motionReferenceAdmittedCount !== 12
  || manifest.majorMoons.referencePacketVisualAssetAdmittedCount !== 0
  || manifest.majorMoons.visualAssetAdmittedCount !== majorMoonVisualAssetCount
  || manifest.majorMoons.heroAdmittedCount !== 0
  || manifest.majorMoons.runtimeHeroCandidateCount !== majorMoonVisualAssetCount
  || manifest.majorMoons.runtimeHeroCandidateIds.join(",") !== majorMoonVisualAssetIds.join(",")
  || manifest.majorMoons.browserMatrixReceiptSha256 !== majorMoonBrowserReceipt.receiptSha256
  || manifest.majorMoons.scientificPayloadWriteback !== false
) throw new Error("v592-verify-major-moon-reference-chain");

if (
  majorMoonMetadataDefinitions.version !== "v592-major-moon-metadata-probes-v1"
  || majorMoonMetadataDefinitions.probes.length !== 12
  || majorMoonAssetSelections.version !== "v592-major-moon-asset-selections-v1"
  || majorMoonAssetSelections.selections.length !== 8
  || majorMoonAssetSelections.unresolved.length !== 4
  || majorMoonAssetMetadataAdmission.status !== "8-of-12-explicit-https-candidates-0-payloads-0-visual-admissions"
  || majorMoonAssetMetadataAdmission.summary.requiredTargetCount !== 12
  || majorMoonAssetMetadataAdmission.summary.metadataProbeCompleteCount !== 12
  || majorMoonAssetMetadataAdmission.summary.explicitHttpsAcquisitionCandidateCount !== 8
  || majorMoonAssetMetadataAdmission.summary.unresolvedTargetCount !== 4
  || majorMoonAssetMetadataAdmission.summary.payloadDownloadedCount !== 0
  || majorMoonAssetMetadataAdmission.summary.visualAssetAdmittedCount !== 0
  || majorMoonAssetMetadataAdmission.policy.payloadDownloadAllowedByThisReceipt !== false
  || majorMoonAssetMetadataAdmission.policy.visualAssetAdmissionGranted !== false
  || majorMoonAssetMetadataAdmission.policy.proceduralFallbackAllowed !== false
  || manifest.majorMoons.assetMetadataAdmissionReceiptSha256 !== majorMoonAssetMetadataAdmission.receiptSha256
  || manifest.majorMoons.explicitHttpsAcquisitionCandidateCount !== 8
  || manifest.majorMoons.payloadDownloadedCount !== 0
) throw new Error("v592-verify-major-moon-asset-metadata-chain");

for (const definition of majorMoonMetadataDefinitions.probes) {
  const aggregate = majorMoonAssetMetadataAdmission.targets.find((entry) => entry.target === definition.id);
  if (!aggregate || aggregate.payloadDownloaded !== false || aggregate.visualAssetAdmitted !== false) {
    throw new Error(`v592-verify-major-moon-asset-target:${definition.id}`);
  }
  const metadata = verifySealed(`docs/release/v592/metadata-probe-major-moons/${definition.id}.json`, "receiptSha256");
  if (
    metadata.receiptSha256 !== aggregate.metadataReceiptSha256
    || metadata.policy.requestCount !== 1
    || metadata.policy.automaticRetryPerformed !== false
    || metadata.policy.payloadDownloaded !== false
    || metadata.visualAssetAdmission !== false
  ) throw new Error(`v592-verify-major-moon-metadata-receipt:${definition.id}`);
  if (aggregate.acquisitionCandidate) {
    const asset = verifySealed(`docs/release/v592/metadata-probe-major-moon-assets/${definition.id}.json`, "receiptSha256");
    if (
      asset.receiptSha256 !== aggregate.assetManifestReceiptSha256
      || asset.policy.requestCount !== 1
      || asset.policy.automaticRetryPerformed !== false
      || asset.policy.payloadDownloaded !== false
      || asset.policy.visualAssetAdmissionGranted !== false
      || aggregate.acquisitionCandidate.requested !== false
      || !aggregate.acquisitionCandidate.httpsUrl.startsWith("https://")
      || aggregate.acquisitionCandidate.bytes !== null
      || aggregate.acquisitionCandidate.sha256 !== null
    ) throw new Error(`v592-verify-major-moon-asset-candidate:${definition.id}`);
  } else if (aggregate.state !== "blocked-no-qualified-selection") {
    throw new Error(`v592-verify-major-moon-asset-unresolved:${definition.id}`);
  }
}

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
) throw new Error("v592-verify-major-moon-source-acquisition-chain");

for (const entry of [...majorMoonItemMetadataReceipt.assets, ...majorMoonVisualSourceAcquisition.assets]) {
  const bytes = readFileSync(resolve(root, entry.outputPath));
  if (bytes.byteLength !== entry.bytes || sha256(bytes) !== entry.sha256) {
    throw new Error(`v592-verify-major-moon-source-drift:${entry.target}`);
  }
}

if (
  majorMoonVisualAnalysis.status !== "three-runtime-derivation-candidates-three-source-coverage-blocked"
  || majorMoonVisualAnalysis.sourceAcquisitionReceiptSha256 !== majorMoonVisualSourceAcquisition.receiptSha256
  || majorMoonVisualAnalysis.summary.analyzedCount !== 6
  || majorMoonVisualAnalysis.summary.runtimeDerivationCandidateCount !== 3
  || majorMoonVisualAnalysis.summary.sourceCoverageBlockedCount !== 3
  || majorMoonVisualAnalysis.summary.runtimeAssetAdmittedCount !== 0
  || majorMoonVisualAnalysis.derivableTargets.join(",") !== "titan,enceladus,rhea"
  || majorMoonVisualAnalysis.blockedTargets.join(",") !== "iapetus,triton,charon"
  || majorMoonVisualAnalysis.policy.noInpainting !== true
  || majorMoonVisualAnalysis.policy.noSyntheticCoverageFill !== true
  || majorMoonVisualAnalysis.policy.noObservationDataClaimForMissingPixels !== true
  || majorMoonVisualAnalysis.analyses.find((entry) => entry.target === "charon")?.visualInspectionDecision !== "blocked-source-coverage-gap"
) throw new Error("v592-verify-major-moon-source-analysis-chain");

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
) throw new Error("v592-verify-major-moon-official-preview-source-chain");
for (const entry of [
  ...majorMoonOfficialCollectionMetadata.assets,
  ...majorMoonSecondaryProductMetadata.assets,
  ...majorMoonOfficialPreviewAcquisition.assets,
]) {
  const bytes = readFileSync(resolve(root, entry.outputPath));
  if (bytes.byteLength !== entry.bytes || sha256(bytes) !== entry.sha256) {
    throw new Error(`v592-verify-major-moon-official-source-drift:${entry.id ?? entry.target}`);
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
  || majorMoonVisualAssets.assets.some((asset) => asset.heroAdmission !== false || asset.scientificAuthority !== false || asset.presentationOnly !== true || asset.scientificPayloadWriteback !== false || asset.derivation.parameters.inpainting !== false || asset.derivation.parameters.syntheticCoverageFill !== false)
  || majorMoonVisualAssets.policy.proceduralFallbackAllowed !== false
  || majorMoonVisualAssets.policy.coloredPlaceholderAllowed !== false
  || majorMoonVisualAssetsReceipt.manifestSha256 !== majorMoonVisualAssets.manifestSha256
  || majorMoonVisualAssetsReceipt.admission.albedoAssetAdmittedCount !== majorMoonVisualAssetCount
  || majorMoonVisualAssetsReceipt.admission.heroAdmittedCount !== 0
  || majorMoonVisualAssets.sourceReceipts.officialPreviewAcquisitionReceiptSha256 !== majorMoonOfficialPreviewAcquisition.receiptSha256
  || majorMoonVisualAssetsReceipt.officialPreviewAssetCount !== 6
  || majorMoonVisualAssetsReceipt.officialPreviewSourceResolutionLimited !== true
  || majorMoonVisualAssetsReceipt.officialPreviewAcquisitionReceiptSha256 !== majorMoonOfficialPreviewAcquisition.receiptSha256
  || majorMoonVisualAssetsReceipt.heroAdmissionGranted !== false
  || majorMoonVisualAssetsReceipt.scientificPayloadWriteback !== false
  || manifest.majorMoons.visualAssetManifestSha256 !== majorMoonVisualAssets.manifestSha256
  || manifest.majorMoons.visualAssetReceiptSha256 !== majorMoonVisualAssetsReceipt.receiptSha256
  || manifest.majorMoons.visualSourceAnalysisReceiptSha256 !== majorMoonVisualAnalysis.receiptSha256
  || manifest.majorMoons.visualSourceAcquisitionReceiptSha256 !== majorMoonVisualSourceAcquisition.receiptSha256
  || manifest.majorMoons.itemLicenseReviewReceiptSha256 !== majorMoonLicenseReview.receiptSha256
  || manifest.majorMoons.itemMetadataAcquisitionReceiptSha256 !== majorMoonItemMetadataReceipt.receiptSha256
  || manifest.majorMoons.officialCollectionMetadataReceiptSha256 !== majorMoonOfficialCollectionMetadata.receiptSha256
  || manifest.majorMoons.secondaryProductMetadataReceiptSha256 !== majorMoonSecondaryProductMetadata.receiptSha256
  || manifest.majorMoons.officialPreviewAssetCount !== 6
  || manifest.majorMoons.officialPreviewSourceResolutionLimited !== true
  || manifest.majorMoons.officialPreviewAcquisitionReceiptSha256 !== majorMoonOfficialPreviewAcquisition.receiptSha256
) throw new Error("v592-verify-major-moon-visual-asset-chain");

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
) throw new Error("v592-verify-major-moon-browser-matrix");

if (
  majorMoonSecondaryVisualEvidence.status !== "callisto-official-secondary-lane-blocked-no-qualified-global-texture"
  || majorMoonSecondaryVisualEvidence.target !== "callisto"
  || majorMoonSecondaryVisualEvidence.policy.singleRequestPerUrl !== true
  || majorMoonSecondaryVisualEvidence.policy.automaticRetryPerformed !== false
  || majorMoonSecondaryVisualEvidence.policy.automaticReplacementPerformed !== false
  || majorMoonSecondaryVisualEvidence.policy.noInpainting !== true
  || majorMoonSecondaryVisualEvidence.policy.noAnnotationRemoval !== true
  || majorMoonSecondaryVisualEvidence.policy.noSyntheticCoverageFill !== true
  || majorMoonSecondaryVisualEvidence.policy.visualAssetAdmissionGranted !== false
  || majorMoonSecondaryVisualEvidence.policy.heroAdmissionGranted !== false
  || majorMoonSecondaryVisualEvidence.admission.qualifiedGlobalTextureCount !== 0
  || majorMoonSecondaryVisualEvidence.admission.runtimeHeroCandidateCount !== 0
  || manifest.majorMoons.secondaryVisualEvidenceReceiptSha256 !== majorMoonSecondaryVisualEvidence.receiptSha256
  || manifest.majorMoons.secondaryVisualEvidenceStatus !== majorMoonSecondaryVisualEvidence.status
  || manifest.majorMoons.secondaryVisualQualifiedGlobalTextureCount !== 0
) throw new Error("v592-verify-major-moon-secondary-visual-evidence");

if (
  majorMoonUsGsFinalAcquisition.version !== "v592-major-moon-usgs-final-visual-source-acquisition-v1"
  || majorMoonUsGsFinalAcquisition.status !== "partial-usgs-pds-tiffs-with-terminal-failures-no-retry"
  || majorMoonUsGsFinalAcquisition.requestedUrls.length !== 4
  || majorMoonUsGsFinalAcquisition.assets.length !== 0
  || majorMoonUsGsFinalAcquisition.failures.length !== 4
  || majorMoonUsGsFinalAcquisition.failures.map((failure) => failure.target).join(",") !== "io,europa,ganymede,callisto"
  || majorMoonUsGsFinalAcquisition.failures.some((failure) => failure.requestCount !== 1 || failure.automaticRetryPerformed !== false || failure.automaticReplacementPerformed !== false)
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
  || manifest.majorMoons.usgsFinalSourceAcquisitionReceiptSha256 !== majorMoonUsGsFinalAcquisition.receiptSha256
  || manifest.majorMoons.usgsFinalSourceAnalysisReceiptSha256 !== majorMoonUsGsFinalAnalysis.receiptSha256
  || manifest.majorMoons.usgsFinalSourceAcquiredCount !== 0
  || manifest.majorMoons.usgsFinalSourceTerminalFailureCount !== 4
) throw new Error("v592-verify-major-moon-usgs-final-terminal-evidence");

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
  || manifest.majorMoons.alternativeMetadataProbeCount !== 3
  || manifest.majorMoons.alternativeOfficialCandidateCount !== 2
  || manifest.majorMoons.alternativeQualifiedGlobalTextureCount !== 0
  || manifest.majorMoons.alternativeBlockedTargets.join(",") !== "triton,miranda,titania"
  || manifest.majorMoons.alternativeNegativeEvidenceReceiptSha256 !== majorMoonAlternativeNegativeEvidence.receiptSha256
) throw new Error("v592-verify-major-moon-alternative-negative-evidence");
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
  || manifest.majorMoons.nasa3dAcquisitionReceiptSha256 !== majorMoonNasa3dAcquisition.receiptSha256
  || manifest.majorMoons.nasa3dAnalysisReceiptSha256 !== majorMoonNasa3dAnalysis.receiptSha256
  || manifest.majorMoons.nasa3dNegativeEvidenceReceiptSha256 !== majorMoonNasa3dNegativeEvidence.receiptSha256
  || manifest.majorMoons.nasa3dRequestedCount !== 3
  || manifest.majorMoons.nasa3dAcquiredCount !== 3
  || manifest.majorMoons.nasa3dQualifiedGlobalTextureCount !== 0
  || manifest.majorMoons.nasa3dSourceCoverageBlockedCount !== 3
  || manifest.majorMoons.nasa3dRuntimeAssetAdmittedCount !== 0
) throw new Error("v592-verify-major-moon-nasa3d-negative-evidence");

const pia03456Acquisition = verifySealed("docs/release/v592/acquisition-receipt-callisto-photojournal-tif-v592.json", "receiptSha256");
const pia03876Acquisition = verifySealed("docs/release/v592/acquisition-receipt-callisto-hemispherical-tif-v592.json", "receiptSha256");
const pia03876Projection = verifySealed("docs/release/v592/major-moon-secondary-visual-projection-review-v592.json", "receiptSha256");
if (
  majorMoonSecondaryVisualEvidence.lanes.nasaPhotojournalPia03456.receiptSha256 !== pia03456Acquisition.receiptSha256
  || pia03456Acquisition.requestCount !== 1
  || pia03456Acquisition.automaticRetryPerformed !== false
  || pia03456Acquisition.automaticReplacementPerformed !== false
  || pia03456Acquisition.status !== "blocked-single-request-no-retry"
  || majorMoonSecondaryVisualEvidence.lanes.nasaPhotojournalPia03876.receiptSha256 !== pia03876Acquisition.receiptSha256
  || pia03876Acquisition.requestCount !== 1
  || pia03876Acquisition.automaticRetryPerformed !== false
  || pia03876Acquisition.automaticReplacementPerformed !== false
  || pia03876Acquisition.status !== "acquired-single-request-pending-projection-review"
  || majorMoonSecondaryVisualEvidence.lanes.nasaPhotojournalPia03876.projectionReceiptSha256 !== pia03876Projection.receiptSha256
  || pia03876Projection.status !== "blocked-non-equirectangular-hemispherical-globe-composite"
  || pia03876Projection.admission.globalTexture !== false
  || pia03876Projection.policy.noInpainting !== true
) throw new Error("v592-verify-major-moon-secondary-lane-chain");
const callistoTif = readFileSync(resolve(root, "source-cache/v592/major-moons/jpl-photojournal/PIA03876.tif"));
if (callistoTif.byteLength !== pia03876Acquisition.bytes || sha256(callistoTif) !== pia03876Acquisition.sha256 || pia03876Projection.source.sha256 !== pia03876Acquisition.sha256) {
  throw new Error("v592-verify-major-moon-secondary-source-drift");
}

const liveSombreroFrame = liveBrowserReceipt.frames.find((frame) => frame.focus === "sombrero-galaxy");
verifyFiles([liveBrowserReceipt.source.rawCapture], "live-browser-raw");
if (
  liveBrowserReceipt.status !== "passed-current-standalone-live-matrix-all-requested-slices-ready"
  || liveBrowserReceipt.route !== "/local-shadow-v592"
  || liveBrowserReceipt.frames.length !== 12
  || liveBrowserReceipt.admission.singleCanvas !== true
  || liveBrowserReceipt.admission.consolePageWebglErrorCount !== 0
  || liveBrowserReceipt.admission.scienceCinematicPayloadStable !== true
  || liveBrowserReceipt.admission.scientificPayloadWriteback !== false
  || liveBrowserReceipt.admission.payloadSha256 !== manifest.authority.scientificPayloadSha256
  || liveBrowserReceipt.admission.deepSpaceReadyFrameCount !== 3
  || liveBrowserReceipt.admission.deepSpaceBlockedFrameCount !== 0
  || liveBrowserReceipt.admission.fallbackFrameCount !== 0
  || liveBrowserReceipt.capturedCandidateManifestSha256 !== manifest.manifestSha256
  || liveBrowserReceipt.capturedBuildIds?.standalone !== standaloneBuild.receipt.buildId
  || liveBrowserReceipt.capturedBuildIds?.lite !== liteBuild.receipt.buildId
  || liveSombreroFrame?.deepState !== "ready-2-ktx2-slices"
  || liveSombreroFrame?.readySlices !== 2
  || (liveSombreroFrame?.blockedSlices ?? 0) !== 0
  || (liveSombreroFrame?.fullFallbackCount ?? 0) !== 0
  || liveBrowserReceipt.policy.browser !== "Codex in-app browser"
  || liveBrowserReceipt.policy.noAlternateBrowser !== true
  || liveBrowserReceipt.frames.some((frame) => frame.canvasCount !== 1 || frame.consolePageWebglErrorCount !== 0 || frame.scientificPayloadSha256 !== manifest.authority.scientificPayloadSha256 || frame.scientificPayloadWriteback !== false || frame.scienceCinematicPayloadStable !== true)
) throw new Error("v592-verify-live-browser-matrix-receipt");
for (const frame of liveBrowserReceipt.frames) {
  const screenshot = readFileSync(resolve(root, frame.path));
  if (screenshot.byteLength !== frame.screenshotBytes || sha256(screenshot) !== frame.screenshotSha256) throw new Error(`v592-verify-live-browser-screenshot:${frame.name}`);
}
const soakSourceRecords = [
  browserSoakResourceReceipt.source.samples,
  browserSoakResourceReceipt.source.releaseRestore,
  browserSoakResourceReceipt.source.finalSoakScreenshot,
  browserSoakResourceReceipt.source.releaseScreenshot,
  browserSoakResourceReceipt.source.restoreScreenshot,
];
verifyFiles(soakSourceRecords, "browser-soak-source");
const soakCsvLines = read(browserSoakResourceReceipt.source.samples.path).trim().split(/\r?\n/);
const soakFinalColumns = soakCsvLines.at(-1).split(",");
const soakReleaseRestoreRaw = readJson(browserSoakResourceReceipt.source.releaseRestore.path);
const restoredResourceKeys = [
  "candidateResources",
  "candidateBytes",
  "sceneNodes",
  "programDelta",
  "rendererTextureDelta",
  "rendererGeometryDelta",
];
const restoredResourceBaselineMatched = restoredResourceKeys.every((key) => (
  browserSoakResourceReceipt.resourceLifecycle.restoredState[key] === soakReleaseRestoreRaw.baseline[key]
  && soakReleaseRestoreRaw.restoredState[key] === soakReleaseRestoreRaw.baseline[key]
));
if (
  browserSoakResourceReceipt.status !== browserSoakExpectedStatus
  || browserSoakResourceReceipt.route !== "/local-shadow-v592"
  || browserSoakResourceReceipt.browser !== "Codex in-app browser"
  || browserSoakResourceReceipt.soak.durationMs < 1_800_000
  || browserSoakResourceReceipt.soak.sampleCount !== 59
  || browserSoakResourceReceipt.soak.visibleSampleCount !== 59
  || soakCsvLines.length !== 60
  || Number(soakFinalColumns[1]) !== browserSoakResourceReceipt.soak.durationMs
  || browserSoakResourceReceipt.soak.fpsMedian.minimum < 55
  || browserSoakResourceReceipt.soak.fpsMedian.minimum > browserSoakResourceReceipt.soak.fpsMedian.median
  || browserSoakResourceReceipt.soak.fpsMedian.median > browserSoakResourceReceipt.soak.fpsMedian.maximum
  || browserSoakResourceReceipt.soak.rendererResources.sustainedGrowthObserved !== false
  || browserSoakResourceReceipt.soak.memoryTelemetry.state !== (browserSoakTelemetryAvailable ? "available-performance-memory" : "unavailable-performance-memory-not-exposed")
  || browserSoakResourceReceipt.soak.memoryTelemetry.availableSampleCount !== (browserSoakTelemetryAvailable ? 59 : 0)
  || browserSoakResourceReceipt.soak.memoryTelemetry.jsHeapGrowthGatePassed !== browserSoakHeapQualified
  || browserSoakResourceReceipt.admission.thirtyMinuteDurationPassed !== true
  || browserSoakResourceReceipt.admission.rendererResourceNoGrowthPassed !== true
  || browserSoakResourceReceipt.admission.releaseRestorePassed !== true
  || browserSoakResourceReceipt.admission.jsHeapTelemetryAvailable !== browserSoakTelemetryAvailable
  || browserSoakResourceReceipt.admission.jsHeapGrowthGatePassed !== browserSoakHeapQualified
  || browserSoakResourceReceipt.admission.fullMemoryGatePassed !== browserSoakHeapQualified
  || browserSoakResourceReceipt.resourceLifecycle.strictCycleCount !== 4
  || browserSoakResourceReceipt.resourceLifecycle.releasedState.candidateResources !== 0
  || browserSoakResourceReceipt.resourceLifecycle.releasedState.candidateBytes !== 0
  || browserSoakResourceReceipt.resourceLifecycle.releasedState.sceneNodes !== 0
  || browserSoakResourceReceipt.resourceLifecycle.releasedState.programDelta !== 0
  || browserSoakResourceReceipt.resourceLifecycle.releasedState.rendererTextureDelta !== 0
  || browserSoakResourceReceipt.resourceLifecycle.releasedState.rendererGeometryDelta !== 0
  || restoredResourceBaselineMatched !== true
  || soakReleaseRestoreRaw.capturedBuildIds?.standalone !== standaloneBuild.receipt.buildId
  || soakReleaseRestoreRaw.capturedBuildIds?.lite !== liteBuild.receipt.buildId
  || browserSoakResourceReceipt.capturedBuildIds?.standalone !== standaloneBuild.receipt.buildId
  || browserSoakResourceReceipt.capturedBuildIds?.lite !== liteBuild.receipt.buildId
  || browserSoakResourceReceipt.policy.noHeapClaimWhenUnavailable !== true
  || browserSoakResourceReceipt.policy.noAlternateBrowser !== true
  || browserSoakResourceReceipt.policy.scientificPayloadWriteback !== false
) throw new Error("v592-verify-browser-soak-resource");

for (const asset of majorMoonVisualAssets.assets) {
  for (const variant of Object.values(asset.variants)) {
    const path = `public${variant.url}`;
    const bytes = readFileSync(resolve(root, path));
    if (bytes.byteLength !== variant.bytes || sha256(bytes) !== variant.sha256) {
      throw new Error(`v592-verify-major-moon-runtime-drift:${asset.target}:${variant.role}`);
    }
  }
}
for (const body of majorMoonVisualAssets.admission.blockedBodies) {
  for (const path of [
    `public/textures/candidate-v592/major-moons/full/desktop/${body}-albedo.ktx2`,
    `public/textures/candidate-v592/major-moons/full/desktop/${body}-albedo.webp`,
    `public/textures/candidate-v592/major-moons/full/mobile/${body}-albedo.ktx2`,
    `public/textures/candidate-v592/major-moons/full/mobile/${body}-albedo.webp`,
    `public/textures/candidate-v592/major-moons/lite/desktop/${body}-albedo.webp`,
    `public/textures/candidate-v592/major-moons/lite/mobile/${body}-albedo.webp`,
  ]) {
    if (existsSync(resolve(root, path))) throw new Error(`v592-verify-blocked-moon-runtime-residue:${path}`);
  }
}

if (
  currentState.candidate.manifestSha256 !== manifest.manifestSha256
  || currentState.formalProduct.pointer !== "v263"
  || currentState.formalProduct.changed !== false
  || capability.candidate.manifestSha256 !== manifest.manifestSha256
  || capability.capabilities.admittedRotationKinematicCount !== 16
  || capability.capabilities.bennuOrxPckDirectoryProbeStatus !== "blocked-no-automatic-retry"
  || capability.capabilities.bennuOrxPckDirectoryProbeRequestCount !== 1
  || capability.capabilities.bennuOrxPckDirectoryProbePayloadDownloaded !== false
  || capability.capabilities.bennuOrxPckDirectoryProbeAutomaticRetryPerformed !== false
  || capability.evidence.bennuOrxPckProbeReceiptSha256 !== orxBennuPckProbe.receiptSha256
  || currentState.evidence.bennuOrxPckProbeReceiptSha256 !== orxBennuPckProbe.receiptSha256
  || capability.capabilities.stellarHeroCatalogCount !== 24
  || capability.capabilities.stellarHeroRuntimeImplemented !== true
  || capability.capabilities.stellarHeroBrowserMatrixPassed !== true
  || capability.capabilities.stellarHeroBrowserAdmittedCount !== 24
  || capability.capabilities.stellarHeroBrowserFrameCount !== 48
  || capability.capabilities.gaiaDirectRuntimeImplemented !== true
  || capability.capabilities.gaiaBaseCatalogRecordCount !== 46_000
  || capability.capabilities.gaiaFullSupplementRecordCount !== 14_000
  || capability.capabilities.gaiaFullDesktopRecordCount !== 60_000
  || capability.capabilities.gaiaFullSupplementReceiptSha256 !== gaiaSupplementReceipt.receiptSha256
  || capability.capabilities.gaiaConstellationBrowserMatrixPassed !== true
  || capability.capabilities.gaiaConstellationBrowserFrameCount !== 13
  || capability.capabilities.gaiaConstellationBrowserMinimumFpsMedian !== gaiaConstellationBrowserReceipt.admission.minimumFpsMedian
  || capability.capabilities.gaiaConstellationBrowserPeakDesktopGpuBytes !== gaiaConstellationBrowserReceipt.admission.peakDesktopGpuBytes
  || capability.capabilities.gaiaConstellationBrowserPeakMobileGpuBytes !== gaiaConstellationBrowserReceipt.admission.peakMobileGpuBytes
  || capability.capabilities.gaiaConstellationBrowserPeakDrawCalls !== gaiaConstellationBrowserReceipt.admission.peakDrawCalls
  || capability.evidence.gaiaSupplementReceiptSha256 !== gaiaSupplementReceipt.receiptSha256
  || currentState.evidence.gaiaSupplementReceiptSha256 !== gaiaSupplementReceipt.receiptSha256
  || capability.evidence.gaiaConstellationBrowserMatrixReceiptSha256 !== gaiaConstellationBrowserReceipt.receiptSha256
  || currentState.evidence.gaiaConstellationBrowserMatrixReceiptSha256 !== gaiaConstellationBrowserReceipt.receiptSha256
  || capability.capabilities.constellationScienceRuntimeImplemented !== true
  || capability.capabilities.constellationScienceCount !== 88
  || capability.capabilities.constellationWaypointCount !== 484
  || capability.capabilities.constellationBrowserMatrixPassed !== true
  || capability.capabilities.constellationBrowserFocusedCodes.join(",") !== "Ori,UMa,Cas"
  || capability.capabilities.constellationIauBoundaryAdmission !== "blocked-source-not-admitted"
  || capability.capabilities.constellationArtAdmissionCount !== 88
  || capability.capabilities.constellationArtUniqueSignatureCount !== 88
  || capability.capabilities.constellationArtBrowserMatrixPassed !== true
  || capability.capabilities.constellationArtBrowserFrameCount !== 9
  || capability.capabilities.constellationArtBrowserMinimumFpsMedian !== constellationArtBrowserReceipt.admission.minimumFpsMedian
  || capability.capabilities.constellationArtBrowserPeakDesktopGpuBytes !== constellationArtBrowserReceipt.admission.peakDesktopGpuBytes
  || capability.capabilities.constellationArtBrowserPeakMobileGpuBytes !== constellationArtBrowserReceipt.admission.peakMobileGpuBytes
  || capability.capabilities.constellationArtBrowserPeakDrawCalls !== constellationArtBrowserReceipt.admission.peakDrawCalls
  || capability.blockedGates.constellationArt !== "passed:88/88-data-derived-observatory-engravings;browser-9/9;iau-boundary-blocked-source-not-admitted"
  || capability.evidence.constellationArtReferenceReceiptSha256 !== constellationArtReferenceReceipt.receiptSha256
  || capability.evidence.constellationArtBrowserMatrixReceiptSha256 !== constellationArtBrowserReceipt.receiptSha256
  || currentState.evidence.constellationArtReferenceReceiptSha256 !== constellationArtReferenceReceipt.receiptSha256
  || currentState.evidence.constellationArtBrowserMatrixReceiptSha256 !== constellationArtBrowserReceipt.receiptSha256
  || currentState.progress.constellationArt !== "88/88-data-derived-observatory-engravings;browser-9/9-passed;iau-boundaries-blocked"
  || capability.capabilities.deepSpaceGalaxyReferenceAdmissionCount !== 12
  || capability.capabilities.deepSpaceClusterReferenceAdmissionCount !== 12
  || capability.capabilities.deepSpaceVisualMetadataCandidateCount !== 18
  || capability.capabilities.deepSpaceVisualMetadataBlockedCount !== 6
  || capability.capabilities.deepSpaceReferenceVisualAssetAdmissionCount !== 0
  || capability.capabilities.deepSpaceItemMetadataAcquiredCount !== 18
  || capability.capabilities.deepSpacePrimaryVisualSourceAcquiredCount !== 5
  || capability.capabilities.deepSpaceAlternativeVisualSourceAcquiredCount !== 9
  || capability.capabilities.deepSpaceVisualSourceAcquiredCount !== 14
  || capability.capabilities.deepSpacePrimaryVisualDerivationCandidateCount !== 3
  || capability.capabilities.deepSpaceAlternativeVisualDerivationCandidateCount !== 5
  || capability.capabilities.deepSpaceVisualDerivationCandidateCount !== 8
  || capability.capabilities.deepSpaceInfographicBlockedCount !== 2
  || capability.capabilities.deepSpaceScientificOverlayBlockedCount !== 1
  || capability.capabilities.deepSpaceCleanRedundantAlternateHeldCount !== 3
  || capability.capabilities.deepSpaceGaiaCatalogDerivedVisualModelCount !== 10
  || capability.capabilities.deepSpaceGaiaCatalogPayloadReusedFromExistingAdmission !== true
  || capability.capabilities.deepSpaceGalaxyVisualAssetAdmissionCount !== 12
  || capability.capabilities.deepSpaceClusterVisualAssetAdmissionCount !== 12
  || capability.capabilities.deepSpaceVisualAssetAdmissionCount !== 24
  || capability.capabilities.deepSpaceVisualAssetBlockedCount !== 0
  || capability.capabilities.deepSpaceVisualAssetFullRuntimeBytes !== deepSpaceVisualAssetsReceipt.fullRuntimeBytes
  || capability.capabilities.deepSpaceVisualAssetLiteIncrementBytes !== deepSpaceVisualAssetsReceipt.liteIncrementBytes
  || capability.capabilities.deepSpaceSecondaryMetadataProbeCount !== 11
  || capability.capabilities.deepSpaceSecondaryItemMetadataAcquisitionCount !== 3
  || capability.capabilities.deepSpaceSecondaryVisualPayloadDownloadedCount !== 0
  || capability.capabilities.deepSpaceSecondaryRuntimeAssetAdmittedCount !== 0
  || capability.capabilities.deepSpaceClusterAlternativeNegativeEvidenceReceiptSha256 !== deepSpaceClusterAlternativeNegativeEvidence.receiptSha256
  || capability.capabilities.deepSpaceClusterAlternativeMetadataProbeCount !== 6
  || capability.capabilities.deepSpaceClusterAlternativeQualifiedVisualTextureCount !== 0
  || capability.capabilities.deepSpaceClusterAlternativeBlockedTargetCount !== 6
  || capability.capabilities.deepSpaceBrowserMatrixPassed !== true
  || capability.capabilities.deepSpaceBrowserMatrixFrameCount !== 72
  || capability.capabilities.deepSpaceBrowserMatrixMinimumFpsMedian !== deepSpaceBrowserReceipt.admission.minimumFpsMedian
  || capability.capabilities.deepSpaceBrowserMatrixPeakDesktopGpuBytes !== deepSpaceBrowserReceipt.admission.peakDesktopGpuBytes
  || capability.capabilities.deepSpaceBrowserMatrixPeakMobileGpuBytes !== deepSpaceBrowserReceipt.admission.peakMobileGpuBytes
  || capability.capabilities.deepSpaceBrowserMatrixPeakDrawCalls !== deepSpaceBrowserReceipt.admission.peakDrawCalls
  || capability.capabilities.deepSpaceBrowserMatrixReleaseRestorePassed !== true
  || capability.capabilities.deepSpaceAnalyticBrowserMatrixPassed !== true
  || capability.capabilities.deepSpaceAnalyticBrowserMatrixFrameCount !== 24
  || capability.capabilities.deepSpaceAnalyticBrowserMatrixMinimumFpsMedian !== deepSpaceAnalyticBrowserReceipt.admission.minimumFpsMedian
  || capability.capabilities.deepSpaceAnalyticBrowserMatrixPeakDesktopGpuBytes !== deepSpaceAnalyticBrowserReceipt.admission.peakDesktopGpuBytes
  || capability.capabilities.deepSpaceAnalyticBrowserMatrixPeakMobileGpuBytes !== deepSpaceAnalyticBrowserReceipt.admission.peakMobileGpuBytes
  || capability.capabilities.deepSpaceAnalyticBrowserMatrixPeakDrawCalls !== deepSpaceAnalyticBrowserReceipt.admission.peakDrawCalls
  || capability.capabilities.deepSpaceAnalyticBrowserMatrixReleaseRestorePassed !== true
  || capability.capabilities.deepSpacePayloadDownloadedCount !== 0
  || capability.blockedGates.galaxies !== "partial:reference-12/12;visual-metadata-12/12;visual-models-12/12;source-backed-6/12;openngc-analytic-6/12;browser-18/18-inherited-plus-analytic-24/24-passed;infographic-blocked-2/12;scientific-overlay-blocked-1/12;secondary-probes-11-negative"
  || capability.blockedGates.clusters !== "partial:reference-12/12;visual-metadata-6/12;visual-source-targets-2/12;visual-assets-12/12;browser-18/18-four-profile-passed;gaia-derived-primary-models-10/12;source-blocked-0/12;exact-ngc-alternative-probes-6/6-negative"
  || capability.evidence.deepSpaceReferencePacketSha256 !== deepSpaceReference.packetSha256
  || capability.evidence.deepSpaceReferenceReceiptSha256 !== deepSpaceReferenceReceipt.receiptSha256
  || capability.evidence.deepSpaceItemMetadataAcquisitionReceiptSha256 !== deepSpaceItemMetadataAcquisition.receiptSha256
  || capability.evidence.deepSpaceLicenseReviewReceiptSha256 !== deepSpaceLicenseReview.receiptSha256
  || capability.evidence.deepSpaceVisualSourceAcquisitionReceiptSha256 !== deepSpaceVisualSourceAcquisition.receiptSha256
  || capability.evidence.deepSpaceVisualAnalysisReceiptSha256 !== deepSpaceVisualAnalysis.receiptSha256
  || capability.evidence.deepSpaceVisualAssetManifestSha256 !== deepSpaceVisualAssets.manifestSha256
  || capability.evidence.deepSpaceVisualAssetReceiptSha256 !== deepSpaceVisualAssetsReceipt.receiptSha256
  || capability.evidence.deepSpaceBrowserCaptureSha256 !== deepSpaceBrowserReceipt.source.captureSha256
  || capability.evidence.deepSpaceBrowserMatrixReceiptSha256 !== deepSpaceBrowserReceipt.receiptSha256
  || capability.evidence.deepSpaceAnalyticBrowserCaptureSha256 !== deepSpaceAnalyticBrowserReceipt.source.captureSha256
  || capability.evidence.deepSpaceAnalyticBrowserMatrixReceiptSha256 !== deepSpaceAnalyticBrowserReceipt.receiptSha256
  || capability.evidence.deepSpaceSecondaryProbeNegativeEvidenceReceiptSha256 !== deepSpaceSecondaryProbeNegativeEvidence.receiptSha256
  || capability.evidence.deepSpaceClusterAlternativeNegativeEvidenceReceiptSha256 !== deepSpaceClusterAlternativeNegativeEvidence.receiptSha256
  || capability.evidence.deepSpaceAlternativeLicenseReviewReceiptSha256 !== deepSpaceAlternativeLicenseReview.receiptSha256
  || capability.evidence.deepSpaceAlternativeContactSheetReceiptSha256 !== deepSpaceAlternativeContactSheetReceipt.receiptSha256
  || capability.evidence.deepSpaceAlternativeVisualAnalysisReceiptSha256 !== deepSpaceAlternativeVisualAnalysis.receiptSha256
  || capability.evidence.deepSpaceGaiaCatalogManifestFileSha256 !== sha256(gaiaPresentationManifestBytes)
  || capability.evidence.deepSpaceGaiaCatalogArchiveSha256 !== gaiaPresentationManifest.archive.sha256
  || currentState.evidence.deepSpaceReferencePacketSha256 !== deepSpaceReference.packetSha256
  || currentState.evidence.deepSpaceReferenceReceiptSha256 !== deepSpaceReferenceReceipt.receiptSha256
  || currentState.evidence.deepSpaceItemMetadataAcquisitionReceiptSha256 !== deepSpaceItemMetadataAcquisition.receiptSha256
  || currentState.evidence.deepSpaceLicenseReviewReceiptSha256 !== deepSpaceLicenseReview.receiptSha256
  || currentState.evidence.deepSpaceVisualSourceAcquisitionReceiptSha256 !== deepSpaceVisualSourceAcquisition.receiptSha256
  || currentState.evidence.deepSpaceVisualAnalysisReceiptSha256 !== deepSpaceVisualAnalysis.receiptSha256
  || currentState.evidence.deepSpaceVisualAssetManifestSha256 !== deepSpaceVisualAssets.manifestSha256
  || currentState.evidence.deepSpaceVisualAssetReceiptSha256 !== deepSpaceVisualAssetsReceipt.receiptSha256
  || currentState.evidence.deepSpaceBrowserCaptureSha256 !== deepSpaceBrowserReceipt.source.captureSha256
  || currentState.evidence.deepSpaceBrowserMatrixReceiptSha256 !== deepSpaceBrowserReceipt.receiptSha256
  || currentState.evidence.deepSpaceAnalyticBrowserCaptureSha256 !== deepSpaceAnalyticBrowserReceipt.source.captureSha256
  || currentState.evidence.deepSpaceAnalyticBrowserMatrixReceiptSha256 !== deepSpaceAnalyticBrowserReceipt.receiptSha256
  || currentState.evidence.deepSpaceSecondaryProbeNegativeEvidenceReceiptSha256 !== deepSpaceSecondaryProbeNegativeEvidence.receiptSha256
  || currentState.evidence.deepSpaceClusterAlternativeNegativeEvidenceReceiptSha256 !== deepSpaceClusterAlternativeNegativeEvidence.receiptSha256
  || currentState.evidence.deepSpaceAlternativeLicenseReviewReceiptSha256 !== deepSpaceAlternativeLicenseReview.receiptSha256
  || currentState.evidence.deepSpaceAlternativeContactSheetReceiptSha256 !== deepSpaceAlternativeContactSheetReceipt.receiptSha256
  || currentState.evidence.deepSpaceAlternativeVisualAnalysisReceiptSha256 !== deepSpaceAlternativeVisualAnalysis.receiptSha256
  || currentState.evidence.deepSpaceGaiaCatalogManifestFileSha256 !== sha256(gaiaPresentationManifestBytes)
  || currentState.evidence.deepSpaceGaiaCatalogArchiveSha256 !== gaiaPresentationManifest.archive.sha256
  || currentState.progress.galaxies !== "reference-12/12;visual-metadata-12/12;visual-models-12/12;source-backed-6/12;openngc-analytic-6/12;browser-18/18-inherited-plus-analytic-24/24-passed;infographic-blocked-2/12;scientific-overlay-blocked-1/12;secondary-probes-11-negative"
  || currentState.progress.clusters !== "reference-12/12;visual-metadata-6/12;visual-source-targets-2/12;visual-assets-12/12;browser-18/18-four-profile-passed;gaia-derived-primary-models-10/12;source-blocked-0/12;exact-ngc-alternative-probes-6/6-negative"
  || capability.capabilities.browserUrlPolicyBlocked !== true
  || capability.evidence.browserUrlPolicyEvidenceSha256 !== browserUrlPolicyEvidence.receiptSha256
  || currentState.evidence.browserUrlPolicyEvidenceSha256 !== browserUrlPolicyEvidence.receiptSha256
  || capability.evidence.stellarBrowserMatrixReceiptSha256 !== stellarBrowserReceipt.receiptSha256
  || currentState.evidence.stellarBrowserMatrixReceiptSha256 !== stellarBrowserReceipt.receiptSha256
  || capability.capabilities.nebulaMetadataSelectedTargetCount !== 18
  || capability.capabilities.nebulaMetadataProbeCompleteCount !== 18
  || capability.capabilities.nebulaExplicitHttpsAcquisitionCandidateCount !== 12
  || capability.capabilities.nebulaTerminalBlockedNoRetryCount !== 6
  || capability.capabilities.nebulaExpandedAssetAdmissionCount !== 18
  || capability.capabilities.nebulaExpandedAssetGoalCoverageCount !== 24
  || capability.capabilities.nebulaItemMetadataAcquiredCount !== 12
  || capability.capabilities.nebulaVisualSourceAcquiredCount !== 7
  || capability.capabilities.nebulaVisualSourceCoverageBlockedCount !== 1
  || capability.capabilities.nebulaVisualAssetFullRuntimeBytes !== nebulaVisualAssetsReceipt.fullRuntimeBytes + nebulaExtendedVisualAssetsReceipt.fullRuntimeBytes + nebulaClosureVisualAssetsReceipt.fullRuntimeBytes
  || capability.capabilities.nebulaVisualAssetLiteIncrementBytes !== nebulaVisualAssetsReceipt.liteIncrementBytes + nebulaExtendedVisualAssetsReceipt.liteIncrementBytes + nebulaClosureVisualAssetsReceipt.liteIncrementBytes
  || capability.capabilities.nebulaExtendedOverlayAssetCount !== 5
  || capability.capabilities.nebulaClosureOverlayAssetCount !== 7
  || capability.capabilities.nebulaExtendedOverlayManifestSha256 !== nebulaExtendedVisualAssets.manifestSha256
  || capability.capabilities.nebulaClosureOverlayManifestSha256 !== nebulaClosureVisualAssets.manifestSha256
  || capability.capabilities.nebulaOverlayBrowserMatrixPassed !== true
  || capability.capabilities.nebulaOverlayBrowserFrameCount !== 48
  || capability.capabilities.nebulaOverlayBrowserMinimumFpsMedian !== nebulaOverlayBrowserReceipt.admission.minimumFpsMedian
  || capability.capabilities.nebulaOverlayBrowserScienceMarkerOnlyFrameCount !== 24
  || capability.capabilities.nebulaOverlayBrowserNativeKtx2CinematicFrameCount !== 24
  || capability.capabilities.nebulaOverlayBrowserSingleCanvas !== true
  || capability.capabilities.nebulaOverlayBrowserPayloadStable !== true
  || capability.capabilities.nebulaBrowserMatrixPassed !== true
  || capability.capabilities.nebulaBrowserFrameCount !== 18
  || capability.capabilities.nebulaBrowserMinimumFpsMedian !== nebulaBrowserReceipt.admission.minimumFpsMedian
  || capability.capabilities.nebulaBrowserPeakDesktopGpuBytes !== nebulaBrowserReceipt.admission.peakDesktopGpuBytes
  || capability.capabilities.nebulaBrowserPeakMobileGpuBytes !== nebulaBrowserReceipt.admission.peakMobileGpuBytes
  || capability.capabilities.nebulaBrowserPeakDrawCalls !== nebulaBrowserReceipt.admission.peakDrawCalls
  || capability.capabilities.nebulaBrowserMinimumRoiNonBlackFraction !== nebulaBrowserReceipt.admission.minimumCinematicRoiNonBlackFraction
  || capability.evidence.nebulaAssetMetadataAdmissionReceiptSha256 !== nebulaAssetMetadataAdmission.receiptSha256
  || currentState.evidence.nebulaAssetMetadataAdmissionReceiptSha256 !== nebulaAssetMetadataAdmission.receiptSha256
  || capability.evidence.nebulaItemMetadataAcquisitionReceiptSha256 !== nebulaItemMetadataAcquisition.receiptSha256
  || capability.evidence.nebulaLicenseReviewReceiptSha256 !== nebulaLicenseReview.receiptSha256
  || capability.evidence.nebulaVisualSourceAcquisitionReceiptSha256 !== nebulaVisualSourceAcquisition.receiptSha256
  || capability.evidence.nebulaVisualAnalysisReceiptSha256 !== nebulaVisualAnalysis.receiptSha256
  || capability.evidence.nebulaVisualAssetManifestSha256 !== nebulaVisualAssets.manifestSha256
  || capability.evidence.nebulaVisualAssetReceiptSha256 !== nebulaVisualAssetsReceipt.receiptSha256
  || capability.evidence.nebulaExtendedVisualAssetManifestSha256 !== nebulaExtendedVisualAssets.manifestSha256
  || capability.evidence.nebulaExtendedVisualAssetReceiptSha256 !== nebulaExtendedVisualAssetsReceipt.receiptSha256
  || capability.evidence.nebulaClosureVisualAssetManifestSha256 !== nebulaClosureVisualAssets.manifestSha256
  || capability.evidence.nebulaClosureVisualAssetReceiptSha256 !== nebulaClosureVisualAssetsReceipt.receiptSha256
  || capability.evidence.nebulaOverlayBrowserCaptureSha256 !== nebulaOverlayBrowserReceipt.source.captureSha256
  || capability.evidence.nebulaOverlayBrowserMatrixReceiptSha256 !== nebulaOverlayBrowserReceipt.receiptSha256
  || capability.evidence.nebulaBrowserMatrixReceiptSha256 !== nebulaBrowserReceipt.receiptSha256
  || currentState.evidence.nebulaItemMetadataAcquisitionReceiptSha256 !== nebulaItemMetadataAcquisition.receiptSha256
  || currentState.evidence.nebulaLicenseReviewReceiptSha256 !== nebulaLicenseReview.receiptSha256
  || currentState.evidence.nebulaVisualSourceAcquisitionReceiptSha256 !== nebulaVisualSourceAcquisition.receiptSha256
  || currentState.evidence.nebulaVisualAnalysisReceiptSha256 !== nebulaVisualAnalysis.receiptSha256
  || currentState.evidence.nebulaVisualAssetManifestSha256 !== nebulaVisualAssets.manifestSha256
  || currentState.evidence.nebulaVisualAssetReceiptSha256 !== nebulaVisualAssetsReceipt.receiptSha256
  || currentState.evidence.nebulaExtendedVisualAssetManifestSha256 !== nebulaExtendedVisualAssets.manifestSha256
  || currentState.evidence.nebulaExtendedVisualAssetReceiptSha256 !== nebulaExtendedVisualAssetsReceipt.receiptSha256
  || currentState.evidence.nebulaClosureVisualAssetManifestSha256 !== nebulaClosureVisualAssets.manifestSha256
  || currentState.evidence.nebulaClosureVisualAssetReceiptSha256 !== nebulaClosureVisualAssetsReceipt.receiptSha256
  || currentState.evidence.nebulaOverlayBrowserCaptureSha256 !== nebulaOverlayBrowserReceipt.source.captureSha256
  || currentState.evidence.nebulaOverlayBrowserMatrixReceiptSha256 !== nebulaOverlayBrowserReceipt.receiptSha256
  || currentState.evidence.nebulaBrowserMatrixReceiptSha256 !== nebulaBrowserReceipt.receiptSha256
  || capability.capabilities.majorMoonMotionReferenceAdmittedCount !== 12
  || capability.capabilities.majorMoonOrbitReferenceAdmittedCount !== 12
  || capability.capabilities.majorMoonVisualAssetAdmittedCount !== majorMoonVisualAssetCount
  || capability.capabilities.majorMoonAssetManifestHeroAdmittedCount !== 0
  || capability.capabilities.majorMoonHeroAdmittedCount !== majorMoonVisualAssetCount
  || capability.capabilities.majorMoonRuntimeHeroCandidateCount !== majorMoonVisualAssetCount
  || capability.capabilities.majorMoonRuntimeHeroCandidateIds.join(",") !== majorMoonVisualAssetIds.join(",")
  || capability.capabilities.majorMoonBrowserFrameCount !== majorMoonVisualAssetCount * 3
  || capability.capabilities.majorMoonBrowserMinimumFpsMedian !== majorMoonBrowserReceipt.admission.minimumFpsMedian
  || capability.capabilities.majorMoonBrowserPeakDesktopGpuBytes !== majorMoonBrowserReceipt.admission.peakDesktopGpuBytes
  || capability.capabilities.majorMoonBrowserPeakMobileGpuBytes !== majorMoonBrowserReceipt.admission.peakMobileGpuBytes
  || capability.capabilities.majorMoonBrowserPeakDrawCalls !== majorMoonBrowserReceipt.admission.peakDrawCalls
  || capability.capabilities.majorMoonBrowserReleaseRestoreCycleCount !== majorMoonVisualAssetCount
  || capability.capabilities.majorMoonSecondaryVisualEvidenceStatus !== majorMoonSecondaryVisualEvidence.status
  || capability.capabilities.majorMoonSecondaryQualifiedGlobalTextureCount !== 0
  || capability.capabilities.majorMoonUsGsFinalRequestedCount !== 4
  || capability.capabilities.majorMoonUsGsFinalAcquiredCount !== 0
  || capability.capabilities.majorMoonUsGsFinalTerminalFailureCount !== 4
  || capability.capabilities.majorMoonUsGsFinalFailedTargets.join(",") !== "io,europa,ganymede,callisto"
  || capability.capabilities.majorMoonAlternativeMetadataProbeCount !== 3
  || capability.capabilities.majorMoonAlternativeOfficialCandidateCount !== 2
  || capability.capabilities.majorMoonAlternativeQualifiedGlobalTextureCount !== 0
  || capability.capabilities.majorMoonAlternativeBlockedTargets.join(",") !== "triton,miranda,titania"
  || capability.capabilities.majorMoonAlternativeNegativeEvidenceReceiptSha256 !== majorMoonAlternativeNegativeEvidence.receiptSha256
  || capability.capabilities.majorMoonNasa3dRequestedCount !== 3
  || capability.capabilities.majorMoonNasa3dAcquiredCount !== 3
  || capability.capabilities.majorMoonNasa3dQualifiedGlobalTextureCount !== 0
  || capability.capabilities.majorMoonNasa3dSourceCoverageBlockedCount !== 3
  || capability.capabilities.majorMoonNasa3dRuntimeAssetAdmittedCount !== 0
  || capability.capabilities.majorMoonNasa3dAcquisitionReceiptSha256 !== majorMoonNasa3dAcquisition.receiptSha256
  || capability.capabilities.majorMoonNasa3dAnalysisReceiptSha256 !== majorMoonNasa3dAnalysis.receiptSha256
  || capability.capabilities.majorMoonNasa3dNegativeEvidenceReceiptSha256 !== majorMoonNasa3dNegativeEvidence.receiptSha256
  || capability.evidence.majorMoonReferenceReceiptSha256 !== majorMoonReceipt.receiptSha256
  || currentState.evidence.majorMoonReferenceReceiptSha256 !== majorMoonReceipt.receiptSha256
  || capability.capabilities.majorMoonMetadataProbeCompleteCount !== 12
  || capability.capabilities.majorMoonExplicitHttpsAcquisitionCandidateCount !== 8
  || capability.capabilities.majorMoonUnresolvedAssetTargetCount !== 4
  || capability.capabilities.majorMoonSourceMetadataAcquiredCount !== 8
  || capability.capabilities.majorMoonVisualSourceAcquiredCount !== 6
  || capability.capabilities.majorMoonVisualSourceCoverageBlockedCount !== 3
  || capability.capabilities.majorMoonOfficialCollectionMetadataCount !== 4
  || capability.capabilities.majorMoonSecondaryProductMetadataCount !== 5
  || capability.capabilities.majorMoonOfficialPreviewAssetCount !== 6
  || capability.capabilities.majorMoonOfficialPreviewSourceResolutionLimited !== true
  || capability.capabilities.majorMoonOfficialPreviewAcquisitionReceiptSha256 !== majorMoonOfficialPreviewAcquisition.receiptSha256
  || capability.capabilities.majorMoonLiteIncrementBytes !== majorMoonVisualAssetsReceipt.liteIncrementBytes
  || capability.capabilities.standaloneBuildPassed !== true
  || capability.capabilities.liteBuildPassed !== true
  || capability.capabilities.standaloneBuildReceiptFileSha256 !== standaloneBuild.fileSha256
  || capability.capabilities.liteBuildReceiptFileSha256 !== liteBuild.fileSha256
  || capability.capabilities.projectedFullCompressedBytes !== projectedFullCompressedBytes
  || capability.capabilities.fullCompressedMaximumBytes !== fullCompressedMaximumBytes
  || capability.capabilities.projectedLiteTotalBytes !== projectedLiteTotalBytes
  || capability.capabilities.liteTotalMaximumBytes !== liteTotalMaximumBytes
  || capability.capabilities.liveBrowserMatrixPassed !== true
  || capability.capabilities.liveBrowserMatrixFrameCount !== liveBrowserReceipt.frames.length
  || capability.capabilities.liveBrowserMatrixDesktopMinimumSampledFps !== liveBrowserReceipt.admission.desktopMinimumSampledFps
  || capability.capabilities.liveBrowserMatrixMobileMinimumSampledFps !== liveBrowserReceipt.admission.mobileMinimumSampledFps
  || capability.capabilities.liveBrowserMatrixDeepSpaceMinimumSampledFps !== liveBrowserReceipt.admission.deepSpaceMinimumSampledFps
  || capability.capabilities.liveBrowserMatrixSingleCanvas !== true
  || capability.capabilities.liveBrowserMatrixConsolePageWebglErrorCount !== 0
  || capability.capabilities.liveBrowserMatrixScientificPayloadWriteback !== false
  || capability.capabilities.browserSoakThirtyMinuteDurationPassed !== true
  || capability.capabilities.browserSoakSampleCount !== 59
  || capability.capabilities.browserSoakMinimumFpsMedian !== browserSoakResourceReceipt.soak.fpsMedian.minimum
  || capability.capabilities.browserSoakRendererResourceNoGrowthPassed !== true
  || capability.capabilities.browserSoakReleaseRestorePassed !== true
  || capability.capabilities.browserSoakStrictReleaseRestoreCycleCount !== 4
  || capability.capabilities.browserSoakJsHeapTelemetryAvailable !== browserSoakTelemetryAvailable
  || capability.capabilities.browserSoakJsHeapGrowthGatePassed !== browserSoakHeapQualified
  || capability.capabilities.browserSoakFullMemoryGatePassed !== browserSoakHeapQualified
  || capability.blockedGates.soak30Minutes !== (
    browserSoakHeapQualified
      ? "passed:30m-visible-renderer-stable-release-restore-js-heap-growth"
      : browserSoakTelemetryAvailable
        ? "partial-passed:30m-visible-renderer-stable-release-restore-passed;blocked-js-heap-growth-threshold"
        : "partial-passed:30m-visible-renderer-stable-release-restore-passed;blocked-js-heap-telemetry-unavailable"
  )
  || capability.evidence.majorMoonAssetMetadataAdmissionReceiptSha256 !== majorMoonAssetMetadataAdmission.receiptSha256
  || currentState.evidence.majorMoonAssetMetadataAdmissionReceiptSha256 !== majorMoonAssetMetadataAdmission.receiptSha256
  || capability.evidence.majorMoonItemMetadataAcquisitionReceiptSha256 !== majorMoonItemMetadataReceipt.receiptSha256
  || capability.evidence.majorMoonItemLicenseReviewReceiptSha256 !== majorMoonLicenseReview.receiptSha256
  || capability.evidence.majorMoonVisualSourceAcquisitionReceiptSha256 !== majorMoonVisualSourceAcquisition.receiptSha256
  || capability.evidence.majorMoonVisualSourceAnalysisReceiptSha256 !== majorMoonVisualAnalysis.receiptSha256
  || capability.evidence.majorMoonOfficialCollectionMetadataReceiptSha256 !== majorMoonOfficialCollectionMetadata.receiptSha256
  || capability.evidence.majorMoonSecondaryProductMetadataReceiptSha256 !== majorMoonSecondaryProductMetadata.receiptSha256
  || capability.evidence.majorMoonOfficialPreviewAcquisitionReceiptSha256 !== majorMoonOfficialPreviewAcquisition.receiptSha256
  || capability.evidence.majorMoonVisualAssetManifestSha256 !== majorMoonVisualAssets.manifestSha256
  || capability.evidence.majorMoonVisualAssetReceiptSha256 !== majorMoonVisualAssetsReceipt.receiptSha256
  || capability.evidence.majorMoonSecondaryVisualEvidenceReceiptSha256 !== majorMoonSecondaryVisualEvidence.receiptSha256
  || capability.evidence.majorMoonUsGsFinalAcquisitionReceiptSha256 !== majorMoonUsGsFinalAcquisition.receiptSha256
  || capability.evidence.majorMoonUsGsFinalAnalysisReceiptSha256 !== majorMoonUsGsFinalAnalysis.receiptSha256
  || capability.evidence.majorMoonAlternativeNegativeEvidenceReceiptSha256 !== majorMoonAlternativeNegativeEvidence.receiptSha256
  || capability.evidence.majorMoonNasa3dAcquisitionReceiptSha256 !== majorMoonNasa3dAcquisition.receiptSha256
  || capability.evidence.majorMoonNasa3dAnalysisReceiptSha256 !== majorMoonNasa3dAnalysis.receiptSha256
  || capability.evidence.majorMoonNasa3dNegativeEvidenceReceiptSha256 !== majorMoonNasa3dNegativeEvidence.receiptSha256
  || capability.evidence.majorMoonBrowserMatrixReceiptSha256 !== majorMoonBrowserReceipt.receiptSha256
  || capability.evidence.liveBrowserMatrixReceiptSha256 !== liveBrowserReceipt.receiptSha256
  || capability.evidence.browserSoakResourceReceiptSha256 !== browserSoakResourceReceipt.receiptSha256
  || currentState.evidence.majorMoonItemMetadataAcquisitionReceiptSha256 !== majorMoonItemMetadataReceipt.receiptSha256
  || currentState.evidence.majorMoonItemLicenseReviewReceiptSha256 !== majorMoonLicenseReview.receiptSha256
  || currentState.evidence.majorMoonVisualSourceAcquisitionReceiptSha256 !== majorMoonVisualSourceAcquisition.receiptSha256
  || currentState.evidence.majorMoonVisualSourceAnalysisReceiptSha256 !== majorMoonVisualAnalysis.receiptSha256
  || currentState.evidence.majorMoonOfficialCollectionMetadataReceiptSha256 !== majorMoonOfficialCollectionMetadata.receiptSha256
  || currentState.evidence.majorMoonSecondaryProductMetadataReceiptSha256 !== majorMoonSecondaryProductMetadata.receiptSha256
  || currentState.evidence.majorMoonOfficialPreviewAcquisitionReceiptSha256 !== majorMoonOfficialPreviewAcquisition.receiptSha256
  || currentState.evidence.majorMoonVisualAssetManifestSha256 !== majorMoonVisualAssets.manifestSha256
  || currentState.evidence.majorMoonVisualAssetReceiptSha256 !== majorMoonVisualAssetsReceipt.receiptSha256
  || currentState.evidence.majorMoonSecondaryVisualEvidenceReceiptSha256 !== majorMoonSecondaryVisualEvidence.receiptSha256
  || currentState.evidence.majorMoonUsGsFinalAcquisitionReceiptSha256 !== majorMoonUsGsFinalAcquisition.receiptSha256
  || currentState.evidence.majorMoonUsGsFinalAnalysisReceiptSha256 !== majorMoonUsGsFinalAnalysis.receiptSha256
  || currentState.evidence.majorMoonAlternativeNegativeEvidenceReceiptSha256 !== majorMoonAlternativeNegativeEvidence.receiptSha256
  || currentState.evidence.majorMoonNasa3dAcquisitionReceiptSha256 !== majorMoonNasa3dAcquisition.receiptSha256
  || currentState.evidence.majorMoonNasa3dAnalysisReceiptSha256 !== majorMoonNasa3dAnalysis.receiptSha256
  || currentState.evidence.majorMoonNasa3dNegativeEvidenceReceiptSha256 !== majorMoonNasa3dNegativeEvidence.receiptSha256
  || currentState.evidence.majorMoonBrowserMatrixReceiptSha256 !== majorMoonBrowserReceipt.receiptSha256
  || currentState.evidence.liveBrowserMatrixReceiptSha256 !== liveBrowserReceipt.receiptSha256
  || currentState.evidence.browserSoakResourceReceiptSha256 !== browserSoakResourceReceipt.receiptSha256
  || capability.evidence.standaloneBuildReceiptFileSha256 !== standaloneBuild.fileSha256
  || capability.evidence.liteBuildReceiptFileSha256 !== liteBuild.fileSha256
  || currentState.evidence.standaloneBuildReceiptFileSha256 !== standaloneBuild.fileSha256
  || currentState.evidence.liteBuildReceiptFileSha256 !== liteBuild.fileSha256
  || currentState.progress.majorMoons !== majorMoonExpectedProgress
  || capability.blockedGates.majorMoons !== majorMoonExpectedBlockedGate
  || capability.releaseAuthorized !== false
  || pointer.manifestSha256 !== manifest.manifestSha256
  || pointer.formalProductPointer !== "v263"
  || pointer.productionPromotionAllowed !== false
) throw new Error("v592-verify-governance-chain");

const page = read("app/local-shadow-v592/page.tsx");
const shell = read("app/components/OrbitAtlasLivingUniverseV592.tsx");
const stage = read("app/components/LivingUniverseStageV592.tsx");
const nebulaLayer = read("app/components/ExpandedNebulaLayerV592.tsx");
const nebulaLoader = read("app/lib/useNebulaVisualTextureV592.ts");
const bridge = read("app/components/CelestialRotationBridgeV592.tsx");
const starfield = read("app/components/LivingStarfieldV592.tsx");
const constellationArt = read("app/components/ConstellationEngravingV592.tsx");
const constellationArtGeometry = read("app/lib/constellationArtV592.ts");
const deepSpaceLayer = read("app/components/DeepSpaceReferenceLayerV592.tsx");
const deepSpaceRuntime = read("app/lib/deepSpaceReferenceV592.ts");
const deepSpaceVisualRuntime = read("app/lib/deepSpaceVisualAssetsV592.ts");
const deepSpaceVisualLoader = read("app/lib/useDeepSpaceVisualTextureV592.ts");
if (
  !page.includes("OrbitAtlasLivingUniverseV592Lazy")
  || !page.includes('data-atlas-formal-product-pointer="v263"')
  || shell.includes("<Canvas")
  || !shell.includes('data-atlas-v592-canvas-count="1"')
  || !shell.includes('data-atlas-v592-scientific-writeback="false"')
  || !shell.includes("NebulaInspectorV592")
  || !shell.includes("LivingUniverseFocusTargetV592")
  || !stage.includes("ExpandedNebulaLayerV592")
  || !stage.includes("livingFocusTarget")
  || !nebulaLayer.includes('atlasScienceImagePayload: false')
  || !nebulaLayer.includes("selectNebulaVisualImpostorsV592(profile.mode, focusTarget)")
  || !nebulaLayer.includes("atlasScientificPayloadWriteback: false")
  || !nebulaLoader.includes("loadVerifiedBytesV592")
  || !nebulaLoader.includes("sha256BytesHexV566")
  || !nebulaLoader.includes('acquireAtlasResource("worker"')
  || !nebulaLoader.includes('acquireAtlasResource("object-url"')
  || !nebulaLoader.includes("waitForV591DecoderSettlementV592")
  || !nebulaLoader.includes("disposeV591TextureLoader(gl)")
  || !bridge.includes("clock.getJulianDate(performance.now())")
  || !bridge.includes("uPhysicalDaysV592")
  || !shell.includes("StellarInspectorV592")
  || !shell.includes("resolveMobileFocusLabelV592")
  || !shell.includes("data-atlas-v592-mobile-focus-label")
  || !starfield.includes("ConstellationEngravingV592")
  || !constellationArt.includes('profile.mode === "cinematic"')
  || !constellationArt.includes('atlasV592ConstellationArtScientificWriteback = "false"')
  || !constellationArt.includes("atlasPresentationOnly: true")
  || !constellationArtGeometry.includes('primaryModel: "deterministic-tangent-plane-celestial-engraving"')
  || !constellationArtGeometry.includes("scientificPayloadWriteback: false")
  || !stage.includes("DeepSpaceReferenceLayerV592")
  || !deepSpaceLayer.includes('atlasGalaxyReferenceCount: 12')
  || !deepSpaceLayer.includes('atlasClusterReferenceCount: 12')
  || !deepSpaceLayer.includes('atlasVisualAssetAdmissionCount: 24')
  || !deepSpaceLayer.includes('atlasGalaxyVisualAssetAdmissionCount: 12')
  || !deepSpaceLayer.includes('atlasClusterVisualAssetAdmissionCount: 12')
  || !deepSpaceLayer.includes('atlasObservationImageClaim: visualRequested')
  || !deepSpaceLayer.includes('profile.mode === "cinematic"')
  || !deepSpaceLayer.includes('root.dataset.atlasV592DeepSpaceVisualAssetAdmission = "24/24"')
  || !deepSpaceLayer.includes('openngc-catalog-derived-galaxy-analytic')
  || !deepSpaceLayer.includes('atlasCatalogDerivedVisualModel: asset.catalogDerivedVisualModel')
  || !deepSpaceLayer.includes('atlasScientificPayloadWriteback: false')
  || !deepSpaceLayer.includes('root.dataset.atlasV592DeepSpaceScientificWriteback = "false"')
  || !deepSpaceRuntime.includes("isDeepSpaceReferenceIdV592")
  || !deepSpaceVisualRuntime.includes("selectDeepSpaceVisualSlicesV592")
  || !deepSpaceVisualRuntime.includes("scienceImagePayload: false")
  || !deepSpaceVisualLoader.includes("loadVerifiedBytesV592")
  || !deepSpaceVisualLoader.includes("sha256BytesHexV566")
  || !deepSpaceVisualLoader.includes('acquireAtlasResource("worker"')
  || !deepSpaceVisualLoader.includes('acquireAtlasResource("object-url"')
  || !deepSpaceVisualLoader.includes("disposeDeepSpaceVisualTextureLoaderV592")
  || !shell.includes("DeepSpaceReferenceInspectorV592")
  || !shell.includes("catalog-reference-admitted-visual-asset-blocked")
  || !shell.includes("catalog-reference-and-presentation-image-admitted")
) throw new Error("v592-verify-runtime-contract");

console.log(JSON.stringify({
  status: "passed-readonly",
  candidateStatus: manifest.status,
  manifestSha256: manifest.manifestSha256,
  sourceManifestSha256: sourceManifest.receiptSha256,
  freezeBeforeSha256: freezeBefore.snapshotSha256,
  frozenCount: freezeBefore.frozenSnapshot.length,
  rotationAbsoluteAdmission: `${rotation.admission.absoluteAdmittedCount}/16`,
  rotationKinematicAdmission: `${rotation.admission.kinematicAdmittedCount}/16`,
  stellarHeroCatalog: `${stellarHeroes.admission.catalogPacketCount}/24`,
  stellarHeroBrowserMatrix: `${stellarBrowserReceipt.admission.stellarHeroCount}/24:${stellarBrowserReceipt.frames.length}/48`,
  gaiaBaseCatalog: `${manifest.starfield.catalogRecordCount}/46000`,
  gaiaFullCatalog: `${manifest.starfield.fullDesktopCurrentCount}/60000`,
  gaiaConstellationBrowserMatrix: `${gaiaConstellationBrowserReceipt.admission.frameCount}/13:min-fps-${gaiaConstellationBrowserReceipt.admission.minimumFpsMedian}`,
  constellationScienceRuntime: `${manifest.constellations.constellationCount}/88:${manifest.constellations.waypointCount}/484`,
  constellationArt: `${constellationArtReferenceReceipt.admission.admittedCount}/88:${constellationArtBrowserReceipt.admission.frameCount}/9:min-fps-${constellationArtBrowserReceipt.admission.minimumFpsMedian}`,
  deepSpaceReferences: `galaxies-${deepSpaceReference.admission.admittedGalaxyReferenceCount}/12:clusters-${deepSpaceReference.admission.admittedClusterReferenceCount}/12:visual-metadata-${deepSpaceReference.admission.visualMetadataCandidateCount}/24:visual-assets-${deepSpaceVisualAssets.admission.totalAssetAdmittedCount}/24`,
  nebulaMetadataAdmission: `${nebulaAssetMetadataAdmission.summary.explicitHttpsAcquisitionCandidateCount}/18-candidates:${nebulaAssetMetadataAdmission.summary.terminalBlockedCount}-blocked:0-payloads`,
  nebulaVisualAdmission: `${nebulaVisualAssets.admission.runtimeAssetAdmittedCount + nebulaExtendedVisualAssets.admission.runtimeAssetAdmittedCount + nebulaClosureVisualAssets.admission.runtimeAssetAdmittedCount}/24-expanded-assets:${nebulaExtendedVisualAssetsReceipt.fullRuntimeBytes + nebulaClosureVisualAssetsReceipt.fullRuntimeBytes}-overlay-full-bytes:overlay-browser-passed`,
  nebulaBrowserMatrix: `${nebulaBrowserReceipt.admission.frameCount}/18-inherited:min-fps-${nebulaBrowserReceipt.admission.minimumFpsMedian}:overlay-${nebulaOverlayBrowserReceipt.admission.frameCount}/48:min-fps-${nebulaOverlayBrowserReceipt.admission.minimumFpsMedian}`,
  majorMoonAdmission: `${majorMoonPacket.admission.motionReferenceAdmittedCount}/12-motion:${majorMoonVisualAssets.admission.albedoAssetAdmittedCount}/12-albedo:${majorMoonBrowserReceipt.admission.runtimeHeroCandidateCount}/12-runtime-hero-candidates`,
  majorMoonAssetMetadata: `${majorMoonAssetMetadataAdmission.summary.explicitHttpsAcquisitionCandidateCount}/12-candidates:${majorMoonAssetMetadataAdmission.summary.unresolvedTargetCount}-unresolved:0-payloads`,
  builds: `standalone-${standaloneBuild.receipt.buildId}:lite-${liteBuild.receipt.buildId}`,
  budgets: `full-${projectedFullCompressedBytes}/${fullCompressedMaximumBytes}:lite-${projectedLiteTotalBytes}/${liteTotalMaximumBytes}`,
  formalProductPointer: pointer.formalProductPointer,
  releaseAuthorized: false,
}, null, 2));
