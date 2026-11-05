"use client";

import {
  Aperture,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Crosshair,
  Gauge,
  Orbit,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { getAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
import {
  HERO_ORBIT_BY_ID_V588,
  HERO_ORBITS_V588,
  V588_FORMAL_PRODUCT_POINTER,
  V588_SCIENTIFIC_PAYLOAD_REFERENCE_SHA256,
  VISUAL_RESTORATION_MANIFEST_SHA256_V588,
  predictedOrbitV588,
  type HeroBodyIdV588,
  type VisualRestorationModeV588,
  type VisualRestorationVariantV588,
} from "../lib/visualRestorationV588";
import UniverseCanvas from "./UniverseCanvas";
import VisualRestorationStageV588, {
  VisualRestorationReleaseProbeV588,
} from "./VisualRestorationStageV588";

function useViewportVariantV588(): VisualRestorationVariantV588 {
  const [variant, setVariant] = useState<VisualRestorationVariantV588>("desktop");
  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const publish = () => setVariant(query.matches ? "mobile" : "desktop");
    publish();
    query.addEventListener("change", publish);
    return () => query.removeEventListener("change", publish);
  }, []);
  return variant;
}

function useFrameTelemetryV588(rootRef: React.RefObject<HTMLElement | null>, ready: boolean, telemetryKey: string) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !ready) return;
    const samples: number[] = [];
    let previous = performance.now();
    let frame = 0;
    let animation = 0;
    root.dataset.atlasV588PerformanceStatus = "sampling";
    const publish = () => {
      const sorted = samples.toSorted((left, right) => left - right);
      const median = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
      const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
      root.dataset.atlasV588FrameSamples = String(samples.length);
      root.dataset.atlasV588MedianFps = median > 0 ? (1000 / median).toFixed(1) : "0.0";
      root.dataset.atlasV588FrameP95Ms = p95.toFixed(2);
      root.dataset.atlasV588PerformanceStatus = samples.length >= 241 ? "ready" : "sampling";
    };
    const tick = (now: number) => {
      samples.push(Math.min(1000, now - previous));
      if (samples.length > 720) samples.shift();
      previous = now;
      frame += 1;
      if (frame % 30 === 0) publish();
      animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animation);
  }, [ready, rootRef, telemetryKey]);
}

function shortSha(value: string): string {
  return `${value.slice(0, 10)}…${value.slice(-5)}`;
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-h-9 px-3 text-[8px] uppercase tracking-[.22em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/60 ${
        active ? "text-white" : "text-white/36 hover:text-white/70"
      }`}
      aria-pressed={active}
    >
      {label}
      {active ? <span className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-[#f4d3a0] to-transparent" /> : null}
    </button>
  );
}

function BodyRail({
  selectedBody,
  focusBody,
  onSelect,
  onFocus,
}: {
  selectedBody: HeroBodyIdV588;
  focusBody: "overview" | HeroBodyIdV588;
  onSelect: (body: HeroBodyIdV588) => void;
  onFocus: (body: "overview" | HeroBodyIdV588) => void;
}) {
  return (
    <nav
      aria-label="Hero planets"
      className="pointer-events-auto absolute left-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-1.5 md:flex"
    >
      <button
        type="button"
        onClick={() => onFocus("overview")}
        className={`group flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/60 ${
          focusBody === "overview" ? "border-white/35 bg-white/10 text-white" : "border-white/10 bg-black/35 text-white/36 hover:border-white/25 hover:text-white/70"
        }`}
        aria-label="Overview camera"
      >
        <Aperture className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span className="mx-auto h-5 w-px bg-gradient-to-b from-white/20 to-transparent" />
      {HERO_ORBITS_V588.map((orbit) => {
        const active = selectedBody === orbit.id;
        return (
          <button
            key={orbit.id}
            type="button"
            onClick={() => {
              onSelect(orbit.id);
              onFocus(orbit.id);
            }}
            className={`group relative flex h-11 w-11 items-center justify-center rounded-full border transition-[border-color,background-color,transform] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/60 ${
              active ? "scale-105 border-white/38 bg-white/10" : "border-white/10 bg-black/35 hover:scale-105 hover:border-white/26"
            }`}
            aria-label={`Inspect ${orbit.name}`}
            aria-pressed={active}
          >
            <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_12px_currentColor]" style={{ color: orbit.accent, backgroundColor: orbit.accent }} />
            <span className="pointer-events-none absolute left-14 whitespace-nowrap text-[8px] uppercase tracking-[.18em] text-white/0 transition-colors group-hover:text-white/60">{orbit.name}</span>
          </button>
        );
      })}
    </nav>
  );
}

function OrbitInspector({
  selectedBody,
  velocityScale,
  focusedConstellation,
  onConstellation,
  onReset,
  onClose,
}: {
  selectedBody: HeroBodyIdV588;
  velocityScale: number;
  focusedConstellation: string;
  onConstellation: (code: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const orbit = HERO_ORBIT_BY_ID_V588[selectedBody];
  const predicted = useMemo(() => predictedOrbitV588(orbit, velocityScale), [orbit, velocityScale]);
  const options = useMemo(() => CONSTELLATION_LINES.map((entry) => ({
    value: `${entry.iauCode} — ${entry.name}`,
    code: entry.iauCode,
  })), []);
  return (
    <aside className="pointer-events-auto absolute inset-y-12 right-0 z-30 hidden w-[292px] border-l border-white/10 bg-[#020507]/[.86] backdrop-blur-xl lg:block" aria-label="Orbit inspector">
      <div className="flex h-11 items-center justify-between border-b border-white/10 px-4">
        <div className="text-[8px] uppercase tracking-[.24em] text-white/52">Orbital instrument</div>
        <button type="button" onClick={onClose} className="rounded p-2 text-white/36 hover:bg-white/5 hover:text-white/72 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/60" aria-label="Close orbit inspector">
          <PanelRightClose className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[8px] uppercase tracking-[.2em] text-white/32">Selected body</div>
            <div className="mt-1 font-[family-name:var(--font-atlas-display,Georgia,serif)] text-3xl font-light text-[#f1dfc4]">{orbit.name}</div>
            <div className="mt-1 text-[8px] uppercase tracking-[.13em] text-white/38">{orbit.subtitle}</div>
          </div>
          <span className="mt-2 h-3 w-3 rounded-full shadow-[0_0_18px_currentColor]" style={{ color: orbit.accent, backgroundColor: orbit.accent }} />
        </div>
      </div>
      <dl className="grid grid-cols-2 border-b border-white/10 text-[8px]">
        <div className="border-b border-r border-white/10 p-3"><dt className="uppercase tracking-[.14em] text-white/30">Reference e</dt><dd className="mt-2 text-[14px] tabular-nums text-white/78">{orbit.eccentricity.toFixed(4)}</dd></div>
        <div className="border-b border-white/10 p-3"><dt className="uppercase tracking-[.14em] text-white/30">Predicted e</dt><dd className="mt-2 text-[14px] tabular-nums text-[#f3d39b]">{predicted.eccentricity.toFixed(4)}</dd></div>
        <div className="border-r border-white/10 p-3"><dt className="uppercase tracking-[.14em] text-white/30">Velocity</dt><dd className="mt-2 text-[14px] tabular-nums text-white/78">{velocityScale.toFixed(2)}×</dd></div>
        <div className="p-3"><dt className="uppercase tracking-[.14em] text-white/30">Forecast</dt><dd className="mt-2 text-[10px] uppercase tracking-[.12em] text-white/68">{predicted.bound ? "Bound" : "Escape"}</dd></div>
      </dl>
      <div className="border-b border-white/10 p-4">
        <div className="mb-2 flex items-center gap-2 text-[8px] uppercase tracking-[.18em] text-white/40"><Search className="h-3 w-3" aria-hidden="true" />88 IAU constellations</div>
        <label className="sr-only" htmlFor="v588-constellation-search">Search or focus constellation</label>
        <input
          id="v588-constellation-search"
          name="v588-constellation-search"
          list="v588-constellation-options"
          value={focusedConstellation}
          onChange={(event) => {
            const raw = event.currentTarget.value.trim();
            const match = options.find((entry) => entry.value === raw || entry.code.toLowerCase() === raw.toLowerCase());
            onConstellation(match?.code ?? raw.slice(0, 3));
          }}
          placeholder="Ori — Orion…"
          autoComplete="off"
          className="h-9 w-full border border-white/12 bg-black/30 px-3 text-[9px] tracking-[.08em] text-white/78 outline-none transition-colors placeholder:text-white/22 focus-visible:border-cyan-100/40"
        />
        <datalist id="v588-constellation-options">
          {options.map((entry) => <option key={entry.code} value={entry.value} />)}
        </datalist>
        <p className="mt-2 text-[8px] leading-4 text-white/28">12 guides remain readable by default; any of the 88 may be focused without changing orbit geometry.</p>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-[10px_1fr] gap-x-3 gap-y-2 text-[8px] uppercase tracking-[.14em] text-white/44">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#ffd68a]" /><span>Periapsis / apoapsis</span>
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#7ff0d5]" /><span>Ascending / descending nodes</span>
          <span className="mt-1 h-px w-2 bg-[#f6f0cf]" /><span>Velocity forecast path</span>
          <span className="mt-0.5 h-2 w-2 border border-white/20 bg-white/[.03]" /><span>Orbital plane ghost</span>
        </div>
        <button type="button" onClick={onReset} className="mt-5 flex h-9 w-full items-center justify-center gap-2 border border-white/12 text-[8px] uppercase tracking-[.18em] text-white/48 transition-colors hover:border-white/25 hover:text-white/78 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/60">
          <RotateCcw className="h-3 w-3" aria-hidden="true" />Reset orbit forecast
        </button>
      </div>
    </aside>
  );
}

export default function OrbitAtlasVisualRestorationV588() {
  const rootRef = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<VisualRestorationModeV588>("cinematic");
  const [selectedBody, setSelectedBody] = useState<HeroBodyIdV588>("earth");
  const [focusBody, setFocusBody] = useState<"overview" | HeroBodyIdV588>("overview");
  const [velocityScale, setVelocityScale] = useState(1);
  const [focusedConstellation, setFocusedConstellation] = useState("");
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [payloadStable, setPayloadStable] = useState(true);
  const [sceneMounted, setSceneMounted] = useState(true);
  const [releaseCycles, setReleaseCycles] = useState(0);
  const [exposureStress, setExposureStress] = useState(false);
  const [browserAuditVisible, setBrowserAuditVisible] = useState(false);
  const payloadRef = useRef(V588_SCIENTIFIC_PAYLOAD_REFERENCE_SHA256);
  const resourceBaselineRef = useRef(getAtlasResourceSnapshot());
  const variant = useViewportVariantV588();
  useFrameTelemetryV588(rootRef, canvasReady, `${mode}:${focusBody}:${variant}`);

  const switchMode = useCallback((next: VisualRestorationModeV588) => {
    const before = payloadRef.current;
    setMode(next);
    queueMicrotask(() => setPayloadStable(before === payloadRef.current));
  }, []);
  const clampedVelocity = useCallback((value: number) => {
    setVelocityScale(Math.max(0.65, Math.min(1.5, value)));
  }, []);
  const selectedOrbit = HERO_ORBIT_BY_ID_V588[selectedBody];
  const predicted = useMemo(() => predictedOrbitV588(selectedOrbit, velocityScale), [selectedOrbit, velocityScale]);
  const requiredTextureCount = focusBody === "overview"
    ? 17
    : HERO_ORBIT_BY_ID_V588[focusBody].assetIds.length + 1;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const baseline = resourceBaselineRef.current;
    root.dataset.atlasV588ResourceBaselineTotal = String(baseline.total);
    root.dataset.atlasV588ResourceBaselineTextures = String(baseline.textures);
    root.dataset.atlasV588ResourceBaselineTargets = String(baseline.gpuRenderTargets);
  }, []);

  useEffect(() => {
    setBrowserAuditVisible(new URLSearchParams(window.location.search).get("visualAudit") === "1");
    const release = () => {
      const root = rootRef.current;
      if (root) root.dataset.atlasV588ResourceReleaseStatus = "requested";
      setReleaseCycles((value) => value + 1);
      setSceneMounted(false);
    };
    const restore = () => {
      const root = rootRef.current;
      if (root) root.dataset.atlasV588ResourceReleaseStatus = "restoring";
      setSceneMounted(true);
    };
    window.addEventListener("atlas:v588-release-scene", release);
    window.addEventListener("atlas:v588-restore-scene", restore);
    return () => {
      window.removeEventListener("atlas:v588-release-scene", release);
      window.removeEventListener("atlas:v588-restore-scene", restore);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative h-[100dvh] min-h-[620px] w-full overflow-hidden bg-[#010205] font-mono text-white"
      data-atlas-browser-acceptance-version="v588-visual-restoration-browser-acceptance"
      data-atlas-v588-candidate="visual-restoration-additive"
      data-atlas-v588-formal-product-pointer={V588_FORMAL_PRODUCT_POINTER}
      data-atlas-v588-mode={mode}
      data-atlas-v588-variant={variant}
      data-atlas-v588-selected-body={selectedBody}
      data-atlas-v588-focus-body={focusBody}
      data-atlas-v588-canvas-ready={canvasReady ? "true" : "false"}
      data-atlas-v588-canvas-count="1"
      data-atlas-v588-asset-manifest-sha={VISUAL_RESTORATION_MANIFEST_SHA256_V588}
      data-atlas-v588-asset-admission="loading"
      data-atlas-v588-required-texture-count={requiredTextureCount}
      data-atlas-v588-hero-procedural-fallback="false"
      data-atlas-v588-default-constellations={variant === "mobile" ? "8" : "12"}
      data-atlas-v588-orbit-landmarks="periapsis-apoapsis-ascending-node-descending-node"
      data-atlas-v588-orbit-prediction="velocity-verlet-presentation-only"
      data-atlas-v588-orbit-prediction-writeback="false"
      data-atlas-v588-scientific-payload-sha={payloadRef.current}
      data-atlas-v588-payload-stable={payloadStable ? "true" : "false"}
      data-atlas-v588-cinematic-writeback="false"
      data-atlas-v588-historical-evidence-rewritten="false"
      data-atlas-v588-scene-mounted={sceneMounted ? "true" : "false"}
      data-atlas-v588-resource-release-protocol="live-canvas-scene-unmount-v1"
      data-atlas-v588-resource-release-status={sceneMounted ? "armed" : "draining"}
      data-atlas-v588-resource-release-cycles={releaseCycles}
      data-atlas-v588-exposure-profile={exposureStress ? "extreme-presentation-stress" : "nominal"}
      data-atlas-v588-exposure-writeback="false"
      data-atlas-v588-browser-audit-visible={browserAuditVisible ? "true" : "false"}
    >
      <div className={`absolute inset-y-0 left-0 right-0 transition-[right] duration-300 ${inspectorOpen ? "lg:right-[292px]" : ""}`} data-atlas-v588-single-canvas-stage>
        <UniverseCanvas
          observationProfile={{
            sceneMode: "kerr",
            mode,
            visualEnhance: variant === "desktop",
            qualityTier: variant === "mobile" ? "mobile-safe" : "balanced",
            onCanvasReady: () => setCanvasReady(true),
          }}
          sceneOverride={(
            <>
              <VisualRestorationReleaseProbeV588
                active={sceneMounted}
                baseline={resourceBaselineRef.current}
              />
              {sceneMounted ? (
                <VisualRestorationStageV588
                  mode={mode}
                  variant={variant}
                  exposureStress={exposureStress}
                  selectedBody={selectedBody}
                  focusBody={focusBody}
                  velocityScale={velocityScale}
                  focusedConstellation={focusedConstellation}
                  onSelectBody={setSelectedBody}
                  onVelocityScale={clampedVelocity}
                />
              ) : null}
            </>
          )}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_44%,transparent_0%,transparent_46%,rgba(0,0,0,.22)_76%,rgba(0,0,0,.58)_100%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-black/65 to-transparent" aria-hidden="true" />

      <header className="pointer-events-auto absolute inset-x-0 top-0 z-40 flex h-12 items-center border-b border-white/10 bg-black/25 px-3 backdrop-blur-md sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-white/18 text-white/65"><Orbit className="h-3.5 w-3.5" aria-hidden="true" /></span>
          <div className="min-w-0">
            <div className="truncate text-[9px] uppercase tracking-[.28em] text-white/78">Orbit Atlas</div>
            <div className="truncate text-[7px] uppercase tracking-[.2em] text-[#e8c891]/55">Visual restoration / v588</div>
          </div>
        </div>
        <div className="ml-4 flex h-full items-stretch border-x border-white/8 sm:ml-8">
          <ModeButton active={mode === "science"} label="Science" onClick={() => switchMode("science")} />
          <ModeButton active={mode === "cinematic"} label="Cinematic" onClick={() => switchMode("cinematic")} />
        </div>
        <div className="ml-auto hidden items-center gap-6 text-[7px] uppercase tracking-[.18em] text-white/30 sm:flex">
          <span>Sky <strong className="ml-1 font-normal text-white/58">V9 / 8K</strong></span>
          <span>Geometry <strong className="ml-1 font-normal text-white/58">Shared</strong></span>
          <span>Authority <strong className="ml-1 font-normal text-[#e8c891]/75">Candidate</strong></span>
        </div>
        {!inspectorOpen ? (
          <button type="button" onClick={() => setInspectorOpen(true)} className="ml-3 rounded p-2 text-white/38 hover:bg-white/5 hover:text-white/75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/60" aria-label="Open orbit inspector">
            <PanelRightOpen className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </header>

      <BodyRail selectedBody={selectedBody} focusBody={focusBody} onSelect={setSelectedBody} onFocus={setFocusBody} />

      <div className="pointer-events-none absolute left-4 top-20 z-20 hidden max-w-[360px] md:block">
        <div className="border-l border-[#e7ca98]/55 pl-4">
          <div className="text-[8px] uppercase tracking-[.24em] text-white/35">Selected orbit</div>
          <h1 className="mt-2 font-[family-name:var(--font-atlas-display,Georgia,serif)] text-5xl font-light tracking-[-.04em] text-[#f2e3cc]">{selectedOrbit.name}</h1>
          <p className="mt-1 text-[8px] uppercase tracking-[.18em] text-white/38">{selectedOrbit.subtitle}</p>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-5 text-[7px] uppercase tracking-[.16em] text-white/30">
          <span>Period<strong className="mt-1 block text-[10px] font-normal tracking-[.08em] text-white/62">{selectedOrbit.periodLabel}</strong></span>
          <span>Pred. e<strong className="mt-1 block text-[10px] font-normal tracking-[.08em] text-[#f2d29c]">{predicted.eccentricity.toFixed(3)}</strong></span>
          <span>Velocity<strong className="mt-1 block text-[10px] font-normal tracking-[.08em] text-white/62">{velocityScale.toFixed(2)}×</strong></span>
        </div>
      </div>

      {inspectorOpen ? (
        <OrbitInspector
          selectedBody={selectedBody}
          velocityScale={velocityScale}
          focusedConstellation={focusedConstellation}
          onConstellation={setFocusedConstellation}
          onReset={() => setVelocityScale(1)}
          onClose={() => setInspectorOpen(false)}
        />
      ) : null}

      <div className={`pointer-events-auto absolute bottom-0 left-0 right-0 z-30 hidden h-[92px] border-t border-white/10 bg-[#020507]/[.84] backdrop-blur-xl md:block ${inspectorOpen ? "lg:right-[292px]" : ""}`}>
        <div className="grid h-full grid-cols-[170px_1fr_168px] items-center gap-5 px-5">
          <div className="border-r border-white/10 pr-5">
            <div className="flex items-center gap-2 text-[8px] uppercase tracking-[.2em] text-white/46"><Gauge className="h-3.5 w-3.5" aria-hidden="true" />Velocity forecast</div>
            <p className="mt-2 text-[7px] uppercase tracking-[.12em] text-white/24">Drag the 3D handle or use the rail</p>
          </div>
          <div>
            <div className="flex items-center justify-between text-[7px] uppercase tracking-[.16em] text-white/32"><span>0.65× / transfer</span><span className="text-[#f0d29e]/75">{velocityScale.toFixed(2)}×</span><span>1.50× / escape</span></div>
            <label className="sr-only" htmlFor="v588-velocity-slider">Predicted orbit velocity scale</label>
            <input
              id="v588-velocity-slider"
              name="v588-velocity-scale"
              type="range"
              min="0.65"
              max="1.5"
              step="0.01"
              value={velocityScale}
              onInput={(event) => clampedVelocity(Number(event.currentTarget.value))}
              onChange={(event) => clampedVelocity(Number(event.currentTarget.value))}
              className="mt-3 h-1 w-full cursor-ew-resize accent-[#e8c88e]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setFocusBody("overview")} className="flex h-10 items-center justify-center gap-2 border border-white/12 text-[7px] uppercase tracking-[.15em] text-white/48 hover:border-white/25 hover:text-white/78 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/60"><Aperture className="h-3 w-3" aria-hidden="true" />Overview</button>
            <button type="button" onClick={() => setFocusBody(selectedBody)} className="flex h-10 items-center justify-center gap-2 border border-white/12 text-[7px] uppercase tracking-[.15em] text-white/48 hover:border-white/25 hover:text-white/78 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/60"><Crosshair className="h-3 w-3" aria-hidden="true" />Close-up</button>
          </div>
        </div>
      </div>

      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-40 md:hidden">
        <div className="mx-2 mb-2 overflow-hidden rounded-xl border border-white/12 bg-[#03070a]/90 shadow-[0_-18px_45px_rgba(0,0,0,.45)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setMobileSheetOpen((open) => !open)}
            className="flex min-h-14 w-full items-center gap-3 px-4 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-cyan-100/60"
            aria-expanded={mobileSheetOpen}
            aria-controls="v588-mobile-sheet"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selectedOrbit.accent, boxShadow: `0 0 14px ${selectedOrbit.accent}` }} />
            <span className="min-w-0 flex-1"><strong className="block truncate font-[family-name:var(--font-atlas-display,Georgia,serif)] text-lg font-normal text-[#f1dfc5]">{selectedOrbit.name}</strong><span className="block truncate text-[7px] uppercase tracking-[.15em] text-white/35">e′ {predicted.eccentricity.toFixed(3)} · v {velocityScale.toFixed(2)}× · {mode}</span></span>
            {mobileSheetOpen ? <ChevronDown className="h-4 w-4 text-white/42" aria-hidden="true" /> : <ChevronUp className="h-4 w-4 text-white/42" aria-hidden="true" />}
          </button>
          {mobileSheetOpen ? (
            <div id="v588-mobile-sheet" className="border-t border-white/10 p-3">
              <div className="grid grid-cols-4 gap-1.5">
                {HERO_ORBITS_V588.map((orbit) => (
                  <button key={orbit.id} type="button" onClick={() => { setSelectedBody(orbit.id); setFocusBody(orbit.id); }} className={`min-h-10 border px-1 text-[7px] uppercase tracking-[.1em] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/60 ${selectedBody === orbit.id ? "border-white/30 bg-white/8 text-white" : "border-white/10 text-white/40"}`}>{orbit.name}</button>
                ))}
              </div>
              <label className="mt-4 flex items-center justify-between text-[7px] uppercase tracking-[.14em] text-white/38" htmlFor="v588-mobile-velocity"><span>Forecast velocity</span><span className="text-[#f0d09b]">{velocityScale.toFixed(2)}×</span></label>
              <input id="v588-mobile-velocity" name="v588-mobile-velocity" type="range" min="0.65" max="1.5" step="0.01" value={velocityScale} onInput={(event) => clampedVelocity(Number(event.currentTarget.value))} onChange={(event) => clampedVelocity(Number(event.currentTarget.value))} className="mt-3 h-1 w-full accent-[#e8c88e]" />
              <div className="mt-4 grid grid-cols-3 gap-1.5">
                <button type="button" onClick={() => setFocusBody("overview")} className="flex min-h-10 items-center justify-center gap-1 border border-white/10 text-[7px] uppercase tracking-[.1em] text-white/48"><Aperture className="h-3 w-3" aria-hidden="true" />Overview</button>
                <button type="button" onClick={() => switchMode(mode === "science" ? "cinematic" : "science")} className="flex min-h-10 items-center justify-center gap-1 border border-white/10 text-[7px] uppercase tracking-[.1em] text-white/48"><Sparkles className="h-3 w-3" aria-hidden="true" />{mode}</button>
                <button type="button" onClick={() => setVelocityScale(1)} className="flex min-h-10 items-center justify-center gap-1 border border-white/10 text-[7px] uppercase tracking-[.1em] text-white/48"><RotateCcw className="h-3 w-3" aria-hidden="true" />Reset</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-4 hidden items-center gap-2 text-[7px] uppercase tracking-[.16em] text-white/22 xl:flex">
        <CircleDot className="h-3 w-3" aria-hidden="true" />
        <span>Manifest {shortSha(VISUAL_RESTORATION_MANIFEST_SHA256_V588)}</span>
        <span className="text-white/12">/</span>
        <span>Payload read-only {shortSha(payloadRef.current)}</span>
      </div>

      <div
        className={browserAuditVisible
          ? "pointer-events-auto fixed bottom-3 left-1/2 z-[70] flex -translate-x-1/2 gap-1 rounded border border-cyan-100/20 bg-black/90 p-1"
          : "sr-only"}
        data-atlas-v588-browser-audit-controls
      >
        <button type="button" className="min-h-8 border border-white/15 px-2 text-[7px] uppercase tracking-[.12em] text-white/60" data-atlas-v588-release-scene onClick={() => window.dispatchEvent(new Event("atlas:v588-release-scene"))}>Release v588 scene resources</button>
        <button type="button" className="min-h-8 border border-white/15 px-2 text-[7px] uppercase tracking-[.12em] text-white/60" data-atlas-v588-restore-scene onClick={() => window.dispatchEvent(new Event("atlas:v588-restore-scene"))}>Restore v588 scene resources</button>
        <button type="button" className="min-h-8 border border-white/15 px-2 text-[7px] uppercase tracking-[.12em] text-white/60" data-atlas-v588-extreme-exposure onClick={() => setExposureStress(true)}>Enable extreme presentation exposure</button>
        <button type="button" className="min-h-8 border border-white/15 px-2 text-[7px] uppercase tracking-[.12em] text-white/60" data-atlas-v588-nominal-exposure onClick={() => setExposureStress(false)}>Restore nominal presentation exposure</button>
      </div>
    </section>
  );
}
