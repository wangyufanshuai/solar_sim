import {
  KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312,
} from "./kerrAuthorityV312";
import { KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313 } from "./kerrAuthorityV313";
import { KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314 } from "./kerrCampaignV314";
import {
  createKerrCinematicRgbaV305,
  createKerrScienceRgbaV305,
  resolveKerrStrongGravityVisualContractV305,
} from "./kerrStrongGravityVisualV305";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V299,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
  resolveAtlasVisualProfileV299,
} from "./atlasVisualProfileV299";
import {
  KERR_CLASSIFICATION_V299,
  validateKerrScienceTransferPayloadV299,
  type KerrScienceTransferPayloadV299,
} from "./strongGravityRenderingV299";

export const KERR_SCIENCE_CINEMATIC_BUFFER_REPLAY_VERSION_V337 = "v337-kerr-science-cinematic-full-buffer-replay-v1" as const;

export type KerrScientificBufferDigestV337 = Readonly<{
  field: string;
  type: string;
  length: number;
  byteLength: number;
  digest: string;
}>;

export type KerrScienceCinematicBufferReplayV337 = Readonly<{
  version: typeof KERR_SCIENCE_CINEMATIC_BUFFER_REPLAY_VERSION_V337;
  status: "qualified-full-sparse-authority-render-boundary-replay";
  authority: Readonly<{
    kind: "v312-v313-short-gate-sparse";
    geometrySha256: typeof KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312;
    polarizationSha256: typeof KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313;
    rayPlanSha256: typeof KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314;
    denseCampaignComplete: false;
    denseAggregateSha256: null;
  }>;
  sampleCount: 16;
  classificationCounts: Readonly<{ capture: 6; escape: 6; diskHit: 4 }>;
  applicableEvpaCount: 4;
  scientificBufferFieldCount: number;
  scientificBufferByteLength: number;
  buffersBefore: readonly KerrScientificBufferDigestV337[];
  buffersAfter: readonly KerrScientificBufferDigestV337[];
  allScientificBuffersByteIdentical: true;
  classificationUnchanged: true;
  redshiftUnchanged: true;
  evpaUnchanged: true;
  intensityUnchanged: true;
  errorBudgetBuffersUnchanged: true;
  scienceContractsEquivalent: true;
  scienceOutputProfileInvariant: true;
  scienceOutputDeterministic: true;
  scienceOutputDigest: string;
  scienceOutputByteLength: number;
  cinematicOutputDeterministic: true;
  cinematicProfileOutputsDistinct: true;
  v5CinematicOutputDigest: string;
  v6CinematicOutputDigest: string;
  scienceAndCinematicBuffersDisjoint: true;
  rendererOutputsDisjointFromAuthority: true;
  responseCopyDisjointFromAuthority: true;
  denseIncompleteVisible: true;
  boundary: "v312-v313-sixteen-ray-sparse-authority-only-no-dense-transfer-map-no-science-buffer-mutation";
}>;

type KerrScientificTypedArrayV337 = Uint8Array<ArrayBufferLike>
  | Uint16Array<ArrayBufferLike>
  | Uint32Array<ArrayBufferLike>
  | Int16Array<ArrayBufferLike>
  | Float64Array<ArrayBufferLike>;

function isScientificTypedArray(value: unknown): value is KerrScientificTypedArrayV337 {
  return value instanceof Uint8Array || value instanceof Uint16Array || value instanceof Uint32Array
    || value instanceof Int16Array || value instanceof Float64Array;
}

function byteDigest(bytes: Uint8Array): string {
  let hash = 0x811c9dc5;
  for (const value of bytes) {
    hash ^= value;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function scientificBufferDigests(payload: KerrScienceTransferPayloadV299): readonly KerrScientificBufferDigestV337[] {
  const entries: Array<readonly [string, KerrScientificTypedArrayV337]> = [];
  for (const [field, value] of Object.entries(payload)) {
    if (isScientificTypedArray(value)) entries.push([field, value]);
  }
  return entries.map(([field, view]) => {
      const bytes = new Uint8Array(view.buffer as ArrayBuffer, view.byteOffset, view.byteLength);
      return Object.freeze({ field, type: view.constructor.name, length: view.length, byteLength: view.byteLength, digest: byteDigest(bytes) });
    })
    .sort((left, right) => left.field.localeCompare(right.field));
}

function createCinematicResponseCopy(payload: KerrScienceTransferPayloadV299): Float32Array<ArrayBuffer> {
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

function fieldDigest(buffers: readonly KerrScientificBufferDigestV337[], field: string): string {
  const found = buffers.find((entry) => entry.field === field);
  if (!found) throw new Error(`v337-missing-science-buffer:${field}`);
  return found.digest;
}

export function replayKerrScienceCinematicBuffersV337(
  payload: KerrScienceTransferPayloadV299,
): KerrScienceCinematicBufferReplayV337 {
  const validation = validateKerrScienceTransferPayloadV299(payload);
  if (!validation.passed
    || payload.authorityKind !== "v312-v313-short-gate-sparse"
    || payload.geometryEvidenceSha256 !== KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312
    || payload.polarizationEvidenceSha256 !== KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313
    || payload.rayPlanSha256 !== KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314
    || payload.denseCampaignComplete !== false || payload.denseAggregateSha256 !== null
    || payload.sampleCount !== 16) throw new Error("v337-sparse-authority-boundary");

  const capture = payload.classification.reduce((count, value) => count + Number(value === KERR_CLASSIFICATION_V299.capture), 0);
  const escape = payload.classification.reduce((count, value) => count + Number(value === KERR_CLASSIFICATION_V299.escape), 0);
  const diskHit = payload.classification.reduce((count, value) => count + Number(value === KERR_CLASSIFICATION_V299["disk-hit"]), 0);
  const applicableEvpaCount = payload.evpaApplicable.reduce((count, value) => count + Number(value === 1), 0);
  if (capture !== 6 || escape !== 6 || diskHit !== 4 || applicableEvpaCount !== 4) {
    throw new Error("v337-sparse-ray-conservation");
  }

  const buffersBefore = scientificBufferDigests(payload);
  const authorityBuffers: ArrayBufferLike[] = [];
  for (const value of Object.values(payload)) {
    if (isScientificTypedArray(value)) authorityBuffers.push(value.buffer);
  }
  const v5Profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V299);
  const v6Profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V300);
  const v5ScienceContract = resolveKerrStrongGravityVisualContractV305(v5Profile, "science");
  const v6ScienceContract = resolveKerrStrongGravityVisualContractV305(v6Profile, "science");
  const v5CinematicContract = resolveKerrStrongGravityVisualContractV305(v5Profile, "cinematic");
  const v6CinematicContract = resolveKerrStrongGravityVisualContractV305(v6Profile, "cinematic");

  const v5ScienceFirst = createKerrScienceRgbaV305(payload);
  const v5ScienceSecond = createKerrScienceRgbaV305(payload);
  const v6Science = createKerrScienceRgbaV305(payload);
  const responseValues = createCinematicResponseCopy(payload);
  const response = { rayCount: payload.sampleCount, values: responseValues };
  const v5CinematicFirst = createKerrCinematicRgbaV305(response, v5CinematicContract);
  const v5CinematicSecond = createKerrCinematicRgbaV305(response, v5CinematicContract);
  const v6CinematicFirst = createKerrCinematicRgbaV305(response, v6CinematicContract);
  const v6CinematicSecond = createKerrCinematicRgbaV305(response, v6CinematicContract);
  const buffersAfter = scientificBufferDigests(payload);

  const allScientificBuffersByteIdentical = JSON.stringify(buffersBefore) === JSON.stringify(buffersAfter);
  const scienceContractsEquivalent = v5ScienceContract.displayTransform === v6ScienceContract.displayTransform
    && v5ScienceContract.exposure === 1 && v6ScienceContract.exposure === 1
    && v5ScienceContract.bloom === 0 && v6ScienceContract.bloom === 0
    && v5ScienceContract.noise === 0 && v6ScienceContract.noise === 0;
  const scienceOutputProfileInvariant = equalBytes(v5ScienceFirst, v6Science);
  const scienceOutputDeterministic = equalBytes(v5ScienceFirst, v5ScienceSecond);
  const cinematicOutputDeterministic = equalBytes(v5CinematicFirst, v5CinematicSecond)
    && equalBytes(v6CinematicFirst, v6CinematicSecond);
  const cinematicProfileOutputsDistinct = !equalBytes(v5CinematicFirst, v6CinematicFirst);
  const rendererOutputs = [v5ScienceFirst, v5ScienceSecond, v6Science, v5CinematicFirst, v5CinematicSecond, v6CinematicFirst, v6CinematicSecond];
  const rendererOutputsDisjointFromAuthority = rendererOutputs.every((output) => authorityBuffers.every((buffer) => buffer !== output.buffer));
  const responseCopyDisjointFromAuthority = authorityBuffers.every((buffer) => buffer !== responseValues.buffer);
  const scienceAndCinematicBuffersDisjoint = [v5ScienceFirst, v5ScienceSecond, v6Science]
    .every((science) => [v5CinematicFirst, v5CinematicSecond, v6CinematicFirst, v6CinematicSecond]
      .every((cinematic) => science.buffer !== cinematic.buffer));
  const errorFields = ["massShellResidualNormalized", "carterResidualNormalized", "kerrSchildMassShellResidualNormalized", "metricPullbackResidual", "covectorRoundtripResidual", "metricDerivativeAuditResidual", "tetradResidual", "kerrSchildTetradResidual", "polarizationNullResidualNormalized", "polarizationOrthogonalityResidualNormalized", "polarizationNormResidual", "walkerPenroseInvariantDrift", "polarizationEndpointResidual", "screenDirectionResidual"];
  const errorBudgetBuffersUnchanged = errorFields.every((field) => fieldDigest(buffersBefore, field) === fieldDigest(buffersAfter, field));
  if (!allScientificBuffersByteIdentical || !scienceContractsEquivalent || !scienceOutputProfileInvariant
    || !scienceOutputDeterministic || !cinematicOutputDeterministic || !cinematicProfileOutputsDistinct
    || !rendererOutputsDisjointFromAuthority || !responseCopyDisjointFromAuthority
    || !scienceAndCinematicBuffersDisjoint || !errorBudgetBuffersUnchanged) {
    throw new Error("v337-science-cinematic-buffer-isolation");
  }

  return Object.freeze({
    version: KERR_SCIENCE_CINEMATIC_BUFFER_REPLAY_VERSION_V337,
    status: "qualified-full-sparse-authority-render-boundary-replay",
    authority: Object.freeze({
      kind: "v312-v313-short-gate-sparse",
      geometrySha256: KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312,
      polarizationSha256: KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313,
      rayPlanSha256: KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314,
      denseCampaignComplete: false,
      denseAggregateSha256: null,
    }),
    sampleCount: 16,
    classificationCounts: Object.freeze({ capture: 6, escape: 6, diskHit: 4 }),
    applicableEvpaCount: 4,
    scientificBufferFieldCount: buffersBefore.length,
    scientificBufferByteLength: buffersBefore.reduce((total, entry) => total + entry.byteLength, 0),
    buffersBefore: Object.freeze(buffersBefore),
    buffersAfter: Object.freeze(buffersAfter),
    allScientificBuffersByteIdentical: true,
    classificationUnchanged: true,
    redshiftUnchanged: true,
    evpaUnchanged: true,
    intensityUnchanged: true,
    errorBudgetBuffersUnchanged: true,
    scienceContractsEquivalent: true,
    scienceOutputProfileInvariant: true,
    scienceOutputDeterministic: true,
    scienceOutputDigest: byteDigest(v5ScienceFirst),
    scienceOutputByteLength: v5ScienceFirst.byteLength,
    cinematicOutputDeterministic: true,
    cinematicProfileOutputsDistinct: true,
    v5CinematicOutputDigest: byteDigest(v5CinematicFirst),
    v6CinematicOutputDigest: byteDigest(v6CinematicFirst),
    scienceAndCinematicBuffersDisjoint: true,
    rendererOutputsDisjointFromAuthority: true,
    responseCopyDisjointFromAuthority: true,
    denseIncompleteVisible: true,
    boundary: "v312-v313-sixteen-ray-sparse-authority-only-no-dense-transfer-map-no-science-buffer-mutation",
  });
}
