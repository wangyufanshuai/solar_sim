import { describe, expect, it } from "vitest";
import { acquireAtlasResource, diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import { describeMainlineAR65SceneActivityV645, evaluateMainlineAR65SceneActivityV645 } from "./mainlineAR65SceneActivityV645";

describe("R65 mounted-scene resource activity", () => {
  it("does not mistake focus and subscription churn for loaded scene content", () => {
    const baseline = getAtlasResourceSnapshot();
    const releaseCamera = acquireAtlasResource("camera-lock", "atlas", "focus-request", { owner: "camera-presentation" });
    const releaseSubscription = acquireAtlasResource("subscription", "atlas", "viewport-listener", { owner: "camera-presentation" });
    try {
      const active = getAtlasResourceSnapshot();
      const result = evaluateMainlineAR65SceneActivityV645(baseline, active);
      expect(result.status).toBe("renderable-resource-missing");
      expect(result.acquiredCount).toBe(2);
      expect(result.renderableCount).toBe(0);
      expect(describeMainlineAR65SceneActivityV645(result)).toContain("相机锁");
    } finally {
      releaseSubscription();
      releaseCamera();
    }
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe("baseline");
  });

  it("counts byte-backed render resources and requires their release", () => {
    const baseline = getAtlasResourceSnapshot();
    const releaseGeometry = acquireAtlasResource("model", "atlas", "canonical-nebula-geometry", {
      owner: "mainline-a-nebula-observation-plane", estimatedBytes: 512,
    });
    const releaseTexture = acquireAtlasResource("texture", "atlas", "canonical-nebula-image", {
      owner: "mainline-a-nebula-scene-v607", estimatedBytes: 4096, contentSha256: "a".repeat(64),
    });
    try {
      const active = getAtlasResourceSnapshot();
      const result = evaluateMainlineAR65SceneActivityV645(baseline, active);
      expect(result.status).toBe("ready");
      expect(result.renderableCount).toBe(2);
      expect(result.renderableEstimatedBytes).toBe(4608);
      expect(result.owners).toEqual(["mainline-a-nebula-observation-plane", "mainline-a-nebula-scene-v607"]);
      expect(result.growth.some((entry) => entry.kind === "texture" && entry.contentSha256 === "a".repeat(64))).toBe(true);
    } finally {
      releaseTexture();
      releaseGeometry();
    }
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe("baseline");
  });

  it("rejects revision-only, release-only and zero-byte rendering changes", () => {
    const initial = getAtlasResourceSnapshot();
    const releaseExisting = acquireAtlasResource("texture", "atlas", "existing-image", { estimatedBytes: 256 });
    const baseline = getAtlasResourceSnapshot();
    releaseExisting();
    expect(evaluateMainlineAR65SceneActivityV645(baseline, getAtlasResourceSnapshot()).status).toBe("no-new-resource");
    const releaseEmpty = acquireAtlasResource("model", "atlas", "empty-geometry", { estimatedBytes: 0 });
    try {
      expect(evaluateMainlineAR65SceneActivityV645(initial, getAtlasResourceSnapshot()).status).toBe("renderable-resource-missing");
    } finally {
      releaseEmpty();
    }
    expect(diffAtlasResourceSnapshotsV300(initial, getAtlasResourceSnapshot()).status).toBe("baseline");
  });
});
