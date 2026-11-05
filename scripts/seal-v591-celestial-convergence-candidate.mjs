import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { derivePageBuildFingerprintV591 } from "./v591-page-build-identity.mjs";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const docsRoot = resolve(root, "docs/release/v591");
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
  if (canonicalSha(unsigned) !== document[field]) throw new Error(`v591-seal-identity:${relativePath}`);
  return document;
}
function verifyOptionalSealed(relativePath, field = "receiptSha256") {
  if (!existsSync(resolve(root, relativePath))) return null;
  return verifySealed(relativePath, field);
}
function sumUnique(rows, identity, bytes) {
  const unique = new Map();
  for (const row of rows) unique.set(identity(row), bytes(row));
  return [...unique.values()].reduce((sum, value) => sum + value, 0);
}
function collectFiles(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

const manifest = verifySealed("public/data/celestial-convergence-v591/manifest.json", "manifestSha256");
const constellationPacket = readJson("public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json");
const constellationPacketBytes = readFileSync(resolve(root, "public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json"));
const constellationLabelAtlasMetadata = readJson("public/data/celestial-convergence-v591/constellation-label-atlas-v591.json");
const constellationLabelAtlasPath = resolve(root, `public/${constellationLabelAtlasMetadata.atlas.path.replace(/^\/+/, "")}`);
const constellationLabelAtlasBytes = readFileSync(constellationLabelAtlasPath);
const constellationPacketFileSha256 = sha256(constellationPacketBytes);
const constellationLabelAtlasFileSha256 = sha256(constellationLabelAtlasBytes);
const constellationPacketUnsigned = { ...constellationPacket };
delete constellationPacketUnsigned.packetSha256;
const freezeBefore = verifySealed("docs/release/v591/freeze-before-v591.json", "snapshotSha256");
const sourceManifest = verifySealed("docs/release/v591/source-manifest-v591.json", "receiptSha256");
const currentState = verifySealed("docs/release/v591/current-state-receipt-v591.json", "receiptSha256");
const sunOverlay = verifySealed("public/data/celestial-convergence-v591/sun-asset-overlay.json", "receiptSha256");
const earthOverlay = verifySealed("public/data/celestial-convergence-v591/earth-asset-overlay.json", "receiptSha256");
const mercuryOverlay = verifySealed("public/data/celestial-convergence-v591/mercury-asset-overlay.json", "receiptSha256");
const venusOverlay = verifySealed("public/data/celestial-convergence-v591/venus-asset-overlay.json", "receiptSha256");
const moonOverlay = verifySealed("public/data/celestial-convergence-v591/moon-asset-overlay.json", "receiptSha256");
const marsOverlay = verifySealed("public/data/celestial-convergence-v591/mars-asset-overlay.json", "receiptSha256");
const jupiterOverlay = verifySealed("public/data/celestial-convergence-v591/jupiter-asset-overlay.json", "receiptSha256");
const saturnOverlay = verifySealed("public/data/celestial-convergence-v591/saturn-asset-overlay.json", "receiptSha256");
const vestaOverlay = verifySealed("public/data/celestial-convergence-v591/vesta-asset-overlay.json", "receiptSha256");
const bennuOverlay = verifySealed("public/data/celestial-convergence-v591/bennu-asset-overlay.json", "receiptSha256");
const erosOverlay = verifySealed("public/data/celestial-convergence-v591/eros-asset-overlay.json", "receiptSha256");
const kleopatraOverlay = verifySealed("public/data/celestial-convergence-v591/kleopatra-asset-overlay.json", "receiptSha256");
const tempel1Overlay = verifySealed("public/data/celestial-convergence-v591/tempel-1-asset-overlay.json", "receiptSha256");
const ceresOverlay = verifySealed("public/data/celestial-convergence-v591/ceres-asset-overlay.json", "receiptSha256");
const iceGiantPrimaryOverlay = verifySealed("public/data/celestial-convergence-v591/ice-giant-primary-overlay.json", "receiptSha256");
const nebulaAssetOverlay = verifySealed("public/data/celestial-convergence-v591/nebula-asset-overlay.json", "receiptSha256");
const sunBrowser = verifySealed("docs/release/v591/browser-qualification-sun-v591.json", "receiptSha256");
const earthBrowser = verifySealed("docs/release/v591/browser-qualification-earth-v591.json", "receiptSha256");
const mercuryBrowser = verifySealed("docs/release/v591/browser-qualification-mercury-v591.json", "receiptSha256");
const venusBrowser = verifySealed("docs/release/v591/browser-qualification-venus-v591.json", "receiptSha256");
const moonBrowser = verifySealed("docs/release/v591/browser-qualification-moon-v591.json", "receiptSha256");
const marsBrowser = verifySealed("docs/release/v591/browser-qualification-mars-v591.json", "receiptSha256");
const jupiterBrowser = verifySealed("docs/release/v591/browser-qualification-jupiter-v591.json", "receiptSha256");
const saturnBrowser = verifySealed("docs/release/v591/browser-qualification-saturn-v591.json", "receiptSha256");
const vestaBrowser = verifySealed("docs/release/v591/browser-qualification-vesta-v591.json", "receiptSha256");
const bennuBrowser = verifySealed("docs/release/v591/browser-qualification-bennu-v591.json", "receiptSha256");
const erosBrowser = verifySealed("docs/release/v591/browser-qualification-eros-v591.json", "receiptSha256");
const kleopatraBrowser = verifySealed("docs/release/v591/browser-qualification-kleopatra-v591.json", "receiptSha256");
const tempel1Browser = verifySealed("docs/release/v591/browser-qualification-tempel-1-v591.json", "receiptSha256");
const ceresBrowser = verifySealed("docs/release/v591/browser-qualification-ceres-v591.json", "receiptSha256");
const uranusBrowser = verifySealed("docs/release/v591/browser-qualification-uranus-v591.json", "receiptSha256");
const neptuneBrowser = verifySealed("docs/release/v591/browser-qualification-neptune-v591.json", "receiptSha256");
const deepSpaceBrowser = verifySealed("docs/release/v591/browser-qualification-deep-space-v591.json", "receiptSha256");
const globalVisualMatrix = verifyOptionalSealed("docs/release/v591/browser-qualification-global-matrix-v591.json");
const browserSoak = verifyOptionalSealed("docs/release/v591/browser-soak-qualification-v591.json");
const humanVisualSignoff = verifyOptionalSealed("docs/release/v591/human-visual-signoff-v591.json");

if (
  manifest.constellations?.v591PacketVersion !== "v591-constellation-gaia-packet-v1"
  || manifest.constellations?.v591PacketSha256 !== constellationPacket.packetSha256
  || manifest.constellations?.v591PacketFileSha256 !== constellationPacketFileSha256
  || manifest.constellations?.count !== 88
  || manifest.constellations?.waypointCount !== 484
  || manifest.constellations?.uniqueGaiaSourceIdCount !== 420
  || manifest.constellations?.maximumAnchorDistanceDeg !== 1.4008261815085659
  || manifest.constellations?.medianAnchorDistanceDeg !== 0.4760630074038235
  || manifest.constellations?.thresholdDeg !== 1.5
  || manifest.constellations?.defaultDesktopCount !== 12
  || manifest.constellations?.defaultMobileCount !== 8
  || manifest.constellations?.presentationOnly !== true
  || manifest.constellations?.normalizedCelestialDirections !== true
  || manifest.constellations?.depthOcclusion !== true
  || manifest.constellations?.v591OverrideStatus !== "admitted-v591-owned-presentation-packet"
  || constellationPacket.version !== "v591-constellation-gaia-packet-v1"
  || canonicalSha(constellationPacketUnsigned) !== constellationPacket.packetSha256
  || constellationPacket.frozenSource?.fileSha256 !== "6c5aefed75d78f566fa598a2fe15bad5482af41f7a600d055c1554544012f5f5"
  || constellationPacket.frozenSource?.bindingSha256 !== "5d5faefe782b221729084dc9796969579515151afab8c1ed377f0cbf718937a8"
  || constellationPacket.metrics?.constellationCount !== 88
  || constellationPacket.metrics?.waypointCount !== 484
  || constellationPacket.metrics?.uniqueGaiaSourceIdCount !== 420
  || constellationPacket.metrics?.maximumAngularDistanceDeg !== 1.4008261815085659
  || constellationPacket.metrics?.medianAngularDistanceDeg !== 0.4760630074038235
  || constellationPacket.metrics?.thresholdDeg !== 1.5
  || constellationPacket.labelAtlas?.sha256 !== constellationLabelAtlasFileSha256
  || constellationPacket.labelAtlas?.bytes !== constellationLabelAtlasBytes.byteLength
  || constellationPacket.labelAtlas?.metadataFileSha256 !== sha256(readFileSync(resolve(root, "public/data/celestial-convergence-v591/constellation-label-atlas-v591.json")))
  || constellationLabelAtlasMetadata.atlas?.sha256 !== constellationLabelAtlasFileSha256
  || constellationLabelAtlasMetadata.atlas?.bytes !== constellationLabelAtlasBytes.byteLength
  || constellationLabelAtlasMetadata.entries?.length !== 88
) throw new Error("v591-constellation-packet-seal-identity");
const expectedConstellationTelemetry = Object.freeze({
  status: "ready",
  packetVersion: constellationPacket.version,
  packetSha256: constellationPacket.packetSha256,
  packetFileSha256: constellationPacketFileSha256,
  frozenSourceFileSha256: constellationPacket.frozenSource.fileSha256,
  frozenBindingSha256: constellationPacket.frozenSource.bindingSha256,
  constellationCount: constellationPacket.metrics.constellationCount,
  waypointCount: constellationPacket.metrics.waypointCount,
  uniqueGaiaSourceIdCount: constellationPacket.metrics.uniqueGaiaSourceIdCount,
  maximumAngularDistanceDeg: constellationPacket.metrics.maximumAngularDistanceDeg,
  medianAngularDistanceDeg: constellationPacket.metrics.medianAngularDistanceDeg,
  labelAtlasStatus: "ready",
  labelAtlasSha256: constellationLabelAtlasFileSha256,
  labelAtlasBytes: constellationLabelAtlasBytes.byteLength,
});
const expectedPageSourceManifestSha256 = sourceManifest.receiptSha256;
const expectedPageDeliveryTier = "standalone-full";
const expectedPageBuildFingerprint = derivePageBuildFingerprintV591({
  sourceManifestSha256: expectedPageSourceManifestSha256,
  deliveryTier: expectedPageDeliveryTier,
});
function pngDimensions(bytes) {
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" || bytes.subarray(12, 16).toString("ascii") !== "IHDR") return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
function browserEvidenceStatus(receipt, specification) {
  const reasons = [];
  if (receipt.version !== specification.version || receipt.status !== specification.status) reasons.push("receipt-status");
  if (receipt.route !== "/local-shadow-v591" || receipt.runtime?.canvasCount !== 1) reasons.push("route-or-canvas");
  if (receipt.runtime?.hero !== specification.body || receipt.runtime?.heroAdmission !== "admitted") reasons.push("hero-admission");
  const nasaSmallBody = specification.body === "eros" || specification.body === "kleopatra";
  const venus = specification.body === "venus";
  const tempel1 = specification.body === "tempel-1";
  const ceres = specification.body === "ceres";
  const smallBodyOverlay = specification.body === "eros"
    ? erosOverlay
    : specification.body === "kleopatra"
      ? kleopatraOverlay
      : null;
  const smallBodyManifestEntry = nasaSmallBody
    ? manifest.heroAssetOverlays.find((entry) => entry.body === specification.body)
    : null;
  if (nasaSmallBody) {
    const expectedReconstruction = specification.body === "eros" ? "watertight-topology-paired" : "not-applicable";
    if (
      !smallBodyOverlay
        || receipt.runtime?.assetOverlaySha256 !== smallBodyOverlay.receiptSha256
        || receipt.runtime?.modelLodReceiptSha256 !== smallBodyOverlay.modelLodReceiptSha256
        || receipt.runtime?.sourceDetailCeiling !== smallBodyOverlay.model.sourceDetailCeiling
        || receipt.runtime?.printableSplitReconstruction !== expectedReconstruction
        || !String(smallBodyManifestEntry?.microtexturePolicy ?? "").includes("exact-byte-reuse")
        || receipt.runtime?.microtexturePolicy !== smallBodyManifestEntry.microtexturePolicy
        || receipt.runtime?.microtextureSourceOverlaySha256 !== bennuOverlay.receiptSha256
        || receipt.runtime?.microtextureExactByteReuse !== true
        || receipt.runtime?.measuredPhotometryClaim !== false
        || receipt.runtime?.proceduralFallback !== false
    ) reasons.push("small-body-runtime-contract");
  }
  if (venus && (
    receipt.runtime?.assetOverlaySha256 !== venusOverlay.receiptSha256
    || receipt.runtime?.surfaceSource !== "nasa-jpl-magellan-0e-90e-270e-clean-global-views-derived-equirectangular"
    || receipt.runtime?.cloudModel !== "deterministic-physical-inspired-primary-not-observation-texture"
    || receipt.runtime?.cloudObservationTextureClaim !== false
    || receipt.runtime?.measuredTopographyClaim !== false
    || receipt.runtime?.opticalColorClaim !== false
    || receipt.runtime?.proceduralFallback !== false
  )) reasons.push("venus-runtime-contract");
  if (tempel1 && (
    receipt.runtime?.assetOverlaySha256 !== tempel1Overlay.receiptSha256
    || receipt.runtime?.modelLodReceiptSha256 !== tempel1Overlay.modelLodReceiptSha256
    || receipt.runtime?.sourceDetailCeiling !== tempel1Overlay.model.sourceDetailCeiling
    || receipt.runtime?.observationDataset !== "DIF-C-HRIV/ITS/MRI-5-TEMPEL1-SHAPE-V2.0"
    || receipt.runtime?.observedCoverageFraction !== 0.8043214699074074
    || receipt.runtime?.unobservedAreaPolicy !== "cc0-regolith-presentation-substrate-never-observation"
    || receipt.runtime?.microtextureSourceOverlaySha256 !== bennuOverlay.receiptSha256
    || receipt.runtime?.microtextureExactByteReuse !== true
    || receipt.runtime?.tailPolicy !== "fixed-seed-dust-anti-solar-ion-velocity-presentation-only"
    || receipt.runtime?.measuredPhotometryClaim !== false
    || receipt.runtime?.proceduralFallback !== false
  )) reasons.push("tempel1-runtime-contract");
  if (ceres && (
    receipt.runtime?.assetOverlaySha256 !== ceresOverlay.receiptSha256
    || receipt.runtime?.modelLodReceiptSha256 !== ceresOverlay.modelLodReceiptSha256
    || receipt.runtime?.sourceDetailCeiling !== ceresOverlay.model.sourceDetailCeiling
    || receipt.runtime?.observationGrid !== "2222x1111-pds-dawn-spc-relative-albedo-and-radius"
    || receipt.runtime?.radiusRangeMeters !== "442618.25:486849.59375"
    || receipt.runtime?.microtexturePolicy !== "poly-haven-cc0-exact-byte-reuse-presentation-only-not-ceres-observation"
    || receipt.runtime?.microtextureSourceOverlaySha256 !== bennuOverlay.receiptSha256
    || receipt.runtime?.microtextureExactByteReuse !== true
    || receipt.runtime?.reflectance !== "rough-oren-nayar-bounded-opposition-no-glossy-specular"
    || receipt.runtime?.opticalColorClaim !== false
    || receipt.runtime?.syntheticDetailAdded !== false
    || receipt.runtime?.measuredPhotometryClaim !== false
    || receipt.runtime?.proceduralFallback !== false
  )) reasons.push("ceres-runtime-contract");
  if (specification.proceduralPrimary === true && (receipt.runtime?.proceduralPrimary !== true || receipt.runtime?.proceduralFallback !== false || receipt.runtime?.observationTextureClaim !== false || receipt.runtime?.measuredPhotometryClaim !== false)) reasons.push("procedural-primary-policy");
  if (receipt.runtime?.scientificPayloadStableAcrossModesAndDeviceTiers !== true || receipt.runtime?.scientificWriteback !== false) reasons.push("scientific-boundary");
  if (receipt.runtime?.nebulaAdmission?.status !== "6-of-6-runtime-admitted" || receipt.runtime?.nebulaAdmission?.admittedCount !== 6 || receipt.runtime?.nebulaAdmission?.blockedCount !== 0 || receipt.runtime?.nebulaAdmission?.presentationOnly !== true || receipt.scope?.nebulae !== "6/6-runtime-admitted") reasons.push("nebula-runtime-admission");
  const expectedDefaultCount = specification.defaultCount ?? 12;
  const packet = receipt.runtime?.constellationPacket;
  if (
    !packet
      || packet.version !== expectedConstellationTelemetry.packetVersion
      || packet.packetSha256 !== expectedConstellationTelemetry.packetSha256
      || packet.packetFileSha256 !== expectedConstellationTelemetry.packetFileSha256
      || packet.frozenSourceFileSha256 !== expectedConstellationTelemetry.frozenSourceFileSha256
      || packet.frozenBindingSha256 !== expectedConstellationTelemetry.frozenBindingSha256
      || packet.constellationCount !== expectedConstellationTelemetry.constellationCount
      || packet.waypointCount !== expectedConstellationTelemetry.waypointCount
      || packet.uniqueGaiaSourceIdCount !== expectedConstellationTelemetry.uniqueGaiaSourceIdCount
      || packet.maximumAngularDistanceDeg !== expectedConstellationTelemetry.maximumAngularDistanceDeg
      || packet.medianAngularDistanceDeg !== expectedConstellationTelemetry.medianAngularDistanceDeg
      || packet.labelAtlasStatus !== expectedConstellationTelemetry.labelAtlasStatus
      || packet.labelAtlasSha256 !== expectedConstellationTelemetry.labelAtlasSha256
      || packet.labelAtlasBytes !== expectedConstellationTelemetry.labelAtlasBytes
      || packet.presentationOnly !== true
      || !Array.isArray(packet.renderedConstellationCountRange)
      || packet.renderedConstellationCountRange[0] <= 0
      || packet.renderedConstellationCountRange[1] > expectedDefaultCount
      || !Array.isArray(packet.renderedAnchorCountRange)
      || packet.renderedAnchorCountRange[0] <= 0
      || packet.renderedAnchorCountRange[1] > expectedConstellationTelemetry.waypointCount
  ) reasons.push("constellation-packet-telemetry");
  const standaloneReceiptPath = resolve(root, "dist/release/atlas-v591-standalone-build-resource.json");
  const standaloneBuildIdPath = resolve(root, ".next-atlas-v591-standalone-current/BUILD_ID");
  if (!existsSync(standaloneReceiptPath) || !existsSync(standaloneBuildIdPath)) reasons.push("captured-build-missing");
  else {
    const standaloneReceiptBytes = readFileSync(standaloneReceiptPath);
    const standaloneReceipt = JSON.parse(standaloneReceiptBytes.toString("utf8"));
    const standaloneBuildId = readFileSync(standaloneBuildIdPath, "utf8").trim();
    if (
      receipt.candidate?.sourceManifestSha256 !== sourceManifest.receiptSha256
      || receipt.candidate?.manifestSha256 !== manifest.manifestSha256
      || receipt.candidate?.capturedStandaloneBuildId !== standaloneBuildId
      || receipt.candidate?.capturedStandaloneBuildId !== standaloneReceipt.buildId
      || receipt.candidate?.capturedStandaloneReceiptSha256 !== sha256(standaloneReceiptBytes)
      || receipt.candidate?.capturedPageSourceManifestSha256 !== expectedPageSourceManifestSha256
      || receipt.candidate?.capturedPageDeliveryTier !== expectedPageDeliveryTier
      || receipt.candidate?.capturedPageBuildFingerprint !== expectedPageBuildFingerprint
    ) reasons.push("captured-build-identity");
  }
  const phases = ["desktop-science", "desktop-cinematic", "mobile-cinematic", "mobile-science", "desktop-return-science"];
  if (!Array.isArray(receipt.orderedReplay) || receipt.orderedReplay.length !== phases.length) reasons.push("replay-count");
  for (const [index, sample] of (receipt.orderedReplay ?? []).entries()) {
    const mobile = sample.deviceTier === "mobile";
    const expectedSource = mobile ? (specification.mobileSource ?? "ktx2") : (specification.desktopSource ?? "ktx2");
    const expectedKtx2First = expectedSource === "ktx2";
    const expectedLoaderLane = specification.loaderLane ?? "v591";
    const expectedPrewarm = specification.prewarm ?? "ready";
    if (sample.sequence !== index || sample.phase !== phases[index] || sample.viewport !== (mobile ? "390x844" : "1440x900")) reasons.push(`replay-order-${index}`);
    if (sample.nebula?.admittedCount !== 6 || sample.nebula?.blockedCount !== 0 || sample.nebula?.requestedImpostorCount !== 0 || sample.nebula?.readyImpostorCount !== 0 || sample.nebula?.runtimeBlockedImpostorCount !== 0 || sample.nebula?.requestedIds !== "none" || sample.nebula?.readyIds !== "none" || sample.nebula?.blockedIds !== "") reasons.push(`replay-nebula-hero-suppression-${index}`);
    if (sample.pageSourceManifestSha256 !== expectedPageSourceManifestSha256 || sample.pageDeliveryTier !== expectedPageDeliveryTier || sample.pageBuildFingerprint !== expectedPageBuildFingerprint) reasons.push(`replay-page-build-identity-${index}`);
    const expectedDefaultCountForSample = mobile ? 8 : 12;
    const telemetry = sample.constellation;
    if (
      !telemetry
        || telemetry.status !== expectedConstellationTelemetry.status
        || telemetry.packetVersion !== expectedConstellationTelemetry.packetVersion
        || telemetry.packetSha256 !== expectedConstellationTelemetry.packetSha256
        || telemetry.packetFileSha256 !== expectedConstellationTelemetry.packetFileSha256
        || telemetry.frozenSourceFileSha256 !== expectedConstellationTelemetry.frozenSourceFileSha256
        || telemetry.frozenBindingSha256 !== expectedConstellationTelemetry.frozenBindingSha256
        || telemetry.constellationCount !== expectedConstellationTelemetry.constellationCount
        || telemetry.waypointCount !== expectedConstellationTelemetry.waypointCount
        || telemetry.uniqueGaiaSourceIdCount !== expectedConstellationTelemetry.uniqueGaiaSourceIdCount
        || telemetry.maximumAngularDistanceDeg !== expectedConstellationTelemetry.maximumAngularDistanceDeg
        || telemetry.medianAngularDistanceDeg !== expectedConstellationTelemetry.medianAngularDistanceDeg
        || telemetry.renderedConstellationCount <= 0
        || telemetry.renderedConstellationCount > expectedDefaultCountForSample
        || telemetry.renderedAnchorCount <= 0
        || telemetry.renderedAnchorCount > expectedConstellationTelemetry.waypointCount
        || telemetry.defaultCount !== expectedDefaultCountForSample
        || telemetry.labelAtlasStatus !== expectedConstellationTelemetry.labelAtlasStatus
        || telemetry.labelAtlasSha256 !== expectedConstellationTelemetry.labelAtlasSha256
        || telemetry.labelAtlasBytes !== expectedConstellationTelemetry.labelAtlasBytes
    ) reasons.push(`replay-constellation-telemetry-${index}`);
    if (sample.heroAdmission !== "admitted" || sample.ktx2First !== expectedKtx2First || sample.loaderLane !== expectedLoaderLane || sample.prewarm !== expectedPrewarm) reasons.push(`replay-loader-${index}`);
    if (sample.cameraSettled !== true || sample.subjectVisible !== true || sample.screenDiameterPx < 72) reasons.push(`replay-subject-${index}`);
    if (
      specification.frameFits === true
      && (sample.frameFits !== true || sample.screenDiameterPx > Number(sample.viewport.split("x")[0]) * 0.92)
    ) reasons.push(`replay-frame-${index}`);
    if (sample.fpsMedian < 45 || sample.fpsSampleCount < 120 || sample.drawCalls > 60 || sample.gpuBytes > (mobile ? 201326592 : 536870912)) reasons.push(`replay-performance-${index}`);
    if (sample.lod !== (mobile ? specification.mobileLod : specification.desktopLod)) reasons.push(`replay-lod-${index}`);
    for (const id of specification.assetIds) {
      if (!String(sample.textureSources).includes(`${id}:${expectedSource}`) || !String(sample.textureReceipt).includes(`${id}:ready:${expectedSource}:`) || !String(sample.textureReceipt).includes("quality=passed")) reasons.push(`replay-texture-${index}-${id}`);
    }
    if (nasaSmallBody && smallBodyOverlay) {
      const expectedModel = smallBodyOverlay.model.lods[mobile ? 1 : 0];
      const expectedReconstruction = specification.body === "eros" ? "watertight-topology-paired" : "not-applicable";
      if (
        sample.assetOverlaySha256 !== smallBodyOverlay.receiptSha256
          || sample.modelLodReceiptSha256 !== smallBodyOverlay.modelLodReceiptSha256
          || sample.modelStatus !== "ready"
          || sample.modelLod !== String(expectedModel.lod)
          || sample.modelSha256 !== expectedModel.sha256
          || !(sample.modelGpuBytes > 0)
          || sample.sourceDetailCeiling !== smallBodyOverlay.model.sourceDetailCeiling
          || sample.printableSplitReconstruction !== expectedReconstruction
          || sample.microtexturePolicy !== smallBodyManifestEntry.microtexturePolicy
          || sample.microtextureSourceOverlaySha256 !== bennuOverlay.receiptSha256
          || sample.microtextureExactByteReuse !== true
          || sample.measuredPhotometryClaim !== false
          || sample.proceduralFallback !== false
          || sample.scientificPayloadMutation !== false
      ) reasons.push(`replay-small-body-contract-${index}`);
    }
    if (venus && (
      sample.assetOverlaySha256 !== venusOverlay.receiptSha256
      || sample.surfaceSource !== "nasa-jpl-magellan-0e-90e-270e-clean-global-views-derived-equirectangular"
      || sample.cloudModel !== "deterministic-physical-inspired-primary-not-observation-texture"
      || sample.cloudObservationTextureClaim !== false
      || sample.measuredTopographyClaim !== false
      || sample.opticalColorClaim !== false
      || sample.proceduralFallback !== false
      || sample.scientificPayloadMutation !== false
    )) reasons.push(`replay-venus-contract-${index}`);
    if (tempel1) {
      const expectedModel = tempel1Overlay.model.lods[mobile ? 1 : 0];
      if (
        sample.assetOverlaySha256 !== tempel1Overlay.receiptSha256
          || sample.modelLodReceiptSha256 !== tempel1Overlay.modelLodReceiptSha256
          || sample.modelStatus !== "ready"
          || sample.modelLod !== String(expectedModel.lod)
          || sample.modelSha256 !== expectedModel.sha256
          || !(sample.modelGpuBytes > 0)
          || sample.sourceDetailCeiling !== tempel1Overlay.model.sourceDetailCeiling
          || sample.observationDataset !== "DIF-C-HRIV/ITS/MRI-5-TEMPEL1-SHAPE-V2.0"
          || sample.observedCoverageFraction !== 0.8043214699074074
          || sample.unobservedAreaPolicy !== "cc0-regolith-presentation-substrate-never-observation"
          || sample.microtextureSourceOverlaySha256 !== bennuOverlay.receiptSha256
          || sample.microtextureExactByteReuse !== true
          || sample.tailPolicy !== "fixed-seed-dust-anti-solar-ion-velocity-presentation-only"
          || sample.tailVisible !== (sample.mode === "cinematic")
          || sample.measuredPhotometryClaim !== false
          || sample.proceduralFallback !== false
          || sample.scientificPayloadMutation !== false
      ) reasons.push(`replay-tempel1-contract-${index}`);
    }
    if (ceres) {
      const expectedModel = ceresOverlay.model.lods[mobile ? 1 : 0];
      if (
        sample.assetOverlaySha256 !== ceresOverlay.receiptSha256
          || sample.modelLodReceiptSha256 !== ceresOverlay.modelLodReceiptSha256
          || sample.modelStatus !== "ready"
          || sample.modelLod !== String(expectedModel.lod)
          || sample.modelSha256 !== expectedModel.sha256
          || !(sample.modelGpuBytes > 0)
          || sample.sourceDetailCeiling !== ceresOverlay.model.sourceDetailCeiling
          || sample.observationGrid !== "2222x1111-pds-dawn-spc-relative-albedo-and-radius"
          || sample.radiusRangeMeters !== "442618.25:486849.59375"
          || sample.microtexturePolicy !== "poly-haven-cc0-exact-byte-reuse-presentation-only-not-ceres-observation"
          || sample.microtextureSourceOverlaySha256 !== bennuOverlay.receiptSha256
          || sample.microtextureExactByteReuse !== true
          || sample.reflectance !== "rough-oren-nayar-bounded-opposition-no-glossy-specular"
          || sample.opticalColorClaim !== false
          || sample.syntheticDetailAdded !== false
          || sample.measuredPhotometryClaim !== false
          || sample.proceduralFallback !== false
          || sample.scientificPayloadMutation !== false
      ) reasons.push(`replay-ceres-contract-${index}`);
    }
  }
  if (new Set((receipt.orderedReplay ?? []).map((sample) => sample.payloadSha256)).size !== 1) reasons.push("payload-replay");
  if (receipt.errorAudit?.pageConsoleWarnings !== 0 || receipt.errorAudit?.pageConsoleErrors !== 0) reasons.push("console");
  if (receipt.releaseAudit?.candidateResources !== 0 || receipt.releaseAudit?.candidateBytes !== 0 || receipt.releaseAudit?.candidateSceneNodes !== 0 || receipt.releaseAudit?.candidateProgramDelta !== 0 || receipt.releaseAudit?.rendererTextureDelta !== 0 || receipt.releaseAudit?.registryStatus !== "baseline" || receipt.releaseAudit?.status !== "released-zero") reasons.push("release-zero");
  const screenshotPhases = (receipt.screenshots ?? []).map((entry) => `${entry.path.includes("desktop") ? "desktop" : "mobile"}-${entry.path.includes("cinematic") ? "cinematic" : "science"}`);
  if (screenshotPhases.length !== 4 || new Set(screenshotPhases).size !== 4 || !phases.slice(0, 4).every((phase) => screenshotPhases.includes(phase))) reasons.push("screenshot-cardinality");
  for (const screenshot of receipt.screenshots ?? []) {
    const path = resolve(root, screenshot.path);
    if (!existsSync(path)) { reasons.push(`screenshot-missing:${screenshot.path}`); continue; }
    const bytes = readFileSync(path);
    const dimensions = pngDimensions(bytes);
    const desktop = screenshot.path.includes("desktop");
    if (bytes.byteLength !== screenshot.bytes || sha256(bytes) !== screenshot.sha256 || !dimensions || dimensions.width !== screenshot.width || dimensions.height !== screenshot.height || dimensions.width !== (desktop ? 1440 : 390) || dimensions.height !== (desktop ? 900 : 844)) reasons.push(`screenshot-drift:${screenshot.path}`);
  }
  return { status: reasons.length === 0 ? "passed" : "blocked", receiptSha256: receipt.receiptSha256, reasons };
}
const sunBrowserGate = browserEvidenceStatus(sunBrowser, {
  body: "sun",
  version: "v591-sun-browser-qualification-v1",
  status: "sun-slice-passed-global-visual-matrix-pending",
  assetIds: ["sun-photosphere", "sun-chromosphere"],
  desktopLod: "8192x4096",
  mobileLod: "2048x1024",
});
const earthBrowserGate = browserEvidenceStatus(earthBrowser, {
  body: "earth",
  version: "v591-earth-browser-qualification-v1",
  status: "earth-slice-passed-global-visual-matrix-pending",
  assetIds: ["earth-albedo", "earth-normal", "earth-roughness", "earth-clouds", "earth-cloud-alpha", "earth-night", "earth-night-mask"],
  desktopLod: "8192x4096",
  mobileLod: "2048x1024",
  desktopSource: "ktx2",
  mobileSource: "full-raster",
});
const mercuryBrowserGate = browserEvidenceStatus(mercuryBrowser, {
  body: "mercury",
  version: "v591-mercury-browser-qualification-v1",
  status: "mercury-slice-passed-global-visual-matrix-pending",
  assetIds: ["mercury-albedo", "mercury-normal", "mercury-roughness", "mercury-height"],
  desktopLod: "4096x2048",
  mobileLod: "2048x1024",
  frameFits: true,
});
const venusBrowserGate = browserEvidenceStatus(venusBrowser, {
  body: "venus",
  version: "v591-venus-browser-qualification-v1",
  status: "venus-slice-passed-global-visual-matrix-pending",
  assetIds: ["venus-surface", "venus-normal", "venus-roughness", "venus-height"],
  desktopLod: "4096x2048",
  mobileLod: "2048x1024",
  frameFits: true,
});
const moonBrowserGate = browserEvidenceStatus(moonBrowser, {
  body: "moon",
  version: "v591-moon-browser-qualification-v2",
  status: "moon-slice-passed-global-visual-matrix-pending",
  assetIds: ["moon-albedo", "moon-normal", "moon-roughness", "moon-height"],
  desktopLod: "8192x4096",
  mobileLod: "2048x1024",
});
const marsBrowserGate = browserEvidenceStatus(marsBrowser, {
  body: "mars",
  version: "v591-mars-browser-qualification-v1",
  status: "mars-slice-passed-global-visual-matrix-pending",
  assetIds: ["mars-albedo", "mars-normal", "mars-roughness", "mars-height"],
  desktopLod: "8192x4096",
  mobileLod: "2048x1024",
  frameFits: true,
});
const jupiterBrowserGate = browserEvidenceStatus(jupiterBrowser, {
  body: "jupiter",
  version: "v591-jupiter-browser-qualification-v1",
  status: "jupiter-slice-passed-global-visual-matrix-pending",
  assetIds: ["jupiter-albedo", "jupiter-band-mask", "jupiter-storm-mask"],
  desktopLod: "4096x2048",
  mobileLod: "2048x1024",
  frameFits: true,
});
const saturnBrowserGate = browserEvidenceStatus(saturnBrowser, {
  body: "saturn",
  version: "v591-saturn-browser-qualification-v1",
  status: "saturn-slice-passed-global-visual-matrix-pending",
  assetIds: ["saturn-atmosphere-albedo", "saturn-band-mask", "saturn-polar-detail", "saturn-ring-color", "saturn-ring-optical-depth"],
  desktopLod: "8192x4096",
  mobileLod: "2048x1024",
});
const bennuBrowserGate = browserEvidenceStatus(bennuBrowser, {
  body: "bennu",
  version: "v591-bennu-browser-qualification-v1",
  status: "bennu-slice-passed-global-visual-matrix-pending",
  assetIds: ["bennu-regolith-albedo", "bennu-regolith-normal", "bennu-regolith-roughness"],
  desktopLod: "model-lod0;micro=4096x4096",
  mobileLod: "model-lod1;micro=2048x2048",
  frameFits: true,
});
const vestaBrowserGate = browserEvidenceStatus(vestaBrowser, {
  body: "vesta",
  version: "v591-vesta-browser-qualification-v1",
  status: "vesta-slice-passed-global-visual-matrix-pending",
  assetIds: ["bennu-regolith-albedo", "bennu-regolith-normal", "bennu-regolith-roughness"],
  desktopLod: "model-lod0;micro=4096x4096",
  mobileLod: "model-lod1;micro=2048x2048",
});
const erosBrowserGate = browserEvidenceStatus(erosBrowser, {
  body: "eros",
  version: "v591-nasa-small-body-browser-qualification-v1",
  status: "eros-slice-passed-global-visual-matrix-pending",
  assetIds: ["bennu-regolith-albedo", "bennu-regolith-normal", "bennu-regolith-roughness"],
  desktopLod: "model-lod0;micro=4096x4096",
  mobileLod: "model-lod1;micro=2048x2048",
  frameFits: true,
});
const kleopatraBrowserGate = browserEvidenceStatus(kleopatraBrowser, {
  body: "kleopatra",
  version: "v591-nasa-small-body-browser-qualification-v1",
  status: "kleopatra-slice-passed-global-visual-matrix-pending",
  assetIds: ["bennu-regolith-albedo", "bennu-regolith-normal", "bennu-regolith-roughness"],
  desktopLod: "model-lod0;micro=4096x4096",
  mobileLod: "model-lod1;micro=2048x2048",
  frameFits: true,
});
const tempel1BrowserGate = browserEvidenceStatus(tempel1Browser, {
  body: "tempel-1",
  version: "v591-tempel1-browser-qualification-v1",
  status: "tempel-1-slice-passed-global-visual-matrix-pending",
  assetIds: ["tempel-1-observation", "tempel-1-observation-mask", "bennu-regolith-albedo", "bennu-regolith-normal", "bennu-regolith-roughness"],
  desktopLod: "model-lod0;observation=2880x1440",
  mobileLod: "model-lod1;observation=1440x720",
  frameFits: true,
});
const ceresBrowserGate = browserEvidenceStatus(ceresBrowser, {
  body: "ceres",
  version: "v591-ceres-browser-qualification-v1",
  status: "ceres-slice-passed-global-visual-matrix-pending",
  assetIds: ["ceres-albedo", "ceres-normal", "ceres-roughness", "ceres-height", "bennu-regolith-albedo", "bennu-regolith-normal", "bennu-regolith-roughness"],
  desktopLod: "model-lod0;macro=4096x2048",
  mobileLod: "model-lod1;macro=2048x1024",
  frameFits: true,
});
const uranusBrowserGate = browserEvidenceStatus(uranusBrowser, {
  body: "uranus",
  version: "v591-ice-giant-browser-qualification-v1",
  status: "uranus-slice-passed-global-visual-matrix-pending",
  assetIds: ["ice-giant-flow-primary"],
  desktopLod: "analytical-primary-192x96",
  mobileLod: "analytical-primary-96x48",
  desktopSource: "procedural-primary",
  mobileSource: "procedural-primary",
  loaderLane: "v591",
  prewarm: "not-applicable-procedural-primary",
  frameFits: true,
  proceduralPrimary: true,
});
const neptuneBrowserGate = browserEvidenceStatus(neptuneBrowser, {
  body: "neptune",
  version: "v591-ice-giant-browser-qualification-v1",
  status: "neptune-slice-passed-global-visual-matrix-pending",
  assetIds: ["ice-giant-flow-primary"],
  desktopLod: "analytical-primary-192x96",
  mobileLod: "analytical-primary-96x48",
  desktopSource: "procedural-primary",
  mobileSource: "procedural-primary",
  loaderLane: "v591",
  prewarm: "not-applicable-procedural-primary",
  frameFits: true,
  proceduralPrimary: true,
});
const browserEvidence = Object.freeze({
  sun: sunBrowserGate,
  earth: earthBrowserGate,
  mercury: mercuryBrowserGate,
  venus: venusBrowserGate,
  moon: moonBrowserGate,
  mars: marsBrowserGate,
  jupiter: jupiterBrowserGate,
  saturn: saturnBrowserGate,
  vesta: vestaBrowserGate,
  bennu: bennuBrowserGate,
  eros: erosBrowserGate,
  kleopatra: kleopatraBrowserGate,
  "tempel-1": tempel1BrowserGate,
  ceres: ceresBrowserGate,
  uranus: uranusBrowserGate,
  neptune: neptuneBrowserGate,
});
function deepSpaceBrowserEvidenceStatus(receipt) {
  const reasons = [];
  const expected = [
    ["desktop-cinematic-overview", "overview", "cinematic", "desktop", 3, "orion-nebula,lagoon-nebula,eagle-nebula"],
    ["desktop-cinematic-orion", "orion-nebula", "cinematic", "desktop", 1, "orion-nebula"],
    ["desktop-cinematic-lagoon", "lagoon-nebula", "cinematic", "desktop", 1, "lagoon-nebula"],
    ["desktop-cinematic-eagle", "eagle-nebula", "cinematic", "desktop", 1, "eagle-nebula"],
    ["desktop-cinematic-helix", "helix-nebula", "cinematic", "desktop", 1, "helix-nebula"],
    ["desktop-cinematic-veil", "veil-nebula", "cinematic", "desktop", 1, "veil-nebula"],
    ["desktop-cinematic-north-america", "north-america-nebula", "cinematic", "desktop", 1, "north-america-nebula"],
    ["desktop-science-overview", "overview", "science", "desktop", 0, "none"],
    ["mobile-cinematic-veil", "veil-nebula", "cinematic", "mobile", 1, "veil-nebula"],
    ["mobile-science-veil", "veil-nebula", "science", "mobile", 0, "none"],
  ];
  const standaloneReceiptPath = resolve(root, "dist/release/atlas-v591-standalone-build-resource.json");
  const standaloneBuildIdPath = resolve(root, ".next-atlas-v591-standalone-current/BUILD_ID");
  if (receipt.version !== "v591-deep-space-browser-qualification-v1" || receipt.status !== "six-nebula-runtime-slices-passed-global-visual-matrix-pending" || receipt.route !== "/local-shadow-v591") reasons.push("receipt-status");
  if (existsSync(standaloneReceiptPath) && existsSync(standaloneBuildIdPath)) {
    const bytes = readFileSync(standaloneReceiptPath);
    const build = JSON.parse(bytes.toString("utf8"));
    const buildId = readFileSync(standaloneBuildIdPath, "utf8").trim();
    if (receipt.build?.manifestSha256 !== manifest.manifestSha256 || receipt.build?.sourceManifestSha256 !== sourceManifest.receiptSha256 || receipt.build?.standaloneBuildId !== buildId || receipt.build?.standaloneBuildId !== build.buildId || receipt.build?.standaloneReceiptSha256 !== sha256(bytes) || receipt.build?.pageBuildFingerprint !== expectedPageBuildFingerprint || receipt.build?.deliveryTier !== expectedPageDeliveryTier) reasons.push("build-identity");
  } else reasons.push("build-missing");
  if (receipt.overlay?.sha256 !== nebulaAssetOverlay.receiptSha256 || receipt.overlay?.status !== "6-of-6-runtime-admitted" || receipt.overlay?.admittedCount !== 6 || receipt.overlay?.blockedCount !== 0 || receipt.overlay?.sourceIds?.join(",") !== nebulaAssetOverlay.assets.map((asset) => `${asset.id}:${asset.nasaId}`).join(",")) reasons.push("overlay-identity");
  if (receipt.runtime?.canvasCount !== 1 || receipt.runtime?.desktopOverview !== "3-requested-3-ready-0-blocked" || receipt.runtime?.sixFocusedNebulae !== "6-of-6-one-requested-one-ready-0-blocked" || receipt.runtime?.scienceImagery !== "0-requested-0-ready" || receipt.runtime?.mobileVeil !== "1-requested-1-ready-0-blocked" || receipt.runtime?.scientificPayloadSha256 !== manifest.boundaries.scientificPayloadSha256 || receipt.runtime?.scientificPayloadStableAcrossModesAndDeviceTiers !== true || receipt.runtime?.scientificWriteback !== false || receipt.runtime?.presentationOnly !== true) reasons.push("runtime-contract");
  if (!Array.isArray(receipt.orderedReplay) || receipt.orderedReplay.length !== expected.length) reasons.push("replay-count");
  for (const [index, row] of (receipt.orderedReplay ?? []).entries()) {
    const specification = expected[index];
    if (!specification) { reasons.push(`replay-extra-${index}`); continue; }
    const [phase, focus, mode, device, count, ids] = specification;
    if (row.sequence !== index || row.phase !== phase || row.focusTarget !== focus || row.mode !== mode || row.deviceTier !== device || row.viewport !== (device === "mobile" ? "390x844" : "1440x900")) reasons.push(`replay-order-${index}`);
    if (row.pageSourceManifestSha256 !== expectedPageSourceManifestSha256 || row.pageDeliveryTier !== expectedPageDeliveryTier || row.pageBuildFingerprint !== expectedPageBuildFingerprint) reasons.push(`replay-build-${index}`);
    if (row.canvasCount !== 1 || row.singleCanvas !== true || row.deepSpaceStatus !== "ready" || row.skyStatus !== "ready" || row.starStatus !== "ready" || row.constellationStatus !== "ready") reasons.push(`replay-runtime-${index}`);
    if (row.admittedCount !== 6 || row.blockedCount !== 0 || row.blockedIds !== "" || row.requestedImpostorCount !== count || row.readyImpostorCount !== count || row.runtimeBlockedImpostorCount !== 0 || row.requestedIds !== ids || row.readyIds !== (count > 0 ? ids : "none")) reasons.push(`replay-nebula-${index}`);
    if (row.nebulaStatus !== (mode === "science" ? "science-marker-only" : "ready")) reasons.push(`replay-policy-${index}`);
    if (row.fpsMedian < 45 || row.fpsSampleCount < 120 || row.drawCalls > 90 || row.gpuBytes > (device === "mobile" ? 201326592 : 536870912)) reasons.push(`replay-budget-${index}`);
    if (row.scientificPayloadSha256 !== manifest.boundaries.scientificPayloadSha256 || row.scientificWriteback !== "false") reasons.push(`replay-science-${index}`);
  }
  if (receipt.errorAudit?.pageConsoleWarnings !== 0 || receipt.errorAudit?.pageConsoleErrors !== 0 || receipt.errorAudit?.status !== "passed") reasons.push("console");
  if (receipt.releaseAudit?.candidateResources !== 0 || receipt.releaseAudit?.candidateBytes !== 0 || receipt.releaseAudit?.candidateSceneNodes !== 0 || receipt.releaseAudit?.candidateProgramDelta !== 0 || receipt.releaseAudit?.rendererTextureDelta !== 0 || receipt.releaseAudit?.registryStatus !== "baseline" || receipt.releaseAudit?.status !== "released-zero") reasons.push("release-zero");
  if (!Array.isArray(receipt.screenshots) || receipt.screenshots.length !== 4) reasons.push("screenshot-count");
  for (const screenshot of receipt.screenshots ?? []) {
    const path = resolve(root, screenshot.path);
    if (!existsSync(path)) { reasons.push(`screenshot-missing:${screenshot.path}`); continue; }
    const bytes = readFileSync(path);
    const dimensions = pngDimensions(bytes);
    if (bytes.byteLength !== screenshot.bytes || sha256(bytes) !== screenshot.sha256 || !dimensions || dimensions.width !== screenshot.width || dimensions.height !== screenshot.height) reasons.push(`screenshot-drift:${screenshot.path}`);
  }
  return { status: reasons.length === 0 ? "passed" : "blocked", receiptSha256: receipt.receiptSha256, reasons };
}
const deepSpaceBrowserEvidence = deepSpaceBrowserEvidenceStatus(deepSpaceBrowser);
const heroBrowserSlicesPassed = Object.values(browserEvidence).every((gate) => gate.status === "passed");
const deepSpaceBrowserPassed = deepSpaceBrowserEvidence.status === "passed";
const browserSlicesPassed = heroBrowserSlicesPassed && deepSpaceBrowserPassed;
if (
  manifest.version !== "v591-celestial-convergence-candidate-v1"
  || manifest.boundaries.formalProductPointer !== "v263"
  || manifest.boundaries.scientificPayloadWriteback !== false
  || manifest.boundaries.scientificAuthorityChanged !== false
  || manifest.boundaries.singleCanvasRequired !== true
  || manifest.boundaries.productionPromotionAllowed !== false
  || manifest.runtime.v591HeroOverrideCount !== 16
  || manifest.runtime.v591HeroOverrideBodies?.join(",") !== "sun,earth,mercury,venus,moon,mars,jupiter,saturn,vesta,bennu,eros,kleopatra,tempel-1,ceres,uranus,neptune"
  || manifest.heroBodies.sun?.v591OverrideStatus !== "admitted"
  || manifest.heroBodies.sun?.effectiveStatus !== "admitted"
  || manifest.heroBodies.earth?.v591OverrideStatus !== "admitted"
  || manifest.heroBodies.earth?.effectiveStatus !== "admitted"
  || manifest.heroBodies.mercury?.v591OverrideStatus !== "admitted"
  || manifest.heroBodies.mercury?.effectiveStatus !== "admitted"
  || manifest.heroBodies.venus?.v591OverrideStatus !== "admitted"
  || manifest.heroBodies.venus?.effectiveStatus !== "admitted"
  || manifest.heroBodies.moon?.v591OverrideStatus !== "admitted"
  || manifest.heroBodies.moon?.effectiveStatus !== "admitted"
  || manifest.heroBodies.mars?.v591OverrideStatus !== "admitted"
  || manifest.heroBodies.mars?.effectiveStatus !== "admitted"
  || manifest.heroBodies.jupiter?.v591OverrideStatus !== "admitted"
  || manifest.heroBodies.jupiter?.effectiveStatus !== "admitted"
  || manifest.heroBodies.saturn?.v591OverrideStatus !== "admitted"
  || manifest.heroBodies.saturn?.effectiveStatus !== "admitted"
  || manifest.heroBodies.vesta?.v591OverrideStatus !== "admitted"
  || manifest.heroBodies.vesta?.effectiveStatus !== "admitted"
  || manifest.heroBodies.bennu?.v591OverrideStatus !== "admitted"
  || manifest.heroBodies.bennu?.effectiveStatus !== "admitted"
  || manifest.heroBodies.eros?.v591OverrideStatus !== "admitted"
  || manifest.heroBodies.eros?.effectiveStatus !== "admitted"
  || manifest.heroBodies.kleopatra?.v591OverrideStatus !== "admitted"
  || manifest.heroBodies.kleopatra?.effectiveStatus !== "admitted"
  || manifest.heroBodies["tempel-1"]?.v591OverrideStatus !== "admitted"
  || manifest.heroBodies["tempel-1"]?.effectiveStatus !== "admitted"
  || manifest.heroBodies.ceres?.v591OverrideStatus !== "admitted"
  || manifest.heroBodies.ceres?.effectiveStatus !== "admitted"
  || manifest.heroBodies.uranus?.v591OverrideStatus !== "admitted"
  || manifest.heroBodies.uranus?.effectiveStatus !== "admitted"
  || manifest.heroBodies.neptune?.v591OverrideStatus !== "admitted"
  || manifest.heroBodies.neptune?.effectiveStatus !== "admitted"
  || manifest.heroAssetOverlays?.length !== 16
  || manifest.heroAssetOverlays[0]?.body !== "sun"
  || manifest.heroAssetOverlays[1]?.body !== "earth"
  || manifest.heroAssetOverlays[2]?.body !== "mercury"
  || manifest.heroAssetOverlays[3]?.body !== "venus"
  || manifest.heroAssetOverlays[4]?.body !== "moon"
  || manifest.heroAssetOverlays[5]?.body !== "mars"
  || manifest.heroAssetOverlays[6]?.body !== "jupiter"
  || manifest.heroAssetOverlays[7]?.body !== "saturn"
  || manifest.heroAssetOverlays[8]?.body !== "vesta"
  || manifest.heroAssetOverlays[9]?.body !== "bennu"
  || manifest.heroAssetOverlays[10]?.body !== "eros"
  || manifest.heroAssetOverlays[11]?.body !== "kleopatra"
  || manifest.heroAssetOverlays[12]?.body !== "tempel-1"
  || manifest.heroAssetOverlays[13]?.body !== "ceres"
  || manifest.heroAssetOverlays[14]?.body !== "uranus"
  || manifest.heroAssetOverlays[15]?.body !== "neptune"
  || manifest.heroAssetOverlays[1]?.overlaySha256 !== earthOverlay.receiptSha256
  || manifest.heroAssetOverlays[2]?.overlaySha256 !== mercuryOverlay.receiptSha256
  || manifest.heroAssetOverlays[3]?.overlaySha256 !== venusOverlay.receiptSha256
  || manifest.heroAssetOverlays[4]?.overlaySha256 !== moonOverlay.receiptSha256
  || manifest.heroAssetOverlays[5]?.overlaySha256 !== marsOverlay.receiptSha256
  || manifest.heroAssetOverlays[6]?.overlaySha256 !== jupiterOverlay.receiptSha256
  || manifest.heroAssetOverlays[7]?.overlaySha256 !== saturnOverlay.receiptSha256
  || manifest.heroAssetOverlays[8]?.overlaySha256 !== vestaOverlay.receiptSha256
  || manifest.heroAssetOverlays[9]?.overlaySha256 !== bennuOverlay.receiptSha256
  || manifest.heroAssetOverlays[10]?.overlaySha256 !== erosOverlay.receiptSha256
  || manifest.heroAssetOverlays[11]?.overlaySha256 !== kleopatraOverlay.receiptSha256
  || manifest.heroAssetOverlays[12]?.overlaySha256 !== tempel1Overlay.receiptSha256
  || manifest.heroAssetOverlays[13]?.overlaySha256 !== ceresOverlay.receiptSha256
  || manifest.heroAssetOverlays[14]?.overlaySha256 !== iceGiantPrimaryOverlay.receiptSha256
  || manifest.heroAssetOverlays[15]?.overlaySha256 !== iceGiantPrimaryOverlay.receiptSha256
  || earthOverlay.baseline?.manifestSha256 !== manifest.baseline.manifestSha256
  || earthOverlay.noAssetBytesCopied !== true
  || mercuryOverlay.version !== "v591-mercury-asset-overlay-v1"
  || mercuryOverlay.noNetworkRequestsPerformed !== true
  || mercuryOverlay.exactByteV589AlbedoSourceReuse !== true
  || mercuryOverlay.derivationDeterministic !== true
  || mercuryOverlay.proceduralFallback !== false
  || mercuryOverlay.authorityState?.presentationOnly !== true
  || mercuryOverlay.authorityState?.scientificPayloadWriteback !== false
  || mercuryOverlay.assets?.length !== 4
  || venusOverlay.version !== "v591-venus-asset-overlay-v1"
  || !["venus-assets-derived-awaiting-runtime-admission", "venus-runtime-admitted"].includes(venusOverlay.status)
  || venusOverlay.noNetworkRequestsPerformed !== true
  || venusOverlay.derivationDeterministic !== true
  || venusOverlay.proceduralFallback !== false
  || venusOverlay.cloudModel?.observationTextureClaim !== false
  || venusOverlay.cloudModel?.resourceMissingFallback !== false
  || venusOverlay.authorityState?.presentationOnly !== true
  || venusOverlay.authorityState?.scientificPayloadWriteback !== false
  || venusOverlay.authorityState?.measuredAuthorityGranted !== false
  || venusOverlay.assets?.length !== 4
  || moonOverlay.authorityState?.presentationOnly !== true
  || moonOverlay.authorityState?.scientificPayloadWriteback !== false
  || moonOverlay.assets?.length !== 4
  || marsOverlay.version !== "v591-mars-asset-overlay-v3"
  || marsOverlay.status !== "mars-usgs-viking-color-mola-terrain-admitted"
  || marsOverlay.authorityState?.presentationOnly !== true
  || marsOverlay.authorityState?.scientificPayloadWriteback !== false
  || marsOverlay.proceduralFallback !== false
  || marsOverlay.blockers?.length !== 0
  || marsOverlay.assets?.length !== 4
  || jupiterOverlay.authorityState?.presentationOnly !== true
  || jupiterOverlay.authorityState?.scientificPayloadWriteback !== false
  || jupiterOverlay.proceduralFallback !== false
  || jupiterOverlay.assets?.length !== 3
  || saturnOverlay.authorityState?.presentationOnly !== true
  || saturnOverlay.authorityState?.scientificPayloadWriteback !== false
  || saturnOverlay.proceduralFallback !== false
  || saturnOverlay.assets?.length !== 5
  || vestaOverlay.authorityState?.presentationOnly !== true
  || vestaOverlay.authorityState?.scientificPayloadWriteback !== false
  || vestaOverlay.authorityState?.measuredPhotometryClaim !== false
  || vestaOverlay.proceduralFallback !== false
  || vestaOverlay.noTextureBytesCopied !== true
  || vestaOverlay.model?.candidate !== "v591-owned"
  || vestaOverlay.model?.lods?.length !== 3
  || vestaOverlay.microtextureReuse?.sourceOverlaySha256 !== bennuOverlay.receiptSha256
  || vestaOverlay.microtextureReuse?.assets?.length !== 3
  || bennuOverlay.authorityState?.presentationOnly !== true
  || bennuOverlay.authorityState?.scientificPayloadWriteback !== false
  || bennuOverlay.proceduralFallback !== false
  || bennuOverlay.noModelBytesCopied !== true
  || bennuOverlay.inheritedModel?.lods?.length !== 3
  || bennuOverlay.assets?.length !== 3
  || erosOverlay.version !== "v591-nasa-small-body-asset-overlay-v1"
  || erosOverlay.body !== "eros"
  || erosOverlay.authorityState?.presentationOnly !== true
  || erosOverlay.authorityState?.scientificPayloadWriteback !== false
  || erosOverlay.authorityState?.measuredPhotometryClaim !== false
  || erosOverlay.proceduralFallback !== false
  || erosOverlay.model?.watertight !== true
  || erosOverlay.model?.lods?.length !== 3
  || erosOverlay.model?.printableSplitReconstruction?.outputComponentCount !== 1
  || erosOverlay.model?.printableSplitReconstruction?.boundaryEdgeCount !== 0
  || erosOverlay.model?.printableSplitReconstruction?.nonManifoldEdgeCount !== 0
  || erosOverlay.microtextureReuse?.sourceOverlaySha256 !== bennuOverlay.receiptSha256
  || erosOverlay.microtextureReuse?.assets?.length !== 3
  || kleopatraOverlay.version !== "v591-nasa-small-body-asset-overlay-v1"
  || kleopatraOverlay.body !== "kleopatra"
  || kleopatraOverlay.authorityState?.presentationOnly !== true
  || kleopatraOverlay.authorityState?.scientificPayloadWriteback !== false
  || kleopatraOverlay.authorityState?.measuredPhotometryClaim !== false
  || kleopatraOverlay.proceduralFallback !== false
  || kleopatraOverlay.model?.watertight !== true
  || kleopatraOverlay.model?.sourceDetailCeiling !== "nasa-low-resolution-radar-shape-4092-triangles"
  || kleopatraOverlay.model?.lods?.[0]?.triangleCount !== 4092
  || kleopatraOverlay.model?.lods?.length !== 3
  || kleopatraOverlay.microtextureReuse?.sourceOverlaySha256 !== bennuOverlay.receiptSha256
  || kleopatraOverlay.microtextureReuse?.assets?.length !== 3
  || tempel1Overlay.version !== "v591-tempel-1-asset-overlay-v1"
  || !["tempel-1-assets-derived-awaiting-runtime-admission", "tempel-1-runtime-admitted"].includes(tempel1Overlay.status)
  || tempel1Overlay.authorityState?.presentationOnly !== true
  || tempel1Overlay.authorityState?.scientificPayloadWriteback !== false
  || tempel1Overlay.authorityState?.measuredPhotometryClaim !== false
  || tempel1Overlay.proceduralFallback !== false
  || tempel1Overlay.model?.watertight !== true
  || tempel1Overlay.model?.sourceDetailCeiling !== "pds-deep-impact-stardust-next-32040-triangles"
  || tempel1Overlay.model?.lods?.map((lod) => lod.triangleCount).join(",") !== "32040,8010,2002"
  || tempel1Overlay.observationMapping?.observedPixelFraction !== 0.8043214699074074
  || tempel1Overlay.observationMapping?.unobservedPixelsAreMeasuredDarkTerrain !== false
  || tempel1Overlay.microtextureReuse?.sourceOverlaySha256 !== bennuOverlay.receiptSha256
  || tempel1Overlay.microtextureReuse?.noTextureBytesCopied !== true
  || tempel1Overlay.microtextureReuse?.assets?.length !== 3
  || tempel1Overlay.assets?.length !== 2
  || ceresOverlay.version !== "v591-ceres-asset-overlay-v1"
  || !["ceres-assets-derived-awaiting-runtime-admission", "ceres-runtime-admitted"].includes(ceresOverlay.status)
  || ceresOverlay.body !== "ceres"
  || ceresOverlay.authorityState?.presentationOnly !== true
  || ceresOverlay.authorityState?.scientificPayloadWriteback !== false
  || ceresOverlay.authorityState?.measuredPhotometryClaim !== false
  || ceresOverlay.authorityState?.measuredAuthorityGranted !== false
  || ceresOverlay.proceduralFallback !== false
  || ceresOverlay.model?.watertight !== true
  || ceresOverlay.model?.sourceDetailCeiling !== "pds-dawn-spc-radius-2222x1111-261120-triangles"
  || ceresOverlay.model?.lods?.map((lod) => lod.triangleCount).join(",") !== "104448,24806,4960"
  || ceresOverlay.microtextureReuse?.sourceOverlaySha256 !== bennuOverlay.receiptSha256
  || ceresOverlay.microtextureReuse?.noTextureBytesCopied !== true
  || ceresOverlay.microtextureReuse?.assets?.length !== 3
  || ceresOverlay.materialPolicy?.opticalColorClaim !== false
  || ceresOverlay.materialPolicy?.syntheticDetailAdded !== false
  || ceresOverlay.assets?.length !== 4
  || ceresOverlay.blockers?.length !== 0
  || iceGiantPrimaryOverlay.version !== "v591-ice-giant-primary-overlay-v1"
  || iceGiantPrimaryOverlay.status !== "ice-giant-registered-primary-ready-for-runtime-admission"
  || iceGiantPrimaryOverlay.noNetworkRequestsPerformed !== true
  || iceGiantPrimaryOverlay.noTextureAssetsRequired !== true
  || iceGiantPrimaryOverlay.authorityState?.presentationOnly !== true
  || iceGiantPrimaryOverlay.authorityState?.scientificPayloadWriteback !== false
  || iceGiantPrimaryOverlay.bodies?.length !== 2
  || iceGiantPrimaryOverlay.bodies.some((body) => body.proceduralPrimary !== true || body.proceduralFallback !== false || body.observationTextureClaim !== false || body.measuredPhotometryClaim !== false)
  || nebulaAssetOverlay.version !== "v591-nebula-asset-overlay-v1"
  || nebulaAssetOverlay.status !== "6-of-6-runtime-admitted"
  || nebulaAssetOverlay.assets?.length !== 6
  || nebulaAssetOverlay.blocked?.length !== 0
  || nebulaAssetOverlay.policy?.science !== "marker-only-no-image-payload"
  || nebulaAssetOverlay.policy?.cinematic !== "verified-nasa-presentation-impostor-only"
  || nebulaAssetOverlay.policy?.fixedJ2000Directions !== true
  || nebulaAssetOverlay.policy?.noSyntheticReplacement !== true
  || nebulaAssetOverlay.authorityState?.scientificPayloadWriteback !== false
) throw new Error("v591-seal-boundary");

const ownedAssets = [...sunOverlay.assets, ...mercuryOverlay.assets, ...venusOverlay.assets, ...moonOverlay.assets, ...marsOverlay.assets, ...jupiterOverlay.assets, ...saturnOverlay.assets, ...bennuOverlay.assets, ...tempel1Overlay.assets, ...ceresOverlay.assets];
const tempel1ModelSource = { sourceSha256: tempel1Overlay.model.sourceSha256, sourceBytes: readFileSync(resolve(root, tempel1Overlay.model.sourcePath)).byteLength };
const sourceCacheBytes = sumUnique([...ownedAssets, ...nebulaAssetOverlay.assets], (asset) => asset.source.sha256, (asset) => asset.source.bytes)
  + sumUnique([vestaOverlay.model, erosOverlay.model, kleopatraOverlay.model, tempel1ModelSource], (model) => model.sourceSha256, (model) => model.sourceBytes);
const fullFiles = ownedAssets.flatMap((asset) => [
  asset.variants.desktopKtx2,
  asset.variants.desktopFallback,
  asset.variants.mobileKtx2,
  asset.variants.mobileFallback,
]);
const nebulaFullFiles = nebulaAssetOverlay.assets.flatMap((asset) => [asset.variants.desktopKtx2, asset.variants.desktopFallback, asset.variants.mobileKtx2, asset.variants.mobileFallback]);
const nebulaLiteFiles = nebulaAssetOverlay.assets.flatMap((asset) => [asset.variants.liteDesktop, asset.variants.liteMobile]);
const liteFiles = ownedAssets.flatMap((asset) => [asset.variants.liteDesktop, asset.variants.liteMobile]);
const vestaModelBytes = sumUnique(vestaOverlay.model.lods, (lod) => lod.sha256, (lod) => lod.bytes);
const nasaSmallBodyModelBytes = sumUnique([...erosOverlay.model.lods, ...kleopatraOverlay.model.lods], (lod) => lod.sha256, (lod) => lod.bytes);
const tempel1ModelBytes = sumUnique(tempel1Overlay.model.lods, (lod) => lod.sha256, (lod) => lod.bytes);
const ceresModelBytes = sumUnique(ceresOverlay.model.lods, (lod) => lod.sha256, (lod) => lod.bytes);
const fullCompressedBytes = sumUnique([...fullFiles, ...nebulaFullFiles], (file) => file.url, (file) => file.bytes) + vestaModelBytes + nasaSmallBodyModelBytes + tempel1ModelBytes + ceresModelBytes;
const liteIncrementBytes = sumUnique([...liteFiles, ...nebulaLiteFiles], (file) => file.url, (file) => file.bytes) + vestaModelBytes + nasaSmallBodyModelBytes + tempel1ModelBytes + ceresModelBytes;
const liteBase = readJson("public/atlas-lite/manifest.json");
if (liteBase.maxBytes !== manifest.budgets.liteTotalBytesMaximum) throw new Error("v591-lite-base-budget-identity");
const liteTotalBytes = liteBase.installedBytes + liteIncrementBytes;
const budgetChecks = {
  sourceCache: { actualBytes: sourceCacheBytes, maximumBytes: manifest.budgets.sourceCacheBytesMaximum, status: sourceCacheBytes <= manifest.budgets.sourceCacheBytesMaximum ? "passed" : "blocked" },
  fullCompressed: { actualBytes: fullCompressedBytes, maximumBytes: manifest.budgets.fullCompressedBytesMaximum, status: fullCompressedBytes <= manifest.budgets.fullCompressedBytesMaximum ? "passed" : "blocked" },
  liteIncrement: { actualBytes: liteIncrementBytes, maximumBytes: manifest.budgets.liteIncrementBytesMaximum, status: liteIncrementBytes <= manifest.budgets.liteIncrementBytesMaximum ? "passed" : "blocked" },
  liteTotal: { actualBytes: liteTotalBytes, baselineBytes: liteBase.installedBytes, maximumBytes: manifest.budgets.liteTotalBytesMaximum, status: liteTotalBytes <= manifest.budgets.liteTotalBytesMaximum ? "passed" : "blocked" },
};
const budgetDrift = Object.entries(budgetChecks).filter(([, check]) => check.status !== "passed").map(([budget, check]) => ({ budget, ...check }));
const forbiddenLitePrefixes = [
  Buffer.from("/textures/candidate-v591/sun/full/", "utf8"),
  Buffer.from("/textures/candidate-v591/mercury/full/", "utf8"),
  Buffer.from("/textures/candidate-v591/moon/full/", "utf8"),
  Buffer.from("/textures/candidate-v591/mars/full/", "utf8"),
  Buffer.from("/textures/candidate-v591/jupiter/full/", "utf8"),
  Buffer.from("/textures/candidate-v591/saturn/full/", "utf8"),
  Buffer.from("/textures/candidate-v591/bennu/full/", "utf8"),
  Buffer.from("/textures/candidate-v591/tempel-1/full/", "utf8"),
  Buffer.from("/textures/candidate-v591/ceres/full/", "utf8"),
  Buffer.from("/textures/candidate-v591/nebulae/full/", "utf8"),
];
const liteFullAssetLeaks = collectFiles(resolve(root, ".next-atlas-v591-lite-current")).filter((path) => {
  const normalized = path.replaceAll("\\", "/").toLowerCase();
  return ((normalized.includes("candidate-v591/sun/full/") || normalized.includes("candidate-v591/mercury/full/") || normalized.includes("candidate-v591/moon/full/") || normalized.includes("candidate-v591/mars/full/") || normalized.includes("candidate-v591/jupiter/full/") || normalized.includes("candidate-v591/saturn/full/") || normalized.includes("candidate-v591/bennu/full/") || normalized.includes("candidate-v591/tempel-1/full/") || normalized.includes("candidate-v591/ceres/full/") || normalized.includes("candidate-v591/nebulae/full/"))
      && (normalized.endsWith(".ktx2") || normalized.endsWith(".webp")))
    || forbiddenLitePrefixes.some((prefix) => readFileSync(path).includes(prefix));
}).map((path) => path.slice(root.length + 1).replaceAll("\\", "/"));
const litePackagingIsolation = {
  status: liteFullAssetLeaks.length === 0 ? "passed" : "blocked",
  fullAssetLeaks: liteFullAssetLeaks,
  policy: "v591-full-ktx2-webp-excluded-from-lite-dist",
};

const sourceChecks = sourceManifest.files.map((entry) => {
  const path = resolve(root, entry.path);
  const actualSha256 = existsSync(path) ? sha256(readFileSync(path)) : null;
  return { path: entry.path, expectedSha256: entry.sha256, actualSha256, status: actualSha256 === entry.sha256 ? "matched" : "drift" };
});
const sourceDrift = sourceChecks.filter((entry) => entry.status !== "matched");
const freezeChecks = freezeBefore.frozenSnapshot.map((entry) => {
  const path = resolve(root, entry.path);
  const actualSha256 = existsSync(path) ? sha256(readFileSync(path)) : null;
  const matched = actualSha256 === entry.expectedSha256;
  return { path: entry.path, expectedSha256: entry.expectedSha256, actualSha256, status: matched ? (actualSha256 === null ? "matched-missing" : "matched") : "drift" };
});
const freezeDrift = freezeChecks.filter((entry) => !["matched", "matched-missing"].includes(entry.status));

function evaluateBuildGate(kind, expectedDistDir, expectedDeliveryTier) {
  const receiptPath = `dist/release/atlas-v591-${kind}-build-resource.json`;
  if (!existsSync(resolve(root, receiptPath))) return { kind, status: "not-run", receiptPath, reasons: ["receipt-missing"] };
  try {
    const receiptBytes = readFileSync(resolve(root, receiptPath));
    const receipt = JSON.parse(receiptBytes.toString("utf8"));
    const buildProfilePath = resolve(root, expectedDistDir, "atlas-build-profile.json");
    const buildIdPath = resolve(root, expectedDistDir, "BUILD_ID");
    const buildProfile = existsSync(buildProfilePath) ? JSON.parse(readFileSync(buildProfilePath, "utf8")) : null;
    const buildId = existsSync(buildIdPath) ? readFileSync(buildIdPath, "utf8").trim() : null;
    const reasons = [];
    if (receipt.status !== "passed" || receipt.profile !== "local-shadow" || receipt.distDir !== expectedDistDir) reasons.push("receipt-profile-mismatch");
    if (receipt.deliveryTier !== expectedDeliveryTier) reasons.push("delivery-tier-mismatch");
    if (receipt.candidateSourceManifestSha256 !== sourceManifest.receiptSha256) reasons.push("source-manifest-mismatch");
    if (receipt.heapMb !== 8192 || receipt.lowMemoryMode !== true || receipt.standaloneTopologyQualified !== true) reasons.push("resource-policy-mismatch");
    if (receipt.browserStarted !== false || receipt.denseStarted !== false || receipt.gpuStarted !== false) reasons.push("forbidden-task-overlap");
    if (!buildProfile || buildProfile.buildId !== receipt.buildId || buildProfile.candidateSourceManifestSha256 !== sourceManifest.receiptSha256) reasons.push("build-profile-mismatch");
    if (!buildId || buildId !== receipt.buildId) reasons.push("build-id-mismatch");
    return {
      kind,
      status: reasons.length === 0 ? "passed" : "blocked",
      receiptPath,
      receiptSha256: sha256(receiptBytes),
      distDir: expectedDistDir,
      deliveryTier: expectedDeliveryTier,
      buildId: receipt.buildId ?? null,
      sourceManifestSha256: receipt.candidateSourceManifestSha256 ?? null,
      heapMb: receipt.heapMb ?? null,
      swcRuntime: receipt.swcRuntime?.mode ?? "unavailable",
      rollbackSlotAvailable: receipt.rollbackSlotAvailable === true,
      reasons,
    };
  } catch (error) {
    return { kind, status: "blocked", receiptPath, reasons: [error instanceof Error ? error.message : String(error)] };
  }
}

const standaloneBuild = evaluateBuildGate("standalone", ".next-atlas-v591-standalone-current", "standalone-full");
const liteBuild = evaluateBuildGate("lite", ".next-atlas-v591-lite-current", "vercel-lite");
function evaluateGlobalVisualMatrixGate(receipt) {
  if (!receipt) return { status: "not-run", receiptSha256: null, reasons: ["receipt-missing"] };
  const reasons = [];
  if (receipt.version !== "v591-global-visual-matrix-v1" || receipt.status !== "automated-global-visual-matrix-passed-human-signoff-pending" || receipt.route !== manifest.route) reasons.push("receipt-status");
  if (receipt.build?.manifestSha256 !== manifest.manifestSha256 || receipt.build?.sourceManifestSha256 !== sourceManifest.receiptSha256 || receipt.build?.standaloneBuildId !== standaloneBuild.buildId || receipt.build?.deliveryTier !== "standalone-full") reasons.push("build-identity");
  if (receipt.matrix?.phaseCount !== 10 || receipt.matrix?.heroBodies !== 16 || receipt.matrix?.heroScreenshots !== 64 || receipt.matrix?.sixNebulae !== "6/6-runtime-ready" || receipt.matrix?.constellations !== "88-catalog-484/484-gaia-anchors-rendered") reasons.push("matrix-coverage");
  if (!Array.isArray(receipt.samples) || receipt.samples.length !== 10 || !Array.isArray(receipt.screenshots) || receipt.screenshots.length !== 10) reasons.push("matrix-shape");
  if (!(receipt.performance?.minimumFps >= 45) || receipt.performance?.maximumDrawCalls > 90 || receipt.performance?.maximumGpuBytes > 536870912) reasons.push("performance-budget");
  if (receipt.authority?.scientificPayloadSha256 !== manifest.boundaries.scientificPayloadSha256 || receipt.authority?.payloadStableAcrossMatrix !== true || receipt.authority?.scientificWriteback !== false || receipt.authority?.formalProductPointer !== "v263") reasons.push("scientific-boundary");
  if (receipt.releaseAudit?.status !== "released-zero" || receipt.errorAudit?.status !== "passed" || receipt.candidateQualified !== false || receipt.productionReleaseAuthorized !== false) reasons.push("runtime-boundary");
  for (const screenshot of receipt.screenshots ?? []) {
    const path = resolve(root, screenshot.path ?? "");
    if (!existsSync(path)) { reasons.push(`screenshot-missing:${screenshot.path}`); continue; }
    const bytes = readFileSync(path);
    const dimensions = pngDimensions(bytes);
    if (bytes.byteLength !== screenshot.bytes || sha256(bytes) !== screenshot.sha256 || !dimensions || dimensions.width !== screenshot.width || dimensions.height !== screenshot.height) reasons.push(`screenshot-drift:${screenshot.path}`);
  }
  return { status: reasons.length === 0 ? "passed" : "blocked", receiptSha256: receipt.receiptSha256, reasons };
}
function evaluateBrowserSoakGate(receipt, matrixGate) {
  if (!receipt) return { status: "not-run", receiptSha256: null, reasons: ["receipt-missing"] };
  const reasons = [];
  if (receipt.version !== "v591-browser-soak-qualification-v1" || receipt.status !== "passed-30-minute-browser-soak" || receipt.route !== manifest.route) reasons.push("receipt-status");
  if (matrixGate.status !== "passed" || receipt.matrixReceiptSha256 !== globalVisualMatrix?.receiptSha256) reasons.push("matrix-chain");
  if (receipt.build?.manifestSha256 !== manifest.manifestSha256 || receipt.build?.sourceManifestSha256 !== sourceManifest.receiptSha256 || receipt.build?.standaloneBuildId !== standaloneBuild.buildId || receipt.build?.deliveryTier !== "standalone-full") reasons.push("build-identity");
  if (!(receipt.duration?.elapsedMs >= 1800000) || !(receipt.duration?.sampleCount >= 31) || receipt.duration?.maximumIntervalMs > 90000) reasons.push("duration");
  if (!(receipt.measurements?.minimumFps >= 55) || receipt.measurements?.maximumDrawCalls > 90 || receipt.measurements?.maximumGpuBytes > 536870912) reasons.push("performance-budget");
  if (receipt.authority?.scientificPayloadSha256 !== manifest.boundaries.scientificPayloadSha256 || receipt.authority?.payloadStable !== true || receipt.authority?.scientificWriteback !== false || receipt.authority?.formalProductPointer !== "v263") reasons.push("scientific-boundary");
  if (receipt.releaseAudit?.status !== "released-zero" || receipt.errorAudit?.status !== "passed" || receipt.productionReleaseAuthorized !== false) reasons.push("runtime-boundary");
  return { status: reasons.length === 0 ? "passed" : "blocked", receiptSha256: receipt.receiptSha256, reasons };
}
function evaluateHumanVisualSignoffGate(receipt, matrixGate, soakGate) {
  if (!receipt) return { status: "pending", receiptSha256: null, reasons: ["explicit-workspace-owner-signature-required"] };
  const reasons = [];
  if (receipt.version !== "v591-human-visual-signoff-v1" || receipt.status !== "approved-by-workspace-owner" || receipt.reviewer !== "workspace-owner" || Number.isNaN(Date.parse(receipt.signedAt))) reasons.push("signature");
  if (matrixGate.status !== "passed" || soakGate.status !== "passed" || receipt.evidence?.globalVisualMatrixReceiptSha256 !== globalVisualMatrix?.receiptSha256 || receipt.evidence?.browserSoakReceiptSha256 !== browserSoak?.receiptSha256) reasons.push("evidence-chain");
  if (receipt.candidate?.route !== manifest.route || receipt.candidate?.manifestSha256 !== manifest.manifestSha256 || receipt.candidate?.sourceManifestSha256 !== sourceManifest.receiptSha256 || receipt.candidate?.formalProductPointer !== "v263") reasons.push("candidate-identity");
  if (receipt.authority?.scientificPayloadWriteback !== false || receipt.authority?.scientificAuthorityChanged !== false || receipt.authority?.productionReleaseAuthorized !== false) reasons.push("authority-boundary");
  return { status: reasons.length === 0 ? "passed" : "blocked", receiptSha256: receipt.receiptSha256, reasons };
}
const globalVisualMatrixGate = evaluateGlobalVisualMatrixGate(globalVisualMatrix);
const browserSoakGate = evaluateBrowserSoakGate(browserSoak, globalVisualMatrixGate);
const humanVisualSignoffGate = evaluateHumanVisualSignoffGate(humanVisualSignoff, globalVisualMatrixGate, browserSoakGate);
const buildGatesPassed = standaloneBuild.status === "passed" && liteBuild.status === "passed";
const structuralPassed = sourceDrift.length === 0 && freezeDrift.length === 0 && freezeBefore.status === "passed";
const packagingPassed = budgetDrift.length === 0 && litePackagingIsolation.status === "passed";
const candidateGatesPassed = structuralPassed
  && buildGatesPassed
  && packagingPassed
  && browserSlicesPassed;
const automatedGatesPassed = candidateGatesPassed
  && globalVisualMatrixGate.status === "passed"
  && browserSoakGate.status === "passed";
const qualifiedCandidate = automatedGatesPassed && humanVisualSignoffGate.status === "passed";
const verificationStatus = !structuralPassed
  ? "seal-blocked-drift"
  : !packagingPassed
    ? "seal-blocked-packaging"
    : !buildGatesPassed
      ? "sealed-p2-sixteen-heroes-build-gates-pending"
      : !browserSlicesPassed
        ? "sealed-p2-sixteen-heroes-browser-slices-pending"
        : !automatedGatesPassed
          ? "sealed-automated-global-and-soak-gates-pending"
          : qualifiedCandidate
            ? "qualified-additive-3a-celestial-visual-candidate"
            : "automated-gates-passed-human-visual-signoff-pending";
const verification = writeSealed(resolve(docsRoot, "verification-receipt-v591.json"), {
  version: "v591-verification-receipt-v1",
  generatedAt,
  status: verificationStatus,
  manifestSha256: manifest.manifestSha256,
  baselineManifestSha256: manifest.baseline.manifestSha256,
  sourceChecks,
  freezeChecks,
  buildGates: { standalone: standaloneBuild, lite: liteBuild },
  browserEvidence,
  deepSpaceBrowserEvidence,
  globalVisualMatrixEvidence: globalVisualMatrixGate,
  browserSoakEvidence: browserSoakGate,
  humanVisualSignoffEvidence: humanVisualSignoffGate,
  budgetChecks,
  litePackagingIsolation,
  blockers: {
    sourceDrift,
    freezeDrift,
    budgetDrift,
    liteFullAssetLeaks,
    coreHeroOverrides: "6/6",
    allHeroOverrides: "16/16",
    nebulaAdmission: deepSpaceBrowserPassed ? "6/6-runtime-browser-ready" : "6/6-admitted-browser-pending",
    browserVisualMatrix: globalVisualMatrixGate.status,
    fps: globalVisualMatrixGate.status === "passed" ? "passed-preregistered-global-and-hero-thresholds" : "pending-global-matrix",
    soak30Minutes: browserSoakGate.status,
    humanVisualSignoff: humanVisualSignoffGate.status,
    productionRelease: "not-authorized",
  },
}, "receiptSha256");

const freezeAfter = writeSealed(resolve(docsRoot, "freeze-after-v591.json"), {
  version: "v591-frozen-boundary-after-v1",
  generatedAt,
  status: freezeDrift.length === 0 ? "frozen-surfaces-unchanged-after-v591-p2-sixteen-heroes" : "blocked-frozen-drift",
  beforeSnapshotSha256: freezeBefore.snapshotSha256,
  formalProductPointer: "v263",
  baselineCandidate: "v590-readonly",
  historicalEvidenceRewritten: false,
  scientificAuthorityChanged: false,
  frozenSnapshot: freezeBefore.frozenSnapshot,
  postBuildChecks: freezeChecks,
}, "snapshotSha256");

const baselineAdmitted = Object.entries(manifest.heroBodies).filter(([, state]) => state.baselineStatus === "admitted").map(([body]) => body);
const baselineBlocked = Object.entries(manifest.heroBodies).filter(([, state]) => state.baselineStatus !== "admitted").map(([body]) => body);
const overrideAdmitted = [...manifest.runtime.v591HeroOverrideBodies];
const effectiveAdmitted = [...overrideAdmitted];
const effectiveBlocked = Object.entries(manifest.heroBodies).filter(([, state]) => state.effectiveStatus !== "admitted").map(([body]) => body);
const capability = writeSealed(resolve(docsRoot, "capability-report-v591.json"), {
  version: "v591-celestial-convergence-capability-report-v1",
  generatedAt,
  status: qualifiedCandidate
    ? "qualified-additive-3a-celestial-visual-candidate"
    : automatedGatesPassed
      ? "automated-gates-passed-human-visual-signoff-pending"
      : candidateGatesPassed
        ? "implemented-core-with-automated-global-gates-pending"
        : "implemented-core-with-blocked-gates",
  candidate: {
    route: manifest.route,
    manifestSha256: manifest.manifestSha256,
    formalProductPointer: "v263",
    baseline: "v590-readonly",
    scientificPayloadWriteback: false,
  },
  capabilities: {
    namespaceIsolated: true,
    packageJsonMutationRequired: false,
    genericProxyCompatible: true,
    singleCanvas: true,
    runtimeBaseline: "v591-owned-composition-with-v590-readonly-layers",
    presentationOverlayOnly: false,
    v591HeroOverrideCount: manifest.runtime.v591HeroOverrideCount,
    v591HeroOverrideBodies: overrideAdmitted,
    sunAssetOverlaySha256: manifest.heroAssetOverlays[0].overlaySha256,
    sunMirroredHemisphereDisclosure: manifest.heroAssetOverlays[0].mirroredHemisphereDisclosure,
    earthAssetOverlaySha256: manifest.heroAssetOverlays[1].overlaySha256,
    earthExactByteReuse: manifest.heroAssetOverlays[1].noAssetBytesCopied,
    mercuryAssetOverlaySha256: manifest.heroAssetOverlays[2].overlaySha256,
    mercuryExactByteV589AlbedoReuse: manifest.heroAssetOverlays[2].exactByteV589AlbedoSourceReuse,
    mercuryFiniteRelief: manifest.heroAssetOverlays[2].finiteRelief,
    venusAssetOverlaySha256: manifest.heroAssetOverlays[3].overlaySha256,
    venusSourceReceiptSha256s: manifest.heroAssetOverlays[3].sourceReceiptSha256s,
    venusMeasuredTopographyClaim: manifest.heroAssetOverlays[3].measuredTopographyClaim,
    venusOpticalColorClaim: manifest.heroAssetOverlays[3].opticalColorClaim,
    moonAssetOverlaySha256: manifest.heroAssetOverlays[4].overlaySha256,
    moonFiniteRelief: manifest.heroAssetOverlays[4].finiteRelief,
    marsAssetOverlaySha256: manifest.heroAssetOverlays[5].overlaySha256,
    marsAdmission: manifest.heroAssetOverlays[5].status,
    marsAlbedoDetailCeiling: manifest.heroAssetOverlays[5].albedoDetailCeiling,
    marsCompositeRejected: true,
    jupiterAssetOverlaySha256: manifest.heroAssetOverlays[6].overlaySha256,
    jupiterSpecularLobe: manifest.heroAssetOverlays[6].specularLobe,
    saturnAssetOverlaySha256: manifest.heroAssetOverlays[7].overlaySha256,
    saturnRadialUv: manifest.heroAssetOverlays[7].radialUv,
    vestaAssetOverlaySha256: manifest.heroAssetOverlays[8].overlaySha256,
    vestaModelLodReceiptSha256: manifest.heroAssetOverlays[8].modelLodReceiptSha256,
    vestaNoTextureBytesCopied: manifest.heroAssetOverlays[8].noTextureBytesCopied,
    vestaMeasuredPhotometryClaim: manifest.heroAssetOverlays[8].measuredPhotometryClaim,
    bennuAssetOverlaySha256: manifest.heroAssetOverlays[9].overlaySha256,
    bennuModelLodReceiptSha256: manifest.heroAssetOverlays[9].inheritedModelLodReceiptSha256,
    bennuNoModelBytesCopied: manifest.heroAssetOverlays[9].noModelBytesCopied,
    erosAssetOverlaySha256: manifest.heroAssetOverlays[10].overlaySha256,
    erosModelLodReceiptSha256: manifest.heroAssetOverlays[10].modelLodReceiptSha256,
    erosPrintableSplitReconstruction: manifest.heroAssetOverlays[10].printableSplitReconstruction,
    erosSourceDetailCeiling: manifest.heroAssetOverlays[10].sourceDetailCeiling,
    kleopatraAssetOverlaySha256: manifest.heroAssetOverlays[11].overlaySha256,
    kleopatraModelLodReceiptSha256: manifest.heroAssetOverlays[11].modelLodReceiptSha256,
    kleopatraSourceDetailCeiling: manifest.heroAssetOverlays[11].sourceDetailCeiling,
    tempel1AssetOverlaySha256: manifest.heroAssetOverlays[12].overlaySha256,
    tempel1ModelLodReceiptSha256: manifest.heroAssetOverlays[12].modelLodReceiptSha256,
    tempel1ObservedCoverageFraction: manifest.heroAssetOverlays[12].observedCoverageFraction,
    tempel1UnobservedAreaPolicy: manifest.heroAssetOverlays[12].unobservedAreaPolicy,
    ceresAssetOverlaySha256: manifest.heroAssetOverlays[13].overlaySha256,
    ceresModelLodReceiptSha256: manifest.heroAssetOverlays[13].modelLodReceiptSha256,
    ceresSourceDetailCeiling: manifest.heroAssetOverlays[13].sourceDetailCeiling,
    ceresObservationGrid: manifest.heroAssetOverlays[13].observationGrid,
    ceresOpticalColorClaim: manifest.heroAssetOverlays[13].opticalColorClaim,
    ceresSyntheticDetailAdded: manifest.heroAssetOverlays[13].syntheticDetailAdded,
    iceGiantPrimaryOverlaySha256: iceGiantPrimaryOverlay.receiptSha256,
    iceGiantPrimaryBodies: iceGiantPrimaryOverlay.bodies.map((body) => body.body),
    iceGiantObservationTextureClaim: false,
    inheritedHeroAdmissions: baselineAdmitted,
    inheritedHeroBlocks: baselineBlocked,
    effectiveHeroAdmissions: effectiveAdmitted,
    constellationAnchors: "484/484-v591-owned-packet",
    constellationPacketVersion: constellationPacket.version,
    constellationPacketSha256: constellationPacket.packetSha256,
    constellationPacketFileSha256,
    constellationFrozenSourceFileSha256: constellationPacket.frozenSource.fileSha256,
    constellationFrozenBindingSha256: constellationPacket.frozenSource.bindingSha256,
    constellationUniqueGaiaSourceIdCount: constellationPacket.metrics.uniqueGaiaSourceIdCount,
    constellationMaximumAngularDistanceDeg: constellationPacket.metrics.maximumAngularDistanceDeg,
    constellationMedianAngularDistanceDeg: constellationPacket.metrics.medianAngularDistanceDeg,
    constellationThresholdDeg: constellationPacket.metrics.thresholdDeg,
    constellationLabelAtlasSha256: constellationPacket.labelAtlas.sha256,
    constellationLabelAtlasBytes: constellationPacket.labelAtlas.bytes,
    constellationRenderedTelemetryRequired: true,
    gaiaStarfield: "v590-readonly",
    buildGates: { standalone: standaloneBuild, lite: liteBuild },
    budgetChecks,
    litePackagingIsolation,
    browserEvidence,
    deepSpaceBrowserEvidence,
    globalVisualMatrixEvidence: globalVisualMatrixGate,
    browserSoakEvidence: browserSoakGate,
    humanVisualSignoffEvidence: humanVisualSignoffGate,
    frozenEntryCount: freezeChecks.length,
    sourceCount: sourceChecks.length,
    nebulaOverlaySha256: nebulaAssetOverlay.receiptSha256,
    nebulaAdmittedCount: nebulaAssetOverlay.assets.length,
    nebulaBlockedCount: nebulaAssetOverlay.blocked.length,
  },
  blockedGates: {
    p1CoreHeroOverrides: "passed:6/6",
    p2HeroOverrides: browserSlicesPassed ? "passed:10/10-mercury-venus-vesta-bennu-eros-kleopatra-tempel-1-ceres-uranus-neptune-runtime-and-browser-qualified" : "blocked:10/10-sixteen-hero-browser-slices-incomplete",
    allSixteenHeroAdmission: effectiveBlocked.length === 0 ? "passed:16/16-static-runtime-admission" : `blocked:${effectiveBlocked.join(",")}`,
    allSixNebulaAdmission: deepSpaceBrowserPassed ? "passed:6/6-runtime-browser-ready" : "blocked:6/6-admitted-runtime-browser-pending",
    v591StarOptics: "implemented-v591-gaia-deterministic-psf",
    v591DeepSpace: deepSpaceBrowserPassed ? "passed:6/6-runtime-browser-ready" : "implemented:6/6-browser-pending",
    v591Constellations: globalVisualMatrixGate.status === "passed" ? "passed:88-catalog-484/484-gaia-anchors-rendered-telemetry" : "admitted-v591-owned-packet-rendered-telemetry-pending",
    v591InstrumentUi: "architecture-first-instrument-shell",
    browserVisualMatrix: globalVisualMatrixGate.status,
    fps: globalVisualMatrixGate.status === "passed" ? "passed-preregistered-global-and-hero-thresholds" : "pending-global-matrix",
    soak30Minutes: browserSoakGate.status,
    humanVisualSignoff: humanVisualSignoffGate.status,
    standaloneBuild: standaloneBuild.status,
    liteBuild: liteBuild.status,
    productionRelease: "not-authorized",
  },
  evidence: {
    currentStateReceiptSha256: currentState.receiptSha256,
    verificationReceiptSha256: verification.receiptSha256,
    freezeAfterSha256: freezeAfter.snapshotSha256,
    sourceManifestSha256: sourceManifest.receiptSha256,
    sunBrowserReceiptSha256: sunBrowser.receiptSha256,
    earthBrowserReceiptSha256: earthBrowser.receiptSha256,
    mercuryBrowserReceiptSha256: mercuryBrowser.receiptSha256,
    venusBrowserReceiptSha256: venusBrowser.receiptSha256,
    moonBrowserReceiptSha256: moonBrowser.receiptSha256,
    marsBrowserReceiptSha256: marsBrowser.receiptSha256,
    jupiterBrowserReceiptSha256: jupiterBrowser.receiptSha256,
    saturnBrowserReceiptSha256: saturnBrowser.receiptSha256,
    vestaBrowserReceiptSha256: vestaBrowser.receiptSha256,
    bennuBrowserReceiptSha256: bennuBrowser.receiptSha256,
    erosBrowserReceiptSha256: erosBrowser.receiptSha256,
    kleopatraBrowserReceiptSha256: kleopatraBrowser.receiptSha256,
    tempel1BrowserReceiptSha256: tempel1Browser.receiptSha256,
    ceresBrowserReceiptSha256: ceresBrowser.receiptSha256,
    uranusBrowserReceiptSha256: uranusBrowser.receiptSha256,
    neptuneBrowserReceiptSha256: neptuneBrowser.receiptSha256,
    deepSpaceBrowserReceiptSha256: deepSpaceBrowser.receiptSha256,
    globalVisualMatrixReceiptSha256: globalVisualMatrixGate.receiptSha256,
    browserSoakReceiptSha256: browserSoakGate.receiptSha256,
    humanVisualSignoffReceiptSha256: humanVisualSignoffGate.receiptSha256,
  },
  releaseAuthorized: false,
}, "reportSha256");

const pointerPath = resolve(root, "dist/release/orbit-atlas-current-celestial-convergence-candidate-v591.json");
const priorPointer = verifySealed("dist/release/orbit-atlas-current-celestial-convergence-candidate-v591.json", "pointerSha256");
const pointerUnsigned = {
  ...priorPointer,
  status: qualifiedCandidate
    ? "qualified-additive-3a-celestial-visual-candidate"
    : automatedGatesPassed
      ? "automated-gates-passed-human-visual-signoff-pending"
      : candidateGatesPassed
        ? "additive-v591-automated-global-gates-pending"
        : "additive-v591-sealed-blocked",
  verificationReceiptSha256: verification.receiptSha256,
  freezeAfterSha256: freezeAfter.snapshotSha256,
  capabilityReportSha256: capability.reportSha256,
  sunBrowserReceiptSha256: sunBrowser.receiptSha256,
  earthBrowserReceiptSha256: earthBrowser.receiptSha256,
  mercuryBrowserReceiptSha256: mercuryBrowser.receiptSha256,
  venusBrowserReceiptSha256: venusBrowser.receiptSha256,
  moonBrowserReceiptSha256: moonBrowser.receiptSha256,
  marsBrowserReceiptSha256: marsBrowser.receiptSha256,
  jupiterBrowserReceiptSha256: jupiterBrowser.receiptSha256,
  saturnBrowserReceiptSha256: saturnBrowser.receiptSha256,
  vestaBrowserReceiptSha256: vestaBrowser.receiptSha256,
  bennuBrowserReceiptSha256: bennuBrowser.receiptSha256,
  erosBrowserReceiptSha256: erosBrowser.receiptSha256,
  kleopatraBrowserReceiptSha256: kleopatraBrowser.receiptSha256,
  tempel1BrowserReceiptSha256: tempel1Browser.receiptSha256,
  ceresBrowserReceiptSha256: ceresBrowser.receiptSha256,
  uranusBrowserReceiptSha256: uranusBrowser.receiptSha256,
  neptuneBrowserReceiptSha256: neptuneBrowser.receiptSha256,
  deepSpaceBrowserReceiptSha256: deepSpaceBrowser.receiptSha256,
  globalVisualMatrixReceiptSha256: globalVisualMatrixGate.receiptSha256,
  browserSoakReceiptSha256: browserSoakGate.receiptSha256,
  humanVisualSignoffReceiptSha256: humanVisualSignoffGate.receiptSha256,
};
delete pointerUnsigned.pointerSha256;
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha(pointerUnsigned) };
atomicWrite(pointerPath, `${JSON.stringify(pointer, null, 2)}\n`);

console.log(JSON.stringify({
  status: capability.status,
  manifestSha256: manifest.manifestSha256,
  sourceManifestSha256: sourceManifest.receiptSha256,
  verificationReceiptSha256: verification.receiptSha256,
  freezeAfterSha256: freezeAfter.snapshotSha256,
  capabilityReportSha256: capability.reportSha256,
  buildGates: { standalone: standaloneBuild.status, lite: liteBuild.status },
  automatedGates: { globalVisualMatrix: globalVisualMatrixGate.status, browserSoak30Minutes: browserSoakGate.status },
  humanVisualSignoff: humanVisualSignoffGate.status,
  frozenEntryCount: freezeChecks.length,
  formalProductPointer: "v263",
}, null, 2));
