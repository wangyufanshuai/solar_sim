"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { ATLAS_V594_BUILD_IDENTITY } from "../lib/atlasV594BuildIdentity";
import {
  ATLAS_V595_BUILD_IDENTITY,
  createAtlasV595BuildIdentity,
} from "../lib/atlasV595BuildIdentity";
import {
  STELLAR_HERO_BY_ID_V592,
  type StellarHeroIdV592,
} from "../lib/stellarHeroesV592";
import {
  POST_V594_CDP_SOAK_CANDIDATE_OBSERVER_VERSION,
  POST_V594_CDP_SOAK_PROFILES,
  POST_V594_CDP_SOAK_SURFACE_VERSION,
  createPostV594CdpSoakRuntimeRequest,
  type PostV594CdpSoakProfile,
} from "../lib/v594CdpSoakSurface";
import {
  POST_V594_BUILD_IDENTITY,
  POST_V594_LIFECYCLE_SAMPLE_INTERVAL_MILLISECONDS,
  POST_V594_LIFECYCLE_STABLE_MILLISECONDS,
  POST_V594_SAME_REALM_LIFECYCLE_QUERY,
  POST_V594_SAME_REALM_LIFECYCLE_VERSION,
  beginPostV594SameRealmLifecycleLedger,
  createPostV594NoCanvasSnapshot,
  getPostV594SameRealmLifecycleLedger,
  postV594BaselineSnapshotIsObserved,
  postV594LifecycleSnapshotStabilityKey,
  postV594SnapshotSatisfiesReleaseContract,
  recordPostV594LifecycleExitObservation,
  recordPostV594LifecyclePhase,
  recordPostV594LifecycleSnapshot,
  type PostV594LifecycleExitObservation,
  type PostV594LifecycleSnapshot,
  type PostV594SameRealmLifecyclePhase,
} from "../lib/postV594SameRealmLifecycle";
import {
  V594_EXACT_AB_CONSUMER_RECEIPT_VERSION,
  V594_EXACT_AB_RUNTIME_VERSION,
  createV594StellarRenderProfile,
  type V594ExactAbConsumerReceipt,
  type V594ExactAbRuntimeRequest,
} from "../lib/v594ExactAbContract";
import {
  V595_EXACT_AB_CONSUMER_RECEIPT_VERSION,
  V595_EXACT_AB_RUNTIME_VERSION,
  createV595ExactAbRuntimeRequest,
  createV595StellarRenderProfile,
  type V595ExactAbConsumerReceipt,
  type V595ExactAbRuntimeRequest,
} from "../lib/v595ExactAbContract";
import { ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY } from "../lib/atlasV596VisualCheckpointIdentity";
import {
  V596_VISUAL_CHECKPOINT_CONSUMER_RECEIPT_VERSION,
  V596_VISUAL_CHECKPOINT_RUNTIME_VERSION,
  createV596StellarRenderProfile,
  createV596VisualCheckpointRuntimeRequest,
  type V596VisualCheckpointConsumerReceipt,
  type V596VisualCheckpointRuntimeRequest,
} from "../lib/v596VisualCheckpointContract";
import type { AtlasRuntimeWorkbenchDomains } from "./atlasRuntimeWorkbenchDomains";
import AtlasAppShell from "./AtlasAppShell";
import AtlasRuntimeSceneLayer from "./AtlasRuntimeSceneLayer";

const SUN_BODY_INDEX = SOLAR_SYSTEM_BODIES.findIndex((body) => body.id === "sun");
const V595_CDP_SOAK_IDENTITY_ADAPTER_VERSION =
  "v595-current-identity-over-inherited-v594-cdp-soak-surface-v2" as const;
const V596_CDP_SOAK_PARENT_V595_IDENTITY = createAtlasV595BuildIdentity({
  sourceManifestSha256:
    ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY.parentV595.sourceManifestSha256,
  candidateManifestSha256:
    ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY.parentV595.candidateManifestSha256,
  buildFingerprint:
    ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY.parentV595.buildId.slice("v595b-".length),
  buildId: ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY.parentV595.buildId,
  deploymentId: ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY.parentV595.deploymentId,
  deliveryTier: "standalone-full",
  nodeEnv: "production",
});

type CdpSoakExactRequest =
  | V594ExactAbRuntimeRequest
  | V595ExactAbRuntimeRequest
  | V596VisualCheckpointRuntimeRequest;
type CdpSoakExactReceipt =
  | V594ExactAbConsumerReceipt
  | V595ExactAbConsumerReceipt
  | V596VisualCheckpointConsumerReceipt;

function stellarDirection(heroId: StellarHeroIdV592): [number, number, number] {
  const hero = STELLAR_HERO_BY_ID_V592[heroId];
  const ra = hero.raDeg * Math.PI / 180;
  const dec = hero.decDeg * Math.PI / 180;
  return [Math.cos(dec) * Math.cos(ra), Math.sin(dec), Math.cos(dec) * Math.sin(ra)];
}

function profileMatchesReceipt(
  profile: PostV594CdpSoakProfile,
  receipt: CdpSoakExactReceipt,
): boolean {
  if (receipt.version === V596_VISUAL_CHECKPOINT_CONSUMER_RECEIPT_VERSION) {
    return profile.kind === "stellar"
      && receipt.frame.candidate === "v596"
      && receipt.frame.targetId === profile.targetId
      && receipt.frame.archetype === profile.requestArchetype
      && receipt.frame.mode === profile.mode
      && receipt.snapshot.captureKind === "mounted-renderer"
      && receipt.snapshot.canvas.count === 1
      && receipt.snapshot.canvas.connected === 1
      && receipt.settle.stableForMilliseconds >= 1_000;
  }
  const expectedLane = receipt.version === V595_EXACT_AB_CONSUMER_RECEIPT_VERSION
    ? "candidate-v595"
    : "candidate-v594";
  return receipt.frame.lane === expectedLane
    && receipt.frame.targetId === profile.targetId
    && receipt.frame.archetype === profile.requestArchetype
    && receipt.frame.mode === profile.mode
    && receipt.soakObservability.profileKey === profile.key
    && receipt.soakObservability.profile.targetId === profile.targetId
    && receipt.soakObservability.profile.archetype === profile.archetype
    && receipt.soakObservability.profile.kind === profile.kind
    && receipt.soakObservability.profile.stable === true;
}

export default function V594CdpSoakSurface({
  domains,
}: Readonly<{
  domains: AtlasRuntimeWorkbenchDomains;
}>) {
  const [phase, setPhase] = useState<PostV594SameRealmLifecyclePhase>("baseline-pending");
  const [sceneMounted, setSceneMounted] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PostV594CdpSoakProfile | null>(null);
  const [exactRequest, setExactRequest] = useState<CdpSoakExactRequest | null>(null);
  const [exactReceipt, setExactReceipt] = useState<CdpSoakExactReceipt | null>(null);
  const repeatRequestedRef = useRef(false);
  const { atlasShellSceneMode } = domains.shellHud;
  const { atlasRuntimeQualityTier } = domains.scene;
  const {
    onBodyFocusFromList,
    onNearbyStarFocus,
    selectedCelestialCatalogId,
  } = domains.navigationFocus;
  const { setIsPlaying, simDaysRef } = domains.timelinePhysics;

  const beginBaselineObservation = useCallback(() => {
    beginPostV594SameRealmLifecycleLedger();
    setPhase("baseline-pending");
    setSceneMounted(false);
    setSelectedProfile(null);
    setExactRequest(null);
    setExactReceipt(null);
  }, []);

  useEffect(() => {
    setIsPlaying(false);
    simDaysRef.current = 0;
    beginBaselineObservation();
  }, [beginBaselineObservation, setIsPlaying, simDaysRef]);

  useEffect(() => {
    if (phase !== "baseline-pending") return;
    let stableKey: string | null = null;
    let stableSince = 0;
    let published = false;
    const sampleBaseline = () => {
      if (published) return;
      const root = document.querySelector<HTMLElement>("[data-atlas-v594-lifecycle-root]");
      const canvases = root ? Array.from(root.querySelectorAll("canvas")) : null;
      const snapshot = createPostV594NoCanvasSnapshot({
        canvasCount: canvases?.length ?? null,
        connectedCanvasCount: canvases?.filter((canvas) => canvas.isConnected).length ?? null,
      });
      if (!postV594BaselineSnapshotIsObserved(snapshot)) {
        stableKey = null;
        stableSince = 0;
        return;
      }
      const nextKey = postV594LifecycleSnapshotStabilityKey(snapshot);
      const now = performance.now();
      if (stableKey !== nextKey) {
        stableKey = nextKey;
        stableSince = now;
        return;
      }
      if (now - stableSince < POST_V594_LIFECYCLE_STABLE_MILLISECONDS) return;
      published = true;
      recordPostV594LifecycleSnapshot("baseline", snapshot);
      setPhase("baseline");
      window.clearInterval(timer);
    };
    const timer = window.setInterval(
      sampleBaseline,
      POST_V594_LIFECYCLE_SAMPLE_INTERVAL_MILLISECONDS,
    );
    sampleBaseline();
    return () => window.clearInterval(timer);
  }, [phase]);

  const selectProfile = useCallback((profile: PostV594CdpSoakProfile) => {
    if (
      phase !== "baseline"
      || getPostV594SameRealmLifecycleLedger()?.phase !== "baseline"
    ) return;
    setSelectedProfile(profile);
    setExactRequest(null);
    setExactReceipt(null);
    if (profile.kind === "relativity") {
      if (SUN_BODY_INDEX < 0) throw new Error("v594-cdp-soak-sun-missing");
      onBodyFocusFromList(SUN_BODY_INDEX);
      return;
    }
    const heroId = profile.targetId as StellarHeroIdV592;
    if (!STELLAR_HERO_BY_ID_V592[heroId]) throw new Error("v594-cdp-soak-hero-missing");
    onNearbyStarFocus(stellarDirection(heroId), `stellar-hero:${heroId}`);
  }, [onBodyFocusFromList, onNearbyStarFocus, phase]);

  const mountScene = useCallback(() => {
    const baseline = getPostV594SameRealmLifecycleLedger()?.snapshots.baseline;
    if (
      phase !== "baseline"
      || !selectedProfile
      || !baseline
      || !postV594BaselineSnapshotIsObserved(baseline)
    ) return;
    setIsPlaying(false);
    simDaysRef.current = 0;
    let request: CdpSoakExactRequest;
    if (ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY.bindingStatus === "bound") {
      request = selectedProfile.kind === "stellar"
        ? createV596VisualCheckpointRuntimeRequest({
          targetId: selectedProfile.targetId,
          archetype: selectedProfile.requestArchetype,
          mode: selectedProfile.mode === "science" ? "science" : "cinematic",
          identity: ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY,
        })
        : createV595ExactAbRuntimeRequest({
          lane: "candidate-v595",
          targetId: selectedProfile.targetId,
          archetype: selectedProfile.requestArchetype,
          mode: selectedProfile.mode,
          identity: V596_CDP_SOAK_PARENT_V595_IDENTITY,
        });
    } else if (ATLAS_V595_BUILD_IDENTITY.bindingStatus === "bound") {
      request = createV595ExactAbRuntimeRequest({
        lane: "candidate-v595",
        targetId: selectedProfile.targetId,
        archetype: selectedProfile.requestArchetype,
        mode: selectedProfile.mode,
        identity: ATLAS_V595_BUILD_IDENTITY,
      });
    } else {
      request = createPostV594CdpSoakRuntimeRequest(
        selectedProfile,
        ATLAS_V594_BUILD_IDENTITY,
      );
    }
    setExactReceipt(null);
    setExactRequest(request);
    recordPostV594LifecyclePhase("mounting");
    setPhase("mounting");
    setSceneMounted(true);
  }, [phase, selectedProfile, setIsPlaying, simDaysRef]);

  const handleExactReceipt = useCallback((receipt: CdpSoakExactReceipt) => {
    if (
      phase !== "mounting"
      || !selectedProfile
      || receipt.captureRequestId !== exactRequest?.captureRequestId
      || !profileMatchesReceipt(selectedProfile, receipt)
    ) return;
    setExactReceipt(receipt);
    recordPostV594LifecyclePhase("mounted");
    setPhase("mounted");
  }, [exactRequest?.captureRequestId, phase, selectedProfile]);

  const stabilizeProfile = useCallback(() => {
    if (
      phase !== "mounted"
      || !selectedProfile
      || !exactReceipt
      || getPostV594SameRealmLifecycleLedger()?.phase !== "mounted"
      || !profileMatchesReceipt(selectedProfile, exactReceipt)
    ) return;
    recordPostV594LifecyclePhase("profile-stable");
    setPhase("profile-stable");
  }, [exactReceipt, phase, selectedProfile]);

  const recordRendererSnapshot = useCallback((
    nextPhase: "mounted" | "detached-stable" | "exited",
    snapshot: PostV594LifecycleSnapshot,
  ) => {
    if (nextPhase === "mounted") return;
    if (!postV594SnapshotSatisfiesReleaseContract(snapshot)) return;
    recordPostV594LifecycleSnapshot(nextPhase, snapshot);
    if (nextPhase === "detached-stable") setPhase("detached-stable");
  }, []);

  const recordExitObservation = useCallback((
    observation: PostV594LifecycleExitObservation,
  ) => {
    const ledger = recordPostV594LifecycleExitObservation(observation);
    if (
      observation.observerReleased === true
      && repeatRequestedRef.current
      && ledger?.phase === "resetting"
    ) {
      repeatRequestedRef.current = false;
      beginBaselineObservation();
    }
  }, [beginBaselineObservation]);

  const detachScene = useCallback(() => {
    if (
      phase !== "profile-stable"
      || !selectedProfile
      || !exactReceipt
      || getPostV594SameRealmLifecycleLedger()?.phase !== "profile-stable"
      || !profileMatchesReceipt(selectedProfile, exactReceipt)
    ) return;
    recordPostV594LifecyclePhase("detaching");
    setPhase("detaching");
    setSceneMounted(false);
  }, [exactReceipt, phase, selectedProfile]);

  const repeatCycle = useCallback(() => {
    if (
      phase !== "detached-stable"
      || getPostV594SameRealmLifecycleLedger()?.phase !== "detached-stable"
    ) return;
    repeatRequestedRef.current = true;
    recordPostV594LifecyclePhase("resetting");
    setPhase("resetting");
  }, [phase]);

  const stellarRenderProfile = useMemo(() => {
    if (!exactRequest) return undefined;
    if (exactRequest.version === V596_VISUAL_CHECKPOINT_RUNTIME_VERSION) {
      return createV596StellarRenderProfile(exactRequest);
    }
    if (exactRequest.version === V595_EXACT_AB_RUNTIME_VERSION) {
      return createV595StellarRenderProfile(exactRequest) ?? undefined;
    }
    if (exactRequest.version === V594_EXACT_AB_RUNTIME_VERSION) {
      return createV594StellarRenderProfile(exactRequest) ?? undefined;
    }
    return undefined;
  }, [exactRequest]);
  const candidateObserverActive = selectedProfile !== null
    && exactReceipt !== null
    && (phase === "mounted" || phase === "profile-stable")
    && profileMatchesReceipt(selectedProfile, exactReceipt);

  return (
    <AtlasAppShell
      className="relative h-[100dvh] w-screen overflow-hidden bg-[#030303] text-white"
      sceneMode={atlasShellSceneMode}
      qualityTier={atlasRuntimeQualityTier}
      selectedObjectId={selectedProfile?.targetId ?? ""}
      data-atlas-v594-lifecycle-root
      data-atlas-v594-lifecycle-audit={POST_V594_SAME_REALM_LIFECYCLE_QUERY}
      data-atlas-v594-lifecycle-version={POST_V594_SAME_REALM_LIFECYCLE_VERSION}
      data-atlas-v594-lifecycle-phase={phase}
      data-atlas-v594-lifecycle-canvas-mounted={sceneMounted ? "true" : "false"}
      data-atlas-v594-cdp-soak={POST_V594_CDP_SOAK_SURFACE_VERSION}
      data-atlas-v595-cdp-soak-identity-adapter={
        ATLAS_V595_BUILD_IDENTITY.bindingStatus === "bound"
          ? V595_CDP_SOAK_IDENTITY_ADAPTER_VERSION
          : "inactive"
      }
      data-atlas-v595-cdp-soak-instrumentation="inherited-v594-same-realm-renderer-observability"
      data-atlas-v595-cdp-soak-binding-status={ATLAS_V595_BUILD_IDENTITY.bindingStatus}
      data-atlas-v595-cdp-soak-source-manifest-sha256={ATLAS_V595_BUILD_IDENTITY.sourceManifestSha256}
      data-atlas-v595-cdp-soak-candidate-manifest-sha256={ATLAS_V595_BUILD_IDENTITY.candidateManifestSha256}
      data-atlas-v595-cdp-soak-build-fingerprint={ATLAS_V595_BUILD_IDENTITY.buildFingerprint}
      data-atlas-v595-cdp-soak-build-id={ATLAS_V595_BUILD_IDENTITY.buildId}
      data-atlas-v595-cdp-soak-deployment-id={ATLAS_V595_BUILD_IDENTITY.deploymentId}
      data-atlas-v594-cdp-soak-profile={selectedProfile?.key ?? "none"}
      data-atlas-v594-cdp-soak-target={selectedProfile?.targetId ?? "none"}
      data-atlas-candidate={candidateObserverActive
        ? exactReceipt?.version === V596_VISUAL_CHECKPOINT_CONSUMER_RECEIPT_VERSION
          ? "v596"
          : exactReceipt?.version === V595_EXACT_AB_CONSUMER_RECEIPT_VERSION
            ? "v595"
            : "v594"
        : undefined}
      data-atlas-v594-cdp-soak-candidate-observer={candidateObserverActive
        ? POST_V594_CDP_SOAK_CANDIDATE_OBSERVER_VERSION
        : undefined}
      data-atlas-v594-cdp-soak-observer-profile-key={candidateObserverActive
        ? selectedProfile.key
        : undefined}
      data-atlas-v594-cdp-soak-observer-target-id={candidateObserverActive
        ? selectedProfile.targetId
        : undefined}
      data-atlas-v594-cdp-soak-observer-kind={candidateObserverActive
        ? selectedProfile.kind
        : undefined}
      data-atlas-v594-scene-census-authority={candidateObserverActive ? "false" : undefined}
      data-atlas-v594-lifecycle-selected-catalog-id={selectedCelestialCatalogId || "none"}
      data-atlas-v594-single-canvas-limit="1"
      data-atlas-v594-formal-product-pointer={POST_V594_BUILD_IDENTITY.formalProductPointer}
    >
      {sceneMounted && exactRequest ? (
        <AtlasRuntimeSceneLayer
          scene={domains.scene}
          shellHud={domains.shellHud}
          navigationFocus={domains.navigationFocus}
          launch={domains.launch}
          timelinePhysics={domains.timelinePhysics}
          lifecycleAuditV594={{
            lifecycleAudit: POST_V594_SAME_REALM_LIFECYCLE_QUERY,
            onLifecycleSnapshot: recordRendererSnapshot,
            onLifecycleExitObservation: recordExitObservation,
          }}
          exactAbRequest={exactRequest.version === V596_VISUAL_CHECKPOINT_RUNTIME_VERSION
            ? undefined
            : exactRequest}
          visualCheckpointRequest={exactRequest.version === V596_VISUAL_CHECKPOINT_RUNTIME_VERSION
            ? exactRequest
            : undefined}
          stellarRenderProfile={stellarRenderProfile}
          onExactAbReceipt={handleExactReceipt}
          onVisualCheckpointReceipt={handleExactReceipt}
        />
      ) : null}

      {exactReceipt?.version === V596_VISUAL_CHECKPOINT_CONSUMER_RECEIPT_VERSION ? (
        <script
          type="application/json"
          data-atlas-v596-visual-checkpoint-consumer-receipt={
            V596_VISUAL_CHECKPOINT_CONSUMER_RECEIPT_VERSION
          }
        >
          {JSON.stringify(exactReceipt)}
        </script>
      ) : exactReceipt?.version === V595_EXACT_AB_CONSUMER_RECEIPT_VERSION ? (
        <script
          type="application/json"
          data-atlas-v595-exact-ab-consumer-receipt={V595_EXACT_AB_CONSUMER_RECEIPT_VERSION}
        >
          {JSON.stringify(exactReceipt)}
        </script>
      ) : exactReceipt ? (
        <script
          type="application/json"
          data-atlas-v594-exact-ab-consumer-receipt={V594_EXACT_AB_CONSUMER_RECEIPT_VERSION}
        >
          {JSON.stringify(exactReceipt)}
        </script>
      ) : null}

      <div
        className="pointer-events-auto absolute left-3 top-3 z-[140] max-w-[calc(100vw-24px)] border border-cyan-100/20 bg-black/90 p-2 font-mono text-[8px] uppercase tracking-[.1em] text-white/70"
        data-atlas-v594-lifecycle-controls
        data-atlas-v594-cdp-soak-controls={POST_V594_CDP_SOAK_SURFACE_VERSION}
      >
        <div className="mb-2 text-cyan-50/70">v594 same-realm renderer soak</div>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {POST_V594_CDP_SOAK_PROFILES.map((profile) => (
            <button
              key={profile.key}
              type="button"
              data-atlas-v594-cdp-soak-target-id={profile.targetId}
              data-atlas-v594-cdp-soak-profile-key={profile.key}
              aria-pressed={selectedProfile?.key === profile.key}
              disabled={phase !== "baseline"}
              onClick={() => selectProfile(profile)}
              className="min-h-11 border border-white/15 px-2 disabled:opacity-30"
            >
              {profile.key}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <button
            type="button"
            data-atlas-v594-lifecycle-action="mount"
            disabled={phase !== "baseline" || !selectedProfile}
            onClick={mountScene}
            className="min-h-11 border border-white/20 px-3 disabled:opacity-30"
          >
            Mount
          </button>
          <button
            type="button"
            data-atlas-v594-cdp-soak-action="stabilize-profile"
            disabled={phase !== "mounted"}
            onClick={stabilizeProfile}
            className="min-h-11 border border-white/20 px-3 disabled:opacity-30"
          >
            Profile stable
          </button>
          <button
            type="button"
            data-atlas-v594-lifecycle-action="detach"
            disabled={phase !== "profile-stable"}
            onClick={detachScene}
            className="min-h-11 border border-white/20 px-3 disabled:opacity-30"
          >
            Detach
          </button>
          <button
            type="button"
            data-atlas-v594-cdp-soak-action="repeat"
            disabled={phase !== "detached-stable"}
            onClick={repeatCycle}
            className="min-h-11 border border-white/20 px-3 disabled:opacity-30"
          >
            Repeat
          </button>
          <Link
            href="/downloads"
            prefetch={false}
            aria-disabled={phase !== "detached-stable"}
            onNavigate={(event) => {
              if (
                phase !== "detached-stable"
                || getPostV594SameRealmLifecycleLedger()?.phase !== "detached-stable"
              ) {
                event.preventDefault();
                return;
              }
              recordPostV594LifecyclePhase("exiting");
              setPhase("exiting");
            }}
            data-atlas-v594-lifecycle-action="exit"
            className={`flex min-h-11 items-center border border-white/20 px-3 ${phase === "detached-stable" ? "" : "pointer-events-none opacity-30"}`}
          >
            Exit
          </Link>
        </div>
      </div>
    </AtlasAppShell>
  );
}
