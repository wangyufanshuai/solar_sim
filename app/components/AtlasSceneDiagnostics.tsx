"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import type { HorizonsValidationRun, SimulationDiagnostics } from "../lib/simulationDiagnosticsTypes";
import type { KerrBlackHoleUiState } from "./KerrBlackHolePanel";
import { MERCURY_BODY_INDEX, SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { CONSERVATION_DRIFT_WARN_THRESHOLD, barycentricAngularMomentumNorm, createMercuryPerihelionTracker, createRingBuffers, pushRing, ringAsSeries, schwarzschildSurfaceRedshiftZ, totalMechanicalEnergy, updateMercuryPerihelionPrecession } from "../lib/solarSystemDiagnostics";
import { createTelemetryAccelWorkspace, pnAccelMetricsForBody } from "../lib/accelSplit";
import { computeCurrentEpochHorizonsRms, createResearchValidationSummary, mercuryPrecessionErrorPercent, researchConfidenceForDiagnostics } from "../lib/researchValidation";
import { PENDING_HORIZONS_VALIDATION_RUN, createRelativityValidationSummary, relativityConfidenceForValidation } from "../lib/relativityValidation";
import { GAIA_DR3_KINEMATICS_URL, PENDING_GALACTIC_VALIDATION, createGalacticDynamicsValidationSummary, failedGalacticDynamicsValidationSummary, loadGaiaKinematicsCatalogFromJson } from "../lib/galacticDynamicsValidation";
import { createFrwCosmologyValidationSummary } from "../lib/frwCosmologyValidation";
import { createKerrGeodesicValidationSummary } from "../lib/kerrGeodesicKernel";
import { getGaiaCatalogSource } from "../lib/gaiaCatalogSourceState";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import { fetchAtlasAsset } from "../lib/atlasAssetResolver";

const PHYSICAL_BODY_RADIUS_METERS: Readonly<Record<string, number>> = {
  sun: 695_700_000, mercury: 2_439_700, venus: 6_051_800, earth: 6_378_137,
  moon: 1_737_400, mars: 3_389_500, jupiter: 69_911_000, saturn: 58_232_000,
  uranus: 25_362_000, neptune: 24_622_000, pluto: 1_188_300, ceres: 469_700,
};

export default function DiagnosticsMonitorBridge({
  physicsRef,
  simDaysRef,
  selectedBodyIndex,
  relativityEnabledRef,
  kerrBlackHole,
  simulationDiagnosticsRef,
}: {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  simDaysRef: MutableRefObject<number>;
  selectedBodyIndex: number | null;
  relativityEnabledRef: MutableRefObject<boolean>;
  kerrBlackHole: KerrBlackHoleUiState;
  simulationDiagnosticsRef: MutableRefObject<SimulationDiagnostics | null>;
}) {
  const ringRef = useRef(createRingBuffers());
  const trackerRef = useRef(createMercuryPerihelionTracker());
  const baselineRef = useRef<{ physics: SolarSystemPhysicsRef; energy: number; angMom: number } | null>(null);
  const accelWorkspaceRef = useRef<ReturnType<typeof createTelemetryAccelWorkspace> | null>(null);
  const horizonsEpochRef = useRef<ReturnType<typeof computeCurrentEpochHorizonsRms> | null>(null);
  const horizonsValidationRunRef = useRef<HorizonsValidationRun>(PENDING_HORIZONS_VALIDATION_RUN);
  const galacticValidationRef = useRef(PENDING_GALACTIC_VALIDATION);
  const cosmologyValidationRef = useRef(createFrwCosmologyValidationSummary());
  const strongFieldValidation = useMemo(
    () =>
      createKerrGeodesicValidationSummary({
        spinA: kerrBlackHole.aOverM,
        impactParameterM: kerrBlackHole.impactParameterM,
        presetId: kerrBlackHole.orbitPresetId,
      }),
    [kerrBlackHole.aOverM, kerrBlackHole.impactParameterM, kerrBlackHole.orbitPresetId],
  );
  const validationWorkerRef = useRef<Worker | null>(null);
  const lastSampleSecondsRef = useRef(-Infinity);

  useEffect(() => {
    if (validationWorkerRef.current || typeof Worker === "undefined") return;
    const worker = new Worker(new URL("../workers/relativityValidation.worker.ts", import.meta.url));
    const releaseWorker = acquireAtlasResource("worker", "atlas", "relativity-validation");
    validationWorkerRef.current = worker;
    horizonsValidationRunRef.current = {
      ...PENDING_HORIZONS_VALIDATION_RUN,
      status: "running",
      progress: 0,
    };
    worker.onmessage = (event: MessageEvent<{ type: string; payload: HorizonsValidationRun }>) => {
      if (event.data?.payload) {
        horizonsValidationRunRef.current = event.data.payload;
      }
    };
    worker.onerror = (event) => {
      horizonsValidationRunRef.current = {
        status: "failed",
        progress: 1,
        source: "JPL Horizons API",
        modes: [],
        error: event.message,
      };
    };
    worker.postMessage({ type: "start" });
    return () => {
      worker.terminate();
      releaseWorker();
      validationWorkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadGalacticValidation() {
      try {
        const response = await fetchAtlasAsset(GAIA_DR3_KINEMATICS_URL, { cache: "force-cache" });
        if (!response.ok) {
          throw new Error(`Gaia kinematics fetch failed: ${response.status}`);
        }
        const rows = loadGaiaKinematicsCatalogFromJson(await response.text());
        if (!cancelled) {
          galacticValidationRef.current = createGalacticDynamicsValidationSummary(rows);
        }
      } catch (error) {
        if (!cancelled) {
          galacticValidationRef.current = failedGalacticDynamicsValidationSummary(error);
        }
      }
    }
    loadGalacticValidation();
    return () => {
      cancelled = true;
    };
  }, []);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    if (now - lastSampleSecondsRef.current < 0.45) return;
    lastSampleSecondsRef.current = now;

    const physics = physicsRef.current;
    if (!physics) {
      simulationDiagnosticsRef.current = null;
      return;
    }

    if (baselineRef.current?.physics !== physics) {
      ringRef.current = createRingBuffers();
      trackerRef.current = createMercuryPerihelionTracker();
      accelWorkspaceRef.current = createTelemetryAccelWorkspace(physics.n);
      horizonsEpochRef.current = computeCurrentEpochHorizonsRms(physics);
      baselineRef.current = {
        physics,
        energy: totalMechanicalEnergy(physics.posM, physics.velM, physics.mass, physics.n, physics.G, physics.eps2),
        angMom: barycentricAngularMomentumNorm(physics.posM, physics.velM, physics.mass, physics.n),
      };
    }

    const baseline = baselineRef.current;
    if (!baseline) return;

    const energy = totalMechanicalEnergy(physics.posM, physics.velM, physics.mass, physics.n, physics.G, physics.eps2);
    const angMom = barycentricAngularMomentumNorm(physics.posM, physics.velM, physics.mass, physics.n);
    const relEnergyDrift = Math.abs(energy - baseline.energy) / Math.max(Math.abs(baseline.energy), 1e-30);
    const relAngMomDrift = Math.abs(angMom - baseline.angMom) / Math.max(Math.abs(baseline.angMom), 1e-30);
    pushRing(ringRef.current, relEnergyDrift, relAngMomDrift);

    updateMercuryPerihelionPrecession(
      trackerRef.current,
      physics.posM,
      physics.velM,
      MERCURY_BODY_INDEX,
      0,
      simDaysRef.current,
    );

    const selectedForPn =
      selectedBodyIndex != null && selectedBodyIndex > 0 && selectedBodyIndex < physics.n
        ? selectedBodyIndex
        : MERCURY_BODY_INDEX;
    let pnAccelFraction: number | null = null;
    if (selectedForPn > 0 && selectedForPn < physics.n) {
      if (!accelWorkspaceRef.current) {
        accelWorkspaceRef.current = createTelemetryAccelWorkspace(physics.n);
      }
      pnAccelFraction = pnAccelMetricsForBody(
        physics,
        selectedForPn,
        relativityEnabledRef.current,
        accelWorkspaceRef.current.rk4,
        accelWorkspaceRef.current.newtonOut,
      ).pnFraction;
    }

    const selectedBody = selectedBodyIndex != null ? SOLAR_SYSTEM_BODIES[selectedBodyIndex] : undefined;
    const selectedRadiusM = selectedBody ? PHYSICAL_BODY_RADIUS_METERS[selectedBody.id] : undefined;
    const gravitationalRedshiftZ = selectedBody && selectedRadiusM
      ? schwarzschildSurfaceRedshiftZ(selectedBody.massKg, selectedRadiusM)
      : null;
    const mercuryArcsec = trackerRef.current.arcsecPerCenturyEma;
    const mercuryError = mercuryPrecessionErrorPercent(mercuryArcsec);
    const horizonsRmsPositionKm = horizonsEpochRef.current?.rmsPositionKm ?? null;
    const horizonsRmsVelocityMs = horizonsEpochRef.current?.rmsVelocityMs ?? null;
    const horizonsLongTermOnePn = horizonsValidationRunRef.current.modes.find(
      (mode) => mode.mode === "1pn",
    );
    const horizonsLongTermOnePnRmsPositionKm =
      horizonsLongTermOnePn?.rmsPositionKm ?? null;
    const horizonsLongTermOnePnRmsVelocityMs =
      horizonsLongTermOnePn?.rmsVelocityMs ?? null;
    const researchValidation = createResearchValidationSummary({
      mercuryArcsecPerCentury: mercuryArcsec,
      mercuryStatus: trackerRef.current.status,
      relEnergyDrift,
      relAngMomDrift,
      pnAccelFraction,
    });
    const researchConfidence = researchConfidenceForDiagnostics({
      mercuryPrecessionErrorPercent: mercuryError,
      horizonsRmsPositionKm: horizonsLongTermOnePnRmsPositionKm,
      horizonsRmsVelocityMs: horizonsLongTermOnePnRmsVelocityMs,
      relEnergyDrift,
      relAngMomDrift,
    });
    const relativityValidation = createRelativityValidationSummary({
      physics,
      selectedBodyIndex,
      surfaceRedshift: gravitationalRedshiftZ,
      horizonsRun: horizonsValidationRunRef.current,
    });
    const relativityConfidence = relativityConfidenceForValidation({
      mercury: relativityValidation.mercuryPrecession,
      light: relativityValidation.lightDeflection,
      shapiro: relativityValidation.shapiroDelay,
      horizons: relativityValidation.horizons,
    });
    const galacticValidation = galacticValidationRef.current;
    const cosmologyValidation = cosmologyValidationRef.current;

    const diagnostics: SimulationDiagnostics = {
      simDays: simDaysRef.current,
      energyJ: energy,
      angMomNormKgM2S: angMom,
      relEnergyDrift,
      relAngMomDrift,
      energyHistory: ringAsSeries(ringRef.current, "energy"),
      angMomHistory: ringAsSeries(ringRef.current, "angMom"),
      mercuryPrecessionArcsecPerCentury: mercuryArcsec,
      mercuryPrecessionErrorPercent: mercuryError,
      mercuryPrecessionStatus: trackerRef.current.status,
      horizonsRmsPositionKm,
      horizonsRmsVelocityMs,
      horizonsInitialEpochRmsPositionKm: horizonsRmsPositionKm,
      horizonsInitialEpochRmsVelocityMs: horizonsRmsVelocityMs,
      horizonsLongTermOnePnRmsPositionKm,
      horizonsLongTermOnePnRmsVelocityMs,
      gaiaCatalogSource: getGaiaCatalogSource(),
      researchConfidence,
      researchValidation,
      relativityValidation,
      lightDeflectionErrorPercent: relativityValidation.lightDeflection.errorPercent,
      shapiroDelayErrorPercent: relativityValidation.shapiroDelay.errorPercent,
      timeDilationUsPerDay: relativityValidation.timeDilation.gravitationalPlusKinematicUsPerDay,
      horizonsValidationStatus: relativityValidation.horizons.status,
      relativityConfidence,
      galacticValidation,
      galacticValidationStatus: galacticValidation.status,
      galacticValidationSource: galacticValidation.source,
      cosmologyValidation,
      cosmologyValidationStatus: cosmologyValidation.status,
      cosmologyModelSource: cosmologyValidation.source,
      cosmologyConfidence: cosmologyValidation.confidence,
      strongFieldValidation,
      strongFieldValidationStatus: strongFieldValidation.status,
      relativityKernel: strongFieldValidation.relativityKernel,
      gravitationalRedshiftZ,
      conservationWarn:
        relEnergyDrift > CONSERVATION_DRIFT_WARN_THRESHOLD ||
        relAngMomDrift > CONSERVATION_DRIFT_WARN_THRESHOLD,
    };
    simulationDiagnosticsRef.current = diagnostics;
    if (typeof document !== "undefined") {
      document.body.dataset.relativityValidationStatus = diagnostics.horizonsValidationStatus;
      document.body.dataset.relativityConfidence = diagnostics.relativityConfidence;
      document.body.dataset.galacticValidationStatus = diagnostics.galacticValidationStatus;
      document.body.dataset.galacticValidationSource = diagnostics.galacticValidationSource;
      document.body.dataset.cosmologyValidationStatus = diagnostics.cosmologyValidationStatus;
        document.body.dataset.cosmologyModelSource = diagnostics.cosmologyModelSource;
      document.body.dataset.relativityKernel = diagnostics.relativityKernel;
      document.body.dataset.strongFieldValidationStatus = diagnostics.strongFieldValidationStatus;
      document.body.dataset.relativityLabVersion = diagnostics.strongFieldValidation.labVersion;
      document.body.dataset.kerrOrbitPreset = diagnostics.strongFieldValidation.orbitPresetId;
      document.body.dataset.kerrImpactParameterM = diagnostics.strongFieldValidation.probe.impactParameterM.toFixed(2);
      document.body.dataset.kerrProbeStatus = diagnostics.strongFieldValidation.probe.probeStatus;
    }
  });

  return null;
}
