import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VISUAL_RESTORATION_MANIFEST_SHA256_V588 } from "./visualRestorationV588";

type FileEntry = {
  url: string;
  bytes: number;
  sha256: string;
  dimensions: { width: number; height: number };
  format: string;
};
type AssetEntry = {
  id: string;
  body: string;
  presentationOnly: boolean;
  primary: FileEntry;
  fallback: Partial<Record<"desktop" | "mobile", FileEntry>>;
  provenance: { originalPath: string; originalSha256: string };
};
type Manifest = {
  manifestSha256: string;
  authorityNamespace: string;
  assets: AssetEntry[];
  admission: { heroBodies: string[]; heroProceduralFallbackAllowed: boolean; verifiedFallbackRequired: boolean };
  boundary: { formalProductPointer: string; frozenV9Rewritten: boolean; historicalEvidenceRewritten: boolean; singleCanvasRequired: boolean };
};

const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const manifest = JSON.parse(readFileSync("public/data/visual-restoration-v588/manifest.json", "utf8")) as Manifest;

describe("v588 admitted visual assets", () => {
  it("has a separate immutable candidate identity and no procedural hero fallback", () => {
    expect(manifest.manifestSha256).toBe(VISUAL_RESTORATION_MANIFEST_SHA256_V588);
    expect(manifest.authorityNamespace).toBe("candidate-v588");
    expect(manifest.assets).toHaveLength(18);
    expect(manifest.admission.heroBodies).toEqual(["earth", "jupiter", "saturn", "mars"]);
    expect(manifest.admission.heroProceduralFallbackAllowed).toBe(false);
    expect(manifest.admission.verifiedFallbackRequired).toBe(true);
    expect(manifest.boundary).toMatchObject({
      formalProductPointer: "v263",
      frozenV9Rewritten: false,
      historicalEvidenceRewritten: false,
      singleCanvasRequired: true,
    });
  });

  it("verifies every KTX2 primary and every declared fallback byte-for-byte", () => {
    for (const asset of manifest.assets) {
      const primaryPath = `public${asset.primary.url}`;
      const primary = readFileSync(primaryPath);
      expect(primary.subarray(0, 12).toString("hex"), asset.id).toBe("ab4b5458203230bb0d0a1a0a");
      expect(statSync(primaryPath).size, asset.id).toBe(asset.primary.bytes);
      expect(sha(primary), asset.id).toBe(asset.primary.sha256);
      for (const fallback of Object.values(asset.fallback)) {
        if (!fallback) continue;
        const fallbackPath = `public${fallback.url}`;
        const bytes = readFileSync(fallbackPath);
        expect(statSync(fallbackPath).size, `${asset.id}:fallback`).toBe(fallback.bytes);
        expect(sha(bytes), `${asset.id}:fallback`).toBe(fallback.sha256);
        expect(fallback.dimensions.width).toBeGreaterThan(0);
        expect(fallback.dimensions.height).toBeGreaterThan(0);
      }
    }
  });

  it("restores the v9 8K galaxy by byte-preserving fallback without inheriting v9 authority", () => {
    const sky = manifest.assets.find((asset) => asset.id === "milky-way-desktop")!;
    const frozen = readFileSync("public/textures/sky/orbit-atlas-v9-base-8k.jpg");
    const candidate = readFileSync(`public${sky.fallback.desktop!.url}`);
    expect(sky.fallback.desktop!.dimensions).toEqual({ width: 8192, height: 4096 });
    expect(sha(candidate)).toBe(sha(frozen));
    expect(sky.provenance.originalSha256).toBe(sha(frozen));
    expect(sky.primary.url).toMatch(/^\/textures\/candidate-v588\/sky\//);
  });

  it("requires desktop and mobile fallback variants for all 16 hero maps", () => {
    const planetAssets = manifest.assets.filter((asset) => asset.body !== "sky");
    expect(planetAssets).toHaveLength(16);
    for (const asset of planetAssets) {
      expect(asset.fallback.desktop, asset.id).toBeDefined();
      expect(asset.fallback.mobile, asset.id).toBeDefined();
      expect(asset.fallback.desktop!.dimensions.width, asset.id).toBeLessThanOrEqual(2048);
      expect(asset.fallback.mobile!.dimensions.width, asset.id).toBeLessThanOrEqual(1024);
      expect(asset.presentationOnly).toBe(true);
    }
  });
});
