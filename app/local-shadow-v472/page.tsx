import ScienceCinematicV8ObservableStageV472 from "../components/ScienceCinematicV8ObservableStageV472";

export const dynamic = "force-dynamic";

export default function LocalShadowV472Page() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#020506] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v472-page
      data-atlas-local-shadow-v472-enabled={localShadow}
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="border-l border-cyan-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-cyan-100/45">
            Orbit Atlas · Science Cinematic V8
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-cyan-50/90">
            Observable Light / V472
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            V471 不可变观测量之上的双通道展示层；电影效果不接触科学字段。
          </p>
        </div>
        {localShadow ? (
          <ScienceCinematicV8ObservableStageV472 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v472-boundary="local-shadow-only"
          >
            Science Cinematic V8 仅在 local-shadow 手动入口中可用。
          </div>
        )}
      </div>
    </main>
  );
}
