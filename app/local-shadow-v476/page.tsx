import KerrScienceProductAdmissionV476 from "../components/KerrScienceProductAdmissionV476";

export const dynamic = "force-dynamic";

export default function LocalShadowV476Page() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return (
    <main
      className="min-h-screen bg-[#030603] px-4 py-8 text-white sm:px-8"
      data-atlas-local-shadow-v476-page
      data-atlas-local-shadow-v476-enabled={localShadow}
    >
      <div className="mx-auto max-w-[1450px]">
        <div className="border-l border-emerald-100/25 pl-4">
          <div className="font-mono text-[9px] uppercase tracking-[.3em] text-emerald-100/45">
            Orbit Atlas · Scientific Product Control Room
          </div>
          <h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-emerald-50/90">
            Admission Rail / V476
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">
            将真实可读的稀疏观测量与尚无资格的探测器、强度、Stokes 和科学图像产品逐项隔离。
          </p>
        </div>
        {localShadow ? (
          <KerrScienceProductAdmissionV476 />
        ) : (
          <div
            className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55"
            data-atlas-local-shadow-v476-boundary="local-shadow-only"
          >
            V476 科研产品准入工作台仅在 local-shadow delivery profile 中可用。
          </div>
        )}
      </div>
    </main>
  );
}
