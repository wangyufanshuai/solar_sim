"use client";

import { useCallback, useSyncExternalStore } from "react";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import {
  getAtlasStrongGravityTelemetrySnapshotV309,
  subscribeAtlasStrongGravityTelemetryV309,
} from "../lib/atlasStrongGravityTelemetryV309";
import { createKerrScienceBandHudModelV322 } from "../lib/kerrScienceBandHudV322";
import { createKerrScienceBandProvenanceV323, serializeKerrScienceBandProvenanceCsvV323, serializeKerrScienceBandProvenanceJsonV323 } from "../lib/kerrScienceBandProvenanceV323";
import { compareKerrScienceProfilesV324 } from "../lib/kerrScienceProfileABV324";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300, resolveAtlasVisualProfileV299, type AtlasVisualRendererProfileV299 } from "../lib/atlasVisualProfileV299";
import KerrScienceBandUncertaintyV325 from "./KerrScienceBandUncertaintyV325";
import KerrScienceCinematicABV327 from "./KerrScienceCinematicABV327";
import KerrScienceObservatoryHeaderV333 from "./KerrScienceObservatoryHeaderV333";
import KerrSciencePhotonBandsV328 from "./KerrSciencePhotonBandsV328";

export default function KerrScienceBandHudV322({
  profile,
  mode,
}: {
  readonly profile: AtlasVisualRendererProfileV299;
  readonly mode: "science" | "cinematic";
}) {
  const telemetry = useSyncExternalStore(
    subscribeAtlasStrongGravityTelemetryV309,
    getAtlasStrongGravityTelemetrySnapshotV309,
    getAtlasStrongGravityTelemetrySnapshotV309,
  );
  const model = createKerrScienceBandHudModelV322(telemetry, profile, mode);
  const profileAB = compareKerrScienceProfilesV324(
    resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V299),
    resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V300),
    model,
  );
  const download = useCallback(async (kind: "json" | "csv") => {
    if (model.status !== "ready") return;
    const provenance = await createKerrScienceBandProvenanceV323(model);
    const content = kind === "json" ? serializeKerrScienceBandProvenanceJsonV323(provenance) : serializeKerrScienceBandProvenanceCsvV323(provenance);
    const blob = new Blob([content], { type: kind === "json" ? "application/json" : "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const release = acquireAtlasResource("object-url", "kerr", `science-band-provenance-v323:${kind}`, { owner: "strong-gravity-science", estimatedBytes: blob.size });
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `orbit-atlas-kerr-science-band-v323.${kind}`;
    anchor.click();
    queueMicrotask(() => { URL.revokeObjectURL(url); release(); });
  }, [model]);
  if (model.status === "hidden-cinematic") return null;
  return (
    <section
      className="mt-2 overflow-hidden rounded-xl border border-cyan-100/10 bg-[rgba(2,7,13,0.72)] p-1.5"
      data-kerr-science-band-hud-v322={model.status}
      data-kerr-science-band-hud-profile={model.profileId}
      data-kerr-science-band-hud-token-source={model.tokenSource}
      data-kerr-science-band-hud-boundary={model.boundary}
      data-kerr-science-band-hud-normalization={model.normalization}
      data-kerr-science-band-hud-provenance-v323={model.status === "ready" ? "available" : "pending"}
      data-kerr-science-profile-ab-v324={profileAB.status}
      data-kerr-science-profile-ab-digest-stable-v324={String(profileAB.scienceDigestStable)}
      data-kerr-science-observatory-v333="precision-instrument-runtime-consumer"
    >
      <KerrScienceObservatoryHeaderV333 model={model} profileAB={profileAB} onDownload={(kind) => { void download(kind); }} />
      <KerrScienceCinematicABV327 mode={mode} />
      <KerrScienceBandUncertaintyV325 mode={mode} />
      <KerrSciencePhotonBandsV328 mode={mode} />
    </section>
  );
}
