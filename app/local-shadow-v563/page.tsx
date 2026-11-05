import IxpeMetadataProbeSurfaceV563 from "../components/IxpeMetadataProbeSurfaceV563";

export const dynamic = "force-dynamic";

export default function LocalShadowV563MetadataPage() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return <main className="min-h-screen bg-[#020508] px-4 py-8 text-white sm:px-8" data-atlas-local-shadow-v563-page data-atlas-local-shadow-v563-enabled={localShadow}><div className="mx-auto max-w-5xl"><div className="mb-4 border-l-2 border-sky-200/40 pl-3 font-mono"><div className="text-[9px] uppercase tracking-[.28em] text-sky-100/55">Orbit Atlas · metadata lane</div><h1 className="mt-1 text-2xl font-light tracking-[.12em] text-sky-50/90">IXPE archive metadata · V563</h1><p className="mt-2 max-w-3xl text-xs leading-5 text-white/45">HEAD-only HEASARC and NASA mirror metadata. Event, response, attitude and background payloads are never read by this lane.</p></div>{localShadow ? <IxpeMetadataProbeSurfaceV563 /> : <div className="rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55">This surface is unavailable outside the local-shadow delivery profile.</div>}</div></main>;
}
