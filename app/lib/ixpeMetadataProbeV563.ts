export const IXPE_METADATA_PROBE_VERSION_V563 = "v563-ixpe-metadata-probe-v1" as const;
export const IXPE_METADATA_PROBE_API_VERSION_V563 = "v563-ixpe-metadata-probe-api-v1" as const;
const SHA = /^[a-f0-9]{64}$/;
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const transient = new Set(["generatedAt", "artifactSha256", "resultSha256"]);
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : !record(value) ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonical(entry)]));
export const canonicalIxpeMetadataProbeV563 = (value: unknown): string => JSON.stringify(canonical(value));

export type IxpeMetadataProbeV563 = Readonly<{
  version: typeof IXPE_METADATA_PROBE_VERSION_V563;
  status: "blocked-no-metadata-manifest" | "dry-run-no-network" | "metadata-probe-complete" | "blocked-metadata-identity-conflict";
  target: "Cyg X-1";
  allowedHosts: readonly ["heasarc.gsfc.nasa.gov", "heasarc.nasa.gov"];
  probe: Readonly<{ method: "HEAD-only"; metadataOnly: true; sourceCount: number; networkAttempted: boolean; payloadRead: false; automaticRetry: false; automaticTargetReplacement: false; mirrorIdentityConflict: boolean }>;
  qualification: Readonly<{ metadataContractQualified: true; metadataAvailable: boolean; payloadCompletenessConfirmed: false; measuredAuthorityGranted: false; sciencePayloadWritebackAllowed: false }>;
  boundary: Readonly<{ eventPayloadRead: false; responsePayloadRead: false; attitudePayloadRead: false; backgroundPayloadRead: false; expectedCountsWritten: false; syntheticRowsWritten: false; publicDeploymentAllowed: false; denseCampaignStatus: "incomplete-0-of-49" }>;
  sourceManifest: readonly Readonly<{ path: string; bytes: number; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;
export type IxpeMetadataProbeApiV563 = Readonly<{ version: typeof IXPE_METADATA_PROBE_API_VERSION_V563; available: boolean; reason: "ready" | "local-shadow-only" | "lite-boundary" | "evidence-corrupt"; summary: IxpeMetadataProbeV563 | null }>;

export function parseIxpeMetadataProbeV563(value: unknown): IxpeMetadataProbeV563 {
  if (!record(value) || value.version !== IXPE_METADATA_PROBE_VERSION_V563 || !["blocked-no-metadata-manifest", "dry-run-no-network", "metadata-probe-complete", "blocked-metadata-identity-conflict"].includes(String(value.status)) || value.target !== "Cyg X-1" || !Array.isArray(value.allowedHosts) || value.allowedHosts.join(",") !== "heasarc.gsfc.nasa.gov,heasarc.nasa.gov" || !record(value.probe) || value.probe.method !== "HEAD-only" || value.probe.metadataOnly !== true || value.probe.payloadRead !== false || value.probe.automaticRetry !== false || value.probe.automaticTargetReplacement !== false || !record(value.qualification) || value.qualification.metadataContractQualified !== true || value.qualification.measuredAuthorityGranted !== false || value.qualification.sciencePayloadWritebackAllowed !== false || !record(value.boundary) || value.boundary.eventPayloadRead !== false || value.boundary.responsePayloadRead !== false || value.boundary.attitudePayloadRead !== false || value.boundary.backgroundPayloadRead !== false || value.boundary.expectedCountsWritten !== false || value.boundary.syntheticRowsWritten !== false || value.boundary.denseCampaignStatus !== "incomplete-0-of-49" || !Array.isArray(value.sourceManifest) || !SHA.test(String(value.sourceSha256)) || !SHA.test(String(value.artifactSha256))) throw new Error("v563-ixpe-metadata-boundary");
  if (value.status === "blocked-metadata-identity-conflict" && (value.probe.networkAttempted !== true || value.probe.mirrorIdentityConflict !== true || value.probe.sourceCount !== 2 || value.qualification.metadataAvailable !== false || value.qualification.payloadCompletenessConfirmed !== false)) throw new Error("v563-ixpe-metadata-conflict");
  return value as unknown as IxpeMetadataProbeV563;
}

export function parseIxpeMetadataProbeApiV563(value: unknown): IxpeMetadataProbeApiV563 {
  if (!record(value) || value.version !== IXPE_METADATA_PROBE_API_VERSION_V563 || typeof value.available !== "boolean" || !["ready", "local-shadow-only", "lite-boundary", "evidence-corrupt"].includes(String(value.reason)) || (value.available && !value.summary) || (!value.available && value.summary !== null)) throw new Error("v563-ixpe-metadata-api-boundary");
  if (value.available) parseIxpeMetadataProbeV563(value.summary);
  return value as unknown as IxpeMetadataProbeApiV563;
}
