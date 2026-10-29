"use client";

import { lazy, Suspense, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { KERR_PHOTON_METROLOGY_MILESTONE_CHAIN_V500 } from "../lib/kerrPhotonMetrologyObservatoryIntentV500";
import {
  resolveKerrPhotonMetrologyObservatoryIntentV520,
  type KerrPhotonMetrologyDetailSurfaceV520,
} from "../lib/kerrPhotonMetrologyObservatoryIntentV520";

const Cockpit = lazy(() => import("./KerrPhotonMetrologyCockpitV485"));
const DETAILS = Object.freeze({
  "coordinate-atlas": lazy(() => import("./KerrDimensionlessPhotonAtlasV487")),
  "contrast-lattice": lazy(() => import("./KerrRedshiftContrastLatticeV489")),
  "gauge-reconstruction": lazy(() => import("./KerrRedshiftGaugeReconstructionV491")),
  "edge-redundancy": lazy(() => import("./KerrRedshiftEdgeRedundancyV493")),
  "double-edge-identifiability": lazy(() => import("./KerrRedshiftDoubleEdgeIdentifiabilityV495")),
  "minimum-cut": lazy(() => import("./KerrRedshiftMinimumCutV497")),
  "connectivity-lattice": lazy(() => import("./KerrRedshiftConnectivityLatticeV499")),
  "detector-admission": lazy(() => import("./KerrTopologyDetectorAdmissionV501")),
  "calibration-readiness": lazy(() => import("./KerrMeasuredCalibrationReadinessV503")),
  "candidate-preflight": lazy(() => import("./KerrMeasuredCalibrationPreflightV504")),
  "detector-timeline": lazy(() => import("./KerrDetectorEvidenceTimelineV509")),
  "detector-provenance": lazy(() => import("./KerrDetectorProvenanceEnvelopeV510")),
  "instrument-authority": lazy(() => import("./KerrInstrumentAuthorityMatrixV511")),
  "science-product-eligibility": lazy(() => import("./KerrScienceProductEligibilityGraphV512")),
  "product-uncertainty": lazy(() => import("./KerrProductUncertaintyEligibilityV513")),
  "uncertainty-visual-ab": lazy(() => import("./KerrUncertaintyVisualABV514")),
  "uncertainty-replay": lazy(() => import("./KerrUncertaintyReplayLedgerV515")),
  "uncertainty-witness": lazy(() => import("./KerrUncertaintyReplayWitnessV516")),
  "independent-verification": lazy(() => import("./KerrUncertaintyIndependentVerificationV517")),
  "provenance-constellation": lazy(() => import("./KerrProvenanceConstellationV518")),
  "radiometry-oracle": lazy(() => import("./KerrFixedBandRadiometryOracleV519")),
  "fixed-band-stokes": lazy(() => import("./KerrFixedBandStokesV520")),
});
const LABELS: Readonly<Record<keyof typeof DETAILS, string>> = Object.freeze({
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
  "science-product-eligibility": "Product eligibility",
  "product-uncertainty": "Product uncertainty",
  "uncertainty-visual-ab": "Uncertainty A/B",
  "uncertainty-replay": "512× replay",
  "uncertainty-witness": "Witness chain",
  "independent-verification": "Independent proof",
  "provenance-constellation": "Proof constellation",
  "radiometry-oracle": "Radiometry oracle",
  "fixed-band-stokes": "Fixed-band Stokes",
});

export default function KerrPhotonMetrologyObservatoryIntentV520({
  active,
}: Readonly<{ active: boolean }>) {
  const [detail, setDetail] = useState<KerrPhotonMetrologyDetailSurfaceV520>("none");
  const decision = resolveKerrPhotonMetrologyObservatoryIntentV520(
    getAtlasDeliveryProfile(),
    active,
  );
  if (!decision.observatoryImportAuthorized) return null;
  const Selected = detail === "none" ? null : DETAILS[detail];
  return (
    <section
      className="mt-3"
      data-atlas-kerr-photon-metrology-observatory-v520
      data-atlas-v520-detail-catalog-size={decision.detailComponentCatalogSize}
      data-atlas-v520-concurrent-detail-budget={decision.concurrentDetailSurfaceBudget}
      data-atlas-v520-stokes-ray-count={decision.stokesRayCount}
      data-atlas-v520-stokes-band-count={decision.stokesBandCount}
      data-atlas-v520-stokes-method-count={decision.stokesTransportMethodCount}
      data-atlas-v520-stokes-row-count={decision.stokesRowCount}
      data-atlas-v520-static-network-budget="0"
      data-atlas-v520-selected-detail={detail}
      data-atlas-v520-stokes-request-before-detail="false"
      data-atlas-v520-canvas-created="false"
      data-atlas-v520-scene-revision-delta="0"
      data-atlas-v520-physics-mutation="false"
    >
      <div className="grid gap-px border border-white/10 bg-white/10 lg:grid-cols-[1fr_auto]">
        <div className="bg-[#040b0c] p-3">
          <div className="font-mono text-[8px] uppercase tracking-[.22em] text-cyan-100/45">
            V491–V520 observatory / {KERR_PHOTON_METROLOGY_MILESTONE_CHAIN_V500.length} topology stages
          </div>
          <div className="mt-2 font-mono text-[8px] text-white/30">
            geometry → radiometry → dual-path linear Stokes → bounded provenance
          </div>
          <div className="mt-2 font-mono text-[7px] text-amber-100/42">
            V520 · 4 rays × 3 bands × 2 methods · 24 predicted I/Q/U rows
          </div>
        </div>
        <div className="bg-[#07140e] p-3 font-mono text-[8px]" data-atlas-v520-stokes-qualified="true">
          <div className="text-emerald-200/75">Fixed-band Stokes / QUALIFIED</div>
          <div className="mt-2 text-white/35">model prediction only · measured rows 0</div>
        </div>
      </div>
      <Suspense fallback={<Loading label="bounded photon metrology summary" />}>
        <Cockpit />
      </Suspense>
      <nav className="mt-3 flex flex-wrap gap-2" aria-label="Photon metrology detail surfaces">
        {(Object.keys(DETAILS) as (keyof typeof DETAILS)[]).map((id) => (
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
            {LABELS[id]}
          </button>
        ))}
      </nav>
      <Suspense fallback={<Loading label="explicit detail surface" />}>
        {Selected ? <Selected /> : null}
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
