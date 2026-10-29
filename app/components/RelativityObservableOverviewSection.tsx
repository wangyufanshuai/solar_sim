import { Gauge } from "lucide-react";
import { AtlasInstrumentInfoBlock } from "./AtlasInstrumentUi";
import type { RelativityObservableAtlasPanelProps } from "./RelativityObservableAtlasPanel";

export type RelativityObservableOverviewSectionProps = Pick<
  RelativityObservableAtlasPanelProps,
  | "relativityVerificationSummary"
  | "relativityChartSummary"
  | "criticalUiRelativityVisibilitySummary"
  | "cameraStellarCloseupSummary"
  | "launchGameplayOpenRocketBridgeSummary"
  | "scientificModelUpgradeContractSummary"
>;

export function selectRelativityObservableOverviewSectionProps(
  props: RelativityObservableAtlasPanelProps,
): RelativityObservableOverviewSectionProps {
  return {
    relativityVerificationSummary: props.relativityVerificationSummary,
    relativityChartSummary: props.relativityChartSummary,
    criticalUiRelativityVisibilitySummary: props.criticalUiRelativityVisibilitySummary,
    cameraStellarCloseupSummary: props.cameraStellarCloseupSummary,
    launchGameplayOpenRocketBridgeSummary: props.launchGameplayOpenRocketBridgeSummary,
    scientificModelUpgradeContractSummary: props.scientificModelUpgradeContractSummary,
  };
}

export default function RelativityObservableOverviewSection({
    relativityVerificationSummary,
    relativityChartSummary,
    criticalUiRelativityVisibilitySummary,
    cameraStellarCloseupSummary,
    launchGameplayOpenRocketBridgeSummary,
    scientificModelUpgradeContractSummary
}: RelativityObservableOverviewSectionProps) {
  return (
    <>
<div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-atlas-relativity-core-panel="true"
        data-atlas-relativity-core-entry-policy={criticalUiRelativityVisibilitySummary.relativityCoreEntryPolicy}
      >
        <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-cyan-100/50">
          <Gauge className="h-3.5 w-3.5" />
          <span>相对论核心</span>
        </div>
        <div className="grid gap-2 text-[11px] leading-4 text-white/58 sm:grid-cols-2 lg:grid-cols-4">
          <AtlasInstrumentInfoBlock
            label="EIH 1PN"
            value={`弱场太阳系修正；${relativityVerificationSummary.weakFieldObservableCount} 个可观测读数`}
          />
          <AtlasInstrumentInfoBlock
            label="DP5(4) / RK4"
            value="现有积分器可视化读数；默认模式未在 v110-v113 修改"
          />
          <AtlasInstrumentInfoBlock
            label="Mercury / Shapiro / 光偏折"
            value={`水星进动 ${relativityChartSummary.mercuryEihOnePnArcsecPerCentury.toFixed(2)} arcsec/century；Shapiro 与光偏折在 Observable Atlas 中保留`}
          />
          <AtlasInstrumentInfoBlock
            label="Kerr ISCO / Hamiltonian drift"
            value={`Kerr ISCO 条形图 + Hamiltonian drift ${relativityChartSummary.hamiltonianDrift.formatted}`}
          />
          <AtlasInstrumentInfoBlock
            label="科学边界"
            value="可见性与读数汇总层；不修改 EIH 1PN、RK4/DP、Kerr、fixtures 或 worker physics"
          />
          <AtlasInstrumentInfoBlock
            label="v110"
            value={`${criticalUiRelativityVisibilitySummary.status}; ${criticalUiRelativityVisibilitySummary.uiCopyPolicy}`}
          />
          <AtlasInstrumentInfoBlock
            label="v111"
            value={`${cameraStellarCloseupSummary.status}; ${cameraStellarCloseupSummary.cameraRigPolicy}`}
          />
          <AtlasInstrumentInfoBlock
            label="v112 / v113"
            value={`${launchGameplayOpenRocketBridgeSummary.openRocketBridgePolicy}; ${scientificModelUpgradeContractSummary.scientificUpgradePolicy}`}
          />
        </div>
      </div>

<div
        className="border-b border-cyan-100/10 px-3 py-2"
        data-relativity-force-model-v2-shadow="true"
        data-relativity-force-model-v2-default="legacy-eih-1pn"
        data-relativity-force-model-v2-promotion="blocked-shadow-retained"
      >
        <div className="grid gap-2 text-[11px] leading-4 text-white/58 sm:grid-cols-3">
          <AtlasInstrumentInfoBlock
            label="V2 Shadow"
            value="EIH 1PN + 太阳 2PN 单极项 + Lense-Thirring；只读 Worker 对照"
          />
          <AtlasInstrumentInfoBlock
            label="晋级门禁"
            value="十年 RMS < 10,000 km / 1 m/s，另需 Kerr、性能与全回归通过"
          />
          <AtlasInstrumentInfoBlock
            label="当前默认"
            value="legacy-eih-1pn；V2 未写入实时状态或现有 worker physics"
          />
        </div>
      </div>
    </>
  );
}
