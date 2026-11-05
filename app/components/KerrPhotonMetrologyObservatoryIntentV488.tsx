"use client";

import { lazy, Suspense } from "react";

import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { resolveKerrPhotonMetrologyObservatoryIntentV488 } from "../lib/kerrPhotonMetrologyObservatoryIntentV488";

const KerrPhotonMetrologyCockpitV485 = lazy(
  () => import("./KerrPhotonMetrologyCockpitV485"),
);
const KerrDimensionlessPhotonAtlasV487 = lazy(
  () => import("./KerrDimensionlessPhotonAtlasV487"),
);

export interface KerrPhotonMetrologyObservatoryIntentV488Props {
  active: boolean;
}

export default function KerrPhotonMetrologyObservatoryIntentV488({
  active,
}: KerrPhotonMetrologyObservatoryIntentV488Props) {
  const decision = resolveKerrPhotonMetrologyObservatoryIntentV488(
    getAtlasDeliveryProfile(),
    active,
  );
  if (!decision.observatoryImportAuthorized) return null;

  return (
    <section
      className="mt-3"
      data-atlas-kerr-photon-metrology-observatory-v488
      data-atlas-v488-delivery-profile={decision.deliveryProfile}
      data-atlas-v488-intent={decision.reason}
      data-atlas-v488-cockpit-summary-request-authorized={decision.cockpitSummaryRequestAuthorized}
      data-atlas-v488-coordinate-data-request-authorized-by-wrapper="false"
      data-atlas-v488-coordinate-data-requires-explicit-intent="true"
      data-atlas-v488-public-panel-id-added="false"
      data-atlas-v488-canvas-created="false"
      data-atlas-v488-scene-revision-delta="0"
      data-atlas-v488-physics-mutation="false"
    >
      <div className="border-l border-cyan-100/20 pl-3 font-mono text-[8px] uppercase tracking-[.22em] text-cyan-100/45">
        Photon metrology observatory / bounded summary + explicit coordinate drill-down
      </div>
      <Suspense
        fallback={(
          <div className="mt-3 rounded border border-cyan-100/10 px-3 py-2 font-mono text-[9px] text-cyan-50/40">
            Loading the bounded metrology cockpit...
          </div>
        )}
      >
        <KerrPhotonMetrologyCockpitV485 />
      </Suspense>
      <Suspense
        fallback={(
          <div className="mt-3 rounded border border-cyan-100/10 px-3 py-2 font-mono text-[9px] text-cyan-50/40">
            Loading the coordinate-atlas shell; science data remains idle...
          </div>
        )}
      >
        <KerrDimensionlessPhotonAtlasV487 />
      </Suspense>
    </section>
  );
}
