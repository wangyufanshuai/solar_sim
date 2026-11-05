"use client";

import { useMemo } from "react";
import trajectoryEvidenceJson from "../../public/data/post-v593-stellar-relativity/relativity-trajectory-reference-v3.json";
import { TIMELIKE_KERR_REFERENCE_V595 } from "../lib/timelikeKerrReferenceV595";
import {
  exactCandidateForLaneV595,
  type V595ExactAbRuntimeRequest,
} from "../lib/v595ExactAbContract";

type TrajectoryBodyRow = Readonly<{
  bodyId: string;
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

function finiteVector3(value: unknown): value is readonly [number, number, number] {
  return Array.isArray(value)
    && value.length === 3
    && value.every((component) => typeof component === "number" && Number.isFinite(component));
}

function admitBaseline(value: unknown): TrajectoryEvidence {
  const candidate = value as TrajectoryEvidence;
  if (
    !isRecord(value)
    || !candidate.status?.startsWith("qualified-")
    || !/^[0-9a-f]{64}$/.test(candidate.evidenceSha256)
    || !/^[0-9a-f]{64}$/.test(candidate.runner?.resultSha256)
    || candidate.gates?.allQualified !== true
    || candidate.authority?.defaultKernel !== "legacy-eih-1pn"
    || candidate.authority?.v2Mode !== "shadow"
    || candidate.authority?.promotionDecision !== false
    || candidate.authority?.scientificPayloadMutationAllowed !== false
    || candidate.result?.perBody?.length !== 3
    || !candidate.result.perBody.every((row) => row.bodyId
      && finiteVector3(row.v2MinusLegacyPositionM)
      && Number.isFinite(row.v2MinusLegacyPositionNormM)
      && row.v2MinusLegacyPositionNormM >= 0)
  ) throw new Error("v595-relativity-exact-baseline-source");
  return candidate;
}

const BASELINE = admitBaseline(trajectoryEvidenceJson);

function signedLogScale(value: number, maximum: number, scale: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(maximum) || maximum <= 0) {
    throw new Error("v595-relativity-exact-vector");
  }
  if (value === 0) return 0;
  return Math.sign(value) * Math.log1p(Math.abs(value)) / Math.log1p(maximum) * scale;
}

function exactNodeMetadata(
  request: V595ExactAbRuntimeRequest,
  nodeId: string,
  sourceBindingSha256: string,
): Record<string, unknown> {
  const candidate = exactCandidateForLaneV595(request.frame.lane);
  return {
    atlasCandidate: candidate,
    atlasExactAbRuntime: true,
    atlasExactAbHostVersion: "v595",
    atlasExactAbCandidateRevision: candidate === "v594" ? 594 : 595,
    atlasExactAbCaptureRequestId: request.captureRequestId,
    atlasExactAbCandidate: candidate,
    atlasExactAbNodeId: nodeId,
    atlasExactAbTargetId: request.frame.targetId,
    atlasExactAbArchetype: request.frame.archetype,
    atlasExactAbMode: request.frame.mode,
    atlasExactAbSourceBindingSha256: sourceBindingSha256,
    atlasExactAbPresentationAuthority: "none",
    atlasExactAbRelativityAuthority: "shadow-only",
    atlasExactAbScientificAuthority: false,
    atlasExactAbMeasuredAuthority: false,
    atlasExactAbGpuAuthority: false,
    atlasExactAbRadiativeTransferAuthority: false,
    atlasExactAbGrmhdAuthority: false,
    atlasExactAbPromotion: "none",
    atlasExactAbDefaultKernel: "legacy-eih-1pn",
    atlasExactAbScientificPayloadWriteback: false,
    atlasExactAbPhysicsEngineMutated: false,
    atlasExactAbWorkerStateMutated: false,
  };
}

function BaselineV594Presentation({ request }: Readonly<{ request: V595ExactAbRuntimeRequest }>) {
  const maximum = Math.max(...BASELINE.result.perBody.map((row) => row.v2MinusLegacyPositionNormM));
  const rootMetadata = exactNodeMetadata(
    request,
    "v594:relativity:root",
    BASELINE.evidenceSha256,
  );
  return (
    <group
      name="v595-exact-baseline-v594-relativity"
      userData={{
        ...rootMetadata,
        atlasExactAbBaselineArtifact: "post-v593-relativity-trajectory-evidence-v3",
        atlasExactAbResultSha256: BASELINE.runner.resultSha256,
      }}
    >
      {BASELINE.result.perBody.flatMap((row, index) => {
        const position = [
          (index - 1) * 6 + signedLogScale(row.v2MinusLegacyPositionM[0], maximum, 1.4),
          signedLogScale(row.v2MinusLegacyPositionM[1], maximum, 3.2),
          signedLogScale(row.v2MinusLegacyPositionM[2], maximum, 3.2),
        ] as const;
        const normalized = Math.log1p(row.v2MinusLegacyPositionNormM) / Math.log1p(maximum);
        const vectorNodeId = `v594:relativity:${row.bodyId}:shadow-delta-vector`;
        const envelopeNodeId = `v594:relativity:${row.bodyId}:validation-envelope`;
        const vectorMetadata = exactNodeMetadata(request, vectorNodeId, BASELINE.evidenceSha256);
        const envelopeMetadata = exactNodeMetadata(request, envelopeNodeId, BASELINE.evidenceSha256);
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
            <torusGeometry
              args={[0.8 + normalized * 1.15, 0.06 + normalized * 0.08, 12, 48]}
              userData={envelopeMetadata}
            />
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

function CandidateV595Presentation({ request }: Readonly<{ request: V595ExactAbRuntimeRequest }>) {
  const sourceBinding = TIMELIKE_KERR_REFERENCE_V595.admissionSha256;
  const rootMetadata = exactNodeMetadata(request, "v595:relativity:root", sourceBinding);
  const fixtureRows = useMemo(() => TIMELIKE_KERR_REFERENCE_V595.fixtures.map((fixture, index) => ({
    fixture,
    position: [
      (index - 1.5) * 4.4,
      Math.min(3.4, Math.log1p(fixture.dynamics.dynamicThetaSpan) * 2.4) - 1.2,
      Math.min(3.2, Math.log1p(fixture.dynamics.dynamicPThetaSpan) * 1.25) - 1.1,
    ] as const,
  })), []);
  return (
    <group
      name="v595-exact-candidate-v595-timelike-kerr"
      userData={{
        ...rootMetadata,
        atlasExactAbReferenceCandidate: "timelike-kerr-v595",
        atlasExactAbFormalEvidence: false,
        atlasExactAbAdmissionSha256: sourceBinding,
        atlasExactAbFixtureCount: TIMELIKE_KERR_REFERENCE_V595.fixtures.length,
        atlasExactAbAnalyticAnchorCount: TIMELIKE_KERR_REFERENCE_V595.analyticAnchors.length,
      }}
    >
      {fixtureRows.map(({ fixture, position }, index) => {
        const nodeId = `v595:relativity:fixture:${fixture.id}`;
        const metadata = {
          ...exactNodeMetadata(request, nodeId, sourceBinding),
          atlasExactAbFixtureId: fixture.id,
          atlasExactAbFixtureQualified: fixture.qualified,
          atlasExactAbClassification: fixture.classification,
          atlasExactAbMassShellResidual: fixture.invariants.maxMassShellResidual,
          atlasExactAbCarterQDrift: fixture.invariants.maxAbsoluteDrift.carterQ,
        };
        const color = ["#9eeeff", "#ffb06b", "#c3a6ff", "#86ffd2"][index] ?? "#ffffff";
        return (
          <mesh
            key={nodeId}
            position={position}
            scale={[0.72, 0.72 + index * 0.13, 0.72]}
            userData={metadata}
          >
            <icosahedronGeometry args={[1, 2]} userData={metadata} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.28}
              roughness={0.32}
              metalness={0.12}
              userData={metadata}
            />
          </mesh>
        );
      })}
      {TIMELIKE_KERR_REFERENCE_V595.analyticAnchors.map((anchor, index) => {
        const nodeId = `v595:relativity:anchor:${anchor.id}`;
        const metadata = {
          ...exactNodeMetadata(request, nodeId, sourceBinding),
          atlasExactAbAnalyticAnchorId: anchor.id,
          atlasExactAbAnalyticAnchorQualified: anchor.qualified,
          atlasExactAbAnalyticAnchorFamily: anchor.family,
        };
        return (
          <mesh
            key={nodeId}
            position={[(index - 1) * 5.5, -4.2, 0]}
            rotation={[Math.PI / 2, index * 0.3, 0]}
            userData={metadata}
          >
            <torusGeometry args={[1.05 + index * 0.18, 0.08, 12, 48]} userData={metadata} />
            <meshBasicMaterial
              color={index === 0 ? "#d9fbff" : index === 1 ? "#84d6ff" : "#cdb8ff"}
              transparent
              opacity={0.78}
              depthWrite={false}
              toneMapped={false}
              userData={metadata}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Presentation-only; receives no physics ref, worker state or writeback callback. */
export default function PostV595RelativityExactPresentationNode({
  request,
}: Readonly<{
  request: V595ExactAbRuntimeRequest;
}>) {
  if (request.frame.archetype !== "relativity-workbench") return null;
  return request.frame.lane === "baseline-v594"
    ? <BaselineV594Presentation request={request} />
    : <CandidateV595Presentation request={request} />;
}

export const POST_V595_RELATIVITY_EXACT_BASELINE_SOURCE_BINDING_SHA256 =
  BASELINE.evidenceSha256;
export const POST_V595_RELATIVITY_EXACT_CANDIDATE_SOURCE_BINDING_SHA256 =
  TIMELIKE_KERR_REFERENCE_V595.admissionSha256;
