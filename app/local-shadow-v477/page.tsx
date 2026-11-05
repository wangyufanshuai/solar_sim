import KerrPhotonRadiometryTransferV477 from "../components/KerrPhotonRadiometryTransferV477";

export const dynamic = "force-dynamic";

export default function LocalShadowV477Page() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#030407] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v477-page
      data-atlas-local-shadow-v477-enabled={localShadow}
    >
      <div className="mx-auto max-w-[1450px]">
        <div className="border-l border-cyan-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-cyan-100/45">
            Orbit Atlas · Photon Transfer Observatory
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-cyan-50/90">
            Radiometry Transfer / V477
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            用四条权威 disk ray 验证 g、g³、g⁴ 与误差传播，同时将传递系数和实测辐亮度严格分开。
          </p>
        </div>
        {localShadow ? (
          <KerrPhotonRadiometryTransferV477 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v477-boundary="local-shadow-only"
          >
            V477 photon radiometry transfer 仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
