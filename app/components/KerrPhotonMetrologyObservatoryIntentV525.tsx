"use client";

import { lazy, Suspense, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { KERR_PHOTON_METROLOGY_MILESTONE_CHAIN_V500 } from "../lib/kerrPhotonMetrologyObservatoryIntentV500";
import {
  resolveKerrPhotonMetrologyObservatoryIntentV525,
  type KerrPhotonMetrologyDetailSurfaceV525,
} from "../lib/kerrPhotonMetrologyObservatoryIntentV525";

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
  "direct-stokes-oracle": lazy(() => import("./KerrFixedBandStokesOracleV521")),
  "frequency-sensitivity": lazy(() => import("./KerrPolarizationFrequencySensitivityV522")),
  "ideal-analyzer-sensitivity": lazy(() => import("./KerrIdealAnalyzerSensitivityV523")),
  "analyzer-identifiability": lazy(() => import("./KerrAnalyzerIdentifiabilityV524")),
  "calibration-excitation-design": lazy(() => import("./KerrCalibrationExcitationDesignV525")),
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
  "direct-stokes-oracle": "Direct Stokes oracle",
  "frequency-sensitivity": "Frequency sensitivity",
  "ideal-analyzer-sensitivity": "Ideal analyzer",
  "analyzer-identifiability": "Rank & nullspace",
  "calibration-excitation-design": "Calibration design",
});

export default function KerrPhotonMetrologyObservatoryIntentV525({
  active,
}: Readonly<{ active: boolean }>) {
  const [detail, setDetail] = useState<KerrPhotonMetrologyDetailSurfaceV525>("none");
  const decision = resolveKerrPhotonMetrologyObservatoryIntentV525(
    getAtlasDeliveryProfile(),
    active,
  );
  if (!decision.observatoryImportAuthorized) return null;
  const Selected = detail === "none" ? null : DETAILS[detail];
  return (
    <section
      className="mt-3"
      data-atlas-kerr-photon-metrology-observatory-v525
      data-atlas-v525-detail-catalog-size={decision.detailComponentCatalogSize}
      data-atlas-v525-concurrent-detail-budget={decision.concurrentDetailSurfaceBudget}
      data-atlas-v525-candidate-constraint-count={decision.candidateConstraintCount}
      data-atlas-v525-candidate-pair-count={decision.candidatePairCount}
      data-atlas-v525-full-rank-pair-count={decision.fullRankPairCount}
      data-atlas-v525-selected-constraint-count={decision.selectedConstraintCount}
      data-atlas-v525-static-network-budget="0"
      data-atlas-v525-selected-detail={detail}
      data-atlas-v525-design-request-before-detail="false"
      data-atlas-v525-canvas-created="false"
      data-atlas-v525-scene-revision-delta="0"
      data-atlas-v525-physics-mutation="false"
    >
      <div className="grid gap-px border border-white/10 bg-white/10 lg:grid-cols-[1fr_auto]">
        <div className="bg-[#040b0c] p-3">
          <div className="font-mono text-[8px] uppercase tracking-[.22em] text-cyan-100/45">
            V491–V525 observatory / {KERR_PHOTON_METROLOGY_MILESTONE_CHAIN_V500.length} topology stages
          </div>
          <div className="mt-2 font-mono text-[8px] text-white/30">
            analyzer SVD → nullspace → minimum excitation → measured acquisition boundary
          </div>
          <div className="mt-2 font-mono text-[7px] text-amber-100/42">
            V525 · 28 candidate pairs · 9 full rank · unique D-optimal pair · measured 0/6
          </div>
        </div>
        <div className="bg-[#151006] p-3 font-mono text-[8px]" data-atlas-v525-measured-instrument-qualified="false">
          <div className="text-emerald-200/75">Design / QUALIFIED</div>
          <div className="mt-2 text-white/35">measured values / UNAVAILABLE</div>
        </div>
      </div>
      <Suspense fallback={<Loading label="bounded photon metrology summary" />}>
        <Cockpit />
      </Suspense>
      <nav className="mt-3 flex flex-wrap gap-2" aria-label="Photon metrology detail surfaces">
        {(Object.keys(DETAILS) as (keyof typeof DETAILS)[]).map((id) => (
          <button
            className={detail === id
              ? "border border-cyan-100/35 bg-cyan-100/10 px-3 py-2 font-mono text-[8px] text-cyan-50/80"
              : "border border-white/10 bg-black/20 px-3 py-2 font-mono text-[8px] text-white/35"}
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
