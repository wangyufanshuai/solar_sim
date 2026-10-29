"use client";

import { Suspense, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { resolveKerrPhotonMetrologyObservatoryIntentV542, type KerrPhotonMetrologyDetailSurfaceV542 } from "../lib/kerrPhotonMetrologyObservatoryIntentV542";
import { KERR_PHOTON_METROLOGY_DETAILS_V542, KERR_PHOTON_METROLOGY_DETAIL_IDS_V542, KERR_PHOTON_METROLOGY_LABELS_V542 } from "./kerrPhotonMetrologyDetailCatalogV542";

export default function KerrPhotonMetrologyObservatoryIntentV542({ active }: { active: boolean }) {
  const [detail, setDetail] = useState<KerrPhotonMetrologyDetailSurfaceV542>("none"), decision = resolveKerrPhotonMetrologyObservatoryIntentV542(getAtlasDeliveryProfile(), active);
  if (!decision.observatoryImportAuthorized) return null;
  const Selected = detail === "none" ? null : KERR_PHOTON_METROLOGY_DETAILS_V542[detail];
  return <section className="mt-3" data-atlas-kerr-photon-metrology-observatory-v542 data-atlas-v542-detail-catalog-size={decision.detailComponentCatalogSize} data-atlas-v542-compatibility-request-before-detail="false" data-atlas-v542-science-dependency-imports="0" data-atlas-v542-cross-environment-qualified="false" data-atlas-v542-canvas-created="false" data-atlas-v542-scene-revision-delta="0" data-atlas-v542-physics-mutation="false"><div className="border border-white/10 bg-[#040b0c] p-3 font-mono text-[8px] text-white/40">V542 · shared 44-detail catalog · stdlib preflight 2/2 · executed environments 1 · cross-env unqualified</div><nav className="mt-3 flex flex-wrap gap-2">{KERR_PHOTON_METROLOGY_DETAIL_IDS_V542.map((id) => <button key={id} type="button" className="border border-white/10 px-3 py-2 text-[8px]" onClick={() => setDetail((current) => current === id ? "none" : id)}>{KERR_PHOTON_METROLOGY_LABELS_V542[id]}</button>)}</nav><Suspense fallback={<div className="mt-3 text-[9px] text-white/45">正在加载显式详情…</div>}>{Selected ? <Selected /> : null}</Suspense></section>;
}
