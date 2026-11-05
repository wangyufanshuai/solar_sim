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

run("v354-audit", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-kerr-spectral-correlation-response-v354.ts",
]);
run("v354-evidence", node, ["scripts/build-shadow-candidate-v354.mjs"]);
run("v354-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/kerrSpectralCorrelationResponseV354.test.ts",
  "app/lib/kerrSpectralCorrelationResponseServerV354.test.ts",
  "app/api/atlas/relativity-evidence/v354/spectral-correlation/route.test.ts",
  "app/components/KerrSpectralCorrelationSurfaceV354.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV354.test.ts",
]);
run("v354-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);

const evidence = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v354-evidence.json"), "utf8"),
);
const pointer = JSON.parse(
  readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v354.json"), "utf8"),
);
if (
  evidence.spectralCorrelation?.rayCount !== 4 ||
  evidence.spectralCorrelation?.coefficientCount !== 9 ||
  evidence.spectralCorrelation?.perturbationExecutions !== 72 ||
  evidence.spectralCorrelation?.energyConservationRelativeDifference > 1e-12 ||
  !(evidence.spectralCorrelation?.responseRelativeSigma > 0) ||
  pointer.capabilities?.v354MeasuredCovariance !== "unavailable-synthetic-model-not-observatory-calibration" ||
  pointer.capabilities?.v314CorrectedDense !== "incomplete-0-of-49"
) {
  throw new Error("v354-fail-closed-validation");
}

console.log(JSON.stringify({
  status: "passed-v354-low-memory",
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  artifactSha256: evidence.spectralCorrelation.artifactSha256,
  rays: evidence.spectralCorrelation.rayCount,
  coefficients: evidence.spectralCorrelation.coefficientCount,
  responseSigma: evidence.spectralCorrelation.responseRelativeSigma,
  responseCorrelation: evidence.spectralCorrelation.responseCorrelationAbsoluteOffDiagonal,
  measuredEnvelope: evidence.spectralCorrelation.fullMeasuredResponseEnvelope,
  dense: pointer.capabilities.v314CorrectedDense,
}, null, 2));
