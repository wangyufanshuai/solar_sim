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
run("v355-audit", node, [resolve(root, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-spectral-eigenmode-audit-v355.ts"]);
run("v355-evidence", node, ["scripts/build-shadow-candidate-v355.mjs"]);
run("v355-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/kerrSpectralEigenmodeAuditV355.test.ts",
  "app/lib/kerrSpectralEigenmodeAuditServerV355.test.ts",
  "app/api/atlas/relativity-evidence/v355/spectral-eigenmodes/route.test.ts",
  "app/components/KerrSpectralEigenmodeSurfaceV355.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV355.test.ts",
]);
run("v355-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
const evidence = JSON.parse(readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v355-evidence.json"), "utf8"));
const pointer = JSON.parse(readFileSync(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v355.json"), "utf8"));
if (
  evidence.spectralEigenmodes?.eigenmodeCount !== 12 ||
  evidence.spectralEigenmodes?.ellipseCount !== 12 ||
  evidence.spectralEigenmodes?.reconstructionRelativeDifference > 1e-12 ||
  evidence.spectralEigenmodes?.eigenResidualRelativeDifference > 1e-12 ||
  pointer.capabilities?.v355MeasuredEigenmodeAuthority !== "unavailable-input-covariance-is-synthetic-not-measured" ||
  pointer.capabilities?.v314CorrectedDense !== "incomplete-0-of-49"
) throw new Error("v355-fail-closed-validation");
console.log(JSON.stringify({
  status: "passed-v355-low-memory",
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  artifactSha256: evidence.spectralEigenmodes.artifactSha256,
  eigenmodes: evidence.spectralEigenmodes.eigenmodeCount,
  ellipses: evidence.spectralEigenmodes.ellipseCount,
  reconstruction: evidence.spectralEigenmodes.reconstructionRelativeDifference,
  residual: evidence.spectralEigenmodes.eigenResidualRelativeDifference,
  measuredAuthority: evidence.spectralEigenmodes.fullMeasuredEigenmodeAuthority,
  dense: pointer.capabilities.v314CorrectedDense,
}, null, 2));
