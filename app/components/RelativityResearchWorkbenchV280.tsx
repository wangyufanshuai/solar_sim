"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createDefaultRelativityWorkbenchScenarioV280,
  createWorkbenchProvenanceV280,
  normalizeRelativityWorkbenchScenarioV280,
  type RelativityWorkbenchTabV280,
} from "../lib/relativityWorkbenchV280";
import {
  createRelativityWorkbenchEvidenceModelV285,
  parseRelativityEvidenceResponseV285,
  serializeRelativityEvidenceCsvV285,
  serializeRelativityEvidenceJsonV285,
  type AtlasRelativityEvidenceSnapshotV285,
  type RelativityEvidenceLoadStatusV285,
} from "../lib/relativityWorkbenchEvidenceV285";
import {
  acquireAtlasResource,
  getAtlasResourceSnapshot,
  subscribeAtlasResourceSnapshot,
  type AtlasRuntimeResourceSnapshot,
} from "../lib/atlasResourceLifecycle";
import KerrCriticalCurveWorkbenchV300 from "./KerrCriticalCurveWorkbenchV300";
import KerrObserverEmitterWorkbenchV301 from "./KerrObserverEmitterWorkbenchV301";
import KerrEventTimelineWorkbenchV302 from "./KerrEventTimelineWorkbenchV302";
import KerrErrorBudgetWorkbenchV303 from "./KerrErrorBudgetWorkbenchV303";
import KerrPolarizationWorkbenchV304 from "./KerrPolarizationWorkbenchV304";
import KerrScienceObservablesWorkbenchV306 from "./KerrScienceObservablesWorkbenchV306";
import KerrThinDiskSpectrumWorkbenchV319 from "./KerrThinDiskSpectrumWorkbenchV319";
import KerrThinDiskBandWorkbenchV320 from "./KerrThinDiskBandWorkbenchV320";
import KerrDenseShardTruthWorkbenchV311 from "./KerrDenseShardTruthWorkbenchV311";
import KerrCorrectedAuthorityWorkbenchV312 from "./KerrCorrectedAuthorityWorkbenchV312";
import KerrPolarizationRequalificationWorkbenchV313 from "./KerrPolarizationRequalificationWorkbenchV313";
import RelativityEvidenceSurfaceV338 from "./RelativityEvidenceSurfaceV338";
import RelativityEvidenceSurfaceV341 from "./RelativityEvidenceSurfaceV341";
import RelativityEvidenceSurfaceV342 from "./RelativityEvidenceSurfaceV342";
import RelativityEvidenceSurfaceV343 from "./RelativityEvidenceSurfaceV343";
import RelativityEvidenceSurfaceV344 from "./RelativityEvidenceSurfaceV344";
import RelativityEvidenceSurfaceV345 from "./RelativityEvidenceSurfaceV345";
import RelativityEvidenceSurfaceV346 from "./RelativityEvidenceSurfaceV346";
import RelativityEvidenceSurfaceV347 from "./RelativityEvidenceSurfaceV347";
import RelativityEvidenceSurfaceV348 from "./RelativityEvidenceSurfaceV348";
import RelativityEvidenceSurfaceV349 from "./RelativityEvidenceSurfaceV349";
import KerrScienceBandObservationSurfaceV350 from "./KerrScienceBandObservationSurfaceV350";
import KerrObserverFrameUncertaintySurfaceV351 from "./KerrObserverFrameUncertaintySurfaceV351";
import KerrPhotonResponseUncertaintySurfaceV352 from "./KerrPhotonResponseUncertaintySurfaceV352";
import KerrSpectralShapeResponseSurfaceV353 from "./KerrSpectralShapeResponseSurfaceV353";
import KerrSpectralCorrelationSurfaceV354 from "./KerrSpectralCorrelationSurfaceV354";
import KerrSpectralEigenmodeSurfaceV355 from "./KerrSpectralEigenmodeSurfaceV355";
import KerrSpectralEnvelopeSurfaceV356 from "./KerrSpectralEnvelopeSurfaceV356";
import KerrSpectralConfidenceScaleSurfaceV357 from "./KerrSpectralConfidenceScaleSurfaceV357";
import KerrObservablePhotonUncertaintySurfaceV358 from "./KerrObservablePhotonUncertaintySurfaceV358";
import KerrPhotonCountingNoiseSurfaceV359 from "./KerrPhotonCountingNoiseSurfaceV359";
import KerrDetectorBreakEvenSurfaceV360 from "./KerrDetectorBreakEvenSurfaceV360";
import DetectorCalibrationAdmissionSurfaceV361 from "./DetectorCalibrationAdmissionSurfaceV361";
import KerrInstrumentLabSurfaceV362 from "./KerrInstrumentLabSurfaceV362";
import DetectorCalibrationPlanSurfaceV363 from "./DetectorCalibrationPlanSurfaceV363";
import DetectorCalibrationPackSurfaceV364 from "./DetectorCalibrationPackSurfaceV364";
import DetectorCalibrationImportSurfaceV365 from "./DetectorCalibrationImportSurfaceV365";
import DetectorCalibrationValidationSurfaceV366 from "./DetectorCalibrationValidationSurfaceV366";
import DetectorCalibrationAuthoritySurfaceV367 from "./DetectorCalibrationAuthoritySurfaceV367";
import DetectorResponseAuthoritySurfaceV368 from "./DetectorResponseAuthoritySurfaceV368";
import MeasuredPhotonExpectationSurfaceV369 from "./MeasuredPhotonExpectationSurfaceV369";
import ObservationGeometryPackSurfaceV370 from "./ObservationGeometryPackSurfaceV370";
import ObservationGeometryImportSurfaceV371 from "./ObservationGeometryImportSurfaceV371";
import ObservationGeometryValidationSurfaceV372 from "./ObservationGeometryValidationSurfaceV372";
import ObservationGeometryAuthoritySurfaceV373 from "./ObservationGeometryAuthoritySurfaceV373";
import ObservationGeometryRuntimePublicationSurfaceV374 from "./ObservationGeometryRuntimePublicationSurfaceV374";
import MeasuredExpectationAuthoritySurfaceV375 from "./MeasuredExpectationAuthoritySurfaceV375";
import ExpectedElectronScienceImageSurfaceV376 from "./ExpectedElectronScienceImageSurfaceV376";
import MeasurementLabSurfaceV377 from "./MeasurementLabSurfaceV377";
import MeasurementAuthorityTopologySurfaceV378 from "./MeasurementAuthorityTopologySurfaceV378";
import MeasuredAuthorityReadinessSurfaceV379 from "./MeasuredAuthorityReadinessSurfaceV379";
import MeasuredAuthorityAdversarialSurfaceV380 from "./MeasuredAuthorityAdversarialSurfaceV380";
import MeasuredAuthorityIdentitySurfaceV381 from "./MeasuredAuthorityIdentitySurfaceV381";
import MeasuredVisibleSourceForensicSurfaceV382R1 from "./MeasuredVisibleSourceForensicSurfaceV382R1";
import MeasuredVisibleThroughputSurfaceV383 from "./MeasuredVisibleThroughputSurfaceV383";
import MeasuredVisiblePhotonObservableSurfaceV384 from "./MeasuredVisiblePhotonObservableSurfaceV384";
import MeasuredVisiblePhotonErrorBudgetSurfaceV385 from "./MeasuredVisiblePhotonErrorBudgetSurfaceV385";
import MeasuredVisiblePhotonSensitivitySurfaceV386 from "./MeasuredVisiblePhotonSensitivitySurfaceV386";
import KerrPhotonIdentifiabilitySurfaceV387 from "./KerrPhotonIdentifiabilitySurfaceV387";
import KerrPhotonMetrologyObservatoryIntentV559 from "./KerrPhotonMetrologyObservatoryIntentV559";
import KerrObservationEnvelopeSurfaceV560 from "./KerrObservationEnvelopeSurfaceV560";
import KerrGeometryConditionedTemperatureSurfaceV388 from "./KerrGeometryConditionedTemperatureSurfaceV388";
import KerrConditionalTemperatureIntervalSurfaceV389 from "./KerrConditionalTemperatureIntervalSurfaceV389";
import KerrTemperatureSystematicsSwitchyardV390 from "./KerrTemperatureSystematicsSwitchyardV390";
import KerrTemperatureCurvatureRelayV391 from "./KerrTemperatureCurvatureRelayV391";
import KerrCovarianceInterlockV392 from "./KerrCovarianceInterlockV392";
import KerrCorrelationPatchbayV393 from "./KerrCorrelationPatchbayV393";
import KerrCovarianceLatticeV394 from "./KerrCovarianceLatticeV394";
import KerrNullspaceObservatoryV395 from "./KerrNullspaceObservatoryV395";
import KerrObservationHubV400 from "./KerrObservationHubV400";
import KerrLifecycleReplaySummaryV404 from "./KerrLifecycleReplaySummaryV404";

const TABS: readonly RelativityWorkbenchTabV280[] = [
  "weak-field-reference", "kerr-geodesics", "observer-tetrad", "ray-image", "error-budget", "campaign-evidence",
];

const TAB_LABELS: Readonly<Record<RelativityWorkbenchTabV280, string>> = {
  "weak-field-reference": "Weak-field reference",
  "kerr-geodesics": "Kerr geodesics",
  "observer-tetrad": "Observer / Tetrad",
  "ray-image": "Rays and thin disk",
  "error-budget": "Convergence and error",
  "campaign-evidence": "Campaign evidence",
};

const TAB_LABELS_V315: Readonly<Record<RelativityWorkbenchTabV280, string>> = Object.freeze({
  ...TAB_LABELS,
});

function downloadText(filename: string, mimeType: string, content: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const release = acquireAtlasResource("object-url", "relativity-lab", `relativity-workbench:${filename}`, {
    owner: "research",
    estimatedBytes: blob.size,
  });
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  queueMicrotask(() => {
    URL.revokeObjectURL(url);
    release();
  });
}

function writeWorkbenchResourceTelemetryV300(
  node: HTMLElement,
  resources: AtlasRuntimeResourceSnapshot,
): void {
  node.dataset.atlasKerrResourceWorkers = String(resources.workers);
  node.dataset.atlasKerrResourceTextures = String(resources.textures);
  node.dataset.atlasKerrResourceRenderTargets = String(resources.gpuRenderTargets);
  node.dataset.atlasKerrResourceGpuBuffers = String(resources.gpuBuffers);
  node.dataset.atlasKerrResourceGpuPipelines = String(resources.gpuComputePipelines);
  node.dataset.atlasKerrResourceGpuQueries = String(resources.gpuQueries);
  node.dataset.atlasKerrResourceTypedArrayCaches = String(resources.typedArrayCaches);
  node.dataset.atlasKerrResourceObjectUrls = String(resources.objectUrls);
  node.dataset.atlasKerrCameraLeases = String(resources.cameraLocks);
  node.dataset.atlasKerrEstimatedGpuBytes = String(resources.estimatedGpuBytes);
  node.dataset.atlasKerrResourceRevision = String(resources.revision);
}

export default function RelativityResearchWorkbenchV280() {
  const resourceTelemetryRef = useRef<HTMLElement | null>(null);
  const [tab, setTab] = useState<RelativityWorkbenchTabV280>("weak-field-reference");
  const [scenario, setScenario] = useState(createDefaultRelativityWorkbenchScenarioV280);
  const [snapshot, setSnapshot] = useState<AtlasRelativityEvidenceSnapshotV285 | null>(null);
  const [loadStatus, setLoadStatus] = useState<RelativityEvidenceLoadStatusV285>("loading");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence", { cache: "no-store", signal: controller.signal })
      .then(async (response) => parseRelativityEvidenceResponseV285(await response.json()))
      .then((result) => {
        if (!result.available || !result.snapshot) {
          setSnapshot(null);
          setLoadStatus("unavailable");
          return;
        }
        setSnapshot(result.snapshot);
        setLoadStatus(result.snapshot.status === "corrupt" ? "corrupt" : "ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSnapshot(null);
        setLoadStatus(error instanceof Error && error.message.includes("invalid") ? "corrupt" : "error");
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const publish = () => {
      if (resourceTelemetryRef.current) {
        writeWorkbenchResourceTelemetryV300(resourceTelemetryRef.current, getAtlasResourceSnapshot());
      }
    };
    publish();
    return subscribeAtlasResourceSnapshot(publish);
  }, []);

  const evidence = useMemo(() => createRelativityWorkbenchEvidenceModelV285(snapshot, loadStatus), [loadStatus, snapshot]);
  const provenance = useMemo(() => createWorkbenchProvenanceV280({
    scenario: { ...scenario, tab },
    v276EvidenceSha256: evidence.rows.find((row) => row.id === "v282")?.artifactSha256 ?? null,
    v277EvidenceSha256: evidence.currentRows.find((row) => row.id === "v312")?.artifactSha256 ?? null,
    v278EvidenceSha256: evidence.currentRows.find((row) => row.id === "v313")?.artifactSha256 ?? null,
  }), [evidence.currentRows, evidence.rows, scenario, tab]);
  const exportJson = useCallback(() => {
    if (snapshot) downloadText("orbit-atlas-relativity-v315.json", "application/json", serializeRelativityEvidenceJsonV285(snapshot));
  }, [snapshot]);
  const exportCsv = useCallback(() => {
    if (snapshot) downloadText("orbit-atlas-relativity-v315.csv", "text/csv;charset=utf-8", serializeRelativityEvidenceCsvV285(snapshot));
  }, [snapshot]);
  return (
    <section
      ref={resourceTelemetryRef}
      className="mt-3 border-t border-cyan-100/10 pt-3"
      data-atlas-relativity-workbench-v299="science-cinematic-boundary"
      data-atlas-relativity-evidence-status={loadStatus}
      data-atlas-science-payload-sha-v315={snapshot?.current.v315.fullShortAuthoritySha256 ?? "unavailable"}
      data-atlas-kerr-geometry-status-v315={snapshot?.current.v312.status ?? "unavailable"}
      data-atlas-kerr-polarization-status-v315={snapshot?.current.v313.status ?? "unavailable"}
      data-atlas-kerr-campaign-status-v314={snapshot?.current.v314.status ?? "unavailable"}
      data-atlas-kerr-v315-runtime={snapshot?.current.v315.status ?? "unavailable"}
      data-atlas-kerr-resource-workers="0"
      data-atlas-kerr-resource-textures="0"
      data-atlas-kerr-resource-render-targets="0"
      data-atlas-kerr-resource-gpu-buffers="0"
      data-atlas-kerr-resource-gpu-pipelines="0"
      data-atlas-kerr-resource-gpu-queries="0"
      data-atlas-kerr-resource-typed-array-caches="0"
      data-atlas-kerr-resource-object-urls="0"
      data-atlas-kerr-camera-leases="0"
      data-atlas-kerr-estimated-gpu-bytes="0"
      data-atlas-kerr-resource-revision="0"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/60">Unified relativity research workbench V400</div>
          <p className="mt-1 text-[10px] leading-4 text-white/45">Read-only dynamic evidence and bounded previews; full science campaigns remain offline and serial.</p>
        </div>
        <span className="rounded border border-amber-200/20 bg-amber-200/[0.06] px-2 py-1 text-[9px] uppercase text-amber-100/70">local shadow</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6" role="tablist" aria-label="Relativity research workbench tabs">
        {TABS.map((item) => (
          <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={tab === item
            ? "atlas-accessible-focus min-h-9 rounded border border-cyan-100/25 bg-cyan-100/[0.12] px-2 py-1 text-[9px] text-cyan-50"
            : "atlas-accessible-focus min-h-9 rounded border border-white/8 px-2 py-1 text-[9px] text-white/48"}>
            {TAB_LABELS_V315[item]}
          </button>
        ))}
      </div>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-3" role="tabpanel">
        <label className="rounded border border-white/8 bg-black/15 px-2 py-1.5 text-[9px] text-white/48">
          Spin a/M
          <input aria-label="spin a over M" type="number" min="-0.998" max="0.998" step="0.001" value={scenario.spinA} onChange={(event) => setScenario((current) => normalizeRelativityWorkbenchScenarioV280({ ...current, spinA: Number(event.target.value) }))} className="mt-1 block w-full rounded bg-black/30 px-1.5 py-1 font-mono text-[10px] text-cyan-50" />
        </label>
        <div className="rounded border border-white/8 bg-black/15 px-2 py-1.5 text-[9px] text-white/48">Kernel<div className="mt-1 font-mono text-[10px] text-cyan-50">{scenario.kernel}</div></div>
        <div className="rounded border border-white/8 bg-black/15 px-2 py-1.5 text-[9px] text-white/48">Boundary<div className="mt-1 font-mono text-[10px] text-amber-100/70">{provenance.boundary}</div></div>
      </div>
      {tab === "kerr-geodesics" && snapshot?.current.v312.status === "corrected-authority-qualified" ? (
        <KerrCorrectedAuthorityWorkbenchV312 />
      ) : null}
      {tab === "observer-tetrad" && snapshot?.current.v312.status === "corrected-authority-qualified"
        && snapshot.current.v313.status === "full-kerr-short-authority-qualified" ? (
          <KerrPolarizationRequalificationWorkbenchV313 />
      ) : null}
      {tab === "error-budget" && snapshot?.current.v312.status === "corrected-authority-qualified"
        && snapshot.current.v313.status === "full-kerr-short-authority-qualified" ? (
          <>
            <KerrCorrectedAuthorityWorkbenchV312 />
            <KerrPolarizationRequalificationWorkbenchV313 />
          </>
        ) : null}
      {tab === "ray-image" && snapshot?.current.v313.status === "full-kerr-short-authority-qualified"
        && snapshot.current.v315.status === "implemented-awaiting-browser-qualification" ? (
        <>
          <KerrScienceObservablesWorkbenchV306 spinA={scenario.spinA} />
          <KerrThinDiskSpectrumWorkbenchV319 spinA={scenario.spinA} />
          <KerrThinDiskBandWorkbenchV320 spinA={scenario.spinA} />
        </>
      ) : null}
      {tab === "campaign-evidence" ? (
        <>
          <KerrDenseShardTruthWorkbenchV311 />
          <KerrPhotonMetrologyObservatoryIntentV559 active={tab === "campaign-evidence"} />
          <KerrObservationEnvelopeSurfaceV560 active={tab === "campaign-evidence"} />
          <details className="mt-2 rounded border border-amber-100/10 bg-amber-100/[0.025] p-2 text-[9px] text-white/45">
            <summary className="atlas-accessible-focus cursor-pointer text-amber-100/70">Historical v296/v297 browser views (not current v312/v313 authority)</summary>
            <KerrCriticalCurveWorkbenchV300 spinA={scenario.spinA} />
            <KerrEventTimelineWorkbenchV302 spinA={scenario.spinA} />
            <KerrObserverEmitterWorkbenchV301 spinA={scenario.spinA} />
            <KerrErrorBudgetWorkbenchV303 />
            <KerrPolarizationWorkbenchV304 spinA={scenario.spinA} />
          </details>
        </>
      ) : null}
      <RelativityEvidenceSurfaceV338 />
      <RelativityEvidenceSurfaceV341 />
      <RelativityEvidenceSurfaceV342 />
      <RelativityEvidenceSurfaceV343 />
      <RelativityEvidenceSurfaceV344 />
      <RelativityEvidenceSurfaceV345 />
      <RelativityEvidenceSurfaceV346 />
      <RelativityEvidenceSurfaceV347 />
      <RelativityEvidenceSurfaceV348 />
      <RelativityEvidenceSurfaceV349 />
      <KerrScienceBandObservationSurfaceV350 />
      <KerrObserverFrameUncertaintySurfaceV351 />
      <KerrPhotonResponseUncertaintySurfaceV352 />
      <KerrSpectralShapeResponseSurfaceV353 />
      <KerrSpectralCorrelationSurfaceV354 />
      <KerrSpectralEigenmodeSurfaceV355 />
      <KerrSpectralEnvelopeSurfaceV356 />
      <KerrSpectralConfidenceScaleSurfaceV357 />
      <KerrObservablePhotonUncertaintySurfaceV358 />
      <KerrPhotonCountingNoiseSurfaceV359 />
      <KerrDetectorBreakEvenSurfaceV360 />
      <DetectorCalibrationAdmissionSurfaceV361 />
      <KerrInstrumentLabSurfaceV362 />
      <DetectorCalibrationPlanSurfaceV363 />
      <DetectorCalibrationPackSurfaceV364 />
      <DetectorCalibrationImportSurfaceV365 />
      <DetectorCalibrationValidationSurfaceV366 />
      <DetectorCalibrationAuthoritySurfaceV367 />
      <DetectorResponseAuthoritySurfaceV368 />
      <MeasuredPhotonExpectationSurfaceV369 />
      <ObservationGeometryPackSurfaceV370 />
      <ObservationGeometryImportSurfaceV371 />
      <ObservationGeometryValidationSurfaceV372 />
      <ObservationGeometryAuthoritySurfaceV373 />
      <ObservationGeometryRuntimePublicationSurfaceV374 />
      <MeasuredExpectationAuthoritySurfaceV375 />
      <ExpectedElectronScienceImageSurfaceV376 />
      <MeasurementLabSurfaceV377 />
      <MeasurementAuthorityTopologySurfaceV378 />
      <MeasuredAuthorityReadinessSurfaceV379 />
      <MeasuredAuthorityAdversarialSurfaceV380 />
      <MeasuredAuthorityIdentitySurfaceV381 />
      <MeasuredVisibleSourceForensicSurfaceV382R1 />
      <MeasuredVisibleThroughputSurfaceV383 />
      <MeasuredVisiblePhotonObservableSurfaceV384 />
      <MeasuredVisiblePhotonErrorBudgetSurfaceV385 />
      <MeasuredVisiblePhotonSensitivitySurfaceV386 />
      <KerrPhotonIdentifiabilitySurfaceV387 />
      <KerrGeometryConditionedTemperatureSurfaceV388 />
      <KerrConditionalTemperatureIntervalSurfaceV389 />
      <KerrTemperatureSystematicsSwitchyardV390 />
      <KerrTemperatureCurvatureRelayV391 />
      <KerrCovarianceInterlockV392 />
      <KerrCorrelationPatchbayV393 />
      <KerrCovarianceLatticeV394 />
      <KerrNullspaceObservatoryV395 />
      <KerrObservationHubV400 />
      <KerrLifecycleReplaySummaryV404 surface="workbench" />
      <div className="mt-2 grid gap-1 sm:grid-cols-2" data-atlas-relativity-evidence-v299 aria-live="polite">
        {loadStatus === "loading" ? <div className="rounded border border-white/8 px-2 py-1 text-[9px] text-white/45">Reading local evidence…</div> : null}
        {loadStatus !== "loading" ? evidence.rows.map((row) => (
          <div key={row.id} className="rounded border border-white/8 px-2 py-1 text-[9px] text-white/45" data-atlas-relativity-phase={row.id} data-atlas-relativity-phase-status={row.status}>
            <div className="text-white/65">{row.id} · {row.label}</div>
            <div className="mt-0.5 font-mono">{row.status} · {row.metric}</div>
          </div>
        )) : null}
      </div>
      {loadStatus !== "loading" ? (
        <div className="mt-1.5 grid gap-1 sm:grid-cols-2" data-atlas-relativity-current-v299>
          {evidence.currentRows.map((row) => (
            <div key={row.id} className="rounded border border-cyan-100/10 bg-cyan-100/[0.025] px-2 py-1 text-[9px] text-white/45" data-atlas-relativity-current-phase={row.id} data-atlas-relativity-current-status={row.status}>
              <div className="text-cyan-50/65">{row.id} · {row.label}</div>
              <div className="mt-0.5 font-mono">{row.status} · {row.metric}</div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9px]">
        <button type="button" disabled={!snapshot} onClick={exportJson} className="atlas-accessible-focus rounded border border-cyan-100/15 px-2 py-1 text-cyan-50/70 disabled:opacity-35">Export JSON</button>
        <button type="button" disabled={!snapshot} onClick={exportCsv} className="atlas-accessible-focus rounded border border-cyan-100/15 px-2 py-1 text-cyan-50/70 disabled:opacity-35">Export CSV</button>
        {evidence.artifacts.map((artifact) => <a key={`${artifact.kind}:${artifact.sha256}`} href={artifact.url} download className="atlas-accessible-focus rounded border border-white/10 px-2 py-1 text-white/55">{artifact.kind} · {artifact.label}</a>)}
        {snapshot?.current.v296.status === "geometry-redshift-qualified" ? (
          <a href="/api/atlas/relativity-evidence/artifacts/v296-critical-brackets" target="_blank" rel="noreferrer" className="atlas-accessible-focus rounded border border-cyan-100/15 px-2 py-1 text-cyan-50/70">
            Critical curve · 40 SHA-locked brackets
          </a>
        ) : null}
        <span className="text-white/35">Mission Capsule: scenario and artifact SHA only · completeness {evidence.surveyCompleteness}</span>
      </div>
    </section>
  );
}
