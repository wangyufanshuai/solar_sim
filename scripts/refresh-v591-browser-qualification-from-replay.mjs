import { createHash } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import {
  assertPageBuildIdentityV591,
  derivePageBuildFingerprintV591,
} from "./v591-page-build-identity.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const phases = Object.freeze([
  "desktop-science",
  "desktop-cinematic",
  "mobile-cinematic",
  "mobile-science",
  "desktop-return-science",
]);
const screenshotKeys = Object.freeze({
  "desktop-science": "desktopScienceShot",
  "desktop-cinematic": "desktopCinematicShot",
  "mobile-cinematic": "mobileCinematicShot",
  "mobile-science": "mobileScienceShot",
});

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
function numberAttribute(state, key) {
  const value = Number(state[key]);
  assert(Number.isFinite(value), `v591-browser-replay-number:${key}`);
  return value;
}
function booleanAttribute(state, key) {
  assert(state[key] === "true" || state[key] === "false", `v591-browser-replay-boolean:${key}`);
  return state[key] === "true";
}
function readLogSeverity(entry) {
  const candidate = [entry?.level, entry?.type, entry?.severity].find((value) => typeof value === "string");
  return String(candidate ?? "").toLowerCase();
}

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}

async function replaceFileAtomically(path, bytes) {
  const partial = `${path}.part`;
  await writeFile(partial, bytes);
  await rm(path, { force: true });
  await rename(partial, path);
}

async function normalizeScreenshot(input, targetPath) {
  const partial = `${targetPath}.part`;
  await sharp(Buffer.from(input))
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(partial);
  await rm(targetPath, { force: true });
  await rename(partial, targetPath);
  const bytes = await readFile(targetPath);
  assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a", `v591-browser-png:${targetPath}`);
  return {
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function constellationTelemetryFromState(state) {
  return {
    status: state["data-atlas-v591-constellation-status"],
    reason: state["data-atlas-v591-constellation-reason"],
    packetVersion: state["data-atlas-v591-constellation-packet-version"],
    packetSha256: state["data-atlas-v591-constellation-packet-sha256"],
    packetFileSha256: state["data-atlas-v591-constellation-packet-file-sha256"],
    frozenSourceFileSha256: state["data-atlas-v591-constellation-frozen-source-file-sha256"],
    frozenBindingSha256: state["data-atlas-v591-constellation-frozen-binding-sha256"],
    constellationCount: numberAttribute(state, "data-atlas-v591-constellation-count"),
    waypointCount: numberAttribute(state, "data-atlas-v591-constellation-waypoint-count"),
    uniqueGaiaSourceIdCount: numberAttribute(state, "data-atlas-v591-constellation-unique-gaia-source-id-count"),
    maximumAngularDistanceDeg: numberAttribute(state, "data-atlas-v591-constellation-maximum-angular-distance-deg"),
    medianAngularDistanceDeg: numberAttribute(state, "data-atlas-v591-constellation-median-angular-distance-deg"),
    renderedConstellationCount: numberAttribute(state, "data-atlas-v591-constellation-rendered-count"),
    renderedAnchorCount: numberAttribute(state, "data-atlas-v591-constellation-rendered-anchor-count"),
    labelAtlasStatus: state["data-atlas-v591-constellation-label-atlas-status"],
    labelAtlasSha256: state["data-atlas-v591-constellation-label-atlas-sha256"],
    labelAtlasBytes: numberAttribute(state, "data-atlas-v591-constellation-label-atlas-bytes"),
    defaultCount: numberAttribute(state, "data-atlas-v591-constellation-default-count"),
  };
}

function nebulaTelemetryFromState(state) {
  return {
    status: state["data-atlas-v591-nebula-status"],
    admittedCount: numberAttribute(state, "data-atlas-v591-nebula-admitted-count"),
    blockedCount: numberAttribute(state, "data-atlas-v591-nebula-blocked-count"),
    requestedImpostorCount: numberAttribute(state, "data-atlas-v591-nebula-requested-impostor-count"),
    readyImpostorCount: numberAttribute(state, "data-atlas-v591-nebula-impostor-count"),
    runtimeBlockedImpostorCount: numberAttribute(state, "data-atlas-v591-nebula-runtime-blocked-impostor-count"),
    requestedIds: state["data-atlas-v591-nebula-requested-ids"],
    readyIds: state["data-atlas-v591-nebula-ready-ids"],
    blockedIds: state["data-atlas-v591-nebula-blocked-ids"],
  };
}

function sampleFromState(state, sequence, body) {
  const deviceTier = state["data-atlas-v591-device-tier"];
  const mobile = deviceTier === "mobile";
  const proceduralPrimary = body === "uranus" || body === "neptune";
  const nasaSmallBody = body === "eros" || body === "kleopatra";
  const venus = body === "venus";
  const tempel1 = body === "tempel-1";
  const ceres = body === "ceres";
  const sample = {
    sequence,
    phase: phases[sequence],
    viewport: mobile ? "390x844" : "1440x900",
    mode: state["data-atlas-v591-mode"],
    deviceTier,
    heroAdmission: state["data-atlas-v591-hero-admission"],
    ktx2First: booleanAttribute(state, "data-atlas-v591-hero-ktx2-first"),
    lod: state["data-atlas-v591-hero-lod"],
    loaderLane: state["data-atlas-v591-ktx2-loader-lane"],
    prewarm: proceduralPrimary
        ? "not-applicable-procedural-primary"
      : state["data-atlas-v591-ktx2-prewarm"],
    cameraSettled: booleanAttribute(state, "data-atlas-v591-camera-settled"),
    subjectVisible: booleanAttribute(state, "data-atlas-v591-hero-subject-visible"),
    screenDiameterPx: numberAttribute(state, "data-atlas-v591-hero-screen-diameter-px"),
    textureSources: state["data-atlas-v591-hero-texture-sources"],
    textureReceipt: state["data-atlas-v591-hero-texture-receipt"],
    fpsMedian: numberAttribute(state, "data-atlas-v591-fps-median"),
    fpsSampleCount: numberAttribute(state, "data-atlas-v591-fps-sample-count"),
    drawCalls: numberAttribute(state, "data-atlas-v591-draw-calls"),
    gpuBytes: numberAttribute(state, "data-atlas-v591-gpu-bytes"),
    payloadSha256: state["data-atlas-v591-scientific-payload-sha"],
    pageSourceManifestSha256: state["data-atlas-v591-page-source-manifest-sha"],
    pageDeliveryTier: state["data-atlas-v591-page-delivery-tier"],
    pageBuildFingerprint: state["data-atlas-v591-page-build-fingerprint"],
    constellation: constellationTelemetryFromState(state),
    nebula: nebulaTelemetryFromState(state),
  };
  if (nasaSmallBody) {
    Object.assign(sample, {
      assetOverlaySha256: state["data-atlas-v591-hero-asset-overlay-sha"],
      modelLodReceiptSha256: state["data-atlas-v591-hero-model-lod-receipt-sha"],
      modelStatus: state["data-atlas-v591-hero-model-status"],
      modelLod: state["data-atlas-v591-hero-model-lod"],
      modelSha256: state["data-atlas-v591-hero-model-sha"],
      modelGpuBytes: numberAttribute(state, "data-atlas-v591-hero-model-gpu-bytes"),
      modelDependency: state["data-atlas-v591-hero-model-dependency"],
      sourceDetailCeiling: state["data-atlas-v591-hero-source-detail-ceiling"],
      printableSplitReconstruction: state["data-atlas-v591-hero-printable-split-reconstruction"],
      microtexturePolicy: state["data-atlas-v591-hero-microtexture-policy"],
      microtextureSourceOverlaySha256: state["data-atlas-v591-hero-microtexture-source-overlay-sha"],
      microtextureExactByteReuse: booleanAttribute(state, "data-atlas-v591-hero-microtexture-exact-byte-reuse"),
      reflectance: state["data-atlas-v591-hero-reflectance"],
      measuredPhotometryClaim: booleanAttribute(state, "data-atlas-v591-hero-measured-photometry-claim"),
      proceduralFallback: booleanAttribute(state, "data-atlas-v591-hero-procedural-fallback"),
      scientificPayloadMutation: booleanAttribute(state, "data-atlas-v591-hero-scientific-payload-mutation"),
    });
  }
  if (venus) {
    Object.assign(sample, {
      assetOverlaySha256: state["data-atlas-v591-hero-asset-overlay-sha"],
      surfaceSource: state["data-atlas-v591-hero-surface-source"],
      cloudModel: state["data-atlas-v591-hero-cloud-model"],
      cloudObservationTextureClaim: booleanAttribute(state, "data-atlas-v591-hero-cloud-observation-texture-claim"),
      reliefModel: state["data-atlas-v591-hero-relief-model"],
      measuredTopographyClaim: booleanAttribute(state, "data-atlas-v591-hero-measured-topography-claim"),
      opticalColorClaim: booleanAttribute(state, "data-atlas-v591-hero-optical-color-claim"),
      proceduralFallback: booleanAttribute(state, "data-atlas-v591-hero-procedural-fallback"),
      scientificPayloadMutation: booleanAttribute(state, "data-atlas-v591-hero-scientific-payload-mutation"),
    });
  }
  if (tempel1) {
    Object.assign(sample, {
      assetOverlaySha256: state["data-atlas-v591-hero-asset-overlay-sha"],
      modelLodReceiptSha256: state["data-atlas-v591-hero-model-lod-receipt-sha"],
      modelStatus: state["data-atlas-v591-hero-model-status"],
      modelLod: state["data-atlas-v591-hero-model-lod"],
      modelSha256: state["data-atlas-v591-hero-model-sha"],
      modelGpuBytes: numberAttribute(state, "data-atlas-v591-hero-model-gpu-bytes"),
      modelDependency: state["data-atlas-v591-hero-model-dependency"],
      sourceDetailCeiling: state["data-atlas-v591-hero-source-detail-ceiling"],
      observationDataset: state["data-atlas-v591-hero-observation-dataset"],
      observedCoverageFraction: numberAttribute(state, "data-atlas-v591-hero-observed-coverage-fraction"),
      unobservedAreaPolicy: state["data-atlas-v591-hero-unobserved-area-policy"],
      microtextureSourceOverlaySha256: state["data-atlas-v591-hero-microtexture-source-overlay-sha"],
      microtextureExactByteReuse: booleanAttribute(state, "data-atlas-v591-hero-microtexture-exact-byte-reuse"),
      tailPolicy: state["data-atlas-v591-hero-tail-policy"],
      tailVisible: booleanAttribute(state, "data-atlas-v591-hero-tail-visible"),
      measuredPhotometryClaim: booleanAttribute(state, "data-atlas-v591-hero-measured-photometry-claim"),
      proceduralFallback: booleanAttribute(state, "data-atlas-v591-hero-procedural-fallback"),
      scientificPayloadMutation: booleanAttribute(state, "data-atlas-v591-hero-scientific-payload-mutation"),
    });
  }
  if (ceres) {
    Object.assign(sample, {
      assetOverlaySha256: state["data-atlas-v591-hero-asset-overlay-sha"],
      modelLodReceiptSha256: state["data-atlas-v591-hero-model-lod-receipt-sha"],
      modelStatus: state["data-atlas-v591-hero-model-status"],
      modelLod: state["data-atlas-v591-hero-model-lod"],
      modelSha256: state["data-atlas-v591-hero-model-sha"],
      modelGpuBytes: numberAttribute(state, "data-atlas-v591-hero-model-gpu-bytes"),
      modelDependency: state["data-atlas-v591-hero-model-dependency"],
      sourceDetailCeiling: state["data-atlas-v591-hero-source-detail-ceiling"],
      observationGrid: state["data-atlas-v591-hero-observation-grid"],
      radiusRangeMeters: state["data-atlas-v591-hero-radius-range-meters"],
      microtexturePolicy: state["data-atlas-v591-hero-microtexture-policy"],
      microtextureSourceOverlaySha256: state["data-atlas-v591-hero-microtexture-source-overlay-sha"],
      microtextureExactByteReuse: booleanAttribute(state, "data-atlas-v591-hero-microtexture-exact-byte-reuse"),
      reflectance: state["data-atlas-v591-hero-reflectance"],
      opticalColorClaim: booleanAttribute(state, "data-atlas-v591-hero-optical-color-claim"),
      syntheticDetailAdded: booleanAttribute(state, "data-atlas-v591-hero-synthetic-detail-added"),
      measuredPhotometryClaim: booleanAttribute(state, "data-atlas-v591-hero-measured-photometry-claim"),
      proceduralFallback: booleanAttribute(state, "data-atlas-v591-hero-procedural-fallback"),
      scientificPayloadMutation: booleanAttribute(state, "data-atlas-v591-hero-scientific-payload-mutation"),
    });
  }
  if (state["data-atlas-v591-hero-frame-fits"] !== undefined) {
    sample.frameFits = booleanAttribute(state, "data-atlas-v591-hero-frame-fits");
  }
  return sample;
}

function measurement(sample) {
  const mobile = sample.deviceTier === "mobile";
  return {
    medianFps: sample.fpsMedian,
    minimumFps: 45,
    sampleCount: sample.fpsSampleCount,
    drawCalls: sample.drawCalls,
    maximumDrawCalls: 60,
    gpuBytes: sample.gpuBytes,
    maximumGpuBytes: mobile ? 201326592 : 536870912,
    status: "passed",
  };
}

export async function refreshBrowserQualificationV591({ body, states, release, shots, logs = [] }) {
  assert(typeof body === "string" && body.length > 0, "v591-browser-body");
  assert(Array.isArray(states) && states.length === phases.length, "v591-browser-state-count");
  assert(shots && typeof shots === "object", "v591-browser-shots");
  assert(Array.isArray(logs), "v591-browser-logs");

  const receiptPath = `docs/release/v591/browser-qualification-${body}-v591.json`;
  const existing = await readJson(receiptPath);
  const manifest = await readJson("public/data/celestial-convergence-v591/manifest.json");
  const constellationPacket = await readJson("public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json");
  const constellationLabelAtlasMetadata = await readJson("public/data/celestial-convergence-v591/constellation-label-atlas-v591.json");
  const constellationPacketBytes = await readFile(resolve(root, "public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json"));
  const constellationLabelAtlasBytes = await readFile(resolve(root, `public/${constellationLabelAtlasMetadata.atlas.path.replace(/^\/+/, "")}`));
  const expectedConstellation = {
    status: "ready",
    packetVersion: constellationPacket.version,
    packetSha256: constellationPacket.packetSha256,
    packetFileSha256: sha256(constellationPacketBytes),
    frozenSourceFileSha256: constellationPacket.frozenSource.fileSha256,
    frozenBindingSha256: constellationPacket.frozenSource.bindingSha256,
    constellationCount: constellationPacket.metrics.constellationCount,
    waypointCount: constellationPacket.metrics.waypointCount,
    uniqueGaiaSourceIdCount: constellationPacket.metrics.uniqueGaiaSourceIdCount,
    maximumAngularDistanceDeg: constellationPacket.metrics.maximumAngularDistanceDeg,
    medianAngularDistanceDeg: constellationPacket.metrics.medianAngularDistanceDeg,
    labelAtlasStatus: "ready",
    labelAtlasSha256: sha256(constellationLabelAtlasBytes),
    labelAtlasBytes: constellationLabelAtlasBytes.byteLength,
  };
  const sourceManifest = await readJson("docs/release/v591/source-manifest-v591.json");
  const standaloneReceiptPath = "dist/release/atlas-v591-standalone-build-resource.json";
  const standaloneReceiptBytes = await readFile(resolve(root, standaloneReceiptPath));
  const standaloneReceipt = JSON.parse(standaloneReceiptBytes.toString("utf8"));
  const standaloneBuildId = (await readFile(resolve(root, ".next-atlas-v591-standalone-current/BUILD_ID"), "utf8")).trim();
  assert(standaloneBuildId === standaloneReceipt.buildId, "v591-browser-build-identity");
  assert(standaloneReceipt.candidateSourceManifestSha256 === sourceManifest.receiptSha256, "v591-browser-build-source-identity");
  assert(standaloneReceipt.deliveryTier === "standalone-full", "v591-browser-build-delivery-identity");
  const expectedPageBuildIdentity = {
    sourceManifestSha256: sourceManifest.receiptSha256,
    deliveryTier: "standalone-full",
    buildFingerprint: derivePageBuildFingerprintV591({
      sourceManifestSha256: sourceManifest.receiptSha256,
      deliveryTier: "standalone-full",
    }),
  };

  const orderedReplay = states.map((state, sequence) => sampleFromState(state, sequence, body));
  const proceduralPrimary = body === "uranus" || body === "neptune";
  const nasaSmallBody = body === "eros" || body === "kleopatra";
  const venus = body === "venus";
  const tempel1 = body === "tempel-1";
  const ceres = body === "ceres";
  const heroOverlay = manifest.heroAssetOverlays.find((entry) => entry.body === body);
  const smallBodyOverlay = nasaSmallBody
    ? await readJson(`public/data/celestial-convergence-v591/${body}-asset-overlay.json`)
    : null;
  const bennuOverlay = nasaSmallBody
    ? await readJson("public/data/celestial-convergence-v591/bennu-asset-overlay.json")
    : null;
  const venusOverlay = venus
    ? await readJson("public/data/celestial-convergence-v591/venus-asset-overlay.json")
    : null;
  const tempel1Overlay = tempel1
    ? await readJson("public/data/celestial-convergence-v591/tempel-1-asset-overlay.json")
    : null;
  const ceresOverlay = ceres
    ? await readJson("public/data/celestial-convergence-v591/ceres-asset-overlay.json")
    : null;
  if (nasaSmallBody) {
    assert(heroOverlay && smallBodyOverlay && bennuOverlay, `v591-browser-small-body-evidence:${body}`);
    assert(heroOverlay.overlaySha256 === smallBodyOverlay.receiptSha256, `v591-browser-small-body-overlay:${body}`);
    assert(heroOverlay.modelLodReceiptSha256 === smallBodyOverlay.modelLodReceiptSha256, `v591-browser-small-body-model-receipt:${body}`);
  }
  if (venus) {
    assert(heroOverlay && venusOverlay, "v591-browser-venus-evidence");
    assert(heroOverlay.overlaySha256 === venusOverlay.receiptSha256, "v591-browser-venus-overlay");
  }
  if (tempel1) {
    assert(heroOverlay && tempel1Overlay, "v591-browser-tempel1-evidence");
    assert(heroOverlay.overlaySha256 === tempel1Overlay.receiptSha256, "v591-browser-tempel1-overlay");
    assert(heroOverlay.modelLodReceiptSha256 === tempel1Overlay.modelLodReceiptSha256, "v591-browser-tempel1-model-receipt");
  }
  const tempel1BennuOverlay = tempel1
    ? await readJson("public/data/celestial-convergence-v591/bennu-asset-overlay.json")
    : null;
  if (tempel1) assert(tempel1BennuOverlay, "v591-browser-tempel1-microtexture-evidence");
  const ceresBennuOverlay = ceres
    ? await readJson("public/data/celestial-convergence-v591/bennu-asset-overlay.json")
    : null;
  if (ceres) {
    assert(heroOverlay && ceresOverlay && ceresBennuOverlay, "v591-browser-ceres-evidence");
    assert(heroOverlay.overlaySha256 === ceresOverlay.receiptSha256, "v591-browser-ceres-overlay");
    assert(heroOverlay.modelLodReceiptSha256 === ceresOverlay.modelLodReceiptSha256, "v591-browser-ceres-model-receipt");
  }
  const expectedSmallBodyMicrotexturePolicy = nasaSmallBody ? heroOverlay.microtexturePolicy : null;
  for (const [index, sample] of orderedReplay.entries()) {
    assertPageBuildIdentityV591(states[index], expectedPageBuildIdentity, `replay-${index}`);
    const expectedMode = phases[index].endsWith("cinematic") ? "cinematic" : "science";
    const inheritedEarthMobile = body === "earth" && sample.deviceTier === "mobile";
    // The running Standalone page owns one loader generation for the complete
    // v591 scene. Analytical ice-giant primaries do not consume a texture, but
    // their telemetry must still identify the page's v591 lane rather than the
    // frozen v590 implementation they visually replace.
    const expectedLoaderLane = "v591";
    assert(sample.phase === phases[index] && sample.mode === expectedMode, `v591-browser-replay-order:${index}`);
    assert(sample.heroAdmission === "admitted", `v591-browser-admission:${index}`);
    assert(
      sample.nebula.admittedCount === 6
        && sample.nebula.blockedCount === 0
        && sample.nebula.requestedImpostorCount === 0
        && sample.nebula.readyImpostorCount === 0
        && sample.nebula.runtimeBlockedImpostorCount === 0
        && sample.nebula.requestedIds === "none"
        && sample.nebula.readyIds === "none"
        && sample.nebula.blockedIds === "",
      `v591-browser-nebula-hero-suppression:${index}`,
    );
    const expectedDefaultCount = sample.deviceTier === "mobile" ? 8 : 12;
    assert(
      sample.constellation.status === expectedConstellation.status
        && sample.constellation.packetVersion === expectedConstellation.packetVersion
        && sample.constellation.packetSha256 === expectedConstellation.packetSha256
        && sample.constellation.packetFileSha256 === expectedConstellation.packetFileSha256
        && sample.constellation.frozenSourceFileSha256 === expectedConstellation.frozenSourceFileSha256
        && sample.constellation.frozenBindingSha256 === expectedConstellation.frozenBindingSha256
        && sample.constellation.constellationCount === expectedConstellation.constellationCount
        && sample.constellation.waypointCount === expectedConstellation.waypointCount
        && sample.constellation.uniqueGaiaSourceIdCount === expectedConstellation.uniqueGaiaSourceIdCount
        && sample.constellation.maximumAngularDistanceDeg === expectedConstellation.maximumAngularDistanceDeg
        && sample.constellation.medianAngularDistanceDeg === expectedConstellation.medianAngularDistanceDeg
        && sample.constellation.renderedConstellationCount > 0
        && sample.constellation.renderedConstellationCount <= expectedDefaultCount
        && sample.constellation.renderedAnchorCount > 0
        && sample.constellation.renderedAnchorCount <= expectedConstellation.waypointCount
        && sample.constellation.defaultCount === expectedDefaultCount
        && sample.constellation.labelAtlasStatus === expectedConstellation.labelAtlasStatus
        && sample.constellation.labelAtlasSha256 === expectedConstellation.labelAtlasSha256
        && sample.constellation.labelAtlasBytes === expectedConstellation.labelAtlasBytes,
      `v591-browser-constellation-telemetry:${index}`,
    );
    assert(sample.ktx2First === (!inheritedEarthMobile && !proceduralPrimary), `v591-browser-source-policy:${index}`);
    assert(
      sample.loaderLane === expectedLoaderLane
        && sample.prewarm === (proceduralPrimary ? "not-applicable-procedural-primary" : "ready"),
      `v591-browser-loader:${index}`,
    );
    if (inheritedEarthMobile) {
      assert(
        sample.textureSources.split("|").every((entry) => entry.endsWith(":full-raster"))
          && sample.textureReceipt.split("|").every((entry) => entry.includes(":ready:full-raster:") && entry.includes("quality=passed")),
        `v591-browser-earth-mobile-raster:${index}`,
      );
    }
    if (proceduralPrimary) {
      assert(sample.textureSources.includes("ice-giant-flow-primary:procedural-primary"), `v591-browser-primary-source:${index}`);
      assert(sample.textureReceipt.includes("ice-giant-flow-primary:ready:procedural-primary:") && sample.textureReceipt.includes("quality=passed"), `v591-browser-primary-receipt:${index}`);
      assert(sample.frameFits === true, `v591-browser-primary-frame:${index}`);
    }
    if (["mercury", "venus", "mars", "jupiter", "eros", "kleopatra", "tempel-1", "ceres"].includes(body)) {
      const viewportWidth = Number(sample.viewport.split("x")[0]);
      assert(sample.frameFits === true && sample.screenDiameterPx <= viewportWidth * 0.92, `v591-browser-bounded-frame:${index}`);
    }
    if (nasaSmallBody) {
      const expectedLod = sample.deviceTier === "mobile" ? 1 : 0;
      const expectedModel = smallBodyOverlay.model.lods[expectedLod];
      const expectedReconstruction = body === "eros" ? "watertight-topology-paired" : "not-applicable";
      assert(sample.assetOverlaySha256 === smallBodyOverlay.receiptSha256, `v591-browser-small-body-overlay-sha:${body}:${index}`);
      assert(sample.modelLodReceiptSha256 === smallBodyOverlay.modelLodReceiptSha256, `v591-browser-small-body-model-receipt-sha:${body}:${index}`);
      assert(sample.modelStatus === "ready" && sample.modelLod === String(expectedLod), `v591-browser-small-body-model-status:${body}:${index}`);
      assert(sample.modelSha256 === expectedModel.sha256 && sample.modelGpuBytes > 0, `v591-browser-small-body-model-sha:${body}:${index}`);
      assert(sample.sourceDetailCeiling === smallBodyOverlay.model.sourceDetailCeiling, `v591-browser-small-body-detail-ceiling:${body}:${index}`);
      assert(sample.printableSplitReconstruction === expectedReconstruction, `v591-browser-small-body-reconstruction:${body}:${index}`);
      assert(
        typeof expectedSmallBodyMicrotexturePolicy === "string"
          && expectedSmallBodyMicrotexturePolicy.includes("exact-byte-reuse")
          && sample.microtexturePolicy === expectedSmallBodyMicrotexturePolicy,
        `v591-browser-small-body-microtexture-policy:${body}:${index}`,
      );
      assert(sample.microtextureSourceOverlaySha256 === bennuOverlay.receiptSha256, `v591-browser-small-body-microtexture-source:${body}:${index}`);
      assert(sample.microtextureExactByteReuse === true, `v591-browser-small-body-microtexture-reuse:${body}:${index}`);
      assert(sample.measuredPhotometryClaim === false && sample.proceduralFallback === false && sample.scientificPayloadMutation === false, `v591-browser-small-body-authority:${body}:${index}`);
    }
    if (venus) {
      assert(sample.assetOverlaySha256 === venusOverlay.receiptSha256, `v591-browser-venus-overlay-sha:${index}`);
      assert(sample.surfaceSource === "nasa-jpl-magellan-0e-90e-270e-clean-global-views-derived-equirectangular", `v591-browser-venus-source:${index}`);
      assert(sample.cloudModel === "deterministic-physical-inspired-primary-not-observation-texture", `v591-browser-venus-cloud-model:${index}`);
      assert(sample.cloudObservationTextureClaim === false, `v591-browser-venus-cloud-claim:${index}`);
      assert(sample.reliefModel === "bounded-color-topography-presentation-relief-not-measured-elevation", `v591-browser-venus-relief:${index}`);
      assert(sample.measuredTopographyClaim === false && sample.opticalColorClaim === false, `v591-browser-venus-observation-claims:${index}`);
      assert(sample.proceduralFallback === false && sample.scientificPayloadMutation === false, `v591-browser-venus-authority:${index}`);
    }
    if (tempel1) {
      const expectedLod = sample.deviceTier === "mobile" ? 1 : 0;
      const expectedModel = tempel1Overlay.model.lods[expectedLod];
      assert(sample.assetOverlaySha256 === tempel1Overlay.receiptSha256, `v591-browser-tempel1-overlay-sha:${index}`);
      assert(sample.modelLodReceiptSha256 === tempel1Overlay.modelLodReceiptSha256, `v591-browser-tempel1-model-receipt-sha:${index}`);
      assert(sample.modelStatus === "ready" && sample.modelLod === String(expectedLod), `v591-browser-tempel1-model-status:${index}`);
      assert(sample.modelSha256 === expectedModel.sha256 && sample.modelGpuBytes > 0, `v591-browser-tempel1-model-sha:${index}`);
      assert(sample.sourceDetailCeiling === tempel1Overlay.model.sourceDetailCeiling, `v591-browser-tempel1-detail-ceiling:${index}`);
      assert(sample.observationDataset === "DIF-C-HRIV/ITS/MRI-5-TEMPEL1-SHAPE-V2.0", `v591-browser-tempel1-dataset:${index}`);
      assert(sample.observedCoverageFraction === 0.8043214699074074, `v591-browser-tempel1-coverage:${index}`);
      assert(sample.unobservedAreaPolicy === "cc0-regolith-presentation-substrate-never-observation", `v591-browser-tempel1-unobserved-policy:${index}`);
      assert(sample.microtextureSourceOverlaySha256 === tempel1BennuOverlay.receiptSha256 && sample.microtextureExactByteReuse === true, `v591-browser-tempel1-microtexture:${index}`);
      assert(sample.tailPolicy === "fixed-seed-dust-anti-solar-ion-velocity-presentation-only", `v591-browser-tempel1-tail-policy:${index}`);
      assert(sample.tailVisible === (sample.mode === "cinematic"), `v591-browser-tempel1-tail-visibility:${index}`);
      assert(sample.measuredPhotometryClaim === false && sample.proceduralFallback === false && sample.scientificPayloadMutation === false, `v591-browser-tempel1-authority:${index}`);
    }
    if (ceres) {
      const expectedLod = sample.deviceTier === "mobile" ? 1 : 0;
      const expectedModel = ceresOverlay.model.lods[expectedLod];
      assert(sample.assetOverlaySha256 === ceresOverlay.receiptSha256, `v591-browser-ceres-overlay-sha:${index}`);
      assert(sample.modelLodReceiptSha256 === ceresOverlay.modelLodReceiptSha256, `v591-browser-ceres-model-receipt-sha:${index}`);
      assert(sample.modelStatus === "ready" && sample.modelLod === String(expectedLod), `v591-browser-ceres-model-status:${index}`);
      assert(sample.modelSha256 === expectedModel.sha256 && sample.modelGpuBytes > 0, `v591-browser-ceres-model-sha:${index}`);
      assert(sample.sourceDetailCeiling === ceresOverlay.model.sourceDetailCeiling, `v591-browser-ceres-detail-ceiling:${index}`);
      assert(sample.observationGrid === "2222x1111-pds-dawn-spc-relative-albedo-and-radius", `v591-browser-ceres-observation-grid:${index}`);
      assert(sample.radiusRangeMeters === "442618.25:486849.59375", `v591-browser-ceres-radius-range:${index}`);
      assert(sample.microtexturePolicy === "poly-haven-cc0-exact-byte-reuse-presentation-only-not-ceres-observation", `v591-browser-ceres-microtexture-policy:${index}`);
      assert(sample.microtextureSourceOverlaySha256 === ceresBennuOverlay.receiptSha256 && sample.microtextureExactByteReuse === true, `v591-browser-ceres-microtexture:${index}`);
      assert(sample.reflectance === "rough-oren-nayar-bounded-opposition-no-glossy-specular", `v591-browser-ceres-reflectance:${index}`);
      assert(sample.opticalColorClaim === false && sample.syntheticDetailAdded === false && sample.measuredPhotometryClaim === false, `v591-browser-ceres-claims:${index}`);
      assert(sample.proceduralFallback === false && sample.scientificPayloadMutation === false, `v591-browser-ceres-authority:${index}`);
    }
    assert(sample.cameraSettled && sample.subjectVisible && sample.screenDiameterPx >= 72, `v591-browser-visible:${index}`);
    assert(sample.fpsMedian >= 45 && sample.fpsSampleCount >= 120, `v591-browser-fps:${index}`);
    assert(sample.drawCalls <= 60 && sample.gpuBytes <= (sample.deviceTier === "mobile" ? 201326592 : 536870912), `v591-browser-budget:${index}`);
  }
  assertPageBuildIdentityV591(release, expectedPageBuildIdentity, "release");
  assert(new Set(orderedReplay.map((sample) => sample.payloadSha256)).size === 1, "v591-browser-payload-replay");

  const screenshotByPhase = new Map();
  assert(Array.isArray(existing.screenshots) && existing.screenshots.length === 4, "v591-browser-screenshot-cardinality");
  const existingScreenshotPhases = existing.screenshots.map((entry) => `${entry.path.includes("desktop") ? "desktop" : "mobile"}-${entry.path.includes("cinematic") ? "cinematic" : "science"}`);
  assert(new Set(existingScreenshotPhases).size === 4 && phases.slice(0, 4).every((phase) => existingScreenshotPhases.includes(phase)), "v591-browser-screenshot-phase-set");
  for (const phase of phases.slice(0, 4)) {
    const key = screenshotKeys[phase];
    const existingScreenshot = existing.screenshots.find((entry) => {
      const desktop = phase.startsWith("desktop");
      const cinematic = phase.endsWith("cinematic");
      return entry.path.includes(desktop ? "desktop" : "mobile") && entry.path.includes(cinematic ? "cinematic" : "science");
    });
    assert(existingScreenshot && shots[key], `v591-browser-screenshot-input:${phase}`);
    const targetPath = resolve(root, existingScreenshot.path);
    const metadata = await normalizeScreenshot(shots[key], targetPath);
    assert(metadata.width === (phase.startsWith("desktop") ? 1440 : 390), `v591-browser-screenshot-width:${phase}`);
    assert(metadata.height === (phase.startsWith("desktop") ? 900 : 844), `v591-browser-screenshot-height:${phase}`);
    screenshotByPhase.set(phase, { ...existingScreenshot, ...metadata, subjectVisible: true });
  }
  const screenshots = existing.screenshots.map((entry) => {
    const phase = `${entry.path.includes("desktop") ? "desktop" : "mobile"}-${entry.path.includes("cinematic") ? "cinematic" : "science"}`;
    return screenshotByPhase.get(phase);
  });

  const warningCount = logs.filter((entry) => readLogSeverity(entry).includes("warn")).length;
  const errorCount = logs.filter((entry) => readLogSeverity(entry).includes("error")).length;
  assert(warningCount === 0 && errorCount === 0, "v591-browser-console");

  const releaseAudit = {
    candidateResources: numberAttribute(release, "data-atlas-v591-release-candidate-resources"),
    candidateBytes: numberAttribute(release, "data-atlas-v591-release-candidate-bytes"),
    candidateSceneNodes: numberAttribute(release, "data-atlas-v591-release-scene-nodes"),
    candidateProgramDelta: numberAttribute(release, "data-atlas-v591-release-program-delta"),
    rendererTextureDelta: numberAttribute(release, "data-atlas-v591-release-renderer-texture-delta"),
    rendererGeometryDelta: numberAttribute(release, "data-atlas-v591-release-renderer-geometry-delta"),
    rendererMemoryPolicy: release["data-atlas-v591-release-renderer-memory-policy"],
    registryStatus: release["data-atlas-v591-release-registry-status"],
    status: release["data-atlas-v591-resource-release-status"],
  };
  assert(
    releaseAudit.candidateResources === 0
      && releaseAudit.candidateBytes === 0
      && releaseAudit.candidateSceneNodes === 0
      && releaseAudit.candidateProgramDelta === 0
      && releaseAudit.rendererTextureDelta === 0
      && releaseAudit.registryStatus === "baseline"
      && releaseAudit.status === "released-zero",
    "v591-browser-release-zero",
  );

  const unsigned = {
    ...existing,
    generatedAt: new Date().toISOString(),
    status: `${body}-slice-passed-global-visual-matrix-pending`,
    candidate: {
      ...existing.candidate,
      manifestSha256: manifest.manifestSha256,
      sourceManifestSha256: sourceManifest.receiptSha256,
      capturedStandaloneBuildId: standaloneBuildId,
      capturedStandaloneReceiptSha256: sha256(standaloneReceiptBytes),
      capturedPageSourceManifestSha256: expectedPageBuildIdentity.sourceManifestSha256,
      capturedPageDeliveryTier: expectedPageBuildIdentity.deliveryTier,
      capturedPageBuildFingerprint: expectedPageBuildIdentity.buildFingerprint,
    },
    runtime: {
      ...existing.runtime,
      canvasCount: 1,
      hero: body,
      heroAdmission: "admitted",
      desktopKtx2First: !proceduralPrimary,
      mobileKtx2First: body !== "earth" && !proceduralPrimary,
      mobileDelivery: body === "earth" ? "verified-full-raster" : proceduralPrimary ? "registered-procedural-primary" : "ktx2-first",
      desktopMobileDesktopReplay: "passed",
      scientificPayloadSha256: orderedReplay[0].payloadSha256,
      scientificPayloadStableAcrossModesAndDeviceTiers: true,
      scientificWriteback: false,
      ...(nasaSmallBody ? {
        assetOverlaySha256: orderedReplay[0].assetOverlaySha256,
        modelLodReceiptSha256: orderedReplay[0].modelLodReceiptSha256,
        sourceDetailCeiling: orderedReplay[0].sourceDetailCeiling,
        printableSplitReconstruction: orderedReplay[0].printableSplitReconstruction,
        microtexturePolicy: orderedReplay[0].microtexturePolicy,
        microtextureSourceOverlaySha256: orderedReplay[0].microtextureSourceOverlaySha256,
        microtextureExactByteReuse: orderedReplay[0].microtextureExactByteReuse,
        measuredPhotometryClaim: orderedReplay[0].measuredPhotometryClaim,
        proceduralFallback: orderedReplay[0].proceduralFallback,
        reflectance: orderedReplay[0].reflectance,
      } : {}),
      ...(venus ? {
        assetOverlaySha256: orderedReplay[0].assetOverlaySha256,
        surfaceSource: orderedReplay[0].surfaceSource,
        cloudModel: orderedReplay[0].cloudModel,
        cloudObservationTextureClaim: orderedReplay[0].cloudObservationTextureClaim,
        reliefModel: orderedReplay[0].reliefModel,
        measuredTopographyClaim: orderedReplay[0].measuredTopographyClaim,
        opticalColorClaim: orderedReplay[0].opticalColorClaim,
        proceduralFallback: orderedReplay[0].proceduralFallback,
      } : {}),
      ...(tempel1 ? {
        assetOverlaySha256: orderedReplay[0].assetOverlaySha256,
        modelLodReceiptSha256: orderedReplay[0].modelLodReceiptSha256,
        sourceDetailCeiling: orderedReplay[0].sourceDetailCeiling,
        observationDataset: orderedReplay[0].observationDataset,
        observedCoverageFraction: orderedReplay[0].observedCoverageFraction,
        unobservedAreaPolicy: orderedReplay[0].unobservedAreaPolicy,
        microtextureSourceOverlaySha256: orderedReplay[0].microtextureSourceOverlaySha256,
        microtextureExactByteReuse: orderedReplay[0].microtextureExactByteReuse,
        tailPolicy: orderedReplay[0].tailPolicy,
        measuredPhotometryClaim: orderedReplay[0].measuredPhotometryClaim,
        proceduralFallback: orderedReplay[0].proceduralFallback,
      } : {}),
      ...(ceres ? {
        assetOverlaySha256: orderedReplay[0].assetOverlaySha256,
        modelLodReceiptSha256: orderedReplay[0].modelLodReceiptSha256,
        sourceDetailCeiling: orderedReplay[0].sourceDetailCeiling,
        observationGrid: orderedReplay[0].observationGrid,
        radiusRangeMeters: orderedReplay[0].radiusRangeMeters,
        microtexturePolicy: orderedReplay[0].microtexturePolicy,
        microtextureSourceOverlaySha256: orderedReplay[0].microtextureSourceOverlaySha256,
        microtextureExactByteReuse: orderedReplay[0].microtextureExactByteReuse,
        reflectance: orderedReplay[0].reflectance,
        opticalColorClaim: orderedReplay[0].opticalColorClaim,
        syntheticDetailAdded: orderedReplay[0].syntheticDetailAdded,
        measuredPhotometryClaim: orderedReplay[0].measuredPhotometryClaim,
        proceduralFallback: orderedReplay[0].proceduralFallback,
      } : {}),
      constellationPacket: {
        version: expectedConstellation.packetVersion,
        packetSha256: expectedConstellation.packetSha256,
        packetFileSha256: expectedConstellation.packetFileSha256,
        frozenSourceFileSha256: expectedConstellation.frozenSourceFileSha256,
        frozenBindingSha256: expectedConstellation.frozenBindingSha256,
        constellationCount: expectedConstellation.constellationCount,
        waypointCount: expectedConstellation.waypointCount,
        uniqueGaiaSourceIdCount: expectedConstellation.uniqueGaiaSourceIdCount,
        maximumAngularDistanceDeg: expectedConstellation.maximumAngularDistanceDeg,
        medianAngularDistanceDeg: expectedConstellation.medianAngularDistanceDeg,
        labelAtlasStatus: expectedConstellation.labelAtlasStatus,
        labelAtlasSha256: expectedConstellation.labelAtlasSha256,
        labelAtlasBytes: expectedConstellation.labelAtlasBytes,
        renderedConstellationCountRange: [
          Math.min(...orderedReplay.map((sample) => sample.constellation.renderedConstellationCount)),
          Math.max(...orderedReplay.map((sample) => sample.constellation.renderedConstellationCount)),
        ],
        renderedAnchorCountRange: [
          Math.min(...orderedReplay.map((sample) => sample.constellation.renderedAnchorCount)),
          Math.max(...orderedReplay.map((sample) => sample.constellation.renderedAnchorCount)),
        ],
        presentationOnly: true,
      },
      nebulaAdmission: {
        status: "6-of-6-runtime-admitted",
        admittedCount: 6,
        blockedCount: 0,
        scienceImageryPolicy: "zero-requested-zero-ready",
        heroCloseupImageryPolicy: "zero-requested-zero-ready",
        presentationOnly: true,
      },
    },
    orderedReplay,
    measurements: {
      desktopScience1440x900: measurement(orderedReplay[0]),
      desktopCinematic1440x900: measurement(orderedReplay[1]),
      mobileCinematic390x844: measurement(orderedReplay[2]),
      mobileScience390x844: measurement(orderedReplay[3]),
    },
    releaseAudit,
    errorAudit: {
      ...existing.errorAudit,
      nextErrorOverlayObserved: false,
      applicationErrorTextObserved: false,
      pageConsoleWarnings: warningCount,
      pageConsoleErrors: errorCount,
      logCollection: "tab.dev.logs-after-five-phase-replay",
      status: "passed",
    },
    screenshotEncoding: {
      browserCapture: "jpeg",
      evidenceFile: "png",
      normalization: "sharp-lossless-png-compression-9-adaptive-filtering",
      contentResampling: false,
    },
    screenshots,
    scope: {
      ...existing.scope,
      p1CoreHeroes: "6/6",
      allHeroes: `${manifest.runtime.v591HeroOverrideCount}/16-v591-overrides`,
      nebulae: "6/6-runtime-admitted",
      candidateQualified: false,
      formalProductPointer: "v263",
    },
  };
  delete unsigned.receiptSha256;
  const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  await replaceFileAtomically(resolve(root, receiptPath), Buffer.from(`${JSON.stringify(sealed, null, 2)}\n`, "utf8"));
  return {
    body,
    buildId: standaloneBuildId,
    receiptSha256: sealed.receiptSha256,
    screenshots: sealed.screenshots.map(({ path, bytes, sha256: screenshotSha256 }) => ({ path, bytes, sha256: screenshotSha256 })),
    fps: sealed.measurements,
    releaseAudit,
  };
}
