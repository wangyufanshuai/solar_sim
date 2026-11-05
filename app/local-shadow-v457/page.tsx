import ScienceProductQualificationConsoleV457 from "../components/ScienceProductQualificationConsoleV457";

export const dynamic = "force-dynamic";

export default function LocalShadowV457ScienceProductPage() {
  const localShadow =
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#020609] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v457-page
      data-atlas-local-shadow-v457-enabled={localShadow}
    >
      <div className="mx-auto max-w-7xl">
        <div className="border-l border-cyan-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-cyan-100/45">
            Orbit Atlas · Science Cinematic V7
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-cyan-50/90">
            Science Product Qualification Console / V457
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            逐项展示科研产品从结构证据到像素 authority、dense aggregate 与重型运行资格的真实状态。
          </p>
        </div>
        {localShadow ? (
          <ScienceProductQualificationConsoleV457 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v457-boundary="local-shadow-only"
          >
            Science Cinematic V7 资格控制台仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
