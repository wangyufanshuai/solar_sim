import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v316Evidence: "dist/science/orbit-atlas-shadow-v316-evidence.json",
  v316Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v316.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v317-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v317.json",
};
const bytes = (relative) => readFileSync(resolve(root, relative));
const text = (relative) => bytes(relative).toString("utf8");
const read = (relative) => JSON.parse(text(relative));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["generatedAt", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key))
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

const v316Evidence = read(paths.v316Evidence);
const v316Pointer = read(paths.v316Pointer);
const state = read(paths.state);
const formal = read(paths.formal);
if (v316Evidence.status !== "visual-token-fields-qualified-browser-pending-dense-incomplete-0-of-49"
  || v316Pointer.capabilities?.v316VisualTokenFields !== "static-qualified-46-of-46-runtime-signature-wired"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false
  || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer"
  || formal.publicDeploymentBlocked !== true) throw new Error("v317 dependency or release boundary mismatch");

const integritySource = text("app/lib/kerrScienceBufferIntegrityV317.ts");
const interactiveSource = text("app/lib/kerrInteractiveAuthorityV317.ts");
const historicalInteractiveSource = text("app/lib/kerrInteractiveComputeV299.ts");
const rendererSource = text("app/components/KerrStrongGravityRendererV299.tsx");
const lifecycleSource = text("app/lib/kerrTextureLifecycleV317.ts");
const telemetrySource = text("app/lib/atlasStrongGravityTelemetryV309.ts");
const fullAuthoritySha256 = "99e591c0a8fd1f342ef622239301d04cf9f5cd33cbe1c45f1159e0804f2e81a6";
const historicalAuthoritySha256 = "1e568f2250660079d3deb03edcf90ac794968269af36786264bf42d02eb10559";
if (!integritySource.includes("KERR_SCIENCE_TYPED_ARRAY_COUNT_V317 = 67")
  || !integritySource.includes('digestAlgorithm: "sha-256-field-framed-byte-exact"')
  || !integritySource.includes("v317-science-payload-mutated-by-raster")
  || !integritySource.includes("v317-science-raster-buffer-alias")
  || !interactiveSource.includes("KERR_FULL_SHORT_AUTHORITY_SHA256_V314")
  || !historicalInteractiveSource.includes(historicalAuthoritySha256)
  || !rendererSource.includes("KERR_INTERACTIVE_AUTHORITY_SHA256_V317")
  || rendererSource.includes("KERR_SHORT_AUTHORITY_ENVELOPE_SHA256_V299")
  || !rendererSource.includes("createKerrScienceRasterWithIntegrityV317")
  || !rendererSource.includes("clearKerrInteractiveValuesV317(response.values)")
  || !lifecycleSource.includes("texture.image.data = new Uint8Array(new ArrayBuffer(0))")
  || !telemetrySource.includes("lifecycleReturnedToBaseline")) throw new Error("v317 runtime integrity contract mismatch");

const sourcePaths = [
  "scripts/build-shadow-candidate-v317.mjs",
  "scripts/verify-shadow-v317-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceBufferIntegrityV317.ts",
  "app/lib/kerrScienceBufferIntegrityV317.test.ts",
  "app/lib/kerrInteractiveAuthorityV317.ts",
  "app/lib/kerrInteractiveAuthorityV317.test.ts",
  "app/lib/kerrTextureLifecycleV317.ts",
  "app/lib/kerrTextureLifecycleV317.test.ts",
  "app/lib/kerrStrongGravityVisualV305.ts",
  "app/workers/kerrInteractiveCompute.worker.ts",
  "app/components/KerrStrongGravityRendererV299.tsx",
  "app/lib/atlasStrongGravityTelemetryV309.ts",
  "app/lib/atlasStrongGravityTelemetryV309.test.ts",
  "app/lib/atlasBrowserObservabilityV294.ts",
  "app/lib/atlasBrowserObservabilityV294.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV317.ts",
  "app/lib/atlasShadowCapabilityPointerV317.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v317-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "buffer-integrity-qualified-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v316EvidenceSha256: v316Evidence.evidenceSha256,
    v316PointerSha256: v316Pointer.pointerSha256,
    scienceAuthority: "v312-v313-short-gate-sparse",
    fullShortAuthoritySha256: fullAuthoritySha256,
  },
  integrity: {
    scientificTypedArrayCount: 67,
    digestAlgorithm: "sha-256-field-framed-byte-exact",
    beforeAfterRasterDigestRequired: true,
    internalScienceBuffersDisjointRequired: true,
    scienceRasterBufferDisjointRequired: true,
    denseBoundary: "sparse-authority-dense-incomplete-no-partial-aggregate",
  },
  interactive: {
    protocol: "v317-kerr-interactive-compute-shadow",
    authoritySha256: fullAuthoritySha256,
    historicalV299AuthoritySha256: historicalAuthoritySha256,
    historicalV299MutationApplied: false,
    cpuAuthority: "v312-geometry+v313-polarization",
    webGpuAuthority: false,
    webGpuDifferential: "pending",
  },
  lifecycle: {
    textureImageDataClearedBeforeDispose: true,
    repeatedTextureDisposeIdempotent: true,
    transferredInteractiveValuesCleared: true,
    lateResolveScopeRollback: true,
    workerErrorRollback: true,
    materializationFailureRollback: true,
    baselineReturnDigestTelemetry: "wired-browser-pending",
  },
  correctedCampaign: { status: state.status, completedShardCount: 0, plannedShardCount: 49, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "low-memory-static-and-unit-qualified-browser-lifecycle-baseline-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v317",
  generatedAt: new Date().toISOString(),
  status: "buffer-integrity-qualified-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v315ScienceRuntime: "implemented-v312-v313-sparse-authority",
    v316VisualTokenFields: "static-qualified-46-of-46-runtime-signature-wired",
    v317ScienceBufferIntegrity: "qualified-67-of-67-byte-digested-raster-disjoint",
    v317InteractiveAuthority: "current-v312-v313-full-short-shadow-only-differential-pending",
    v317Lifecycle: "idempotent-texture-worker-response-scope-static-qualified-browser-baseline-pending",
    v5V6Profiles: "manual-local-shadow-only-not-default",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, scienceArrays: evidence.integrity.scientificTypedArrayCount, interactiveAuthoritySha256: evidence.interactive.authoritySha256, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
