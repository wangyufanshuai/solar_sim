/** Snapshot written each frame by `DiagnosticsMonitorBridge` for sidebar polling. */
export type SimulationDiagnostics = {
  /** `simDaysRef` at sample time (simulation calendar days). */
  simDays: number;
  energyJ: number;
  angMomNormKgM2S: number;
  /** |E - E0| / max(|E0|, ε) */
  relEnergyDrift: number;
  /** |L - L0| / max(|L0|, ε) */
  relAngMomDrift: number;
  /** Ring buffer: relative energy drift samples (same units as relEnergyDrift). */
  energyHistory: readonly number[];
  /** Ring buffer: relative angular-momentum drift. */
  angMomHistory: readonly number[];
  /** EMA of estimated Mercury perihelion precession (arcsec / century). */
  mercuryPrecessionArcsecPerCentury: number | null;
  /** User-facing status line. */
  mercuryPrecessionStatus: string;
  /** Schwarzschild surface emission z for selected body; null if N/A. */
  gravitationalRedshiftZ: number | null;
  /** True when drift exceeds soft threshold (suggest smaller timestep). */
  conservationWarn: boolean;
};
