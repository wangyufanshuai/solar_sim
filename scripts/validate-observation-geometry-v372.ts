import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import {
  validateObservationGeometryIndependentlyV372,
  type ObservationGeometryCandidateV372,
  type ObservationGeometryCompiledArtifactV372,
} from "../app/lib/observationGeometryValidationV372";

const root = process.cwd();
const output = "dist/science/observation-geometry-v372/validation.json";
const paths = {
  compilation: "dist/science/observation-geometry-v371/compiled.json",
  candidate: "dist/science/observation-geometry-v371/geometry.candidate.json",
  identity: "dist/staging/observation-geometry-v371/identity.json",
  collectingArea: "dist/staging/observation-geometry-v371/collecting-area.csv",
  plateScale: "dist/staging/observation-geometry-v371/plate-scale.csv",
  provenance: "dist/staging/observation-geometry-v371/provenance.json",
};
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const fileSha = (path: string) =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

if (existsSync(resolve(root, output))) {
  throw new Error("v372-refuse-overwrite-existing-validation");
}
const compilation = JSON.parse(read(paths.compilation)) as ObservationGeometryCompiledArtifactV372;
const candidate = JSON.parse(read(paths.candidate)) as ObservationGeometryCandidateV372;
const result = validateObservationGeometryIndependentlyV372({
  compilation,
  candidate,
  identitySource: read(paths.identity),
  collectingAreaSource: read(paths.collectingArea),
  plateScaleSource: read(paths.plateScale),
  provenanceSource: read(paths.provenance),
  sourceKind: "measured-import",
});
if (
  !result.passed ||
  !result.measuredValidationQualified ||
  result.measuredAuthorityGranted ||
  result.runtimeGeometryPublished ||
  !result.independentFromCompilerDerivations
) {
  throw new Error(`v372-validation:${result.failures.join(",")}`);
}
const unsigned = {
  ...result,
  generatedAt: new Date().toISOString(),
  inputFileSha256: {
    compilation: fileSha(paths.compilation),
    candidate: fileSha(paths.candidate),
    identity: fileSha(paths.identity),
    collectingArea: fileSha(paths.collectingArea),
    plateScale: fileSha(paths.plateScale),
    provenance: fileSha(paths.provenance),
  },
  validationAttemptConsumed: true,
  networkAttempted: false,
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      passed: artifact.passed,
      measuredValidationQualified: artifact.measuredValidationQualified,
      measuredAuthorityGranted: artifact.measuredAuthorityGranted,
      runtimeGeometryPublished: artifact.runtimeGeometryPublished,
      independentFromCompilerDerivations: artifact.independentFromCompilerDerivations,
    },
    null,
    2,
  ),
);
