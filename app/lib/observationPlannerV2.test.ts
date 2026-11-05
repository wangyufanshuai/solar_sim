import { describe, expect, it } from "vitest";
import { createObservationPlanV1, type ObserverProfileV1 } from "./observationPlannerV1";
import {
  OBSERVATION_PROFILE_LIMIT,
  createObservationChartSeriesV1,
  deleteObservationProfileV1,
  observationPlanToCsvV2,
  observationPlanToIcsV2,
  observationPlanToJsonV2,
  observationTargetFromSelectionV2,
  parseObservationLocationsV1,
  parseObservationWeatherV1,
  readObservationProfilesV1,
  saveObserverProfileV1,
} from "./observationPlannerV2";

const observer: ObserverProfileV1 = {
  version: "observer-profile-v1",
  id: "beijing",
  name: "北京",
  latitudeDeg: 39.9042,
  longitudeDeg: 116.4074,
  elevationM: 44,
  timeZone: "Asia/Shanghai",
  source: "manual",
};

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

describe("v266 observing planner view model", () => {
  it("bounds and repairs versioned local profiles", () => {
    const storage = memoryStorage();
    for (let index = 0; index < 14; index += 1) {
      saveObserverProfileV1(storage, {
        version: "saved-observer-profile-v1",
        id: `observer-${index}`,
        savedAt: new Date(index * 1000).toISOString(),
        profile: { ...observer, id: `observer-${index}` },
      });
    }
    expect(readObservationProfilesV1(storage).observers).toHaveLength(OBSERVATION_PROFILE_LIMIT);
    expect(deleteObservationProfileV1(storage, "observer", "observer-13").observers.some((entry) => entry.id === "observer-13")).toBe(false);
    storage.setItem("orbit-atlas-observation-profiles-v1", "{broken");
    expect(readObservationProfilesV1(storage).observers).toEqual([]);
    expect(storage.getItem("orbit-atlas-observation-profiles-v1")).toBeNull();
  });

  it("does not attach stale weather outside the bounded nearest-hour window", () => {
    const weather = parseObservationWeatherV1({
      canonical: false,
      source: "Open-Meteo",
      fetchedAt: "2026-01-01T00:00:00Z",
      expiresAt: "2026-01-01T00:30:00Z",
      weather: { hourly: {
        time: ["2026-01-02T00:00"],
        cloud_cover_low: [80],
      } },
    });
    const result = createObservationPlanV1({
      observer,
      target: { id: "vega", name: "Vega", raDeg: 279.2347, decDeg: 38.7837 },
      startIso: "2026-01-01T00:00:00Z",
      durationHours: 24,
      sampleMinutes: 60,
      refraction: true,
    });
    expect(createObservationChartSeriesV1(result, weather)[0]?.cloudPercent).toBeNull();
  });

  it("preserves unavailable cloud coverage instead of reporting a false clear sky", () => {
    const weather = parseObservationWeatherV1({
      canonical: false,
      source: "Open-Meteo",
      fetchedAt: "2026-01-01T00:00:00Z",
      expiresAt: "2026-01-01T00:30:00Z",
      weather: { hourly: { time: ["2026-01-01T00:00"] } },
    });
    const result = createObservationPlanV1({
      observer,
      target: { id: "vega", name: "Vega", raDeg: 279.2347, decDeg: 38.7837 },
      startIso: "2026-01-01T00:00:00Z",
      durationHours: 24,
      sampleMinutes: 60,
      refraction: true,
    });
    expect(createObservationChartSeriesV1(result, weather)[0]?.cloudPercent).toBeNull();
  });

  it("adapts selected catalog and Gaia targets without physics insertion", () => {
    expect(observationTargetFromSelectionV2("nearby-star:vega", []).target).toMatchObject({
      id: "nearby-star:vega",
    });
    expect(observationTargetFromSelectionV2("gaia-dr3:42", [{
      sourceId: "42", raDeg: 12, decDeg: -8, magG: 10, colorBpRp: 1, parallaxMas: 2,
    }]).target).toMatchObject({ raDeg: 12, decDeg: -8, epochJulianYear: 2016 });
    expect(observationTargetFromSelectionV2("earth", []).boundary).toBe("unavailable");
  });

  it("filters malformed geocoding rows before they reach the planner", () => {
    expect(parseObservationLocationsV1({
      canonical: false,
      source: "Open-Meteo Geocoding",
      results: [
        { id: "1", name: "北京", latitudeDeg: 39.9, longitudeDeg: 116.4, elevationM: 44, timeZone: "Asia/Shanghai" },
        { id: "2", name: "越界", latitudeDeg: 120, longitudeDeg: 0 },
      ],
    })).toEqual([expect.objectContaining({ name: "北京", timeZone: "Asia/Shanghai" })]);
  });

  it("parses transient weather and joins it to canonical astronomy", () => {
    const weather = parseObservationWeatherV1({
      canonical: false,
      source: "Open-Meteo",
      fetchedAt: "2026-01-01T00:00:00Z",
      expiresAt: "2026-01-01T00:30:00Z",
      weather: { hourly: {
        time: ["2026-01-01T00:00"],
        cloud_cover_low: [20], cloud_cover_mid: [40], cloud_cover_high: [10],
        relative_humidity_2m: [55], visibility: [20_000],
        precipitation_probability: [5], wind_speed_10m: [12],
      } },
    });
    const result = createObservationPlanV1({
      observer,
      target: { id: "vega", name: "Vega", raDeg: 279.2347, decDeg: 38.7837 },
      startIso: "2026-01-01T00:00:00Z",
      durationHours: 24,
      sampleMinutes: 60,
      refraction: true,
    });
    expect(createObservationChartSeriesV1(result, weather)[0]).toMatchObject({
      cloudPercent: 40,
      visibilityKm: 20,
    });
  });

  it("exports provenance-rich JSON, CSV and ICS", () => {
    const result = createObservationPlanV1({
      observer,
      target: { id: "vega", name: "Vega", raDeg: 279.2347, decDeg: 38.7837 },
      startIso: "2026-01-01T00:00:00Z",
      durationHours: 24,
      sampleMinutes: 10,
      refraction: true,
    });
    const fov = { name: "APS-C", focalLengthMm: 800, sensorWidthMm: 22.3, sensorHeightMm: 14.9, rotationDeg: 0 };
    expect(observationPlanToJsonV2(result, fov, null)).toContain("offline-deterministic-canonical");
    expect(observationPlanToCsvV2(result, null)).toContain("altitude_deg");
    expect(observationPlanToIcsV2(result)).toContain("X-ATLAS-WEATHER-BOUNDARY");
  });
});
