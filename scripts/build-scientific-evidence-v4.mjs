import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const scienceRoot = path.resolve("dist/science");
const ephemerisPath = path.join(scienceRoot, "relativity-promotion-v3-report.json");
const independentEphemerisPath = path.join(scienceRoot, "relativity-dop853-v4-report.json");
const kerrPath = path.join(scienceRoot, "kerr-v4-report.json");
const performancePath = path.join(scienceRoot, "performance-v4-report.json");
const regressionPath = path.join(scienceRoot, "regression-v4-report.json");
async function optionalJson(file) { try { return JSON.parse(await readFile(file, "utf8")); } catch (error) { if (error?.code === "ENOENT") return null; throw error; } }
async function sha256(file) { try { const hash = createHash("sha256"); hash.update(await readFile(file)); return hash.digest("hex"); } catch (error) { if (error?.code === "ENOENT") return ""; throw error; } }
const ephemeris = await optionalJson(ephemerisPath);
const independentEphemeris = await optionalJson(independentEphemerisPath);
const kerr = await optionalJson(kerrPath);
const performance = await optionalJson(performancePath);
const regression = await optionalJson(regressionPath);
const independentTenYear = independentEphemeris?.modes?.find((mode) => mode.mode === "eih-1pn-2pn-lt")?.checkpoints?.find((checkpoint) => checkpoint.label === "+10y");
const tenYear = independentTenYear ?? ephemeris?.modes?.find((mode) => mode.mode === "eih-1pn-2pn-lt")?.checkpoints?.find((checkpoint) => checkpoint.label === "+10y");
const selectedEphemerisPath = independentTenYear ? independentEphemerisPath : ephemerisPath;
const input = {
  generatedAt: new Date().toISOString(),
  tenYearPositionRmsKm: tenYear?.rmsPositionKm ?? ephemeris?.promotion?.positionRmsKm ?? null,
  tenYearVelocityRmsMS: tenYear?.rmsVelocityMs ?? ephemeris?.promotion?.velocityRmsMS ?? null,
  convergencePositionRmsKm: ephemeris?.convergence?.positionRmsKm ?? null,
  reversalPositionRmsM: ephemeris?.timeReversal?.positionRmsM ?? null,
  reversalVelocityRmsMS: ephemeris?.timeReversal?.velocityRmsMS ?? null,
  kerrHamiltonianDrift: kerr?.maxHamiltonianDrift ?? null,
  kerrCarterDrift: kerr?.maxCarterDrift ?? null,
  turningPointContinuationPassed: kerr?.turningPointContinuationPassed === true,
  performancePassed: performance?.passed === true,
  regressionPassed: regression?.passed === true,
};
const ephemerisPassed = input.tenYearPositionRmsKm != null && input.tenYearPositionRmsKm < 10000 && input.tenYearVelocityRmsMS != null && input.tenYearVelocityRmsMS < 1 && input.convergencePositionRmsKm != null && input.convergencePositionRmsKm < 1 && input.reversalPositionRmsM != null && input.reversalPositionRmsM < 10 && input.reversalVelocityRmsMS != null && input.reversalVelocityRmsMS < 1e-4;
const kerrPassed = input.kerrHamiltonianDrift != null && input.kerrHamiltonianDrift < 1e-8 && input.kerrCarterDrift != null && input.kerrCarterDrift < 1e-10 && input.turningPointContinuationPassed;
const blockers = [];
if (!ephemerisPassed) blockers.push("ephemeris-v4"); if (!kerrPassed) blockers.push("kerr-invariants-v4"); if (!input.performancePassed) blockers.push("hardware-performance-v4"); if (!input.regressionPassed) blockers.push("full-regression-v4");
const gate = (passed, measured, threshold, artifact, sha256) => ({ passed, measured, threshold, artifact, sha256 });
const bundle = {
  version: "v145-scientific-evidence-bundle-v4", generatedAt: input.generatedAt,
  ephemeris: { tenYearPositionRmsKm: input.tenYearPositionRmsKm, tenYearVelocityRmsMS: input.tenYearVelocityRmsMS, convergencePositionRmsKm: input.convergencePositionRmsKm, reversalPositionRmsM: input.reversalPositionRmsM, reversalVelocityRmsMS: input.reversalVelocityRmsMS, gate: gate(ephemerisPassed, `${input.tenYearPositionRmsKm} km / ${input.tenYearVelocityRmsMS} m/s`, "<10000 km / <1 m/s; convergence <1 km; reversal <10 m / <1e-4 m/s", path.relative(process.cwd(), selectedEphemerisPath).replaceAll("\\", "/"), await sha256(selectedEphemerisPath)) },
  kerr: { ...gate(kerrPassed, `Hamiltonian ${input.kerrHamiltonianDrift}; Carter ${input.kerrCarterDrift}`, "Hamiltonian <1e-8; Carter <1e-10; turning continuation", kerr ? path.relative(process.cwd(), kerrPath).replaceAll("\\", "/") : "", await sha256(kerrPath)), maxHamiltonianDrift: input.kerrHamiltonianDrift, maxCarterDrift: input.kerrCarterDrift, turningPointContinuationPassed: input.turningPointContinuationPassed },
  performance: gate(input.performancePassed, input.performancePassed ? "hardware gate passed" : "pending or failed", "overview >=55 FPS; science scenes >=45 FPS", performance ? path.relative(process.cwd(), performancePath).replaceAll("\\", "/") : "", await sha256(performancePath)),
  regression: gate(input.regressionPassed, input.regressionPassed ? "serial full regression passed" : "pending or failed", "tsc, focused, full tests, build and browser QA", regression ? path.relative(process.cwd(), regressionPath).replaceAll("\\", "/") : "", await sha256(regressionPath)),
  decision: blockers.length === 0 ? "promoted" : "blocked-shadow-retained", defaultKernel: blockers.length === 0 ? "relativity-force-model-v2" : "legacy-eih-1pn", blockers, boundary: "single-generated-source-fail-closed-legacy-retained",
};
await mkdir(scienceRoot, { recursive: true });
await writeFile(path.join(scienceRoot, "scientific-evidence-v4.json"), JSON.stringify(bundle, null, 2));
await mkdir(path.resolve("public/data"), { recursive: true });
await writeFile(path.resolve("public/data/scientific-evidence-v4.json"), JSON.stringify(bundle, null, 2));
console.log(`${bundle.version}: ${bundle.decision}; blockers=${bundle.blockers.join(",") || "none"}`);
