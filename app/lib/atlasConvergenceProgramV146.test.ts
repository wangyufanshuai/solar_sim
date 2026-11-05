import { describe, expect, it } from "vitest";
import { createAtlasConvergenceProgramV146Summary } from "./atlasConvergenceProgramV146";

describe("v141-v146 convergence release train", () => {
  it("keeps large catalogs optional and science fail closed", () => {
    const summary = createAtlasConvergenceProgramV146Summary();
    expect(summary.millionPackPolicy).toContain("optional");
    expect(summary.defaultScientificKernel).toBe("legacy-eih-1pn");
    expect(summary.boundary).toContain("v75/v97/v99");
  });
});
