import KerrDualRenderBoundaryV475 from "../components/KerrDualRenderBoundaryV475";

export const dynamic = "force-dynamic";

export default function LocalShadowV475Page() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#020506] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v475-page
      data-atlas-local-shadow-v475-enabled={localShadow}
    >
      <div className="mx-auto max-w-[1450px]">
        <div className="border-l border-cyan-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-cyan-100/45">
            Orbit Atlas · Science / Cinematic Isolation Lab
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-cyan-50/90">
            Dual Render Boundary / V475
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            四条真实 disk ray 只形成一份不可变科学缓冲区；两种视觉模式只读取它，并在独立展示层分流。
          </p>
        </div>
        {localShadow ? (
          <KerrDualRenderBoundaryV475 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v475-boundary="local-shadow-only"
          >
            V475 双渲染边界仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
