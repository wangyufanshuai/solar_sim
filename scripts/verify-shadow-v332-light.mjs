import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
function run(label, command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
}

run("v332-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrScienceInstrumentResponseV332.test.ts",
  "app/lib/kerrScienceInstrumentResponseV332.generated.test.ts",
  "app/components/KerrSciencePhotonBandsV328.test.ts",
  "app/lib/atlasShadowCapabilityPointerV332.test.ts",
]);
run("v332-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v332-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-kerr-science-instrument-response-v332.ts",
  "scripts/build-shadow-candidate-v332.mjs",
  "scripts/verify-shadow-v332-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceInstrumentResponseV332.ts",
  "app/lib/kerrScienceInstrumentResponseV332.test.ts",
  "app/lib/kerrScienceInstrumentResponseV332.generated.test.ts",
  "app/components/KerrSciencePhotonBandsV328.tsx",
  "app/components/KerrSciencePhotonBandsV328.test.ts",
  "app/lib/atlasShadowCapabilityPointerV332.ts",
  "app/lib/atlasShadowCapabilityPointerV332.test.ts",
]);

const read = (relative) => JSON.parse(readFileSync(resolve(root, relative), "utf8"));
const evidence = read("dist/science/orbit-atlas-shadow-v332-evidence.json");
const pointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v332.json");
const state = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
if (evidence.instrument?.modelId !== "synthetic-reference-photon-counter-v332"
  || evidence.instrument?.modelStatus !== "synthetic-audit-fixture-not-calibrated-observatory"
  || evidence.instrument?.stochasticNoise !== "disabled" || evidence.instrument?.rowCount !== 12
  || evidence.instrument?.noRealInstrumentCalibrationClaim !== true
  || evidence.scienceBoundary?.detectorIndependentV331Preserved !== true || evidence.scienceBoundary?.responseNeverCinematicColorInput !== true
  || evidence.scienceBoundary?.deterministicExpectationNotMeasuredCounts !== true
  || evidence.runtime?.responseDerivation !== "bounded-useMemo-over-existing-v328-view-no-network-no-new-canvas"
  || pointer.capabilities?.v332InstrumentResponse !== "explicit-area-solid-angle-exposure-throughput-synthetic-fixture"
  || pointer.capabilities?.v332NoNoiseClaim !== "deterministic-expectation-no-read-noise-dark-current-dead-time-psf-pileup"
  || pointer.capabilities?.v332ScienceBoundary !== "response-never-cinematic-color-input-no-real-instrument-calibration"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) throw new Error("v332 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v332-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, modelId: evidence.instrument.modelId, rows: evidence.instrument.rowCount, maxQuadrature: evidence.instrument.maximumQuadratureRelativeDifference, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
