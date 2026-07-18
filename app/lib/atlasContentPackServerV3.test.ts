import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  atlasContentPackManifestForClientV3,
  atlasContentTypeForPath,
  listAtlasContentPacksV3,
  loadAtlasContentPackDescriptorV3,
  parseAtlasByteRange,
  resolveAllowedAtlasContentPackFileV3,
  validateAtlasContentPackManifestV3,
  type AtlasContentPackManifestV3,
} from "./atlasContentPackServerV3";
import {
  atlasAssetCandidates,
  atlasPackForAssetPath,
  resolveAtlasAsset,
} from "./atlasAssetResolver";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function fixturePack() {
  const root = await mkdtemp(path.join(tmpdir(), "atlas-pack-v3-"));
  temporaryRoots.push(root);
  const fileRoot = path.join(root, "files", "spacecraft", "models", "spacecraft");
  await mkdir(fileRoot, { recursive: true });
  await writeFile(path.join(fileRoot, "sls.glb"), Buffer.from([1, 2, 3, 4]));
  const manifest: AtlasContentPackManifestV3 = {
    schemaVersion: 1,
    id: "spacecraft",
    version: "1.0.0",
    appCompatibility: { minimum: "1.0.0", maximumExclusive: "2.0.0" },
    qualityTier: "standard",
    compressedBytes: 0,
    installedBytes: 4,
    baseUrl: "",
    files: [{
      path: "models/spacecraft/sls.glb",
      bytes: 4,
      sha256: "0".repeat(64),
      source: "fixture",
      license: "fixture",
    }],
  };
  await writeFile(path.join(root, "spacecraft.manifest.json"), JSON.stringify(manifest));
  return root;
}

describe("v160 content pack delivery", () => {
  it("loads only manifest-whitelisted files and publishes API base URLs", async () => {
    const root = await fixturePack();
    const descriptor = await loadAtlasContentPackDescriptorV3(root, "spacecraft");
    expect(resolveAllowedAtlasContentPackFileV3(descriptor, "models/spacecraft/sls.glb")?.entry.bytes).toBe(4);
    expect(resolveAllowedAtlasContentPackFileV3(descriptor, "../spacecraft.manifest.json")).toBeNull();
    expect(atlasContentPackManifestForClientV3(descriptor).baseUrl).toBe("/api/atlas/content-packs/spacecraft/files/");
    expect((await listAtlasContentPacksV3(root))[0]?.fileCount).toBe(1);
  });

  it("rejects unsafe paths and invalid aggregate sizes", () => {
    const invalid = {
      schemaVersion: 1,
      id: "core",
      version: "1",
      installedBytes: 9,
      files: [{ path: "../outside", bytes: 1, sha256: "bad" }],
    };
    expect(validateAtlasContentPackManifestV3(invalid)).toEqual(expect.arrayContaining([
      "unsafe-path",
      "file-checksum",
      "installed-size-mismatch",
    ]));
  });

  it("parses bounded and suffix byte ranges", () => {
    expect(parseAtlasByteRange("bytes=1-2", 4)).toEqual({ start: 1, end: 2, length: 2 });
    expect(parseAtlasByteRange("bytes=-2", 4)).toEqual({ start: 2, end: 3, length: 2 });
    expect(parseAtlasByteRange("bytes=8-9", 4)).toBe("invalid");
    expect(atlasContentTypeForPath("vehicle.glb")).toBe("model/gltf-binary");
    expect(atlasContentTypeForPath("planet.ktx2")).toBe("image/ktx2");
  });

  it("maps runtime paths to local content-pack URLs before public fallback", () => {
    expect(atlasPackForAssetPath("/models/spacecraft/sls.glb")).toBe("spacecraft");
    expect(atlasPackForAssetPath("/textures/planets/v49/earth-albedo.jpg")).toBe("planet-hd");
    expect(atlasPackForAssetPath("/data/horizons-validation-j2000.json")).toBe("science-fixtures");
    expect(resolveAtlasAsset("/solar-assets/solar/textures/planets/earth.jpg").path)
      .toBe("textures/planets/earth.jpg");
    const resolution = resolveAtlasAsset("/textures/planets/hd/earth.jpg");
    expect(resolution.primaryUrl).toBe("/api/atlas/content-packs/planet-hd/files/textures/planets/hd/earth.jpg");
    expect(atlasAssetCandidates("/textures/planets/hd/earth.jpg").at(-1)).toBe("/textures/planets/hd/earth.jpg");
    const versioned = resolveAtlasAsset("/textures/sky/orbit-atlas-v61-reset-base-4k.jpg?v=61d");
    expect(versioned.path).toBe("textures/sky/orbit-atlas-v61-reset-base-4k.jpg");
    expect(versioned.primaryUrl).not.toContain("%3F");
    expect(versioned.candidates.at(-1)).toContain("?v=61d");
  });

  it("preserves external and object URLs without routing them through a local pack", () => {
    expect(atlasAssetCandidates("https://assets.example/earth.ktx2")).toEqual([
      "https://assets.example/earth.ktx2",
    ]);
    expect(atlasAssetCandidates("blob:atlas-preview")).toEqual(["blob:atlas-preview"]);
  });

  it("routes scene assets through the resolver and refuses an empty pack rebuild", async () => {
    const galaxy = await readFile("app/components/GalaxyEnvironmentSphere.tsx", "utf8");
    const planetManager = await readFile("app/lib/planetTextureManager.ts", "utf8");
    const spacecraft = await readFile("app/components/SpacecraftModel.tsx", "utf8");
    const exoplanet = await readFile("app/components/ExoplanetSystemScene.tsx", "utf8");
    const observation = await readFile("app/components/ObservationalAstrophysicsLabPanel.tsx", "utf8");
    const gaiaStore = await readFile("app/lib/gaiaCatalogStore.ts", "utf8");
    const sun = await readFile("app/lib/sunDiskTexture.ts", "utf8");
    const buildScript = await readFile("scripts/build-content-packs.mjs", "utf8");
    expect(galaxy).toContain("atlasAssetCandidates(url)");
    expect(planetManager).toContain("atlasAssetCandidates(task.url)");
    expect(spacecraft).toContain("atlasAssetCandidates(solarAssetUrl(entry))");
    expect(exoplanet).toContain("fetchAtlasAsset(EXOPLANET_CATALOG_V2_MANIFEST_URL");
    expect(observation).toContain("fetchAtlasAsset(EXOPLANET_OBSERVATION_MANIFEST_V2_URL");
    expect(gaiaStore).toContain("fetchAtlasAsset(GAIA_DR3_CATALOG_URL");
    expect(sun).not.toContain("https://");
    expect(buildScript.indexOf("await assertSourceTreeIsStaged()")).toBeLessThan(
      buildScript.indexOf("await mkdir(OUT"),
    );
  });
});
