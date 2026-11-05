import KerrSpectralLandmarkViewerV481 from "../components/KerrSpectralLandmarkViewerV481";

export const dynamic = "force-dynamic";

export default function LocalShadowV481Page() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#020405] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v481-page
      data-atlas-local-shadow-v481-enabled={localShadow}
    >
      <div className="mx-auto max-w-[1480px]">
        <div className="border-l border-cyan-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-cyan-100/45">
            Orbit Atlas · Photon Measurement / Position Authority
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-cyan-50/90">
            Spectral Landmark Transport / V481
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            传播无量纲谱特征坐标及其误差区间，同时明确拒绝把未知线身份、bandpass
            或强度包装成观测光谱。
          </p>
        </div>
        {localShadow ? (
          <KerrSpectralLandmarkViewerV481 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v481-boundary="local-shadow-only"
          >
            V481 spectral landmark viewer 仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
