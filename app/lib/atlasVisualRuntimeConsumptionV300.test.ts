import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300 } from "./atlasVisualProfileV299";
import {
  ATLAS_VISUAL_RUNTIME_GROUPS_V300,
  createAtlasVisualTokenSignatureV300,
  getAtlasVisualRuntimeConsumptionSnapshotV300,
  registerAtlasVisualRuntimeConsumerV300,
  resolveAtlasExpectedVisualTokenSignatureV300,
  resetAtlasVisualRuntimeConsumptionForTestsV300,
} from "./atlasVisualRuntimeConsumptionV300";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("v300 visual runtime consumption audit", () => {
  beforeEach(() => resetAtlasVisualRuntimeConsumptionForTestsV300());

  it("produces stable content signatures independent of object key order", () => {
    expect(createAtlasVisualTokenSignatureV300({ a: 1, b: [2, "x"] }))
      .toBe(createAtlasVisualTokenSignatureV300({ b: [2, "x"], a: 1 }));
    expect(createAtlasVisualTokenSignatureV300({ a: 1 }))
      .not.toBe(createAtlasVisualTokenSignatureV300({ a: 2 }));
  });

  it("records all eight groups per profile while active release remains idempotent", () => {
    const releases = ATLAS_VISUAL_RUNTIME_GROUPS_V300.map((group) => registerAtlasVisualRuntimeConsumerV300({
      profile: ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
      group,
      consumer: `fixture-${group}`,
      tokenSignature: resolveAtlasExpectedVisualTokenSignatureV300(ATLAS_VISUAL_PROFILE_CANDIDATE_V300, group),
    }));
    expect(getAtlasVisualRuntimeConsumptionSnapshotV300()).toMatchObject({
      activeConsumerCount: 8,
      signaturePolicy: "resolved-profile-exact-v300",
      completeProfiles: [ATLAS_VISUAL_PROFILE_CANDIDATE_V300],
      fieldCoverageVersion: "v316-visual-token-field-audit-v1",
      fieldCoverageStatus: "field-complete-static-consumer-contract",
      requiredTokenFieldCount: 46,
      declaredTokenFieldCount: 46,
    });
    expect(getAtlasVisualRuntimeConsumptionSnapshotV300().observedByProfile[ATLAS_VISUAL_PROFILE_CANDIDATE_V300]).toHaveLength(8);
    for (const release of releases) {
      release();
      release();
    }
    const released = getAtlasVisualRuntimeConsumptionSnapshotV300();
    expect(released.activeConsumerCount).toBe(0);
    expect(released.activeGroups).toEqual([]);
    expect(released.completeProfiles).toEqual([ATLAS_VISUAL_PROFILE_CANDIDATE_V300]);
  });

  it("keeps observed coverage isolated across profile switches", () => {
    const releaseV5 = registerAtlasVisualRuntimeConsumerV300({
      profile: ATLAS_VISUAL_PROFILE_CANDIDATE_V299,
      group: "sky",
      consumer: "v5-sky",
      tokenSignature: resolveAtlasExpectedVisualTokenSignatureV300(ATLAS_VISUAL_PROFILE_CANDIDATE_V299, "sky"),
    });
    const releaseV6 = registerAtlasVisualRuntimeConsumerV300({
      profile: ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
      group: "sky",
      consumer: "v6-sky",
      tokenSignature: resolveAtlasExpectedVisualTokenSignatureV300(ATLAS_VISUAL_PROFILE_CANDIDATE_V300, "sky"),
    });
    const snapshot = getAtlasVisualRuntimeConsumptionSnapshotV300();
    expect(snapshot.observedByProfile[ATLAS_VISUAL_PROFILE_CANDIDATE_V299]).toEqual(["sky"]);
    expect(snapshot.observedByProfile[ATLAS_VISUAL_PROFILE_CANDIDATE_V300]).toEqual(["sky"]);
    expect(snapshot.completeProfiles).toEqual([]);
    releaseV5();
    releaseV6();
  });

  it("is wired into concrete consumers that also read their visual tokens", () => {
    const consumers = [
      ["app/components/GalaxyEnvironmentSphere.tsx", 'group: "sky"', "visualRendererProfile.groups.sky"],
      ["app/components/Planet.tsx", 'group: "solar"', "visualRendererProfile.groups.solar"],
      ["app/components/GaiaStarField.tsx", 'group: "catalog"', "visualRendererProfile.groups.catalog"],
      ["app/components/UniversePmndrsPostProcessing.tsx", 'group: "postFx"', "visualProfile.groups.postFx"],
      ["app/components/KerrBlackHole.tsx", 'group: "strongGravity"', "visualRendererProfile.runtimeTokens.strongGravity"],
      ["app/components/LaunchSceneView.tsx", 'group: "launch"', "visualRendererProfile.runtimeTokens.launch"],
      ["app/components/ExoplanetSystemScene.tsx", 'group: "exoplanet"', "visualRendererProfile.runtimeTokens.exoplanet"],
      ["app/components/ScienceCinematicVisualSurfaceV261.tsx", 'group: "hud"', "rendererProfile.runtimeTokens.hud"],
    ] as const;
    for (const [path, groupMarker, tokenRead] of consumers) {
      const source = read(path);
      expect(source).toContain("useAtlasVisualRuntimeConsumerV300");
      expect(source).toContain(groupMarker);
      expect(source).toContain(tokenRead);
    }
  });

  it("rejects malformed consumer identities and signatures", () => {
    expect(() => registerAtlasVisualRuntimeConsumerV300({
      profile: ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
      group: "sky",
      consumer: "",
      tokenSignature: "not-a-signature",
    })).toThrow("invalid v300 visual runtime consumer");
    expect(() => registerAtlasVisualRuntimeConsumerV300({
      profile: ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
      group: "sky",
      consumer: "wrong-v6-sky",
      tokenSignature: "00000000",
    })).toThrow("invalid v300 visual runtime consumer");
  });
});
