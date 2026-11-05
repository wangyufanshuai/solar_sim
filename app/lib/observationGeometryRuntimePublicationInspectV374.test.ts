import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseObservationGeometryRuntimePublicationInspectV374 } from "./observationGeometryRuntimePublicationInspectV374";

describe("v374 observation geometry runtime publication inspect", () => {
  it("reports all nine inputs missing without consuming publication authority", () => {
    const artifact = parseObservationGeometryRuntimePublicationInspectV374(
      JSON.parse(
        readFileSync(
          "dist/science/observation-geometry-v374/inspect.json",
          "utf8",
        ),
      ),
    );
    expect(artifact).toMatchObject({
      status: "blocked-publication-inputs-unavailable",
      presentInputCount: 0,
      publicationControllerImplemented: true,
      publicationExecuted: false,
      runtimeGeometryPublished: false,
      measuredAuthorityAvailable: false,
      measuredExpectationAvailable: false,
      attemptConsumed: false,
      networkAttempted: false,
      automaticPromotionAllowed: false,
    });
    expect(artifact.missingInputs).toHaveLength(9);
  });
});
