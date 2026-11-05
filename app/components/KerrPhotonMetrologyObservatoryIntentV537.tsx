"use client";

import { Suspense, useState } from "react";

import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { resolveKerrPhotonMetrologyObservatoryIntentV537, type KerrPhotonMetrologyDetailSurfaceV537 } from "../lib/kerrPhotonMetrologyObservatoryIntentV537";
import { KERR_PHOTON_METROLOGY_DETAILS_V537, KERR_PHOTON_METROLOGY_DETAIL_IDS_V537, KERR_PHOTON_METROLOGY_LABELS_V537 } from "./kerrPhotonMetrologyDetailCatalogV537";

export default function KerrPhotonMetrologyObservatoryIntentV537({ active }: { active: boolean }) {
  const [detail, setDetail] = useState<KerrPhotonMetrologyDetailSurfaceV537>("none");
  const decision = resolveKerrPhotonMetrologyObservatoryIntentV537(getAtlasDeliveryProfile(), active);
  if (!decision.observatoryImportAuthorized) return null;
  const Selected = detail === "none" ? null : KERR_PHOTON_METROLOGY_DETAILS_V537[detail];
  return <section
    className="mt-3"
    data-atlas-kerr-photon-metrology-observatory-v537
    data-atlas-v537-detail-catalog-size={decision.detailComponentCatalogSize}
    data-atlas-v537-fits-request-before-detail="false"
    data-atlas-v537-canvas-created="false"
    data-atlas-v537-scene-revision-delta="0"
    data-atlas-v537-physics-mutation="false"
  >
    <div className="border border-white/10 bg-[#040b0c] p-3 font-mono text-[8px] text-white/40">V537 · shared 39-detail catalog · FITS binary table 1 · image HDU 0 · raster 0</div>
    <nav className="mt-3 flex flex-wrap gap-2">
      {KERR_PHOTON_METROLOGY_DETAIL_IDS_V537.map((id) => <button key={id} type="button" className="border border-white/10 px-3 py-2 text-[8px]" onClick={() => setDetail((current) => current === id ? "none" : id)}>{KERR_PHOTON_METROLOGY_LABELS_V537[id]}</button>)}
    </nav>
    <Suspense fallback={<div>正在加载显式详情…</div>}>{Selected ? <Selected /> : null}</Suspense>
  </section>;
}
