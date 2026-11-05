import KerrMeasuredDetectorBlindValidationV459 from "../components/KerrMeasuredDetectorBlindValidationV459";

export const dynamic = "force-dynamic";

export default function LocalShadowV459BlindValidationPage() {
  const localShadow =
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#020609] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v459-page
      data-atlas-local-shadow-v459-enabled={localShadow}
    >
      <div className="mx-auto max-w-7xl">
        <div className="border-l border-cyan-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-cyan-100/45">
            Orbit Atlas · Detector Blind Validation
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-cyan-50/90">
            Train / Holdout Observatory / V459
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            独立验证、泄漏防护与误差预算的只读工作台；协议合格不等于测量 authority 合格。
          </p>
        </div>
        {localShadow ? (
          <KerrMeasuredDetectorBlindValidationV459 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v459-boundary="local-shadow-only"
          >
            V459 blind validation 仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
