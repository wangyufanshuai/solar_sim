import { describe, expect, it } from "vitest";
import { createAtlasVisualRuntimeMatrixV362 } from "./atlasVisualRuntimeMatrixV362";

describe("v362 visual runtime matrix", () => {
  it("covers five frozen/candidate profiles across all eight groups", () => {
    const matrix = createAtlasVisualRuntimeMatrixV362();
    expect(matrix).toMatchObject({
      version: "v362-v5-v6-v7-v8-v9-runtime-consumption-matrix-v1",
      rowCount: 40,
      allGroupsCovered: true,
      allProfilesCovered: true,
      resolverReferenceStable: true,
      scienceFieldsEquivalent: true,
      cinematicFieldsPairwiseDistinct: true,
      v9Direction: "instrument-lab-uncertainty-observatory",
    });
    expect(matrix.instrumentLabTokenSignature).toMatch(/^[a-f0-9]{8}$/);
    expect(matrix.rows.every((row) => row.signatureMatches && row.resolverReferenceStable)).toBe(true);
  });
});
