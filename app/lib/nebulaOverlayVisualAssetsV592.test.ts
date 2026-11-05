import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  NEBULA_ALL_VISUAL_IDS_V592,
  isNebulaVisualFocusTargetV592,
} from "./nebulaVisualAssetsV592";
import {
  NEBULA_CLOSURE_VISUAL_IDS_V592,
  NEBULA_CLOSURE_VISUAL_MANIFEST_SHA256_V592,
  NEBULA_EXTENDED_VISUAL_IDS_V592,
  NEBULA_EXTENDED_VISUAL_MANIFEST_SHA256_V592,
  NEBULA_OVERLAY_VISUAL_IDS_V592,
  isNebulaOverlayVisualIdV592,
  parseNebulaOverlayVisualManifestV592,
  selectNebulaOverlayVisualSlicesV592,
} from "./nebulaOverlayVisualAssetsV592";

type FileRecordV592 = {
  url: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  format: "ktx2" | "webp";
  compression: string;
  depthIndex: number;
};
type SliceV592 = { depthIndex: number; ktx2?: FileRecordV592; fallback?: FileRecordV592; desktopFallback?: FileRecordV592; mobileFallback?: FileRecordV592 };
type ManifestV592 = {
  version: string;
  status: string;
  manifestSha256: string;
  policy: { sourceCount: number; runtimeAssetAdmittedCount: number; proceduralFallbackAllowed: boolean; scienceImagePayloadAllowed: boolean; presentationOnly: boolean; fixedJ2000Direction: boolean; noInpainting: boolean; noSyntheticCoverageFill: boolean; mobileSharesDesktopCore: boolean };
  admission: { metadataCandidateCount: number; runtimeAssetAdmittedCount: number; visualSignoffGranted: boolean; admittedTargets: string[]; blockedTargets: string[] };
  assets: Array<{
    target: string;
    coordinates: { coordinateFrame: string; raDeg: number; decDeg: number; angularSizeDeg: number };
    observationEncoding: { nakedEyeRepresentationClaimed: boolean; colorPolicy: string };
    derivation: { parameters: { depth0Encoding: string; depth1To3Encoding: string; inpainting: boolean; syntheticCoverageFill: boolean; scientificDataClaim: boolean } };
    tiers: { desktop: { depthSliceCount: number; slices: SliceV592[] }; mobile: { depthSliceCount: number; slices: SliceV592[] }; lite: { depthSliceCount: number; slices: SliceV592[] } };
    presentationOnly: boolean;
    scientificAuthority: boolean;
    scientificPayloadWriteback: boolean;
  }>;
};
type ReceiptV592 = { manifestSha256: string; admittedTargets: string[]; uniqueFullFileCount: number; uniqueLiteFileCount: number; fullRuntimeBytes: number; liteIncrementBytes: number; visualSignoffGranted: boolean; scientificPayloadWriteback: boolean; receiptSha256: string };

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]));
}
const sha256 = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
const canonicalSha = (value: unknown) => sha256(JSON.stringify(canonicalize(value)));
const readJson = <T,>(path: string): T => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;
const publicPath = (url: string) => resolve(process.cwd(), "public", url.replace(/^\//, ""));

describe("v592 additive nebula overlay assets", () => {
  const lanes = [
    {
      namespace: "extended" as const,
      manifest: readJson<ManifestV592>("public/data/living-universe-v592/nebula-extended-visual-assets.json"),
      receipt: readJson<ReceiptV592>("docs/release/v592/nebula-extended-visual-assets-receipt-v592.json"),
      ids: NEBULA_EXTENDED_VISUAL_IDS_V592,
      sha: NEBULA_EXTENDED_VISUAL_MANIFEST_SHA256_V592,
    },
    {
      namespace: "closure" as const,
      manifest: readJson<ManifestV592>("public/data/living-universe-v592/nebula-closure-visual-assets.json"),
      receipt: readJson<ReceiptV592>("docs/release/v592/nebula-closure-visual-assets-receipt-v592.json"),
      ids: NEBULA_CLOSURE_VISUAL_IDS_V592,
      sha: NEBULA_CLOSURE_VISUAL_MANIFEST_SHA256_V592,
    },
  ];

  it("seals 12 additive NASA presentation sources without mutating the inherited six", () => {
    expect(NEBULA_OVERLAY_VISUAL_IDS_V592).toHaveLength(12);
    expect(NEBULA_ALL_VISUAL_IDS_V592).toHaveLength(18);
    expect(new Set(NEBULA_ALL_VISUAL_IDS_V592).size).toBe(18);
    for (const lane of lanes) {
      const unsigned = { ...lane.manifest };
      delete (unsigned as Partial<ManifestV592>).manifestSha256;
      expect(lane.manifest.manifestSha256).toBe(canonicalSha(unsigned));
      expect(lane.manifest.manifestSha256).toBe(lane.sha);
      expect(lane.manifest.admission.admittedTargets).toEqual(lane.ids);
      expect(lane.manifest.admission).toMatchObject({ runtimeAssetAdmittedCount: lane.ids.length, visualSignoffGranted: false, blockedTargets: [] });
      expect(lane.manifest.policy).toMatchObject({ proceduralFallbackAllowed: false, scienceImagePayloadAllowed: false, presentationOnly: true, fixedJ2000Direction: true, noInpainting: true, noSyntheticCoverageFill: true, mobileSharesDesktopCore: true });
      expect(lane.receipt.manifestSha256).toBe(lane.manifest.manifestSha256);
      expect(lane.receipt.admittedTargets).toEqual(lane.ids);
      expect(lane.receipt.visualSignoffGranted).toBe(false);
      expect(lane.receipt.scientificPayloadWriteback).toBe(false);
      expect(parseNebulaOverlayVisualManifestV592(lane.manifest, lane.namespace).assets).toHaveLength(lane.ids.length);
    }
  });

  it("verifies every unique KTX2/WebP byte and keeps the additive overlay inside its preregistered headroom", async () => {
    let aggregateFullBytes = 0;
    let aggregateLiteBytes = 0;
    for (const lane of lanes) {
      const fullFiles = new Map<string, FileRecordV592>();
      const liteFiles = new Map<string, FileRecordV592>();
      for (const asset of lane.manifest.assets) {
        expect(asset.coordinates.coordinateFrame).toContain("J2000");
        expect(asset.coordinates.raDeg).toBeGreaterThanOrEqual(0);
        expect(asset.coordinates.raDeg).toBeLessThan(360);
        expect(asset.coordinates.decDeg).toBeGreaterThanOrEqual(-90);
        expect(asset.coordinates.decDeg).toBeLessThanOrEqual(90);
        expect(asset.observationEncoding).toMatchObject({ nakedEyeRepresentationClaimed: false, colorPolicy: "mapped-observation-color-not-naked-eye" });
        expect(asset.derivation.parameters).toMatchObject({ depth0Encoding: "uastc-q1-rdo2-zstd10", depth1To3Encoding: "etc1s-clevel5-q128", inpainting: false, syntheticCoverageFill: false, scientificDataClaim: false });
        expect(asset).toMatchObject({ presentationOnly: true, scientificAuthority: false, scientificPayloadWriteback: false });
        expect(asset.tiers.desktop.depthSliceCount).toBe(4);
        expect(asset.tiers.mobile.depthSliceCount).toBe(2);
        expect(asset.tiers.lite.depthSliceCount).toBe(1);
        expect(asset.tiers.mobile.slices.map((slice) => slice.ktx2?.url)).toEqual(asset.tiers.desktop.slices.slice(0, 2).map((slice) => slice.ktx2?.url));
        for (const tierName of ["desktop", "mobile"] as const) for (const slice of asset.tiers[tierName].slices) {
          fullFiles.set(slice.ktx2!.url, slice.ktx2!);
          fullFiles.set(slice.fallback!.url, slice.fallback!);
        }
        for (const slice of asset.tiers.lite.slices) {
          liteFiles.set(slice.desktopFallback!.url, slice.desktopFallback!);
          liteFiles.set(slice.mobileFallback!.url, slice.mobileFallback!);
        }
      }
      for (const file of [...fullFiles.values(), ...liteFiles.values()]) {
        const bytes = readFileSync(publicPath(file.url));
        expect(bytes.byteLength, file.url).toBe(file.bytes);
        expect(sha256(bytes), file.url).toBe(file.sha256);
        if (file.format === "ktx2") {
          expect(bytes.subarray(0, 12).toString("hex"), file.url).toBe("ab4b5458203230bb0d0a1a0a");
          expect({ width: bytes.readUInt32LE(20), height: bytes.readUInt32LE(24) }, file.url).toEqual({ width: file.width, height: file.height });
          expect(file.width % 4).toBe(0);
          expect(file.height % 4).toBe(0);
        } else {
          const metadata = await sharp(publicPath(file.url)).metadata();
          expect({ width: metadata.width, height: metadata.height }, file.url).toEqual({ width: file.width, height: file.height });
        }
      }
      const fullBytes = [...fullFiles.values()].reduce((sum, file) => sum + file.bytes, 0);
      const liteBytes = [...liteFiles.values()].reduce((sum, file) => sum + file.bytes, 0);
      expect(fullFiles.size).toBe(lane.receipt.uniqueFullFileCount);
      expect(liteFiles.size).toBe(lane.receipt.uniqueLiteFileCount);
      expect(fullBytes).toBe(lane.receipt.fullRuntimeBytes);
      expect(liteBytes).toBe(lane.receipt.liteIncrementBytes);
      aggregateFullBytes += fullBytes;
      aggregateLiteBytes += liteBytes;
    }
    expect(aggregateFullBytes).toBeLessThanOrEqual(20 * 1024 * 1024);
    expect(aggregateLiteBytes).toBeLessThanOrEqual(64 * 1024);
  });

  it("selects deterministic 4/2/1 slices and exposes all new focus targets", () => {
    for (const lane of lanes) for (const asset of parseNebulaOverlayVisualManifestV592(lane.manifest, lane.namespace).assets) {
      expect(selectNebulaOverlayVisualSlicesV592(asset, "standalone-full", "desktop")).toHaveLength(4);
      expect(selectNebulaOverlayVisualSlicesV592(asset, "standalone-full", "mobile")).toHaveLength(2);
      expect(selectNebulaOverlayVisualSlicesV592(asset, "vercel-lite", "desktop")).toHaveLength(1);
      expect(isNebulaOverlayVisualIdV592(asset.target)).toBe(true);
      expect(isNebulaVisualFocusTargetV592(asset.target)).toBe(true);
    }
  });

  it("rejects a policy mutation", () => {
    const mutated = structuredClone(lanes[0].manifest);
    mutated.policy.scienceImagePayloadAllowed = true;
    expect(() => parseNebulaOverlayVisualManifestV592(mutated, "extended")).toThrow(/v592-nebula-overlay-manifest/);
  });
});
