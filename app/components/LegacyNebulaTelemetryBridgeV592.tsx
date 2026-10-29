"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { isNebulaFocusTargetV591 } from "../lib/celestialNebulaV591";
import type { LivingUniverseFocusTargetV592 } from "../lib/nebulaVisualAssetsV592";

const ACCEPTANCE_ROOT_V592 = '[data-atlas-v592-browser-acceptance-version="v592-living-universe-browser-acceptance"]';

/**
 * Projects the sealed v591 six-nebula runtime telemetry into the additive
 * v592 namespace. The bridge is read-only and publishes no scientific state.
 */
export default function LegacyNebulaTelemetryBridgeV592({
  focusTarget,
}: Readonly<{
  focusTarget: LivingUniverseFocusTargetV592;
}>) {
  const touchedRoot = useRef<HTMLElement | null>(null);

  useFrame(() => {
    if (!isNebulaFocusTargetV591(focusTarget)) return;
    const root = document.querySelector<HTMLElement>(ACCEPTANCE_ROOT_V592);
    if (!root) return;
    touchedRoot.current = root;
    const readyIds = root.dataset.atlasV591NebulaReadyIds ?? "none";
    const requestedIds = root.dataset.atlasV591NebulaRequestedIds ?? "none";
    root.dataset.atlasV592NebulaSelectedId = focusTarget;
    root.dataset.atlasV592NebulaStatus = root.dataset.atlasV591NebulaStatus ?? "loading";
    root.dataset.atlasV592NebulaRequestedIds = requestedIds;
    root.dataset.atlasV592NebulaReadyIds = readyIds;
    root.dataset.atlasV592NebulaImpostorCount = root.dataset.atlasV591NebulaImpostorCount ?? "0";
    root.dataset.atlasV592NebulaRequestedImpostorCount = root.dataset.atlasV591NebulaRequestedImpostorCount ?? "0";
    root.dataset.atlasV592NebulaRuntimeBlockedImpostorCount = root.dataset.atlasV591NebulaRuntimeBlockedImpostorCount ?? "0";
    root.dataset.atlasV592NebulaSource = "v591-readonly-verified-nasa-overlay";
    root.dataset.atlasV592NebulaPresentationOnly = "true";
    root.dataset.atlasV592NebulaScienceImagePayload = "false";
    root.dataset.atlasV592NebulaScientificWriteback = "false";
  });

  useEffect(() => () => {
    const root = touchedRoot.current;
    if (!root) return;
    for (const key of Object.keys(root.dataset)) {
      if (key.startsWith("atlasV592Nebula") && !key.startsWith("atlasV592NebulaCamera")) delete root.dataset[key];
    }
  }, []);

  return null;
}
