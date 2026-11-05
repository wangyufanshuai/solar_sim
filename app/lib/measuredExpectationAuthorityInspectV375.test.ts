import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseMeasuredExpectationAuthorityInspectV375 } from "./measuredExpectationAuthorityInspectV375";

describe("v375 measured expectation authority inspect", () => {
  it("records the qualified photon input and seven missing authority inputs", () => {
    const artifact = parseMeasuredExpectationAuthorityInspectV375(
      JSON.parse(
        readFileSync(
          "dist/science/measured-expectation-v375/inspect.json",
          "utf8",
        ),
      ),
    );
    expect(artifact).toMatchObject({
      status: "blocked-dual-authority-inputs-unavailable",
      presentInputCount: 1,
      photonInputQualified: true,
      detectorAuthorityQualified: false,
      geometryAuthorityQualified: false,
      measuredExpectationAvailable: false,
      expectationRowCount: 0,
      buildExecuted: false,
      attemptConsumed: false,
      networkAttempted: false,
    });
    expect(artifact.missingInputs).toHaveLength(7);
    expect(artifact.missingInputs).not.toContain("v328-photon-radiance");
  });
});
