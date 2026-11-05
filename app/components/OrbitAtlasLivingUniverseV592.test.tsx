import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LIVING_UNIVERSE_FORMAL_PRODUCT_POINTER_V592,
  LIVING_UNIVERSE_MANIFEST_SHA256_V592,
  LIVING_UNIVERSE_ROUTE_V592,
  LIVING_UNIVERSE_SCIENTIFIC_PAYLOAD_SHA256_V592,
  LIVING_UNIVERSE_SOURCE_MANIFEST_SHA256_V592,
} from "../lib/livingUniverseV592";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const sha256 = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]));
}
const canonicalSha = (value: unknown) => sha256(JSON.stringify(canonicalize(value)));
function expectSeal(path: string, field: string): Record<string, unknown> {
  const document = JSON.parse(read(path)) as Record<string, unknown>;
  const unsigned = { ...document };
  delete unsigned[field];
  expect(document[field]).toBe(canonicalSha(unsigned));
  return document;
}

describe("Orbit Atlas v592 Living Universe", () => {
  it("adds an isolated local-shadow route with a client-only lazy boundary", () => {
    const page = read("app/local-shadow-v592/page.tsx");
    const lazy = read("app/components/OrbitAtlasLivingUniverseV592Lazy.tsx");
    expect(LIVING_UNIVERSE_ROUTE_V592).toBe("/local-shadow-v592");
    expect(page).toContain("OrbitAtlasLivingUniverseV592Lazy");
    expect(page).toContain('data-atlas-formal-product-pointer="v263"');
    expect(lazy).toContain("next/dynamic");
    expect(lazy).toContain("ssr: false");
  });

  it("uses the v591 composition inside the existing single Canvas", () => {
    const shell = read("app/components/OrbitAtlasLivingUniverseV592.tsx");
    const stage = read("app/components/LivingUniverseStageV592.tsx");
    expect(shell).toContain("UniverseCanvasOverrideHostV591");
    expect(shell).not.toContain("<Canvas");
    expect(shell).toContain('data-atlas-v592-canvas-count="1"');
    expect(stage).toContain("<CelestialConvergenceStageV591");
    expect(stage).toContain("<CelestialRotationBridgeV592");
    expect(stage).toContain("<DeepSpaceReferenceLayerV592");
    expect(stage).toContain("<LegacyNebulaTelemetryBridgeV592");
  });

  it("keeps the expanded-nebula camera rig inside the shared R3F render loop", () => {
    const layer = read("app/components/ExpandedNebulaLayerV592.tsx");
    const frameRegistration = layer.match(/useFrame\(\(_,[ ]delta\)[ ]=>[ ]\{[\s\S]*?\n[ ]{2}\},[ ](-?\d+)\);/);
    expect(frameRegistration?.[1]).toBe("0");
    expect(layer).not.toMatch(/useFrame\([\s\S]*?\},[ ](?:[1-9]\d*)\);/);
    expect(layer).toContain("probe.lookAt(desiredTarget)");
    expect(layer).toContain("const probe = new THREE.PerspectiveCamera()");
    expect(layer).not.toContain("const probe = new THREE.Object3D()");
    expect(layer).not.toContain("probe.lookAt(desiredPosition.clone().add(direction))");
    expect(layer).toContain("camera.position.lerpVectors(transitionStartPosition.current, desiredPosition, blend)");
    expect(layer).not.toContain("camera.position.lerp(desiredPosition, damping)");
    expect(layer).toContain("THREE.MathUtils.clamp(focus.angularSizeDeg * 3, 2.4, 14)");
    expect(layer).toContain("camera.fov = restoreFovDeg.current");
    expect(layer).toContain("depthTest: false");
    expect(layer).toContain("premultipliedAlpha: false");
    expect(layer).toContain("deep-field-focus-black-level-protection");
    expect(layer).toContain('profile.mode === "science" ? 0.86 : 0.2');
    expect(layer).toContain('if (key.startsWith("atlasV592NebulaCamera"))');
    expect(layer).toContain("const readyIds = requested.filter");
    expect(layer).toContain("root.dataset.atlasV592NebulaSelectedId");
    expect(layer).toContain("root.dataset.atlasV592NebulaReadyIds");
    expect(layer).toContain("frameId = requestAnimationFrame(publish)");
    expect(layer).toContain("cancelAnimationFrame(frameId)");
    const bridge = read("app/components/LegacyNebulaTelemetryBridgeV592.tsx");
    const bridgeFrameRegistration = bridge.match(/useFrame\(\(\) => \{[\s\S]*?\n  \}(?:,\s*([^)]+))?\);/);
    expect(bridgeFrameRegistration).not.toBeNull();
    expect(bridgeFrameRegistration?.[1]).toBeUndefined();
    expect(bridge).toContain("isNebulaFocusTargetV591(focusTarget)");
    expect(bridge).toContain("atlasV592NebulaSelectedId");
    expect(bridge).toContain("v591-readonly-verified-nasa-overlay");
    expect(bridge).toContain('atlasV592NebulaScientificWriteback = "false"');
  });

  it("mounts the frozen v590 Basis transcoder in the additive v592 standalone runtime", () => {
    const launcher = read("scripts/start-atlas-v592-standalone.mjs");
    expect(launcher).toContain('join(root, "public", "basis-v590")');
    expect(launcher).toContain('".next-atlas-v592-standalone-current"');
    expect(launcher).toContain('await import("./start-atlas-standalone.mjs")');
  });

  it("hands the renderer-wide KTX2 lane from frozen v591 to expanded nebulae", () => {
    const loader = read("app/lib/useNebulaVisualTextureV592.ts");
    expect(loader).toContain('import { disposeV591TextureLoader } from "./useV591Texture"');
    expect(loader).toContain("waitForV591DecoderSettlementV592");
    expect(loader).toContain("V591_LANE_QUIET_WINDOW_MS_V592");
    expect(loader).toContain("disposeV591TextureLoader(gl)");
    expect(loader).toContain('"v592-nebula-v591-ktx2-lane-settlement-timeout"');
  });

  it("owns an additive SHA-verified Gaia and constellation lane without running the frozen v591 worker", () => {
    const stage = read("app/components/LivingUniverseStageV592.tsx");
    const bridge = read("app/components/CelestialWorkerPolicyBridgeV592.tsx");
    const starfield = read("app/components/LivingStarfieldV592.tsx");
    const worker = read("app/workers/livingStarfieldV592.worker.ts");
    const constellationArt = read("app/components/ConstellationEngravingV592.tsx");
    const supplementReceipt = expectSeal("docs/release/v592/gaia-stratified-supplement-receipt-v592.json", "receiptSha256");
    const gaiaLite = readFileSync(resolve(root, "public/data/celestial-art-v589/gaia-lite-46000-v589.bin"));
    const supplement = readFileSync(resolve(root, "public/data/living-universe-v592/gaia-stratified-supplement-14000.bin"));
    const constellationPacket = JSON.parse(read("public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json")) as {
      bindings: Array<{ waypoints: Array<{ angularDistanceDeg: number }> }>;
    };
    expect(stage).toContain("<CelestialWorkerPolicyBridgeV592");
    expect(stage).toContain("<LivingStarfieldV592");
    expect(bridge).toContain("superseded-by-additive-v592-direct-gaia-lane");
    expect(bridge).toContain("v591-worker-superseded-no-io-by-v592");
    expect(worker).toContain("GAIA_LITE_SHA256_V590");
    expect(worker).toContain("CONSTELLATION_PACKET_FILE_SHA256_V591");
    expect(worker).toContain("GAIA_STRATIFIED_SUPPLEMENT_SHA256_V592");
    expect(worker).not.toContain("atlasAssetCandidates");
    expect(starfield).toContain("<PointStarsV592");
    expect(starfield).toContain("<BrightStarsV592");
    expect(starfield).toContain("<ConstellationsV592");
    expect(starfield).toContain("<ConstellationEngravingV592");
    expect(constellationArt).toContain("gaia-tangent-plane-constellation-engraving-v592");
    expect(constellationArt).toContain('atlasV592ConstellationArtAdmission');
    expect(constellationArt).toContain('atlasV592ConstellationArtScientificWriteback = "false"');
    expect(starfield).toContain('root.dataset.atlasV592ScientificWriteback = "false"');
    expect(constellationPacket.bindings).toHaveLength(88);
    expect(constellationPacket.bindings.reduce((sum, binding) => sum + binding.waypoints.length, 0)).toBe(484);
    expect(Math.max(...constellationPacket.bindings.flatMap((binding) => binding.waypoints.map((waypoint) => waypoint.angularDistanceDeg)))).toBeLessThanOrEqual(1.5);
    expect(sha256(gaiaLite)).toBe("a312297456bac7190c7a347d281cea12681ad2bbc6c2458434fb882cf61aa802");
    expect(supplement).toHaveLength(14_000 * 24);
    expect(sha256(supplement)).toBe((supplementReceipt as { output: { sha256: string } }).output.sha256);
    const liteIds = new Set(Array.from({ length: 46_000 }, (_, index) => gaiaLite.readBigUInt64LE(index * 24).toString()));
    const supplementIds = Array.from({ length: 14_000 }, (_, index) => supplement.readBigUInt64LE(index * 24).toString());
    expect(new Set(supplementIds).size).toBe(14_000);
    expect(supplementIds.some((sourceId) => liteIds.has(sourceId))).toBe(false);
  });

  it("drives orientation from absolute Julian time without per-frame accumulation", () => {
    const bridge = read("app/components/CelestialRotationBridgeV592.tsx");
    const clock = read("app/lib/celestialClockV592.ts");
    expect(bridge).toContain("clock.getJulianDate(performance.now())");
    expect(bridge).toContain("resolveBodyOrientationV592(bodyId, julianDate)");
    expect(bridge).toContain("}, -1)");
    const shell = read("app/components/OrbitAtlasLivingUniverseV592.tsx");
    expect(shell).toContain("initialRate: 3_600");
    expect(clock).toContain("state.anchorJulianDate");
    expect(clock).toContain("elapsedRealSeconds * state.rateSecondsPerSecond");
    expect(clock).not.toMatch(/julianDate\s*\+=/);
    expect(bridge).toContain("atlasV592RotationAppliedBodies");
    expect(bridge).toContain("atlasV592RotationPrimeMeridians");
    expect(bridge).toContain("atlasV592RotationMotion");
    expect(bridge).toContain('? "advancing"');
  });

  it("discovers admitted v591 and inherited v590 hero nodes without rotating blocked placeholders", () => {
    const bridge = read("app/components/CelestialRotationBridgeV592.tsx");
    expect(bridge).toContain("node.userData.atlasHeroBodyV591 ?? node.userData.atlasHeroBodyV590");
    expect(bridge).toContain('node.userData.atlasAdmission === "admitted"');
    expect(bridge).toContain("node.userData.atlasAssetBlocked !== true");
    expect(bridge).toContain("atlasV592RotationSceneCandidates");
    expect(bridge).toContain("atlasV592RotationSceneAdmitted");
  });

  it("declares the Three.js common shader chunk before logarithmic-depth code", () => {
    const stellarHero = read("app/components/StellarHeroV592.tsx");
    const common = stellarHero.indexOf("#include <common>");
    const logDepthPars = stellarHero.indexOf("#include <logdepthbuf_pars_vertex>");
    const logDepthVertex = stellarHero.indexOf("#include <logdepthbuf_vertex>");
    expect(common).toBeGreaterThanOrEqual(0);
    expect(common).toBeLessThan(logDepthPars);
    expect(logDepthPars).toBeLessThan(logDepthVertex);
    expect(stellarHero).toContain("Hot radiative photospheres have fine, low-contrast granules");
    expect(stellarHero).toContain("float limbWarmth = pow(oneMinusMu, 1.35) * 0.16");
    expect(stellarHero).toContain("radiative ? 32 : 38");
    expect(stellarHero).toContain("scale={1.045}");
  });

  it("keeps the scientific projection immutable across time, mode, and selection changes", () => {
    const shell = read("app/components/OrbitAtlasLivingUniverseV592.tsx");
    expect(shell).toContain("guardMutation(() => clock.setRate(rate))");
    expect(shell).toContain("guardMutation(() => clock.setJulianDate(julianDate))");
    expect(shell).toContain("scientificProjection.scientificPayloadWriteback === false");
    expect(shell).toContain('data-atlas-v592-scientific-writeback="false"');
    expect(LIVING_UNIVERSE_SCIENTIFIC_PAYLOAD_SHA256_V592).toBe("784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674");
  });

  it("exposes low-chrome desktop instrumentation and a mobile bottom sheet with touch-size controls", () => {
    const shell = read("app/components/OrbitAtlasLivingUniverseV592.tsx");
    expect(shell).toContain("data-atlas-v592-celestial-browser");
    expect(shell).toContain("data-atlas-v592-inspector");
    expect(shell).toContain("data-atlas-v592-time-instrument-rail");
    expect(shell).toContain("data-atlas-v592-mobile-sheet");
    expect(shell).toContain("data-atlas-v592-mobile-sky-reference");
    expect(shell).toContain("data-atlas-v592-mobile-sky-target-kind");
    expect(shell).toContain("Sky reference · J2000");
    expect(shell).toContain("resolveMobileFocusLabelV592");
    expect(shell).toContain("data-atlas-v592-mobile-focus-label");
    expect(shell).toContain("min-h-11");
    expect(shell).toContain("Clean view");
  });

  it("publishes page-visible JavaScript heap telemetry for the browser soak gate", () => {
    const shell = read("app/components/OrbitAtlasLivingUniverseV592.tsx");
    const soakBuilder = read("scripts/build-v592-browser-soak-resource-receipt.mjs");
    const candidateBuilder = read("scripts/build-v592-living-universe-candidate.mjs");
    const verifier = read("scripts/verify-v592-living-universe-candidate.mjs");
    expect(shell).toContain("function useHeapTelemetryV592");
    expect(shell).toContain("atlasV592JsHeapTelemetry");
    expect(shell).toContain("atlasV592JsHeapUsedBytes");
    expect(shell).toContain("atlasV592JsHeapTotalBytes");
    expect(shell).toContain("atlasV592JsHeapLimitBytes");
    expect(shell).toContain("atlasV592JsHeapSampleAt");
    expect(shell).toContain("useHeapTelemetryV592(rootRef, canvasReady)");
    expect(soakBuilder).toContain("JS_HEAP_FINAL_GROWTH_MAX_BYTES");
    expect(soakBuilder).toContain("available-performance-memory");
    expect(soakBuilder).toContain("noSyntheticTelemetry: true");
    expect(soakBuilder).toContain("new Date(samples[0].epochMs).toISOString()");
    expect(candidateBuilder).toContain("browserSoakTelemetryAvailable");
    expect(verifier).toContain("browserSoakHeapQualified");
  });

  it("adds a twelve-moon browser while rendering only the three SHA-admitted runtime Hero candidates", () => {
    const shell = read("app/components/OrbitAtlasLivingUniverseV592.tsx");
    const stage = read("app/components/LivingUniverseStageV592.tsx");
    const hero = read("app/components/MajorMoonHeroV592.tsx");
    const loader = read("app/lib/useMajorMoonVisualTextureV592.ts");
    expect(shell).toContain("Moons · 12");
    expect(shell).toContain("MAJOR_MOON_MODELS_V592.map");
    expect(shell).toContain("data-atlas-v592-major-moon-button");
    expect(shell).toContain("data-atlas-v592-major-moon-inspector");
    expect(stage).toContain("<MajorMoonHeroV592");
    expect(hero).toContain("resolveMajorMoonRotationV592(moonId, clock.getJulianDate(now))");
    expect(hero).toContain("titan-observation-informed-deterministic-haze");
    expect(hero).toContain('moonId === "enceladus" ? "blocked-not-rendered"');
    expect(hero).toContain("atlasProceduralFallback: false");
    expect(hero).toContain("atlasScientificPayloadMutation: false");
    expect(loader).toContain("v590-sealed-sentinel");
    expect(loader).toContain("verified-v592-major-moon-ktx2");
    expect(loader).toContain("verified-v592-major-moon-webp");
    expect(loader).toContain("v592-major-moon-scope-released");
  });

  it("keeps 24 J2000 references while admitting source, Gaia-derived and OpenNGC analytic models", () => {
    const shell = read("app/components/OrbitAtlasLivingUniverseV592.tsx");
    const layer = read("app/components/DeepSpaceReferenceLayerV592.tsx");
    const loader = read("app/lib/useDeepSpaceVisualTextureV592.ts");
    expect(shell).toContain("Deep · 24");
    expect(shell).toContain("Galaxy references · 12");
    expect(shell).toContain("Cluster references · 12");
    expect(shell).toContain("data-atlas-v592-deep-space-inspector");
    expect(shell).toContain("catalog-reference-admitted-visual-asset-blocked");
    expect(shell).toContain("catalog-reference-and-presentation-image-admitted");
    expect(shell).toContain("catalog-reference-and-gaia-derived-visual-admitted");
    expect(shell).toContain('visualAsset.catalogDerivedVisualModel ? "Catalog visual" : "Observation"');
    expect(shell).toContain("NASA observation admitted · Cinematic only");
    expect(shell).toContain("Gaia catalog field · Cinematic only");
    expect(layer).toContain('atlasGalaxyReferenceCount: 12');
    expect(layer).toContain('atlasClusterReferenceCount: 12');
    expect(layer).toContain('atlasVisualAssetAdmissionCount: 24');
    expect(layer).toContain('atlasGalaxyVisualAssetAdmissionCount: 12');
    expect(layer).toContain('openngc-catalog-derived-galaxy-analytic');
    expect(layer).toContain('atlasClusterVisualAssetAdmissionCount: 12');
    expect(layer).toContain('asset.variants.desktop.depthSliceCount');
    expect(layer).toContain('selectedRasterVisualAsset.variants.mobile.depthSliceCount');
    expect(layer).toContain('atlasCatalogDerivedVisualModel: asset.catalogDerivedVisualModel');
    expect(layer).toContain('profile.mode === "cinematic"');
    expect(layer).toContain('atlasScienceImagePayload: false');
    expect(layer).toContain('atlasMaximumConcurrentHighOrderImages: 1');
    expect(layer).toContain('atlasScientificPayloadWriteback: false');
    expect(layer).toContain('root.dataset.atlasV592DeepSpaceScientificWriteback = "false"');
    expect(layer).toContain('root.dataset.atlasV592DeepSpaceDrawCalls = String(gl.info.render.calls)');
    expect(layer).toContain('root.dataset.atlasV592DeepSpaceGpuBytes = String(estimatedGpuBytes)');
    expect(layer).toContain('root.dataset.atlasV592DeepSpaceTextures = String(gl.info.memory.textures)');
    expect(layer).toContain('root.dataset.atlasV592DeepSpaceGeometries = String(gl.info.memory.geometries)');
    expect(layer).toContain('root.dataset.atlasV592DeepSpacePrograms = String(gl.info.programs?.length ?? 0)');
    expect(layer).toContain('root.dataset.atlasV592DeepSpaceRenderTelemetrySource = "three-info-plus-v592-resource-snapshot"');
    expect(loader).toContain("loadVerifiedBytesV592");
    expect(loader).toContain("sha256BytesHexV566");
    expect(loader).toContain('acquireAtlasResource("object-url"');
    expect(loader).toContain('acquireAtlasResource("worker"');
    expect(loader).toContain("verified-v592-deep-space-ktx2");
    expect(loader).toContain("v592-deep-space-scope-released");
  });

  it("isolates cinematic deep-space focus and enlarges only admitted Gaia cluster cores", () => {
    const layer = read("app/components/DeepSpaceReferenceLayerV592.tsx");
    expect(layer).toContain("function DeepSpaceFocusBlackoutV592()");
    expect(layer).toContain("camera-following shell");
    expect(layer).toContain("opacity: 0.965");
    expect(layer).toContain("side: THREE.BackSide");
    expect(layer).toContain("depthTest: false");
    expect(layer).toContain('owner: "v592-deep-space-visual-runtime"');
    expect(layer).toContain('atlasLayer: "deep-space-cinematic-focus-black-level-isolation"');
    expect(layer).toContain('atlasScientificPayloadWriteback: false');
    expect(layer).toContain("const GAIA_CLUSTER_VERTEX_SHADER_V592");
    expect(layer).toContain("const GAIA_CLUSTER_FRAGMENT_SHADER_V592");
    expect(layer).toContain("Gaussian-weighted 7x7 footprint");
    expect(layer).toContain("for (int y = -3; y <= 3; y += 1)");
    expect(layer).toContain("for (int x = -3; x <= 3; x += 1)");
    expect(layer).toContain("float coreWeight = exp(-radiusSquared * 0.62)");
    expect(layer).toContain("float haloWeight = exp(-radiusSquared * 0.19)");
    expect(layer).toContain("uGain: { value: 6.5 }");
    expect(layer).toContain("blending: THREE.AdditiveBlending");
    expect(layer).toContain("function deepSpaceVisualWidthV592(");
    expect(layer).toContain("asset.catalogSelection?.selectionRadiusDeg");
    expect(layer).toContain("Math.tan(apertureRadiusRad) * DEEP_SPACE_MARKER_RADIUS_V592 * 2");
    expect(layer).toContain("focus.angularSize.majorArcmin / 60 * 3.2, 0.75, 24");
    expect(layer).toContain("frameId = requestAnimationFrame(publish)");
    expect(layer).toContain("cancelAnimationFrame(frameId)");
    expect(layer).toContain('profile.mode === "cinematic" ? <DeepSpaceFocusBlackoutV592 /> : null');
    expect(layer).not.toContain("Math.random");
  });

  it("keeps dense deep-space inspector content scrollable above its fixed evidence rail", () => {
    const shell = read("app/components/OrbitAtlasLivingUniverseV592.tsx");
    expect(shell).toContain('data-atlas-v592-deep-space-inspector');
    expect(shell).toContain("min-h-0 flex-1 overflow-y-auto");
    expect(shell).toContain("mt-3 shrink-0 border-t");
  });

  it("seals the additive 24-frame OpenNGC analytic browser matrix without weakening the Science boundary", () => {
    const receipt = expectSeal(
      "docs/release/v592/deep-space-analytic-browser-matrix-receipt-v592.json",
      "receiptSha256",
    ) as {
      status: string;
      admission: {
        analyticGalaxyCount: number;
        frameCount: number;
        cinematicFrameCount: number;
        scienceMarkerOnlyFrameCount: number;
        uniqueScreenshotCount: number;
        minimumFpsMedian: number;
        peakDesktopGpuBytes: number;
        peakMobileGpuBytes: number;
        peakDrawCalls: number;
        singleCanvas: boolean;
        scienceCinematicPayloadStable: boolean;
        scientificPayloadWriteback: boolean;
        scienceImagePayloadLoaded: boolean;
        consolePageWebglErrorCount: number;
        releaseRestorePassed: boolean;
        releaseStateCandidateResources: number;
        releaseStateCandidateBytes: number;
      };
      frames: Array<{
        mode: "science" | "cinematic";
        state: string;
        readySliceCount: number;
        textureSources: string;
        telemetrySource: string;
        scientificPayloadSha256: string;
        scientificPayloadWriteback: boolean;
        scienceImagePayload: boolean;
      }>;
    };
    expect(receipt.status).toBe("passed-six-openngc-analytic-galaxies-four-profile-browser-matrix");
    expect(receipt.admission).toEqual(expect.objectContaining({
      analyticGalaxyCount: 6,
      frameCount: 24,
      cinematicFrameCount: 12,
      scienceMarkerOnlyFrameCount: 12,
      uniqueScreenshotCount: 24,
      singleCanvas: true,
      scienceCinematicPayloadStable: true,
      scientificPayloadWriteback: false,
      scienceImagePayloadLoaded: false,
      consolePageWebglErrorCount: 0,
      releaseRestorePassed: true,
      releaseStateCandidateResources: 0,
      releaseStateCandidateBytes: 0,
    }));
    expect(receipt.admission.minimumFpsMedian).toBeGreaterThanOrEqual(45);
    expect(receipt.admission.peakDesktopGpuBytes).toBeLessThanOrEqual(512 * 1024 * 1024);
    expect(receipt.admission.peakMobileGpuBytes).toBeLessThanOrEqual(192 * 1024 * 1024);
    expect(receipt.admission.peakDrawCalls).toBeLessThanOrEqual(60);
    expect(receipt.frames).toHaveLength(24);
    expect(receipt.frames.filter((frame) => frame.mode === "science")).toHaveLength(12);
    expect(receipt.frames.filter((frame) => frame.mode === "cinematic")).toHaveLength(12);
    for (const frame of receipt.frames) {
      expect(frame.telemetrySource).toBe("three-info-plus-v592-resource-snapshot");
      expect(frame.scientificPayloadSha256).toBe(LIVING_UNIVERSE_SCIENTIFIC_PAYLOAD_SHA256_V592);
      expect(frame.scientificPayloadWriteback).toBe(false);
      expect(frame.scienceImagePayload).toBe(false);
      if (frame.mode === "science") {
        expect(frame.state).toBe("admitted-science-marker-only");
        expect(frame.readySliceCount).toBe(0);
        expect(frame.textureSources).toBe("none");
      } else {
        expect(frame.state).toBe("ready");
        expect(frame.readySliceCount).toBe(1);
        expect(frame.textureSources).toBe("openngc-analytic-shader");
      }
    }
  });

  it("binds the candidate, source, rotation and frozen identities", () => {
    const manifest = expectSeal("public/data/living-universe-v592/manifest.json", "manifestSha256");
    const source = expectSeal("docs/release/v592/source-manifest-v592.json", "receiptSha256");
    const freeze = expectSeal("docs/release/v592/freeze-before-v592.json", "snapshotSha256");
    const rotation = expectSeal("public/data/living-universe-v592/rotation-reference.json", "packetSha256");
    const stellar = expectSeal("public/data/living-universe-v592/stellar-heroes.json", "packetSha256");
    const stellarBrowser = expectSeal("docs/release/v592/stellar-browser-matrix-receipt-v592.json", "receiptSha256");
    expect(manifest.manifestSha256).toBe(LIVING_UNIVERSE_MANIFEST_SHA256_V592);
    expect(source.receiptSha256).toBe(LIVING_UNIVERSE_SOURCE_MANIFEST_SHA256_V592);
    expect(source.version).toBe("v592-source-manifest-v2");
    expect((source as { postBuildEvidencePolicy: { excludedFromRuntimeSourceIdentity: boolean; verificationScope: string } }).postBuildEvidencePolicy).toEqual(expect.objectContaining({
      excludedFromRuntimeSourceIdentity: true,
      verificationScope: "capability-and-readonly-verifier",
    }));
    expect((source.files as Array<{ path: string }>).some((entry) => entry.path.startsWith("docs/release/v592/browser-soak"))).toBe(false);
    expect((source.files as Array<{ path: string }>).some((entry) => entry.path === "docs/release/v592/browser-live-matrix-receipt-v592.json")).toBe(false);
    expect(readFileSync(resolve(process.cwd(), "scripts/build-v592-live-browser-matrix-receipt.mjs"), "utf8"))
      .toContain('frames.filter((frame) => frame.deepState?.startsWith("ready-"))');
    expect((manifest as { postBuildBrowserEvidence: { excludedFromRuntimeManifestIdentity: boolean; capabilityProjectionPath: string } }).postBuildBrowserEvidence).toEqual(expect.objectContaining({
      excludedFromRuntimeManifestIdentity: true,
      capabilityProjectionPath: "docs/release/v592/capability-report-v592.json",
    }));
    expect(manifest).not.toHaveProperty("liveBrowserMatrix");
    expect(manifest).not.toHaveProperty("browserSoakResource");
    expect(manifest.formalProductPointer).toBe(LIVING_UNIVERSE_FORMAL_PRODUCT_POINTER_V592);
    expect((freeze.frozenSnapshot as unknown[]).length).toBeGreaterThanOrEqual(900);
    expect((freeze as { status: string }).status).toBe("matched");
    expect((manifest as { governance: { frozenDriftCount: number } }).governance.frozenDriftCount).toBe(0);
    expect((rotation as { admission: { admittedCount: number; kinematicAdmittedCount: number; incompleteBodies: string[] } }).admission).toEqual(expect.objectContaining({ admittedCount: 14, kinematicAdmittedCount: 16, incompleteBodies: ["bennu", "kleopatra"] }));
    expect((stellar as { admission: { catalogPacketCount: number; maximumGaiaAnchorDistanceDeg: number } }).admission.catalogPacketCount).toBe(24);
    expect((stellar as { admission: { catalogPacketCount: number; maximumGaiaAnchorDistanceDeg: number } }).admission.maximumGaiaAnchorDistanceDeg).toBeLessThanOrEqual(1.5);
    expect((stellarBrowser as { status: string }).status).toBe("passed-24-of-24-two-mode-browser-matrix");
    expect((stellarBrowser as { admission: { stellarHeroCount: number; singleCanvas: boolean; scienceCinematicPayloadStable: boolean } }).admission).toEqual(expect.objectContaining({
      stellarHeroCount: 24,
      singleCanvas: true,
      scienceCinematicPayloadStable: true,
    }));
    expect((stellarBrowser as { frames: unknown[] }).frames).toHaveLength(48);
  });
});
