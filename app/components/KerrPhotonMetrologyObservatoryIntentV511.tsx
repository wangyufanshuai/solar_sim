"use client";

import { lazy, Suspense, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { KERR_PHOTON_METROLOGY_MILESTONE_CHAIN_V500 } from "../lib/kerrPhotonMetrologyObservatoryIntentV500";
import {
  resolveKerrPhotonMetrologyObservatoryIntentV511,
  type KerrPhotonMetrologyDetailSurfaceV511,
} from "../lib/kerrPhotonMetrologyObservatoryIntentV511";

const KerrPhotonMetrologyCockpitV485 = lazy(() => import("./KerrPhotonMetrologyCockpitV485"));
const DETAIL_COMPONENTS = Object.freeze({
  "coordinate-atlas": lazy(() => import("./KerrDimensionlessPhotonAtlasV487")),
  "contrast-lattice": lazy(() => import("./KerrRedshiftContrastLatticeV489")),
  "gauge-reconstruction": lazy(() => import("./KerrRedshiftGaugeReconstructionV491")),
  "edge-redundancy": lazy(() => import("./KerrRedshiftEdgeRedundancyV493")),
  "double-edge-identifiability": lazy(
    () => import("./KerrRedshiftDoubleEdgeIdentifiabilityV495"),
  ),
  "minimum-cut": lazy(() => import("./KerrRedshiftMinimumCutV497")),
  "connectivity-lattice": lazy(() => import("./KerrRedshiftConnectivityLatticeV499")),
  "detector-admission": lazy(() => import("./KerrTopologyDetectorAdmissionV501")),
  "calibration-readiness": lazy(() => import("./KerrMeasuredCalibrationReadinessV503")),
  "candidate-preflight": lazy(() => import("./KerrMeasuredCalibrationPreflightV504")),
  "detector-timeline": lazy(() => import("./KerrDetectorEvidenceTimelineV509")),
  "detector-provenance": lazy(() => import("./KerrDetectorProvenanceEnvelopeV510")),
  "instrument-authority": lazy(() => import("./KerrInstrumentAuthorityMatrixV511")),
});
const DETAIL_LABELS: Readonly<Record<keyof typeof DETAIL_COMPONENTS, string>> = Object.freeze({
  "coordinate-atlas": "Coordinate atlas",
  "contrast-lattice": "Contrast lattice",
  "gauge-reconstruction": "Gauge reconstruction",
  "edge-redundancy": "Edge redundancy",
  "double-edge-identifiability": "Double-edge audit",
  "minimum-cut": "Minimum-cut audit",
  "connectivity-lattice": "Connectivity lattice",
  "detector-admission": "Detector airlock",
  "calibration-readiness": "Calibration readiness",
  "candidate-preflight": "Candidate preflight",
  "detector-timeline": "Evidence timeline",
  "detector-provenance": "Portable provenance",
  "instrument-authority": "Instrument authority",
});

export default function KerrPhotonMetrologyObservatoryIntentV511({
  active,
}: Readonly<{ active: boolean }>) {
  const [detail, setDetail] = useState<KerrPhotonMetrologyDetailSurfaceV511>("none");
  const decision = resolveKerrPhotonMetrologyObservatoryIntentV511(
    getAtlasDeliveryProfile(),
    active,
  );
  if (!decision.observatoryImportAuthorized) return null;
  const SelectedDetail = detail === "none" ? null : DETAIL_COMPONENTS[detail];
  return (
    <section
      className="mt-3"
      data-atlas-kerr-photon-metrology-observatory-v511
      data-atlas-v511-automatic-component-budget={decision.automaticComponentImportBudget}
      data-atlas-v511-detail-catalog-size={decision.detailComponentCatalogSize}
      data-atlas-v511-concurrent-detail-budget={decision.concurrentDetailSurfaceBudget}
      data-atlas-v511-static-stage-count={decision.staticAuthorityStageCount}
      data-atlas-v511-portable-provenance-stage-count={decision.portableProvenanceStageCount}
      data-atlas-v511-instrument-authority-stage-count={decision.instrumentAuthorityStageCount}
      data-atlas-v511-static-network-budget="0"
      data-atlas-v511-selected-detail={detail}
      data-atlas-v511-detail-data-request-by-wrapper="false"
      data-atlas-v511-instrument-matrix-request-before-detail="false"
      data-atlas-v511-canvas-created="false"
      data-atlas-v511-scene-revision-delta="0"
      data-atlas-v511-physics-mutation="false"
    >
      <div className="grid gap-px border border-white/10 bg-white/10 lg:grid-cols-[1fr_auto]">
        <div className="bg-[#040b0c] p-3">
          <div className="font-mono text-[8px] uppercase tracking-[.22em] text-cyan-100/45">
            V491–V511 observatory chain / {KERR_PHOTON_METROLOGY_MILESTONE_CHAIN_V500.length} qualified topology stages
          </div>
          <div className="mt-2 font-mono text-[8px] text-white/30">
            topology → calibration airlock → provenance → instrument authority matrix
          </div>
          <div className="mt-2 font-mono text-[7px] text-amber-100/42">
            V511 · six canonical instrument stages · response exactly once · null-not-zero
          </div>
        </div>
        <div
          className="bg-[#170808] p-3 font-mono text-[8px]"
          data-atlas-v511-detector-authority="false"
        >
          <div className="text-red-200/75">Measured detector authority / BLOCKED</div>
          <div className="mt-2 text-white/35">
            files 0/6 · response unavailable · counts unavailable · raster unavailable
          </div>
        </div>
      </div>
      <Suspense fallback={<Loading label="bounded photon metrology summary" />}>
        <KerrPhotonMetrologyCockpitV485 />
      </Suspense>
      <nav className="mt-3 flex flex-wrap gap-2" aria-label="Photon metrology detail surfaces">
        {(Object.keys(DETAIL_COMPONENTS) as (keyof typeof DETAIL_COMPONENTS)[]).map((id) => (
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
        ))}
      </nav>
      <Suspense fallback={<Loading label="explicit detail surface" />}>
        {SelectedDetail ? <SelectedDetail /> : null}
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
