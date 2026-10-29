"use client";

import { Suspense, useState } from "react";

import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { resolveKerrPhotonMetrologyObservatoryIntentV536, type KerrPhotonMetrologyDetailSurfaceV536 } from "../lib/kerrPhotonMetrologyObservatoryIntentV536";
import { KERR_PHOTON_METROLOGY_DETAILS_V536, KERR_PHOTON_METROLOGY_DETAIL_IDS_V536, KERR_PHOTON_METROLOGY_LABELS_V536 } from "./kerrPhotonMetrologyDetailCatalogV536";

export default function KerrPhotonMetrologyObservatoryIntentV536({ active }: { active: boolean }) {
  const [detail, setDetail] = useState<KerrPhotonMetrologyDetailSurfaceV536>("none");
  const decision = resolveKerrPhotonMetrologyObservatoryIntentV536(getAtlasDeliveryProfile(), active);
  if (!decision.observatoryImportAuthorized) return null;
  const Selected = detail === "none" ? null : KERR_PHOTON_METROLOGY_DETAILS_V536[detail];
  return <section className="mt-3" data-atlas-kerr-photon-metrology-observatory-v536 data-atlas-v536-detail-catalog-size={decision.detailComponentCatalogSize} data-atlas-v536-sparse-request-before-detail="false" data-atlas-v536-canvas-created="false" data-atlas-v536-scene-revision-delta="0" data-atlas-v536-physics-mutation="false">
    <div className="border border-white/10 bg-[#040b0c] p-3 font-mono text-[8px] text-white/40">V536 · shared 38-detail catalog · sparse image plane 4 samples · raster 0</div>
    <nav className="mt-3 flex flex-wrap gap-2">{KERR_PHOTON_METROLOGY_DETAIL_IDS_V536.map((id) => <button key={id} type="button" className="border border-white/10 px-3 py-2 text-[8px]" onClick={() => setDetail((current) => current === id ? "none" : id)}>{KERR_PHOTON_METROLOGY_LABELS_V536[id]}</button>)}</nav>
    <Suspense fallback={<div>正在加载显式详情…</div>}>{Selected ? <Selected /> : null}</Suspense>
  </section>;
}
