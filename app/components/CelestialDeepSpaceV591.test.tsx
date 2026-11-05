import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("v591 additive Gaia deep-space renderer", () => {
  it("owns a separate single-Canvas layer while reusing frozen sky/catalog identities", () => {
    const source = read("app/components/CelestialDeepSpaceV591.tsx");
    expect(source).toContain("useV591ReadonlyV590Texture");
    expect(source).toContain('atlasResourceOwner: "v591-celestial-convergence"');
    expect(source).toContain("MILKY_WAY_ROTATION_V590");
    expect(source).toContain("CONSTELLATION_PACKET_FILE_SHA256_V591");
    expect(source).toContain("CONSTELLATION_LABEL_ATLAS_FILE_SHA256_V591");
    expect(source).not.toContain("<Canvas");
    expect(source).not.toContain("OrbitControls");
  });

  it("uses one linear point layer plus one bright instanced PSF layer", () => {
    const source = read("app/components/CelestialDeepSpaceV591.tsx");
    expect(source).toContain("STAR_RENDER_DRAW_POLICY_V591");
    expect(source).toContain("selectStarRenderIndicesV591");
    expect(source).toContain("STAR_POINT_FRAGMENT_V591");
    expect(source).toContain("STAR_PSF_FRAGMENT_V591");
    expect(source).toContain("blending: THREE.NormalBlending");
    expect(source).not.toContain("blending: THREE.AdditiveBlending");
    expect(source).toContain("atlasStarFaintDensityPolicy");
  });

  it("reports six admitted presentation nebulae and leaves constellation lines presentation-only", () => {
    const source = read("app/components/CelestialDeepSpaceV591.tsx");
    expect(source).toContain('admitted ? "admitted-presentation-only" : "asset-blocked"');
    expect(source).toContain("V591_ADMITTED_NEBULA_IDS.length");
    expect(source).toContain("V591_BLOCKED_NEBULA_IDS.length");
    expect(source).toContain("selectNebulaImpostorIdsV591");
    expect(source).toContain("atlasV591NebulaRequestedImpostorCount");
    expect(source).toContain("atlasV591NebulaRuntimeBlockedImpostorCount");
    expect(source).toContain("readyImpostorCount");
    expect(source).toContain("atlasNoSyntheticReplacement: true");
    expect(source).toContain("484-of-484-within-1.5deg");
    expect(source).toContain("atlasPresentationOnly: true");
    expect(source).toContain("atlasPacketVersion");
    expect(source).toContain("atlasRenderedAnchorCount");
    expect(source).toContain("atlasSdf: true");
    expect(source).not.toContain("<span\n            data-atlas-v591-constellation-label");
  });
});
