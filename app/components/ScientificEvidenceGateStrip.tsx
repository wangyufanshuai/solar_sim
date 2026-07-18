"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CURRENT_SCIENTIFIC_EXPERIENCE_EVIDENCE_V7 } from "../lib/scientificExperienceEvidenceV7";
import type { AtlasScientificEvidenceSummaryV7 } from "../lib/relativityPromotionEvidenceV7";

const evidence = CURRENT_SCIENTIFIC_EXPERIENCE_EVIDENCE_V7;

export default function ScientificEvidenceGateStrip() {
  const [promotionEvidence, setPromotionEvidence] =
    useState<AtlasScientificEvidenceSummaryV7 | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/data/scientific-evidence-v7-summary.json", {
      cache: "force-cache",
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : null)
      .then((value: AtlasScientificEvidenceSummaryV7 | null) => {
        if (value?.version === "v188-relativity-promotion-evidence-v7") {
          setPromotionEvidence(value);
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  const gates = [
    ["目录", evidence.catalog],
    ["观测", evidence.observation],
    ["星历", evidence.relativity],
    ["Kerr", evidence.kerr],
    ["性能", evidence.performance],
    ["回归", evidence.regression],
  ] as const;

  return (
    <div
      className="border-b border-white/8 bg-white/[0.018] px-3 py-2"
      data-scientific-experience-evidence-v7={evidence.version}
      data-scientific-evidence-release-decision={evidence.releaseDecision}
      data-scientific-evidence-absolute-gate={String(evidence.relativity.absoluteGatePassed)}
      data-scientific-evidence-comparative-improvement={String(evidence.relativity.comparativeImprovementDemonstrated)}
      data-scientific-evidence-per-body-comparison={String(evidence.relativity.perBodyComparisonComplete)}
      data-scientific-evidence-promotion-applied={String(evidence.promotionApplied)}
      data-scientific-evidence-default-kernel={evidence.defaultKernel}
      data-scientific-evidence-blockers={evidence.blockers.join(",") || "none"}
      data-scientific-promotion-v7={promotionEvidence?.version ?? "loading"}
      data-scientific-promotion-v7-status={promotionEvidence?.decision.status ?? "shadow-retained"}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {gates.map(([label, gate]) => {
          const verified = gate.status === "verified" && gate.independent;
          return (
            <span
              key={label}
              title={gate.measured}
              className={`inline-flex h-6 items-center gap-1 rounded border px-1.5 text-[9px] ${
                verified
                  ? "border-emerald-200/18 bg-emerald-200/[0.055] text-emerald-100/72"
                  : "border-amber-200/16 bg-amber-200/[0.045] text-amber-100/68"
              }`}
            >
              {verified
                ? <CheckCircle2 className="h-3 w-3" />
                : <AlertTriangle className="h-3 w-3" />}
              {label}
            </span>
          );
        })}
        <span
          className="inline-flex h-6 items-center gap-1 rounded border border-amber-200/16 bg-amber-200/[0.045] px-1.5 text-[9px] text-amber-100/68"
          title={`V2 ${evidence.relativity.candidatePositionRmsKm.toFixed(6)} km; legacy ${evidence.relativity.legacyPositionRmsKm.toFixed(6)} km`}
        >
          <AlertTriangle className="h-3 w-3" />
          V2 未证明优于 legacy
        </span>
        {promotionEvidence ? (
          <span
            className="inline-flex min-h-6 items-center gap-1 rounded border border-cyan-200/16 bg-cyan-200/[0.045] px-1.5 py-1 text-[9px] text-cyan-100/72"
            title={`逐天体检查 ${promotionEvidence.checkpointCount} 个时间点 / ${promotionEvidence.bodyCount} 个天体；阻塞项：${promotionEvidence.decision.blockers.join(", ") || "无"}`}
          >
            <AlertTriangle className="h-3 w-3" />
            V2 逐天体证据：{promotionEvidence.decision.status === "shadow-retained" ? "继续 shadow" : "具备晋级资格，尚未应用"}
          </span>
        ) : null}
        <span className="ml-auto text-[9px] text-white/42">
          默认内核：{evidence.defaultKernel}
        </span>
      </div>
    </div>
  );
}
