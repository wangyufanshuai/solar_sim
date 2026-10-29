"use client";

import { lazy, Suspense } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { resolveKerrPhotonMetrologyObservatoryIntentV490 } from "../lib/kerrPhotonMetrologyObservatoryIntentV490";

const KerrPhotonMetrologyCockpitV485 = lazy(() => import("./KerrPhotonMetrologyCockpitV485"));
const KerrDimensionlessPhotonAtlasV487 = lazy(() => import("./KerrDimensionlessPhotonAtlasV487"));
const KerrRedshiftContrastLatticeV489 = lazy(() => import("./KerrRedshiftContrastLatticeV489"));

export default function KerrPhotonMetrologyObservatoryIntentV490({ active }: { active: boolean }) {
  const decision = resolveKerrPhotonMetrologyObservatoryIntentV490(getAtlasDeliveryProfile(), active);
  if (!decision.observatoryImportAuthorized) return null;
  return (
    <section
      className="mt-3"
      data-atlas-kerr-photon-metrology-observatory-v490
      data-atlas-v490-delivery-profile={decision.deliveryProfile}
      data-atlas-v490-component-import-budget={decision.componentImportBudget}
      data-atlas-v490-automatic-summary-request-budget={decision.automaticSummaryRequestBudget}
      data-atlas-v490-explicit-detail-request-budget={decision.explicitDetailRequestBudget}
      data-atlas-v490-coordinate-request-by-wrapper="false"
      data-atlas-v490-contrast-request-by-wrapper="false"
      data-atlas-v490-public-panel-id-added="false"
      data-atlas-v490-canvas-created="false"
      data-atlas-v490-scene-revision-delta="0"
      data-atlas-v490-physics-mutation="false"
    >
      <div className="border-l border-cyan-100/20 pl-3 font-mono text-[8px] uppercase tracking-[.22em] text-cyan-100/45">
        Photon metrology observatory / summary + coordinate atlas + contrast lattice
      </div>
      <Suspense fallback={<Loading label="bounded metrology cockpit" />}>
        <KerrPhotonMetrologyCockpitV485 />
      </Suspense>
      <Suspense fallback={<Loading label="coordinate-atlas shell; data remains idle" />}>
        <KerrDimensionlessPhotonAtlasV487 />
      </Suspense>
      <Suspense fallback={<Loading label="contrast-lattice shell; data remains idle" />}>
        <KerrRedshiftContrastLatticeV489 />
      </Suspense>
    </section>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="mt-3 rounded border border-cyan-100/10 px-3 py-2 font-mono text-[9px] text-cyan-50/40">
      Loading {label}...
    </div>
  );
}
