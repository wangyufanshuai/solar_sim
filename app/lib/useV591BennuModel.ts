"use client";

import { useEffect, useState } from "react";

import { CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591 } from "../data/celestialConvergenceAssetsV591.generated";
import { acquireAtlasResource } from "./atlasResourceLifecycle";
import type { CelestialDeliveryTierV590, CelestialDeviceTierV590 } from "./celestialRenderingV590";
import { useV589Model, type V589ModelLoadState } from "./useV589Model";
import { loadBennuAssetOverlayV591 } from "./useV591Texture";

type OverlayVerificationStateV591 = Readonly<{
  status: "idle" | "loading" | "ready" | "blocked";
  reason: string;
}>;

const BLOCKED_MODEL_V591: V589ModelLoadState = Object.freeze({
  scene: null,
  status: "blocked",
  assetId: "bennu-model",
  sha256: "none",
  lod: null,
  sourceBytes: 0,
  estimatedGpuBytes: 0,
  reason: "v591-bennu-model-overlay-not-verified",
});

/**
 * v591 owns only an audited zero-byte reference. The physical NASA model and
 * its three meshopt LODs remain exact-byte, read-only v589 dependencies.
 */
export function useV591InheritedBennuModel(
  deliveryTier: CelestialDeliveryTierV590,
  deviceTier: CelestialDeviceTierV590,
  preferredLod: 0 | 1 | 2,
  enabled = true,
): V589ModelLoadState {
  const [overlay, setOverlay] = useState<OverlayVerificationStateV591>({ status: "idle", reason: "none" });
  useEffect(() => {
    const abort = new AbortController();
    if (!enabled) {
      setOverlay({ status: "idle", reason: "none" });
      return () => abort.abort();
    }
    setOverlay({ status: "loading", reason: "none" });
    void loadBennuAssetOverlayV591(abort.signal)
      .then(() => {
        if (!abort.signal.aborted) setOverlay({ status: "ready", reason: "verified-v589-model-overlay" });
      })
      .catch((error: unknown) => {
        if (!abort.signal.aborted) setOverlay({
          status: "blocked",
          reason: error instanceof Error ? error.message : "v591-bennu-model-overlay-unknown",
        });
      });
    return () => abort.abort();
  }, [enabled]);

  const inherited = useV589Model(
    "bennu-model",
    deliveryTier,
    deviceTier,
    preferredLod,
    enabled && overlay.status === "ready",
  );

  useEffect(() => {
    if (overlay.status !== "ready" || inherited.status !== "ready" || inherited.lod === null) return;
    return acquireAtlasResource("model", "atlas", `v591-bennu-model-reference-lod${inherited.lod}`, {
      owner: "v591-celestial-convergence",
      estimatedBytes: 0,
      contentSha256: inherited.sha256,
      manifestSha256: CELESTIAL_CONVERGENCE_BENNU_ASSET_OVERLAY_SHA256_V591,
    });
  }, [inherited.lod, inherited.sha256, inherited.status, overlay.status]);

  if (!enabled) return { ...BLOCKED_MODEL_V591, status: "idle", reason: "none" };
  if (overlay.status === "blocked") return { ...BLOCKED_MODEL_V591, reason: overlay.reason };
  if (overlay.status !== "ready") return { ...BLOCKED_MODEL_V591, status: "loading", reason: overlay.reason };
  return inherited;
}
