"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import type { KerrSciencePhotonBandViewV328 } from "../lib/kerrSciencePhotonBandsV328";
import {
  getKerrSciencePhotonProvenanceV331,
  serializeKerrSciencePhotonProvenanceCsvV331,
  serializeKerrSciencePhotonProvenanceJsonV331,
} from "../lib/kerrSciencePhotonProvenanceV331";
import { createKerrScienceInstrumentResponseV332 } from "../lib/kerrScienceInstrumentResponseV332";
import {
  getKerrScienceObservatorySnapshotV329,
  retainKerrScienceObservatoryV329,
  subscribeKerrScienceObservatoryV329,
} from "../lib/kerrScienceObservatoryStoreV329";
import type { KerrThinDiskBandIdV320 } from "../lib/kerrThinDiskBandImagingV320";

type BandSummary = Readonly<{
  id: KerrThinDiskBandIdV320;
  minimumPhotonRadiance: number;
  maximumPhotonRadiance: number;
  minimumMeanFrequencyHz: number;
  maximumMeanFrequencyHz: number;
}>;

function summarize(view: KerrSciencePhotonBandViewV328): readonly BandSummary[] {
  return (["visible", "euv", "soft-x-ray"] as const).map((id) => {
    const measurements = view.rays.flatMap((ray) => ray.measurements).filter((measurement) => measurement.bandId === id);
    return Object.freeze({
      id,
      minimumPhotonRadiance: Math.min(...measurements.map((measurement) => measurement.observedPhotonRadiancePerSM2Sr)),
      maximumPhotonRadiance: Math.max(...measurements.map((measurement) => measurement.observedPhotonRadiancePerSM2Sr)),
      minimumMeanFrequencyHz: Math.min(...measurements.map((measurement) => measurement.meanObservedFrequencyHz)),
      maximumMeanFrequencyHz: Math.max(...measurements.map((measurement) => measurement.meanObservedFrequencyHz)),
    });
  });
}

export default function KerrSciencePhotonBandsV328({ mode }: { readonly mode: "science" | "cinematic" }) {
  const observatory = useSyncExternalStore(
    subscribeKerrScienceObservatoryV329,
    getKerrScienceObservatorySnapshotV329,
    getKerrScienceObservatorySnapshotV329,
  );
  useEffect(() => {
    if (mode !== "science") return;
    return retainKerrScienceObservatoryV329();
  }, [mode]);
  const view = observatory.photonBands;
  const instrumentResponse = useMemo(() => view ? createKerrScienceInstrumentResponseV332(view) : null, [view]);
  const download = useCallback(async (kind: "json" | "csv") => {
    if (!view) return;
    const provenance = await getKerrSciencePhotonProvenanceV331(view);
    const content = kind === "json"
      ? serializeKerrSciencePhotonProvenanceJsonV331(provenance)
      : serializeKerrSciencePhotonProvenanceCsvV331(provenance);
    const blob = new Blob([content], { type: kind === "json" ? "application/json" : "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const release = acquireAtlasResource("object-url", "kerr", `science-photon-provenance-v331:${kind}`, {
      owner: "strong-gravity-science",
      estimatedBytes: blob.size,
      contentSha256: provenance.canonicalSha256,
    });
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `orbit-atlas-kerr-photon-observables-v331.${kind}`;
    anchor.click();
    queueMicrotask(() => { URL.revokeObjectURL(url); release(); });
  }, [view]);
  if (mode !== "science") return null;
  const bands = view ? summarize(view) : [];
  const status = view ? "ready" : observatory.status === "unavailable" ? "unavailable" : "loading";
  return (
    <div
      className="mt-2 rounded border border-emerald-100/10 bg-emerald-100/[0.018] px-2 py-1.5"
      data-kerr-science-photon-bands-v328={status}
      data-kerr-science-photon-bands-measurements={view?.counts.bandMeasurementCount ?? 0}
      data-kerr-science-photon-bands-detector-assumption="none-per-unit-area-solid-angle"
      data-kerr-science-photon-provenance-v331={view ? "export-ready" : "pending"}
      data-kerr-science-instrument-response-v332={instrumentResponse ? "synthetic-reference-ready" : "pending"}
      data-kerr-science-observatory-store-v329={observatory.status}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[8px] uppercase tracking-[0.12em] text-emerald-100/45">Photon-domain observables</div>
          <div className="mt-0.5 font-mono text-[8px] text-white/42">fixed 512/256 Simpson audit · exact SI Planck constant</div>
        </div>
        <span className="font-mono text-[7px] text-white/35">{status}</span>
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-1">
        {bands.map((band) => (
          <div key={band.id} className="rounded border border-white/5 bg-black/15 px-1.5 py-1 font-mono">
            <div className="text-[7px] uppercase text-white/35">{band.id}</div>
            <div className="mt-0.5 text-[8px] text-emerald-50/68">{band.minimumPhotonRadiance.toExponential(2)}–{band.maximumPhotonRadiance.toExponential(2)}</div>
            <div className="mt-0.5 text-[6px] text-white/25">photons s⁻¹ m⁻² sr⁻¹</div>
            <div className="mt-0.5 text-[6px] text-white/28">ν̄ {band.minimumMeanFrequencyHz.toExponential(2)}–{band.maximumMeanFrequencyHz.toExponential(2)} Hz</div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-white/5 pt-1 font-mono text-[7px] text-white/28">
        <span>{view ? `${view.counts.bandMeasurementCount}/12 measurements · Δquad ${view.maxima.photonQuadratureRelativeDifference.toExponential(2)}` : "bounded artifact pending"}</span>
        <span>per unit area/solid angle · not detector count rate</span>
      </div>
      <div className="mt-1.5 rounded border border-amber-100/10 bg-amber-100/[0.018] px-1.5 py-1 font-mono text-[7px] text-amber-50/45" data-kerr-science-instrument-response-summary-v332>
        {instrumentResponse
          ? `synthetic reference · ${instrumentResponse.model.collectingAreaM2} m² · 1 arcsec² pixel · ${instrumentResponse.model.exposureTimeS} s · max ${instrumentResponse.maxima.expectedPhotonsPerPixelExposure.toExponential(2)} photons/pixel · deterministic expectation only`
          : "synthetic reference detector response pending"}
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-white/5 pt-1.5">
        <span className="font-mono text-[7px] text-white/28">12-row sanitized photon provenance · no raw ray buffer</span>
        <div className="flex gap-1">
          <button type="button" disabled={!view} onClick={() => { void download("json"); }} className="atlas-accessible-focus rounded border border-emerald-100/15 px-1.5 py-0.5 font-mono text-[7px] text-emerald-50/65 disabled:opacity-35">JSON</button>
          <button type="button" disabled={!view} onClick={() => { void download("csv"); }} className="atlas-accessible-focus rounded border border-emerald-100/15 px-1.5 py-0.5 font-mono text-[7px] text-emerald-50/65 disabled:opacity-35">CSV</button>
        </div>
      </div>
    </div>
  );
}
