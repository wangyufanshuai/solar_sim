"use client";

import { Suspense, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import {
  resolveKerrPhotonMetrologyObservatoryIntentV533,
  type KerrPhotonMetrologyDetailSurfaceV533,
} from "../lib/kerrPhotonMetrologyObservatoryIntentV533";
import {
  KERR_PHOTON_METROLOGY_DETAILS_V533,
  KERR_PHOTON_METROLOGY_DETAIL_IDS_V533,
  KERR_PHOTON_METROLOGY_LABELS_V533,
} from "./kerrPhotonMetrologyDetailCatalogV533";

export default function KerrPhotonMetrologyObservatoryIntentV533({ active }: { active: boolean }) {
  const [detail, setDetail] = useState<KerrPhotonMetrologyDetailSurfaceV533>("none");
  const decision = resolveKerrPhotonMetrologyObservatoryIntentV533(getAtlasDeliveryProfile(), active);
  if (!decision.observatoryImportAuthorized) return null;
  const Selected = detail === "none" ? null : KERR_PHOTON_METROLOGY_DETAILS_V533[detail];
  return (
    <section
      className="mt-3"
      data-atlas-kerr-photon-metrology-observatory-v533
      data-atlas-v533-detail-catalog-size={decision.detailComponentCatalogSize}
      data-atlas-v533-axis-request-before-detail="false"
      data-atlas-v533-concurrent-detail-budget={decision.concurrentDetailSurfaceBudget}
      data-atlas-v533-canvas-created="false"
      data-atlas-v533-scene-revision-delta="0"
      data-atlas-v533-physics-mutation="false"
    >
      <div className="border border-white/10 bg-[#040b0c] p-3 font-mono text-[8px] text-white/40">
        V533 · shared 35-detail catalog · 8 axis summaries · operational axis prior unavailable
      </div>
      <nav className="mt-3 flex flex-wrap gap-2" aria-label="Photon metrology detail catalog">
        {KERR_PHOTON_METROLOGY_DETAIL_IDS_V533.map((id) => (
          <button
            key={id}
            type="button"
            className="border border-white/10 px-3 py-2 text-[8px]"
            aria-pressed={detail === id}
            onClick={() => setDetail((current) => current === id ? "none" : id)}
          >
            {KERR_PHOTON_METROLOGY_LABELS_V533[id]}
          </button>
        ))}
      </nav>
      <Suspense fallback={<div className="mt-3 text-[9px] text-white/40">Loading explicit detail…</div>}>
        {Selected ? <Selected /> : null}
      </Suspense>
    </section>
  );
}
