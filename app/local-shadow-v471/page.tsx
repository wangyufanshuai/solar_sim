import KerrObservableProvenanceMatrixV471 from "../components/KerrObservableProvenanceMatrixV471";

export const dynamic = "force-dynamic";

export default function LocalShadowV471ObservablePage() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#020607] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v471-page
      data-atlas-local-shadow-v471-enabled={localShadow}
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="border-l border-sky-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-sky-100/45">
            Orbit Atlas · Observable Provenance Observatory
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-sky-50/90">
            Authority Matrix / V471
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            从 geodesic event 到 FITS image 的逐观测量来源、适用性与生产边界。
          </p>
        </div>
        {localShadow ? (
          <KerrObservableProvenanceMatrixV471 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v471-boundary="local-shadow-only"
          >
            V471 observable provenance 仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
