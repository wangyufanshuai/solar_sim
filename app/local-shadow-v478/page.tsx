import KerrNormalizedFrequencyChartV478 from "../components/KerrNormalizedFrequencyChartV478";

export const dynamic = "force-dynamic";

export default function LocalShadowV478Page() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main className="min-h-screen bg-[#030306] px-4 py-8 text-white sm:px-8" data-atlas-local-shadow-v478-page data-atlas-local-shadow-v478-enabled={localShadow}>
      <div className="mx-auto max-w-[1450px]">
        <div className="border-l border-cyan-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-cyan-100/45">Orbit Atlas · Spectral Coordinate Laboratory</div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-cyan-50/90">Normalized Frequency / V478</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">四条 disk ray 的无量纲频率坐标、逆变换、单调性与不确定度；真实谱带继续等待合法仪器数据。</p>
        </div>
        {localShadow ? <KerrNormalizedFrequencyChartV478 /> : (
          <div className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55" data-atlas-local-shadow-v478-boundary="local-shadow-only">
            V478 normalized frequency chart 仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
