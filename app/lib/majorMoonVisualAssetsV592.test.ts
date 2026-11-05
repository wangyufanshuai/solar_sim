import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  MAJOR_MOON_VISUAL_ASSET_COUNT_V592,
  MAJOR_MOON_VISUAL_ASSETS_V592,
  MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592,
} from "../data/majorMoonVisualAssetsV592.generated";

type VariantV592 = {
  url: string;
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  format: "ktx2" | "webp";
  colorSpace: "srgb";
  role: string;
};

type VisualAssetManifestV592 = {
  status: string;
  policy: {
    proceduralFallbackAllowed: boolean;
    coloredPlaceholderAllowed: boolean;
    albedoAdmissionDoesNotGrantHeroAdmission: boolean;
    scientificPayloadWriteback: boolean;
  };
  admission: {
    albedoAssetAdmittedCount: number;
    heroAdmittedCount: number;
    blockedCount: number;
    admittedBodies: string[];
    blockedBodies: string[];
  };
  assets: Array<{
    target: string;
    heroAdmission: boolean;
    derivation: { parameters: { inpainting: boolean; syntheticCoverageFill: boolean } };
    variants: Record<string, VariantV592>;
    scientificAuthority: boolean;
    presentationOnly: boolean;
    scientificPayloadWriteback: boolean;
  }>;
  manifestSha256: string;
};

type VisualAnalysisV592 = {
  status: string;
  policy: { noInpainting: boolean; noSyntheticCoverageFill: boolean };
  derivableTargets: string[];
  blockedTargets: string[];
  analyses: Array<{ target: string; visualInspectionDecision: string; runtimeAssetAdmitted: boolean }>;
};

type VisualReceiptV592 = {
  manifestSha256: string;
  liteIncrementBytes: number;
  heroAdmissionGranted: boolean;
  scientificPayloadWriteback: boolean;
  officialPreviewAssetCount?: number;
  officialPreviewSourceResolutionLimited?: boolean;
  officialPreviewAcquisitionReceiptSha256?: string;
};

type Nasa3dAcquisitionV592 = {
  receiptSha256: string;
  status: string;
  requestedUrls: string[];
  assets: Array<{
    target: string;
    outputPath: string;
    bytes: number;
    sha256: string;
    gitBlobSha1: string;
    expectedBytes: number;
    expectedGitBlobSha1: string;
    requestCount: number;
    scientificPayload: boolean;
    presentationOnly: boolean;
  }>;
  failures: unknown[];
  policy: {
    requestCountPerUrl: number;
    automaticRetryPerformed: boolean;
    automaticReplacementPerformed: boolean;
    scientificPayloadDownloaded: boolean;
    visualAssetAdmissionGranted: boolean;
  };
};

type Nasa3dAnalysisV592 = {
  receiptSha256: string;
  policy: { sourceAcquisitionReceiptSha256: string; noInpainting: boolean; noSyntheticCoverageFill: boolean; noProceduralFallback: boolean };
  summary: { analyzedCount: number; runtimeDerivationCandidateCount: number; sourceCoverageBlockedCount: number; runtimeAssetAdmittedCount: number };
  analyses: Array<{ target: string; visualInspectionDecision: string; visualReview: string; metrics: { width: number; height: number; aspectRatio: number; nearBlackPixelFraction: number; globalEquirectangularCandidate: boolean }; runtimeAssetAdmitted: boolean }>;
};

type Nasa3dNegativeEvidenceV592 = {
  status: string;
  targets: string[];
  sourceReceipts: { acquisitionReceiptSha256: string; analysisReceiptSha256: string };
  summary: { qualifiedGlobalTextureCount: number; sourceCoverageBlockedCount: number; runtimeAssetAdmittedCount: number; scientificPayloadDownloadedCount: number };
  policy: { requestCountPerUrl: number; automaticRetryPerformed: boolean; automaticReplacementPerformed: boolean; noInpainting: boolean; noSyntheticCoverageFill: boolean; noProceduralFallback: boolean; noThresholdRelaxation: boolean; scientificPayloadWriteback: boolean };
};

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

describe("major moon visual assets v592", () => {
  const manifest = readJson<VisualAssetManifestV592>("public/data/living-universe-v592/major-moon-visual-assets.json");
  const analysis = readJson<VisualAnalysisV592>("docs/release/v592/major-moon-source-visual-analysis-v592.json");
  const receipt = readJson<VisualReceiptV592>("docs/release/v592/major-moon-visual-assets-receipt-v592.json");
  const officialPreview = readJson<{ receiptSha256: string; status: string; requestCount: number; assets: Array<{ target: string; width: number; height: number; payloadDownloaded: boolean; scientificPayload: boolean; presentationOnly: boolean }> }>("docs/release/v592/acquisition-receipt-major-moon-official-preview-assets-v592.json");
  const nasa3dAcquisition = readJson<Nasa3dAcquisitionV592>("docs/release/v592/acquisition-receipt-major-moon-nasa3d-textures-v592.json");
  const nasa3dAnalysis = readJson<Nasa3dAnalysisV592>("docs/release/v592/major-moon-nasa3d-visual-analysis-v592.json");
  const nasa3dNegativeEvidence = readJson<Nasa3dNegativeEvidenceV592>("docs/release/v592/major-moon-nasa3d-negative-evidence-v592.json");

  it("seals the current albedo asset set without granting any moon Hero", () => {
    const unsigned = { ...manifest };
    delete (unsigned as Partial<VisualAssetManifestV592>).manifestSha256;
    const admittedCount = manifest.assets.length;
    const blockedCount = 12 - admittedCount;
    expect(manifest.manifestSha256).toBe(canonicalSha(unsigned));
    expect(manifest.manifestSha256).toBe(MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592);
    expect(manifest.status).toBe(`${admittedCount}-of-12-albedo-assets-admitted-0-of-12-heroes-admitted`);
    expect(manifest.admission).toMatchObject({ albedoAssetAdmittedCount: admittedCount, heroAdmittedCount: 0, blockedCount });
    expect(manifest.admission.admittedBodies).toEqual(manifest.assets.map((asset) => asset.target));
    expect(MAJOR_MOON_VISUAL_ASSET_COUNT_V592).toBe(admittedCount);
    expect(MAJOR_MOON_VISUAL_ASSETS_V592.map((asset) => asset.target)).toEqual(manifest.admission.admittedBodies);
    expect(receipt.manifestSha256).toBe(manifest.manifestSha256);
    expect(receipt.heroAdmissionGranted).toBe(false);
    expect(receipt.scientificPayloadWriteback).toBe(false);
  });

  it("matches every KTX2 and WebP byte, SHA and declared dimension", async () => {
    let liteBytes = 0;
    for (const asset of manifest.assets) {
      for (const variant of Object.values(asset.variants)) {
        const path = publicPathForUrl(variant.url);
        const bytes = readFileSync(path);
        expect(bytes.byteLength, `${asset.target}:${variant.role}:bytes`).toBe(variant.bytes);
        expect(sha256(bytes), `${asset.target}:${variant.role}:sha`).toBe(variant.sha256);
        if (variant.format === "ktx2") {
          expect(ktx2Dimensions(bytes), `${asset.target}:${variant.role}:dimensions`).toEqual({ width: variant.width, height: variant.height });
        } else {
          const metadata = await sharp(path).metadata();
          expect({ width: metadata.width, height: metadata.height }, `${asset.target}:${variant.role}:dimensions`).toEqual({ width: variant.width, height: variant.height });
        }
        expect(variant.colorSpace).toBe("srgb");
        if (variant.role.startsWith("lite-")) liteBytes += variant.bytes;
      }
    }
    expect(liteBytes).toBe(receipt.liteIncrementBytes);
    expect(liteBytes).toBeLessThanOrEqual(9 * 1024 * 1024);
  });

  it("keeps unresolved targets blocked and records the official preview lane", () => {
    expect(analysis.status).toBe("three-runtime-derivation-candidates-three-source-coverage-blocked");
    expect(analysis.derivableTargets).toEqual(["titan", "enceladus", "rhea"]);
    expect(analysis.blockedTargets).toEqual(["iapetus", "triton", "charon"]);
    expect(analysis.policy).toMatchObject({ noInpainting: true, noSyntheticCoverageFill: true });
    expect(manifest.admission.blockedBodies).toEqual(["triton", "miranda", "titania"]);
    expect(manifest.assets.some((asset) => asset.target === "charon")).toBe(true);
    expect(officialPreview.status).toBe("six-official-preview-assets-acquired-single-request-each");
    expect(officialPreview.requestCount).toBe(6);
    expect(officialPreview.assets.map((asset) => asset.target)).toEqual(["io", "europa", "ganymede", "callisto", "iapetus", "charon"]);
    expect(officialPreview.assets.every((asset) => asset.width === 1024 && asset.height === 512 && asset.payloadDownloaded === true && asset.scientificPayload === false && asset.presentationOnly === true)).toBe(true);
    expect(receipt.officialPreviewAssetCount).toBe(6);
    expect(receipt.officialPreviewSourceResolutionLimited).toBe(true);
    expect(receipt.officialPreviewAcquisitionReceiptSha256).toBe(officialPreview.receiptSha256);
    expect(manifest.assets.every((asset) => asset.heroAdmission === false
      && asset.derivation.parameters.inpainting === false
      && asset.derivation.parameters.syntheticCoverageFill === false
      && asset.scientificAuthority === false
      && asset.presentationOnly === true
      && asset.scientificPayloadWriteback === false)).toBe(true);
    expect(manifest.policy).toMatchObject({
      proceduralFallbackAllowed: false,
      coloredPlaceholderAllowed: false,
      albedoAdmissionDoesNotGrantHeroAdmission: true,
      scientificPayloadWriteback: false,
    });
    const runtimeFiles = readdirSync(resolve(process.cwd(), "public/textures/candidate-v592/major-moons"), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);
    expect(runtimeFiles).toHaveLength(manifest.assets.length * 6);
    expect(runtimeFiles.some((path) => path.toLowerCase().includes("charon"))).toBe(true);
    expect(runtimeFiles.some((path) => path.toLowerCase().includes("triton"))).toBe(false);
    expect(runtimeFiles.some((path) => path.toLowerCase().includes("miranda"))).toBe(false);
    expect(runtimeFiles.some((path) => path.toLowerCase().includes("titania"))).toBe(false);
  });

  it("records the one-request NASA 3D lane as coverage-blocked without runtime admission", () => {
    expect(nasa3dAcquisition.status).toBe("three-nasa3d-tiffs-acquired-single-request-each-analysis-required");
    expect(nasa3dAcquisition.requestedUrls).toHaveLength(3);
    expect(nasa3dAcquisition.assets.map((asset) => asset.target)).toEqual(["triton", "miranda", "titania"]);
    expect(nasa3dAcquisition.failures).toEqual([]);
    expect(nasa3dAcquisition.policy).toMatchObject({
      requestCountPerUrl: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      scientificPayloadDownloaded: false,
      visualAssetAdmissionGranted: false,
    });
    for (const asset of nasa3dAcquisition.assets) {
      const bytes = readFileSync(resolve(process.cwd(), asset.outputPath));
      expect(bytes.byteLength).toBe(asset.bytes);
      expect(asset.bytes).toBe(asset.expectedBytes);
      expect(sha256(bytes)).toBe(asset.sha256);
      expect(asset.gitBlobSha1).toBe(asset.expectedGitBlobSha1);
      expect(asset.requestCount).toBe(1);
      expect(asset.scientificPayload).toBe(false);
      expect(asset.presentationOnly).toBe(true);
    }
    expect(nasa3dAnalysis.policy.sourceAcquisitionReceiptSha256).toBe(nasa3dAcquisition.receiptSha256);
    expect(nasa3dAnalysis.summary).toMatchObject({
      analyzedCount: 3,
      runtimeDerivationCandidateCount: 0,
      sourceCoverageBlockedCount: 3,
      runtimeAssetAdmittedCount: 0,
    });
    expect(nasa3dAnalysis.policy).toMatchObject({ noInpainting: true, noSyntheticCoverageFill: true, noProceduralFallback: true });
    expect(nasa3dAnalysis.analyses.every((entry) => entry.metrics.width === 1440
      && entry.metrics.height === 720
      && entry.metrics.aspectRatio === 2
      && entry.metrics.globalEquirectangularCandidate === true
      && entry.metrics.nearBlackPixelFraction > 0.5
      && entry.visualInspectionDecision === "asset-blocked-source-coverage-or-projection"
      && entry.visualReview.includes("confirmed-large-unobserved-black-coverage")
      && entry.runtimeAssetAdmitted === false)).toBe(true);
    expect(nasa3dNegativeEvidence.status).toBe("three-official-nasa3d-global-textures-source-coverage-blocked-no-runtime-admission");
    expect(nasa3dNegativeEvidence.targets).toEqual(["triton", "miranda", "titania"]);
    expect(nasa3dNegativeEvidence.sourceReceipts).toEqual({
      acquisitionReceiptSha256: nasa3dAcquisition.receiptSha256,
      analysisReceiptSha256: nasa3dAnalysis.receiptSha256,
    });
    expect(nasa3dNegativeEvidence.summary).toMatchObject({
      qualifiedGlobalTextureCount: 0,
      sourceCoverageBlockedCount: 3,
      runtimeAssetAdmittedCount: 0,
      scientificPayloadDownloadedCount: 0,
    });
    expect(nasa3dNegativeEvidence.policy).toMatchObject({
      requestCountPerUrl: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      noInpainting: true,
      noSyntheticCoverageFill: true,
      noProceduralFallback: true,
      noThresholdRelaxation: true,
      scientificPayloadWriteback: false,
    });
  });
});
