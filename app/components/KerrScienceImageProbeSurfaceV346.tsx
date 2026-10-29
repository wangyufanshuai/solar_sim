"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { publishAtlasScienceImageProbeTelemetryV346 } from "../lib/atlasScienceImageProbeTelemetryV346";
import { acquireKerrScienceImageProbeV346, type AcquiredKerrScienceImageProbeV346 } from "../lib/kerrScienceImageProbeClientV346";
import { probeKerrScienceImagePixelV346, projectClientPointToKerrSciencePlateV346, type KerrScienceImageProbeHitV346, type KerrScienceImagePixelProbeArtifactV346 } from "../lib/kerrScienceImagePixelProbeV346";
import KerrScienceImageRoiSurfaceV347 from "./KerrScienceImageRoiSurfaceV347";
import KerrScienceBandContrastSurfaceV348 from "./KerrScienceBandContrastSurfaceV348";

type LoadState = "loading" | "ready" | "error";
const BAND_LABELS = { visible: "VIS", euv: "EUV", "soft-x-ray": "SXR" } as const;
function format(value: number): string { return Math.abs(value) >= 1e5 || (Math.abs(value) > 0 && Math.abs(value) < 1e-4) ? value.toExponential(4) : value.toFixed(6); }

export default function KerrScienceImageProbeSurfaceV346({ objectUrl, bytes }: Readonly<{ objectUrl: string; bytes: number }>) {
  const acquiredRef = useRef<AcquiredKerrScienceImageProbeV346 | null>(null);
  const [artifact, setArtifact] = useState<KerrScienceImagePixelProbeArtifactV346 | null>(null);
  const [selected, setSelected] = useState<KerrScienceImageProbeHitV346 | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    void acquireKerrScienceImageProbeV346({ signal: controller.signal }).then((value) => { if (!active) { value.release(); return; } acquiredRef.current = value; setArtifact(value.artifact); setLoadState("ready"); }).catch(() => { if (active && !controller.signal.aborted) setLoadState("error"); });
    return () => { active = false; controller.abort(); acquiredRef.current?.release(); acquiredRef.current = null; publishAtlasScienceImageProbeTelemetryV346(null); };
  }, []);
  const choose = (hit: KerrScienceImageProbeHitV346 | null) => { setSelected((current) => current?.key === hit?.key ? current : hit); publishAtlasScienceImageProbeTelemetryV346(hit); };
  const inspect = (event: PointerEvent<HTMLImageElement>) => { if (!artifact) return; const point = projectClientPointToKerrSciencePlateV346(event, event.currentTarget.getBoundingClientRect()); choose(point ? probeKerrScienceImagePixelV346(artifact, ...point) : null); };
  const selectCell = (bandId: "visible" | "euv" | "soft-x-ray", rayIndex: 12 | 13 | 14 | 15) => { if (!artifact) return; const row = artifact.indexCoordinates.bandOrder.indexOf(bandId); const column = artifact.indexCoordinates.rayOrder.indexOf(rayIndex); choose(probeKerrScienceImagePixelV346(artifact, 142 + column * 266 + 125, 108 + row * 174 + 79)); };
  return <div className="relative mt-2 overflow-hidden rounded border border-cyan-100/10 bg-black/30 p-1.5" data-atlas-v346-science-image-probe data-atlas-v346-probe-status={loadState} data-atlas-v346-probe-selection={selected?.key ?? "none"}>
    <div className="relative overflow-hidden rounded"><Image unoptimized src={objectUrl} alt="Orbit Atlas v343 sparse Kerr scientific observation plate" width={1200} height={720} onPointerMove={inspect} onPointerDown={inspect} onPointerLeave={() => choose(null)} className="h-auto w-full touch-none object-contain" />
      {selected ? <div aria-hidden="true" className="pointer-events-none absolute border border-cyan-100/90 bg-cyan-100/[0.05] shadow-[0_0_18px_rgba(103,232,249,0.22)]" style={{ left: `${(selected.cardBounds.x / 1200) * 100}%`, top: `${(selected.cardBounds.y / 720) * 100}%`, width: `${(selected.cardBounds.width / 1200) * 100}%`, height: `${(selected.cardBounds.height / 720) * 100}%` }} /> : null}
    </div>
    <div className="mt-1.5 grid grid-cols-4 gap-1" aria-label="Scientific image indexed probe cells">{(["visible", "euv", "soft-x-ray"] as const).flatMap((band) => ([12, 13, 14, 15] as const).map((ray) => <button key={`${band}:${ray}`} type="button" disabled={!artifact} onClick={() => selectCell(band, ray)} className={selected?.key === `${band}:${ray}` ? "atlas-accessible-focus rounded border border-cyan-100/35 bg-cyan-100/[0.12] px-1 py-1 text-[7px] text-cyan-50" : "atlas-accessible-focus rounded border border-white/[0.07] px-1 py-1 text-[7px] text-white/42 disabled:opacity-30"}>{BAND_LABELS[band]} · R{ray}</button>))}</div>
    {selected ? <div className="mt-1.5 grid gap-1 rounded border border-cyan-100/10 bg-cyan-100/[0.025] p-2 text-[7px] text-white/46 sm:grid-cols-4" aria-live="polite"><div><span className="text-white/28">Index</span><br /><span className="text-cyan-50/82">array [{selected.arrayIndex.join(", ")}]</span><br />FITS ({selected.fitsPixel.join(", ")})</div><div><span className="text-white/28">Radiance</span><br /><span className="text-cyan-50/82">{format(selected.cell.observedEnergyRadianceWM2Sr)}</span><br />W m⁻² sr⁻¹</div><div><span className="text-white/28">Relativity</span><br />g {format(selected.cell.redshiftFactor)}<br />EVPA {selected.cell.walkerPenroseEvpaDeg.toFixed(4)}°</div><div><span className="text-white/28">Uncertainty</span><br />u/I {format(selected.cell.conservativeLinearRelativeEnvelope)}<br />ΔEVPA {format(selected.cell.evpaDifferenceDeg)}°</div></div> : <div className="mt-1.5 rounded border border-white/[0.06] px-2 py-1 text-[7px] text-white/32">{loadState === "loading" ? "Loading verified 12-cell probe after preview intent…" : loadState === "error" ? "Probe integrity validation failed closed." : "Hover, tap, or use the indexed buttons to inspect a scientific cell."}</div>}
    {artifact ? <KerrScienceImageRoiSurfaceV347 artifact={artifact} /> : null}
    {artifact ? <KerrScienceBandContrastSurfaceV348 /> : null}
    <div className="mt-1 flex flex-wrap justify-between gap-1 px-1 text-[7px] text-white/32"><span>verified object URL · {bytes} bytes</span><span>index coordinates only · celestial WCS unavailable · dense 0/49</span></div>
  </div>;
}
