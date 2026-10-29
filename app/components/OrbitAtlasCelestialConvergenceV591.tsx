"use client";

import {
  Aperture,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Database,
  Eye,
  EyeOff,
  Menu,
  Orbit,
  ShieldCheck,
  Sparkles,
  X,
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
  CELESTIAL_CONVERGENCE_FORMAL_PRODUCT_POINTER_V591,
  CELESTIAL_CONVERGENCE_MANIFEST_SHA256_V591,
  CELESTIAL_CONVERGENCE_SCIENTIFIC_PAYLOAD_SHA256_V591,
  CELESTIAL_CONVERGENCE_VERSION_V591,
  V591_CORE_HERO_ORDER,
  V591_HERO_COUNT,
} from "../lib/celestialConvergenceV591";
import { loadVisualAssetManifestV590 } from "../lib/useV590Texture";
import CelestialConvergenceStageV591, {
  CelestialConvergenceReleaseProbeV591,
} from "./CelestialConvergenceStageV591";
import {
  HERO_OVERRIDE_ADMISSIONS_V591,
  V591_ADMITTED_OVERRIDE_COUNT,
} from "./CelestialHeroOverridesV591";
import UniverseCanvasOverrideHostV591 from "./UniverseCanvasOverrideHostV591";

const MAJOR_BODIES_V591 = HERO_BODY_SPECS_V590.filter((body) => body.group === "major");
const SMALL_BODIES_V591 = HERO_BODY_SPECS_V590.filter((body) => body.group === "small-body");
const INITIAL_ADMISSIONS_V591 = Object.freeze(Object.fromEntries(
  HERO_BODY_SPECS_V590.map((body) => [body.id, body.initialAdmission]),
)) as Readonly<Record<HeroBodyIdV590, HeroAssetAdmissionV590>>;
const V591_PAGE_SOURCE_MANIFEST_SHA256 = process.env.NEXT_PUBLIC_ATLAS_V591_SOURCE_MANIFEST_SHA256 || "unbound-development";
const V591_PAGE_BUILD_FINGERPRINT = process.env.NEXT_PUBLIC_ATLAS_V591_BUILD_FINGERPRINT || "unbound-development";

const V591_OVERRIDE_CHANNELS: Readonly<Partial<Record<HeroBodyIdV590, readonly string[]>>> = Object.freeze({
  sun: ["photosphere", "chromosphere", "corona"],
  mercury: ["NASA PIA15063 albedo", "MESSENGER normal", "MESSENGER roughness", "MESSENGER height"],
  earth: ["albedo", "normal", "roughness", "cloud color", "cloud alpha", "night emission", "night mask"],
  moon: ["albedo", "normal", "roughness", "height"],
  mars: ["USGS albedo", "MOLA normal", "MOLA roughness", "MOLA height", "thin atmosphere"],
  jupiter: ["albedo", "band mask", "Great Red Spot mask"],
  saturn: ["atmosphere", "band mask", "polar detail", "ring color", "ring optical depth"],
  uranus: ["registered analytical primary", "fixed-epoch zonal clouds", "polar haze", "methane limb", "faint rings"],
  neptune: ["registered analytical primary", "fixed-epoch zonal clouds", "bounded storm", "methane limb", "faint rings"],
  ceres: ["PDS Dawn SPC radius shape LOD", "PDS relative albedo", "PDS radius-derived normal", "PDS slope roughness", "CC0 bounded microstructure"],
  vesta: ["NASA global shape LOD", "CC0 exact-byte micro albedo", "CC0 exact-byte micro normal", "CC0 exact-byte micro roughness"],
  bennu: ["NASA shape LOD", "CC0 micro albedo", "CC0 micro normal", "CC0 micro roughness"],
  eros: ["NASA Eros shape LOD", "watertight two-half reconstruction", "CC0 exact-byte micro albedo", "CC0 exact-byte micro normal", "CC0 exact-byte micro roughness"],
  kleopatra: ["NASA low-resolution radar shape LOD", "4,092-triangle source ceiling", "CC0 exact-byte micro albedo", "CC0 exact-byte micro normal", "CC0 exact-byte micro roughness"],
  "tempel-1": ["PDS Deep Impact/Stardust-NExT shape LOD", "PDS 8 px/degree surface mosaic", "observed-coverage mask", "CC0 unobserved-area substrate", "fixed-seed dust/ion tails"],
});
const V591_CORE_OVERRIDE_COUNT = V591_CORE_HERO_ORDER.filter((body) => HERO_OVERRIDE_ADMISSIONS_V591[body] === "admitted").length;
const V591_P2_OVERRIDE_COUNT = V591_ADMITTED_OVERRIDE_COUNT - V591_CORE_OVERRIDE_COUNT;
const V591_P2_HERO_COUNT = V591_HERO_COUNT - V591_CORE_HERO_ORDER.length;

const SKY_TARGETS_V591: readonly Readonly<{ id: CelestialFocusTargetV590; label: string }>[] = Object.freeze([
  { id: "milky-way-center", label: "Galactic core" },
  { id: "milky-way-anticenter", label: "Anticenter" },
  { id: "orion", label: "Orion" },
  { id: "ursa-major", label: "Ursa Major" },
  { id: "cassiopeia", label: "Cassiopeia" },
  { id: "orion-nebula", label: "M42" },
  { id: "lagoon-nebula", label: "M8" },
  { id: "eagle-nebula", label: "M16" },
  { id: "helix-nebula", label: "Helix" },
  { id: "veil-nebula", label: "Veil" },
  { id: "north-america-nebula", label: "NGC 7000" },
]);

const HUD_CONTRAST_PROTECTION_V591 = (
  <>
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 left-0 top-14 z-20 hidden w-44 bg-[linear-gradient(90deg,rgba(0,1,4,.9)_0%,rgba(0,1,4,.54)_54%,transparent_100%)] md:block"
      data-atlas-v591-hud-contrast-protection="celestial-rail"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 left-0 z-20 hidden h-24 w-[min(100%,49rem)] bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,2,6,.9)_0%,rgba(0,2,6,.5)_48%,transparent_77%)] md:block"
      data-atlas-v591-hud-contrast-protection="instrument-rail"
    />
  </>
);

function useDeviceTierV591(): CelestialDeviceTierV590 {
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

function useFpsTelemetryV591(
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
      if (delta > 0 && delta < 250) samples.push(1000 / delta);
      if (samples.length > 240) samples.shift();
      frame += 1;
      if (frame % 30 === 0 && rootRef.current && samples.length > 20) {
        const sorted = [...samples].sort((left, right) => left - right);
        const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
        const threshold = key.includes("mobile") || !key.includes("overview") ? 45 : 55;
        rootRef.current.dataset.atlasV591FpsMedian = median.toFixed(2);
        rootRef.current.dataset.atlasV591FpsSampleCount = String(samples.length);
        rootRef.current.dataset.atlasV591FpsGate = median >= threshold ? "passed" : "warming";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [key, ready, rootRef]);
}

function shortShaV591(value: string): string {
  return value.length >= 16 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

function ModeButtonV591({
  active,
  label,
  onClick,
}: Readonly<{
  active: boolean;
  label: CelestialModeV590;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 border px-3 text-[8px] uppercase tracking-[.2em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f1d6a4]/75 md:min-h-10 ${active ? "border-[#e7c895]/45 bg-[#e7c895]/10 text-[#f6dfb7]" : "border-white/10 text-white/38 hover:border-white/20 hover:text-white/75"}`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

const EXPOSURE_OPTIONS_V591: readonly Readonly<{
  preset: CelestialExposurePresetV590;
  label: string;
  ariaLabel: string;
}>[] = Object.freeze([
  { preset: "extreme-dark", label: "−2 EV", ariaLabel: "Exposure extreme dark" },
  { preset: "nominal", label: "0 EV", ariaLabel: "Exposure nominal" },
  { preset: "extreme-bright", label: "+2 EV", ariaLabel: "Exposure extreme bright" },
]);

function ExposureSelectorV591({
  preset,
  disabled,
  mobile = false,
  onChange,
}: Readonly<{
  preset: CelestialExposurePresetV590;
  disabled: boolean;
  mobile?: boolean;
  onChange: (preset: CelestialExposurePresetV590) => void;
}>) {
  return (
    <div
      role="group"
      aria-label="Cinematic exposure"
      data-atlas-v591-exposure-selector={disabled ? "science-linear-locked" : preset}
      className={mobile ? "mt-2 grid grid-cols-3 gap-1.5" : "hidden items-center gap-1 md:flex"}
    >
      {EXPOSURE_OPTIONS_V591.map((option) => (
        <button
          key={option.preset}
          type="button"
          aria-label={option.ariaLabel}
          aria-pressed={preset === option.preset}
          disabled={disabled}
          data-atlas-v591-exposure-option={option.preset}
          onClick={() => onChange(option.preset)}
          className={`${mobile ? "min-h-11" : "min-h-10 px-2"} border border-white/10 text-[7px] uppercase tracking-[.11em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f1d6a4]/75 ${preset === option.preset ? "bg-[#e7c895]/10 text-[#f6dfb7]" : "text-white/36 hover:text-white/70"} disabled:cursor-not-allowed disabled:opacity-20`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function BodyRailV591({
  selectedBody,
  onSelect,
  onOpenSmallBodies,
  onOverview,
}: Readonly<{
  selectedBody: HeroBodyIdV590;
  onSelect: (body: HeroBodyIdV590) => void;
  onOpenSmallBodies: () => void;
  onOverview: () => void;
}>) {
  return (
    <nav className="pointer-events-auto absolute left-4 top-20 z-30 hidden w-28 flex-col gap-1 md:flex" aria-label="Primary celestial bodies">
      <div className="mb-2 flex items-center gap-2 px-2 text-[8px] uppercase tracking-[.21em] text-white/38">
        <Orbit className="h-3 w-3" aria-hidden="true" /> Celestial rail
      </div>
      {MAJOR_BODIES_V591.map((body) => {
        const active = body.id === selectedBody;
        return (
          <button
            key={body.id}
            type="button"
            onClick={() => onSelect(body.id)}
            className={`group flex min-h-10 items-center gap-2 border px-2.5 text-left text-[8px] uppercase tracking-[.11em] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f1d6a4]/70 ${active ? "border-[#f0d4a5]/30 bg-black/74 text-[#f4dfbd]" : "border-white/[.07] bg-black/24 text-white/45 hover:border-white/18 hover:bg-black/55 hover:text-white/78"}`}
            data-atlas-v591-body-button={body.id}
            aria-pressed={active}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: body.accent, boxShadow: active ? `0 0 10px ${body.accent}` : "none" }} />
            <span className="truncate">{body.shortName}</span>
          </button>
        );
      })}
      <button type="button" onClick={onOpenSmallBodies} className="mt-1 flex min-h-10 items-center justify-center gap-2 border border-dashed border-white/12 text-[8px] uppercase tracking-[.12em] text-white/48 hover:border-white/25 hover:text-white/76">
        <CircleDot className="h-3 w-3" aria-hidden="true" /> Small ×6
      </button>
      <button type="button" onClick={onOverview} className="mt-2 flex min-h-10 items-center justify-center gap-2 border border-cyan-100/14 bg-cyan-100/[.025] text-[8px] uppercase tracking-[.12em] text-cyan-50/62 hover:text-cyan-50/88">
        <Aperture className="h-3 w-3" aria-hidden="true" /> Overview
      </button>
    </nav>
  );
}

function SmallBodyDrawerV591({
  open,
  selectedBody,
  onClose,
  onSelect,
}: Readonly<{
  open: boolean;
  selectedBody: HeroBodyIdV590;
  onClose: () => void;
  onSelect: (body: HeroBodyIdV590) => void;
}>) {
  if (!open) return null;
  return (
    <div className="pointer-events-auto absolute left-36 top-20 z-40 hidden w-64 border border-white/12 bg-[#020508]/95 p-3 shadow-[0_24px_80px_rgba(0,0,0,.7)] backdrop-blur-xl md:block" data-atlas-v591-small-body-drawer>
      <div className="flex items-center justify-between border-b border-white/8 pb-2">
        <span className="text-[8px] uppercase tracking-[.2em] text-white/48">Small-body laboratory</span>
        <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center text-white/38 hover:text-white" aria-label="Close small-body laboratory"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {SMALL_BODIES_V591.map((body) => (
          <button
            key={body.id}
            type="button"
            onClick={() => { onSelect(body.id); onClose(); }}
            className={`min-h-14 border p-2 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/70 ${selectedBody === body.id ? "border-[#d9b77e]/35 bg-[#d9b77e]/7" : "border-white/9 hover:border-white/18"}`}
          >
            <span className="block text-[8px] uppercase tracking-[.12em] text-white/72">{body.shortName}</span>
            <span className="mt-1 block text-[6px] uppercase tracking-[.1em] text-white/26">verified mesh gate</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DeepFieldRailV591({ onFocus }: Readonly<{ onFocus: (focus: CelestialFocusTargetV590) => void }>) {
  return (
    <div className="pointer-events-auto absolute bottom-5 left-4 z-30 hidden max-w-[calc(100%_-_21rem)] items-center gap-1.5 overflow-x-auto pb-1 md:flex" data-atlas-v591-deep-field-rail="six-nebulae">
      <div className="mr-2 flex items-center gap-2 text-[8px] uppercase tracking-[.18em] text-white/36"><Sparkles className="h-3 w-3" /> Deep field</div>
      {SKY_TARGETS_V591.map((target) => (
        <button key={target.id} type="button" onClick={() => onFocus(target.id)} data-atlas-v591-sky-target={target.id} className="min-h-9 shrink-0 border border-white/8 bg-black/24 px-2.5 text-[8px] uppercase tracking-[.1em] text-white/44 hover:border-white/18 hover:bg-black/62 hover:text-white/76">
          {target.label}
        </button>
      ))}
    </div>
  );
}

function InspectorV591({
  selectedBody,
  admission,
  mode,
  exposurePreset,
  manifestStatus,
  sceneMounted,
  onClose,
  onRelease,
  onRestore,
}: Readonly<{
  selectedBody: HeroBodyIdV590;
  admission: HeroAssetAdmissionV590;
  mode: CelestialModeV590;
  exposurePreset: CelestialExposurePresetV590;
  manifestStatus: string;
  sceneMounted: boolean;
  onClose: () => void;
  onRelease: () => void;
  onRestore: () => void;
}>) {
  const spec = HERO_BODY_SPEC_BY_ID_V590[selectedBody];
  const orbit = CELESTIAL_ORBIT_BY_ID_V590[selectedBody];
  const override = HERO_OVERRIDE_ADMISSIONS_V591[selectedBody];
  const material = selectedBody === "earth" && override === "admitted"
    ? "Blue Marble · GEBCO normal · ocean Fresnel · dual cloud · night limb · Rayleigh/Mie"
    : selectedBody === "sun" && override === "admitted"
    ? "SDO/HMI photosphere · SDO/AIA 304 Å chromosphere · deterministic corona"
    : selectedBody === "venus" && override === "admitted"
    ? "NASA/JPL Magellan 0°E·90°E·270°E clean global views / audited equirectangular blend / radar-derived relief / independent thick-cloud primary / no optical-color or topography claim"
    : selectedBody === "moon" && override === "admitted"
    ? "LROC WAC color / LOLA LDEM normal / Oren-Nayar regolith / bounded opposition / quantized finite relief"
    : selectedBody === "mars" && override === "admitted"
    ? "USGS Viking color (1024px source ceiling) · MOLA normal/height/roughness · rough dust · thin CO₂ haze"
    : selectedBody === "jupiter" && override === "admitted"
    ? "Cassini PIA07782 · source-derived zonal mask · GRS mask · gas limb darkening · no specular lobe"
    : selectedBody === "saturn" && override === "admitted"
    ? "Cassini PIA06193 latitude profile · PIA21617 north pole · PIA21628 radial rings · Cassini/Encke gaps · mutual shadows"
    : selectedBody === "uranus" && override === "admitted"
    ? "Registered v590 analytical primary / qualitative Voyager-calibrated palette / subtle zonal clouds / polar haze / methane limb / faint rings / no observation-texture claim"
    : selectedBody === "neptune" && override === "admitted"
    ? "Registered v590 analytical primary / qualitative Voyager-calibrated palette / bounded fixed-epoch storm / methane limb / faint rings / no observation-texture claim"
    : selectedBody === "ceres" && override === "admitted"
    ? "NASA PDS Dawn SPC 2222×1111 global radius and relative albedo / 104K·25K·5K meshopt LOD / radius-derived normal and roughness / CC0 microstructure is not Ceres observation data / no optical-color or measured-photometry claim"
    : selectedBody === "vesta" && override === "admitted"
    ? "NASA 3D Resources global shape / 100K·25K·5K meshopt LOD / CC0 exact-byte triplanar microstructure / achondrite Oren-Nayar / no measured-photometry claim"
    : selectedBody === "bennu" && override === "admitted"
    ? "NASA OSIRIS-REx shape LOD / CC0 bounded triplanar microtexture / carbonaceous Oren-Nayar / no glossy specular"
    : selectedBody === "eros" && override === "admitted"
    ? "NASA 3D Resources Eros shape / watertight topology-paired two-half reconstruction / 99K·25K·5K LOD / rough S-type silicate reference / CC0 microstructure is not Eros observation data"
    : selectedBody === "kleopatra" && override === "admitted"
    ? "NASA low-resolution radar shape / disclosed 4,092-triangle source-detail ceiling / 4K·2K·1K LOD / muted M-type rough response / CC0 microstructure is not Kleopatra observation data"
    : selectedBody === "tempel-1" && override === "admitted"
    ? "PDS Deep Impact/Stardust-NExT 32K shape / 8 px·deg⁻¹ filtered mosaic / explicit observed-coverage mask / CC0 substrate only in unobserved areas / fixed-seed presentation tails"
    : spec.material;
  const requiredChannels = V591_OVERRIDE_CHANNELS[selectedBody] ?? spec.requiredAssets;
  return (
    <aside className="pointer-events-auto absolute inset-y-0 right-0 z-30 hidden w-[312px] border-l border-white/10 bg-[#020407]/89 px-5 pb-24 pt-5 backdrop-blur-xl lg:block" data-atlas-v591-inspector>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-[8px] uppercase tracking-[.2em] text-white/40"><Database className="h-3 w-3" /> Celestial dossier 591</div>
          <h2 className="mt-3 font-[family-name:var(--font-atlas-display,Georgia,serif)] text-3xl font-light tracking-[-.035em] text-[#eee0c8]">{spec.name}</h2>
          <p className="mt-1 max-w-[225px] text-[8px] uppercase leading-[1.55] tracking-[.115em] text-white/46">{spec.subtitle}</p>
        </div>
        <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center text-white/32 hover:text-white" aria-label="Close inspector"><X className="h-3.5 w-3.5" /></button>
      </div>

      <div className={`mt-5 border px-3 py-2.5 ${admission === "admitted" ? "border-emerald-200/18 bg-emerald-100/[.035]" : "border-amber-200/18 bg-amber-100/[.035]"}`}>
        <div className="flex items-center gap-2 text-[8px] uppercase tracking-[.15em]">
          <ShieldCheck className={`h-3.5 w-3.5 ${admission === "admitted" ? "text-emerald-200/70" : "text-amber-200/70"}`} />
          <span className={admission === "admitted" ? "text-emerald-100/65" : "text-amber-100/65"}>{admission}</span>
        </div>
        <p className="mt-2 text-[8px] leading-[1.55] text-white/42">
          {admission === "admitted"
            ? "Manifest-bound visual layers are eligible. Scientific state remains byte-immutable."
            : "Required public-domain layers are incomplete. No colored or random procedural body is shown."}
        </p>
      </div>

      <dl className="mt-5 divide-y divide-white/7 border-y border-white/8 text-[9px] leading-[1.45]">
        <div className="flex items-center justify-between gap-4 py-3"><dt className="uppercase tracking-[.13em] text-white/38">Material</dt><dd className="max-w-[168px] text-right text-white/68" data-atlas-v591-inspector-material>{material}</dd></div>
        <div className="flex items-center justify-between gap-4 py-3"><dt className="uppercase tracking-[.13em] text-white/38">v591 override</dt><dd className="text-white/68">{override}</dd></div>
        <div className="flex items-center justify-between gap-4 py-3"><dt className="uppercase tracking-[.13em] text-white/38">Orbit period</dt><dd className="text-white/68">{orbit.periodLabel}</dd></div>
        <div className="flex items-center justify-between gap-4 py-3"><dt className="uppercase tracking-[.13em] text-white/38">Display mode</dt><dd className="text-white/68">{mode}</dd></div>
        <div className="flex items-center justify-between gap-4 py-3"><dt className="uppercase tracking-[.13em] text-white/38">Exposure</dt><dd className="text-white/68">{mode === "science" ? "linear 1.0" : exposurePreset}</dd></div>
        <div className="flex items-center justify-between gap-4 py-3"><dt className="uppercase tracking-[.13em] text-white/38">Manifest</dt><dd className="max-w-[160px] truncate text-white/68">{manifestStatus}</dd></div>
      </dl>

      <div className="mt-5">
        <div className="text-[8px] uppercase tracking-[.16em] text-white/38">Required channels</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {requiredChannels.length > 0 ? requiredChannels.map((asset) => (
            <span key={asset} className="border border-white/8 px-2 py-1 text-[7px] uppercase tracking-[.09em] text-white/48">{asset}</span>
          )) : <span className="border border-cyan-100/10 px-2 py-1 text-[7px] uppercase tracking-[.09em] text-cyan-100/52">registered procedural primary</span>}
        </div>
      </div>

      <div className="absolute bottom-5 left-5 right-5 border-t border-white/8 pt-4 font-mono text-[7px] uppercase leading-loose tracking-[.105em] text-white/34">
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          <button type="button" data-atlas-v591-release-scene disabled={!sceneMounted} onClick={onRelease} className="min-h-8 border border-white/8 px-2 text-[7px] uppercase tracking-[.1em] text-white/42 enabled:hover:border-white/18 enabled:hover:text-white/66 disabled:opacity-25">Release scene</button>
          <button type="button" data-atlas-v591-restore-scene disabled={sceneMounted} onClick={onRestore} className="min-h-8 border border-white/8 px-2 text-[7px] uppercase tracking-[.1em] text-white/42 enabled:hover:border-white/18 enabled:hover:text-white/66 disabled:opacity-25">Restore scene</button>
        </div>
        <div>Manifest {shortShaV591(CELESTIAL_CONVERGENCE_MANIFEST_SHA256_V591)}</div>
        <div>Payload {shortShaV591(CELESTIAL_CONVERGENCE_SCIENTIFIC_PAYLOAD_SHA256_V591)}</div>
        <div>Formal {CELESTIAL_CONVERGENCE_FORMAL_PRODUCT_POINTER_V591} · read only</div>
      </div>
    </aside>
  );
}

function MobileSheetV591({
  open,
  selectedBody,
  mode,
  exposurePreset,
  onToggle,
  onSelect,
  onMode,
  onExposure,
  onOverview,
  onFocusSky,
}: Readonly<{
  open: boolean;
  selectedBody: HeroBodyIdV590;
  mode: CelestialModeV590;
  exposurePreset: CelestialExposurePresetV590;
  onToggle: () => void;
  onSelect: (body: HeroBodyIdV590) => void;
  onMode: (mode: CelestialModeV590) => void;
  onExposure: (preset: CelestialExposurePresetV590) => void;
  onOverview: () => void;
  onFocusSky: (focus: CelestialFocusTargetV590) => void;
}>) {
  return (
    <div className={`pointer-events-auto absolute inset-x-2 bottom-2 z-40 border border-white/12 bg-[#03070a]/93 shadow-[0_-24px_80px_rgba(0,0,0,.6)] backdrop-blur-xl transition-transform md:hidden ${open ? "translate-y-0" : "translate-y-[calc(100%-58px)]"}`} data-atlas-v591-mobile-sheet data-atlas-v591-mobile-sheet-state={open ? "open" : "closed-inert"}>
      <button type="button" onClick={onToggle} className="flex h-[56px] w-full items-center justify-between px-4 text-left" aria-expanded={open} aria-controls="atlas-v591-mobile-controls">
        <div><span className="block text-[8px] uppercase tracking-[.18em] text-white/40">Focused body</span><span className="mt-1 block text-[12px] uppercase tracking-[.13em] text-[#ead5b1]">{HERO_BODY_SPEC_BY_ID_V590[selectedBody].name}</span></div>
        {open ? <ChevronDown className="h-4 w-4 text-white/42" /> : <ChevronUp className="h-4 w-4 text-white/42" />}
      </button>
      <div id="atlas-v591-mobile-controls" className="max-h-[54dvh] overflow-y-auto border-t border-white/8 px-3 pb-4 pt-3" aria-hidden={!open} inert={!open}>
        <div className="grid grid-cols-2 gap-1.5">
          <ModeButtonV591 active={mode === "science"} label="science" onClick={() => onMode("science")} />
          <ModeButtonV591 active={mode === "cinematic"} label="cinematic" onClick={() => onMode("cinematic")} />
        </div>
        <ExposureSelectorV591 preset={exposurePreset} disabled={mode === "science"} mobile onChange={onExposure} />
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {HERO_BODY_SPECS_V590.map((body) => (
            <button key={body.id} type="button" onClick={() => onSelect(body.id)} className={`min-h-11 border px-1 text-[7px] uppercase tracking-[.07em] ${selectedBody === body.id ? "border-[#e3c28d]/35 text-[#edd8b5]" : "border-white/8 text-white/46"}`}>{body.shortName}</button>
          ))}
        </div>
        <button type="button" onClick={onOverview} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 border border-cyan-100/12 text-[8px] uppercase tracking-[.13em] text-cyan-50/64"><Aperture className="h-3 w-3" /> Overview</button>
        <div className="mt-3 border-t border-white/8 pt-3" data-atlas-v591-mobile-deep-field="six-nebulae">
          <div className="mb-2 text-[8px] uppercase tracking-[.16em] text-white/38">Deep field</div>
          <div className="grid grid-cols-2 gap-1.5">
            {SKY_TARGETS_V591.map((target) => (
              <button key={target.id} type="button" onClick={() => onFocusSky(target.id)} data-atlas-v591-sky-target={target.id} className="min-h-11 border border-white/8 px-2 text-[7px] uppercase tracking-[.07em] text-white/46 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/70">
                {target.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrbitAtlasCelestialConvergenceV591() {
  const rootRef = useRef<HTMLElement>(null);
  const deviceTier = useDeviceTierV591();
  const deliveryTier: CelestialDeliveryTierV590 = process.env.NEXT_PUBLIC_ATLAS_CELESTIAL_DELIVERY_TIER === "vercel-lite"
    || process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "vercel-lite"
    ? "vercel-lite"
    : "standalone-full";
  const [mode, setMode] = useState<CelestialModeV590>("cinematic");
  const [selectedBody, setSelectedBody] = useState<HeroBodyIdV590>("earth");
  const [focusTarget, setFocusTarget] = useState<CelestialFocusTargetV590>("earth");
  const [exposurePreset, setExposurePreset] = useState<CelestialExposurePresetV590>("nominal");
  const [cleanView, setCleanView] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [sceneMounted, setSceneMounted] = useState(true);
  const [releaseCycles, setReleaseCycles] = useState(0);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [smallBodiesOpen, setSmallBodiesOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [payloadProbeStatus, setPayloadProbeStatus] = useState<"loading" | "connected-stable" | "blocked-not-connected" | "blocked-mutation">("loading");
  const [manifestStatus, setManifestStatus] = useState("loading");
  const [baselineAdmissions, setBaselineAdmissions] = useState(INITIAL_ADMISSIONS_V591);
  const [scientificProjection, setScientificProjection] = useState<ScientificProjectionStateV590 | null>(null);
  const scientificProjectionBaselineRef = useRef<string | null>(null);
  const baselineRef = useRef(getAtlasResourceSnapshot());
  const profile = useMemo<CelestialRenderProfileV590>(() => ({
    mode,
    deliveryTier,
    deviceTier,
    selectedBody,
    focusTarget,
    exposurePreset,
    qualityTier: focusTarget === "overview" ? "overview" : "closeup",
    cleanView,
    // The read-only v590 sky/body layers retain their sealed deterministic
    // epoch. v591-owned materials carry their own epoch in the override root.
    presentationEpoch: 590,
  }), [cleanView, deliveryTier, deviceTier, exposurePreset, focusTarget, mode, selectedBody]);
  useFpsTelemetryV591(rootRef, canvasReady, `${deviceTier}:${focusTarget}:${mode}`);

  useEffect(() => {
    const abort = new AbortController();
    void Promise.all([
      loadVisualAssetManifestV590(abort.signal),
      fetch("/data/celestial-convergence-v591/manifest.json", { cache: "no-store", signal: abort.signal }).then(async (response) => {
        if (!response.ok) throw new Error(`v591-manifest-fetch:${response.status}`);
        return response.json() as Promise<{ version?: string; manifestSha256?: string; status?: string }>;
      }),
    ]).then(([baseline, candidate]) => {
      if (
        candidate.version !== CELESTIAL_CONVERGENCE_VERSION_V591
        || candidate.manifestSha256 !== CELESTIAL_CONVERGENCE_MANIFEST_SHA256_V591
        || typeof candidate.status !== "string"
        || candidate.status.length === 0
      ) {
        throw new Error("v591-manifest-identity");
      }
      setBaselineAdmissions(baseline.heroBodies);
      setManifestStatus(candidate.status);
    }).catch((error: unknown) => {
      if (abort.signal.aborted) return;
      setManifestStatus(error instanceof Error ? error.message : "blocked");
    });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setPayloadProbeStatus("loading");
    void fetch(CELESTIAL_RENDERING_SCIENTIFIC_PROJECTION_URL_V590, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`v591-scientific-projection-fetch:${response.status}`);
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

  const mutatePresentation = useCallback((mutation: () => void) => {
    const before = scientificProjection ? serializeScientificProjectionStateV590(scientificProjection) : null;
    mutation();
    queueMicrotask(() => {
      if (!scientificProjection || !scientificProjectionBaselineRef.current || before === null) {
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

  const switchMode = useCallback((next: CelestialModeV590) => {
    mutatePresentation(() => {
      setMode(next);
      if (next === "science") setCleanView(false);
    });
  }, [mutatePresentation]);
  const selectBody = useCallback((body: HeroBodyIdV590) => {
    mutatePresentation(() => {
      setSelectedBody(body);
      setFocusTarget(body);
    });
  }, [mutatePresentation]);
  const focusSky = useCallback((target: CelestialFocusTargetV590) => {
    mutatePresentation(() => setFocusTarget(target));
  }, [mutatePresentation]);
  const changeExposure = useCallback((next: CelestialExposurePresetV590) => {
    mutatePresentation(() => setExposurePreset(next));
  }, [mutatePresentation]);
  const toggleCleanView = useCallback(() => {
    mutatePresentation(() => setCleanView((value) => !value));
  }, [mutatePresentation]);
  const releaseScene = useCallback(() => {
    setSceneMounted(false);
    setReleaseCycles((value) => value + 1);
  }, []);

  const selectedAdmission: HeroAssetAdmissionV590 = HERO_OVERRIDE_ADMISSIONS_V591[selectedBody] === "admitted"
    ? "admitted"
    : baselineAdmissions[selectedBody];
  return (
    <section
      ref={rootRef}
      className="relative h-[100dvh] min-h-[640px] w-full overflow-hidden bg-[#000104] font-[family-name:var(--font-atlas-body,'IBM_Plex_Sans',sans-serif)] text-white"
      data-atlas-browser-acceptance-version="v591-celestial-convergence-browser-acceptance"
      data-atlas-v591-candidate={CELESTIAL_CONVERGENCE_VERSION_V591}
      data-atlas-v591-manifest-sha={CELESTIAL_CONVERGENCE_MANIFEST_SHA256_V591}
      data-atlas-v591-manifest-status={manifestStatus}
      data-atlas-v591-page-source-manifest-sha={V591_PAGE_SOURCE_MANIFEST_SHA256}
      data-atlas-v591-page-delivery-tier={deliveryTier}
      data-atlas-v591-page-build-fingerprint={V591_PAGE_BUILD_FINGERPRINT}
      data-atlas-v591-formal-product-pointer={CELESTIAL_CONVERGENCE_FORMAL_PRODUCT_POINTER_V591}
      data-atlas-v591-scientific-payload-sha={CELESTIAL_CONVERGENCE_SCIENTIFIC_PAYLOAD_SHA256_V591}
      data-atlas-v591-scientific-projection={scientificProjectionBaselineRef.current ?? "not-connected"}
      data-atlas-v591-payload-stable={payloadProbeStatus === "connected-stable" ? "true" : payloadProbeStatus}
      data-atlas-v591-scientific-writeback="false"
      data-atlas-v591-runtime-baseline="v590-readonly"
      data-atlas-v591-scene-owner="v591-owned-composition"
      data-atlas-v591-hero-overrides={String(V591_ADMITTED_OVERRIDE_COUNT)}
      data-atlas-v591-core-hero-progress={`${V591_CORE_OVERRIDE_COUNT}/${V591_CORE_HERO_ORDER.length}`}
      data-atlas-v591-p2-hero-progress={`${V591_P2_OVERRIDE_COUNT}/${V591_P2_HERO_COUNT}`}
      data-atlas-v591-total-hero-count={String(V591_HERO_COUNT)}
      data-atlas-v591-canvas-count="1"
      data-atlas-v591-mode={mode}
      data-atlas-v591-exposure-preset={exposurePreset}
      data-atlas-v591-exposure-policy={mode === "science" ? "linear-1.0-locked" : "presentation-only"}
      data-atlas-v591-device-tier={deviceTier}
      data-atlas-v591-selected-body={selectedBody}
      data-atlas-v591-selected-admission={selectedAdmission}
      data-atlas-v591-focus-target={focusTarget}
      data-atlas-v591-clean-view={cleanView ? "true" : "false"}
      data-atlas-v591-canvas-ready={canvasReady ? "true" : "false"}
      data-atlas-v591-scene-mounted={sceneMounted ? "true" : "false"}
      data-atlas-v591-resource-release-cycles={releaseCycles}
      data-atlas-v591-resource-release-status={sceneMounted ? "armed" : "draining"}
      data-atlas-v591-production-promotion="false"
    >
      <div className={`absolute inset-y-0 left-0 right-0 transition-[right] duration-300 ${inspectorOpen && !cleanView ? "lg:right-[312px]" : ""}`} data-atlas-v591-single-canvas-stage>
        <UniverseCanvasOverrideHostV591 mode={mode} deviceTier={deviceTier} onCanvasReady={() => setCanvasReady(true)}>
          {sceneMounted ? <CelestialConvergenceStageV591 profile={profile} baselineAdmissions={baselineAdmissions} focusTarget={focusTarget} /> : null}
          <CelestialConvergenceReleaseProbeV591 active={sceneMounted} baseline={baselineRef.current} />
        </UniverseCanvasOverrideHostV591>
      </div>

      {cleanView ? (
        <button type="button" onClick={toggleCleanView} className="pointer-events-auto absolute right-4 top-4 z-50 flex min-h-10 items-center gap-2 border border-white/12 bg-black/48 px-3 text-[7px] uppercase tracking-[.18em] text-white/48 backdrop-blur-md hover:text-white/82" data-atlas-v591-exit-clean-view>
          <Eye className="h-3 w-3" /> Exit clean view
        </button>
      ) : (
        <>
          <header className={`pointer-events-none absolute left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/8 bg-gradient-to-b from-black/78 to-black/0 px-4 transition-[right] duration-300 md:px-5 ${inspectorOpen ? "lg:right-[312px]" : ""}`}>
            <div className="flex items-center gap-3">
              <button type="button" className="pointer-events-auto grid h-11 w-11 shrink-0 place-items-center border border-white/10 text-white/45 md:hidden" onClick={() => setMobileSheetOpen((open) => !open)} aria-label="Open celestial controls"><Menu className="h-4 w-4" /></button>
              <div>
                <div className="text-[9px] uppercase tracking-[.27em] text-[#e9c98f]/78">Orbit Atlas / Celestial convergence</div>
                <div className="mt-1 text-[7px] uppercase tracking-[.16em] text-white/36">Gaia optics · J2000 sky · v591 additive instrument</div>
              </div>
            </div>
            <div className="pointer-events-auto flex items-center gap-1.5">
              <ModeButtonV591 active={mode === "science"} label="science" onClick={() => switchMode("science")} />
              <ModeButtonV591 active={mode === "cinematic"} label="cinematic" onClick={() => switchMode("cinematic")} />
              <ExposureSelectorV591 preset={exposurePreset} disabled={mode === "science"} onChange={changeExposure} />
              <button type="button" disabled={mode !== "cinematic"} onClick={toggleCleanView} className="ml-1 hidden min-h-10 items-center gap-2 border border-white/10 px-3 text-[7px] uppercase tracking-[.15em] text-white/42 enabled:hover:text-white/78 disabled:opacity-20 md:flex"><EyeOff className="h-3 w-3" /> Clean view</button>
              <button type="button" onClick={() => setInspectorOpen((open) => !open)} className="hidden h-10 items-center gap-2 border border-white/10 px-3 text-[7px] uppercase tracking-[.15em] text-white/42 hover:text-white/78 lg:flex"><Database className="h-3 w-3" /> Inspector</button>
            </div>
          </header>

          {HUD_CONTRAST_PROTECTION_V591}
          <BodyRailV591 selectedBody={selectedBody} onSelect={selectBody} onOpenSmallBodies={() => setSmallBodiesOpen(true)} onOverview={() => focusSky("overview")} />
          <SmallBodyDrawerV591 open={smallBodiesOpen} selectedBody={selectedBody} onClose={() => setSmallBodiesOpen(false)} onSelect={selectBody} />
          <DeepFieldRailV591 onFocus={focusSky} />
          {inspectorOpen ? (
            <InspectorV591
              selectedBody={selectedBody}
              admission={selectedAdmission}
              mode={mode}
              exposurePreset={exposurePreset}
              manifestStatus={manifestStatus}
              sceneMounted={sceneMounted}
              onClose={() => setInspectorOpen(false)}
              onRelease={releaseScene}
              onRestore={() => setSceneMounted(true)}
            />
          ) : null}
          <MobileSheetV591
            open={mobileSheetOpen}
            selectedBody={selectedBody}
            mode={mode}
            exposurePreset={exposurePreset}
            onToggle={() => setMobileSheetOpen((open) => !open)}
            onSelect={(body) => { selectBody(body); setMobileSheetOpen(false); }}
            onMode={switchMode}
            onExposure={changeExposure}
            onOverview={() => { focusSky("overview"); setMobileSheetOpen(false); }}
            onFocusSky={(target) => { focusSky(target); setMobileSheetOpen(false); }}
          />

          <div className="pointer-events-none absolute bottom-[4.6rem] left-1/2 z-30 hidden -translate-x-1/2 items-center gap-4 border-y border-white/[.08] bg-black/50 px-4 py-2 font-mono text-[7px] uppercase tracking-[.14em] text-white/42 backdrop-blur-md md:flex" data-atlas-v591-convergence-strip>
            <span className="text-[#e4c58f]/72">v591 convergence</span>
            <span>{V591_CORE_OVERRIDE_COUNT}/{V591_CORE_HERO_ORDER.length} core · {V591_P2_OVERRIDE_COUNT}/{V591_P2_HERO_COUNT} P2</span>
            <span>v590 dependencies read only</span>
            <span>science payload immutable</span>
          </div>
        </>
      )}
    </section>
  );
}
