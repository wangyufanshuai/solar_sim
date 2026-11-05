import KerrSparseSciencePayloadInspectorV474 from "../components/KerrSparseSciencePayloadInspectorV474";

export const dynamic = "force-dynamic";

export default function LocalShadowV474Page() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#020607] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v474-page
      data-atlas-local-shadow-v474-enabled={localShadow}
    >
      <div className="mx-auto max-w-[1450px]">
        <div className="border-l border-cyan-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-cyan-100/45">
            Orbit Atlas · Immutable Sparse Payload
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-cyan-50/90">
            Science Envelope / V474
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            四条 authority disk ray 的真实数值、provenance、适用性和 uncertainty 原子连接。
          </p>
        </div>
        {localShadow ? (
          <KerrSparseSciencePayloadInspectorV474 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v474-boundary="local-shadow-only"
          >
            V474 sparse Science payload 仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
