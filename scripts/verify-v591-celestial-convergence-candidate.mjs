import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { derivePageBuildFingerprintV591 } from "./v591-page-build-identity.mjs";

const root = process.cwd();
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
const readJson = (relativePath) => JSON.parse(readFileSync(resolve(root, relativePath), "utf8"));
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function pngDimensions(bytes) {
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" || bytes.subarray(12, 16).toString("ascii") !== "IHDR") return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
function verifySealed(relativePath, field) {
  const document = readJson(relativePath);
  const unsigned = { ...document };
  delete unsigned[field];
  assert(canonicalSha(unsigned) === document[field], `v591-readonly-seal:${relativePath}`);
  return document;
}
function verifyOptionalSealed(relativePath, field = "receiptSha256") {
  if (!existsSync(resolve(root, relativePath))) return null;
  return verifySealed(relativePath, field);
}

const manifest = verifySealed("public/data/celestial-convergence-v591/manifest.json", "manifestSha256");
const constellationPacket = readJson("public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json");
const constellationPacketBytes = readFileSync(resolve(root, "public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json"));
const constellationPacketFileSha256 = sha256(constellationPacketBytes);
const constellationPacketUnsigned = { ...constellationPacket };
delete constellationPacketUnsigned.packetSha256;
const constellationLabelAtlasMetadataPath = resolve(root, "public/data/celestial-convergence-v591/constellation-label-atlas-v591.json");
const constellationLabelAtlasMetadataBytes = readFileSync(constellationLabelAtlasMetadataPath);
const constellationLabelAtlasMetadata = JSON.parse(constellationLabelAtlasMetadataBytes.toString("utf8"));
const constellationLabelAtlasPath = resolve(root, `public/${constellationLabelAtlasMetadata.atlas.path.replace(/^\/+/, "")}`);
const constellationLabelAtlasBytes = readFileSync(constellationLabelAtlasPath);
const constellationLabelAtlasFileSha256 = sha256(constellationLabelAtlasBytes);
const nebulaAssetOverlay = verifySealed("public/data/celestial-convergence-v591/nebula-asset-overlay.json", "receiptSha256");
const sourceManifest = verifySealed("docs/release/v591/source-manifest-v591.json", "receiptSha256");
const freezeBefore = verifySealed("docs/release/v591/freeze-before-v591.json", "snapshotSha256");
const currentState = verifySealed("docs/release/v591/current-state-receipt-v591.json", "receiptSha256");
const verification = verifySealed("docs/release/v591/verification-receipt-v591.json", "receiptSha256");
const freezeAfter = verifySealed("docs/release/v591/freeze-after-v591.json", "snapshotSha256");
const capability = verifySealed("docs/release/v591/capability-report-v591.json", "reportSha256");
const pointer = verifySealed("dist/release/orbit-atlas-current-celestial-convergence-candidate-v591.json", "pointerSha256");
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

assert(manifest.boundaries.formalProductPointer === "v263", "v591-readonly-formal-pointer");
assert(manifest.boundaries.scientificPayloadWriteback === false && manifest.boundaries.scientificAuthorityChanged === false, "v591-readonly-science-boundary");
assert(manifest.runtime.canvasCount === 1 && manifest.runtime.v591HeroOverrideCount === 16, "v591-readonly-runtime-p2-sixteen-heroes");
assert(manifest.runtime.v591HeroOverrideBodies?.join(",") === "sun,earth,mercury,venus,moon,mars,jupiter,saturn,vesta,bennu,eros,kleopatra,tempel-1,ceres,uranus,neptune", "v591-readonly-sixteen-overrides");
assert(manifest.heroBodies.sun?.v591OverrideStatus === "admitted" && manifest.heroBodies.sun?.effectiveStatus === "admitted", "v591-readonly-sun-admission");
assert(manifest.heroBodies.earth?.v591OverrideStatus === "admitted" && manifest.heroBodies.earth?.effectiveStatus === "admitted", "v591-readonly-earth-admission");
assert(manifest.heroBodies.mercury?.v591OverrideStatus === "admitted" && manifest.heroBodies.mercury?.effectiveStatus === "admitted", "v591-readonly-mercury-admission");
assert(manifest.heroBodies.venus?.v591OverrideStatus === "admitted" && manifest.heroBodies.venus?.effectiveStatus === "admitted", "v591-readonly-venus-admission");
assert(manifest.heroBodies.moon?.v591OverrideStatus === "admitted" && manifest.heroBodies.moon?.effectiveStatus === "admitted", "v591-readonly-moon-admission");
assert(manifest.heroBodies.mars?.v591OverrideStatus === "admitted" && manifest.heroBodies.mars?.effectiveStatus === "admitted", "v591-readonly-mars-admission");
assert(manifest.heroBodies.jupiter?.v591OverrideStatus === "admitted" && manifest.heroBodies.jupiter?.effectiveStatus === "admitted", "v591-readonly-jupiter-admission");
assert(manifest.heroBodies.saturn?.v591OverrideStatus === "admitted" && manifest.heroBodies.saturn?.effectiveStatus === "admitted", "v591-readonly-saturn-admission");
assert(manifest.heroBodies.vesta?.v591OverrideStatus === "admitted" && manifest.heroBodies.vesta?.effectiveStatus === "admitted", "v591-readonly-vesta-admission");
assert(manifest.heroBodies.bennu?.v591OverrideStatus === "admitted" && manifest.heroBodies.bennu?.effectiveStatus === "admitted", "v591-readonly-bennu-admission");
assert(manifest.heroBodies.eros?.v591OverrideStatus === "admitted" && manifest.heroBodies.eros?.effectiveStatus === "admitted", "v591-readonly-eros-admission");
assert(manifest.heroBodies.kleopatra?.v591OverrideStatus === "admitted" && manifest.heroBodies.kleopatra?.effectiveStatus === "admitted", "v591-readonly-kleopatra-admission");
assert(manifest.heroBodies["tempel-1"]?.v591OverrideStatus === "admitted" && manifest.heroBodies["tempel-1"]?.effectiveStatus === "admitted", "v591-readonly-tempel1-admission");
assert(manifest.heroBodies.ceres?.v591OverrideStatus === "admitted" && manifest.heroBodies.ceres?.effectiveStatus === "admitted", "v591-readonly-ceres-admission");
assert(manifest.heroBodies.uranus?.v591OverrideStatus === "admitted" && manifest.heroBodies.uranus?.effectiveStatus === "admitted", "v591-readonly-uranus-admission");
assert(manifest.heroBodies.neptune?.v591OverrideStatus === "admitted" && manifest.heroBodies.neptune?.effectiveStatus === "admitted", "v591-readonly-neptune-admission");
assert(manifest.starfield?.v591OverrideStatus === "implemented-v591-gaia-deterministic-psf", "v591-readonly-starfield-implementation");
assert(manifest.starfield?.opticsVersion === "v591-gaia-moffat-airy-optics-v1", "v591-readonly-starfield-optics");
assert(manifest.starfield?.drawPolicy === "one-point-draw-plus-one-instanced-bright-psf-draw", "v591-readonly-starfield-draw-policy");
assert(manifest.starfield?.faintDensityPolicy === "deterministic-source-id-thinning-anchor-preserving", "v591-readonly-starfield-density-policy");
assert(manifest.nebulaAssetOverlay?.sha256 === nebulaAssetOverlay.receiptSha256, "v591-readonly-nebula-overlay-chain");
assert(manifest.nebulaAssetOverlay?.admittedCount === 6 && manifest.nebulaAssetOverlay?.blockedCount === 0, "v591-readonly-nebula-manifest-counts");
assert(manifest.nebulae?.filter((entry) => entry.v591Admission === "admitted-presentation-only").length === 6, "v591-readonly-nebula-manifest-admission");
assert(manifest.nebulae?.find((entry) => entry.id === "veil-nebula")?.v591Admission === "admitted-presentation-only", "v591-readonly-nebula-veil-manifest-admission");
assert(manifest.constellations?.v591OverrideStatus === "admitted-v591-owned-presentation-packet", "v591-readonly-constellation-manifest-status");
assert(manifest.constellations?.v591PacketSha256 === constellationPacket.packetSha256, "v591-readonly-constellation-packet-chain");
assert(manifest.constellations?.v591PacketFileSha256 === constellationPacketFileSha256, "v591-readonly-constellation-packet-file-chain");
assert(canonicalSha(constellationPacketUnsigned) === constellationPacket.packetSha256, "v591-readonly-constellation-packet-canonical");
assert(constellationPacket.version === "v591-constellation-gaia-packet-v1", "v591-readonly-constellation-packet-version");
assert(constellationPacket.status === "admitted-presentation-only-frozen-gaia-binding", "v591-readonly-constellation-packet-status");
assert(constellationPacket.frozenSource.fileSha256 === "6c5aefed75d78f566fa598a2fe15bad5482af41f7a600d055c1554544012f5f5", "v591-readonly-constellation-frozen-file");
assert(constellationPacket.frozenSource.bindingSha256 === "5d5faefe782b221729084dc9796969579515151afab8c1ed377f0cbf718937a8", "v591-readonly-constellation-frozen-binding");
assert(constellationPacket.metrics.constellationCount === 88 && constellationPacket.metrics.waypointCount === 484 && constellationPacket.metrics.uniqueGaiaSourceIdCount === 420, "v591-readonly-constellation-counts");
assert(constellationPacket.metrics.maximumAngularDistanceDeg === 1.4008261815085659 && constellationPacket.metrics.medianAngularDistanceDeg === 0.4760630074038235 && constellationPacket.metrics.thresholdDeg === 1.5, "v591-readonly-constellation-metrics");
assert(constellationPacket.labelAtlas.sha256 === constellationLabelAtlasFileSha256 && constellationPacket.labelAtlas.bytes === constellationLabelAtlasBytes.byteLength, "v591-readonly-constellation-atlas-chain");
assert(constellationLabelAtlasMetadata.atlas.sha256 === constellationLabelAtlasFileSha256 && constellationLabelAtlasMetadata.atlas.bytes === constellationLabelAtlasBytes.byteLength && constellationLabelAtlasMetadata.entries.length === 88, "v591-readonly-constellation-atlas-metadata");
assert(constellationPacket.labelAtlas.metadataFileSha256 === sha256(constellationLabelAtlasMetadataBytes), "v591-readonly-constellation-atlas-metadata-sha");
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
const standaloneReceiptBytes = readFileSync(resolve(root, "dist/release/atlas-v591-standalone-build-resource.json"));
const standaloneReceipt = JSON.parse(standaloneReceiptBytes.toString("utf8"));
const standaloneBuildId = readFileSync(resolve(root, ".next-atlas-v591-standalone-current/BUILD_ID"), "utf8").trim();
const expectedPageSourceManifestSha256 = sourceManifest.receiptSha256;
const expectedPageDeliveryTier = "standalone-full";
const expectedPageBuildFingerprint = derivePageBuildFingerprintV591({ sourceManifestSha256: expectedPageSourceManifestSha256, deliveryTier: expectedPageDeliveryTier });
for (const [body, browser] of [["sun", sunBrowser], ["earth", earthBrowser], ["mercury", mercuryBrowser], ["venus", venusBrowser], ["moon", moonBrowser], ["mars", marsBrowser], ["jupiter", jupiterBrowser], ["saturn", saturnBrowser], ["vesta", vestaBrowser], ["bennu", bennuBrowser], ["eros", erosBrowser], ["kleopatra", kleopatraBrowser], ["tempel-1", tempel1Browser], ["ceres", ceresBrowser], ["uranus", uranusBrowser], ["neptune", neptuneBrowser]]) {
  assert(browser.candidate?.manifestSha256 === manifest.manifestSha256, `v591-readonly-${body}-browser-manifest`);
  assert(browser.candidate?.sourceManifestSha256 === sourceManifest.receiptSha256, `v591-readonly-${body}-browser-source`);
  assert(browser.candidate?.capturedStandaloneBuildId === standaloneBuildId && browser.candidate?.capturedStandaloneBuildId === standaloneReceipt.buildId, `v591-readonly-${body}-browser-build-id`);
  assert(browser.candidate?.capturedStandaloneReceiptSha256 === sha256(standaloneReceiptBytes), `v591-readonly-${body}-browser-build-receipt`);
  assert(browser.candidate?.capturedPageSourceManifestSha256 === expectedPageSourceManifestSha256, `v591-readonly-${body}-browser-page-source`);
  assert(browser.candidate?.capturedPageDeliveryTier === expectedPageDeliveryTier, `v591-readonly-${body}-browser-page-tier`);
  assert(browser.candidate?.capturedPageBuildFingerprint === expectedPageBuildFingerprint, `v591-readonly-${body}-browser-page-fingerprint`);
  assert(browser.runtime?.nebulaAdmission?.status === "6-of-6-runtime-admitted" && browser.runtime?.nebulaAdmission?.admittedCount === 6 && browser.runtime?.nebulaAdmission?.blockedCount === 0 && browser.runtime?.nebulaAdmission?.presentationOnly === true && browser.scope?.nebulae === "6/6-runtime-admitted", `v591-readonly-${body}-browser-nebula-runtime`);
  for (const sample of browser.orderedReplay ?? []) {
    assert(sample.nebula?.admittedCount === 6 && sample.nebula?.blockedCount === 0 && sample.nebula?.requestedImpostorCount === 0 && sample.nebula?.readyImpostorCount === 0 && sample.nebula?.runtimeBlockedImpostorCount === 0 && sample.nebula?.requestedIds === "none" && sample.nebula?.readyIds === "none" && sample.nebula?.blockedIds === "", `v591-readonly-${body}-browser-nebula-suppression:${sample.sequence}`);
  }
}

function verifyDeepSpaceBrowserV591(receipt) {
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
  assert(receipt.version === "v591-deep-space-browser-qualification-v1" && receipt.status === "six-nebula-runtime-slices-passed-global-visual-matrix-pending" && receipt.route === "/local-shadow-v591", "v591-readonly-deep-space-status");
  assert(receipt.build?.manifestSha256 === manifest.manifestSha256 && receipt.build?.sourceManifestSha256 === sourceManifest.receiptSha256 && receipt.build?.standaloneBuildId === standaloneBuildId && receipt.build?.standaloneBuildId === standaloneReceipt.buildId && receipt.build?.standaloneReceiptSha256 === sha256(standaloneReceiptBytes) && receipt.build?.pageBuildFingerprint === expectedPageBuildFingerprint && receipt.build?.deliveryTier === expectedPageDeliveryTier, "v591-readonly-deep-space-build");
  assert(receipt.overlay?.sha256 === nebulaAssetOverlay.receiptSha256 && receipt.overlay?.status === "6-of-6-runtime-admitted" && receipt.overlay?.admittedCount === 6 && receipt.overlay?.blockedCount === 0 && receipt.overlay?.sourceIds?.join(",") === nebulaAssetOverlay.assets.map((asset) => `${asset.id}:${asset.nasaId}`).join(","), "v591-readonly-deep-space-overlay");
  assert(receipt.runtime?.canvasCount === 1 && receipt.runtime?.desktopOverview === "3-requested-3-ready-0-blocked" && receipt.runtime?.sixFocusedNebulae === "6-of-6-one-requested-one-ready-0-blocked" && receipt.runtime?.scienceImagery === "0-requested-0-ready" && receipt.runtime?.mobileVeil === "1-requested-1-ready-0-blocked" && receipt.runtime?.scientificPayloadSha256 === manifest.boundaries.scientificPayloadSha256 && receipt.runtime?.scientificPayloadStableAcrossModesAndDeviceTiers === true && receipt.runtime?.scientificWriteback === false && receipt.runtime?.presentationOnly === true, "v591-readonly-deep-space-runtime");
  assert(Array.isArray(receipt.orderedReplay) && receipt.orderedReplay.length === expected.length, "v591-readonly-deep-space-replay-count");
  for (const [index, row] of receipt.orderedReplay.entries()) {
    const [phase, focus, mode, device, count, ids] = expected[index];
    assert(row.sequence === index && row.phase === phase && row.focusTarget === focus && row.mode === mode && row.deviceTier === device && row.viewport === (device === "mobile" ? "390x844" : "1440x900"), `v591-readonly-deep-space-order:${index}`);
    assert(row.pageSourceManifestSha256 === expectedPageSourceManifestSha256 && row.pageDeliveryTier === expectedPageDeliveryTier && row.pageBuildFingerprint === expectedPageBuildFingerprint, `v591-readonly-deep-space-page-build:${index}`);
    assert(row.canvasCount === 1 && row.singleCanvas === true && row.deepSpaceStatus === "ready" && row.skyStatus === "ready" && row.starStatus === "ready" && row.constellationStatus === "ready", `v591-readonly-deep-space-ready:${index}`);
    assert(row.admittedCount === 6 && row.blockedCount === 0 && row.blockedIds === "" && row.requestedImpostorCount === count && row.readyImpostorCount === count && row.runtimeBlockedImpostorCount === 0 && row.requestedIds === ids && row.readyIds === (count > 0 ? ids : "none"), `v591-readonly-deep-space-nebula:${index}`);
    assert(row.nebulaStatus === (mode === "science" ? "science-marker-only" : "ready"), `v591-readonly-deep-space-mode:${index}`);
    assert(row.fpsMedian >= 45 && row.fpsSampleCount >= 120 && row.drawCalls <= 90 && row.gpuBytes <= (device === "mobile" ? 201326592 : 536870912), `v591-readonly-deep-space-budget:${index}`);
    assert(row.scientificPayloadSha256 === manifest.boundaries.scientificPayloadSha256 && row.scientificWriteback === "false", `v591-readonly-deep-space-science:${index}`);
  }
  assert(receipt.errorAudit?.pageConsoleWarnings === 0 && receipt.errorAudit?.pageConsoleErrors === 0 && receipt.errorAudit?.status === "passed", "v591-readonly-deep-space-console");
  assert(receipt.releaseAudit?.candidateResources === 0 && receipt.releaseAudit?.candidateBytes === 0 && receipt.releaseAudit?.candidateSceneNodes === 0 && receipt.releaseAudit?.candidateProgramDelta === 0 && receipt.releaseAudit?.rendererTextureDelta === 0 && receipt.releaseAudit?.registryStatus === "baseline" && receipt.releaseAudit?.status === "released-zero", "v591-readonly-deep-space-release");
  assert(Array.isArray(receipt.screenshots) && receipt.screenshots.length === 4, "v591-readonly-deep-space-screenshot-count");
  for (const screenshot of receipt.screenshots) {
    const bytes = readFileSync(resolve(root, screenshot.path));
    const dimensions = pngDimensions(bytes);
    assert(bytes.byteLength === screenshot.bytes && sha256(bytes) === screenshot.sha256 && dimensions?.width === screenshot.width && dimensions?.height === screenshot.height, `v591-readonly-deep-space-screenshot:${screenshot.path}`);
  }
  assert(receipt.scope?.nebulae === "6/6-runtime-ready" && receipt.scope?.formalProductPointer === "v263" && receipt.scope?.candidateQualified === false, "v591-readonly-deep-space-scope");
}
verifyDeepSpaceBrowserV591(deepSpaceBrowser);
function verifyCoreBrowserSliceV591(browser, specification) {
  const phases = ["desktop-science", "desktop-cinematic", "mobile-cinematic", "mobile-science", "desktop-return-science"];
  assert(browser.version === specification.version && browser.status === specification.status, `v591-readonly-${specification.body}-browser-status`);
  assert(browser.route === "/local-shadow-v591" && browser.runtime.canvasCount === 1 && browser.runtime.hero === specification.body && browser.runtime.heroAdmission === "admitted", `v591-readonly-${specification.body}-browser-runtime`);
  if (specification.proceduralPrimary === true) {
    assert(browser.runtime.proceduralPrimary === true && browser.runtime.proceduralFallback === false, `v591-readonly-${specification.body}-browser-primary-policy`);
    assert(browser.runtime.observationTextureClaim === false && browser.runtime.measuredPhotometryClaim === false, `v591-readonly-${specification.body}-browser-observation-policy`);
  }
  if (specification.body === "venus") {
    const overlay = verifySealed("public/data/celestial-convergence-v591/venus-asset-overlay.json", "receiptSha256");
    assert(browser.runtime.assetOverlaySha256 === overlay.receiptSha256, "v591-readonly-venus-browser-overlay");
    assert(browser.runtime.surfaceSource === "nasa-jpl-magellan-0e-90e-270e-clean-global-views-derived-equirectangular", "v591-readonly-venus-browser-source");
    assert(browser.runtime.cloudModel === "deterministic-physical-inspired-primary-not-observation-texture" && browser.runtime.cloudObservationTextureClaim === false, "v591-readonly-venus-browser-cloud-model");
    assert(browser.runtime.measuredTopographyClaim === false && browser.runtime.opticalColorClaim === false && browser.runtime.proceduralFallback === false, "v591-readonly-venus-browser-claims");
  }
  if (specification.body === "tempel-1") {
    const overlay = verifySealed("public/data/celestial-convergence-v591/tempel-1-asset-overlay.json", "receiptSha256");
    const bennu = verifySealed("public/data/celestial-convergence-v591/bennu-asset-overlay.json", "receiptSha256");
    assert(browser.runtime.assetOverlaySha256 === overlay.receiptSha256, "v591-readonly-tempel1-browser-overlay");
    assert(browser.runtime.modelLodReceiptSha256 === overlay.modelLodReceiptSha256 && browser.runtime.sourceDetailCeiling === overlay.model.sourceDetailCeiling, "v591-readonly-tempel1-browser-model");
    assert(browser.runtime.observationDataset === "DIF-C-HRIV/ITS/MRI-5-TEMPEL1-SHAPE-V2.0" && browser.runtime.observedCoverageFraction === 0.8043214699074074, "v591-readonly-tempel1-browser-observation");
    assert(browser.runtime.unobservedAreaPolicy === "cc0-regolith-presentation-substrate-never-observation", "v591-readonly-tempel1-browser-unobserved-policy");
    assert(browser.runtime.microtextureSourceOverlaySha256 === bennu.receiptSha256 && browser.runtime.microtextureExactByteReuse === true, "v591-readonly-tempel1-browser-microtexture");
    assert(browser.runtime.tailPolicy === "fixed-seed-dust-anti-solar-ion-velocity-presentation-only" && browser.runtime.measuredPhotometryClaim === false && browser.runtime.proceduralFallback === false, "v591-readonly-tempel1-browser-authority");
  }
  if (specification.body === "ceres") {
    const overlay = verifySealed("public/data/celestial-convergence-v591/ceres-asset-overlay.json", "receiptSha256");
    const bennu = verifySealed("public/data/celestial-convergence-v591/bennu-asset-overlay.json", "receiptSha256");
    assert(browser.runtime.assetOverlaySha256 === overlay.receiptSha256, "v591-readonly-ceres-browser-overlay");
    assert(browser.runtime.modelLodReceiptSha256 === overlay.modelLodReceiptSha256 && browser.runtime.sourceDetailCeiling === overlay.model.sourceDetailCeiling, "v591-readonly-ceres-browser-model");
    assert(browser.runtime.observationGrid === "2222x1111-pds-dawn-spc-relative-albedo-and-radius" && browser.runtime.radiusRangeMeters === "442618.25:486849.59375", "v591-readonly-ceres-browser-observation");
    assert(browser.runtime.microtexturePolicy === "poly-haven-cc0-exact-byte-reuse-presentation-only-not-ceres-observation", "v591-readonly-ceres-browser-microtexture-policy");
    assert(browser.runtime.microtextureSourceOverlaySha256 === bennu.receiptSha256 && browser.runtime.microtextureExactByteReuse === true, "v591-readonly-ceres-browser-microtexture");
    assert(browser.runtime.reflectance === "rough-oren-nayar-bounded-opposition-no-glossy-specular", "v591-readonly-ceres-browser-reflectance");
    assert(browser.runtime.opticalColorClaim === false && browser.runtime.syntheticDetailAdded === false && browser.runtime.measuredPhotometryClaim === false && browser.runtime.proceduralFallback === false, "v591-readonly-ceres-browser-authority");
  }
  assert(browser.runtime.scientificPayloadStableAcrossModesAndDeviceTiers === true && browser.runtime.scientificWriteback === false, `v591-readonly-${specification.body}-browser-science`);
  assert(browser.runtime.nebulaAdmission?.status === "6-of-6-runtime-admitted" && browser.runtime.nebulaAdmission?.admittedCount === 6 && browser.runtime.nebulaAdmission?.blockedCount === 0 && browser.runtime.nebulaAdmission?.presentationOnly === true && browser.scope?.nebulae === "6/6-runtime-admitted", `v591-readonly-${specification.body}-browser-nebula-admission`);
  assert(browser.orderedReplay.length === phases.length, `v591-readonly-${specification.body}-browser-replay-count`);
  const payloads = new Set();
  for (const [index, sample] of browser.orderedReplay.entries()) {
    const mobile = sample.deviceTier === "mobile";
    const expectedSource = mobile ? (specification.mobileSource ?? "ktx2") : (specification.desktopSource ?? "ktx2");
    assert(sample.sequence === index && sample.phase === phases[index], `v591-readonly-${specification.body}-browser-replay-order:${index}`);
    assert(sample.pageSourceManifestSha256 === expectedPageSourceManifestSha256 && sample.pageDeliveryTier === expectedPageDeliveryTier && sample.pageBuildFingerprint === expectedPageBuildFingerprint, `v591-readonly-${specification.body}-browser-page-build:${index}`);
    assert(sample.viewport === (mobile ? "390x844" : "1440x900") && sample.heroAdmission === "admitted", `v591-readonly-${specification.body}-browser-replay-runtime:${index}`);
    assert(sample.nebula?.admittedCount === 6 && sample.nebula?.blockedCount === 0 && sample.nebula?.requestedImpostorCount === 0 && sample.nebula?.readyImpostorCount === 0 && sample.nebula?.runtimeBlockedImpostorCount === 0 && sample.nebula?.requestedIds === "none" && sample.nebula?.readyIds === "none" && sample.nebula?.blockedIds === "", `v591-readonly-${specification.body}-browser-nebula-hero-suppression:${index}`);
    const telemetry = sample.constellation;
    const expectedDefaultCount = mobile ? 8 : 12;
    assert(
      telemetry?.status === expectedConstellationTelemetry.status
        && telemetry.packetVersion === expectedConstellationTelemetry.packetVersion
        && telemetry.packetSha256 === expectedConstellationTelemetry.packetSha256
        && telemetry.packetFileSha256 === expectedConstellationTelemetry.packetFileSha256
        && telemetry.frozenSourceFileSha256 === expectedConstellationTelemetry.frozenSourceFileSha256
        && telemetry.frozenBindingSha256 === expectedConstellationTelemetry.frozenBindingSha256
        && telemetry.constellationCount === expectedConstellationTelemetry.constellationCount
        && telemetry.waypointCount === expectedConstellationTelemetry.waypointCount
        && telemetry.uniqueGaiaSourceIdCount === expectedConstellationTelemetry.uniqueGaiaSourceIdCount
        && telemetry.maximumAngularDistanceDeg === expectedConstellationTelemetry.maximumAngularDistanceDeg
        && telemetry.medianAngularDistanceDeg === expectedConstellationTelemetry.medianAngularDistanceDeg
        && telemetry.renderedConstellationCount > 0
        && telemetry.renderedConstellationCount <= expectedDefaultCount
        && telemetry.renderedAnchorCount > 0
        && telemetry.renderedAnchorCount <= expectedConstellationTelemetry.waypointCount
        && telemetry.defaultCount === expectedDefaultCount
        && telemetry.labelAtlasStatus === expectedConstellationTelemetry.labelAtlasStatus
        && telemetry.labelAtlasSha256 === expectedConstellationTelemetry.labelAtlasSha256
        && telemetry.labelAtlasBytes === expectedConstellationTelemetry.labelAtlasBytes,
      `v591-readonly-${specification.body}-browser-constellation-telemetry:${index}`,
    );
    assert(sample.ktx2First === (expectedSource === "ktx2"), `v591-readonly-${specification.body}-browser-source-policy:${index}`);
    assert(sample.loaderLane === (specification.loaderLane ?? "v591") && sample.prewarm === (specification.prewarm ?? "ready"), `v591-readonly-${specification.body}-browser-loader:${index}`);
    assert(sample.cameraSettled === true && sample.subjectVisible === true && sample.screenDiameterPx >= 72, `v591-readonly-${specification.body}-browser-subject:${index}`);
    if (specification.frameFits === true) {
      assert(
        sample.frameFits === true && sample.screenDiameterPx <= Number(sample.viewport.split("x")[0]) * 0.92,
        `v591-readonly-${specification.body}-browser-frame:${index}`,
      );
    }
    assert(sample.lod === (mobile ? specification.mobileLod : specification.desktopLod), `v591-readonly-${specification.body}-browser-lod:${index}`);
    assert(sample.fpsMedian >= 45 && sample.fpsSampleCount >= 120 && sample.drawCalls <= 60 && sample.gpuBytes <= (mobile ? 201326592 : 536870912), `v591-readonly-${specification.body}-browser-performance:${index}`);
    for (const id of specification.assetIds) {
      assert(String(sample.textureSources).includes(`${id}:${expectedSource}`) && String(sample.textureReceipt).includes(`${id}:ready:${expectedSource}:`) && String(sample.textureReceipt).includes("quality=passed"), `v591-readonly-${specification.body}-browser-texture:${index}:${id}`);
    }
    if (specification.body === "venus") {
      assert(sample.surfaceSource === "nasa-jpl-magellan-0e-90e-270e-clean-global-views-derived-equirectangular", `v591-readonly-venus-browser-source:${index}`);
      assert(sample.cloudModel === "deterministic-physical-inspired-primary-not-observation-texture" && sample.cloudObservationTextureClaim === false, `v591-readonly-venus-browser-cloud:${index}`);
      assert(sample.measuredTopographyClaim === false && sample.opticalColorClaim === false && sample.proceduralFallback === false && sample.scientificPayloadMutation === false, `v591-readonly-venus-browser-authority:${index}`);
    }
    if (specification.body === "tempel-1") {
      const overlay = verifySealed("public/data/celestial-convergence-v591/tempel-1-asset-overlay.json", "receiptSha256");
      const bennu = verifySealed("public/data/celestial-convergence-v591/bennu-asset-overlay.json", "receiptSha256");
      const expectedModel = overlay.model.lods[mobile ? 1 : 0];
      assert(sample.assetOverlaySha256 === overlay.receiptSha256 && sample.modelLodReceiptSha256 === overlay.modelLodReceiptSha256, `v591-readonly-tempel1-browser-overlay:${index}`);
      assert(sample.modelStatus === "ready" && sample.modelLod === String(expectedModel.lod) && sample.modelSha256 === expectedModel.sha256 && sample.modelGpuBytes > 0, `v591-readonly-tempel1-browser-model:${index}`);
      assert(sample.sourceDetailCeiling === overlay.model.sourceDetailCeiling && sample.observationDataset === "DIF-C-HRIV/ITS/MRI-5-TEMPEL1-SHAPE-V2.0", `v591-readonly-tempel1-browser-source:${index}`);
      assert(sample.observedCoverageFraction === 0.8043214699074074 && sample.unobservedAreaPolicy === "cc0-regolith-presentation-substrate-never-observation", `v591-readonly-tempel1-browser-coverage:${index}`);
      assert(sample.microtextureSourceOverlaySha256 === bennu.receiptSha256 && sample.microtextureExactByteReuse === true, `v591-readonly-tempel1-browser-microtexture:${index}`);
      assert(sample.tailPolicy === "fixed-seed-dust-anti-solar-ion-velocity-presentation-only" && sample.tailVisible === (sample.mode === "cinematic"), `v591-readonly-tempel1-browser-tail:${index}`);
      assert(sample.measuredPhotometryClaim === false && sample.proceduralFallback === false && sample.scientificPayloadMutation === false, `v591-readonly-tempel1-browser-authority:${index}`);
    }
    if (specification.body === "ceres") {
      const overlay = verifySealed("public/data/celestial-convergence-v591/ceres-asset-overlay.json", "receiptSha256");
      const bennu = verifySealed("public/data/celestial-convergence-v591/bennu-asset-overlay.json", "receiptSha256");
      const expectedModel = overlay.model.lods[mobile ? 1 : 0];
      assert(sample.assetOverlaySha256 === overlay.receiptSha256 && sample.modelLodReceiptSha256 === overlay.modelLodReceiptSha256, `v591-readonly-ceres-browser-overlay:${index}`);
      assert(sample.modelStatus === "ready" && sample.modelLod === String(expectedModel.lod) && sample.modelSha256 === expectedModel.sha256 && sample.modelGpuBytes > 0, `v591-readonly-ceres-browser-model:${index}`);
      assert(sample.sourceDetailCeiling === overlay.model.sourceDetailCeiling && sample.observationGrid === "2222x1111-pds-dawn-spc-relative-albedo-and-radius", `v591-readonly-ceres-browser-source:${index}`);
      assert(sample.radiusRangeMeters === "442618.25:486849.59375" && sample.microtexturePolicy === "poly-haven-cc0-exact-byte-reuse-presentation-only-not-ceres-observation", `v591-readonly-ceres-browser-observation:${index}`);
      assert(sample.microtextureSourceOverlaySha256 === bennu.receiptSha256 && sample.microtextureExactByteReuse === true, `v591-readonly-ceres-browser-microtexture:${index}`);
      assert(sample.reflectance === "rough-oren-nayar-bounded-opposition-no-glossy-specular", `v591-readonly-ceres-browser-reflectance:${index}`);
      assert(sample.opticalColorClaim === false && sample.syntheticDetailAdded === false && sample.measuredPhotometryClaim === false && sample.proceduralFallback === false && sample.scientificPayloadMutation === false, `v591-readonly-ceres-browser-authority:${index}`);
    }
    payloads.add(sample.payloadSha256);
  }
  assert(payloads.size === 1 && [...payloads][0] === browser.runtime.scientificPayloadSha256, `v591-readonly-${specification.body}-browser-payload-replay`);
  assert(
    browser.runtime.constellationPacket?.version === expectedConstellationTelemetry.packetVersion
      && browser.runtime.constellationPacket?.packetSha256 === expectedConstellationTelemetry.packetSha256
      && browser.runtime.constellationPacket?.packetFileSha256 === expectedConstellationTelemetry.packetFileSha256
      && browser.runtime.constellationPacket?.frozenSourceFileSha256 === expectedConstellationTelemetry.frozenSourceFileSha256
      && browser.runtime.constellationPacket?.frozenBindingSha256 === expectedConstellationTelemetry.frozenBindingSha256
      && browser.runtime.constellationPacket?.constellationCount === expectedConstellationTelemetry.constellationCount
      && browser.runtime.constellationPacket?.waypointCount === expectedConstellationTelemetry.waypointCount
      && browser.runtime.constellationPacket?.uniqueGaiaSourceIdCount === expectedConstellationTelemetry.uniqueGaiaSourceIdCount
      && browser.runtime.constellationPacket?.maximumAngularDistanceDeg === expectedConstellationTelemetry.maximumAngularDistanceDeg
      && browser.runtime.constellationPacket?.medianAngularDistanceDeg === expectedConstellationTelemetry.medianAngularDistanceDeg
      && browser.runtime.constellationPacket?.labelAtlasStatus === expectedConstellationTelemetry.labelAtlasStatus
      && browser.runtime.constellationPacket?.labelAtlasSha256 === expectedConstellationTelemetry.labelAtlasSha256
      && browser.runtime.constellationPacket?.labelAtlasBytes === expectedConstellationTelemetry.labelAtlasBytes
      && browser.runtime.constellationPacket?.presentationOnly === true,
    `v591-readonly-${specification.body}-browser-constellation-runtime`,
  );
  assert(browser.errorAudit.pageConsoleWarnings === 0 && browser.errorAudit.pageConsoleErrors === 0, `v591-readonly-${specification.body}-browser-console`);
  assert(browser.releaseAudit.candidateResources === 0 && browser.releaseAudit.candidateBytes === 0 && browser.releaseAudit.candidateSceneNodes === 0 && browser.releaseAudit.candidateProgramDelta === 0 && browser.releaseAudit.rendererTextureDelta === 0 && browser.releaseAudit.registryStatus === "baseline" && browser.releaseAudit.status === "released-zero", `v591-readonly-${specification.body}-browser-release`);
  const screenshotPhases = browser.screenshots.map((entry) => `${entry.path.includes("desktop") ? "desktop" : "mobile"}-${entry.path.includes("cinematic") ? "cinematic" : "science"}`);
  assert(screenshotPhases.length === 4 && new Set(screenshotPhases).size === 4 && phases.slice(0, 4).every((phase) => screenshotPhases.includes(phase)), `v591-readonly-${specification.body}-browser-screenshot-cardinality`);
  for (const screenshot of browser.screenshots) {
    const bytes = readFileSync(resolve(root, screenshot.path));
    const desktop = screenshot.path.includes("desktop");
    assert(bytes.byteLength === screenshot.bytes && sha256(bytes) === screenshot.sha256, `v591-readonly-${specification.body}-browser-screenshot:${screenshot.path}`);
    assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && bytes.subarray(12, 16).toString("ascii") === "IHDR", `v591-readonly-${specification.body}-browser-png:${screenshot.path}`);
    assert(bytes.readUInt32BE(16) === (desktop ? 1440 : 390) && bytes.readUInt32BE(20) === (desktop ? 900 : 844), `v591-readonly-${specification.body}-browser-dimensions:${screenshot.path}`);
  }
}
verifyCoreBrowserSliceV591(sunBrowser, {
  body: "sun",
  version: "v591-sun-browser-qualification-v1",
  status: "sun-slice-passed-global-visual-matrix-pending",
  assetIds: ["sun-photosphere", "sun-chromosphere"],
  desktopLod: "8192x4096",
  mobileLod: "2048x1024",
});
verifyCoreBrowserSliceV591(earthBrowser, {
  body: "earth",
  version: "v591-earth-browser-qualification-v1",
  status: "earth-slice-passed-global-visual-matrix-pending",
  assetIds: ["earth-albedo", "earth-normal", "earth-roughness", "earth-clouds", "earth-cloud-alpha", "earth-night", "earth-night-mask"],
  desktopLod: "8192x4096",
  mobileLod: "2048x1024",
  desktopSource: "ktx2",
  mobileSource: "full-raster",
});
verifyCoreBrowserSliceV591(mercuryBrowser, {
  body: "mercury",
  version: "v591-mercury-browser-qualification-v1",
  status: "mercury-slice-passed-global-visual-matrix-pending",
  assetIds: ["mercury-albedo", "mercury-normal", "mercury-roughness", "mercury-height"],
  desktopLod: "4096x2048",
  mobileLod: "2048x1024",
  frameFits: true,
});
verifyCoreBrowserSliceV591(venusBrowser, {
  body: "venus",
  version: "v591-venus-browser-qualification-v1",
  status: "venus-slice-passed-global-visual-matrix-pending",
  assetIds: ["venus-surface", "venus-normal", "venus-roughness", "venus-height"],
  desktopLod: "4096x2048",
  mobileLod: "2048x1024",
  frameFits: true,
});
assert(moonBrowser.version === "v591-moon-browser-qualification-v2" && moonBrowser.status === "moon-slice-passed-global-visual-matrix-pending", "v591-readonly-moon-browser-status");
assert(moonBrowser.route === "/local-shadow-v591" && moonBrowser.runtime.canvasCount === 1 && moonBrowser.runtime.heroAdmission === "admitted", "v591-readonly-moon-browser-runtime");
assert(moonBrowser.runtime.scientificPayloadStableAcrossModesAndDeviceTiers === true && moonBrowser.runtime.scientificWriteback === false, "v591-readonly-moon-browser-science");
const expectedMoonBrowserPhases = ["desktop-science", "desktop-cinematic", "mobile-cinematic", "mobile-science", "desktop-return-science"];
assert(moonBrowser.orderedReplay.length === expectedMoonBrowserPhases.length, "v591-readonly-moon-browser-replay-count");
const moonPayloads = new Set();
for (const [index, sample] of moonBrowser.orderedReplay.entries()) {
  const mobile = sample.deviceTier === "mobile";
  assert(sample.sequence === index && sample.phase === expectedMoonBrowserPhases[index], `v591-readonly-moon-browser-replay-order:${index}`);
  assert(sample.viewport === (mobile ? "390x844" : "1440x900") && sample.heroAdmission === "admitted" && sample.ktx2First === true, `v591-readonly-moon-browser-replay-runtime:${index}`);
  assert(sample.cameraSettled === true && sample.subjectVisible === true && sample.screenDiameterPx >= 72, `v591-readonly-moon-browser-browser-subject:${index}`);
  assert(sample.fpsMedian >= 45 && sample.fpsSampleCount >= 120 && sample.drawCalls <= 60 && sample.gpuBytes <= (mobile ? 201326592 : 536870912), `v591-readonly-moon-browser-replay-performance:${index}`);
  moonPayloads.add(sample.payloadSha256);
}
assert(moonPayloads.size === 1 && [...moonPayloads][0] === moonBrowser.runtime.scientificPayloadSha256, "v591-readonly-moon-browser-payload-replay");
assert(moonBrowser.errorAudit.pageConsoleWarnings === 0 && moonBrowser.errorAudit.pageConsoleErrors === 0, "v591-readonly-moon-browser-console");
assert(moonBrowser.releaseAudit.candidateResources === 0 && moonBrowser.releaseAudit.candidateBytes === 0 && moonBrowser.releaseAudit.candidateSceneNodes === 0 && moonBrowser.releaseAudit.candidateProgramDelta === 0 && moonBrowser.releaseAudit.rendererTextureDelta === 0 && moonBrowser.releaseAudit.registryStatus === "baseline" && moonBrowser.releaseAudit.status === "released-zero", "v591-readonly-moon-browser-release");
for (const screenshot of moonBrowser.screenshots) {
  const bytes = readFileSync(resolve(root, screenshot.path));
  const desktop = screenshot.path.includes("desktop");
  assert(bytes.byteLength === screenshot.bytes && sha256(bytes) === screenshot.sha256, `v591-readonly-moon-browser-screenshot:${screenshot.path}`);
  assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && bytes.subarray(12, 16).toString("ascii") === "IHDR", `v591-readonly-moon-browser-png:${screenshot.path}`);
  assert(bytes.readUInt32BE(16) === (desktop ? 1440 : 390) && bytes.readUInt32BE(20) === (desktop ? 900 : 844), `v591-readonly-moon-browser-dimensions:${screenshot.path}`);
}
assert(marsBrowser.version === "v591-mars-browser-qualification-v1" && marsBrowser.status === "mars-slice-passed-global-visual-matrix-pending", "v591-readonly-mars-browser-status");
assert(marsBrowser.route === "/local-shadow-v591" && marsBrowser.runtime.canvasCount === 1 && marsBrowser.runtime.hero === "mars" && marsBrowser.runtime.heroAdmission === "admitted", "v591-readonly-mars-browser-runtime");
assert(marsBrowser.runtime.scientificPayloadStableAcrossModesAndDeviceTiers === true && marsBrowser.runtime.scientificWriteback === false, "v591-readonly-mars-browser-science");
assert(marsBrowser.runtime.albedoDetailCeiling === "1024x512-usgs-observation" && marsBrowser.runtime.proceduralFallback === false, "v591-readonly-mars-browser-source-policy");
const expectedMarsBrowserPhases = ["desktop-science", "desktop-cinematic", "mobile-cinematic", "mobile-science", "desktop-return-science"];
assert(marsBrowser.orderedReplay.length === expectedMarsBrowserPhases.length, "v591-readonly-mars-browser-replay-count");
const marsPayloads = new Set();
for (const [index, sample] of marsBrowser.orderedReplay.entries()) {
  const mobile = sample.deviceTier === "mobile";
  assert(sample.sequence === index && sample.phase === expectedMarsBrowserPhases[index], `v591-readonly-mars-browser-replay-order:${index}`);
  assert(sample.viewport === (mobile ? "390x844" : "1440x900") && sample.heroAdmission === "admitted" && sample.ktx2First === true, `v591-readonly-mars-browser-replay-runtime:${index}`);
  assert(sample.loaderLane === "v591" && sample.prewarm === "ready", `v591-readonly-mars-browser-loader:${index}`);
  assert(sample.cameraSettled === true && sample.subjectVisible === true && sample.frameFits === true && sample.screenDiameterPx >= 72 && sample.screenDiameterPx <= Number(sample.viewport.split("x")[0]) * 0.92, `v591-readonly-mars-browser-subject:${index}`);
  assert(sample.lod === (mobile ? "2048x1024" : "8192x4096"), `v591-readonly-mars-browser-lod:${index}`);
  assert(sample.fpsMedian >= 45 && sample.fpsSampleCount >= 120 && sample.drawCalls <= 60 && sample.gpuBytes <= (mobile ? 201326592 : 536870912), `v591-readonly-mars-browser-performance:${index}`);
  for (const id of ["mars-albedo", "mars-normal", "mars-roughness", "mars-height"]) {
    assert(String(sample.textureSources).includes(`${id}:ktx2`) && String(sample.textureReceipt).includes(`${id}:ready:ktx2:`), `v591-readonly-mars-browser-texture:${index}:${id}`);
  }
  marsPayloads.add(sample.payloadSha256);
}
assert(marsPayloads.size === 1 && [...marsPayloads][0] === marsBrowser.runtime.scientificPayloadSha256, "v591-readonly-mars-browser-payload-replay");
assert(marsBrowser.errorAudit.pageConsoleWarnings === 0 && marsBrowser.errorAudit.pageConsoleErrors === 0, "v591-readonly-mars-browser-console");
assert(marsBrowser.releaseAudit.candidateResources === 0 && marsBrowser.releaseAudit.candidateBytes === 0 && marsBrowser.releaseAudit.candidateSceneNodes === 0 && marsBrowser.releaseAudit.candidateProgramDelta === 0 && marsBrowser.releaseAudit.rendererTextureDelta === 0 && marsBrowser.releaseAudit.registryStatus === "baseline" && marsBrowser.releaseAudit.status === "released-zero", "v591-readonly-mars-browser-release");
for (const screenshot of marsBrowser.screenshots) {
  const bytes = readFileSync(resolve(root, screenshot.path));
  const desktop = screenshot.path.includes("desktop");
  assert(bytes.byteLength === screenshot.bytes && sha256(bytes) === screenshot.sha256, `v591-readonly-mars-browser-screenshot:${screenshot.path}`);
  assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && bytes.subarray(12, 16).toString("ascii") === "IHDR", `v591-readonly-mars-browser-png:${screenshot.path}`);
  assert(bytes.readUInt32BE(16) === (desktop ? 1440 : 390) && bytes.readUInt32BE(20) === (desktop ? 900 : 844), `v591-readonly-mars-browser-dimensions:${screenshot.path}`);
}
assert(jupiterBrowser.version === "v591-jupiter-browser-qualification-v1" && jupiterBrowser.status === "jupiter-slice-passed-global-visual-matrix-pending", "v591-readonly-jupiter-browser-status");
assert(jupiterBrowser.route === "/local-shadow-v591" && jupiterBrowser.runtime.canvasCount === 1 && jupiterBrowser.runtime.hero === "jupiter" && jupiterBrowser.runtime.heroAdmission === "admitted", "v591-readonly-jupiter-browser-runtime");
assert(jupiterBrowser.runtime.scientificPayloadStableAcrossModesAndDeviceTiers === true && jupiterBrowser.runtime.scientificWriteback === false, "v591-readonly-jupiter-browser-science");
const expectedJupiterBrowserPhases = ["desktop-science", "desktop-cinematic", "mobile-cinematic", "mobile-science", "desktop-return-science"];
assert(jupiterBrowser.orderedReplay.length === expectedJupiterBrowserPhases.length, "v591-readonly-jupiter-browser-replay-count");
const jupiterPayloads = new Set();
for (const [index, sample] of jupiterBrowser.orderedReplay.entries()) {
  const mobile = sample.deviceTier === "mobile";
  assert(sample.sequence === index && sample.phase === expectedJupiterBrowserPhases[index], `v591-readonly-jupiter-browser-replay-order:${index}`);
  assert(sample.viewport === (mobile ? "390x844" : "1440x900") && sample.heroAdmission === "admitted" && sample.ktx2First === true, `v591-readonly-jupiter-browser-replay-runtime:${index}`);
  assert(sample.loaderLane === "v591" && sample.prewarm === "ready", `v591-readonly-jupiter-browser-loader:${index}`);
  assert(sample.cameraSettled === true && sample.subjectVisible === true && sample.frameFits === true && sample.screenDiameterPx >= 72 && sample.screenDiameterPx <= Number(sample.viewport.split("x")[0]) * 0.92, `v591-readonly-jupiter-browser-subject:${index}`);
  assert(sample.lod === (mobile ? "2048x1024" : "4096x2048"), `v591-readonly-jupiter-browser-lod:${index}`);
  assert(sample.fpsMedian >= 45 && sample.fpsSampleCount >= 120 && sample.drawCalls <= 60 && sample.gpuBytes <= (mobile ? 201326592 : 536870912), `v591-readonly-jupiter-browser-performance:${index}`);
  for (const id of ["jupiter-albedo", "jupiter-band-mask", "jupiter-storm-mask"]) {
    assert(String(sample.textureSources).includes(`${id}:ktx2`) && String(sample.textureReceipt).includes(`${id}:ready:ktx2:`), `v591-readonly-jupiter-browser-texture:${index}:${id}`);
  }
  jupiterPayloads.add(sample.payloadSha256);
}
assert(jupiterPayloads.size === 1 && [...jupiterPayloads][0] === jupiterBrowser.runtime.scientificPayloadSha256, "v591-readonly-jupiter-browser-payload-replay");
assert(jupiterBrowser.errorAudit.pageConsoleWarnings === 0 && jupiterBrowser.errorAudit.pageConsoleErrors === 0, "v591-readonly-jupiter-browser-console");
assert(jupiterBrowser.releaseAudit.candidateResources === 0 && jupiterBrowser.releaseAudit.candidateBytes === 0 && jupiterBrowser.releaseAudit.candidateSceneNodes === 0 && jupiterBrowser.releaseAudit.candidateProgramDelta === 0 && jupiterBrowser.releaseAudit.rendererTextureDelta === 0 && jupiterBrowser.releaseAudit.registryStatus === "baseline" && jupiterBrowser.releaseAudit.status === "released-zero", "v591-readonly-jupiter-browser-release");
for (const screenshot of jupiterBrowser.screenshots) {
  const bytes = readFileSync(resolve(root, screenshot.path));
  const desktop = screenshot.path.includes("desktop");
  assert(bytes.byteLength === screenshot.bytes && sha256(bytes) === screenshot.sha256, `v591-readonly-jupiter-browser-screenshot:${screenshot.path}`);
  assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && bytes.subarray(12, 16).toString("ascii") === "IHDR", `v591-readonly-jupiter-browser-png:${screenshot.path}`);
  assert(bytes.readUInt32BE(16) === (desktop ? 1440 : 390) && bytes.readUInt32BE(20) === (desktop ? 900 : 844), `v591-readonly-jupiter-browser-dimensions:${screenshot.path}`);
}
assert(saturnBrowser.version === "v591-saturn-browser-qualification-v1" && saturnBrowser.status === "saturn-slice-passed-global-visual-matrix-pending", "v591-readonly-saturn-browser-status");
assert(saturnBrowser.route === "/local-shadow-v591" && saturnBrowser.runtime.canvasCount === 1 && saturnBrowser.runtime.hero === "saturn" && saturnBrowser.runtime.heroAdmission === "admitted", "v591-readonly-saturn-browser-runtime");
assert(saturnBrowser.runtime.scientificPayloadStableAcrossModesAndDeviceTiers === true && saturnBrowser.runtime.scientificWriteback === false, "v591-readonly-saturn-browser-science");
const expectedSaturnBrowserPhases = ["desktop-science", "desktop-cinematic", "mobile-cinematic", "mobile-science", "desktop-return-science"];
assert(saturnBrowser.orderedReplay.length === expectedSaturnBrowserPhases.length, "v591-readonly-saturn-browser-replay-count");
const saturnPayloads = new Set();
for (const [index, sample] of saturnBrowser.orderedReplay.entries()) {
  const mobile = sample.deviceTier === "mobile";
  assert(sample.sequence === index && sample.phase === expectedSaturnBrowserPhases[index], `v591-readonly-saturn-browser-replay-order:${index}`);
  assert(sample.viewport === (mobile ? "390x844" : "1440x900") && sample.heroAdmission === "admitted" && sample.ktx2First === true, `v591-readonly-saturn-browser-replay-runtime:${index}`);
  assert(sample.loaderLane === "v591" && sample.prewarm === "ready", `v591-readonly-saturn-browser-loader:${index}`);
  assert(sample.cameraSettled === true && sample.subjectVisible === true && sample.frameFits === true && sample.screenDiameterPx >= 72 && sample.screenDiameterPx <= Number(sample.viewport.split("x")[0]) * 0.92, `v591-readonly-saturn-browser-subject:${index}`);
  assert(sample.lod === (mobile ? "2048x1024" : "8192x4096"), `v591-readonly-saturn-browser-lod:${index}`);
  assert(sample.fpsMedian >= 45 && sample.fpsSampleCount >= 120 && sample.drawCalls <= 60 && sample.gpuBytes <= (mobile ? 201326592 : 536870912), `v591-readonly-saturn-browser-performance:${index}`);
  for (const id of ["saturn-atmosphere-albedo", "saturn-band-mask", "saturn-polar-detail", "saturn-ring-color", "saturn-ring-optical-depth"]) {
    assert(String(sample.textureSources).includes(`${id}:ktx2`) && String(sample.textureReceipt).includes(`${id}:ready:ktx2:`), `v591-readonly-saturn-browser-texture:${index}:${id}`);
  }
  saturnPayloads.add(sample.payloadSha256);
}
assert(saturnPayloads.size === 1 && [...saturnPayloads][0] === saturnBrowser.runtime.scientificPayloadSha256, "v591-readonly-saturn-browser-payload-replay");
assert(saturnBrowser.layout.mobileSubjectOutlinePreserved === true && saturnBrowser.layout.mobileRingBoundingDiameterPx <= saturnBrowser.layout.mobileRingMaximumDiameterPx, "v591-readonly-saturn-browser-mobile-outline");
assert(saturnBrowser.errorAudit.pageConsoleWarnings === 0 && saturnBrowser.errorAudit.pageConsoleErrors === 0, "v591-readonly-saturn-browser-console");
assert(saturnBrowser.releaseAudit.candidateResources === 0 && saturnBrowser.releaseAudit.candidateBytes === 0 && saturnBrowser.releaseAudit.candidateSceneNodes === 0 && saturnBrowser.releaseAudit.candidateProgramDelta === 0 && saturnBrowser.releaseAudit.rendererTextureDelta === 0 && saturnBrowser.releaseAudit.registryStatus === "baseline" && saturnBrowser.releaseAudit.status === "released-zero", "v591-readonly-saturn-browser-release");
for (const screenshot of saturnBrowser.screenshots) {
  const bytes = readFileSync(resolve(root, screenshot.path));
  const desktop = screenshot.path.includes("desktop");
  assert(bytes.byteLength === screenshot.bytes && sha256(bytes) === screenshot.sha256, `v591-readonly-saturn-browser-screenshot:${screenshot.path}`);
  assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && bytes.subarray(12, 16).toString("ascii") === "IHDR", `v591-readonly-saturn-browser-png:${screenshot.path}`);
  assert(bytes.readUInt32BE(16) === (desktop ? 1440 : 390) && bytes.readUInt32BE(20) === (desktop ? 900 : 844), `v591-readonly-saturn-browser-dimensions:${screenshot.path}`);
}
verifyCoreBrowserSliceV591(bennuBrowser, {
  body: "bennu",
  version: "v591-bennu-browser-qualification-v1",
  status: "bennu-slice-passed-global-visual-matrix-pending",
  assetIds: ["bennu-regolith-albedo", "bennu-regolith-normal", "bennu-regolith-roughness"],
  desktopLod: "model-lod0;micro=4096x4096",
  mobileLod: "model-lod1;micro=2048x2048",
  frameFits: true,
});
verifyCoreBrowserSliceV591(vestaBrowser, {
  body: "vesta",
  version: "v591-vesta-browser-qualification-v1",
  status: "vesta-slice-passed-global-visual-matrix-pending",
  assetIds: ["bennu-regolith-albedo", "bennu-regolith-normal", "bennu-regolith-roughness"],
  desktopLod: "model-lod0;micro=4096x4096",
  mobileLod: "model-lod1;micro=2048x2048",
});
assert(vestaBrowser.runtime.ownedModel.includes("v591-vesta-nasa-shape-owned"), "v591-readonly-vesta-browser-model");
assert(vestaBrowser.runtime.microtextureExactByteReuse === true && vestaBrowser.runtime.measuredPhotometryClaim === false, "v591-readonly-vesta-browser-authority");
assert(vestaBrowser.orderedReplay.every((sample) => sample.textureReceipt.startsWith("exact-byte-reuse:")), "v591-readonly-vesta-browser-microtexture-reuse");
verifyCoreBrowserSliceV591(erosBrowser, {
  body: "eros",
  version: "v591-nasa-small-body-browser-qualification-v1",
  status: "eros-slice-passed-global-visual-matrix-pending",
  assetIds: ["bennu-regolith-albedo", "bennu-regolith-normal", "bennu-regolith-roughness"],
  desktopLod: "model-lod0;micro=4096x4096",
  mobileLod: "model-lod1;micro=2048x2048",
  frameFits: true,
});
verifyCoreBrowserSliceV591(kleopatraBrowser, {
  body: "kleopatra",
  version: "v591-nasa-small-body-browser-qualification-v1",
  status: "kleopatra-slice-passed-global-visual-matrix-pending",
  assetIds: ["bennu-regolith-albedo", "bennu-regolith-normal", "bennu-regolith-roughness"],
  desktopLod: "model-lod0;micro=4096x4096",
  mobileLod: "model-lod1;micro=2048x2048",
  frameFits: true,
});
verifyCoreBrowserSliceV591(tempel1Browser, {
  body: "tempel-1",
  version: "v591-tempel1-browser-qualification-v1",
  status: "tempel-1-slice-passed-global-visual-matrix-pending",
  assetIds: ["tempel-1-observation", "tempel-1-observation-mask", "bennu-regolith-albedo", "bennu-regolith-normal", "bennu-regolith-roughness"],
  desktopLod: "model-lod0;observation=2880x1440",
  mobileLod: "model-lod1;observation=1440x720",
  frameFits: true,
});
verifyCoreBrowserSliceV591(ceresBrowser, {
  body: "ceres",
  version: "v591-ceres-browser-qualification-v1",
  status: "ceres-slice-passed-global-visual-matrix-pending",
  assetIds: ["ceres-albedo", "ceres-normal", "ceres-roughness", "ceres-height", "bennu-regolith-albedo", "bennu-regolith-normal", "bennu-regolith-roughness"],
  desktopLod: "model-lod0;macro=4096x2048",
  mobileLod: "model-lod1;macro=2048x1024",
  frameFits: true,
});
verifyCoreBrowserSliceV591(uranusBrowser, {
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
  proceduralPrimary: true,
  frameFits: true,
});
verifyCoreBrowserSliceV591(neptuneBrowser, {
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
  proceduralPrimary: true,
  frameFits: true,
});
assert(manifest.heroAssetOverlays?.length === 16 && manifest.heroAssetOverlays.map((entry) => entry.body).join(",") === "sun,earth,mercury,venus,moon,mars,jupiter,saturn,vesta,bennu,eros,kleopatra,tempel-1,ceres,uranus,neptune", "v591-readonly-sixteen-hero-overlays");
for (const file of sourceManifest.files) {
  const path = resolve(root, file.path);
  assert(existsSync(path), `v591-readonly-source-missing:${file.path}`);
  assert(sha256(readFileSync(path)) === file.sha256, `v591-readonly-source-drift:${file.path}`);
}
for (const row of freezeBefore.frozenSnapshot) {
  const path = resolve(root, row.path);
  const actualSha256 = existsSync(path) ? sha256(readFileSync(path)) : null;
  assert(actualSha256 === row.expectedSha256, `v591-readonly-frozen-drift:${row.path}`);
}
const sunOverlay = verifySealed("public/data/celestial-convergence-v591/sun-asset-overlay.json", "receiptSha256");
assert(sunOverlay.receiptSha256 === manifest.heroAssetOverlays[0].overlaySha256, "v591-readonly-sun-overlay-chain");
assert(sunOverlay.mirroredHemisphereDisclosure === true, "v591-readonly-sun-observation-limit");
assert(sunOverlay.authorityState.presentationOnly === true && sunOverlay.authorityState.scientificAuthorityChanged === false, "v591-readonly-sun-authority");
for (const asset of sunOverlay.assets) {
  const sourcePath = resolve(root, asset.source.path);
  assert(existsSync(sourcePath), `v591-readonly-sun-source-missing:${asset.id}`);
  const sourceBytes = readFileSync(sourcePath);
  assert(sourceBytes.byteLength === asset.source.bytes && sha256(sourceBytes) === asset.source.sha256, `v591-readonly-sun-source-drift:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const decoded = decodeURIComponent(file.url.split("?")[0]);
    assert(file.url.startsWith("/textures/candidate-v591/") && !decoded.split("/").includes(".."), `v591-readonly-sun-variant-path:${asset.id}`);
    const path = resolve(root, `public/${decoded.replace(/^\/+/, "")}`);
    assert(existsSync(path), `v591-readonly-sun-variant-missing:${asset.id}`);
    const bytes = readFileSync(path);
    assert(bytes.byteLength === file.bytes && sha256(bytes) === file.sha256, `v591-readonly-sun-variant-drift:${asset.id}`);
  }
}
const earthOverlay = verifySealed("public/data/celestial-convergence-v591/earth-asset-overlay.json", "receiptSha256");
assert(earthOverlay.receiptSha256 === manifest.heroAssetOverlays[1].overlaySha256, "v591-readonly-earth-overlay-chain");
assert(earthOverlay.baseline.manifestSha256 === manifest.baseline.manifestSha256, "v591-readonly-earth-baseline-chain");
assert(earthOverlay.noNetworkRequestsPerformed === true && earthOverlay.noAssetBytesCopied === true, "v591-readonly-earth-exact-byte-reuse");
const v590Manifest = verifySealed("public/data/celestial-rendering-v590/manifest.json", "manifestSha256");
for (const asset of earthOverlay.assets) {
  const baselineAsset = v590Manifest.assets.find((entry) => entry.id === asset.id);
  assert(baselineAsset && canonicalSha(asset.variants) === canonicalSha(baselineAsset.variants), `v591-readonly-earth-variant-chain:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    assert(file, `v591-readonly-earth-variant-missing:${asset.id}`);
    const decoded = decodeURIComponent(file.url.split("?")[0]);
    assert(file.url.startsWith("/") && !decoded.split("/").includes(".."), `v591-readonly-earth-variant-path:${asset.id}`);
    const bytes = readFileSync(resolve(root, `public/${decoded.replace(/^\/+/, "")}`));
    assert(bytes.byteLength === file.bytes && sha256(bytes) === file.sha256, `v591-readonly-earth-variant-drift:${asset.id}`);
  }
}
const mercuryOverlay = verifySealed("public/data/celestial-convergence-v591/mercury-asset-overlay.json", "receiptSha256");
assert(mercuryOverlay.receiptSha256 === manifest.heroAssetOverlays[2].overlaySha256, "v591-readonly-mercury-overlay-chain");
assert(mercuryOverlay.acquisitionReceiptSha256 === manifest.heroAssetOverlays[2].acquisitionReceiptSha256, "v591-readonly-mercury-acquisition-chain");
assert(mercuryOverlay.metadataReceiptSha256 === manifest.heroAssetOverlays[2].metadataReceiptSha256, "v591-readonly-mercury-metadata-chain");
assert(mercuryOverlay.noNetworkRequestsPerformed === true && mercuryOverlay.exactByteV589AlbedoSourceReuse === true && mercuryOverlay.derivationDeterministic === true, "v591-readonly-mercury-reuse-policy");
assert(mercuryOverlay.authorityState.presentationOnly === true && mercuryOverlay.authorityState.scientificAuthorityChanged === false && mercuryOverlay.authorityState.scientificPayloadWriteback === false, "v591-readonly-mercury-authority");
assert(mercuryOverlay.proceduralFallback === false && mercuryOverlay.assets.length === 4 && mercuryOverlay.assets.map((asset) => asset.id).join(",") === "mercury-albedo,mercury-normal,mercury-roughness,mercury-height", "v591-readonly-mercury-assets");
for (const asset of mercuryOverlay.assets) {
  const albedo = asset.id === "mercury-albedo";
  assert(asset.body === "mercury" && asset.source.host === (albedo ? "assets.science.nasa.gov" : "asc-pds-services.s3.us-west-2.amazonaws.com"), `v591-readonly-mercury-host:${asset.id}`);
  assert(asset.source.license.id === (albedo ? "NASA-public-domain" : "USGS-public-domain"), `v591-readonly-mercury-license:${asset.id}`);
  assert(asset.derivation.seamMeanAbsoluteDelta === 0, `v591-readonly-mercury-seam:${asset.id}`);
  if (!albedo) {
    assert(asset.source.width === 23040 && asset.source.height === 11520 && asset.source.units === "meter", `v591-readonly-mercury-dem:${asset.id}`);
    assert(asset.derivation.sourceRangeMeters.minimum === -10764 && asset.derivation.sourceRangeMeters.maximum === 8994, `v591-readonly-mercury-height-range:${asset.id}`);
  }
  const sourceBytes = readFileSync(resolve(root, asset.source.path));
  assert(sourceBytes.byteLength === asset.source.bytes && sha256(sourceBytes) === asset.source.sha256, `v591-readonly-mercury-source-drift:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const decoded = decodeURIComponent(file.url.split("?")[0]);
    assert(file.url.startsWith("/textures/candidate-v591/mercury/") && !decoded.split("/").includes(".."), `v591-readonly-mercury-variant-path:${asset.id}`);
    const bytes = readFileSync(resolve(root, `public/${decoded.replace(/^\/+/, "")}`));
    assert(bytes.byteLength === file.bytes && sha256(bytes) === file.sha256, `v591-readonly-mercury-variant-drift:${asset.id}`);
  }
}
const venusOverlay = verifySealed("public/data/celestial-convergence-v591/venus-asset-overlay.json", "receiptSha256");
const venusAliasMetadata = verifySealed("docs/release/v591/metadata-probe-venus-s3-path-alias.json", "receiptSha256");
const venusAliasLedger = verifySealed("docs/release/v591/acquisition-url-ledger-venus-s3-path-alias.json", "receiptSha256");
const venusOriginalCubeBlocked = verifySealed("docs/release/v591/acquisition-blocked-venus-clrtopo-6600m-cube-source-v591.json", "receiptSha256");
const venusAliasBlocked = verifySealed("docs/release/v591/acquisition-blocked-venus-clrtopo-6600m-cube-path-alias-v591.json", "receiptSha256");
const venusMultiviewAcquisitions = [
  verifySealed("docs/release/v591/acquisition-asset-venus-magellan-0e.json", "receiptSha256"),
  verifySealed("docs/release/v591/acquisition-asset-venus-magellan-90e.json", "receiptSha256"),
  verifySealed("docs/release/v591/acquisition-asset-venus-magellan-270e.json", "receiptSha256"),
];
assert(venusOverlay.receiptSha256 === manifest.heroAssetOverlays[3].overlaySha256, "v591-readonly-venus-overlay-chain");
assert(venusOverlay.acquisitionReceiptSha256 === manifest.heroAssetOverlays[3].acquisitionReceiptSha256, "v591-readonly-venus-acquisition-chain");
assert(venusOverlay.acquisitionReceiptSha256 === canonicalSha(venusMultiviewAcquisitions.map((receipt) => receipt.receiptSha256)), "v591-readonly-venus-acquisition-set-chain");
assert(venusOverlay.sourceReceiptSha256s?.join(",") === venusMultiviewAcquisitions.map((receipt) => receipt.receiptSha256).join(","), "v591-readonly-venus-source-receipt-chain");
assert(venusMultiviewAcquisitions.every((receipt) => receipt.status === "committed-single-request-no-retry" && receipt.requestCount === 1 && receipt.automaticRetryPerformed === false && receipt.automaticReplacementPerformed === false), "v591-readonly-venus-single-request");
assert(venusAliasBlocked.status === "blocked-no-automatic-retry" && venusAliasBlocked.requestCount === 1 && venusAliasBlocked.automaticRetryPerformed === false && venusAliasBlocked.automaticReplacementPerformed === false, "v591-readonly-venus-alias-negative");
assert(venusAliasBlocked.url === venusAliasMetadata.candidate?.directUrl && String(venusAliasBlocked.error).includes("timeout"), "v591-readonly-venus-alias-timeout");
assert(venusAliasLedger.entries?.length === 1 && venusAliasLedger.entries[0]?.url === venusAliasMetadata.candidate?.directUrl && venusAliasLedger.entries[0]?.outcome === "response-received", "v591-readonly-venus-ledger-chain");
assert(venusOriginalCubeBlocked.status === "blocked-no-automatic-retry", "v591-readonly-venus-original-negative-chain");
assert(venusOverlay.noNetworkRequestsPerformed === true && venusOverlay.derivationDeterministic === true && venusOverlay.proceduralFallback === false, "v591-readonly-venus-policy");
assert(venusOverlay.cloudModel.observationTextureClaim === false && venusOverlay.cloudModel.resourceMissingFallback === false, "v591-readonly-venus-cloud-model");
assert(venusOverlay.authorityState.presentationOnly === true && venusOverlay.authorityState.scientificAuthorityChanged === false && venusOverlay.authorityState.scientificPayloadWriteback === false && venusOverlay.authorityState.measuredAuthorityGranted === false, "v591-readonly-venus-authority");
assert(venusOverlay.assets.length === 4 && venusOverlay.assets.map((asset) => asset.id).join(",") === "venus-surface,venus-normal,venus-roughness,venus-height", "v591-readonly-venus-assets");
for (const acquisition of venusMultiviewAcquisitions) {
  const sourceBytes = readFileSync(resolve(root, acquisition.asset.outputPath));
  assert(sourceBytes.byteLength === acquisition.asset.bytes && sha256(sourceBytes) === acquisition.asset.sha256, `v591-readonly-venus-source-drift:${acquisition.asset.id}`);
}
for (const asset of venusOverlay.assets) {
  assert(asset.body === "venus" && asset.source.host === "images-assets.nasa.gov" && asset.source.license.id === "NASA-public-domain", `v591-readonly-venus-provenance:${asset.id}`);
  assert(asset.source.sha256 === venusMultiviewAcquisitions[0].asset.sha256 && asset.sourceComponents?.length === 3, `v591-readonly-venus-derivation:${asset.id}`);
  assert(asset.sourceComponents.every((source, index) => source.acquisitionReceiptSha256 === venusMultiviewAcquisitions[index].receiptSha256 && source.sha256 === venusMultiviewAcquisitions[index].asset.sha256 && source.host === "images-assets.nasa.gov" && source.gridReference === false), `v591-readonly-venus-components:${asset.id}`);
  assert(asset.derivation.gridReferenceWeightFraction === 0 && String(asset.derivation.observationLimit).includes("not physical elevation"), `v591-readonly-venus-observation-limit:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const decoded = decodeURIComponent(file.url.split("?")[0]);
    assert(file.url.startsWith("/textures/candidate-v591/venus/") && !decoded.split("/").includes(".."), `v591-readonly-venus-variant-path:${asset.id}`);
    const bytes = readFileSync(resolve(root, `public/${decoded.replace(/^\/+/, "")}`));
    assert(bytes.byteLength === file.bytes && sha256(bytes) === file.sha256, `v591-readonly-venus-variant-drift:${asset.id}`);
  }
}
const moonOverlay = verifySealed("public/data/celestial-convergence-v591/moon-asset-overlay.json", "receiptSha256");
assert(moonOverlay.receiptSha256 === manifest.heroAssetOverlays[4].overlaySha256, "v591-readonly-moon-overlay-chain");
assert(moonOverlay.acquisitionReceiptSha256 === manifest.heroAssetOverlays[4].acquisitionReceiptSha256, "v591-readonly-moon-acquisition-chain");
assert(moonOverlay.authorityState.presentationOnly === true && moonOverlay.authorityState.scientificAuthorityChanged === false && moonOverlay.authorityState.scientificPayloadWriteback === false, "v591-readonly-moon-authority");
assert(moonOverlay.assets.length === 4 && moonOverlay.assets.map((asset) => asset.id).join(",") === "moon-albedo,moon-normal,moon-roughness,moon-height", "v591-readonly-moon-assets");
for (const asset of moonOverlay.assets) {
  assert(asset.body === "moon" && asset.source.host === "svs.gsfc.nasa.gov" && asset.source.license.id === "NASA-public-domain", `v591-readonly-moon-provenance:${asset.id}`);
  assert(asset.derivation.seamMeanAbsoluteDelta === 0, `v591-readonly-moon-seam:${asset.id}`);
  const sourceBytes = readFileSync(resolve(root, asset.source.path));
  assert(sourceBytes.byteLength === asset.source.bytes && sha256(sourceBytes) === asset.source.sha256, `v591-readonly-moon-source-drift:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const decoded = decodeURIComponent(file.url.split("?")[0]);
    assert(file.url.startsWith("/textures/candidate-v591/moon/") && !decoded.split("/").includes(".."), `v591-readonly-moon-variant-path:${asset.id}`);
    const bytes = readFileSync(resolve(root, `public/${decoded.replace(/^\/+/, "")}`));
    assert(bytes.byteLength === file.bytes && sha256(bytes) === file.sha256, `v591-readonly-moon-variant-drift:${asset.id}`);
  }
}
const marsOverlay = verifySealed("public/data/celestial-convergence-v591/mars-asset-overlay.json", "receiptSha256");
assert(marsOverlay.receiptSha256 === manifest.heroAssetOverlays[5].overlaySha256, "v591-readonly-mars-overlay-chain");
assert(
  marsOverlay.version === "v591-mars-asset-overlay-v3"
  && marsOverlay.status === "mars-usgs-viking-color-mola-terrain-admitted"
  && marsOverlay.blockers?.length === 0
  && marsOverlay.proceduralFallback === false
  && manifest.heroAssetOverlays[5].proceduralFallback === false,
  "v591-readonly-mars-admitted-status",
);
const marsResampleAudit = verifySealed("docs/release/v591/mars-albedo-usgs-resample-audit.json", "receiptSha256");
const marsCompositeRejection = verifySealed("docs/release/v591/mars-albedo-composite-rejection.json", "receiptSha256");
assert(marsOverlay.albedoResampleAuditReceiptSha256 === marsResampleAudit.receiptSha256 && marsResampleAudit.claims.nativeEightKObservation === false, "v591-readonly-mars-resample-chain");
assert(marsOverlay.compositeRejectionReceiptSha256 === marsCompositeRejection.receiptSha256 && marsCompositeRejection.runtimeAdmission === false, "v591-readonly-mars-composite-rejection-chain");
assert(marsOverlay.assets.length === 4 && marsOverlay.assets.map((asset) => asset.id).join(",") === "mars-albedo,mars-normal,mars-roughness,mars-height", "v591-readonly-mars-assets");
for (const asset of marsOverlay.assets) {
  const albedo = asset.id === "mars-albedo";
  assert(asset.body === "mars" && asset.source.host === (albedo ? "astrogeology.usgs.gov" : "pds-geosciences.wustl.edu"), `v591-readonly-mars-host:${asset.id}`);
  assert(asset.source.license.id === (albedo ? "NASA-USGS-public-domain" : "NASA-PDS-public-domain"), `v591-readonly-mars-license:${asset.id}`);
  if (albedo) {
    assert(asset.source.width === 1024 && asset.source.height === 512 && asset.derivation.parameters.sourceDetailCeiling === "1024x512" && asset.derivation.parameters.highFrequencySourceAdded === false, "v591-readonly-mars-albedo-ceiling");
  } else {
    assert(asset.source.width === 5760 && asset.source.height === 2880 && asset.derivation.sourceRangeMeters.minimum === -8177 && asset.derivation.sourceRangeMeters.maximum === 21171, `v591-readonly-mars-terrain:${asset.id}`);
  }
  const sourceBytes = readFileSync(resolve(root, asset.source.path));
  assert(sourceBytes.byteLength === asset.source.bytes && sha256(sourceBytes) === asset.source.sha256, `v591-readonly-mars-source-drift:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const decoded = decodeURIComponent(file.url.split("?")[0]);
    assert(file.url.startsWith("/textures/candidate-v591/mars/") && !decoded.split("/").includes(".."), `v591-readonly-mars-variant-path:${asset.id}`);
    const bytes = readFileSync(resolve(root, `public/${decoded.replace(/^\/+/, "")}`));
    assert(bytes.byteLength === file.bytes && sha256(bytes) === file.sha256, `v591-readonly-mars-variant-drift:${asset.id}`);
  }
}
const jupiterOverlay = verifySealed("public/data/celestial-convergence-v591/jupiter-asset-overlay.json", "receiptSha256");
assert(jupiterOverlay.receiptSha256 === manifest.heroAssetOverlays[6].overlaySha256, "v591-readonly-jupiter-overlay-chain");
assert(jupiterOverlay.acquisitionReceiptSha256 === manifest.heroAssetOverlays[6].acquisitionReceiptSha256, "v591-readonly-jupiter-acquisition-chain");
assert(jupiterOverlay.authorityState.presentationOnly === true && jupiterOverlay.authorityState.scientificAuthorityChanged === false && jupiterOverlay.authorityState.scientificPayloadWriteback === false, "v591-readonly-jupiter-authority");
assert(jupiterOverlay.proceduralFallback === false, "v591-readonly-jupiter-procedural-fallback");
assert(jupiterOverlay.assets.length === 3 && jupiterOverlay.assets.map((asset) => asset.id).join(",") === "jupiter-albedo,jupiter-band-mask,jupiter-storm-mask", "v591-readonly-jupiter-assets");
for (const asset of jupiterOverlay.assets) {
  assert(asset.body === "jupiter" && asset.source.host === "assets.science.nasa.gov" && asset.source.license.id === "NASA-JPL-public-domain", `v591-readonly-jupiter-provenance:${asset.id}`);
  assert(asset.source.width === 3601 && asset.source.height === 1801 && asset.derivation.sourceDetailCeiling === "3601x1801", `v591-readonly-jupiter-source-ceiling:${asset.id}`);
  const sourceBytes = readFileSync(resolve(root, asset.source.path));
  assert(sourceBytes.byteLength === asset.source.bytes && sha256(sourceBytes) === asset.source.sha256, `v591-readonly-jupiter-source-drift:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const decoded = decodeURIComponent(file.url.split("?")[0]);
    assert(file.url.startsWith("/textures/candidate-v591/jupiter/") && !decoded.split("/").includes(".."), `v591-readonly-jupiter-variant-path:${asset.id}`);
    const bytes = readFileSync(resolve(root, `public/${decoded.replace(/^\/+/, "")}`));
    assert(bytes.byteLength === file.bytes && sha256(bytes) === file.sha256, `v591-readonly-jupiter-variant-drift:${asset.id}`);
  }
}
const saturnOverlay = verifySealed("public/data/celestial-convergence-v591/saturn-asset-overlay.json", "receiptSha256");
assert(saturnOverlay.receiptSha256 === manifest.heroAssetOverlays[7].overlaySha256, "v591-readonly-saturn-overlay-chain");
assert(saturnOverlay.acquisitionReceiptSha256 === manifest.heroAssetOverlays[7].acquisitionReceiptSha256 && saturnOverlay.atmosphereSupplementReceiptSha256 === manifest.heroAssetOverlays[7].atmosphereSupplementReceiptSha256, "v591-readonly-saturn-acquisition-chain");
assert(saturnOverlay.authorityState.presentationOnly === true && saturnOverlay.authorityState.scientificAuthorityChanged === false && saturnOverlay.authorityState.scientificPayloadWriteback === false, "v591-readonly-saturn-authority");
assert(saturnOverlay.proceduralFallback === false && saturnOverlay.ringGeometry.radialUv === true && saturnOverlay.ringGeometry.premultipliedAlpha === true, "v591-readonly-saturn-geometry-policy");
assert(saturnOverlay.assets.length === 5 && saturnOverlay.assets.map((asset) => asset.id).join(",") === "saturn-atmosphere-albedo,saturn-band-mask,saturn-polar-detail,saturn-ring-color,saturn-ring-optical-depth", "v591-readonly-saturn-assets");
for (const asset of saturnOverlay.assets) {
  assert(asset.body === "saturn" && asset.source.host === "images-assets.nasa.gov" && asset.source.license.id === "NASA-JPL-public-domain", `v591-readonly-saturn-provenance:${asset.id}`);
  const sourceBytes = readFileSync(resolve(root, asset.source.path));
  assert(sourceBytes.byteLength === asset.source.bytes && sha256(sourceBytes) === asset.source.sha256, `v591-readonly-saturn-source-drift:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const decoded = decodeURIComponent(file.url.split("?")[0]);
    assert(file.url.startsWith("/textures/candidate-v591/saturn/") && !decoded.split("/").includes(".."), `v591-readonly-saturn-variant-path:${asset.id}`);
    const bytes = readFileSync(resolve(root, `public/${decoded.replace(/^\/+/, "")}`));
    assert(bytes.byteLength === file.bytes && sha256(bytes) === file.sha256, `v591-readonly-saturn-variant-drift:${asset.id}`);
  }
}
const bennuOverlay = verifySealed("public/data/celestial-convergence-v591/bennu-asset-overlay.json", "receiptSha256");
const vestaOverlay = verifySealed("public/data/celestial-convergence-v591/vesta-asset-overlay.json", "receiptSha256");
assert(vestaOverlay.receiptSha256 === manifest.heroAssetOverlays[8].overlaySha256, "v591-readonly-vesta-overlay-chain");
assert(vestaOverlay.acquisitionReceiptSha256 === manifest.heroAssetOverlays[8].acquisitionReceiptSha256, "v591-readonly-vesta-acquisition-chain");
assert(vestaOverlay.modelLodReceiptSha256 === manifest.heroAssetOverlays[8].modelLodReceiptSha256, "v591-readonly-vesta-model-receipt-chain");
assert(vestaOverlay.authorityState.presentationOnly === true && vestaOverlay.authorityState.scientificAuthorityChanged === false && vestaOverlay.authorityState.scientificPayloadWriteback === false && vestaOverlay.authorityState.measuredPhotometryClaim === false, "v591-readonly-vesta-authority");
assert(vestaOverlay.proceduralFallback === false && vestaOverlay.noTextureBytesCopied === true, "v591-readonly-vesta-no-fallback-or-copy");
assert(vestaOverlay.model.candidate === "v591-owned" && vestaOverlay.model.license.id === "NASA-public-domain" && vestaOverlay.model.lods.length === 3, "v591-readonly-vesta-model");
const vestaSourceBytes = readFileSync(resolve(root, vestaOverlay.model.sourcePath));
assert(vestaSourceBytes.byteLength === vestaOverlay.model.sourceBytes && sha256(vestaSourceBytes) === vestaOverlay.model.sourceSha256, "v591-readonly-vesta-model-source");
for (const lod of vestaOverlay.model.lods) {
  const bytes = readFileSync(resolve(root, lod.path));
  assert(bytes.byteLength === lod.bytes && sha256(bytes) === lod.sha256, `v591-readonly-vesta-model-lod:${lod.lod}`);
  assert(lod.normals === true && lod.meshopt === true && lod.pivot === "bounds-midpoint" && lod.units === "normalized-diameter-2" && lod.rotationAxis === "positive-y", `v591-readonly-vesta-model-contract:${lod.lod}`);
}
assert(vestaOverlay.microtextureReuse.sourceOverlaySha256 === bennuOverlay.receiptSha256 && vestaOverlay.microtextureReuse.noTextureBytesCopied === true, "v591-readonly-vesta-microtexture-source");
assert(vestaOverlay.microtextureReuse.assets.length === 3, "v591-readonly-vesta-microtexture-count");
for (const [index, reused] of vestaOverlay.microtextureReuse.assets.entries()) {
  const inherited = bennuOverlay.assets[index];
  assert(reused.id === inherited.id.replace("bennu-", "vesta-") && reused.inheritedAssetId === inherited.id && reused.exactByteReuse === true, `v591-readonly-vesta-microtexture-identity:${index}`);
  assert(canonicalSha(reused.variants) === canonicalSha(inherited.variants), `v591-readonly-vesta-microtexture-bytes:${index}`);
}
assert(bennuOverlay.receiptSha256 === manifest.heroAssetOverlays[9].overlaySha256, "v591-readonly-bennu-overlay-chain");
assert(bennuOverlay.acquisitionReceiptSha256 === manifest.heroAssetOverlays[9].acquisitionReceiptSha256, "v591-readonly-bennu-acquisition-chain");
assert(bennuOverlay.authorityState.presentationOnly === true && bennuOverlay.authorityState.scientificAuthorityChanged === false && bennuOverlay.authorityState.scientificPayloadWriteback === false, "v591-readonly-bennu-authority");
assert(bennuOverlay.proceduralFallback === false && bennuOverlay.noModelBytesCopied === true, "v591-readonly-bennu-no-fallback-or-copy");
assert(bennuOverlay.inheritedModel.candidate === "v589-readonly" && bennuOverlay.inheritedModel.lods.length === 3, "v591-readonly-bennu-model");
for (const lod of bennuOverlay.inheritedModel.lods) {
  const bytes = readFileSync(resolve(root, lod.path));
  assert(bytes.byteLength === lod.bytes && sha256(bytes) === lod.sha256, `v591-readonly-bennu-model-lod:${lod.lod}`);
  assert(lod.normals === true && lod.meshopt === true && lod.pivot === "bounds-midpoint", `v591-readonly-bennu-model-contract:${lod.lod}`);
}
assert(bennuOverlay.assets.length === 3 && bennuOverlay.assets.map((asset) => asset.id).join(",") === "bennu-regolith-albedo,bennu-regolith-normal,bennu-regolith-roughness", "v591-readonly-bennu-assets");
for (const asset of bennuOverlay.assets) {
  assert(asset.body === "bennu" && asset.source.host === "dl.polyhaven.org" && asset.source.license.id === "Poly-Haven-CC0", `v591-readonly-bennu-provenance:${asset.id}`);
  assert(asset.source.width === 4096 && asset.source.height === 4096 && asset.source.observationLimit.includes("not Bennu"), `v591-readonly-bennu-source-policy:${asset.id}`);
  const sourceBytes = readFileSync(resolve(root, asset.source.path));
  assert(sourceBytes.byteLength === asset.source.bytes && sha256(sourceBytes) === asset.source.sha256, `v591-readonly-bennu-source-drift:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const decoded = decodeURIComponent(file.url.split("?")[0]);
    assert(file.url.startsWith("/textures/candidate-v591/bennu/") && !decoded.split("/").includes(".."), `v591-readonly-bennu-variant-path:${asset.id}`);
    const bytes = readFileSync(resolve(root, `public/${decoded.replace(/^\/+/, "")}`));
    assert(bytes.byteLength === file.bytes && sha256(bytes) === file.sha256, `v591-readonly-bennu-variant-drift:${asset.id}`);
  }
}
const erosOverlay = verifySealed("public/data/celestial-convergence-v591/eros-asset-overlay.json", "receiptSha256");
const kleopatraOverlay = verifySealed("public/data/celestial-convergence-v591/kleopatra-asset-overlay.json", "receiptSha256");
for (const [body, overlay, browser, manifestIndex, expectedDetailCeiling, expectedReconstruction] of [
  ["eros", erosOverlay, erosBrowser, 10, "nasa-shape-200856-triangles", "watertight-topology-paired"],
  ["kleopatra", kleopatraOverlay, kleopatraBrowser, 11, "nasa-low-resolution-radar-shape-4092-triangles", "not-applicable"],
]) {
  const manifestEntry = manifest.heroAssetOverlays[manifestIndex];
  assert(overlay.receiptSha256 === manifest.heroAssetOverlays[manifestIndex].overlaySha256, `v591-readonly-${body}-overlay-chain`);
  assert(overlay.modelLodReceiptSha256 === manifest.heroAssetOverlays[manifestIndex].modelLodReceiptSha256, `v591-readonly-${body}-model-receipt-chain`);
  assert(overlay.body === body && overlay.version === "v591-nasa-small-body-asset-overlay-v1", `v591-readonly-${body}-overlay-identity`);
  assert(
    overlay.authorityState.presentationOnly === true
      && overlay.authorityState.scientificAuthorityChanged === false
      && overlay.authorityState.scientificPayloadWriteback === false
      && overlay.authorityState.measuredPhotometryClaim === false
      && overlay.proceduralFallback === false,
    `v591-readonly-${body}-authority`,
  );
  assert(overlay.model.candidate === "v591-owned" && overlay.model.watertight === true && overlay.model.sourceDetailCeiling === expectedDetailCeiling && overlay.model.lods.length === 3, `v591-readonly-${body}-model-contract`);
  if (body === "eros") {
    assert(
      overlay.model.printableSplitReconstruction?.outputComponentCount === 1
        && overlay.model.printableSplitReconstruction?.outputEulerNumber === 2
        && overlay.model.printableSplitReconstruction?.boundaryEdgeCount === 0
        && overlay.model.printableSplitReconstruction?.nonManifoldEdgeCount === 0
        && overlay.model.printableSplitReconstruction?.watertight === true,
      "v591-readonly-eros-reconstruction",
    );
  } else {
    assert(overlay.model.printableSplitReconstruction === null && overlay.model.lods[0].triangleCount === 4092, "v591-readonly-kleopatra-detail-ceiling");
  }
  const sourceBytes = readFileSync(resolve(root, overlay.model.sourcePath));
  assert(sourceBytes.byteLength === overlay.model.sourceBytes && sha256(sourceBytes) === overlay.model.sourceSha256, `v591-readonly-${body}-model-source`);
  for (const lod of overlay.model.lods) {
    const bytes = readFileSync(resolve(root, lod.path));
    assert(bytes.byteLength === lod.bytes && sha256(bytes) === lod.sha256, `v591-readonly-${body}-model-lod:${lod.lod}`);
    assert(lod.normals === true && lod.meshopt === true && lod.pivot === "bounds-midpoint" && lod.units === "normalized-diameter-2" && lod.rotationAxis === "positive-y", `v591-readonly-${body}-model-lod-contract:${lod.lod}`);
  }
  assert(overlay.microtextureReuse.sourceOverlaySha256 === bennuOverlay.receiptSha256 && overlay.microtextureReuse.noTextureBytesCopied === true && overlay.microtextureReuse.assets.length === 3, `v591-readonly-${body}-microtexture-source`);
  for (const [index, reused] of overlay.microtextureReuse.assets.entries()) {
    const inherited = bennuOverlay.assets[index];
    assert(reused.inheritedAssetId === inherited.id && reused.exactByteReuse === true && reused.presentationOnly === true, `v591-readonly-${body}-microtexture-policy:${index}`);
    assert(canonicalSha(reused.variants) === canonicalSha(inherited.variants), `v591-readonly-${body}-microtexture-bytes:${index}`);
  }
  assert(
    browser.runtime.assetOverlaySha256 === overlay.receiptSha256
      && browser.runtime.modelLodReceiptSha256 === overlay.modelLodReceiptSha256
      && browser.runtime.sourceDetailCeiling === expectedDetailCeiling
      && browser.runtime.printableSplitReconstruction === expectedReconstruction
      && String(manifestEntry.microtexturePolicy).includes("exact-byte-reuse")
      && browser.runtime.microtexturePolicy === manifestEntry.microtexturePolicy
      && browser.runtime.microtextureSourceOverlaySha256 === bennuOverlay.receiptSha256
      && browser.runtime.microtextureExactByteReuse === true
      && browser.runtime.measuredPhotometryClaim === false
      && browser.runtime.proceduralFallback === false,
    `v591-readonly-${body}-browser-runtime-contract`,
  );
  for (const sample of browser.orderedReplay) {
    const expectedModel = overlay.model.lods[sample.deviceTier === "mobile" ? 1 : 0];
    assert(
      sample.assetOverlaySha256 === overlay.receiptSha256
        && sample.modelLodReceiptSha256 === overlay.modelLodReceiptSha256
        && sample.modelStatus === "ready"
        && sample.modelLod === String(expectedModel.lod)
        && sample.modelSha256 === expectedModel.sha256
        && sample.modelGpuBytes > 0
        && sample.sourceDetailCeiling === expectedDetailCeiling
        && sample.printableSplitReconstruction === expectedReconstruction
        && sample.microtextureExactByteReuse === true
        && sample.measuredPhotometryClaim === false
        && sample.proceduralFallback === false
        && sample.scientificPayloadMutation === false,
      `v591-readonly-${body}-browser-model-sample:${sample.sequence}`,
    );
  }
}
const tempel1Overlay = verifySealed("public/data/celestial-convergence-v591/tempel-1-asset-overlay.json", "receiptSha256");
const tempel1Acquisition = verifySealed("docs/release/v591/acquisition-asset-tempel-1-pds-shape-v2.json", "receiptSha256");
const tempel1ModelReceipt = verifySealed("docs/release/v591/tempel-1-model-lod-receipt-v591.json", "receiptSha256");
const tempel1BuildReceipt = verifySealed("docs/release/v591/tempel-1-asset-build-receipt-v591.json", "receiptSha256");
assert(tempel1Overlay.receiptSha256 === manifest.heroAssetOverlays[12].overlaySha256, "v591-readonly-tempel1-overlay-chain");
assert(tempel1Overlay.modelLodReceiptSha256 === manifest.heroAssetOverlays[12].modelLodReceiptSha256 && tempel1Overlay.modelLodReceiptSha256 === tempel1ModelReceipt.receiptSha256, "v591-readonly-tempel1-model-receipt-chain");
assert(tempel1Overlay.acquisitionReceiptSha256 === manifest.heroAssetOverlays[12].acquisitionReceiptSha256 && tempel1Overlay.acquisitionReceiptSha256 === tempel1Acquisition.receiptSha256, "v591-readonly-tempel1-acquisition-chain");
assert(tempel1BuildReceipt.overlayReceiptSha256 === tempel1Overlay.receiptSha256 && tempel1BuildReceipt.modelLodReceiptSha256 === tempel1ModelReceipt.receiptSha256, "v591-readonly-tempel1-build-chain");
assert(tempel1Acquisition.status === "committed-single-request-no-retry" && tempel1Acquisition.requestCount === 1 && tempel1Acquisition.automaticRetryPerformed === false && tempel1Acquisition.automaticReplacementPerformed === false, "v591-readonly-tempel1-single-request");
assert(tempel1Acquisition.asset.datasetId === "DIF-C-HRIV/ITS/MRI-5-TEMPEL1-SHAPE-V2.0" && tempel1Acquisition.asset.license.id === "NASA-PDS-SBN-public-data", "v591-readonly-tempel1-provenance");
assert(tempel1Overlay.version === "v591-tempel-1-asset-overlay-v1" && ["tempel-1-assets-derived-awaiting-runtime-admission", "tempel-1-runtime-admitted"].includes(tempel1Overlay.status), "v591-readonly-tempel1-overlay-status");
assert(tempel1Overlay.authorityState.presentationOnly === true && tempel1Overlay.authorityState.scientificPayloadWriteback === false && tempel1Overlay.authorityState.measuredPhotometryClaim === false && tempel1Overlay.proceduralFallback === false, "v591-readonly-tempel1-authority");
assert(tempel1Overlay.model.watertight === true && tempel1Overlay.model.sourceDetailCeiling === "pds-deep-impact-stardust-next-32040-triangles" && tempel1Overlay.model.lods.map((lod) => lod.triangleCount).join(",") === "32040,8010,2002", "v591-readonly-tempel1-model-contract");
assert(tempel1Overlay.observationMapping.projection === "simple-cylindrical" && tempel1Overlay.observationMapping.observedPixelFraction === 0.8043214699074074 && tempel1Overlay.observationMapping.unobservedPixelsAreMeasuredDarkTerrain === false, "v591-readonly-tempel1-observation-contract");
const tempel1SourceBytes = readFileSync(resolve(root, tempel1Overlay.model.sourcePath));
assert(sha256(tempel1SourceBytes) === tempel1Overlay.model.sourceSha256, "v591-readonly-tempel1-model-source");
for (const lod of tempel1Overlay.model.lods) {
  const bytes = readFileSync(resolve(root, lod.path));
  assert(bytes.byteLength === lod.bytes && sha256(bytes) === lod.sha256, `v591-readonly-tempel1-model-lod:${lod.lod}`);
  assert(lod.normals === true && lod.meshopt === true && lod.pivot === "bounds-midpoint" && lod.units === "normalized-diameter-2" && lod.rotationAxis === "positive-y", `v591-readonly-tempel1-model-lod-contract:${lod.lod}`);
}
assert(tempel1Overlay.assets.length === 2 && tempel1Overlay.assets.map((asset) => asset.id).join(",") === "tempel-1-observation,tempel-1-observation-mask", "v591-readonly-tempel1-assets");
for (const asset of tempel1Overlay.assets) {
  assert(asset.body === "tempel-1" && asset.source.license.id === "NASA-PDS-SBN-public-data" && asset.presentationOnly === true, `v591-readonly-tempel1-asset-provenance:${asset.id}`);
  const sourceBytes = readFileSync(resolve(root, asset.source.path));
  assert(sourceBytes.byteLength === asset.source.bytes && sha256(sourceBytes) === asset.source.sha256, `v591-readonly-tempel1-source-drift:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const decoded = decodeURIComponent(file.url.split("?")[0]);
    assert(file.url.startsWith("/textures/candidate-v591/tempel-1/") && !decoded.split("/").includes(".."), `v591-readonly-tempel1-variant-path:${asset.id}`);
    const bytes = readFileSync(resolve(root, `public/${decoded.replace(/^\/+/, "")}`));
    assert(bytes.byteLength === file.bytes && sha256(bytes) === file.sha256, `v591-readonly-tempel1-variant-drift:${asset.id}`);
  }
}
assert(tempel1Overlay.microtextureReuse.sourceOverlaySha256 === bennuOverlay.receiptSha256 && tempel1Overlay.microtextureReuse.noTextureBytesCopied === true && tempel1Overlay.microtextureReuse.assets.length === 3, "v591-readonly-tempel1-microtexture-source");
for (const [index, reused] of tempel1Overlay.microtextureReuse.assets.entries()) {
  const inherited = bennuOverlay.assets[index];
  assert(reused.inheritedAssetId === inherited.id && reused.exactByteReuse === true && reused.presentationOnly === true && canonicalSha(reused.variants) === canonicalSha(inherited.variants), `v591-readonly-tempel1-microtexture-policy:${index}`);
}
const ceresOverlay = verifySealed("public/data/celestial-convergence-v591/ceres-asset-overlay.json", "receiptSha256");
const ceresMetadata = verifySealed("docs/release/v591/metadata-probe-ceres-pds-target-products.json", "receiptSha256");
const ceresAcquisition = verifySealed("docs/release/v591/acquisition-asset-ceres-pds-radius-albedo.json", "receiptSha256");
const ceresModelReceipt = verifySealed("docs/release/v591/ceres-model-lod-receipt-v591.json", "receiptSha256");
const ceresDerivationReceipt = verifySealed("docs/release/v591/ceres-texture-derivation-receipt-v591.json", "receiptSha256");
const ceresBuildReceipt = verifySealed("docs/release/v591/ceres-asset-build-receipt-v591.json", "receiptSha256");
assert(ceresOverlay.receiptSha256 === manifest.heroAssetOverlays[13].overlaySha256, "v591-readonly-ceres-overlay-chain");
assert(ceresOverlay.metadataReceiptSha256 === manifest.heroAssetOverlays[13].metadataReceiptSha256 && ceresOverlay.metadataReceiptSha256 === ceresMetadata.receiptSha256, "v591-readonly-ceres-metadata-chain");
assert(ceresOverlay.acquisitionReceiptSha256 === manifest.heroAssetOverlays[13].acquisitionReceiptSha256 && ceresOverlay.acquisitionReceiptSha256 === ceresAcquisition.receiptSha256, "v591-readonly-ceres-acquisition-chain");
assert(ceresOverlay.modelLodReceiptSha256 === manifest.heroAssetOverlays[13].modelLodReceiptSha256 && ceresOverlay.modelLodReceiptSha256 === ceresModelReceipt.receiptSha256, "v591-readonly-ceres-model-receipt-chain");
assert(ceresBuildReceipt.overlayReceiptSha256 === ceresOverlay.receiptSha256 && ceresBuildReceipt.modelLodReceiptSha256 === ceresModelReceipt.receiptSha256 && ceresBuildReceipt.derivationReceiptSha256 === ceresDerivationReceipt.receiptSha256, "v591-readonly-ceres-build-chain");
assert(ceresMetadata.status === "required-shape-map-products-present-no-payload" && ceresMetadata.requestCount === 1 && ceresMetadata.payloadDownloaded === false, "v591-readonly-ceres-metadata-policy");
assert(ceresAcquisition.status === "four-assets-committed-single-request-each-no-retry" && ceresAcquisition.requestCount === 4 && ceresAcquisition.automaticRetryPerformed === false && ceresAcquisition.automaticReplacementPerformed === false, "v591-readonly-ceres-single-request");
assert(ceresOverlay.version === "v591-ceres-asset-overlay-v1" && ["ceres-assets-derived-awaiting-runtime-admission", "ceres-runtime-admitted"].includes(ceresOverlay.status), "v591-readonly-ceres-overlay-status");
assert(ceresOverlay.authorityState.presentationOnly === true && ceresOverlay.authorityState.scientificPayloadWriteback === false && ceresOverlay.authorityState.measuredPhotometryClaim === false && ceresOverlay.authorityState.measuredAuthorityGranted === false && ceresOverlay.proceduralFallback === false, "v591-readonly-ceres-authority");
assert(ceresOverlay.model.watertight === true && ceresOverlay.model.sourceDetailCeiling === "pds-dawn-spc-radius-2222x1111-261120-triangles" && ceresOverlay.model.lods.map((lod) => lod.triangleCount).join(",") === "104448,24806,4960", "v591-readonly-ceres-model-contract");
assert(ceresOverlay.materialPolicy.opticalColorClaim === false && ceresOverlay.materialPolicy.syntheticDetailAdded === false && ceresOverlay.blockers.length === 0, "v591-readonly-ceres-material-policy");
const ceresSourceBytes = readFileSync(resolve(root, ceresOverlay.model.sourcePath));
assert(sha256(ceresSourceBytes) === ceresOverlay.model.sourceSha256, "v591-readonly-ceres-model-source");
for (const lod of ceresOverlay.model.lods) {
  const bytes = readFileSync(resolve(root, lod.path));
  assert(bytes.byteLength === lod.bytes && sha256(bytes) === lod.sha256, `v591-readonly-ceres-model-lod:${lod.lod}`);
  assert(lod.normals === true && lod.meshopt === true && lod.pivot === "body-center-origin" && lod.units === "mean-radius-1" && lod.rotationAxis === "positive-y", `v591-readonly-ceres-model-lod-contract:${lod.lod}`);
}
assert(ceresOverlay.assets.length === 4 && ceresOverlay.assets.map((asset) => asset.id).join(",") === "ceres-albedo,ceres-normal,ceres-roughness,ceres-height", "v591-readonly-ceres-assets");
for (const asset of ceresOverlay.assets) {
  assert(asset.body === "ceres" && asset.source.license.id === "NASA-PDS-public-data" && asset.source.width === 2222 && asset.source.height === 1111 && asset.presentationOnly === true, `v591-readonly-ceres-asset-provenance:${asset.id}`);
  assert(asset.derivation.receiptSha256 === ceresDerivationReceipt.receiptSha256 && asset.derivation.sourceDetailCeiling === "2222x1111" && asset.derivation.deliveryUpscaleAddsObservationDetail === false && asset.derivation.syntheticDetailAdded === false, `v591-readonly-ceres-asset-derivation:${asset.id}`);
  const sourceBytes = readFileSync(resolve(root, asset.source.path));
  assert(sourceBytes.byteLength === asset.source.bytes && sha256(sourceBytes) === asset.source.sha256, `v591-readonly-ceres-source-drift:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    const decoded = decodeURIComponent(file.url.split("?")[0]);
    assert(file.url.startsWith("/textures/candidate-v591/ceres/") && !decoded.split("/").includes(".."), `v591-readonly-ceres-variant-path:${asset.id}`);
    const bytes = readFileSync(resolve(root, `public/${decoded.replace(/^\/+/, "")}`));
    assert(bytes.byteLength === file.bytes && sha256(bytes) === file.sha256, `v591-readonly-ceres-variant-drift:${asset.id}`);
  }
}
assert(ceresOverlay.microtextureReuse.sourceOverlaySha256 === bennuOverlay.receiptSha256 && ceresOverlay.microtextureReuse.noTextureBytesCopied === true && ceresOverlay.microtextureReuse.assets.length === 3, "v591-readonly-ceres-microtexture-source");
for (const [index, reused] of ceresOverlay.microtextureReuse.assets.entries()) {
  const inherited = bennuOverlay.assets[index];
  assert(reused.inheritedAssetId === inherited.id && reused.exactByteReuse === true && reused.presentationOnly === true && canonicalSha(reused.variants) === canonicalSha(inherited.variants), `v591-readonly-ceres-microtexture-policy:${index}`);
}
const iceGiantPrimaryOverlay = verifySealed("public/data/celestial-convergence-v591/ice-giant-primary-overlay.json", "receiptSha256");
assert(manifest.heroAssetOverlays[14].overlaySha256 === iceGiantPrimaryOverlay.receiptSha256 && manifest.heroAssetOverlays[15].overlaySha256 === iceGiantPrimaryOverlay.receiptSha256, "v591-readonly-ice-giant-overlay-chain");
assert(iceGiantPrimaryOverlay.version === "v591-ice-giant-primary-overlay-v1" && iceGiantPrimaryOverlay.status === "ice-giant-registered-primary-ready-for-runtime-admission", "v591-readonly-ice-giant-overlay-status");
assert(iceGiantPrimaryOverlay.noNetworkRequestsPerformed === true && iceGiantPrimaryOverlay.noAssetBytesCopied === true && iceGiantPrimaryOverlay.noTextureAssetsRequired === true, "v591-readonly-ice-giant-no-assets");
assert(iceGiantPrimaryOverlay.authorityState.presentationOnly === true && iceGiantPrimaryOverlay.authorityState.scientificAuthorityChanged === false && iceGiantPrimaryOverlay.authorityState.scientificPayloadWriteback === false, "v591-readonly-ice-giant-authority");
assert(iceGiantPrimaryOverlay.bodies.map((body) => body.body).join(",") === "uranus,neptune", "v591-readonly-ice-giant-bodies");
for (const body of iceGiantPrimaryOverlay.bodies) {
  assert(body.proceduralPrimary === true && body.proceduralFallback === false, `v591-readonly-ice-giant-primary:${body.body}`);
  assert(body.observationTextureClaim === false && body.measuredPhotometryClaim === false, `v591-readonly-ice-giant-observation-policy:${body.body}`);
}
for (const source of iceGiantPrimaryOverlay.inheritedSources) {
  const bytes = readFileSync(resolve(root, source.path));
  assert(bytes.byteLength === source.bytes && sha256(bytes) === source.sha256, `v591-readonly-ice-giant-source:${source.path}`);
}
assert(nebulaAssetOverlay.version === "v591-nebula-asset-overlay-v1", "v591-readonly-nebula-overlay-version");
assert(nebulaAssetOverlay.status === "6-of-6-runtime-admitted", "v591-readonly-nebula-overlay-status");
assert(nebulaAssetOverlay.assets.length === 6 && nebulaAssetOverlay.blocked.length === 0, "v591-readonly-nebula-overlay-counts");
assert(nebulaAssetOverlay.policy.science === "marker-only-no-image-payload" && nebulaAssetOverlay.policy.cinematic === "verified-nasa-presentation-impostor-only", "v591-readonly-nebula-mode-policy");
assert(nebulaAssetOverlay.policy.maxConcurrentHighOrder === 3 && nebulaAssetOverlay.policy.fixedJ2000Directions === true && nebulaAssetOverlay.policy.noSyntheticReplacement === true, "v591-readonly-nebula-runtime-policy");
assert(nebulaAssetOverlay.authorityState.presentationOnly === true && nebulaAssetOverlay.authorityState.scientificAuthorityChanged === false && nebulaAssetOverlay.authorityState.scientificPayloadWriteback === false, "v591-readonly-nebula-authority");
const expectedNebulaIds = "orion-nebula,lagoon-nebula,eagle-nebula,helix-nebula,veil-nebula,north-america-nebula";
assert(nebulaAssetOverlay.assets.map((asset) => asset.id).join(",") === expectedNebulaIds, "v591-readonly-nebula-asset-order");
for (const asset of nebulaAssetOverlay.assets) {
  assert(asset.admission === "admitted" && asset.presentationOnly === true && asset.scientificAuthority === false, `v591-readonly-nebula-admission:${asset.id}`);
  assert(asset.source.host === "images-assets.nasa.gov" && asset.source.license.id === "NASA-public-domain", `v591-readonly-nebula-provenance:${asset.id}`);
  const sourcePath = decodeURIComponent(asset.source.path);
  assert(sourcePath.startsWith("source-cache/celestial-convergence-v591/nebulae/") && !sourcePath.includes("\\") && !sourcePath.split("/").includes(".."), `v591-readonly-nebula-source-path:${asset.id}`);
  const sourceBytes = readFileSync(resolve(root, sourcePath));
  assert(sourceBytes.byteLength === asset.source.bytes && sha256(sourceBytes) === asset.source.sha256, `v591-readonly-nebula-source-drift:${asset.id}`);
  const variants = Object.entries(asset.variants);
  assert(variants.length === 6, `v591-readonly-nebula-variant-count:${asset.id}`);
  for (const [variantName, file] of variants) {
    const decoded = decodeURIComponent(file.url.split("?")[0]);
    assert(file.url.startsWith("/textures/candidate-v591/nebulae/") && !decoded.includes("\\") && !decoded.split("/").includes(".."), `v591-readonly-nebula-variant-path:${asset.id}:${variantName}`);
    const bytes = readFileSync(resolve(root, `public/${decoded.replace(/^\/+/, "")}`));
    assert(bytes.byteLength === file.bytes && sha256(bytes) === file.sha256, `v591-readonly-nebula-variant-drift:${asset.id}:${variantName}`);
  }
}
const liteBase = readJson("public/atlas-lite/manifest.json");
const liteFiles = [...sunOverlay.assets, ...mercuryOverlay.assets, ...venusOverlay.assets, ...moonOverlay.assets, ...marsOverlay.assets, ...jupiterOverlay.assets, ...saturnOverlay.assets, ...bennuOverlay.assets, ...tempel1Overlay.assets, ...ceresOverlay.assets, ...nebulaAssetOverlay.assets].flatMap((asset) => [asset.variants.liteDesktop, asset.variants.liteMobile]);
const vestaModelBytes = [...new Map(vestaOverlay.model.lods.map((lod) => [lod.sha256, lod.bytes])).values()].reduce((sum, value) => sum + value, 0);
const nasaSmallBodyModelBytes = [...new Map([...erosOverlay.model.lods, ...kleopatraOverlay.model.lods].map((lod) => [lod.sha256, lod.bytes])).values()].reduce((sum, value) => sum + value, 0);
const tempel1ModelBytes = [...new Map(tempel1Overlay.model.lods.map((lod) => [lod.sha256, lod.bytes])).values()].reduce((sum, value) => sum + value, 0);
const ceresModelBytes = [...new Map(ceresOverlay.model.lods.map((lod) => [lod.sha256, lod.bytes])).values()].reduce((sum, value) => sum + value, 0);
const liteIncrementBytes = [...new Map(liteFiles.map((file) => [file.url, file.bytes])).values()].reduce((sum, value) => sum + value, 0) + vestaModelBytes + nasaSmallBodyModelBytes + tempel1ModelBytes + ceresModelBytes;
const liteTotalBytes = liteBase.installedBytes + liteIncrementBytes;
assert(liteIncrementBytes <= manifest.budgets.liteIncrementBytesMaximum, "v591-readonly-lite-increment-budget");
assert(liteTotalBytes <= manifest.budgets.liteTotalBytesMaximum, "v591-readonly-lite-total-budget");
assert(capability.capabilities.budgetChecks.liteIncrement.actualBytes === liteIncrementBytes, "v591-readonly-lite-increment-evidence");
assert(capability.capabilities.budgetChecks.liteTotal.actualBytes === liteTotalBytes, "v591-readonly-lite-total-evidence");
assert(capability.capabilities.litePackagingIsolation.status === "passed", "v591-readonly-lite-packaging-isolation");
assert(capability.capabilities.litePackagingIsolation.fullAssetLeaks.length === 0, "v591-readonly-lite-full-asset-leak");
assert(capability.capabilities.nebulaOverlaySha256 === nebulaAssetOverlay.receiptSha256, "v591-readonly-nebula-capability-chain");
assert(capability.capabilities.nebulaAdmittedCount === 6 && capability.capabilities.nebulaBlockedCount === 0, "v591-readonly-nebula-capability-counts");
assert(capability.blockedGates.allSixNebulaAdmission === "passed:6/6-runtime-browser-ready" && capability.blockedGates.v591DeepSpace === "passed:6/6-runtime-browser-ready", "v591-readonly-nebula-capability-status");
assert(capability.capabilities.deepSpaceBrowserEvidence?.status === "passed" && capability.capabilities.deepSpaceBrowserEvidence?.receiptSha256 === deepSpaceBrowser.receiptSha256, "v591-readonly-deep-space-capability-evidence");

const standaloneBuildIdForVisualEvidence = readFileSync(resolve(root, ".next-atlas-v591-standalone-current/BUILD_ID"), "utf8").trim();
const expectedStandaloneFingerprint = derivePageBuildFingerprintV591({ sourceManifestSha256: sourceManifest.receiptSha256, deliveryTier: "standalone-full" });
const globalVisualMatrixPassed = globalVisualMatrix !== null;
if (globalVisualMatrix) {
  assert(globalVisualMatrix.version === "v591-global-visual-matrix-v1" && globalVisualMatrix.status === "automated-global-visual-matrix-passed-human-signoff-pending" && globalVisualMatrix.route === "/local-shadow-v591", "v591-readonly-global-matrix-status");
  assert(globalVisualMatrix.build?.manifestSha256 === manifest.manifestSha256 && globalVisualMatrix.build?.sourceManifestSha256 === sourceManifest.receiptSha256 && globalVisualMatrix.build?.standaloneBuildId === standaloneBuildIdForVisualEvidence && globalVisualMatrix.build?.pageBuildFingerprint === expectedStandaloneFingerprint && globalVisualMatrix.build?.deliveryTier === "standalone-full", "v591-readonly-global-matrix-build");
  assert(globalVisualMatrix.matrix?.phaseCount === 10 && globalVisualMatrix.matrix?.heroBodies === 16 && globalVisualMatrix.matrix?.heroScreenshots === 64 && globalVisualMatrix.matrix?.sixNebulae === "6/6-runtime-ready" && globalVisualMatrix.matrix?.constellations === "88-catalog-484/484-gaia-anchors-rendered", "v591-readonly-global-matrix-coverage");
  assert(Array.isArray(globalVisualMatrix.samples) && globalVisualMatrix.samples.length === 10 && globalVisualMatrix.samples.every((sample, index) => sample.sequence === index && sample.fpsMedian >= sample.minimumFps && sample.drawCalls <= 90 && sample.gpuBytes <= (sample.device === "mobile" ? 201326592 : 536870912) && sample.payloadSha256 === manifest.boundaries.scientificPayloadSha256), "v591-readonly-global-matrix-samples");
  assert(globalVisualMatrix.performance?.minimumFps >= 45 && globalVisualMatrix.performance?.maximumDrawCalls <= 90 && globalVisualMatrix.performance?.maximumGpuBytes <= 536870912, "v591-readonly-global-matrix-performance");
  assert(globalVisualMatrix.authority?.scientificPayloadSha256 === manifest.boundaries.scientificPayloadSha256 && globalVisualMatrix.authority?.payloadStableAcrossMatrix === true && globalVisualMatrix.authority?.scientificWriteback === false && globalVisualMatrix.authority?.formalProductPointer === "v263", "v591-readonly-global-matrix-authority");
  assert(globalVisualMatrix.releaseAudit?.status === "released-zero" && globalVisualMatrix.errorAudit?.status === "passed" && globalVisualMatrix.candidateQualified === false && globalVisualMatrix.productionReleaseAuthorized === false, "v591-readonly-global-matrix-runtime-boundary");
  assert(Array.isArray(globalVisualMatrix.screenshots) && globalVisualMatrix.screenshots.length === 10, "v591-readonly-global-matrix-screenshot-count");
  for (const screenshot of globalVisualMatrix.screenshots) {
    const bytes = readFileSync(resolve(root, screenshot.path));
    const dimensions = pngDimensions(bytes);
    assert(bytes.byteLength === screenshot.bytes && sha256(bytes) === screenshot.sha256 && dimensions?.width === screenshot.width && dimensions?.height === screenshot.height, `v591-readonly-global-matrix-screenshot:${screenshot.path}`);
  }
}

const browserSoakPassed = browserSoak !== null;
if (browserSoak) {
  assert(globalVisualMatrix && browserSoak.version === "v591-browser-soak-qualification-v1" && browserSoak.status === "passed-30-minute-browser-soak" && browserSoak.route === "/local-shadow-v591", "v591-readonly-soak-status");
  assert(browserSoak.matrixReceiptSha256 === globalVisualMatrix.receiptSha256 && browserSoak.build?.manifestSha256 === manifest.manifestSha256 && browserSoak.build?.sourceManifestSha256 === sourceManifest.receiptSha256 && browserSoak.build?.standaloneBuildId === standaloneBuildIdForVisualEvidence && browserSoak.build?.pageBuildFingerprint === expectedStandaloneFingerprint, "v591-readonly-soak-build-chain");
  assert(browserSoak.duration?.elapsedMs >= 1800000 && browserSoak.duration?.sampleCount >= 31 && browserSoak.duration?.maximumIntervalMs <= 90000, "v591-readonly-soak-duration");
  assert(Array.isArray(browserSoak.samples) && browserSoak.samples.length === browserSoak.duration.sampleCount && browserSoak.samples.at(-1).capturedAtMs - browserSoak.samples[0].capturedAtMs >= 1800000, "v591-readonly-soak-samples");
  for (let index = 0; index < browserSoak.samples.length; index += 1) {
    const sample = browserSoak.samples[index];
    assert(sample.sequence === index && sample.fpsMedian >= 55 && sample.drawCalls <= 90 && sample.gpuBytes <= 536870912, `v591-readonly-soak-sample:${index}`);
    if (index > 0) assert(sample.capturedAtMs > browserSoak.samples[index - 1].capturedAtMs && sample.capturedAtMs - browserSoak.samples[index - 1].capturedAtMs <= 90000, `v591-readonly-soak-interval:${index}`);
  }
  const measurementRanges = [browserSoak.measurements.resourceBytesRange, browserSoak.measurements.gpuBytesRange];
  assert(measurementRanges.every((range) => Array.isArray(range) && range.length === 2 && range[1] - range[0] <= 1048576), "v591-readonly-soak-byte-drift");
  assert([browserSoak.measurements.texturesRange, browserSoak.measurements.geometriesRange, browserSoak.measurements.programsRange, browserSoak.measurements.candidateNodesRange, browserSoak.measurements.candidateResourcesRange].every((range) => Array.isArray(range) && range.length === 2 && range[1] - range[0] <= 1), "v591-readonly-soak-resource-drift");
  if (browserSoak.measurements.jsHeap?.supported === true) assert(browserSoak.measurements.jsHeap.growthBytes <= 16777216 && browserSoak.measurements.jsHeap.slopeBytesPerMinute <= 1048576 && browserSoak.measurements.jsHeap.longestIncreasingRun < 10, "v591-readonly-soak-heap");
  assert(browserSoak.authority?.scientificPayloadSha256 === manifest.boundaries.scientificPayloadSha256 && browserSoak.authority?.payloadStable === true && browserSoak.authority?.scientificWriteback === false && browserSoak.authority?.formalProductPointer === "v263", "v591-readonly-soak-authority");
  assert(browserSoak.releaseAudit?.status === "released-zero" && browserSoak.errorAudit?.status === "passed" && browserSoak.productionReleaseAuthorized === false, "v591-readonly-soak-runtime-boundary");
}

const humanVisualSignoffPassed = humanVisualSignoff !== null;
if (humanVisualSignoff) {
  assert(globalVisualMatrix && browserSoak && humanVisualSignoff.version === "v591-human-visual-signoff-v1" && humanVisualSignoff.status === "approved-by-workspace-owner" && humanVisualSignoff.reviewer === "workspace-owner" && !Number.isNaN(Date.parse(humanVisualSignoff.signedAt)), "v591-readonly-human-signoff-status");
  assert(humanVisualSignoff.candidate?.route === "/local-shadow-v591" && humanVisualSignoff.candidate?.manifestSha256 === manifest.manifestSha256 && humanVisualSignoff.candidate?.sourceManifestSha256 === sourceManifest.receiptSha256 && humanVisualSignoff.candidate?.formalProductPointer === "v263", "v591-readonly-human-signoff-candidate");
  assert(humanVisualSignoff.evidence?.globalVisualMatrixReceiptSha256 === globalVisualMatrix.receiptSha256 && humanVisualSignoff.evidence?.browserSoakReceiptSha256 === browserSoak.receiptSha256, "v591-readonly-human-signoff-chain");
  assert(humanVisualSignoff.authority?.scientificPayloadWriteback === false && humanVisualSignoff.authority?.scientificAuthorityChanged === false && humanVisualSignoff.authority?.productionReleaseAuthorized === false, "v591-readonly-human-signoff-authority");
}

const expectedCapabilityStatus = humanVisualSignoffPassed
  ? "qualified-additive-3a-celestial-visual-candidate"
  : globalVisualMatrixPassed && browserSoakPassed
    ? "automated-gates-passed-human-visual-signoff-pending"
    : "implemented-core-with-automated-global-gates-pending";
const expectedVerificationStatus = humanVisualSignoffPassed
  ? "qualified-additive-3a-celestial-visual-candidate"
  : globalVisualMatrixPassed && browserSoakPassed
    ? "automated-gates-passed-human-visual-signoff-pending"
    : "sealed-automated-global-and-soak-gates-pending";
const expectedPointerStatus = humanVisualSignoffPassed
  ? "qualified-additive-3a-celestial-visual-candidate"
  : globalVisualMatrixPassed && browserSoakPassed
    ? "automated-gates-passed-human-visual-signoff-pending"
    : "additive-v591-automated-global-gates-pending";
assert(capability.status === expectedCapabilityStatus && verification.status === expectedVerificationStatus && pointer.status === expectedPointerStatus, "v591-readonly-promotion-state");
assert(capability.capabilities.globalVisualMatrixEvidence?.status === (globalVisualMatrixPassed ? "passed" : "not-run") && capability.capabilities.browserSoakEvidence?.status === (browserSoakPassed ? "passed" : "not-run") && capability.capabilities.humanVisualSignoffEvidence?.status === (humanVisualSignoffPassed ? "passed" : "pending"), "v591-readonly-optional-capability-gates");
assert(verification.globalVisualMatrixEvidence?.status === capability.capabilities.globalVisualMatrixEvidence.status && verification.browserSoakEvidence?.status === capability.capabilities.browserSoakEvidence.status && verification.humanVisualSignoffEvidence?.status === capability.capabilities.humanVisualSignoffEvidence.status, "v591-readonly-optional-verification-gates");
assert(pointer.globalVisualMatrixReceiptSha256 === (globalVisualMatrix?.receiptSha256 ?? null) && pointer.browserSoakReceiptSha256 === (browserSoak?.receiptSha256 ?? null) && pointer.humanVisualSignoffReceiptSha256 === (humanVisualSignoff?.receiptSha256 ?? null), "v591-readonly-optional-pointer-chain");
assert(capability.evidence.globalVisualMatrixReceiptSha256 === (globalVisualMatrix?.receiptSha256 ?? null) && capability.evidence.browserSoakReceiptSha256 === (browserSoak?.receiptSha256 ?? null) && capability.evidence.humanVisualSignoffReceiptSha256 === (humanVisualSignoff?.receiptSha256 ?? null), "v591-readonly-optional-capability-chain");
assert(freezeAfter.beforeSnapshotSha256 === freezeBefore.snapshotSha256, "v591-readonly-freeze-chain");
assert(pointer.manifestSha256 === manifest.manifestSha256, "v591-readonly-manifest-chain");
assert(pointer.currentStateReceiptSha256 === currentState.receiptSha256, "v591-readonly-current-state-chain");
assert(pointer.verificationReceiptSha256 === verification.receiptSha256, "v591-readonly-verification-chain");
assert(pointer.freezeAfterSha256 === freezeAfter.snapshotSha256, "v591-readonly-freeze-after-chain");
assert(pointer.capabilityReportSha256 === capability.reportSha256, "v591-readonly-capability-chain");
assert(pointer.sunBrowserReceiptSha256 === sunBrowser.receiptSha256, "v591-readonly-sun-browser-pointer-chain");
assert(pointer.earthBrowserReceiptSha256 === earthBrowser.receiptSha256, "v591-readonly-earth-browser-pointer-chain");
assert(pointer.mercuryBrowserReceiptSha256 === mercuryBrowser.receiptSha256, "v591-readonly-mercury-browser-pointer-chain");
assert(pointer.venusBrowserReceiptSha256 === venusBrowser.receiptSha256, "v591-readonly-venus-browser-pointer-chain");
assert(pointer.moonBrowserReceiptSha256 === moonBrowser.receiptSha256, "v591-readonly-moon-browser-pointer-chain");
assert(pointer.marsBrowserReceiptSha256 === marsBrowser.receiptSha256, "v591-readonly-mars-browser-pointer-chain");
assert(pointer.jupiterBrowserReceiptSha256 === jupiterBrowser.receiptSha256, "v591-readonly-jupiter-browser-pointer-chain");
assert(pointer.saturnBrowserReceiptSha256 === saturnBrowser.receiptSha256, "v591-readonly-saturn-browser-pointer-chain");
assert(pointer.vestaBrowserReceiptSha256 === vestaBrowser.receiptSha256, "v591-readonly-vesta-browser-pointer-chain");
assert(pointer.bennuBrowserReceiptSha256 === bennuBrowser.receiptSha256, "v591-readonly-bennu-browser-pointer-chain");
assert(pointer.erosBrowserReceiptSha256 === erosBrowser.receiptSha256, "v591-readonly-eros-browser-pointer-chain");
assert(pointer.kleopatraBrowserReceiptSha256 === kleopatraBrowser.receiptSha256, "v591-readonly-kleopatra-browser-pointer-chain");
assert(pointer.tempel1BrowserReceiptSha256 === tempel1Browser.receiptSha256, "v591-readonly-tempel1-browser-pointer-chain");
assert(pointer.ceresBrowserReceiptSha256 === ceresBrowser.receiptSha256, "v591-readonly-ceres-browser-pointer-chain");
assert(pointer.uranusBrowserReceiptSha256 === uranusBrowser.receiptSha256, "v591-readonly-uranus-browser-pointer-chain");
assert(pointer.neptuneBrowserReceiptSha256 === neptuneBrowser.receiptSha256, "v591-readonly-neptune-browser-pointer-chain");
assert(pointer.deepSpaceBrowserReceiptSha256 === deepSpaceBrowser.receiptSha256, "v591-readonly-deep-space-browser-pointer-chain");
assert(verification.browserEvidence?.sun?.receiptSha256 === sunBrowser.receiptSha256, "v591-readonly-sun-browser-verification-chain");
assert(verification.browserEvidence?.earth?.receiptSha256 === earthBrowser.receiptSha256, "v591-readonly-earth-browser-verification-chain");
assert(verification.browserEvidence?.mercury?.receiptSha256 === mercuryBrowser.receiptSha256, "v591-readonly-mercury-browser-verification-chain");
assert(verification.browserEvidence?.venus?.receiptSha256 === venusBrowser.receiptSha256, "v591-readonly-venus-browser-verification-chain");
assert(verification.browserEvidence?.moon?.receiptSha256 === moonBrowser.receiptSha256, "v591-readonly-moon-browser-verification-chain");
assert(verification.browserEvidence?.mars?.receiptSha256 === marsBrowser.receiptSha256, "v591-readonly-mars-browser-verification-chain");
assert(verification.browserEvidence?.jupiter?.receiptSha256 === jupiterBrowser.receiptSha256, "v591-readonly-jupiter-browser-verification-chain");
assert(verification.browserEvidence?.saturn?.receiptSha256 === saturnBrowser.receiptSha256, "v591-readonly-saturn-browser-verification-chain");
assert(verification.browserEvidence?.vesta?.receiptSha256 === vestaBrowser.receiptSha256, "v591-readonly-vesta-browser-verification-chain");
assert(verification.browserEvidence?.bennu?.receiptSha256 === bennuBrowser.receiptSha256, "v591-readonly-bennu-browser-verification-chain");
assert(verification.browserEvidence?.eros?.receiptSha256 === erosBrowser.receiptSha256, "v591-readonly-eros-browser-verification-chain");
assert(verification.browserEvidence?.kleopatra?.receiptSha256 === kleopatraBrowser.receiptSha256, "v591-readonly-kleopatra-browser-verification-chain");
assert(verification.browserEvidence?.["tempel-1"]?.receiptSha256 === tempel1Browser.receiptSha256, "v591-readonly-tempel1-browser-verification-chain");
assert(verification.browserEvidence?.ceres?.receiptSha256 === ceresBrowser.receiptSha256, "v591-readonly-ceres-browser-verification-chain");
assert(verification.browserEvidence?.uranus?.receiptSha256 === uranusBrowser.receiptSha256, "v591-readonly-uranus-browser-verification-chain");
assert(verification.browserEvidence?.neptune?.receiptSha256 === neptuneBrowser.receiptSha256, "v591-readonly-neptune-browser-verification-chain");
assert(verification.deepSpaceBrowserEvidence?.status === "passed" && verification.deepSpaceBrowserEvidence?.receiptSha256 === deepSpaceBrowser.receiptSha256, "v591-readonly-deep-space-browser-verification-chain");
assert(capability.evidence.sunBrowserReceiptSha256 === sunBrowser.receiptSha256, "v591-readonly-sun-browser-capability-chain");
assert(capability.evidence.earthBrowserReceiptSha256 === earthBrowser.receiptSha256, "v591-readonly-earth-browser-capability-chain");
assert(capability.evidence.mercuryBrowserReceiptSha256 === mercuryBrowser.receiptSha256, "v591-readonly-mercury-browser-capability-chain");
assert(capability.evidence.venusBrowserReceiptSha256 === venusBrowser.receiptSha256, "v591-readonly-venus-browser-capability-chain");
assert(capability.evidence.moonBrowserReceiptSha256 === moonBrowser.receiptSha256, "v591-readonly-moon-browser-capability-chain");
assert(capability.evidence.marsBrowserReceiptSha256 === marsBrowser.receiptSha256, "v591-readonly-mars-browser-capability-chain");
assert(capability.evidence.jupiterBrowserReceiptSha256 === jupiterBrowser.receiptSha256, "v591-readonly-jupiter-browser-capability-chain");
assert(capability.evidence.saturnBrowserReceiptSha256 === saturnBrowser.receiptSha256, "v591-readonly-saturn-browser-capability-chain");
assert(capability.evidence.vestaBrowserReceiptSha256 === vestaBrowser.receiptSha256, "v591-readonly-vesta-browser-capability-chain");
assert(capability.evidence.bennuBrowserReceiptSha256 === bennuBrowser.receiptSha256, "v591-readonly-bennu-browser-capability-chain");
assert(capability.evidence.erosBrowserReceiptSha256 === erosBrowser.receiptSha256, "v591-readonly-eros-browser-capability-chain");
assert(capability.evidence.kleopatraBrowserReceiptSha256 === kleopatraBrowser.receiptSha256, "v591-readonly-kleopatra-browser-capability-chain");
assert(capability.evidence.tempel1BrowserReceiptSha256 === tempel1Browser.receiptSha256, "v591-readonly-tempel1-browser-capability-chain");
assert(capability.evidence.ceresBrowserReceiptSha256 === ceresBrowser.receiptSha256, "v591-readonly-ceres-browser-capability-chain");
assert(capability.evidence.uranusBrowserReceiptSha256 === uranusBrowser.receiptSha256, "v591-readonly-uranus-browser-capability-chain");
assert(capability.evidence.neptuneBrowserReceiptSha256 === neptuneBrowser.receiptSha256, "v591-readonly-neptune-browser-capability-chain");
assert(capability.evidence.deepSpaceBrowserReceiptSha256 === deepSpaceBrowser.receiptSha256, "v591-readonly-deep-space-browser-capability-chain");
assert(capability.capabilities.iceGiantPrimaryOverlaySha256 === iceGiantPrimaryOverlay.receiptSha256, "v591-readonly-ice-giant-capability-chain");
assert(capability.capabilities.venusAssetOverlaySha256 === venusOverlay.receiptSha256 && capability.capabilities.venusSourceReceiptSha256s.join(",") === venusOverlay.sourceReceiptSha256s.join(","), "v591-readonly-venus-capability-chain");
assert(capability.capabilities.venusMeasuredTopographyClaim === false && capability.capabilities.venusOpticalColorClaim === false, "v591-readonly-venus-capability-policy");
assert(capability.capabilities.tempel1AssetOverlaySha256 === tempel1Overlay.receiptSha256 && capability.capabilities.tempel1ModelLodReceiptSha256 === tempel1Overlay.modelLodReceiptSha256, "v591-readonly-tempel1-capability-chain");
assert(capability.capabilities.tempel1ObservedCoverageFraction === 0.8043214699074074 && capability.capabilities.tempel1UnobservedAreaPolicy === manifest.heroAssetOverlays[12].unobservedAreaPolicy, "v591-readonly-tempel1-capability-policy");
assert(capability.capabilities.ceresAssetOverlaySha256 === ceresOverlay.receiptSha256 && capability.capabilities.ceresModelLodReceiptSha256 === ceresOverlay.modelLodReceiptSha256, "v591-readonly-ceres-capability-chain");
assert(capability.capabilities.ceresSourceDetailCeiling === ceresOverlay.model.sourceDetailCeiling && capability.capabilities.ceresObservationGrid === "2222x1111" && capability.capabilities.ceresOpticalColorClaim === false && capability.capabilities.ceresSyntheticDetailAdded === false, "v591-readonly-ceres-capability-policy");
assert(capability.capabilities.iceGiantObservationTextureClaim === false, "v591-readonly-ice-giant-capability-policy");
assert(capability.capabilities.namespaceIsolated === true && capability.capabilities.packageJsonMutationRequired === false, "v591-readonly-namespace");
assert(capability.capabilities.v591HeroOverrideBodies.join(",") === manifest.runtime.v591HeroOverrideBodies.join(","), "v591-readonly-capability-override-order");
assert(capability.capabilities.effectiveHeroAdmissions.join(",") === manifest.runtime.v591HeroOverrideBodies.join(","), "v591-readonly-capability-effective-order");
assert(capability.capabilities.constellationAnchors === "484/484-v591-owned-packet", "v591-readonly-capability-constellation-status");
assert(capability.capabilities.constellationPacketVersion === constellationPacket.version, "v591-readonly-capability-constellation-version");
assert(capability.capabilities.constellationPacketSha256 === constellationPacket.packetSha256, "v591-readonly-capability-constellation-sha");
assert(capability.capabilities.constellationPacketFileSha256 === constellationPacketFileSha256, "v591-readonly-capability-constellation-file-sha");
assert(capability.capabilities.constellationLabelAtlasSha256 === constellationPacket.labelAtlas.sha256 && capability.capabilities.constellationLabelAtlasBytes === constellationPacket.labelAtlas.bytes, "v591-readonly-capability-constellation-atlas");

for (const [kind, expected] of Object.entries({
  standalone: { distDir: ".next-atlas-v591-standalone-current", deliveryTier: "standalone-full" },
  lite: { distDir: ".next-atlas-v591-lite-current", deliveryTier: "vercel-lite" },
})) {
  const gate = capability.capabilities.buildGates[kind];
  assert(gate.status === "passed", `v591-readonly-build-gate:${kind}:${gate.status}`);
  const receiptPath = resolve(root, gate.receiptPath);
  assert(existsSync(receiptPath), `v591-readonly-build-receipt-missing:${kind}`);
  const receiptBytes = readFileSync(receiptPath);
  assert(sha256(receiptBytes) === gate.receiptSha256, `v591-readonly-build-receipt-drift:${kind}`);
  const receipt = JSON.parse(receiptBytes.toString("utf8"));
  assert(receipt.status === "passed" && receipt.distDir === expected.distDir, `v591-readonly-build-receipt-status:${kind}`);
  assert(receipt.deliveryTier === expected.deliveryTier, `v591-readonly-build-tier:${kind}`);
  assert(receipt.candidateSourceManifestSha256 === sourceManifest.receiptSha256, `v591-readonly-build-source:${kind}`);
  assert(receipt.buildId === readFileSync(resolve(root, expected.distDir, "BUILD_ID"), "utf8").trim(), `v591-readonly-build-id:${kind}`);
}

const v590Source = verifySealed("docs/release/v590/source-manifest-v590.json", "receiptSha256");
assert(v590Source.files.length === 36, "v591-readonly-v590-source-count");
for (const path of ["package.json", "proxy.ts", "app/lib/atlasProxyContractV562.ts", "scripts/build-atlas-profile.mjs"]) {
  const baseline = v590Source.files.find((file) => file.path === path);
  assert(baseline && sha256(readFileSync(resolve(root, path))) === baseline.sha256, `v591-readonly-shared-entry:${path}`);
}

console.log(JSON.stringify({
  status: "verified-read-only",
  manifestSha256: manifest.manifestSha256,
  sourceCount: sourceManifest.files.length,
  frozenEntryCount: freezeBefore.frozenSnapshot.length,
  v590FrozenSourceCoverage: `${v590Source.files.length}/${v590Source.files.length}`,
  buildGates: { standalone: "passed", lite: "passed" },
  liteBudget: { incrementBytes: liteIncrementBytes, totalBytes: liteTotalBytes },
  litePackagingIsolation: "passed",
  v591HeroOverrides: "16/16",
  p1CoreHeroes: "6/6",
  sunAssetOverlaySha256: sunOverlay.receiptSha256,
  earthAssetOverlaySha256: earthOverlay.receiptSha256,
  mercuryAssetOverlaySha256: mercuryOverlay.receiptSha256,
  venusAssetOverlaySha256: venusOverlay.receiptSha256,
  moonAssetOverlaySha256: moonOverlay.receiptSha256,
  marsAssetOverlaySha256: marsOverlay.receiptSha256,
  jupiterAssetOverlaySha256: jupiterOverlay.receiptSha256,
  saturnAssetOverlaySha256: saturnOverlay.receiptSha256,
  vestaAssetOverlaySha256: vestaOverlay.receiptSha256,
  bennuAssetOverlaySha256: bennuOverlay.receiptSha256,
  erosAssetOverlaySha256: erosOverlay.receiptSha256,
  kleopatraAssetOverlaySha256: kleopatraOverlay.receiptSha256,
  tempel1AssetOverlaySha256: tempel1Overlay.receiptSha256,
  iceGiantPrimaryOverlaySha256: iceGiantPrimaryOverlay.receiptSha256,
  nebulaAssetOverlaySha256: nebulaAssetOverlay.receiptSha256,
  nebulaAdmission: "6/6-runtime-browser-ready",
  automatedGates: { globalVisualMatrix: globalVisualMatrixPassed ? "passed" : "not-run", browserSoak30Minutes: browserSoakPassed ? "passed" : "not-run" },
  humanVisualSignoff: humanVisualSignoffPassed ? "passed" : "pending",
  candidateStatus: capability.status,
  formalProductPointer: "v263",
  writesPerformed: 0,
}, null, 2));
