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

run("v371-inspect", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/inspect-observation-geometry-v371.ts",
]);
run("v371-evidence", node, ["scripts/build-shadow-candidate-v371.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v371-evidence.json"), "utf8"),
).evidenceSha256;
run("v371-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/observationGeometryCompilerV371.test.ts",
  "app/lib/observationGeometryImportV371.test.ts",
  "app/lib/observationGeometryImportServerV371.test.ts",
  "app/api/atlas/relativity-evidence/v371/geometry-import/route.test.ts",
  "app/components/ObservationGeometryImportSurfaceV371.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV371.test.ts",
]);
run("v371-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v371-evidence-determinism", node, ["scripts/build-shadow-candidate-v371.mjs"]);

const evidence = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v371-evidence.json"), "utf8"),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v371.json"),
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
  "dist/science/observation-geometry-v371/compiled.json",
  "dist/science/observation-geometry-v371/geometry.candidate.json",
  "dist/staging/detector-calibration-v369/observation-geometry.json",
];

if (
  evidence.evidenceSha256 !== firstEvidenceSha256 ||
  evidence.import?.presentFileCount !== 0 ||
  evidence.import?.compileExecuted !== false ||
  evidence.import?.candidatePublished !== false ||
  evidence.import?.runtimeGeometryPublished !== false ||
  evidence.import?.attemptConsumed !== false ||
  evidence.publicationBoundary?.measuredAuthorityGranted !== false ||
  evidence.publicationBoundary?.candidateIsRuntimeAuthority !== false ||
  evidence.visual?.defaultApplied !== false ||
  evidence.visual?.legacyV9Default !== true ||
  pointer.capabilities?.v371Input !== "blocked-0-of-4" ||
  pointer.capabilities?.v371Compile !== "not-run-attempt-unconsumed" ||
  pointer.capabilities?.v371Candidate !== "unavailable" ||
  pointer.capabilities?.v371RuntimeGeometry !== "unavailable" ||
  pointer.capabilities?.v371MeasuredAuthority !==
    "unavailable-independent-validation-required" ||
  pointer.localShadowDefaultApplied !== false ||
  forbidden.some((path) => existsSync(resolve(root, path))) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer"
) {
  throw new Error("v371 fail-closed validation failed");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v371-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      input: pointer.capabilities.v371Input,
      compile: pointer.capabilities.v371Compile,
      candidate: pointer.capabilities.v371Candidate,
      runtimeGeometry: pointer.capabilities.v371RuntimeGeometry,
      authority: pointer.capabilities.v371MeasuredAuthority,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);
