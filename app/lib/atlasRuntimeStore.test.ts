import { describe, expect, it } from "vitest";
import { atlasRuntimeStore } from "./atlasRuntimeStore";

describe("v131 external runtime store", () => {
  it("keeps experience mode outside scene revision and enters research for research panels", () => {
    atlasRuntimeStore.setExperienceMode("explore");
    const before = atlasRuntimeStore.getSnapshot().sceneRevision;
    atlasRuntimeStore.setExperienceMode("research");
    expect(atlasRuntimeStore.getSnapshot().experienceMode).toBe("research");
    expect(atlasRuntimeStore.getSnapshot().sceneRevision).toBe(before);
    atlasRuntimeStore.setExperienceMode("explore");
    atlasRuntimeStore.openPanel("relativity-observables");
    expect(atlasRuntimeStore.getSnapshot().experienceMode).toBe("research");
    atlasRuntimeStore.setExperienceMode("explore");
    expect(atlasRuntimeStore.getSnapshot().panels.sessions["relativity-observables"].isOpen).toBe(false);
    expect(atlasRuntimeStore.getSnapshot().sceneRevision).toBe(before);
  });

  it("increments scene revision only when the scene changes", () => {
    atlasRuntimeStore.setSceneMode("atlas");
    const before = atlasRuntimeStore.getSnapshot().sceneRevision;
    atlasRuntimeStore.setSceneMode("inspect");
    const changed = atlasRuntimeStore.getSnapshot().sceneRevision;
    atlasRuntimeStore.setSceneMode("inspect");
    expect(changed).toBe(before + 1);
    expect(atlasRuntimeStore.getSnapshot().sceneRevision).toBe(changed);
  });

  it("notifies selector subscribers only when their field changes", () => {
    atlasRuntimeStore.setSelectedObject("");
    let notifications = 0;
    const unsubscribe = atlasRuntimeStore.subscribeSelector(
      (snapshot) => snapshot.selectedObjectId,
      () => { notifications += 1; },
    );
    atlasRuntimeStore.setQualityTier("closeup-inspect");
    atlasRuntimeStore.setSelectedObject("sirius");
    atlasRuntimeStore.setSelectedObject("sirius");
    unsubscribe();
    expect(notifications).toBe(1);
  });

  it("coordinates one research overlay without mutating scene revision", () => {
    atlasRuntimeStore.setExperienceMode("explore");
    const before = atlasRuntimeStore.getSnapshot().sceneRevision;
    atlasRuntimeStore.openResearchOverlay("observing-planner");
    expect(atlasRuntimeStore.getSnapshot()).toMatchObject({
      experienceMode: "research",
      researchOverlay: "observing-planner",
    });
    atlasRuntimeStore.setObserverPresentation({
      enabled: true,
      targetId: "nearby-star:vega",
      widthDeg: 1.6,
      heightDeg: 1.1,
      rotationDeg: 15,
    });
    atlasRuntimeStore.openResearchOverlay("gaia-analysis");
    expect(atlasRuntimeStore.getSnapshot().researchOverlay).toBe("gaia-analysis");
    atlasRuntimeStore.closeResearchOverlay("observing-planner");
    expect(atlasRuntimeStore.getSnapshot().researchOverlay).toBe("gaia-analysis");
    atlasRuntimeStore.closeResearchOverlay("gaia-analysis");
    expect(atlasRuntimeStore.getSnapshot().observerPresentation.enabled).toBe(false);
    expect(atlasRuntimeStore.getSnapshot().sceneRevision).toBe(before);
  });

  it("advances adjacent scale journey steps without rebuilding the scene", () => {
    atlasRuntimeStore.setScaleBand("solar");
    atlasRuntimeStore.setSelectedObject("earth");
    const before = atlasRuntimeStore.getSnapshot().sceneRevision;
    const journey = atlasRuntimeStore.requestScaleJourney("local-group", 100);
    expect(journey.route).toEqual(["solar", "stellar", "galactic", "local-group"]);
    atlasRuntimeStore.completeScaleJourneyStep(journey.requestId - 1, 1_000);
    expect(atlasRuntimeStore.getSnapshot().scaleBand).toBe("solar");
    atlasRuntimeStore.completeScaleJourneyStep(journey.requestId, 1_000);
    expect(atlasRuntimeStore.getSnapshot().scaleBand).toBe("stellar");
    expect(atlasRuntimeStore.getSnapshot().scaleJourney.to).toBe("galactic");
    expect(atlasRuntimeStore.getSnapshot().sceneRevision).toBe(before);
    atlasRuntimeStore.cancelScaleJourney();
  });
});
