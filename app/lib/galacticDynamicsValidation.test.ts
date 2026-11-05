import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { GaiaDr3KinematicsRow } from "./simulationDiagnosticsTypes";
import {
  GALACTIC_R0_KPC,
  computeGalacticEscapeSpeedKmS,
  computeGalacticRotationCurve,
  computeGalacticWeakFieldClockOffset,
  createGalacticDynamicsValidationSummary,
  gaiaKinematicsToLocalVelocity,
  loadGaiaKinematicsCatalogFromJson,
} from "./galacticDynamicsValidation";

const kinematicsPath = resolve(process.cwd(), "dist/content-packs/files/core/data/gaia-dr3-kinematics-2000.json");

function loadRows(): GaiaDr3KinematicsRow[] {
  return loadGaiaKinematicsCatalogFromJson(readFileSync(kinematicsPath, "utf8"));
}

describe("galactic dynamics validation lab", () => {
  it("ships a filtered Gaia DR3 kinematics catalog", () => {
    expect(existsSync(kinematicsPath)).toBe(true);
    const rows = loadRows();
    expect(rows).toHaveLength(2000);

    for (const row of rows) {
      expect(typeof row.source_id).toBe("string");
      for (const key of [
        "ra",
        "dec",
        "parallax",
        "pmra",
        "pmdec",
        "radial_velocity",
        "phot_g_mean_mag",
        "bp_rp",
        "parallax_over_error",
        "ruwe",
        "radial_velocity_error",
      ] as const) {
        expect(Number.isFinite(row[key])).toBe(true);
      }
      expect(row.parallax).toBeGreaterThan(5);
      expect(row.parallax_over_error).toBeGreaterThanOrEqual(10);
      expect(row.ruwe).toBeLessThan(1.4);
      expect(row.radial_velocity_error).toBeLessThanOrEqual(5);
      expect(1000 / row.parallax).toBeLessThan(200);
    }
  });

  it("rejects incomplete or low-quality kinematics rows", () => {
    const good = loadRows()[0]!;
    expect(() => loadGaiaKinematicsCatalogFromJson(JSON.stringify([{ ...good, radial_velocity: null }]))).toThrow();
    expect(() => loadGaiaKinematicsCatalogFromJson(JSON.stringify([{ ...good, ruwe: 2 }]))).toThrow();
    expect(() => loadGaiaKinematicsCatalogFromJson(JSON.stringify([{ ...good, parallax_over_error: 5 }]))).toThrow();
    expect(() => loadGaiaKinematicsCatalogFromJson(JSON.stringify([{ ...good, radial_velocity_error: 8 }]))).toThrow();
  });

  it("converts Gaia proper motion and radial velocity to finite local U/V/W", () => {
    const sample = gaiaKinematicsToLocalVelocity(loadRows()[0]!);
    expect(sample.distancePc).toBeGreaterThan(0);
    expect(sample.distancePc).toBeLessThan(200);
    expect(Number.isFinite(sample.uKmS)).toBe(true);
    expect(Number.isFinite(sample.vKmS)).toBe(true);
    expect(Number.isFinite(sample.wKmS)).toBe(true);
    expect(Number.isFinite(sample.tangentialKmS)).toBe(true);
    expect(Number.isFinite(sample.speedKmS)).toBe(true);
  });

  it("computes a finite analytic rotation curve and local escape speed", () => {
    const curve = computeGalacticRotationCurve();
    expect(curve.map((point) => point.radiusKpc)).toEqual([4, 6, GALACTIC_R0_KPC, 10, 12, 16]);
    const r0 = curve.find((point) => point.radiusKpc === GALACTIC_R0_KPC);
    expect(r0?.circularVelocityKmS).toBeGreaterThan(180);
    expect(r0?.circularVelocityKmS).toBeLessThan(280);

    const escape = computeGalacticEscapeSpeedKmS(GALACTIC_R0_KPC);
    expect(escape).toBeGreaterThan(350);
    expect(escape).toBeLessThan(750);
  });

  it("reports weak-field clock diagnostics as teaching-only", () => {
    const weakField = computeGalacticWeakFieldClockOffset();
    expect(weakField.diagnostic).toBe("teaching");
    expect(weakField.phiOverC2).toBeGreaterThan(0);
    expect(weakField.phiOverC2).toBeLessThan(1e-4);
    expect(Number.isFinite(weakField.clockOffsetUsPerDay)).toBe(true);
  });

  it("creates the v15 Galactic validation summary without changing solar dynamics semantics", () => {
    const summary = createGalacticDynamicsValidationSummary(loadRows());
    expect(summary.status).toBe("ready");
    expect(summary.source).toBe("gaia-dr3-kinematics");
    expect(summary.sampleCount).toBe(2000);
    expect(summary.circularVelocityAtR0KmS).toBeGreaterThan(180);
    expect(summary.escapeSpeedAtR0KmS).toBeGreaterThan(350);
    expect(summary.medianTangentialVelocityKmS).toBeGreaterThan(0);
    expect(summary.weakFieldDiagnostic).toBe("teaching");
    expect(summary.semantics).toEqual({
      solarDynamics: "live-nbody-eih-1pn",
      galacticDynamics: "analytic-potential-validation",
      orbitAtlas: "presentation-layer",
      cosmology: "not-full-gr-or-cosmological-expansion",
    });
  });
});
