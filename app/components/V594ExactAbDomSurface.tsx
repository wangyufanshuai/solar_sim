"use client";

import {
  V594_EXACT_AB_CANVAS_IDENTITY,
  V594_EXACT_AB_CONSUMER,
  V594_EXACT_AB_CONSUMER_RECEIPT_VERSION,
  V594_EXACT_AB_LANES,
  V594_EXACT_AB_RUNTIME_VERSION,
  deriveExactSimulationStateShaV594,
  exactSimulationStateBindingV594,
  type V594ExactAbConsumerReceipt,
  type V594ExactAbLane,
  type V594ExactAbRuntimeRequest,
} from "../lib/v594ExactAbContract";

export default function V594ExactAbDomSurface({
  lane,
  request,
  receipt,
  controlsExpanded,
  blockedReason,
  onLaneChange,
  onCollapseControls,
}: Readonly<{
  lane: V594ExactAbLane;
  request: V594ExactAbRuntimeRequest | null;
  receipt: V594ExactAbConsumerReceipt | null;
  controlsExpanded: boolean;
  blockedReason: string;
  onLaneChange: (lane: V594ExactAbLane) => void;
  onCollapseControls: () => void;
}>) {
  const frame = request?.frame ?? receipt?.frame ?? null;
  const simulationStateSha256 = frame
    ? deriveExactSimulationStateShaV594(exactSimulationStateBindingV594(frame))
    : "pending";
  return (
    <section
      className="pointer-events-auto absolute left-1/2 top-3 z-[130] w-[min(360px,calc(100vw-24px))] -translate-x-1/2 border border-cyan-100/20 bg-[#020609]/94 p-2 font-mono text-white shadow-2xl backdrop-blur-xl"
      data-atlas-v594-exact-ab={V594_EXACT_AB_RUNTIME_VERSION}
      data-atlas-v594-exact-ab-lane={frame?.lane ?? lane}
      data-atlas-v594-exact-ab-target={frame?.targetId ?? "pending"}
      data-atlas-v594-exact-ab-archetype={frame?.archetype ?? "pending"}
      data-atlas-v594-exact-ab-mode={frame?.mode ?? "pending"}
      data-atlas-v594-exact-ab-sim-days={frame?.simDays ?? "pending"}
      data-atlas-v594-exact-ab-paused={frame ? String(frame.paused) : "pending"}
      data-atlas-v594-exact-ab-camera-preset={frame?.cameraPreset ?? "pending"}
      data-atlas-v594-exact-ab-camera-state-sha256={receipt?.cameraStateSha256 ?? "pending"}
      data-atlas-v594-exact-ab-simulation-state-sha256={receipt?.simulationStateSha256 ?? simulationStateSha256}
      data-atlas-v594-exact-ab-asset-ready={frame ? String(frame.assetReady) : "false"}
      data-atlas-v594-exact-ab-selected-target-ready={frame ? String(frame.selectedTargetReady) : "false"}
      data-atlas-v594-exact-ab-controls-expanded={String(controlsExpanded)}
      data-atlas-v594-exact-ab-blocked-reason={blockedReason || "none"}
      data-atlas-candidate={
        receipt && frame?.archetype === "relativity-workbench"
          ? "v594"
          : undefined
      }
    >
      <div
        data-atlas-v594-exact-ab-controls
        data-atlas-v594-exact-ab-controls-expanded={String(controlsExpanded)}
        className={controlsExpanded ? "block" : "hidden"}
      >
        <div className="text-[8px] uppercase tracking-[.16em] text-cyan-50/72">
          v594 Exact A/B
        </div>
        <div className="mt-1 text-[6px] uppercase tracking-[.08em] text-white/38">
          app-owned main Canvas consumer · paused day 0
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {V594_EXACT_AB_LANES.map((candidateLane) => (
            <button
              key={candidateLane}
              type="button"
              data-atlas-v594-exact-ab-select-lane={candidateLane}
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
          data-atlas-v594-exact-ab-controls-collapse
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
        data-atlas-v594-exact-ab-consumer={V594_EXACT_AB_CONSUMER}
        data-atlas-v594-exact-ab-lane={receipt?.frame.lane ?? frame?.lane ?? lane}
        data-atlas-v594-exact-ab-target={receipt?.frame.targetId ?? frame?.targetId ?? "pending"}
        data-atlas-v594-exact-ab-runtime-consumed={String(Boolean(receipt))}
        data-atlas-v594-exact-ab-render-state-sha256={receipt?.render.stateSha256 ?? "pending"}
        data-atlas-v594-exact-ab-render-contract-sha256={receipt?.render.contractSha256 ?? "pending"}
        data-atlas-v594-exact-ab-render-revision={receipt?.render.revision ?? "pending"}
        data-atlas-v594-exact-ab-consumer-receipt-sha256={receipt?.receiptSha256 ?? "pending"}
        data-atlas-v594-exact-ab-relativity-observation-active={
          receipt ? String(receipt.soakObservability.relativityObservation.active) : "pending"
        }
        data-atlas-v594-exact-ab-relativity-observation-sha256={
          receipt?.soakObservability.relativityObservationSha256 ?? "pending"
        }
        data-atlas-v594-exact-ab-canvas-identity={receipt?.canvas.identity ?? V594_EXACT_AB_CANVAS_IDENTITY}
        data-atlas-v594-exact-ab-ready={String(Boolean(receipt))}
        hidden
      />
      {receipt ? (
        <script
          type="application/json"
          data-atlas-v594-exact-ab-consumer-receipt={V594_EXACT_AB_CONSUMER_RECEIPT_VERSION}
        >
          {JSON.stringify(receipt)}
        </script>
      ) : null}
    </section>
  );
}
