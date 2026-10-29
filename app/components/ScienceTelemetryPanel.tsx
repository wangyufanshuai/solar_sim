"use client";

import { ChevronLeft, LineChart as LineChartIcon } from "lucide-react";
import { useEffect, useMemo, useState, type MutableRefObject } from "react";
import type { SimulationDiagnostics } from "../lib/simulationDiagnosticsTypes";
import type { TelemetrySeriesState } from "../lib/telemetryTypes";
import { telemetrySamplesChronological } from "../lib/telemetryTypes";
import { KERR_GEODESIC_VISUALIZATION_ID } from "../lib/kerrGeodesicVisualization";

type ScienceTelemetryPanelProps = {
  telemetrySeriesRef: MutableRefObject<TelemetrySeriesState | null>;
  simulationDiagnosticsRef: MutableRefObject<SimulationDiagnostics | null>;
  selectedBodyIndex: number | null;
  relativityEnabled: boolean;
  mainSidebarOffsetPx?: number;
};

function TinyStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 font-mono text-[12px] text-slate-200">{value}</div>
    </div>
  );
}

export default function ScienceTelemetryPanel({
  telemetrySeriesRef,
  simulationDiagnosticsRef,
  selectedBodyIndex,
  relativityEnabled,
  mainSidebarOffsetPx = 288,
}: ScienceTelemetryPanelProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (selectedBodyIndex === null) {
      setCollapsed(true);
    }
  }, [selectedBodyIndex]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 400);
    return () => window.clearInterval(id);
  }, []);

  const series = telemetrySeriesRef.current;
  const diagnostics = simulationDiagnosticsRef.current;
  const rows = useMemo(
    () => {
      void tick;
      return series ? telemetrySamplesChronological(series) : [];
    },
    [series, tick],
  );
  const latest = rows.at(-1) ?? null;

  if (collapsed) {
    return (
      <div
        className="pointer-events-auto fixed top-1/2 z-[85] -translate-y-1/2 max-sm:!left-0"
        style={{ left: mainSidebarOffsetPx }}
      >
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex h-12 w-10 items-center justify-center rounded-r-xl border border-white/8 bg-[rgba(14,14,16,0.72)] text-slate-400 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-colors hover:bg-[rgba(20,20,24,0.84)] hover:text-white/72"
          title="Open telemetry"
          aria-label="Open telemetry"
        >
          <LineChartIcon className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    );
  }

  return (
    <aside
      className="pointer-events-auto fixed top-20 z-[85] w-[min(260px,calc(100vw-2rem))] rounded-[22px] border border-white/8 bg-[rgba(12,12,14,0.76)] shadow-[0_24px_70px_rgba(0,0,0,0.38)] backdrop-blur-2xl"
      style={{ left: Math.max(16, mainSidebarOffsetPx + 16) }}
      aria-label="Telemetry"
    >
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
            Telemetry
          </div>
          <div className="mt-1 text-[12px] text-slate-300">
            {series?.bodyId ?? "No target selected"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/6 hover:text-white/74"
          aria-label="Collapse telemetry"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="space-y-3 px-4 py-4">
        {selectedBodyIndex === null || !series || !latest ? (
          <p className="text-[12px] leading-6 text-slate-400">
            Double-click or lock a body to show an orbit telemetry snapshot here.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <TinyStat label="Sun distance" value={`${latest.sunDistanceAu.toFixed(4)} AU`} />
              <TinyStat
                label="Radial velocity"
                value={`${(latest.radialVelocityMs / 1000).toFixed(2)} km/s`}
              />
              <TinyStat
                label="Eccentricity"
                value={
                  latest.eccentricity != null ? latest.eccentricity.toFixed(5) : "--"
                }
              />
              <TinyStat
                label="Orbit period"
                value={
                  latest.orbitalPeriodDays != null
                    ? `${latest.orbitalPeriodDays.toFixed(2)} d`
                    : "--"
                }
              />
            </div>

            <div className="rounded-[18px] bg-white/[0.03] px-3 py-3 text-[11px] leading-6 text-slate-400">
              <div>Samples {rows.length}</div>
              <div>Relativity {relativityEnabled ? "On" : "Off"}</div>
              <div>
                1PN share:{" "}
                {latest.pnAccelFraction != null
                  ? latest.pnAccelFraction.toExponential(2)
                  : "--"}
              </div>
            </div>
            {diagnostics ? (
              <div className="science-panel px-3 py-3 text-[11px] leading-6 text-slate-400">
                <div className="science-section-title mb-1">
                  Research validation
                </div>
                <div>Confidence {diagnostics.relativityConfidence}</div>
                <div>
                  Mercury 1PN{" "}
                  {diagnostics.relativityValidation.mercuryPrecession.onePnArcsecPerCentury != null
                    ? `${diagnostics.relativityValidation.mercuryPrecession.onePnArcsecPerCentury.toFixed(2)} arcsec/cy`
                    : "--"}{" "}
                  / target 42.98
                </div>
                <div>
                  Light deflection{" "}
                  {diagnostics.relativityValidation.lightDeflection.formulaArcsec.toFixed(3)} arcsec
                </div>
                <div>
                  Shapiro{" "}
                  {diagnostics.relativityValidation.shapiroDelay.microseconds != null
                    ? `${diagnostics.relativityValidation.shapiroDelay.microseconds.toFixed(2)} us`
                    : "--"}
                </div>
                <div>
                  Time dilation{" "}
                  {diagnostics.timeDilationUsPerDay != null
                    ? `${diagnostics.timeDilationUsPerDay.toFixed(2)} us/day`
                    : "--"}
                </div>
                <div>
                  Horizons {diagnostics.horizonsValidationStatus}{" "}
                  {Math.round(diagnostics.relativityValidation.horizons.progress * 100)}%
                </div>
                <div>
                  Conservation E/L {diagnostics.relEnergyDrift.toExponential(2)} /{" "}
                  {diagnostics.relAngMomDrift.toExponential(2)}
                </div>
                <div className="science-section-title mt-2">Galactic validation</div>
                <div>
                  Source {diagnostics.galacticValidationSource} / {diagnostics.galacticValidationStatus}
                </div>
                <div>
                  Gaia sample {diagnostics.galacticValidation.sampleCount}, median vt{" "}
                  {diagnostics.galacticValidation.medianTangentialVelocityKmS != null
                    ? `${diagnostics.galacticValidation.medianTangentialVelocityKmS.toFixed(1)} km/s`
                    : "--"}
                </div>
                <div>
                  vc(R0){" "}
                  {diagnostics.galacticValidation.circularVelocityAtR0KmS != null
                    ? `${diagnostics.galacticValidation.circularVelocityAtR0KmS.toFixed(1)} km/s`
                    : "--"}{" "}
                  / vesc{" "}
                  {diagnostics.galacticValidation.escapeSpeedAtR0KmS != null
                    ? `${diagnostics.galacticValidation.escapeSpeedAtR0KmS.toFixed(1)} km/s`
                    : "--"}
                </div>
                <div>
                  |Phi|/c2{" "}
                  {diagnostics.galacticValidation.weakFieldPhiOverC2 != null
                    ? diagnostics.galacticValidation.weakFieldPhiOverC2.toExponential(2)
                    : "--"}{" "}
                  teaching
                </div>
                <div className="science-section-title mt-2">Cosmology validation</div>
                <div>
                  Source {diagnostics.cosmologyModelSource} / {diagnostics.cosmologyValidationStatus}
                </div>
                <div>
                  H0 {diagnostics.cosmologyValidation.params.h0KmSmpc.toFixed(1)} Omega_m{" "}
                  {diagnostics.cosmologyValidation.params.omegaMatter.toFixed(3)} age{" "}
                  {diagnostics.cosmologyValidation.ageNowGyr != null
                    ? `${diagnostics.cosmologyValidation.ageNowGyr.toFixed(2)} Gyr`
                    : "--"}
                </div>
                {diagnostics.cosmologyValidation.anchors
                  .filter((anchor) => anchor.redshift === 1 || anchor.redshift === 10)
                  .map((anchor) => (
                    <div key={anchor.redshift}>
                      z={anchor.redshift} a={anchor.scaleFactor.toFixed(3)} lookback{" "}
                      {anchor.lookbackTimeGyr.toFixed(2)} Gyr
                    </div>
                  ))}
                <div>FRW analytic layer, not cosmological N-body</div>
                <div className="science-section-title mt-2">Strong-field relativity</div>
                <div>
                  Kernel {diagnostics.strongFieldValidation.kernel}{" "}
                  <span className="science-status-pill">{diagnostics.strongFieldValidationStatus}</span>
                </div>
                <div>
                  Lab {diagnostics.strongFieldValidation.labVersion} / {diagnostics.strongFieldValidation.orbitPresetId}
                </div>
                <div>Visualization {KERR_GEODESIC_VISUALIZATION_ID} / geodesic-backed tracks</div>
                <div>
                  r+ {diagnostics.strongFieldValidation.kerr.outerHorizonRadiusM.toFixed(3)}M,
                  ISCO {diagnostics.strongFieldValidation.kerr.progradeIscoRadiusM.toFixed(3)} /{" "}
                  {diagnostics.strongFieldValidation.kerr.retrogradeIscoRadiusM.toFixed(3)}M
                </div>
                <div>
                  H drift n/t{" "}
                  {diagnostics.strongFieldValidation.integration.nullHamiltonianDrift.toExponential(1)} /{" "}
                  {diagnostics.strongFieldValidation.integration.timelikeHamiltonianDrift.toExponential(1)}
                </div>
                <div>
                  Probe b={diagnostics.strongFieldValidation.probe.impactParameterM.toFixed(2)}M{" "}
                  {diagnostics.strongFieldValidation.probe.probeStatus}, H{" "}
                  {diagnostics.strongFieldValidation.probe.maxHamiltonianConstraintAbs.toExponential(1)}
                </div>
                <div>Geodesic lab; solar dynamics remains EIH 1PN</div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}
