import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseObservationGeometryValidationInspectV372 } from "./observationGeometryValidationInspectV372";

describe("v372 observation geometry validation inspect", () => {
  it("reports all six inputs missing without consuming validation authority", () => {
    const artifact = parseObservationGeometryValidationInspectV372(
      JSON.parse(
        readFileSync(
          "dist/science/observation-geometry-v372/inspect.json",
          "utf8",
        ),
      ),
    );
    expect(artifact).toMatchObject({
      status: "blocked-validation-inputs-unavailable",
      presentInputCount: 0,
      validatorImplemented: true,
      validationExecuted: false,
      measuredValidationQualified: false,
      runtimeGeometryPublished: false,
      measuredAuthorityGranted: false,
      attemptConsumed: false,
      networkAttempted: false,
    });
    expect(artifact.missingInputs).toHaveLength(6);
  });

  it("keeps validation explicit, non-networked and separate from runtime publication", () => {
    const source = readFileSync(
      "scripts/validate-observation-geometry-v372.ts",
      "utf8",
    );
    expect(source).toContain("v372-refuse-overwrite-existing-validation");
    expect(source).toContain("validateObservationGeometryIndependentlyV372");
    expect(source).not.toContain(
      "dist/staging/detector-calibration-v369/observation-geometry.json",
    );
    expect(source).not.toContain("fetch(");
  });
});
