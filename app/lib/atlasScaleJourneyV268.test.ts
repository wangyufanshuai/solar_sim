import { describe, expect, it } from "vitest";
import { advanceAtlasScaleJourneyV268, atlasScaleObjectAvailabilityV273, createAtlasScaleJourneyV268, createAtlasScaleRouteV268 } from "./atlasScaleJourneyV268";
import { ATLAS_SCALE_ORBIT_LIMITS_V273, createAtlasScaleLayerSnapshotV273 } from "./atlasScalePresentationV273";

describe("v268 continuous scale journey", () => {
  it("routes only through adjacent independent scale bands", () => {
    expect(createAtlasScaleRouteV268("solar", "near-universe")).toEqual(["solar", "stellar", "galactic", "local-group", "near-universe"]);
    expect(createAtlasScaleRouteV268("local-group", "stellar")).toEqual(["local-group", "galactic", "stellar"]);
  });

  it("isolates stale journeys and preserves an honest position boundary", () => {
    const journey = createAtlasScaleJourneyV268({ requestId: 7, from: "solar", to: "near-universe", selectedObjectId: "earth", returnPath: [], requestedAtMs: 10 });
    expect(journey).toMatchObject({ from: "solar", to: "stellar", positionStatus: "position-unavailable", publicDeploymentBlocked: true });
    const next = advanceAtlasScaleJourneyV268(journey, 910);
    expect(next).toMatchObject({ from: "stellar", to: "galactic", stepIndex: 1 });
    expect(next.requestId).toBe(7);
  });

  it("retains the passport after arrival without inventing unavailable coordinates", () => {
    let journey = createAtlasScaleJourneyV268({ requestId: 8, from: "galactic", to: "near-universe", selectedObjectId: "ngc224", returnPath: ["solar"], requestedAtMs: 10, reducedMotion: true });
    expect(journey.positionStatus).toBe("angular-shell-only");
    journey = advanceAtlasScaleJourneyV268(journey, 10);
    journey = advanceAtlasScaleJourneyV268(journey, 10);
    expect(journey.lifecycle).toBe("idle");
    expect(journey.selectedObjectId).toBe("ngc224");
    expect(journey.positionStatus).toBe("angular-shell-only");
    expect(journey.publicDeploymentBlocked).toBe(true);
    expect(atlasScaleObjectAvailabilityV273("earth", "near-universe")).toBe("position-unavailable");
  });

  it("allows every declared camera target and exposes mutually exclusive layer opacity", () => {
    expect(ATLAS_SCALE_ORBIT_LIMITS_V273.galactic.maxDistance).toBeGreaterThanOrEqual(4_500);
    expect(ATLAS_SCALE_ORBIT_LIMITS_V273["local-group"].maxDistance).toBeGreaterThanOrEqual(9_000);
    expect(ATLAS_SCALE_ORBIT_LIMITS_V273["near-universe"].maxDistance).toBeGreaterThanOrEqual(15_000);
    const idle = advanceAtlasScaleJourneyV268(createAtlasScaleJourneyV268({ requestId: 9, from: "solar", to: "stellar", selectedObjectId: "", returnPath: [], requestedAtMs: 0, reducedMotion: true }), 0);
    const snapshot = createAtlasScaleLayerSnapshotV273("stellar", idle);
    expect(snapshot.opacities.stellar).toBe(1);
    expect(snapshot.opacities.solar).toBe(0);
  });
});
