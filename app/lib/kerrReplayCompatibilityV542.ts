export const KERR_REPLAY_COMPATIBILITY_VERSION_V542 = "v542-kerr-replay-compatibility-artifact-v1" as const;
export const KERR_REPLAY_COMPATIBILITY_API_VERSION_V542 = "v542-kerr-replay-compatibility-api-v1" as const;
export const KERR_REPLAY_COMPATIBILITY_HUD_PROFILE_ID_V542 = "science-cinematic-v9r1-v542" as const;

const SHA = /^[0-9a-f]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256", "columnSha256", "receiptSha256", "resultSha256", "environmentSha256", "preflightSha256", "matrixSha256"]);
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !isRecord(value)
    ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !TRANSIENT.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));

export const canonicalKerrReplayCompatibilityV542 = (value: unknown): string => JSON.stringify(canonicalize(value));

export type KerrReplayCompatibilityCellV542 = Readonly<{
  id: "observed-current-environment" | "same-dependencies-other-os" | "different-python" | "different-science-dependencies";
  osFamily: string;
  runtimeRelation: string;
  stdlibPreflight: string;
  scienceReplay: string;
  executed: boolean;
}>;

export type KerrReplayRuntimeTupleV542 = Readonly<{
  pythonImplementation: string;
  pythonVersion: string;
  numpyVersion: string;
  astropyVersion: string;
  zlibVersion: string;
  osFamily?: string;
  osRelease?: string;
  machine?: string;
}>;

export type KerrReplayPreflightV542 = Readonly<{
  version: "v542-stdlib-preflight-receipt-v1";
  status: "package-integrity-qualified-science-replay-still-requires-locked-dependencies";
  source: Readonly<{ v541KitFileSha256: string; v541EnvironmentSha256: string; v541ValidationResultSha256: string; preflightValidatorFileSha256: string }>;
  requiredRuntime: KerrReplayRuntimeTupleV542;
  observedRuntime: KerrReplayRuntimeTupleV542;
  checks: Readonly<{ kitMemberCount: 7; kitManifestReplayCount: 6; crateMemberCount: 9; crateManifestReplayCount: 8; pathTraversalCount: 0; symlinkCount: 0; duplicateNameCount: 0; encryptedMemberCount: 0; networkAttemptCount: 0; workspaceImportCount: 0; numpyImported: false; astropyImported: false; exactDependencyTupleMatch: true }>;
  compatibility: Readonly<{ matrix: readonly KerrReplayCompatibilityCellV542[]; observedEnvironmentPreflightQualified: true; lockedTupleScienceReplayQualifiedByV541: true; preflightIssuesScienceQualification: false; crossEnvironmentQualified: false }>;
  qualification: Readonly<{ stdlibPackagePreflightQualified: true; exactDependencyTupleDetected: true; scientificReplayQualifiedByThisPreflight: false; crossEnvironmentQualified: false; scienceImageQualified: false; productionPromotionQualified: false }>;
  boundary: Readonly<{ scienceDependenciesImported: false; fitsSemanticValidationPerformed: false; scienceReplayExecuted: false; denseCampaignStatus: "incomplete-0-of-49"; formalProductPointer: "v263"; formalDefaultKernel: "legacy-eih-1pn" }>;
  preflightSha256: string;
}>;

export type KerrReplayCompatibilityMatrixV542 = Readonly<{
  version: "v542-kerr-replay-compatibility-matrix-v1";
  status: "one-environment-qualified-cross-environment-unqualified-not-tested";
  cells: readonly KerrReplayCompatibilityCellV542[];
  qualifiedCellCount: 1;
  executedCellCount: 1;
  unqualifiedNotTestedCellCount: 1;
  exactLockMismatchCellCount: 2;
  boundary: Readonly<{ contractPredictionIsQualification: false; otherOsExecuted: false; otherPythonExecuted: false; otherNumpyExecuted: false; otherAstropyExecuted: false; crossEnvironmentQualified: false }>;
  matrixSha256: string;
}>;

export type KerrReplayCompatibilityArtifactV542 = Readonly<{
  version: typeof KERR_REPLAY_COMPATIBILITY_VERSION_V542;
  status: "stdlib-preflight-qualified-one-environment-science-replay-qualified-cross-environment-unqualified";
  source: Readonly<{ v541ArtifactSha256: string; v541KitFileSha256: string; v541ValidationResultSha256: string; v541EvidenceSha256: string; v541PointerSha256: string }>;
  exports: Readonly<Record<"preflight" | "matrix", Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>> & { validator: Readonly<{ path: string; fileSha256: string }> }>;
  preflight: KerrReplayPreflightV542;
  compatibility: KerrReplayCompatibilityMatrixV542;
  counts: Readonly<{ preflightSubprocessAttemptCount: 2; qualifiedPreflightSubprocessCount: 2; temporaryDirectoryLeakCount: 0; compatibilityCellCount: 4; executedEnvironmentCount: 1; crossEnvironmentExecutionCount: 0; scienceDependencyImportCount: 0; networkAttemptCount: 0 }>;
  qualification: Readonly<{ stdlibPreflightQualified: true; v541LockedEnvironmentScienceReplayQualified: true; compatibilityMatrixQualified: true; crossEnvironmentQualified: false; scienceImageQualified: false; productionPromotionQualified: false }>;
  boundary: Readonly<{ preflightIssuesScienceQualification: false; fitsSemanticValidationRequiresLockedAstropy: true; numpyScienceChecksRequireLockedNumpy: true; denseCampaignStatus: "incomplete-0-of-49"; measuredCalibrationFiles: 0; browserQualification: "not-run"; formalProductPointer: "v263"; formalDefaultKernel: "legacy-eih-1pn" }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;

export type KerrReplayCompatibilityApiV542 = Readonly<{
  version: typeof KERR_REPLAY_COMPATIBILITY_API_VERSION_V542;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrReplayCompatibilityArtifactV542 | null;
}>;

function validCells(value: unknown): value is readonly KerrReplayCompatibilityCellV542[] {
  return Array.isArray(value) && value.length === 4 && value.filter((cell) => isRecord(cell) && cell.executed === true).length === 1 && value.every((cell) => isRecord(cell) && typeof cell.id === "string" && typeof cell.scienceReplay === "string" && typeof cell.stdlibPreflight === "string" && typeof cell.executed === "boolean");
}

export function parseKerrReplayCompatibilityArtifactV542(value: unknown): KerrReplayCompatibilityArtifactV542 {
  if (!isRecord(value) || value.version !== KERR_REPLAY_COMPATIBILITY_VERSION_V542 || value.status !== "stdlib-preflight-qualified-one-environment-science-replay-qualified-cross-environment-unqualified" || !SHA.test(String(value.artifactSha256)) || !SHA.test(String(value.sourceSha256))) throw new Error("v542-artifact-boundary");
  const artifact = value as unknown as KerrReplayCompatibilityArtifactV542;
  if (artifact.preflight.version !== "v542-stdlib-preflight-receipt-v1" || !SHA.test(artifact.preflight.preflightSha256) || artifact.preflight.qualification.stdlibPackagePreflightQualified !== true || artifact.preflight.qualification.scientificReplayQualifiedByThisPreflight !== false || artifact.preflight.checks.numpyImported !== false || artifact.preflight.checks.astropyImported !== false || !validCells(artifact.preflight.compatibility.matrix)) throw new Error("v542-preflight-boundary");
  if (artifact.compatibility.version !== "v542-kerr-replay-compatibility-matrix-v1" || !SHA.test(artifact.compatibility.matrixSha256) || artifact.compatibility.qualifiedCellCount !== 1 || artifact.compatibility.executedCellCount !== 1 || !validCells(artifact.compatibility.cells) || artifact.qualification.crossEnvironmentQualified !== false || artifact.boundary.formalProductPointer !== "v263" || artifact.boundary.formalDefaultKernel !== "legacy-eih-1pn" || artifact.boundary.denseCampaignStatus !== "incomplete-0-of-49") throw new Error("v542-compatibility-boundary");
  if (!Array.isArray(artifact.sourceManifest) || artifact.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256))) throw new Error("v542-source-manifest");
  return artifact;
}

export function parseKerrReplayCompatibilityApiV542(value: unknown): KerrReplayCompatibilityApiV542 {
  if (!isRecord(value) || value.version !== KERR_REPLAY_COMPATIBILITY_API_VERSION_V542 || typeof value.available !== "boolean" || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(String(value.reason))) throw new Error("v542-api-boundary");
  if (value.available) parseKerrReplayCompatibilityArtifactV542(value.summary);
  else if (value.summary !== null) throw new Error("v542-api-unavailable-summary");
  return value as unknown as KerrReplayCompatibilityApiV542;
}

export type KerrReplayCompatibilityHudModeV542 = "science" | "cinematic";
const scienceProfile = Object.freeze({ id: KERR_REPLAY_COMPATIBILITY_HUD_PROFILE_ID_V542, mode: "science" as const, panel: "#041013", panelRaised: "#071b20", ink: "#e8fbff", muted: "#7fa2aa", qualified: "#7cf4c6", warning: "#f3c879", unavailable: "#ff91ad", scienceBoundary: Object.freeze({ linearDisplay: true, bloomIntensity: 0 as const, colorGradeIntensity: 0 as const, numericScientificStyleInputCount: 0 as const, scientificFieldMutation: false as const }), cinematicSeed: null });
const cinematicProfile = Object.freeze({ ...scienceProfile, mode: "cinematic" as const, panel: "#110b08", panelRaised: "#20140f", ink: "#fff6e7", muted: "#b79d83", qualified: "#91efc8", warning: "#f6c877", unavailable: "#ff9ab2", scienceBoundary: Object.freeze({ linearDisplay: false, bloomIntensity: 0.045, colorGradeIntensity: 0.03, numericScientificStyleInputCount: 0 as const, scientificFieldMutation: false as const }), cinematicSeed: "orbit-atlas-v542-compatibility-seed-01" });
export function resolveKerrReplayCompatibilityHudProfileV542(mode: KerrReplayCompatibilityHudModeV542) { return mode === "science" ? scienceProfile : cinematicProfile; }
export function createKerrReplayCompatibilityHudEncodingV542(artifact: KerrReplayCompatibilityArtifactV542, mode: KerrReplayCompatibilityHudModeV542) { return Object.freeze({ version: "v542-replay-compatibility-hud-v1" as const, profileId: KERR_REPLAY_COMPATIBILITY_HUD_PROFILE_ID_V542, mode, artifactKey: artifact.artifactSha256, kitKey: artifact.source.v541KitFileSha256, v541ScienceReplayKey: artifact.source.v541ValidationResultSha256, preflightKey: artifact.preflight.preflightSha256, matrixKey: artifact.compatibility.matrixSha256, cells: artifact.compatibility.cells, requiredRuntime: artifact.preflight.requiredRuntime, observedRuntime: artifact.preflight.observedRuntime, executedEnvironmentCount: 1 as const, preflightSubprocessCount: 2 as const, scienceDependencyImportCount: 0 as const, crossEnvironmentQualified: false as const, imageHduCount: 0 as const, numericScientificStyleInputCount: 0 as const, scientificFieldMutation: false as const }); }
export function compareKerrReplayCompatibilityHudEncodingsV542(science: ReturnType<typeof createKerrReplayCompatibilityHudEncodingV542>, cinematic: ReturnType<typeof createKerrReplayCompatibilityHudEncodingV542>) { if (science.mode !== "science" || cinematic.mode !== "cinematic" || science.artifactKey !== cinematic.artifactKey || science.kitKey !== cinematic.kitKey || science.v541ScienceReplayKey !== cinematic.v541ScienceReplayKey || science.preflightKey !== cinematic.preflightKey || science.matrixKey !== cinematic.matrixKey || JSON.stringify(science.cells) !== JSON.stringify(cinematic.cells) || JSON.stringify(science.requiredRuntime) !== JSON.stringify(cinematic.requiredRuntime) || JSON.stringify(science.observedRuntime) !== JSON.stringify(cinematic.observedRuntime)) throw new Error("v542-hud-boundary"); return Object.freeze({ compatibilityStable: true as const, preflightStable: true as const, scienceReplayIdentityStable: true as const, executedEnvironmentCount: 1 as const, crossEnvironmentQualified: false as const, scientificFieldMutation: false as const }); }
