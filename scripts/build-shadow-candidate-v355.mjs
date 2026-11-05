import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v354Evidence: "dist/science/orbit-atlas-shadow-v354-evidence.json",
  v354Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v354.json",
  audit: "dist/science/kerr-spectral-eigenmode-audit-v355/audit.json",
  replay: "dist/science/kerr-spectral-eigenmode-audit-v355/replay.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v355-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v355.json",
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

const v354Evidence = read(paths.v354Evidence);
const v354Pointer = read(paths.v354Pointer);
const audit = read(paths.audit);
const replay = read(paths.replay);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  v354Evidence.status !== "spectral-correlation-v354-qualified-fixture-browser-pending-dense-incomplete-0-of-49" ||
  v354Pointer.capabilities?.v354SpectralCorrelation !== "qualified-explicit-positive-definite-synthetic-covariance" ||
  audit.status !== "qualified-synthetic-response-eigenmode-and-ellipse-audit" ||
  audit.counts?.rayCount !== 4 ||
  audit.counts?.eigenmodeCount !== 12 ||
  audit.counts?.ellipseCount !== 12 ||
  audit.maxima?.orthonormalityDeviation > 1e-12 ||
  audit.maxima?.reconstructionRelativeDifference > 1e-12 ||
  audit.maxima?.eigenResidualRelativeDifference > 1e-12 ||
  audit.maxima?.traceConservationRelativeDifference > 1e-12 ||
  audit.decomposition?.covariancePolicy !== "decomposition-of-v354-explicit-synthetic-covariance-no-new-independence-claim" ||
  audit.fullMeasuredEigenmodeAuthority !== "unavailable-input-covariance-is-synthetic-not-measured" ||
  audit.scienceCinematicBoundary !== "spectral-eigenmodes-and-ellipses-never-cinematic-color-input" ||
  audit.denseCampaignStatus !== "incomplete-0-of-49" ||
  replay.deterministic !== true ||
  replay.noMeasuredEigenmodeClaim !== true ||
  replay.noNewIndependenceClaim !== true ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
) throw new Error("v355-eigenmode-boundary");

const sourcePaths = [
  "app/lib/kerrSpectralEigenmodeAuditV355.ts",
  "app/lib/kerrSpectralEigenmodeAuditV355.test.ts",
  "app/lib/kerrSpectralEigenmodeAuditServerV355.ts",
  "app/lib/kerrSpectralEigenmodeAuditServerV355.test.ts",
  "app/api/atlas/relativity-evidence/v355/spectral-eigenmodes/route.ts",
  "app/api/atlas/relativity-evidence/v355/spectral-eigenmodes/route.test.ts",
  "app/components/KerrSpectralEigenmodeSurfaceV355.tsx",
  "app/components/KerrSpectralEigenmodeSurfaceV355.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV355.ts",
  "app/lib/atlasShadowCapabilityPointerV355.test.ts",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "scripts/build-kerr-spectral-eigenmode-audit-v355.ts",
  "scripts/build-shadow-candidate-v355.mjs",
  "scripts/verify-shadow-v355-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha256(path) }));
const summary = {
  status: audit.status,
  artifactSha256: audit.artifactSha256,
  replaySha256: replay.artifactSha256,
  rayCount: audit.counts.rayCount,
  eigenmodeCount: audit.counts.eigenmodeCount,
  ellipseCount: audit.counts.ellipseCount,
  orthonormalityDeviation: audit.maxima.orthonormalityDeviation,
  reconstructionRelativeDifference: audit.maxima.reconstructionRelativeDifference,
  eigenResidualRelativeDifference: audit.maxima.eigenResidualRelativeDifference,
  traceConservationRelativeDifference: audit.maxima.traceConservationRelativeDifference,
  conditionNumber: audit.maxima.conditionNumber,
  fullMeasuredEigenmodeAuthority: audit.fullMeasuredEigenmodeAuthority,
  scienceCinematicBoundary: audit.scienceCinematicBoundary,
  denseStatus: audit.denseCampaignStatus,
};
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v355-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "spectral-eigenmode-v355-qualified-fixture-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v354EvidenceSha256: v354Evidence.evidenceSha256,
    v354PointerSha256: v354Pointer.pointerSha256,
    spectralCorrelationArtifactSha256: audit.source.spectralCorrelationArtifactSha256,
    eigenmodeArtifactSha256: audit.artifactSha256,
    fullShortAuthoritySha256: audit.source.fullShortAuthoritySha256,
  },
  spectralEigenmodes: summary,
  browserQualification: "not-run",
  sourceManifest,
  sourceSha256: canonicalSha256(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerAdvanced: false,
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  boundary: "v355-eigenmodes-and-ellipses-of-synthetic-covariance-not-measured-authority-no-cinematic-input-dense-incomplete",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: canonicalSha256(evidenceUnsigned) };
atomicWrite(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v355",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v354SpectralCorrelation: "qualified-explicit-positive-definite-synthetic-covariance",
    v355Eigenmodes: "qualified-deterministic-synthetic-principal-axes",
    v355Ellipses: "qualified-three-band-pair-one-sigma-ellipses",
    v355MeasuredEigenmodeAuthority: "unavailable-input-covariance-is-synthetic-not-measured",
    v355CinematicBoundary: "spectral-eigenmodes-and-ellipses-never-cinematic-color-input",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha256(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha256(pointerUnsigned) };
atomicWrite(paths.pointer, pointer);
console.log(JSON.stringify({
  status: pointer.status,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  artifactSha256: audit.artifactSha256,
  eigenmodes: summary.eigenmodeCount,
  ellipses: summary.ellipseCount,
  reconstruction: summary.reconstructionRelativeDifference,
  residual: summary.eigenResidualRelativeDifference,
  measuredAuthority: summary.fullMeasuredEigenmodeAuthority,
  dense: pointer.capabilities.v314CorrectedDense,
}, null, 2));
