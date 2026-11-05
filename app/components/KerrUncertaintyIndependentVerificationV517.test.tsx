import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrUncertaintyIndependentVerificationV517.tsx",
  "utf8",
);

describe("v517 independent verification surface", () => {
  it("renders independent recomputation and mismatch fields", () => {
    expect(source).toContain('data-atlas-v517-recomputed-witness-count="512"');
    expect(source).toContain('data-atlas-v517-matched-checkpoint-count="8"');
    expect(source).toContain('data-atlas-v517-imported-v516-parser="false"');
    expect(source).toContain("summary.verification.witnessMismatchCount");
    expect(source).toContain("summary.verification.boundaryViolationCount");
  });

  it("creates no science rendering resources", () => {
    expect(source).toContain('data-atlas-v517-scientific-mutation="false"');
    expect(source).toContain('data-atlas-v517-canvas-created="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("createObjectURL");
  });
});
