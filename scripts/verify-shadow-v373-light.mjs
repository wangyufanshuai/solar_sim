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

run("v373-inspect", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/inspect-observation-geometry-v373.ts",
]);
run("v373-evidence", node, ["scripts/build-shadow-candidate-v373.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v373-evidence.json"), "utf8"),
).evidenceSha256;
run("v373-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/observationGeometryAuthorityAdmissionV373.test.ts",
  "app/lib/observationGeometryAuthorityInspectV373.test.ts",
  "app/lib/observationGeometryAuthorityInspectServerV373.test.ts",
  "app/api/atlas/relativity-evidence/v373/geometry-authority/route.test.ts",
  "app/components/ObservationGeometryAuthoritySurfaceV373.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV373.test.ts",
]);
run("v373-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v373-evidence-determinism", node, ["scripts/build-shadow-candidate-v373.mjs"]);

const evidence = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v373-evidence.json"), "utf8"),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v373.json"),
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
  "dist/science/observation-geometry-v373/admission.json",
  "dist/release/orbit-atlas-observation-geometry-authority-v373.json",
  "dist/science/observation-geometry-v372/validation.json",
  "dist/science/observation-geometry-v371/geometry.candidate.json",
  "dist/staging/detector-calibration-v369/observation-geometry.json",
];

if (
  evidence.evidenceSha256 !== firstEvidenceSha256 ||
  evidence.admission?.presentInputCount !== 0 ||
  evidence.admission?.admissionExecuted !== false ||
  evidence.admission?.authorityPointerPublished !== false ||
  evidence.admission?.runtimeGeometryPublished !== false ||
  evidence.admission?.measuredAuthorityGranted !== false ||
  evidence.admission?.attemptConsumed !== false ||
  evidence.admission?.automaticPromotionAllowed !== false ||
  evidence.publicationBoundary?.runtimeGeometryPublicationAllowed !== false ||
  evidence.publicationBoundary?.authorityPointerIsRuntimeGeometry !== false ||
  evidence.visual?.defaultApplied !== false ||
  evidence.visual?.legacyV9Default !== true ||
  pointer.capabilities?.v373AdmissionController !==
    "implemented-identity-sha-validation-fail-closed" ||
  pointer.capabilities?.v373Input !== "blocked-0-of-7" ||
  pointer.capabilities?.v373Admission !== "not-run-attempt-unconsumed" ||
  pointer.capabilities?.v373AuthorityPointer !== "unavailable" ||
  pointer.capabilities?.v373RuntimeGeometry !==
    "unavailable-separate-publication-required" ||
  pointer.capabilities?.v373MeasuredAuthority !==
    "unavailable-no-authority-granted" ||
  pointer.localShadowDefaultApplied !== false ||
  forbidden.some((path) => existsSync(resolve(root, path))) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer"
) {
  throw new Error("v373 fail-closed validation failed");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v373-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      controller: pointer.capabilities.v373AdmissionController,
      input: pointer.capabilities.v373Input,
      admission: pointer.capabilities.v373Admission,
      authorityPointer: pointer.capabilities.v373AuthorityPointer,
      runtimeGeometry: pointer.capabilities.v373RuntimeGeometry,
      authority: pointer.capabilities.v373MeasuredAuthority,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);
