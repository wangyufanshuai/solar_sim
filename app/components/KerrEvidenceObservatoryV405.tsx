"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import {
  getAtlasLifecycleProvenanceDossierSnapshotV405,
  loadAtlasLifecycleProvenanceDossierV405,
  subscribeAtlasLifecycleProvenanceDossierV405,
} from "../lib/atlasLifecycleProvenanceDossierClientV405";
import { ATLAS_OBSERVATION_LIFECYCLE_STAGE_IDS_V404 } from "../lib/atlasObservationLifecycleReplaySummaryV404";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V405, resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import { createAtlasVisualTokenSignatureV300, useAtlasVisualRuntimeConsumerV300 } from "../lib/atlasVisualRuntimeConsumptionV300";
import KerrStokesTransferSurfaceV406 from "./KerrStokesTransferSurfaceV406";
import KerrScatteringAtmosphereSurfaceV407 from "./KerrScatteringAtmosphereSurfaceV407";
import KerrScatteringOracleSurfaceV408 from "./KerrScatteringOracleSurfaceV408";
import KerrScatteringCorrectionSurfaceV409 from "./KerrScatteringCorrectionSurfaceV409";
import KerrIdealPolarimeterSurfaceV410 from "./KerrIdealPolarimeterSurfaceV410";
import KerrPolarimeterCalibrationSurfaceV411 from "./KerrPolarimeterCalibrationSurfaceV411";
import KerrPolarimeterInversionSurfaceV412 from "./KerrPolarimeterInversionSurfaceV412";
import KerrPolarimeterSpectralSurfaceV413 from "./KerrPolarimeterSpectralSurfaceV413";
import KerrPolarimeterDetectorSurfaceV414 from "./KerrPolarimeterDetectorSurfaceV414";
import KerrPolarimeterDetectorLikelihoodSurfaceV415 from "./KerrPolarimeterDetectorLikelihoodSurfaceV415";
import KerrPolarimeterStokesEnsembleSurfaceV416 from "./KerrPolarimeterStokesEnsembleSurfaceV416";
import KerrPolarimeterNonlinearCompassV417 from "./KerrPolarimeterNonlinearCompassV417";
import KerrSparsePolarimetricStripV418 from "./KerrSparsePolarimetricStripV418";
import KerrScreenCoordinatePlaneV419 from "./KerrScreenCoordinatePlaneV419";
import KerrObserverWcsGridV420 from "./KerrObserverWcsGridV420";
import KerrAxialPolarizationVectorsV421 from "./KerrAxialPolarizationVectorsV421";
import KerrPolarizationOrientationBasisV422 from "./KerrPolarizationOrientationBasisV422";
import KerrPredictedStokesAdmissionV423 from "./KerrPredictedStokesAdmissionV423";
import KerrPredictedPolarimeterV424 from "./KerrPredictedPolarimeterV424";
import KerrInstrumentSpectralAdmissionV425 from "./KerrInstrumentSpectralAdmissionV425";
import KerrHighEnergyInstrumentResponseV426 from "./KerrHighEnergyInstrumentResponseV426";
import KerrHighEnergyResponseAcquisitionV427 from "./KerrHighEnergyResponseAcquisitionV427";
import KerrHighEnergyResponseIntakeV428 from "./KerrHighEnergyResponseIntakeV428";
import KerrHighEnergyResponseUncertaintyV429 from "./KerrHighEnergyResponseUncertaintyV429";
import KerrHighEnergyCountLikelihoodV430 from "./KerrHighEnergyCountLikelihoodV430";
import KerrHighEnergyLikelihoodStressV431 from "./KerrHighEnergyLikelihoodStressV431";
import KerrHighEnergyLikelihoodAuthorityV432 from "./KerrHighEnergyLikelihoodAuthorityV432";
import KerrHighEnergyJointNuisanceV433 from "./KerrHighEnergyJointNuisanceV433";
import KerrHighEnergyMeasuredAdmissionV434 from "./KerrHighEnergyMeasuredAdmissionV434";
import KerrHighEnergyMeasuredImportV435 from "./KerrHighEnergyMeasuredImportV435";
import KerrObservationProvenanceV436 from "./KerrObservationProvenanceV436";
import KerrInstrumentObservationV437 from "./KerrInstrumentObservationV437";
import KerrMeasuredResponseAdmissionV438 from "./KerrMeasuredResponseAdmissionV438";
import KerrScientificImageAvailabilityV439 from "./KerrScientificImageAvailabilityV439";
import KerrSourceCoordinateAuditV440 from "./KerrSourceCoordinateAuditV440";
import KerrWcsProjectionAvailabilityV441 from "./KerrWcsProjectionAvailabilityV441";

const NODE_LABELS = Object.freeze({
  "v403-replay": "Replay campaign",
  "v404-summary": "Bounded summary",
  "v404-evidence": "Qualification",
  "v404-pointer": "Capability pointer",
} as const);
const STAGE_LABELS = Object.freeze({ constraints: "Constraint", admission: "Admission", intake: "Intake", provenance: "Provenance" } as const);

export default function KerrEvidenceObservatoryV405() {
  const state = useSyncExternalStore(
    subscribeAtlasLifecycleProvenanceDossierV405,
    getAtlasLifecycleProvenanceDossierSnapshotV405,
    getAtlasLifecycleProvenanceDossierSnapshotV405,
  );
  useEffect(() => { void loadAtlasLifecycleProvenanceDossierV405().catch(() => undefined); }, []);
  const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V405);
  const tokens = profile.runtimeTokens.hud.evidenceObservatoryV13;
  if (!tokens) throw new Error("v405-evidence-observatory-token-boundary");
  useAtlasVisualRuntimeConsumerV300({ profile: profile.id, group: "hud", consumer: "KerrEvidenceObservatoryV405", tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud) });
  const dossier = state.dossier;
  const style = {
    "--atlas-v405-panel": tokens.panelOpacity,
    "--atlas-v405-lineage": tokens.lineageTraceOpacity,
    "--atlas-v405-node": tokens.nodeLuminance,
    "--atlas-v405-sha": tokens.checksumRailOpacity,
    "--atlas-v405-fail": tokens.failClosedAmberOpacity,
    "--atlas-v405-arc": tokens.baselineArcOpacity,
    "--atlas-v405-grain": tokens.evidenceGrainOpacity,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[18px] border border-lime-100/14 bg-[radial-gradient(circle_at_18%_28%,rgba(163,230,53,.09),transparent_28%),radial-gradient(circle_at_91%_12%,rgba(34,211,238,.075),transparent_25%),linear-gradient(145deg,rgba(1,9,7,var(--atlas-v405-panel)),rgba(5,8,7,var(--atlas-v405-panel))_52%,rgba(10,7,2,var(--atlas-v405-panel)))] p-3 text-white/56 shadow-[0_28px_90px_rgba(0,0,0,.32)]"
      data-atlas-evidence-observatory-v405
      data-atlas-v405-profile="science-cinematic-v13-v405"
      data-atlas-v405-dossier-status={state.status}
      data-atlas-v405-request-count={state.requestCount}
      data-atlas-v405-response-bytes={state.responseBytes}
      data-atlas-v405-cycle-details-in-react-state="false"
      data-atlas-v405-science-buffer-mutation="false"
      data-atlas-v405-cinematic-buffer-mutation="false"
      data-atlas-v405-physics-mutation="false"
      data-atlas-v405-scene-revision-mutation="false"
      data-atlas-v405-canvas-created="false"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v405-grain)] [background-image:repeating-linear-gradient(118deg,transparent_0_7px,rgba(217,249,157,.08)_8px,transparent_9px_17px)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full border border-lime-100/[var(--atlas-v405-arc)] opacity-15 shadow-[inset_0_0_80px_rgba(163,230,53,.08)]" />
      <header className="relative flex flex-wrap items-start justify-between gap-4 border-b border-white/7 pb-3">
        <div>
          <div className="font-mono text-[6px] uppercase tracking-[.34em] text-lime-100/44">Science Cinematic V13 · provenance orbital vault</div>
          <h3 className="mt-1 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[25px] font-light uppercase tracking-[.18em] text-lime-50/94">Evidence observatory</h3>
          <p className="mt-1 max-w-[86ch] font-mono text-[6px] leading-relaxed text-white/34">Four immutable lineage nodes. One bounded dossier. Fixture qualification stays separate from browser and production lifecycle authority.</p>
        </div>
        <div className="flex items-center gap-2 border border-amber-100/14 bg-amber-100/[.025] px-3 py-2 font-mono">
          <span className={`h-2 w-2 rounded-full ${state.status === "ready" ? "bg-lime-200/70 shadow-[0_0_16px_rgba(190,242,100,.35)]" : state.status === "loading" ? "animate-pulse bg-cyan-200/60" : "bg-amber-200/60"}`} />
          <div><div className="text-[5px] uppercase tracking-[.14em] text-white/24">dossier channel</div><div className="mt-0.5 text-[7px] uppercase text-lime-100/58">{state.status}</div></div>
        </div>
      </header>

      {!dossier ? (
        <div className="relative mt-3 border-l-2 border-amber-100/25 bg-amber-100/[.025] px-3 py-2 font-mono text-[7px] text-amber-50/48" aria-live="polite">
          {state.status === "loading" || state.status === "idle" ? "Acquiring bounded provenance dossier…" : `Dossier unavailable · ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <div className="relative mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
          <div className="relative overflow-hidden border border-lime-100/10 bg-black/24 p-3">
            <div aria-hidden="true" className="absolute left-[13%] top-[50%] h-px w-[72%] bg-gradient-to-r from-lime-100/10 via-lime-100/[var(--atlas-v405-lineage)] to-cyan-100/12 opacity-35" />
            <div className="relative flex items-center justify-between gap-3 font-mono"><span className="text-[6px] uppercase tracking-[.18em] text-lime-100/42">Canonical lineage / 4 nodes</span><span className="text-[5px] text-white/22">3 directed edges</span></div>
            <div className="relative mt-4 grid gap-2 sm:grid-cols-4">
              {dossier.lineage.nodes.map((node, index) => (
                <article key={node.id} className="group relative min-h-24 border border-white/8 bg-black/35 px-2 py-2 font-mono" data-atlas-v405-lineage-node={node.id}>
                  <div className="flex items-center justify-between"><span className="grid h-5 w-5 place-items-center rounded-full border border-lime-100/20 text-[6px] text-lime-100/60">{index + 1}</span><span className="text-[5px] uppercase text-white/20">locked</span></div>
                  <div className="mt-3 text-[7px] text-lime-50/[var(--atlas-v405-node)]">{NODE_LABELS[node.id]}</div>
                  <div className="mt-1 text-[5px] text-white/26">{node.contentClass}</div>
                  <div className="mt-3 truncate border-t border-white/6 pt-1 text-[5px] text-cyan-100/[var(--atlas-v405-sha)]">{node.sha256.slice(0, 14)}…</div>
                </article>
              ))}
            </div>
            <div className="mt-3 grid gap-px bg-white/6 sm:grid-cols-4">
              {ATLAS_OBSERVATION_LIFECYCLE_STAGE_IDS_V404.map((stage) => {
                const audit = dossier.stages[stage];
                return <div key={stage} className="bg-black/32 px-2 py-2 font-mono" data-atlas-v405-stage={stage}><div className="text-[5px] uppercase tracking-[.12em] text-white/25">{STAGE_LABELS[stage]}</div><div className="mt-1 text-[7px] text-lime-100/55">{audit.successCount} ok</div><div className="mt-0.5 text-[5px] text-amber-100/[var(--atlas-v405-fail)]">{audit.failureCount} fail · {audit.releasedPendingCount} release</div></div>;
              })}
            </div>
          </div>

          <aside className="grid gap-px bg-white/6 font-mono sm:grid-cols-2 xl:grid-cols-1">
            <Metric label="baseline cycles" value={`${dossier.replay.baselineCycleCount} / ${dossier.replay.cycleCount}`} tone="lime" />
            <Metric label="request outcomes" value={`${dossier.replay.successCount} ok · ${dossier.replay.failureCount} unavailable · ${dossier.replay.releasedPendingRequestCount} released`} tone="cyan" />
            <Metric label="browser soak" value="NOT RUN" tone="amber" />
            <Metric label="production lifecycle" value="NOT QUALIFIED" tone="amber" />
            <div className="bg-black/32 px-3 py-2">
              <div className="text-[5px] uppercase tracking-[.13em] text-white/24">portable dossier</div>
              <div className="mt-1 truncate text-[6px] text-lime-100/50">{dossier.dossierSha256}</div>
              <a href="/api/atlas/relativity-evidence/v405/lifecycle-dossier" download className="atlas-accessible-focus mt-2 inline-flex border border-lime-100/16 bg-lime-100/[.04] px-2 py-1 text-[6px] uppercase tracking-[.1em] text-lime-100/58">Export SHA-locked JSON</a>
            </div>
          </aside>
        </div>
      )}
      <KerrStokesTransferSurfaceV406 />
      <KerrScatteringAtmosphereSurfaceV407 />
      <KerrScatteringOracleSurfaceV408 />
      <KerrScatteringCorrectionSurfaceV409 />
      <KerrIdealPolarimeterSurfaceV410 />
      <KerrPolarimeterCalibrationSurfaceV411 />
      <KerrPolarimeterInversionSurfaceV412 />
      <KerrPolarimeterSpectralSurfaceV413 />
      <KerrPolarimeterDetectorSurfaceV414 />
      <KerrPolarimeterDetectorLikelihoodSurfaceV415 />
      <KerrPolarimeterStokesEnsembleSurfaceV416 />
      <KerrPolarimeterNonlinearCompassV417 />
      <KerrSparsePolarimetricStripV418 />
      <KerrScreenCoordinatePlaneV419 />
      <KerrObserverWcsGridV420 />
      <KerrAxialPolarizationVectorsV421 />
      <KerrPolarizationOrientationBasisV422 />
      <KerrPredictedStokesAdmissionV423 />
      <KerrPredictedPolarimeterV424 />
      <KerrInstrumentSpectralAdmissionV425 />
      <KerrHighEnergyInstrumentResponseV426 />
      <KerrHighEnergyResponseAcquisitionV427 />
      <KerrHighEnergyResponseIntakeV428 />
      <KerrHighEnergyResponseUncertaintyV429 />
      <KerrHighEnergyCountLikelihoodV430 />
      <KerrHighEnergyLikelihoodStressV431 />
      <KerrHighEnergyLikelihoodAuthorityV432 />
      <KerrHighEnergyJointNuisanceV433 />
      <KerrHighEnergyMeasuredAdmissionV434 />
      <KerrHighEnergyMeasuredImportV435 />
      <KerrObservationProvenanceV436 />
      <KerrInstrumentObservationV437 />
      <KerrMeasuredResponseAdmissionV438 />
      <KerrScientificImageAvailabilityV439 />
      <KerrSourceCoordinateAuditV440 />
      <KerrWcsProjectionAvailabilityV441 />
      <footer className="relative mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 font-mono text-[5px] uppercase tracking-[.09em] text-white/24">
        <span>Science buffer immutable · cinematic buffer isolated · zero Canvas creation</span>
        <span className="text-amber-100/38">Legacy V9 remains default</span>
      </footer>
    </section>
  );
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "lime" | "cyan" | "amber" }>) {
  const color = tone === "lime" ? "text-lime-100/58" : tone === "cyan" ? "text-cyan-100/55" : "text-amber-100/52";
  return <div className="bg-black/32 px-3 py-2"><div className="text-[5px] uppercase tracking-[.13em] text-white/24">{label}</div><div className={`mt-1 text-[7px] ${color}`}>{value}</div></div>;
}
