"use client";

import { Aperture, Eye, EyeOff, Gauge, Pause, Play, RotateCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CELESTIAL_TIME_RATES_V592,
  createCelestialClockControllerV592,
  formatCelestialTimeRateV592,
  type CelestialClockReadoutV592,
  type CelestialTimeRateV592,
} from "../lib/celestialClockV592";
import {
  HERO_BODY_SPECS_V590,
  type CelestialDeliveryTierV590,
  type CelestialDeviceTierV590,
  type CelestialFocusTargetV590,
  type CelestialModeV590,
  type CelestialRenderProfileV590,
  type HeroAssetAdmissionV590,
  type HeroBodyIdV590,
} from "../lib/celestialRenderingV590";
import { resolveBodyOrientationV592 } from "../lib/celestialRotationV592";
import {
  FINAL_ART_DIRECTION_FORMAL_PRODUCT_POINTER_V593,
  FINAL_ART_DIRECTION_SCIENTIFIC_PAYLOAD_SHA256_V593,
  FINAL_ART_DIRECTION_VERSION_V593,
  FINAL_ART_MANIFEST_SHA256_V593,
  FINAL_ART_SOURCE_MANIFEST_SHA256_V593,
} from "../lib/finalArtDirectionV593";
import type { LivingUniverseFocusTargetV592 } from "../lib/nebulaVisualAssetsV592";
import { STELLAR_HERO_BY_ID_V592, type StellarHeroIdV592 } from "../lib/stellarHeroesV592";
import {
  STELLAR_HERO_SELECTOR_BY_ID_V593,
  STELLAR_HERO_SELECTOR_IDS_V593,
  STELLAR_HERO_SELECTOR_V593,
  STELLAR_HERO_SELECTOR_VERSION_V593,
  resolveStellarHeroSelectorV593,
} from "../lib/stellarHeroSelectorV593";
import { loadVisualAssetManifestV590 } from "../lib/useV590Texture";
import FinalArtCanvasHostV593, {
  type FinalArtLifecycleCapturePhaseV593,
  type FinalArtLifecycleExitObservationV593,
  type FinalArtLifecycleSnapshotV593,
} from "./FinalArtCanvasHostV593";
import FinalArtStageV593 from "./FinalArtStageV593";

const BODY_SIGNATURES_V593 = Object.freeze([
  { id: "sun", label: "Sun", pass: "solar photosphere" },
  { id: "earth", label: "Earth", pass: "ocean · cloud · limb" },
  { id: "jupiter", label: "Jupiter", pass: "seam · GRS · band depth" },
  { id: "saturn", label: "Saturn", pass: "ring optics · mutual shadow" },
] as const);

const STELLAR_SIGNATURES_V593 = STELLAR_HERO_SELECTOR_V593;

const DEEP_SIGNATURES_V593 = Object.freeze([
  { id: "milky-way-center", label: "Galactic core", pass: "black level · dust" },
  { id: "galactic-anticenter", label: "Anticenter", pass: "sky exposure" },
  { id: "orion", label: "Orion", pass: "Gaia anchor · engraving" },
  { id: "andromeda-galaxy", label: "Andromeda", pass: "depth · field integration" },
] as const);

const INITIAL_ADMISSIONS_V593 = Object.freeze(Object.fromEntries(
  HERO_BODY_SPECS_V590.map((body) => [body.id, "asset-blocked"]),
) as Record<HeroBodyIdV590, HeroAssetAdmissionV590>);

const BODY_IDS_V593 = new Set<string>(HERO_BODY_SPECS_V590.map((body) => body.id));
const STAR_IDS_V593 = new Set<string>(STELLAR_HERO_SELECTOR_IDS_V593);
const DIRECT_SKY_FOCUS_IDS_V593 = new Set<string>([
  "milky-way-center",
  "galactic-anticenter",
  "orion",
  "ursa-major",
  "cassiopeia",
  "orion-nebula",
  "andromeda-galaxy",
]);
const TIME_RATES_V593 = CELESTIAL_TIME_RATES_V592.filter((rate) => [0, 1, 3_600, 86_400].includes(rate));
const SAME_REALM_LIFECYCLE_QUERY_V593 = "same-realm-v1" as const;
const SAME_REALM_LIFECYCLE_VERSION_V593 = "v593-same-realm-scene-exit-v1" as const;
const SAME_REALM_LIFECYCLE_LEDGER_KEY_V593 = "__atlasV593SameRealmSceneExitV1" as const;
const V593_PAGE_BUILD_FINGERPRINT = process.env.NEXT_PUBLIC_ATLAS_V593_BUILD_FINGERPRINT
  ?? "unbound-development";

type SameRealmLifecyclePhaseV593 =
  | FinalArtLifecycleCapturePhaseV593
  | "detaching"
  | "exiting";

type SameRealmLifecycleLedgerV593 = Readonly<{
  version: typeof SAME_REALM_LIFECYCLE_VERSION_V593;
  realmToken: string;
  timeOrigin: number;
  phase: SameRealmLifecyclePhaseV593;
  identity: Readonly<{
    sourceManifestSha256: string;
    candidateManifestSha256: string;
    scientificPayloadSha256: string;
    pageBuildFingerprint: string;
  }>;
  snapshots: Readonly<{
    baseline: FinalArtLifecycleSnapshotV593 | null;
    mounted: FinalArtLifecycleSnapshotV593 | null;
    detached: FinalArtLifecycleSnapshotV593 | null;
  }>;
  exit: Readonly<{
    renderListsDisposed: true | null;
    contextLost: true | null;
    canvasDetached: true | null;
    routeAfter: string | null;
  }>;
}>;

declare global {
  interface Window {
    __atlasV593SameRealmSceneExitV1?: SameRealmLifecycleLedgerV593;
  }
}

function resolveSameRealmLifecycleAuditV593(): boolean {
  if (typeof window === "undefined") return false;
  const values = new URLSearchParams(window.location.search).getAll("lifecycleAudit");
  return values.length === 1 && values[0] === SAME_REALM_LIFECYCLE_QUERY_V593;
}

function createSameRealmLifecycleLedgerV593(): SameRealmLifecycleLedgerV593 {
  const previous = window[SAME_REALM_LIFECYCLE_LEDGER_KEY_V593];
  const timeOrigin = performance.timeOrigin;
  const realmToken = previous?.version === SAME_REALM_LIFECYCLE_VERSION_V593
    && previous.timeOrigin === timeOrigin
    ? previous.realmToken
    : globalThis.crypto?.randomUUID?.()
      ?? `realm-${timeOrigin}-${performance.now()}`;
  const ledger = Object.freeze({
    version: SAME_REALM_LIFECYCLE_VERSION_V593,
    realmToken,
    timeOrigin,
    phase: "baseline" as const,
    identity: Object.freeze({
      sourceManifestSha256: FINAL_ART_SOURCE_MANIFEST_SHA256_V593,
      candidateManifestSha256: FINAL_ART_MANIFEST_SHA256_V593,
      scientificPayloadSha256: FINAL_ART_DIRECTION_SCIENTIFIC_PAYLOAD_SHA256_V593,
      pageBuildFingerprint: V593_PAGE_BUILD_FINGERPRINT,
    }),
    snapshots: Object.freeze({ baseline: null, mounted: null, detached: null }),
    exit: Object.freeze({
      renderListsDisposed: null,
      contextLost: null,
      canvasDetached: null,
      routeAfter: null,
    }),
  });
  window[SAME_REALM_LIFECYCLE_LEDGER_KEY_V593] = ledger;
  return ledger;
}

function currentSameRealmLifecycleLedgerV593(): SameRealmLifecycleLedgerV593 {
  return window[SAME_REALM_LIFECYCLE_LEDGER_KEY_V593] ?? createSameRealmLifecycleLedgerV593();
}

function recordSameRealmLifecyclePhaseV593(phase: SameRealmLifecyclePhaseV593): void {
  const current = currentSameRealmLifecycleLedgerV593();
  window[SAME_REALM_LIFECYCLE_LEDGER_KEY_V593] = Object.freeze({ ...current, phase });
}

function recordSameRealmLifecycleSnapshotV593(
  phase: FinalArtLifecycleCapturePhaseV593,
  snapshot: FinalArtLifecycleSnapshotV593,
): void {
  const current = currentSameRealmLifecycleLedgerV593();
  const snapshotKey = phase === "detached-stable" ? "detached" : phase;
  window[SAME_REALM_LIFECYCLE_LEDGER_KEY_V593] = Object.freeze({
    ...current,
    phase,
    snapshots: Object.freeze({ ...current.snapshots, [snapshotKey]: snapshot }),
  });
}

function recordSameRealmLifecycleExitV593(
  observation: FinalArtLifecycleExitObservationV593,
): void {
  const current = currentSameRealmLifecycleLedgerV593();
  window[SAME_REALM_LIFECYCLE_LEDGER_KEY_V593] = Object.freeze({
    ...current,
    exit: Object.freeze({ ...current.exit, ...observation }),
  });
}

const GOLDEN_FRAME_PRESETS_V593 = Object.freeze({
  "sun-science-signature": Object.freeze({
    focusId: "sun",
    mode: "science" as const,
    initialJulianDate: 2_461_287.99994,
    initialRate: 0 as const,
    description: "fixed-J2000-Sun-linear-photosphere-and-limb-audit",
  }),
  "sun-cinematic-signature": Object.freeze({
    focusId: "sun",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_287.99994,
    initialRate: 0 as const,
    description: "fixed-J2000-Sun-source-bound-granulation-chromosphere-corona-audit",
  }),
  "earth-science-day": Object.freeze({
    focusId: "earth",
    mode: "science" as const,
    initialJulianDate: 2_461_268.516183,
    initialRate: 0 as const,
    description: "fixed-J2000-Earth-linear-blue-marble-cloud-shadow-day-audit",
  }),
  "earth-cinematic-day": Object.freeze({
    focusId: "earth",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_268.516183,
    initialRate: 0 as const,
    description: "fixed-J2000-Earth-ocean-cloud-atmosphere-day-audit",
  }),
  "earth-cinematic-night": Object.freeze({
    focusId: "earth",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_268.516183,
    initialRate: 0 as const,
    description: "fixed-J2000-Earth-black-marble-night-terminator-audit",
  }),
  "earth-science-limb": Object.freeze({
    focusId: "earth",
    mode: "science" as const,
    initialJulianDate: 2_461_268.516183,
    initialRate: 0 as const,
    description: "fixed-J2000-Earth-linear-atmospheric-limb-audit",
  }),
  "earth-seam-audit": Object.freeze({
    focusId: "earth",
    mode: "science" as const,
    initialJulianDate: 2_461_269.331542,
    initialRate: 0 as const,
    description: "fixed-J2000-Earth-uv-date-line-and-polar-reconstruction-audit",
  }),
  "jupiter-cinematic-grs": Object.freeze({
    focusId: "jupiter",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Jupiter-GRS-three-quarter-framing",
  }),
  "jupiter-seam-audit": Object.freeze({
    focusId: "jupiter",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_287.04239991,
    initialRate: 0 as const,
    description: "fixed-J2000-Jupiter-native-meridian-seam-audit",
  }),
  "saturn-cinematic-front": Object.freeze({
    focusId: "saturn",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_291.31767,
    initialRate: 0 as const,
    description: "fixed-J2000-Saturn-three-quarter-ring-optical-depth",
  }),
  "saturn-cinematic-backlight": Object.freeze({
    focusId: "saturn",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_291.31767,
    initialRate: 0 as const,
    description: "fixed-J2000-Saturn-anti-solar-backscatter-camera",
  }),
  "saturn-cinematic-ring-shadow": Object.freeze({
    focusId: "saturn",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_291.31767,
    initialRate: 0 as const,
    description: "fixed-J2000-Saturn-ring-plane-bidirectional-shadow-camera",
  }),
  "sirius-cinematic-signature": Object.freeze({
    focusId: "sirius-a",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Sirius-radiative-photosphere-audit",
  }),
  "rigel-cinematic-signature": Object.freeze({
    focusId: "rigel",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Rigel-hot-supergiant-audit",
  }),
  "betelgeuse-cinematic-signature": Object.freeze({
    focusId: "betelgeuse",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Betelgeuse-convective-supergiant-audit",
  }),
  "antares-cinematic-signature": Object.freeze({
    focusId: "antares",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Antares-convective-supergiant-audit",
  }),
  "galactic-core-science": Object.freeze({
    focusId: "milky-way-center",
    mode: "science" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Galactic-core-linear-source-bound-sphere-audit",
  }),
  "galactic-core-cinematic": Object.freeze({
    focusId: "milky-way-center",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Galactic-core-dust-black-level-reconstruction-audit",
  }),
  "galactic-anticenter-science": Object.freeze({
    focusId: "galactic-anticenter",
    mode: "science" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Galactic-anticenter-linear-source-bound-sphere-audit",
  }),
  "galactic-anticenter-cinematic": Object.freeze({
    focusId: "galactic-anticenter",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Galactic-anticenter-exposure-and-star-integration-audit",
  }),
  "orion-science": Object.freeze({
    focusId: "orion",
    mode: "science" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Orion-Gaia-anchor-linear-sky-audit",
  }),
  "orion-cinematic": Object.freeze({
    focusId: "orion",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Orion-Gaia-PSF-engraving-sky-integration-audit",
  }),
  "ursa-major-science": Object.freeze({
    focusId: "ursa-major",
    mode: "science" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Ursa-Major-Gaia-anchor-linear-sky-audit",
  }),
  "ursa-major-cinematic": Object.freeze({
    focusId: "ursa-major",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Ursa-Major-Gaia-PSF-engraving-audit",
  }),
  "cassiopeia-science": Object.freeze({
    focusId: "cassiopeia",
    mode: "science" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Cassiopeia-Gaia-anchor-linear-sky-audit",
  }),
  "cassiopeia-cinematic": Object.freeze({
    focusId: "cassiopeia",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Cassiopeia-Gaia-PSF-engraving-audit",
  }),
  "orion-nebula-science": Object.freeze({
    focusId: "orion-nebula",
    mode: "science" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Orion-nebula-coordinate-marker-science-audit",
  }),
  "orion-nebula-cinematic": Object.freeze({
    focusId: "orion-nebula",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Orion-nebula-source-bound-depth-impostor-audit",
  }),
  "heart-nebula-science": Object.freeze({
    focusId: "heart-nebula",
    mode: "science" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Heart-nebula-coordinate-marker-science-audit",
  }),
  "heart-nebula-cinematic": Object.freeze({
    focusId: "heart-nebula",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Heart-nebula-source-bound-depth-impostor-audit",
  }),
  "andromeda-science": Object.freeze({
    focusId: "andromeda-galaxy",
    mode: "science" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Andromeda-coordinate-and-validity-science-audit",
  }),
  "andromeda-cinematic": Object.freeze({
    focusId: "andromeda-galaxy",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Andromeda-source-bound-depth-and-black-level-audit",
  }),
  "pleiades-science": Object.freeze({
    focusId: "pleiades",
    mode: "science" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Pleiades-Gaia-catalog-science-audit",
  }),
  "pleiades-cinematic": Object.freeze({
    focusId: "pleiades",
    mode: "cinematic" as const,
    initialJulianDate: 2_461_287.71598,
    initialRate: 0 as const,
    description: "fixed-J2000-Pleiades-source-bound-field-integration-audit",
  }),
});

type GoldenFramePresetV593 = (typeof GOLDEN_FRAME_PRESETS_V593)[keyof typeof GOLDEN_FRAME_PRESETS_V593];

function resolveGoldenFramePresetV593(): Readonly<{ id: string; preset: GoldenFramePresetV593 }> | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get("frame");
  if (!id || !(id in GOLDEN_FRAME_PRESETS_V593)) return null;
  return Object.freeze({
    id,
    preset: GOLDEN_FRAME_PRESETS_V593[id as keyof typeof GOLDEN_FRAME_PRESETS_V593],
  });
}

function resolveBodyCyclePresetV593(): Readonly<{ id: string; preset: GoldenFramePresetV593 }> | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const body = params.get("body");
  if (!body || !BODY_IDS_V593.has(body)) return null;
  const mode = params.get("mode") === "science" ? "science" : "cinematic";
  return Object.freeze({
    id: `body-${body}`,
    preset: Object.freeze({
      focusId: body,
      mode,
      initialJulianDate: 2_461_287.71598,
      initialRate: 0,
      description: `fixed-J2000-${body}-resource-lifecycle-cycle`,
    }) as unknown as GoldenFramePresetV593,
  });
}

function useDeviceTierV593(): CelestialDeviceTierV590 {
  const [deviceTier, setDeviceTier] = useState<CelestialDeviceTierV590>("desktop");
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setDeviceTier(query.matches ? "mobile" : "desktop");
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return deviceTier;
}

function useClockReadoutV593(clock: ReturnType<typeof createCelestialClockControllerV592>): CelestialClockReadoutV592 {
  const [readout, setReadout] = useState(() => clock.getReadout());
  useEffect(() => {
    const update = () => setReadout(clock.getReadout());
    update();
    const timer = window.setInterval(update, 250);
    const unsubscribe = clock.subscribe(update);
    return () => {
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [clock]);
  return readout;
}

function signaturePassStateV593(focusId: string): Readonly<{ name: string; status: string }> {
  if (focusId === "jupiter") return { name: "Jupiter", status: "qualified-current-build-evidence" };
  const stellar = resolveStellarHeroSelectorV593(focusId);
  if (stellar) {
    return stellar.profileAdmission === "signature-profile"
      ? { name: "Stellar archetypes", status: "approved-6/6-human-signoff · presentation-only" }
      : { name: "Stellar catalog", status: "presentation-only · provenance-admission-blocked" };
  }
  if (focusId === "saturn") return { name: "Saturn", status: "qualified-current-build-evidence" };
  if (focusId === "earth") return { name: "Earth", status: "qualified-current-build-evidence" };
  if (focusId === "sun") return { name: "Sun", status: "qualified-current-build-evidence" };
  return { name: "Deep sky", status: "qualified-current-build-evidence" };
}

function ModeButtonV593({
  mode,
  active,
  onClick,
}: Readonly<{
  mode: CelestialModeV590;
  active: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 border px-3 font-mono text-[8px] uppercase tracking-[.15em] transition-colors ${active ? "border-[#d9c18e]/42 bg-[#d9c18e]/8 text-[#f0dcb5]" : "border-white/10 text-white/42 hover:border-white/20 hover:text-white/72"}`}
    >
      {mode}
    </button>
  );
}

export default function FinalArtObservatoryShellV593() {
  const [sameRealmLifecycleAudit] = useState(resolveSameRealmLifecycleAuditV593);
  const deviceTier = useDeviceTierV593();
  const deliveryTier: CelestialDeliveryTierV590 = process.env.NEXT_PUBLIC_ATLAS_CELESTIAL_DELIVERY_TIER === "vercel-lite"
    || process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "vercel-lite"
    ? "vercel-lite"
    : "standalone-full";
  const goldenFrame = useMemo(() => resolveGoldenFramePresetV593() ?? resolveBodyCyclePresetV593(), []);
  const clock = useMemo(() => createCelestialClockControllerV592({
    initialJulianDate: goldenFrame?.preset.initialJulianDate,
    initialRate: goldenFrame?.preset.initialRate ?? 3_600,
  }), [goldenFrame]);
  const readout = useClockReadoutV593(clock);
  const [mode, setMode] = useState<CelestialModeV590>(goldenFrame?.preset.mode ?? "cinematic");
  const [focusId, setFocusId] = useState<string>(goldenFrame?.preset.focusId ?? "jupiter");
  const [selectedBody, setSelectedBody] = useState<HeroBodyIdV590>(() => (
    BODY_IDS_V593.has(goldenFrame?.preset.focusId ?? "")
      ? goldenFrame?.preset.focusId as HeroBodyIdV590
      : "jupiter"
  ));
  const [cleanView, setCleanView] = useState(false);
  const [artDirectionEnabled, setArtDirectionEnabled] = useState(() => (
    typeof window === "undefined" || new URLSearchParams(window.location.search).get("art") !== "baseline"
  ));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [stageMounted, setStageMounted] = useState(() => !sameRealmLifecycleAudit);
  const [lifecyclePhase, setLifecyclePhase] = useState<SameRealmLifecyclePhaseV593 | null>(
    () => sameRealmLifecycleAudit ? "baseline" : null,
  );
  const [lifecycleCapturePhase, setLifecycleCapturePhase] = useState<FinalArtLifecycleCapturePhaseV593 | null>(
    () => sameRealmLifecycleAudit ? "baseline" : null,
  );
  const [baselineAdmissions, setBaselineAdmissions] = useState(INITIAL_ADMISSIONS_V593);
  const [assetManifestState, setAssetManifestState] = useState("loading");

  useEffect(() => {
    if (sameRealmLifecycleAudit) createSameRealmLifecycleLedgerV593();
  }, [sameRealmLifecycleAudit]);

  useEffect(() => {
    const controller = new AbortController();
    void loadVisualAssetManifestV590(controller.signal)
      .then((manifest) => {
        setBaselineAdmissions(manifest.heroBodies);
        setAssetManifestState("verified-v590-readonly");
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setAssetManifestState(error instanceof Error ? error.message : "asset-blocked");
      });
    return () => controller.abort();
  }, []);

  const selectedStarId = STAR_IDS_V593.has(focusId) ? focusId as StellarHeroIdV592 : null;
  const selectedStellarSelector = selectedStarId
    ? STELLAR_HERO_SELECTOR_BY_ID_V593[selectedStarId]
    : null;
  const livingFocusTarget: LivingUniverseFocusTargetV592 = selectedStarId
    ? "sun"
    : focusId as LivingUniverseFocusTargetV592;
  const baselineFocusTarget: CelestialFocusTargetV590 = selectedStarId
    ? "sun"
    : DIRECT_SKY_FOCUS_IDS_V593.has(focusId) || BODY_IDS_V593.has(focusId) || focusId === "overview"
      ? focusId as CelestialFocusTargetV590
      : "milky-way-center";
  const profile = useMemo<CelestialRenderProfileV590>(() => ({
    mode,
    deliveryTier,
    deviceTier,
    selectedBody,
    focusTarget: baselineFocusTarget,
    exposurePreset: "nominal",
    qualityTier: focusId === "overview" ? "overview" : "closeup",
    cleanView,
    presentationEpoch: 590,
  }), [baselineFocusTarget, cleanView, deliveryTier, deviceTier, focusId, mode, selectedBody]);
  const selectedOrientation = useMemo(
    () => resolveBodyOrientationV592(selectedBody, readout.julianDate),
    [readout.julianDate, selectedBody],
  );
  const selectedRotationPeriodDays = selectedOrientation.signedRotationDegPerDay === null
    ? null
    : 360 / Math.abs(selectedOrientation.signedRotationDegPerDay);
  const pass = signaturePassStateV593(focusId);
  const focusLabel = selectedStarId
    ? selectedStellarSelector?.label ?? STELLAR_HERO_BY_ID_V592[selectedStarId].name
    : [...BODY_SIGNATURES_V593, ...DEEP_SIGNATURES_V593].find((target) => target.id === focusId)?.label ?? focusId;

  const selectFocus = useCallback((id: string) => {
    if (BODY_IDS_V593.has(id)) setSelectedBody(id as HeroBodyIdV590);
    setFocusId(id);
    setMobileOpen(false);
  }, []);
  const selectMode = useCallback((nextMode: CelestialModeV590) => {
    setMode(nextMode);
    if (nextMode === "science") setCleanView(false);
  }, []);
  const selectRate = useCallback((rate: CelestialTimeRateV592) => clock.setRate(rate), [clock]);
  const recordLifecycleSnapshot = useCallback((
    phase: FinalArtLifecycleCapturePhaseV593,
    snapshot: FinalArtLifecycleSnapshotV593,
  ) => {
    if (!sameRealmLifecycleAudit) return;
    recordSameRealmLifecycleSnapshotV593(phase, snapshot);
    setLifecyclePhase(phase);
  }, [sameRealmLifecycleAudit]);
  const mountLifecycleStage = useCallback(() => {
    if (!sameRealmLifecycleAudit || stageMounted) return;
    setLifecycleCapturePhase(null);
    setStageMounted(true);
  }, [sameRealmLifecycleAudit, stageMounted]);
  const detachLifecycleStage = useCallback(() => {
    if (!sameRealmLifecycleAudit || !stageMounted) return;
    recordSameRealmLifecyclePhaseV593("detaching");
    setLifecyclePhase("detaching");
    setLifecycleCapturePhase(null);
    setStageMounted(false);
  }, [sameRealmLifecycleAudit, stageMounted]);
  const exitLifecycleAudit = useCallback(() => {
    if (!sameRealmLifecycleAudit) return;
    recordSameRealmLifecyclePhaseV593("exiting");
    setLifecyclePhase("exiting");
  }, [sameRealmLifecycleAudit]);

  useEffect(() => {
    if (!sameRealmLifecycleAudit || lifecyclePhase !== "baseline" || !stageMounted) return;
    setLifecycleCapturePhase("mounted");
  }, [lifecyclePhase, sameRealmLifecycleAudit, stageMounted]);

  useEffect(() => {
    if (!sameRealmLifecycleAudit || lifecyclePhase !== "detaching" || stageMounted) return;
    setLifecycleCapturePhase("detached-stable");
  }, [lifecyclePhase, sameRealmLifecycleAudit, stageMounted]);

  return (
    <section
      className="relative h-[100dvh] min-h-[640px] w-full overflow-hidden bg-[#010204] font-[family-name:var(--font-atlas-body,'IBM_Plex_Sans',sans-serif)] text-white"
      data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"
      data-atlas-v592-candidate="v592-readonly-stage-inside-v593"
      data-atlas-v593-shell
      data-atlas-v593-candidate={FINAL_ART_DIRECTION_VERSION_V593}
      data-atlas-v593-manifest-sha={FINAL_ART_MANIFEST_SHA256_V593}
      data-atlas-v593-page-build-fingerprint={V593_PAGE_BUILD_FINGERPRINT}
      data-atlas-v593-formal-product-pointer={FINAL_ART_DIRECTION_FORMAL_PRODUCT_POINTER_V593}
      data-atlas-v593-lifecycle-audit={sameRealmLifecycleAudit ? SAME_REALM_LIFECYCLE_QUERY_V593 : undefined}
      data-atlas-v593-lifecycle-phase={sameRealmLifecycleAudit ? lifecyclePhase ?? "baseline" : undefined}
      data-atlas-v593-mode={mode}
      data-atlas-v593-focus-id={focusId}
      data-atlas-v593-focus-kind={selectedStarId ? "stellar-hero" : BODY_IDS_V593.has(focusId) ? "body-hero" : "sky-reference"}
      data-atlas-v593-stellar-selector-version={selectedStellarSelector ? STELLAR_HERO_SELECTOR_VERSION_V593 : undefined}
      data-atlas-v593-stellar-identity-status={selectedStellarSelector?.identityStatus ?? "inactive"}
      data-atlas-v593-stellar-provenance-admission={selectedStellarSelector?.provenanceAdmission ?? "inactive"}
      data-atlas-v593-stellar-profile-admission={selectedStellarSelector?.profileAdmission ?? "inactive"}
      data-atlas-v593-stellar-presentation-only={selectedStellarSelector ? "true" : "inactive"}
      data-atlas-v593-stellar-scientific-writeback={selectedStellarSelector ? "false" : "inactive"}
      data-atlas-v593-time-rate={readout.rateSecondsPerSecond}
      data-atlas-v593-art-lane={artDirectionEnabled ? "v593-signature" : "v592-same-build-baseline"}
      data-atlas-v593-time-policy={readout.rateSecondsPerSecond === 1 ? "real-rate" : readout.rateSecondsPerSecond === 0 ? "paused" : "explicit-time-lapse"}
      data-atlas-v593-rotation-body={selectedBody}
      data-atlas-v593-rotation-authority={selectedOrientation.authority}
      data-atlas-v593-rotation-kinematic-authority={selectedOrientation.kinematicAuthority}
      data-atlas-v593-rotation-absolute-prime-meridian={selectedOrientation.absolutePrimeMeridian ? "true" : "false"}
      data-atlas-v593-rotation-pole-ra-deg={selectedOrientation.poleRaDeg?.toFixed(8) ?? "unknown"}
      data-atlas-v593-rotation-pole-dec-deg={selectedOrientation.poleDecDeg?.toFixed(8) ?? "unknown"}
      data-atlas-v593-rotation-prime-meridian-deg={selectedOrientation.primeMeridianDeg?.toFixed(8) ?? "unknown"}
      data-atlas-v593-rotation-signed-deg-per-day={selectedOrientation.signedRotationDegPerDay?.toFixed(8) ?? "unknown"}
      data-atlas-v593-rotation-period-days={selectedRotationPeriodDays?.toFixed(8) ?? "unknown"}
      data-atlas-v593-rotation-periodic-terms-applied={selectedOrientation.periodicTermsApplied ? "true" : "false"}
      data-atlas-v593-rotation-w0-blocked="bennu,kleopatra"
      data-atlas-v593-frame-preset={goldenFrame?.id ?? "live-clock"}
      data-atlas-v593-frame-preset-policy={goldenFrame?.preset.description ?? "none"}
      data-atlas-v593-asset-manifest-state={assetManifestState}
      data-atlas-v593-canvas-ready={canvasReady ? "true" : "false"}
      data-atlas-v593-single-canvas="true"
      data-atlas-v593-canvas-count="1"
      data-atlas-v593-scientific-payload-sha={FINAL_ART_DIRECTION_SCIENTIFIC_PAYLOAD_SHA256_V593}
      data-atlas-v593-scientific-payload-stable="true"
      data-atlas-v593-scientific-writeback="false"
      data-atlas-v593-production-promotion="false"
    >
      <style>{`
        section[data-atlas-v593-shell][data-atlas-v593-art-lane="v593-signature"][data-atlas-v593-mode="cinematic"] [data-atlas-v592-nebula-marker],
        section[data-atlas-v593-shell][data-atlas-v593-art-lane="v593-signature"][data-atlas-v593-mode="cinematic"] [data-atlas-v592-deep-space-marker] {
          background: rgba(0, 0, 0, 0.32) !important;
          border-color: rgba(217, 193, 142, 0.22) !important;
          font-size: 4px !important;
          letter-spacing: 0.1em !important;
          opacity: 0.46 !important;
          padding: 2px 5px !important;
          transform: scale(0.64);
          transform-origin: center;
          transition: none !important;
        }
        section[data-atlas-v593-shell][data-atlas-v593-art-lane="v593-signature"][data-atlas-v593-mode="cinematic"][data-atlas-v593-focus-id="andromeda-galaxy"] [data-atlas-v592-deep-space-marker="andromeda-galaxy"] {
          opacity: 0 !important;
        }
      `}</style>
      <div className={`absolute inset-0 transition-[right] duration-300 ${cleanView ? "" : "lg:right-[304px]"}`} data-atlas-v593-single-canvas-stage>
        <FinalArtCanvasHostV593
          mode={mode}
          deviceTier={deviceTier}
          onCanvasReady={() => setCanvasReady(true)}
          lifecycleAudit={sameRealmLifecycleAudit ? SAME_REALM_LIFECYCLE_QUERY_V593 : undefined}
          lifecycleAuditPhase={sameRealmLifecycleAudit ? lifecycleCapturePhase : null}
          onLifecycleSnapshot={sameRealmLifecycleAudit ? recordLifecycleSnapshot : undefined}
          onLifecycleExitObservation={sameRealmLifecycleAudit ? recordSameRealmLifecycleExitV593 : undefined}
        >
          {stageMounted ? (
            <FinalArtStageV593
              profile={profile}
              baselineAdmissions={baselineAdmissions}
              baselineFocusTarget={baselineFocusTarget}
              livingFocusTarget={livingFocusTarget}
              clock={clock}
              stellarHeroId={selectedStarId}
              focusId={focusId}
              framePresetId={goldenFrame?.id ?? "live-clock"}
              artDirectionEnabled={artDirectionEnabled}
            />
          ) : null}
        </FinalArtCanvasHostV593>
      </div>

      {sameRealmLifecycleAudit ? (
        <div className="pointer-events-auto absolute left-3 top-20 z-[70] flex gap-1 border border-white/14 bg-black/84 p-1 font-mono text-[7px] uppercase tracking-[.12em] text-white/70">
          <button
            type="button"
            data-atlas-v593-lifecycle-action="mount"
            disabled={stageMounted}
            onClick={mountLifecycleStage}
            className="min-h-11 border border-white/16 px-3 disabled:opacity-30"
          >
            Mount stage
          </button>
          <button
            type="button"
            data-atlas-v593-lifecycle-action="detach"
            disabled={!stageMounted}
            onClick={detachLifecycleStage}
            className="min-h-11 border border-white/16 px-3 disabled:opacity-30"
          >
            Detach stage
          </button>
          <Link
            href="/downloads"
            prefetch={false}
            onNavigate={exitLifecycleAudit}
            data-atlas-v593-lifecycle-action="exit"
            className="flex min-h-11 items-center border border-white/16 px-3"
          >
            Exit scene
          </Link>
        </div>
      ) : null}

      {cleanView ? (
        <button type="button" onClick={() => setCleanView(false)} className="absolute right-4 top-4 z-50 flex min-h-11 items-center gap-2 border border-white/14 bg-black/58 px-3 font-mono text-[8px] uppercase tracking-[.15em] text-white/66 backdrop-blur-md">
          <Eye className="h-3.5 w-3.5" /> Exit clean view
        </button>
      ) : (
        <>
          <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/8 bg-gradient-to-b from-black/86 to-black/10 px-4 lg:right-[304px]">
            <div className="min-w-0">
              <div className="truncate font-mono text-[9px] uppercase tracking-[.24em] text-[#ead4aa]/88">Orbit Atlas / Final Observatory</div>
              <div className="mt-1 hidden font-mono text-[7px] uppercase tracking-[.15em] text-white/34 md:block">v593 R3F stage · physical clock · sealed science payload</div>
            </div>
            <div className="pointer-events-auto flex items-center gap-1.5">
              <ModeButtonV593 mode="science" active={mode === "science"} onClick={() => selectMode("science")} />
              <ModeButtonV593 mode="cinematic" active={mode === "cinematic"} onClick={() => selectMode("cinematic")} />
              <button type="button" disabled={mode !== "cinematic"} onClick={() => setCleanView(true)} className="hidden min-h-11 items-center gap-2 border border-white/10 px-3 font-mono text-[8px] uppercase tracking-[.13em] text-white/42 enabled:hover:text-white/72 disabled:opacity-20 md:flex"><EyeOff className="h-3.5 w-3.5" /> Clean view</button>
            </div>
          </header>

          <nav className="pointer-events-auto absolute bottom-20 left-4 top-20 z-30 hidden w-[176px] overflow-y-auto border-y border-white/8 bg-gradient-to-r from-black/76 to-black/16 py-3 pr-3 md:block" aria-label="Signature art targets">
            <div className="mb-3 flex items-center gap-2 font-mono text-[7px] uppercase tracking-[.2em] text-white/38"><Aperture className="h-3 w-3" /> Signature bodies</div>
            <div className="space-y-1">
              {BODY_SIGNATURES_V593.map((target) => <button key={target.id} type="button" onClick={() => selectFocus(target.id)} aria-pressed={focusId === target.id} className={`min-h-11 w-full border px-3 text-left transition-colors ${focusId === target.id ? "border-[#d9c18e]/38 bg-[#d9c18e]/7 text-[#f0dcb5]" : "border-white/7 text-white/45 hover:border-white/16 hover:text-white/72"}`}><span className="block font-serif text-[13px]">{target.label}</span><span className="mt-1 block font-mono text-[6px] uppercase tracking-[.08em] opacity-55">{target.pass}</span></button>)}
            </div>
            <div className="mb-3 mt-6 flex items-center gap-2 font-mono text-[7px] uppercase tracking-[.2em] text-white/38"><RotateCw className="h-3 w-3" /> Stellar optics</div>
            <div className="space-y-1">
              {STELLAR_SIGNATURES_V593.map((target) => <button key={target.id} type="button" onClick={() => selectFocus(target.id)} aria-pressed={focusId === target.id} className={`min-h-11 w-full border px-3 text-left transition-colors ${focusId === target.id ? "border-[#d9c18e]/38 bg-[#d9c18e]/7 text-[#f0dcb5]" : "border-white/7 text-white/45 hover:border-white/16 hover:text-white/72"}`}><span className="block font-serif text-[13px]">{target.label}</span><span className="mt-1 block font-mono text-[6px] uppercase tracking-[.08em] opacity-55">{target.pass}</span></button>)}
            </div>
          </nav>

          <aside className="pointer-events-auto absolute inset-y-0 right-0 z-30 hidden w-[304px] border-l border-white/9 bg-[#020407]/92 px-5 pb-5 pt-20 backdrop-blur-xl lg:flex lg:flex-col" data-atlas-v593-inspector>
            <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[.2em] text-white/38"><Gauge className="h-3 w-3" /> Signature art authority</div>
            <h1 className="mt-5 font-serif text-[27px] font-light text-[#ead8b5]">{focusLabel}</h1>
            <p className="mt-2 font-mono text-[7px] uppercase tracking-[.12em] text-white/38">{pass.name}</p>
            <div className="mt-6 border border-cyan-100/14 px-3 py-3">
              <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[.12em] text-cyan-50/65"><ShieldCheck className="h-3.5 w-3.5" /> Science payload immutable</div>
              <p className="mt-2 font-mono text-[7px] leading-4 text-white/34">Presentation materials may change WebGL output. Coordinates and the sealed scientific payload cannot be written back.</p>
            </div>
            <dl className="mt-7 space-y-4 border-t border-white/8 pt-5 font-mono text-[7px] uppercase tracking-[.1em]">
              <div className="flex justify-between gap-4"><dt className="text-white/30">Pass state</dt><dd className="max-w-[150px] text-right text-[#ead8b5]/70">{pass.status}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/30">Display</dt><dd className="text-white/65">{mode}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/30">Clock</dt><dd className="text-white/65">{formatCelestialTimeRateV592(readout.rateSecondsPerSecond)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/30">Time policy</dt><dd className="text-white/50">{readout.rateSecondsPerSecond === 1 ? "real" : readout.rateSecondsPerSecond === 0 ? "paused" : "time-lapse"}</dd></div>
              {BODY_IDS_V593.has(focusId) ? (
                <>
                  <div className="flex justify-between gap-4"><dt className="text-white/30">Pole J2000</dt><dd className="text-right text-white/50">{selectedOrientation.poleRaDeg?.toFixed(3) ?? "—"}° / {selectedOrientation.poleDecDeg?.toFixed(3) ?? "—"}°</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-white/30">Prime W</dt><dd className="text-white/50">{selectedOrientation.primeMeridianDeg?.toFixed(3) ?? "—"}°</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-white/30">Spin period</dt><dd className="text-white/50">{selectedRotationPeriodDays === null ? "—" : `${selectedRotationPeriodDays.toFixed(5)} d`}</dd></div>
                </>
              ) : selectedStarId ? (
                <>
                  <div className="flex justify-between gap-4"><dt className="text-white/30">Spin period</dt><dd className="text-white/50">{STELLAR_HERO_BY_ID_V592[selectedStarId].rotationPeriodDays.toFixed(3)} d</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-white/30">Identity</dt><dd className="max-w-[150px] text-right text-white/50">{selectedStellarSelector?.identityStatus}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-white/30">Profile</dt><dd className="max-w-[150px] text-right text-white/50">{selectedStellarSelector?.presentationProfile}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-white/30">Provenance</dt><dd className="max-w-[150px] text-right text-[#ead8b5]/70">{selectedStellarSelector?.provenanceAdmission}</dd></div>
                </>
              ) : null}
              <div className="flex justify-between gap-4"><dt className="text-white/30">Delivery</dt><dd className="text-white/50">{deliveryTier}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/30">Canvas</dt><dd className="text-emerald-100/62">1 · {canvasReady ? "ready" : "warming"}</dd></div>
            </dl>
            <div className="mt-6 grid grid-cols-2 gap-1 border-t border-white/8 pt-4" data-atlas-v593-same-build-art-ab>
              <button type="button" onClick={() => setArtDirectionEnabled(false)} aria-pressed={!artDirectionEnabled} className={`min-h-11 border font-mono text-[7px] uppercase tracking-[.1em] ${!artDirectionEnabled ? "border-white/30 text-white/78" : "border-white/8 text-white/32"}`}>v592 baseline</button>
              <button type="button" onClick={() => setArtDirectionEnabled(true)} aria-pressed={artDirectionEnabled} className={`min-h-11 border font-mono text-[7px] uppercase tracking-[.1em] ${artDirectionEnabled ? "border-[#d9c18e]/42 text-[#f0dcb5]" : "border-white/8 text-white/32"}`}>v593 signature</button>
            </div>
            <div className="mt-auto border-t border-white/8 pt-4 font-mono text-[6px] uppercase leading-4 tracking-[.08em] text-white/28">
              <div>manifest {FINAL_ART_MANIFEST_SHA256_V593.slice(0, 12)}…</div>
              <div>payload {FINAL_ART_DIRECTION_SCIENTIFIC_PAYLOAD_SHA256_V593.slice(0, 12)}…</div>
              <div>formal {FINAL_ART_DIRECTION_FORMAL_PRODUCT_POINTER_V593} · read only</div>
            </div>
          </aside>

          <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-40 hidden h-16 items-center border-t border-white/8 bg-black/72 px-4 backdrop-blur-md md:flex lg:right-[304px]" data-atlas-v593-time-rail>
            <div className="mr-5 min-w-[210px] border-r border-white/8 pr-5 font-mono"><div className="text-[7px] uppercase tracking-[.17em] text-white/30">Celestial clock · UTC</div><div className="mt-1 text-[10px] tracking-[.08em] text-[#ead8b5]/72">{readout.utcIso.slice(0, 19).replace("T", " · ")}</div></div>
            <div className="flex gap-1">
              {TIME_RATES_V593.map((rate) => <button key={rate} type="button" onClick={() => selectRate(rate)} aria-pressed={readout.rateSecondsPerSecond === rate} className={`flex min-h-10 min-w-16 items-center justify-center gap-1 border px-2 font-mono text-[7px] uppercase tracking-[.08em] ${readout.rateSecondsPerSecond === rate ? "border-[#d9c18e]/38 text-[#f0dcb5]" : "border-white/8 text-white/38 hover:text-white/68"}`}>{rate === 0 ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}{formatCelestialTimeRateV592(rate)}</button>)}
            </div>
            <div className="ml-auto flex gap-1">
              {DEEP_SIGNATURES_V593.map((target) => <button key={target.id} type="button" onClick={() => selectFocus(target.id)} className={`min-h-10 border px-2 font-mono text-[7px] uppercase tracking-[.07em] ${focusId === target.id ? "border-[#d9c18e]/38 text-[#f0dcb5]" : "border-white/8 text-white/38 hover:text-white/68"}`}>{target.label}</button>)}
            </div>
          </div>

          <div className="pointer-events-auto absolute inset-x-2 bottom-2 z-50 border border-white/12 bg-[#020609]/94 shadow-[0_-24px_80px_rgba(0,0,0,.68)] backdrop-blur-xl md:hidden" data-atlas-v593-mobile-sheet>
            <button type="button" onClick={() => setMobileOpen((open) => !open)} className="flex min-h-14 w-full items-center justify-between px-4 text-left"><span><span className="block font-mono text-[7px] uppercase tracking-[.16em] text-white/34">Final observatory</span><span className="mt-1 block font-serif text-[15px] text-[#ead8b5]">{focusLabel}</span></span><span className="font-mono text-[8px] uppercase tracking-[.12em] text-white/42">{mobileOpen ? "Close" : "Targets"}</span></button>
            {mobileOpen ? <div className="grid max-h-[48dvh] grid-cols-2 gap-1 overflow-y-auto border-t border-white/8 p-2">{[...BODY_SIGNATURES_V593, ...STELLAR_SIGNATURES_V593, ...DEEP_SIGNATURES_V593].map((target) => <button key={target.id} type="button" onClick={() => selectFocus(target.id)} className={`min-h-11 border px-2 font-mono text-[7px] uppercase tracking-[.08em] ${focusId === target.id ? "border-[#d9c18e]/38 text-[#f0dcb5]" : "border-white/8 text-white/42"}`}>{target.label}</button>)}</div> : null}
          </div>
        </>
      )}
    </section>
  );
}
