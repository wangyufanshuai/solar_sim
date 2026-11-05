import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v319Evidence: "dist/science/orbit-atlas-shadow-v319-evidence.json",
  v319Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v319.json",
  bands: "dist/science/kerr-thin-disk-v320/fixed-band-imaging.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v320-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v320.json",
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

const v319Evidence = read(paths.v319Evidence);
const v319Pointer = read(paths.v319Pointer);
const bands = read(paths.bands);
const state = read(paths.state);
const formal = read(paths.formal);
if (v319Evidence.status !== "thin-disk-spectrum-qualified-browser-pending-dense-incomplete-0-of-49"
  || v319Pointer.capabilities?.v319ThinDiskSpectrum !== "qualified-four-authority-disk-rays-si-liouville"
  || bands.version !== "v320-kerr-thin-disk-fixed-band-artifact-v1"
  || bands.artifactSha256 !== sha(bands)
  || bands.view?.status !== "qualified-fixed-band-sparse-science-imaging"
  || bands.view?.source?.spectrumArtifactSha256 !== "2ac07e869b609dcb086906508bbd4e23ef1756caefd4e503a4d428021d62cf45"
  || bands.view?.counts?.applicableDiskRayCount !== 4 || bands.view?.counts?.unavailableRayCount !== 12
  || bands.view?.counts?.explicitSaturationFlagCount !== 12
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false
  || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer"
  || formal.publicDeploymentBlocked !== true) throw new Error("v320 dependency, artifact or boundary mismatch");
const maxima = bands.view.maxima;
if (!(maxima.bandQuadratureRelativeDifference >= 0 && maxima.bandQuadratureRelativeDifference < 2e-6)
  || !(maxima.coveredBolometricFraction > 0 && maxima.coveredBolometricFraction <= 1 + 1e-6)
  || bands.view.normalizationPolicy !== "fixed-physical-reference-no-data-adaptive-rescale"
  || bands.view.transferFunction !== "linear-rgb-clamp-per-channel-explicit-saturation") {
  throw new Error("v320 fixed-band threshold mismatch");
}

const scienceSource = text("app/lib/kerrThinDiskBandImagingV320.ts");
const componentSource = text("app/components/KerrThinDiskBandWorkbenchV320.tsx");
const workbenchSource = text("app/components/RelativityResearchWorkbenchV280.tsx");
const routeSource = text("app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts");
if (!scienceSource.includes("fixed-physical-reference-no-data-adaptive-rescale")
  || !scienceSource.includes("physical-band-radiance-immutable-presentation-copy-only")
  || scienceSource.includes("Math.random")
  || !componentSource.includes("SI 辐亮度、误差项和饱和标志始终独立保存")
  || !componentSource.includes("fixed · non-adaptive · sparse 4/4")
  || !workbenchSource.includes("KerrThinDiskBandWorkbenchV320")
  || !routeSource.includes('"v320-thin-disk-bands"')) throw new Error("v320 science/display contract mismatch");

const sourcePaths = [
  "scripts/build-kerr-thin-disk-bands-v320.ts",
  "scripts/build-shadow-candidate-v320.mjs",
  "scripts/verify-shadow-v320-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrThinDiskBandImagingV320.ts",
  "app/lib/kerrThinDiskBandImagingV320.test.ts",
  "app/lib/kerrThinDiskBandImagingV320.generated.test.ts",
  "app/components/KerrThinDiskBandWorkbenchV320.tsx",
  "app/components/KerrThinDiskBandWorkbenchV320.test.ts",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV320.ts",
  "app/lib/atlasShadowCapabilityPointerV320.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v320-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "fixed-band-science-color-qualified-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v319EvidenceSha256: v319Evidence.evidenceSha256,
    v319PointerSha256: v319Pointer.pointerSha256,
    spectrumArtifactSha256: bands.view.source.spectrumArtifactSha256,
    fullShortAuthoritySha256: bands.view.source.fullShortAuthoritySha256,
  },
  science: {
    model: "page-thorne-fixed-observer-band-integrals",
    applicableDiskRayCount: 4,
    unavailableRayCount: 12,
    bandCount: 3,
    bands: bands.view.definitions,
    explicitSaturationFlagCount: bands.view.counts.explicitSaturationFlagCount,
    saturatedChannelCount: bands.view.counts.saturatedChannelCount,
    maxima,
    thresholds: { bandQuadratureRelativeDifferenceMaximumExclusive: 2e-6, coveredBolometricFractionMaximumInclusive: 1.000001 },
    integration: bands.view.integration,
    normalizationPolicy: bands.view.normalizationPolicy,
    transferFunction: bands.view.transferFunction,
    uncertaintyCombination: bands.view.uncertaintyCombination,
    scienceCinematicBoundary: bands.view.scienceCinematicBoundary,
    denseAggregateAccepted: false,
  },
  artifact: { path: paths.bands, fileSha256: fileSha(paths.bands), canonicalSha256: bands.artifactSha256 },
  display: {
    science: "exact-si-radiance-plus-fixed-linear-false-color-explicit-saturation",
    cinematic: "seeded-copy-of-presentation-values-cannot-mutate-physical-radiance",
    workbench: "implemented-intent-lazy-browser-pending",
    browserQualification: "not-run",
  },
  correctedCampaign: { status: state.status, completedShardCount: 0, plannedShardCount: 49, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "qualified-fixed-band-four-ray-derived-product-not-dense-image-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v320",
  generatedAt: new Date().toISOString(),
  status: "fixed-band-science-color-qualified-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v319ThinDiskSpectrum: "qualified-four-authority-disk-rays-si-liouville",
    v320FixedBandImaging: "qualified-three-fixed-disjoint-bands-four-rays",
    v320FalseColor: "fixed-reference-linear-nonadaptive",
    v320SaturationAudit: "explicit-per-channel",
    v320ScienceCinematicBoundary: "physical-radiance-immutable-presentation-copy-only",
    cpuScienceAuthority: "v312-geometry+v313-polarization",
    v318GpuDifferentialHardware: "pending-webgpu-shadow-disabled",
    v5V6Profiles: "manual-local-shadow-only-not-default",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({
  status: pointer.status,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  bandArtifactSha256: bands.artifactSha256,
  maxima,
  saturation: `${bands.view.counts.saturatedChannelCount}/${bands.view.counts.explicitSaturationFlagCount}`,
  dense: pointer.capabilities.v314CorrectedDense,
}, null, 2));
