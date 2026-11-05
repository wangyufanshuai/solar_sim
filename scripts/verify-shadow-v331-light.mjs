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

run("v331-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrSciencePhotonProvenanceV331.test.ts",
  "app/lib/kerrSciencePhotonProvenanceV331.generated.test.ts",
  "app/components/KerrSciencePhotonBandsV328.test.ts",
  "app/lib/kerrScienceObservatoryStoreV329.test.ts",
  "app/lib/atlasShadowCapabilityPointerV331.test.ts",
]);
run("v331-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v331-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-kerr-science-photon-provenance-v331.ts",
  "scripts/build-shadow-candidate-v331.mjs",
  "scripts/verify-shadow-v331-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrSciencePhotonProvenanceV331.ts",
  "app/lib/kerrSciencePhotonProvenanceV331.test.ts",
  "app/lib/kerrSciencePhotonProvenanceV331.generated.test.ts",
  "app/components/KerrSciencePhotonBandsV328.tsx",
  "app/components/KerrSciencePhotonBandsV328.test.ts",
  "app/lib/atlasShadowCapabilityPointerV331.ts",
  "app/lib/atlasShadowCapabilityPointerV331.test.ts",
]);

const read = (relative) => JSON.parse(readFileSync(resolve(root, relative), "utf8"));
const evidence = read("dist/science/orbit-atlas-shadow-v331-evidence.json");
const pointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v331.json");
const state = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
if (evidence.provenance?.bandMeasurementCount !== 12 || evidence.provenance?.unit !== "photons s^-1 m^-2 sr^-1"
  || evidence.provenance?.noRawRayBuffer !== true || evidence.provenance?.noDetectorThroughputAreaExposure !== true
  || evidence.runtime?.onDemandDerivation !== true || evidence.runtime?.weakSingleFlight !== true || evidence.runtime?.extraReactState !== false
  || evidence.runtime?.objectUrlTracked !== true || evidence.runtime?.idempotentObjectUrlRelease !== true || evidence.runtime?.utf8LabelsCorrected !== true
  || pointer.capabilities?.v331PhotonProvenance !== "json-csv-sanitized-twelve-detector-independent-rows"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) throw new Error("v331 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v331-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, rows: evidence.provenance.bandMeasurementCount, provenanceSha256: evidence.dependency.photonProvenanceCanonicalSha256, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
