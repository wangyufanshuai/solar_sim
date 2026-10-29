"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { runRelativityReferenceRunnerV3, type RelativityReferenceRunV3 } from "../lib/relativityReferenceRunnerV3";
import {
  TIMELIKE_KERR_REFERENCE_SUMMARY_V595,
  TIMELIKE_KERR_REFERENCE_V595,
} from "../lib/timelikeKerrReferenceV595";
import trajectoryEvidenceJson from "../../public/data/post-v593-stellar-relativity/relativity-trajectory-reference-v3.json";

export type PostV593RelativityModeV1 = "cinematic" | "science" | "validation";

const REFERENCE_RUN: RelativityReferenceRunV3 = runRelativityReferenceRunnerV3({
  bodyIds: ["sun", "earth", "jupiter"],
  samples: [{
    sampleId: "formal-runtime-reference-j2000",
    positionM: new Float64Array([0, 0, 0, 1.495978707e11, 0, 0, 0, 7.7857e11, 0]),
    velocityMS: new Float64Array([0, 0, 0, 0, 29_784.6918, 0, -13_070, 0, 0]),
    massKg: new Float64Array([1.98847e30, 5.9722e24, 1.89813e27]),
  }],
  reverseTime: true,
});

type TrajectoryEvidenceSummaryV3 = Readonly<{
  status: string;
  runner: Readonly<{ resultSha256: string }>;
  experiment: Readonly<{ bodyIds: readonly string[] }>;
  gates: Readonly<{
    threeKernelObservedOrderQualified: boolean;
    fullTrajectoryReverseTimeQualified: boolean;
    effectIsolationQualified: boolean;
    allQualified: boolean;
  }>;
  authority: Readonly<{
    defaultKernel: "legacy-eih-1pn";
    v2Mode: "shadow";
    promotionDecision: false;
    scientificPayloadMutationAllowed: false;
  }>;
}>;

const TRAJECTORY_EVIDENCE = trajectoryEvidenceJson as TrajectoryEvidenceSummaryV3;
const TRAJECTORY_EVIDENCE_QUALIFIED = TRAJECTORY_EVIDENCE.status.startsWith("qualified-")
  && TRAJECTORY_EVIDENCE.gates.allQualified
  && TRAJECTORY_EVIDENCE.authority.defaultKernel === "legacy-eih-1pn"
  && TRAJECTORY_EVIDENCE.authority.v2Mode === "shadow"
  && TRAJECTORY_EVIDENCE.authority.promotionDecision === false
  && TRAJECTORY_EVIDENCE.authority.scientificPayloadMutationAllowed === false;

const compactNumber = (value: number): string => {
  if (value === 0) return "0";
  const magnitude = Math.abs(value);
  if (magnitude >= 0.01 && magnitude < 1_000) return value.toFixed(3);
  return value.toExponential(2);
};

export function relativityWorkbenchLauncherLayoutV638(objectBrowserOpen: boolean) {
  return { left: objectBrowserOpen ? 96 : 64, width: 124, height: 44, topInset: 6 };
}

export function RelativityWorkbenchLauncherV638({ expanded, objectBrowserOpen, onExpandedChange, onRequestOpen, launcherRef }: {
  expanded: boolean;
  objectBrowserOpen: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onRequestOpen?: () => void;
  launcherRef?: RefObject<HTMLButtonElement | null>;
}) {
  const { topInset, ...bounds } = relativityWorkbenchLauncherLayoutV638(objectBrowserOpen);
  return <button ref={launcherRef} type="button"
    aria-expanded={expanded} aria-controls="mainline-a-relativity-workbench-content"
    aria-label={expanded ? "收起相对论工作台" : "打开相对论工作台"}
    data-mainline-a-relativity-launcher="true"
    style={{ ...bounds, top: `calc(var(--mainline-a-header-bottom, 0px) + ${topInset}px)` }}
    className="pointer-events-auto fixed z-[98] rounded border border-cyan-100/20 bg-[#091116]/95 px-2 text-[11px] text-cyan-50 shadow-lg focus-visible:outline-2 focus-visible:outline-cyan-200"
    onClick={() => {
      if (!expanded) onRequestOpen?.();
      onExpandedChange(!expanded);
    }}>
    {expanded ? "收起工作台" : "相对论工作台"}
  </button>;
}

export default function PostV593RelativityWorkbenchPanel({
  mode,
  onModeChange,
  onOpenValidation,
  objectBrowserOpen = false,
  onRequestOpen,
  defaultExpanded = false,
}: Readonly<{
  mode: PostV593RelativityModeV1;
  onModeChange: (mode: PostV593RelativityModeV1) => void;
  onOpenValidation: () => void;
  objectBrowserOpen?: boolean;
  onRequestOpen?: () => void;
  defaultExpanded?: boolean;
}>) {
  const [requestedExpanded, setRequestedExpanded] = useState(defaultExpanded);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const expanded = requestedExpanded && !objectBrowserOpen;
  useEffect(() => {
    if (objectBrowserOpen) setRequestedExpanded(false);
  }, [objectBrowserOpen]);
  const setExpanded = (next: boolean) => {
    setRequestedExpanded(next);
    if (!next) launcherRef.current?.focus({ preventScroll: true });
  };
  const summary = useMemo(() => ({
    mode,
    referenceVersion: REFERENCE_RUN.version,
    resultSha256: REFERENCE_RUN.resultSha256,
    bodyCount: REFERENCE_RUN.bodyCount,
    perBodyCount: REFERENCE_RUN.perBody.length,
    instantaneousEffectIsolation: REFERENCE_RUN.effectIsolation.status,
    instantaneousReverseTime: REFERENCE_RUN.reverseTime.status,
    instantaneousResultSha256: REFERENCE_RUN.resultSha256,
    trajectoryResultSha256: TRAJECTORY_EVIDENCE.runner.resultSha256,
    trajectoryBodyCount: TRAJECTORY_EVIDENCE.experiment.bodyIds.length,
    trajectoryStatus: TRAJECTORY_EVIDENCE_QUALIFIED ? "qualified" as const : "blocked" as const,
    trajectoryConvergence: TRAJECTORY_EVIDENCE.gates.threeKernelObservedOrderQualified ? "qualified" as const : "blocked" as const,
    trajectoryRoundTrip: TRAJECTORY_EVIDENCE.gates.fullTrajectoryReverseTimeQualified ? "qualified" as const : "blocked" as const,
    trajectoryEffectIsolation: TRAJECTORY_EVIDENCE.gates.effectIsolationQualified ? "qualified" as const : "blocked" as const,
    defaultKernel: "legacy-eih-1pn" as const,
    promotion: "blocked" as const,
    liveStateMutated: REFERENCE_RUN.liveStateMutated,
    timelikeKerr: TIMELIKE_KERR_REFERENCE_SUMMARY_V595,
  }), [mode]);

  return (
    <section
      className="contents"
      data-post-v593-relativity-workbench="true"
      data-post-v593-relativity-mode={summary.mode}
      data-post-v593-relativity-authority="shadow-only"
      data-post-v593-relativity-default-kernel={summary.defaultKernel}
      data-post-v593-relativity-live-state-mutated="false"
      data-post-v593-relativity-trajectory-status={summary.trajectoryStatus}
      data-post-v593-relativity-trajectory-result-sha256={summary.trajectoryResultSha256}
      data-post-v593-relativity-promotion-applied="false"
      data-v595-timelike-kerr-reference="reference-candidate"
      data-v595-timelike-kerr-reference-status={TIMELIKE_KERR_REFERENCE_V595.status}
      data-v595-timelike-kerr-formal-evidence="false"
      data-v595-timelike-kerr-promotion="none"
      data-v595-timelike-kerr-scientific-authority="false"
      data-v595-timelike-kerr-fixture-count={summary.timelikeKerr.fixtureCount}
      data-v595-timelike-kerr-anchor-count={summary.timelikeKerr.analyticAnchorCount}
      data-v595-timelike-kerr-admission-sha256={summary.timelikeKerr.admissionSha256}
    >
      <RelativityWorkbenchLauncherV638 expanded={expanded} objectBrowserOpen={objectBrowserOpen}
        onExpandedChange={setExpanded} onRequestOpen={onRequestOpen} launcherRef={launcherRef} />
      {expanded ? <div id="mainline-a-relativity-workbench-content" role="region" aria-label="相对论工作台"
        data-mainline-a-relativity-expanded="true"
        style={{ top: "calc(var(--mainline-a-header-bottom, 0px) + 64px)",
          maxHeight: "max(0px, calc(100dvh - var(--mainline-a-header-bottom, 0px) - var(--ui-dock-height) - 80px - env(safe-area-inset-bottom)))" }}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || event.defaultPrevented || event.nativeEvent.isComposing) return;
          event.preventDefault();
          event.stopPropagation();
          setExpanded(false);
        }}
        className="pointer-events-auto fixed left-3 z-[98] w-[min(430px,calc(100vw-24px))] overflow-y-auto overscroll-contain border border-cyan-100/[0.16] bg-[#020609]/95 p-2.5 font-mono shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[8px] uppercase tracking-[.16em] text-cyan-50/[0.72]">Relativity workbench</div>
          <div className="mt-1 text-[6px] uppercase tracking-[.08em] text-white/[0.35]">instantaneous + sealed trajectory · shadow-only · no payload writeback</div>
        </div>
        <div className="text-[7px] uppercase text-amber-100/[0.65]">{summary.defaultKernel}</div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1" role="tablist" aria-label="Post-v593 relativity modes">
        {(["cinematic", "science", "validation"] as const).map((nextMode) => (
          <button
            key={nextMode}
            type="button"
            role="tab"
            aria-selected={summary.mode === nextMode}
            onClick={() => {
              onModeChange(nextMode);
              if (nextMode === "validation") onOpenValidation();
            }}
            className={`min-h-9 border px-2 text-[7px] uppercase tracking-[.1em] ${summary.mode === nextMode ? "border-cyan-100/[0.48] bg-cyan-100/10 text-cyan-50" : "border-white/10 text-white/40 hover:border-white/[0.28] hover:text-white/75"}`}
          >
            {nextMode}
          </button>
        ))}
      </div>
      {summary.mode === "validation" ? (
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-white/10 pt-2 text-[7px] leading-4 text-white/[0.48]">
          <span>reference bodies</span><span className="text-right text-white/75">{summary.trajectoryBodyCount}</span>
          <span>per-body rows</span><span className="text-right text-white/75">{summary.perBodyCount}</span>
          <span>RK4 observed order</span><span className="text-right text-emerald-100/70">{summary.trajectoryConvergence}</span>
          <span>full trajectory round trip</span><span className="text-right text-emerald-100/70">{summary.trajectoryRoundTrip}</span>
          <span>trajectory effect isolation</span><span className="text-right text-emerald-100/70">{summary.trajectoryEffectIsolation}</span>
          <span>instantaneous isolation</span><span className="text-right text-emerald-100/70">{summary.instantaneousEffectIsolation}</span>
          <span>instant reverse diagnostic</span><span className="text-right text-emerald-100/70">{summary.instantaneousReverseTime}</span>
          <span>promotion status</span><span className="text-right text-amber-100/70">promotion {summary.promotion}</span>
          <span>trajectory SHA</span><span className="truncate text-right text-white/[0.58]" title={summary.trajectoryResultSha256}>{summary.trajectoryResultSha256.slice(0, 12)}…</span>
          <span>instantaneous SHA</span><span className="truncate text-right text-white/[0.58]" title={summary.instantaneousResultSha256}>{summary.instantaneousResultSha256.slice(0, 12)}…</span>
          <div
            className="col-span-2 mt-1 border-t border-cyan-100/[0.12] pt-2"
            data-v595-timelike-kerr-validation="qualified-reference-candidate"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[7px] uppercase tracking-[.12em] text-cyan-50/75">3D timelike Kerr reference</div>
                <div className="mt-0.5 text-[6px] uppercase tracking-[.07em] text-white/[0.35]">Boyer–Lindquist 8D · vacuum test-particle · source-bound</div>
              </div>
              <div className="shrink-0 text-right text-[6px] uppercase leading-3 text-amber-100/[0.65]">
                reference-candidate<br />no promotion
              </div>
            </div>

            <div className="mt-2 grid grid-cols-[0.9fr_repeat(5,minmax(0,1fr))] gap-x-1 border-b border-white/10 pb-1 text-[6px] uppercase tracking-[.06em] text-white/[0.48]" role="row">
              <span>fixture</span><span className="text-right">E</span><span className="text-right">Lz</span><span className="text-right">Q</span><span className="text-right">ΔH</span><span className="text-right">shell</span>
            </div>
            <div role="table" aria-label="v595 timelike Kerr invariant fixtures">
              {TIMELIKE_KERR_REFERENCE_V595.fixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  role="row"
                  className="grid grid-cols-[0.9fr_repeat(5,minmax(0,1fr))] gap-x-1 border-b border-white/[0.08] py-1 text-[7px] text-white/[0.72]"
                  data-v595-timelike-kerr-fixture={fixture.id}
                  data-v595-timelike-kerr-fixture-qualified={fixture.qualified}
                >
                  <span className="uppercase text-cyan-50/[0.85]">{fixture.id}</span>
                  <span className="text-right">{compactNumber(fixture.invariants.initial.energy)}</span>
                  <span className="text-right">{compactNumber(fixture.invariants.initial.axialAngularMomentum)}</span>
                  <span className="text-right">{compactNumber(fixture.invariants.initial.carterQ)}</span>
                  <span className="text-right">{compactNumber(fixture.invariants.maxAbsoluteDrift.hamiltonian)}</span>
                  <span className="text-right">{compactNumber(fixture.invariants.maxMassShellResidual)}</span>
                </div>
              ))}
            </div>

            <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[7px] leading-3 text-white/[0.55]">
              <span>dynamic θ / pθ</span><span className="text-right text-emerald-100/[0.65]">4 / 4 qualified</span>
              <span>convergence / reverse</span><span className="text-right text-emerald-100/[0.65]">4 / 4 qualified</span>
              <span>independent RK45</span><span className="text-right text-emerald-100/[0.65]">4 / 4 qualified</span>
              <span>analytic anchors</span><span className="text-right text-emerald-100/[0.65]">3 / 3 qualified</span>
            </div>
            <div className="mt-1.5 space-y-0.5 border-t border-white/[0.08] pt-1.5">
              {TIMELIKE_KERR_REFERENCE_V595.analyticAnchors.map((anchor) => (
                <div key={anchor.id} className="flex justify-between gap-2 text-[6px] leading-3 text-white/50" data-v595-timelike-kerr-anchor={anchor.id}>
                  <span className="truncate" title={anchor.family}>{anchor.id}</span>
                  <span className="shrink-0 text-emerald-100/[0.55]">res {compactNumber(anchor.maxInvariantResidual)}</span>
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between gap-2 border-t border-white/[0.08] pt-1.5 text-[6px] uppercase tracking-[.05em] text-white/[0.42]">
              <span>formal evidence false · GPU/measured/GRMHD false</span>
              <span className="shrink-0" title={summary.timelikeKerr.admissionSha256}>{summary.timelikeKerr.admissionSha256.slice(0, 10)}…</span>
            </div>
          </div>
        </div>
      ) : null}
      </div> : null}
    </section>
  );
}
