import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseAtlasObservationHubQualificationV400 } from "../app/lib/atlasObservationHubV400";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V400,
  resolveAtlasInitialVisualProfileV299,
  resolveAtlasVisualProfileV299,
} from "../app/lib/atlasVisualProfileV299";

const root = process.cwd();
const paths = {
  v399Artifact: "dist/science/kerr-physical-observation-template-v399/template-diagnostic.json",
  v399Evidence: "dist/science/orbit-atlas-shadow-v399-evidence.json",
  hubSource: "app/components/KerrObservationHubV400.tsx",
  workbenchSource: "app/components/RelativityResearchWorkbenchV280.tsx",
  abSource: "app/components/AtlasVisualABControlV261.tsx",
  artifact: "dist/science/atlas-observation-hub-v400/hub-qualification.json",
};
const bounded = (path: string, maximum: number) => { const target = resolve(root, path); const metadata = statSync(target); if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximum) throw new Error(`v400-input-size:${path}`); return readFileSync(target); };
const read = (path: string) => JSON.parse(bounded(path, 128 * 1024).toString("utf8"));
const shaBytes = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value: unknown) => shaBytes(JSON.stringify(canonicalize(value)));
const atomic = (path: string, value: unknown) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const v399Artifact = read(paths.v399Artifact) as { artifactSha256?: string; source?: { fullShortAuthoritySha256?: string } };
const v399Evidence = read(paths.v399Evidence) as { evidenceSha256?: string };
if (typeof v399Artifact.artifactSha256 !== "string" || typeof v399Artifact.source?.fullShortAuthoritySha256 !== "string" || typeof v399Evidence.evidenceSha256 !== "string") throw new Error("v400-dependency-identity");
const v11 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V377);
const v12 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V400);
const v11Sha256 = shaBytes(JSON.stringify(v11));
const v12Sha256 = shaBytes(JSON.stringify(v12));
if (v11Sha256 !== "8e8ac9dd5d1bd7a8446349211d90ac311b27755c01edf03aa97aab904d30ea9c" || resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V400) !== v12 || v12.v12TokensApplied !== true || v12.runtimeTokens.strongGravityV12?.scienceExposure !== 1 || v12.runtimeTokens.strongGravityV12?.scienceBloom !== 0 || v12.runtimeTokens.strongGravityV12?.scienceNoise !== 0 || v12.runtimeTokens.strongGravityV12?.diskDetailSeed !== 400 || v12.runtimeTokens.strongGravity.scienceDisplayTransform !== "linear-no-grade") throw new Error("v400-profile-boundary");
for (const build of ["formal", "standalone-full", "vercel-lite"] as const) { const initial = resolveAtlasInitialVisualProfileV299({ build }); if (initial.profile !== "legacy-v9" || initial.v12ObservationHubManualAbAvailable || initial.localShadowDefaultApplied) throw new Error(`v400-default-boundary:${build}`); }
const localInitial = resolveAtlasInitialVisualProfileV299({ build: "local-shadow" });
if (localInitial.profile !== "legacy-v9" || !localInitial.v12ObservationHubManualAbAvailable || localInitial.localShadowDefaultApplied) throw new Error("v400-local-shadow-boundary");
const hubSource = bounded(paths.hubSource, 128 * 1024).toString("utf8");
const workbenchSource = bounded(paths.workbenchSource, 512 * 1024).toString("utf8");
const abSource = bounded(paths.abSource, 128 * 1024).toString("utf8");
const requiredHubFragments = ["subscribeAtlasResourceSnapshot", "data-atlas-v400-single-stage-mounted=\"true\"", "data-atlas-v400-science-buffer-mutation=\"false\"", "data-atlas-v400-canvas-created=\"false\"", "stage === \"constraints\"", "stage === \"admission\"", "stage === \"intake\"", "stage === \"provenance\""];
if (requiredHubFragments.some((fragment) => !hubSource.includes(fragment)) || hubSource.includes("Math.random") || hubSource.includes("<canvas") || !workbenchSource.includes("<KerrObservationHubV400 />") || workbenchSource.includes("<KerrConstraintForgeV396 />") || !abSource.includes("V12 Observation Hub · Shadow") || !abSource.includes("id !== ATLAS_VISUAL_PROFILE_CANDIDATE_V400 || localShadow")) throw new Error("v400-runtime-wiring");
const unsigned = {
  version: "v400-atlas-observation-hub-qualification-v1" as const,
  generatedAt: new Date().toISOString(),
  status: "observation-hub-v12-static-qualified-browser-pending" as const,
  source: Object.freeze({ v399TemplateArtifactSha256: v399Artifact.artifactSha256, v399EvidenceSha256: v399Evidence.evidenceSha256, v11ProfileSha256: v11Sha256, v12ProfileSha256: v12Sha256, fullShortAuthoritySha256: v399Artifact.source.fullShortAuthoritySha256 }),
  profile: Object.freeze({ id: "science-cinematic-v12-v400" as const, stableReference: true as const, v11Frozen: true as const, scienceExposure: 1 as const, scienceBloom: 0 as const, scienceNoise: 0 as const, scienceDisplayTransform: "linear-no-grade" as const, cinematicDetailSeed: 400 as const, localShadowManualOnly: true as const, defaultApplied: false as const }),
  hub: Object.freeze({ stageCount: 4 as const, maximumMountedStageCount: 1 as const, stageIds: Object.freeze(["constraints", "admission", "intake", "provenance"] as const), directResourceTelemetry: true as const, reactStateUsedForResourceTelemetry: false as const, workerCountObservedViaRegistry: true as const, textureCountObservedViaRegistry: true as const, gpuBufferCountObservedViaRegistry: true as const, objectUrlCountObservedViaRegistry: true as const, cameraLeaseCountObservedViaRegistry: true as const, canvasCreated: false as const, sceneRevisionMutation: false as const, physicsMutation: false as const, scienceBufferMutation: false as const, cinematicBufferMutation: false as const }),
  runtimeBoundary: Object.freeze({ formalProductPointer: "v263" as const, ordinaryStandaloneProfile: "legacy-v9" as const, liteProfile: "legacy-v9" as const, localShadowDefaultProfile: "legacy-v9" as const, localShadowV12ManualAvailable: true as const, denseCampaignStatus: "incomplete-0-of-49" as const, browserQualification: "not-run" as const, visualMatrixQualification: "not-run" as const, soakQualification: "not-run" as const, rtxWebGpuQualification: "not-run" as const }),
  networkAttempted: false as const,
  sciencePayloadMutationAllowed: false as const,
  cinematicConsumerAllowed: true as const,
};
const artifact = parseAtlasObservationHubQualificationV400({ ...unsigned, artifactSha256: canonicalSha(unsigned) });
atomic(paths.artifact, artifact);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, v11ProfileSha256: v11Sha256, v12ProfileSha256: v12Sha256, stages: artifact.hub.stageCount, maximumMounted: artifact.hub.maximumMountedStageCount, science: `${artifact.profile.scienceExposure}/${artifact.profile.scienceBloom}/${artifact.profile.scienceNoise}`, defaultProfile: artifact.runtimeBoundary.localShadowDefaultProfile, browser: artifact.runtimeBoundary.browserQualification }, null, 2));
