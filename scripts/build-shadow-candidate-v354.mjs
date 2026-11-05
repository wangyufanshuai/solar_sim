import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v353Evidence: "dist/science/orbit-atlas-shadow-v353-evidence.json",
  v353Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v353.json",
  audit: "dist/science/kerr-spectral-correlation-response-v354/audit.json",
  replay: "dist/science/kerr-spectral-correlation-response-v354/replay.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v354-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v354.json",
};

const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha256 = (path) => createHash("sha256").update(bytes(path)).digest("hex");

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

const canonicalSha256 = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

function atomicWrite(path, value) {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
}

const v353Evidence = read(paths.v353Evidence);
const v353Pointer = read(paths.v353Pointer);
const audit = read(paths.audit);
const replay = read(paths.replay);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  v353Evidence.status !== "spectral-shape-v353-qualified-fixture-browser-pending-dense-incomplete-0-of-49" ||
  v353Pointer.capabilities?.v353SpectralShape !== "qualified-energy-normalized-frequency-tilt-fixture" ||
  audit.status !== "qualified-synthetic-correlated-spectral-response-audit" ||
  audit.counts?.rayCount !== 4 ||
  audit.counts?.coefficientCount !== 9 ||
  audit.counts?.perturbationExecutions !== 72 ||
  audit.maxima?.energyConservationRelativeDifference > 1e-12 ||
  audit.maxima?.centralDifferenceNonlinearity > 1e-3 ||
  !(audit.maxima?.responseRelativeSigma > 0) ||
  !(audit.maxima?.responseCorrelationAbsoluteOffDiagonal > 0) ||
  !(audit.positiveDefiniteness?.coefficientCovarianceMinimumCholeskyPivot > 0) ||
  audit.model?.covariancePolicy !== "explicit-synthetic-correlation-quadratic-form-not-rss-independence-claim" ||
  audit.fullMeasuredResponseEnvelope !== "unavailable-synthetic-correlation-model-not-measured-spectral-covariance" ||
  audit.scienceCinematicBoundary !== "correlated-spectral-response-audit-never-cinematic-color-input" ||
  audit.denseCampaignStatus !== "incomplete-0-of-49" ||
  replay.deterministic !== true ||
  replay.noMeasuredCovarianceClaim !== true ||
  replay.noRssIndependenceClaim !== true ||
  replay.covarianceSymmetryDifference > 1e-15 ||
  replay.correlationDiagonalDifference > 1e-12 ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
) {
  throw new Error("v354-spectral-correlation-boundary");
}

const sourcePaths = [
  "app/lib/kerrSpectralCorrelationResponseV354.ts",
  "app/lib/kerrSpectralCorrelationResponseV354.test.ts",
  "app/lib/kerrSpectralCorrelationResponseServerV354.ts",
  "app/lib/kerrSpectralCorrelationResponseServerV354.test.ts",
  "app/api/atlas/relativity-evidence/v354/spectral-correlation/route.ts",
  "app/api/atlas/relativity-evidence/v354/spectral-correlation/route.test.ts",
  "app/components/KerrSpectralCorrelationSurfaceV354.tsx",
  "app/components/KerrSpectralCorrelationSurfaceV354.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV354.ts",
  "app/lib/atlasShadowCapabilityPointerV354.test.ts",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "scripts/build-kerr-spectral-correlation-response-v354.ts",
  "scripts/build-shadow-candidate-v354.mjs",
  "scripts/verify-shadow-v354-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha256(path) }));
const summary = {
  status: audit.status,
  artifactSha256: audit.artifactSha256,
  replaySha256: replay.artifactSha256,
  rayCount: audit.counts.rayCount,
  coefficientCount: audit.counts.coefficientCount,
  perturbationExecutions: audit.counts.perturbationExecutions,
  energyConservationRelativeDifference: audit.maxima.energyConservationRelativeDifference,
  centralDifferenceNonlinearity: audit.maxima.centralDifferenceNonlinearity,
  responseRelativeSigma: audit.maxima.responseRelativeSigma,
  responseCorrelationAbsoluteOffDiagonal: audit.maxima.responseCorrelationAbsoluteOffDiagonal,
  coefficientCovarianceMinimumCholeskyPivot:
    audit.positiveDefiniteness.coefficientCovarianceMinimumCholeskyPivot,
  covariancePolicy: audit.model.covariancePolicy,
  fullMeasuredResponseEnvelope: audit.fullMeasuredResponseEnvelope,
  scienceCinematicBoundary: audit.scienceCinematicBoundary,
  denseStatus: audit.denseCampaignStatus,
};

const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v354-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "spectral-correlation-v354-qualified-fixture-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v353EvidenceSha256: v353Evidence.evidenceSha256,
    v353PointerSha256: v353Pointer.pointerSha256,
    spectralShapeArtifactSha256: audit.source.spectralShapeArtifactSha256,
    correlationArtifactSha256: audit.artifactSha256,
    fullShortAuthoritySha256: audit.source.fullShortAuthoritySha256,
  },
  spectralCorrelation: summary,
  browserQualification: "not-run",
  sourceManifest,
  sourceSha256: canonicalSha256(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerAdvanced: false,
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  boundary: "v354-explicit-synthetic-covariance-not-measured-calibration-no-cinematic-input-dense-incomplete",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: canonicalSha256(evidenceUnsigned) };
atomicWrite(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v354",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v353SpectralShape: "qualified-energy-normalized-frequency-tilt-fixture",
    v354SpectralCorrelation: "qualified-explicit-positive-definite-synthetic-covariance",
    v354CovariancePolicy: "explicit-synthetic-correlation-quadratic-form-not-rss-independence-claim",
    v354MeasuredCovariance: "unavailable-synthetic-model-not-observatory-calibration",
    v354FullMeasuredResponseEnvelope: "unavailable-synthetic-correlation-model-not-measured-spectral-covariance",
    v354CinematicBoundary: "correlated-spectral-response-audit-never-cinematic-color-input",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha256(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha256(pointerUnsigned) };
atomicWrite(paths.pointer, pointer);

console.log(JSON.stringify({
  status: pointer.status,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  artifactSha256: audit.artifactSha256,
  rays: summary.rayCount,
  coefficients: summary.coefficientCount,
  perturbationExecutions: summary.perturbationExecutions,
  responseSigma: summary.responseRelativeSigma,
  responseCorrelation: summary.responseCorrelationAbsoluteOffDiagonal,
  measuredEnvelope: summary.fullMeasuredResponseEnvelope,
  dense: pointer.capabilities.v314CorrectedDense,
}, null, 2));
