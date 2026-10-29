"use client";
import { Suspense, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { resolveKerrPhotonMetrologyObservatoryIntentV556, type KerrPhotonMetrologyDetailSurfaceV556 } from "../lib/kerrPhotonMetrologyObservatoryIntentV556";
import { KERR_PHOTON_METROLOGY_DETAILS_V556, KERR_PHOTON_METROLOGY_DETAIL_IDS_V556, KERR_PHOTON_METROLOGY_LABELS_V556 } from "./kerrPhotonMetrologyDetailCatalogV556";

export default function KerrPhotonMetrologyObservatoryIntentV556({ active }: { active: boolean }) {
  const [detail, setDetail] = useState<KerrPhotonMetrologyDetailSurfaceV556>("none"), decision = resolveKerrPhotonMetrologyObservatoryIntentV556(getAtlasDeliveryProfile(), active);
  if (!decision.observatoryImportAuthorized) return null;
  const Selected = detail === "none" ? null : KERR_PHOTON_METROLOGY_DETAILS_V556[detail];
  return <section className="mt-3" data-atlas-kerr-photon-metrology-observatory-v556 data-atlas-v556-detail-catalog-size={decision.detailComponentCatalogSize} data-atlas-v556-request-before-detail="false" data-atlas-v556-sparse-samples="16" data-atlas-v556-sparse-products="2" data-atlas-v556-observed-frames="0" data-atlas-v556-measured-pixels="0" data-atlas-v556-network-attempts="0" data-atlas-v556-canvas-created="false" data-atlas-v556-scene-revision-delta="0" data-atlas-v556-physics-mutation="false"><div className="border border-white/10 bg-[#040b0c] p-3 font-mono text-[8px] text-white/55">V556 · 57 项详情 · PNG/FITS exact readback · dense 0/49 · measured pixels 0</div><nav className="mt-3 flex flex-wrap gap-2" aria-label="Photon metrology detail catalog">{KERR_PHOTON_METROLOGY_DETAIL_IDS_V556.map((id) => <button key={id} type="button" className="border border-white/10 px-3 py-2 text-[8px]" onClick={() => setDetail((current) => current === id ? "none" : id)}>{KERR_PHOTON_METROLOGY_LABELS_V556[id]}</button>)}</nav><Suspense fallback={<div className="mt-3 text-[9px] text-white/45">正在加载详情…</div>}>{Selected ? <Selected /> : null}</Suspense></section>;
}
