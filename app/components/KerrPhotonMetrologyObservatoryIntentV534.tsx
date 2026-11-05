"use client";

import { Suspense, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import {
  resolveKerrPhotonMetrologyObservatoryIntentV534,
  type KerrPhotonMetrologyDetailSurfaceV534,
} from "../lib/kerrPhotonMetrologyObservatoryIntentV534";
import {
  KERR_PHOTON_METROLOGY_DETAILS_V534,
  KERR_PHOTON_METROLOGY_DETAIL_IDS_V534,
  KERR_PHOTON_METROLOGY_LABELS_V534,
} from "./kerrPhotonMetrologyDetailCatalogV534";

export default function KerrPhotonMetrologyObservatoryIntentV534({ active }: { active: boolean }) {
  const [detail, setDetail] = useState<KerrPhotonMetrologyDetailSurfaceV534>("none");
  const decision = resolveKerrPhotonMetrologyObservatoryIntentV534(getAtlasDeliveryProfile(), active);
  if (!decision.observatoryImportAuthorized) return null;
  const Selected = detail === "none" ? null : KERR_PHOTON_METROLOGY_DETAILS_V534[detail];
  return (
    <section
      className="mt-3"
      data-atlas-kerr-photon-metrology-observatory-v534
      data-atlas-v534-detail-catalog-size={decision.detailComponentCatalogSize}
      data-atlas-v534-bandpass-request-before-detail="false"
      data-atlas-v534-concurrent-detail-budget={decision.concurrentDetailSurfaceBudget}
      data-atlas-v534-canvas-created="false"
      data-atlas-v534-scene-revision-delta="0"
      data-atlas-v534-physics-mutation="false"
    >
      <div className="border border-white/10 bg-[#040b0c] p-3 font-mono text-[8px] text-white/40">
        V534 · shared 36-detail catalog · physical bandpass/redshift operator · measured detector 0/6
      </div>
      <nav className="mt-3 flex flex-wrap gap-2" aria-label="Photon metrology detail catalog">
        {KERR_PHOTON_METROLOGY_DETAIL_IDS_V534.map((id) => (
          <button
            key={id}
            type="button"
            className="border border-white/10 px-3 py-2 text-[8px]"
            aria-pressed={detail === id}
            onClick={() => setDetail((current) => current === id ? "none" : id)}
          >
            {KERR_PHOTON_METROLOGY_LABELS_V534[id]}
          </button>
        ))}
      </nav>
      <Suspense fallback={<div className="mt-3 text-[9px] text-white/40">Loading explicit detail…</div>}>
        {Selected ? <Selected /> : null}
      </Suspense>
    </section>
  );
}
