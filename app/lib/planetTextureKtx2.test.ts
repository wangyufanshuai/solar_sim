import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { atlasContentPackTestPath } from "./atlasContentPackTestPath";

type TextureManifest = {
  version: string;
  assetCount: number;
  runtimePolicy: string;
  tool: { version: string; sha256: string; license: string };
  assets: Array<{
    source: string;
    ktx2: string;
    mode: string;
    ktx2Bytes: number;
    sha256: string;
  }>;
};

describe("v126 project-local KTX2 pipeline", () => {
  it("publishes complete offline assets with fallback and provenance", () => {
    const root = process.cwd();
    const manifest = JSON.parse(
      readFileSync(join(root, "dist/content-packs/files/core/data/planet-textures-v2.json"), "utf8").replace(
        /^\uFEFF/,
        "",
      ),
    ) as TextureManifest;
    expect(manifest.version).toBe("v126-planet-ktx2-pipeline");
    expect(manifest.assetCount).toBe(35);
    expect(manifest.assets).toHaveLength(35);
    expect(manifest.runtimePolicy).toContain("jpg-png-fallback");
    expect(manifest.runtimePolicy).toContain("v9-sky-unchanged");
    expect(manifest.tool.version).toBe("4.4.2");
    expect(manifest.tool.license).toBe("Apache-2.0");
    expect(manifest.tool.sha256).toMatch(/^[a-f0-9]{64}$/);

    const paths = new Set<string>();
    for (const asset of manifest.assets) {
      expect(paths.has(asset.ktx2)).toBe(false);
      paths.add(asset.ktx2);
      expect(asset.source).not.toContain("/sky/");
      expect(asset.mode).toMatch(/^(etc1s|uastc-zstd)$/);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      const file = atlasContentPackTestPath(asset.ktx2);
      expect(statSync(file).size).toBe(asset.ktx2Bytes);
    }
  });
});
