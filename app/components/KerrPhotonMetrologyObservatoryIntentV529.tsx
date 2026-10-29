"use client";

import { lazy, Suspense, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { KERR_PHOTON_METROLOGY_MILESTONE_CHAIN_V500 } from "../lib/kerrPhotonMetrologyObservatoryIntentV500";
import {
  resolveKerrPhotonMetrologyObservatoryIntentV529,
  type KerrPhotonMetrologyDetailSurfaceV529,
} from "../lib/kerrPhotonMetrologyObservatoryIntentV529";
import {
  KERR_PHOTON_METROLOGY_DETAILS_V529,
  KERR_PHOTON_METROLOGY_DETAIL_IDS_V529,
  KERR_PHOTON_METROLOGY_LABELS_V529,
} from "./kerrPhotonMetrologyDetailCatalogV529";

const Cockpit = lazy(() => import("./KerrPhotonMetrologyCockpitV485"));
export default function KerrPhotonMetrologyObservatoryIntentV529({
  active,
}: Readonly<{ active: boolean }>) {
  const [detail, setDetail] = useState<KerrPhotonMetrologyDetailSurfaceV529>("none");
  const decision = resolveKerrPhotonMetrologyObservatoryIntentV529(
    getAtlasDeliveryProfile(),
    active,
  );
  if (!decision.observatoryImportAuthorized) return null;
  const Selected = detail === "none" ? null : KERR_PHOTON_METROLOGY_DETAILS_V529[detail];
  return (
    <section
      className="mt-3"
      data-atlas-kerr-photon-metrology-observatory-v529
      data-atlas-v529-detail-catalog-size={decision.detailComponentCatalogSize}
      data-atlas-v529-concurrent-detail-budget={decision.concurrentDetailSurfaceBudget}
      data-atlas-v529-factorial-cell-count={decision.fullFactorialCellCount}
      data-atlas-v529-scientific-geometry-count={decision.scientificGeometryInputCount}
      data-atlas-v529-optimizer-iteration-count={decision.optimizerIterationCount}
      data-atlas-v529-selected-model-count={decision.selectedModelCount}
      data-atlas-v529-static-network-budget="0"
      data-atlas-v529-selected-detail={detail}
      data-atlas-v529-robustness-request-before-detail="false"
      data-atlas-v529-canvas-created="false"
      data-atlas-v529-scene-revision-delta="0"
      data-atlas-v529-physics-mutation="false"
    >
      <div className="grid gap-px border border-white/10 bg-white/10 lg:grid-cols-[1fr_auto]">
        <div className="bg-[#040b0c] p-3">
          <div className="font-mono text-[8px] uppercase tracking-[.22em] text-cyan-100/45">
            V491–V529 observatory / {KERR_PHOTON_METROLOGY_MILESTONE_CHAIN_V500.length} topology
            stages
          </div>
          <div className="mt-2 font-mono text-[8px] text-white/30">
            cost ratio → exponent family → systematic floor → overhead invariance → model firewall
          </div>
          <div className="mt-2 font-mono text-[7px] text-amber-100/42">
            V529 · shared 31-detail catalog · 1000 cells · operational model unavailable
          </div>
        </div>
        <div
          className="bg-[#151006] p-3 font-mono text-[8px]"
          data-atlas-v529-operational-model-qualified="false"
        >
          <div className="text-emerald-200/75">Robustness envelope / QUALIFIED</div>
          <div className="mt-2 text-white/35">recommended model / UNAVAILABLE</div>
        </div>
      </div>
      <Suspense fallback={<Loading label="bounded photon metrology summary" />}>
        <Cockpit />
      </Suspense>
      <nav className="mt-3 flex flex-wrap gap-2" aria-label="Photon metrology detail surfaces">
        {KERR_PHOTON_METROLOGY_DETAIL_IDS_V529.map((id) => (
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
            {KERR_PHOTON_METROLOGY_LABELS_V529[id]}
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
