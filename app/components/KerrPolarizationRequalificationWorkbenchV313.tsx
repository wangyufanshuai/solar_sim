"use client";

import { useEffect, useState } from "react";
import { parseKerrPolarizationRequalificationViewV313, type KerrPolarizationRequalificationViewV313 } from "../lib/kerrAuthorityV313";

const URL = "/api/atlas/relativity-evidence/artifacts/v313-polarization-requalification";
export default function KerrPolarizationRequalificationWorkbenchV313() {
  const [view, setView] = useState<KerrPolarizationRequalificationViewV313 | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  useEffect(() => {
    const controller = new AbortController();
    void fetch(URL, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("v313-unavailable");
      const text = await response.text();
      if (new TextEncoder().encode(text).byteLength > 32 * 1024) throw new Error("v313-size-boundary");
      return parseKerrPolarizationRequalificationViewV313(JSON.parse(text));
    }).then((next) => { setView(next); setStatus("ready"); }).catch((error: unknown) => { if ((error as { name?: string }).name !== "AbortError") setStatus("unavailable"); });
    return () => controller.abort();
  }, []);
  if (!view) return <div className="mt-2 rounded border border-violet-100/10 px-3 py-2 text-[10px] text-white/45" data-atlas-kerr-v313={status}>{status === "loading" ? "正在读取 v313 偏振重资格…" : "v313 polarization unavailable"}</div>;
  return <section className="mt-2 rounded border border-violet-100/12 bg-violet-100/[0.035] px-3 py-2 text-[10px] text-white/52" data-atlas-kerr-v313="full-kerr-short-authority-qualified" data-atlas-kerr-v313-sha={view.authoritySha256}>
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-violet-50/78">v313 WP / KS 偏振重资格</span><span className="font-mono text-emerald-100/65">{view.counts.applicableExecutionCount}/16 applicable</span></div>
    <div className="mt-1 grid grid-cols-2 gap-1 sm:grid-cols-4"><div>release ΔEVPA<div className="font-mono text-white/72">{view.maxima.releaseEvpaDifferenceDeg.toExponential(2)}°</div></div><div>internal ΔEVPA<div className="font-mono text-white/72">{view.maxima.internalEvpaDifferenceDeg.toExponential(2)}°</div></div><div>KS disk Δr<div className="font-mono text-white/72">{view.maxima.ksDiskRadiusDifferenceM.toExponential(2)} M</div></div><div>peak RSS<div className="font-mono text-white/72">{view.resource.peakRssGiB.toFixed(3)} GiB</div></div></div>
    <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[9px] text-white/38"><span>v312 geometry + v313 polarization · dense transfer map 尚未创建</span><a href={URL} target="_blank" rel="noreferrer" className="atlas-accessible-focus underline decoration-violet-100/20 underline-offset-2">查看有界证据</a></div>
  </section>;
}
