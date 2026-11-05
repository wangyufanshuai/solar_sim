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

run("v328-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrSciencePhotonBandsV328.test.ts",
  "app/lib/kerrSciencePhotonBandsV328.generated.test.ts",
  "app/components/KerrSciencePhotonBandsV328.test.ts",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/lib/atlasShadowCapabilityPointerV328.test.ts",
]);
run("v328-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v328-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-kerr-science-photon-bands-v328.ts",
  "scripts/build-shadow-candidate-v328.mjs",
  "scripts/verify-shadow-v328-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrSciencePhotonBandsV328.ts",
  "app/lib/kerrSciencePhotonBandsV328.test.ts",
  "app/lib/kerrSciencePhotonBandsV328.generated.test.ts",
  "app/components/KerrSciencePhotonBandsV328.tsx",
  "app/components/KerrSciencePhotonBandsV328.test.ts",
  "app/components/KerrScienceBandHudV322.tsx",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/lib/atlasShadowCapabilityPointerV328.ts",
  "app/lib/atlasShadowCapabilityPointerV328.test.ts",
]);

const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v328-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v328.json"), "utf8"));
const state = JSON.parse(readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
if (evidence.science?.applicableDiskRayCount !== 4 || evidence.science?.bandMeasurementCount !== 12
  || evidence.science?.maximumQuadratureRelativeDifference >= 2e-6
  || evidence.science?.integration !== "fixed-simpson-512-with-256-componentwise-audit"
  || evidence.science?.denseAggregateAccepted !== false
  || evidence.runtime?.scienceIntentOnly !== true || evidence.runtime?.cinematicHidden !== true
  || evidence.runtime?.photonValuesUsedAsCinematicColor !== false || evidence.runtime?.extraCanvasCreated !== false
  || evidence.runtime?.browserQualification !== "not-run"
  || pointer.capabilities?.v328PhotonObservables !== "four-rays-twelve-fixed-band-photon-radiances"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) throw new Error("v328 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v328-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, measurements: evidence.science.bandMeasurementCount, maximumQuadrature: evidence.science.maximumQuadratureRelativeDifference, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
