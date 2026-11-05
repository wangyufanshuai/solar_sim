import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
run("v367-inspect", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/inspect-detector-calibration-v367.ts"]);
run("v367-evidence", node, ["scripts/build-shadow-candidate-v367.mjs"]);
run("v367-tests", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/detectorCalibrationAuthorityAdmissionV367.test.ts",
  "app/lib/detectorCalibrationAuthorityInspectV367.test.ts",
  "app/lib/detectorCalibrationAuthorityInspectServerV367.test.ts",
  "app/api/atlas/relativity-evidence/v367/calibration-authority/route.test.ts",
  "app/components/DetectorCalibrationAuthoritySurfaceV367.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV367.test.ts",
]);
run("v367-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v367-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v367.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
const formal = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-product-evidence-v263.json"), "utf8"));
if (evidence.controller?.implemented !== true
  || evidence.controller?.explicitCommandOnly !== true
  || evidence.controller?.rejectsTestFixture !== true
  || evidence.controller?.automaticPromotionAllowed !== false
  || evidence.admissionInspect?.presentInputCount !== 0
  || evidence.admissionInspect?.missingInputs?.length !== 7
  || evidence.admissionInspect?.admissionExecuted !== false
  || evidence.admissionInspect?.measuredAuthorityGranted !== false
  || pointer.capabilities?.v367AdmissionExecution !== "not-run-attempt-not-consumed"
  || pointer.capabilities?.v367MeasuredAuthority !== "unavailable-no-authority-granted"
  || pointer.localShadowDefaultApplied !== false
  || state.completedShardCount !== 0
  || state.attemptConsumed !== false
  || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer") throw new Error("v367 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v367-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, controller: pointer.capabilities.v367AdmissionController, input: pointer.capabilities.v367AdmissionInput, fixture: pointer.capabilities.v367TestFixture, measuredAuthority: pointer.capabilities.v367MeasuredAuthority, dense: pointer.capabilities.v314CorrectedDense, browser: evidence.browserQualification }, null, 2));
