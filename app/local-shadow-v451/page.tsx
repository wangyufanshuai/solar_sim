import KerrDetectorInputAdmissionV451 from "../components/KerrDetectorInputAdmissionV451";

export const dynamic = "force-dynamic";

export default function LocalShadowV451DetectorAdmissionPage() {
  const localShadow =
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#030608] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v451-page
      data-atlas-local-shadow-v451-enabled={localShadow}
    >
      <div className="mx-auto max-w-7xl">
        <div className="border-l border-amber-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-amber-100/45">
            Orbit Atlas · local-shadow research instrument
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.06em] text-amber-50/90">
            Detector input admission / V451
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            六项仪器输入的内容寻址准入与独立验证边界。当前缺失输入会保持 blocked，不会被 fixture、默认参数或电影渲染替代。
          </p>
        </div>
        {localShadow ? (
          <KerrDetectorInputAdmissionV451 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v451-boundary="local-shadow-only"
          >
            此准入表面仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
