import IxpeMeasuredIntakeSurfaceV562 from "../components/IxpeMeasuredIntakeSurfaceV562";
import OrbitAtlasHeroScenesV562 from "../components/OrbitAtlasHeroScenesV562";

export const dynamic = "force-dynamic";

export default function LocalShadowV562IxpePage() {
  const localShadow = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow";
  return <main className="min-h-screen bg-[#020508] px-4 py-8 text-white sm:px-8" data-atlas-local-shadow-v562-page data-atlas-local-shadow-v562-enabled={localShadow}><div className="mx-auto max-w-[1540px]"><OrbitAtlasHeroScenesV562 /><div className="mx-auto mt-8 max-w-5xl"><div className="mb-4 border-l-2 border-cyan-200/40 pl-3 font-mono"><div className="text-[9px] uppercase tracking-[.28em] text-cyan-100/55">Orbit Atlas · measured lane</div><h1 className="mt-1 text-2xl font-light tracking-[.12em] text-cyan-50/90">IXPE / Cyg X-1 intake · V562</h1><p className="mt-2 max-w-3xl text-xs leading-5 text-white/45">This is the first real-instrument authority lane. It remains blocked until the complete public package, holdout, provenance, response replay and reviewer attestation are present.</p></div>{localShadow ? <IxpeMeasuredIntakeSurfaceV562 /> : <div className="rounded border border-amber-100/15 bg-amber-100/[.03] p-4 font-mono text-xs text-amber-50/55">This surface is unavailable outside the local-shadow delivery profile.</div>}</div></div></main>;
}
