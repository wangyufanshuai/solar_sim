import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  DEEP_SPACE_VISUAL_ASSET_COUNT_V592,
  DEEP_SPACE_VISUAL_ASSETS_V592,
  DEEP_SPACE_VISUAL_MANIFEST_SHA256_V592,
} from "../data/deepSpaceVisualAssetsV592.generated";
import {
  parseDeepSpaceVisualManifestV592,
  selectDeepSpaceVisualFocusV592,
  selectDeepSpaceVisualSlicesV592,
} from "./deepSpaceVisualAssetsV592";

type VisualFileV592 = {
  url: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  format: "ktx2" | "webp";
  depthIndex: number;
};
type VisualSliceV592 = { depthIndex: number; ktx2?: VisualFileV592; fallback: VisualFileV592 };
type VisualManifestV592 = {
  manifestSha256: string;
  status: string;
  policy: Record<string, unknown>;
  admission: { admittedGalaxyAssetCount: number; admittedClusterAssetCount: number; totalAssetAdmittedCount: number; blockedCount: number; admittedGalaxies: string[]; admittedClusters: string[]; blockedObjects: string[] };
  assets: Array<{
    target: string;
    category: string;
    status: string;
    visualModelKind: string;
    source: { sha256: string; license: string; observationEncoding: { nakedEyeRepresentationClaimed: boolean } };
    crop?: { retainedSourcePixelFraction: number };
    catalogSelection?: { candidateRecordCount: number; sourceIdentityControlsBrightness: boolean; noSyntheticCoverageFill: boolean };
    reference: { coordinateFrame: string; raDeg: number; decDeg: number };
    derivation: { noInpainting: boolean; noSyntheticCoverageFill: boolean; noAnnotationRemoval: boolean };
    variants?: Record<"desktop" | "mobile" | "lite", { depthSliceCount: number; slices: VisualSliceV592[] }>;
    analyticModel?: { profileKind: string; shaderVersion: string; explicitPrimaryModel: boolean; observationImageClaim: boolean };
    mappedColorLabelRequired: boolean;
    observationImageClaim: boolean;
    catalogDerivedVisualModel: boolean;
    scienceImagePayload: boolean;
    presentationOnly: boolean;
    scientificPayloadWriteback: boolean;
  }>;
};
type AnalysisV592 = { receiptSha256: string; status: string; derivableTargets: string[]; blockedTargets: string[]; policy: Record<string, unknown>; analyses: Array<{ target: string; visualInspectionDecision: string }> };
type AlternativeAnalysisV592 = { receiptSha256: string; status: string; derivableTargets: string[]; heldSelectionIds: string[]; blockedSelectionIds: string[]; policy: Record<string, unknown>; analyses: Array<{ selectionId: string; target: string; visualInspectionDecision: string }> };
type ReceiptV592 = { manifestSha256: string; receiptSha256: string; assetCount: number; ktx2FileCount: number; webpFileCount: number; fullRuntimeBytes: number; liteIncrementBytes: number; admittedTargets: string[]; gaiaCatalogDerivedVisualModelCount: number; gaiaCatalogPayloadReusedFromExistingAdmission: boolean; deterministicSingleThreadKtx2: boolean; scienceImagePayload: boolean; scientificPayloadWriteback: boolean };

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(source).sort().map((key) => [key, canonicalize(source[key])]));
}
const sha256 = (value: Buffer | string) => createHash("sha256").update(value).digest("hex");
const canonicalSha = (value: unknown) => sha256(JSON.stringify(canonicalize(value)));
const readJson = <T,>(path: string): T => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;
const publicPath = (url: string) => resolve(process.cwd(), "public", url.replace(/^\//, ""));
function ktx2Dimensions(bytes: Buffer) {
  expect(bytes.subarray(0, 12).toString("hex")).toBe("ab4b5458203230bb0d0a1a0a");
  return { width: bytes.readUInt32LE(20), height: bytes.readUInt32LE(24) };
}

describe("deep-space visual assets v592", () => {
  const manifest = readJson<VisualManifestV592>("public/data/living-universe-v592/deep-space-visual-assets.json");
  const receipt = readJson<ReceiptV592>("docs/release/v592/deep-space-visual-assets-receipt-v592.json");
  const analysis = readJson<AnalysisV592>("docs/release/v592/deep-space-source-visual-analysis-v592.json");
  const alternativeAnalysis = readJson<AlternativeAnalysisV592>("docs/release/v592/deep-space-alternative-source-visual-analysis-v592.json");

  it("admits eight source images, ten Gaia cluster models and six OpenNGC analytic galaxy models", () => {
    const unsigned = { ...manifest };
    delete (unsigned as Partial<VisualManifestV592>).manifestSha256;
    expect(manifest.manifestSha256).toBe(canonicalSha(unsigned));
    expect(manifest.manifestSha256).toBe(DEEP_SPACE_VISUAL_MANIFEST_SHA256_V592);
    expect(manifest.status).toBe("24-of-24-deep-space-visual-models-admitted");
    expect(manifest.admission).toMatchObject({ admittedGalaxyAssetCount: 12, admittedClusterAssetCount: 12, totalAssetAdmittedCount: 24, blockedCount: 0 });
    expect(manifest.admission.admittedGalaxies).toEqual(["andromeda-galaxy", "triangulum-galaxy", "sombrero-galaxy", "whirlpool-galaxy", "bodes-galaxy", "southern-pinwheel-galaxy", "centaurus-a", "cigar-galaxy", "pinwheel-galaxy", "virgo-a-galaxy", "black-eye-galaxy", "sunflower-galaxy"]);
    expect(manifest.admission.admittedClusters).toEqual(["omega-centauri", "pleiades", "hyades", "47-tucanae", "hercules-globular-cluster", "messier-3", "messier-5", "messier-15", "messier-22", "beehive-cluster", "double-cluster", "jewel-box-cluster"]);
    expect(DEEP_SPACE_VISUAL_ASSET_COUNT_V592).toBe(24);
    expect(DEEP_SPACE_VISUAL_ASSETS_V592.map((asset) => asset.target)).toEqual(["andromeda-galaxy", "triangulum-galaxy", "omega-centauri", "sombrero-galaxy", "whirlpool-galaxy", "bodes-galaxy", "southern-pinwheel-galaxy", "pleiades", "hyades", "47-tucanae", "hercules-globular-cluster", "messier-3", "messier-5", "messier-15", "messier-22", "beehive-cluster", "double-cluster", "jewel-box-cluster", "centaurus-a", "cigar-galaxy", "pinwheel-galaxy", "virgo-a-galaxy", "black-eye-galaxy", "sunflower-galaxy"]);
    expect(receipt.manifestSha256).toBe(manifest.manifestSha256);
    expect(receipt.admittedTargets).toEqual(DEEP_SPACE_VISUAL_ASSETS_V592.map((asset) => asset.target));
    expect(receipt.gaiaCatalogDerivedVisualModelCount).toBe(10);
    expect(receipt.gaiaCatalogPayloadReusedFromExistingAdmission).toBe(true);
  });

  it("keeps infographic sources blocked and prohibits repair operations", () => {
    expect(analysis.status).toBe("three-runtime-derivation-candidates-two-infographic-sources-blocked");
    expect(analysis.derivableTargets).toEqual(["andromeda-galaxy", "triangulum-galaxy", "omega-centauri"]);
    expect(analysis.blockedTargets).toEqual(["cigar-galaxy", "virgo-a-galaxy"]);
    expect(analysis.policy).toMatchObject({ noInpainting: true, noSyntheticCoverageFill: true, noAnnotationRemoval: true, scienceNeverLoadsImagePayload: true });
    for (const id of analysis.blockedTargets) {
      expect(analysis.analyses.find((entry) => entry.target === id)?.visualInspectionDecision).toBe("blocked-infographic-overlay");
      expect(manifest.assets.find((asset) => asset.target === id)?.visualModelKind).toBe("openngc-catalog-derived-galaxy-analytic");
    }
    expect(manifest.policy).toMatchObject({ noInpainting: true, noSyntheticCoverageFill: true, noProceduralObservationFallback: true, missingAssetBehavior: "asset-blocked" });
    expect(alternativeAnalysis.status).toBe("five-runtime-derivation-candidates-three-clean-redundant-alternates-held-one-scientific-overlay-blocked");
    expect(alternativeAnalysis.derivableTargets).toEqual(["sombrero-galaxy", "whirlpool-galaxy", "bodes-galaxy", "southern-pinwheel-galaxy", "pleiades"]);
    expect(alternativeAnalysis.heldSelectionIds).toEqual(["southern-pinwheel-galaxy--PIA10374", "pleiades--PIA09262", "pleiades--PIA13121"]);
    expect(alternativeAnalysis.blockedSelectionIds).toEqual(["cigar-galaxy--PIA23010"]);
    expect(alternativeAnalysis.policy).toMatchObject({ oneRuntimeRepresentationPerTarget: true, noInpainting: true, noSyntheticCoverageFill: true, noAnnotationRemoval: true });
  });

  it("verifies every KTX2/WebP byte, dimension and bounded Lite increment", async () => {
    const urls = new Set<string>();
    let fullBytes = 0;
    let liteBytes = 0;
    let ktx2Count = 0;
    let webpCount = 0;
    for (const asset of manifest.assets) {
      expect(asset.reference.coordinateFrame).toBe("ICRS/J2000");
      expect(asset.reference.raDeg).toBeGreaterThanOrEqual(0);
      expect(asset.reference.raDeg).toBeLessThan(360);
      expect(asset.reference.decDeg).toBeGreaterThanOrEqual(-90);
      expect(asset.reference.decDeg).toBeLessThanOrEqual(90);
      if (asset.visualModelKind === "openngc-catalog-derived-galaxy-analytic") {
        expect(asset.status).toBe("openngc-catalog-derived-analytic-model-admitted");
        expect(asset.source.license).toBe("CC-BY-SA-4.0");
        expect(asset.catalogSelection).toMatchObject({ sourceIdentityControlsBrightness: false, noSyntheticCoverageFill: true });
        expect(asset.analyticModel).toMatchObject({ explicitPrimaryModel: true, observationImageClaim: false, shaderVersion: "v592-openngc-galaxy-analytic-v1" });
        expect(asset.observationImageClaim).toBe(false);
        expect(asset.variants).toBeUndefined();
        expect(asset.catalogDerivedVisualModel).toBe(true);
        expect(asset.derivation).toMatchObject({ sourceChain: "openngc-catalog-derived-chain" });
        continue;
      } else if (asset.catalogDerivedVisualModel) {
        expect(asset.visualModelKind).toBe("gaia-catalog-derived-star-field-impostor");
        expect(asset.status).toBe("gaia-catalog-derived-runtime-variants-admitted");
        expect(asset.crop).toBeUndefined();
        expect(asset.catalogSelection).toMatchObject({ sourceIdentityControlsBrightness: false, noSyntheticCoverageFill: true });
        expect(asset.catalogSelection?.candidateRecordCount).toBeGreaterThanOrEqual(128);
        expect(asset.observationImageClaim).toBe(false);
      } else {
        expect(asset.visualModelKind).toBe("source-observation-depth-impostor");
        expect(asset.crop?.retainedSourcePixelFraction).toBeGreaterThan(0);
        expect(asset.observationImageClaim).toBe(true);
      }
      expect(asset.derivation).toMatchObject({ noInpainting: true, noSyntheticCoverageFill: true, noAnnotationRemoval: true });
      expect(asset.source.observationEncoding.nakedEyeRepresentationClaimed).toBe(false);
      expect(asset.mappedColorLabelRequired).toBe(true);
      expect(asset.scienceImagePayload).toBe(false);
      expect(asset.presentationOnly).toBe(true);
      expect(asset.scientificPayloadWriteback).toBe(false);
      expect(asset.variants?.desktop.depthSliceCount).toBe(asset.target === "sombrero-galaxy" ? 2 : 3);
      expect(asset.variants?.mobile.depthSliceCount).toBe(asset.target === "sombrero-galaxy" ? 1 : 2);
      expect(asset.variants?.lite.depthSliceCount).toBe(1);
      for (const [tierName, tier] of Object.entries(asset.variants ?? {})) {
        for (const slice of tier.slices) {
          for (const file of [slice.ktx2, slice.fallback].filter((entry): entry is VisualFileV592 => Boolean(entry))) {
            expect(urls.has(file.url), file.url).toBe(false);
            urls.add(file.url);
            const bytes = readFileSync(publicPath(file.url));
            expect(bytes.byteLength, file.url).toBe(file.bytes);
            expect(sha256(bytes), file.url).toBe(file.sha256);
            if (file.format === "ktx2") {
              ktx2Count += 1;
              expect(ktx2Dimensions(bytes)).toEqual({ width: file.width, height: file.height });
              expect(file.width % 4).toBe(0);
              expect(file.height % 4).toBe(0);
            } else {
              webpCount += 1;
              const metadata = await sharp(publicPath(file.url)).metadata();
              expect({ width: metadata.width, height: metadata.height }).toEqual({ width: file.width, height: file.height });
            }
            if (tierName === "lite") liteBytes += file.bytes;
            else fullBytes += file.bytes;
          }
        }
      }
    }
    expect(ktx2Count).toBe(receipt.ktx2FileCount);
    expect(webpCount).toBe(receipt.webpFileCount);
    expect(fullBytes).toBe(receipt.fullRuntimeBytes);
    expect(liteBytes).toBe(receipt.liteIncrementBytes);
    expect(liteBytes).toBeLessThan(256 * 1024);
    expect(receipt.deterministicSingleThreadKtx2).toBe(true);
    expect(receipt.scienceImagePayload).toBe(false);
    expect(receipt.scientificPayloadWriteback).toBe(false);
    const files = readdirSync(resolve(process.cwd(), "public/textures/candidate-v592/deep-space-v592"), { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile());
    expect(files).toHaveLength(194);
  });

  it("parses the sealed contract and selects deterministic 3/2/1 focused slices", () => {
    const parsed = parseDeepSpaceVisualManifestV592(manifest);
    const andromeda = parsed.assets.find((asset) => asset.target === "andromeda-galaxy");
    expect(andromeda).toBeDefined();
    expect(selectDeepSpaceVisualSlicesV592(andromeda!, "standalone-full", "desktop")).toHaveLength(3);
    expect(selectDeepSpaceVisualSlicesV592(andromeda!, "standalone-full", "mobile")).toHaveLength(2);
    expect(selectDeepSpaceVisualSlicesV592(andromeda!, "vercel-lite", "desktop")).toHaveLength(1);
    expect(selectDeepSpaceVisualSlicesV592(andromeda!, "standalone-full", "desktop").every((slice) => slice.primary?.format === "ktx2" && slice.fallback.format === "webp")).toBe(true);
    expect(selectDeepSpaceVisualFocusV592("science", "andromeda-galaxy")).toEqual([]);
    expect(selectDeepSpaceVisualFocusV592("cinematic", "overview")).toEqual([]);
    expect(selectDeepSpaceVisualFocusV592("cinematic", "andromeda-galaxy")).toEqual(["andromeda-galaxy"]);
    const sombrero = parsed.assets.find((asset) => asset.target === "sombrero-galaxy");
    expect(selectDeepSpaceVisualSlicesV592(sombrero!, "standalone-full", "desktop")).toHaveLength(2);
    expect(selectDeepSpaceVisualSlicesV592(sombrero!, "standalone-full", "mobile")).toHaveLength(1);
    const analytic = parsed.assets.find((asset) => asset.target === "cigar-galaxy");
    expect(analytic?.visualModelKind).toBe("openngc-catalog-derived-galaxy-analytic");
    expect(selectDeepSpaceVisualSlicesV592(analytic!, "standalone-full", "desktop")).toEqual([]);

    const mutated = structuredClone(manifest);
    mutated.policy.scienceModeMarkerOnly = false;
    expect(() => parseDeepSpaceVisualManifestV592(mutated)).toThrow(/v592-deep-space-visual-manifest/);
  });
});
