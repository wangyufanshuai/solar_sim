"use client";

import {
  ChevronDown,
  ChevronUp,
  Crosshair,
  Database,
  Layers3,
  LockKeyhole,
  PanelRightClose,
  PanelRightOpen,
  Settings2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import {
  KERR_OBSERVATION_V587_ROOT,
  nearestKerrObservationSampleV587,
  parseKerrObservationSummaryV587,
  type KerrObservationModeV587,
  type KerrObservationSampleV587,
  type KerrObservationSummaryV587,
  type KerrObservationVariantV587,
} from "../lib/kerrObservationV587";
import UniverseCanvas from "./UniverseCanvas";
import KerrObservationStageV587 from "./KerrObservationStageV587";

type Projection = Readonly<{
  width: number;
  height: number;
  scienceRgba: ArrayBuffer;
  cinematicRgba: ArrayBuffer;
  scientificPayloadSha256: string;
  verifiedFieldSha256: readonly string[];
}>;

type WorkerResponse = Readonly<{
  requestId: string;
  status: "ready" | "error";
  variant: KerrObservationVariantV587;
  width: number;
  height: number;
  scienceRgba?: ArrayBuffer;
  cinematicRgba?: ArrayBuffer;
  scientificPayloadSha256: string;
  verifiedFieldSha256: readonly string[];
  error?: string;
}>;

const PANEL_BG = "rgba(2, 4, 6, 0.88)";

function shortSha(value: string): string {
  return `${value.slice(0, 12)}…${value.slice(-4)}`;
}

function finiteText(value: number | null, digits = 4): string {
  return value === null || !Number.isFinite(value) ? "UNAVAILABLE" : value.toFixed(digits);
}

function percent(value: number, total: number): string {
  return total > 0 ? `${(value / total * 100).toFixed(1)}%` : "0.0%";
}

function useViewportVariantV587(): KerrObservationVariantV587 {
  const [variant, setVariant] = useState<KerrObservationVariantV587>("desktop");
  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const publish = () => setVariant(query.matches ? "mobile" : "desktop");
    publish();
    query.addEventListener("change", publish);
    return () => query.removeEventListener("change", publish);
  }, []);
  return variant;
}

function useFrameTelemetryV587(rootRef: React.RefObject<HTMLElement | null>, ready: boolean) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !ready) return;
    const samples: number[] = [];
    let previous = performance.now();
    let frame = 0;
    let animation = 0;
    root.dataset.atlasV587PerformanceStatus = "sampling";
    const publish = () => {
      const sorted = samples.toSorted((left, right) => left - right);
      const median = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
      const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
      root.dataset.atlasV587FrameSamples = String(samples.length);
      root.dataset.atlasV587MedianFps = median > 0 ? (1000 / median).toFixed(1) : "0.0";
      root.dataset.atlasV587FrameP95Ms = p95.toFixed(2);
      root.dataset.atlasV587PerformanceStatus = samples.length >= 241 ? "ready" : "sampling";
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
  }, [ready, rootRef]);
}

function ClassificationRows({ summary }: { summary: KerrObservationSummaryV587 }) {
  const rows = [
    ["DISK HIT", "disk_hit", "#f0b67a"],
    ["CAPTURE", "capture", "#edf5f5"],
    ["ESCAPE", "escape", "#72cbd4"],
    ["INCOMPLETE", "incomplete", "#bd83c7"],
  ] as const;
  return (
    <div className="space-y-2">
      {rows.map(([label, key, color]) => (
        <div key={key} className="grid grid-cols-[12px_1fr_auto] items-center gap-2 text-[9px] tracking-[.12em]">
          <span className="h-px w-3" style={{ backgroundColor: color }} />
          <span className="text-white/58">{label}</span>
          <span className="text-white/82">{percent(summary.counts.classification[key], summary.counts.rayCount)}</span>
        </div>
      ))}
    </div>
  );
}

function AuthorityLedger({ summary }: { summary: KerrObservationSummaryV587 }) {
  return (
    <div className="space-y-1 text-[8px] tracking-[.08em]">
      <div className="flex items-center justify-between"><span className="text-white/38">CPU FLOAT64</span><span className="text-amber-200/85">{summary.authority.geometryReferenceGranted ? "REFERENCE" : "CANDIDATE"}</span></div>
      <div className="flex items-center justify-between"><span className="text-white/38">POLARIZATION</span><span className="text-amber-200/85">{summary.authority.polarizationTransportReferenceGranted ? "REFERENCE" : "CANDIDATE"}</span></div>
      <div className="flex items-center justify-between"><span className="text-white/38">KS ORACLE</span><span className="text-amber-200/85">{summary.benchmarks.kerrSchildOracle.executedRayCount} / {summary.benchmarks.kerrSchildOracle.requiredRayCount}</span></div>
      <div className="flex items-center justify-between"><span className="text-white/38">QUADTREE</span><span className="text-amber-200/85">{summary.counts.unresolvedCellCount} UNRES. · {summary.counts.projectionMaskedCellCount} MASK</span></div>
      <div className="flex items-center justify-between"><span className="text-white/38">MEASURED</span><span className="text-amber-200/85">OFF</span></div>
      <div className="flex items-center justify-between"><span className="text-white/38">PAYLOAD</span><span className="text-white/78">READ-ONLY</span></div>
    </div>
  );
}

function InspectorContent({
  summary,
  selected,
}: {
  summary: KerrObservationSummaryV587;
  selected: KerrObservationSampleV587;
}) {
  return (
    <>
      <div className="border-b border-white/10 px-5 py-3">
        <div className="text-[9px] uppercase tracking-[.24em] text-white/46">Ray classification</div>
        <div className="mt-2.5"><ClassificationRows summary={summary} /></div>
      </div>
      <div className="grid grid-cols-2 border-b border-white/10 text-[9px]">
        <div className="border-r border-white/10 px-5 py-2.5">
          <div className="uppercase tracking-[.18em] text-white/32">selected</div>
          <div className="mt-2 text-[13px] tracking-[.08em] text-[#f4ddbf]">{selected.classification.toUpperCase().replace("_", " ")}</div>
        </div>
        <div className="px-5 py-2.5 text-right">
          <div className="uppercase tracking-[.18em] text-white/32">ray</div>
          <div className="mt-2 text-[13px] text-white/78">#{selected.rayIndex.toString().padStart(4, "0")}</div>
        </div>
      </div>
      <dl className="divide-y divide-white/10 px-5">
        <div className="py-2.5"><dt className="text-[8px] uppercase tracking-[.18em] text-white/30">Redshift g = νobs / νemit</dt><dd className="mt-1 text-[17px] font-light text-white/78">{finiteText(selected.redshiftFactor, 6)}</dd></div>
        <div className="py-2.5"><dt className="text-[8px] uppercase tracking-[.18em] text-white/30">Relative time delay</dt><dd className="mt-1 text-[17px] font-light text-white/78">{finiteText(selected.relativeDelayM, 3)} <span className="text-[9px] text-white/30">M</span></dd></div>
        <div className="py-2.5"><dt className="text-[8px] uppercase tracking-[.18em] text-white/30">Reference EVPA</dt><dd className="mt-1 text-[17px] font-light text-white/78">{selected.evpaRad === null ? "UNAVAILABLE" : `${(selected.evpaRad * 180 / Math.PI).toFixed(2)}°`}</dd></div>
        <div className="py-2.5"><dt className="text-[8px] uppercase tracking-[.18em] text-white/30">Invariant residuals</dt><dd className="mt-1 space-y-0.5 text-[8px] text-white/58"><div>H {summary.benchmarks.maxNormalizedHamiltonian.toExponential(2)}</div><div>Q {summary.benchmarks.maxRelativeCarterDrift.toExponential(2)}</div><div>WP {summary.benchmarks.maxWalkerPenroseReconstructionResidual.toExponential(2)}</div></dd></div>
      </dl>
      <div className="border-t border-white/10 px-5 py-2.5">
        <div className="text-[9px] uppercase tracking-[.22em] text-white/42">Authority</div>
        <div className="mt-2"><AuthorityLedger summary={summary} /></div>
      </div>
    </>
  );
}

export default function OrbitAtlasKerrObservatoryV587() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pendingPointerRef = useRef<{ alphaM: number; betaM: number; x: number; y: number } | null>(null);
  const pointerFrameRef = useRef(0);
  const [summary, setSummary] = useState<KerrObservationSummaryV587 | null>(null);
  const [projection, setProjection] = useState<Projection | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "blocked">("loading");
  const [blockedReason, setBlockedReason] = useState("none");
  const [mode, setMode] = useState<KerrObservationModeV587>("science");
  const [selected, setSelected] = useState<KerrObservationSampleV587 | null>(null);
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showPolarization, setShowPolarization] = useState(true);
  const [cinematicGain, setCinematicGain] = useState(1);
  const [canvasReady, setCanvasReady] = useState(false);
  const [payloadStable, setPayloadStable] = useState(true);
  const scientificPayloadRef = useRef<string | null>(null);
  const variant = useViewportVariantV587();
  const ready = status === "ready" && summary !== null && projection !== null;
  useFrameTelemetryV587(rootRef, ready && canvasReady);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setBlockedReason("none");
    void fetch(`${KERR_OBSERVATION_V587_ROOT}/observation-summary.json`, {
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error(`v587-summary-fetch:${response.status}`);
      return parseKerrObservationSummaryV587(await response.json());
    }).then((value) => {
      if (controller.signal.aborted) return;
      scientificPayloadRef.current = value.authorityReference;
      setSummary(value);
      setSelected(value.samples.find((sample) => sample.classification === "disk_hit") ?? value.samples[0]!);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setBlockedReason(error instanceof Error ? error.message : "v587-summary-unknown");
        setStatus("blocked");
      }
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!summary) return;
    setProjection(null);
    setStatus("loading");
    const worker = new Worker(
      new URL("../workers/kerrObservationProjectionV587.worker.ts", import.meta.url),
      { name: `orbit-atlas-kerr-observation-v587-${variant}` },
    );
    const releaseWorker = acquireAtlasResource("worker", "kerr", `kerr-observation-v587-${variant}`, {
      owner: "v587-observation-projection",
    });
    const requestId = `v587-${variant}-${summary.summarySha256.slice(0, 12)}`;
    let disposed = false;
    let workerReleased = false;
    const releaseWorkerOnce = () => {
      if (workerReleased) return;
      workerReleased = true;
      worker.terminate();
      releaseWorker();
    };
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (disposed || event.data.requestId !== requestId) return;
      const response = event.data;
      releaseWorkerOnce();
      if (
        response.status !== "ready"
        || !response.scienceRgba
        || !response.cinematicRgba
        || response.scientificPayloadSha256 !== summary.authorityReference
        || response.verifiedFieldSha256.length !== 5
      ) {
        setBlockedReason(response.error ?? `v587-worker-response:${response.status}`);
        setStatus("blocked");
        return;
      }
      setProjection({
        width: response.width,
        height: response.height,
        scienceRgba: response.scienceRgba,
        cinematicRgba: response.cinematicRgba,
        scientificPayloadSha256: response.scientificPayloadSha256,
        verifiedFieldSha256: response.verifiedFieldSha256,
      });
      setStatus("ready");
    };
    worker.onerror = (event) => {
      if (!disposed) {
        setBlockedReason(event.message || "v587-worker-runtime");
        setStatus("blocked");
      }
      releaseWorkerOnce();
    };
    worker.postMessage({
      requestId,
      root: KERR_OBSERVATION_V587_ROOT,
      variant,
      fields: summary.fields,
      scientificPayloadSha256: summary.authorityReference,
    });
    return () => {
      disposed = true;
      releaseWorkerOnce();
    };
  }, [summary, variant]);

  const switchMode = useCallback((next: KerrObservationModeV587) => {
    const before = scientificPayloadRef.current;
    setMode(next);
    queueMicrotask(() => setPayloadStable(before !== null && before === scientificPayloadRef.current));
  }, []);

  const selectAtPointer = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!summary) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    const alphaM = Number(summary.camera.alphaMinM) + x * (
      Number(summary.camera.alphaMaxM) - Number(summary.camera.alphaMinM)
    );
    const betaM = Number(summary.camera.betaMaxM) - y * (
      Number(summary.camera.betaMaxM) - Number(summary.camera.betaMinM)
    );
    pendingPointerRef.current = { alphaM, betaM, x: x * 100, y: y * 100 };
    if (pointerFrameRef.current !== 0) return;
    pointerFrameRef.current = requestAnimationFrame(() => {
      pointerFrameRef.current = 0;
      const pending = pendingPointerRef.current;
      if (!pending) return;
      setSelected(nearestKerrObservationSampleV587(summary, pending.alphaM, pending.betaM));
      setPointer({ x: pending.x, y: pending.y });
    });
  }, [summary]);

  useEffect(() => () => {
    if (pointerFrameRef.current) cancelAnimationFrame(pointerFrameRef.current);
  }, []);

  const scene = useMemo(() => ready ? (
    <KerrObservationStageV587
      mode={mode}
      summary={summary}
      projection={projection}
      showPolarization={showPolarization}
      cinematicGain={cinematicGain}
      variant={variant}
    />
  ) : null, [cinematicGain, mode, projection, ready, showPolarization, summary, variant]);
  const canvasProfile = useMemo(() => ({
    sceneMode: "kerr" as const,
    mode,
    visualEnhance: variant === "desktop",
    qualityTier: variant === "mobile" ? "mobile-safe" as const : "balanced" as const,
    onCanvasReady: () => setCanvasReady(true),
  }), [mode, variant]);

  return (
    <section
      ref={rootRef}
      className="relative h-[100dvh] min-h-[640px] w-full overflow-hidden bg-[#010204] text-[#dfe7e7]"
      style={{ fontFamily: "var(--font-science-mono), monospace" }}
      data-atlas-v587-observatory
      data-atlas-browser-acceptance-version="v587-postbuild-browser-acceptance"
      data-atlas-v587-status={status}
      data-atlas-v587-blocked-reason={blockedReason}
      data-atlas-v587-mode={mode}
      data-atlas-v587-variant={variant}
      data-atlas-v587-canvas-count="1"
      data-atlas-v587-shared-scientific-geometry="true"
      data-atlas-v587-science-linear={mode === "science"}
      data-atlas-v587-cinematic-writeback="false"
      data-atlas-v587-payload-stable={payloadStable}
      data-atlas-v587-measured-authority="false"
      data-atlas-v587-radiative-transfer="false"
      data-atlas-v587-formal-product-pointer="v263"
      data-atlas-v587-scientific-payload-sha={summary?.authorityReference ?? "unavailable"}
      data-atlas-v587-summary-sha={summary?.summarySha256 ?? "unavailable"}
    >
      <header className="absolute inset-x-0 top-0 z-40 flex h-[54px] items-center border-b border-white/10 bg-[#020304]/92 px-4 lg:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Crosshair aria-hidden className="h-5 w-5 text-[#cbd6d6]" strokeWidth={1.2} />
          <div className="truncate text-[11px] uppercase tracking-[.24em] text-white/82">Kerr Observatory</div>
          <span className="h-1 w-1 rounded-full bg-cyan-300/70" />
        </div>
        <nav className="ml-8 hidden h-full items-center gap-6 lg:flex" aria-label="Display mode">
          {(["science", "cinematic"] as const).map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => switchMode(candidate)}
              aria-pressed={mode === candidate}
              className={`relative h-full text-[9px] uppercase tracking-[.18em] transition-colors ${mode === candidate ? "text-[#f0dfc7]" : "text-white/38 hover:text-white/70"}`}
            >
              {candidate}
              {mode === candidate ? <span className="absolute inset-x-0 bottom-0 h-px bg-[#efddc6]" /> : null}
            </button>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-8 lg:flex">
          <div className="text-[10px] text-[#f0dfc7]">a/M&nbsp; {summary?.spin ?? "—"}</div>
          <div className="grid grid-cols-4 gap-7 text-center text-[7px] uppercase tracking-[.12em] text-white/32">
            <div><div>Target</div><div className="mt-1 text-[9px] text-white/70">M87* ref</div></div>
            <div><div>Inclination</div><div className="mt-1 text-[9px] text-white/70">{summary?.observer.inclinationDeg ?? "—"}°</div></div>
            <div><div>Frame</div><div className="mt-1 text-[9px] text-white/70">ZAMO</div></div>
            <div><div>Distance</div><div className="mt-1 text-[9px] text-white/70">{summary?.observer.radiusM ?? "—"} M</div></div>
          </div>
          <span className="rounded bg-white/10 px-2 py-1 text-[8px] text-white/72">v587</span>
          <button type="button" aria-label="Observatory settings" onClick={() => setSettingsOpen((value) => !value)} className="text-white/42 hover:text-white/85"><Settings2 className="h-4 w-4" strokeWidth={1.3} /></button>
        </div>
        <button type="button" className="ml-auto lg:hidden" aria-label="Open inspector" onClick={() => setMobileInspectorOpen(true)}><Layers3 className="h-5 w-5 text-white/65" strokeWidth={1.3} /></button>
      </header>

      <div className={`absolute inset-x-0 bottom-[116px] top-[54px] z-0 transition-[right] duration-300 lg:bottom-[146px] ${inspectorOpen ? "lg:right-[238px]" : "lg:right-0"}`}>
        <div ref={stageRef} className="relative h-full w-full" style={{ filter: mode === "cinematic" ? `brightness(${cinematicGain})` : undefined }}>
          {scene ? <UniverseCanvas sceneOverride={scene} observationProfile={canvasProfile} /> : null}
          {status === "loading" ? <div className="absolute inset-0 grid place-items-center bg-[#010204] text-[9px] uppercase tracking-[.24em] text-white/42">Binding verified observation fields…</div> : null}
          {status === "blocked" ? <div className="absolute inset-0 grid place-items-center bg-[#010204] px-8 text-center text-[10px] uppercase tracking-[.18em] text-rose-200/72">Artifact verification failed · scientific scene remains unavailable</div> : null}
          {ready ? (
            <div className="absolute inset-0 z-20 cursor-crosshair" onPointerMove={selectAtPointer} onPointerDown={selectAtPointer} aria-label="Kerr image plane selector">
              <Crosshair aria-hidden className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-cyan-100/70 drop-shadow-[0_0_5px_rgba(120,235,240,.55)]" style={{ left: `${pointer.x}%`, top: `${pointer.y}%` }} strokeWidth={1} />
            </div>
          ) : null}
        </div>
      </div>

      <aside className="pointer-events-none absolute left-0 top-[54px] z-30 hidden w-[250px] px-6 py-8 lg:block">
        <div className="border-l border-white/12 pl-6">
          <div className="text-[42px] leading-none tracking-[-.04em] text-[#f2d4ad]" style={{ fontFamily: "Georgia, serif" }}>M87*</div>
          <div className="mt-4 text-[15px] uppercase tracking-[.18em] text-white/82">Kerr black hole</div>
          <div className="mt-2 text-[8px] uppercase tracking-[.32em] text-white/28">Vacuum reference geometry</div>
        </div>
        <div className="mt-10 text-[8px] uppercase tracking-[.18em] text-white/34">Image plane</div>
        <div className="mt-2 text-[10px] text-white/67">α, β&nbsp; [M]</div>
        <div className="mt-5 space-y-2 text-[8px] text-white/38">
          <div className="flex justify-between"><span>α range</span><span>{summary ? `${summary.camera.alphaMinM} … ${summary.camera.alphaMaxM}` : "—"}</span></div>
          <div className="flex justify-between"><span>β range</span><span>{summary ? `${summary.camera.betaMinM} … ${summary.camera.betaMaxM}` : "—"}</span></div>
          <div className="flex justify-between"><span>samples</span><span>{summary?.counts.rayCount ?? "—"}</span></div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-4">
          <div className="text-[8px] uppercase tracking-[.18em] text-white/32">Critical geometry</div>
          <div className="mt-2 text-[24px] font-light text-[#e9d2b5]">r<span className="align-super text-[11px]">ISCO</span></div>
          <div className="mt-1 text-[9px] text-white/50">{summary?.samples.find((sample) => sample.classification === "disk_hit") ? "sparse candidate" : "unavailable"}</div>
          <div className="mt-1 text-[8px] text-amber-100/48">{summary ? `${summary.counts.unresolvedCellCount} unresolved · ${summary.counts.projectionMaskedCellCount} projection-masked` : ""}</div>
        </div>
      </aside>

      <aside className={`absolute bottom-[146px] right-0 top-[54px] z-30 hidden w-[238px] border-l border-white/10 transition-transform duration-300 lg:flex lg:flex-col ${inspectorOpen ? "translate-x-0" : "translate-x-full"}`} style={{ background: PANEL_BG }}>
        <div className="flex h-[46px] items-center justify-between border-b border-white/10 px-5">
          <span className="text-[9px] uppercase tracking-[.2em] text-white/56">Inspector</span>
          <button type="button" aria-label="Close inspector" onClick={() => setInspectorOpen(false)} className="text-white/35 hover:text-white/75"><PanelRightClose className="h-4 w-4" strokeWidth={1.2} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{summary && selected ? <InspectorContent summary={summary} selected={selected} /> : null}</div>
      </aside>
      {!inspectorOpen ? <button type="button" aria-label="Open inspector" onClick={() => setInspectorOpen(true)} className="absolute right-3 top-[70px] z-30 hidden border border-white/12 bg-black/50 p-2 text-white/52 hover:text-white lg:block"><PanelRightOpen className="h-4 w-4" strokeWidth={1.2} /></button> : null}

      <div className="absolute inset-x-0 bottom-0 z-40 h-[116px] border-t border-white/10 bg-[#020304]/94 lg:h-[146px]">
        <div className="grid h-full grid-cols-[132px_minmax(0,1fr)] lg:grid-cols-[168px_minmax(0,1fr)_300px]">
          <div className="border-r border-white/10 px-4 py-4 lg:px-6">
            <div className="text-[8px] uppercase tracking-[.2em] text-white/32">Transport</div>
            <div className="mt-2 text-[13px] text-white/75">VACUUM</div>
            <div className="mt-2 text-[8px] leading-4 text-white/34">frequency independent<br />no plasma model</div>
          </div>
          <div className="min-w-0 px-4 py-4 lg:px-7">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[8px] uppercase tracking-[.2em] text-white/38">Selected ray / observables</div>
              <div className="hidden text-[8px] text-white/28 sm:block">α {selected?.alphaM.toFixed(3) ?? "—"} · β {selected?.betaM.toFixed(3) ?? "—"}</div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-px border border-white/10 bg-white/10 text-[8px] lg:grid-cols-5">
              <div className="bg-[#020304] p-2"><span className="text-white/30">CLASS</span><div className="mt-1 truncate text-[#edcfaa]">{selected?.classification ?? "—"}</div></div>
              <div className="bg-[#020304] p-2"><span className="text-white/30">g</span><div className="mt-1 text-white/72">{finiteText(selected?.redshiftFactor ?? null)}</div></div>
              <div className="bg-[#020304] p-2"><span className="text-white/30">Δt / M</span><div className="mt-1 text-white/72">{finiteText(selected?.relativeDelayM ?? null, 2)}</div></div>
              <div className="hidden bg-[#020304] p-2 lg:block"><span className="text-white/30">EVPA</span><div className="mt-1 text-white/72">{selected?.evpaRad == null ? "—" : `${(selected.evpaRad * 180 / Math.PI).toFixed(1)}°`}</div></div>
              <div className="hidden bg-[#020304] p-2 lg:block"><span className="text-white/30">AREA / M²</span><div className="mt-1 text-white/72">{selected?.sampleAreaM2.toFixed(3) ?? "—"}</div></div>
            </div>
          </div>
          <div className="hidden border-l border-white/10 px-6 py-4 lg:block">
            <div className="flex items-center gap-2 text-[8px] uppercase tracking-[.18em] text-white/42"><LockKeyhole className="h-3.5 w-3.5" strokeWidth={1.3} /> Stokes I / Q / U / V</div>
            <div className="mt-3 text-[14px] text-amber-100/70">LOCKED</div>
            <div className="mt-2 text-[8px] leading-4 text-white/32">Radiative transfer has no authority in v587. No synthetic detector values are shown.</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[116px] left-3 z-50 flex gap-1 lg:hidden">
        {(["science", "cinematic"] as const).map((candidate) => <button key={candidate} type="button" onClick={() => switchMode(candidate)} className={`border px-3 py-2 text-[8px] uppercase tracking-[.14em] ${mode === candidate ? "border-[#e8d2b5]/55 bg-[#e8d2b5]/10 text-[#f2dfc5]" : "border-white/10 bg-black/55 text-white/42"}`}>{candidate}</button>)}
      </div>

      {mobileInspectorOpen ? (
        <div className="absolute inset-x-0 bottom-0 z-[70] max-h-[72dvh] overflow-y-auto overscroll-contain border-t border-white/15 bg-[#020304] lg:hidden">
          <div className="sticky top-0 flex h-12 items-center justify-between border-b border-white/10 bg-[#020304] px-4"><span className="text-[9px] uppercase tracking-[.2em] text-white/55">Observation inspector</span><button type="button" onClick={() => setMobileInspectorOpen(false)} aria-label="Close inspector"><ChevronDown className="h-5 w-5 text-white/55" strokeWidth={1.2} /></button></div>
          {summary && selected ? <InspectorContent summary={summary} selected={selected} /> : null}
        </div>
      ) : null}

      {settingsOpen ? (
        <div className={`absolute top-[62px] z-[80] hidden w-[280px] border border-white/12 bg-[#050708] p-4 shadow-2xl lg:block ${inspectorOpen ? "right-[254px]" : "right-4"}`}>
          <div className="flex items-center justify-between"><div className="text-[9px] uppercase tracking-[.2em] text-white/55">Presentation layers</div><button type="button" onClick={() => setSettingsOpen(false)} aria-label="Close settings"><ChevronUp className="h-4 w-4 text-white/45" strokeWidth={1.2} /></button></div>
          <label className="mt-5 flex items-center justify-between text-[9px] text-white/58"><span>EVPA direction field</span><input type="checkbox" checked={showPolarization} onChange={(event) => setShowPolarization(event.target.checked)} className="accent-cyan-200" /></label>
          <label className="mt-5 block text-[9px] text-white/58"><span className="flex justify-between"><span>Cinematic exposure</span><span>{cinematicGain.toFixed(2)}</span></span><input type="range" min="0.8" max="1.35" step="0.01" value={cinematicGain} disabled={mode === "science"} onChange={(event) => setCinematicGain(Number(event.target.value))} className="mt-3 w-full accent-[#e8bd83]" /></label>
          <div className="mt-5 flex gap-2 border-t border-white/10 pt-4 text-[8px] leading-4 text-white/32"><Database className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.2} /><span>All controls are presentation-only. Science payload {summary ? shortSha(summary.authorityReference) : "unavailable"} remains immutable.</span></div>
        </div>
      ) : null}
    </section>
  );
}
