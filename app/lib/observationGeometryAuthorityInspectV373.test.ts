import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseObservationGeometryAuthorityInspectV373 } from "./observationGeometryAuthorityInspectV373";

describe("v373 observation geometry authority inspect", () => {
  it("reports seven missing inputs without consuming admission authority", () => {
    const artifact = parseObservationGeometryAuthorityInspectV373(
      JSON.parse(
        readFileSync(
          "dist/science/observation-geometry-v373/inspect.json",
          "utf8",
        ),
      ),
    );
    expect(artifact).toMatchObject({
      status: "blocked-admission-inputs-unavailable",
      presentInputCount: 0,
      admissionControllerImplemented: true,
      admissionExecuted: false,
      authorityPointerPublished: false,
      runtimeGeometryPublished: false,
      measuredAuthorityGranted: false,
      attemptConsumed: false,
      networkAttempted: false,
      automaticPromotionAllowed: false,
    });
    expect(artifact.missingInputs).toHaveLength(7);
  });
});
