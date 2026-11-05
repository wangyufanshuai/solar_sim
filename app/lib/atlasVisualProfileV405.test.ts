import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { atlasRuntimeStore } from "./atlasRuntimeStore";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V400, ATLAS_VISUAL_PROFILE_CANDIDATE_V405, resolveAtlasInitialVisualProfileV299, resolveAtlasVisualProfileV299 } from "./atlasVisualProfileV299";

const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
describe("Science Cinematic V13 Evidence Observatory", () => {
  it("freezes V12 and exposes a stable V13 token consumer", () => {
    const v12 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V400);
    const v13 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V405);
    const qualification = JSON.parse(readFileSync("dist/science/atlas-evidence-observatory-v405/qualification.json", "utf8"));
    expect(digest(v12)).toBe("55fadd945552dd26918eb1f4334e7cd7d015721a905d773ddda87d14cc2ac58c");
    expect(digest(v13)).toBe(qualification.source.v13ProfileSha256);
    expect(resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V405)).toBe(v13);
    expect(v13).toMatchObject({ id: "science-cinematic-v13-v405", v12TokensApplied: false, v13TokensApplied: true, localShadowDefaultEligible: false, defaultApplied: false });
    expect(v13.runtimeTokens.hud.evidenceObservatoryV13).toMatchObject({ lineageTraceOpacity: 0.72, checksumRailOpacity: 0.64, detailSeed: 405 });
  });
  it("keeps V13 local-shadow manual-only without sceneRevision drift", () => {
    expect(resolveAtlasInitialVisualProfileV299({ build: "formal" }).v13EvidenceObservatoryManualAbAvailable).toBe(false);
    expect(resolveAtlasInitialVisualProfileV299({ build: "standalone-full" }).v13EvidenceObservatoryManualAbAvailable).toBe(false);
    expect(resolveAtlasInitialVisualProfileV299({ build: "vercel-lite" }).v13EvidenceObservatoryManualAbAvailable).toBe(false);
    expect(resolveAtlasInitialVisualProfileV299({ build: "local-shadow" })).toMatchObject({ profile: "legacy-v9", v13EvidenceObservatoryManualAbAvailable: true, localShadowDefaultApplied: false });
    const before = atlasRuntimeStore.getSnapshot(); atlasRuntimeStore.setVisualProfile(ATLAS_VISUAL_PROFILE_CANDIDATE_V405); const after = atlasRuntimeStore.getSnapshot(); atlasRuntimeStore.setVisualProfile("legacy-v9");
    expect(after.sceneRevision).toBe(before.sceneRevision);
  });
});
