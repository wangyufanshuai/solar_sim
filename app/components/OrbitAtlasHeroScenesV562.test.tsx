import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/OrbitAtlasHeroScenesV562.tsx", "utf8");

describe("v562 science-first hero scenes", () => {
  it("locks the four scenes to shared geometry and the candidate manifest", () => {
    for (const id of ["kerr-volume-disk", "photon-ring-lensing", "polarization-field", "science-cinematic-ab"]) expect(source).toContain(id);
    expect(source).toContain('data-atlas-v562-shared-geometry="true"');
    expect(source).toContain('data-atlas-v562-canvas-count="0"');
    expect(source).toContain('data-atlas-v562-cinematic-writeback="false"');
    expect(source).toContain("20c61d175655b66437fe8fe6f95f5efbce071d3c333db106e0469fa84e6e074e");
  });

  it("keeps Science linear and forbids scientific payload mutation", () => {
    expect(source).toContain("linear display / no post FX");
    expect(source).toContain("classification, redshift, EVPA, intensity, Stokes or coordinates");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("createObjectURL");
  });

  it("does not admit scene or mode interactions before client hydration", () => {
    expect(source).toContain('data-atlas-v562-hydrated={hydrated ? "true" : "false"}');
    expect(source).toContain("useEffect(() => setHydrated(true), [])");
    expect(source.match(/disabled={!hydrated}/g)).toHaveLength(2);
  });

  it("publishes bounded hero presentation frame telemetry for browser qualification", () => {
    expect(source).toContain('data-atlas-v562-performance-scope", "hero-presentation"');
    expect(source).toContain('data-atlas-v562-performance-status", frameDeltas.length >= 241 ? "ready" : "sampling"');
    expect(source).toContain("data-atlas-v562-median-fps");
    expect(source).toContain("data-atlas-v562-frame-p95-ms");
    expect(source).toContain("cancelAnimationFrame(frameId)");
  });
});
