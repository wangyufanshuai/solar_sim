import KerrObservableUncertaintyLedgerV473 from "../components/KerrObservableUncertaintyLedgerV473";

export const dynamic = "force-dynamic";

export default function LocalShadowV473Page() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#020607] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v473-page
      data-atlas-local-shadow-v473-enabled={localShadow}
    >
      <div className="mx-auto max-w-[1450px]">
        <div className="border-l border-violet-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-violet-100/45">
            Orbit Atlas · Observable Uncertainty Observatory
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-violet-50/90">
            Error Ledger / V473
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            独立公式、容差收敛、坐标回放与 Python oracle 的逐项误差收据。
          </p>
        </div>
        {localShadow ? (
          <KerrObservableUncertaintyLedgerV473 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v473-boundary="local-shadow-only"
          >
            V473 uncertainty ledger 仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
