"use client";

import { CircleDot, X } from "lucide-react";
import { useEffect, useState, type MutableRefObject } from "react";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { REFERENCE_KEPLER_ORBITS } from "../data/referenceKeplerOrbits";
import {
  heliocentricOsculatingElements,
  reducedMassMu,
  type HeliocentricOsculatingElements,
} from "../lib/osculatingElements";
import { AU_METERS, DAY_SECONDS, G_SI } from "../lib/physicalConstants";
import type { OrbitAtlasScaleMode } from "../lib/orbitAtlasPresentation";
import { KERR_GEODESIC_VISUALIZATION_ID } from "../lib/kerrGeodesicVisualization";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import type { SimulationDiagnostics } from "../lib/simulationDiagnosticsTypes";

type OrbitAnalysisSnapshot = {
  bodyId: string;
  bodyName: string;
  simDays: number;
  elements: HeliocentricOsculatingElements | null;
  referenceAvailable: boolean;
};

function snapshotForBody(
  physics: SolarSystemPhysicsRef | null,
  selectedBodyIndex: number | null,
  simDays: number,
): OrbitAnalysisSnapshot | null {
  if (!physics || selectedBodyIndex == null || selectedBodyIndex <= 0 || selectedBodyIndex >= physics.n) return null;
  const body = SOLAR_SYSTEM_BODIES[selectedBodyIndex];
  if (!body) return null;
  const G = "G" in physics && typeof physics.G === "number" ? physics.G : G_SI;
  const mu = reducedMassMu(G, physics.mass[0] ?? body.massKg, physics.mass[selectedBodyIndex] ?? body.massKg);
  return {
    bodyId: body.id,
    bodyName: body.name,
    simDays,
    elements: heliocentricOsculatingElements(physics.posM, physics.velM, 0, selectedBodyIndex, mu),
    referenceAvailable: REFERENCE_KEPLER_ORBITS.some((orbit) => orbit.id === body.id),
  };
}

function metric(value: number | null | undefined, digits = 3, suffix = "") {
  return value == null || !Number.isFinite(value) ? "--" : `${value.toFixed(digits)}${suffix}`;
}

function angle(value: number | null) { return metric(value, 2, " deg"); }
function distanceAu(value: number) { return metric(value / AU_METERS, 4, " AU"); }
function periodDays(value: number) { return metric(value / DAY_SECONDS, 2, " d"); }

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-white/10 pl-2.5">
      <div className="text-[9px] uppercase tracking-[0.12em] text-white/35">{label}</div>
      <div className="mt-0.5 font-mono text-[11px] text-white/[0.78]">{value}</div>
    </div>
  );
}

export default function OrbitAnalysisSheet({
  open,
  onClose,
  physicsRef,
  selectedBodyIndex,
  simDaysRef,
  simulationDiagnosticsRef,
  scaleMode,
}: {
  open: boolean;
  onClose: () => void;
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  selectedBodyIndex: number | null;
  simDaysRef: MutableRefObject<number>;
  simulationDiagnosticsRef: MutableRefObject<SimulationDiagnostics | null>;
  scaleMode: OrbitAtlasScaleMode;
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!open) return;
    const interval = window.setInterval(() => setTick((value) => value + 1), 350);
    return () => window.clearInterval(interval);
  }, [open]);

  const snapshot = snapshotForBody(physicsRef.current, selectedBodyIndex, simDaysRef.current);
  if (!open) return null;
  const elements = snapshot?.elements;
  const diagnostics = simulationDiagnosticsRef.current;

  return (
    <aside data-orbit-analysis-sheet className="pointer-events-auto fixed inset-x-2 bottom-[4.5rem] z-[95] border border-white/12 bg-[rgba(8,10,13,0.9)] shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:bottom-20 sm:left-auto sm:right-4 sm:w-[22rem]" aria-label="Orbit analysis">
      <div className="flex items-start justify-between border-b border-white/10 px-3.5 py-3">
        <div className="flex items-center gap-2">
          <CircleDot className="h-4 w-4 text-[#d7c48e]" strokeWidth={1.6} />
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/[0.76]">Orbit analysis</div>
            <div className="mt-0.5 text-[11px] text-white/[0.48]">{snapshot?.bodyName ?? "Select a heliocentric body"}</div>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close orbit analysis" className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center text-white/45 hover:bg-white/7 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <div className="space-y-3 px-3.5 py-3.5">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/[0.5]"><span>ECLIPJ2000</span><span>Heliocentric</span><span>TDB + {metric(snapshot?.simDays, 3, " d")}</span></div>
        {elements ? (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              <Metric label="Semi-major axis" value={distanceAu(elements.a)} />
              <Metric label="Eccentricity" value={metric(elements.e, 6)} />
              <Metric label="Inclination" value={angle(elements.inclinationDeg)} />
              <Metric label="Period" value={periodDays(elements.periodSeconds)} />
              <Metric label="Perihelion" value={distanceAu(elements.perihelionM)} />
              <Metric label="Aphelion" value={distanceAu(elements.aphelionM)} />
              <Metric label="Ascending node" value={angle(elements.longitudeAscendingNodeDeg)} />
              <Metric label="Periapsis arg." value={angle(elements.argumentOfPeriapsisDeg)} />
              <Metric label="True anomaly" value={angle(elements.trueAnomalyDeg)} />
              <Metric label="Radial velocity" value={metric(elements.radialVelocityMs / 1000, 3, " km/s")} />
            </div>
            <div className="border-t border-white/8 pt-2.5 text-[10px] leading-5 text-white/[0.43]">
              {snapshot?.referenceAvailable ? "Reference orbit: static J2000 visual guide. " : "No static reference orbit. "}
              Live values are instantaneous two-body osculating diagnostics from the N-body state.
            </div>
            {diagnostics ? (
              <div className="science-panel px-3 py-2.5 text-[10px] leading-5 text-white/[0.48]">
                <div className="science-section-title mb-1">
                  Research validation
                </div>
                <div>Catalog source: {diagnostics.gaiaCatalogSource === "gaia-dr3" ? "Gaia DR3" : "placeholder"}</div>
                <div>Confidence: {diagnostics.relativityConfidence}</div>
                <div>
                  Mercury 1PN:{" "}
                  {diagnostics.relativityValidation.mercuryPrecession.onePnArcsecPerCentury != null
                    ? `${diagnostics.relativityValidation.mercuryPrecession.onePnArcsecPerCentury.toFixed(2)} arcsec/century`
                    : "--"}{" "}
                  (target 42.98, error{" "}
                  {diagnostics.relativityValidation.mercuryPrecession.errorPercent != null
                    ? `${diagnostics.relativityValidation.mercuryPrecession.errorPercent.toFixed(1)}%`
                    : "--"}
                  )
                </div>
                <div>
                  Light deflection: {diagnostics.relativityValidation.lightDeflection.formulaArcsec.toFixed(3)} arcsec
                  {" "}(target 1.751)
                </div>
                <div>
                  Shapiro {diagnostics.relativityValidation.shapiroDelay.bodyId}:{" "}
                  {diagnostics.relativityValidation.shapiroDelay.microseconds != null
                    ? `${diagnostics.relativityValidation.shapiroDelay.microseconds.toFixed(2)} us`
                    : "--"}
                </div>
                <div>
                  Time dilation:{" "}
                  {diagnostics.timeDilationUsPerDay != null
                    ? `${diagnostics.timeDilationUsPerDay.toFixed(2)} us/day`
                    : "--"}
                </div>
                <div>
                  Horizons validation: {diagnostics.horizonsValidationStatus}
                  {diagnostics.relativityValidation.horizons.modes[1]?.rmsPositionKm != null
                    ? ` / 1PN RMS ${diagnostics.relativityValidation.horizons.modes[1]!.rmsPositionKm!.toExponential(2)} km`
                    : "--"}{" "}
                  ({Math.round(diagnostics.relativityValidation.horizons.progress * 100)}%)
                </div>
                <div>
                  Conservation drift E/L: {diagnostics.relEnergyDrift.toExponential(2)} /{" "}
                  {diagnostics.relAngMomDrift.toExponential(2)}
                </div>
                <div className="science-section-title mt-2">Galactic validation</div>
                <div>
                  Source:{" "}
                  {diagnostics.galacticValidationSource === "gaia-dr3-kinematics"
                    ? "Gaia DR3 kinematics"
                    : "unavailable"}{" "}
                  / {diagnostics.galacticValidationStatus}
                </div>
                <div>
                  Gaia sample: {diagnostics.galacticValidation.sampleCount} stars, median vt{" "}
                  {metric(diagnostics.galacticValidation.medianTangentialVelocityKmS, 1, " km/s")}
                </div>
                <div>
                  Rotation curve R0:{" "}
                  {metric(diagnostics.galacticValidation.circularVelocityAtR0KmS, 1, " km/s")}{" "}
                  (anchor 220-240)
                </div>
                <div>
                  Escape speed R0: {metric(diagnostics.galacticValidation.escapeSpeedAtR0KmS, 1, " km/s")}{" "}
                  (anchor 520-580)
                </div>
                <div>
                  Weak-field |Phi|/c2:{" "}
                  {diagnostics.galacticValidation.weakFieldPhiOverC2 != null
                    ? diagnostics.galacticValidation.weakFieldPhiOverC2.toExponential(2)
                    : "--"}{" "}
                  / clock{" "}
                  {metric(diagnostics.galacticValidation.weakFieldClockOffsetUsPerDay, 1, " us/day")}
                </div>
                <div className="science-section-title mt-2">Cosmology validation</div>
                <div>
                  Model: Planck 2018 flat LCDM / {diagnostics.cosmologyConfidence}
                </div>
                <div>
                  H0 {metric(diagnostics.cosmologyValidation.params.h0KmSmpc, 1, " km/s/Mpc")}
                  {" "}Omega_m {metric(diagnostics.cosmologyValidation.params.omegaMatter, 3)}
                  {" "}Omega_L {metric(diagnostics.cosmologyValidation.params.omegaLambda, 3)}
                </div>
                <div>
                  Age z=0: {metric(diagnostics.cosmologyValidation.ageNowGyr, 2, " Gyr")}
                  {" "}Hubble time {metric(diagnostics.cosmologyValidation.hubbleTimeGyr, 2, " Gyr")}
                </div>
                {diagnostics.cosmologyValidation.anchors.map((anchor) => (
                  <div key={anchor.redshift}>
                    z={anchor.redshift}: a={anchor.scaleFactor.toFixed(3)}, lookback{" "}
                    {metric(anchor.lookbackTimeGyr, 2, " Gyr")}, DL{" "}
                    {metric(anchor.luminosityDistanceMpc, 0, " Mpc")}, mu{" "}
                    {metric(anchor.distanceModulusMag, 2, " mag")}
                  </div>
                ))}
                <div className="science-section-title mt-2">Strong-field relativity</div>
                <div>
                  Kernel: {diagnostics.strongFieldValidation.kernel} /{" "}
                  <span className="science-status-pill">{diagnostics.strongFieldValidationStatus}</span>
                </div>
                <div>
                  Lab: {diagnostics.strongFieldValidation.labVersion}, preset{" "}
                  {diagnostics.strongFieldValidation.orbitPresetId}
                </div>
                <div>
                  Visualization: {KERR_GEODESIC_VISUALIZATION_ID} / geodesic-backed tracks
                </div>
                <div>
                  Schwarzschild anchors: horizon {diagnostics.strongFieldValidation.schwarzschild.horizonRadiusM.toFixed(0)}M,
                  photon sphere {diagnostics.strongFieldValidation.schwarzschild.photonSphereRadiusM.toFixed(0)}M,
                  ISCO {diagnostics.strongFieldValidation.schwarzschild.iscoRadiusM.toFixed(0)}M
                </div>
                <div>
                  Kerr a={diagnostics.strongFieldValidation.kerr.spinA.toFixed(2)}: r+{" "}
                  {metric(diagnostics.strongFieldValidation.kerr.outerHorizonRadiusM, 3, "M")},
                  ISCO pro/retro{" "}
                  {metric(diagnostics.strongFieldValidation.kerr.progradeIscoRadiusM, 3, "M")} /{" "}
                  {metric(diagnostics.strongFieldValidation.kerr.retrogradeIscoRadiusM, 3, "M")}
                </div>
                <div>
                  Hamiltonian drift null/timelike:{" "}
                  {diagnostics.strongFieldValidation.integration.nullHamiltonianDrift.toExponential(2)} /{" "}
                  {diagnostics.strongFieldValidation.integration.timelikeHamiltonianDrift.toExponential(2)}
                </div>
                <div>
                  Capture/escape: {diagnostics.strongFieldValidation.integration.captureStatus} /{" "}
                  {diagnostics.strongFieldValidation.integration.escapeStatus}; light deflection{" "}
                  {diagnostics.strongFieldValidation.weakFieldLightDeflection.formulaArcsec.toFixed(2)} arcsec at b=
                  {diagnostics.strongFieldValidation.weakFieldLightDeflection.impactParameterM.toFixed(2)}M
                </div>
                <div>
                  Probe null geodesic: {diagnostics.strongFieldValidation.probe.geodesicStatus} /{" "}
                  {diagnostics.strongFieldValidation.probe.probeStatus}, H drift{" "}
                  {diagnostics.strongFieldValidation.probe.maxHamiltonianConstraintAbs.toExponential(1)}
                </div>
                <div>Presentation: Orbit Atlas visual guide. Dynamics: live N-body/EIH 1PN. Validation: GR targets + offline JPL Horizons.</div>
                <div>Galactic dynamics: analytic potential validation/teaching layer, not full GR cosmology.</div>
                <div>Cosmology: analytic FRW validation layer, not N-body cosmological structure formation.</div>
                <div>Strong-field lab: exact test-particle/light geodesics; solar-system dynamics remains EIH 1PN.</div>
              </div>
            ) : null}
          </>
        ) : <p className="text-[11px] leading-5 text-white/[0.48]">Choose a non-solar body with a bound heliocentric state to inspect live elements.</p>}
        <div className="border-t border-white/8 pt-2 text-[9px] uppercase tracking-[0.08em] text-[#d7c48e]/70">{scaleMode === "compressed" ? "Presentation-compressed: view only" : "Physical scale: view only"}</div>
      </div>
    </aside>
  );
}
