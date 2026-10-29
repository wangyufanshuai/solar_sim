import { createKerrRelativityStudioSummary } from "./kerrRelativityStudio";
import { MERCURY_GR_TARGET_ARCSEC_PER_CENTURY } from "./relativityValidation";
import {
  ATLAS_RELATIVITY_BENCHMARK_PROFILE,
  ATLAS_RELATIVITY_KERNEL_ID,
  ATLAS_RELATIVITY_VERIFICATION_VERSION,
  createAtlasRelativityVerificationSummary,
} from "./atlasRelativityVerification";
import type {
  AtlasRelativityChartProfile,
  AtlasRelativityChartSummary,
  AtlasRelativityChartVersion,
  AtlasRelativityIscoBar,
  AtlasRelativityMercuryCurvePoint,
  AtlasRelativityVerificationSummary,
  KerrRelativityStudioSummary,
  SimulationDiagnostics,
} from "./simulationDiagnosticsTypes";

export const ATLAS_RELATIVITY_CHART_VERSION: AtlasRelativityChartVersion =
  "v74-relativity-verification-charts";

export const ATLAS_RELATIVITY_CHART_PROFILE: AtlasRelativityChartProfile =
  "v74-newtonian-eih-kerr-readout-curves";

export const ATLAS_RELATIVITY_CHART_BOUNDARY =
  "Local v74 chart readouts over existing v73 relativity verification metadata, weak-field diagnostics and Kerr Studio summaries. Charts are presentation-layer visual aids only: no NASA/JPL precision ephemeris replacement, no numerical relativity, no online validation, no new sky assets, no SolarSystemIntegrator mutation, no worker physics mutation, no EIH 1PN mutation and no Kerr kernel mutation.";

const MERCURY_CURVE_FRACTIONS = [0, 0.25, 0.5, 0.75, 1] as const;

export type CreateAtlasRelativityChartSummaryArgs = {
  diagnostics?: SimulationDiagnostics | null;
  kerrStudioSummary?: KerrRelativityStudioSummary | null;
  verificationSummary?: AtlasRelativityVerificationSummary | null;
};

export function createAtlasRelativityChartSummary({
  diagnostics = null,
  kerrStudioSummary = null,
  verificationSummary = null,
}: CreateAtlasRelativityChartSummaryArgs = {}): AtlasRelativityChartSummary {
  const kerr = kerrStudioSummary ?? createKerrRelativityStudioSummary();
  const verification =
    verificationSummary ??
    createAtlasRelativityVerificationSummary({
      diagnostics,
      kerrStudioSummary: kerr,
    });
  const mercury = diagnostics?.relativityValidation?.mercuryPrecession ?? null;
  const target =
    finiteOrNull(mercury?.targetArcsecPerCentury) ??
    MERCURY_GR_TARGET_ARCSEC_PER_CENTURY;
  const onePn =
    finiteOrNull(mercury?.onePnArcsecPerCentury) ??
    target;
  const newtonian =
    finiteOrNull(mercury?.newtonArcsecPerCentury) ??
    0;
  const weakFieldReadyCount = verification.readouts.filter(
    (readout) => readout.classification === "weak-field-observable" && readout.status === "ready",
  ).length;

  return {
    version: ATLAS_RELATIVITY_CHART_VERSION,
    status: verification.status,
    chartProfile: ATLAS_RELATIVITY_CHART_PROFILE,
    verificationVersion: ATLAS_RELATIVITY_VERIFICATION_VERSION,
    benchmarkProfile: ATLAS_RELATIVITY_BENCHMARK_PROFILE,
    kerrKernelId: ATLAS_RELATIVITY_KERNEL_ID,
    mercuryCurve: mercuryCurve({ newtonian, onePn, target }),
    mercuryTargetArcsecPerCentury: target,
    mercuryEihOnePnArcsecPerCentury: onePn,
    mercuryNewtonianArcsecPerCentury: newtonian,
    weakFieldReadyCount,
    weakFieldObservableCount: verification.weakFieldObservableCount,
    kerrIscoBars: iscoBars(kerr),
    hamiltonianDrift: {
      value: kerr.maxHamiltonianDrift,
      formatted: kerr.maxHamiltonianDrift.toExponential(2),
      classification: "numerical-health-only",
      boundary: "Kerr Hamiltonian drift is a charted numerical-health monitor only, not an astrophysical observable.",
    },
    physicsMutation: "not-applied",
    skyAssetMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    trustedBoundary: ATLAS_RELATIVITY_CHART_BOUNDARY,
  };
}

function mercuryCurve(args: {
  newtonian: number;
  onePn: number;
  target: number;
}): readonly AtlasRelativityMercuryCurvePoint[] {
  return MERCURY_CURVE_FRACTIONS.map((fraction) => ({
    fractionOfCentury: fraction,
    label: `${Math.round(fraction * 100)}%`,
    newtonianArcsec: round3(args.newtonian * fraction),
    eihOnePnArcsec: round3(args.onePn * fraction),
    targetArcsec: round3(args.target * fraction),
  }));
}

function iscoBars(kerr: KerrRelativityStudioSummary): readonly AtlasRelativityIscoBar[] {
  return [
    {
      id: "prograde",
      label: "Prograde ISCO",
      radiusM: round3(kerr.progradeIscoRadiusM),
    },
    {
      id: "retrograde",
      label: "Retrograde ISCO",
      radiusM: round3(kerr.retrogradeIscoRadiusM),
    },
    {
      id: "split",
      label: "Spin split",
      radiusM: round3(kerr.iscoSplitM),
    },
  ];
}

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
