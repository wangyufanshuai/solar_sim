import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrUncertaintyReplayWitnessV516.tsx",
  "utf8",
);

describe("v516 replay witness surface", () => {
  it("renders the witness, checkpoint and mismatch truth fields", () => {
    expect(source).toContain('data-atlas-v516-witness-count="512"');
    expect(source).toContain('data-atlas-v516-checkpoint-count="8"');
    expect(source).toContain("summary.chain.headSha256");
    expect(source).toContain("summary.chain.repeatHeadSha256");
    expect(source).toContain("summary.chain.scientificDigestMismatchCount");
    expect(source).toContain("summary.chain.visualDigestMismatchCount");
  });

  it("loads only after explicit detail selection and creates no rendering resources", () => {
    expect(source).toContain("loadKerrUncertaintyReplayWitnessSummaryV516");
    expect(source).toContain('data-atlas-v516-automatic-request-count="0"');
    expect(source).toContain('data-atlas-v516-canvas-created="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("createObjectURL");
  });
});
