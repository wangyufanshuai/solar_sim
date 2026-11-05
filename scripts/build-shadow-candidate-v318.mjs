import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v317Evidence: "dist/science/orbit-atlas-shadow-v317-evidence.json",
  v317Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v317.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v318-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v318.json",
};
const bytes = (relative) => readFileSync(resolve(root, relative));
const text = (relative) => bytes(relative).toString("utf8");
const read = (relative) => JSON.parse(text(relative));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize)
  : !value || typeof value !== "object" ? value
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

const v317Evidence = read(paths.v317Evidence);
const v317Pointer = read(paths.v317Pointer);
const state = read(paths.state);
const formal = read(paths.formal);
if (v317Evidence.status !== "buffer-integrity-qualified-browser-pending-dense-incomplete-0-of-49"
  || v317Pointer.capabilities?.v317ScienceBufferIntegrity !== "qualified-67-of-67-byte-digested-raster-disjoint"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false
  || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer"
  || formal.publicDeploymentBlocked !== true) throw new Error("v318 dependency or boundary mismatch");

const differentialSource = text("app/lib/kerrGpuDifferentialV318.ts");
const browserGateSource = text("app/lib/atlasStrongGravityBrowserGateV318.ts");
const routeSource = text("app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts");
const browserSpec = text("tests/atlas-browser/atlas-v300-resource-lifecycle.spec.ts");
const probeWorkerSource = text("app/workers/kerrGpuDifferentialProbeV318.worker.ts");
const authoritySha256 = "99e591c0a8fd1f342ef622239301d04cf9f5cd33cbe1c45f1159e0804f2e81a6";
if (!differentialSource.includes("KERR_GPU_DIFFERENTIAL_SAMPLE_COUNT_V318 = 16")
  || !differentialSource.includes("KERR_GPU_DIFFERENTIAL_BRACKET_COUNT_V318 = 40")
  || !differentialSource.includes("cpu-authority-remains-scientific-authority")
  || !differentialSource.includes('activation: passed ? "webgpu-shadow-eligible" : "webgpu-shadow-disabled"')
  || !browserGateSource.includes("sciencePayloadUnchanged !== true")
  || !browserGateSource.includes("lifecycleBaselineDigest !== args.afterExit.lifecycleReturnDigest")
  || !routeSource.includes('"v318-gpu-differential-reference"')
  || !browserSpec.includes("evaluateAtlasStrongGravityBrowserGateV318")
  || !probeWorkerSource.includes("device.pushErrorScope") || !probeWorkerSource.includes("device.destroy()")
  || probeWorkerSource.includes("cpuFallback")) throw new Error("v318 implementation contract mismatch");

const sourcePaths = [
  "scripts/build-shadow-candidate-v318.mjs",
  "scripts/verify-shadow-v318-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrGpuDifferentialV318.ts",
  "app/lib/kerrGpuDifferentialV318.test.ts",
  "app/lib/kerrInteractiveAuthorityV317.ts",
  "app/lib/atlasStrongGravityBrowserGateV318.ts",
  "app/lib/atlasStrongGravityBrowserGateV318.test.ts",
  "app/workers/kerrGpuDifferentialProbeV318.worker.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
  "tests/atlas-browser/atlas-v300-resource-lifecycle.spec.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV318.ts",
  "app/lib/atlasShadowCapabilityPointerV318.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v318-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "gpu-differential-reference-qualified-hardware-pending-dense-incomplete-0-of-49",
  dependency: { v317EvidenceSha256: v317Evidence.evidenceSha256, v317PointerSha256: v317Pointer.pointerSha256, authoritySha256 },
  differential: {
    version: "v318-kerr-gpu-canonical-differential-v1",
    authoritySha256,
    cpuAuthority: "v312-geometry+v313-polarization",
    gpuScientificAuthority: false,
    sampleCount: 16,
    criticalBracketCount: 40,
    thresholds: { classificationAgreementMinimum: 0.999, criticalEndpointAgreementRequired: 1, criticalCurveErrorPxMaximumExclusive: 0.5, redshiftErrorMaximumExclusive: 0.005, invalidCount: 0, gpuValidationErrorCount: 0 },
    referenceApi: "/api/atlas/relativity-evidence/artifacts/v318-gpu-differential-reference",
    hardwareResult: "pending",
    hardwareProbeWorker: "authored-webgpu-only-no-cpu-fallback-not-run",
    activation: "webgpu-shadow-disabled-until-passing-hardware-result",
  },
  browser: {
    gate: "v318-strong-gravity-buffer-lifecycle-browser-gate",
    requiresSciencePayloadAndRasterSha256: true,
    requiresPayloadUnchangedAndBufferDisjoint: true,
    requiresLifecycleBaselineReturnDigest: true,
    status: "authored-not-run",
  },
  correctedCampaign: { status: state.status, completedShardCount: 0, plannedShardCount: 49, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "cpu-reference-and-fail-closed-evaluator-qualified-hardware-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v318",
  generatedAt: new Date().toISOString(),
  status: "gpu-differential-reference-qualified-hardware-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v317ScienceBufferIntegrity: "qualified-67-of-67-byte-digested-raster-disjoint",
    v318GpuDifferentialReference: "qualified-16-rays-40-brackets-current-authority",
    v318GpuDifferentialHardware: "pending-webgpu-shadow-disabled",
    v318BrowserBufferLifecycleGate: "authored-not-run",
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
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, samples: evidence.differential.sampleCount, brackets: evidence.differential.criticalBracketCount, hardware: evidence.differential.hardwareResult, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
