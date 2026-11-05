import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { validateKerrGeometryQualificationV296, type KerrGeometryQualificationV296 } from "./kerrAuthorityV296";

describe("v296 Carter constraint stability authority", () => {
  it("accepts the generated qualified geometry artifact", () => {
    const evidence = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json"), "utf8")) as KerrGeometryQualificationV296 & { classCounts: Record<string, Record<string, number>>; thresholds: Record<string, number | boolean> };
    expect(validateKerrGeometryQualificationV296(evidence)).toBe(true);
    expect(evidence.classCounts["carter-mino-dop853-constraint-stabilized-v296"]).toEqual({ capture: 24, escape: 24, "disk-hit": 16, invalid: 0 });
    expect(evidence.thresholds.classificationAgreement).toBe(1);
    expect(evidence.thresholds.maxMassShellResidualRaw).toBeLessThan(1e-10);
    expect(evidence.thresholds.maxCarterResidualNormalized).toBeLessThan(1e-10);
  });
});
