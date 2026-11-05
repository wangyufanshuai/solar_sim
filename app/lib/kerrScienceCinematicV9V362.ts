import {
  createKerrCinematicRgbaV305,
  createKerrScienceRgbaV305,
  resolveKerrStrongGravityVisualContractV305,
  type KerrCinematicVisualContractV305,
} from "./kerrStrongGravityVisualV305";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V299,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V340,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V349,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V362,
  resolveAtlasVisualProfileV299,
} from "./atlasVisualProfileV299";
import { validateKerrScienceTransferPayloadV299, type KerrScienceTransferPayloadV299 } from "./strongGravityRenderingV299";
import { replayKerrScienceCinematicV8V349 } from "./kerrScienceCinematicV8V349";

export const KERR_SCIENCE_CINEMATIC_V9_VERSION_V362 = "v362-kerr-science-cinematic-v9-instrument-boundary-v1" as const;

export type KerrScienceCinematicV9ReplayV362 = Readonly<{
  version: typeof KERR_SCIENCE_CINEMATIC_V9_VERSION_V362;
  status: "qualified-v9-instrument-science-frozen-cinematic-distinct";
  profiles: readonly ["science-cinematic-v5-v299", "science-cinematic-v6-v300", "science-cinematic-v7-v340", "science-cinematic-v8-v349", "science-cinematic-v9-v362"];
  sampleCount: 16;
  scienceOutputDigest: string;
  sciencePayloadByteIdentical: true;
  scienceOutputProfileInvariant: true;
  scienceOutputDeterministic: true;
  cinematicOutputDeterministic: true;
  cinematicOutputsPairwiseDistinct: true;
  cinematicDigests: Readonly<{ v5: string; v6: string; v7: string; v8: string; v9: string }>;
  v9Tokens: Readonly<{
    exposure: 0.69;
    bloom: 0.28;
    detailSeed: 362;
    redshiftColorStrength: 0.52;
    dopplerColorStrength: 0.58;
    uncertaintyContourOpacity: 0.48;
    detectorGridOpacity: 0.34;
    calibrationAlertLuminance: 0.9;
  }>;
  rendererOutputsDisjointFromAuthority: true;
  measuredCalibrationUsedForCinematicColor: false;
  denseAggregateAccepted: false;
  boundary: "sparse-cpu-authority-science-linear-v9-seeded-instrument-presentation-copy";
}>;

function digest(bytes: Uint8Array): string {
  let hash = 0x811c9dc5;
  for (const value of bytes) {
    hash ^= value;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function equal(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function payloadDigest(payload: KerrScienceTransferPayloadV299): string {
  let hash = 0x811c9dc5;
  for (const value of Object.values(payload)) {
    if (!ArrayBuffer.isView(value)) continue;
    const bytes = new Uint8Array(value.buffer as ArrayBuffer, value.byteOffset, value.byteLength);
    for (const byte of bytes) {
      hash ^= byte;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
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

export function replayKerrScienceCinematicV9V362(payload: KerrScienceTransferPayloadV299): KerrScienceCinematicV9ReplayV362 {
  const validation = validateKerrScienceTransferPayloadV299(payload);
  if (!validation.passed || payload.authorityKind !== "v312-v313-short-gate-sparse" || payload.sampleCount !== 16 || payload.denseCampaignComplete || payload.denseAggregateSha256 !== null) throw new Error("v362-kerr-authority-boundary");
  const previous = replayKerrScienceCinematicV8V349(payload);
  const before = payloadDigest(payload);
  const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V362);
  const scienceContract = resolveKerrStrongGravityVisualContractV305(profile, "science");
  const cinematicContract = resolveKerrStrongGravityVisualContractV305(profile, "cinematic") as KerrCinematicVisualContractV305;
  const science = createKerrScienceRgbaV305(payload);
  const scienceReplay = createKerrScienceRgbaV305(payload);
  const cinematic = createKerrCinematicRgbaV305({ rayCount: payload.sampleCount, values: response(payload) }, cinematicContract);
  const cinematicReplay = createKerrCinematicRgbaV305({ rayCount: payload.sampleCount, values: response(payload) }, cinematicContract);
  const after = payloadDigest(payload);
  const cinematicDigests = Object.freeze({ ...previous.cinematicDigests, v9: digest(cinematic) });
  const authorityBuffers: ArrayBufferLike[] = [];
  for (const value of Object.values(payload)) {
    if (ArrayBuffer.isView(value)) authorityBuffers.push(value.buffer);
  }
  const rendererOutputsDisjointFromAuthority = [science, scienceReplay, cinematic, cinematicReplay]
    .every((output) => authorityBuffers.every((buffer) => buffer !== output.buffer));
  if (scienceContract.exposure !== 1 || scienceContract.bloom !== 0 || scienceContract.noise !== 0
    || !equal(science, scienceReplay) || before !== after || previous.scienceOutputDigest !== digest(science)
    || !equal(cinematic, cinematicReplay) || new Set(Object.values(cinematicDigests)).size !== 5
    || !rendererOutputsDisjointFromAuthority || cinematicContract.tokenSource !== "v9") throw new Error("v362-kerr-visual-boundary");
  return Object.freeze({
    version: KERR_SCIENCE_CINEMATIC_V9_VERSION_V362,
    status: "qualified-v9-instrument-science-frozen-cinematic-distinct",
    profiles: [ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300, ATLAS_VISUAL_PROFILE_CANDIDATE_V340, ATLAS_VISUAL_PROFILE_CANDIDATE_V349, ATLAS_VISUAL_PROFILE_CANDIDATE_V362] as const,
    sampleCount: 16,
    scienceOutputDigest: previous.scienceOutputDigest,
    sciencePayloadByteIdentical: true,
    scienceOutputProfileInvariant: true,
    scienceOutputDeterministic: true,
    cinematicOutputDeterministic: true,
    cinematicOutputsPairwiseDistinct: true,
    cinematicDigests,
    v9Tokens: Object.freeze({ exposure: 0.69, bloom: 0.28, detailSeed: 362, redshiftColorStrength: 0.52, dopplerColorStrength: 0.58, uncertaintyContourOpacity: 0.48, detectorGridOpacity: 0.34, calibrationAlertLuminance: 0.9 } as const),
    rendererOutputsDisjointFromAuthority: true,
    measuredCalibrationUsedForCinematicColor: false,
    denseAggregateAccepted: false,
    boundary: "sparse-cpu-authority-science-linear-v9-seeded-instrument-presentation-copy",
  });
}
