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
run("v376-inspect", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/inspect-expected-electron-image-v376.ts",
]);
run("v376-evidence", node, ["scripts/build-shadow-candidate-v376.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v376-evidence.json"), "utf8"),
).evidenceSha256;
run("v376-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/expectedElectronScienceImageV376.test.ts",
  "app/lib/expectedElectronScienceImageInspectV376.test.ts",
  "app/lib/expectedElectronScienceImageInspectServerV376.test.ts",
  "app/api/atlas/relativity-evidence/v376/expected-electron-image/route.test.ts",
  "app/components/ExpectedElectronScienceImageSurfaceV376.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV376.test.ts",
]);
run("v376-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v376-evidence-determinism", node, ["scripts/build-shadow-candidate-v376.mjs"]);

const evidence = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v376-evidence.json"), "utf8"),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v376.json"),
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
  evidence.image?.presentInputCount !== 0 ||
  evidence.image?.imageAvailable !== false ||
  evidence.image?.jsonPublished !== false ||
  evidence.image?.csvPublished !== false ||
  evidence.image?.zeroImageFallbackUsed !== false ||
  evidence.image?.observedCountsAvailable !== false ||
  evidence.image?.attemptConsumed !== false ||
  evidence.displayBoundary?.imageArraysExist !== false ||
  evidence.displayBoundary?.zeroImageFallbackAllowed !== false ||
  evidence.displayBoundary?.cinematicCopyAllowed !== false ||
  evidence.visual?.defaultApplied !== false ||
  evidence.visual?.legacyV9Default !== true ||
  pointer.capabilities?.v375DualAuthorityEnvelope !== "unavailable" ||
  pointer.capabilities?.v376Input !== "blocked-0-of-1" ||
  pointer.capabilities?.v376Build !== "not-run-attempt-unconsumed" ||
  pointer.capabilities?.v376ScienceImage !== "unavailable-no-pixel-arrays" ||
  pointer.capabilities?.v376JsonCsv !== "unavailable" ||
  pointer.capabilities?.v376ZeroImageFallback !== "disabled" ||
  pointer.capabilities?.v376ObservedCounts !==
    "unavailable-expectation-is-not-observation" ||
  pointer.localShadowDefaultApplied !== false ||
  forbidden.some((path) => existsSync(resolve(root, path))) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer"
) {
  throw new Error("v376 fail-closed validation failed");
}
console.log(
  JSON.stringify(
    {
      status: "passed-v376-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      compiler: pointer.capabilities.v376Compiler,
      input: pointer.capabilities.v376Input,
      image: pointer.capabilities.v376ScienceImage,
      jsonCsv: pointer.capabilities.v376JsonCsv,
      zeroFallback: pointer.capabilities.v376ZeroImageFallback,
      observedCounts: pointer.capabilities.v376ObservedCounts,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);
