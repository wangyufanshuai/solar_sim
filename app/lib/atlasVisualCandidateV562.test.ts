import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { atlasContentPackTestPath } from "./atlasContentPackTestPath";
import {
  ATLAS_VISUAL_CANDIDATE_ASSETS_V562,
  ATLAS_VISUAL_CANDIDATE_PACK_V562,
  loadAtlasVisualCandidateManifestV562,
  visualCandidateAssetPathV562,
} from "./atlasVisualCandidateV562";
import {
  ATLAS_VISUAL_RUNTIME_CANDIDATE_AUTHORITY_V562,
  ATLAS_VISUAL_RUNTIME_SKY_V562,
} from "./atlasVisualRuntimeCandidateV562";

const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

describe("v562 KTX2-first visual candidate", () => {
  it("loads a namespaced candidate without claiming Legacy V9 or v49 JPEG authority", () => {
    const manifest = loadAtlasVisualCandidateManifestV562();
    expect(manifest.visualAuthority).toBe("candidate-only-not-v263-not-legacy-v9");
    expect(manifest.authorityNamespace).toBe("candidate-v562");
    expect(manifest.assets).toHaveLength(ATLAS_VISUAL_CANDIDATE_ASSETS_V562.length);
    expect(manifest.assets.filter((asset) => asset.format === "ktx2")).toHaveLength(6);
    expect(ATLAS_VISUAL_RUNTIME_CANDIDATE_AUTHORITY_V562).toBe("candidate-v562-derived-no-legacy-v9-authority");
  });

  it("keeps source, Lite projection and content-pack projection byte-identical", () => {
    const manifest = loadAtlasVisualCandidateManifestV562();
    for (const asset of manifest.assets) {
      const source = resolve(process.cwd(), asset.sourcePath);
      const lite = resolve(process.cwd(), "public/atlas-lite", asset.url.replace(/^\/+/, ""));
      expect(existsSync(source), asset.id).toBe(true);
      expect(existsSync(lite), `${asset.id}:lite`).toBe(true);
      expect(existsSync(atlasContentPackTestPath(asset.url)), `${asset.id}:pack`).toBe(true);
      expect(sha256(readFileSync(source)), asset.id).toBe(asset.sha256);
      expect(sha256(readFileSync(lite)), `${asset.id}:lite`).toBe(asset.sha256);
      expect(visualCandidateAssetPathV562(asset.id)).toBe(asset.url);
      expect(asset.packId).toBe(ATLAS_VISUAL_CANDIDATE_PACK_V562);
    }
  });

  it("drives the candidate sky only from the explicit candidate namespace", () => {
    const admitted = new Set(ATLAS_VISUAL_CANDIDATE_ASSETS_V562.map((asset) => asset.url));
    for (const url of [
      ATLAS_VISUAL_RUNTIME_SKY_V562.desktopBase,
      ATLAS_VISUAL_RUNTIME_SKY_V562.mobileBase,
      ATLAS_VISUAL_RUNTIME_SKY_V562.desktopStars,
      ATLAS_VISUAL_RUNTIME_SKY_V562.mobileStars,
      ATLAS_VISUAL_RUNTIME_SKY_V562.dustMask,
    ]) {
      expect(url.startsWith("/textures/candidate-v562/"), url).toBe(true);
      expect(admitted.has(url), url).toBe(true);
      expect(url).not.toContain("orbit-atlas-v9");
    }
  });
});
