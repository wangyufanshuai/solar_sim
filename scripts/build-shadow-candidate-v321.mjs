import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v320Evidence: "dist/science/orbit-atlas-shadow-v320-evidence.json",
  v320Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v320.json",
  rasterManifest: "dist/science/kerr-science-band-raster-v321/manifest.json",
  rasterBytes: "dist/science/kerr-science-band-raster-v321/sparse-fixed-band.rgba",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v321-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v321.json",
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

const v320Evidence = read(paths.v320Evidence);
const v320Pointer = read(paths.v320Pointer);
const rasterManifest = read(paths.rasterManifest);
const state = read(paths.state);
const formal = read(paths.formal);
if (v320Evidence.status !== "fixed-band-science-color-qualified-browser-pending-dense-incomplete-0-of-49"
  || v320Pointer.capabilities?.v320FixedBandImaging !== "qualified-three-fixed-disjoint-bands-four-rays"
  || rasterManifest.version !== "v321-kerr-science-band-raster-artifact-v1"
  || rasterManifest.artifactSha256 !== sha(rasterManifest)
  || rasterManifest.raster?.fileSha256 !== fileSha(paths.rasterBytes)
  || rasterManifest.raster?.byteLength !== 256 * 256 * 4
  || rasterManifest.raster?.summary?.fixedBandColoredDiskRayCount !== 4
  || rasterManifest.raster?.summary?.fixedBandCount !== 3
  || rasterManifest.integrity?.payloadUnchanged !== true
  || rasterManifest.integrity?.bandViewUnchanged !== true
  || rasterManifest.integrity?.rasterBufferDisjoint !== true
  || rasterManifest.integrity?.cinematicBufferShared !== false
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false
  || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer"
  || formal.publicDeploymentBlocked !== true) throw new Error("v321 dependency, artifact or boundary mismatch");

const rendererSource = text("app/components/KerrStrongGravityRendererV299.tsx");
const rasterSource = text("app/lib/kerrScienceBandRasterV321.ts");
const telemetrySource = text("app/lib/atlasStrongGravityTelemetryV309.ts");
const browserSource = text("app/lib/atlasStrongGravityBrowserGateV321.ts");
const observabilitySource = text("app/lib/atlasBrowserObservabilityV294.ts");
if (!rendererSource.includes("createKerrScienceBandRasterWithIntegrityV321(acquiredPayload.payload, acquiredBands.view)")
  || !rendererSource.includes("publishKerrScienceBandRasterTelemetryV321")
  || !rendererSource.includes("kerr-v321-science-fixed-band-sparse")
  || !rasterSource.includes("exact-si-in-v320-artifact-not-encoded-as-scalar-raster")
  || rasterSource.includes("Math.random(") || rasterSource.includes("bloom")
  || !telemetrySource.includes("scienceBandViewDigestSha256")
  || !browserSource.includes("fixed-physical-reference-no-data-adaptive-rescale")
  || !observabilitySource.includes("atlasScienceBandArtifactShaV321")) throw new Error("v321 runtime boundary contract mismatch");

const sourcePaths = [
  "scripts/build-kerr-science-band-raster-v321.ts",
  "scripts/build-shadow-candidate-v321.mjs",
  "scripts/verify-shadow-v321-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceBandRasterV321.ts",
  "app/lib/kerrScienceBandRasterV321.test.ts",
  "app/lib/kerrScienceBandRasterV321.generated.test.ts",
  "app/lib/kerrThinDiskBandClientV321.ts",
  "app/lib/kerrThinDiskBandClientV321.test.ts",
  "app/components/KerrStrongGravityRendererV299.tsx",
  "app/lib/atlasStrongGravityTelemetryV309.ts",
  "app/lib/atlasStrongGravityTelemetryV309.test.ts",
  "app/lib/atlasBrowserObservabilityV294.ts",
  "app/lib/atlasBrowserObservabilityV294.test.ts",
  "app/lib/atlasStrongGravityBrowserGateV310.ts",
  "app/lib/atlasStrongGravityBrowserGateV321.ts",
  "app/lib/atlasStrongGravityBrowserGateV321.test.ts",
  "tests/atlas-browser/atlas-v300-resource-lifecycle.spec.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV321.ts",
  "app/lib/atlasShadowCapabilityPointerV321.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v321-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "runtime-fixed-band-science-raster-static-qualified-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v320EvidenceSha256: v320Evidence.evidenceSha256,
    v320PointerSha256: v320Pointer.pointerSha256,
    rasterArtifactSha256: rasterManifest.artifactSha256,
    bandArtifactSha256: rasterManifest.integrity.bandArtifactSha256,
    fullShortAuthoritySha256: rasterManifest.raster.sourceFullShortAuthoritySha256,
  },
  runtime: {
    fixedBandColoredDiskRayCount: rasterManifest.raster.summary.fixedBandColoredDiskRayCount,
    fixedBandCount: rasterManifest.raster.summary.fixedBandCount,
    payloadUnchanged: rasterManifest.integrity.payloadUnchanged,
    bandViewUnchanged: rasterManifest.integrity.bandViewUnchanged,
    rasterBufferDisjoint: rasterManifest.integrity.rasterBufferDisjoint,
    cinematicBufferShared: rasterManifest.integrity.cinematicBufferShared,
    bandArtifactSha256: rasterManifest.integrity.bandArtifactSha256,
    bandViewDigestSha256: rasterManifest.integrity.bandViewDigestAfterSha256,
    payloadDigestSha256: rasterManifest.integrity.payloadAfter.digestSha256,
    rasterDigestSha256: rasterManifest.integrity.rasterDigestSha256,
    normalization: rasterManifest.raster.encoding.normalization,
    transferFunction: rasterManifest.raster.encoding.transferFunction,
    browserGate: "authored-not-run",
  },
  artifact: {
    path: paths.rasterManifest,
    fileSha256: fileSha(paths.rasterManifest),
    canonicalSha256: rasterManifest.artifactSha256,
    rasterFileSha256: rasterManifest.raster.fileSha256,
    rasterPath: paths.rasterBytes,
  },
  display: {
    science: "v321-fixed-band-linear-rgb-physical-radiance-immutable",
    cinematic: "separate-seeded-interactive-copy-no-science-buffer-sharing",
    workbench: "v320-fixed-band-view-plus-v321-runtime-telemetry",
    browserQualification: "not-run",
  },
  correctedCampaign: { status: state.status, completedShardCount: 0, plannedShardCount: 49, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "runtime-wired-sparse-fixed-band-science-raster-not-dense-image-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v321",
  generatedAt: new Date().toISOString(),
  status: "runtime-fixed-band-science-raster-static-qualified-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v320FixedBandImaging: "qualified-three-fixed-disjoint-bands-four-rays",
    v321ScienceRaster: "runtime-wired-v320-fixed-band-four-rays",
    v321BufferIntegrity: "payload-band-view-raster-byte-disjoint",
    v321Telemetry: "fixed-band-digest-and-normalization-wired-browser-pending",
    v321BrowserGate: "authored-not-run",
    scienceCinematicBoundary: "physical-radiance-immutable-presentation-copy-only",
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
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, rasterArtifactSha256: rasterManifest.artifactSha256, rasterFileSha256: rasterManifest.raster.fileSha256, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
