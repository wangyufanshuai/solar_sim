"use client";

import { lazy, Suspense } from "react";

import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { resolveKerrPhotonMetrologyIntentV486 } from "../lib/kerrPhotonMetrologyIntentV486";

const KerrPhotonMetrologyCockpitV485 = lazy(
  () => import("./KerrPhotonMetrologyCockpitV485"),
);

export interface KerrPhotonMetrologyCockpitIntentV486Props {
  active: boolean;
}

export default function KerrPhotonMetrologyCockpitIntentV486({
  active,
}: KerrPhotonMetrologyCockpitIntentV486Props) {
  const decision = resolveKerrPhotonMetrologyIntentV486(getAtlasDeliveryProfile(), active);
  if (!decision.componentImportAuthorized) return null;

  return (
    <div
      data-atlas-kerr-photon-metrology-intent-v486
      data-atlas-v486-delivery-profile={decision.deliveryProfile}
      data-atlas-v486-intent={decision.reason}
      data-atlas-v486-summary-request-authorized={decision.summaryRequestAuthorized}
      data-atlas-v486-public-panel-id-added="false"
      data-atlas-v486-canvas-created="false"
      data-atlas-v486-scene-revision-delta="0"
      data-atlas-v486-physics-mutation="false"
    >
      <Suspense
        fallback={(
          <div
            className="mt-3 rounded border border-cyan-100/10 bg-cyan-100/[0.025] px-3 py-2 font-mono text-[9px] text-cyan-50/45"
            data-atlas-v486-cockpit-load-state="loading"
          >
            Loading the bounded photon metrology summary…
          </div>
        )}
      >
        <KerrPhotonMetrologyCockpitV485 />
      </Suspense>
    </div>
  );
}
