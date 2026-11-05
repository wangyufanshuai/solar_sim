import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_EARTH_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_JUPITER_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_MARS_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_MOON_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_SATURN_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_SUN_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_TEMPEL1_ASSET_OVERLAY_SHA256_V591,
  CELESTIAL_CONVERGENCE_TEMPEL1_MODEL_LOD_RECEIPT_SHA256_V591,
  CELESTIAL_CONVERGENCE_VENUS_ASSET_OVERLAY_SHA256_V591,
} from "../data/celestialConvergenceAssetsV591.generated";
import { parseTempel1AssetOverlayV591 } from "./celestialTempel1V591";
import {
  parseBennuAssetOverlayV591,
  parseEarthAssetOverlayV591,
  parseJupiterAssetOverlayV591,
  parseMarsAssetOverlayV591,
  parseMoonAssetOverlayV591,
  parseSaturnAssetOverlayV591,
  parseSunAssetOverlayV591,
  parseVenusAssetOverlayV591,
  persistentV591AssetFailureReason,
} from "./useV591Texture";

const root = process.cwd();
const readJson = (path: string) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("v591 Venus NASA/JPL Magellan multiview admission", () => {
  it("binds four deterministic presentation channels to three clean public-domain global views", () => {
    const overlay = parseVenusAssetOverlayV591(readJson("public/data/celestial-convergence-v591/venus-asset-overlay.json"));
    expect(overlay.receiptSha256).toBe(CELESTIAL_CONVERGENCE_VENUS_ASSET_OVERLAY_SHA256_V591);
    expect(overlay.assets.map((asset) => asset.id)).toEqual([
      "venus-surface",
      "venus-normal",
      "venus-roughness",
      "venus-height",
    ]);
    expect(overlay.assets.map((asset) => asset.role)).toEqual([
      "magellan-multiview-radar-surface",
      "magellan-radar-derived-normal",
      "magellan-radar-derived-roughness",
      "magellan-radar-presentation-relief",
    ]);
    expect(new Set(overlay.assets.map((asset) => asset.source.sha256)).size).toBe(1);
    expect(overlay.assets.every((asset) => asset.source.host === "images-assets.nasa.gov")).toBe(true);
    expect(overlay.assets.every((asset) => asset.source.license.id === "NASA-public-domain")).toBe(true);
    expect(overlay.assets.every((asset) => asset.sourceComponents?.length === 3)).toBe(true);
    expect(overlay.sourceReceiptSha256s).toEqual([
      "bd8281ea2d55e5cd487c12f3919003e9965088dcf0b9debb6f50fe61488f0538",
      "34dbad98e79dc32eda90220f15012ce176b9c4e68e15b397368bbc85a58f5831",
      "966f8c03afe6762166eef798a9b1d5a4cbab257856a730dc618eb94109114150",
    ]);
    expect(overlay.proceduralFallback).toBe(false);
    expect(overlay.cloudModel).toEqual({
      id: "venus-physical-inspired-cloud-primary-v591",
      observationTextureClaim: false,
      resourceMissingFallback: false,
      presentationOnly: true,
    });
    expect(overlay.authorityState).toEqual({
      presentationOnly: true,
      scientificAuthorityChanged: false,
      scientificPayloadWriteback: false,
      measuredAuthorityGranted: false,
    });
  });

  it("verifies all three single-request sources, preserved USGS timeout evidence, and every derived byte", () => {
    const metadata = readJson("docs/release/v591/metadata-probe-venus-s3-path-alias.json");
    const ledger = readJson("docs/release/v591/acquisition-url-ledger-venus-s3-path-alias.json");
    const originalBlocked = readJson("docs/release/v591/acquisition-blocked-venus-clrtopo-6600m-cube-source-v591.json");
    const aliasBlocked = readJson("docs/release/v591/acquisition-blocked-venus-clrtopo-6600m-cube-path-alias-v591.json");
    const overlay = parseVenusAssetOverlayV591(readJson("public/data/celestial-convergence-v591/venus-asset-overlay.json"));
    const acquisitions = ["0e", "90e", "270e"].map((longitude) => readJson(`docs/release/v591/acquisition-asset-venus-magellan-${longitude}.json`));
    expect(acquisitions.map((receipt) => receipt.receiptSha256)).toEqual(overlay.sourceReceiptSha256s);
    for (const acquisition of acquisitions) {
      expect(acquisition.status).toBe("committed-single-request-no-retry");
      expect(acquisition.requestCount).toBe(1);
      expect(acquisition.automaticRetryPerformed).toBe(false);
      expect(acquisition.automaticReplacementPerformed).toBe(false);
      const sourceBytes = readFileSync(resolve(root, acquisition.asset.outputPath));
      expect(sourceBytes.byteLength).toBe(acquisition.asset.bytes);
      expect(sha256(sourceBytes)).toBe(acquisition.asset.sha256);
    }
    expect(metadata.status).toBe("metadata-candidate-confirmed-no-payload");
    expect(ledger.entries).toHaveLength(1);
    expect(ledger.entries[0]).toMatchObject({
      url: metadata.candidate.directUrl,
      outcome: "response-received",
    });
    expect(aliasBlocked).toMatchObject({
      status: "blocked-no-automatic-retry",
      requestCount: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      url: metadata.candidate.directUrl,
    });
    expect(originalBlocked.status).toBe("blocked-no-automatic-retry");
    expect(aliasBlocked.error).toContain("timeout");
    expect(overlay.surfaceCoverage?.measuredTopographyClaim).toBe(false);
    for (const asset of overlay.assets) {
      for (const file of Object.values(asset.variants)) {
        const bytes = readFileSync(resolve(root, `public/${file.url.replace(/^\/+/, "")}`));
        expect(bytes.byteLength, file.url).toBe(file.bytes);
        expect(sha256(bytes), file.url).toBe(file.sha256);
      }
    }
  });

  it("rejects source, role, procedural-fallback, and authority mutations", () => {
    const overlay = readJson("public/data/celestial-convergence-v591/venus-asset-overlay.json");
    expect(() => parseVenusAssetOverlayV591({ ...overlay, proceduralFallback: true })).toThrow(/v591-venus-overlay/);
    expect(() => parseVenusAssetOverlayV591({
      ...overlay,
      authorityState: { ...overlay.authorityState, scientificPayloadWriteback: true },
    })).toThrow(/v591-venus-overlay/);
    expect(() => parseVenusAssetOverlayV591({
      ...overlay,
      assets: overlay.assets.map((asset: { id: string; role: string }) => asset.id === "venus-normal"
        ? { ...asset, role: "synthetic-normal" }
        : asset),
    })).toThrow(/v591-venus-overlay/);
    expect(() => parseVenusAssetOverlayV591({
      ...overlay,
      assets: overlay.assets.map((asset: { id: string; source: object }) => asset.id === "venus-surface"
        ? { ...asset, source: { ...asset.source, host: "example.com" } }
        : asset),
    })).toThrow(/v591-venus-overlay/);
  });
});

describe("v591 Tempel 1 PDS shape and observed-coverage admission", () => {
  it("parses the sealed PDS model, mosaic, coverage mask and CC0 substitution policy", () => {
    const overlay = parseTempel1AssetOverlayV591(readJson("public/data/celestial-convergence-v591/tempel-1-asset-overlay.json"));
    expect(overlay.receiptSha256).toBe(CELESTIAL_CONVERGENCE_TEMPEL1_ASSET_OVERLAY_SHA256_V591);
    expect(overlay.modelLodReceiptSha256).toBe(CELESTIAL_CONVERGENCE_TEMPEL1_MODEL_LOD_RECEIPT_SHA256_V591);
    expect(overlay.assets.map((asset) => asset.id)).toEqual(["tempel-1-observation", "tempel-1-observation-mask"]);
    expect(overlay.observationMapping).toMatchObject({
      projection: "simple-cylindrical",
      sourceLongitudeDomain: "minus-180-to-plus-180-east",
      sourceLatitudeDomain: "plus-90-to-minus-90",
      runtimePositiveYSpinAxis: true,
      observedPixelFraction: 0.8043214699074074,
      unobservedPixelsAreMeasuredDarkTerrain: false,
    });
    expect(overlay.model.lods.map((lod) => lod.triangleCount)).toEqual([32_040, 8_010, 2_002]);
    expect(overlay.microtextureReuse.sourceOverlaySha256).toBe(CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591);
    expect(overlay.materialPolicy.tails).toBe("fixed-seed-presentation-only-dust-anti-solar-ion-velocity");
    expect(overlay.proceduralFallback).toBe(false);
    expect(overlay.authorityState.scientificPayloadWriteback).toBe(false);
  });

  it("verifies acquisition, model LODs, texture variants and deterministic build receipt by exact SHA", () => {
    const acquisition = readJson("docs/release/v591/acquisition-asset-tempel-1-pds-shape-v2.json");
    const model = readJson("docs/release/v591/tempel-1-model-lod-receipt-v591.json");
    const build = readJson("docs/release/v591/tempel-1-asset-build-receipt-v591.json");
    const overlay = parseTempel1AssetOverlayV591(readJson("public/data/celestial-convergence-v591/tempel-1-asset-overlay.json"));
    expect(acquisition).toMatchObject({ status: "committed-single-request-no-retry", requestCount: 1, automaticRetryPerformed: false, automaticReplacementPerformed: false });
    expect(model.receiptSha256).toBe(CELESTIAL_CONVERGENCE_TEMPEL1_MODEL_LOD_RECEIPT_SHA256_V591);
    expect(build.overlayReceiptSha256).toBe(overlay.receiptSha256);
    expect(build.observedPixelFraction).toBe(0.8043214699074074);
    const archive = readFileSync(resolve(root, acquisition.asset.outputPath));
    expect(archive.byteLength).toBe(acquisition.asset.bytes);
    expect(sha256(archive)).toBe(acquisition.asset.sha256);
    for (const lod of overlay.model.lods) {
      const bytes = readFileSync(resolve(root, lod.path));
      expect(bytes.byteLength).toBe(lod.bytes);
      expect(sha256(bytes)).toBe(lod.sha256);
    }
    for (const asset of overlay.assets) {
      for (const file of Object.values(asset.variants)) {
        const bytes = readFileSync(resolve(root, `public/${file.url.replace(/^\/+/, "")}`));
        expect(bytes.byteLength, file.url).toBe(file.bytes);
        expect(sha256(bytes), file.url).toBe(file.sha256);
      }
    }
  });

  it("rejects coverage, model, fallback and authority mutations", () => {
    const overlay = readJson("public/data/celestial-convergence-v591/tempel-1-asset-overlay.json");
    expect(() => parseTempel1AssetOverlayV591({ ...overlay, proceduralFallback: true })).toThrow(/v591-tempel1-overlay/);
    expect(() => parseTempel1AssetOverlayV591({
      ...overlay,
      observationMapping: { ...overlay.observationMapping, unobservedPixelsAreMeasuredDarkTerrain: true },
    })).toThrow(/v591-tempel1-overlay/);
    expect(() => parseTempel1AssetOverlayV591({
      ...overlay,
      authorityState: { ...overlay.authorityState, scientificPayloadWriteback: true },
    })).toThrow(/v591-tempel1-overlay/);
    expect(() => parseTempel1AssetOverlayV591({
      ...overlay,
      model: { ...overlay.model, lods: overlay.model.lods.map((lod: { lod: number }) => lod.lod === 0 ? { ...lod, triangleCount: 100_000 } : lod) },
    })).toThrow(/v591-tempel1-overlay/);
  });
});

describe("v591 Sun visual asset admission", () => {
  it("binds the deterministic corona resource to the real 256-bit overlay identity", () => {
    const overrideSource = readFileSync(resolve(root, "app/components/CelestialHeroOverridesV591.tsx"), "utf8");
    expect(CELESTIAL_CONVERGENCE_SUN_ASSET_OVERLAY_SHA256_V591).toMatch(/^[a-f0-9]{64}$/);
    expect(overrideSource).toContain("manifestSha256: CELESTIAL_CONVERGENCE_SUN_ASSET_OVERLAY_SHA256_V591");
    expect(overrideSource).not.toMatch(/manifestSha256:\s*["']v591-/);
  });

  it("parses the sealed two-channel NASA overlay without changing authority", () => {
    const overlay = parseSunAssetOverlayV591(readJson("public/data/celestial-convergence-v591/sun-asset-overlay.json"));
    expect(overlay.receiptSha256).toBe(CELESTIAL_CONVERGENCE_SUN_ASSET_OVERLAY_SHA256_V591);
    expect(overlay.assets.map((asset) => asset.id)).toEqual(["sun-photosphere", "sun-chromosphere"]);
    expect(overlay.mirroredHemisphereDisclosure).toBe(true);
    expect(overlay.authorityState).toEqual({
      presentationOnly: true,
      scientificAuthorityChanged: false,
      measuredAuthorityGranted: false,
    });
    expect(overlay.assets.every((asset) => asset.source.host === "sdo.gsfc.nasa.gov")).toBe(true);
    expect(overlay.assets.every((asset) => asset.source.license.id === "NASA-public-domain")).toBe(true);
    expect(overlay.assets.every((asset) => asset.derivation.seamMeanAbsoluteDelta === 0)).toBe(true);
  });

  it("verifies every KTX2 and WebP variant by exact bytes and SHA", () => {
    const overlay = parseSunAssetOverlayV591(readJson("public/data/celestial-convergence-v591/sun-asset-overlay.json"));
    for (const asset of overlay.assets) {
      for (const file of Object.values(asset.variants)) {
        const bytes = readFileSync(resolve(root, `public/${file.url.replace(/^\/+/, "")}`));
        expect(bytes.byteLength, file.url).toBe(file.bytes);
        expect(sha256(bytes), file.url).toBe(file.sha256);
      }
    }
  });

  it("keeps acquisition single-request, no-retry, and source cache outside public", () => {
    const receipt = readJson("docs/release/v591/acquisition-receipt-sun.json");
    expect(receipt.status).toBe("acquired-single-request-no-retry");
    expect(receipt.requestedUrlCount).toBe(2);
    expect(receipt.automaticRetryPerformed).toBe(false);
    expect(receipt.automaticReplacementPerformed).toBe(false);
    expect(receipt.assets).toHaveLength(2);
    for (const asset of receipt.assets) {
      expect(asset.outputPath.startsWith("source-cache/celestial-convergence-v591/")).toBe(true);
      expect(asset.outputPath.startsWith("public/")).toBe(false);
      const bytes = readFileSync(resolve(root, asset.outputPath));
      expect(bytes.byteLength).toBe(asset.bytes);
      expect(sha256(bytes)).toBe(asset.sha256);
    }
  });

  it("rejects mutations instead of widening the admission gate", () => {
    const overlay = readJson("public/data/celestial-convergence-v591/sun-asset-overlay.json");
    expect(() => parseSunAssetOverlayV591({ ...overlay, mirroredHemisphereDisclosure: false })).toThrow(/v591-overlay/);
    expect(() => parseSunAssetOverlayV591({
      ...overlay,
      assets: overlay.assets.map((asset: { id: string; source: object }) => asset.id === "sun-photosphere"
        ? { ...asset, source: { ...asset.source, host: "example.com" } }
        : asset),
    })).toThrow(/v591-overlay/);
  });
});

describe("v591 Earth exact-byte inherited admission", () => {
  it("uses the single v591 Basis generation and attributes a zero-byte overlay reference", () => {
    const loaderSource = readFileSync(resolve(root, "app/lib/useV591Texture.ts"), "utf8");
    const stageSource = readFileSync(resolve(root, "app/components/CelestialConvergenceStageV591.tsx"), "utf8");
    expect(loaderSource).toContain("const inherited = useV591ReadonlyV590Texture(assetId, deliveryTier, deviceTier, enabled)");
    expect(loaderSource).not.toContain("const inherited = useV590Texture(assetId, deliveryTier, deviceTier, enabled)");
    expect(loaderSource).toContain('source === "ktx2" || (source === "full-raster" && reason === "verified-v590-readonly-raster")');
    expect(loaderSource).toContain(': "blocked-full-fallback"');
    expect(loaderSource).toContain("v591-earth-reference-");
    expect(loaderSource).toContain("estimatedBytes: 0");
    expect(stageSource).toContain('const desiredLoaderLane = profile.deliveryTier === "standalone-full" ? "v591" : "v590"');
    expect(stageSource).toContain('if (desiredLoaderLane === "v591") disposeV590TextureLoader(gl)');
    expect(stageSource).toContain('else disposeV591TextureLoader(gl)');
    expect(stageSource).toContain('loaderLaneReady && loaderLane === "v591"');
    expect(stageSource).toContain('? { ...profile, deliveryTier: "vercel-lite" }');
    expect(stageSource).toContain('<CelestialDeepSpaceV591 profile={profile}');
  });

  it("keeps analytical ice-giant evidence on the active v591 page loader lane", () => {
    const replaySource = readFileSync(resolve(root, "scripts/refresh-v591-browser-qualification-from-replay.mjs"), "utf8");
    const sealSource = readFileSync(resolve(root, "scripts/seal-v591-celestial-convergence-candidate.mjs"), "utf8");
    const verifySource = readFileSync(resolve(root, "scripts/verify-v591-celestial-convergence-candidate.mjs"), "utf8");
    const iceGiantSealSource = readFileSync(resolve(root, "scripts/seal-v591-ice-giant-browser-qualification.mjs"), "utf8");

    expect(replaySource).toContain('const expectedLoaderLane = "v591"');
    expect(replaySource).not.toContain('proceduralPrimary ? "v590" : "v591"');
    for (const source of [sealSource, verifySource, iceGiantSealSource]) {
      expect(source).not.toContain('loaderLane: "v590"');
      expect(source).not.toContain('sample.loaderLane === "v590"');
    }
    expect(iceGiantSealSource).toContain('sample.loaderLane === "v591"');
  });

  it("releases late renderer uploads and makes texture-zero a hard browser gate", () => {
    const loaderSource = readFileSync(resolve(root, "app/lib/useV591Texture.ts"), "utf8");
    const stageSource = readFileSync(resolve(root, "app/components/CelestialConvergenceStageV591.tsx"), "utf8");
    const collectorSource = readFileSync(resolve(root, "scripts/refresh-v591-browser-qualification-from-replay.mjs"), "utf8");
    const sealSource = readFileSync(resolve(root, "scripts/seal-v591-celestial-convergence-candidate.mjs"), "utf8");

    expect(loaderSource).toContain("function disposeTextureAfterDetachV591(texture: THREE.Texture)");
    expect(loaderSource).toContain("window.requestAnimationFrame(() => window.requestAnimationFrame(() => texture.dispose()))");
    expect(loaderSource.match(/disposeTextureAfterDetachV591\(texture\)/g)?.length).toBeGreaterThanOrEqual(2);
    expect(stageSource).toContain("&& textureDelta === 0");
    expect(collectorSource).toContain("releaseAudit.rendererTextureDelta === 0");
    expect(sealSource).toContain("receipt.releaseAudit?.rendererTextureDelta !== 0");
  });

  it("seals seven required channels against the frozen v590 manifest", () => {
    const overlay = parseEarthAssetOverlayV591(readJson("public/data/celestial-convergence-v591/earth-asset-overlay.json"));
    const baseline = readJson("public/data/celestial-rendering-v590/manifest.json");
    expect(overlay.receiptSha256).toBe(CELESTIAL_CONVERGENCE_EARTH_ASSET_OVERLAY_SHA256_V591);
    expect(overlay.noNetworkRequestsPerformed).toBe(true);
    expect(overlay.noAssetBytesCopied).toBe(true);
    expect(overlay.baseline.manifestSha256).toBe(baseline.manifestSha256);
    expect(overlay.assets.map((asset) => asset.id)).toEqual([
      "earth-albedo",
      "earth-normal",
      "earth-roughness",
      "earth-clouds",
      "earth-cloud-alpha",
      "earth-night",
      "earth-night-mask",
    ]);
    for (const asset of overlay.assets) {
      const inherited = baseline.assets.find((entry: { id: string }) => entry.id === asset.id);
      expect(inherited, asset.id).toBeTruthy();
      expect(asset.inheritedIdentity.manifestSha256).toBe(baseline.manifestSha256);
      expect(asset.inheritedIdentity.sourceSha256).toBe(inherited.sourceSha256);
      expect(asset.variants).toEqual(inherited.variants);
    }
  });

  it("verifies every inherited KTX2/WebP byte without copying it into v591", () => {
    const overlay = parseEarthAssetOverlayV591(readJson("public/data/celestial-convergence-v591/earth-asset-overlay.json"));
    for (const asset of overlay.assets) {
      for (const file of Object.values(asset.variants)) {
        expect(file).toBeTruthy();
        if (!file) continue;
        const bytes = readFileSync(resolve(root, `public/${file.url.replace(/^\/+/, "")}`));
        expect(bytes.byteLength, file.url).toBe(file.bytes);
        expect(sha256(bytes), file.url).toBe(file.sha256);
      }
    }
  });

  it("rejects authority and inherited-manifest mutations", () => {
    const overlay = readJson("public/data/celestial-convergence-v591/earth-asset-overlay.json");
    expect(() => parseEarthAssetOverlayV591({
      ...overlay,
      noAssetBytesCopied: false,
    })).toThrow(/v591-earth-overlay/);
    expect(() => parseEarthAssetOverlayV591({
      ...overlay,
      baseline: { ...overlay.baseline, manifestSha256: "0".repeat(64) },
    })).toThrow(/v591-earth-overlay/);
  });
});

describe("v591 Moon LROC/LOLA visual asset admission", () => {
  it("does not persist AbortError or stale-generation failures across viewport transitions", () => {
    expect(persistentV591AssetFailureReason(new DOMException("Aborted", "AbortError"), false)).toBeNull();
    expect(persistentV591AssetFailureReason(new Error("v590-ktx2-parse-disposed"), false)).toBeNull();
    expect(persistentV591AssetFailureReason(new Error("v591-ktx2-loader-disposed"), false)).toBeNull();
    expect(persistentV591AssetFailureReason(new Error("transcoder-corrupt-payload"), false)).toBe("transcoder-corrupt-payload");
    expect(persistentV591AssetFailureReason(new Error("transcoder-corrupt-payload"), true)).toBeNull();
  });

  it("parses four sealed NASA channels with a deterministic physical-height contract", () => {
    const overlay = parseMoonAssetOverlayV591(readJson("public/data/celestial-convergence-v591/moon-asset-overlay.json"));
    expect(overlay.receiptSha256).toBe(CELESTIAL_CONVERGENCE_MOON_ASSET_OVERLAY_SHA256_V591);
    expect(overlay.assets.map((asset) => asset.id)).toEqual([
      "moon-albedo",
      "moon-normal",
      "moon-roughness",
      "moon-height",
    ]);
    expect(overlay.noNetworkRequestsPerformed).toBe(true);
    expect(overlay.derivationDeterministic).toBe(true);
    expect(overlay.authorityState).toEqual({
      presentationOnly: true,
      scientificAuthorityChanged: false,
      scientificPayloadWriteback: false,
      measuredAuthorityGranted: false,
    });
    expect(overlay.assets.every((asset) => asset.source.host === "svs.gsfc.nasa.gov")).toBe(true);
    expect(overlay.assets.every((asset) => asset.source.license.id === "NASA-public-domain")).toBe(true);
    expect(overlay.assets.every((asset) => asset.derivation.seamMeanAbsoluteDelta === 0)).toBe(true);
    for (const asset of overlay.assets.filter((entry) => entry.id !== "moon-albedo")) {
      expect(asset.derivation.sourceRangeRaw).toEqual({ minimum: 2037, maximum: 41371, mean: 18961.595629099153 });
      expect(asset.derivation.heightMetersPerRawUnit).toBe(0.5);
      expect(asset.derivation.lunarRadiusMeters).toBe(1_737_400);
      expect(asset.derivation.normalReliefGain).toBe(1.35);
      expect(asset.derivation.vertexReliefGain).toBe(1);
    }
  });

  it("verifies all 24 KTX2/WebP variants by exact bytes and SHA", () => {
    const overlay = parseMoonAssetOverlayV591(readJson("public/data/celestial-convergence-v591/moon-asset-overlay.json"));
    let verified = 0;
    for (const asset of overlay.assets) {
      for (const file of Object.values(asset.variants)) {
        const bytes = readFileSync(resolve(root, `public/${file.url.replace(/^\/+/, "")}`));
        expect(bytes.byteLength, file.url).toBe(file.bytes);
        expect(sha256(bytes), file.url).toBe(file.sha256);
        verified += 1;
      }
    }
    expect(verified).toBe(24);
  });

  it("keeps Moon acquisition single-request, no-retry, and source cache outside public", () => {
    const receipt = readJson("docs/release/v591/acquisition-receipt-moon.json");
    expect(receipt.status).toBe("acquired-single-request-no-retry");
    expect(receipt.requestedUrlCount).toBe(2);
    expect(receipt.automaticRetryPerformed).toBe(false);
    expect(receipt.automaticReplacementPerformed).toBe(false);
    expect(receipt.assets).toHaveLength(2);
    for (const asset of receipt.assets) {
      expect(asset.outputPath.startsWith("source-cache/celestial-convergence-v591/moon/")).toBe(true);
      expect(asset.outputPath.startsWith("public/")).toBe(false);
      const bytes = readFileSync(resolve(root, asset.outputPath));
      expect(bytes.byteLength).toBe(asset.bytes);
      expect(sha256(bytes)).toBe(asset.sha256);
    }
  });

  it("rejects provenance, authority, and height-range mutation", () => {
    const overlay = readJson("public/data/celestial-convergence-v591/moon-asset-overlay.json");
    expect(() => parseMoonAssetOverlayV591({
      ...overlay,
      authorityState: { ...overlay.authorityState, scientificPayloadWriteback: true },
    })).toThrow(/v591-moon-overlay/);
    expect(() => parseMoonAssetOverlayV591({
      ...overlay,
      assets: overlay.assets.map((asset: { id: string; source: object }) => asset.id === "moon-albedo"
        ? { ...asset, source: { ...asset.source, host: "example.com" } }
        : asset),
    })).toThrow(/v591-moon-overlay/);
    expect(() => parseMoonAssetOverlayV591({
      ...overlay,
      assets: overlay.assets.map((asset: { id: string; derivation: object }) => asset.id === "moon-height"
        ? { ...asset, derivation: { ...asset.derivation, sourceRangeRaw: { minimum: 0, maximum: 65535, mean: 0 } } }
        : asset),
    })).toThrow(/v591-moon-overlay/);
  });
});

describe("v591 Mars USGS Viking and MOLA visual asset admission", () => {
  it("parses four public-domain channels without inheriting the rejected v588 identity gap", () => {
    const overlay = parseMarsAssetOverlayV591(readJson("public/data/celestial-convergence-v591/mars-asset-overlay.json"));
    const albedo = overlay.assets.find((asset) => asset.id === "mars-albedo");
    expect(overlay.receiptSha256).toBe(CELESTIAL_CONVERGENCE_MARS_ASSET_OVERLAY_SHA256_V591);
    expect(overlay.status).toBe("mars-usgs-viking-color-mola-terrain-admitted");
    expect(overlay.assets.map((asset) => asset.id)).toEqual([
      "mars-albedo",
      "mars-normal",
      "mars-roughness",
      "mars-height",
    ]);
    expect(overlay.proceduralFallback).toBe(false);
    expect(overlay.blockers).toEqual([]);
    expect(overlay.authorityState).toEqual({
      presentationOnly: true,
      scientificAuthorityChanged: false,
      scientificPayloadWriteback: false,
      measuredAuthorityGranted: false,
    });
    expect(albedo?.source.host).toBe("astrogeology.usgs.gov");
    expect(albedo?.source.license.id).toBe("NASA-USGS-public-domain");
    expect(albedo?.source.width).toBe(1024);
    expect(albedo?.source.height).toBe(512);
    expect(albedo?.observationDisclosure).toContain("not native 8K observation detail");
    expect(JSON.stringify(overlay)).not.toContain("candidate-v588/ktx2/mars-albedo.ktx2");
    for (const asset of overlay.assets.filter((entry) => entry.id !== "mars-albedo")) {
      expect(asset.source.host).toBe("pds-geosciences.wustl.edu");
      expect(asset.source.license.id).toBe("NASA-PDS-public-domain");
      expect(asset.derivation.sourceRangeMeters).toEqual({ minimum: -8177, maximum: 21171, mean: -721.1070361930941 });
      expect(asset.derivation.marsRadiusMeters).toBe(3_396_000);
      expect(asset.derivation.normalReliefGain).toBe(1.6);
    }
  });

  it("preserves the prior negative evidence and explicitly rejects the ambiguous historical composite", () => {
    const overlay = parseMarsAssetOverlayV591(readJson("public/data/celestial-convergence-v591/mars-asset-overlay.json"));
    const rejection = readJson("docs/release/v591/mars-albedo-composite-rejection.json");
    const resample = readJson("docs/release/v591/mars-albedo-usgs-resample-audit.json");
    expect(rejection.status).toBe("rejected-upstream-license-and-product-identity-gap");
    expect(rejection.rejectedInput.historicalV49IdentityInherited).toBe(false);
    expect(rejection.runtimeAdmission).toBe(false);
    expect(overlay.compositeRejectionReceiptSha256).toBe(rejection.receiptSha256);
    expect(resample.status).toBe("passed-public-domain-source-bounded-resample");
    expect(resample.derivation.parameters.sourceDetailCeiling).toBe("1024x512");
    expect(resample.derivation.parameters.highFrequencySourceAdded).toBe(false);
    expect(resample.claims.nativeEightKObservation).toBe(false);
    expect(resample.claims.runtimeTopographicDetailFromMolaOnly).toBe(true);
    expect(resample.roundTrip.luminanceCorrelation).toBeGreaterThanOrEqual(resample.roundTrip.minimum);
    expect(overlay.albedoResampleAuditReceiptSha256).toBe(resample.receiptSha256);
    expect(overlay.preservedNegativeEvidence).toMatchObject({
      directIdentityAuditReceiptSha256: "f7acac6bd69edb339b003a9b8facd1b4d1b81c496b56f15f69b63111684288d8",
      fullAlbedoBlockedReceiptSha256: "e9c7c217b14c36ed93d0879f9049c1ed18b4af2a5148336b595b870a92b2ca74",
      nasa3dTiffBlockedReceiptSha256: "486e5b95ae253b453008b8ba273d03c470d8167feda6288054448d9c77e48e98",
      nasa3dJpegBlockedReceiptSha256: "9c92e6de88f723924a0b1d80a1cd965598bd303fd306d6a4b81a5af9e476af5e",
    });
  });

  it("verifies all 24 Mars delivery variants by exact bytes and SHA", () => {
    const overlay = parseMarsAssetOverlayV591(readJson("public/data/celestial-convergence-v591/mars-asset-overlay.json"));
    let verified = 0;
    for (const asset of overlay.assets) {
      for (const file of Object.values(asset.variants)) {
        const bytes = readFileSync(resolve(root, `public/${file.url.replace(/^\/+/, "")}`));
        expect(bytes.byteLength, file.url).toBe(file.bytes);
        expect(sha256(bytes), file.url).toBe(file.sha256);
        verified += 1;
      }
    }
    expect(verified).toBe(24);
  });

  it("rejects source detail, authority, and fallback mutations", () => {
    const overlay = readJson("public/data/celestial-convergence-v591/mars-asset-overlay.json");
    expect(() => parseMarsAssetOverlayV591({ ...overlay, proceduralFallback: true })).toThrow(/v591-mars-overlay/);
    expect(() => parseMarsAssetOverlayV591({
      ...overlay,
      authorityState: { ...overlay.authorityState, scientificPayloadWriteback: true },
    })).toThrow(/v591-mars-overlay/);
    expect(() => parseMarsAssetOverlayV591({
      ...overlay,
      assets: overlay.assets.map((asset: { id: string; derivation: { parameters: object } }) => asset.id === "mars-albedo"
        ? { ...asset, derivation: { ...asset.derivation, parameters: { ...asset.derivation.parameters, highFrequencySourceAdded: true } } }
        : asset),
    })).toThrow(/v591-mars-overlay/);
  });
});

describe("v591 Jupiter Cassini visual asset admission", () => {
  it("parses the sealed Cassini albedo, band, and Great Red Spot channels", () => {
    const overlay = parseJupiterAssetOverlayV591(readJson("public/data/celestial-convergence-v591/jupiter-asset-overlay.json"));
    expect(overlay.receiptSha256).toBe(CELESTIAL_CONVERGENCE_JUPITER_ASSET_OVERLAY_SHA256_V591);
    expect(overlay.assets.map((asset) => asset.id)).toEqual([
      "jupiter-albedo",
      "jupiter-band-mask",
      "jupiter-storm-mask",
    ]);
    expect(overlay.noNetworkRequestsPerformed).toBe(true);
    expect(overlay.derivationDeterministic).toBe(true);
    expect(overlay.proceduralFallback).toBe(false);
    expect(overlay.authorityState).toEqual({
      presentationOnly: true,
      scientificAuthorityChanged: false,
      scientificPayloadWriteback: false,
      measuredAuthorityGranted: false,
    });
    expect(overlay.assets.every((asset) => asset.source.host === "assets.science.nasa.gov")).toBe(true);
    expect(overlay.assets.every((asset) => asset.source.license.id === "NASA-JPL-public-domain")).toBe(true);
    expect(overlay.assets.every((asset) => asset.source.sha256 === "f92ffc7a2fa0235c47ec8f1f168dd36bffeb6acc318292b237878a00a48cf7d9")).toBe(true);
  });

  it("verifies all 18 Jupiter delivery variants by exact bytes and SHA", () => {
    const overlay = parseJupiterAssetOverlayV591(readJson("public/data/celestial-convergence-v591/jupiter-asset-overlay.json"));
    let verified = 0;
    for (const asset of overlay.assets) {
      for (const file of Object.values(asset.variants)) {
        const bytes = readFileSync(resolve(root, `public/${file.url.replace(/^\/+/, "")}`));
        expect(bytes.byteLength, file.url).toBe(file.bytes);
        expect(sha256(bytes), file.url).toBe(file.sha256);
        verified += 1;
      }
    }
    expect(verified).toBe(18);
  });

  it("keeps the Cassini acquisition single-request, no-retry, and outside public", () => {
    const receipt = readJson("docs/release/v591/acquisition-receipt-jupiter.json");
    expect(receipt.status).toBe("acquired-single-request-no-retry");
    expect(receipt.policy.requestPerUrlMaximum).toBe(1);
    expect(receipt.automaticRetryPerformed).toBe(false);
    expect(receipt.automaticReplacementPerformed).toBe(false);
    expect(receipt.asset.outputPath.startsWith("source-cache/celestial-convergence-v591/jupiter/")).toBe(true);
    expect(receipt.asset.outputPath.startsWith("public/")).toBe(false);
    const bytes = readFileSync(resolve(root, receipt.asset.outputPath));
    expect(bytes.byteLength).toBe(receipt.asset.bytes);
    expect(sha256(bytes)).toBe(receipt.asset.sha256);
  });

  it("rejects host, authority, and source-mask contract mutations", () => {
    const overlay = readJson("public/data/celestial-convergence-v591/jupiter-asset-overlay.json");
    expect(() => parseJupiterAssetOverlayV591({
      ...overlay,
      proceduralFallback: true,
    })).toThrow(/v591-jupiter-overlay/);
    expect(() => parseJupiterAssetOverlayV591({
      ...overlay,
      assets: overlay.assets.map((asset: { id: string; source: object }) => asset.id === "jupiter-albedo"
        ? { ...asset, source: { ...asset.source, host: "example.com" } }
        : asset),
    })).toThrow(/v591-jupiter-overlay/);
    expect(() => parseJupiterAssetOverlayV591({
      ...overlay,
      assets: overlay.assets.map((asset: { id: string; derivation: object }) => asset.id === "jupiter-storm-mask"
        ? { ...asset, derivation: { ...asset.derivation, stormMaskMaximum: 254 } }
        : asset),
    })).toThrow(/v591-jupiter-overlay/);
  });
});

describe("v591 Saturn Cassini atmosphere and radial-ring admission", () => {
  it("parses five sealed Cassini channels with physical radial-ring registration", () => {
    const overlay = parseSaturnAssetOverlayV591(readJson("public/data/celestial-convergence-v591/saturn-asset-overlay.json"));
    expect(overlay.receiptSha256).toBe(CELESTIAL_CONVERGENCE_SATURN_ASSET_OVERLAY_SHA256_V591);
    expect(overlay.assets.map((asset) => asset.id)).toEqual([
      "saturn-atmosphere-albedo",
      "saturn-band-mask",
      "saturn-polar-detail",
      "saturn-ring-color",
      "saturn-ring-optical-depth",
    ]);
    expect(overlay.proceduralFallback).toBe(false);
    expect(overlay.mirroredObservedSectorDisclosure).toBe(true);
    expect(overlay.authorityState).toEqual({
      presentationOnly: true,
      scientificAuthorityChanged: false,
      scientificPayloadWriteback: false,
      measuredAuthorityGranted: false,
    });
    expect(overlay.ringGeometry.radialUv).toBe(true);
    expect(overlay.ringGeometry.premultipliedAlpha).toBe(true);
    expect(overlay.ringGeometry.depthWrite).toBe(false);
    expect(overlay.ringGeometry.depthTest).toBe(true);
    expect(overlay.ringGeometry.cassiniNormalizedRange).toEqual([0.6912165848336062, 0.7538188761593017]);
    expect(overlay.ringGeometry.enckeNormalizedCenter).toBe(0.9095608292416804);
    expect(overlay.assets.every((asset) => asset.source.host === "images-assets.nasa.gov")).toBe(true);
    expect(overlay.assets.every((asset) => asset.source.license.id === "NASA-JPL-public-domain")).toBe(true);
  });

  it("verifies all 30 Saturn KTX2/WebP variants by exact bytes and SHA", () => {
    const overlay = parseSaturnAssetOverlayV591(readJson("public/data/celestial-convergence-v591/saturn-asset-overlay.json"));
    let verified = 0;
    for (const asset of overlay.assets) {
      for (const file of Object.values(asset.variants)) {
        const bytes = readFileSync(resolve(root, `public/${file.url.replace(/^\/+/, "")}`));
        expect(bytes.byteLength, file.url).toBe(file.bytes);
        expect(sha256(bytes), file.url).toBe(file.sha256);
        verified += 1;
      }
    }
    expect(verified).toBe(30);
  });

  it("keeps all three NASA URLs single-request, no-retry, and outside public", () => {
    const acquisition = readJson("docs/release/v591/acquisition-receipt-saturn.json");
    const supplement = readJson("docs/release/v591/acquisition-receipt-saturn-atmosphere-supplement.json");
    expect(acquisition.status).toBe("acquired-two-urls-single-request-each-no-retry");
    expect(acquisition.policy.requestPerUrlMaximum).toBe(1);
    expect(acquisition.automaticRetryPerformed).toBe(false);
    expect(acquisition.automaticReplacementPerformed).toBe(false);
    expect(supplement.status).toBe("acquired-explicit-supplement-single-request-no-retry");
    expect(supplement.policy.explicitSupplement).toBe(true);
    expect(supplement.automaticRetryPerformed).toBe(false);
    expect(supplement.automaticReplacementPerformed).toBe(false);
    for (const asset of [...acquisition.assets, supplement.asset]) {
      expect(asset.outputPath.startsWith("source-cache/celestial-convergence-v591/saturn/")).toBe(true);
      expect(asset.outputPath.startsWith("public/")).toBe(false);
      const bytes = readFileSync(resolve(root, asset.outputPath));
      expect(bytes.byteLength).toBe(asset.bytes);
      expect(sha256(bytes)).toBe(asset.sha256);
    }
  });

  it("rejects source, authority, and ring-ordering mutations", () => {
    const overlay = readJson("public/data/celestial-convergence-v591/saturn-asset-overlay.json");
    expect(() => parseSaturnAssetOverlayV591({ ...overlay, proceduralFallback: true })).toThrow(/v591-saturn-overlay/);
    expect(() => parseSaturnAssetOverlayV591({
      ...overlay,
      ringGeometry: { ...overlay.ringGeometry, depthWrite: true },
    })).toThrow(/v591-saturn-overlay/);
    expect(() => parseSaturnAssetOverlayV591({
      ...overlay,
      assets: overlay.assets.map((asset: { id: string; source: object }) => asset.id === "saturn-ring-color"
        ? { ...asset, source: { ...asset.source, host: "example.com" } }
        : asset),
    })).toThrow(/v591-saturn-overlay/);
  });
});

describe("v591 Bennu NASA shape and CC0 micro-regolith admission", () => {
  it("binds the frozen NASA shape model to three deterministic 4K CC0 microtexture channels", () => {
    const overlay = parseBennuAssetOverlayV591(readJson("public/data/celestial-convergence-v591/bennu-asset-overlay.json"));
    expect(overlay.receiptSha256).toBe(CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591);
    expect(overlay.assets.map((asset) => asset.id)).toEqual([
      "bennu-regolith-albedo",
      "bennu-regolith-normal",
      "bennu-regolith-roughness",
    ]);
    expect(overlay.inheritedModel.candidate).toBe("v589-readonly");
    expect(overlay.inheritedModel.assetId).toBe("bennu-model");
    expect(overlay.inheritedModel.lods.map((lod) => lod.lod)).toEqual([0, 1, 2]);
    expect(overlay.inheritedModel.lods.every((lod) => lod.normals && lod.meshopt && lod.pivot === "bounds-midpoint")).toBe(true);
    expect(overlay.noModelBytesCopied).toBe(true);
    expect(overlay.proceduralFallback).toBe(false);
    expect(overlay.materialPolicy).toEqual({
      substrate: "bounded-low-albedo-carbonaceous-reference",
      microtexture: "poly-haven-cc0-presentation-only-not-bennu-observation",
      reflectance: "oren-nayar-plus-bounded-opposition-no-glossy-specular",
    });
    expect(overlay.authorityState).toEqual({
      presentationOnly: true,
      scientificAuthorityChanged: false,
      scientificPayloadWriteback: false,
      measuredAuthorityGranted: false,
    });
  });

  it("verifies all 18 Bennu KTX2/WebP variants and all three model LODs by exact bytes and SHA", () => {
    const overlay = parseBennuAssetOverlayV591(readJson("public/data/celestial-convergence-v591/bennu-asset-overlay.json"));
    let variants = 0;
    for (const asset of overlay.assets) {
      for (const file of Object.values(asset.variants)) {
        const bytes = readFileSync(resolve(root, `public/${file.url.replace(/^\/+/, "")}`));
        expect(bytes.byteLength, file.url).toBe(file.bytes);
        expect(sha256(bytes), file.url).toBe(file.sha256);
        variants += 1;
      }
    }
    expect(variants).toBe(18);
    for (const lod of overlay.inheritedModel.lods) {
      const bytes = readFileSync(resolve(root, lod.path));
      expect(bytes.byteLength, lod.path).toBe(lod.bytes);
      expect(sha256(bytes), lod.path).toBe(lod.sha256);
    }
  });

  it("records exactly one request per explicit Poly Haven URL and keeps sources outside public", () => {
    const receipt = readJson("docs/release/v591/acquisition-receipt-bennu.json");
    expect(receipt.status).toBe("acquired-single-request-no-retry");
    expect(receipt.requestedUrlCount).toBe(3);
    expect(receipt.automaticRetryPerformed).toBe(false);
    expect(receipt.automaticReplacementPerformed).toBe(false);
    expect(receipt.assets).toHaveLength(3);
    for (const asset of receipt.assets) {
      expect(asset.redirectChain).toEqual([]);
      expect(asset.outputPath.startsWith("source-cache/celestial-convergence-v591/bennu/")).toBe(true);
      expect(asset.outputPath.startsWith("public/")).toBe(false);
      expect(asset.license.id).toBe("Poly-Haven-CC0");
      const bytes = readFileSync(resolve(root, asset.outputPath));
      expect(bytes.byteLength).toBe(asset.bytes);
      expect(sha256(bytes)).toBe(asset.sha256);
    }
  });

  it("rejects a source-host, model-identity, authority, or microtexture-policy mutation", () => {
    const overlay = readJson("public/data/celestial-convergence-v591/bennu-asset-overlay.json");
    expect(() => parseBennuAssetOverlayV591({ ...overlay, proceduralFallback: true })).toThrow(/v591-bennu-overlay/);
    expect(() => parseBennuAssetOverlayV591({
      ...overlay,
      inheritedModel: { ...overlay.inheritedModel, sourceSha256: "0".repeat(64) },
    })).toThrow(/v591-bennu-overlay/);
    expect(() => parseBennuAssetOverlayV591({
      ...overlay,
      assets: overlay.assets.map((asset: { id: string; source: object }) => asset.id === "bennu-regolith-albedo"
        ? { ...asset, source: { ...asset.source, host: "example.com" } }
        : asset),
    })).toThrow(/v591-bennu-overlay/);
  });
});
