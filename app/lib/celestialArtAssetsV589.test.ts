import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CELESTIAL_ART_CONSTELLATION_BINDING_SHA256_V589,
  CELESTIAL_ART_GAIA_LITE_SHA256_V589,
  CELESTIAL_ART_MANIFEST_SHA256_V589,
} from "./celestialArtV589";

const root = process.cwd();
const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(source).sort().map((key) => [key, canonical(source[key])]));
};
const canonicalSha = (value: unknown) => sha256(JSON.stringify(canonical(value)));

describe("v589 generated visual assets", () => {
  it("seals the Gaia 46K catalog in the 24-byte v9-compatible layout", () => {
    const bytes = readFileSync(resolve(root, "public/data/celestial-art-v589/gaia-lite-46000-v589.bin"));
    expect(bytes.byteLength).toBe(46_000 * 24);
    expect(sha256(bytes)).toBe(CELESTIAL_ART_GAIA_LITE_SHA256_V589);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(view.getBigUint64(0, true)).toBeGreaterThan(BigInt(0));
    expect(view.getUint16(16, true) / 1000 - 5).toBeGreaterThan(-5);
  });

  it("anchors all 484 constellation waypoints to rendered Gaia source IDs", () => {
    const value = JSON.parse(readFileSync(resolve(root, "public/data/celestial-art-v589/constellation-gaia-bindings-v589.json"), "utf8"));
    const unsigned = { ...value };
    delete unsigned.bindingSha256;
    expect(value.bindingSha256).toBe(CELESTIAL_ART_CONSTELLATION_BINDING_SHA256_V589);
    expect(canonicalSha(unsigned)).toBe(value.bindingSha256);
    expect(value.constellationCount).toBe(88);
    expect(value.waypointCount).toBe(484);
    expect(value.maximumAngularDistanceDeg).toBeLessThanOrEqual(1.5);
    expect(value.bindings.flatMap((entry: { waypoints: unknown[] }) => entry.waypoints)).toHaveLength(484);
  });

  it("admits only allowed public-domain, CC0 or existing Gaia provenance", () => {
    const value = JSON.parse(readFileSync(resolve(root, "public/data/celestial-art-v589/manifest.json"), "utf8"));
    const unsigned = { ...value };
    delete unsigned.manifestSha256;
    expect(value.manifestSha256).toBe(CELESTIAL_ART_MANIFEST_SHA256_V589);
    expect(canonicalSha(unsigned)).toBe(value.manifestSha256);
    expect(value.boundaries).toMatchObject({
      formalProductPointer: "v263",
      v588Rewritten: false,
      historicalEvidenceRewritten: false,
      scientificPayloadWriteback: false,
      singleCanvasRequired: true,
      productionPromotionAllowed: false,
    });
    const licenseIds = new Set(["NASA-public-domain", "USGS-public-domain", "PDS-public-domain", "Poly-Haven-CC0", "Gaia-existing-admission"]);
    expect(value.assets.every((asset: { license: { id: string } }) => licenseIds.has(asset.license.id))).toBe(true);
    expect(JSON.stringify(value)).not.toMatch(/solarsystemscope|universe sandbox asset|esa-restricted/i);
    expect(value.budgets.observedLiteIncrementBytes).toBeLessThanOrEqual(9 * 1024 * 1024);
    expect(value.starfield).toMatchObject({
      standaloneCatalog: "gaia-dr3-presentation-10000000-v9-range-worker",
      standaloneManifestUrl: "/data/gaia-dr3-presentation-10000000-v9/manifest.json",
      standaloneRows: 10_000_000,
    });
    const full = value.assets.find((asset: { id: string }) => asset.id === "gaia-full-10m-range-manifest");
    expect(full?.variants.fullDesktop?.url).toBe("/data/gaia-dr3-presentation-10000000-v9/manifest.json");
    expect(full?.variants.liteDesktop).toBeUndefined();
  });

  it("verifies every local variant by bytes and SHA", () => {
    const value = JSON.parse(readFileSync(resolve(root, "public/data/celestial-art-v589/manifest.json"), "utf8"));
    for (const asset of value.assets) {
      for (const file of Object.values(asset.variants) as Array<{ url: string; bytes: number; sha256: string }>) {
        if (!file.url.startsWith("/textures/") && !file.url.startsWith("/data/")) continue;
        const path = resolve(root, "public", file.url.slice(1));
        expect(statSync(path).size, file.url).toBe(file.bytes);
        expect(sha256(readFileSync(path)), file.url).toBe(file.sha256);
      }
    }
  });

  it("records a single-attempt acquisition receipt without retries or substitutions", () => {
    const value = JSON.parse(readFileSync(resolve(root, "docs/release/v589/acquisition-receipt-v589.json"), "utf8"));
    expect(value.automaticRetryApplied).toBe(false);
    expect(value.automaticSubstitutionApplied).toBe(false);
    expect(value.results).toHaveLength(10);
    expect(value.results.every((entry: { requestCount: number }) => entry.requestCount <= 1)).toBe(true);
    expect(new Set(value.results.map((entry: { license: string }) => entry.license))).toEqual(new Set(["NASA-public-domain", "Poly-Haven-CC0"]));
    expect(value.results.filter((entry: { id: string }) => entry.id.startsWith("regolith-"))).toHaveLength(3);
    expect(value.results.some((entry: { id: string }) => entry.id === "earth-height-source")).toBe(true);
  });

  it("admits the verified Bennu LOD chain and CC0 regolith maps", () => {
    const manifest = JSON.parse(readFileSync(resolve(root, "public/data/celestial-art-v589/manifest.json"), "utf8"));
    const model = manifest.assets.find((asset: { id: string }) => asset.id === "bennu-model");
    expect(model?.variants.fullDesktop).toMatchObject({ format: "glb", lod: 0, compression: "meshopt+quantized" });
    expect(model?.variants.fullMobile).toMatchObject({ format: "glb", lod: 1 });
    expect(model?.variants.liteMobile).toMatchObject({ format: "glb", lod: 2 });
    expect(manifest.assets.some((asset: { id: string }) => asset.id === "regolith-cc0")).toBe(true);
    expect(manifest.assets.some((asset: { id: string }) => asset.id === "regolith-normal-cc0")).toBe(true);
    expect(manifest.assets.some((asset: { id: string }) => asset.id === "regolith-roughness-cc0")).toBe(true);
    expect(manifest.heroBodies.bennu).toBe("admitted");
    expect(manifest.heroBodies.earth).toBe("admitted");
    expect(manifest.assets.some((asset: { id: string }) => asset.id === "earth-normal")).toBe(true);
    expect(manifest.modelPipeline).toMatchObject({ lodCount: 3, normals: true, meshopt: true, stablePivot: true });

    const receipt = JSON.parse(readFileSync(resolve(root, "docs/release/v589/bennu-lod-receipt-v589.json"), "utf8"));
    const unsigned = { ...receipt };
    delete unsigned.receiptSha256;
    expect(canonicalSha(unsigned)).toBe(receipt.receiptSha256);
    expect(receipt.lods).toHaveLength(3);
    expect(receipt.lods.every((lod: { normals: boolean; meshopt: boolean }) => lod.normals && lod.meshopt)).toBe(true);
  });
});
