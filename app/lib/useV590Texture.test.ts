import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CompressedTexture } from "three";
import type { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { VisualAssetManifestEntryV590 } from "./celestialRenderingV590";
import { visualAssetMeetsFullQualityV590 } from "./celestialRenderingV590";
import {
  parseVisualAssetManifestV590,
  parseKtx2V590,
  estimateV590TextureGpuBytes,
  selectVisualAssetFilesV590,
} from "./useV590Texture";

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
};

const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");

const file = (format: "ktx2" | "webp", suffix: string) => ({
  url: `/textures/candidate-v590/${suffix}.${format}`,
  bytes: 64,
  sha256: "1".repeat(64),
  width: 4,
  height: 4,
  format,
  colorSpace: "srgb" as const,
  compression: format === "ktx2" ? "uastc-rdo" : "webp-quality-90",
});

const asset: VisualAssetManifestEntryV590 = {
  id: "earth-albedo",
  body: "earth",
  role: "albedo",
  sourceUrl: "https://svs.gsfc.nasa.gov/example",
  sourceHost: "svs.gsfc.nasa.gov",
  license: { id: "NASA-public-domain", url: "https://www.nasa.gov/nasa-brand-center/images-and-media/" },
  sourceBytes: 64,
  sourceSha256: "2".repeat(64),
  derivation: { tool: "test", version: "1", parameters: "deterministic" },
  fullQualityMinimum: {
    desktop: { width: 8192, height: 4096 },
    mobile: { width: 2048, height: 1024 },
  },
  variants: {
    fullDesktop: file("ktx2", "earth-8k"),
    fullMobile: file("ktx2", "earth-2k"),
    liteDesktop: file("webp", "earth-1k"),
    liteMobile: file("webp", "earth-512"),
  },
  presentationOnly: true,
};

describe("v590 verified texture admission", () => {
  afterEach(() => vi.useRealTimers());

  it("parses the generated canonical manifest and locks the v263 boundary", () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "public/data/celestial-rendering-v590/manifest.json"), "utf8"));
    const parsed = parseVisualAssetManifestV590(manifest);
    expect(parsed.boundaries.formalProductPointer).toBe("v263");
    expect(parsed.boundaries.scientificPayloadWriteback).toBe(false);
    expect(parsed.runtime.assetFailureIsolation).toBe(true);
    const sentinel = parsed.assets.find((entry) => entry.id === parsed.runtime.ktx2SentinelAssetId);
    expect(sentinel).toBeDefined();
    expect(sentinel?.variants.fullDesktop?.format).toBe("ktx2");
    expect((sentinel?.variants.fullDesktop?.width ?? 1) % 4).toBe(0);
    expect((sentinel?.variants.fullDesktop?.height ?? 1) % 4).toBe(0);
  });

  it("selects device-specific KTX2 first for Full and verified WebP for Lite", () => {
    expect(selectVisualAssetFilesV590(asset, "standalone-full", "desktop").primary?.url).toContain("earth-8k");
    expect(selectVisualAssetFilesV590(asset, "standalone-full", "mobile").primary?.url).toContain("earth-2k");
    expect(selectVisualAssetFilesV590(asset, "vercel-lite", "desktop").primary).toBeNull();
    expect(selectVisualAssetFilesV590(asset, "vercel-lite", "desktop").fallback?.url).toContain("earth-1k");
    expect(selectVisualAssetFilesV590(asset, "vercel-lite", "mobile").fallback?.url).toContain("earth-512");
  });

  it("never allocates desktop Full as a mobile substitute and rejects a 1K Full gate", () => {
    const withoutFullMobile: VisualAssetManifestEntryV590 = {
      ...asset,
      variants: { ...asset.variants, fullMobile: undefined },
    };
    const selected = selectVisualAssetFilesV590(withoutFullMobile, "standalone-full", "mobile");
    expect(selected.primary).toBeNull();
    expect(selected.fullRaster).toBeNull();
    expect(selected.fallback?.url).toContain("earth-512");
    expect(selected.fallback?.url).not.toContain("earth-8k");
    expect(visualAssetMeetsFullQualityV590(asset, file("ktx2", "only-1k"), "desktop")).toBe(false);
  });

  it("treats an admitted Full mobile raster as Full rather than as a Lite fallback", () => {
    const fullMobileRaster = file("webp", "earth-mobile-2k");
    const withRasterMobile: VisualAssetManifestEntryV590 = {
      ...asset,
      variants: { ...asset.variants, fullMobile: fullMobileRaster },
    };
    const selected = selectVisualAssetFilesV590(withRasterMobile, "standalone-full", "mobile");
    expect(selected.primary).toBeNull();
    expect(selected.fullRaster).toBe(fullMobileRaster);
    expect(selected.fallback?.url).toContain("earth-512");
  });

  it("does not let a stale parse timeout invalidate a newer loader generation", async () => {
    vi.useFakeTimers();
    const invalidate = vi.fn();
    const loader = {
      parse: vi.fn(),
    } as unknown as KTX2Loader;
    const pending = parseKtx2V590(loader, new ArrayBuffer(16), 25, () => false, invalidate);
    const rejection = expect(pending).rejects.toThrow("v590-ktx2-parse-disposed");
    await vi.advanceTimersByTimeAsync(25);
    await rejection;
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("implements renderer-local and asset-local failure isolation", () => {
    const source = readFileSync(resolve(process.cwd(), "app/lib/useV590Texture.ts"), "utf8");
    expect(source).toContain("new WeakMap<THREE.WebGLRenderer, LoaderRuntimeV590>()");
    expect(source).toContain("assetFailures: new Map()");
    expect(source).toContain("runtime.assetFailures.set(assetId, primaryFailure)");
    expect(source).not.toContain("loaderFailure.set(gl");
    expect(source).toContain("prewarmV590Ktx2");
    expect(source).toContain("disposeV590TextureLoader");
    expect(source).toContain("invalidateV590TextureLoaderGeneration");
    expect(source).toContain("runtime.generation += 1");
    expect(source).toContain("v590-ktx2-asset-timeout");
    expect(source).toContain("effectGenerationRef.current === effectGeneration");
    expect(source).toContain("disposeTextureAfterDetachV590(candidate)");
  });

  it("accounts compressed GPU residency from uploaded mip payloads", () => {
    const texture = new CompressedTexture([
      { data: new Uint8Array(128), width: 16, height: 16 },
      { data: new Uint8Array(32), width: 8, height: 8 },
      { data: new Uint8Array(8), width: 4, height: 4 },
    ], 16, 16);
    expect(estimateV590TextureGpuBytes(texture)).toBe(168);
    texture.dispose();
  });

  it("admits the isolated CSP-safe Basis runtime without dynamic Function", () => {
    const receiptBytes = readFileSync(resolve(process.cwd(), "public/data/celestial-rendering-v590/basis-runtime-receipt.json"));
    const receipt = JSON.parse(receiptBytes.toString("utf8")) as {
      version: string;
      status: string;
      policy: { unsafeEvalRequired: boolean; historicalBasisRewritten: boolean };
      output: {
        path: string;
        js: { path: string; bytes: number; sha256: string };
        wasm: { path: string; bytes: number; sha256: string };
      };
      receiptSha256: string;
    };
    const unsignedReceipt = { ...receipt } as Record<string, unknown>;
    delete unsignedReceipt.receiptSha256;

    expect(receipt.version).toBe("v590-csp-safe-basis-runtime-v1");
    expect(receipt.status).toBe("derived-runtime-complete");
    expect(receipt.output.path).toBe("/basis-v590/");
    expect(receipt.policy.unsafeEvalRequired).toBe(false);
    expect(receipt.policy.historicalBasisRewritten).toBe(false);
    expect(sha256(JSON.stringify(canonicalize(unsignedReceipt)))).toBe(receipt.receiptSha256);

    for (const output of [receipt.output.js, receipt.output.wasm]) {
      const bytes = readFileSync(resolve(process.cwd(), output.path));
      expect(bytes.byteLength).toBe(output.bytes);
      expect(sha256(bytes)).toBe(output.sha256);
    }

    const runtimeJs = readFileSync(resolve(process.cwd(), receipt.output.js.path), "utf8");
    expect(runtimeJs).toContain("v590-csp-safe-craft-invoker");
    expect(runtimeJs).toContain("v590-csp-safe-emval-method-caller");
    expect(runtimeJs).not.toContain("newFunc(Function");
  });

  it("seals dimensions from file headers and covers operational Next entrypoints", () => {
    const seal = readFileSync(resolve(process.cwd(), "scripts/seal-v590-celestial-rendering-candidate.mjs"), "utf8");
    const verify = readFileSync(resolve(process.cwd(), "scripts/verify-v590-celestial-rendering-candidate.mjs"), "utf8");
    const build = readFileSync(resolve(process.cwd(), "scripts/build-v590-celestial-rendering-candidate.mjs"), "utf8");
    const standalone = readFileSync(resolve(process.cwd(), "scripts/start-atlas-v590-standalone.mjs"), "utf8");
    expect(seal).toContain("parseVisualAssetDimensionsV590");
    expect(seal).toContain("actualDimensions");
    expect(verify).toContain("v590-readonly-asset-dimensions");
    for (const path of ["proxy.ts", "app/lib/atlasProxyContractV562.ts", "scripts/build-atlas-profile.mjs", "scripts/start-atlas-v590-standalone.mjs", "scripts/start-atlas-standalone.mjs"]) {
      expect(build).toContain(`\"${path}\"`);
      expect(verify).toContain(`\"${path}\"`);
    }
    expect(standalone).toContain('"basis-v590"');
  });
});
