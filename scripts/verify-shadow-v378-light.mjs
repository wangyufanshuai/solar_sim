import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
run("v378-topology", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-measurement-authority-topology-v378.ts",
]);
run("v378-evidence", node, ["scripts/build-shadow-candidate-v378.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v378-evidence.json"), "utf8"),
).evidenceSha256;
run("v378-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/measurementAuthorityTopologyV378.test.ts",
  "app/lib/measurementAuthorityTopologyServerV378.test.ts",
  "app/api/atlas/relativity-evidence/v378/measurement-authority-topology/route.test.ts",
  "app/components/MeasurementAuthorityTopologySurfaceV378.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV378.test.ts",
]);
run("v378-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v378-evidence-determinism", node, ["scripts/build-shadow-candidate-v378.mjs"]);

const topology = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/measurement-authority-topology-v378/topology.json"),
    "utf8",
  ),
);
const evidence = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v378-evidence.json"), "utf8"),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v378.json"),
    "utf8",
  ),
);
const state = JSON.parse(
  readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"),
);
const formal = JSON.parse(
  readFileSync(resolve(root, "dist/release/orbit-atlas-current-product-evidence-v263.json"), "utf8"),
);
const forbidden = [
  "dist/science/measured-expectation-v375/envelope.json",
  "dist/science/expected-electron-image-v376/image.json",
  "dist/science/expected-electron-image-v376/image.csv",
];
if (
  evidence.evidenceSha256 !== firstEvidenceSha256 ||
  topology.nodeCount !== 10 ||
  topology.edgeCount !== 9 ||
  topology.acyclic !== true ||
  topology.presentInputCount !== 1 ||
  topology.missingInputCount !== 7 ||
  topology.nodes?.filter((node) => node.status === "qualified").length !== 1 ||
  topology.nodes?.find((node) => node.status === "qualified")?.id !==
    "v328-photon-radiance" ||
  topology.boundaries?.observedCountsNodeExists !== false ||
  topology.boundaries?.syntheticFallbackAllowed !== false ||
  topology.boundaries?.zeroImageFallbackAllowed !== false ||
  evidence.authorityBoundary?.expectationAvailable !== false ||
  evidence.authorityBoundary?.scienceImageAvailable !== false ||
  evidence.authorityBoundary?.imageArraysExist !== false ||
  evidence.runtime?.defaultApplied !== false ||
  evidence.runtime?.legacyV9Default !== true ||
  pointer.capabilities?.v378AuthorityTopology !==
    "qualified-acyclic-10-nodes-9-required-edges" ||
  pointer.capabilities?.v378AuthorityInput !== "partial-1-of-8" ||
  pointer.capabilities?.v378ObservedCountsBoundary !==
    "outside-graph-no-node-no-promotion" ||
  pointer.localShadowDefaultApplied !== false ||
  forbidden.some((path) => existsSync(resolve(root, path))) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  evidence.browserQualification !== "not-run"
) {
  throw new Error("v378 fail-closed validation failed");
}
console.log(
  JSON.stringify(
    {
      status: "passed-v378-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      topology: `${topology.nodeCount}-nodes/${topology.edgeCount}-edges`,
      input: `${topology.presentInputCount}/${topology.expectedInputCount}`,
      observedCountsNode: topology.boundaries.observedCountsNodeExists,
      image: pointer.capabilities.v376ScienceImage,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);
