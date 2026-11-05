import { describe, expect, it } from "vitest";
import { loadAtlasRelativityEvidenceSnapshotV338 } from "./relativityEvidenceServerV338";
import { createRelativityWorkbenchEvidenceModelV338, parseRelativityEvidenceResponseV338 } from "./relativityWorkbenchEvidenceV338";

describe("v338 workbench evidence adapter", () => {
  it("surfaces v336 state replay and v337 buffer integrity as separate bounded rows", async () => {
    const snapshot = await loadAtlasRelativityEvidenceSnapshotV338();
    const model = createRelativityWorkbenchEvidenceModelV338(snapshot);
    expect(snapshot.status).toBe("ready");
    expect(snapshot.current.v336).toMatchObject({ status: "runtime-profile-state-replay-qualified-browser-pending", sequence: ["legacy-v9", "science-cinematic-v5-v299", "science-cinematic-v6-v300", "legacy-v9"], transitionCount: 3, sceneRevisionDelta: 0, stateInvariantsStable: true, cameraLeaseBaseline: true, singleCanvasStable: true, resolverReferencesStable: true });
    expect(snapshot.current.v337).toMatchObject({ status: "science-cinematic-buffer-replay-qualified-browser-pending", sampleCount: 16, classificationCounts: { capture: 6, escape: 6, diskHit: 4 }, scientificBufferFieldCount: 67, allScientificBuffersByteIdentical: true, scienceOutputProfileInvariant: true, cinematicOutputDeterministic: true, cinematicProfileOutputsDistinct: true, scienceAndCinematicBuffersDisjoint: true });
    expect(model.currentRows.filter((row) => row.id === "v336" || row.id === "v337")).toHaveLength(2);
    expect(model.currentRows.find((row) => row.id === "v336")?.metric).toContain("sceneRevision Δ0");
    expect(model.currentRows.find((row) => row.id === "v337")?.metric).toContain("67 fields");
    expect(model.campaignProgress).toMatchObject({ completed: 0, planned: 49, nextShardIndex: 0 });
    expect(parseRelativityEvidenceResponseV338({ version: "v338-relativity-evidence-response", available: true, reason: "ready", snapshot }).snapshot?.current.v337.sampleCount).toBe(16);
  });
});
