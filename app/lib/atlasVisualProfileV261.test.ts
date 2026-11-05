import { describe, expect, it } from "vitest";
import { atlasRuntimeStore } from "./atlasRuntimeStore";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V261,
  ATLAS_VISUAL_PROFILE_LEGACY_V261,
  createAtlasVisualCandidateSummaryV261,
} from "./atlasVisualProfileV261";

describe("v261 Science Cinematic local A/B", () => {
  it("keeps Legacy V9 as the default and candidate non-promoted", () => {
    const summary = createAtlasVisualCandidateSummaryV261();
    expect(summary.active).toBe(ATLAS_VISUAL_PROFILE_LEGACY_V261);
    expect(summary.candidateAppliedAsDefault).toBe(false);
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.kerrScienceMutation).toBe("not-applied");
    expect(summary.launchDynamicsMutation).toBe("not-applied");
  });

  it("switches visual-only profile without sceneRevision or panel mutation", () => {
    const before = atlasRuntimeStore.getSnapshot();
    atlasRuntimeStore.setVisualProfile(ATLAS_VISUAL_PROFILE_CANDIDATE_V261);
    const candidate = atlasRuntimeStore.getSnapshot();
    expect(candidate.visualProfile).toBe(ATLAS_VISUAL_PROFILE_CANDIDATE_V261);
    expect(candidate.sceneRevision).toBe(before.sceneRevision);
    expect(candidate.panels).toBe(before.panels);
    atlasRuntimeStore.setVisualProfile(ATLAS_VISUAL_PROFILE_LEGACY_V261);
  });
});
