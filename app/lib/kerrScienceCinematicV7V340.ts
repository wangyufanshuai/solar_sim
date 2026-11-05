import { createKerrCinematicRgbaV305, createKerrScienceRgbaV305, resolveKerrStrongGravityVisualContractV305, type KerrCinematicVisualContractV305 } from "./kerrStrongGravityVisualV305";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300, ATLAS_VISUAL_PROFILE_CANDIDATE_V340, resolveAtlasVisualProfileV299 } from "./atlasVisualProfileV299";
import { validateKerrScienceTransferPayloadV299, type KerrScienceTransferPayloadV299 } from "./strongGravityRenderingV299";

export const KERR_SCIENCE_CINEMATIC_V7_VERSION_V340 = "v340-kerr-science-cinematic-v7-boundary-v1" as const;

export type KerrScienceCinematicV7ReplayV340 = Readonly<{
  version: typeof KERR_SCIENCE_CINEMATIC_V7_VERSION_V340;
  status: "qualified-v7-science-frozen-cinematic-distinct";
  profiles: readonly ["science-cinematic-v5-v299", "science-cinematic-v6-v300", "science-cinematic-v7-v340"];
  sampleCount: 16;
  scienceContractsEquivalent: true;
  scienceOutputProfileInvariant: true;
  scienceOutputDeterministic: true;
  sciencePayloadByteIdentical: true;
  scienceOutputDigest: string;
  cinematicOutputDeterministic: true;
  cinematicOutputsPairwiseDistinct: true;
  cinematicDigests: Readonly<{ v5: string; v6: string; v7: string }>;
  v7Tokens: Readonly<{ exposure: 0.74; bloom: 0.38; detailSeed: 340; redshiftColorStrength: 0.58; dopplerColorStrength: 0.64 }>;
  rendererOutputsDisjointFromAuthority: true;
  v7Direction: "deep-space-precision-observatory";
  denseAggregateAccepted: false;
  boundary: "sparse-cpu-authority-science-linear-v7-seeded-presentation-copy";
}>;

function digest(bytes: Uint8Array): string { let hash = 0x811c9dc5; for (const value of bytes) { hash ^= value; hash = Math.imul(hash, 0x01000193) >>> 0; } return hash.toString(16).padStart(8, "0"); }
function equal(left: Uint8Array, right: Uint8Array): boolean { return left.length === right.length && left.every((value, index) => value === right[index]); }
function payloadDigest(payload: KerrScienceTransferPayloadV299): string {
  let hash = 0x811c9dc5;
  for (const value of Object.values(payload)) {
    if (!ArrayBuffer.isView(value)) continue;
    const bytes = new Uint8Array(value.buffer as ArrayBuffer, value.byteOffset, value.byteLength);
    for (const byte of bytes) { hash ^= byte; hash = Math.imul(hash, 0x01000193) >>> 0; }
  }
  return hash.toString(16).padStart(8, "0");
}
function response(payload: KerrScienceTransferPayloadV299): Float32Array<ArrayBuffer> {
  const values = new Float32Array(new ArrayBuffer(payload.sampleCount * 4 * Float32Array.BYTES_PER_ELEMENT));
  for (let index = 0; index < payload.sampleCount; index += 1) {
    const offset = index * 4;
    values[offset] = payload.classification[index];
    values[offset + 1] = payload.redshiftApplicable[index] === 1 ? payload.redshiftFactor[index] : 1;
    values[offset + 2] = payload.imageOrderApplicable[index] === 1 ? payload.imageOrder[index] : 0;
    values[offset + 3] = payload.intensity[index];
  }
  return values;
}

export function replayKerrScienceCinematicV7V340(payload: KerrScienceTransferPayloadV299): KerrScienceCinematicV7ReplayV340 {
  const validation = validateKerrScienceTransferPayloadV299(payload);
  if (!validation.passed || payload.authorityKind !== "v312-v313-short-gate-sparse" || payload.sampleCount !== 16 || payload.denseCampaignComplete || payload.denseAggregateSha256 !== null) throw new Error("v340-kerr-authority-boundary");
  const before = payloadDigest(payload);
  const profiles = [ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300, ATLAS_VISUAL_PROFILE_CANDIDATE_V340] as const;
  const resolved = profiles.map(resolveAtlasVisualProfileV299);
  const scienceContracts = resolved.map((profile) => resolveKerrStrongGravityVisualContractV305(profile, "science"));
  const cinematicContracts = resolved.map((profile) => resolveKerrStrongGravityVisualContractV305(profile, "cinematic"));
  const scienceOutputs = resolved.map(() => createKerrScienceRgbaV305(payload));
  const scienceReplay = createKerrScienceRgbaV305(payload);
  const values = response(payload);
  const cinematicOutputs = cinematicContracts.map((contract) => createKerrCinematicRgbaV305({ rayCount: payload.sampleCount, values }, contract));
  const cinematicReplays = cinematicContracts.map((contract) => createKerrCinematicRgbaV305({ rayCount: payload.sampleCount, values }, contract));
  const after = payloadDigest(payload);
  const scienceContractsEquivalent = new Set(scienceContracts.map((contract) => JSON.stringify([contract.displayTransform, contract.exposure, contract.bloom, contract.noise, contract.toneMapped, contract.scienceBufferMutationAllowed]))).size === 1;
  const scienceOutputProfileInvariant = scienceOutputs.every((output) => equal(output, scienceOutputs[0]));
  const scienceOutputDeterministic = equal(scienceOutputs[0], scienceReplay);
  const cinematicOutputDeterministic = cinematicOutputs.every((output, index) => equal(output, cinematicReplays[index]));
  const cinematicDigests = cinematicOutputs.map(digest);
  const cinematicOutputsPairwiseDistinct = new Set(cinematicDigests).size === 3;
  const authorityBuffers: ArrayBufferLike[] = [];
  for (const value of Object.values(payload)) if (ArrayBuffer.isView(value)) authorityBuffers.push(value.buffer);
  const rendererOutputsDisjointFromAuthority = [...scienceOutputs, scienceReplay, ...cinematicOutputs, ...cinematicReplays].every((output) => authorityBuffers.every((buffer) => buffer !== output.buffer));
  const v7 = cinematicContracts[2] as KerrCinematicVisualContractV305;
  if (!scienceContractsEquivalent || !scienceOutputProfileInvariant || !scienceOutputDeterministic || before !== after || !cinematicOutputDeterministic || !cinematicOutputsPairwiseDistinct || !rendererOutputsDisjointFromAuthority
    || v7.tokenSource !== "v7" || v7.exposure !== 0.74 || v7.bloom !== 0.38 || v7.detailSeed !== 340 || v7.redshiftColorStrength !== 0.58 || v7.dopplerColorStrength !== 0.64) throw new Error("v340-kerr-visual-boundary");
  return Object.freeze({ version: KERR_SCIENCE_CINEMATIC_V7_VERSION_V340, status: "qualified-v7-science-frozen-cinematic-distinct", profiles, sampleCount: 16, scienceContractsEquivalent: true, scienceOutputProfileInvariant: true, scienceOutputDeterministic: true, sciencePayloadByteIdentical: true, scienceOutputDigest: digest(scienceOutputs[0]), cinematicOutputDeterministic: true, cinematicOutputsPairwiseDistinct: true, cinematicDigests: Object.freeze({ v5: cinematicDigests[0], v6: cinematicDigests[1], v7: cinematicDigests[2] }), v7Tokens: Object.freeze({ exposure: 0.74, bloom: 0.38, detailSeed: 340, redshiftColorStrength: 0.58, dopplerColorStrength: 0.64 }), rendererOutputsDisjointFromAuthority: true, v7Direction: "deep-space-precision-observatory", denseAggregateAccepted: false, boundary: "sparse-cpu-authority-science-linear-v7-seeded-presentation-copy" });
}
