import { createHash } from "node:crypto";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { canonicalPayloadV453, computeKerrDetectorReadoutV453, type KerrDetectorReadoutFixtureV453 } from "../app/lib/kerrDetectorReadoutQuantizationV453";
const root = process.cwd(); const output = "dist/science/kerr-detector-readout-v453"; const sha = (value: unknown): string => createHash("sha256").update(canonicalPayloadV453(value)).digest("hex");
const rows: KerrDetectorReadoutFixtureV453[] = [
  { sourceKind: "test-fixture", fixtureId: "nominal-readout", caseKind: "nominal", expectedPoissonElectrons: 9.45, hypotheticalPoissonElectronCount: 9, readNoiseSigmaElectron: 1.2, readNoiseStandardNormalCoordinate: .25, fullWellElectron: 50_000, gainElectronPerAdu: .5, biasAdu: 100, adcBits: 16 },
  { sourceKind: "test-fixture", fixtureId: "underflow-floor", caseKind: "underflow-clipped", expectedPoissonElectrons: 1.3308, hypotheticalPoissonElectronCount: 0, readNoiseSigmaElectron: 2, readNoiseStandardNormalCoordinate: -1.5, fullWellElectron: 100, gainElectronPerAdu: 1, biasAdu: 50, adcBits: 12 },
  { sourceKind: "test-fixture", fixtureId: "full-well-clip", caseKind: "full-well-saturated", expectedPoissonElectrons: 1024, hypotheticalPoissonElectronCount: 1200, readNoiseSigmaElectron: 5, readNoiseStandardNormalCoordinate: .1, fullWellElectron: 1000, gainElectronPerAdu: 2, biasAdu: 100, adcBits: 16 },
  { sourceKind: "test-fixture", fixtureId: "adc-clip", caseKind: "adc-saturated", expectedPoissonElectrons: 1024, hypotheticalPoissonElectronCount: 1000, readNoiseSigmaElectron: .1, readNoiseStandardNormalCoordinate: 0, fullWellElectron: 5000, gainElectronPerAdu: .5, biasAdu: 10, adcBits: 10 },
];
const results = rows.map(computeKerrDetectorReadoutV453); const replay = rows.map(computeKerrDetectorReadoutV453); if (sha(results) !== sha(replay)) throw new Error("v453-fixture-ab-determinism");
const fixture = { version: "v453-kerr-detector-readout-fixture-v1", generatedAt: "2026-07-30T00:00:00Z", status: "hypothetical-readout-fixture-never-measured", rows, results, poissonSamplingPerformed: false, randomnessUsed: false, observedCountsAvailable: false, digitalAduAuthorityGranted: false, scienceRasterAllowed: false };
const target = resolve(root, output, "typescript-fixture.json"); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(fixture, null, 2)}\n`, "utf8"); renameSync(part, target);
console.log(JSON.stringify({ status: fixture.status, fixtureRows: 4, caseKinds: Object.fromEntries(results.map((row) => [row.fixtureId, row.caseKind])), randomnessUsed: false, observedRows: 0, scienceRasterRows: 0 }, null, 2));
