import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  KERR_EMITTER_NORM_LIMIT_V301,
  KERR_FORMULA_REDSHIFT_LIMIT_V301,
  KERR_OBSERVER_TETRAD_LIMIT_V301,
  KERR_REDSHIFT_REPLAY_LIMIT_V301,
  parseKerrObserverEmitterReplayViewV301,
  resolveKerrEmitterRedshiftV301,
  resolveKerrZamoObserverFrameV301,
} from "./kerrObserverEmitterReplayV301";
import { createKerrObserverEmitterReplayViewV301 } from "./kerrObserverEmitterReplayServerV301";

const readJson = (path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));

function view() {
  return createKerrObserverEmitterReplayViewV301(
    readJson("dist/science/kerr-reference-v296/geometry-redshift-short-gate.json"),
    readJson("dist/science/kerr-reference-v297/polarization-short-gate.json"),
    readJson("dist/science/kerr-campaign-v298r1/ray-plan.json"),
  );
}

describe("v301 observer, emitter and redshift replay authority", () => {
  it("replays four canonical disk rays from the SHA-locked sparse authority", () => {
    const result = view();
    expect(result).toMatchObject({
      version: "v301-kerr-observer-emitter-redshift-replay-v1",
      status: "observer-emitter-redshift-replay-qualified",
      rayCount: 4,
      boundary: "four-canonical-disk-rays-not-dense-transfer-map",
    });
    expect(result.records.map((entry) => entry.rayId)).toEqual(["disk-00", "disk-01", "disk-02", "disk-03"]);
    expect(result.records.map((entry) => entry.spinA)).toEqual([-0.9, 0, 0, 0.9]);
    expect(result.records.every((entry) => entry.emitter.storedRedshiftFactor > 0
      && entry.emitter.photonFrequencyMinusKDotU > 0
      && entry.emitter.replayDifference < KERR_REDSHIFT_REPLAY_LIMIT_V301
      && entry.emitter.formulationDifference < KERR_FORMULA_REDSHIFT_LIMIT_V301
      && entry.observer.replayOrthonormalResidual < KERR_OBSERVER_TETRAD_LIMIT_V301
      && entry.emitter.fourVelocityNormResidual < KERR_EMITTER_NORM_LIMIT_V301)).toBe(true);
  });

  it("independently resolves signed-spin ZAMO and circular emitter states", () => {
    const retrograde = resolveKerrZamoObserverFrameV301(-0.9);
    const prograde = resolveKerrZamoObserverFrameV301(0.9);
    expect(retrograde.frameDraggingAngularVelocity).toBeLessThan(0);
    expect(prograde.frameDraggingAngularVelocity).toBeGreaterThan(0);
    expect(retrograde.replayOrthonormalResidual).toBeLessThan(KERR_OBSERVER_TETRAD_LIMIT_V301);
    const emitter = resolveKerrEmitterRedshiftV301(-0.9, 15.91439790369338, 0.9655963630566775, 7.521122130442607);
    expect(emitter.fourVelocityNormResidual).toBeLessThan(KERR_EMITTER_NORM_LIMIT_V301);
    expect(emitter.replayedRedshiftFactor).toBeCloseTo(1.0618046903440526, 14);
  });

  it("fails closed on authority, emitter and summary drift", () => {
    const result = view();
    expect(parseKerrObserverEmitterReplayViewV301(JSON.parse(JSON.stringify(result)))).toEqual(result);
    expect(() => parseKerrObserverEmitterReplayViewV301({
      ...result,
      authority: { ...result.authority, geometryEvidenceSha256: "0".repeat(64) },
    })).toThrow("v301-replay-authority-lock-mismatch");
    const records = result.records.map((record, index) => index === 0
      ? { ...record, emitter: { ...record.emitter, uT: record.emitter.uT + 0.01 } }
      : record);
    expect(() => parseKerrObserverEmitterReplayViewV301({ ...result, records }))
      .toThrow("v301-emitter-replay-conservation-failed");
    expect(() => parseKerrObserverEmitterReplayViewV301({
      ...result,
      maxima: { ...result.maxima, redshiftReplayDifference: 1 },
    })).toThrow("v301-replay-maxima-conservation-failed");
  });

  it("loads the bounded replay only behind the observer-tetrad workbench intent", () => {
    const workbench = readFileSync(resolve(process.cwd(), "app/components/RelativityResearchWorkbenchV280.tsx"), "utf8");
    const replay = readFileSync(resolve(process.cwd(), "app/components/KerrObserverEmitterWorkbenchV301.tsx"), "utf8");
    expect(workbench).toContain('tab === "observer-tetrad"');
    expect(workbench).toContain("<KerrObserverEmitterWorkbenchV301");
    expect(replay).toContain("/api/atlas/relativity-evidence/artifacts/v301-observer-emitter-replay");
    expect(replay).toContain("MAX_RESPONSE_BYTES = 32 * 1024");
    expect(replay).not.toContain('from "../lib/physicsEngine');
  });
});
