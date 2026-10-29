"use client";

import { lazy, Suspense, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import {
  resolveKerrPhotonMetrologyObservatoryIntentV492,
  type KerrPhotonMetrologyDetailSurfaceV492,
} from "../lib/kerrPhotonMetrologyObservatoryIntentV492";

const KerrPhotonMetrologyCockpitV485 = lazy(() => import("./KerrPhotonMetrologyCockpitV485"));
const KerrDimensionlessPhotonAtlasV487 = lazy(() => import("./KerrDimensionlessPhotonAtlasV487"));
const KerrRedshiftContrastLatticeV489 = lazy(() => import("./KerrRedshiftContrastLatticeV489"));
const KerrRedshiftGaugeReconstructionV491 = lazy(() => import("./KerrRedshiftGaugeReconstructionV491"));

const DETAIL_LABELS: Readonly<Record<Exclude<KerrPhotonMetrologyDetailSurfaceV492, "none">, string>> = {
  "coordinate-atlas": "Coordinate atlas",
  "contrast-lattice": "Contrast lattice",
  "gauge-reconstruction": "Gauge reconstruction",
};

export default function KerrPhotonMetrologyObservatoryIntentV492({ active }: { active: boolean }) {
  const [detail, setDetail] = useState<KerrPhotonMetrologyDetailSurfaceV492>("none");
  const decision = resolveKerrPhotonMetrologyObservatoryIntentV492(getAtlasDeliveryProfile(), active);
  if (!decision.observatoryImportAuthorized) return null;
  return (
    <section
      className="mt-3"
      data-atlas-kerr-photon-metrology-observatory-v492
      data-atlas-v492-automatic-component-budget={decision.automaticComponentImportBudget}
      data-atlas-v492-automatic-summary-budget={decision.automaticSummaryRequestBudget}
      data-atlas-v492-detail-catalog-size={decision.detailComponentCatalogSize}
      data-atlas-v492-concurrent-detail-budget={decision.concurrentDetailSurfaceBudget}
      data-atlas-v492-selected-detail={detail}
      data-atlas-v492-detail-data-request-by-wrapper="false"
      data-atlas-v492-public-panel-id-added="false"
      data-atlas-v492-canvas-created="false"
      data-atlas-v492-scene-revision-delta="0"
      data-atlas-v492-physics-mutation="false"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-l border-cyan-100/20 pl-3">
        <div className="font-mono text-[8px] uppercase tracking-[.22em] text-cyan-100/45">
          Photon metrology observatory / five-level intent
        </div>
        <div className="flex flex-wrap gap-1 font-mono text-[8px] uppercase tracking-[.12em]">
          {(Object.entries(DETAIL_LABELS) as [Exclude<KerrPhotonMetrologyDetailSurfaceV492, "none">, string][]).map(([id, label]) => (
            <button
              className={detail === id
                ? "border border-cyan-100/30 bg-cyan-100/10 px-2.5 py-1.5 text-cyan-50/80"
                : "border border-white/10 px-2.5 py-1.5 text-white/35 hover:text-white/65"}
              key={id}
              onClick={() => setDetail((current) => current === id ? "none" : id)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <Suspense fallback={<Loading label="bounded metrology cockpit" />}>
        <KerrPhotonMetrologyCockpitV485 />
      </Suspense>
      {detail === "coordinate-atlas" ? (
        <Suspense fallback={<Loading label="coordinate-atlas shell; data remains idle" />}>
          <KerrDimensionlessPhotonAtlasV487 />
        </Suspense>
      ) : null}
      {detail === "contrast-lattice" ? (
        <Suspense fallback={<Loading label="contrast-lattice shell; data remains idle" />}>
          <KerrRedshiftContrastLatticeV489 />
        </Suspense>
      ) : null}
      {detail === "gauge-reconstruction" ? (
        <Suspense fallback={<Loading label="gauge-reconstruction shell; data remains idle" />}>
          <KerrRedshiftGaugeReconstructionV491 />
        </Suspense>
      ) : null}
    </section>
  );
}

function Loading({ label }: { label: string }) {
  return <div className="mt-3 rounded border border-cyan-100/10 px-3 py-2 font-mono text-[9px] text-cyan-50/40">Loading {label}...</div>;
}
