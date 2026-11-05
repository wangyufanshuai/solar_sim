"use client";

import { useEffect, useState } from "react";
import {
  parseKerrLayeredErrorBudgetViewV303,
  type KerrLayeredErrorBudgetViewV303,
} from "../lib/kerrErrorBudgetV303";

const ARTIFACT_URL = "/api/atlas/relativity-evidence/artifacts/v303-error-budget";
const MAX_RESPONSE_BYTES = 32 * 1024;

const label: Record<string, string> = {
  massShellNormalized: "Null mass shell",
  carterFirstIntegralNormalized: "Carter first integral",
  metricDerivativeAudit: "KS metric derivative",
  metricPullback: "BL ↔ KS metric pullback",
  covectorRoundtrip: "Covector round-trip",
  tetrad: "Observer tetrad",
  redshiftFormulaDifference: "Carter ↔ KS redshift",
  intensityInvariant: "Iν / ν³ invariant",
  releaseEvpaDifference: "Release ΔEVPA",
  internalEvpaDifference: "Internal ΔEVPA",
  releasePolarizationResidual: "Release polarization",
  internalPolarizationResidual: "Internal polarization",
};

const utilizationWidth = (observed: number, threshold: number) => `${Math.max(1, Math.min(100, observed / threshold * 100))}%`;

export default function KerrErrorBudgetWorkbenchV303() {
  const [view, setView] = useState<KerrLayeredErrorBudgetViewV303 | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(ARTIFACT_URL, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("error-budget-unavailable");
        const text = await response.text();
        if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error("error-budget-response-size-boundary");
        return parseKerrLayeredErrorBudgetViewV303(JSON.parse(text));
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

  if (!view) {
    return <div className="mt-2 rounded border border-cyan-100/10 bg-black/15 px-3 py-2 text-[10px] text-white/45" data-atlas-error-budget-v303={status}>{status === "loading" ? "正在重组分层误差预算…" : "误差预算不可用；科研资格保持 unavailable。"}</div>;
  }

  return (
    <section
      className="mt-2 rounded border border-cyan-100/12 bg-black/10 p-2.5"
      data-atlas-error-budget-v303="ready"
      data-atlas-error-budget-geometry-sha={view.authority.geometryEvidenceSha256}
      data-atlas-error-budget-shard-audit-sha={view.authority.shard0AuditSha256}
      data-atlas-error-budget-dense-status={view.dense.status}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-medium tracking-[0.08em] text-cyan-50/80">Layered Kerr error budget</div>
          <p className="mt-0.5 text-[9px] text-white/42">完整 short authority 与 shard-only dense evidence 分层展示。</p>
        </div>
        <div className="flex gap-1 text-[8px]">
          <span className="rounded border border-emerald-200/15 bg-emerald-200/[0.05] px-2 py-1 text-emerald-100/65">sparse · qualified</span>
          <span className="rounded border border-amber-200/15 bg-amber-200/[0.05] px-2 py-1 text-amber-100/65">dense · 1/49 incomplete</span>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-[minmax(110px,1fr)_minmax(120px,1.2fr)_minmax(120px,1.2fr)] gap-x-2 gap-y-1.5 text-[8px]">
        <div className="text-white/35">component</div><div className="text-cyan-100/45">v296/v297 complete</div><div className="text-amber-100/45">v298r1 shard 0 only</div>
        {view.sparse.components.map((sparse, index) => {
          const dense = view.dense.components[index];
          return (
            <div key={sparse.id} className="contents">
              <div className="truncate text-white/55" title={label[sparse.id]}>{label[sparse.id]}</div>
              <div>
                <div className="flex justify-between gap-1 font-mono text-white/45"><span>{sparse.observed.toExponential(2)}</span><span>/ {sparse.threshold.toExponential(1)} {sparse.unit === "deg" ? "deg" : ""}</span></div>
                <div className="mt-0.5 h-1 overflow-hidden rounded bg-white/5"><div className="h-full rounded bg-cyan-300/60" style={{ width: utilizationWidth(sparse.observed, sparse.threshold) }} /></div>
              </div>
              <div>
                <div className="flex justify-between gap-1 font-mono text-white/45"><span>{dense.observed.toExponential(2)}</span><span>/ {dense.threshold.toExponential(1)} {dense.unit === "deg" ? "deg" : ""}</span></div>
                <div className="mt-0.5 h-1 overflow-hidden rounded bg-white/5"><div className="h-full rounded bg-amber-300/60" style={{ width: utilizationWidth(dense.observed, dense.threshold) }} /></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 rounded border border-amber-200/10 bg-amber-200/[0.025] px-2 py-1.5 text-[8px] leading-4 text-amber-100/52">
        独立性未建立：禁止 RSS、禁止跨维度相加、禁止输出单一“总误差”。Shard 0 未执行统计门禁，`aggregateEligible=false`。
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[8px] text-white/35">
        {Object.entries(view.unreportedComponents).map(([key, reason]) => <span key={key}><span className="font-mono text-white/50">{key}</span> · {reason}</span>)}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[9px] text-white/40">
        <span>max utilization · sparse {(view.maxima.sparseThresholdUtilization * 100).toFixed(2)}% · shard {(view.maxima.denseShardThresholdUtilization * 100).toFixed(2)}%</span>
        <a href={ARTIFACT_URL} target="_blank" rel="noreferrer" className="atlas-accessible-focus text-cyan-100/65 underline decoration-cyan-100/20 underline-offset-2">查看 layered budget JSON</a>
      </div>
    </section>
  );
}
