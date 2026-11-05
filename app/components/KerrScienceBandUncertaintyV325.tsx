"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import {
  serializeKerrScienceBandUncertaintyProvenanceCsvV326,
  serializeKerrScienceBandUncertaintyProvenanceJsonV326,
} from "../lib/kerrScienceBandUncertaintyProvenanceV326";
import {
  getKerrScienceObservatorySnapshotV329,
  retainKerrScienceObservatoryV329,
  subscribeKerrScienceObservatoryV329,
} from "../lib/kerrScienceObservatoryStoreV329";

type DisplaySummary = Readonly<{
  status: "ready" | "loading" | "unavailable";
  bandMeasurementCount: number;
  maximumRelativeEnvelope: number | null;
  maximumBandQuadrature: number | null;
  maximumDiskQuadrature: number | null;
  maximumFormulaDifference: number | null;
  maximumRedshiftPerturbation: number | null;
  maximumRadiusDifferenceM: number | null;
  sourceSha256: string | null;
}>;

const INITIAL: DisplaySummary = Object.freeze({
  status: "loading",
  bandMeasurementCount: 0,
  maximumRelativeEnvelope: null,
  maximumBandQuadrature: null,
  maximumDiskQuadrature: null,
  maximumFormulaDifference: null,
  maximumRedshiftPerturbation: null,
  maximumRadiusDifferenceM: null,
  sourceSha256: null,
});

function scientific(value: number | null): string {
  return value == null ? "unavailable" : value.toExponential(2);
}

export default function KerrScienceBandUncertaintyV325({ mode }: { readonly mode: "science" | "cinematic" }) {
  const observatory = useSyncExternalStore(
    subscribeKerrScienceObservatoryV329,
    getKerrScienceObservatorySnapshotV329,
    getKerrScienceObservatorySnapshotV329,
  );
  useEffect(() => {
    if (mode !== "science") return;
    return retainKerrScienceObservatoryV329();
  }, [mode]);
  const view = observatory.uncertainty;
  const provenance = observatory.provenance;
  const summary: DisplaySummary = view ? {
    status: "ready",
    bandMeasurementCount: view.counts.bandMeasurementCount,
    maximumRelativeEnvelope: view.maxima.conservativeLinearRelativeEnvelope,
    maximumBandQuadrature: view.maxima.bandQuadratureRelative,
    maximumDiskQuadrature: view.maxima.diskQuadratureRelative,
    maximumFormulaDifference: view.maxima.carterKerrSchildSpectralRelative,
    maximumRedshiftPerturbation: view.maxima.redshiftPerturbationRelative,
    maximumRadiusDifferenceM: view.maxima.geometryRadiusDifferenceM,
    sourceSha256: view.source.bandArtifactSha256,
  } : { ...INITIAL, status: observatory.status === "unavailable" ? "unavailable" : "loading" };
  const download = useCallback((kind: "json" | "csv") => {
    if (!provenance) return;
    const content = kind === "json"
      ? serializeKerrScienceBandUncertaintyProvenanceJsonV326(provenance)
      : serializeKerrScienceBandUncertaintyProvenanceCsvV326(provenance);
    const blob = new Blob([content], { type: kind === "json" ? "application/json" : "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const release = acquireAtlasResource("object-url", "kerr", `science-band-uncertainty-provenance-v326:${kind}`, {
      owner: "strong-gravity-science",
      estimatedBytes: blob.size,
      contentSha256: provenance.canonicalSha256,
    });
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `orbit-atlas-kerr-band-uncertainty-v326.${kind}`;
    anchor.click();
    queueMicrotask(() => { URL.revokeObjectURL(url); release(); });
  }, [provenance]);
  if (mode !== "science") return null;
  const ready = summary.status === "ready";
  return (
    <div
      className="mt-2 rounded border border-sky-100/10 bg-sky-100/[0.025] px-2 py-1.5"
      data-kerr-science-band-uncertainty-v325={summary.status}
      data-kerr-science-band-uncertainty-policy="linear-sum-no-rss-not-statistical-ci"
      data-kerr-science-band-uncertainty-measurements={summary.bandMeasurementCount}
      data-kerr-science-band-uncertainty-provenance-v326={provenance ? "available" : "pending"}
      data-kerr-science-observatory-store-v329={observatory.status}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[8px] uppercase tracking-[0.12em] text-sky-100/45">Componentwise audit envelope</div>
          <div className="mt-0.5 font-mono text-[8px] text-white/48">linear sum · no independence claim · no RSS</div>
        </div>
        <div className="text-right font-mono">
          <div className="text-[10px] text-sky-50/80">{ready ? `${(summary.maximumRelativeEnvelope! * 1e6).toFixed(3)} ppm` : summary.status}</div>
          <div className="text-[7px] text-white/30">maximum audit delta</div>
        </div>
      </div>
      <div className="mt-1.5 grid grid-cols-4 gap-1 font-mono text-[7px]">
        <div><div className="text-white/28">band quad</div><div className="text-white/55">{scientific(summary.maximumBandQuadrature)}</div></div>
        <div><div className="text-white/28">disk quad</div><div className="text-white/55">{scientific(summary.maximumDiskQuadrature)}</div></div>
        <div><div className="text-white/28">formula</div><div className="text-white/55">{scientific(summary.maximumFormulaDifference)}</div></div>
        <div><div className="text-white/28">Δg response</div><div className="text-white/55">{scientific(summary.maximumRedshiftPerturbation)}</div></div>
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-white/5 pt-1 font-mono text-[7px] text-white/30">
        <span>{ready ? `${summary.bandMeasurementCount}/12 band measurements` : "bounded artifact pending"}</span>
        <span>Δr {scientific(summary.maximumRadiusDifferenceM)} m · not a statistical CI</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-white/5 pt-1.5">
        <span className="font-mono text-[7px] text-white/28">12-row sanitized provenance · no raw ray buffer</span>
        <div className="flex gap-1">
          <button type="button" disabled={!provenance} onClick={() => download("json")} className="atlas-accessible-focus rounded border border-sky-100/15 px-1.5 py-0.5 font-mono text-[7px] text-sky-50/65 disabled:opacity-35">JSON</button>
          <button type="button" disabled={!provenance} onClick={() => download("csv")} className="atlas-accessible-focus rounded border border-sky-100/15 px-1.5 py-0.5 font-mono text-[7px] text-sky-50/65 disabled:opacity-35">CSV</button>
        </div>
      </div>
    </div>
  );
}
