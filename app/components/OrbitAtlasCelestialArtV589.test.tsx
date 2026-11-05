import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("v589 single-canvas celestial-art integration", () => {
  it("adds an isolated route without changing the formal pointer", () => {
    const page = read("app/local-shadow-v589/page.tsx");
    const lazy = read("app/components/OrbitAtlasCelestialArtV589Lazy.tsx");
    expect(page).toContain("OrbitAtlasCelestialArtV589Lazy");
    expect(page).toContain('data-atlas-formal-product-pointer="v263"');
    expect(lazy).toContain("local-shadow-only");
  });

  it("uses one isolated UniverseCanvas observation contract host", () => {
    const shell = read("app/components/OrbitAtlasCelestialArtV589.tsx");
    const host = read("app/components/UniverseCanvasOverrideHostV589.tsx");
    expect(shell.match(/<UniverseCanvasOverrideHostV589/g)).toHaveLength(1);
    expect(shell).not.toContain("<Canvas");
    expect(host.match(/<Canvas/g)).toHaveLength(1);
    expect(host).toContain('data-atlas-universe-canvas-contract="v587-observation-scene-override"');
    expect(shell).toContain('data-atlas-v589-canvas-count="1"');
  });

  it("keeps Science/Cinematic state outside scientific payload", () => {
    const shell = read("app/components/OrbitAtlasCelestialArtV589.tsx");
    const stage = read("app/components/CelestialArtStageV589.tsx");
    expect(shell).toContain('data-atlas-v589-scientific-writeback="false"');
    expect(shell).toContain("payloadRef");
    expect(stage).toContain("atlasScientificPayloadMutation: false");
    expect(stage).toContain("THREE.NoToneMapping");
    expect(stage).toContain("THREE.ACESFilmicToneMapping");
  });

  it("renders deterministic Gaia layers and depth-occluded constellation bindings", () => {
    const stage = read("app/components/CelestialArtStageV589.tsx");
    const worker = read("app/workers/celestialStarfieldV589.worker.ts");
    expect(stage).toContain("StarPointsLayerV589");
    expect(stage).toContain("BrightPsfLayerV589");
    expect(stage).toContain("THREE.InstancedBufferGeometry");
    expect(stage).toContain("depthTest: true");
    expect(worker).not.toContain("Math.random");
    expect(worker).toContain("sourceIds");
    expect(worker).toContain("anchors.has(record.sourceId)");
    expect(worker).toContain("gaia-dr3-presentation-10000000-v9-range-worker");
    expect(worker).toContain("selectCatalogTilesForConeV8");
    expect(worker).toContain("crc32CatalogPayloadV9");
    expect(worker).toContain("v589-gaia-10m-range-unsupported");
    expect(worker).not.toContain("gaia-10m-range-contract-with-v589-lite-bootstrap");
  });

  it("keeps the solar disk, rocky relief, ring shadow and orbit overlays honest", () => {
    const stage = read("app/components/CelestialArtStageV589.tsx");
    expect(stage).toContain("SOLAR_FRAGMENT_V589");
    expect(stage).toContain("solarSource");
    expect(stage).toContain("SATURN_FRAGMENT_V589");
    expect(stage).toContain("uRingAlpha");
    expect(stage).toContain("atlasBlockedMarker: \"hud-only\"");
    expect(stage).toContain("atlasOrbitDirectionArrow");
    expect(stage).toContain("atlasOrbitAscendingNode");
    expect(stage).not.toContain("bumpMap=");
    expect(stage).not.toContain("bumpScale=");
  });

  it("shows blocked Hero admission instead of a procedural replacement", () => {
    const stage = read("app/components/CelestialArtStageV589.tsx");
    expect(stage).toContain("asset-blocked");
    expect(stage).toContain("atlasProceduralFallback: false");
    expect(stage).toContain("BlockedBodyProxyV589");
    expect(stage).not.toContain("<icosahedronGeometry");
    expect(stage).not.toMatch(/Math\.random/);
  });

  it("loads the admitted Bennu mesh lazily with verified LOD and CC0 triplanar material", () => {
    const stage = read("app/components/CelestialArtStageV589.tsx");
    const loader = read("app/lib/useV589Model.ts");
    const standalone = read("scripts/start-atlas-standalone.mjs");
    const seal = read("scripts/seal-v589-celestial-art-candidate.mjs");
    expect(stage).toContain("REGOLITH_TRIPLANAR_FRAGMENT_V589");
    expect(stage).toContain('useV589Model("bennu-model"');
    expect(stage).toContain('useV589Texture("regolith-cc0"');
    expect(stage).toContain('useV589Texture("regolith-normal-cc0"');
    expect(stage).toContain('useV589Texture("regolith-roughness-cc0"');
    expect(stage).toContain("atlasV589BennuModelLod");
    expect(loader).toContain("MeshoptDecoder.ready");
    expect(loader).toContain('acquireAtlasResource("model"');
    expect(loader).toContain('acquireAtlasResource("gpu-buffer"');
    expect(loader).toContain("loadVerifiedVisualAssetBytesV589");
    expect(standalone).toContain('["atlas-lite", "basis", "data", "textures", "models"]');
    expect(seal).toContain('.next-atlas-v589-standalone-current');
    expect(seal).not.toContain('distDir: ".next-atlas-v589-current"');
  });

  it("bounds KTX2 fallback latency and explicitly drains renderer-owned candidate resources", () => {
    const stage = read("app/components/CelestialArtStageV589.tsx");
    const textureLoader = read("app/lib/useV589Texture.ts");
    expect(textureLoader).toContain("const loaderFailure = new WeakMap<THREE.WebGLRenderer, string>()");
    expect(textureLoader).toContain("loaderFailure.get(gl)");
    expect(textureLoader).toContain("loaderFailure.set(gl, primaryFailure)");
    expect(textureLoader).toContain("disposeTextureAfterDetachV589");
    expect(textureLoader).toContain("window.requestAnimationFrame(() => texture.dispose())");
    expect(stage).toContain("disposeCandidateSceneGraphV589");
    expect(stage).toContain("disposeAfterDetachV589(geometry)");
    expect(stage).toContain("keyLight?.shadow.dispose()");
    expect(stage).toContain("gl.renderLists.dispose()");
    expect(read("app/lib/useV589Model.ts")).toContain("disposeModelResourceAfterDetachV589(geometry)");
  });

  it("does not edit or import the v588 scene implementation", () => {
    const stage = read("app/components/CelestialArtStageV589.tsx");
    const shell = read("app/components/OrbitAtlasCelestialArtV589.tsx");
    expect(stage).not.toMatch(/from "\.\/VisualRestorationStageV588"/);
    expect(shell).not.toMatch(/OrbitAtlasVisualRestorationV588/);
  });
});
