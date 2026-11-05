import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v350 observation surface", () => {
  it("labels applicability and keeps the browser surface read-only", () => {
    const source = readFileSync("app/components/KerrScienceBandObservationSurfaceV350.tsx", "utf8");
    expect(source).toContain("data-atlas-kerr-band-observation-v350");
    expect(source).toContain("UNAVAILABLE");
    expect(source).toContain("synthetic expectation only");
    expect(source).toContain("WCS / solid angle boundary");
    expect(source).toContain('value.reason === "lite-boundary"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
  });
});
