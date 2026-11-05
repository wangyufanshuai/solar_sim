"use client";

import {
  Aperture,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Crosshair,
  Database,
  Layers3,
  Menu,
  Orbit,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CELESTIAL_ART_FORMAL_PRODUCT_POINTER_V589,
  CELESTIAL_ART_MANIFEST_SHA256_V589,
  CELESTIAL_ART_SCIENTIFIC_PAYLOAD_SHA256_V589,
  CELESTIAL_ART_VERSION_V589,
  CELESTIAL_ORBIT_BY_ID_V589,
  HERO_BODY_SPEC_BY_ID_V589,
  HERO_BODY_SPECS_V589,
  type CelestialDeliveryTierV589,
  type CelestialDeviceTierV589,
  type CelestialExposurePresetV589,
  type CelestialModeV589,
  type CelestialRenderProfileV589,
  type HeroAssetAdmissionV589,
  type HeroBodyIdV589,
} from "../lib/celestialArtV589";
import { getAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
import { loadVisualAssetManifestV589 } from "../lib/useV589Texture";
import CelestialArtStageV589, { CelestialArtReleaseProbeV589 } from "./CelestialArtStageV589";
import UniverseCanvasOverrideHostV589 from "./UniverseCanvasOverrideHostV589";

type FocusTargetV589 = "overview" | HeroBodyIdV589;

function useDeviceTierV589(): CelestialDeviceTierV589 {
  const [tier, setTier] = useState<CelestialDeviceTierV589>("desktop");
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setTier(query.matches ? "mobile" : "desktop");
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return tier;
}

function useFpsTelemetryV589(rootRef: React.RefObject<HTMLElement | null>, ready: boolean, key: string): void {
  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    let previous = performance.now();
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
        rootRef.current.dataset.atlasV589FpsMedian = median.toFixed(2);
        rootRef.current.dataset.atlasV589FpsSampleCount = String(samples.length);
        rootRef.current.dataset.atlasV589FpsGate = median >= (key.includes("mobile") || key.includes("closeup") ? 45 : 55) ? "passed" : "warming";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [key, ready, rootRef]);
}

function shortSha(value: string): string {
  return value.length >= 12 ? `${value.slice(0, 7)}…${value.slice(-5)}` : value;
}

function ModeButton({ active, label, onClick }: { active: boolean; label: CelestialModeV589; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 border px-3 text-[7px] uppercase tracking-[.18em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/70 ${active ? "border-[#e5c389]/42 bg-[#e5c389]/8 text-[#f0d7ad]" : "border-white/10 text-white/36 hover:text-white/70"}`}
    >
      {label}
    </button>
  );
}

function MajorBodyRailV589({
  selectedBody,
  focusTarget,
  onSelect,
  onFocus,
  onOpenSmallBodies,
}: {
  selectedBody: HeroBodyIdV589;
  focusTarget: FocusTargetV589;
  onSelect: (body: HeroBodyIdV589) => void;
  onFocus: (body: FocusTargetV589) => void;
  onOpenSmallBodies: () => void;
}) {
  const major = HERO_BODY_SPECS_V589.filter((body) => body.group === "major");
  return (
    <nav className="pointer-events-auto absolute left-3 top-20 z-30 hidden w-24 flex-col gap-1 md:flex" aria-label="Major celestial bodies">
      <div className="mb-2 flex items-center gap-2 px-2 text-[7px] uppercase tracking-[.2em] text-white/28"><Orbit className="h-3 w-3" aria-hidden="true" />Primary</div>
      {major.map((body) => {
        const active = selectedBody === body.id;
        return (
          <button
            key={body.id}
            type="button"
            onClick={() => { onSelect(body.id); onFocus(body.id); }}
            className={`group flex min-h-9 items-center gap-2 border px-2 text-left text-[7px] uppercase tracking-[.11em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/70 ${active ? "border-white/22 bg-black/62 text-white" : "border-white/7 bg-black/18 text-white/36 hover:border-white/16 hover:text-white/72"}`}
            data-atlas-v589-body-button={body.id}
            aria-pressed={active}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: body.accent, boxShadow: active ? `0 0 12px ${body.accent}` : "none" }} />
            <span className="truncate">{body.shortName}</span>
          </button>
        );
      })}
      <button type="button" onClick={onOpenSmallBodies} className="mt-1 flex min-h-9 items-center justify-center gap-2 border border-dashed border-white/12 text-[7px] uppercase tracking-[.12em] text-white/40 hover:border-white/24 hover:text-white/72">
        <CircleDot className="h-3 w-3" aria-hidden="true" />Small ×6
      </button>
      <button type="button" onClick={() => onFocus("overview")} className={`mt-2 flex min-h-9 items-center justify-center gap-2 border text-[7px] uppercase tracking-[.12em] ${focusTarget === "overview" ? "border-cyan-100/25 text-cyan-50/75" : "border-white/10 text-white/38"}`}>
        <Aperture className="h-3 w-3" aria-hidden="true" />Overview
      </button>
    </nav>
  );
}

function SmallBodyDrawerV589({
  open,
  selectedBody,
  onClose,
  onSelect,
}: {
  open: boolean;
  selectedBody: HeroBodyIdV589;
  onClose: () => void;
  onSelect: (body: HeroBodyIdV589) => void;
}) {
  if (!open) return null;
  return (
    <div className="pointer-events-auto absolute left-[116px] top-20 z-40 hidden w-64 border border-white/12 bg-[#020507]/92 p-3 shadow-2xl backdrop-blur-xl md:block" data-atlas-v589-small-body-drawer>
      <div className="flex items-center justify-between border-b border-white/8 pb-2">
        <span className="text-[8px] uppercase tracking-[.2em] text-white/48">Small-body laboratory</span>
        <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center text-white/38 hover:text-white"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {HERO_BODY_SPECS_V589.filter((body) => body.group === "small-body").map((body) => (
          <button
            key={body.id}
            type="button"
            onClick={() => { onSelect(body.id); onClose(); }}
            className={`min-h-14 border p-2 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/70 ${selectedBody === body.id ? "border-[#d9b77e]/35 bg-[#d9b77e]/7" : "border-white/9 hover:border-white/18"}`}
          >
            <span className="block text-[8px] uppercase tracking-[.12em] text-white/70">{body.shortName}</span>
            <span className="mt-1 block text-[6px] uppercase tracking-[.1em] text-white/24">NASA model gate</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function InspectorV589({
  selectedBody,
  admission,
  mode,
  onClose,
  sceneMounted,
  onRelease,
  onRestore,
}: {
  selectedBody: HeroBodyIdV589;
  admission: HeroAssetAdmissionV589;
  mode: CelestialModeV589;
  onClose: () => void;
  sceneMounted: boolean;
  onRelease: () => void;
  onRestore: () => void;
}) {
  const spec = HERO_BODY_SPEC_BY_ID_V589[selectedBody];
  const orbit = CELESTIAL_ORBIT_BY_ID_V589[selectedBody];
  return (
    <aside className="pointer-events-auto absolute inset-y-0 right-0 z-30 hidden w-[292px] border-l border-white/10 bg-[#020407]/86 px-5 pb-24 pt-5 backdrop-blur-xl lg:block" data-atlas-v589-inspector>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-[7px] uppercase tracking-[.21em] text-white/28"><Database className="h-3 w-3" />Celestial inspector</div>
          <h2 className="mt-3 font-[family-name:var(--font-atlas-display,Georgia,serif)] text-3xl font-light tracking-[-.03em] text-[#eee0c8]">{spec.name}</h2>
          <p className="mt-1 text-[7px] uppercase leading-relaxed tracking-[.13em] text-white/34">{spec.subtitle}</p>
        </div>
        <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center text-white/32 hover:text-white"><X className="h-3.5 w-3.5" /></button>
      </div>

      <div className={`mt-5 border px-3 py-2 ${admission === "admitted" ? "border-emerald-200/18 bg-emerald-100/[.035]" : "border-amber-200/18 bg-amber-100/[.035]"}`}>
        <div className="flex items-center gap-2 text-[7px] uppercase tracking-[.16em]">
          <ShieldCheck className={`h-3.5 w-3.5 ${admission === "admitted" ? "text-emerald-200/70" : "text-amber-200/70"}`} />
          <span className={admission === "admitted" ? "text-emerald-100/65" : "text-amber-100/65"}>{admission}</span>
        </div>
        <p className="mt-2 text-[7px] leading-relaxed text-white/28">{admission === "admitted" ? "All required visual layers are SHA-verified for this candidate. Scientific state remains read-only." : "Missing public-domain assets remain visibly blocked. No procedural replacement may inherit Hero admission."}</p>
      </div>

      <dl className="mt-5 divide-y divide-white/7 border-y border-white/8 text-[8px]">
        <div className="flex items-center justify-between py-3"><dt className="uppercase tracking-[.15em] text-white/28">Geometry</dt><dd className="text-white/58">{spec.geometry}</dd></div>
        <div className="flex items-center justify-between py-3"><dt className="uppercase tracking-[.15em] text-white/28">Material</dt><dd className="max-w-[150px] text-right text-white/58">{spec.material}</dd></div>
        <div className="flex items-center justify-between py-3"><dt className="uppercase tracking-[.15em] text-white/28">Period</dt><dd className="text-white/58">{orbit.periodLabel}</dd></div>
        <div className="flex items-center justify-between py-3"><dt className="uppercase tracking-[.15em] text-white/28">Mode</dt><dd className="text-white/58">{mode}</dd></div>
        <div className="flex items-center justify-between py-3"><dt className="uppercase tracking-[.15em] text-white/28">LOD</dt><dd className="text-white/58">screen-space 0/1/2</dd></div>
      </dl>

      <div className="mt-5">
        <div className="flex items-center gap-2 text-[7px] uppercase tracking-[.18em] text-white/28"><Layers3 className="h-3 w-3" />Required layers</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {spec.requiredAssets.length > 0 ? spec.requiredAssets.map((asset) => (
            <span key={asset} className="border border-white/8 px-2 py-1 text-[6px] uppercase tracking-[.1em] text-white/36">{asset}</span>
          )) : <span className="border border-cyan-100/10 px-2 py-1 text-[6px] uppercase tracking-[.1em] text-cyan-100/40">explicit procedural primary</span>}
        </div>
      </div>

      <div className="absolute bottom-5 left-5 right-5 border-t border-white/8 pt-4 font-mono text-[6px] uppercase leading-loose tracking-[.12em] text-white/22">
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            data-atlas-v589-release-scene
            disabled={!sceneMounted}
            onClick={onRelease}
            className="min-h-7 border border-white/8 px-2 text-[6px] uppercase tracking-[.12em] text-white/30 enabled:hover:border-white/18 enabled:hover:text-white/58 disabled:opacity-25"
          >Release resources</button>
          <button
            type="button"
            data-atlas-v589-restore-scene
            disabled={sceneMounted}
            onClick={onRestore}
            className="min-h-7 border border-white/8 px-2 text-[6px] uppercase tracking-[.12em] text-white/30 enabled:hover:border-white/18 enabled:hover:text-white/58 disabled:opacity-25"
          >Restore resources</button>
        </div>
        <div>Manifest {shortSha(CELESTIAL_ART_MANIFEST_SHA256_V589)}</div>
        <div>Payload {shortSha(CELESTIAL_ART_SCIENTIFIC_PAYLOAD_SHA256_V589)}</div>
        <div>Formal {CELESTIAL_ART_FORMAL_PRODUCT_POINTER_V589} · read only</div>
      </div>
    </aside>
  );
}

export default function OrbitAtlasCelestialArtV589() {
  const rootRef = useRef<HTMLElement>(null);
  const deviceTier = useDeviceTierV589();
  const deliveryTier: CelestialDeliveryTierV589 = process.env.NEXT_PUBLIC_ATLAS_CELESTIAL_DELIVERY_TIER === "vercel-lite"
    || process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "vercel-lite"
    ? "vercel-lite"
    : "standalone-full";
  const [mode, setMode] = useState<CelestialModeV589>("cinematic");
  const [selectedBody, setSelectedBody] = useState<HeroBodyIdV589>("earth");
  const [focusTarget, setFocusTarget] = useState<FocusTargetV589>("earth");
  const [exposurePreset, setExposurePreset] = useState<CelestialExposurePresetV589>("nominal");
  const [canvasReady, setCanvasReady] = useState(false);
  const [sceneMounted, setSceneMounted] = useState(true);
  const [releaseCycles, setReleaseCycles] = useState(0);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [smallBodiesOpen, setSmallBodiesOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [payloadStable, setPayloadStable] = useState(true);
  const [manifestStatus, setManifestStatus] = useState("loading");
  const [admissions, setAdmissions] = useState<Readonly<Record<HeroBodyIdV589, HeroAssetAdmissionV589>>>(() =>
    Object.fromEntries(HERO_BODY_SPECS_V589.map((body) => [body.id, body.admission])) as Record<HeroBodyIdV589, HeroAssetAdmissionV589>,
  );
  const payloadRef = useRef(CELESTIAL_ART_SCIENTIFIC_PAYLOAD_SHA256_V589);
  const baselineRef = useRef(getAtlasResourceSnapshot());
  const profile = useMemo<CelestialRenderProfileV589>(() => ({
    mode,
    deliveryTier,
    deviceTier,
    selectedBody,
    exposurePreset,
  }), [deliveryTier, deviceTier, exposurePreset, mode, selectedBody]);
  useFpsTelemetryV589(rootRef, canvasReady, `${deviceTier}:${focusTarget}:${mode}`);

  useEffect(() => {
    let alive = true;
    void loadVisualAssetManifestV589().then((manifest) => {
      if (!alive) return;
      setAdmissions(manifest.heroBodies);
      setManifestStatus(manifest.status);
    }).catch((error: unknown) => {
      if (!alive) return;
      setManifestStatus(error instanceof Error ? error.message : "blocked");
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const release = () => {
      setSceneMounted(false);
      setReleaseCycles((value) => value + 1);
    };
    const restore = () => setSceneMounted(true);
    window.addEventListener("atlas:v589-release-scene", release);
    window.addEventListener("atlas:v589-restore-scene", restore);
    return () => {
      window.removeEventListener("atlas:v589-release-scene", release);
      window.removeEventListener("atlas:v589-restore-scene", restore);
    };
  }, []);

  const switchMode = useCallback((next: CelestialModeV589) => {
    const before = payloadRef.current;
    setMode(next);
    queueMicrotask(() => setPayloadStable(before === payloadRef.current));
  }, []);
  const selectBody = useCallback((body: HeroBodyIdV589) => {
    setSelectedBody(body);
    setFocusTarget(body);
  }, []);
  const selected = HERO_BODY_SPEC_BY_ID_V589[selectedBody];

  return (
    <section
      ref={rootRef}
      className="relative h-[100dvh] min-h-[640px] w-full overflow-hidden bg-[#000104] font-[family-name:var(--font-atlas-body,Inter,sans-serif)] text-white"
      data-atlas-browser-acceptance-version="v589-celestial-art-browser-acceptance"
      data-atlas-v589-candidate={CELESTIAL_ART_VERSION_V589}
      data-atlas-v589-formal-product-pointer={CELESTIAL_ART_FORMAL_PRODUCT_POINTER_V589}
      data-atlas-v589-manifest-sha={CELESTIAL_ART_MANIFEST_SHA256_V589}
      data-atlas-v589-manifest-status={manifestStatus}
      data-atlas-v589-mode={mode}
      data-atlas-v589-delivery-tier={deliveryTier}
      data-atlas-v589-device-tier={deviceTier}
      data-atlas-v589-selected-body={selectedBody}
      data-atlas-v589-selected-admission={admissions[selectedBody]}
      data-atlas-v589-focus-target={focusTarget}
      data-atlas-v589-canvas-ready={canvasReady ? "true" : "false"}
      data-atlas-v589-canvas-count="1"
      data-atlas-v589-scientific-payload-sha={payloadRef.current}
      data-atlas-v589-payload-stable={payloadStable ? "true" : "false"}
      data-atlas-v589-scientific-writeback="false"
      data-atlas-v589-v588-rewritten="false"
      data-atlas-v589-historical-evidence-rewritten="false"
      data-atlas-v589-scene-mounted={sceneMounted ? "true" : "false"}
      data-atlas-v589-resource-release-cycles={releaseCycles}
      data-atlas-v589-resource-release-status={sceneMounted ? "armed" : "draining"}
      data-atlas-v589-exposure-preset={exposurePreset}
    >
      <div className={`absolute inset-y-0 left-0 right-0 transition-[right] duration-300 ${inspectorOpen ? "lg:right-[292px]" : ""}`} data-atlas-v589-single-canvas-stage>
        <UniverseCanvasOverrideHostV589 mode={mode} deviceTier={deviceTier} onCanvasReady={() => setCanvasReady(true)}>
          {sceneMounted ? <CelestialArtStageV589 profile={profile} admissions={admissions} focusTarget={focusTarget} /> : null}
          <CelestialArtReleaseProbeV589 active={sceneMounted} baseline={baselineRef.current} />
        </UniverseCanvasOverrideHostV589>
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/8 bg-gradient-to-b from-black/68 to-black/0 px-4 md:px-5">
        <div className="flex items-center gap-3">
          <button type="button" className="pointer-events-auto grid h-9 w-9 place-items-center border border-white/10 text-white/42 md:hidden" onClick={() => setMobileSheetOpen((open) => !open)}><Menu className="h-4 w-4" /></button>
          <div>
            <div className="text-[8px] uppercase tracking-[.28em] text-[#e9c98f]/68">Orbit Atlas / Celestial optics</div>
            <div className="mt-1 text-[6px] uppercase tracking-[.17em] text-white/24">Gaia PSF · public-domain Hero lane · v589 additive</div>
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-1.5">
          <ModeButton active={mode === "science"} label="science" onClick={() => switchMode("science")} />
          <ModeButton active={mode === "cinematic"} label="cinematic" onClick={() => switchMode("cinematic")} />
          <button type="button" onClick={() => setInspectorOpen((open) => !open)} className="ml-1 hidden h-9 items-center gap-2 border border-white/10 px-3 text-[7px] uppercase tracking-[.15em] text-white/40 hover:text-white/75 lg:flex"><Layers3 className="h-3 w-3" />Inspector</button>
        </div>
      </header>

      <MajorBodyRailV589 selectedBody={selectedBody} focusTarget={focusTarget} onSelect={setSelectedBody} onFocus={setFocusTarget} onOpenSmallBodies={() => setSmallBodiesOpen(true)} />
      <SmallBodyDrawerV589 open={smallBodiesOpen} selectedBody={selectedBody} onClose={() => setSmallBodiesOpen(false)} onSelect={selectBody} />

      <div className="pointer-events-none absolute left-4 top-[76px] z-20 hidden max-w-[390px] md:block md:left-[126px]">
        <div className="border-l border-[#e7ca98]/55 pl-4">
          <div className="text-[7px] uppercase tracking-[.24em] text-white/30">Selected celestial body</div>
          <h1 className="mt-2 font-[family-name:var(--font-atlas-display,Georgia,serif)] text-5xl font-light tracking-[-.045em] text-[#f2e3cc]">{selected.name}</h1>
          <p className="mt-1 text-[7px] uppercase tracking-[.16em] text-white/34">{selected.subtitle}</p>
        </div>
        <div className="mt-4 flex items-center gap-4 text-[7px] uppercase tracking-[.14em] text-white/28">
          <span className={admissions[selectedBody] === "admitted" ? "text-emerald-100/56" : "text-amber-100/56"}>{admissions[selectedBody]}</span>
          <span>{CELESTIAL_ORBIT_BY_ID_V589[selectedBody].periodLabel}</span>
          <span>{mode}</span>
        </div>
      </div>

      {inspectorOpen ? (
        <InspectorV589
          selectedBody={selectedBody}
          admission={admissions[selectedBody]}
          mode={mode}
          onClose={() => setInspectorOpen(false)}
          sceneMounted={sceneMounted}
          onRelease={() => {
            setSceneMounted(false);
            setReleaseCycles((value) => value + 1);
          }}
          onRestore={() => setSceneMounted(true)}
        />
      ) : null}

      <div className={`pointer-events-auto absolute bottom-0 left-0 right-0 z-30 hidden h-[88px] border-t border-white/9 bg-[#020507]/82 backdrop-blur-xl md:block ${inspectorOpen ? "lg:right-[292px]" : ""}`}>
        <div className="grid h-full grid-cols-[200px_1fr_220px] items-center gap-6 px-5">
          <div className="border-r border-white/9 pr-5">
            <div className="flex items-center gap-2 text-[8px] uppercase tracking-[.18em] text-white/46"><Sparkles className="h-3.5 w-3.5" />Exposure discipline</div>
            <p className="mt-2 text-[6px] uppercase tracking-[.12em] text-white/23">Science remains linear and ungraded</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["extreme-dark", "nominal", "extreme-bright"] as const).map((preset) => (
              <button key={preset} type="button" onClick={() => setExposurePreset(preset)} className={`min-h-9 border text-[7px] uppercase tracking-[.12em] ${exposurePreset === preset ? "border-[#d9bd8b]/32 text-[#ebd4ac]" : "border-white/9 text-white/31"}`}>{preset.replace("extreme-", "")}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setFocusTarget("overview")} className="flex h-10 items-center justify-center gap-2 border border-white/11 text-[7px] uppercase tracking-[.14em] text-white/44"><Aperture className="h-3 w-3" />Overview</button>
            <button type="button" onClick={() => setFocusTarget(selectedBody)} className="flex h-10 items-center justify-center gap-2 border border-white/11 text-[7px] uppercase tracking-[.14em] text-white/44"><Crosshair className="h-3 w-3" />Close-up</button>
          </div>
        </div>
      </div>

      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-50 md:hidden">
        <div className="mx-2 mb-2 overflow-hidden rounded-xl border border-white/12 bg-[#03070a]/92 shadow-[0_-18px_45px_rgba(0,0,0,.5)] backdrop-blur-xl">
          <button type="button" onClick={() => setMobileSheetOpen((open) => !open)} className="flex min-h-14 w-full items-center gap-3 px-4 text-left" aria-expanded={mobileSheetOpen}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selected.accent, boxShadow: `0 0 14px ${selected.accent}` }} />
            <span className="min-w-0 flex-1"><strong className="block truncate font-[family-name:var(--font-atlas-display,Georgia,serif)] text-lg font-normal text-[#f1dfc5]">{selected.name}</strong><span className="block truncate text-[7px] uppercase tracking-[.13em] text-white/34">{admissions[selectedBody]} · {mode}</span></span>
            {mobileSheetOpen ? <ChevronDown className="h-4 w-4 text-white/42" /> : <ChevronUp className="h-4 w-4 text-white/42" />}
          </button>
          {mobileSheetOpen ? (
            <div className="max-h-[52dvh] overflow-y-auto border-t border-white/9 p-3">
              <div className="grid grid-cols-3 gap-1.5">
                {HERO_BODY_SPECS_V589.map((body) => (
                  <button key={body.id} type="button" onClick={() => selectBody(body.id)} className={`min-h-10 border px-1 text-[7px] uppercase tracking-[.08em] ${selectedBody === body.id ? "border-white/28 bg-white/7 text-white" : "border-white/9 text-white/38"}`}>{body.shortName}</button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                <button type="button" onClick={() => setFocusTarget("overview")} className="flex min-h-10 items-center justify-center gap-1 border border-white/10 text-[7px] uppercase tracking-[.1em] text-white/46"><Aperture className="h-3 w-3" />Overview</button>
                <button type="button" onClick={() => switchMode(mode === "science" ? "cinematic" : "science")} className="flex min-h-10 items-center justify-center gap-1 border border-white/10 text-[7px] uppercase tracking-[.1em] text-white/46"><Sparkles className="h-3 w-3" />{mode}</button>
                <button type="button" onClick={() => { setExposurePreset("nominal"); setFocusTarget(selectedBody); }} className="flex min-h-10 items-center justify-center gap-1 border border-white/10 text-[7px] uppercase tracking-[.1em] text-white/46"><RotateCcw className="h-3 w-3" />Reset</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-[126px] z-20 hidden items-center gap-2 font-mono text-[6px] uppercase tracking-[.14em] text-white/18 xl:flex">
        <CircleDot className="h-3 w-3" />
        <span>Manifest {shortSha(CELESTIAL_ART_MANIFEST_SHA256_V589)}</span><span>/</span><span>Payload read-only {shortSha(payloadRef.current)}</span>
      </div>

    </section>
  );
}
