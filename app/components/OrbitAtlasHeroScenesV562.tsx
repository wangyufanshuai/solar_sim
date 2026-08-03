"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type HeroSceneId = "kerr-volume-disk" | "photon-ring-lensing" | "polarization-field" | "science-cinematic-ab";
type DisplayMode = "science" | "cinematic";

const VISUAL_MANIFEST_SHA = "a9ca1196e05c408004902cfa79af3d3fa3389e3ff17b386cd1d23bb74b3c69fd";
const SCENES: ReadonlyArray<{ id: HeroSceneId; index: string; title: string; kicker: string; metric: string; accent: string }> = [
  { id: "kerr-volume-disk", index: "01", title: "Kerr volume / accretion disk", kicker: "shared scientific geometry", metric: "a/M 0.90 · rISCO 2.32 M", accent: "#e1a56d" },
  { id: "photon-ring-lensing", index: "02", title: "Photon ring / strong lensing", kicker: "critical curve camera", metric: "shadow boundary · CPU reference", accent: "#8dd9eb" },
  { id: "polarization-field", index: "03", title: "Science polarization field", kicker: "EVPA direction map", metric: "WP ↔ independent PT", accent: "#bba8ff" },
  { id: "science-cinematic-ab", index: "04", title: "Science / cinematic A·B", kicker: "same geometry / separate grade", metric: "writeback forbidden", accent: "#b9e28e" },
];

const FIELD_LINES = Array.from({ length: 25 }, (_, index) => {
  const x = 180 + (index % 5) * 110;
  const y = 104 + Math.floor(index / 5) * 58;
  const angle = (index % 2 === 0 ? 1 : -1) * (0.18 + (index % 5) * 0.07);
  const length = 23 + (index % 3) * 5;
  return { x, y, x2: x + Math.cos(angle) * length, y2: y + Math.sin(angle) * length, angle };
});

function SharedGeometry({ scene, mode }: { scene: HeroSceneId; mode: DisplayMode }) {
  const cinematic = mode === "cinematic";
  const showField = scene === "polarization-field" || scene === "science-cinematic-ab";
  const showLensing = scene === "photon-ring-lensing" || scene === "science-cinematic-ab";
  const showDisk = scene === "kerr-volume-disk" || scene === "science-cinematic-ab";
  return (
    <svg className={`h-full w-full ${cinematic ? "v562-cinematic-grade" : "v562-science-linear"}`} viewBox="0 0 760 380" role="img" aria-label="Shared Kerr scientific geometry">
      <defs>
        <radialGradient id="v562-hole" cx="50%" cy="50%">
          <stop offset="0" stopColor="#000" />
          <stop offset="63%" stopColor="#010307" />
          <stop offset="72%" stopColor={cinematic ? "#e4a66f" : "#f7d9ab"} stopOpacity={cinematic ? "0.70" : "0.46"} />
          <stop offset="100%" stopColor="#02050a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="v562-disk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={cinematic ? "#ffb47c" : "#f6dfb4"} stopOpacity=".9" />
          <stop offset=".42" stopColor="#d77666" stopOpacity=".58" />
          <stop offset="1" stopColor="#7e5de0" stopOpacity=".16" />
        </linearGradient>
        <filter id="v562-soft-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={cinematic ? "7" : "1.5"} /></filter>
      </defs>
      <rect width="760" height="380" fill={cinematic ? "#05070c" : "#03070b"} />
      <path d="M0 300 C130 254 188 330 310 290 S574 248 760 286" fill="none" stroke="#8ad3e5" strokeOpacity=".09" strokeWidth="1" />
      <path d="M0 74 C120 126 188 54 334 100 S584 122 760 74" fill="none" stroke="#fff" strokeOpacity=".05" strokeWidth="1" />
      {showLensing ? <>
        <ellipse cx="380" cy="190" rx="180" ry="74" fill="none" stroke="#8dd9eb" strokeOpacity={cinematic ? ".12" : ".22"} strokeWidth="1" strokeDasharray="2 8" />
        <ellipse cx="380" cy="190" rx="143" ry="58" fill="none" stroke="#c7eff6" strokeOpacity={cinematic ? ".40" : ".72"} strokeWidth="1.4" />
        <ellipse cx="380" cy="190" rx="116" ry="46" fill="none" stroke="#8dd9eb" strokeOpacity={cinematic ? ".65" : ".92"} strokeWidth="1" />
      </> : null}
      {showDisk ? <>
        <ellipse cx="380" cy="190" rx="208" ry="49" transform="rotate(-9 380 190)" fill="none" stroke="url(#v562-disk)" strokeWidth={cinematic ? "17" : "11"} strokeOpacity=".18" filter={cinematic ? "url(#v562-soft-glow)" : undefined} />
        <ellipse cx="380" cy="190" rx="180" ry="37" transform="rotate(-9 380 190)" fill="none" stroke="url(#v562-disk)" strokeWidth={cinematic ? "7" : "4"} strokeOpacity=".82" />
        <ellipse cx="380" cy="190" rx="126" ry="26" transform="rotate(-9 380 190)" fill="none" stroke="#fbe7bd" strokeWidth="1.2" strokeOpacity=".70" />
      </> : null}
      <circle cx="380" cy="190" r="66" fill="url(#v562-hole)" />
      <circle cx="380" cy="190" r="45" fill="#000" stroke="#f1d0a2" strokeOpacity={cinematic ? ".35" : ".62"} strokeWidth="1.5" />
      {showField ? FIELD_LINES.map((line, index) => <line key={index} x1={line.x} y1={line.y} x2={line.x2} y2={line.y2} stroke={cinematic ? "#d8c9ff" : "#cdbaff"} strokeOpacity={cinematic ? ".34" : ".74"} strokeWidth="1" markerEnd="url(#v562-arrow)" />) : null}
      <defs><marker id="v562-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5Z" fill="#cdbaff" /></marker></defs>
      <g fill="#f7f3ea" fillOpacity={cinematic ? ".25" : ".48"}>
        {Array.from({ length: 28 }, (_, index) => <circle key={index} cx={(index * 97) % 740 + 10} cy={(index * 43) % 330 + 18} r={index % 4 === 0 ? 1.4 : .7} />)}
      </g>
      <text x="26" y="34" fill="#f2eee5" fillOpacity=".78" fontSize="10" letterSpacing="2.2">KERR / SHARED GEOMETRY</text>
      <text x="26" y="352" fill="#b8c7ce" fillOpacity=".6" fontSize="8" letterSpacing="1.3">CPU FLOAT64 · SCIENCE PAYLOAD READ-ONLY · M = 1</text>
    </svg>
  );
}

export default function OrbitAtlasHeroScenesV562() {
  const rootRef = useRef<HTMLElement>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sceneId, setSceneId] = useState<HeroSceneId>("kerr-volume-disk");
  const [mode, setMode] = useState<DisplayMode>("science");
  const scene = useMemo(() => SCENES.find((item) => item.id === sceneId) ?? SCENES[0], [sceneId]);
  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    const root = rootRef.current;
    if (!hydrated || !root) return;
    const frameDeltas: number[] = [];
    let last = performance.now();
    let frameId = 0;
    root.setAttribute("data-atlas-v562-performance-status", "sampling");
    root.setAttribute("data-atlas-v562-performance-scope", "hero-presentation");
    const publish = () => {
      const sorted = [...frameDeltas].sort((left, right) => left - right);
      const medianFrameMs = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
      const p95FrameMs = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
      root.setAttribute("data-atlas-v562-frame-samples", String(frameDeltas.length));
      root.setAttribute("data-atlas-v562-median-fps", medianFrameMs > 0 ? (1000 / medianFrameMs).toFixed(1) : "0.0");
      root.setAttribute("data-atlas-v562-frame-p95-ms", p95FrameMs.toFixed(1));
      root.setAttribute("data-atlas-v562-performance-status", frameDeltas.length >= 241 ? "ready" : "sampling");
    };
    const tick = (now: number) => {
      frameDeltas.push(Math.min(1000, now - last));
      if (frameDeltas.length > 720) frameDeltas.shift();
      last = now;
      if (frameDeltas.length % 30 === 0) publish();
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [hydrated, mode, sceneId]);
  return (
    <section
      ref={rootRef}
      className="v562-hero-scenes mt-5 overflow-hidden rounded-[26px] border border-white/10 bg-[#05080d] text-white shadow-[0_24px_90px_rgba(0,0,0,.38)]"
      data-atlas-v562-hero-scenes
      data-atlas-v562-hydrated={hydrated ? "true" : "false"}
      data-atlas-v562-scene={scene.id}
      data-atlas-v562-mode={mode}
      data-atlas-v562-shared-geometry="true"
      data-atlas-v562-canvas-count="0"
      data-atlas-v562-cinematic-writeback="false"
      data-atlas-v562-visual-manifest-sha={VISUAL_MANIFEST_SHA}
    >
      <header className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 md:flex-row md:items-end md:justify-between md:px-7">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.32em] text-[#cdbaff]/65">V562 / science-first hero scenes</div>
          <h2 className="mt-2 max-w-2xl font-serif text-[clamp(1.45rem,3vw,2.55rem)] font-light leading-[1.02] tracking-[-.025em] text-[#f3eee4]">四个镜头，同一条可复验的几何骨架。</h2>
          <p className="mt-3 max-w-2xl text-[11px] leading-5 text-white/45">The visual candidate is a product surface only. Science stays linear and read-only; Cinematic receives a fixed grade without writing back classification, redshift, EVPA, intensity, Stokes or coordinates.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[.035] p-1 font-mono text-[9px] uppercase tracking-[.14em]" role="group" aria-label="Display mode">
          {(["science", "cinematic"] as const).map((value) => <button key={value} type="button" disabled={!hydrated} onClick={() => setMode(value)} className={`rounded-full px-3 py-2 transition ${mode === value ? "bg-[#e9dcc0] text-[#14120f]" : "text-white/45 hover:text-white/80"}`} data-atlas-v562-mode-option={value}>{value}</button>)}
        </div>
      </header>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_270px]">
        <div className="relative min-h-[300px] border-b border-white/10 bg-[radial-gradient(circle_at_52%_50%,rgba(151,120,209,.10),transparent_31%),linear-gradient(125deg,#060b12,#020406)] lg:border-b-0 lg:border-r">
          <div className="absolute left-5 top-5 z-10 font-mono text-[8px] uppercase tracking-[.18em] text-white/42" data-atlas-v562-science-display={mode === "science" ? "linear" : "cinematic-grade"}>{mode === "science" ? "linear display / no post FX" : "fixed seed / cinematic grade"}</div>
          <div className="aspect-[760/380] w-full"><SharedGeometry scene={scene.id} mode={mode} /></div>
        </div>
        <aside className="flex flex-col">
          <div className="grid grid-cols-2 gap-px border-b border-white/10 bg-white/10">
            {SCENES.map((item) => <button type="button" key={item.id} disabled={!hydrated} onClick={() => setSceneId(item.id)} className={`min-h-[86px] border text-left transition ${scene.id === item.id ? "border-[#cdbaff]/50 bg-[#cdbaff]/[.10]" : "border-transparent bg-[#05080d] hover:bg-white/[.045]"}`} data-atlas-v562-hero-scene-option={item.id}><span className="block px-3 pt-3 font-mono text-[9px]" style={{ color: item.accent }}>{item.index}</span><span className="block px-3 pb-3 pt-1 text-[10px] leading-4 text-white/75">{item.title}</span></button>)}
          </div>
          <div className="flex flex-1 flex-col justify-between p-5">
            <div>
              <div className="font-mono text-[8px] uppercase tracking-[.23em] text-white/35">{scene.kicker}</div>
              <h3 className="mt-2 font-serif text-xl font-light text-[#f4eee3]">{scene.title}</h3>
              <p className="mt-3 text-[11px] leading-5 text-white/45">{scene.metric}. The overlay is a deterministic projection of the same scientific geometry; it is never an authority replacement.</p>
            </div>
            <dl className="mt-7 grid grid-cols-2 gap-px bg-white/10 text-[9px]">
              <div className="bg-[#05080d] p-3"><dt className="uppercase tracking-[.14em] text-white/32">candidate</dt><dd className="mt-1 text-[#b9e28e]">v562 / KTX2-first</dd></div>
              <div className="bg-[#05080d] p-3"><dt className="uppercase tracking-[.14em] text-white/32">authority</dt><dd className="mt-1 text-[#f0c28d]">CPU / measured off</dd></div>
              <div className="bg-[#05080d] p-3"><dt className="uppercase tracking-[.14em] text-white/32">payload</dt><dd className="mt-1 text-white/70">read-only</dd></div>
              <div className="bg-[#05080d] p-3"><dt className="uppercase tracking-[.14em] text-white/32">canvas</dt><dd className="mt-1 text-white/70">single runtime</dd></div>
            </dl>
          </div>
        </aside>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-5 py-3 font-mono text-[8px] uppercase tracking-[.13em] text-white/30 md:px-7"><span>desktop 1440×900 · mobile 390×844 · science ≥45 fps target</span><span>manifest {VISUAL_MANIFEST_SHA.slice(0, 12)}… · historical v9 immutable</span></footer>
    </section>
  );
}
