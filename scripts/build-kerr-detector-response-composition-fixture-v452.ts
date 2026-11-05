import { createHash } from "node:crypto";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalPayloadV452,
  computeKerrDetectorResponseCompositionV452,
  type KerrDetectorResponseCompositionInputV452,
} from "../app/lib/kerrDetectorResponseCompositionV452";

const root = process.cwd();
const output = "dist/science/kerr-detector-response-composition-v452";
const sha = (value: unknown): string =>
  createHash("sha256").update(canonicalPayloadV452(value)).digest("hex");
const rows: KerrDetectorResponseCompositionInputV452[] = [
  {
    sourceKind: "test-fixture",
    fixtureId: "includes-qe-12",
    rayIndex: 12,
    semantics: "throughput-includes-detector-qe",
    sourcePhotonRadiancePerSM2Sr: 12,
    geometricAreaM2WithoutThroughput: 2,
    pixelSolidAngleSr: 0.1,
    exposureSeconds: 5,
    throughputFraction: 0.7,
    detectorQuantumEfficiencyFraction: 1,
    backgroundElectronPerSecondPerPixel: 0.2,
    darkCurrentElectronPerSecondPerPixel: 0.01,
    gainElectronPerAdu: 2,
  },
  {
    sourceKind: "test-fixture",
    fixtureId: "includes-qe-13",
    rayIndex: 13,
    semantics: "throughput-includes-detector-qe",
    sourcePhotonRadiancePerSM2Sr: 8.5,
    geometricAreaM2WithoutThroughput: 1.25,
    pixelSolidAngleSr: 0.08,
    exposureSeconds: 12,
    throughputFraction: 0.62,
    detectorQuantumEfficiencyFraction: 1,
    backgroundElectronPerSecondPerPixel: 0.05,
    darkCurrentElectronPerSecondPerPixel: 0.004,
    gainElectronPerAdu: 1.7,
  },
  {
    sourceKind: "test-fixture",
    fixtureId: "excludes-qe-14",
    rayIndex: 14,
    semantics: "throughput-excludes-detector-qe",
    sourcePhotonRadiancePerSM2Sr: 21,
    geometricAreaM2WithoutThroughput: 0.75,
    pixelSolidAngleSr: 0.04,
    exposureSeconds: 3,
    throughputFraction: 0.8,
    detectorQuantumEfficiencyFraction: 0.65,
    backgroundElectronPerSecondPerPixel: 0.11,
    darkCurrentElectronPerSecondPerPixel: 0.006,
    gainElectronPerAdu: 3.2,
  },
  {
    sourceKind: "test-fixture",
    fixtureId: "excludes-qe-15",
    rayIndex: 15,
    semantics: "throughput-excludes-detector-qe",
    sourcePhotonRadiancePerSM2Sr: 4.25,
    geometricAreaM2WithoutThroughput: 3,
    pixelSolidAngleSr: 0.015,
    exposureSeconds: 20,
    throughputFraction: 0.45,
    detectorQuantumEfficiencyFraction: 0.9,
    backgroundElectronPerSecondPerPixel: 0.03,
    darkCurrentElectronPerSecondPerPixel: 0.002,
    gainElectronPerAdu: 1.25,
  },
];
const results = rows.map(computeKerrDetectorResponseCompositionV452);
const replay = rows.map(computeKerrDetectorResponseCompositionV452);
if (sha(results) !== sha(replay)) throw new Error("v452-fixture-ab-determinism");
const fixture = {
  version: "v452-kerr-detector-response-composition-fixture-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status: "test-fixture-only-no-measured-authority",
  rows,
  results,
  measuredDetectorAuthorityGranted: false,
  observedCountsAvailable: false,
  scienceRasterAllowed: false,
};
const target = resolve(root, output, "typescript-fixture.json");
mkdirSync(dirname(target), { recursive: true });
const part = `${target}.${process.pid}.part`;
writeFileSync(part, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
renameSync(part, target);
console.log(JSON.stringify({
  status: fixture.status,
  fixtureRows: results.length,
  includesQeRows: results.filter((row) => row.semantics === "throughput-includes-detector-qe").length,
  excludesQeRows: results.filter((row) => row.semantics === "throughput-excludes-detector-qe").length,
  measuredRows: 0,
  scienceRasterRows: 0,
}, null, 2));
