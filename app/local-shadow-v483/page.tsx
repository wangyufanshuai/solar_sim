import KerrSpectralSensitivityViewerV483 from "../components/KerrSpectralSensitivityViewerV483";

export const dynamic = "force-dynamic";

export default function LocalShadowV483Page() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#020403] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v483-page
      data-atlas-local-shadow-v483-enabled={localShadow}
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="border-l border-lime-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-lime-100/45">
            Orbit Atlas · Linear Modes / Sensitivity Authority
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-lime-50/90">
            Spectral Sensitivity Modes / V483
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            分离共同红移尺度的唯一敏感方向与四个模型 nullspace，并把“模型零响应”和“测量无误差”严格区分。
          </p>
        </div>
        {localShadow ? (
          <KerrSpectralSensitivityViewerV483 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v483-boundary="local-shadow-only"
          >
            V483 sensitivity viewer 仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
