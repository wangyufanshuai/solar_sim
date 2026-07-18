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
});
