import type { KerrScienceBandHudModelV322 } from "./kerrScienceBandHudV322";

export const KERR_SCIENCE_BAND_PROVENANCE_VERSION_V323 = "v323-kerr-science-band-provenance-v1" as const;

export type KerrScienceBandProvenanceV323 = Readonly<{
  version: typeof KERR_SCIENCE_BAND_PROVENANCE_VERSION_V323;
  mode: "science";
  profileId: KerrScienceBandHudModelV322["profileId"];
  tokenSource: KerrScienceBandHudModelV322["tokenSource"];
  displayTransform: "linear-no-grade";
  rasterVersion: string;
  diskRayCount: number;
  bandCount: number;
  saturationCount: number;
  normalization: KerrScienceBandHudModelV322["normalization"];
  authority: Readonly<{
    payloadDigestSha256: string | null;
    bandArtifactSha256: string | null;
    bandViewDigestSha256: string | null;
    payloadUnchanged: boolean | null;
    bandViewUnchanged: boolean | null;
    buffersDisjoint: boolean | null;
    cinematicBufferShared: boolean | null;
  }>;
  denseBoundary: KerrScienceBandHudModelV322["denseBoundary"];
  browserQualification: "not-run";
  boundary: "read-only-provenance-no-ray-buffer-no-screenshot-no-path-or-host";
  canonicalSha256: string;
}>;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key !== "canonicalSha256")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((entry) => entry.toString(16).padStart(2, "0")).join("");
}

export async function createKerrScienceBandProvenanceV323(
  model: KerrScienceBandHudModelV322,
): Promise<KerrScienceBandProvenanceV323> {
  if (model.mode !== "science" || model.displayTransform !== "linear-no-grade") throw new Error("v323-provenance-science-boundary");
  const unsigned = {
    version: KERR_SCIENCE_BAND_PROVENANCE_VERSION_V323,
    mode: "science" as const,
    profileId: model.profileId,
    tokenSource: model.tokenSource,
    displayTransform: "linear-no-grade" as const,
    rasterVersion: model.rasterVersion,
    diskRayCount: model.diskRayCount,
    bandCount: model.bandCount,
    saturationCount: model.saturationCount,
    normalization: model.normalization,
    authority: {
      payloadDigestSha256: model.payloadDigestSha256,
      bandArtifactSha256: model.bandArtifactSha256,
      bandViewDigestSha256: model.bandViewDigestSha256,
      payloadUnchanged: model.payloadUnchanged,
      bandViewUnchanged: model.bandViewUnchanged,
      buffersDisjoint: model.buffersDisjoint,
      cinematicBufferShared: model.cinematicBufferShared,
    },
    denseBoundary: model.denseBoundary,
    browserQualification: "not-run" as const,
    boundary: "read-only-provenance-no-ray-buffer-no-screenshot-no-path-or-host" as const,
  };
  const canonical = JSON.stringify(canonicalize(unsigned));
  return Object.freeze({ ...unsigned, canonicalSha256: await sha256(canonical) });
}

export function serializeKerrScienceBandProvenanceJsonV323(value: KerrScienceBandProvenanceV323): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function serializeKerrScienceBandProvenanceCsvV323(value: KerrScienceBandProvenanceV323): string {
  const rows: readonly [string, string][] = [
    ["field", "value"],
    ["version", value.version],
    ["mode", value.mode],
    ["profileId", value.profileId],
    ["tokenSource", value.tokenSource],
    ["displayTransform", value.displayTransform],
    ["rasterVersion", value.rasterVersion],
    ["diskRayCount", String(value.diskRayCount)],
    ["bandCount", String(value.bandCount)],
    ["saturationCount", String(value.saturationCount)],
    ["normalization", value.normalization],
    ["payloadDigestSha256", value.authority.payloadDigestSha256 ?? "unavailable"],
    ["bandArtifactSha256", value.authority.bandArtifactSha256 ?? "unavailable"],
    ["bandViewDigestSha256", value.authority.bandViewDigestSha256 ?? "unavailable"],
    ["payloadUnchanged", String(value.authority.payloadUnchanged)],
    ["bandViewUnchanged", String(value.authority.bandViewUnchanged)],
    ["buffersDisjoint", String(value.authority.buffersDisjoint)],
    ["cinematicBufferShared", String(value.authority.cinematicBufferShared)],
    ["denseBoundary", value.denseBoundary],
    ["browserQualification", value.browserQualification],
    ["boundary", value.boundary],
    ["canonicalSha256", value.canonicalSha256],
  ];
  return `${rows.map(([field, entry]) => `${field},${JSON.stringify(entry)}`).join("\n")}\n`;
}

export function parseKerrScienceBandProvenanceV323(value: unknown): KerrScienceBandProvenanceV323 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrScienceBandProvenanceV323>
    : null;
  if (!source || source.version !== KERR_SCIENCE_BAND_PROVENANCE_VERSION_V323
    || source.mode !== "science" || source.displayTransform !== "linear-no-grade"
    || source.browserQualification !== "not-run"
    || source.boundary !== "read-only-provenance-no-ray-buffer-no-screenshot-no-path-or-host"
    || !source.authority || !/^[a-f0-9]{64}$/.test(source.canonicalSha256 ?? "")
    || Object.keys(source).some((key) => ["rayBuffer", "rayPayload", "screenshot", "absolutePath", "host", "pid"].includes(key))) {
    throw new Error("v323-provenance-identity");
  }
  return value as KerrScienceBandProvenanceV323;
}
