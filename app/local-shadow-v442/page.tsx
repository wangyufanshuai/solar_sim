import KerrDetectorProjectionAdmissionV442 from "../components/KerrDetectorProjectionAdmissionV442";

export const dynamic = "force-dynamic";

export default function LocalShadowV442AdmissionPage() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main className="min-h-screen bg-[#020708] px-4 py-8 text-white sm:px-8" data-atlas-local-shadow-v442-page data-atlas-local-shadow-v442-enabled={localShadow}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 border-l-2 border-amber-200/40 pl-3 font-mono">
          <div className="text-[9px] uppercase tracking-[.28em] text-amber-100/55">Orbit Atlas · local shadow only</div>
          <h1 className="mt-1 text-2xl font-light tracking-[.12em] text-amber-50/90">Detector projection admission / V442</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-white/45">A read-only admission surface for reconciling the qualified Kerr WCS with measured detector geometry. It cannot publish a detector image or mutate the science payload.</p>
        </div>
        {localShadow ? <KerrDetectorProjectionAdmissionV442 /> : <div className="rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55" data-atlas-local-shadow-v442-boundary="local-shadow-only">This surface is unavailable outside the local-shadow delivery profile.</div>}
      </div>
    </main>
  );
}
