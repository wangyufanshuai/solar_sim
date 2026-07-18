import { describe, expect, it } from "vitest";
import {
  DEFAULT_KERR_GEODESIC_RENDER_MODE,
  KERR_ORBIT_PRESETS,
  KERR_RELATIVITY_LAB_VERSION,
  KERR_GEODESIC_TRACK_COUNT,
  KERR_GEODESIC_VISUALIZATION_ID,
  createKerrGeodesicTrackSet,
} from "./kerrGeodesicVisualization";

const EXPECTED_KINDS = [
  "photon-sphere",
  "isco",
  "capture",
  "escape",
  "kerr-prograde",
  "kerr-retrograde",
  "probe-null",
] as const;

function expectFiniteTrackSamples(trackSet: ReturnType<typeof createKerrGeodesicTrackSet>) {
  for (const track of trackSet.tracks) {
    expect(track.samples.length).toBeGreaterThan(8);
    for (const sample of track.samples) {
      expect(Number.isFinite(sample.lambda)).toBe(true);
      expect(Number.isFinite(sample.r)).toBe(true);
      expect(Number.isFinite(sample.phi)).toBe(true);
      expect(Number.isFinite(sample.x)).toBe(true);
      expect(Number.isFinite(sample.y)).toBe(true);
      expect(Number.isFinite(sample.z)).toBe(true);
      expect(Number.isFinite(sample.hamiltonian)).toBe(true);
    }
  }
}

describe("Kerr geodesic visual track set", () => {
  it("uses geodesic tracks as the default v18 render mode", () => {
    const trackSet = createKerrGeodesicTrackSet(0.9);
    expect(trackSet.visualization).toBe(KERR_GEODESIC_VISUALIZATION_ID);
    expect(trackSet.labVersion).toBe(KERR_RELATIVITY_LAB_VERSION);
    expect(trackSet.renderModeDefault).toBe(DEFAULT_KERR_GEODESIC_RENDER_MODE);
    expect(trackSet.renderModeDefault).toBe("geodesic-tracks");
    expect(trackSet.trackCount).toBe(KERR_GEODESIC_TRACK_COUNT);
    expect(trackSet.orbitPresetId).toBe("photon-ring-demo");
    expect(trackSet.probe.probeStatus).not.toBe("failed");
  });

  it("creates finite scene-ready samples for Schwarzschild and Kerr spins", () => {
    for (const spin of [0, 0.5, 0.9]) {
      const trackSet = createKerrGeodesicTrackSet(spin);
      expect(trackSet.trackCount).toBe(7);
      expect(trackSet.tracks.map((track) => track.kind)).toEqual(EXPECTED_KINDS);
      expect(Number.isFinite(trackSet.maxHamiltonianConstraintAbs)).toBe(true);
      expectFiniteTrackSamples(trackSet);
    }
  });

  it("keeps photon sphere and ISCO reference radius drift below the visual tolerance", () => {
    const trackSet = createKerrGeodesicTrackSet(0.9);
    const photon = trackSet.tracks.find((track) => track.kind === "photon-sphere");
    const isco = trackSet.tracks.find((track) => track.kind === "isco");
    const prograde = trackSet.tracks.find((track) => track.kind === "kerr-prograde");
    const retrograde = trackSet.tracks.find((track) => track.kind === "kerr-retrograde");

    expect(photon?.status).toBe("bounded");
    expect(isco?.status).toBe("bounded");
    expect(prograde?.status).toBe("bounded");
    expect(retrograde?.status).toBe("bounded");
    expect(photon?.radialDrift).toBeLessThan(1e-8);
    expect(isco?.radialDrift).toBeLessThan(1e-8);
    expect(prograde?.radialDrift).toBeLessThan(1e-8);
    expect(retrograde?.radialDrift).toBeLessThan(1e-8);
  });

  it("classifies capture and escape tracks deterministically", () => {
    const trackSet = createKerrGeodesicTrackSet(0.5);
    expect(trackSet.tracks.find((track) => track.kind === "capture")?.status).toBe("captured");
    expect(trackSet.tracks.find((track) => track.kind === "escape")?.status).toBe("escaped");
  });

  it("creates finite samples for every v19 orbit preset", () => {
    for (const preset of KERR_ORBIT_PRESETS) {
      const trackSet = createKerrGeodesicTrackSet({
        spinA: preset.spinA,
        impactParameterM: preset.impactParameterM,
        presetId: preset.id,
      });
      expect(trackSet.orbitPresetId).toBe(preset.id);
      expect(trackSet.impactParameterM).toBeCloseTo(preset.impactParameterM, 8);
      expect(trackSet.probe.presetId).toBe(preset.id);
      expect(trackSet.probe.probeStatus).not.toBe("failed");
      expectFiniteTrackSamples(trackSet);
    }
  });

  it("uses impact parameter to change the interactive null probe", () => {
    const low = createKerrGeodesicTrackSet({
      spinA: 0.7,
      impactParameterM: 4.2,
      presetId: "capture-cone",
    });
    const high = createKerrGeodesicTrackSet({
      spinA: 0.7,
      impactParameterM: 14,
      presetId: "wide-deflection",
    });
    const lowProbe = low.tracks.find((track) => track.kind === "probe-null");
    const highProbe = high.tracks.find((track) => track.kind === "probe-null");
    expect(low.probe.probeStatus).toBe("capture");
    expect(high.probe.probeStatus).toBe("escape");
    expect(lowProbe?.status).toBe("captured");
    expect(highProbe?.status).toBe("escaped");
    expect(lowProbe?.radialDrift).not.toBeCloseTo(highProbe?.radialDrift ?? 0, 4);
  });
});
