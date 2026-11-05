"use client";

import { lazy, Suspense, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { resolveKerrPhotonMetrologyObservatoryIntentV496, type KerrPhotonMetrologyDetailSurfaceV496 } from "../lib/kerrPhotonMetrologyObservatoryIntentV496";

const KerrPhotonMetrologyCockpitV485 = lazy(() => import("./KerrPhotonMetrologyCockpitV485"));
const KerrDimensionlessPhotonAtlasV487 = lazy(() => import("./KerrDimensionlessPhotonAtlasV487"));
const KerrRedshiftContrastLatticeV489 = lazy(() => import("./KerrRedshiftContrastLatticeV489"));
const KerrRedshiftGaugeReconstructionV491 = lazy(() => import("./KerrRedshiftGaugeReconstructionV491"));
const KerrRedshiftEdgeRedundancyV493 = lazy(() => import("./KerrRedshiftEdgeRedundancyV493"));
const KerrRedshiftDoubleEdgeIdentifiabilityV495 = lazy(() => import("./KerrRedshiftDoubleEdgeIdentifiabilityV495"));

const DETAIL_LABELS: Readonly<Record<Exclude<KerrPhotonMetrologyDetailSurfaceV496, "none">, string>> = {
  "coordinate-atlas": "Coordinate atlas",
  "contrast-lattice": "Contrast lattice",
  "gauge-reconstruction": "Gauge reconstruction",
  "edge-redundancy": "Edge redundancy",
  "double-edge-identifiability": "Double-edge audit",
};

export default function KerrPhotonMetrologyObservatoryIntentV496({ active }: { active: boolean }) {
  const [detail, setDetail] = useState<KerrPhotonMetrologyDetailSurfaceV496>("none");
  const decision = resolveKerrPhotonMetrologyObservatoryIntentV496(getAtlasDeliveryProfile(), active);
  if (!decision.observatoryImportAuthorized) return null;
  return <section className="mt-3" data-atlas-kerr-photon-metrology-observatory-v496 data-atlas-v496-automatic-component-budget={decision.automaticComponentImportBudget} data-atlas-v496-automatic-summary-budget={decision.automaticSummaryRequestBudget} data-atlas-v496-detail-catalog-size={decision.detailComponentCatalogSize} data-atlas-v496-concurrent-detail-budget={decision.concurrentDetailSurfaceBudget} data-atlas-v496-selected-detail={detail} data-atlas-v496-detail-data-request-by-wrapper="false" data-atlas-v496-public-panel-id-added="false" data-atlas-v496-canvas-created="false" data-atlas-v496-scene-revision-delta="0" data-atlas-v496-physics-mutation="false">
    <div className="flex flex-wrap items-center justify-between gap-3 border-l border-cyan-100/20 pl-3"><div className="font-mono text-[8px] uppercase tracking-[.22em] text-cyan-100/45">Photon metrology observatory / five exclusive details</div><div className="flex flex-wrap gap-1 font-mono text-[8px] uppercase tracking-[.12em]">{(Object.entries(DETAIL_LABELS) as [Exclude<KerrPhotonMetrologyDetailSurfaceV496, "none">, string][]).map(([id, label]) => <button className={detail === id ? "border border-cyan-100/30 bg-cyan-100/10 px-2.5 py-1.5 text-cyan-50/80" : "border border-white/10 px-2.5 py-1.5 text-white/35 hover:text-white/65"} key={id} onClick={() => setDetail((current) => current === id ? "none" : id)} type="button">{label}</button>)}</div></div>
    <Suspense fallback={<Loading label="bounded metrology cockpit" />}><KerrPhotonMetrologyCockpitV485 /></Suspense>
    {detail === "coordinate-atlas" ? <Suspense fallback={<Loading label="coordinate-atlas shell; data remains idle" />}><KerrDimensionlessPhotonAtlasV487 /></Suspense> : null}
    {detail === "contrast-lattice" ? <Suspense fallback={<Loading label="contrast-lattice shell; data remains idle" />}><KerrRedshiftContrastLatticeV489 /></Suspense> : null}
    {detail === "gauge-reconstruction" ? <Suspense fallback={<Loading label="gauge-reconstruction shell; data remains idle" />}><KerrRedshiftGaugeReconstructionV491 /></Suspense> : null}
    {detail === "edge-redundancy" ? <Suspense fallback={<Loading label="edge-redundancy shell; data remains idle" />}><KerrRedshiftEdgeRedundancyV493 /></Suspense> : null}
    {detail === "double-edge-identifiability" ? <Suspense fallback={<Loading label="double-edge shell; data remains idle" />}><KerrRedshiftDoubleEdgeIdentifiabilityV495 /></Suspense> : null}
  </section>;
}
function Loading({ label }: { label: string }) { return <div className="mt-3 rounded border border-cyan-100/10 px-3 py-2 font-mono text-[9px] text-cyan-50/40">Loading {label}...</div>; }
