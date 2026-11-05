import KerrEvidenceDependencyRailV470 from "../components/KerrEvidenceDependencyRailV470";

export const dynamic = "force-dynamic";

export default function LocalShadowV470DependencyPage() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#020607] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v470-page
      data-atlas-local-shadow-v470-enabled={localShadow}
    >
      <div className="mx-auto max-w-7xl">
        <div className="border-l border-orange-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-orange-100/45">
            Orbit Atlas · Causal Qualification Observatory
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-orange-50/90">
            Dependency Rail / V470
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            从 measured intake 到科学像素与 local-shadow 晋级的只读因果轨道。
          </p>
        </div>
        {localShadow ? (
          <KerrEvidenceDependencyRailV470 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v470-boundary="local-shadow-only"
          >
            V470 dependency rail 仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
