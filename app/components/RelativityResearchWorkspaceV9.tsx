"use client";

import { useMemo, useState } from "react";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import {
  createKerrRayTraceReportV3,
  type KerrRayTraceQualityV3,
} from "../lib/kerrRayTraceV3";
import {
  createRelativityObservableReportV9,
  RELATIVITY_SCIENCE_ASSETS_V9,
} from "../lib/relativityResearchV9";
import {
  KERR_RAY_TRACE_QUALITY_TIERS_V3,
  RELATIVITY_RESEARCH_MODES_V9,
} from "../lib/relativityResearchEvidenceV208";
import { ATLAS_RELATIVITY_RESEARCH_STATUS_V216 } from "../lib/relativityResearchEvidenceV216";
import { ATLAS_RELATIVITY_RESEARCH_STATUS_V230 } from "../lib/relativityResearchEvidenceV230";

type WorkspaceId =
  | "solar-dynamics"
  | "stm-fit"
  | "variational-stm"
  | "strong-field"
  | "dense-kerr"
  | "optics"
  | "evidence";

const WORKSPACES: ReadonlyArray<{ id: WorkspaceId; label: string }> = [
  { id: "solar-dynamics", label: "Solar Dynamics" },
  { id: "stm-fit", label: "STM Fit" },
  { id: "variational-stm", label: "Variational STM" },
  { id: "strong-field", label: "Strong Field" },
  { id: "dense-kerr", label: "Dense Kerr" },
  { id: "optics", label: "Optics" },
  { id: "evidence", label: "Evidence" },
];

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded border border-white/8 bg-black/18 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.11em] text-white/35">{label}</div>
      <div className="mt-0.5 break-words font-mono text-[10px] text-cyan-50/78">{value}</div>
    </div>
  );
}

function ReproductionCommand({ children }: { children: string }) {
  return (
    <code className="block overflow-x-auto rounded border border-white/8 bg-black/25 px-2 py-1.5 text-[9px] leading-4 text-cyan-50/62">
      {children}
    </code>
  );
}

export default function RelativityResearchWorkspaceV9() {
  const [workspace, setWorkspace] = useState<WorkspaceId>("solar-dynamics");
  const [quality, setQuality] = useState<KerrRayTraceQualityV3>("interactive");
  const deliveryProfile = getAtlasDeliveryProfile();
  const isLite = deliveryProfile === "vercel-lite";
  const observable = useMemo(
    () =>
      createRelativityObservableReportV9({
        solarGmKm3PerS2: 1.3271244004127942e11,
        impactParameterKm: 695_700,
        emitterDistanceKm: 149_597_870.7,
        receiverDistanceKm: 227_939_200,
        linkSeparationKm: 377_000_000,
        radiusKm: 695_700,
        semiMajorAxisKm: 57_909_050,
        eccentricity: 0.20563,
        solarSpinAngularMomentumKgM2PerSecond: 1.92e41,
      }),
    [],
  );
  const kerr = useMemo(
    () => createKerrRayTraceReportV3({ quality, spinA: 0.9, observerThetaRad: Math.PI * 0.39 }),
    [quality],
  );
  const v230 = ATLAS_RELATIVITY_RESEARCH_STATUS_V230;

  return (
    <section
      className="border-b border-cyan-100/10 px-3 py-3"
      data-atlas-relativity-research-workspace-v9
      data-atlas-relativity-research-status={v230.releaseClassification}
      data-atlas-relativity-default-kernel={v230.defaultSolarKernel}
      data-atlas-relativity-runtime-promotion="false"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/55">
            Relativity Research V12
          </div>
          <p className="mt-1 text-[10px] leading-4 text-white/45">
            研究模型 / shadow / 未写入默认积分器。完整证据仅在 standalone 与桌面研究环境提供；Lite
            只展示经过校验的摘要与能力边界。
          </p>
        </div>
        <span className="rounded border border-amber-200/20 bg-amber-200/[0.06] px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-amber-100/70">
          research candidate
        </span>
      </div>

      <div
        className="grid grid-cols-2 overflow-hidden rounded border border-cyan-100/12 sm:grid-cols-4 lg:grid-cols-7"
        role="tablist"
        aria-label="Relativity research workspaces"
      >
        {WORKSPACES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={workspace === item.id}
            onClick={() => setWorkspace(item.id)}
            className={workspace === item.id
              ? "atlas-accessible-focus min-h-10 bg-cyan-100/[0.12] px-2 py-2 text-[10px] text-cyan-50"
              : "atlas-accessible-focus min-h-10 bg-black/16 px-2 py-2 text-[10px] text-white/50 hover:bg-white/[0.06] hover:text-white/75"}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-2 rounded border border-white/8 bg-black/12 p-2" role="tabpanel">
        {workspace === "solar-dynamics" ? (
          <div className="space-y-2">
            <div className="grid gap-1.5 sm:grid-cols-3">
              <Readout label="Reference frame" value="ICRF / J2000 barycentric" />
              <Readout label="Time scale" value="TDB" />
              <Readout label="Default kernel" value="legacy-eih-1pn" />
            </div>
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {RELATIVITY_RESEARCH_MODES_V9.map((mode) => (
                <div key={mode} className="rounded border border-white/7 px-2 py-1 text-[10px] text-white/54">
                  {mode}
                </div>
              ))}
            </div>
            <p className="text-[10px] leading-4 text-amber-100/62">
              DE440/NAIF 与冻结 Horizons 参考源严格分列。原始传播、拟合结果和 100 年诊断不会混用；
              100 年结果不参与晋级资格。
            </p>
          </div>
        ) : null}

        {workspace === "stm-fit" ? (
          <div className="space-y-2">
            <div className="grid gap-1.5 sm:grid-cols-3">
              <Readout label="Calibration weighted RMS" value={ATLAS_RELATIVITY_RESEARCH_STATUS_V216.stm.calibrationWeightedRms.toFixed(6)} />
              <Readout label="Grouped-PRESS LOO RMS" value={ATLAS_RELATIVITY_RESEARCH_STATUS_V216.stm.leaveOneDayOutRms.toFixed(6)} />
              <Readout label="Method" value="finite-difference sensitivity" />
              <Readout label="365 d raw / fit" value={`${ATLAS_RELATIVITY_RESEARCH_STATUS_V216.stm.legacyRaw365PositionRmsKm.toFixed(3)} / ${ATLAS_RELATIVITY_RESEARCH_STATUS_V216.stm.legacyFit365PositionRmsKm.toFixed(3)} km`} />
              <Readout label="10 y raw / fit" value={`${ATLAS_RELATIVITY_RESEARCH_STATUS_V216.stm.legacyRawTenYearPositionRmsKm.toFixed(3)} / ${ATLAS_RELATIVITY_RESEARCH_STATUS_V216.stm.legacyFitTenYearPositionRmsKm.toFixed(3)} km`} />
              <Readout label="Blind holdout" value="no improvement" />
            </div>
            <p className="text-[10px] leading-4 text-amber-100/62">
              旧结果明确重命名为有限差分 sensitivity：短弧校准降低残差，但 365 日和十年盲测均恶化。
              这是可复现负结果，raw 证据没有被拟合覆盖。
            </p>
          </div>
        ) : null}

        {workspace === "variational-stm" ? (
          <div className="space-y-2" data-atlas-variational-stm-v12>
            <div className="grid gap-1.5 sm:grid-cols-3">
              <Readout label="Integrated system" value={`72 + 72×66 = ${v230.variationalStm.integratedStateAndPhiDimension}`} />
              <Readout label="Effective rank" value={`${v230.variationalStm.effectiveRank}/66`} />
              <Readout label="Unregularized condition" value={v230.variationalStm.unregularizedConditionNumber.toFixed(3)} />
              <Readout label="Jacobian direction check" value={v230.variationalStm.directionalJacobianMaxRelativeError.toExponential(3)} />
              <Readout label="DOP853 / IAS15 at 365 d" value={`${v230.variationalStm.dop853Fit365PositionRmsKm.toFixed(6)} / ${v230.variationalStm.ias15Fit365PositionRmsKm.toFixed(6)} km`} />
              <Readout label="Cross-solver difference" value={`${v230.variationalStm.crossSolverDifferenceM.toFixed(6)} m`} />
            </div>
            <p className="text-[10px] leading-4 text-amber-100/62">
              当前是 smoke 证据：真实联合积分 Φ(72×66) 与 IAS15 交叉传播已接通，但 30 日校准、
              3652.5 日盲测和确定性双重完整重跑尚未完成，因此保持 shadow。
            </p>
            {!isLite ? <ReproductionCommand>{v230.reproduction.variationalStm}</ReproductionCommand> : null}
          </div>
        ) : null}

        {workspace === "strong-field" ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              {KERR_RAY_TRACE_QUALITY_TIERS_V3.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setQuality(tier)}
                  aria-pressed={quality === tier}
                  className={quality === tier
                    ? "atlas-accessible-focus min-h-10 rounded border border-cyan-100/25 bg-cyan-100/[0.1] px-2 py-1 text-[10px] text-cyan-50"
                    : "atlas-accessible-focus min-h-10 rounded border border-white/8 px-2 py-1 text-[10px] text-white/48"}
                >
                  {tier}
                </button>
              ))}
            </div>
            <div className="grid gap-1.5 sm:grid-cols-3">
              <Readout label="Critical curve RMS radius" value={`${kerr.criticalCurveRadiusScreenM.toFixed(6)} M`} />
              <Readout label="V216 CPU classification" value={`${(ATLAS_RELATIVITY_RESEARCH_STATUS_V216.kerrCrossValidation.classificationAgreement * 100).toFixed(1)}% / 25 rays`} />
              <Readout label="Kerr-Schild null" value={ATLAS_RELATIVITY_RESEARCH_STATUS_V216.kerrCrossValidation.maxKerrSchildNullConstraint.toExponential(3)} />
            </div>
            <p className="text-[10px] leading-4 text-white/48">
              Carter/Mino 与 Kerr–Schild 是独立参考路径。解析薄盘是教学发射模型，不是 GRMHD、
              数值相对论或黑洞并合模拟。
            </p>
          </div>
        ) : null}

        {workspace === "dense-kerr" ? (
          <div className="space-y-2" data-atlas-dense-kerr-v6>
            <div className="grid gap-1.5 sm:grid-cols-3">
              <Readout label="Frozen ray set" value={`${v230.denseKerr.plannedRayCount} rays / ${v230.denseKerr.plannedShardCount} shards`} />
              <Readout label="Coverage" value={`${v230.denseKerr.canonicalRayCount} canonical + ${v230.denseKerr.lowDiscrepancyRayCount} low-discrepancy + ${v230.denseKerr.criticalBracketRayCount} brackets`} />
              <Readout label="Release shards complete" value={`${v230.denseKerr.completedReleaseShardCount}/${v230.denseKerr.plannedShardCount}`} />
              <Readout label="Carter canonical drift" value={v230.denseKerr.canonicalCarterMaxInvariantDrift.toExponential(3)} />
              <Readout label="Release gate" value={`< ${v230.denseKerr.releaseInvariantGate.toExponential(0)}`} />
              <Readout label="Partial aggregation" value="forbidden" />
            </div>
            <p className="text-[10px] leading-4 text-amber-100/62">
              25 条 canonical 射线已完成 Carter/Mino 与 Kerr–Schild 的 fine/finer × A/B
              交叉验证；3097 条全量射线仍按 49 个原子 shard 待执行。任何部分结果、旧代码哈希或非物理终态都不会进入发布聚合。
            </p>
            {!isLite ? (
              <div className="space-y-1">
                <ReproductionCommand>{v230.reproduction.denseKerrPlan}</ReproductionCommand>
                <ReproductionCommand>{v230.reproduction.denseKerrRun}</ReproductionCommand>
              </div>
            ) : null}
          </div>
        ) : null}

        {workspace === "optics" ? (
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-5">
            <Readout label="Solar limb deflection" value={`${(observable.schwarzschildDeflectionRad * 206264.806).toFixed(6)} arcsec`} />
            <Readout label="Shapiro delay" value={`${(observable.shapiroDelaySeconds * 1e6).toFixed(3)} us`} />
            <Readout label="Solar redshift z" value={observable.gravitationalRedshift.toExponential(4)} />
            <Readout label="Mercury advance/orbit" value={observable.perihelionAdvanceRadPerOrbit.toExponential(4)} />
            <Readout label="LT node rate" value={`${observable.lenseThirringNodalRateRadPerSecond.toExponential(4)} rad/s`} />
          </div>
        ) : null}

        {workspace === "evidence" ? (
          <div className="space-y-2">
            <div className="grid gap-1.5 sm:grid-cols-3">
              <Readout label="Delivery profile" value={deliveryProfile} />
              <Readout label="NAIF assets" value={isLite ? "not distributed in Lite" : `${RELATIVITY_SCIENCE_ASSETS_V9.length} checksummed local-only`} />
              <Readout label="Promotion" value="shadow-retained / runtime unchanged" />
            </div>
            <p className="break-all font-mono text-[9px] leading-4 text-white/36">
              Dense screen SHA-256: {v230.denseKerr.frozenScreenManifestSha256}
              <br />
              Variational STM SHA-256: {v230.variationalStm.canonicalEvidenceSha256}
            </p>
            <p className="text-[10px] leading-4 text-amber-100/62">
              Fail closed：稠密 Kerr 未执行发布级全分片，Variational STM 仍是 smoke。
              默认科学内核继续为 legacy-eih-1pn，任何候选模型都没有写入实时或 Worker physics。
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
