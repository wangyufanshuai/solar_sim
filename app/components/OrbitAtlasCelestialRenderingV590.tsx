"use client";

import {
  Aperture,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Database,
  Eye,
  EyeOff,
  Layers3,
  Menu,
  Orbit,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
import {
  CELESTIAL_ORBIT_BY_ID_V590,
  CELESTIAL_RENDERING_FORMAL_PRODUCT_POINTER_V590,
  CELESTIAL_RENDERING_MANIFEST_SHA256_V590,
  CELESTIAL_RENDERING_SCIENTIFIC_PAYLOAD_SHA256_V590,
  CELESTIAL_RENDERING_SCIENTIFIC_PROJECTION_URL_V590,
  CELESTIAL_RENDERING_VERSION_V590,
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
import { loadVisualAssetManifestV590 } from "../lib/useV590Texture";
import CelestialRenderingStageV590, { CelestialRenderingReleaseProbeV590 } from "./CelestialRenderingStageV590";
import UniverseCanvasOverrideHostV590 from "./UniverseCanvasOverrideHostV590";

function useDeviceTierV590(): CelestialDeviceTierV590 {
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

function useFpsTelemetryV590(
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
        rootRef.current.dataset.atlasV590FpsMedian = median.toFixed(2);
        rootRef.current.dataset.atlasV590FpsSampleCount = String(samples.length);
        rootRef.current.dataset.atlasV590FpsGate = median >= threshold ? "passed" : "warming";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [key, ready, rootRef]);
}

function shortShaV590(value: string): string {
  return value.length >= 14 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

function ModeButtonV590({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: CelestialModeV590;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 border px-3 text-[8px] uppercase tracking-[.2em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f2d6a2]/70 ${active ? "border-[#e7c895]/45 bg-[#e7c895]/10 text-[#f6dfb7]" : "border-white/10 text-white/38 hover:border-white/20 hover:text-white/75"}`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

const HUD_CONTRAST_PROTECTION_V590 = (
  <>
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 left-0 top-14 z-20 hidden w-44 bg-[linear-gradient(90deg,rgba(0,1,4,.88)_0%,rgba(0,1,4,.56)_54%,transparent_100%)] md:block"
      data-atlas-v590-hud-contrast-protection="celestial-rail"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 left-0 z-20 hidden h-24 w-[min(100%,42rem)] bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,2,6,.86)_0%,rgba(0,2,6,.52)_48%,transparent_76%)] md:block"
      data-atlas-v590-hud-contrast-protection="deep-field-rail"
    />
  </>
);

function BodyRailV590({
  selectedBody,
  onSelect,
  onOpenSmallBodies,
  onOverview,
}: {
  selectedBody: HeroBodyIdV590;
  onSelect: (body: HeroBodyIdV590) => void;
  onOpenSmallBodies: () => void;
  onOverview: () => void;
}) {
  const major = HERO_BODY_SPECS_V590.filter((body) => body.group === "major");
  return (
    <nav className="pointer-events-auto absolute left-4 top-20 z-30 hidden w-28 flex-col gap-1 md:flex" aria-label="Primary celestial bodies">
      <div className="mb-2 flex items-center gap-2 px-2 text-[7px] uppercase tracking-[.23em] text-white/30">
        <Orbit className="h-3 w-3" aria-hidden="true" /> Celestial rail
      </div>
      {major.map((body) => {
        const active = body.id === selectedBody;
        return (
          <button
            key={body.id}
            type="button"
            onClick={() => onSelect(body.id)}
            className={`group flex min-h-9 items-center gap-2 border px-2.5 text-left text-[7px] uppercase tracking-[.12em] transition-all ${active ? "border-[#f0d4a5]/30 bg-black/72 text-[#f4dfbd] shadow-[0_12px_40px_rgba(0,0,0,.3)]" : "border-white/[.07] bg-black/24 text-white/38 hover:border-white/18 hover:bg-black/55 hover:text-white/75"}`}
            data-atlas-v590-body-button={body.id}
            aria-pressed={active}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: body.accent, boxShadow: active ? `0 0 10px ${body.accent}` : "none" }} />
            <span className="truncate">{body.shortName}</span>
          </button>
        );
      })}
      <button type="button" onClick={onOpenSmallBodies} className="mt-1 flex min-h-9 items-center justify-center gap-2 border border-dashed border-white/12 text-[7px] uppercase tracking-[.13em] text-white/42 hover:border-white/25 hover:text-white/72">
        <CircleDot className="h-3 w-3" aria-hidden="true" /> Small ×6
      </button>
      <button type="button" onClick={onOverview} className="mt-2 flex min-h-9 items-center justify-center gap-2 border border-cyan-100/14 bg-cyan-100/[.025] text-[7px] uppercase tracking-[.13em] text-cyan-50/58 hover:text-cyan-50/85">
        <Aperture className="h-3 w-3" aria-hidden="true" /> Overview
      </button>
    </nav>
  );
}

function SmallBodyDrawerV590({
  open,
  selectedBody,
  onClose,
  onSelect,
}: {
  open: boolean;
  selectedBody: HeroBodyIdV590;
  onClose: () => void;
  onSelect: (body: HeroBodyIdV590) => void;
}) {
  if (!open) return null;
  return (
    <div className="pointer-events-auto absolute left-36 top-20 z-40 hidden w-64 border border-white/12 bg-[#020508]/94 p-3 shadow-[0_24px_80px_rgba(0,0,0,.65)] backdrop-blur-xl md:block" data-atlas-v590-small-body-drawer>
      <div className="flex items-center justify-between border-b border-white/8 pb-2">
        <span className="text-[8px] uppercase tracking-[.2em] text-white/48">Small-body laboratory</span>
        <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center text-white/38 hover:text-white" aria-label="Close small-body laboratory"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {HERO_BODY_SPECS_V590.filter((body) => body.group === "small-body").map((body) => (
          <button
            key={body.id}
            type="button"
            onClick={() => { onSelect(body.id); onClose(); }}
            className={`min-h-14 border p-2 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/70 ${selectedBody === body.id ? "border-[#d9b77e]/35 bg-[#d9b77e]/7" : "border-white/9 hover:border-white/18"}`}
          >
            <span className="block text-[8px] uppercase tracking-[.12em] text-white/72">{body.shortName}</span>
            <span className="mt-1 block text-[6px] uppercase tracking-[.1em] text-white/26">public-domain mesh gate</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const SKY_TARGETS_V590: readonly Readonly<{ id: CelestialFocusTargetV590; label: string }>[] = [
  { id: "milky-way-center", label: "Galactic core" },
  { id: "orion", label: "Orion" },
  { id: "ursa-major", label: "Ursa Major" },
  { id: "orion-nebula", label: "M42" },
] as const;

function DeepSpaceRailV590({ onFocus }: { onFocus: (focus: CelestialFocusTargetV590) => void }) {
  return (
    <div className="pointer-events-auto absolute bottom-5 left-4 z-30 hidden items-center gap-1.5 md:flex">
      <div className="mr-2 flex items-center gap-2 text-[7px] uppercase tracking-[.2em] text-white/28"><Sparkles className="h-3 w-3" /> Deep field</div>
      {SKY_TARGETS_V590.map((target) => (
        <button key={target.id} type="button" onClick={() => onFocus(target.id)} className="min-h-8 border border-white/8 bg-black/24 px-2.5 text-[7px] uppercase tracking-[.12em] text-white/38 hover:border-white/18 hover:bg-black/62 hover:text-white/72">
          {target.label}
        </button>
      ))}
    </div>
  );
}

function InspectorV590({
  selectedBody,
  admission,
  mode,
  manifestStatus,
  sceneMounted,
  onClose,
  onRelease,
  onRestore,
}: {
  selectedBody: HeroBodyIdV590;
  admission: HeroAssetAdmissionV590;
  mode: CelestialModeV590;
  manifestStatus: string;
  sceneMounted: boolean;
  onClose: () => void;
  onRelease: () => void;
  onRestore: () => void;
}) {
  const spec = HERO_BODY_SPEC_BY_ID_V590[selectedBody];
  const orbit = CELESTIAL_ORBIT_BY_ID_V590[selectedBody];
  return (
    <aside className="pointer-events-auto absolute inset-y-0 right-0 z-30 hidden w-[306px] border-l border-white/10 bg-[#020407]/88 px-5 pb-24 pt-5 backdrop-blur-xl lg:block" data-atlas-v590-inspector>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-[7px] uppercase tracking-[.22em] text-white/30"><Database className="h-3 w-3" /> Optical dossier 590</div>
          <h2 className="mt-3 font-[family-name:var(--font-atlas-display,Georgia,serif)] text-3xl font-light tracking-[-.035em] text-[#eee0c8]">{spec.name}</h2>
          <p className="mt-1 max-w-[220px] text-[7px] uppercase leading-relaxed tracking-[.13em] text-white/36">{spec.subtitle}</p>
        </div>
        <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center text-white/32 hover:text-white" aria-label="Close inspector"><X className="h-3.5 w-3.5" /></button>
      </div>

      <div className={`mt-5 border px-3 py-2.5 ${admission === "admitted" ? "border-emerald-200/18 bg-emerald-100/[.035]" : "border-amber-200/18 bg-amber-100/[.035]"}`}>
        <div className="flex items-center gap-2 text-[7px] uppercase tracking-[.16em]">
          <ShieldCheck className={`h-3.5 w-3.5 ${admission === "admitted" ? "text-emerald-200/70" : "text-amber-200/70"}`} />
          <span className={admission === "admitted" ? "text-emerald-100/65" : "text-amber-100/65"}>{admission}</span>
        </div>
        <p className="mt-2 text-[7px] leading-relaxed text-white/30">{admission === "admitted" ? "Manifest-bound layers are eligible for candidate rendering. Science state remains byte-immutable." : "A required public-domain layer is absent. The Hero remains visibly blocked; no colored placeholder is promoted."}</p>
      </div>

      <dl className="mt-5 divide-y divide-white/7 border-y border-white/8 text-[8px]">
        <div className="flex items-center justify-between py-3"><dt className="uppercase tracking-[.15em] text-white/28">Material</dt><dd className="max-w-[160px] text-right text-white/60">{spec.material}</dd></div>
        <div className="flex items-center justify-between py-3"><dt className="uppercase tracking-[.15em] text-white/28">Orbit period</dt><dd className="text-white/60">{orbit.periodLabel}</dd></div>
        <div className="flex items-center justify-between py-3"><dt className="uppercase tracking-[.15em] text-white/28">Mode</dt><dd className="text-white/60">{mode}</dd></div>
        <div className="flex items-center justify-between py-3"><dt className="uppercase tracking-[.15em] text-white/28">Desktop LOD</dt><dd className="text-white/60">≤{spec.maximumDesktopLodPixels / 1024}K</dd></div>
        <div className="flex items-center justify-between py-3"><dt className="uppercase tracking-[.15em] text-white/28">Manifest</dt><dd className="max-w-[150px] truncate text-white/60">{manifestStatus}</dd></div>
      </dl>

      <div className="mt-5">
        <div className="flex items-center gap-2 text-[7px] uppercase tracking-[.18em] text-white/28"><Layers3 className="h-3 w-3" /> Required channels</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {spec.requiredAssets.length > 0 ? spec.requiredAssets.map((asset) => (
            <span key={asset} className="border border-white/8 px-2 py-1 text-[6px] uppercase tracking-[.1em] text-white/38">{asset}</span>
          )) : <span className="border border-cyan-100/10 px-2 py-1 text-[6px] uppercase tracking-[.1em] text-cyan-100/42">explicit procedural primary</span>}
        </div>
      </div>

      <div className="absolute bottom-5 left-5 right-5 border-t border-white/8 pt-4 font-mono text-[6px] uppercase leading-loose tracking-[.12em] text-white/24">
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          <button type="button" data-atlas-v590-release-scene disabled={!sceneMounted} onClick={onRelease} className="min-h-7 border border-white/8 px-2 text-[6px] uppercase tracking-[.12em] text-white/32 enabled:hover:border-white/18 enabled:hover:text-white/58 disabled:opacity-25">Release scene</button>
          <button type="button" data-atlas-v590-restore-scene disabled={sceneMounted} onClick={onRestore} className="min-h-7 border border-white/8 px-2 text-[6px] uppercase tracking-[.12em] text-white/32 enabled:hover:border-white/18 enabled:hover:text-white/58 disabled:opacity-25">Restore scene</button>
        </div>
        <div>Manifest {shortShaV590(CELESTIAL_RENDERING_MANIFEST_SHA256_V590)}</div>
        <div>Payload {shortShaV590(CELESTIAL_RENDERING_SCIENTIFIC_PAYLOAD_SHA256_V590)}</div>
        <div>Formal {CELESTIAL_RENDERING_FORMAL_PRODUCT_POINTER_V590} · read only</div>
      </div>
    </aside>
  );
}

function MobileSheetV590({
  open,
  selectedBody,
  mode,
  onToggle,
  onSelect,
  onMode,
  onOverview,
}: {
  open: boolean;
  selectedBody: HeroBodyIdV590;
  mode: CelestialModeV590;
  onToggle: () => void;
  onSelect: (body: HeroBodyIdV590) => void;
  onMode: (mode: CelestialModeV590) => void;
  onOverview: () => void;
}) {
  return (
    <div className={`pointer-events-auto absolute inset-x-2 bottom-2 z-40 border border-white/12 bg-[#03070a]/92 shadow-[0_-24px_80px_rgba(0,0,0,.55)] backdrop-blur-xl transition-transform md:hidden ${open ? "translate-y-0" : "translate-y-[calc(100%-54px)]"}`} data-atlas-v590-mobile-sheet data-atlas-v590-mobile-sheet-state={open ? "open" : "closed-inert"}>
      <button type="button" onClick={onToggle} className="flex h-[52px] w-full items-center justify-between px-4 text-left" aria-expanded={open} aria-controls="atlas-v590-mobile-controls">
        <div><span className="block text-[7px] uppercase tracking-[.2em] text-white/30">Focused body</span><span className="mt-1 block text-[11px] uppercase tracking-[.15em] text-[#ead5b1]">{HERO_BODY_SPEC_BY_ID_V590[selectedBody].name}</span></div>
        {open ? <ChevronDown className="h-4 w-4 text-white/42" /> : <ChevronUp className="h-4 w-4 text-white/42" />}
      </button>
      <div
        id="atlas-v590-mobile-controls"
        className="max-h-[52dvh] overflow-y-auto border-t border-white/8 px-3 pb-4 pt-3"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="grid grid-cols-2 gap-1.5">
          <ModeButtonV590 active={mode === "science"} label="science" onClick={() => onMode("science")} />
          <ModeButtonV590 active={mode === "cinematic"} label="cinematic" onClick={() => onMode("cinematic")} />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {HERO_BODY_SPECS_V590.map((body) => (
            <button key={body.id} type="button" onClick={() => onSelect(body.id)} className={`min-h-10 border px-1 text-[6px] uppercase tracking-[.08em] ${selectedBody === body.id ? "border-[#e3c28d]/35 text-[#edd8b5]" : "border-white/8 text-white/38"}`}>{body.shortName}</button>
          ))}
        </div>
        <button type="button" onClick={onOverview} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 border border-cyan-100/12 text-[7px] uppercase tracking-[.15em] text-cyan-50/58"><Aperture className="h-3 w-3" /> Overview</button>
      </div>
    </div>
  );
}

export default function OrbitAtlasCelestialRenderingV590() {
  const rootRef = useRef<HTMLElement>(null);
  const deviceTier = useDeviceTierV590();
  const deliveryTier: CelestialDeliveryTierV590 = process.env.NEXT_PUBLIC_ATLAS_CELESTIAL_DELIVERY_TIER === "vercel-lite"
    || process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "vercel-lite"
    ? "vercel-lite"
    : "standalone-full";
  const [mode, setMode] = useState<CelestialModeV590>("cinematic");
  const [selectedBody, setSelectedBody] = useState<HeroBodyIdV590>("earth");
  const [focusTarget, setFocusTarget] = useState<CelestialFocusTargetV590>("earth");
  const exposurePreset: CelestialExposurePresetV590 = "nominal";
  const [cleanView, setCleanView] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [sceneMounted, setSceneMounted] = useState(true);
  const [releaseCycles, setReleaseCycles] = useState(0);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [smallBodiesOpen, setSmallBodiesOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [payloadProbeStatus, setPayloadProbeStatus] = useState<
    "loading" | "connected-stable" | "blocked-not-connected" | "blocked-mutation"
  >("loading");
  const [manifestStatus, setManifestStatus] = useState("loading");
  const [admissions, setAdmissions] = useState<Readonly<Record<HeroBodyIdV590, HeroAssetAdmissionV590>>>(() =>
    Object.fromEntries(HERO_BODY_SPECS_V590.map((body) => [body.id, body.initialAdmission])) as Record<HeroBodyIdV590, HeroAssetAdmissionV590>,
  );
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
    presentationEpoch: 590,
  }), [cleanView, deliveryTier, deviceTier, exposurePreset, focusTarget, mode, selectedBody]);
  useFpsTelemetryV590(rootRef, canvasReady, `${deviceTier}:${focusTarget}:${mode}`);

  useEffect(() => {
    const abort = new AbortController();
    void loadVisualAssetManifestV590(abort.signal).then((manifest) => {
      setAdmissions(manifest.heroBodies);
      setManifestStatus(manifest.status);
    }).catch((error: unknown) => {
      if (abort.signal.aborted) return;
      setManifestStatus(error instanceof Error ? error.message : "blocked");
    });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setPayloadProbeStatus("loading");
    void fetch(CELESTIAL_RENDERING_SCIENTIFIC_PROJECTION_URL_V590, {
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error(`v590-scientific-projection-fetch:${response.status}`);
      return createScientificProjectionStateV590(await response.json());
    }).then((projection) => {
      if (controller.signal.aborted) return;
      scientificProjectionBaselineRef.current = serializeScientificProjectionStateV590(projection);
      setScientificProjection(projection);
      setPayloadProbeStatus("connected-stable");
    }).catch(() => {
      if (controller.signal.aborted) return;
      scientificProjectionBaselineRef.current = null;
      setScientificProjection(null);
      setPayloadProbeStatus("blocked-not-connected");
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const release = () => { setSceneMounted(false); setReleaseCycles((value) => value + 1); };
    const restore = () => setSceneMounted(true);
    window.addEventListener("atlas:v590-release-scene", release);
    window.addEventListener("atlas:v590-restore-scene", restore);
    return () => {
      window.removeEventListener("atlas:v590-release-scene", release);
      window.removeEventListener("atlas:v590-restore-scene", restore);
    };
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
  const toggleCleanView = useCallback(() => {
    mutatePresentation(() => setCleanView((value) => !value));
  }, [mutatePresentation]);

  return (
    <section
      ref={rootRef}
      className="relative h-[100dvh] min-h-[640px] w-full overflow-hidden bg-[#000104] font-[family-name:var(--font-atlas-body,'IBM_Plex_Sans',sans-serif)] text-white"
      data-atlas-browser-acceptance-version="v590-celestial-rendering-browser-acceptance"
      data-atlas-v590-candidate={CELESTIAL_RENDERING_VERSION_V590}
      data-atlas-v590-formal-product-pointer={CELESTIAL_RENDERING_FORMAL_PRODUCT_POINTER_V590}
      data-atlas-v590-manifest-sha={CELESTIAL_RENDERING_MANIFEST_SHA256_V590}
      data-atlas-v590-manifest-status={manifestStatus}
      data-atlas-v590-mode={mode}
      data-atlas-v590-delivery-tier={deliveryTier}
      data-atlas-v590-device-tier={deviceTier}
      data-atlas-v590-selected-body={selectedBody}
      data-atlas-v590-selected-admission={admissions[selectedBody]}
      data-atlas-v590-focus-target={focusTarget}
      data-atlas-v590-clean-view={cleanView ? "true" : "false"}
      data-atlas-v590-canvas-ready={canvasReady ? "true" : "false"}
      data-atlas-v590-canvas-count="1"
      data-atlas-v590-scientific-payload-sha={scientificProjection?.scientificPayloadSha256 ?? "unavailable"}
      data-atlas-v590-scientific-projection={scientificProjectionBaselineRef.current ?? "not-connected"}
      data-atlas-v590-scientific-projection-source={scientificProjection?.sourceUrl ?? "not-connected"}
      data-atlas-v590-scientific-projection-status={payloadProbeStatus}
      data-atlas-v590-payload-stable={payloadProbeStatus === "connected-stable" ? "true" : payloadProbeStatus}
      data-atlas-v590-scientific-writeback="false"
      data-atlas-v590-frozen-candidates-rewritten="false"
      data-atlas-v590-historical-evidence-rewritten="false"
      data-atlas-v590-scene-mounted={sceneMounted ? "true" : "false"}
      data-atlas-v590-resource-release-cycles={releaseCycles}
      data-atlas-v590-resource-release-status={sceneMounted ? "armed" : "draining"}
      data-atlas-v590-exposure-preset={exposurePreset}
    >
      <div className={`absolute inset-y-0 left-0 right-0 transition-[right] duration-300 ${inspectorOpen && !cleanView ? "lg:right-[306px]" : ""}`} data-atlas-v590-single-canvas-stage>
        <UniverseCanvasOverrideHostV590 mode={mode} deviceTier={deviceTier} onCanvasReady={() => setCanvasReady(true)}>
          {sceneMounted ? <CelestialRenderingStageV590 profile={profile} admissions={admissions} focusTarget={focusTarget} /> : null}
          <CelestialRenderingReleaseProbeV590 active={sceneMounted} baseline={baselineRef.current} />
        </UniverseCanvasOverrideHostV590>
      </div>

      {cleanView ? (
        <button type="button" onClick={toggleCleanView} className="pointer-events-auto absolute right-4 top-4 z-50 flex min-h-9 items-center gap-2 border border-white/12 bg-black/46 px-3 text-[7px] uppercase tracking-[.18em] text-white/48 backdrop-blur-md hover:text-white/82" data-atlas-v590-exit-clean-view>
          <Eye className="h-3 w-3" /> Exit clean view
        </button>
      ) : (
        <>
          <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/8 bg-gradient-to-b from-black/75 to-black/0 px-4 md:px-5">
            <div className="flex items-center gap-3">
              <button type="button" className="pointer-events-auto grid h-9 w-9 place-items-center border border-white/10 text-white/45 md:hidden" onClick={() => setMobileSheetOpen((open) => !open)} aria-label="Open celestial controls"><Menu className="h-4 w-4" /></button>
              <div>
                <div className="text-[8px] uppercase tracking-[.29em] text-[#e9c98f]/72">Orbit Atlas / Celestial rendering</div>
                <div className="mt-1 text-[6px] uppercase tracking-[.18em] text-white/26">Gaia optics · fixed celestial sphere · v590 additive</div>
              </div>
            </div>
            <div className="pointer-events-auto flex items-center gap-1.5">
              <ModeButtonV590 active={mode === "science"} label="science" onClick={() => switchMode("science")} />
              <ModeButtonV590 active={mode === "cinematic"} label="cinematic" onClick={() => switchMode("cinematic")} />
              <button type="button" disabled={mode !== "cinematic"} onClick={toggleCleanView} className="ml-1 hidden min-h-9 items-center gap-2 border border-white/10 px-3 text-[7px] uppercase tracking-[.15em] text-white/42 enabled:hover:text-white/78 disabled:opacity-20 md:flex"><EyeOff className="h-3 w-3" /> Clean view</button>
              <button type="button" onClick={() => setInspectorOpen((open) => !open)} className="hidden h-9 items-center gap-2 border border-white/10 px-3 text-[7px] uppercase tracking-[.15em] text-white/42 hover:text-white/78 lg:flex"><Database className="h-3 w-3" /> Inspector</button>
            </div>
          </header>

          {HUD_CONTRAST_PROTECTION_V590}
          <BodyRailV590 selectedBody={selectedBody} onSelect={selectBody} onOpenSmallBodies={() => setSmallBodiesOpen(true)} onOverview={() => focusSky("overview")} />
          <SmallBodyDrawerV590 open={smallBodiesOpen} selectedBody={selectedBody} onClose={() => setSmallBodiesOpen(false)} onSelect={selectBody} />
          <DeepSpaceRailV590 onFocus={focusSky} />
          {inspectorOpen ? (
            <InspectorV590
              selectedBody={selectedBody}
              admission={admissions[selectedBody]}
              mode={mode}
              manifestStatus={manifestStatus}
              sceneMounted={sceneMounted}
              onClose={() => setInspectorOpen(false)}
              onRelease={() => { setSceneMounted(false); setReleaseCycles((value) => value + 1); }}
              onRestore={() => setSceneMounted(true)}
            />
          ) : null}
          <MobileSheetV590 open={mobileSheetOpen} selectedBody={selectedBody} mode={mode} onToggle={() => setMobileSheetOpen((open) => !open)} onSelect={selectBody} onMode={switchMode} onOverview={() => focusSky("overview")} />
        </>
      )}

      <div className="pointer-events-none absolute bottom-3 right-3 z-20 hidden items-center gap-2 border border-white/[.07] bg-black/25 px-2.5 py-1.5 font-mono text-[6px] uppercase tracking-[.12em] text-white/24 md:flex lg:hidden">
        <RotateCcw className="h-2.5 w-2.5" /> payload {scientificProjection ? shortShaV590(scientificProjection.scientificPayloadSha256) : "not connected"}
      </div>

      <div className="sr-only" aria-live="polite">{`v590 ${manifestStatus}; ${selectedBody}; ${admissions[selectedBody]}; ${mode}`}</div>
    </section>
  );
}
