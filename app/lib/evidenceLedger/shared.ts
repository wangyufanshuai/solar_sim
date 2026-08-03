/* v250 Evidence Ledger domain: shared. */
import type { EvidenceClaim, EvidenceClaimConfidence, EvidenceClaimPassport, EvidenceClaimStatus, EvidencePassportFormula, EvidencePassportMetric, EvidenceRelatedView, RelativityConfidence, ResearchConfidence, SimulationDiagnostics } from "../simulationDiagnosticsTypes";

export type EvidenceClaimWithoutPassport = Omit<EvidenceClaim, "passport">;


export function withPassport(
  claim: EvidenceClaimWithoutPassport,
  passport: EvidenceClaimPassport,
): EvidenceClaim {
  return { ...claim, passport };
}


export function createPassport(args: {
  claim: EvidenceClaimWithoutPassport;
  sourceChain: readonly string[];
  method: string;
  formulas?: readonly EvidencePassportFormula[];
  metrics: readonly EvidencePassportMetric[];
  confidenceRationale: string;
  assumptions: readonly string[];
  limitations: readonly string[];
  relatedViews: readonly EvidenceRelatedView[];
}): EvidenceClaimPassport {
  const formulas = args.formulas ?? [];
  const metricSummary = args.metrics
    .map((item) => {
      const target = item.target ? ` target ${item.target}` : "";
      const tolerance = item.tolerance ? ` tolerance/error ${item.tolerance}` : "";
      return `${item.label}: ${item.value}${target}${tolerance}`;
    })
    .join("; ");
  const formulaSummary =
    formulas.length > 0
      ? ` Formula references: ${formulas.map((item) => `${item.label} (${item.expression})`).join("; ")}`
      : "";

  return {
    claimId: args.claim.id,
    sourceChain: args.sourceChain,
    method: args.method,
    formulas,
    metrics: args.metrics,
    confidenceRationale: args.confidenceRationale,
    assumptions: args.assumptions,
    limitations: args.limitations,
    relatedViews: args.relatedViews,
    sections: [
      {
        id: "source-chain",
        title: "Source chain",
        body: `${args.sourceChain.join(" -> ")}. Source: ${args.claim.source}. Model: ${args.claim.model}.`,
      },
      {
        id: "method",
        title: "Formula / method",
        body: `${args.method}${formulaSummary}`,
      },
      {
        id: "metrics",
        title: "Metric / error",
        body: metricSummary || `${args.claim.metric}; ${args.claim.error}`,
      },
      {
        id: "confidence",
        title: "Confidence rationale",
        body: args.confidenceRationale,
      },
      {
        id: "assumptions",
        title: "Assumptions",
        body: args.assumptions.join("; "),
      },
      {
        id: "limitations",
        title: "Trusted boundary",
        body: `${args.claim.boundary} ${args.limitations.join(" ")}`,
      },
      {
        id: "related-views",
        title: "Related UI panels",
        body: args.relatedViews.join(", "),
      },
    ],
  };
}


export function metric(
  id: string,
  label: string,
  value: string,
  status: EvidenceClaimStatus,
  target?: string,
  tolerance?: string,
): EvidencePassportMetric {
  return {
    id,
    label,
    value,
    target,
    tolerance,
    status,
  };
}


export function formula(
  id: string,
  label: string,
  expression: string,
  variables: string,
  applicability: string,
): EvidencePassportFormula {
  return {
    id,
    label,
    expression,
    variables,
    applicability,
  };
}


export function ledgerStatus(claims: readonly EvidenceClaim[]): EvidenceClaimStatus {
  if (claims.some((claim) => claim.status === "failed")) return "failed";
  if (claims.some((claim) => claim.status === "pending")) return "pending";
  return "ready";
}


export function mapHorizonsStatus(status: SimulationDiagnostics["horizonsValidationStatus"] | undefined): EvidenceClaimStatus {
  if (status === "complete") return "ready";
  if (status === "failed") return "failed";
  return "pending";
}


export function mapReadyFailedStatus(status: "pending" | "ready" | "failed" | undefined): EvidenceClaimStatus {
  if (status === "ready") return "ready";
  if (status === "failed") return "failed";
  return "pending";
}


export function mapRelativityConfidence(
  confidence: RelativityConfidence | ResearchConfidence | undefined,
): EvidenceClaimConfidence {
  if (confidence === "validated") return "validated";
  if (confidence === "horizons-checked") return "horizons-checked";
  if (confidence === "formula-checked" || confidence === "diagnostic") return "formula-checked";
  return "visual";
}


export function formatNumber(value: number | null | undefined, digits = 3, suffix = ""): string {
  if (value == null || !Number.isFinite(value)) return `unavailable${suffix}`;
  const abs = Math.abs(value);
  const text =
    abs !== 0 && (abs >= 10_000 || abs < 0.001)
      ? value.toExponential(2)
      : value.toLocaleString("en-US", { maximumFractionDigits: digits });
  return `${text}${suffix}`;
}
