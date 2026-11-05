"use client";

import { Suspense, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { resolveKerrPhotonMetrologyObservatoryIntentV552, type KerrPhotonMetrologyDetailSurfaceV552 } from "../lib/kerrPhotonMetrologyObservatoryIntentV552";
import { KERR_PHOTON_METROLOGY_DETAILS_V552, KERR_PHOTON_METROLOGY_DETAIL_IDS_V552, KERR_PHOTON_METROLOGY_LABELS_V552 } from "./kerrPhotonMetrologyDetailCatalogV552";

export default function KerrPhotonMetrologyObservatoryIntentV552({ active }: { active: boolean }) {
  const [detail, setDetail] = useState<KerrPhotonMetrologyDetailSurfaceV552>("none");
  const decision = resolveKerrPhotonMetrologyObservatoryIntentV552(getAtlasDeliveryProfile(), active);
  if (!decision.observatoryImportAuthorized) return null;
  const Selected = detail === "none" ? null : KERR_PHOTON_METROLOGY_DETAILS_V552[detail];
  return <section className="mt-3" data-atlas-kerr-photon-metrology-observatory-v552 data-atlas-v552-detail-catalog-size={decision.detailComponentCatalogSize} data-atlas-v552-request-before-detail="false" data-atlas-v552-confirmations="0/7" data-atlas-v552-network-attempts="0" data-atlas-v552-measured-authority="false" data-atlas-v552-science-pixels="0" data-atlas-v552-canvas-created="false" data-atlas-v552-scene-revision-delta="0" data-atlas-v552-physics-mutation="false">
    <div className="border border-white/10 bg-[#040b0c] p-3 font-mono text-[8px] text-white/55">V552 · 54 项详情 · 用户确认包 0/7 · 离线回放 2/2 · 网络请求 0 · measured authority false</div>
    <nav className="mt-3 flex flex-wrap gap-2" aria-label="Photon metrology detail catalog">
      {KERR_PHOTON_METROLOGY_DETAIL_IDS_V552.map((id) => <button key={id} type="button" className="border border-white/10 px-3 py-2 text-[8px]" onClick={() => setDetail((current) => current === id ? "none" : id)}>{KERR_PHOTON_METROLOGY_LABELS_V552[id]}</button>)}
    </nav>
    <Suspense fallback={<div className="mt-3 text-[9px] text-white/45">正在加载详情…</div>}>{Selected ? <Selected /> : null}</Suspense>
  </section>;
}
