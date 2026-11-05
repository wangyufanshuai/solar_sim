import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const docsRoot = resolve(root, "docs/release/v591");
const manifestPath = resolve(root, "public/data/celestial-convergence-v591/manifest.json");
const generatedConstantsPath = resolve(root, "app/data/celestialConvergenceManifestV591.generated.ts");
const generatedConstellationConstantsPath = resolve(root, "app/data/celestialConstellationsV591.generated.ts");
const generatedAssetConstantsPath = resolve(root, "app/data/celestialConvergenceAssetsV591.generated.ts");
const pointerPath = resolve(root, "dist/release/orbit-atlas-current-celestial-convergence-candidate-v591.json");
const scientificPayloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
const readJson = (relativePath) => JSON.parse(readFileSync(resolve(root, relativePath), "utf8"));
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
function verifySealed(relativePath, field) {
  const document = readJson(relativePath);
  const unsigned = { ...document };
  delete unsigned[field];
  if (canonicalSha(unsigned) !== document[field]) throw new Error(`v591-baseline-seal:${relativePath}`);
  return document;
}
function fileRecord(relativePath, expectedSha256) {
  const path = resolve(root, relativePath);
  if (!existsSync(path)) {
    const matched = expectedSha256 === null;
    return { path: relativePath, exists: false, bytes: 0, sha256: null, expectedSha256, status: matched ? "matched-missing" : "missing" };
  }
  const bytes = readFileSync(path);
  const observed = sha256(bytes);
  return {
    path: relativePath,
    exists: true,
    bytes: bytes.byteLength,
    sha256: observed,
    expectedSha256,
    status: observed === expectedSha256 ? "matched" : expectedSha256 === null ? "unexpectedly-present" : "drift",
  };
}
function publicPathFromUrl(url) {
  if (!url.startsWith("/") || url.startsWith("//")) return null;
  const decoded = decodeURIComponent(url.split("?")[0]);
  if (decoded.includes("\\") || decoded.split("/").includes("..")) throw new Error(`v591-baseline-asset-path:${url}`);
  return `public/${decoded.replace(/^\/+/, "")}`;
}

const constellationPacketBuild = spawnSync(process.execPath, ["scripts/build-v591-constellation-packet.mjs"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
if (constellationPacketBuild.status !== 0) {
  throw new Error(`v591-constellation-packet-build:${constellationPacketBuild.stderr || constellationPacketBuild.stdout}`);
}
const constellationPacket = readJson("public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json");
const constellationPacketBytes = readFileSync(resolve(root, "public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json"));
const constellationPacketFileSha256 = sha256(constellationPacketBytes);
const constellationPacketUnsigned = { ...constellationPacket };
delete constellationPacketUnsigned.packetSha256;
const constellationLabelAtlasMetadata = readJson("public/data/celestial-convergence-v591/constellation-label-atlas-v591.json");
const constellationLabelAtlasPath = publicPathFromUrl(constellationLabelAtlasMetadata.atlas.path);
const constellationLabelAtlasBytes = readFileSync(resolve(root, constellationLabelAtlasPath));
const generatedConstellationConstants = readFileSync(generatedConstellationConstantsPath, "utf8");
const generatedPacketFileSha256 = generatedConstellationConstants.match(/CONSTELLATION_PACKET_FILE_SHA256_V591 = "([a-f0-9]{64})"/)?.[1];
const generatedPacketSha256 = generatedConstellationConstants.match(/CONSTELLATION_PACKET_SHA256_V591 = "([a-f0-9]{64})"/)?.[1];
const generatedLabelAtlasSha256 = generatedConstellationConstants.match(/CONSTELLATION_LABEL_ATLAS_FILE_SHA256_V591 = "([a-f0-9]{64})"/)?.[1];
const generatedLabelAtlasBytes = generatedConstellationConstants.match(/CONSTELLATION_LABEL_ATLAS_BYTES_V591 = (\d+)/)?.[1];
if (
  canonicalSha(constellationPacketUnsigned) !== constellationPacket.packetSha256
  || !generatedPacketSha256
  || generatedPacketSha256 !== constellationPacket.packetSha256
  || generatedPacketFileSha256 !== constellationPacketFileSha256
  || generatedLabelAtlasSha256 !== constellationLabelAtlasMetadata.atlas.sha256
  || Number(generatedLabelAtlasBytes) !== constellationLabelAtlasMetadata.atlas.bytes
) {
  throw new Error("v591-constellation-packet-build-identity");
}
if (sha256(constellationLabelAtlasBytes) !== constellationLabelAtlasMetadata.atlas.sha256) {
  throw new Error("v591-constellation-label-atlas-build-identity");
}

const v590Manifest = verifySealed("public/data/celestial-rendering-v590/manifest.json", "manifestSha256");
const v590SourceManifest = verifySealed("docs/release/v590/source-manifest-v590.json", "receiptSha256");
const v590FreezeBefore = verifySealed("docs/release/v590/freeze-before-v590.json", "snapshotSha256");
const v590FreezeAfter = verifySealed("docs/release/v590/freeze-after-v590.json", "snapshotSha256");
const v590Verification = verifySealed("docs/release/v590/verification-receipt-v590.json", "receiptSha256");
const v590Capability = verifySealed("docs/release/v590/capability-report-v590.json", "reportSha256");
const v590CurrentState = verifySealed("docs/release/v590/current-state-receipt-v590.json", "receiptSha256");
const v590Pointer = verifySealed("dist/release/orbit-atlas-current-celestial-rendering-candidate-v590.json", "pointerSha256");
const v589Manifest = verifySealed("public/data/celestial-art-v589/manifest.json", "manifestSha256");
const v589Acquisition = verifySealed("docs/release/v589/acquisition-receipt-v589.json", "receiptSha256");
const bennuLodReceipt = verifySealed("docs/release/v589/bennu-lod-receipt-v589.json", "receiptSha256");
const sunAcquisition = verifySealed("docs/release/v591/acquisition-receipt-sun.json", "receiptSha256");
const moonAcquisition = verifySealed("docs/release/v591/acquisition-receipt-moon.json", "receiptSha256");
const mercuryMetadata = verifySealed("docs/release/v591/metadata-probe-mercury-usgs-dem.json", "receiptSha256");
const mercuryAcquisition = verifySealed("docs/release/v591/acquisition-receipt-mercury.json", "receiptSha256");
const marsAcquisition = verifySealed("docs/release/v591/acquisition-receipt-mars.json", "receiptSha256");
const jupiterAcquisition = verifySealed("docs/release/v591/acquisition-receipt-jupiter.json", "receiptSha256");
const saturnAcquisition = verifySealed("docs/release/v591/acquisition-receipt-saturn.json", "receiptSha256");
const saturnAtmosphereSupplement = verifySealed("docs/release/v591/acquisition-receipt-saturn-atmosphere-supplement.json", "receiptSha256");
const bennuAcquisition = verifySealed("docs/release/v591/acquisition-receipt-bennu.json", "receiptSha256");
const vestaAcquisition = verifySealed("docs/release/v591/acquisition-assets-nasa-small-bodies/vesta-nasa-shape-source.json", "receiptSha256");
const vestaModelLodReceipt = verifySealed("docs/release/v591/vesta-model-lod-receipt-v591.json", "receiptSha256");
const nasa3dTreeMetadata = verifySealed("docs/release/v591/metadata-probe-nasa-3d-tree.json", "receiptSha256");
const nasaGitBlobAcquisition = verifySealed("docs/release/v591/acquisition-receipt-nasa-git-blobs.json", "receiptSha256");
const erosAcquisition = verifySealed("docs/release/v591/acquisition-assets-nasa-git-blobs/eros-nasa-shape-source.json", "receiptSha256");
const kleopatraAcquisition = verifySealed("docs/release/v591/acquisition-assets-nasa-git-blobs/kleopatra-nasa-shape-source.json", "receiptSha256");
const erosModelLodReceipt = verifySealed("docs/release/v591/eros-model-lod-receipt-v591.json", "receiptSha256");
const kleopatraModelLodReceipt = verifySealed("docs/release/v591/kleopatra-model-lod-receipt-v591.json", "receiptSha256");
const marsIdentityAudit = verifySealed("docs/release/v591/mars-albedo-identity-audit.json", "receiptSha256");
const marsFullSourceBlock = verifySealed("docs/release/v591/acquisition-blocked-mars-usgs-full.json", "receiptSha256");
const marsNasa3dTiffBlock = verifySealed("docs/release/v591/acquisition-blocked-mars-nasa3d.json", "receiptSha256");
const marsNasa3dJpegBlock = verifySealed("docs/release/v591/acquisition-blocked-mars-nasa3d-jpeg.json", "receiptSha256");
const marsExperimentalCompositeAudit = verifySealed("docs/release/v591/mars-albedo-composite-audit.json", "receiptSha256");
const marsCompositeRejection = verifySealed("docs/release/v591/mars-albedo-composite-rejection.json", "receiptSha256");
const marsAlbedoResampleAudit = verifySealed("docs/release/v591/mars-albedo-usgs-resample-audit.json", "receiptSha256");
const venusAssetOverlay = verifySealed("public/data/celestial-convergence-v591/venus-asset-overlay.json", "receiptSha256");
const venusSurfaceBlocked = verifySealed("docs/release/v591/acquisition-blocked-venus.json", "receiptSha256");
const venusTopographyBlocked = verifySealed("docs/release/v591/acquisition-blocked-venus-topography.json", "receiptSha256");
const venusTopographyReceipt = verifySealed("docs/release/v591/acquisition-asset-venus-topography.json", "receiptSha256");
const venusAliasMetadata = verifySealed("docs/release/v591/metadata-probe-venus-s3-path-alias.json", "receiptSha256");
const venusAliasLedger = verifySealed("docs/release/v591/acquisition-url-ledger-venus-s3-path-alias.json", "receiptSha256");
const venusOriginalCubeBlocked = verifySealed("docs/release/v591/acquisition-blocked-venus-clrtopo-6600m-cube-source-v591.json", "receiptSha256");
const venusAliasBlocked = verifySealed("docs/release/v591/acquisition-blocked-venus-clrtopo-6600m-cube-path-alias-v591.json", "receiptSha256");
const venusMultiviewAcquisitions = Object.freeze([
  verifySealed("docs/release/v591/acquisition-asset-venus-magellan-0e.json", "receiptSha256"),
  verifySealed("docs/release/v591/acquisition-asset-venus-magellan-90e.json", "receiptSha256"),
  verifySealed("docs/release/v591/acquisition-asset-venus-magellan-270e.json", "receiptSha256"),
]);
const sunAssetOverlay = verifySealed("public/data/celestial-convergence-v591/sun-asset-overlay.json", "receiptSha256");
const earthAssetOverlay = verifySealed("public/data/celestial-convergence-v591/earth-asset-overlay.json", "receiptSha256");
const moonAssetOverlay = verifySealed("public/data/celestial-convergence-v591/moon-asset-overlay.json", "receiptSha256");
const mercuryAssetOverlay = verifySealed("public/data/celestial-convergence-v591/mercury-asset-overlay.json", "receiptSha256");
const marsAssetOverlay = verifySealed("public/data/celestial-convergence-v591/mars-asset-overlay.json", "receiptSha256");
const jupiterAssetOverlay = verifySealed("public/data/celestial-convergence-v591/jupiter-asset-overlay.json", "receiptSha256");
const saturnAssetOverlay = verifySealed("public/data/celestial-convergence-v591/saturn-asset-overlay.json", "receiptSha256");
const bennuAssetOverlay = verifySealed("public/data/celestial-convergence-v591/bennu-asset-overlay.json", "receiptSha256");
const vestaAssetOverlay = verifySealed("public/data/celestial-convergence-v591/vesta-asset-overlay.json", "receiptSha256");
const erosAssetOverlay = verifySealed("public/data/celestial-convergence-v591/eros-asset-overlay.json", "receiptSha256");
const kleopatraAssetOverlay = verifySealed("public/data/celestial-convergence-v591/kleopatra-asset-overlay.json", "receiptSha256");
const tempel1Acquisition = verifySealed("docs/release/v591/acquisition-asset-tempel-1-pds-shape-v2.json", "receiptSha256");
const tempel1ModelLodReceipt = verifySealed("docs/release/v591/tempel-1-model-lod-receipt-v591.json", "receiptSha256");
const tempel1AssetOverlay = verifySealed("public/data/celestial-convergence-v591/tempel-1-asset-overlay.json", "receiptSha256");
const tempel1AssetBuildReceipt = verifySealed("docs/release/v591/tempel-1-asset-build-receipt-v591.json", "receiptSha256");
const ceresMetadata = verifySealed("docs/release/v591/metadata-probe-ceres-pds-target-products.json", "receiptSha256");
const ceresAcquisition = verifySealed("docs/release/v591/acquisition-asset-ceres-pds-radius-albedo.json", "receiptSha256");
const ceresShapeBlocked = verifySealed("docs/release/v591/acquisition-assets-ceres-pds/ceres-shape-data-blocked.json", "receiptSha256");
const ceresCentralMirrorBlocked = verifySealed("docs/release/v591/acquisition-assets-ceres-pds/ceres-shape-data-central-blocked.json", "receiptSha256");
const ceresModelLodReceipt = verifySealed("docs/release/v591/ceres-model-lod-receipt-v591.json", "receiptSha256");
const ceresTextureDerivationReceipt = verifySealed("docs/release/v591/ceres-texture-derivation-receipt-v591.json", "receiptSha256");
const ceresAssetBuildReceipt = verifySealed("docs/release/v591/ceres-asset-build-receipt-v591.json", "receiptSha256");
const ceresAssetOverlay = verifySealed("public/data/celestial-convergence-v591/ceres-asset-overlay.json", "receiptSha256");
const iceGiantPrimaryOverlay = verifySealed("public/data/celestial-convergence-v591/ice-giant-primary-overlay.json", "receiptSha256");
const historicalNebulaBlock = verifySealed("docs/release/v591/acquisition-blocked-nebulae.json", "receiptSha256");
const veilAcquisition = verifySealed("docs/release/v591/acquisition-asset-veil-cygnus-loop.json", "receiptSha256");
const nebulaAssetOverlay = verifySealed("public/data/celestial-convergence-v591/nebula-asset-overlay.json", "receiptSha256");
if (
  nebulaAssetOverlay.version !== "v591-nebula-asset-overlay-v1"
  || nebulaAssetOverlay.status !== "6-of-6-runtime-admitted"
  || nebulaAssetOverlay.assets?.length !== 6
  || nebulaAssetOverlay.blocked?.length !== 0
  || nebulaAssetOverlay.policy?.science !== "marker-only-no-image-payload"
  || nebulaAssetOverlay.policy?.cinematic !== "verified-nasa-presentation-impostor-only"
  || nebulaAssetOverlay.policy?.fixedJ2000Directions !== true
  || nebulaAssetOverlay.policy?.noSyntheticReplacement !== true
  || nebulaAssetOverlay.authorityState?.scientificPayloadWriteback !== false
) throw new Error("v591-nebula-overlay-chain");
const veilAsset = nebulaAssetOverlay.assets.find((asset) => asset.id === "veil-nebula");
if (
  historicalNebulaBlock.failures?.some((failure) => failure.target === "veil-nebula" && String(failure.error).includes("960x540")) !== true
  || veilAcquisition.status !== "committed-single-request-no-retry"
  || veilAcquisition.asset?.target !== "veil-nebula"
  || veilAcquisition.asset?.nasaId !== "PIA15415"
  || veilAcquisition.asset?.width !== 6000
  || veilAcquisition.asset?.height !== 6000
  || veilAsset?.source?.acquisitionReceiptSha256 !== veilAcquisition.receiptSha256
) throw new Error("v591-nebula-veil-independent-admission-chain");
for (const asset of nebulaAssetOverlay.assets) {
  if (asset.presentationOnly !== true || asset.scientificAuthority !== false || asset.source?.license?.id !== "NASA-public-domain") throw new Error(`v591-nebula-overlay-authority:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const path = publicPathFromUrl(file.url);
    const current = fileRecord(path, file.sha256);
    if (current.status !== "matched" || current.bytes !== file.bytes) throw new Error(`v591-nebula-derived-drift:${asset.id}:${path}`);
  }
}

if (
  venusAssetOverlay.version !== "v591-venus-asset-overlay-v1"
  || !["venus-assets-derived-awaiting-runtime-admission", "venus-runtime-admitted"].includes(venusAssetOverlay.status)
  || venusAssetOverlay.acquisitionReceiptSha256 !== canonicalSha(venusMultiviewAcquisitions.map((receipt) => receipt.receiptSha256))
  || venusAssetOverlay.sourceReceiptSha256s?.join(",") !== venusMultiviewAcquisitions.map((receipt) => receipt.receiptSha256).join(",")
  || venusAssetOverlay.assets?.length !== 4
  || venusAssetOverlay.proceduralFallback !== false
  || venusAssetOverlay.cloudModel?.observationTextureClaim !== false
  || venusAssetOverlay.cloudModel?.resourceMissingFallback !== false
  || venusAssetOverlay.authorityState?.scientificPayloadWriteback !== false
  || venusAssetOverlay.authorityState?.scientificAuthorityChanged !== false
  || venusAssetOverlay.authorityState?.measuredAuthorityGranted !== false
  || venusAssetOverlay.surfaceCoverage?.gridReferencePolicy !== "PIA00478-excluded-after-visual-qa-grid-and-label-contamination"
  || venusAssetOverlay.surfaceCoverage?.measuredTopographyClaim !== false
  || venusMultiviewAcquisitions.some((receipt) => receipt.status !== "committed-single-request-no-retry" || receipt.requestCount !== 1 || receipt.automaticRetryPerformed !== false || receipt.automaticReplacementPerformed !== false)
  || venusAliasBlocked.status !== "blocked-no-automatic-retry"
  || venusAliasBlocked.requestCount !== 1
  || venusAliasBlocked.automaticRetryPerformed !== false
  || venusAliasBlocked.automaticReplacementPerformed !== false
  || venusAliasBlocked.url !== venusAliasMetadata.candidate?.directUrl
  || !String(venusAliasBlocked.error).includes("timeout")
  || venusAliasLedger.entries?.length !== 1
  || venusAliasLedger.entries[0]?.url !== venusAliasMetadata.candidate?.directUrl
  || venusAliasLedger.entries[0]?.outcome !== "response-received"
  || venusOriginalCubeBlocked.status !== "blocked-no-automatic-retry"
) throw new Error("v591-venus-multiview-overlay-chain");
const venusExpectedRoles = new Map([
  ["venus-surface", "magellan-multiview-radar-surface"],
  ["venus-normal", "magellan-radar-derived-normal"],
  ["venus-roughness", "magellan-radar-derived-roughness"],
  ["venus-height", "magellan-radar-presentation-relief"],
]);
for (const asset of venusAssetOverlay.assets) {
  if (
    asset.body !== "venus"
    || asset.role !== venusExpectedRoles.get(asset.id)
    || asset.source?.acquisitionReceiptSha256 !== venusMultiviewAcquisitions[0].receiptSha256
    || asset.source?.sha256 !== venusMultiviewAcquisitions[0].asset.sha256
    || asset.source?.license?.id !== "NASA-public-domain"
    || asset.sourceComponents?.length !== venusMultiviewAcquisitions.length
    || asset.sourceComponents.some((source, index) => source.acquisitionReceiptSha256 !== venusMultiviewAcquisitions[index].receiptSha256 || source.sha256 !== venusMultiviewAcquisitions[index].asset.sha256 || source.host !== "images-assets.nasa.gov" || source.gridReference !== false)
    || asset.derivation?.gridReferenceWeightFraction !== 0
    || !String(asset.derivation?.observationLimit).includes("not physical elevation")
    || asset.presentationOnly !== true
  ) throw new Error(`v591-venus-multiview-asset:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const path = publicPathFromUrl(file.url);
    const current = fileRecord(path, file.sha256);
    if (current.status !== "matched" || current.bytes !== file.bytes) throw new Error(`v591-venus-multiview-derived-drift:${asset.id}:${path}`);
  }
}
for (const acquisition of venusMultiviewAcquisitions) {
  const source = fileRecord(acquisition.asset.outputPath, acquisition.asset.sha256);
  if (source.status !== "matched" || source.bytes !== acquisition.asset.bytes) throw new Error(`v591-venus-multiview-source-drift:${acquisition.asset.id}`);
}
if (
  venusSurfaceBlocked.status !== "blocked-no-automatic-retry"
  || venusTopographyBlocked.status !== "blocked-resource-throughput-no-retry"
  || venusTopographyBlocked.assetId !== venusTopographyReceipt.assetId
  || venusTopographyBlocked.url !== venusTopographyReceipt.url
  || venusTopographyReceipt.automaticRetryPerformed !== false
  || venusTopographyReceipt.automaticReplacementPerformed !== false
) throw new Error("v591-venus-historical-negative-evidence-chain");

if (
  v590Manifest.version !== "v590-celestial-rendering-candidate-v1"
  || v590Manifest.manifestSha256 !== v590Capability.candidate.manifestSha256
  || v590Pointer.manifestSha256 !== v590Manifest.manifestSha256
  || v590Pointer.capabilityReportSha256 !== v590Capability.reportSha256
  || v590Pointer.verificationReceiptSha256 !== v590Verification.receiptSha256
  || v590Pointer.freezeAfterSha256 !== v590FreezeAfter.snapshotSha256
  || v590CurrentState.candidate.manifestSha256 !== v590Manifest.manifestSha256
) throw new Error("v591-v590-chain-identity");
if (
  sunAcquisition.status !== "acquired-single-request-no-retry"
  || sunAcquisition.automaticRetryPerformed !== false
  || sunAcquisition.automaticReplacementPerformed !== false
  || sunAcquisition.assets.length !== 2
  || sunAssetOverlay.version !== "v591-sun-asset-overlay-v1"
  || sunAssetOverlay.acquisitionReceiptSha256 !== sunAcquisition.receiptSha256
  || sunAssetOverlay.mirroredHemisphereDisclosure !== true
  || sunAssetOverlay.authorityState.presentationOnly !== true
  || sunAssetOverlay.authorityState.scientificAuthorityChanged !== false
  || sunAssetOverlay.assets.length !== 2
) throw new Error("v591-sun-overlay-identity");
if (
  earthAssetOverlay.version !== "v591-earth-asset-overlay-v1"
  || earthAssetOverlay.status !== "earth-runtime-admitted-inherited-exact-bytes"
  || earthAssetOverlay.baseline?.manifestSha256 !== v590Manifest.manifestSha256
  || earthAssetOverlay.noNetworkRequestsPerformed !== true
  || earthAssetOverlay.noAssetBytesCopied !== true
  || earthAssetOverlay.reusePolicy !== "exact-v590-sealed-asset-bytes-readonly"
  || earthAssetOverlay.authorityState?.presentationOnly !== true
  || earthAssetOverlay.authorityState?.scientificAuthorityChanged !== false
  || earthAssetOverlay.authorityState?.scientificPayloadWriteback !== false
  || earthAssetOverlay.assets?.length !== 7
) throw new Error("v591-earth-overlay-identity");
if (
  mercuryMetadata.status !== "metadata-identity-confirmed-no-payload"
  || mercuryMetadata.object?.bytes !== 530_934_581
  || mercuryMetadata.object?.etag !== "310bf08bf1388369d2e31b1379739bf4-64"
  || mercuryAcquisition.status !== "acquired-single-request-no-retry"
  || mercuryAcquisition.automaticRetryPerformed !== false
  || mercuryAcquisition.automaticReplacementPerformed !== false
  || mercuryAcquisition.metadataReceiptSha256 !== mercuryMetadata.receiptSha256
  || mercuryAcquisition.assets?.length !== 1
  || mercuryAcquisition.assets[0]?.bytes !== 530_934_581
  || mercuryAcquisition.assets[0]?.sha256 !== "defce776241dcaf44cb0f081ee508c17dbea28aa5a22880bf7a5e8c25f96cbea"
  || mercuryAcquisition.albedoReference?.exactByteReuse !== true
  || mercuryAcquisition.albedoReference?.actualSha256 !== "f633fe2fc51656a9c5198cd34eaaf1fa5e5ae77c05461e012e19f4e14faa9f1f"
  || mercuryAssetOverlay.version !== "v591-mercury-asset-overlay-v1"
  || mercuryAssetOverlay.status !== "mercury-assets-derived-awaiting-runtime-admission"
  || mercuryAssetOverlay.acquisitionReceiptSha256 !== mercuryAcquisition.receiptSha256
  || mercuryAssetOverlay.metadataReceiptSha256 !== mercuryMetadata.receiptSha256
  || mercuryAssetOverlay.inheritedV589ManifestSha256 !== v589Manifest.manifestSha256
  || mercuryAssetOverlay.inheritedV589AcquisitionReceiptSha256 !== v589Acquisition.receiptSha256
  || mercuryAssetOverlay.noNetworkRequestsPerformed !== true
  || mercuryAssetOverlay.exactByteV589AlbedoSourceReuse !== true
  || mercuryAssetOverlay.derivationDeterministic !== true
  || mercuryAssetOverlay.proceduralFallback !== false
  || mercuryAssetOverlay.authorityState?.presentationOnly !== true
  || mercuryAssetOverlay.authorityState?.scientificAuthorityChanged !== false
  || mercuryAssetOverlay.authorityState?.scientificPayloadWriteback !== false
  || mercuryAssetOverlay.assets?.length !== 4
) throw new Error("v591-mercury-overlay-identity");
if (
  moonAcquisition.status !== "acquired-single-request-no-retry"
  || moonAcquisition.automaticRetryPerformed !== false
  || moonAcquisition.automaticReplacementPerformed !== false
  || moonAcquisition.requestedUrlCount !== 2
  || moonAcquisition.assets.length !== 2
  || moonAssetOverlay.version !== "v591-moon-asset-overlay-v1"
  || moonAssetOverlay.acquisitionReceiptSha256 !== moonAcquisition.receiptSha256
  || moonAssetOverlay.noNetworkRequestsPerformed !== true
  || moonAssetOverlay.derivationDeterministic !== true
  || moonAssetOverlay.authorityState?.presentationOnly !== true
  || moonAssetOverlay.authorityState?.scientificAuthorityChanged !== false
  || moonAssetOverlay.authorityState?.scientificPayloadWriteback !== false
  || moonAssetOverlay.assets?.length !== 4
) throw new Error("v591-moon-overlay-identity");
if (
  marsAcquisition.status !== "acquired-single-request-no-retry"
  || marsAcquisition.automaticRetryPerformed !== false
  || marsAcquisition.automaticReplacementPerformed !== false
  || marsAcquisition.assets.length !== 3
  || marsIdentityAudit.status !== "blocked-identity-mismatch"
  || marsFullSourceBlock.status !== "blocked-resource-throughput"
  || marsNasa3dTiffBlock.status !== "blocked-no-automatic-retry"
  || marsNasa3dJpegBlock.status !== "blocked-no-automatic-retry"
  || marsExperimentalCompositeAudit.status !== "passed-observational-composite"
  || marsCompositeRejection.status !== "rejected-upstream-license-and-product-identity-gap"
  || marsCompositeRejection.runtimeAdmission !== false
  || marsAlbedoResampleAudit.status !== "passed-public-domain-source-bounded-resample"
  || marsAlbedoResampleAudit.claims?.nativeEightKObservation !== false
  || marsAlbedoResampleAudit.claims?.runtimeTopographicDetailFromMolaOnly !== true
  || marsAssetOverlay.version !== "v591-mars-asset-overlay-v3"
  || marsAssetOverlay.status !== "mars-usgs-viking-color-mola-terrain-admitted"
  || marsAssetOverlay.acquisitionReceiptSha256 !== marsAcquisition.receiptSha256
  || marsAssetOverlay.albedoIdentityAuditReceiptSha256 !== marsIdentityAudit.receiptSha256
  || marsAssetOverlay.fullAlbedoBlockedReceiptSha256 !== marsFullSourceBlock.receiptSha256
  || marsAssetOverlay.albedoResampleAuditReceiptSha256 !== marsAlbedoResampleAudit.receiptSha256
  || marsAssetOverlay.compositeRejectionReceiptSha256 !== marsCompositeRejection.receiptSha256
  || marsAssetOverlay.proceduralFallback !== false
  || marsAssetOverlay.blockers?.length !== 0
  || marsAssetOverlay.authorityState?.presentationOnly !== true
  || marsAssetOverlay.authorityState?.scientificAuthorityChanged !== false
  || marsAssetOverlay.authorityState?.scientificPayloadWriteback !== false
  || marsAssetOverlay.assets?.length !== 4
) throw new Error("v591-mars-overlay-identity");
if (
  jupiterAcquisition.status !== "acquired-single-request-no-retry"
  || jupiterAcquisition.automaticRetryPerformed !== false
  || jupiterAcquisition.automaticReplacementPerformed !== false
  || jupiterAcquisition.policy?.requestPerUrlMaximum !== 1
  || new URL(jupiterAcquisition.asset?.finalUrl).hostname !== "assets.science.nasa.gov"
  || jupiterAcquisition.asset?.finalUrl !== jupiterAcquisition.asset?.sourceUrl
  || jupiterAcquisition.asset?.bytes !== 19_456_427
  || jupiterAcquisition.asset?.sha256 !== "f92ffc7a2fa0235c47ec8f1f168dd36bffeb6acc318292b237878a00a48cf7d9"
  || jupiterAssetOverlay.version !== "v591-jupiter-asset-overlay-v1"
  || jupiterAssetOverlay.status !== "jupiter-assets-derived-awaiting-runtime-admission"
  || jupiterAssetOverlay.acquisitionReceiptSha256 !== jupiterAcquisition.receiptSha256
  || jupiterAssetOverlay.noNetworkRequestsPerformed !== true
  || jupiterAssetOverlay.derivationDeterministic !== true
  || jupiterAssetOverlay.proceduralFallback !== false
  || jupiterAssetOverlay.authorityState?.presentationOnly !== true
  || jupiterAssetOverlay.authorityState?.scientificAuthorityChanged !== false
  || jupiterAssetOverlay.authorityState?.scientificPayloadWriteback !== false
  || jupiterAssetOverlay.assets?.length !== 3
) throw new Error("v591-jupiter-overlay-identity");
if (
  saturnAcquisition.status !== "acquired-two-urls-single-request-each-no-retry"
  || saturnAcquisition.automaticRetryPerformed !== false
  || saturnAcquisition.automaticReplacementPerformed !== false
  || saturnAcquisition.policy?.requestPerUrlMaximum !== 1
  || saturnAcquisition.assets?.length !== 2
  || saturnAtmosphereSupplement.status !== "acquired-explicit-supplement-single-request-no-retry"
  || saturnAtmosphereSupplement.automaticRetryPerformed !== false
  || saturnAtmosphereSupplement.automaticReplacementPerformed !== false
  || saturnAtmosphereSupplement.asset?.bytes !== 5_667_919
  || saturnAtmosphereSupplement.asset?.sha256 !== "1095bbfe968cbac1a5b905fac02a244ed4686ff04fb3d55ebc1a71a67b387b77"
  || saturnAssetOverlay.version !== "v591-saturn-asset-overlay-v1"
  || saturnAssetOverlay.status !== "saturn-assets-derived-awaiting-runtime-admission"
  || saturnAssetOverlay.acquisitionReceiptSha256 !== saturnAcquisition.receiptSha256
  || saturnAssetOverlay.atmosphereSupplementReceiptSha256 !== saturnAtmosphereSupplement.receiptSha256
  || saturnAssetOverlay.noNetworkRequestsPerformed !== true
  || saturnAssetOverlay.derivationDeterministic !== true
  || saturnAssetOverlay.proceduralFallback !== false
  || saturnAssetOverlay.authorityState?.presentationOnly !== true
  || saturnAssetOverlay.authorityState?.scientificAuthorityChanged !== false
  || saturnAssetOverlay.authorityState?.scientificPayloadWriteback !== false
  || saturnAssetOverlay.assets?.length !== 5
) throw new Error("v591-saturn-overlay-identity");
if (
  bennuAcquisition.status !== "acquired-single-request-no-retry"
  || bennuAcquisition.requestedUrlCount !== 3
  || bennuAcquisition.automaticRetryPerformed !== false
  || bennuAcquisition.automaticReplacementPerformed !== false
  || bennuAcquisition.assets?.length !== 3
  || bennuAssetOverlay.version !== "v591-bennu-asset-overlay-v1"
  || bennuAssetOverlay.status !== "bennu-assets-derived-awaiting-runtime-admission"
  || bennuAssetOverlay.acquisitionReceiptSha256 !== bennuAcquisition.receiptSha256
  || bennuAssetOverlay.noNetworkRequestsPerformedDuringDerivation !== true
  || bennuAssetOverlay.noModelBytesCopied !== true
  || bennuAssetOverlay.derivationDeterministic !== true
  || bennuAssetOverlay.proceduralFallback !== false
  || bennuAssetOverlay.authorityState?.presentationOnly !== true
  || bennuAssetOverlay.authorityState?.scientificAuthorityChanged !== false
  || bennuAssetOverlay.authorityState?.scientificPayloadWriteback !== false
  || bennuAssetOverlay.inheritedModel?.manifestSha256 !== v589Manifest.manifestSha256
  || bennuAssetOverlay.inheritedModel?.lodReceiptSha256 !== bennuLodReceipt.receiptSha256
  || bennuAssetOverlay.inheritedModel?.lods?.length !== 3
  || bennuAssetOverlay.assets?.length !== 3
) throw new Error("v591-bennu-overlay-identity");
if (
  vestaAcquisition.status !== "committed-single-request-no-retry"
  || vestaAcquisition.asset?.body !== "vesta"
  || vestaAcquisition.asset?.license?.id !== "NASA-public-domain"
  || vestaAcquisition.asset?.bytes !== 40_000_084
  || vestaAcquisition.asset?.sha256 !== "a20fbfc9378398fd157ad0421ceead4dff277f5d545aa7c86d7e14eaa160fe46"
  || vestaModelLodReceipt.status !== "three-lod-nasa-shape-model-ready-for-runtime-admission"
  || vestaModelLodReceipt.body !== "vesta"
  || vestaModelLodReceipt.source?.acquisitionReceiptSha256 !== vestaAcquisition.receiptSha256
  || vestaModelLodReceipt.lods?.length !== 3
  || vestaAssetOverlay.version !== "v591-vesta-asset-overlay-v1"
  || vestaAssetOverlay.status !== "vesta-assets-derived-awaiting-runtime-admission"
  || vestaAssetOverlay.acquisitionReceiptSha256 !== vestaAcquisition.receiptSha256
  || vestaAssetOverlay.modelLodReceiptSha256 !== vestaModelLodReceipt.receiptSha256
  || vestaAssetOverlay.noNetworkRequestsPerformedDuringDerivation !== true
  || vestaAssetOverlay.noTextureBytesCopied !== true
  || vestaAssetOverlay.derivationDeterministic !== true
  || vestaAssetOverlay.proceduralFallback !== false
  || vestaAssetOverlay.model?.candidate !== "v591-owned"
  || vestaAssetOverlay.model?.license?.id !== "NASA-public-domain"
  || vestaAssetOverlay.model?.normals !== true
  || vestaAssetOverlay.model?.watertight !== true
  || vestaAssetOverlay.model?.lods?.length !== 3
  || vestaAssetOverlay.microtextureReuse?.sourceOverlaySha256 !== bennuAssetOverlay.receiptSha256
  || vestaAssetOverlay.microtextureReuse?.noTextureBytesCopied !== true
  || vestaAssetOverlay.microtextureReuse?.assets?.length !== 3
  || vestaAssetOverlay.authorityState?.presentationOnly !== true
  || vestaAssetOverlay.authorityState?.scientificAuthorityChanged !== false
  || vestaAssetOverlay.authorityState?.scientificPayloadWriteback !== false
  || vestaAssetOverlay.authorityState?.measuredPhotometryClaim !== false
  || vestaAssetOverlay.authorityState?.measuredAuthorityGranted !== false
) throw new Error("v591-vesta-overlay-identity");
if (
  iceGiantPrimaryOverlay.version !== "v591-ice-giant-primary-overlay-v1"
  || iceGiantPrimaryOverlay.status !== "ice-giant-registered-primary-ready-for-runtime-admission"
  || iceGiantPrimaryOverlay.baseline?.manifestSha256 !== v590Manifest.manifestSha256
  || iceGiantPrimaryOverlay.baseline?.sourceManifestSha256 !== v590SourceManifest.receiptSha256
  || iceGiantPrimaryOverlay.noNetworkRequestsPerformed !== true
  || iceGiantPrimaryOverlay.noAssetBytesCopied !== true
  || iceGiantPrimaryOverlay.noTextureAssetsRequired !== true
  || iceGiantPrimaryOverlay.modelPolicy !== "registered-analytical-primary-not-observational-texture"
  || iceGiantPrimaryOverlay.authorityState?.presentationOnly !== true
  || iceGiantPrimaryOverlay.authorityState?.scientificAuthorityChanged !== false
  || iceGiantPrimaryOverlay.authorityState?.scientificPayloadWriteback !== false
  || iceGiantPrimaryOverlay.bodies?.length !== 2
  || iceGiantPrimaryOverlay.bodies.map((body) => body.body).join(",") !== "uranus,neptune"
  || iceGiantPrimaryOverlay.bodies.some((body) => body.proceduralPrimary !== true || body.proceduralFallback !== false || body.observationTextureClaim !== false || body.measuredPhotometryClaim !== false)
) throw new Error("v591-ice-giant-primary-overlay-identity");

if (
  nasa3dTreeMetadata.status !== "metadata-probe-complete-no-model-payload"
  || nasa3dTreeMetadata.policy?.requestCount !== 1
  || nasa3dTreeMetadata.policy?.automaticRetryPerformed !== false
  || nasa3dTreeMetadata.policy?.automaticReplacementPerformed !== false
  || nasa3dTreeMetadata.policy?.payloadDownloaded !== false
  || nasa3dTreeMetadata.metadataRequest?.status !== 200
  || nasa3dTreeMetadata.metadataRequest?.treeTruncated !== false
  || nasa3dTreeMetadata.admissionSummary?.eros !== "official-model-metadata-present"
  || nasa3dTreeMetadata.admissionSummary?.kleopatra !== "official-model-metadata-present"
  || nasa3dTreeMetadata.admissionSummary?.ceres !== "asset-blocked-no-official-model-in-tree"
  || nasa3dTreeMetadata.admissionSummary?.["tempel-1"] !== "asset-blocked-no-official-model-in-tree"
  || nasaGitBlobAcquisition.status !== "acquired-two-models-single-request-each-no-retry"
  || nasaGitBlobAcquisition.metadataReceiptSha256 !== nasa3dTreeMetadata.receiptSha256
  || nasaGitBlobAcquisition.automaticRetryPerformed !== false
  || nasaGitBlobAcquisition.automaticReplacementPerformed !== false
  || nasaGitBlobAcquisition.assets?.length !== 2
) throw new Error("v591-nasa-small-body-metadata-acquisition-chain");

const nasaSmallBodies = Object.freeze([
  {
    body: "eros",
    acquisition: erosAcquisition,
    modelReceipt: erosModelLodReceipt,
    overlay: erosAssetOverlay,
    sourceBytes: 10_042_884,
    sourceSha256: "deeff6a7a82b920ed907483339c4ee32bc8f18e5854dbf71d194039640336be9",
    sourceGitBlobSha1: "62a3387878bf475d634819d5960806457d22763d",
    sourceDetailCeiling: "nasa-shape-200856-triangles",
    lodTriangles: [99_364, 24_840, 4_966],
    materialSubstrate: "bounded-s-type-silicate-reference",
    materialReflectance: "oren-nayar-plus-bounded-opposition-no-glossy-specular",
  },
  {
    body: "kleopatra",
    acquisition: kleopatraAcquisition,
    modelReceipt: kleopatraModelLodReceipt,
    overlay: kleopatraAssetOverlay,
    sourceBytes: 204_684,
    sourceSha256: "add3cb00a0ee66898204aea39f95c7fb56fbf68a5ac817318a30fae3a07f78b3",
    sourceGitBlobSha1: "fb3429e7d0810650a877a1a8cbb644942ead9643",
    sourceDetailCeiling: "nasa-low-resolution-radar-shape-4092-triangles",
    lodTriangles: [4_092, 2_046, 1_022],
    materialSubstrate: "bounded-metal-rich-m-type-reference",
    materialReflectance: "oren-nayar-plus-bounded-metallic-edge-response-no-glossy-specular",
  },
]);

for (const definition of nasaSmallBodies) {
  const { body, acquisition, modelReceipt, overlay } = definition;
  const aggregateAsset = nasaGitBlobAcquisition.assets.find((asset) => asset.body === body);
  const metadataModel = nasa3dTreeMetadata.candidates?.[body]?.find((asset) => asset.path.endsWith(".stl"));
  if (
    acquisition.status !== "committed-single-request-no-retry"
    || acquisition.asset?.body !== body
    || acquisition.asset?.bytes !== definition.sourceBytes
    || acquisition.asset?.sha256 !== definition.sourceSha256
    || acquisition.asset?.gitBlobSha1 !== definition.sourceGitBlobSha1
    || acquisition.asset?.metadataReceiptSha256 !== nasa3dTreeMetadata.receiptSha256
    || acquisition.asset?.license?.id !== "NASA-public-domain"
    || acquisition.asset?.presentationOnly !== true
    || !acquisition.asset?.observationLimit?.includes("no measured photometry claim")
    || !aggregateAsset
    || aggregateAsset.assetReceiptSha256 !== acquisition.receiptSha256
    || aggregateAsset.sha256 !== acquisition.asset.sha256
    || aggregateAsset.bytes !== acquisition.asset.bytes
    || metadataModel?.gitBlobSha1 !== acquisition.asset.gitBlobSha1
    || metadataModel?.bytes !== acquisition.asset.bytes
    || modelReceipt.status !== "three-lod-nasa-shape-model-ready-for-runtime-admission"
    || modelReceipt.body !== body
    || modelReceipt.source?.acquisitionReceiptSha256 !== acquisition.receiptSha256
    || modelReceipt.source?.sha256 !== acquisition.asset.sha256
    || modelReceipt.source?.bytes !== acquisition.asset.bytes
    || modelReceipt.sourceDetailCeiling !== definition.sourceDetailCeiling
    || modelReceipt.normalized?.watertight !== true
    || modelReceipt.normalized?.eulerNumber !== 2
    || modelReceipt.normalized?.units !== "normalized-diameter-2"
    || modelReceipt.normalized?.pivot !== "bounds-midpoint"
    || modelReceipt.normalized?.rotationAxis !== "positive-y"
    || modelReceipt.lods?.length !== 3
    || modelReceipt.presentationOnly !== true
    || modelReceipt.proceduralFallback !== false
    || modelReceipt.measuredPhotometryClaim !== false
    || modelReceipt.scientificPayloadWriteback !== false
    || overlay.version !== "v591-nasa-small-body-asset-overlay-v1"
    || overlay.status !== `${body}-assets-derived-awaiting-runtime-admission`
    || overlay.body !== body
    || overlay.acquisitionReceiptSha256 !== acquisition.receiptSha256
    || overlay.modelLodReceiptSha256 !== modelReceipt.receiptSha256
    || overlay.noNetworkRequestsPerformedDuringDerivation !== true
    || overlay.noTextureBytesCopied !== true
    || overlay.derivationDeterministic !== true
    || overlay.proceduralFallback !== false
    || overlay.model?.sourceSha256 !== definition.sourceSha256
    || overlay.model?.sourceGitBlobSha1 !== definition.sourceGitBlobSha1
    || overlay.model?.sourceDetailCeiling !== definition.sourceDetailCeiling
    || overlay.model?.license?.id !== "NASA-public-domain"
    || overlay.model?.normals !== true
    || overlay.model?.watertight !== true
    || overlay.model?.lods?.length !== 3
    || overlay.microtextureReuse?.sourceOverlaySha256 !== bennuAssetOverlay.receiptSha256
    || overlay.microtextureReuse?.noTextureBytesCopied !== true
    || overlay.microtextureReuse?.assets?.length !== 3
    || overlay.materialPolicy?.substrate !== definition.materialSubstrate
    || overlay.materialPolicy?.microtexture !== `poly-haven-cc0-presentation-only-not-${body}-observation`
    || overlay.materialPolicy?.reflectance !== definition.materialReflectance
    || overlay.authorityState?.presentationOnly !== true
    || overlay.authorityState?.scientificAuthorityChanged !== false
    || overlay.authorityState?.scientificPayloadWriteback !== false
    || overlay.authorityState?.measuredPhotometryClaim !== false
    || overlay.authorityState?.measuredAuthorityGranted !== false
  ) throw new Error(`v591-${body}-evidence-chain`);

  if (body === "eros") {
    const reconstruction = modelReceipt.normalized.printableSplitReconstruction;
    if (
      !reconstruction
      || reconstruction.sourceComponentCount !== 2
      || reconstruction.outputComponentCount !== 1
      || reconstruction.outputEulerNumber !== 2
      || reconstruction.boundaryEdgeCount !== 0
      || reconstruction.nonManifoldEdgeCount !== 0
      || reconstruction.watertight !== true
      || Number(reconstruction.seamRmsSourceUnits) > 2e-6
      || Number(reconstruction.seamMaximumSourceUnits) > 4e-6
      || canonicalSha(overlay.model.printableSplitReconstruction) !== canonicalSha(reconstruction)
    ) throw new Error("v591-eros-printable-split-reconstruction");
  } else if (
    modelReceipt.normalized.printableSplitReconstruction !== null
    || overlay.model.printableSplitReconstruction !== null
    || modelReceipt.normalized.triangleCount !== 4_092
  ) throw new Error("v591-kleopatra-source-detail-ceiling");
}

const sunAssetIds = new Set(sunAssetOverlay.assets.map((asset) => asset.id));
if (!sunAssetIds.has("sun-photosphere") || !sunAssetIds.has("sun-chromosphere")) throw new Error("v591-sun-overlay-channels");
for (const asset of sunAssetOverlay.assets) {
  if (asset.body !== "sun" || asset.source.host !== "sdo.gsfc.nasa.gov" || asset.source.license.id !== "NASA-public-domain") {
    throw new Error(`v591-sun-overlay-provenance:${asset.id}`);
  }
  const source = fileRecord(asset.source.path, asset.source.sha256);
  if (source.status !== "matched" || source.bytes !== asset.source.bytes) throw new Error(`v591-sun-source-drift:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const path = publicPathFromUrl(file.url);
    if (!path) throw new Error(`v591-sun-variant-path:${asset.id}`);
    const current = fileRecord(path, file.sha256);
    if (current.status !== "matched" || current.bytes !== file.bytes) throw new Error(`v591-sun-variant-drift:${asset.id}:${path}`);
  }
}
const requiredEarthAssetIds = new Set([
  "earth-albedo", "earth-normal", "earth-roughness", "earth-clouds",
  "earth-cloud-alpha", "earth-night", "earth-night-mask",
]);
for (const asset of earthAssetOverlay.assets) {
  const baselineAsset = v590Manifest.assets.find((entry) => entry.id === asset.id);
  if (
    !requiredEarthAssetIds.delete(asset.id)
    || asset.body !== "earth"
    || asset.inheritedIdentity?.manifestSha256 !== v590Manifest.manifestSha256
    || !baselineAsset
    || canonicalSha(asset.variants) !== canonicalSha(baselineAsset.variants)
    || asset.inheritedIdentity.sourceSha256 !== baselineAsset.sourceSha256
  ) throw new Error(`v591-earth-overlay-provenance:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    if (!file) throw new Error(`v591-earth-variant-missing:${asset.id}`);
    const path = publicPathFromUrl(file.url);
    if (!path) throw new Error(`v591-earth-variant-path:${asset.id}`);
    const current = fileRecord(path, file.sha256);
    if (current.status !== "matched" || current.bytes !== file.bytes) throw new Error(`v591-earth-variant-drift:${asset.id}:${path}`);
  }
}
if (requiredEarthAssetIds.size > 0) throw new Error(`v591-earth-overlay-channels:${[...requiredEarthAssetIds].join(",")}`);
const requiredMoonAssetIds = new Set(["moon-albedo", "moon-normal", "moon-roughness", "moon-height"]);
for (const asset of moonAssetOverlay.assets) {
  const sourceIdentity = moonAcquisition.assets.find((entry) => entry.outputPath === asset.source.path);
  if (
    !requiredMoonAssetIds.delete(asset.id)
    || asset.body !== "moon"
    || asset.presentationOnly !== true
    || asset.source.host !== "svs.gsfc.nasa.gov"
    || asset.source.license?.id !== "NASA-public-domain"
    || !sourceIdentity
    || sourceIdentity.sha256 !== asset.source.sha256
    || sourceIdentity.bytes !== asset.source.bytes
    || asset.derivation?.seamMeanAbsoluteDelta !== 0
  ) throw new Error(`v591-moon-overlay-provenance:${asset.id}`);
  const source = fileRecord(asset.source.path, asset.source.sha256);
  if (source.status !== "matched" || source.bytes !== asset.source.bytes) throw new Error(`v591-moon-source-drift:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const path = publicPathFromUrl(file.url);
    if (!path?.startsWith("public/textures/candidate-v591/moon/")) throw new Error(`v591-moon-variant-path:${asset.id}`);
    const current = fileRecord(path, file.sha256);
    if (current.status !== "matched" || current.bytes !== file.bytes) throw new Error(`v591-moon-variant-drift:${asset.id}:${path}`);
  }
}
if (requiredMoonAssetIds.size > 0) throw new Error(`v591-moon-overlay-channels:${[...requiredMoonAssetIds].join(",")}`);
const requiredMercuryAssetIds = new Set(["mercury-albedo", "mercury-normal", "mercury-roughness", "mercury-height"]);
for (const asset of mercuryAssetOverlay.assets) {
  const isAlbedo = asset.id === "mercury-albedo";
  if (
    !requiredMercuryAssetIds.delete(asset.id)
    || asset.body !== "mercury"
    || asset.source.license?.id !== (isAlbedo ? "NASA-public-domain" : "USGS-public-domain")
    || asset.source.sha256 !== (isAlbedo ? mercuryAcquisition.albedoReference.actualSha256 : mercuryAcquisition.assets[0].sha256)
    || asset.source.bytes !== (isAlbedo ? mercuryAcquisition.albedoReference.actualBytes : mercuryAcquisition.assets[0].bytes)
    || asset.derivation?.seamMeanAbsoluteDelta !== 0
    || asset.presentationOnly !== true
  ) throw new Error(`v591-mercury-overlay-provenance:${asset.id}`);
  const source = fileRecord(asset.source.path, asset.source.sha256);
  if (source.status !== "matched" || source.bytes !== asset.source.bytes) throw new Error(`v591-mercury-source-drift:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const path = publicPathFromUrl(file.url);
    if (!path) throw new Error(`v591-mercury-variant-path:${asset.id}`);
    const current = fileRecord(path, file.sha256);
    if (current.status !== "matched" || current.bytes !== file.bytes) throw new Error(`v591-mercury-variant-drift:${asset.id}:${path}`);
  }
}
if (requiredMercuryAssetIds.size > 0) throw new Error(`v591-mercury-overlay-channels:${[...requiredMercuryAssetIds].join(",")}`);
const requiredMarsAssetIds = new Set(["mars-albedo", "mars-normal", "mars-roughness", "mars-height"]);
for (const asset of marsAssetOverlay.assets) {
  const sourceIdentity = marsAcquisition.assets.find((entry) => entry.outputPath === asset.source.path);
  const albedo = asset.id === "mars-albedo";
  if (
    !requiredMarsAssetIds.delete(asset.id)
    || asset.body !== "mars"
    || asset.presentationOnly !== true
    || asset.source.host !== (albedo ? "astrogeology.usgs.gov" : "pds-geosciences.wustl.edu")
    || asset.source.license?.id !== (albedo ? "NASA-USGS-public-domain" : "NASA-PDS-public-domain")
    || !sourceIdentity
    || sourceIdentity.sha256 !== asset.source.sha256
    || sourceIdentity.bytes !== asset.source.bytes
    || (albedo && (
      asset.source.width !== 1024
      || asset.source.height !== 512
      || asset.resampleAuditReceiptSha256 !== marsAlbedoResampleAudit.receiptSha256
      || asset.derivation?.parameters?.sourceDetailCeiling !== "1024x512"
      || asset.derivation?.parameters?.highFrequencySourceAdded !== false
      || !asset.observationDisclosure?.includes("not native 8K observation detail")
    ))
    || (!albedo && (
      asset.source.width !== 5760
      || asset.source.height !== 2880
      || asset.derivation?.sourceRangeMeters?.minimum !== -8177
      || asset.derivation?.sourceRangeMeters?.maximum !== 21171
      || asset.derivation?.marsRadiusMeters !== 3_396_000
      || asset.derivation?.normalReliefGain !== 1.6
    ))
  ) throw new Error(`v591-mars-overlay-provenance:${asset.id}`);
  const source = fileRecord(asset.source.path, asset.source.sha256);
  if (source.status !== "matched" || source.bytes !== asset.source.bytes) throw new Error(`v591-mars-source-drift:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const path = publicPathFromUrl(file.url);
    if (!path?.startsWith("public/textures/candidate-v591/mars/")) throw new Error(`v591-mars-variant-path:${asset.id}`);
    const current = fileRecord(path, file.sha256);
    if (current.status !== "matched" || current.bytes !== file.bytes) throw new Error(`v591-mars-variant-drift:${asset.id}:${path}`);
  }
}
if (requiredMarsAssetIds.size > 0) throw new Error(`v591-mars-overlay-channels:${[...requiredMarsAssetIds].join(",")}`);
const requiredJupiterAssetIds = new Set(["jupiter-albedo", "jupiter-band-mask", "jupiter-storm-mask"]);
for (const asset of jupiterAssetOverlay.assets) {
  if (
    !requiredJupiterAssetIds.delete(asset.id)
    || asset.body !== "jupiter"
    || asset.presentationOnly !== true
    || asset.source.host !== "assets.science.nasa.gov"
    || asset.source.license?.id !== "NASA-JPL-public-domain"
    || asset.source.acquisitionReceiptSha256 !== jupiterAcquisition.receiptSha256
    || asset.source.path !== jupiterAcquisition.asset.outputPath
    || asset.source.sha256 !== jupiterAcquisition.asset.sha256
    || asset.source.bytes !== jupiterAcquisition.asset.bytes
    || asset.source.width !== 3601
    || asset.source.height !== 1801
    || asset.derivation?.sourceDetailCeiling !== "3601x1801"
  ) throw new Error(`v591-jupiter-overlay-provenance:${asset.id}`);
  const source = fileRecord(asset.source.path, asset.source.sha256);
  if (source.status !== "matched" || source.bytes !== asset.source.bytes) throw new Error(`v591-jupiter-source-drift:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const path = publicPathFromUrl(file.url);
    if (!path?.startsWith("public/textures/candidate-v591/jupiter/")) throw new Error(`v591-jupiter-variant-path:${asset.id}`);
    const current = fileRecord(path, file.sha256);
    if (current.status !== "matched" || current.bytes !== file.bytes) throw new Error(`v591-jupiter-variant-drift:${asset.id}:${path}`);
  }
}
if (requiredJupiterAssetIds.size > 0) throw new Error(`v591-jupiter-overlay-channels:${[...requiredJupiterAssetIds].join(",")}`);
const requiredSaturnAssetIds = new Set(["saturn-atmosphere-albedo", "saturn-band-mask", "saturn-polar-detail", "saturn-ring-color", "saturn-ring-optical-depth"]);
for (const asset of saturnAssetOverlay.assets) {
  const sourceIdentity = [...saturnAcquisition.assets, saturnAtmosphereSupplement.asset].find((entry) => entry.outputPath === asset.source.path);
  if (
    !requiredSaturnAssetIds.delete(asset.id)
    || asset.body !== "saturn"
    || asset.presentationOnly !== true
    || asset.source.host !== "images-assets.nasa.gov"
    || asset.source.license?.id !== "NASA-JPL-public-domain"
    || !sourceIdentity
    || sourceIdentity.sha256 !== asset.source.sha256
    || sourceIdentity.bytes !== asset.source.bytes
    || !asset.source.acquisitionReceiptSha256
  ) throw new Error(`v591-saturn-overlay-provenance:${asset.id}`);
  const source = fileRecord(asset.source.path, asset.source.sha256);
  if (source.status !== "matched" || source.bytes !== asset.source.bytes) throw new Error(`v591-saturn-source-drift:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const path = publicPathFromUrl(file.url);
    if (!path?.startsWith("public/textures/candidate-v591/saturn/")) throw new Error(`v591-saturn-variant-path:${asset.id}`);
    const current = fileRecord(path, file.sha256);
    if (current.status !== "matched" || current.bytes !== file.bytes) throw new Error(`v591-saturn-variant-drift:${asset.id}:${path}`);
  }
}
if (requiredSaturnAssetIds.size > 0) throw new Error(`v591-saturn-overlay-channels:${[...requiredSaturnAssetIds].join(",")}`);

const requiredBennuAssetIds = new Set(["bennu-regolith-albedo", "bennu-regolith-normal", "bennu-regolith-roughness"]);
for (const asset of bennuAssetOverlay.assets) {
  const sourceIdentity = bennuAcquisition.assets.find((entry) => entry.outputPath === asset.source.path);
  if (
    !requiredBennuAssetIds.delete(asset.id)
    || asset.body !== "bennu"
    || asset.presentationOnly !== true
    || asset.source.host !== "dl.polyhaven.org"
    || asset.source.license?.id !== "Poly-Haven-CC0"
    || !sourceIdentity
    || sourceIdentity.sha256 !== asset.source.sha256
    || sourceIdentity.bytes !== asset.source.bytes
    || sourceIdentity.width !== 4096
    || sourceIdentity.height !== 4096
    || !asset.source.observationLimit?.includes("not Bennu")
  ) throw new Error(`v591-bennu-overlay-provenance:${asset.id}`);
  const source = fileRecord(asset.source.path, asset.source.sha256);
  if (source.status !== "matched" || source.bytes !== asset.source.bytes) throw new Error(`v591-bennu-source-drift:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const path = publicPathFromUrl(file.url);
    if (!path?.startsWith("public/textures/candidate-v591/bennu/")) throw new Error(`v591-bennu-variant-path:${asset.id}`);
    const current = fileRecord(path, file.sha256);
    if (current.status !== "matched" || current.bytes !== file.bytes) throw new Error(`v591-bennu-variant-drift:${asset.id}:${path}`);
  }
}
if (requiredBennuAssetIds.size > 0) throw new Error(`v591-bennu-overlay-channels:${[...requiredBennuAssetIds].join(",")}`);
for (const [index, lod] of bennuAssetOverlay.inheritedModel.lods.entries()) {
  const receiptLod = bennuLodReceipt.lods[index];
  const current = fileRecord(lod.path, lod.sha256);
  if (
    lod.lod !== index
    || lod.sha256 !== receiptLod?.sha256
    || lod.bytes !== receiptLod?.bytes
    || lod.normals !== true
    || lod.meshopt !== true
    || lod.pivot !== "bounds-midpoint"
    || current.status !== "matched"
    || current.bytes !== lod.bytes
  ) throw new Error(`v591-bennu-model-lod-drift:${index}`);
}
for (const [index, lod] of vestaAssetOverlay.model.lods.entries()) {
  const receiptLod = vestaModelLodReceipt.lods[index];
  const current = fileRecord(lod.path, lod.sha256);
  if (
    lod.lod !== index
    || lod.path !== `public/models/candidate-v591/vesta/vesta-lod${index}.glb`
    || lod.sha256 !== receiptLod?.sha256
    || lod.bytes !== receiptLod?.bytes
    || lod.triangleCount !== receiptLod?.triangleCount
    || lod.vertexCount !== receiptLod?.vertexCount
    || lod.normals !== true
    || lod.meshopt !== true
    || lod.pivot !== "bounds-midpoint"
    || lod.units !== "normalized-diameter-2"
    || lod.rotationAxis !== "positive-y"
    || current.status !== "matched"
    || current.bytes !== lod.bytes
  ) throw new Error(`v591-vesta-model-lod-drift:${index}`);
}
for (const [index, reused] of vestaAssetOverlay.microtextureReuse.assets.entries()) {
  const inherited = bennuAssetOverlay.assets[index];
  if (
    reused.id !== inherited?.id.replace("bennu-", "vesta-")
    || reused.inheritedAssetId !== inherited?.id
    || reused.body !== "vesta"
    || reused.exactByteReuse !== true
    || reused.presentationOnly !== true
    || reused.sourceSha256 !== inherited?.source.sha256
    || canonicalSha(reused.variants) !== canonicalSha(inherited?.variants)
  ) throw new Error(`v591-vesta-microtexture-reuse:${index}`);
}
for (const definition of nasaSmallBodies) {
  const { body, acquisition, modelReceipt, overlay } = definition;
  const source = fileRecord(acquisition.asset.outputPath, acquisition.asset.sha256);
  if (source.status !== "matched" || source.bytes !== acquisition.asset.bytes) {
    throw new Error(`v591-${body}-model-source-drift`);
  }
  for (const [index, lod] of overlay.model.lods.entries()) {
    const receiptLod = modelReceipt.lods[index];
    const current = fileRecord(lod.path, lod.sha256);
    if (
      lod.lod !== index
      || lod.path !== `public/models/candidate-v591/${body}/${body}-lod${index}.glb`
      || lod.sha256 !== receiptLod?.sha256
      || lod.bytes !== receiptLod?.bytes
      || lod.triangleCount !== receiptLod?.triangleCount
      || lod.triangleCount !== definition.lodTriangles[index]
      || lod.vertexCount !== receiptLod?.vertexCount
      || lod.normals !== true
      || lod.meshopt !== true
      || lod.pivot !== "bounds-midpoint"
      || lod.units !== "normalized-diameter-2"
      || lod.rotationAxis !== "positive-y"
      || current.status !== "matched"
      || current.bytes !== lod.bytes
    ) throw new Error(`v591-${body}-model-lod-drift:${index}`);
  }
  for (const [index, reused] of overlay.microtextureReuse.assets.entries()) {
    const inherited = bennuAssetOverlay.assets[index];
    if (
      reused.id !== inherited?.id.replace("bennu-", `${body}-`)
      || reused.inheritedAssetId !== inherited?.id
      || reused.body !== body
      || reused.exactByteReuse !== true
      || reused.presentationOnly !== true
      || reused.sourceSha256 !== inherited?.source.sha256
      || !reused.observationLimit?.includes(`not ${body} observation data`)
      || canonicalSha(reused.variants) !== canonicalSha(inherited?.variants)
    ) throw new Error(`v591-${body}-microtexture-reuse:${index}`);
  }
}

if (
  tempel1Acquisition.status !== "committed-single-request-no-retry"
  || tempel1Acquisition.target !== "tempel-1"
  || tempel1Acquisition.requestCount !== 1
  || tempel1Acquisition.automaticRetryPerformed !== false
  || tempel1Acquisition.automaticReplacementPerformed !== false
  || tempel1Acquisition.asset?.datasetId !== "DIF-C-HRIV/ITS/MRI-5-TEMPEL1-SHAPE-V2.0"
  || tempel1Acquisition.asset?.license?.id !== "NASA-PDS-SBN-public-data"
  || tempel1ModelLodReceipt.status !== "tempel-1-three-lod-model-ready-for-runtime-admission"
  || tempel1ModelLodReceipt.acquisitionReceiptSha256 !== tempel1Acquisition.receiptSha256
  || tempel1ModelLodReceipt.normalized?.watertight !== true
  || tempel1ModelLodReceipt.normalized?.rotationAxis !== "positive-y"
  || tempel1ModelLodReceipt.lods?.length !== 3
  || tempel1ModelLodReceipt.lods.map((lod) => lod.triangleCount).join(",") !== "32040,8010,2002"
  || tempel1AssetOverlay.version !== "v591-tempel-1-asset-overlay-v1"
  || !["tempel-1-assets-derived-awaiting-runtime-admission", "tempel-1-runtime-admitted"].includes(tempel1AssetOverlay.status)
  || tempel1AssetOverlay.acquisitionReceiptSha256 !== tempel1Acquisition.receiptSha256
  || tempel1AssetOverlay.modelLodReceiptSha256 !== tempel1ModelLodReceipt.receiptSha256
  || tempel1AssetOverlay.noNetworkRequestsPerformedDuringDerivation !== true
  || tempel1AssetOverlay.noTextureBytesCopiedForCc0Reuse !== true
  || tempel1AssetOverlay.derivationDeterministic !== true
  || tempel1AssetOverlay.proceduralFallback !== false
  || tempel1AssetOverlay.observationMapping?.projection !== "simple-cylindrical"
  || tempel1AssetOverlay.observationMapping?.observedPixelFraction !== 0.8043214699074074
  || tempel1AssetOverlay.observationMapping?.unobservedPixelsAreMeasuredDarkTerrain !== false
  || tempel1AssetOverlay.assets?.length !== 2
  || tempel1AssetOverlay.microtextureReuse?.sourceOverlaySha256 !== bennuAssetOverlay.receiptSha256
  || tempel1AssetOverlay.microtextureReuse?.noTextureBytesCopied !== true
  || tempel1AssetOverlay.microtextureReuse?.assets?.length !== 3
  || tempel1AssetOverlay.materialPolicy?.tails !== "fixed-seed-presentation-only-dust-anti-solar-ion-velocity"
  || tempel1AssetOverlay.authorityState?.scientificPayloadWriteback !== false
  || tempel1AssetOverlay.authorityState?.measuredPhotometryClaim !== false
  || tempel1AssetBuildReceipt.status !== "assets-derived-awaiting-runtime-and-browser-admission"
  || tempel1AssetBuildReceipt.overlayReceiptSha256 !== tempel1AssetOverlay.receiptSha256
  || tempel1AssetBuildReceipt.modelLodReceiptSha256 !== tempel1ModelLodReceipt.receiptSha256
) throw new Error("v591-tempel1-overlay-chain");
for (const lod of tempel1AssetOverlay.model.lods) {
  const current = fileRecord(lod.path, lod.sha256);
  if (current.status !== "matched" || current.bytes !== lod.bytes) throw new Error(`v591-tempel1-model-drift:${lod.lod}`);
}
for (const asset of tempel1AssetOverlay.assets) {
  if (asset.body !== "tempel-1" || asset.presentationOnly !== true || asset.source?.license?.id !== "NASA-PDS-SBN-public-data") {
    throw new Error(`v591-tempel1-asset:${asset.id}`);
  }
  for (const file of Object.values(asset.variants)) {
    const path = publicPathFromUrl(file.url);
    const current = fileRecord(path, file.sha256);
    if (current.status !== "matched" || current.bytes !== file.bytes) throw new Error(`v591-tempel1-derived-drift:${asset.id}:${path}`);
  }
}
for (const [index, reused] of tempel1AssetOverlay.microtextureReuse.assets.entries()) {
  const inherited = bennuAssetOverlay.assets[index];
  if (
    reused.id !== inherited?.id.replace("bennu-", "tempel-1-")
    || reused.inheritedAssetId !== inherited?.id
    || reused.body !== "tempel-1"
    || reused.sourceOverlaySha256 !== bennuAssetOverlay.receiptSha256
    || reused.sourceSha256 !== inherited?.source.sha256
    || reused.exactByteReuse !== true
    || reused.presentationOnly !== true
    || canonicalSha(reused.variants) !== canonicalSha(inherited?.variants)
  ) throw new Error(`v591-tempel1-microtexture-reuse:${index}`);
}

if (
  ceresMetadata.status !== "required-shape-map-products-present-no-payload"
  || ceresMetadata.requestCount !== 1
  || ceresMetadata.automaticRetryPerformed !== false
  || ceresMetadata.automaticReplacementPerformed !== false
  || ceresMetadata.payloadDownloaded !== false
  || ceresAcquisition.status !== "four-assets-committed-single-request-each-no-retry"
  || ceresAcquisition.metadataReceiptSha256 !== ceresMetadata.receiptSha256
  || ceresAcquisition.requestCount !== 4
  || ceresAcquisition.automaticRetryPerformed !== false
  || ceresAcquisition.automaticReplacementPerformed !== false
  || ceresAcquisition.modelPolicy !== "derive-runtime-mesh-from-global-radius-geotiff;do-not-retry-blocked-plt-url"
  || ceresAcquisition.shapeBlockedReceiptSha256 !== ceresShapeBlocked.receiptSha256
  || ceresAcquisition.centralMirrorBlockedReceiptSha256 !== ceresCentralMirrorBlocked.receiptSha256
  || ceresShapeBlocked.status !== "blocked-no-automatic-retry"
  || ceresCentralMirrorBlocked.status !== "blocked-no-automatic-retry"
  || ceresModelLodReceipt.status !== "ceres-three-lod-radius-derived-model-ready-for-runtime-admission"
  || ceresModelLodReceipt.metadataReceiptSha256 !== ceresMetadata.receiptSha256
  || ceresModelLodReceipt.acquisitionReceiptSha256 !== ceresAcquisition.receiptSha256
  || ceresModelLodReceipt.normalized?.watertight !== true
  || ceresModelLodReceipt.normalized?.eulerNumber !== 2
  || ceresModelLodReceipt.normalized?.syntheticDetailAdded !== false
  || ceresModelLodReceipt.normalized?.units !== "mean-radius-1"
  || ceresModelLodReceipt.normalized?.pivot !== "body-center-origin"
  || ceresModelLodReceipt.normalized?.rotationAxis !== "positive-y"
  || ceresModelLodReceipt.lods?.length !== 3
  || ceresModelLodReceipt.lods.map((lod) => lod.triangleCount).join(",") !== "104448,24806,4960"
  || ceresAssetOverlay.version !== "v591-ceres-asset-overlay-v1"
  || !["ceres-assets-derived-awaiting-runtime-admission", "ceres-runtime-admitted"].includes(ceresAssetOverlay.status)
  || ceresAssetOverlay.body !== "ceres"
  || ceresAssetOverlay.metadataReceiptSha256 !== ceresMetadata.receiptSha256
  || ceresAssetOverlay.acquisitionReceiptSha256 !== ceresAcquisition.receiptSha256
  || ceresAssetOverlay.modelLodReceiptSha256 !== ceresModelLodReceipt.receiptSha256
  || ceresAssetOverlay.shapeBlockedReceiptSha256 !== ceresShapeBlocked.receiptSha256
  || ceresAssetOverlay.centralMirrorBlockedReceiptSha256 !== ceresCentralMirrorBlocked.receiptSha256
  || ceresAssetOverlay.noNetworkRequestsPerformedDuringDerivation !== true
  || ceresAssetOverlay.noTextureBytesCopiedForCc0Reuse !== true
  || ceresAssetOverlay.derivationDeterministic !== true
  || ceresAssetOverlay.proceduralFallback !== false
  || ceresAssetOverlay.model?.sourceDetailCeiling !== "pds-dawn-spc-radius-2222x1111-261120-triangles"
  || ceresAssetOverlay.model?.license?.id !== "NASA-PDS-public-data"
  || ceresAssetOverlay.model?.normals !== true
  || ceresAssetOverlay.model?.watertight !== true
  || ceresAssetOverlay.model?.lods?.length !== 3
  || ceresAssetOverlay.assets?.length !== 4
  || ceresAssetOverlay.assets.map((asset) => asset.id).join(",") !== "ceres-albedo,ceres-normal,ceres-roughness,ceres-height"
  || ceresAssetOverlay.microtextureReuse?.sourceOverlaySha256 !== bennuAssetOverlay.receiptSha256
  || ceresAssetOverlay.microtextureReuse?.noTextureBytesCopied !== true
  || ceresAssetOverlay.microtextureReuse?.assets?.length !== 3
  || ceresAssetOverlay.materialPolicy?.macroSurface !== "pds-dawn-spc-relative-albedo-and-global-radius"
  || ceresAssetOverlay.materialPolicy?.microSurface !== "poly-haven-cc0-regolith-presentation-only-not-ceres-observation"
  || ceresAssetOverlay.materialPolicy?.reflectance !== "rough-oren-nayar-plus-bounded-opposition-no-glossy-specular"
  || ceresAssetOverlay.materialPolicy?.opticalColorClaim !== false
  || ceresAssetOverlay.materialPolicy?.syntheticDetailAdded !== false
  || ceresAssetOverlay.authorityState?.scientificPayloadWriteback !== false
  || ceresAssetOverlay.authorityState?.measuredPhotometryClaim !== false
  || ceresAssetOverlay.authorityState?.measuredAuthorityGranted !== false
  || ceresAssetOverlay.blockers?.length !== 0
  || ceresAssetBuildReceipt.status !== "assets-derived-awaiting-runtime-and-browser-admission"
  || ceresAssetBuildReceipt.metadataReceiptSha256 !== ceresMetadata.receiptSha256
  || ceresAssetBuildReceipt.acquisitionReceiptSha256 !== ceresAcquisition.receiptSha256
  || ceresAssetBuildReceipt.modelLodReceiptSha256 !== ceresModelLodReceipt.receiptSha256
  || ceresAssetBuildReceipt.derivationReceiptSha256 !== ceresTextureDerivationReceipt.receiptSha256
  || ceresAssetBuildReceipt.overlayReceiptSha256 !== ceresAssetOverlay.receiptSha256
  || ceresTextureDerivationReceipt.derivation?.syntheticDetailAdded !== false
  || ceresTextureDerivationReceipt.authorityState?.scientificPayloadWriteback !== false
) throw new Error("v591-ceres-overlay-chain");
for (const acquired of ceresAcquisition.assets) {
  const current = fileRecord(acquired.outputPath, acquired.sha256);
  if (current.status !== "matched" || current.bytes !== acquired.bytes) throw new Error(`v591-ceres-source-drift:${acquired.id}`);
}
for (const lod of ceresAssetOverlay.model.lods) {
  const current = fileRecord(lod.path, lod.sha256);
  if (current.status !== "matched" || current.bytes !== lod.bytes) throw new Error(`v591-ceres-model-drift:${lod.lod}`);
}
for (const asset of ceresAssetOverlay.assets) {
  const source = ceresAcquisition.assets.find((entry) => entry.outputPath === asset.source?.path);
  if (
    asset.body !== "ceres"
    || asset.presentationOnly !== true
    || asset.source?.license?.id !== "NASA-PDS-public-data"
    || !source
    || source.sha256 !== asset.source.sha256
    || source.bytes !== asset.source.bytes
    || asset.derivation?.receiptSha256 !== ceresTextureDerivationReceipt.receiptSha256
    || asset.derivation?.sourceDetailCeiling !== "2222x1111"
    || asset.derivation?.deliveryUpscaleAddsObservationDetail !== false
    || asset.derivation?.syntheticDetailAdded !== false
  ) throw new Error(`v591-ceres-asset:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const path = publicPathFromUrl(file.url);
    const current = fileRecord(path, file.sha256);
    if (current.status !== "matched" || current.bytes !== file.bytes) throw new Error(`v591-ceres-derived-drift:${asset.id}:${path}`);
  }
}
for (const [index, reused] of ceresAssetOverlay.microtextureReuse.assets.entries()) {
  const inherited = bennuAssetOverlay.assets[index];
  if (
    reused.id !== inherited?.id.replace("bennu-", "ceres-")
    || reused.inheritedAssetId !== inherited?.id
    || reused.body !== "ceres"
    || reused.sourceOverlaySha256 !== bennuAssetOverlay.receiptSha256
    || reused.sourceSha256 !== inherited?.source.sha256
    || reused.exactByteReuse !== true
    || reused.presentationOnly !== true
    || !reused.observationLimit?.includes("not Ceres observation data")
    || canonicalSha(reused.variants) !== canonicalSha(inherited?.variants)
  ) throw new Error(`v591-ceres-microtexture-reuse:${index}`);
}

for (const file of v590SourceManifest.files) {
  const current = fileRecord(file.path, file.sha256);
  if (current.status !== "matched") throw new Error(`v591-v590-source-drift:${file.path}`);
}

const frozenExpected = new Map();
function addFrozen(path, expectedSha256) {
  if (!path || (expectedSha256 !== null && !/^[a-f0-9]{64}$/.test(expectedSha256))) throw new Error(`v591-frozen-row:${path}`);
  if (frozenExpected.has(path) && frozenExpected.get(path) !== expectedSha256) throw new Error(`v591-frozen-conflict:${path}`);
  frozenExpected.set(path, expectedSha256);
}
for (const row of [...v590FreezeAfter.inheritedFrozenSnapshot, ...v590FreezeAfter.explicitFrozenSnapshot]) addFrozen(row.path, row.sha256);
for (const row of v590SourceManifest.files) addFrozen(row.path, row.sha256);
for (const dependency of v590Manifest.inheritedDependencies) addFrozen(dependency.path, dependency.sha256);
for (const asset of v590Manifest.assets) {
  for (const file of Object.values(asset.variants)) {
    if (!file) continue;
    const path = publicPathFromUrl(file.url);
    if (path) addFrozen(path, file.sha256);
  }
}
for (const path of [
  "docs/release/v590/current-state-receipt-v590.json",
  "docs/release/v590/freeze-before-v590.json",
  "docs/release/v590/source-manifest-v590.json",
  "docs/release/v590/verification-receipt-v590.json",
  "docs/release/v590/freeze-after-v590.json",
  "docs/release/v590/capability-report-v590.json",
  "public/data/celestial-rendering-v590/manifest.json",
  "dist/release/orbit-atlas-current-celestial-rendering-candidate-v590.json",
  "dist/release/atlas-v590-standalone-build-resource.json",
  "dist/release/atlas-v590-lite-build-resource.json",
]) {
  if (!existsSync(resolve(root, path))) throw new Error(`v591-v590-sealed-file-missing:${path}`);
  addFrozen(path, sha256(readFileSync(resolve(root, path))));
}

const frozenSnapshot = [...frozenExpected.entries()]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([path, expectedSha256]) => fileRecord(path, expectedSha256));
const frozenDrift = frozenSnapshot.filter((entry) => !["matched", "matched-missing"].includes(entry.status));
const freezeBefore = writeSealed(resolve(docsRoot, "freeze-before-v591.json"), {
  version: "v591-frozen-boundary-before-v1",
  generatedAt,
  status: frozenDrift.length === 0 ? "passed" : "blocked-frozen-drift",
  formalProductPointer: "v263",
  defaultKernel: "legacy-eih-1pn",
  baselineCandidate: "v590-readonly",
  baselineManifestSha256: v590Manifest.manifestSha256,
  baselineFreezeBeforeSha256: v590FreezeBefore.snapshotSha256,
  baselineFreezeAfterSha256: v590FreezeAfter.snapshotSha256,
  historicalEvidenceRewritten: false,
  scientificAuthorityChanged: false,
  frozenSnapshot,
  drift: frozenDrift,
}, "snapshotSha256");

const admittedOverrideBodies = new Set(["sun", "earth", "mercury", "venus", "moon", "mars", "jupiter", "saturn", "vesta", "bennu", "eros", "kleopatra", "tempel-1", "ceres", "uranus", "neptune"]);
const starfieldOverrideStatus = "implemented-v591-gaia-deterministic-psf";
const heroBodies = Object.fromEntries(Object.entries(v590Manifest.heroBodies).map(([body, status]) => {
  const overrideStatus = admittedOverrideBodies.has(body) ? "admitted" : "not-authored";
  return [body, {
    baselineStatus: status,
    v591OverrideStatus: overrideStatus,
    effectiveStatus: overrideStatus === "admitted" ? "admitted" : status,
  }];
}));
const nebulae = v590Manifest.deepSpaceLayers
  .filter((layer) => layer.kind === "catalog-nebula")
  .map((layer) => ({
    id: layer.id,
    rightAscensionDeg: layer.rightAscensionDeg,
    declinationDeg: layer.declinationDeg,
    angularSizeDeg: layer.angularSizeDeg,
    baselineAdmission: layer.admission,
    v591Admission: nebulaAssetOverlay.assets.some((asset) => asset.id === layer.id) ? "admitted-presentation-only" : "asset-blocked",
    sourceAssetId: nebulaAssetOverlay.assets.find((asset) => asset.id === layer.id)?.nasaId ?? null,
  }));
const manifestUnsigned = {
  version: "v591-celestial-convergence-candidate-v1",
  generatedAt,
  status: "p2-sixteen-heroes-runtime-admission-browser-gates-pending",
  authorityNamespace: "candidate-v591-celestial-convergence",
  route: "/local-shadow-v591",
  baseline: {
    candidate: "v590-readonly",
    manifestPath: "public/data/celestial-rendering-v590/manifest.json",
    manifestSha256: v590Manifest.manifestSha256,
    sourceManifestSha256: v590SourceManifest.receiptSha256,
    freezeAfterSha256: v590FreezeAfter.snapshotSha256,
    capabilityReportSha256: v590Capability.reportSha256,
  },
  boundaries: {
    formalProductPointer: "v263",
    frozenCandidatesRewritten: false,
    historicalEvidenceRewritten: false,
    scientificPayloadWriteback: false,
    scientificPayloadSha256,
    scientificAuthorityChanged: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    singleCanvasRequired: true,
    productionPromotionAllowed: false,
    gitMutationAllowed: false,
  },
  priorities: {
    p0: "governance",
    p1: ["sun", "earth", "moon", "mars", "jupiter", "saturn"],
    p2: ["mercury", "venus", "uranus", "neptune", "ceres", "vesta", "bennu", "eros", "kleopatra", "tempel-1"],
    p3: "gaia-star-optics",
    p4: "milky-way-and-nebulae",
    p5: "constellations",
    p6: "instrument-ui",
  },
  heroBodies,
  heroAssetOverlays: [
    {
      body: "sun",
      status: "admitted",
      acquisitionReceiptSha256: sunAcquisition.receiptSha256,
      overlayPath: "public/data/celestial-convergence-v591/sun-asset-overlay.json",
      overlaySha256: sunAssetOverlay.receiptSha256,
      assetIds: [...sunAssetIds].sort(),
      mirroredHemisphereDisclosure: true,
      presentationOnly: true,
    },
    {
      body: "earth",
      status: "admitted-inherited-exact-bytes",
      inheritedManifestSha256: v590Manifest.manifestSha256,
      overlayPath: "public/data/celestial-convergence-v591/earth-asset-overlay.json",
      overlaySha256: earthAssetOverlay.receiptSha256,
      assetIds: earthAssetOverlay.assets.map((asset) => asset.id),
      noAssetBytesCopied: true,
      presentationOnly: true,
    },
    {
      body: "mercury",
      status: "admitted",
      acquisitionReceiptSha256: mercuryAcquisition.receiptSha256,
      metadataReceiptSha256: mercuryMetadata.receiptSha256,
      inheritedV589ManifestSha256: v589Manifest.manifestSha256,
      overlayPath: "public/data/celestial-convergence-v591/mercury-asset-overlay.json",
      overlaySha256: mercuryAssetOverlay.receiptSha256,
      assetIds: mercuryAssetOverlay.assets.map((asset) => asset.id),
      source: "NASA-PIA15063-albedo+USGS-MESSENGER-DEM-665m",
      albedoDetailCeiling: "6132x3066",
      topographicDetail: "MESSENGER-USGS-23040x11520",
      exactByteV589AlbedoSourceReuse: true,
      finiteRelief: true,
      proceduralFallback: false,
      presentationOnly: true,
    },
    {
      body: "venus",
      status: "admitted-multiview-assets-runtime-browser-pending",
      acquisitionReceiptSha256: venusAssetOverlay.acquisitionReceiptSha256,
      sourceReceiptSha256s: venusMultiviewAcquisitions.map((receipt) => receipt.receiptSha256),
      metadataReceiptSha256: venusAssetOverlay.metadataReceiptSha256,
      usgsAliasBlockedReceiptSha256: venusAliasBlocked.receiptSha256,
      overlayPath: "public/data/celestial-convergence-v591/venus-asset-overlay.json",
      overlaySha256: venusAssetOverlay.receiptSha256,
      assetIds: venusAssetOverlay.assets.map((asset) => asset.id),
      source: "NASA-JPL-Magellan-clean-global-views-0E-90E-270E-derived-equirectangular",
      sourcePolicy: "three-observed-global-views-grid-contaminated-180E-excluded",
      cloudModel: "deterministic-physical-inspired-primary-not-observation-texture",
      measuredTopographyClaim: false,
      opticalColorClaim: false,
      proceduralFallback: false,
      presentationOnly: true,
    },
    {
      body: "moon",
      status: "admitted",
      acquisitionReceiptSha256: moonAcquisition.receiptSha256,
      overlayPath: "public/data/celestial-convergence-v591/moon-asset-overlay.json",
      overlaySha256: moonAssetOverlay.receiptSha256,
      assetIds: moonAssetOverlay.assets.map((asset) => asset.id),
      source: "NASA-SVS-LRO-LROC-LOLA",
      finiteRelief: true,
      proceduralFallback: false,
      presentationOnly: true,
    },
    {
      body: "mars",
      status: "admitted",
      acquisitionReceiptSha256: marsAcquisition.receiptSha256,
      overlayPath: "public/data/celestial-convergence-v591/mars-asset-overlay.json",
      overlaySha256: marsAssetOverlay.receiptSha256,
      assetIds: marsAssetOverlay.assets.map((asset) => asset.id),
      albedoIdentityAuditReceiptSha256: marsIdentityAudit.receiptSha256,
      fullAlbedoBlockedReceiptSha256: marsFullSourceBlock.receiptSha256,
      albedoResampleAuditReceiptSha256: marsAlbedoResampleAudit.receiptSha256,
      compositeRejectionReceiptSha256: marsCompositeRejection.receiptSha256,
      source: "USGS-Viking-1024-color-ceiling+NASA-PDS-MOLA-terrain",
      albedoDetailCeiling: "1024x512",
      desktopDeliveryContainer: "8192x4096",
      topographicDetail: "MOLA-5760x2880",
      blockers: marsAssetOverlay.blockers,
      proceduralFallback: false,
      presentationOnly: true,
    },
    {
      body: "jupiter",
      status: "admitted",
      acquisitionReceiptSha256: jupiterAcquisition.receiptSha256,
      overlayPath: "public/data/celestial-convergence-v591/jupiter-asset-overlay.json",
      overlaySha256: jupiterAssetOverlay.receiptSha256,
      assetIds: jupiterAssetOverlay.assets.map((asset) => asset.id),
      source: "NASA-JPL-Cassini-PIA07782",
      deterministicZonalFlow: "cinematic-only-fixed-epoch-source-mask-bounded",
      specularLobe: false,
      proceduralFallback: false,
      presentationOnly: true,
    },
    {
      body: "saturn",
      status: "admitted",
      acquisitionReceiptSha256: saturnAcquisition.receiptSha256,
      atmosphereSupplementReceiptSha256: saturnAtmosphereSupplement.receiptSha256,
      overlayPath: "public/data/celestial-convergence-v591/saturn-asset-overlay.json",
      overlaySha256: saturnAssetOverlay.receiptSha256,
      assetIds: saturnAssetOverlay.assets.map((asset) => asset.id),
      sources: "NASA-Cassini-PIA06193-PIA21617-PIA21628",
      radialUv: true,
      mutualShadows: true,
      premultipliedAlpha: true,
      proceduralFallback: false,
      presentationOnly: true,
    },
    {
      body: "vesta",
      status: "admitted",
      acquisitionReceiptSha256: vestaAcquisition.receiptSha256,
      overlayPath: "public/data/celestial-convergence-v591/vesta-asset-overlay.json",
      overlaySha256: vestaAssetOverlay.receiptSha256,
      assetIds: vestaAssetOverlay.microtextureReuse.assets.map((asset) => asset.id),
      modelLodReceiptSha256: vestaModelLodReceipt.receiptSha256,
      modelLods: "3/3-v591-owned-meshopt-normals-stable-pivot",
      source: "NASA-3D-Resources-Asteroid-4-Vesta-A",
      microtexturePolicy: "poly-haven-cc0-exact-byte-reuse-presentation-only-not-vesta-observation",
      reflectance: "bounded-basaltic-achondrite-oren-nayar-opposition-no-glossy-specular",
      noTextureBytesCopied: true,
      measuredPhotometryClaim: false,
      proceduralFallback: false,
      presentationOnly: true,
    },
    {
      body: "bennu",
      status: "admitted",
      acquisitionReceiptSha256: bennuAcquisition.receiptSha256,
      overlayPath: "public/data/celestial-convergence-v591/bennu-asset-overlay.json",
      overlaySha256: bennuAssetOverlay.receiptSha256,
      assetIds: bennuAssetOverlay.assets.map((asset) => asset.id),
      inheritedModelManifestSha256: bennuAssetOverlay.inheritedModel.manifestSha256,
      inheritedModelLodReceiptSha256: bennuAssetOverlay.inheritedModel.lodReceiptSha256,
      inheritedModelLods: "3/3-exact-byte-meshopt-normals-stable-pivot",
      microtexturePolicy: "poly-haven-cc0-presentation-only-not-bennu-observation",
      reflectance: "bounded-low-albedo-carbonaceous-oren-nayar-opposition-no-glossy-specular",
      noModelBytesCopied: true,
      proceduralFallback: false,
      presentationOnly: true,
    },
    ...nasaSmallBodies.map(({ body, acquisition, modelReceipt, overlay }) => ({
      body,
      status: "admitted",
      acquisitionReceiptSha256: acquisition.receiptSha256,
      aggregateAcquisitionReceiptSha256: nasaGitBlobAcquisition.receiptSha256,
      metadataReceiptSha256: nasa3dTreeMetadata.receiptSha256,
      overlayPath: `public/data/celestial-convergence-v591/${body}-asset-overlay.json`,
      overlaySha256: overlay.receiptSha256,
      assetIds: overlay.microtextureReuse.assets.map((asset) => asset.id),
      modelLodReceiptSha256: modelReceipt.receiptSha256,
      modelLods: "3/3-v591-owned-meshopt-normals-stable-pivot",
      source: `NASA-3D-Resources-${body}`,
      sourceDetailCeiling: overlay.model.sourceDetailCeiling,
      printableSplitReconstruction: body === "eros" ? "topology-paired-watertight-two-half-reconstruction" : "not-applicable",
      microtexturePolicy: `poly-haven-cc0-exact-byte-reuse-presentation-only-not-${body}-observation`,
      reflectance: overlay.materialPolicy.reflectance,
      noTextureBytesCopied: true,
      measuredPhotometryClaim: false,
      proceduralFallback: false,
      presentationOnly: true,
    })),
    {
      body: "tempel-1",
      status: "admitted-pds-shape-observed-coverage-runtime-browser-pending",
      acquisitionReceiptSha256: tempel1Acquisition.receiptSha256,
      modelLodReceiptSha256: tempel1ModelLodReceipt.receiptSha256,
      buildReceiptSha256: tempel1AssetBuildReceipt.receiptSha256,
      overlayPath: "public/data/celestial-convergence-v591/tempel-1-asset-overlay.json",
      overlaySha256: tempel1AssetOverlay.receiptSha256,
      assetIds: tempel1AssetOverlay.assets.map((asset) => asset.id),
      modelLods: "3/3-v591-owned-meshopt-normals-stable-pivot",
      source: "NASA-PDS-SBN-Deep-Impact-Stardust-NExT-shape-v2",
      sourceDetailCeiling: tempel1AssetOverlay.model.sourceDetailCeiling,
      observedCoverageFraction: tempel1AssetOverlay.observationMapping.observedPixelFraction,
      unobservedAreaPolicy: "poly-haven-cc0-regolith-presentation-substrate-never-observation",
      tailPolicy: tempel1AssetOverlay.materialPolicy.tails,
      microtexturePolicy: "poly-haven-cc0-exact-byte-reuse-presentation-only-not-tempel-1-observation",
      measuredPhotometryClaim: false,
      proceduralFallback: false,
      presentationOnly: true,
    },
    {
      body: "ceres",
      status: "admitted-pds-dawn-radius-albedo-runtime-browser-pending",
      metadataReceiptSha256: ceresMetadata.receiptSha256,
      acquisitionReceiptSha256: ceresAcquisition.receiptSha256,
      modelLodReceiptSha256: ceresModelLodReceipt.receiptSha256,
      derivationReceiptSha256: ceresTextureDerivationReceipt.receiptSha256,
      buildReceiptSha256: ceresAssetBuildReceipt.receiptSha256,
      shapeBlockedReceiptSha256: ceresShapeBlocked.receiptSha256,
      centralMirrorBlockedReceiptSha256: ceresCentralMirrorBlocked.receiptSha256,
      overlayPath: "public/data/celestial-convergence-v591/ceres-asset-overlay.json",
      overlaySha256: ceresAssetOverlay.receiptSha256,
      assetIds: ceresAssetOverlay.assets.map((asset) => asset.id),
      modelLods: "3/3-v591-owned-pds-radius-derived-meshopt-normals-body-center-pivot",
      source: "NASA-PDS-Dawn-SPC-global-radius-and-relative-albedo",
      sourceDetailCeiling: ceresAssetOverlay.model.sourceDetailCeiling,
      observationGrid: "2222x1111",
      opticalColorClaim: false,
      syntheticDetailAdded: false,
      microtexturePolicy: "poly-haven-cc0-exact-byte-reuse-presentation-only-not-ceres-observation",
      measuredPhotometryClaim: false,
      proceduralFallback: false,
      presentationOnly: true,
    },
    ...iceGiantPrimaryOverlay.bodies.map((body) => ({
      body: body.body,
      status: "admitted-registered-procedural-primary",
      overlayPath: "public/data/celestial-convergence-v591/ice-giant-primary-overlay.json",
      overlaySha256: iceGiantPrimaryOverlay.receiptSha256,
      assetIds: [],
      registeredMaterial: body.registeredMaterial,
      paletteIdentity: body.paletteIdentity,
      shaderProfile: body.v591ShaderProfile,
      proceduralPrimary: true,
      proceduralFallback: false,
      observationTextureClaim: false,
      measuredPhotometryClaim: false,
      presentationOnly: true,
    })),
  ],
  nebulae,
  nebulaAssetOverlay: {
    path: "public/data/celestial-convergence-v591/nebula-asset-overlay.json",
    sha256: nebulaAssetOverlay.receiptSha256,
    admittedCount: nebulaAssetOverlay.assets.length,
    blockedCount: nebulaAssetOverlay.blocked.length,
    presentationOnly: true,
    sciencePolicy: nebulaAssetOverlay.policy.science,
    cinematicPolicy: nebulaAssetOverlay.policy.cinematic,
  },
  constellations: {
    count: constellationPacket.metrics.constellationCount,
    waypointCount: constellationPacket.metrics.waypointCount,
    uniqueGaiaSourceIdCount: constellationPacket.metrics.uniqueGaiaSourceIdCount,
    baselineBinding: "v590-readonly",
    v591PacketVersion: constellationPacket.version,
    v591PacketPath: "public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json",
    v591PacketSha256: constellationPacket.packetSha256,
    v591PacketFileSha256: constellationPacketFileSha256,
    frozenSourceFileSha256: constellationPacket.frozenSource.fileSha256,
    frozenBindingSha256: constellationPacket.frozenSource.bindingSha256,
    maximumAnchorDistanceDeg: constellationPacket.metrics.maximumAngularDistanceDeg,
    medianAnchorDistanceDeg: constellationPacket.metrics.medianAngularDistanceDeg,
    thresholdDeg: constellationPacket.metrics.thresholdDeg,
    defaultDesktopCount: constellationPacket.defaults.desktop,
    defaultMobileCount: constellationPacket.defaults.mobile,
    labelAtlasPath: constellationPacket.labelAtlas.path,
    labelAtlasSha256: constellationPacket.labelAtlas.sha256,
    labelAtlasBytes: constellationPacket.labelAtlas.bytes,
    labelAtlasMetadataSha256: constellationPacket.labelAtlas.metadataFileSha256,
    presentationOnly: constellationPacket.presentationPolicy.presentationOnly,
    normalizedCelestialDirections: constellationPacket.presentationPolicy.normalizedCelestialDirections,
    depthOcclusion: constellationPacket.presentationPolicy.depthOcclusion,
    v591OverrideStatus: "admitted-v591-owned-presentation-packet",
  },
  starfield: {
    source: "Gaia-readonly",
    baseline: "v590-readonly",
    v591OverrideStatus: starfieldOverrideStatus,
    opticsVersion: "v591-gaia-moffat-airy-optics-v1",
    drawPolicy: "one-point-draw-plus-one-instanced-bright-psf-draw",
    sourcePolicy: "gaia-position-color-magnitude-only",
    faintDensityPolicy: "deterministic-source-id-thinning-anchor-preserving",
    scienceBlend: "normal-linear-no-additive-halo",
    cinematicBlend: "normal-with-restrained-airy-halo-and-diffraction-spikes",
    sourceManifestDependency: "Gaia-readonly-v590-worker-and-catalog",
  },
  runtime: {
    canvasCount: 1,
    baselineComponent: "v591-owned-shell-with-v590-readonly-layers",
    v591HeroOverrideCount: admittedOverrideBodies.size,
    v591HeroOverrideBodies: [...admittedOverrideBodies],
    presentationOnlyOverlay: false,
    duplicateGeometrySuppression: "admitted-v591-overrides-shadow-baseline-admission-to-asset-blocked",
  },
  allowedSources: ["NASA", "JPL", "GSFC", "USGS-Astrogeology", "NASA-PDS", "NASA-3D-Resources", "Poly-Haven-CC0", "Gaia-existing-admission"],
  budgets: v590Manifest.budgets,
};
const manifest = { ...manifestUnsigned, manifestSha256: canonicalSha(manifestUnsigned) };
atomicWrite(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

atomicWrite(generatedConstantsPath, `export const CELESTIAL_CONVERGENCE_MANIFEST_SHA256_V591 = "${manifest.manifestSha256}" as const;\nexport const CELESTIAL_CONVERGENCE_BASELINE_MANIFEST_SHA256_V591 = "${v590Manifest.manifestSha256}" as const;\nexport const CELESTIAL_CONVERGENCE_FREEZE_BEFORE_SHA256_V591 = "${freezeBefore.snapshotSha256}" as const;\n`);
atomicWrite(generatedAssetConstantsPath, [
  "// Generated from the sealed v591 Hero asset and registered-primary overlays.",
  `export const CELESTIAL_CONVERGENCE_SUN_ASSET_OVERLAY_SHA256_V591 = "${sunAssetOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_EARTH_ASSET_OVERLAY_SHA256_V591 = "${earthAssetOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_MERCURY_ASSET_OVERLAY_SHA256_V591 = "${mercuryAssetOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_MOON_ASSET_OVERLAY_SHA256_V591 = "${moonAssetOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_MARS_ASSET_OVERLAY_SHA256_V591 = "${marsAssetOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_JUPITER_ASSET_OVERLAY_SHA256_V591 = "${jupiterAssetOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_SATURN_ASSET_OVERLAY_SHA256_V591 = "${saturnAssetOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591 = "${bennuAssetOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_VESTA_ASSET_OVERLAY_SHA256_V591 = "${vestaAssetOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_VESTA_MODEL_LOD_RECEIPT_SHA256_V591 = "${vestaModelLodReceipt.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_EROS_ASSET_OVERLAY_SHA256_V591 = "${erosAssetOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_EROS_MODEL_LOD_RECEIPT_SHA256_V591 = "${erosModelLodReceipt.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_KLEOPATRA_ASSET_OVERLAY_SHA256_V591 = "${kleopatraAssetOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_KLEOPATRA_MODEL_LOD_RECEIPT_SHA256_V591 = "${kleopatraModelLodReceipt.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_TEMPEL1_ASSET_OVERLAY_SHA256_V591 = "${tempel1AssetOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_TEMPEL1_MODEL_LOD_RECEIPT_SHA256_V591 = "${tempel1ModelLodReceipt.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_CERES_ASSET_OVERLAY_SHA256_V591 = "${ceresAssetOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_CERES_MODEL_LOD_RECEIPT_SHA256_V591 = "${ceresModelLodReceipt.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_ICE_GIANT_PRIMARY_OVERLAY_SHA256_V591 = "${iceGiantPrimaryOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_VENUS_ASSET_OVERLAY_SHA256_V591 = "${venusAssetOverlay.receiptSha256}" as const;`,
  "",
].join("\n"));

const sourcePaths = [
  "app/local-shadow-v591/page.tsx",
  "app/components/OrbitAtlasCelestialConvergenceV591Lazy.tsx",
  "app/components/OrbitAtlasCelestialConvergenceV591.tsx",
  "app/components/CelestialConvergenceStageV591.tsx",
  "app/components/CelestialDeepSpaceV591.tsx",
  "app/components/CelestialDeepSpaceV591.test.tsx",
  "app/lib/celestialConstellationsV591.ts",
  "app/lib/celestialConstellationsV591.test.ts",
  "app/data/celestialConstellationsV591.generated.ts",
  "app/workers/celestialStarfieldV591.worker.ts",
  "app/components/CelestialHeroOverridesV591.tsx",
  "app/components/UniverseCanvasOverrideHostV591.tsx",
  "app/lib/celestialConvergenceV591.ts",
  "app/lib/celestialDeepSpaceV591.ts",
  "app/lib/celestialDeepSpaceV591.test.ts",
  "app/lib/celestialNebulaV591.ts",
  "app/lib/celestialNebulaV591.test.ts",
  "app/data/celestialNebulaV591.generated.ts",
  "app/lib/celestialConvergenceV591.test.ts",
  "app/lib/celestialMaterialsV591.ts",
  "app/lib/useV591Texture.ts",
  "app/lib/useV591BennuModel.ts",
  "app/lib/useV591VestaModel.ts",
  "app/lib/useV591NasaSmallBodyModel.ts",
  "app/lib/celestialTempel1V591.ts",
  "app/lib/useV591Tempel1Model.ts",
  "app/lib/celestialCeresV591.ts",
  "app/lib/useV591CeresModel.ts",
  "app/lib/useV591Texture.test.ts",
  "app/data/celestialConvergenceManifestV591.generated.ts",
  "app/data/celestialConvergenceAssetsV591.generated.ts",
  "scripts/v591-visual-sources.json",
  "scripts/v591-moon-visual-sources.json",
  "scripts/v591-mercury-visual-sources.json",
  "scripts/v591-mars-visual-sources.json",
  "scripts/v591-mars-nasa3d-source.json",
  "scripts/v591-mars-nasa3d-jpeg-source.json",
  "scripts/v591-mars-usgs-full-source.json",
  "scripts/v591-jupiter-visual-sources.json",
  "scripts/v591-saturn-visual-sources.json",
  "scripts/v591-saturn-atmosphere-supplement.json",
  "scripts/v591-bennu-visual-sources.json",
  "scripts/v591-nasa-small-body-visual-sources.json",
  "scripts/acquire-v591-visual-sources.mjs",
  "scripts/acquire-v591-moon-sources.mjs",
  "scripts/acquire-v591-mercury-sources.mjs",
  "scripts/probe-v591-mercury-usgs-dem-metadata.mjs",
  "scripts/acquire-v591-mars-sources.mjs",
  "scripts/acquire-v591-mars-nasa3d-source.mjs",
  "scripts/acquire-v591-mars-nasa3d-jpeg-source.mjs",
  "scripts/acquire-v591-mars-usgs-full-source.mjs",
  "scripts/acquire-v591-jupiter-sources.mjs",
  "scripts/acquire-v591-saturn-sources.mjs",
  "scripts/acquire-v591-saturn-atmosphere-supplement.mjs",
  "scripts/acquire-v591-bennu-sources.mjs",
  "scripts/acquire-v591-nasa-small-body-sources.mjs",
  "scripts/acquire-v591-ceres-sources.mjs",
  "scripts/probe-v591-ceres-usgs-metadata.mjs",
  "scripts/probe-v591-ceres-nasa3d-page.mjs",
  "scripts/probe-v591-ceres-pds-registry.mjs",
  "scripts/probe-v591-ceres-pds-target-products.mjs",
  "scripts/acquire-v591-ceres-pds-sources.mjs",
  "scripts/acquire-v591-ceres-pds-central-shape.mjs",
  "scripts/acquire-v591-ceres-pds-radius-albedo.mjs",
  "scripts/prepare-v591-ceres-radius-model.py",
  "scripts/build-v591-ceres-models.mjs",
  "scripts/prepare-v591-ceres-textures.py",
  "scripts/build-v591-ceres-assets.mjs",
  "scripts/probe-v591-venus-usgs-metadata.mjs",
  "scripts/probe-v591-venus-nasa-cloud-metadata.mjs",
  "scripts/probe-v591-venus-s3-path-alias.mjs",
  "scripts/acquire-v591-venus-sources.mjs",
  "scripts/acquire-v591-venus-topography-only.mjs",
  "scripts/acquire-v591-venus-alternative-sources.mjs",
  "scripts/acquire-v591-venus-s3-path-alias.mjs",
  "scripts/v591-venus-visual-sources.json",
  "scripts/v591-venus-alternative-visual-sources.json",
  "scripts/v591-venus-s3-path-alias-source.json",
  "scripts/probe-v591-nasa-images-metadata.mjs",
  "scripts/probe-v591-nebula-asset-manifest.mjs",
  "scripts/probe-v591-naif-comet-dsk-metadata.mjs",
  "scripts/probe-v591-naif-mission-dsk.mjs",
  "scripts/probe-v591-tempel1-pds-registry.mjs",
  "scripts/probe-v591-tempel1-pds-mcp-registry.mjs",
  "scripts/probe-v591-tempel1-pds-mcp-lidvid.mjs",
  "scripts/probe-v591-tempel1-pds3-dataset.mjs",
  "scripts/probe-v591-tempel1-pds3-corrected-dataset.mjs",
  "scripts/probe-v591-tempel1-sbn-holding.mjs",
  "scripts/probe-v591-tempel1-pdssbn-holding.mjs",
  "scripts/probe-v591-tempel1-sbnarchive-deepimpact.mjs",
  "scripts/seal-v591-tempel1-pds-shape-browser-metadata.mjs",
  "scripts/probe-v591-tempel1-pds-shape-md5.mjs",
  "scripts/acquire-v591-tempel1-pds-shape.mjs",
  "scripts/prepare-v591-tempel1-pds-source.py",
  "scripts/build-v591-tempel1-models.mjs",
  "scripts/build-v591-tempel1-assets.mjs",
  "scripts/acquire-v591-nasa-image-visual-assets.mjs",
  "scripts/v591-ceres-visual-sources.json",
  "scripts/v591-nasa-images-metadata-probes.json",
  "scripts/v591-nebula-asset-manifest-probes.json",
  "scripts/reconcile-v591-cycle13-negative-evidence.mjs",
  "scripts/prepare-v591-small-body-source.py",
  "scripts/audit-v591-mars-albedo-identity.mjs",
  "scripts/build-v591-sun-assets.mjs",
  "scripts/build-v591-earth-asset-overlay.mjs",
  "scripts/build-v591-moon-assets.mjs",
  "scripts/build-v591-mercury-assets.mjs",
  "scripts/build-v591-mars-terrain-assets.mjs",
  "scripts/build-v591-mars-albedo-composite.mjs",
  "scripts/build-v591-mars-usgs-albedo.mjs",
  "scripts/build-v591-jupiter-assets.mjs",
  "scripts/build-v591-saturn-assets.mjs",
  "scripts/build-v591-bennu-assets.mjs",
  "scripts/build-v591-vesta-models.mjs",
  "scripts/build-v591-vesta-asset-overlay.mjs",
  "scripts/probe-v591-nasa-3d-tree-metadata.mjs",
  "scripts/download-v591-http-once.ps1",
  "scripts/acquire-v591-nasa-git-blob-small-bodies.mjs",
  "scripts/build-v591-nasa-small-body-models.mjs",
  "scripts/build-v591-nasa-small-body-asset-overlays.mjs",
  "scripts/build-v591-ice-giant-primary-overlay.mjs",
  "scripts/lib/v591-isis-tile-cube.mjs",
  "scripts/decode-v591-venus-isis-cube.mjs",
  "scripts/build-v591-venus-isis-assets.mjs",
  "scripts/v591-isis-tile-cube.test.mjs",
  "scripts/build-v591-celestial-convergence-candidate.mjs",
  "scripts/build-v591-nebula-assets.mjs",
  "scripts/build-v591-constellation-packet.mjs",
  "scripts/build_v591_constellation_sdf.py",
  "scripts/v591-page-build-identity.mjs",
  "scripts/v591-page-build-identity.test.mjs",
  "scripts/refresh-v591-browser-qualification-from-replay.mjs",
  "scripts/refresh-v591-deep-space-browser-qualification.mjs",
  "scripts/init-v591-mercury-browser-qualification.mjs",
  "scripts/init-v591-venus-browser-qualification.mjs",
  "scripts/init-v591-bennu-browser-qualification.mjs",
  "scripts/init-v591-vesta-browser-qualification.mjs",
  "scripts/init-v591-nasa-small-body-browser-qualification.mjs",
  "scripts/init-v591-tempel1-browser-qualification.mjs",
  "scripts/init-v591-ceres-browser-qualification.mjs",
  "scripts/init-v591-ice-giant-browser-qualification.mjs",
  "scripts/seal-v591-celestial-convergence-candidate.mjs",
  "scripts/seal-v591-moon-browser-qualification.mjs",
  "scripts/seal-v591-mercury-browser-qualification.mjs",
  "scripts/seal-v591-mars-browser-qualification.mjs",
  "scripts/seal-v591-jupiter-browser-qualification.mjs",
  "scripts/seal-v591-saturn-browser-qualification.mjs",
  "scripts/seal-v591-bennu-browser-qualification.mjs",
  "scripts/seal-v591-vesta-browser-qualification.mjs",
  "scripts/seal-v591-ice-giant-browser-qualification.mjs",
  "scripts/seal-v591-mars-redirect-block.mjs",
  "scripts/verify-v591-celestial-convergence-candidate.mjs",
  "scripts/build-atlas-v591-profile.mjs",
  "scripts/start-atlas-v591-standalone.mjs",
  "docs/release/v591/README.md",
  "app/lib/celestialConvergenceV591.test.ts",
  "app/components/OrbitAtlasCelestialConvergenceV591.test.tsx",
  "public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json",
  "public/data/celestial-convergence-v591/constellation-label-atlas-v591.json",
  "public/textures/candidate-v591/constellations/labels-sdf.png",
  "public/fonts/candidate-v591/ibm-plex-sans-condensed-latin-500.woff2",
  "public/fonts/candidate-v591/OFL-1.1.txt",
  "docs/release/v591/acquisition-receipt-sun.json",
  "docs/release/v591/acquisition-receipt-moon.json",
  "docs/release/v591/metadata-probe-mercury-usgs-dem.json",
  "docs/release/v591/acquisition-receipt-mercury.json",
  "docs/release/v591/acquisition-assets-mercury/mercury-height-source.json",
  "docs/release/v591/acquisition-url-ledger-mercury.json",
  "docs/release/v591/acquisition-blocked-mercury.json",
  "docs/release/v591/acquisition-receipt-mars.json",
  "docs/release/v591/acquisition-receipt-jupiter.json",
  "docs/release/v591/acquisition-receipt-saturn.json",
  "docs/release/v591/acquisition-receipt-saturn-atmosphere-supplement.json",
  "docs/release/v591/acquisition-receipt-bennu.json",
  "docs/release/v591/acquisition-assets-nasa-small-bodies/vesta-nasa-shape-source.json",
  "docs/release/v591/vesta-model-lod-receipt-v591.json",
  "docs/release/v591/metadata-probe-nasa-3d-tree.json",
  "docs/release/v591/acquisition-receipt-nasa-git-blobs.json",
  "docs/release/v591/acquisition-url-ledger-nasa-git-blobs.json",
  "docs/release/v591/acquisition-assets-nasa-git-blobs/eros-nasa-shape-source.json",
  "docs/release/v591/acquisition-assets-nasa-git-blobs/kleopatra-nasa-shape-source.json",
  "docs/release/v591/eros-model-lod-receipt-v591.json",
  "docs/release/v591/kleopatra-model-lod-receipt-v591.json",
  "docs/release/v591/acquisition-blocked-nasa-small-bodies.json",
  "docs/release/v591/acquisition-url-ledger-nasa-small-bodies.json",
  "docs/release/v591/acquisition-blocked-mars.json",
  "docs/release/v591/acquisition-blocked-mars-nasa3d.json",
  "docs/release/v591/acquisition-blocked-mars-nasa3d-jpeg.json",
  "docs/release/v591/acquisition-blocked-mars-usgs-full.json",
  "docs/release/v591/acquisition-url-ledger-mars.json",
  "docs/release/v591/blocked-negative-evidence-mars-source.json",
  "docs/release/v591/metadata-probe-ceres-usgs.json",
  "docs/release/v591/acquisition-blocked-ceres.json",
  "docs/release/v591/acquisition-url-ledger-ceres.json",
  "docs/release/v591/acquisition-assets-ceres/ceres-albedo-label-source-v591.json",
  "docs/release/v591/metadata-probe-ceres-dawn-global-map.json",
  "docs/release/v591/acquisition-asset-ceres-global-map.json",
  "docs/release/v591/metadata-probe-ceres-dawn-global-mosaic-equirectangular.json",
  "docs/release/v591/metadata-probe-ceres-naif-dawn-dsk.json",
  "docs/release/v591/metadata-probe-ceres-nasa3d-page.json",
  "docs/release/v591/metadata-probe-ceres-pds-registry.json",
  "docs/release/v591/metadata-probe-ceres-pds-target-products.json",
  "docs/release/v591/acquisition-asset-ceres-pds-radius-albedo.json",
  "docs/release/v591/acquisition-assets-ceres-pds/ceres-shape-data-blocked.json",
  "docs/release/v591/acquisition-assets-ceres-pds/ceres-shape-data-central-blocked.json",
  "docs/release/v591/ceres-model-lod-receipt-v591.json",
  "docs/release/v591/ceres-texture-derivation-receipt-v591.json",
  "docs/release/v591/ceres-asset-build-receipt-v591.json",
  "docs/release/v591/metadata-probe-tempel-1-deep-impact-shape.json",
  "docs/release/v591/metadata-probe-tempel-1-naif-comet-dsk-blocked.json",
  "docs/release/v591/metadata-probe-tempel-1-naif-deepimpact-dsk.json",
  "docs/release/v591/metadata-probe-tempel-1-pds-registry-redirect-blocked.json",
  "docs/release/v591/metadata-probe-tempel-1-pds-mcp-registry.json",
  "docs/release/v591/metadata-probe-tempel-1-pds-mcp-lidvid.json",
  "docs/release/v591/metadata-probe-tempel-1-pds3-dataset.json",
  "docs/release/v591/metadata-probe-tempel-1-pds3-corrected-dataset.json",
  "docs/release/v591/metadata-probe-tempel-1-sbn-holding.json",
  "docs/release/v591/metadata-probe-tempel-1-pdssbn-holding.json",
  "docs/release/v591/metadata-probe-tempel-1-sbnarchive-deepimpact-blocked.json",
  "docs/release/v591/metadata-probe-tempel-1-pds-sbn-shape-v2-browser.json",
  "docs/release/v591/metadata-probe-tempel-1-pds-sbn-shape-v2-md5.json",
  "docs/release/v591/acquisition-asset-tempel-1-pds-shape-v2.json",
  "docs/release/v591/tempel-1-model-lod-receipt-v591.json",
  "docs/release/v591/tempel-1-asset-build-receipt-v591.json",
  "docs/release/v591/acquisition-blocked-venus.json",
  "docs/release/v591/acquisition-blocked-venus-topography.json",
  "docs/release/v591/acquisition-asset-venus-topography.json",
  "docs/release/v591/acquisition-url-ledger-venus.json",
  "docs/release/v591/acquisition-url-ledger-venus-alternative.json",
  "docs/release/v591/acquisition-assets-venus-alternative/venus-clrtopo-6600m-label-v591.json",
  "docs/release/v591/acquisition-blocked-venus-clrtopo-6600m-cube-source-v591.json",
  "docs/release/v591/metadata-probe-venus-s3-path-alias.json",
  "docs/release/v591/acquisition-url-ledger-venus-s3-path-alias.json",
  "docs/release/v591/acquisition-blocked-venus-clrtopo-6600m-cube-path-alias-v591.json",
  "docs/release/v591/acquisition-asset-venus-magellan-0e.json",
  "docs/release/v591/acquisition-asset-venus-magellan-90e.json",
  "docs/release/v591/acquisition-asset-venus-magellan-270e.json",
  "docs/release/v591/metadata-probe-venus-usgs.json",
  "docs/release/v591/metadata-probe-venus-nasa-cloud.json",
  "docs/release/v591/metadata-probe-venus-nasa-cloud-broad-blocked.json",
  "public/data/celestial-convergence-v591/venus-asset-overlay.json",
  "docs/release/v591/metadata-probe-nebula-orion.json",
  "docs/release/v591/metadata-probe-nebula-lagoon.json",
  "docs/release/v591/metadata-probe-nebula-eagle.json",
  "docs/release/v591/metadata-probe-nebula-helix.json",
  "docs/release/v591/metadata-probe-nebula-veil.json",
  "docs/release/v591/metadata-probe-nebula-veil-cygnus-loop.json",
  "docs/release/v591/metadata-probe-nebula-veil-cygnus-loop-simple.json",
  "docs/release/v591/metadata-probe-nebula-asset-manifest-veil-cygnus-loop-alt-response.json",
  "docs/release/v591/acquisition-asset-veil-cygnus-loop.json",
  "docs/release/v591/acquisition-url-ledger-nasa-image-visuals.json",
  "docs/release/v591/metadata-probe-nebula-north-america.json",
  "docs/release/v591/mars-albedo-identity-audit.json",
  "docs/release/v591/mars-albedo-composite-audit.json",
  "docs/release/v591/mars-albedo-composite-rejection.json",
  "docs/release/v591/mars-albedo-usgs-resample-audit.json",
  "public/data/celestial-convergence-v591/sun-asset-overlay.json",
  "public/data/celestial-convergence-v591/earth-asset-overlay.json",
  "public/data/celestial-convergence-v591/mercury-asset-overlay.json",
  "public/data/celestial-convergence-v591/moon-asset-overlay.json",
  "public/data/celestial-convergence-v591/mars-asset-overlay.json",
  "public/data/celestial-convergence-v591/jupiter-asset-overlay.json",
  "public/data/celestial-convergence-v591/saturn-asset-overlay.json",
  "public/data/celestial-convergence-v591/bennu-asset-overlay.json",
  "public/data/celestial-convergence-v591/vesta-asset-overlay.json",
  "public/data/celestial-convergence-v591/eros-asset-overlay.json",
  "public/data/celestial-convergence-v591/kleopatra-asset-overlay.json",
  "public/data/celestial-convergence-v591/tempel-1-asset-overlay.json",
  "public/data/celestial-convergence-v591/ceres-asset-overlay.json",
  "public/data/celestial-convergence-v591/ice-giant-primary-overlay.json",
  "public/data/celestial-convergence-v591/nebula-asset-overlay.json",
  ...sunAcquisition.assets.map((asset) => asset.outputPath),
  ...moonAcquisition.assets.map((asset) => asset.outputPath),
  mercuryAcquisition.albedoReference.path,
  ...mercuryAcquisition.assets.map((asset) => asset.outputPath),
  ...venusMultiviewAcquisitions.map((receipt) => receipt.asset.outputPath),
  ...marsAcquisition.assets.map((asset) => asset.outputPath),
  jupiterAcquisition.asset.outputPath,
  ...saturnAcquisition.assets.map((asset) => asset.outputPath),
  saturnAtmosphereSupplement.asset.outputPath,
  ...bennuAcquisition.assets.map((asset) => asset.outputPath),
  ...sunAssetOverlay.assets.flatMap((asset) => Object.values(asset.variants).map((file) => publicPathFromUrl(file.url))),
  ...moonAssetOverlay.assets.flatMap((asset) => Object.values(asset.variants).map((file) => publicPathFromUrl(file.url))),
  ...mercuryAssetOverlay.assets.flatMap((asset) => Object.values(asset.variants).map((file) => publicPathFromUrl(file.url))),
  ...venusAssetOverlay.assets.flatMap((asset) => Object.values(asset.variants).map((file) => publicPathFromUrl(file.url))),
  ...marsAssetOverlay.assets.flatMap((asset) => Object.values(asset.variants).map((file) => publicPathFromUrl(file.url))),
  ...jupiterAssetOverlay.assets.flatMap((asset) => Object.values(asset.variants).map((file) => publicPathFromUrl(file.url))),
  ...saturnAssetOverlay.assets.flatMap((asset) => Object.values(asset.variants).map((file) => publicPathFromUrl(file.url))),
  ...bennuAssetOverlay.assets.flatMap((asset) => Object.values(asset.variants).map((file) => publicPathFromUrl(file.url))),
  ...bennuAssetOverlay.inheritedModel.lods.map((lod) => lod.path),
  vestaAssetOverlay.model.sourcePath,
  ...vestaAssetOverlay.model.lods.map((lod) => lod.path),
  ...nasaSmallBodies.flatMap(({ overlay }) => [overlay.model.sourcePath, ...overlay.model.lods.map((lod) => lod.path)]),
  tempel1Acquisition.asset.outputPath,
  tempel1ModelLodReceipt.source.path,
  tempel1ModelLodReceipt.mosaic.path,
  ...tempel1AssetOverlay.model.lods.map((lod) => lod.path),
  ...tempel1AssetOverlay.assets.flatMap((asset) => Object.values(asset.variants).map((file) => publicPathFromUrl(file.url))),
  ...ceresAcquisition.assets.map((asset) => asset.outputPath),
  ...ceresAssetOverlay.model.lods.map((lod) => lod.path),
  ...ceresAssetOverlay.assets.flatMap((asset) => Object.values(asset.variants).map((file) => publicPathFromUrl(file.url))),
  ...nebulaAssetOverlay.assets.flatMap((asset) => [asset.source.path, ...Object.values(asset.variants).map((file) => publicPathFromUrl(file.url))]),
  "docs/release/v591/acquisition-blocked-nebulae.json",
  "docs/release/v591/acquisition-url-ledger-nebulae.json",
  ...nebulaAssetOverlay.assets.map((asset) => asset.id === "veil-nebula"
    ? "docs/release/v591/acquisition-asset-veil-cygnus-loop.json"
    : `docs/release/v591/acquisition-assets-nebulae/${asset.id === "orion-nebula" ? "orion-nebula-nasa-wise" : asset.id === "lagoon-nebula" ? "lagoon-nebula-nasa-wise" : asset.id === "eagle-nebula" ? "eagle-nebula-nasa-wise" : asset.id === "helix-nebula" ? "helix-nebula-nasa-galex" : "north-america-nebula-nasa-spitzer"}.json`),
  "scripts/v591-nebula-asset-manifest-probes.json",
  "scripts/v591-nasa-images-metadata-probes.json",
  "scripts/v591-nebula-visual-sources.json",
];
const sourceFiles = sourcePaths.map((path) => fileRecord(path, existsSync(resolve(root, path)) ? sha256(readFileSync(resolve(root, path))) : "0".repeat(64)));
const sourceManifest = writeSealed(resolve(docsRoot, "source-manifest-v591.json"), {
  version: "v591-source-manifest-v1",
  generatedAt,
  status: sourceFiles.every((entry) => entry.status === "matched") ? "complete" : "blocked-missing-source",
  files: sourceFiles,
}, "receiptSha256");

const currentState = writeSealed(resolve(docsRoot, "current-state-receipt-v591.json"), {
  version: "v591-current-state-receipt-v1",
  generatedAt,
  status: frozenDrift.length === 0 && sourceManifest.status === "complete" ? "p2-sixteen-heroes-assets-admitted-browser-gates-pending" : "p2-blocked",
  formalProduct: { pointer: "v263", changed: false },
  candidate: { version: manifest.version, route: manifest.route, manifestSha256: manifest.manifestSha256, promotion: "additive-only" },
  baseline: { candidate: "v590-readonly", manifestSha256: v590Manifest.manifestSha256, sourceCount: v590SourceManifest.files.length },
  progress: { phase: "p2-sixteen-hero-browser-requalification", v591HeroOverrides: admittedOverrideBodies.size, coreHeroOverrides: "6/6", p2HeroOverrides: "10/10", inheritedHeroAdmissions: 3, effectiveHeroAdmissions: 16, nebulaAdmissions: `${nebulaAssetOverlay.assets.length}/6`, constellationAnchors: "484/484-v591-owned-packet" },
  authorities: { visualCandidateQualified: false, scientificAuthorityChanged: false, measuredAuthorityGranted: false, gpuAuthorityGranted: false },
  evidence: { freezeBeforeSha256: freezeBefore.snapshotSha256, sourceManifestSha256: sourceManifest.receiptSha256 },
}, "receiptSha256");

const pointer = writeSealed(pointerPath, {
  version: "v591-current-research-visual-candidate-pointer-v1",
  generatedAt,
  status: "additive-p2-sixteen-heroes-assets-admitted-browser-gates-pending",
  route: manifest.route,
  candidate: manifest.version,
  manifestSha256: manifest.manifestSha256,
  currentStateReceiptSha256: currentState.receiptSha256,
  formalProductPointer: "v263",
  scientificPayloadSha256,
  scientificPayloadWriteback: false,
  productionPromotionAllowed: false,
}, "pointerSha256");

console.log(JSON.stringify({
  status: currentState.status,
  manifestSha256: manifest.manifestSha256,
  freezeBeforeSha256: freezeBefore.snapshotSha256,
  sourceManifestSha256: sourceManifest.receiptSha256,
  frozenCount: frozenSnapshot.length,
  frozenDriftCount: frozenDrift.length,
  pointerSha256: pointer.pointerSha256,
  formalProductPointer: "v263",
}, null, 2));
