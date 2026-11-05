import KerrSpectralIdentifiabilityViewerV484 from "../components/KerrSpectralIdentifiabilityViewerV484";

export const dynamic = "force-dynamic";

export default function LocalShadowV484Page() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#050504] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v484-page
      data-atlas-local-shadow-v484-enabled={localShadow}
    >
      <div className="mx-auto max-w-[1520px]">
        <div className="border-l border-lime-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-lime-100/45">
            Orbit Atlas · Rank / Identifiability Authority
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-lime-50/90">
            Spectral Identifiability Ledger / V484
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            用 Moore–Penrose 与互补投影器证明 1/5 可辨识结构，同时阻止任何未经授权的 Fisher、likelihood 或 posterior 解释。
          </p>
        </div>
        {localShadow ? (
          <KerrSpectralIdentifiabilityViewerV484 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v484-boundary="local-shadow-only"
          >
            V484 identifiability viewer 仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
