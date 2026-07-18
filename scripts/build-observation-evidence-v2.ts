import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  OBSERVATIONAL_ASTROPHYSICS_LAB_V2_VERSION,
  createRadialVelocitySamples,
  createTransitModelSamples,
  type ObservationValue,
  type RadialVelocityModelDocumentV2,
  type TransitModelDocumentV2,
} from "../app/lib/observationalAstrophysics";

type Sample = { phase: number; value: number };
type Fixture = {
  version: string;
  transit: { systemId: string; planetId: string; document: Record<string, number | number[]>; samples: Sample[]; rmsThresholdPpm: number };
  radialVelocity: { systemId: string; planetId: string; document: Record<string, number>; samples: Sample[]; rmsThresholdMS: number };
};

async function main() {
const fixturePath = path.resolve("public/data/observation-fixtures-v2.json");
const outputPath = path.resolve("dist/science/observation-model-validation-v2.json");
const bytes = await readFile(fixturePath);
const fixture = JSON.parse(bytes.toString("utf8")) as Fixture;
const observed = (field: string, value: number, unit = ""): ObservationValue<number> => ({ value, kind: "reported", source: fixture.version, field, unit, uncertaintyLower: null, uncertaintyUpper: null, reference: null, note: null });
const tuple = (value: readonly [number, number]): ObservationValue<readonly [number, number]> => ({ value, kind: "display-only", source: fixture.version, field: "limb_darkening", unit: "coefficient", uncertaintyLower: null, uncertaintyUpper: null, reference: null, note: null });
const rms = (left: readonly number[], right: readonly number[]) => Math.sqrt(left.reduce((sum, value, index) => sum + (value - right[index]) ** 2, 0) / left.length);

const transitInput = fixture.transit.document;
const transitDocument: TransitModelDocumentV2 = {
  version: OBSERVATIONAL_ASTROPHYSICS_LAB_V2_VERSION,
  systemId: fixture.transit.systemId,
  planetId: fixture.transit.planetId,
  periodDays: observed("pl_orbper", transitInput.periodDays as number, "day"),
  radiusRatio: observed("pl_ratror", transitInput.radiusRatio as number),
  scaledSemiMajorAxis: observed("pl_ratdor", transitInput.scaledSemiMajorAxis as number),
  inclinationDeg: observed("pl_orbincl", transitInput.inclinationDeg as number, "deg"),
  eccentricity: observed("pl_orbeccen", transitInput.eccentricity as number),
  argumentOfPeriastronDeg: observed("pl_orblper", transitInput.argumentOfPeriastronDeg as number, "deg"),
  transitMidpointBjd: observed("pl_tranmid", 0, "BJD"),
  limbDarkening: tuple(transitInput.limbDarkening as unknown as readonly [number, number]),
  sampleCount: transitInput.sampleCount as number,
  boundary: "worker-display-model-never-writes-solar-nbody",
};
const rvInput = fixture.radialVelocity.document;
const rvDocument: RadialVelocityModelDocumentV2 = {
  version: OBSERVATIONAL_ASTROPHYSICS_LAB_V2_VERSION,
  systemId: fixture.radialVelocity.systemId,
  planetId: fixture.radialVelocity.planetId,
  periodDays: observed("pl_orbper", rvInput.periodDays, "day"),
  semiAmplitudeMS: observed("pl_rvamp", rvInput.semiAmplitudeMS, "m/s"),
  eccentricity: observed("pl_orbeccen", rvInput.eccentricity),
  argumentOfPeriastronDeg: observed("pl_orblper", rvInput.argumentOfPeriastronDeg, "deg"),
  systemicVelocityMS: observed("systemic_velocity", rvInput.systemicVelocityMS, "m/s"),
  sampleCount: rvInput.sampleCount,
  boundary: "keplerian-display-model-never-writes-solar-nbody",
};
const transitSamples = createTransitModelSamples(transitDocument);
const rvSamples = createRadialVelocitySamples(rvDocument);
const transitRmsPpm = rms(transitSamples.map((sample) => sample.value), fixture.transit.samples.map((sample) => sample.value)) * 1e6;
const radialVelocityRmsMS = rms(rvSamples.map((sample) => sample.value), fixture.radialVelocity.samples.map((sample) => sample.value));
const passed = transitRmsPpm < fixture.transit.rmsThresholdPpm && radialVelocityRmsMS < fixture.radialVelocity.rmsThresholdMS;
const report = {
  version: "v149-observation-model-validation-v2",
  generatedAt: new Date().toISOString(),
  fixture: path.relative(process.cwd(), fixturePath).replaceAll("\\", "/"),
  fixtureSha256: createHash("sha256").update(bytes).digest("hex"),
  independentReference: true,
  transitRmsPpm,
  radialVelocityRmsMS,
  thresholds: { transitRmsPpm: fixture.transit.rmsThresholdPpm, radialVelocityRmsMS: fixture.radialVelocity.rmsThresholdMS },
  passed,
  boundary: "independent-batman-and-keplerian-fixtures-runtime-state-isolated",
};
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.version}: transit=${transitRmsPpm.toFixed(3)} ppm; RV=${radialVelocityRmsMS.toExponential(3)} m/s; passed=${passed}`);
if (!passed) process.exitCode = 1;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
