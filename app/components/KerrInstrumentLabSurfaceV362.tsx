"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V362,
  resolveAtlasVisualProfileV299,
  sampleAtlasCinematicDetailV299,
} from "../lib/atlasVisualProfileV299";
import { createAtlasVisualTokenSignatureV300, useAtlasVisualRuntimeConsumerV300 } from "../lib/atlasVisualRuntimeConsumptionV300";
import { parseKerrInstrumentLabSnapshotV362, type KerrInstrumentLabSnapshotV362 } from "../lib/kerrInstrumentLabV362";

type LoadState = "loading" | "ready" | "unavailable" | "error";

export default function KerrInstrumentLabSurfaceV362() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V362) return null;
  return <InstrumentLabPanelV362 />;
}

function InstrumentLabPanelV362() {
  const resolved = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V362);
  const tokens = resolved.runtimeTokens.hud.instrumentLabV9;
  if (!tokens) throw new Error("v362-instrument-lab-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: resolved.id,
    group: "hud",
    consumer: "KerrInstrumentLabSurfaceV362",
    tokenSignature: createAtlasVisualTokenSignatureV300(resolved.runtimeTokens.hud),
  });
  const [snapshot, setSnapshot] = useState<KerrInstrumentLabSnapshotV362 | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v362/instrument-lab", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const value = await response.json() as { available?: boolean; reason?: string; snapshot?: unknown };
        if (response.ok && value.available === false) return null;
        if (!response.ok || value.available !== true || !value.snapshot) throw new Error("v362-instrument-lab-unavailable");
        return parseKerrInstrumentLabSnapshotV362(value.snapshot);
      })
      .then((value) => {
        if (controller.signal.aborted) return;
        if (!value) {
          setState("unavailable");
          return;
        }
        setSnapshot(value);
        setState("ready");
      })
      .catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, []);
  const traceBars = useMemo(() => Object.freeze(Array.from({ length: 9 }, (_, index) => ({
    left: `${4 + index * 11.5}%`,
    opacity: tokens.provenanceStripeOpacity * (0.35 + sampleAtlasCinematicDetailV299(tokens.detailSeed, index, 0) * 0.65),
  }))), [tokens.detailSeed, tokens.provenanceStripeOpacity]);
  const style = {
    "--atlas-v362-panel-opacity": tokens.panelOpacity,
    "--atlas-v362-grid-opacity": tokens.uncertaintyGridOpacity,
    "--atlas-v362-eigenmode-accent": tokens.eigenmodeAccent,
    "--atlas-v362-calibration-alert": tokens.calibrationAlertOpacity,
  } as CSSProperties;
  return (
    <aside
      style={style}
      className="relative mt-2 overflow-hidden rounded-[10px] border border-emerald-100/15 bg-[linear-gradient(145deg,rgba(3,26,29,var(--atlas-v362-panel-opacity)),rgba(5,8,15,.97))] p-3 font-mono text-[8px] text-white/55"
      data-atlas-instrument-lab-v362
      data-atlas-instrument-lab-status={state}
      data-atlas-instrument-lab-profile={resolved.id}
      data-atlas-instrument-lab-provenance-digest={snapshot?.provenanceDigest ?? "unavailable"}
      data-atlas-instrument-lab-science-buffer-mutation="false"
      data-atlas-instrument-lab-cinematic-color-input="false"
      data-atlas-instrument-lab-local-shadow-manual-only="true"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v362-grid-opacity)] [background-image:linear-gradient(rgba(167,243,208,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.1)_1px,transparent_1px)] [background-size:28px_28px]">
        {traceBars.map((bar, index) => <i key={index} className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-emerald-200/45 to-transparent" style={bar} />)}
      </div>
      <div className="relative flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[7px] uppercase tracking-[.22em] text-emerald-100/52">V9 Instrument Lab · Shadow</div>
          <div className="mt-0.5 text-[13px] text-emerald-50/92">不确定性、光子计数与实测校准边界</div>
        </div>
        <div className="text-right text-[7px] text-emerald-100/62">{state}<br />digest {snapshot?.provenanceDigest ?? "--------"}</div>
      </div>
      {snapshot ? <>
        <div className="relative mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          <Metric label="synthetic chain" value={`${snapshot.syntheticQualifiedCount}/5`} tone="emerald" />
          <Metric label="measured authority" value={`${snapshot.measuredQualifiedCount}/1`} tone="amber" />
          <Metric label="missing inputs" value={String(snapshot.measuredCalibration.missingRequirementCount)} tone="amber" />
          <Metric label="dense" value="0 / 49" tone="slate" />
        </div>
        <details className="relative mt-2 rounded border border-white/[.08] bg-black/20 px-2 py-1.5">
          <summary className="atlas-accessible-focus cursor-pointer text-[8px] text-emerald-50/75">查看 6 阶段 SHA 锁定来源</summary>
          <div className="mt-1.5 grid gap-1 sm:grid-cols-2">
            {snapshot.stages.map((stage) => <div key={stage.version} className="rounded border border-white/[.06] px-2 py-1 text-[7px] text-white/42">
              <span className={stage.authority === "measured-blocked" ? "text-amber-100/75" : "text-emerald-100/70"}>{stage.version} · {stage.label}</span>
              <div className="mt-0.5 truncate font-mono">{stage.artifactSha256}</div>
            </div>)}
          </div>
        </details>
        <div className="relative mt-2 rounded border border-amber-100/10 bg-amber-100/[.025] px-2 py-1.5 text-[7px] text-white/38">
          合成仪器链已验证；实测探测器校准仍阻塞。该 HUD 只读 provenance，不读取或修改 classification、redshift、EVPA、intensity 或 covariance buffer。
        </div>
      </> : <div className="relative mt-2 rounded border border-white/[.08] px-2 py-1.5 text-[8px] text-white/42">{state === "loading" ? "正在读取有界 Instrument Lab 摘要…" : state === "unavailable" ? "仅 local-shadow Research intent 可用。" : "Instrument Lab evidence 损坏或不可用；已 fail closed。"}</div>}
    </aside>
  );
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "emerald" | "amber" | "slate" }>) {
  const color = tone === "emerald" ? "text-emerald-50/88" : tone === "amber" ? "text-amber-100/80" : "text-slate-100/70";
  return <div className="rounded border border-white/[.08] bg-black/20 px-2 py-2"><div className="text-[7px] uppercase text-white/30">{label}</div><div className={`mt-1 text-[11px] ${color}`}>{value}</div></div>;
}
