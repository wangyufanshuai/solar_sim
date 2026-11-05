"use client";

import { useMemo } from "react";
import trajectoryEvidenceJson from "../../public/data/post-v593-stellar-relativity/relativity-trajectory-reference-v3.json";
import {
  exactCandidateForLaneV594,
  type V594ExactAbRuntimeRequest,
} from "../lib/v594ExactAbContract";

type TrajectoryBodyRow = Readonly<{
  bodyId: string;
  legacyMinusNewtonPositionM: readonly [number, number, number];
  legacyMinusNewtonPositionNormM: number;
  v2MinusLegacyPositionM: readonly [number, number, number];
  v2MinusLegacyPositionNormM: number;
}>;

type TrajectoryEvidence = Readonly<{
  status: string;
  evidenceSha256: string;
  runner: Readonly<{ resultSha256: string }>;
  gates: Readonly<{ allQualified: boolean }>;
  result: Readonly<{ perBody: readonly TrajectoryBodyRow[] }>;
  authority: Readonly<{
    defaultKernel: "legacy-eih-1pn";
    v2Mode: "shadow";
    promotionDecision: false;
    scientificPayloadMutationAllowed: false;
  }>;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteVector3(value: unknown): value is readonly [number, number, number] {
  return Array.isArray(value)
    && value.length === 3
    && value.every((component) => typeof component === "number" && Number.isFinite(component));
}

function isTrajectoryBodyRow(value: unknown): value is TrajectoryBodyRow {
  return isRecord(value)
    && typeof value.bodyId === "string"
    && value.bodyId.length > 0
    && isFiniteVector3(value.legacyMinusNewtonPositionM)
    && typeof value.legacyMinusNewtonPositionNormM === "number"
    && Number.isFinite(value.legacyMinusNewtonPositionNormM)
    && value.legacyMinusNewtonPositionNormM >= 0
    && isFiniteVector3(value.v2MinusLegacyPositionM)
    && typeof value.v2MinusLegacyPositionNormM === "number"
    && Number.isFinite(value.v2MinusLegacyPositionNormM)
    && value.v2MinusLegacyPositionNormM >= 0;
}

function isTrajectoryEvidence(value: unknown): value is TrajectoryEvidence {
  if (!isRecord(value)
    || typeof value.status !== "string"
    || typeof value.evidenceSha256 !== "string"
    || !isRecord(value.runner)
    || typeof value.runner.resultSha256 !== "string"
    || !isRecord(value.gates)
    || typeof value.gates.allQualified !== "boolean"
    || !isRecord(value.result)
    || !Array.isArray(value.result.perBody)
    || !isRecord(value.authority)
  ) return false;
  return value.result.perBody.every(isTrajectoryBodyRow)
    && value.authority.defaultKernel === "legacy-eih-1pn"
    && value.authority.v2Mode === "shadow"
    && value.authority.promotionDecision === false
    && value.authority.scientificPayloadMutationAllowed === false;
}

function validateTrajectoryPresentationSource(value: unknown): TrajectoryEvidence {
  if (
    !isTrajectoryEvidence(value)
    || !value.status.startsWith("qualified-")
    || !value.gates.allQualified
    || !/^[0-9a-f]{64}$/.test(value.evidenceSha256)
    || !/^[0-9a-f]{64}$/.test(value.runner.resultSha256)
    || value.result.perBody.length !== 3
  ) throw new Error("v594-relativity-exact-presentation-source");
  return value;
}

const TRAJECTORY = validateTrajectoryPresentationSource(trajectoryEvidenceJson);

function signedLogScale(value: number, maximum: number, scale: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(maximum) || maximum <= 0) {
    throw new Error("v594-relativity-exact-vector");
  }
  if (value === 0) return 0;
  return Math.sign(value) * Math.log1p(Math.abs(value)) / Math.log1p(maximum) * scale;
}

function positionForRow(
  row: TrajectoryBodyRow,
  index: number,
  lane: V594ExactAbRuntimeRequest["frame"]["lane"],
  maxima: Readonly<{ legacy: number; v2: number }>,
): readonly [number, number, number] {
  const vector = lane === "baseline-v593"
    ? row.legacyMinusNewtonPositionM
    : row.v2MinusLegacyPositionM;
  const maximum = lane === "baseline-v593" ? maxima.legacy : maxima.v2;
  return Object.freeze([
    (index - 1) * 6 + signedLogScale(vector[0], maximum, 1.4),
    signedLogScale(vector[1], maximum, 3.2),
    signedLogScale(vector[2], maximum, 3.2),
  ] as const);
}

function exactNodeMetadata(
  request: V594ExactAbRuntimeRequest,
  nodeId: string,
): Record<string, unknown> {
  return {
    atlasCandidate: "v594",
    atlasExactAbRuntime: true,
    atlasExactAbCaptureRequestId: request.captureRequestId,
    atlasExactAbCandidate: exactCandidateForLaneV594(request.frame.lane),
    atlasExactAbNodeId: nodeId,
    atlasExactAbTargetId: request.frame.targetId,
    atlasExactAbArchetype: request.frame.archetype,
    atlasExactAbMode: request.frame.mode,
    atlasExactAbSourceBindingSha256: TRAJECTORY.evidenceSha256,
    atlasExactAbPresentationAuthority: "none",
    atlasExactAbRelativityAuthority: "shadow-only",
    atlasExactAbDefaultKernel: "legacy-eih-1pn",
    atlasExactAbScientificPayloadWriteback: false,
    atlasExactAbPromotionApplied: false,
    atlasExactAbPhysicsEngineMutated: false,
    atlasExactAbWorkerStateMutated: false,
  };
}

/**
 * Presentation-only R3F consumer of the sealed shadow trajectory summary.
 * It never receives physicsRef, worker state, or a writeback callback.
 */
export default function PostV594RelativityExactPresentationNode({
  request,
}: Readonly<{
  request: V594ExactAbRuntimeRequest;
}>) {
  const candidate = exactCandidateForLaneV594(request.frame.lane);
  const maxima = useMemo(() => Object.freeze({
    legacy: Math.max(...TRAJECTORY.result.perBody.map((row) => row.legacyMinusNewtonPositionNormM)),
    v2: Math.max(...TRAJECTORY.result.perBody.map((row) => row.v2MinusLegacyPositionNormM)),
  }), []);
  const rows = useMemo(() => TRAJECTORY.result.perBody.map((row, index) => Object.freeze({
    row,
    position: positionForRow(row, index, request.frame.lane, maxima),
  })), [maxima, request.frame.lane]);
  if (request.frame.archetype !== "relativity-workbench") return null;

  return (
    <group
      name={`v594-exact-relativity-${candidate}`}
      userData={{
        ...exactNodeMetadata(request, `${candidate}:relativity:root`),
        atlasExactAbRelativityPresentation: true,
        atlasExactAbResultSha256: TRAJECTORY.runner.resultSha256,
      }}
    >
      {request.frame.lane === "baseline-v593"
        ? rows.map(({ row, position }, index) => {
            const nodeId = `v593:relativity:${row.bodyId}:legacy-marker`;
            const radius = 0.42 + Math.log1p(row.legacyMinusNewtonPositionNormM) / Math.log1p(maxima.legacy) * 0.5;
            const metadata = exactNodeMetadata(request, nodeId);
            return (
              <mesh key={nodeId} position={position} userData={metadata}>
                <sphereGeometry args={[radius, 20, 14]} userData={metadata} />
                <meshStandardMaterial
                  color={index === 0 ? "#f8e7b0" : index === 1 ? "#8cbcff" : "#e6b286"}
                  roughness={0.72}
                  metalness={0.05}
                  userData={metadata}
                />
              </mesh>
            );
          })
        : rows.flatMap(({ row, position }, index) => {
            const normalized = Math.log1p(row.v2MinusLegacyPositionNormM) / Math.log1p(maxima.v2);
            const vectorNodeId = `v594:relativity:${row.bodyId}:shadow-delta-vector`;
            const envelopeNodeId = `v594:relativity:${row.bodyId}:validation-envelope`;
            const vectorMetadata = exactNodeMetadata(request, vectorNodeId);
            const envelopeMetadata = exactNodeMetadata(request, envelopeNodeId);
            return [
              <mesh
                key={vectorNodeId}
                position={position}
                scale={[0.28 + normalized * 0.46, 0.7 + normalized * 1.8, 0.28 + normalized * 0.46]}
                rotation={[0.35 + index * 0.18, 0.22 + index * 0.31, 0.15]}
                userData={vectorMetadata}
              >
                <boxGeometry args={[1, 1, 1]} userData={vectorMetadata} />
                <meshStandardMaterial
                  color={index === 0 ? "#d7fbff" : index === 1 ? "#69d9ff" : "#b69cff"}
                  emissive={index === 2 ? "#332054" : "#0b3444"}
                  emissiveIntensity={0.55}
                  roughness={0.35}
                  metalness={0.18}
                  userData={vectorMetadata}
                />
              </mesh>,
              <mesh
                key={envelopeNodeId}
                position={position}
                rotation={[Math.PI / 2, index * 0.37, 0]}
                userData={envelopeMetadata}
              >
                <torusGeometry args={[0.8 + normalized * 1.15, 0.06 + normalized * 0.08, 12, 48]} userData={envelopeMetadata} />
                <meshBasicMaterial
                  color={index === 0 ? "#efffff" : index === 1 ? "#60d5ff" : "#c7a9ff"}
                  transparent
                  opacity={0.72}
                  depthWrite={false}
                  toneMapped={false}
                  userData={envelopeMetadata}
                />
              </mesh>,
            ];
          })}
    </group>
  );
}

export const POST_V594_RELATIVITY_EXACT_SOURCE_BINDING_SHA256 = TRAJECTORY.evidenceSha256;
