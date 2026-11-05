import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v328 photon-domain HUD", () => {
  it("stays Science-only, bounded and explicit about detector assumptions", () => {
    const source = readFileSync("app/components/KerrSciencePhotonBandsV328.tsx", "utf8");
    expect(source).toContain("useSyncExternalStore");
    expect(source).toContain("retainKerrScienceObservatoryV329");
    expect(source).toContain("mode !== \"science\"");
    expect(source).toContain("exact SI Planck constant");
    expect(source).toContain("not detector count rate");
    expect(source).toContain("getKerrSciencePhotonProvenanceV331");
    expect(source).toContain("acquireAtlasResource(\"object-url\"");
    expect(source).toContain("URL.revokeObjectURL(url)");
    expect(source).toContain("12-row sanitized photon provenance");
    expect(source).toContain("createKerrScienceInstrumentResponseV332");
    expect(source).toContain("synthetic reference");
    expect(source).toContain("deterministic expectation only");
    expect(source).not.toMatch(/鈥|宦|谓|螖/);
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("Math.random");
  });
});
