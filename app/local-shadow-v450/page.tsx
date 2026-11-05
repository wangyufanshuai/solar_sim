import KerrDetectorExpectedImageFormationV450 from "../components/KerrDetectorExpectedImageFormationV450";

export const dynamic = "force-dynamic";

export default function LocalShadowV450ExpectedImagePage() {
  const localShadow =
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#02070a] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v450-page
      data-atlas-local-shadow-v450-enabled={localShadow}
    >
      <div className="mx-auto max-w-7xl">
        <div className="border-l border-cyan-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-cyan-100/45">
            Orbit Atlas · local-shadow research instrument
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.06em] text-cyan-50/90">
            Expected-electron image formation / V450
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            从有限距离 Kerr WCS 坐标到稀疏像素沉积的可审计桥梁；科学 raster、实测探测器投影与观测图像继续保持关闭。
          </p>
        </div>
        {localShadow ? (
          <KerrDetectorExpectedImageFormationV450 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v450-boundary="local-shadow-only"
          >
            此科研表面仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
