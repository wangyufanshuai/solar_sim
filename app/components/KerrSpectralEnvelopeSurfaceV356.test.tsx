import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v356 envelope surface", () => {
  it("exposes sanitized JSON/CSV export and no image authority", () => {
    const source = readFileSync("app/components/KerrSpectralEnvelopeSurfaceV356.tsx", "utf8");
    expect(source).toContain("Export JSON");
    expect(source).toContain("Export CSV");
    expect(source).toContain("no FITS/PNG generated");
    expect(source).toContain("URL.revokeObjectURL");
    expect(source).toContain("never cinematic color input");
    expect(source).not.toContain("Math.random");
  });
});
