import KerrUnifiedWorkbenchV469 from "../components/KerrUnifiedWorkbenchV469";

export const dynamic = "force-dynamic";

export default function LocalShadowV469UnifiedWorkbenchPage() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";

  return (
    <main
      className="min-h-screen bg-[#020609] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v469-page
      data-atlas-local-shadow-v469-enabled={localShadow}
    >
      <div className="mx-auto max-w-7xl">
        <div className="border-l border-cyan-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-cyan-100/45">
            Orbit Atlas · Unified Kerr Observatory
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-cyan-50/90">
            Evidence Rail / V469
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            资格、SHA、生命周期和失败原因的统一只读工作台。
          </p>
        </div>

        {localShadow ? (
          <KerrUnifiedWorkbenchV469 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v469-boundary="local-shadow-only"
          >
            V469 unified workbench 仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
