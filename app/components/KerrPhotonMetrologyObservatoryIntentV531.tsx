"use client";
import { lazy, Suspense, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { KERR_PHOTON_METROLOGY_MILESTONE_CHAIN_V500 } from "../lib/kerrPhotonMetrologyObservatoryIntentV500";
import { resolveKerrPhotonMetrologyObservatoryIntentV531, type KerrPhotonMetrologyDetailSurfaceV531 } from "../lib/kerrPhotonMetrologyObservatoryIntentV531";
import { KERR_PHOTON_METROLOGY_DETAILS_V531, KERR_PHOTON_METROLOGY_DETAIL_IDS_V531, KERR_PHOTON_METROLOGY_LABELS_V531 } from "./kerrPhotonMetrologyDetailCatalogV531";
const Cockpit = lazy(() => import("./KerrPhotonMetrologyCockpitV485"));
export default function KerrPhotonMetrologyObservatoryIntentV531({ active }: Readonly<{ active: boolean }>) {
  const [detail, setDetail] = useState<KerrPhotonMetrologyDetailSurfaceV531>("none");
  const decision = resolveKerrPhotonMetrologyObservatoryIntentV531(getAtlasDeliveryProfile(), active);
  if (!decision.observatoryImportAuthorized) return null;
  const Selected = detail === "none" ? null : KERR_PHOTON_METROLOGY_DETAILS_V531[detail];
  return <section className="mt-3" data-atlas-kerr-photon-metrology-observatory-v531 data-atlas-v531-detail-catalog-size={decision.detailComponentCatalogSize} data-atlas-v531-concurrent-detail-budget={decision.concurrentDetailSurfaceBudget} data-atlas-v531-dominance-comparison-count={decision.dominanceComparisonCount} data-atlas-v531-scalarization-evaluation-count={decision.scalarizationEvaluationCount} data-atlas-v531-scientific-geometry-count={decision.scientificGeometryInputCount} data-atlas-v531-selected-preference-count={decision.selectedPreferenceCount} data-atlas-v531-static-network-budget="0" data-atlas-v531-selected-detail={detail} data-atlas-v531-ranking-request-before-detail="false" data-atlas-v531-canvas-created="false" data-atlas-v531-scene-revision-delta="0" data-atlas-v531-physics-mutation="false">
    <div className="grid gap-px border border-white/10 bg-white/10 lg:grid-cols-[1fr_auto]"><div className="bg-[#040b0c] p-3"><div className="font-mono text-[8px] uppercase tracking-[.22em] text-cyan-100/45">V491–V531 observatory / {KERR_PHOTON_METROLOGY_MILESTONE_CHAIN_V500.length} topology stages</div><div className="mt-2 font-mono text-[8px] text-white/30">regret atlas → Pareto front → rank fracture → scalarization path → preference firewall</div><div className="mt-2 font-mono text-[7px] text-amber-100/42">V531 · shared 33-detail catalog · 300 scientific points · preference unavailable</div></div><div className="bg-[#151006] p-3 font-mono text-[8px]" data-atlas-v531-operational-preference-qualified="false"><div className="text-emerald-200/75">Ranking stability / QUALIFIED</div><div className="mt-2 text-white/35">operational preference / UNAVAILABLE</div></div></div>
    <Suspense fallback={<Loading label="bounded photon metrology summary" />}><Cockpit /></Suspense>
    <nav className="mt-3 flex flex-wrap gap-2" aria-label="Photon metrology detail surfaces">{KERR_PHOTON_METROLOGY_DETAIL_IDS_V531.map((id) => <button className={detail === id ? "border border-cyan-100/35 bg-cyan-100/10 px-3 py-2 font-mono text-[8px] text-cyan-50/80" : "border border-white/10 bg-black/20 px-3 py-2 font-mono text-[8px] text-white/35"} key={id} onClick={() => setDetail((current) => current === id ? "none" : id)} type="button">{KERR_PHOTON_METROLOGY_LABELS_V531[id]}</button>)}</nav>
    <Suspense fallback={<Loading label="explicit detail surface" />}>{Selected ? <Selected /> : null}</Suspense>
  </section>;
}
function Loading({ label }: Readonly<{ label: string }>) { return <div className="mt-3 border border-white/8 bg-black/20 p-4 font-mono text-[9px] text-white/35">Loading {label}…</div>; }
