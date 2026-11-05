import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createKerrUncertaintyIndependentVerificationSummaryV517 } from "./kerrUncertaintyIndependentVerificationV517";
import {
  compareKerrProvenanceConstellationEncodingsV518,
  createKerrProvenanceConstellationEncodingV518,
  resolveKerrProvenanceConstellationProfileV518,
} from "./kerrProvenanceConstellationV518";

const receipt = JSON.parse(
  readFileSync(
    "dist/science/kerr-uncertainty-independent-verification-v517/verification-receipt.json",
    "utf8",
  ),
);
const summary = createKerrUncertaintyIndependentVerificationSummaryV517(receipt);

describe("v518 Science Cinematic V7.2 provenance constellation", () => {
  it("uses stable cached profile references with a strict Science boundary", () => {
    const science = resolveKerrProvenanceConstellationProfileV518("science");
    const cinematic = resolveKerrProvenanceConstellationProfileV518("cinematic");
    expect(resolveKerrProvenanceConstellationProfileV518("science")).toBe(science);
    expect(resolveKerrProvenanceConstellationProfileV518("cinematic")).toBe(cinematic);
    expect(science.scienceBoundary).toMatchObject({
      linearDisplay: true,
      bloomIntensity: 0,
      colorGradeIntensity: 0,
      animated: false,
      numericScientificStyleInputCount: 0,
      scientificFieldMutation: false,
    });
    expect(cinematic.cinematicSeed).toBe(
      "orbit-atlas-v518-provenance-constellation-seed-01",
    );
  });

  it("keeps the same eight-node geometry and scientific identity in both modes", () => {
    const science = createKerrProvenanceConstellationEncodingV518(summary, "science");
    const cinematic = createKerrProvenanceConstellationEncodingV518(summary, "cinematic");
    expect(science.nodes).toHaveLength(8);
    expect(science.edges).toHaveLength(7);
    expect(compareKerrProvenanceConstellationEncodingsV518(science, cinematic)).toEqual({
      scientificPayloadStable: true,
      geometryStable: true,
      witnessCountStable: true,
      checkpointCountStable: true,
      numericScientificStyleInputCount: 0,
      hashDrivenStyleCount: 0,
      uncertaintyDrivenStyleCount: 0,
      scientificFieldMutation: false,
    });
  });
});
