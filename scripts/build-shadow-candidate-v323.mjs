import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v322Evidence: "dist/science/orbit-atlas-shadow-v322-evidence.json",
  v322Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v322.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v323-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v323.json",
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

const v322Evidence = read(paths.v322Evidence);
const v322Pointer = read(paths.v322Pointer);
const state = read(paths.state);
const formal = read(paths.formal);
if (v322Evidence.status !== "hud-runtime-wired-browser-pending-dense-incomplete-0-of-49"
  || v322Pointer.capabilities?.v322ScienceHud !== "telemetry-only-fixed-band-hud-wired"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true) throw new Error("v323 dependency or boundary mismatch");

const provenanceSource = text("app/lib/kerrScienceBandProvenanceV323.ts");
const hudSource = text("app/components/KerrScienceBandHudV322.tsx");
const panelSource = text("app/components/KerrBlackHolePanel.tsx");
if (!provenanceSource.includes("read-only-provenance-no-ray-buffer-no-screenshot-no-path-or-host")
  || !provenanceSource.includes("serializeKerrScienceBandProvenanceCsvV323")
  || !hudSource.includes("createKerrScienceBandProvenanceV323")
  || !hudSource.includes("acquireAtlasResource(\"object-url\"")
  || !hudSource.includes("orbit-atlas-kerr-science-band-v323")
  || !panelSource.includes("KerrScienceBandHudV322")) throw new Error("v323 provenance export contract mismatch");

const sourcePaths = [
  "scripts/build-shadow-candidate-v323.mjs",
  "scripts/verify-shadow-v323-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceBandProvenanceV323.ts",
  "app/lib/kerrScienceBandProvenanceV323.test.ts",
  "app/components/KerrScienceBandHudV322.tsx",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/components/KerrBlackHolePanel.tsx",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV323.ts",
  "app/lib/atlasShadowCapabilityPointerV323.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v323-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "provenance-export-wired-browser-pending-dense-incomplete-0-of-49",
  dependency: { v322EvidenceSha256: v322Evidence.evidenceSha256, v322PointerSha256: v322Pointer.pointerSha256, fullShortAuthoritySha256: v322Evidence.dependency.fullShortAuthoritySha256 },
  runtime: {
    profileTokenSources: ["v5", "v6"],
    jsonExport: true,
    csvExport: true,
    noRayBuffer: true,
    noScreenshot: true,
    noAbsolutePath: true,
    noHost: true,
    objectUrlTracked: true,
    idempotentObjectUrlRelease: true,
    provenanceVersion: "v323-kerr-science-band-provenance-v1",
    provenanceBoundary: "read-only-provenance-no-ray-buffer-no-screenshot-no-path-or-host",
    browserQualification: "not-run",
  },
  display: { science: "provenance-mirrors-telemetry-no-science-mutation", cinematic: "export-disabled-and-hud-hidden", localShadow: "v5-v6-manual-ab-only" },
  correctedCampaign: { status: state.status, completedShardCount: 0, plannedShardCount: 49, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "read-only-provenance-export-wired-dense-incomplete-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v323",
  generatedAt: new Date().toISOString(),
  status: "provenance-export-wired-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v322ScienceHud: "telemetry-only-fixed-band-hud-wired",
    v323ProvenanceExport: "json-csv-read-only-no-ray-buffer",
    v323ProfileAB: "v5-v6-recorded-manual-local-shadow-only",
    v323ObjectUrlLifecycle: "tracked-idempotent",
    v323BrowserGate: "authored-not-run",
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
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, profileTokenSources: evidence.runtime.profileTokenSources, jsonExport: evidence.runtime.jsonExport, csvExport: evidence.runtime.csvExport, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
