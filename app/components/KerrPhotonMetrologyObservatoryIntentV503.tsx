"use client";

import { lazy, Suspense, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { KERR_PHOTON_METROLOGY_MILESTONE_CHAIN_V500 } from "../lib/kerrPhotonMetrologyObservatoryIntentV500";
import {
  KERR_CALIBRATION_READINESS_STATUS_V503,
  resolveKerrPhotonMetrologyObservatoryIntentV503,
  type KerrPhotonMetrologyDetailSurfaceV503,
} from "../lib/kerrPhotonMetrologyObservatoryIntentV503";

const KerrPhotonMetrologyCockpitV485 = lazy(
  () => import("./KerrPhotonMetrologyCockpitV485"),
);
const KerrDimensionlessPhotonAtlasV487 = lazy(
  () => import("./KerrDimensionlessPhotonAtlasV487"),
);
const KerrRedshiftContrastLatticeV489 = lazy(
  () => import("./KerrRedshiftContrastLatticeV489"),
);
const KerrRedshiftGaugeReconstructionV491 = lazy(
  () => import("./KerrRedshiftGaugeReconstructionV491"),
);
const KerrRedshiftEdgeRedundancyV493 = lazy(
  () => import("./KerrRedshiftEdgeRedundancyV493"),
);
const KerrRedshiftDoubleEdgeIdentifiabilityV495 = lazy(
  () => import("./KerrRedshiftDoubleEdgeIdentifiabilityV495"),
);
const KerrRedshiftMinimumCutV497 = lazy(
  () => import("./KerrRedshiftMinimumCutV497"),
);
const KerrRedshiftConnectivityLatticeV499 = lazy(
  () => import("./KerrRedshiftConnectivityLatticeV499"),
);
const KerrTopologyDetectorAdmissionV501 = lazy(
  () => import("./KerrTopologyDetectorAdmissionV501"),
);
const KerrMeasuredCalibrationReadinessV503 = lazy(
  () => import("./KerrMeasuredCalibrationReadinessV503"),
);

const DETAIL_LABELS: Readonly<
  Record<Exclude<KerrPhotonMetrologyDetailSurfaceV503, "none">, string>
> = Object.freeze({
  "coordinate-atlas": "Coordinate atlas",
  "contrast-lattice": "Contrast lattice",
  "gauge-reconstruction": "Gauge reconstruction",
  "edge-redundancy": "Edge redundancy",
  "double-edge-identifiability": "Double-edge audit",
  "minimum-cut": "Minimum-cut audit",
  "connectivity-lattice": "Connectivity lattice",
  "detector-admission": "Detector airlock",
  "calibration-readiness": "Calibration readiness",
});

export default function KerrPhotonMetrologyObservatoryIntentV503({
  active,
}: Readonly<{ active: boolean }>) {
  const [detail, setDetail] =
    useState<KerrPhotonMetrologyDetailSurfaceV503>("none");
  const decision = resolveKerrPhotonMetrologyObservatoryIntentV503(
    getAtlasDeliveryProfile(),
    active,
  );
  if (!decision.observatoryImportAuthorized) return null;
  return (
    <section
      className="mt-3"
      data-atlas-kerr-photon-metrology-observatory-v503
      data-atlas-v503-automatic-component-budget={decision.automaticComponentImportBudget}
      data-atlas-v503-detail-catalog-size={decision.detailComponentCatalogSize}
      data-atlas-v503-concurrent-detail-budget={decision.concurrentDetailSurfaceBudget}
      data-atlas-v503-static-stage-count={decision.staticAuthorityStageCount}
      data-atlas-v503-static-network-budget="0"
      data-atlas-v503-selected-detail={detail}
      data-atlas-v503-detail-data-request-by-wrapper="false"
      data-atlas-v503-calibration-pack-ready="false"
      data-atlas-v503-canvas-created="false"
      data-atlas-v503-scene-revision-delta="0"
      data-atlas-v503-physics-mutation="false"
    >
      <div className="grid gap-px border border-white/10 bg-white/10 lg:grid-cols-[1fr_auto]">
        <div className="bg-[#040b0c] p-3">
          <div className="font-mono text-[8px] uppercase tracking-[.22em] text-cyan-100/45">
            V491–V499 topology chain / {KERR_PHOTON_METROLOGY_MILESTONE_CHAIN_V500.length} qualified stages
          </div>
          <div className="mt-2 font-mono text-[8px] text-white/30">
            relative gauge → redundancy → identifiability → minimum cut → complete lattice
          </div>
        </div>
        <div
          className="bg-[#170808] p-3 font-mono text-[8px]"
          data-atlas-v503-detector-authority="false"
        >
          <div className="text-red-200/75">V503 measured calibration / BLOCKED</div>
          <div className="mt-2 text-white/35">
            files {KERR_CALIBRATION_READINESS_STATUS_V503.readyFiles}/
            {KERR_CALIBRATION_READINESS_STATUS_V503.requiredFiles} · response unavailable · raster unavailable
          </div>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="mt-3 border border-white/8 bg-black/20 p-4 font-mono text-[9px] text-white/35">
            Loading bounded photon metrology summary…
          </div>
        }
      >
        <KerrPhotonMetrologyCockpitV485 />
      </Suspense>
      <nav className="mt-3 flex flex-wrap gap-2" aria-label="Photon metrology detail surfaces">
        {(Object.keys(DETAIL_LABELS) as Exclude<KerrPhotonMetrologyDetailSurfaceV503, "none">[]).map(
          (id) => (
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
              {DETAIL_LABELS[id]}
            </button>
          ),
        )}
      </nav>
      <Suspense
        fallback={
          <div className="mt-3 border border-white/8 bg-black/20 p-4 font-mono text-[9px] text-white/35">
            Loading explicit detail surface…
          </div>
        }
      >
        {detail === "coordinate-atlas" ? <KerrDimensionlessPhotonAtlasV487 /> : null}
        {detail === "contrast-lattice" ? <KerrRedshiftContrastLatticeV489 /> : null}
        {detail === "gauge-reconstruction" ? <KerrRedshiftGaugeReconstructionV491 /> : null}
        {detail === "edge-redundancy" ? <KerrRedshiftEdgeRedundancyV493 /> : null}
        {detail === "double-edge-identifiability" ? (
          <KerrRedshiftDoubleEdgeIdentifiabilityV495 />
        ) : null}
        {detail === "minimum-cut" ? <KerrRedshiftMinimumCutV497 /> : null}
        {detail === "connectivity-lattice" ? <KerrRedshiftConnectivityLatticeV499 /> : null}
        {detail === "detector-admission" ? <KerrTopologyDetectorAdmissionV501 /> : null}
        {detail === "calibration-readiness" ? <KerrMeasuredCalibrationReadinessV503 /> : null}
      </Suspense>
    </section>
  );
}
