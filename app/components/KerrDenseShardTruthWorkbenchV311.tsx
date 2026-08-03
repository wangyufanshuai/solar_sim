"use client";

import { useEffect, useState } from "react";
import {
  parseKerrDenseShardTruthAuditV311,
  type KerrDenseShardTruthAuditV311,
} from "../lib/kerrDenseShardTruthV311";

const ARTIFACT_URL = "/api/atlas/relativity-evidence/artifacts/v311-shard0-truth-audit";
const MAX_RESPONSE_BYTES = 32 * 1024;

export default function KerrDenseShardTruthWorkbenchV311() {
  const [audit, setAudit] = useState<KerrDenseShardTruthAuditV311 | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(ARTIFACT_URL, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("v311-truth-audit-unavailable");
        const text = await response.text();
        if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error("v311-truth-audit-size-boundary");
        return parseKerrDenseShardTruthAuditV311(JSON.parse(text));
      })
      .then((validated) => {
        setAudit(validated);
        setStatus("ready");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setAudit(null);
        setStatus("unavailable");
      });
    return () => controller.abort();
  }, []);

  if (!audit) {
    return (
      <div className="mt-2 rounded border border-amber-100/12 bg-amber-100/[0.035] px-3 py-2 text-[10px] text-amber-50/55" data-atlas-dense-truth-v311={status}>
        {status === "loading" ? "正在读取 shard 0 科研真实性审计…" : "shard 0 科研真实性审计不可用；dense convergence 保持 unavailable。"}
      </div>
    );
  }

  const ladder = audit.toleranceLadder;
  return (
    <section
      className="mt-2 rounded border border-amber-200/18 bg-[linear-gradient(135deg,rgba(245,158,11,0.07),rgba(0,0,0,0.16))] p-2.5"
      data-atlas-dense-truth-v311="failed-tolerance-ladder-degenerate"
      data-atlas-dense-truth-sha-v311={audit.truthAuditSha256}
      data-atlas-dense-tolerance-qualified-v311="false"
      data-atlas-dense-campaign-state-mutated-v311="false"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-medium tracking-[0.08em] text-amber-50/85">Dense shard 0 · tolerance convergence withdrawn</div>
          <p className="mt-0.5 max-w-3xl text-[9px] leading-4 text-white/45">64 rays 与 512 executions 结构完整、跨射线数值非退化，但 release/internal 使用相同有效 solver tolerance，不能作为双容差收敛证据。</p>
        </div>
        <span className="rounded border border-red-200/20 bg-red-200/[0.06] px-2 py-1 font-mono text-[8px] text-red-100/75">quarantined · no aggregate</span>
      </div>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-white/8 bg-black/15 px-2 py-1.5 text-[9px] text-white/48">Structural<div className="mt-0.5 font-mono text-cyan-50/70">64 rays · 512 exec · qualified</div></div>
        <div className="rounded border border-white/8 bg-black/15 px-2 py-1.5 text-[9px] text-white/48">Strict solver ladder<div className="mt-0.5 font-mono text-red-100/75">{ladder.strictSolverLadderPairCount}/{ladder.expectedPairCount}</div></div>
        <div className="rounded border border-white/8 bg-black/15 px-2 py-1.5 text-[9px] text-white/48">Effective tolerance<div className="mt-0.5 font-mono text-amber-100/75">release = internal = 2.3e-14</div></div>
        <div className="rounded border border-white/8 bg-black/15 px-2 py-1.5 text-[9px] text-white/48">Geometry distinct pairs<div className="mt-0.5 font-mono text-red-100/75">{ladder.geometryDistinctPairCount}/{ladder.expectedPairCount}</div></div>
      </div>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
        <div className="rounded border border-white/8 px-2 py-1 text-[8px] text-white/42">Cross-ray diversity<div className="mt-0.5 font-mono">spins {audit.crossRayNonDegeneracy.uniqueSpinCount} · events {audit.crossRayNonDegeneracy.uniqueSelectedEventParameterCount} · fingerprints {audit.crossRayNonDegeneracy.uniqueGeometryFingerprintCount}</div></div>
        <div className="rounded border border-white/8 px-2 py-1 text-[8px] text-white/42">Observable diversity<div className="mt-0.5 font-mono">redshift {audit.crossRayNonDegeneracy.uniqueRedshiftCount} · WP EVPA {audit.crossRayNonDegeneracy.uniqueWalkerPenroseEvpaCount}</div></div>
        <div className="rounded border border-white/8 px-2 py-1 text-[8px] text-white/42">Immutable state<div className="mt-0.5 font-mono">1/49 · next 1 not attempted · no retry</div></div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[8px] text-white/38">
        <span>需要 corrected authority + 新 campaign namespace；不得续写 v298r1。</span>
        <a href={ARTIFACT_URL} target="_blank" rel="noreferrer" className="atlas-accessible-focus text-amber-100/70 underline decoration-amber-100/20 underline-offset-2">查看 v311 negative truth evidence</a>
      </div>
    </section>
  );
}
