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

run("v372-inspect", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/inspect-observation-geometry-v372.ts",
]);
run("v372-evidence", node, ["scripts/build-shadow-candidate-v372.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v372-evidence.json"), "utf8"),
).evidenceSha256;
run("v372-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/observationGeometryValidationV372.test.ts",
  "app/lib/observationGeometryValidationInspectV372.test.ts",
  "app/lib/observationGeometryValidationInspectServerV372.test.ts",
  "app/api/atlas/relativity-evidence/v372/geometry-validation/route.test.ts",
  "app/components/ObservationGeometryValidationSurfaceV372.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV372.test.ts",
]);
run("v372-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v372-evidence-determinism", node, ["scripts/build-shadow-candidate-v372.mjs"]);

const evidence = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v372-evidence.json"), "utf8"),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v372.json"),
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
  "dist/science/observation-geometry-v372/validation.json",
  "dist/science/observation-geometry-v371/compiled.json",
  "dist/science/observation-geometry-v371/geometry.candidate.json",
  "dist/staging/detector-calibration-v369/observation-geometry.json",
];

if (
  evidence.evidenceSha256 !== firstEvidenceSha256 ||
  evidence.validation?.presentInputCount !== 0 ||
  evidence.validation?.validationExecuted !== false ||
  evidence.validation?.measuredValidationQualified !== false ||
  evidence.validation?.runtimeGeometryPublished !== false ||
  evidence.validation?.measuredAuthorityGranted !== false ||
  evidence.validation?.attemptConsumed !== false ||
  evidence.validation?.independentRecomputation?.compilerDerivedValuesTrusted !== false ||
  evidence.publicationBoundary?.explicitAdmissionImplemented !== false ||
  evidence.publicationBoundary?.validationIsAuthority !== false ||
  evidence.visual?.defaultApplied !== false ||
  evidence.visual?.legacyV9Default !== true ||
  pointer.capabilities?.v372Validator !==
    "implemented-independent-raw-recomputation" ||
  pointer.capabilities?.v372Input !== "blocked-0-of-6" ||
  pointer.capabilities?.v372Validation !== "not-run-attempt-unconsumed" ||
  pointer.capabilities?.v372MeasuredValidation !== "unavailable" ||
  pointer.capabilities?.v372RuntimeGeometry !== "unavailable" ||
  pointer.capabilities?.v372MeasuredAuthority !==
    "unavailable-explicit-admission-required" ||
  pointer.localShadowDefaultApplied !== false ||
  forbidden.some((path) => existsSync(resolve(root, path))) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer"
) {
  throw new Error("v372 fail-closed validation failed");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v372-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      validator: pointer.capabilities.v372Validator,
      input: pointer.capabilities.v372Input,
      validation: pointer.capabilities.v372Validation,
      measuredValidation: pointer.capabilities.v372MeasuredValidation,
      authority: pointer.capabilities.v372MeasuredAuthority,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);
