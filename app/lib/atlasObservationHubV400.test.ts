import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAtlasObservationHubQualificationV400 } from "./atlasObservationHubV400";

describe("v400 observation hub qualification", () => {
  it("parses only the static-qualified browser-pending artifact", () => {
    const artifact = JSON.parse(readFileSync("dist/science/atlas-observation-hub-v400/hub-qualification.json", "utf8"));
    expect(parseAtlasObservationHubQualificationV400(artifact)).toBe(artifact);
    expect(artifact.profile).toMatchObject({ id: "science-cinematic-v12-v400", v11Frozen: true, scienceExposure: 1, scienceBloom: 0, scienceNoise: 0, localShadowManualOnly: true, defaultApplied: false });
    expect(artifact.hub).toMatchObject({ stageCount: 4, maximumMountedStageCount: 1, directResourceTelemetry: true, reactStateUsedForResourceTelemetry: false, canvasCreated: false, sceneRevisionMutation: false, physicsMutation: false, scienceBufferMutation: false, cinematicBufferMutation: false });
  });

  it("retains every heavy qualification as not-run", () => {
    const artifact = JSON.parse(readFileSync("dist/science/atlas-observation-hub-v400/hub-qualification.json", "utf8"));
    expect(artifact.runtimeBoundary).toMatchObject({ formalProductPointer: "v263", ordinaryStandaloneProfile: "legacy-v9", liteProfile: "legacy-v9", localShadowDefaultProfile: "legacy-v9", localShadowV12ManualAvailable: true, denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run", visualMatrixQualification: "not-run", soakQualification: "not-run", rtxWebGpuQualification: "not-run" });
  });
});
