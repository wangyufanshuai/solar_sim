import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  NEBULA_VISUAL_ASSET_COUNT_V592,
  NEBULA_VISUAL_ASSETS_V592,
  NEBULA_VISUAL_MANIFEST_SHA256_V592,
} from "../data/nebulaVisualAssetsV592.generated";
import {
  parseNebulaVisualManifestV592,
  selectNebulaVisualImpostorsV592,
  selectNebulaVisualSlicesV592,
} from "./nebulaVisualAssetsV592";

type SliceV592 = {
  depthIndex: number;
  ktx2?: VariantV592;
  fallback?: VariantV592;
  desktopFallback?: VariantV592;
  mobileFallback?: VariantV592;
};
type VariantV592 = {
  url: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  format: "ktx2" | "webp";
  depthIndex: number;
};
type NebulaManifestV592 = {
  version: string;
  status: string;
  manifestSha256: string;
  policy: { runtimeAssetAdmittedCount: number; proceduralFallbackAllowed: boolean; scienceImagePayloadAllowed: boolean; noInpainting: boolean; noSyntheticCoverageFill: boolean };
  sourceReceipts: { acquisitionReceiptSha256: string; licenseReviewReceiptSha256: string; visualAnalysisReceiptSha256: string };
  admission: { sourceReviewedCount: number; sourceCoverageBlockedCount: number; runtimeAssetAdmittedCount: number; heroAdmissionCount: number; admittedTargets: string[]; blockedTargets: string[] };
  assets: Array<{
    target: string;
    catalogName: string;
    coordinates: { raDeg: number; decDeg: number; angularSizeDeg: number; coordinateFrame: string };
    observationEncoding: { bands: string[]; colorPolicy: string; nakedEyeRepresentationClaimed: boolean };
    derivation: { parameters: { alphaPolicy: string; depthSlicePolicy: string; alphaProfiles: Record<string, { low: number[]; high: number[]; opacity: number[] }>; ktx2BlockAlignment: string; inpainting: boolean; syntheticCoverageFill: boolean; scientificDataClaim: boolean } };
    tiers: Record<string, { depthSliceCount: number; slices: SliceV592[] }>;
    presentationOnly: boolean;
    scientificAuthority: boolean;
    scientificPayloadWriteback: boolean;
  }>;
};
type NebulaReceiptV592 = { manifestSha256: string; fullRuntimeBytes: number; liteIncrementBytes: number; alphaProfiles: Record<string, { low: number[]; high: number[]; opacity: number[] }>; heroAdmissionGranted: boolean; scientificPayloadWriteback: boolean };
type NebulaAnalysisV592 = { receiptSha256: string; status: string; derivableTargets: string[]; blockedTargets: string[]; policy: { noInpainting: boolean; noSyntheticCoverageFill: boolean } };

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]));
}
const sha256 = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
const canonicalSha = (value: unknown) => sha256(JSON.stringify(canonicalize(value)));
const readJson = <T,>(path: string): T => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;
const publicPathForUrl = (url: string) => resolve(process.cwd(), "public", url.replace(/^\//, ""));
function ktx2Dimensions(bytes: Buffer) {
  expect(bytes.subarray(0, 12).toString("hex")).toBe("ab4b5458203230bb0d0a1a0a");
  return { width: bytes.readUInt32LE(20), height: bytes.readUInt32LE(24) };
}

describe("nebula visual assets v592", () => {
  const manifest = readJson<NebulaManifestV592>("public/data/living-universe-v592/nebula-visual-assets.json");
  const receipt = readJson<NebulaReceiptV592>("docs/release/v592/nebula-visual-assets-receipt-v592.json");
  const analysis = readJson<NebulaAnalysisV592>("docs/release/v592/nebula-source-visual-analysis-v592.json");

  it("seals six presentation-only nebula sources and keeps the blocked plate out", () => {
    const unsigned = { ...manifest };
    delete (unsigned as Partial<NebulaManifestV592>).manifestSha256;
    expect(manifest.manifestSha256).toBe(canonicalSha(unsigned));
    expect(manifest.manifestSha256).toBe(NEBULA_VISUAL_MANIFEST_SHA256_V592);
    expect(manifest.status).toBe("six-of-seven-source-reviewed-nebula-runtime-assets-admitted");
    expect(manifest.admission).toMatchObject({ sourceReviewedCount: 7, sourceCoverageBlockedCount: 1, runtimeAssetAdmittedCount: 6, heroAdmissionCount: 0 });
    expect(manifest.admission.admittedTargets).toEqual(["heart-nebula", "soul-nebula", "witch-head-nebula", "flame-nebula", "pacman-nebula", "running-chicken-nebula"]);
    expect(manifest.admission.blockedTargets).toContain("california-nebula");
    expect(manifest.assets.some((asset) => asset.target === "california-nebula")).toBe(false);
    expect(NEBULA_VISUAL_ASSET_COUNT_V592).toBe(6);
    expect(NEBULA_VISUAL_ASSETS_V592.map((asset) => asset.target)).toEqual(manifest.admission.admittedTargets);
    expect(receipt.manifestSha256).toBe(manifest.manifestSha256);
    expect(receipt.heroAdmissionGranted).toBe(false);
    expect(receipt.scientificPayloadWriteback).toBe(false);
  });

  it("verifies depth-slice files, KTX2/WebP dimensions and Lite budget", async () => {
    let fullBytes = 0;
    let liteBytes = 0;
    const verifiedUrls = new Set<string>();
    for (const asset of manifest.assets) {
      expect(asset.coordinates.raDeg).toBeGreaterThanOrEqual(0);
      expect(asset.coordinates.raDeg).toBeLessThan(360);
      expect(asset.coordinates.decDeg).toBeGreaterThanOrEqual(-90);
      expect(asset.coordinates.decDeg).toBeLessThanOrEqual(90);
      expect(asset.coordinates.coordinateFrame).toContain("J2000");
      expect(asset.observationEncoding.nakedEyeRepresentationClaimed).toBe(false);
      expect(asset.derivation.parameters).toMatchObject({ inpainting: false, syntheticCoverageFill: false, scientificDataClaim: false });
      expect(asset.presentationOnly).toBe(true);
      expect(asset.scientificAuthority).toBe(false);
      expect(asset.scientificPayloadWriteback).toBe(false);
      expect(asset.tiers.desktop.depthSliceCount).toBe(4);
      expect(asset.tiers.mobile.depthSliceCount).toBe(2);
      expect(asset.tiers.lite.depthSliceCount).toBe(1);
      for (const [tierName, tier] of Object.entries(asset.tiers)) {
        for (const slice of tier.slices) {
          for (const variant of Object.values(slice).filter((value): value is VariantV592 => typeof value === "object" && value !== null && "url" in value)) {
            if (verifiedUrls.has(variant.url)) continue;
            verifiedUrls.add(variant.url);
            const bytes = readFileSync(publicPathForUrl(variant.url));
            expect(bytes.byteLength, `${asset.target}:${tierName}:${slice.depthIndex}:bytes`).toBe(variant.bytes);
            expect(sha256(bytes), `${asset.target}:${tierName}:${slice.depthIndex}:sha`).toBe(variant.sha256);
            if (variant.format === "ktx2") {
              expect(ktx2Dimensions(bytes), `${asset.target}:${tierName}:${slice.depthIndex}:dimensions`).toEqual({ width: variant.width, height: variant.height });
              expect(variant.width % 4, `${asset.target}:${tierName}:${slice.depthIndex}:width-block-alignment`).toBe(0);
              expect(variant.height % 4, `${asset.target}:${tierName}:${slice.depthIndex}:height-block-alignment`).toBe(0);
            } else {
              const metadata = await sharp(publicPathForUrl(variant.url)).metadata();
              expect({ width: metadata.width, height: metadata.height }, `${asset.target}:${tierName}:${slice.depthIndex}:dimensions`).toEqual({ width: variant.width, height: variant.height });
            }
            if (tierName === "lite") liteBytes += variant.bytes;
            else fullBytes += variant.bytes;
          }
        }
      }
    }
    expect(fullBytes).toBe(receipt.fullRuntimeBytes);
    expect(liteBytes).toBe(receipt.liteIncrementBytes);
    expect(liteBytes).toBeLessThanOrEqual(9 * 1024 * 1024);
  });

  it("keeps desktop depth while restoring deterministic mobile and Lite visibility", async () => {
    const expectedProfiles = {
      desktop4: { low: [2, 12, 32, 72], high: [84, 150, 218, 255], opacity: [0.28, 0.38, 0.5, 0.64] },
      mobile2: { low: [2, 34], high: [132, 235], opacity: [0.48, 0.68] },
      lite1: { low: [4], high: [176], opacity: [0.82] },
    };
    expect(receipt.alphaProfiles).toEqual(expectedProfiles);
    for (const asset of manifest.assets) {
      expect(asset.derivation.parameters).toMatchObject({
        alphaPolicy: "luma-thresholded-presentation-mask-with-edge-feather-and-tier-normalized-visibility",
        depthSlicePolicy: "pre-registered-alpha-profiles-4-desktop-2-mobile-1-lite",
        alphaProfiles: expectedProfiles,
        ktx2BlockAlignment: "4x4-all-full-tiers",
      });
      const mobileFallback = asset.tiers.mobile.slices[0]?.fallback;
      const liteFallback = asset.tiers.lite.slices[0]?.mobileFallback;
      expect(mobileFallback).toBeDefined();
      expect(liteFallback).toBeDefined();
      const mobileStats = await sharp(publicPathForUrl(mobileFallback!.url)).stats();
      const liteStats = await sharp(publicPathForUrl(liteFallback!.url)).stats();
      expect(mobileStats.channels[3]?.max, `${asset.target}:mobile-alpha`).toBeGreaterThanOrEqual(100);
      expect(liteStats.channels[3]?.max, `${asset.target}:lite-alpha`).toBeGreaterThanOrEqual(170);
    }
  });

  it("keeps visual analysis and source-policy boundaries explicit", () => {
    expect(analysis.status).toBe("six-runtime-derivation-candidates-one-visual-coverage-blocked");
    expect(analysis.derivableTargets).toEqual(manifest.admission.admittedTargets);
    expect(analysis.blockedTargets).toEqual(["california-nebula"]);
    expect(analysis.policy).toMatchObject({ noInpainting: true, noSyntheticCoverageFill: true });
    expect(manifest.policy).toMatchObject({ runtimeAssetAdmittedCount: 6, proceduralFallbackAllowed: false, scienceImagePayloadAllowed: false, noInpainting: true, noSyntheticCoverageFill: true });
    const files = readdirSync(resolve(process.cwd(), "public/textures/candidate-v592/nebulae-v592"), { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile());
    expect(files).toHaveLength(78);
    expect(files.some((entry) => entry.name.toLowerCase().includes("california"))).toBe(false);
  });

  it("parses the sealed runtime contract and selects deterministic 4/2/1 presentation slices", () => {
    const parsed = parseNebulaVisualManifestV592(manifest);
    const heart = parsed.assets.find((asset) => asset.target === "heart-nebula");
    expect(heart).toBeDefined();
    expect(selectNebulaVisualSlicesV592(heart!, "standalone-full", "desktop")).toHaveLength(4);
    expect(selectNebulaVisualSlicesV592(heart!, "standalone-full", "mobile")).toHaveLength(2);
    expect(selectNebulaVisualSlicesV592(heart!, "vercel-lite", "desktop")).toHaveLength(1);
    expect(selectNebulaVisualSlicesV592(heart!, "standalone-full", "desktop").every((slice) => slice.primary?.format === "ktx2" && slice.fallback.format === "webp")).toBe(true);
    expect(selectNebulaVisualImpostorsV592("science", "heart-nebula")).toEqual([]);
    expect(selectNebulaVisualImpostorsV592("cinematic", "overview")).toEqual([]);
    expect(selectNebulaVisualImpostorsV592("cinematic", "heart-nebula")).toEqual(["heart-nebula"]);

    const mutated = structuredClone(manifest);
    mutated.policy.scienceImagePayloadAllowed = true;
    expect(() => parseNebulaVisualManifestV592(mutated)).toThrow(/v592-nebula-manifest/);
  });
});
