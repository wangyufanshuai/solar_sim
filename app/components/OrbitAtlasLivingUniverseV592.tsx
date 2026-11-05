"use client";

import {
  Aperture,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Clock3,
  Database,
  Eye,
  EyeOff,
  Menu,
  Moon,
  Orbit,
  Pause,
  Play,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
import {
  CELESTIAL_ORBIT_BY_ID_V590,
  CELESTIAL_RENDERING_SCIENTIFIC_PROJECTION_URL_V590,
  HERO_BODY_SPECS_V590,
  HERO_BODY_SPEC_BY_ID_V590,
  createScientificProjectionStateV590,
  serializeScientificProjectionStateV590,
  type CelestialDeliveryTierV590,
  type CelestialDeviceTierV590,
  type CelestialExposurePresetV590,
  type CelestialFocusTargetV590,
  type CelestialModeV590,
  type CelestialRenderProfileV590,
  type HeroAssetAdmissionV590,
  type HeroBodyIdV590,
  type ScientificProjectionStateV590,
} from "../lib/celestialRenderingV590";
import {
  CELESTIAL_TIME_RATES_V592,
  JULIAN_DATE_J2000_V592,
  createCelestialClockControllerV592,
  formatCelestialTimeRateV592,
  unixMillisecondsToJulianDateV592,
  type CelestialClockControllerV592,
  type CelestialClockReadoutV592,
  type CelestialTimeRateV592,
} from "../lib/celestialClockV592";
import {
  LIVING_UNIVERSE_BASELINE_V592,
  LIVING_UNIVERSE_FORMAL_PRODUCT_POINTER_V592,
  LIVING_UNIVERSE_MANIFEST_SHA256_V592,
  LIVING_UNIVERSE_SCIENTIFIC_PAYLOAD_SHA256_V592,
  LIVING_UNIVERSE_SOURCE_MANIFEST_SHA256_V592,
  LIVING_UNIVERSE_VERSION_V592,
} from "../lib/livingUniverseV592";
import {
  CELESTIAL_ROTATION_PACKET_SHA256_V592,
  resolveBodyOrientationV592,
} from "../lib/celestialRotationV592";
import {
  STELLAR_HEROES_V592,
  STELLAR_HERO_BY_ID_V592,
  STELLAR_HERO_PACKET_SHA256_V592,
  type StellarHeroIdV592,
} from "../lib/stellarHeroesV592";
import {
  NEBULA_ALL_VISUAL_CATALOG_V592,
  isNebulaVisualFocusTargetV592,
  nebulaVisualManifestShaForIdV592,
  type LivingUniverseFocusTargetV592,
  type NebulaVisualIdV592,
} from "../lib/nebulaVisualAssetsV592";
import { NEBULA_OVERLAY_VISUAL_CATALOG_V592 } from "../lib/nebulaOverlayVisualAssetsV592";
import { loadVisualAssetManifestV590 } from "../lib/useV590Texture";
import {
  MAJOR_MOON_BY_ID_V592,
  MAJOR_MOON_MODELS_V592,
  resolveMajorMoonRotationV592,
  type MajorMoonIdV592,
} from "../lib/majorMoonsV592";
import {
  MAJOR_MOON_RUNTIME_HERO_IDS_V592,
  MAJOR_MOON_VISUAL_ASSETS_V592,
  MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592,
  isMajorMoonRuntimeHeroIdV592,
} from "../lib/majorMoonVisualAssetsV592";
import {
  DEEP_SPACE_CLUSTERS_V592,
  DEEP_SPACE_GALAXIES_V592,
  DEEP_SPACE_REFERENCE_BY_ID_V592,
  DEEP_SPACE_REFERENCE_OBJECTS_V592,
  DEEP_SPACE_REFERENCE_PACKET_SHA256_V592,
  formatDeepSpaceDistanceV592,
  isDeepSpaceReferenceIdV592,
  type DeepSpaceReferenceIdV592,
} from "../lib/deepSpaceReferenceV592";
import {
  DEEP_SPACE_VISUAL_ASSETS_V592,
  DEEP_SPACE_VISUAL_MANIFEST_SHA256_V592,
  isDeepSpaceVisualIdV592,
} from "../lib/deepSpaceVisualAssetsV592";
import { HERO_OVERRIDE_ADMISSIONS_V591 } from "./CelestialHeroOverridesV591";
import { CelestialConvergenceReleaseProbeV591 } from "./CelestialConvergenceStageV591";
import LivingUniverseStageV592 from "./LivingUniverseStageV592";
import UniverseCanvasOverrideHostV591 from "./UniverseCanvasOverrideHostV591";

const INITIAL_ADMISSIONS_V592 = Object.freeze(Object.fromEntries(
  HERO_BODY_SPECS_V590.map((body) => [body.id, body.initialAdmission]),
)) as Readonly<Record<HeroBodyIdV590, HeroAssetAdmissionV590>>;
const MAJOR_BODIES_V592 = HERO_BODY_SPECS_V590.filter((body) => body.group === "major");
const SMALL_BODIES_V592 = HERO_BODY_SPECS_V590.filter((body) => body.group === "small-body");
const V592_PAGE_BUILD_FINGERPRINT = process.env.NEXT_PUBLIC_ATLAS_V592_BUILD_FINGERPRINT ?? "unbound-development";

const SKY_TARGETS_V592: readonly Readonly<{ id: LivingUniverseFocusTargetV592; label: string; type: "sky" | "constellation" | "nebula" }>[] = Object.freeze([
  { id: "milky-way-center", label: "Galactic core", type: "sky" },
  { id: "milky-way-anticenter", label: "Anticenter", type: "sky" },
  { id: "orion", label: "Orion", type: "constellation" },
  { id: "ursa-major", label: "Ursa Major", type: "constellation" },
  { id: "cassiopeia", label: "Cassiopeia", type: "constellation" },
  { id: "orion-nebula", label: "M42", type: "nebula" },
  { id: "lagoon-nebula", label: "M8", type: "nebula" },
  { id: "eagle-nebula", label: "M16", type: "nebula" },
  { id: "helix-nebula", label: "NGC 7293", type: "nebula" },
  { id: "veil-nebula", label: "Veil", type: "nebula" },
  { id: "north-america-nebula", label: "NGC 7000", type: "nebula" },
  { id: "heart-nebula", label: "IC 1805", type: "nebula" },
  { id: "soul-nebula", label: "IC 1848", type: "nebula" },
  { id: "witch-head-nebula", label: "IC 2118", type: "nebula" },
  { id: "flame-nebula", label: "NGC 2024", type: "nebula" },
  { id: "pacman-nebula", label: "NGC 281", type: "nebula" },
  { id: "running-chicken-nebula", label: "IC 2944", type: "nebula" },
  ...NEBULA_OVERLAY_VISUAL_CATALOG_V592.map((entry) => Object.freeze({
    id: entry.id,
    label: entry.catalogName,
    type: "nebula" as const,
  })),
]);

function resolveMobileFocusLabelV592(values: Readonly<{
  selectedBody: HeroBodyIdV590;
  selectedStarId: StellarHeroIdV592 | null;
  selectedMajorMoonId: MajorMoonIdV592 | null;
  focusTarget: LivingUniverseFocusTargetV592;
}>): string {
  if (values.selectedMajorMoonId) return MAJOR_MOON_BY_ID_V592[values.selectedMajorMoonId].name;
  if (values.selectedStarId) return STELLAR_HERO_BY_ID_V592[values.selectedStarId].name;
  if (isNebulaVisualFocusTargetV592(values.focusTarget)) {
    return NEBULA_ALL_VISUAL_CATALOG_V592.find((entry) => entry.id === values.focusTarget)?.catalogName ?? values.focusTarget;
  }
  if (isDeepSpaceReferenceIdV592(values.focusTarget)) return DEEP_SPACE_REFERENCE_BY_ID_V592[values.focusTarget].commonName;
  if (values.focusTarget === "overview") return "Overview";
  const skyTarget = SKY_TARGETS_V592.find((entry) => entry.id === values.focusTarget);
  if (skyTarget) return skyTarget.label;
  return HERO_BODY_SPEC_BY_ID_V590[values.selectedBody].name;
}

function useDeviceTierV592(): CelestialDeviceTierV590 {
  const [tier, setTier] = useState<CelestialDeviceTierV590>("desktop");
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setTier(query.matches ? "mobile" : "desktop");
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return tier;
}

function useClockReadoutV592(clock: CelestialClockControllerV592): CelestialClockReadoutV592 {
  const [readout, setReadout] = useState(() => clock.getReadout());
  useEffect(() => {
    const update = () => setReadout(clock.getReadout());
    const unsubscribe = clock.subscribe(update);
    const interval = window.setInterval(update, 200);
    update();
    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [clock]);
  return readout;
}

function useFpsTelemetryV592(
  rootRef: React.RefObject<HTMLElement | null>,
  ready: boolean,
  key: string,
): void {
  useEffect(() => {
    if (!ready) return;
    let previous = performance.now();
    let frame = 0;
    let raf = 0;
    const samples: number[] = [];
    const loop = (now: number) => {
      const delta = now - previous;
      previous = now;
      if (delta > 0 && delta < 250) samples.push(1_000 / delta);
      if (samples.length > 240) samples.shift();
      frame += 1;
      if (frame % 30 === 0 && rootRef.current && samples.length > 20) {
        const sorted = [...samples].sort((left, right) => left - right);
        const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
        const threshold = key.includes("mobile") || !key.includes("overview") ? 45 : 55;
        rootRef.current.dataset.atlasV592FpsMedian = median.toFixed(2);
        rootRef.current.dataset.atlasV592FpsSampleCount = String(samples.length);
        rootRef.current.dataset.atlasV592FpsGate = median >= threshold ? "passed" : "warming";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [key, ready, rootRef]);
}

type PerformanceMemoryV592 = Readonly<{
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}>;

function useHeapTelemetryV592(
  rootRef: React.RefObject<HTMLElement | null>,
  ready: boolean,
): void {
  useEffect(() => {
    if (!ready) return;
    const publish = () => {
      const root = rootRef.current;
      if (!root) return;
      const memory = (performance as Performance & { memory?: PerformanceMemoryV592 }).memory;
      root.dataset.atlasV592JsHeapTelemetry = memory ? "available-performance-memory" : "unavailable-performance-memory-not-exposed";
      root.dataset.atlasV592JsHeapUsedBytes = memory ? String(Math.max(0, Math.round(memory.usedJSHeapSize))) : "unavailable";
      root.dataset.atlasV592JsHeapTotalBytes = memory ? String(Math.max(0, Math.round(memory.totalJSHeapSize))) : "unavailable";
      root.dataset.atlasV592JsHeapLimitBytes = memory ? String(Math.max(0, Math.round(memory.jsHeapSizeLimit))) : "unavailable";
      root.dataset.atlasV592JsHeapSampleAt = memory ? new Date().toISOString() : "unavailable";
    };
    publish();
    const interval = window.setInterval(publish, 1_000);
    return () => window.clearInterval(interval);
  }, [ready, rootRef]);
}

function compactShaV592(value: string): string {
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function ModeControlV592({
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
      className={`min-h-11 border px-3 text-[8px] uppercase tracking-[.18em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d9c18e]/80 md:min-h-10 ${active ? "border-[#d9c18e]/35 bg-[#d9c18e]/10 text-[#f4dfb5]" : "border-white/10 text-white/38 hover:border-white/20 hover:text-white/72"}`}
    >
      {mode}
    </button>
  );
}

function deepSpaceVisualAssetForV592(id: DeepSpaceReferenceIdV592) {
  return isDeepSpaceVisualIdV592(id)
    ? DEEP_SPACE_VISUAL_ASSETS_V592.find((asset) => asset.target === id)
    : undefined;
}

function deepSpaceVisualLabelV592(id: DeepSpaceReferenceIdV592) {
  const asset = deepSpaceVisualAssetForV592(id);
  if (!asset) return "blocked";
  if (asset.visualModelKind === "openngc-catalog-derived-galaxy-analytic") return "analytic";
  return asset.visualModelKind === "gaia-catalog-derived-star-field-impostor" ? "Gaia" : "image";
}

function BodyBrowserV592({
  lane,
  selectedBody,
  selectedStarId,
  selectedMajorMoonId,
  selectedDeepSpaceId,
  onLane,
  onSelect,
  onSelectStar,
  onSelectMajorMoon,
  onSelectDeepSpace,
  onOverview,
}: Readonly<{
  lane: "bodies" | "stars" | "moons" | "deep";
  selectedBody: HeroBodyIdV590;
  selectedStarId: StellarHeroIdV592 | null;
  selectedMajorMoonId: MajorMoonIdV592 | null;
  selectedDeepSpaceId: DeepSpaceReferenceIdV592 | null;
  onLane: (lane: "bodies" | "stars" | "moons" | "deep") => void;
  onSelect: (body: HeroBodyIdV590) => void;
  onSelectStar: (star: StellarHeroIdV592) => void;
  onSelectMajorMoon: (moon: MajorMoonIdV592) => void;
  onSelectDeepSpace: (target: DeepSpaceReferenceIdV592) => void;
  onOverview: () => void;
}>) {
  const [smallOpen, setSmallOpen] = useState(false);
  return (
    <aside
      className="pointer-events-auto absolute bottom-24 left-4 top-20 z-30 hidden w-[154px] flex-col md:flex"
      data-atlas-v592-celestial-browser
    >
      <div className="flex items-center gap-2 border-b border-white/8 px-2 pb-3 text-[8px] uppercase tracking-[.2em] text-white/42">
        <Orbit className="h-3 w-3" aria-hidden="true" /> Celestial browser
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1">
        <button type="button" onClick={() => onLane("bodies")} aria-pressed={lane === "bodies"} className={`min-h-9 border text-[6px] uppercase tracking-[.08em] ${lane === "bodies" ? "border-[#d9c18e]/30 text-[#f1ddb6]" : "border-white/8 text-white/38"}`}>Bodies · 16</button>
        <button type="button" onClick={() => onLane("stars")} aria-pressed={lane === "stars"} className={`min-h-9 border text-[6px] uppercase tracking-[.08em] ${lane === "stars" ? "border-[#d9c18e]/30 text-[#f1ddb6]" : "border-white/8 text-white/38"}`}>Stars · 24</button>
        <button type="button" onClick={() => onLane("moons")} aria-pressed={lane === "moons"} className={`min-h-9 border text-[6px] uppercase tracking-[.08em] ${lane === "moons" ? "border-[#d9c18e]/30 text-[#f1ddb6]" : "border-white/8 text-white/38"}`}>Moons · 12</button>
        <button type="button" onClick={() => onLane("deep")} aria-pressed={lane === "deep"} className={`min-h-9 border text-[6px] uppercase tracking-[.08em] ${lane === "deep" ? "border-[#d9c18e]/30 text-[#f1ddb6]" : "border-white/8 text-white/38"}`}>Deep · 24</button>
      </div>
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {lane === "bodies" ? MAJOR_BODIES_V592.map((body) => {
          const active = selectedBody === body.id;
          const orientation = resolveBodyOrientationV592(body.id, JULIAN_DATE_J2000_V592);
          return (
            <button
              key={body.id}
              type="button"
              onClick={() => onSelect(body.id)}
              aria-pressed={active}
              data-atlas-v592-body-button={body.id}
              className={`group flex min-h-10 items-center gap-2 border px-2.5 text-left text-[8px] uppercase tracking-[.11em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/70 ${active ? "border-[#d9c18e]/34 bg-black/78 text-[#f2ddb6]" : "border-white/[.07] bg-black/18 text-white/46 hover:border-white/18 hover:bg-black/58 hover:text-white/78"}`}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: body.accent }} />
              <span className="min-w-0 flex-1 truncate">{body.shortName}</span>
              <span className={`h-1 w-1 rounded-full ${orientation.authority.startsWith("rotation-admitted") ? "bg-emerald-300/70" : "bg-amber-300/70"}`} title={orientation.authority} />
            </button>
          );
        }) : lane === "stars" ? STELLAR_HEROES_V592.map((star) => {
          const active = selectedStarId === star.id;
          return (
            <button
              key={star.id}
              type="button"
              onClick={() => onSelectStar(star.id)}
              aria-pressed={active}
              data-atlas-v592-star-button={star.id}
              className={`group min-h-11 border px-2.5 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/70 ${active ? "border-[#d9c18e]/34 bg-black/78" : "border-white/[.07] bg-black/18 hover:border-white/18 hover:bg-black/58"}`}
            >
              <span className={`block truncate text-[8px] uppercase tracking-[.1em] ${active ? "text-[#f2ddb6]" : "text-white/58"}`}>{star.name}</span>
              <span className="mt-1 block truncate font-mono text-[6px] uppercase tracking-[.08em] text-white/28">{star.spectralType} · {star.temperatureK} K</span>
            </button>
          );
        }) : lane === "moons" ? MAJOR_MOON_MODELS_V592.map((moon) => {
          const active = selectedMajorMoonId === moon.bodyId;
          const assetAdmitted = isMajorMoonRuntimeHeroIdV592(moon.bodyId);
          return (
            <button
              key={moon.bodyId}
              type="button"
              onClick={() => onSelectMajorMoon(moon.bodyId)}
              aria-pressed={active}
              data-atlas-v592-major-moon-button={moon.bodyId}
              data-atlas-v592-major-moon-asset={assetAdmitted ? "albedo-admitted" : "asset-blocked"}
              className={`group flex min-h-11 items-center gap-2 border px-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/70 ${active ? "border-[#d9c18e]/34 bg-black/78" : "border-white/[.07] bg-black/18 hover:border-white/18 hover:bg-black/58"}`}
            >
              <Moon className={`h-3 w-3 shrink-0 ${assetAdmitted ? "text-[#d8c59f]/72" : "text-amber-200/38"}`} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[8px] uppercase tracking-[.1em] ${active ? "text-[#f2ddb6]" : "text-white/58"}`}>{moon.name}</span>
                <span className="mt-1 block truncate font-mono text-[6px] uppercase tracking-[.07em] text-white/28">{moon.parentBodyId} · {assetAdmitted ? "asset" : "blocked"}</span>
              </span>
              <span className={`h-1 w-1 shrink-0 rounded-full ${assetAdmitted ? "bg-emerald-300/70" : "bg-amber-300/55"}`} />
            </button>
          );
        }) : DEEP_SPACE_REFERENCE_OBJECTS_V592.map((entry) => {
          const active = selectedDeepSpaceId === entry.id;
          const visualAsset = deepSpaceVisualAssetForV592(entry.id);
          const visualLabel = deepSpaceVisualLabelV592(entry.id);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onSelectDeepSpace(entry.id)}
              aria-pressed={active}
              data-atlas-v592-deep-space-button={entry.id}
              data-atlas-v592-deep-space-visual-state={visualAsset ? visualAsset.visualModelKind : "asset-blocked"}
              className={`group min-h-11 border px-2.5 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/70 ${active ? "border-[#d9c18e]/34 bg-black/78" : "border-white/[.07] bg-black/18 hover:border-white/18 hover:bg-black/58"}`}
            >
              <span className={`block truncate text-[8px] uppercase tracking-[.1em] ${active ? "text-[#f2ddb6]" : "text-white/58"}`}>{entry.commonName}</span>
              <span className="mt-1 flex items-center justify-between gap-2 font-mono text-[6px] uppercase tracking-[.07em] text-white/28">
                <span>{entry.category} · {entry.catalogName.split(" /")[0]} · {visualLabel}</span>
                <span className={`h-1 w-1 shrink-0 rounded-full ${visualAsset ? "bg-emerald-200/60" : "bg-amber-200/55"}`} title={visualAsset ? `${visualLabel} visual model admitted` : "Visual asset blocked"} />
              </span>
            </button>
          );
        })}
        {lane === "bodies" ? <button
          type="button"
          onClick={() => setSmallOpen((open) => !open)}
          aria-expanded={smallOpen}
          className="mt-1 flex min-h-10 items-center justify-between border border-dashed border-white/12 px-2.5 text-[8px] uppercase tracking-[.1em] text-white/48 hover:border-white/24 hover:text-white/75"
        >
          <span className="flex items-center gap-2"><CircleDot className="h-3 w-3" /> Minor bodies</span>
          {smallOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button> : null}
        {lane === "bodies" && smallOpen ? SMALL_BODIES_V592.map((body) => (
          <button
            key={body.id}
            type="button"
            onClick={() => onSelect(body.id)}
            aria-pressed={selectedBody === body.id}
            data-atlas-v592-body-button={body.id}
            className={`ml-2 min-h-10 border px-2 text-left text-[7px] uppercase tracking-[.09em] ${selectedBody === body.id ? "border-[#d9c18e]/30 text-[#f2ddb6]" : "border-white/[.07] text-white/42 hover:text-white/72"}`}
          >
            {body.shortName}
          </button>
        )) : null}
      </div>
      <button
        type="button"
        onClick={onOverview}
        className="mt-3 flex min-h-11 items-center justify-center gap-2 border border-cyan-100/14 bg-cyan-100/[.025] text-[8px] uppercase tracking-[.12em] text-cyan-50/62 hover:text-cyan-50/88"
      >
        <Aperture className="h-3 w-3" /> Overview
      </button>
    </aside>
  );
}

function TimeRailV592({
  readout,
  onRate,
  onNow,
  onJ2000,
  onFocusSky,
}: Readonly<{
  readout: CelestialClockReadoutV592;
  onRate: (rate: CelestialTimeRateV592) => void;
  onNow: () => void;
  onJ2000: () => void;
  onFocusSky: (target: LivingUniverseFocusTargetV592) => void;
}>) {
  return (
    <div
      className="pointer-events-auto absolute bottom-3 left-[174px] right-[332px] z-30 hidden h-[74px] items-stretch border-y border-white/[.09] bg-[#020508]/78 backdrop-blur-lg lg:flex"
      data-atlas-v592-time-instrument-rail
    >
      <div className="flex w-[262px] shrink-0 flex-col justify-center border-r border-white/8 px-4 font-mono">
        <div className="flex items-center gap-2 text-[7px] uppercase tracking-[.18em] text-white/38"><Clock3 className="h-3 w-3" /> Celestial clock · UTC</div>
        <div className="mt-1 text-[11px] tabular-nums tracking-[.05em] text-[#ead9b8]">{readout.utcIso.replace(".000Z", "Z")}</div>
        <div className="mt-1 text-[7px] uppercase tracking-[.12em] text-white/32">JD {readout.julianDate.toFixed(6)} · J2000 {readout.daysSinceJ2000 >= 0 ? "+" : ""}{readout.daysSinceJ2000.toFixed(3)} d</div>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CELESTIAL_TIME_RATES_V592.map((rate) => (
          <button
            key={rate}
            type="button"
            onClick={() => onRate(rate)}
            aria-pressed={readout.rateSecondsPerSecond === rate}
            aria-label={`Set celestial time rate ${formatCelestialTimeRateV592(rate)}`}
            className={`grid min-h-11 min-w-11 shrink-0 place-items-center border px-2 text-[7px] uppercase tracking-[.08em] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/70 ${readout.rateSecondsPerSecond === rate ? "border-[#d9c18e]/35 bg-[#d9c18e]/10 text-[#f2ddb6]" : "border-white/8 text-white/40 hover:border-white/18 hover:text-white/72"}`}
          >
            {rate === 0 ? <Pause className="h-3 w-3" /> : rate === 1 ? <Play className="h-3 w-3" /> : formatCelestialTimeRateV592(rate).replace(" / S", "/s")}
          </button>
        ))}
        <button type="button" onClick={onNow} className="ml-1 min-h-11 shrink-0 border border-white/8 px-2 text-[7px] uppercase tracking-[.1em] text-white/42 hover:text-white/72">Now</button>
        <button type="button" onClick={onJ2000} className="min-h-11 shrink-0 border border-white/8 px-2 text-[7px] uppercase tracking-[.1em] text-white/42 hover:text-white/72">J2000</button>
      </div>
      <div className="flex w-[258px] shrink-0 items-center gap-1 overflow-x-auto border-l border-white/8 px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SKY_TARGETS_V592.map((target) => (
          <button key={target.id} type="button" onClick={() => onFocusSky(target.id)} data-atlas-v592-sky-target-kind={target.type} className="min-h-10 shrink-0 border border-white/8 px-2 text-[7px] uppercase tracking-[.08em] text-white/42 hover:text-white/74">{target.label}</button>
        ))}
      </div>
    </div>
  );
}

function InspectorV592({
  selectedBody,
  readout,
  manifestStatus,
  sceneMounted,
  onRelease,
  onRestore,
}: Readonly<{
  selectedBody: HeroBodyIdV590;
  readout: CelestialClockReadoutV592;
  manifestStatus: string;
  sceneMounted: boolean;
  onRelease: () => void;
  onRestore: () => void;
}>) {
  const spec = HERO_BODY_SPEC_BY_ID_V590[selectedBody];
  const orbit = CELESTIAL_ORBIT_BY_ID_V590[selectedBody];
  const orientation = resolveBodyOrientationV592(selectedBody, readout.julianDate);
  const admitted = orientation.authority === "rotation-admitted-iau-linear-reference";
  const kinematicAdmitted = orientation.kinematicAuthority.startsWith("rotation-kinematics-admitted");
  return (
    <aside className="pointer-events-auto absolute inset-y-0 right-0 z-30 hidden w-[320px] border-l border-white/10 bg-[#020407]/90 px-5 pb-5 pt-20 backdrop-blur-xl lg:block" data-atlas-v592-inspector>
      <div className="flex items-center gap-2 text-[8px] uppercase tracking-[.2em] text-white/38"><Database className="h-3 w-3" /> Object authority</div>
      <h2 className="mt-3 font-[family-name:var(--font-atlas-display,serif)] text-[24px] font-light tracking-[.04em] text-[#ead9b8]">{spec.name}</h2>
      <div className={`mt-3 inline-flex min-h-8 items-center gap-2 border px-2.5 text-[7px] uppercase tracking-[.12em] ${admitted ? "border-emerald-200/18 text-emerald-100/70" : "border-amber-200/20 text-amber-100/76"}`}>
        <ShieldCheck className="h-3 w-3" /> {admitted ? "IAU rotation admitted" : kinematicAdmitted ? "Catalog spin admitted · absolute W0 incomplete" : "Rotation authority incomplete"}
      </div>

      <dl className="mt-6 divide-y divide-white/[.07] font-mono text-[8px] text-white/58">
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Pole RA</dt><dd>{orientation.poleRaDeg === null ? "—" : `${orientation.poleRaDeg.toFixed(5)}°`}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Pole Dec</dt><dd>{orientation.poleDecDeg === null ? "—" : `${orientation.poleDecDeg.toFixed(5)}°`}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">{orientation.absolutePrimeMeridian ? "Prime W" : "Native W*"}</dt><dd>{orientation.primeMeridianDeg === null ? "—" : `${orientation.primeMeridianDeg.toFixed(4)}°`}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Spin</dt><dd>{orientation.signedRotationDegPerDay === null ? "—" : `${orientation.signedRotationDegPerDay > 0 ? "+" : ""}${orientation.signedRotationDegPerDay.toFixed(5)}°/d`}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Orbit label</dt><dd>{orbit.periodLabel}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Material</dt><dd className="max-w-[166px] text-right leading-relaxed">{spec.material}</dd></div>
      </dl>

      <div className="mt-6 border-l border-[#d9c18e]/20 pl-3 text-[7px] uppercase leading-relaxed tracking-[.11em] text-white/34">
        {orientation.absolutePrimeMeridian ? "NAIF PCK linear coefficients · J2000" : "JPL SBDB pole/period · v591 model-native W0"}<br />{orientation.absolutePrimeMeridian ? "Periodic libration/nutation not yet applied" : "Absolute physical prime meridian is not claimed"}<br />Scientific payload writeback: disabled
      </div>

      <div className="absolute bottom-5 left-5 right-5 border-t border-white/8 pt-4 font-mono text-[7px] uppercase leading-loose tracking-[.1em] text-white/32">
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          <button type="button" disabled={!sceneMounted} onClick={onRelease} className="min-h-10 border border-white/8 px-2 enabled:hover:text-white disabled:opacity-25">Release scene</button>
          <button type="button" disabled={sceneMounted} onClick={onRestore} className="min-h-10 border border-white/8 px-2 enabled:hover:text-white disabled:opacity-25">Restore scene</button>
        </div>
        <div>Candidate {compactShaV592(LIVING_UNIVERSE_MANIFEST_SHA256_V592)}</div>
        <div>Rotation {compactShaV592(CELESTIAL_ROTATION_PACKET_SHA256_V592)}</div>
        <div>Manifest state {manifestStatus}</div>
        <div>Formal {LIVING_UNIVERSE_FORMAL_PRODUCT_POINTER_V592} · read only</div>
      </div>
    </aside>
  );
}

function StellarInspectorV592({
  starId,
  manifestStatus,
  sceneMounted,
  onRelease,
  onRestore,
}: Readonly<{
  starId: StellarHeroIdV592;
  manifestStatus: string;
  sceneMounted: boolean;
  onRelease: () => void;
  onRestore: () => void;
}>) {
  const star = STELLAR_HERO_BY_ID_V592[starId];
  return (
    <aside className="pointer-events-auto absolute inset-y-0 right-0 z-30 hidden w-[320px] border-l border-white/10 bg-[#020407]/90 px-5 pb-5 pt-20 backdrop-blur-xl lg:block" data-atlas-v592-stellar-inspector>
      <div className="flex items-center gap-2 text-[8px] uppercase tracking-[.2em] text-white/38"><Star className="h-3 w-3" /> Stellar authority</div>
      <h2 className="mt-3 font-[family-name:var(--font-atlas-display,serif)] text-[24px] font-light tracking-[.04em] text-[#ead9b8]">{star.name}</h2>
      <div className="mt-1 font-mono text-[8px] uppercase tracking-[.14em] text-white/36">{star.spectralType} · Gaia anchor {star.gaiaSourceId}</div>
      <div className="mt-3 inline-flex min-h-8 items-center gap-2 border border-cyan-100/18 px-2.5 text-[7px] uppercase tracking-[.11em] text-cyan-50/68">
        <ShieldCheck className="h-3 w-3" /> Physics shader admitted · no surface-image claim
      </div>

      <dl className="mt-6 divide-y divide-white/[.07] font-mono text-[8px] text-white/58">
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Temperature</dt><dd>{star.temperatureK.toLocaleString()} K</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Radius</dt><dd>{star.radiusSolar.toFixed(2)} R☉</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Luminosity</dt><dd>{star.luminositySolar.toLocaleString()} L☉</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Distance</dt><dd>{star.distancePc.toFixed(2)} pc</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Parallax</dt><dd>{star.parallaxMas.toFixed(3)} mas</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Rotation</dt><dd>{star.rotationPeriodDays.toFixed(3)} d</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Oblateness</dt><dd>{star.equatorialPolarRadiusRatio.toFixed(3)} Req/Rpol</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Gaia bind</dt><dd className="max-w-[156px] text-right leading-relaxed">{star.gaiaCrossmatchStatus}</dd></div>
      </dl>

      <div className="mt-5 border-l border-[#d9c18e]/20 pl-3 text-[7px] uppercase leading-relaxed tracking-[.1em] text-white/34">
        Photosphere: {star.authority.photosphere}<br />Radius: {star.authority.radius}<br />Rotation: {star.authority.rotationPeriod}
      </div>

      <div className="absolute bottom-5 left-5 right-5 border-t border-white/8 pt-4 font-mono text-[7px] uppercase leading-loose tracking-[.1em] text-white/32">
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          <button type="button" disabled={!sceneMounted} onClick={onRelease} className="min-h-10 border border-white/8 px-2 enabled:hover:text-white disabled:opacity-25">Release scene</button>
          <button type="button" disabled={sceneMounted} onClick={onRestore} className="min-h-10 border border-white/8 px-2 enabled:hover:text-white disabled:opacity-25">Restore scene</button>
        </div>
        <div>Stellar {compactShaV592(STELLAR_HERO_PACKET_SHA256_V592)}</div>
        <div>Candidate {compactShaV592(LIVING_UNIVERSE_MANIFEST_SHA256_V592)}</div>
        <div>Manifest state {manifestStatus}</div>
        <div>Formal {LIVING_UNIVERSE_FORMAL_PRODUCT_POINTER_V592} · read only</div>
      </div>
    </aside>
  );
}

function NebulaInspectorV592({
  nebulaId,
  manifestStatus,
  sceneMounted,
  onRelease,
  onRestore,
}: Readonly<{
  nebulaId: NebulaVisualIdV592;
  manifestStatus: string;
  sceneMounted: boolean;
  onRelease: () => void;
  onRestore: () => void;
}>) {
  const nebula = NEBULA_ALL_VISUAL_CATALOG_V592.find((entry) => entry.id === nebulaId);
  if (!nebula) return null;
  return (
    <aside className="pointer-events-auto absolute inset-y-0 right-0 z-30 hidden w-[320px] border-l border-white/10 bg-[#020407]/90 px-5 pb-5 pt-20 backdrop-blur-xl lg:block" data-atlas-v592-nebula-inspector>
      <div className="flex items-center gap-2 text-[8px] uppercase tracking-[.2em] text-white/38"><Aperture className="h-3 w-3" /> Deep-field identity</div>
      <h2 className="mt-3 font-[family-name:var(--font-atlas-display,serif)] text-[24px] font-light tracking-[.04em] text-[#ead9b8]">{nebula.catalogName}</h2>
      <div className="mt-1 font-mono text-[8px] uppercase tracking-[.14em] text-white/36">{nebula.id.replaceAll("-", " ")} · {nebula.nasaId}</div>
      <div className="mt-3 inline-flex min-h-8 items-center gap-2 border border-cyan-100/18 px-2.5 text-[7px] uppercase tracking-[.11em] text-cyan-50/68">
        <ShieldCheck className="h-3 w-3" /> J2000 coordinate admitted · image presentation only
      </div>

      <dl className="mt-6 divide-y divide-white/[.07] font-mono text-[8px] text-white/58">
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Right ascension</dt><dd>{nebula.raDeg.toFixed(6)}°</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Declination</dt><dd>{nebula.decDeg.toFixed(6)}°</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Angular size</dt><dd>{nebula.angularSizeDeg.toFixed(4)}°</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Bands</dt><dd className="max-w-[158px] text-right uppercase leading-relaxed">{nebula.bands.join(" · ")}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Full layers</dt><dd>4 desktop · 2 mobile</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Science image</dt><dd>disabled</dd></div>
      </dl>

      <div className="mt-6 border-l border-[#d9c18e]/20 pl-3 text-[7px] uppercase leading-relaxed tracking-[.11em] text-white/34">
        Mapped/composite observation color<br />Not a naked-eye representation<br />Cinematic presentation state only<br />Scientific payload writeback: disabled
      </div>

      <div className="absolute bottom-5 left-5 right-5 border-t border-white/8 pt-4 font-mono text-[7px] uppercase leading-loose tracking-[.1em] text-white/32">
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          <button type="button" disabled={!sceneMounted} onClick={onRelease} className="min-h-10 border border-white/8 px-2 enabled:hover:text-white disabled:opacity-25">Release scene</button>
          <button type="button" disabled={sceneMounted} onClick={onRestore} className="min-h-10 border border-white/8 px-2 enabled:hover:text-white disabled:opacity-25">Restore scene</button>
        </div>
        <div>Nebula {compactShaV592(nebulaVisualManifestShaForIdV592(nebulaId))}</div>
        <div>Candidate {compactShaV592(LIVING_UNIVERSE_MANIFEST_SHA256_V592)}</div>
        <div>Manifest state {manifestStatus}</div>
        <div>Formal {LIVING_UNIVERSE_FORMAL_PRODUCT_POINTER_V592} · read only</div>
      </div>
    </aside>
  );
}

function DeepSpaceReferenceInspectorV592({
  objectId,
  mode,
  manifestStatus,
  sceneMounted,
  onRelease,
  onRestore,
}: Readonly<{
  objectId: DeepSpaceReferenceIdV592;
  mode: CelestialModeV590;
  manifestStatus: string;
  sceneMounted: boolean;
  onRelease: () => void;
  onRestore: () => void;
}>) {
  const object = DEEP_SPACE_REFERENCE_BY_ID_V592[objectId];
  const visualCandidate = object.visualMetadata.candidateCount > 0;
  const visualAsset = isDeepSpaceVisualIdV592(objectId)
    ? DEEP_SPACE_VISUAL_ASSETS_V592.find((asset) => asset.target === objectId)
    : undefined;
  const analyticVisual = visualAsset?.visualModelKind === "openngc-catalog-derived-galaxy-analytic";
  return (
    <aside className="pointer-events-auto absolute inset-y-0 right-0 z-30 hidden w-[320px] flex-col border-l border-white/10 bg-[#020407]/90 px-5 pb-5 pt-20 backdrop-blur-xl lg:flex" data-atlas-v592-deep-space-inspector>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex items-center gap-2 text-[8px] uppercase tracking-[.2em] text-white/38"><Aperture className="h-3 w-3" /> J2000 deep-space reference</div>
      <h2 className="mt-3 font-[family-name:var(--font-atlas-display,serif)] text-[24px] font-light tracking-[.04em] text-[#ead9b8]">{object.commonName}</h2>
      <div className="mt-1 font-mono text-[8px] uppercase tracking-[.14em] text-white/36">{object.catalogName} · {object.labelZh}</div>
      <div className="mt-3 inline-flex min-h-8 items-center gap-2 border border-cyan-100/18 px-2.5 text-[7px] uppercase tracking-[.11em] text-cyan-50/68">
        <ShieldCheck className="h-3 w-3" /> 24/24 coordinate reference admitted
      </div>
      <div className={`mt-2 inline-flex min-h-8 items-center gap-2 border px-2.5 text-[7px] uppercase tracking-[.11em] ${visualAsset ? "border-emerald-100/18 text-emerald-50/70" : visualCandidate ? "border-sky-100/15 text-sky-50/58" : "border-amber-100/18 text-amber-50/68"}`}>
        {visualAsset
          ? mode === "science"
            ? `${analyticVisual ? "Analytic catalog model" : visualAsset.catalogDerivedVisualModel ? "Catalog visual" : "Observation"} admitted · Science marker only`
            : analyticVisual ? "OpenNGC analytic galaxy · Cinematic only" : visualAsset.catalogDerivedVisualModel ? "Gaia catalog field · Cinematic only" : "NASA observation admitted · Cinematic only"
          : visualCandidate ? "NASA metadata reviewed · asset blocked" : "Visual source blocked · no placeholder"}
      </div>

      <dl className="mt-6 divide-y divide-white/[.07] font-mono text-[8px] text-white/58">
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Right ascension</dt><dd>{object.raDeg.toFixed(6)}°</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Declination</dt><dd>{object.decDeg.toFixed(6)}°</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Angular extent</dt><dd>{object.angularSize.majorArcmin.toFixed(2)}′ × {object.angularSize.minorArcmin.toFixed(2)}′</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Position angle</dt><dd>{object.angularSize.positionAngleDeg === null ? "not published" : `${object.angularSize.positionAngleDeg.toFixed(2)}°`}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Distance</dt><dd>{formatDeepSpaceDistanceV592(object.distancePc)}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Visual candidates</dt><dd>{object.visualMetadata.candidateCount}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Source bands</dt><dd className="max-w-[158px] text-right uppercase leading-relaxed">{visualAsset?.source.observationEncoding.bands.join(" · ") ?? "blocked"}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Visual policy</dt><dd>{analyticVisual ? "OpenNGC analytic" : visualAsset ? visualAsset.catalogDerivedVisualModel ? "Gaia-derived" : "mapped color" : "none"}</dd></div>
      </dl>

      <div className="mt-6 border-l border-[#d9c18e]/20 pl-3 text-[7px] uppercase leading-relaxed tracking-[.11em] text-white/34">
        OpenNGC ICRS/J2000 footprint<br />Distance is inherited catalog context<br />Science mode: marker only<br />Presentation: {analyticVisual ? "deterministic analytic model" : visualAsset ? "observation image, Cinematic only" : "asset blocked"}<br />{visualAsset ? "Not a naked-eye representation" : "No procedural placeholder"}<br />Scientific payload writeback: disabled
      </div>
      </div>

      <div className="mt-3 shrink-0 border-t border-white/8 pt-3 font-mono text-[7px] uppercase leading-loose tracking-[.1em] text-white/32">
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          <button type="button" disabled={!sceneMounted} onClick={onRelease} className="min-h-10 border border-white/8 px-2 enabled:hover:text-white disabled:opacity-25">Release scene</button>
          <button type="button" disabled={sceneMounted} onClick={onRestore} className="min-h-10 border border-white/8 px-2 enabled:hover:text-white disabled:opacity-25">Restore scene</button>
        </div>
        <div>Reference {compactShaV592(DEEP_SPACE_REFERENCE_PACKET_SHA256_V592)}</div>
        <div>Visual {visualAsset ? compactShaV592(DEEP_SPACE_VISUAL_MANIFEST_SHA256_V592) : "blocked"}</div>
        <div>Candidate {compactShaV592(LIVING_UNIVERSE_MANIFEST_SHA256_V592)}</div>
        <div>Manifest state {manifestStatus}</div>
        <div>Formal {LIVING_UNIVERSE_FORMAL_PRODUCT_POINTER_V592} · read only</div>
      </div>
    </aside>
  );
}

function MajorMoonInspectorV592({
  moonId,
  readout,
  manifestStatus,
  sceneMounted,
  onRelease,
  onRestore,
}: Readonly<{
  moonId: MajorMoonIdV592;
  readout: CelestialClockReadoutV592;
  manifestStatus: string;
  sceneMounted: boolean;
  onRelease: () => void;
  onRestore: () => void;
}>) {
  const moon = MAJOR_MOON_BY_ID_V592[moonId];
  const orientation = resolveMajorMoonRotationV592(moonId, readout.julianDate);
  const visual = MAJOR_MOON_VISUAL_ASSETS_V592.find((asset) => asset.target === moonId);
  const assetAdmitted = isMajorMoonRuntimeHeroIdV592(moonId) && Boolean(visual);
  return (
    <aside className="pointer-events-auto absolute inset-y-0 right-0 z-30 hidden w-[320px] border-l border-white/10 bg-[#020407]/90 px-5 pb-5 pt-20 backdrop-blur-xl lg:block" data-atlas-v592-major-moon-inspector>
      <div className="flex items-center gap-2 text-[8px] uppercase tracking-[.2em] text-white/38"><Moon className="h-3 w-3" /> Satellite authority</div>
      <h2 className="mt-3 font-[family-name:var(--font-atlas-display,serif)] text-[24px] font-light tracking-[.04em] text-[#ead9b8]">{moon.name}</h2>
      <div className="mt-1 font-mono text-[8px] uppercase tracking-[.14em] text-white/36">NAIF {moon.naifId} · {moon.parentBodyId} system</div>
      <div className={`mt-3 inline-flex min-h-8 items-center gap-2 border px-2.5 text-[7px] uppercase tracking-[.11em] ${assetAdmitted ? "border-emerald-100/18 text-emerald-50/70" : "border-amber-100/20 text-amber-50/72"}`}>
        <ShieldCheck className="h-3 w-3" /> {assetAdmitted ? "NASA global map admitted · runtime Hero candidate" : "Asset blocked · no placeholder"}
      </div>

      <dl className="mt-6 divide-y divide-white/[.07] font-mono text-[8px] text-white/58">
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Pole RA</dt><dd>{orientation.poleRaDeg.toFixed(5)}°</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Pole Dec</dt><dd>{orientation.poleDecDeg.toFixed(5)}°</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Prime W</dt><dd>{orientation.primeMeridianDeg.toFixed(5)}°</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Spin</dt><dd>{orientation.signedRotationDegPerDay > 0 ? "+" : ""}{orientation.signedRotationDegPerDay.toFixed(6)}°/d</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Direction</dt><dd>{orientation.direction}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Source</dt><dd>{visual?.nasaId ?? "blocked"}</dd></div>
        <div className="flex justify-between gap-4 py-3"><dt className="uppercase tracking-[.12em] text-white/34">Encoding</dt><dd className="max-w-[158px] text-right leading-relaxed">{visual?.observationColorPolicy ?? "none"}</dd></div>
      </dl>

      <div className="mt-6 border-l border-[#d9c18e]/20 pl-3 text-[7px] uppercase leading-relaxed tracking-[.11em] text-white/34">
        IAU linear attitude · J2000<br />Periodic libration terms not applied<br />Inspection size is presentation scale<br />Scientific payload writeback: disabled
      </div>

      <div className="absolute bottom-5 left-5 right-5 border-t border-white/8 pt-4 font-mono text-[7px] uppercase leading-loose tracking-[.1em] text-white/32">
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          <button type="button" disabled={!sceneMounted} onClick={onRelease} className="min-h-10 border border-white/8 px-2 enabled:hover:text-white disabled:opacity-25">Release scene</button>
          <button type="button" disabled={sceneMounted} onClick={onRestore} className="min-h-10 border border-white/8 px-2 enabled:hover:text-white disabled:opacity-25">Restore scene</button>
        </div>
        <div>Moon assets {compactShaV592(MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592)}</div>
        <div>Candidate {compactShaV592(LIVING_UNIVERSE_MANIFEST_SHA256_V592)}</div>
        <div>Manifest state {manifestStatus}</div>
        <div>Formal {LIVING_UNIVERSE_FORMAL_PRODUCT_POINTER_V592} · read only</div>
      </div>
    </aside>
  );
}

function MobileSheetV592({
  open,
  selectedBody,
  selectedStarId,
  selectedMajorMoonId,
  focusTarget,
  readout,
  mode,
  onToggle,
  onSelect,
  onSelectStar,
  onSelectMajorMoon,
  onFocusSky,
  onMode,
  onRate,
}: Readonly<{
  open: boolean;
  selectedBody: HeroBodyIdV590;
  selectedStarId: StellarHeroIdV592 | null;
  selectedMajorMoonId: MajorMoonIdV592 | null;
  focusTarget: LivingUniverseFocusTargetV592;
  readout: CelestialClockReadoutV592;
  mode: CelestialModeV590;
  onToggle: () => void;
  onSelect: (body: HeroBodyIdV590) => void;
  onSelectStar: (star: StellarHeroIdV592) => void;
  onSelectMajorMoon: (moon: MajorMoonIdV592) => void;
  onFocusSky: (target: LivingUniverseFocusTargetV592) => void;
  onMode: (mode: CelestialModeV590) => void;
  onRate: (rate: CelestialTimeRateV592) => void;
}>) {
  return (
    <div className={`pointer-events-auto absolute inset-x-2 bottom-2 z-50 border border-white/12 bg-[#020609]/94 shadow-[0_-24px_80px_rgba(0,0,0,.68)] backdrop-blur-xl transition-transform md:hidden ${open ? "translate-y-0" : "translate-y-[calc(100%-62px)]"}`} data-atlas-v592-mobile-sheet data-atlas-v592-mobile-sheet-state={open ? "open" : "closed-inert"}>
      <button type="button" onClick={onToggle} className="flex h-[60px] w-full items-center justify-between px-4 text-left" aria-expanded={open} aria-controls="atlas-v592-mobile-controls">
        <div className="min-w-0"><span className="block text-[7px] uppercase tracking-[.18em] text-white/36">{readout.utcIso.slice(0, 19).replace("T", " · ")} UTC</span><span className="mt-1 block truncate text-[12px] uppercase tracking-[.13em] text-[#ead5b1]" data-atlas-v592-mobile-focus-label>{resolveMobileFocusLabelV592({ selectedBody, selectedStarId, selectedMajorMoonId, focusTarget })} · {formatCelestialTimeRateV592(readout.rateSecondsPerSecond)}</span></div>
        {open ? <ChevronDown className="h-4 w-4 text-white/42" /> : <ChevronUp className="h-4 w-4 text-white/42" />}
      </button>
      <div id="atlas-v592-mobile-controls" className="max-h-[60dvh] overflow-y-auto border-t border-white/8 px-3 pb-4 pt-3" aria-hidden={!open} inert={!open}>
        <div className="grid grid-cols-2 gap-1.5">
          <ModeControlV592 mode="science" active={mode === "science"} onClick={() => onMode("science")} />
          <ModeControlV592 mode="cinematic" active={mode === "cinematic"} onClick={() => onMode("cinematic")} />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {([-3_600, 0, 60, 3_600] as const).map((rate) => (
            <button key={rate} type="button" onClick={() => onRate(rate)} aria-pressed={readout.rateSecondsPerSecond === rate} className={`min-h-11 border px-1 text-[7px] uppercase tracking-[.06em] ${readout.rateSecondsPerSecond === rate ? "border-[#d9c18e]/35 text-[#f1ddb6]" : "border-white/8 text-white/44"}`}>{formatCelestialTimeRateV592(rate).replace(" / S", "/s")}</button>
          ))}
        </div>
        <div className="mt-3 border-t border-white/8 pt-3" data-atlas-v592-mobile-sky-reference>
          <div className="mb-2 text-[8px] uppercase tracking-[.16em] text-white/38">Sky reference · J2000</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onFocusSky("overview")}
              className={`min-h-11 border px-2 text-[7px] uppercase tracking-[.07em] ${focusTarget === "overview" ? "border-[#d9c18e]/35 text-[#f1ddb6]" : "border-white/8 text-white/44"}`}
            >
              Overview
            </button>
            {SKY_TARGETS_V592.filter((target) => target.type !== "nebula").map((target) => (
              <button
                key={target.id}
                type="button"
                onClick={() => onFocusSky(target.id)}
                data-atlas-v592-mobile-sky-target-kind={target.type}
                className={`min-h-11 border px-2 text-[7px] uppercase tracking-[.07em] ${focusTarget === target.id ? "border-[#d9c18e]/35 text-[#f1ddb6]" : "border-white/8 text-white/44"}`}
              >
                {target.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {HERO_BODY_SPECS_V590.map((body) => (
            <button key={body.id} type="button" onClick={() => onSelect(body.id)} className={`min-h-11 border px-1 text-[7px] uppercase tracking-[.06em] ${selectedBody === body.id ? "border-[#d9c18e]/35 text-[#f1ddb6]" : "border-white/8 text-white/44"}`}>{body.shortName}</button>
          ))}
        </div>
        <div className="mt-3 border-t border-white/8 pt-3">
          <div className="mb-2 text-[8px] uppercase tracking-[.16em] text-white/38">Major moons · 12</div>
          <div className="grid grid-cols-3 gap-1.5">
            {MAJOR_MOON_MODELS_V592.map((moon) => (
              <button key={moon.bodyId} type="button" onClick={() => onSelectMajorMoon(moon.bodyId)} data-atlas-v592-major-moon-asset={isMajorMoonRuntimeHeroIdV592(moon.bodyId) ? "albedo-admitted" : "asset-blocked"} className={`min-h-11 border px-1 text-[6px] uppercase tracking-[.05em] ${selectedMajorMoonId === moon.bodyId ? "border-[#d9c18e]/35 text-[#f1ddb6]" : isMajorMoonRuntimeHeroIdV592(moon.bodyId) ? "border-white/8 text-white/42" : "border-amber-100/10 text-amber-100/32"}`}>{moon.name}</button>
            ))}
          </div>
        </div>
        <div className="mt-3 border-t border-white/8 pt-3">
          <div className="mb-2 text-[8px] uppercase tracking-[.16em] text-white/38">Stellar inspection · 24</div>
          <div className="grid grid-cols-3 gap-1.5">
            {STELLAR_HEROES_V592.map((star) => (
              <button key={star.id} type="button" onClick={() => onSelectStar(star.id)} className={`min-h-11 border px-1 text-[6px] uppercase tracking-[.05em] ${selectedStarId === star.id ? "border-[#d9c18e]/35 text-[#f1ddb6]" : "border-white/8 text-white/42"}`}>{star.name}</button>
            ))}
          </div>
        </div>
        <div className="mt-3 border-t border-white/8 pt-3">
          <div className="mb-2 text-[8px] uppercase tracking-[.16em] text-white/38">Deep field · J2000</div>
          <div className="grid grid-cols-3 gap-1.5">
            {SKY_TARGETS_V592.filter((target) => target.type === "nebula").map((target) => (
              <button key={target.id} type="button" onClick={() => onFocusSky(target.id)} className={`min-h-11 border px-1 text-[6px] uppercase tracking-[.05em] ${focusTarget === target.id ? "border-[#d9c18e]/35 text-[#f1ddb6]" : "border-white/8 text-white/42"}`}>{target.label}</button>
            ))}
          </div>
        </div>
        <div className="mt-3 border-t border-white/8 pt-3" data-atlas-v592-mobile-galaxy-reference-browser>
          <div className="mb-2 text-[8px] uppercase tracking-[.16em] text-white/38">Galaxy references · 12</div>
          <div className="grid grid-cols-3 gap-1.5">
            {DEEP_SPACE_GALAXIES_V592.map((entry) => {
              const visualAsset = deepSpaceVisualAssetForV592(entry.id);
              return <button key={entry.id} type="button" onClick={() => onFocusSky(entry.id)} data-atlas-v592-deep-space-visual-state={visualAsset?.visualModelKind ?? "asset-blocked"} className={`min-h-11 border px-1 text-[6px] uppercase tracking-[.05em] ${focusTarget === entry.id ? "border-[#d9c18e]/35 text-[#f1ddb6]" : visualAsset ? "border-white/8 text-white/42" : "border-amber-100/10 text-amber-100/32"}`}>{entry.commonName}</button>;
            })}
          </div>
        </div>
        <div className="mt-3 border-t border-white/8 pt-3" data-atlas-v592-mobile-cluster-reference-browser>
          <div className="mb-2 text-[8px] uppercase tracking-[.16em] text-white/38">Cluster references · 12</div>
          <div className="grid grid-cols-3 gap-1.5">
            {DEEP_SPACE_CLUSTERS_V592.map((entry) => {
              const visualAsset = deepSpaceVisualAssetForV592(entry.id);
              return <button key={entry.id} type="button" onClick={() => onFocusSky(entry.id)} data-atlas-v592-deep-space-visual-state={visualAsset?.visualModelKind ?? "asset-blocked"} className={`min-h-11 border px-1 text-[6px] uppercase tracking-[.05em] ${focusTarget === entry.id ? "border-[#d9c18e]/35 text-[#f1ddb6]" : visualAsset ? "border-white/8 text-white/42" : "border-amber-100/10 text-amber-100/32"}`}>{entry.commonName}</button>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrbitAtlasLivingUniverseV592() {
  const rootRef = useRef<HTMLElement>(null);
  const deviceTier = useDeviceTierV592();
  const deliveryTier: CelestialDeliveryTierV590 = process.env.NEXT_PUBLIC_ATLAS_CELESTIAL_DELIVERY_TIER === "vercel-lite"
    || process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "vercel-lite"
    ? "vercel-lite"
    : "standalone-full";
  // A one-hour-per-second default makes physical rotation legible in the
  // living-universe candidate while preserving the absolute-Julian-Date path.
  const clock = useMemo(() => createCelestialClockControllerV592({ initialRate: 3_600 }), []);
  const readout = useClockReadoutV592(clock);
  const [mode, setMode] = useState<CelestialModeV590>("cinematic");
  const [selectedBody, setSelectedBody] = useState<HeroBodyIdV590>("earth");
  const [selectedStarId, setSelectedStarId] = useState<StellarHeroIdV592 | null>(null);
  const [selectedMajorMoonId, setSelectedMajorMoonId] = useState<MajorMoonIdV592 | null>(null);
  const [browserLane, setBrowserLane] = useState<"bodies" | "stars" | "moons" | "deep">("bodies");
  const [focusTarget, setFocusTarget] = useState<LivingUniverseFocusTargetV592>("earth");
  const [exposurePreset] = useState<CelestialExposurePresetV590>("nominal");
  const [cleanView, setCleanView] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [sceneMounted, setSceneMounted] = useState(true);
  const [releaseCycles, setReleaseCycles] = useState(0);
  const [manifestStatus, setManifestStatus] = useState("loading");
  const [baselineAdmissions, setBaselineAdmissions] = useState(INITIAL_ADMISSIONS_V592);
  const [scientificProjection, setScientificProjection] = useState<ScientificProjectionStateV590 | null>(null);
  const [payloadProbeStatus, setPayloadProbeStatus] = useState<"loading" | "connected-stable" | "blocked-not-connected" | "blocked-mutation">("loading");
  const scientificProjectionBaselineRef = useRef<string | null>(null);
  const baselineRef = useRef(getAtlasResourceSnapshot());
  const livingFocusTarget: LivingUniverseFocusTargetV592 = selectedMajorMoonId ? "milky-way-center" : selectedStarId ? "sun" : focusTarget;
  const baselineFocusTarget: CelestialFocusTargetV590 = selectedMajorMoonId
    ? "milky-way-center"
    : isNebulaVisualFocusTargetV592(livingFocusTarget) || isDeepSpaceReferenceIdV592(livingFocusTarget)
    ? "milky-way-center"
    : livingFocusTarget;
  const profile = useMemo<CelestialRenderProfileV590>(() => ({
    mode,
    deliveryTier,
    deviceTier,
    selectedBody,
    focusTarget: baselineFocusTarget,
    exposurePreset,
    qualityTier: livingFocusTarget === "overview" ? "overview" : "closeup",
    cleanView,
    // The sealed v591 materials retain their v590/v591 presentation seed;
    // CelestialClockV592 drives physical orientation through a separate bridge.
    presentationEpoch: 590,
  }), [baselineFocusTarget, cleanView, deliveryTier, deviceTier, exposurePreset, livingFocusTarget, mode, selectedBody]);
  const selectedOrientation = useMemo(
    () => resolveBodyOrientationV592(selectedBody, readout.julianDate),
    [readout.julianDate, selectedBody],
  );
  useFpsTelemetryV592(rootRef, canvasReady, `${deviceTier}:${selectedMajorMoonId ? `moon-${selectedMajorMoonId}` : selectedStarId ? `star-${selectedStarId}` : livingFocusTarget}:${mode}`);
  useHeapTelemetryV592(rootRef, canvasReady);

  useEffect(() => {
    const abort = new AbortController();
    void Promise.all([
      loadVisualAssetManifestV590(abort.signal),
      fetch("/data/living-universe-v592/manifest.json", { cache: "no-store", signal: abort.signal }).then(async (response) => {
        if (!response.ok) throw new Error(`v592-manifest-fetch:${response.status}`);
        return response.json() as Promise<{ version?: string; manifestSha256?: string; status?: string }>;
      }),
    ]).then(([baseline, candidate]) => {
      if (
        candidate.version !== LIVING_UNIVERSE_VERSION_V592
        || candidate.manifestSha256 !== LIVING_UNIVERSE_MANIFEST_SHA256_V592
        || typeof candidate.status !== "string"
      ) throw new Error("v592-manifest-identity");
      setBaselineAdmissions(baseline.heroBodies);
      setManifestStatus(candidate.status);
    }).catch((error: unknown) => {
      if (!abort.signal.aborted) setManifestStatus(error instanceof Error ? error.message : "blocked");
    });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(CELESTIAL_RENDERING_SCIENTIFIC_PROJECTION_URL_V590, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`v592-scientific-projection-fetch:${response.status}`);
        return createScientificProjectionStateV590(await response.json());
      })
      .then((projection) => {
        if (controller.signal.aborted) return;
        scientificProjectionBaselineRef.current = serializeScientificProjectionStateV590(projection);
        setScientificProjection(projection);
        setPayloadProbeStatus("connected-stable");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        scientificProjectionBaselineRef.current = null;
        setScientificProjection(null);
        setPayloadProbeStatus("blocked-not-connected");
      });
    return () => controller.abort();
  }, []);

  const guardMutation = useCallback((mutation: () => void) => {
    const before = scientificProjection ? serializeScientificProjectionStateV590(scientificProjection) : null;
    mutation();
    queueMicrotask(() => {
      if (!scientificProjection || before === null || !scientificProjectionBaselineRef.current) {
        setPayloadProbeStatus("blocked-not-connected");
        return;
      }
      const after = serializeScientificProjectionStateV590(scientificProjection);
      setPayloadProbeStatus(
        Object.isFrozen(scientificProjection)
        && before === after
        && after === scientificProjectionBaselineRef.current
        && scientificProjection.scientificPayloadWriteback === false
        && scientificProjection.scientificAuthorityChanged === false
          ? "connected-stable"
          : "blocked-mutation",
      );
    });
  }, [scientificProjection]);

  const selectBody = useCallback((body: HeroBodyIdV590) => guardMutation(() => {
    setSelectedStarId(null);
    setSelectedMajorMoonId(null);
    setSelectedBody(body);
    setFocusTarget(body);
  }), [guardMutation]);
  const selectStar = useCallback((starId: StellarHeroIdV592) => guardMutation(() => {
    setSelectedMajorMoonId(null);
    setSelectedStarId(starId);
    setFocusTarget("sun");
  }), [guardMutation]);
  const selectMajorMoon = useCallback((moonId: MajorMoonIdV592) => guardMutation(() => {
    setSelectedStarId(null);
    setSelectedMajorMoonId(moonId);
    setFocusTarget("milky-way-center");
  }), [guardMutation]);
  const selectDeepSpace = useCallback((target: DeepSpaceReferenceIdV592) => guardMutation(() => {
    setSelectedStarId(null);
    setSelectedMajorMoonId(null);
    setFocusTarget(target);
  }), [guardMutation]);
  const setClockRate = useCallback((rate: CelestialTimeRateV592) => guardMutation(() => clock.setRate(rate)), [clock, guardMutation]);
  const setClockEpoch = useCallback((julianDate: number) => guardMutation(() => clock.setJulianDate(julianDate)), [clock, guardMutation]);
  const setDisplayMode = useCallback((nextMode: CelestialModeV590) => guardMutation(() => {
    setMode(nextMode);
    if (nextMode === "science") setCleanView(false);
  }), [guardMutation]);

  const selectedAdmission: HeroAssetAdmissionV590 = HERO_OVERRIDE_ADMISSIONS_V591[selectedBody] === "admitted"
    ? "admitted"
    : baselineAdmissions[selectedBody];
  const selectedNebulaId = isNebulaVisualFocusTargetV592(livingFocusTarget) ? livingFocusTarget : null;
  const selectedDeepSpaceId = isDeepSpaceReferenceIdV592(livingFocusTarget) ? livingFocusTarget : null;
  const selectedDeepSpaceVisualAsset = selectedDeepSpaceId && isDeepSpaceVisualIdV592(selectedDeepSpaceId)
    ? DEEP_SPACE_VISUAL_ASSETS_V592.find((asset) => asset.target === selectedDeepSpaceId) ?? null
    : null;

  return (
    <section
      ref={rootRef}
      className="relative h-[100dvh] min-h-[640px] w-full overflow-hidden bg-[#000104] font-[family-name:var(--font-atlas-body,'IBM_Plex_Sans',sans-serif)] text-white"
      data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"
      data-atlas-v592-browser-acceptance-version="v592-living-universe-browser-acceptance"
      data-atlas-v592-candidate={LIVING_UNIVERSE_VERSION_V592}
      data-atlas-v592-manifest-sha={LIVING_UNIVERSE_MANIFEST_SHA256_V592}
      data-atlas-v592-source-manifest-sha={LIVING_UNIVERSE_SOURCE_MANIFEST_SHA256_V592}
      data-atlas-v592-manifest-status={manifestStatus}
      data-atlas-v592-formal-product-pointer={LIVING_UNIVERSE_FORMAL_PRODUCT_POINTER_V592}
      data-atlas-v592-runtime-baseline={LIVING_UNIVERSE_BASELINE_V592}
      data-atlas-v592-scientific-payload-sha={LIVING_UNIVERSE_SCIENTIFIC_PAYLOAD_SHA256_V592}
      data-atlas-v592-scientific-projection={scientificProjectionBaselineRef.current ?? "not-connected"}
      data-atlas-v592-payload-stable={payloadProbeStatus === "connected-stable" ? "true" : payloadProbeStatus}
      data-atlas-v592-scientific-writeback="false"
      data-atlas-v592-mode={mode}
      data-atlas-v592-selected-body={selectedBody}
      data-atlas-v592-selected-star={selectedStarId ?? "none"}
      data-atlas-v592-selected-major-moon={selectedMajorMoonId ?? "none"}
      data-atlas-v592-major-moon-motion-reference-count="12"
      data-atlas-v592-major-moon-runtime-candidate-count={MAJOR_MOON_RUNTIME_HERO_IDS_V592.length}
      data-atlas-v592-selected-object-kind={selectedMajorMoonId ? "major-moon-hero" : selectedStarId ? "stellar-hero" : selectedNebulaId ? "expanded-nebula" : selectedDeepSpaceId ? "deep-space-reference" : "body-hero"}
      data-atlas-v592-selected-object-id={selectedMajorMoonId ?? selectedStarId ?? selectedNebulaId ?? selectedDeepSpaceId ?? selectedBody}
      data-atlas-v592-selected-admission={selectedMajorMoonId ? isMajorMoonRuntimeHeroIdV592(selectedMajorMoonId) ? "runtime-hero-candidate" : "asset-blocked" : selectedStarId ? "physics-shader-admitted" : selectedNebulaId ? "presentation-only-asset-admitted" : selectedDeepSpaceId ? selectedDeepSpaceVisualAsset ? selectedDeepSpaceVisualAsset.visualModelKind === "openngc-catalog-derived-galaxy-analytic" ? "catalog-reference-and-openngc-analytic-visual-admitted" : selectedDeepSpaceVisualAsset.catalogDerivedVisualModel ? "catalog-reference-and-gaia-derived-visual-admitted" : "catalog-reference-and-presentation-image-admitted" : DEEP_SPACE_REFERENCE_BY_ID_V592[selectedDeepSpaceId].visualMetadata.candidateCount > 0 ? "catalog-reference-admitted-visual-metadata-only" : "catalog-reference-admitted-visual-asset-blocked" : selectedAdmission}
      data-atlas-v592-selected-rotation-authority={selectedMajorMoonId ? "rotation-admitted-iau-linear-reference" : selectedStarId ? "stellar-period-authority" : selectedNebulaId || selectedDeepSpaceId ? "not-applicable-deep-field" : selectedOrientation.authority}
      data-atlas-v592-selected-rotation-kinematic-authority={selectedMajorMoonId ? "absolute-prime-meridian-linear-reference" : selectedStarId ? STELLAR_HERO_BY_ID_V592[selectedStarId].authority.rotationPeriod : selectedNebulaId || selectedDeepSpaceId ? "not-applicable-deep-field" : selectedOrientation.kinematicAuthority}
      data-atlas-v592-focus-target={livingFocusTarget}
      data-atlas-v592-time-rate={readout.rateSecondsPerSecond}
      data-atlas-v592-time-direction={readout.rateSecondsPerSecond < 0 ? "reverse" : readout.rateSecondsPerSecond === 0 ? "paused" : "forward"}
      data-atlas-v592-julian-date={readout.julianDate.toFixed(8)}
      data-atlas-v592-single-canvas="true"
      data-atlas-v592-canvas-count="1"
      data-atlas-v592-scene-mounted={sceneMounted ? "true" : "false"}
      data-atlas-v592-resource-release-cycles={releaseCycles}
      data-atlas-v592-build-fingerprint={V592_PAGE_BUILD_FINGERPRINT}
      data-atlas-v592-production-promotion="false"
    >
      <div className={`absolute inset-0 transition-[right] duration-300 ${cleanView ? "" : "lg:right-[320px]"}`} data-atlas-v592-single-canvas-stage>
        <UniverseCanvasOverrideHostV591 mode={mode} deviceTier={deviceTier} onCanvasReady={() => setCanvasReady(true)}>
          {sceneMounted ? (
            <LivingUniverseStageV592
              profile={profile}
              baselineAdmissions={baselineAdmissions}
              baselineFocusTarget={baselineFocusTarget}
              livingFocusTarget={livingFocusTarget}
              clock={clock}
              stellarHeroId={selectedStarId}
              majorMoonId={selectedMajorMoonId}
            />
          ) : null}
          <CelestialConvergenceReleaseProbeV591 active={sceneMounted} baseline={baselineRef.current} />
        </UniverseCanvasOverrideHostV591>
      </div>

      {cleanView ? (
        <button type="button" onClick={() => setCleanView(false)} className="pointer-events-auto absolute right-4 top-4 z-50 flex min-h-11 items-center gap-2 border border-white/12 bg-black/54 px-3 text-[7px] uppercase tracking-[.18em] text-white/52 backdrop-blur-md hover:text-white/82"><Eye className="h-3 w-3" /> Exit clean view</button>
      ) : (
        <>
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-[190px] bg-[linear-gradient(90deg,rgba(0,1,4,.92)_0%,rgba(0,1,4,.55)_58%,transparent_100%)] md:block" />
          <header className="pointer-events-none absolute left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/8 bg-gradient-to-b from-black/82 to-black/0 px-4 lg:right-[320px]">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setMobileSheetOpen((open) => !open)} className="pointer-events-auto grid h-11 w-11 shrink-0 place-items-center border border-white/10 text-white/48 md:hidden" aria-label="Open Living Universe controls"><Menu className="h-4 w-4" /></button>
              <div className="min-w-0">
                <div className="truncate text-[9px] uppercase tracking-[.23em] text-[#e9c98f]/82 md:tracking-[.27em]"><span className="md:hidden">Orbit Atlas / Live</span><span className="hidden md:inline">Orbit Atlas / Living Universe</span></div>
                <div className="mt-1 hidden truncate text-[7px] uppercase tracking-[.16em] text-white/35 md:block">Absolute J2000 time · IAU attitude · v592 additive instrument</div>
              </div>
            </div>
            <div className="pointer-events-auto flex items-center gap-1.5">
              <ModeControlV592 mode="science" active={mode === "science"} onClick={() => setDisplayMode("science")} />
              <ModeControlV592 mode="cinematic" active={mode === "cinematic"} onClick={() => setDisplayMode("cinematic")} />
              <button type="button" disabled={mode !== "cinematic"} onClick={() => setCleanView(true)} className="hidden min-h-10 items-center gap-2 border border-white/10 px-3 text-[7px] uppercase tracking-[.14em] text-white/42 enabled:hover:text-white/76 disabled:opacity-20 md:flex"><EyeOff className="h-3 w-3" /> Clean view</button>
            </div>
          </header>

          <BodyBrowserV592
            lane={browserLane}
            selectedBody={selectedBody}
            selectedStarId={selectedStarId}
            selectedMajorMoonId={selectedMajorMoonId}
            selectedDeepSpaceId={selectedDeepSpaceId}
            onLane={setBrowserLane}
            onSelect={selectBody}
            onSelectStar={selectStar}
            onSelectMajorMoon={selectMajorMoon}
            onSelectDeepSpace={selectDeepSpace}
            onOverview={() => guardMutation(() => { setSelectedStarId(null); setSelectedMajorMoonId(null); setFocusTarget("overview"); })}
          />
          {selectedMajorMoonId ? (
            <MajorMoonInspectorV592
              moonId={selectedMajorMoonId}
              readout={readout}
              manifestStatus={manifestStatus}
              sceneMounted={sceneMounted}
              onRelease={() => { setSceneMounted(false); setReleaseCycles((count) => count + 1); }}
              onRestore={() => setSceneMounted(true)}
            />
          ) : selectedStarId ? (
            <StellarInspectorV592
              starId={selectedStarId}
              manifestStatus={manifestStatus}
              sceneMounted={sceneMounted}
              onRelease={() => { setSceneMounted(false); setReleaseCycles((count) => count + 1); }}
              onRestore={() => setSceneMounted(true)}
            />
          ) : selectedNebulaId ? (
            <NebulaInspectorV592
              nebulaId={selectedNebulaId}
              manifestStatus={manifestStatus}
              sceneMounted={sceneMounted}
              onRelease={() => { setSceneMounted(false); setReleaseCycles((count) => count + 1); }}
              onRestore={() => setSceneMounted(true)}
            />
          ) : selectedDeepSpaceId ? (
            <DeepSpaceReferenceInspectorV592
              objectId={selectedDeepSpaceId}
              mode={mode}
              manifestStatus={manifestStatus}
              sceneMounted={sceneMounted}
              onRelease={() => { setSceneMounted(false); setReleaseCycles((count) => count + 1); }}
              onRestore={() => setSceneMounted(true)}
            />
          ) : (
            <InspectorV592
              selectedBody={selectedBody}
              readout={readout}
              manifestStatus={manifestStatus}
              sceneMounted={sceneMounted}
              onRelease={() => { setSceneMounted(false); setReleaseCycles((count) => count + 1); }}
              onRestore={() => setSceneMounted(true)}
            />
          )}
          <TimeRailV592
            readout={readout}
            onRate={setClockRate}
            onNow={() => setClockEpoch(unixMillisecondsToJulianDateV592(Date.now()))}
            onJ2000={() => setClockEpoch(JULIAN_DATE_J2000_V592)}
            onFocusSky={(target) => guardMutation(() => { setSelectedStarId(null); setSelectedMajorMoonId(null); setFocusTarget(target); })}
          />
          <MobileSheetV592
            open={mobileSheetOpen}
            selectedBody={selectedBody}
            selectedStarId={selectedStarId}
            selectedMajorMoonId={selectedMajorMoonId}
            focusTarget={livingFocusTarget}
            readout={readout}
            mode={mode}
            onToggle={() => setMobileSheetOpen((open) => !open)}
            onSelect={(body) => { selectBody(body); setMobileSheetOpen(false); }}
            onSelectStar={(star) => { selectStar(star); setMobileSheetOpen(false); }}
            onSelectMajorMoon={(moon) => { selectMajorMoon(moon); setMobileSheetOpen(false); }}
            onFocusSky={(target) => { guardMutation(() => { setSelectedStarId(null); setSelectedMajorMoonId(null); setFocusTarget(target); }); setMobileSheetOpen(false); }}
            onMode={setDisplayMode}
            onRate={setClockRate}
          />

          <div className="pointer-events-none absolute bottom-[5.8rem] left-1/2 z-30 hidden -translate-x-1/2 items-center gap-3 border-y border-white/[.08] bg-black/52 px-4 py-2 font-mono text-[7px] uppercase tracking-[.13em] text-white/38 backdrop-blur-md md:flex lg:hidden">
            <Clock3 className="h-3 w-3" /> JD {readout.julianDate.toFixed(5)} · {formatCelestialTimeRateV592(readout.rateSecondsPerSecond)} · spin 16/16 · absolute W 14/16
          </div>
        </>
      )}

      <div className="sr-only" aria-live="polite">
        {selectedMajorMoonId
          ? `${MAJOR_MOON_BY_ID_V592[selectedMajorMoonId].name} major moon inspection`
          : selectedStarId
          ? `${STELLAR_HERO_BY_ID_V592[selectedStarId].name} stellar inspection`
          : selectedNebulaId
            ? `${NEBULA_ALL_VISUAL_CATALOG_V592.find((entry) => entry.id === selectedNebulaId)?.catalogName} mapped-color presentation with J2000 science marker`
            : selectedDeepSpaceId
              ? `${DEEP_SPACE_REFERENCE_BY_ID_V592[selectedDeepSpaceId].commonName} J2000 catalog reference; ${selectedDeepSpaceVisualAsset ? mode === "science" ? `${selectedDeepSpaceVisualAsset.visualModelKind === "openngc-catalog-derived-galaxy-analytic" ? "OpenNGC analytic model" : selectedDeepSpaceVisualAsset.catalogDerivedVisualModel ? "Gaia-derived visual" : "observation image"} admitted but suppressed in Science` : selectedDeepSpaceVisualAsset.visualModelKind === "openngc-catalog-derived-galaxy-analytic" ? "OpenNGC analytic presentation active" : selectedDeepSpaceVisualAsset.catalogDerivedVisualModel ? "Gaia catalog-derived presentation active" : "mapped-color observation presentation active" : "visual imagery asset blocked"}`
            : `${selectedBody} ${selectedOrientation.authority}`}. Celestial time {readout.utcIso}. Rate {formatCelestialTimeRateV592(readout.rateSecondsPerSecond)}.
      </div>
    </section>
  );
}
