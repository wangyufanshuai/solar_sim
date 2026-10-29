"use client";

import {
  V595_EXACT_AB_CANVAS_IDENTITY,
  V595_EXACT_AB_CONSUMER,
  V595_EXACT_AB_CONSUMER_RECEIPT_VERSION,
  V595_EXACT_AB_LANES,
  V595_EXACT_AB_RUNTIME_VERSION,
  deriveExactSimulationStateShaV595,
  exactSimulationStateBindingV595,
  type V595ExactAbConsumerReceipt,
  type V595ExactAbLane,
  type V595ExactAbRuntimeRequest,
} from "../lib/v595ExactAbContract";

export default function V595ExactAbDomSurface({
  lane,
  request,
  receipt,
  controlsExpanded,
  blockedReason,
  onLaneChange,
  onCollapseControls,
}: Readonly<{
  lane: V595ExactAbLane;
  request: V595ExactAbRuntimeRequest | null;
  receipt: V595ExactAbConsumerReceipt | null;
  controlsExpanded: boolean;
  blockedReason: string;
  onLaneChange: (lane: V595ExactAbLane) => void;
  onCollapseControls: () => void;
}>) {
  const frame = request?.frame ?? receipt?.frame ?? null;
  const simulationStateSha256 = frame
    ? deriveExactSimulationStateShaV595(exactSimulationStateBindingV595(frame))
    : "pending";
  return (
    <section
      className="pointer-events-auto absolute left-1/2 top-3 z-[130] w-[min(360px,calc(100vw-24px))] -translate-x-1/2 border border-cyan-100/20 bg-[#020609]/94 p-2 font-mono text-white shadow-2xl backdrop-blur-xl"
      data-atlas-v595-exact-ab={V595_EXACT_AB_RUNTIME_VERSION}
      data-atlas-v595-exact-ab-lane={frame?.lane ?? lane}
      data-atlas-v595-exact-ab-target={frame?.targetId ?? "pending"}
      data-atlas-v595-exact-ab-archetype={frame?.archetype ?? "pending"}
      data-atlas-v595-exact-ab-mode={frame?.mode ?? "pending"}
      data-atlas-v595-exact-ab-sim-days={frame?.simDays ?? "pending"}
      data-atlas-v595-exact-ab-paused={frame ? String(frame.paused) : "pending"}
      data-atlas-v595-exact-ab-camera-preset={frame?.cameraPreset ?? "pending"}
      data-atlas-v595-exact-ab-camera-state-sha256={receipt?.cameraStateSha256 ?? "pending"}
      data-atlas-v595-exact-ab-simulation-state-sha256={
        receipt?.simulationStateSha256 ?? simulationStateSha256
      }
      data-atlas-v595-exact-ab-asset-ready={frame ? String(frame.assetReady) : "false"}
      data-atlas-v595-exact-ab-selected-target-ready={
        frame ? String(frame.selectedTargetReady) : "false"
      }
      data-atlas-v595-exact-ab-controls-expanded={String(controlsExpanded)}
      data-atlas-v595-exact-ab-blocked-reason={blockedReason || "none"}
      data-atlas-v595-build-binding-status={request?.identity.bindingStatus ?? "pending"}
      data-atlas-v595-source-manifest-sha256={request?.identity.sourceManifestSha256 ?? "pending"}
      data-atlas-v595-candidate-manifest-sha256={
        request?.identity.candidateManifestSha256 ?? "pending"
      }
      data-atlas-v595-build-fingerprint={request?.identity.buildFingerprint ?? "pending"}
      data-atlas-v595-build-id={request?.identity.buildId ?? "pending"}
      data-atlas-v595-deployment-id={request?.identity.deploymentId ?? "pending"}
      data-atlas-v595-delivery-tier={request?.identity.deliveryTier ?? "pending"}
      data-atlas-v595-formal-product-pointer={
        request?.identity.formalProductPointer ?? "v263"
      }
      data-atlas-candidate={receipt?.render.candidate}
    >
      <div
        data-atlas-v595-exact-ab-controls
        data-atlas-v595-exact-ab-controls-expanded={String(controlsExpanded)}
        className={controlsExpanded ? "block" : "hidden"}
      >
        <div className="text-[8px] uppercase tracking-[.16em] text-cyan-50/72">
          v595 Exact A/B
        </div>
        <div className="mt-1 text-[6px] uppercase tracking-[.08em] text-white/38">
          baseline v594 · candidate v595 · shared main Canvas · paused day 0
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {V595_EXACT_AB_LANES.map((candidateLane) => (
            <button
              key={candidateLane}
              type="button"
              data-atlas-v595-exact-ab-select-lane={candidateLane}
              aria-pressed={lane === candidateLane}
              onClick={() => onLaneChange(candidateLane)}
              className={`min-h-10 border px-2 text-[7px] uppercase tracking-[.08em] ${lane === candidateLane ? "border-cyan-100/55 bg-cyan-100/10 text-cyan-50" : "border-white/12 text-white/48"}`}
            >
              {candidateLane}
            </button>
          ))}
        </div>
        <button
          type="button"
          data-atlas-v595-exact-ab-controls-collapse
          onClick={onCollapseControls}
          className="mt-2 min-h-10 w-full border border-white/15 px-2 text-[7px] uppercase tracking-[.1em] text-white/65"
        >
          Collapse Exact controls
        </button>
      </div>
      {!controlsExpanded ? (
        <div className="text-[7px] uppercase tracking-[.1em] text-white/48">
          {receipt ? "settled receipt published" : blockedReason || "waiting for R3F settle"}
        </div>
      ) : null}
      <div
        data-atlas-v595-exact-ab-consumer={V595_EXACT_AB_CONSUMER}
        data-atlas-v595-exact-ab-lane={receipt?.frame.lane ?? frame?.lane ?? lane}
        data-atlas-v595-exact-ab-target={receipt?.frame.targetId ?? frame?.targetId ?? "pending"}
        data-atlas-v595-exact-ab-runtime-consumed={String(Boolean(receipt))}
        data-atlas-v595-exact-ab-render-state-sha256={receipt?.render.stateSha256 ?? "pending"}
        data-atlas-v595-exact-ab-render-contract-sha256={receipt?.render.contractSha256 ?? "pending"}
        data-atlas-v595-exact-ab-render-revision={receipt?.render.revision ?? "pending"}
        data-atlas-v595-exact-ab-consumer-receipt-sha256={receipt?.receiptSha256 ?? "pending"}
        data-atlas-v595-exact-ab-relativity-observation-active={
          receipt ? String(receipt.soakObservability.relativityObservation.active) : "pending"
        }
        data-atlas-v595-exact-ab-relativity-observation-sha256={
          receipt?.soakObservability.relativityObservationSha256 ?? "pending"
        }
        data-atlas-v595-exact-ab-canvas-identity={
          receipt?.canvas.identity ?? V595_EXACT_AB_CANVAS_IDENTITY
        }
        data-atlas-v595-exact-ab-single-canvas-policy={
          receipt?.canvas.singleCanvasPolicy ?? "shared-main-canvas"
        }
        data-atlas-v595-exact-ab-scientific-authority={
          receipt ? String(receipt.render.contractState.scientificAuthority) : "false"
        }
        data-atlas-v595-exact-ab-measured-authority={
          receipt ? String(receipt.render.contractState.measuredAuthority) : "false"
        }
        data-atlas-v595-exact-ab-gpu-authority={
          receipt ? String(receipt.render.contractState.gpuAuthority) : "false"
        }
        data-atlas-v595-exact-ab-promotion={receipt?.render.contractState.promotion ?? "none"}
        data-atlas-v595-exact-ab-ready={String(Boolean(receipt))}
        hidden
      />
      {receipt ? (
        <script
          type="application/json"
          data-atlas-v595-exact-ab-consumer-receipt={V595_EXACT_AB_CONSUMER_RECEIPT_VERSION}
        >
          {JSON.stringify(receipt)}
        </script>
      ) : null}
    </section>
  );
}
