/* Dynamic legacy evidence JSON is validated below before promotion decisions. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createScientificEvidenceBundleV5, validateScientificEvidenceBundleV5 } from "../app/lib/scientificEvidenceBundleV5";
import { CURRENT_SCIENTIFIC_PROMOTION_DECISION_V7 } from "../app/lib/scientificPromotionDecisionV7";

async function main() {
const scienceRoot = path.resolve("dist/science");
const paths = {
  catalog: path.resolve("dist/catalog-v7/catalog-v7.report.json"),
  observation: path.join(scienceRoot, "observation-model-validation-v2.json"),
  ephemeris: path.join(scienceRoot, "relativity-dop853-v5-report.json"),
  kerrRuntime: path.join(scienceRoot, "kerr-v4-report.json"),
  kerrIndependent: path.join(scienceRoot, "kerr-independent-fixture-report-v5.json"),
  performance: path.join(scienceRoot, "performance-v5-report.json"),
  regression: path.join(scienceRoot, "regression-v5-report.json"),
};

async function optionalJson(file: string): Promise<Record<string, any> | null> {
  try { return JSON.parse(await readFile(file, "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
async function sha256(file: string): Promise<string> {
  try { return createHash("sha256").update(await readFile(file)).digest("hex"); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return ""; throw error; }
}
const relative = (file: string) => path.relative(process.cwd(), file).replaceAll("\\", "/");
await mkdir(scienceRoot, { recursive: true });

const [catalog, observation, ephemeris, kerrRuntime, kerrIndependent, performance, regression] = await Promise.all([
  optionalJson(paths.catalog), optionalJson(paths.observation), optionalJson(paths.ephemeris), optionalJson(paths.kerrRuntime),
  optionalJson(paths.kerrIndependent), optionalJson(paths.performance), optionalJson(paths.regression),
]);

const tenYear = ephemeris?.modes?.find((mode: any) => mode.mode === "eih-1pn-2pn-lt")?.checkpoints?.find((checkpoint: any) => checkpoint.offsetDays >= 3652);
const ephemerisPassed = Boolean(
  ephemeris?.version === "v150-scipy-dop853-independent-reference-v5" &&
  ephemeris?.durationDays >= 3652.5 && tenYear?.rmsPositionKm < 10_000 && tenYear?.rmsVelocityMs < 1 &&
  ephemeris?.convergence?.positionRmsKm < 1 && ephemeris?.timeReversal?.positionRmsM < 10 &&
  ephemeris?.timeReversal?.velocityRmsMS < 1e-4 && ephemeris?.liveStateMutated === false
);
const catalogPassed = Boolean(
  catalog?.passed === true && catalog?.rowCount >= 1_224_219 && catalog?.parameterRichCount >= 180_000 &&
  catalog?.priorityParameterRichCount >= 15_000 && catalog?.invalidIntervalCount === 0 && catalog?.duplicateSourceIdCount === 0
);
const observationPassed = Boolean(
  observation?.independentReference === true && observation?.passed === true &&
  observation?.transitRmsPpm < 50 && observation?.radialVelocityRmsMS < 0.1
);
const kerrPassed = Boolean(
  kerrIndependent?.independentReference === true && kerrIndependent?.passed === true &&
  kerrRuntime?.maxHamiltonianDrift < 1e-8 && kerrRuntime?.maxCarterDrift < 1e-10 &&
  kerrRuntime?.turningPointContinuationPassed === true
);
const performancePassed = Boolean(
  performance?.version === "v153-hardware-performance-v5" && performance?.passed === true &&
  performance?.softwareRenderer === false && performance?.resourcesReleased === true &&
  Array.isArray(performance?.samples) && performance.samples.length >= 5 &&
  performance.samples.every((sample: any) => sample.medianFps >= (sample.id === "overview" ? 55 : 45) && sample.frameP95Ms <= 50)
);
const kerrCompositePath = path.join(scienceRoot, "kerr-validation-v5.json");
await writeFile(kerrCompositePath, `${JSON.stringify({
  version: "v150-kerr-validation-composite-v5",
  generatedAt: new Date().toISOString(),
  runtimeArtifact: relative(paths.kerrRuntime),
  runtimeSha256: await sha256(paths.kerrRuntime),
  independentArtifact: relative(paths.kerrIndependent),
  independentSha256: await sha256(paths.kerrIndependent),
  maxHamiltonianDrift: kerrRuntime?.maxHamiltonianDrift ?? null,
  maxCarterDrift: kerrRuntime?.maxCarterDrift ?? null,
  turningPointContinuationPassed: kerrRuntime?.turningPointContinuationPassed === true,
  passed: kerrPassed,
}, null, 2)}\n`);

const bundle = createScientificEvidenceBundleV5({
  generatedAt: new Date().toISOString(),
  applyPromotion: false,
  promotionDecision: CURRENT_SCIENTIFIC_PROMOTION_DECISION_V7,
  dataCatalog: {
    passed: catalogPassed,
    independent: catalog?.passed === true,
    measured: catalog ? `${catalog.rowCount} objects; ${catalog.parameterRichCount} rich; ${catalog.priorityParameterRichCount} priority rich` : "missing catalog V7 report",
    artifact: catalog ? relative(paths.catalog) : "",
    sha256: await sha256(paths.catalog),
  },
  observationModels: {
    passed: observationPassed,
    independent: observation?.independentReference === true,
    measured: observation ? `${observation.transitRmsPpm} ppm; ${observation.radialVelocityRmsMS} m/s` : "missing independent observation validation",
    artifact: observation ? relative(paths.observation) : "",
    sha256: await sha256(paths.observation),
    transitRmsPpm: observation?.transitRmsPpm ?? null,
    radialVelocityRmsMS: observation?.radialVelocityRmsMS ?? null,
  },
  ephemeris: {
    passed: ephemerisPassed,
    independent: ephemeris?.version === "v150-scipy-dop853-independent-reference-v5",
    measured: ephemeris ? `${tenYear?.rmsPositionKm ?? "missing"} km / ${tenYear?.rmsVelocityMs ?? "missing"} m/s; convergence ${ephemeris.convergence?.positionRmsKm ?? "missing"} km; reversal ${ephemeris.timeReversal?.positionRmsM ?? "missing"} m` : "missing mandatory independent ten-year DOP853 report",
    artifact: ephemeris ? relative(paths.ephemeris) : "",
    sha256: await sha256(paths.ephemeris),
    tenYearPositionRmsKm: tenYear?.rmsPositionKm ?? null,
    tenYearVelocityRmsMS: tenYear?.rmsVelocityMs ?? null,
    convergencePositionRmsKm: ephemeris?.convergence?.positionRmsKm ?? null,
    reversalPositionRmsM: ephemeris?.timeReversal?.positionRmsM ?? null,
    reversalVelocityRmsMS: ephemeris?.timeReversal?.velocityRmsMS ?? null,
    durationDays: ephemeris?.durationDays ?? null,
  },
  kerr: {
    passed: kerrPassed,
    independent: kerrIndependent?.independentReference === true,
    measured: `Hamiltonian ${kerrRuntime?.maxHamiltonianDrift ?? "missing"}; Carter ${kerrRuntime?.maxCarterDrift ?? "missing"}; independent fixtures ${kerrIndependent?.fixtureCount ?? "missing"}`,
    artifact: relative(kerrCompositePath),
    sha256: await sha256(kerrCompositePath),
    maxHamiltonianDrift: kerrRuntime?.maxHamiltonianDrift ?? null,
    maxCarterDrift: kerrRuntime?.maxCarterDrift ?? null,
    turningPointContinuationPassed: kerrRuntime?.turningPointContinuationPassed === true,
  },
  performance: {
    passed: performancePassed,
    independent: performancePassed,
    measured: performancePassed ? `hardware performance gate passed on ${performance?.adapter?.renderer ?? "unknown adapter"}` : "hardware performance pending or failed",
    artifact: performance ? relative(paths.performance) : "",
    sha256: await sha256(paths.performance),
  },
  regression: {
    passed: regression?.passed === true && regression?.confirmed === true,
    independent: regression?.passed === true && regression?.confirmed === true,
    measured: regression?.passed === true ? "serial full regression report present" : "serial full regression pending or failed",
    artifact: regression ? relative(paths.regression) : "",
    sha256: await sha256(paths.regression),
  },
});
const validationErrors = validateScientificEvidenceBundleV5(bundle);
if (validationErrors.length > 0) throw new Error(`Scientific evidence V5 is internally inconsistent: ${validationErrors.join(", ")}`);
const output = path.join(scienceRoot, "scientific-evidence-v5.json");
await writeFile(output, `${JSON.stringify(bundle, null, 2)}\n`);
await mkdir(path.resolve("public/data"), { recursive: true });
await writeFile(path.resolve("public/data/scientific-evidence-v5.json"), `${JSON.stringify(bundle, null, 2)}\n`);
console.log(`${bundle.version}: ${bundle.decision}; eligible=${bundle.promotionEligible}; applied=${bundle.promotionApplied}; blockers=${bundle.blockers.join(",") || "none"}`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
