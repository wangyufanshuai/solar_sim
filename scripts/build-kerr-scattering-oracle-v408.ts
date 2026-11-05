import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  KERR_SCATTERING_ORACLE_ARTIFACT_VERSION_V408,
  KERR_SCATTERING_ORACLE_PYTHON_SHA256_V408,
  KERR_SCATTERING_V407_ARTIFACT_SHA256_V408,
  createKerrScatteringOracleViewV408,
  parseKerrScatteringOracleArtifactV408,
  parseKerrScatteringOraclePythonResultV408,
} from "../app/lib/kerrScatteringOracleV408";
import {
  KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406,
  parseKerrScatteringAtmosphereArtifactV407,
} from "../app/lib/kerrScatteringAtmosphereV407";

const root = process.cwd();
const input = "dist/science/kerr-scattering-oracle-v408/numerical-oracle.json";
const v407Input = "dist/science/kerr-scattering-atmosphere-v407/short-gate.json";
const output = "dist/science/kerr-scattering-oracle-v408/portable-envelope.json";
const canonicalTransientKeys = new Set(["generatedAt", "artifactSha256", "observedPeakRssGiB"]);

const read = (path: string): unknown => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .filter(([key]) => !canonicalTransientKeys.has(key))
          .sort(([first], [second]) => first.localeCompare(second))
          .map(([key, entry]) => [key, canonicalize(entry)]),
      );
const canonicalSha = (value: unknown): string => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const raw = parseKerrScatteringOraclePythonResultV408(read(input));
const v407 = parseKerrScatteringAtmosphereArtifactV407(read(v407Input));
if (raw.evidenceSha256 !== KERR_SCATTERING_ORACLE_PYTHON_SHA256_V408 || v407.artifactSha256 !== KERR_SCATTERING_V407_ARTIFACT_SHA256_V408) throw new Error("v408-source-lock");

const firstView = createKerrScatteringOracleViewV408(raw);
const secondView = createKerrScatteringOracleViewV408(raw);
if (JSON.stringify(firstView) !== JSON.stringify(secondView)) throw new Error("v408-portable-view-nondeterminism");

const unsigned = {
  version: KERR_SCATTERING_ORACLE_ARTIFACT_VERSION_V408,
  generatedAt: raw.generatedAt,
  sourcePythonEvidenceSha256: KERR_SCATTERING_ORACLE_PYTHON_SHA256_V408,
  sourceArtifacts: Object.freeze({
    v407ScatteringAtmosphere: KERR_SCATTERING_V407_ARTIFACT_SHA256_V408,
    v406Stokes: KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406,
  }),
  view: firstView,
  observedPeakRssGiB: raw.resource.peakRssGiB,
  deterministicReplay: true as const,
  networkAttemptedByPortableBuild: false as const,
  denseShardExecuted: false as const,
  boundary: "portable-independent-numerical-reference-envelope-no-exact-table-or-product-promotion" as const,
};
const artifact = parseKerrScatteringOracleArtifactV408({ ...unsigned, artifactSha256: canonicalSha(unsigned) });
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
renameSync(temporary, target);

console.log(JSON.stringify({
  status: artifact.view.status,
  sourcePythonEvidenceSha256: artifact.sourcePythonEvidenceSha256,
  artifactSha256: artifact.artifactSha256,
  rayCount: artifact.view.rayComparisons.length,
  curveSampleCount: artifact.view.curveEnvelope.sampleCount,
  rayRelativeErrors: artifact.view.rayComparisons.map((ray) => ray.relativeApproximationError),
  maximumRayNumericalUncertainty: artifact.view.maxima.rayNumericalUncertaintyLinearSumAbsolute,
  exactHFunctionTableAuthority: artifact.view.authorityBoundary.exactChandrasekharHFunctionTableAuthority,
  output,
}, null, 2));
