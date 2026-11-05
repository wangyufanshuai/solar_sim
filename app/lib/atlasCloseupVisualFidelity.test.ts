import { describe, expect, it } from "vitest";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import type { PlanetTextureManifestEntry } from "../data/planetTextureManifest";
import {
  ATLAS_CLOSEUP_ASSET_POLICY,
  ATLAS_CLOSEUP_VISUAL_BOUNDARY,
  ATLAS_CLOSEUP_VISUAL_FIDELITY_VERSION,
  V76_CLOSEUP_REQUIRED_TEXTURES,
  V76_CLOSEUP_VISUAL_BUDGETS,
  V76_CLOSEUP_VISUAL_PROFILE_IDS,
  auditedCloseupTextureManifestForBodyId,
  createAtlasCloseupVisualFidelitySummary,
  isLocalPlanetTextureUrl,
} from "./atlasCloseupVisualFidelity";

describe("v76 close-up visual fidelity contract", () => {
  it("returns deterministic v76 metadata without physics, sky or Kerr mutations", () => {
    const summary = createAtlasCloseupVisualFidelitySummary();

    expect(summary).toMatchObject({
      version: ATLAS_CLOSEUP_VISUAL_FIDELITY_VERSION,
      status: "informational",
      assetPolicy: ATLAS_CLOSEUP_ASSET_POLICY,
      backgroundOrbitArtVersion: "v69-legacy-8k-sky-restore",
      backgroundGuardVersion: "v71-background-regression-guard",
      materialProfileVersion: "v72-material-profile-contract",
      physicsBenchmarkGateVersion: "v75-physics-benchmark-release-gate",
      visualTarget: "earth-saturn-sun-jupiter-closeup-fidelity",
      textureSourcePolicy: "local-hd-v49-v55-solarsystemscope-cc-by-4",
      runtimeAssetPolicy: "local-public-textures-only",
      protectedSkyManifest: "orbit-atlas-v9",
      skyAssetMutation: "not-applied",
      physicsMutation: "not-applied",
      kerrKernelMutation: "not-applied",
      runtimeCertificationStatus: "not-claimed-in-app",
      artisticCertificationStatus: "not-claimed",
      scientificCertificationStatus: "not-claimed",
      wcagCertificationStatus: "not-claimed",
      onlineAssetCompletenessStatus: "not-claimed",
      fullReleaseGateStatus: "product-ready-scientific-horizons-blocked",
      trustedBoundary: ATLAS_CLOSEUP_VISUAL_BOUNDARY,
    });
    expect(summary.auditedTextureFamilies).toEqual([
      "public/textures/planets/hd",
      "public/textures/planets/v49",
      "public/textures/planets/v55",
      "scripts/fetch-planet-textures-8k.mjs Solar System Scope CC BY 4.0",
    ]);
    expect(summary.trustedBoundary).toContain("v69/v71 orbit-atlas-v9 sky direction remains locked");
    expect(summary.trustedBoundary).toContain("strict Horizons scientific certification remains blocked");
  });

  it("locks body profile ids and key close-up visual budgets", () => {
    expect(V76_CLOSEUP_VISUAL_PROFILE_IDS).toEqual({
      earth: "earth-v76-hd-cloud-night-terminator",
      saturn: "saturn-v76-cassini-ring-occlusion",
      sun: "sun-v76-limb-granulation-bloom-restraint",
      jupiter: "jupiter-v76-band-microcontrast",
    });
    expect(V76_CLOSEUP_VISUAL_BUDGETS.earth).toMatchObject({
      nightLayerOpacity: 0.31,
      cloudOpacity: 0.39,
      atmosphereIntensity: 0.2,
    });
    expect(V76_CLOSEUP_VISUAL_BUDGETS.saturn.ringShadowContribution).toBe(1.78);
    expect(V76_CLOSEUP_VISUAL_BUDGETS.sun.exposure).toBe(0.68);
    expect(V76_CLOSEUP_VISUAL_BUDGETS.jupiter.bandMaskOpacity).toBe(0.46);
  });

  it("keeps v69/v71 sky manifest lock unchanged", () => {
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
    expect(ORBIT_ATLAS_V9_SKY.desktopBase).toBe("/textures/sky/orbit-atlas-v9-base-8k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.mobileBase).toBe("/textures/sky/orbit-atlas-v9-base-4k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.desktopStars).toBe("/textures/sky/orbit-atlas-v9-stars-4k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.mobileStars).toBe("/textures/sky/orbit-atlas-v9-stars-2k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.dustMask).toBe("/textures/sky/orbit-atlas-v9-dust-2k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.rotation).toEqual([-0.34, 4.24, -0.86]);
  });

  it("enumerates required local HD/v49 close-up planet texture manifests", () => {
    const bodies = ["earth", "saturn", "sun", "jupiter"] as const;

    for (const bodyId of bodies) {
      const manifest = auditedCloseupTextureManifestForBodyId(bodyId);
      const flat = { ...manifest.hd, ...manifest.v49 } as Record<string, string | undefined>;
      for (const requiredPath of V76_CLOSEUP_REQUIRED_TEXTURES[bodyId]) {
        const [family, key] = requiredPath.split(".") as ["hd" | "v49", keyof PlanetTextureManifestEntry];
        expect(manifest[family][key], `${bodyId} ${requiredPath}`).toBeDefined();
        expect(isLocalPlanetTextureUrl(manifest[family][key]), `${bodyId} ${requiredPath}`).toBe(true);
      }
      for (const url of Object.values(flat)) {
        if (!url) continue;
        expect(isLocalPlanetTextureUrl(url)).toBe(true);
        expect(url.startsWith("http")).toBe(false);
      }
    }
  });
});
