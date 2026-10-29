"use client";

import { memo } from "react";
import type {
  GaiaCovarianceDiagnosticsV271,
  GaiaEpochPropagationV271,
  GaiaResearchAnalysisFlagsV271,
} from "../lib/gaiaResearchWorkbenchV271";

const PARAMETERS = ["RA", "Dec", "ϖ", "pmRA", "pmDec"] as const;

function GaiaResearchDiagnosticsV271({
  flags,
  diagnostics,
  propagated,
}: {
  flags: GaiaResearchAnalysisFlagsV271;
  diagnostics: GaiaCovarianceDiagnosticsV271;
  propagated: GaiaEpochPropagationV271;
}) {
  return (
    <div className="space-y-2" data-atlas-gaia-diagnostics="v271">
      <div className="grid grid-cols-2 gap-2 text-[9px] sm:grid-cols-3">
        <Flag label="Positive parallax" value={flags.positiveParallax} />
        <Flag label="Distance usable" value={flags.distanceUsable} />
        <Flag label="Non-duplicated" value={flags.nonDuplicated} />
        <Flag label="Photometric clean" value={flags.photometricCleanV8} />
        <Flag label="RV + error" value={flags.radialVelocityWithError} />
        <Flag label="Covariance PSD" value={diagnostics.positiveSemidefinite} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/8 bg-black/25 p-3">
        <p className="mb-2 text-[9px] uppercase tracking-[0.12em] text-slate-500">5×5 correlation matrix</p>
        <table className="w-full min-w-[360px] table-fixed font-mono text-[8px] text-slate-400">
          <thead><tr><th /><>{PARAMETERS.map((parameter) => <th key={parameter} className="p-1 text-cyan-200/60">{parameter}</th>)}</></tr></thead>
          <tbody>{diagnostics.correlation.map((row, rowIndex) => <tr key={PARAMETERS[rowIndex]}><th className="p-1 text-cyan-200/60">{PARAMETERS[rowIndex]}</th>{row.map((value, columnIndex) => <td key={PARAMETERS[columnIndex]} className="p-1 text-center">{value.toFixed(3)}</td>)}</tr>)}</tbody>
        </table>
        <p className="mt-2 text-[8px] text-slate-600">Eigenvalues: {diagnostics.eigenvalues.map((value) => value.toExponential(3)).join(" · ")}</p>
      </div>
      <div className="rounded-xl border border-white/8 p-3 text-[9px] text-slate-400">
        <p className="uppercase tracking-[0.12em] text-slate-500">Epoch propagation</p>
        <p className="mt-1 font-mono text-cyan-100">J{propagated.targetEpochJulianYear.toFixed(2)} · RA {propagated.raDeg.toFixed(7)}° · Dec {propagated.decDeg.toFixed(7)}°</p>
        <p className="mt-1 text-slate-600">Linear tangent-plane propagation; pmRA includes cos(Dec). Analysis/presentation only.</p>
      </div>
      {flags.radialVelocityWithError ? <p className="rounded-lg border border-amber-200/10 p-2 text-[9px] text-amber-100/70">6D display uses the frozen 5D astrometric covariance plus an independent radial-velocity error. Cross-covariances are unavailable and are not invented.</p> : null}
    </div>
  );
}

function Flag({ label, value }: { label: string; value: boolean }) {
  return <div className="rounded-lg border border-white/8 p-2"><span className="text-slate-500">{label}</span><strong className={value ? "ml-1 text-cyan-200" : "ml-1 text-amber-200"}>{value ? "yes" : "no"}</strong></div>;
}

export default memo(GaiaResearchDiagnosticsV271);
