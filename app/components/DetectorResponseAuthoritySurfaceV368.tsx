"use client";

import { useEffect, useState } from "react";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { parseDetectorResponseAuthoritySnapshotV368, type DetectorResponseAuthoritySnapshotV368 } from "../lib/detectorResponseAuthorityV368";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V362, resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import { createAtlasVisualTokenSignatureV300, useAtlasVisualRuntimeConsumerV300 } from "../lib/atlasVisualRuntimeConsumptionV300";

export default function DetectorResponseAuthoritySurfaceV368() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V362) return null;
  return <DetectorResponsePanelV368 />;
}

function DetectorResponsePanelV368() {
  const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V362);
  useAtlasVisualRuntimeConsumerV300({ profile: profile.id, group: "hud", consumer: "DetectorResponseAuthoritySurfaceV368", tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud) });
  const [snapshot, setSnapshot] = useState<DetectorResponseAuthoritySnapshotV368 | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable" | "error">("loading");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v368/detector-response", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const value = await response.json() as { available?: boolean; snapshot?: unknown };
        if (response.ok && value.available === false) return null;
        if (!response.ok || value.available !== true || !value.snapshot) throw new Error("v368-detector-response-unavailable");
        return parseDetectorResponseAuthoritySnapshotV368(value.snapshot);
      })
      .then((value) => {
        if (controller.signal.aborted) return;
        if (!value) { setState("unavailable"); return; }
        setSnapshot(value); setState("ready");
      })
      .catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, []);
  return <section className="mt-2 rounded-[10px] border border-cyan-100/15 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,.11),transparent_38%),linear-gradient(145deg,rgba(3,24,34,.92),rgba(6,8,14,.98))] p-3 font-mono text-[8px] text-white/55" data-atlas-detector-response-authority-v368 data-atlas-v368-authority-granted={String(snapshot?.authorityGranted ?? false)} data-atlas-v368-measured-response={String(snapshot?.measuredResponseAvailable ?? false)} data-atlas-v368-synthetic-fallback="false" data-atlas-v368-science-buffer-mutation="false" data-atlas-v368-cinematic-consumer="false">
    <div className="flex flex-wrap items-end justify-between gap-2"><div><div className="text-[7px] uppercase tracking-[.2em] text-cyan-100/50">Authority-gated detector response v368</div><div className="text-[13px] text-cyan-50/90">实测响应与合成仪器的不可混用边界</div></div><div className="text-right text-[7px] text-cyan-100/60">{state}<br />{snapshot?.status ?? "loading"}</div></div>
    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4"><Metric label="authority" value={snapshot?.authorityGranted ? "QUALIFIED" : "UNAVAILABLE"} alert={!snapshot?.authorityGranted} /><Metric label="measured bands" value={`${snapshot?.bandResponseCount ?? 0} / 3`} /><Metric label="v332 fallback" value="PROHIBITED" /><Metric label="dense" value="0 / 49" /></div>
    <div className="mt-2 rounded border border-white/[.08] px-2 py-1.5 text-[7px] leading-3 text-white/38">只有 v367 qualified admission 与同一 manifest 的 file SHA、canonical SHA 全部吻合，适配器才返回 throughput、gain、read noise、dark current 和 background。v332 仍是独立 synthetic audit fixture，永远不会被当作实测回退。</div>
  </section>;
}

function Metric({ label, value, alert = false }: Readonly<{ label: string; value: string; alert?: boolean }>) {
  return <div className="rounded border border-white/[.08] bg-black/20 px-2 py-2"><div className="text-[7px] uppercase text-white/30">{label}</div><div className={`mt-1 text-[10px] ${alert ? "text-amber-100/80" : "text-cyan-50/78"}`}>{value}</div></div>;
}
