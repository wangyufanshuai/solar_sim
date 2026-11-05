export const ORBIT_RELATIVITY_ENGINE_IMPORT_VERSION_V561 = "v1-orbit-atlas-engine-import-v561" as const;
export const ORBIT_RELATIVITY_ENGINE_API_VERSION_V561 = "v1-orbit-atlas-engine-api-v561" as const;

const SHA = /^[0-9a-f]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256", "resultSha256"]);
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const canonicalNumber = (value: number): string => {
  if (!Number.isFinite(value)) throw new Error("v561-canonical-number");
  if (value === 0) return "0.0000000000000000e+0";
  return value.toExponential(16).replace(/e([+-])0+(\d+)/, "e$1$2");
};
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : typeof value === "number"
    ? canonicalNumber(value)
  : !isRecord(value)
    ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !TRANSIENT.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
export const canonicalOrbitRelativityEngineImportV561 = (value: unknown): string => JSON.stringify(canonicalize(value));

export type OrbitRelativityEngineImportV561 = Readonly<{
  version: typeof ORBIT_RELATIVITY_ENGINE_IMPORT_VERSION_V561;
  status: "qualified-cpu-reference-engine-measured-unavailable-grmhd-unavailable" | "qualified-cpu-reference-engine-kerr-transport-measured-unavailable-grmhd-unavailable";
  sourceProject: string;
  sourceEngineVersion: "v1-kerr-reference";
  canonicalSerialization: "orbit-canonical-json-v1-number-e16";
  sourceManifestSha256: string;
  sourceManifestFileSha256: string;
  sourceConfigCanonicalSha256: string;
  sourceEngineSourceSha256: string;
  sourceEngineSourceManifest: readonly Readonly<{ path: string; bytes: number; sha256: string }>[];
  importedFiles: readonly Readonly<{ path: string; bytes: number; sha256: string }>[];
  summary: Readonly<{
    metric: "kerr" | "schwarzschild";
    spin: string;
    observer: Readonly<Record<string, string>>;
    counts: Readonly<{ rayCount: number; frequencyCount: number }>;
    benchmarks: Readonly<Record<string, number | string>>;
    rayCount: number;
    transport?: Readonly<{ status: string; receiptSha256: string; maxWalkerPenroseRelativeDrift: number; maxIndependentEvpaDifferenceRad: number; extendedBenchmarkSuiteQualified: boolean }>;
  }>;
  qualification: Readonly<{ cpuAuthority: true; gpuShadow: false; measuredAuthority: false; denseImage: false; grmhd: false; webConsumerAllowed: true }>;
  boundary: Readonly<{
    formalProductPointer: "v263";
    defaultKernel: "legacy-eih-1pn";
    sciencePayloadImmutable: true;
    cinematicWritebackForbidden: true;
    transportStatus: "blocked-not-yet-promoted" | "qualified-cpu-kerr-walker-penrose-independent-parallel-transport";
    radiativeTransferStatus: "blocked-no-plasma-model";
  }>;
  sourceManifest: readonly Readonly<{ path: string; bytes: number; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;

export type OrbitRelativityEngineApiV561 = Readonly<{
  version: typeof ORBIT_RELATIVITY_ENGINE_API_VERSION_V561;
  available: boolean;
  reason: "ready" | "local-shadow-only" | "lite-boundary" | "evidence-corrupt";
  summary: OrbitRelativityEngineImportV561 | null;
}>;

export function parseOrbitRelativityEngineImportV561(value: unknown): OrbitRelativityEngineImportV561 {
  if (!isRecord(value) || value.version !== ORBIT_RELATIVITY_ENGINE_IMPORT_VERSION_V561 || !["qualified-cpu-reference-engine-measured-unavailable-grmhd-unavailable", "qualified-cpu-reference-engine-kerr-transport-measured-unavailable-grmhd-unavailable"].includes(String(value.status)) || !SHA.test(String(value.artifactSha256))) throw new Error("v561-engine-import-boundary");
  const artifact = value as unknown as OrbitRelativityEngineImportV561;
  if (artifact.sourceEngineVersion !== "v1-kerr-reference" || artifact.canonicalSerialization !== "orbit-canonical-json-v1-number-e16" || !SHA.test(artifact.sourceManifestSha256) || !SHA.test(artifact.sourceManifestFileSha256) || !SHA.test(artifact.sourceConfigCanonicalSha256) || !SHA.test(artifact.sourceEngineSourceSha256) || !Array.isArray(artifact.sourceEngineSourceManifest) || !SHA.test(artifact.sourceSha256)) throw new Error("v561-engine-import-sha");
  if (artifact.importedFiles.length < 4 || artifact.sourceManifest.length < 4 || artifact.summary.rayCount !== artifact.summary.counts.rayCount || artifact.summary.rayCount <= 0 || artifact.qualification.cpuAuthority !== true || artifact.qualification.measuredAuthority !== false || artifact.qualification.grmhd !== false || artifact.boundary.formalProductPointer !== "v263" || artifact.boundary.defaultKernel !== "legacy-eih-1pn" || artifact.boundary.sciencePayloadImmutable !== true || artifact.boundary.cinematicWritebackForbidden !== true) throw new Error("v561-engine-import-qualification");
  if (artifact.status === "qualified-cpu-reference-engine-kerr-transport-measured-unavailable-grmhd-unavailable") {
    const transport = artifact.summary.transport;
    if (artifact.boundary.transportStatus !== "qualified-cpu-kerr-walker-penrose-independent-parallel-transport" || !transport || transport.status !== "passed-walker-penrose-independent-parallel-transport" || transport.extendedBenchmarkSuiteQualified !== true || !SHA.test(transport.receiptSha256) || !Number.isFinite(transport.maxWalkerPenroseRelativeDrift) || transport.maxWalkerPenroseRelativeDrift > 1e-4 || !Number.isFinite(transport.maxIndependentEvpaDifferenceRad) || transport.maxIndependentEvpaDifferenceRad > 1e-4) throw new Error("v561-engine-transport-boundary");
  }
  for (const entry of artifact.importedFiles) if (!entry.path || entry.bytes <= 0 || !SHA.test(entry.sha256)) throw new Error("v561-engine-import-file");
  return artifact;
}

export function parseOrbitRelativityEngineApiV561(value: unknown): OrbitRelativityEngineApiV561 {
  if (!isRecord(value) || value.version !== ORBIT_RELATIVITY_ENGINE_API_VERSION_V561 || typeof value.available !== "boolean" || !["ready", "local-shadow-only", "lite-boundary", "evidence-corrupt"].includes(String(value.reason))) throw new Error("v561-engine-api-boundary");
  if (value.available) parseOrbitRelativityEngineImportV561(value.summary);
  else if (value.summary !== null) throw new Error("v561-engine-api-summary");
  return value as unknown as OrbitRelativityEngineApiV561;
}
