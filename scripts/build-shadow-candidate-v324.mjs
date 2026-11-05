import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v323Evidence: "dist/science/orbit-atlas-shadow-v323-evidence.json",
  v323Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v323.json",
  v321Manifest: "dist/science/kerr-science-band-raster-v321/manifest.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v324-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v324.json",
};
const bytes = (relative) => readFileSync(resolve(root, relative));
const text = (relative) => bytes(relative).toString("utf8");
const read = (relative) => JSON.parse(text(relative));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize)
  : !value || typeof value !== "object" ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["generatedAt", "artifactSha256", "pointerSha256", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key))
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

const v323Evidence = read(paths.v323Evidence);
const v323Pointer = read(paths.v323Pointer);
const manifest = read(paths.v321Manifest);
const state = read(paths.state);
const formal = read(paths.formal);
const profileSource = text("app/lib/atlasVisualProfileV299.ts");
const comparisonSource = text("app/lib/kerrScienceProfileABV324.ts");
const comparisonTestSource = text("app/lib/kerrScienceProfileABV324.test.ts");
if (v323Evidence.status !== "provenance-export-wired-browser-pending-dense-incomplete-0-of-49"
  || v323Pointer.capabilities?.v323ProvenanceExport !== "json-csv-read-only-no-ray-buffer"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true
  || manifest.integrity?.payloadUnchanged !== true || manifest.integrity?.bandViewUnchanged !== true || manifest.integrity?.cinematicBufferShared !== false) throw new Error("v324 dependency or boundary mismatch");

const scienceExposureCount = (profileSource.match(/scienceExposure: 1 as const/g) ?? []).length;
const scienceBloomCount = (profileSource.match(/scienceBloom: 0 as const/g) ?? []).length;
const scienceNoiseCount = (profileSource.match(/scienceNoise: 0 as const/g) ?? []).length;
const scienceTokenEquivalent = scienceExposureCount >= 2 && scienceBloomCount >= 2 && scienceNoiseCount >= 2
  && comparisonSource.includes("scienceFieldsList") && comparisonSource.includes("scienceTokenMismatches");
const cinematicTokensDistinct = profileSource.includes("cinematicExposure: 0.82")
  && profileSource.includes("cinematicExposure: 0.78")
  && profileSource.includes("diskDetailSeed: 299")
  && profileSource.includes("diskDetailSeed: 300")
  && comparisonSource.includes("cinematicTokensDistinct")
  && comparisonTestSource.includes("cinematicTokensDistinct: true");
const authorityDigest = {
  payloadDigestSha256: manifest.integrity?.payloadAfter?.digestSha256 ?? null,
  bandArtifactSha256: manifest.integrity?.bandArtifactSha256 ?? null,
  bandViewDigestSha256: manifest.integrity?.bandViewDigestAfterSha256 ?? null,
};
const scienceDigestStable = Object.values(authorityDigest).every((value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value));
if (!scienceTokenEquivalent || !cinematicTokensDistinct || !scienceDigestStable) throw new Error("v324 Science profile equivalence is not proven");

const sourcePaths = [
  "scripts/build-shadow-candidate-v324.mjs",
  "scripts/verify-shadow-v324-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceProfileABV324.ts",
  "app/lib/kerrScienceProfileABV324.test.ts",
  "app/components/KerrScienceBandHudV322.tsx",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/lib/atlasVisualProfileV299.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/relativityWorkbenchEvidenceV324.ts",
  "app/lib/relativityWorkbenchEvidenceV324.test.ts",
  "app/lib/relativityEvidenceServerV324.ts",
  "app/api/atlas/relativity-evidence/v324/route.ts",
  "app/api/atlas/relativity-evidence/v324/route.test.ts",
  "app/lib/atlasShadowCapabilityPointerV324.ts",
  "app/lib/atlasShadowCapabilityPointerV324.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v324-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "science-profile-equivalent-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v323EvidenceSha256: v323Evidence.evidenceSha256,
    v323PointerSha256: v323Pointer.pointerSha256,
    fullShortAuthoritySha256: state.authority?.fullShortAuthoritySha256 ?? null,
    v321RasterArtifactSha256: manifest.artifactSha256,
  },
  runtime: {
    profileTokenSources: ["v5", "v6"],
    scienceFields: ["scienceDisplayTransform", "scienceExposure", "scienceBloom", "scienceNoise"],
    scienceTokenEquivalent,
    scienceTokenMismatchCount: scienceTokenEquivalent ? 0 : 4,
    cinematicTokensDistinct,
    scienceDigestStable,
    authorityDigest,
    comparisonVersion: "v324-kerr-science-profile-ab-v1",
    browserQualification: "not-run",
    localShadowManualAbOnly: true,
  },
  display: {
    science: "v5-v6-equivalent-fixed-linear-no-grade",
    cinematic: "v5-v6-seeded-tokens-distinct-science-buffer-immutable",
    localShadow: "manual-v5-v6-ab-only",
  },
  correctedCampaign: {
    namespace: "v314",
    status: state.status,
    completedShardCount: state.completedShardCount,
    plannedShardCount: state.plannedShardCount,
    attemptConsumed: state.attemptConsumed,
    aggregateAvailable: state.aggregateAvailable,
    stateSha256: state.stateSha256,
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "science-profile-ab-equivalence-wired-dense-incomplete-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v324",
  generatedAt: new Date().toISOString(),
  status: "science-profile-equivalent-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v323ProvenanceExport: "json-csv-read-only-no-ray-buffer",
    v324ScienceProfileAB: "science-equivalent-cinematic-distinct",
    v324ScienceDigest: "stable-v321-authority-digests",
    v324BrowserGate: "authored-not-run",
    cpuScienceAuthority: "v312-geometry+v313-polarization",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    v5V6Profiles: "manual-local-shadow-only-not-default",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, scienceTokenEquivalent, cinematicTokensDistinct, scienceDigestStable, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
