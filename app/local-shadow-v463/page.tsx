import KerrSciencePayloadAdmissionV463 from "../components/KerrSciencePayloadAdmissionV463";

export const dynamic = "force-dynamic";

export default function LocalShadowV463SciencePayloadPage() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return <main className="min-h-screen bg-[#020609] px-4 py-8 text-white sm:px-8" data-atlas-local-shadow-v463-page data-atlas-local-shadow-v463-enabled={localShadow}><div className="mx-auto max-w-7xl"><div className="border-l border-cyan-100/25 pl-4"><div className="font-mono text-[9px] uppercase tracking-[.3em] text-cyan-100/45">Orbit Atlas · Science Payload Observatory</div><h1 className="mt-2 font-serif text-3xl tracking-[.07em] text-cyan-50/90">Payload Admission / V463</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300/45">以 v462 atomic join 为唯一上游的只读科研载荷准入面板。</p></div>{localShadow ? <KerrSciencePayloadAdmissionV463 /> : <div className="mt-5 rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55" data-atlas-local-shadow-v463-boundary="local-shadow-only">V463 payload admission 仅在 local-shadow delivery profile 中可用。</div>}</div></main>;
}
