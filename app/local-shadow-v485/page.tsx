import KerrPhotonMetrologyCockpitV485 from "../components/KerrPhotonMetrologyCockpitV485";

export const dynamic = "force-dynamic";

export default function LocalShadowV485Page() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#020405] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v485-page
      data-atlas-local-shadow-v485-enabled={localShadow}
    >
      <div className="mx-auto max-w-[1540px]">
        <div className="border-l border-cyan-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-cyan-100/45">
            Orbit Atlas · Photon Metrology / Unified Evidence Route
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-cyan-50/90">
            Photon Metrology Cockpit / V485
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            用一条不可变证据航线统一 v479–v484，同时确保大矩阵与详细科学数组只存在于按需 artifact 中。
          </p>
        </div>
        {localShadow ? (
          <KerrPhotonMetrologyCockpitV485 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v485-boundary="local-shadow-only"
          >
            V485 photon metrology cockpit 仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
