import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

type VisualManifest = {
  manifestSha256: string;
  assets: Array<{
    variant: "desktop" | "mobile";
    ktx2: string;
    preview: string;
    output: { ktx2Sha256: string; previewSha256: string; dimensions: { width: number; height: number } };
  }>;
};

const root = "public";
const sha = (value: Buffer) => createHash("sha256").update(value).digest("hex");
const read = (path: string) => readFileSync(`${root}${path}`);

describe("v587 KTX2 presentation candidate", () => {
  it("keeps a separate namespace and deterministic verified desktop/mobile variants", () => {
    const manifest = JSON.parse(read("/data/kerr-observation-v587/visual-manifest.json").toString("utf8")) as VisualManifest;
    expect(manifest.assets).toHaveLength(2);
    expect(manifest.assets.map((asset) => asset.variant).sort()).toEqual(["desktop", "mobile"]);
    for (const asset of manifest.assets) {
      expect(asset.ktx2).toMatch(/^\/textures\/candidate-v587\/ktx2\//);
      expect(asset.preview).toMatch(/^\/textures\/candidate-v587\/preview\//);
      const ktx = read(asset.ktx2);
      const preview = read(asset.preview);
      expect(ktx.subarray(0, 12).toString("hex")).toBe("ab4b5458203230bb0d0a1a0a");
      expect(sha(ktx)).toBe(asset.output.ktx2Sha256);
      expect(sha(preview)).toBe(asset.output.previewSha256);
      expect(statSync(`${root}${asset.ktx2}`).size).toBeGreaterThan(80);
      expect(asset.output.dimensions.width).toBeGreaterThan(0);
      expect(asset.output.dimensions.height).toBeGreaterThan(0);
    }
  });

  it("does not let presentation assets become scientific authority", () => {
    const manifest = JSON.parse(read("/data/kerr-observation-v587/visual-manifest.json").toString("utf8")) as Record<string, unknown>;
    const boundary = manifest.boundary as Record<string, unknown>;
    expect(manifest.authorityNamespace).toBe("candidate-v587");
    expect(manifest.visualAuthority).toBe("not-v263-not-legacy-v9-not-v562");
    expect(boundary.formalProductPointer).toBe("v263");
    expect(boundary.sciencePayloadWriteback).toBe(false);
    expect(boundary.productionPromotionAllowed).toBe(false);
  });
});
