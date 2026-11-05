import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd(); const node = process.execPath;
const run = (label, command, args) => { const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`); };
run("v363-plan", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-detector-calibration-plan-v363.ts"]);
run("v363-evidence", node, ["scripts/build-shadow-candidate-v363.mjs"]);
run("v363-tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run", "app/lib/kerrDetectorCalibrationPlanV363.test.ts", "app/lib/kerrDetectorCalibrationPlanServerV363.test.ts", "app/api/atlas/relativity-evidence/v363/calibration-plan/route.test.ts", "app/components/DetectorCalibrationPlanSurfaceV363.test.tsx", "app/lib/atlasShadowCapabilityPointerV363.test.ts"]);
run("v363-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v363-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v363.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
const formal = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-product-evidence-v263.json"), "utf8"));
if (evidence.calibrationPlan?.acquisitionTaskCount !== 9 || evidence.calibrationPlan?.missingRequirementCount !== 11
  || evidence.calibrationPlan?.structuralRank !== 7 || evidence.calibrationPlan?.fullColumnRank !== true
  || evidence.calibrationPlan?.measuredPerformanceClaimed !== false || evidence.calibrationPlan?.taskExecutionStatus !== "not-run-plan-only"
  || pointer.capabilities?.v361Calibration !== "blocked-measured-calibration-input-unavailable"
  || pointer.capabilities?.v363CalibrationPlan !== "qualified-plan-only-nine-tasks-eleven-requirements"
  || pointer.capabilities?.v314CorrectedDense !== "incomplete-0-of-49" || pointer.localShadowDefaultApplied !== false
  || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer") throw new Error("v363 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v363-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, tasks: evidence.calibrationPlan.acquisitionTaskCount, requirements: evidence.calibrationPlan.missingRequirementCount, rank: evidence.calibrationPlan.structuralRank, bandPriority: evidence.calibrationPlan.bandPriority, measuredAuthority: pointer.capabilities.v363MeasuredAuthority, dense: pointer.capabilities.v314CorrectedDense, browser: evidence.browserQualification }, null, 2));
