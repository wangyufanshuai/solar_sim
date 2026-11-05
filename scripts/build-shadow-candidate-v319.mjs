import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v318Evidence: "dist/science/orbit-atlas-shadow-v318-evidence.json",
  v318Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v318.json",
  spectrum: "dist/science/kerr-thin-disk-v319/sparse-spectrum.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v319-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v319.json",
};
const bytes = (relative) => readFileSync(resolve(root, relative));
const text = (relative) => bytes(relative).toString("utf8");
const read = (relative) => JSON.parse(text(relative));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize)
  : !value || typeof value !== "object" ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["generatedAt", "artifactSha256", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (relative, value) => {
  const target = resolve(root, relative);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

const v318Evidence = read(paths.v318Evidence);
const v318Pointer = read(paths.v318Pointer);
const spectrum = read(paths.spectrum);
const state = read(paths.state);
const formal = read(paths.formal);
if (v318Evidence.status !== "gpu-differential-reference-qualified-hardware-pending-dense-incomplete-0-of-49"
  || v318Pointer.capabilities?.v318GpuDifferentialHardware !== "pending-webgpu-shadow-disabled"
  || spectrum.version !== "v319-kerr-thin-disk-spectral-artifact-v1"
  || spectrum.artifactSha256 !== sha(spectrum)
  || spectrum.view?.status !== "qualified-sparse-derived-spectrum"
  || spectrum.view?.counts?.applicableDiskRayCount !== 4
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false
  || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer"
  || formal.publicDeploymentBlocked !== true) throw new Error("v319 dependency, artifact or boundary mismatch");
const maxima = spectrum.view.maxima;
if (!(maxima.liouvilleInvariantRelativeResidual >= 0 && maxima.liouvilleInvariantRelativeResidual < 1e-12)
  || !(maxima.diskQuadratureRelative >= 0 && maxima.diskQuadratureRelative < 5e-4)
  || !(maxima.formulaSpectralRelative >= 0 && maxima.formulaSpectralRelative < 0.02)) throw new Error("v319 spectrum threshold mismatch");

const scienceSource = text("app/lib/kerrThinDiskSpectralV319.ts");
const componentSource = text("app/components/KerrThinDiskSpectrumWorkbenchV319.tsx");
const workbenchSource = text("app/components/RelativityResearchWorkbenchV280.tsx");
const routeSource = text("app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts");
if (!scienceSource.includes("page-thorne-zero-torque-at-isco") || !scienceSource.includes("no-grmhd-or-plasma-transfer")
  || !scienceSource.includes("liouvilleIntensityInvariantV278") || scienceSource.includes("Math.random")
  || !componentSource.includes("Iν/ν³") || !componentSource.includes("不会使用电影亮度回填科学量")
  || !workbenchSource.includes("KerrThinDiskSpectrumWorkbenchV319")
  || !routeSource.includes('"v319-thin-disk-spectrum"')) throw new Error("v319 science/display contract mismatch");

const sourcePaths = [
  "scripts/build-kerr-thin-disk-spectrum-v319.ts",
  "scripts/build-shadow-candidate-v319.mjs",
  "scripts/verify-shadow-v319-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrThinDiskSpectralV319.ts",
  "app/lib/kerrThinDiskSpectralV319.test.ts",
  "app/lib/kerrThinDiskSpectralV319.generated.test.ts",
  "app/components/KerrThinDiskSpectrumWorkbenchV319.tsx",
  "app/components/KerrThinDiskSpectrumWorkbenchV319.test.ts",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV319.ts",
  "app/lib/atlasShadowCapabilityPointerV319.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v319-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "thin-disk-spectrum-qualified-browser-pending-dense-incomplete-0-of-49",
  dependency: { v318EvidenceSha256: v318Evidence.evidenceSha256, v318PointerSha256: v318Pointer.pointerSha256, fullShortAuthoritySha256: spectrum.view.authority.fullShortAuthoritySha256 },
  science: {
    model: "page-thorne-zero-torque-at-isco-thin-optically-thick-local-blackbody",
    applicableDiskRayCount: 4,
    unavailableRayCount: 12,
    observedFrequencyHz: spectrum.view.scenario.observedFrequencyHz,
    units: spectrum.view.units,
    assumptions: spectrum.view.assumptions,
    maxima,
    thresholds: { liouvilleInvariantRelativeResidualMaximumExclusive: 1e-12, diskQuadratureRelativeMaximumExclusive: 5e-4, formulaSpectralRelativeMaximumExclusive: 0.02 },
    uncertaintyCombination: "componentwise-no-rss-no-scalar-total",
    denseAggregateAccepted: false,
  },
  artifact: { path: paths.spectrum, fileSha256: fileSha(paths.spectrum), canonicalSha256: spectrum.artifactSha256 },
  display: { science: "linear-physical-values-no-bloom-no-random-no-grade", cinematic: "may-decorate-but-cannot-mutate-spectrum-or-ray-payload", workbench: "implemented-intent-lazy-browser-pending", browserQualification: "not-run" },
  correctedCampaign: { status: state.status, completedShardCount: 0, plannedShardCount: 49, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "qualified-four-ray-derived-spectrum-not-dense-image-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v319",
  generatedAt: new Date().toISOString(),
  status: "thin-disk-spectrum-qualified-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v318GpuDifferentialHardware: "pending-webgpu-shadow-disabled",
    v319ThinDiskSpectrum: "qualified-four-authority-disk-rays-si-liouville",
    v319SpectrumArtifact: "canonical-source-locked",
    v319ScienceDisplay: "implemented-linear-workbench-browser-pending",
    v319CinematicBoundary: "no-science-value-mutation",
    cpuScienceAuthority: "v312-geometry+v313-polarization",
    v5V6Profiles: "manual-local-shadow-only-not-default",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, spectrumArtifactSha256: spectrum.artifactSha256, maxima, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
