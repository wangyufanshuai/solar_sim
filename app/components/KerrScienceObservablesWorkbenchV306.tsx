"use client";

import { useEffect, useMemo, useState } from "react";
import {
  parseKerrScienceObservablesViewV306,
  type KerrScienceObservablesViewV306,
} from "../lib/kerrScienceObservablesV306";

const ARTIFACT_URL = "/api/atlas/relativity-evidence/artifacts/v315-science-observables";
const MAX_RESPONSE_BYTES = 32 * 1024;

const formatObservable = (value: number | null, digits = 6) => value === null ? "不适用" : value.toFixed(digits);
const formatResidual = (value: number | null) => value === null ? "不适用" : value.toExponential(2);

export default function KerrScienceObservablesWorkbenchV306({ spinA }: { readonly spinA: number }) {
  const [view, setView] = useState<KerrScienceObservablesViewV306 | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [selectedRayId, setSelectedRayId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(ARTIFACT_URL, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("science-observables-unavailable");
        const text = await response.text();
        if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error("science-observables-size-boundary");
        return parseKerrScienceObservablesViewV306(JSON.parse(text));
      })
      .then((validated) => {
        setView(validated);
        setStatus("ready");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setView(null);
        setStatus("unavailable");
      });
    return () => controller.abort();
  }, []);

  const selected = useMemo(() => {
    if (!view) return null;
    return view.records.find((record) => record.rayId === selectedRayId)
      ?? view.records.reduce((nearest, record) => Math.abs(record.spinA - spinA) < Math.abs(nearest.spinA - spinA) ? record : nearest);
  }, [selectedRayId, spinA, view]);

  if (!view || !selected) {
    return (
      <div className="mt-2 rounded border border-cyan-100/10 bg-black/15 px-3 py-2 text-[10px] text-white/45" data-atlas-science-observables-v306={status}>
        {status === "loading" ? "正在读取 16 条权威射线的科学观测量…" : "科学观测量不可用；不会使用电影渲染结果回填。"}
      </div>
    );
  }

  return (
    <section
      className="mt-2 overflow-hidden rounded border border-cyan-100/12 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.06),transparent_40%),rgba(0,0,0,0.14)] p-2.5"
      data-atlas-science-observables-v306="ready"
      data-atlas-science-observables-authority={view.authority.kind}
      data-atlas-science-observables-geometry-sha={view.authority.geometryEvidenceSha256}
      data-atlas-science-observables-polarization-sha={view.authority.polarizationEvidenceSha256}
      data-atlas-science-observables-ray-plan-sha={view.authority.rayPlanSha256}
      data-atlas-science-observables-dense-boundary={view.boundary}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-medium tracking-[0.08em] text-cyan-50/80">Corrected sparse authority · 16 canonical rays</div>
          <p className="mt-0.5 text-[9px] text-white/42">CPU v312 几何与 v313 偏振的只读视图；缺失量显示“不适用”，绝不写成零。</p>
        </div>
        <div className="flex flex-wrap gap-1 font-mono text-[8px]">
          <span className="rounded border border-slate-100/10 px-1.5 py-0.5 text-slate-100/65">capture {view.counts.capture}</span>
          <span className="rounded border border-sky-100/10 px-1.5 py-0.5 text-sky-100/65">escape {view.counts.escape}</span>
          <span className="rounded border border-amber-100/10 px-1.5 py-0.5 text-amber-100/70">disk {view.counts.diskHit}</span>
        </div>
      </div>

      <div className="mt-2 flex max-h-24 flex-wrap gap-1 overflow-y-auto" role="tablist" aria-label="Canonical science ray selection">
        {view.records.map((record) => (
          <button
            key={record.rayId}
            type="button"
            role="tab"
            aria-selected={selected.rayId === record.rayId}
            onClick={() => setSelectedRayId(record.rayId)}
            className={selected.rayId === record.rayId
              ? "atlas-accessible-focus rounded border border-cyan-100/25 bg-cyan-100/[0.1] px-2 py-1 font-mono text-[8px] text-cyan-50"
              : "atlas-accessible-focus rounded border border-white/8 px-2 py-1 font-mono text-[8px] text-white/42"}
          >
            {record.rayId} · a {record.spinA.toFixed(3)}
          </button>
        ))}
      </div>

      <div className="mt-2 grid gap-2 lg:grid-cols-3">
        <div className="rounded border border-white/8 bg-black/15 p-2">
          <div className="text-[9px] uppercase tracking-[0.1em] text-white/45">Ray / event</div>
          <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 font-mono text-[8px] text-white/50">
            <dt>classification</dt><dd className="text-cyan-50/75">{selected.classification}</dd>
            <dt>α / β</dt><dd>{selected.alphaM.toFixed(4)} / {selected.betaM.toFixed(4)} M</dd>
            <dt>emission radius</dt><dd>{formatObservable(selected.emissionRadiusM)} M</dd>
            <dt>image order</dt><dd>{formatObservable(selected.imageOrder, 0)}</dd>
          </dl>
        </div>
        <div className="rounded border border-white/8 bg-black/15 p-2">
          <div className="text-[9px] uppercase tracking-[0.1em] text-white/45">Measured observables</div>
          <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 font-mono text-[8px] text-white/50">
            <dt>redshift g</dt><dd>{formatObservable(selected.redshiftFactor)}</dd>
            <dt>intensity</dt><dd>{selected.intensity === null ? "不适用" : selected.intensity.toExponential(4)}</dd>
            <dt>EVPA · WP / PT</dt><dd>{formatObservable(selected.walkerPenroseEvpaDeg, 4)}° / {formatObservable(selected.parallelTransportEvpaDeg, 4)}°</dd>
            <dt>ΔEVPA</dt><dd>{formatResidual(selected.evpaDifferenceDeg)}°</dd>
          </dl>
        </div>
        <div className="rounded border border-white/8 bg-black/15 p-2">
          <div className="text-[9px] uppercase tracking-[0.1em] text-white/45">Componentwise error budget</div>
          <dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 font-mono text-[8px] text-white/50">
            <dt>Carter H / Q</dt><dd>{formatResidual(selected.geometryBudget.carterMassShellResidual)} / {formatResidual(selected.geometryBudget.carterConstantResidual)}</dd>
            <dt>KS H / ∂g audit</dt><dd>{formatResidual(selected.geometryBudget.kerrSchildMassShellResidual)} / {formatResidual(selected.geometryBudget.metricDerivativeAuditResidual)}</dd>
            <dt>disk Δr / Δg</dt><dd>{formatResidual(selected.geometryBudget.diskRadiusDifferenceM)} / {formatResidual(selected.geometryBudget.redshiftDifference)}</dd>
            <dt>WP drift / endpoint</dt><dd>{formatResidual(selected.polarizationBudget.walkerPenroseInvariantDrift)} / {formatResidual(selected.polarizationBudget.endpointResidual)}</dd>
          </dl>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[8px] text-white/40">
        <span>componentwise only · no RSS · no scalar total · dense aggregate unavailable</span>
        <a href={ARTIFACT_URL} target="_blank" rel="noreferrer" className="atlas-accessible-focus text-cyan-100/65 underline decoration-cyan-100/20 underline-offset-2">查看 bounded observables JSON</a>
      </div>
    </section>
  );
}
