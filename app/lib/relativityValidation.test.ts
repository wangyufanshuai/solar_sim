import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MERCURY_BODY_INDEX } from "../data/planetsJ2000";
import { stateAuToSi } from "./physicsEngine";
import {
  MERCURY_GR_TARGET_ARCSEC_PER_CENTURY,
  SOLAR_LIMB_DEFLECTION_TARGET_ARCSEC,
  compareStateToHorizonsCheckpoint,
  loadHorizonsValidationDatasetFromJson,
  mercuryPrecessionValidation,
  relativityConfidenceForValidation,
  shapiroDelayValidation,
  solarLimbLightDeflectionValidation,
  timeDilationValidation,
} from "./relativityValidation";
import { SolarSystemPhysics } from "./solarSystemPhysics";

const validationPath = resolve(process.cwd(), "dist/content-packs/files/science-fixtures/data/horizons-validation-j2000.json");

describe("relativity validation lab", () => {
  it("ships fixed offline Horizons validation checkpoints", () => {
    expect(existsSync(validationPath)).toBe(true);
    const dataset = loadHorizonsValidationDatasetFromJson(readFileSync(validationPath, "utf8"));
    expect(dataset.source).toBe("JPL Horizons API");
    expect(dataset.origin).toBe("sun");
    expect(dataset.checkpoints.map((checkpoint) => checkpoint.label)).toEqual([
      "J2000",
      "+30d",
      "+365d",
      "+10y",
    ]);
    for (const checkpoint of dataset.checkpoints) {
      expect(checkpoint.bodies.map((body) => body.id)).toEqual([
        "sun",
        "mercury",
        "venus",
        "earth",
        "moon",
        "mars",
        "jupiter",
        "saturn",
        "uranus",
        "neptune",
        "pluto",
        "ceres",
      ]);
      for (const body of checkpoint.bodies) {
        for (const key of ["x_au", "y_au", "z_au", "vx_au_d", "vy_au_d", "vz_au_d"] as const) {
          expect(Number.isFinite(body[key])).toBe(true);
        }
      }
    }
  });

  it("computes Mercury 1PN perihelion precession from the live initial state", () => {
    const physics = new SolarSystemPhysics({ activeN: 12, forceFixedRk4: true });
    const validation = mercuryPrecessionValidation(physics);
    expect(validation.sameInitialState).toBe(true);
    expect(validation.newtonArcsecPerCentury).toBe(0);
    expect(Math.abs((validation.onePnArcsecPerCentury ?? 0) - MERCURY_GR_TARGET_ARCSEC_PER_CENTURY)).toBeLessThan(2);
    expect(validation.errorPercent ?? Infinity).toBeLessThan(5);
  });

  it("matches the solar limb light-deflection target", () => {
    const validation = solarLimbLightDeflectionValidation();
    expect(validation.formulaArcsec).toBeCloseTo(SOLAR_LIMB_DEFLECTION_TARGET_ARCSEC, 2);
    expect(validation.errorPercent).toBeLessThan(1);
  });

  it("computes finite Shapiro delay and time dilation diagnostics", () => {
    const physics = new SolarSystemPhysics({ activeN: 12, forceFixedRk4: true });
    const shapiro = shapiroDelayValidation(physics, MERCURY_BODY_INDEX);
    expect(shapiro.status).toBe("ready");
    expect(shapiro.microseconds).toBeGreaterThan(0);
    expect(shapiro.errorPercent).toBe(0);

    const dilation = timeDilationValidation(physics, MERCURY_BODY_INDEX, null);
    expect(dilation.status).toBe("ready");
    expect(dilation.gravitationalPlusKinematicUsPerDay).not.toBeNull();
    expect(Number.isFinite(dilation.gravitationalPlusKinematicUsPerDay)).toBe(true);
  });

  it("compares a state vector against the Horizons checkpoint", () => {
    const dataset = loadHorizonsValidationDatasetFromJson(readFileSync(validationPath, "utf8"));
    const checkpoint = dataset.checkpoints[0]!;
    const n = checkpoint.bodies.length;
    const bodyIds = checkpoint.bodies.map((body) => body.id);
    const posAu = new Float64Array(n * 3);
    const velAuD = new Float64Array(n * 3);
    const posM = new Float64Array(n * 3);
    const velM = new Float64Array(n * 3);
    for (let i = 0; i < n; i++) {
      const body = checkpoint.bodies[i]!;
      posAu[3 * i] = body.x_au;
      posAu[3 * i + 1] = body.y_au;
      posAu[3 * i + 2] = body.z_au;
      velAuD[3 * i] = body.vx_au_d;
      velAuD[3 * i + 1] = body.vy_au_d;
      velAuD[3 * i + 2] = body.vz_au_d;
    }
    stateAuToSi(posAu, velAuD, n, posM, velM);
    const comparison = compareStateToHorizonsCheckpoint({ posM, velM, bodyIds, checkpoint });
    expect(comparison.available).toBe(true);
    expect(comparison.rmsPositionKm).toBeLessThan(1e-6);
    expect(comparison.rmsVelocityMs).toBeLessThan(1e-9);
  });

  it("promotes relativity confidence only after formula and Horizons validation", () => {
    const physics = new SolarSystemPhysics({ activeN: 12, forceFixedRk4: true });
    const mercury = mercuryPrecessionValidation(physics);
    const light = solarLimbLightDeflectionValidation();
    const shapiro = shapiroDelayValidation(physics, MERCURY_BODY_INDEX);
    expect(
      relativityConfidenceForValidation({
        mercury,
        light,
        shapiro,
        horizons: { status: "running", progress: 0.5, source: "JPL Horizons API", modes: [] },
      }),
    ).toBe("formula-checked");
    expect(
      relativityConfidenceForValidation({
        mercury,
        light,
        shapiro,
        horizons: {
          status: "complete",
          progress: 1,
          source: "JPL Horizons API",
          modes: [{ mode: "1pn", checkpoints: [], rmsPositionKm: 1e6, rmsVelocityMs: 1 }],
        },
      }),
    ).toBe("validated");
  });
});
