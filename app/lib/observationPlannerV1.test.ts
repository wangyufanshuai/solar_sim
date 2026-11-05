import { describe, expect, it } from "vitest";
import {
  computeTelescopeFovV1,
  createObservationPlanV1,
  horizonAltitudeAtAzimuthV1,
  kastenYoungAirmassV1,
  parseHorizonMaskCsvV1,
  type ObserverProfileV1,
} from "./observationPlannerV1";

const greenwich: ObserverProfileV1 = {
  version: "observer-profile-v1",
  id: "greenwich",
  name: "Royal Observatory Greenwich",
  latitudeDeg: 51.4769,
  longitudeDeg: 0,
  elevationM: 46,
  timeZone: "Europe/London",
  source: "manual",
};

describe("v258 observing planner", () => {
  it("parses and circularly interpolates a terrain horizon", () => {
    const mask = parseHorizonMaskCsvV1("0,5\n90,10\n180,5\n270,0");
    expect(horizonAltitudeAtAzimuthV1(mask, 45)).toBeCloseTo(7.5, 8);
    expect(horizonAltitudeAtAzimuthV1(mask, 315)).toBeCloseTo(2.5, 8);
    expect(() => parseHorizonMaskCsvV1("0,5\n0,6")).toThrow();
  });

  it("uses the Kasten-Young relative optical airmass", () => {
    expect(kastenYoungAirmassV1(90)).toBeCloseTo(0.9997, 3);
    expect(kastenYoungAirmassV1(30)).toBeCloseTo(1.994, 3);
    expect(kastenYoungAirmassV1(-6)).toBeNull();
  });

  it("computes real sensor and eyepiece fields of view", () => {
    const camera = computeTelescopeFovV1({
      name: "APS-C",
      focalLengthMm: 800,
      sensorWidthMm: 22.3,
      sensorHeightMm: 14.9,
      pixelSizeMicron: 3.76,
      rotationDeg: -20,
    });
    expect(camera.widthDeg).toBeCloseTo(1.597, 2);
    expect(camera.arcsecPerPixel).toBeCloseTo(0.969, 2);
    expect(camera.rotationDeg).toBe(340);
  });

  it("produces deterministic 24-hour altitude, twilight, moon and window samples", () => {
    const request = {
      observer: greenwich,
      target: { id: "polaris", name: "Polaris", raDeg: 37.95456067, decDeg: 89.26410897 },
      startIso: "2026-01-01T00:00:00.000Z",
      durationHours: 24 as const,
      sampleMinutes: 10,
      refraction: false,
    };
    const result = createObservationPlanV1(request);
    expect(result.samples).toHaveLength(145);
    expect(createObservationPlanV1(request)).toEqual(result);
    expect(result.samples.every((sample) => Number.isFinite(sample.altitudeDeg) && Number.isFinite(sample.azimuthDeg))).toBe(true);
    expect(Math.min(...result.samples.map((sample) => sample.altitudeDeg))).toBeGreaterThan(50);
    expect(result.events.some((event) => event.type === "transit")).toBe(true);
    expect(result.boundary).toBe("offline-deterministic-astronomy-weather-excluded");
  });

  it("covers 100 location/time/target combinations without invalid output", () => {
    for (let index = 0; index < 100; index += 1) {
      const result = createObservationPlanV1({
        observer: {
          ...greenwich,
          id: `fixture-${index}`,
          latitudeDeg: -60 + (index % 25) * 5,
          longitudeDeg: -170 + (index % 20) * 17,
        },
        target: {
          id: `target-${index}`,
          name: `Target ${index}`,
          raDeg: (index * 47.3) % 360,
          decDeg: -70 + (index % 29) * 5,
        },
        startIso: new Date(Date.UTC(2026, index % 12, 1 + (index % 20))).toISOString(),
        durationHours: 24,
        sampleMinutes: 60,
        refraction: index % 2 === 0,
      });
      expect(result.samples).toHaveLength(25);
      expect(result.samples.every((sample) => sample.airmass === null || sample.airmass > 0)).toBe(true);
    }
  });

  it("keeps DST, cross-midnight and polar 72-hour plans finite", () => {
    const scenarios = [
      { startIso: "2026-03-29T00:30:00Z", latitudeDeg: 51.4769, longitudeDeg: 0, timeZone: "Europe/London" },
      { startIso: "2026-11-01T04:30:00Z", latitudeDeg: 40.7128, longitudeDeg: -74.006, timeZone: "America/New_York" },
      { startIso: "2026-06-20T23:30:00Z", latitudeDeg: 78.2232, longitudeDeg: 15.6469, timeZone: "Arctic/Longyearbyen" },
      { startIso: "2026-12-20T23:30:00Z", latitudeDeg: 78.2232, longitudeDeg: 15.6469, timeZone: "Arctic/Longyearbyen" },
    ];
    for (const [index, scenario] of scenarios.entries()) {
      const result = createObservationPlanV1({
        observer: { ...greenwich, id: `edge-${index}`, ...scenario },
        target: {
          id: "barnards-star",
          name: "Barnard's Star",
          raDeg: 269.452,
          decDeg: 4.693,
          epochJulianYear: 2016,
          pmRaMasYr: -802.8,
          pmDecMasYr: 10362.5,
        },
        startIso: scenario.startIso,
        durationHours: 72,
        sampleMinutes: 60,
        refraction: false,
      });
      expect(result.samples).toHaveLength(73);
      expect(result.samples.every((sample) => Number.isFinite(sample.altitudeDeg) && Number.isFinite(sample.sunAltitudeDeg))).toBe(true);
      expect(result.samples[0]?.at).toBe(scenario.startIso.replace("Z", ".000Z"));
    }
  });
});
