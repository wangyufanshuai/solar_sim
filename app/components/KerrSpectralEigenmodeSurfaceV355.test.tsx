import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v355 spectral eigenmode surface", () => {
  it("labels deterministic decomposition and synthetic-measurement boundary", () => {
    const source = readFileSync("app/components/KerrSpectralEigenmodeSurfaceV355.tsx", "utf8");
    expect(source).toContain("Principal axes / uncertainty ellipses");
    expect(source).toContain("Deterministic Jacobi decomposition");
    expect(source).toContain("not measured instrument modes");
    expect(source).toContain("never cinematic input");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
  });
});
