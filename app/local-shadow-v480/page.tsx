import KerrPhotonEvidenceWorkbenchV480 from "../components/KerrPhotonEvidenceWorkbenchV480";

export const dynamic = "force-dynamic";

export default function LocalShadowV480Page() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#020405] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v480-page
      data-atlas-local-shadow-v480-enabled={localShadow}
    >
      <div className="mx-auto max-w-[1480px]">
        <div className="border-l border-cyan-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-cyan-100/45">
            Orbit Atlas · Scientific Truth / Product Boundary
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-cyan-50/90">
            Photon Evidence Workbench / V480
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            把可用的稀疏观测量、不可用的生产产品、频率坐标 provenance
            和双渲染隔离放进同一份有界证据模型，但不抹平它们的 authority 差异。
          </p>
        </div>
        {localShadow ? (
          <KerrPhotonEvidenceWorkbenchV480 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v480-boundary="local-shadow-only"
          >
            V480 photon evidence workbench 仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
