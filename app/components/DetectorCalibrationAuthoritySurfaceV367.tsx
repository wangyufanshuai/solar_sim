"use client";

import { useEffect, useState } from "react";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { parseDetectorCalibrationAuthorityInspectV367, type DetectorCalibrationAuthorityInspectV367 } from "../lib/detectorCalibrationAuthorityInspectV367";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V362, resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import { createAtlasVisualTokenSignatureV300, useAtlasVisualRuntimeConsumerV300 } from "../lib/atlasVisualRuntimeConsumptionV300";

export default function DetectorCalibrationAuthoritySurfaceV367() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V362) return null;
  return <AuthorityPanelV367 />;
}

function AuthorityPanelV367() {
  const resolved = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V362);
  useAtlasVisualRuntimeConsumerV300({ profile: resolved.id, group: "hud", consumer: "DetectorCalibrationAuthoritySurfaceV367", tokenSignature: createAtlasVisualTokenSignatureV300(resolved.runtimeTokens.hud) });
  const [artifact, setArtifact] = useState<DetectorCalibrationAuthorityInspectV367 | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v367/calibration-authority", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const value = await response.json() as { available?: boolean; artifact?: unknown };
        if (response.ok && value.available === false) return null;
        if (!response.ok || value.available !== true || !value.artifact) throw new Error("v367-authority-unavailable");
        return parseDetectorCalibrationAuthorityInspectV367(value.artifact);
      })
      .then((value) => { if (!controller.signal.aborted && value) setArtifact(value); })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return <section className="mt-2 rounded-[10px] border border-fuchsia-100/15 bg-[radial-gradient(circle_at_85%_10%,rgba(124,58,237,.12),transparent_35%),linear-gradient(145deg,rgba(31,8,43,.9),rgba(7,8,13,.98))] p-3 font-mono text-[8px] text-white/55" data-atlas-detector-calibration-authority-v367 data-atlas-v367-authority-granted="false" data-atlas-v367-admission-executed="false" data-atlas-v367-automatic-promotion="false" data-atlas-v367-science-buffer-mutation="false">
    <div className="flex flex-wrap justify-between gap-2"><div><div className="text-[7px] uppercase tracking-[.2em] text-fuchsia-100/50">Measured authority admission v367</div><div className="text-[13px] text-fuchsia-50/90">身份、SHA 与独立验证的最终准入</div></div><div className="text-right text-[7px] text-fuchsia-100/60">{artifact?.status ?? "loading"}<br />{artifact?.presentInputCount ?? 0} / 7 inputs</div></div>
    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4"><Metric label="compiler" value="v365 locked" /><Metric label="validator" value="v366 independent" /><Metric label="admission" value="explicit only" /><Metric label="authority" value="UNAVAILABLE" alert /></div>
    {artifact ? <><div className="mt-2 flex flex-wrap gap-1">{artifact.expectedInputs.map((input) => <span key={input} className={`rounded border px-2 py-1 ${artifact.missingInputs.includes(input) ? "border-fuchsia-100/10 text-fuchsia-100/55" : "border-emerald-100/10 text-emerald-100/55"}`}>{input} · {artifact.missingInputs.includes(input) ? "missing" : "present"}</span>)}</div><div className="mt-2 rounded border border-white/[.08] px-2 py-1.5 text-[7px] leading-3 text-white/38">只有七项实测输入、manifest canonical SHA、仪器身份、独立数值验证全部一致时，才可授予 local-shadow detector authority。测试 fixture、缺失数据或 SHA 漂移均 fail closed；不会修改科学 buffer、电影 buffer 或正式产品。</div></> : null}
  </section>;
}

function Metric({ label, value, alert = false }: Readonly<{ label: string; value: string; alert?: boolean }>) {
  return <div className="rounded border border-white/[.08] bg-black/20 px-2 py-2"><div className="text-[7px] uppercase text-white/30">{label}</div><div className={`mt-1 text-[10px] ${alert ? "text-amber-100/80" : "text-fuchsia-50/78"}`}>{value}</div></div>;
}
