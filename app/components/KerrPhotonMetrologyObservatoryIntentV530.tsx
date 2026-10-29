"use client";

import { lazy, Suspense, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { KERR_PHOTON_METROLOGY_MILESTONE_CHAIN_V500 } from "../lib/kerrPhotonMetrologyObservatoryIntentV500";
import {
  resolveKerrPhotonMetrologyObservatoryIntentV530,
  type KerrPhotonMetrologyDetailSurfaceV530,
} from "../lib/kerrPhotonMetrologyObservatoryIntentV530";
import {
  KERR_PHOTON_METROLOGY_DETAILS_V530,
  KERR_PHOTON_METROLOGY_DETAIL_IDS_V530,
  KERR_PHOTON_METROLOGY_LABELS_V530,
} from "./kerrPhotonMetrologyDetailCatalogV530";

const Cockpit = lazy(() => import("./KerrPhotonMetrologyCockpitV485"));
export default function KerrPhotonMetrologyObservatoryIntentV530({
  active,
}: Readonly<{ active: boolean }>) {
  const [detail, setDetail] = useState<KerrPhotonMetrologyDetailSurfaceV530>("none");
  const decision = resolveKerrPhotonMetrologyObservatoryIntentV530(
    getAtlasDeliveryProfile(),
    active,
  );
  if (!decision.observatoryImportAuthorized) return null;
  const Selected = detail === "none" ? null : KERR_PHOTON_METROLOGY_DETAILS_V530[detail];
  return (
    <section
      className="mt-3"
      data-atlas-kerr-photon-metrology-observatory-v530
      data-atlas-v530-detail-catalog-size={decision.detailComponentCatalogSize}
      data-atlas-v530-concurrent-detail-budget={decision.concurrentDetailSurfaceBudget}
      data-atlas-v530-regret-evaluation-count={decision.regretEvaluationCount}
      data-atlas-v530-scientific-geometry-count={decision.scientificGeometryInputCount}
      data-atlas-v530-overhead-audit-count={decision.overheadAuditCount}
      data-atlas-v530-selected-recommendation-count={decision.selectedRecommendationCount}
      data-atlas-v530-static-network-budget="0"
      data-atlas-v530-selected-detail={detail}
      data-atlas-v530-regret-request-before-detail="false"
      data-atlas-v530-canvas-created="false"
      data-atlas-v530-scene-revision-delta="0"
      data-atlas-v530-physics-mutation="false"
    >
      <div className="grid gap-px border border-white/10 bg-white/10 lg:grid-cols-[1fr_auto]">
        <div className="bg-[#040b0c] p-3">
          <div className="font-mono text-[8px] uppercase tracking-[.22em] text-cyan-100/45">
            V491–V530 observatory / {KERR_PHOTON_METROLOGY_MILESTONE_CHAIN_V500.length} topology
            stages
          </div>
          <div className="mt-2 font-mono text-[8px] text-white/30">
            robustness grid → absolute regret → relative regret → fragility lattice → decision firewall
          </div>
          <div className="mt-2 font-mono text-[7px] text-amber-100/42">
            V530 · shared 32-detail catalog · 49000 evaluations · recommendation unavailable
          </div>
        </div>
        <div
          className="bg-[#151006] p-3 font-mono text-[8px]"
          data-atlas-v530-operational-decision-qualified="false"
        >
          <div className="text-emerald-200/75">Regret atlas / QUALIFIED</div>
          <div className="mt-2 text-white/35">operational decision / UNAVAILABLE</div>
        </div>
      </div>
      <Suspense fallback={<Loading label="bounded photon metrology summary" />}>
        <Cockpit />
      </Suspense>
      <nav className="mt-3 flex flex-wrap gap-2" aria-label="Photon metrology detail surfaces">
        {KERR_PHOTON_METROLOGY_DETAIL_IDS_V530.map((id) => (
          <button
            className={
              detail === id
                ? "border border-cyan-100/35 bg-cyan-100/10 px-3 py-2 font-mono text-[8px] text-cyan-50/80"
                : "border border-white/10 bg-black/20 px-3 py-2 font-mono text-[8px] text-white/35"
            }
            key={id}
            onClick={() => setDetail((current) => (current === id ? "none" : id))}
            type="button"
          >
            {KERR_PHOTON_METROLOGY_LABELS_V530[id]}
          </button>
        ))}
      </nav>
      <Suspense fallback={<Loading label="explicit detail surface" />}>
        {Selected ? <Selected /> : null}
      </Suspense>
    </section>
  );
}

function Loading({ label }: Readonly<{ label: string }>) {
  return (
    <div className="mt-3 border border-white/8 bg-black/20 p-4 font-mono text-[9px] text-white/35">
      Loading {label}…
    </div>
  );
}
