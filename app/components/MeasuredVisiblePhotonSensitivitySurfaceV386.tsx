"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  resolveAtlasVisualProfileV299,
} from "../lib/atlasVisualProfileV299";
import {
  createAtlasVisualTokenSignatureV300,
  useAtlasVisualRuntimeConsumerV300,
} from "../lib/atlasVisualRuntimeConsumptionV300";
import {
  parseMeasuredVisiblePhotonSensitivityArtifactV386,
  type MeasuredVisiblePhotonSensitivityArtifactV386,
} from "../lib/measuredVisiblePhotonSensitivityV386";

export default function MeasuredVisiblePhotonSensitivitySurfaceV386() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <SpectralBreakerBus />;
}

function SpectralBreakerBus() {
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  );
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v386-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "MeasuredVisiblePhotonSensitivitySurfaceV386",
    tokenSignature: createAtlasVisualTokenSignatureV300(
      profile.runtimeTokens.hud,
    ),
  });
  const [artifact, setArtifact] =
    useState<MeasuredVisiblePhotonSensitivityArtifactV386 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      "/api/atlas/relativity-evidence/v386/visible-photon-sensitivity",
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v386-visible-photon-sensitivity-unavailable");
        }
        return parseMeasuredVisiblePhotonSensitivityArtifactV386(
          value.artifact,
        );
      })
      .then((value) => {
        if (!controller.signal.aborted) {
          setArtifact(value);
          setPhase("ready");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setPhase("unavailable");
      });
    return () => controller.abort();
  }, []);
  const representative = artifact?.rows[0] ?? null;
  const maximumWeight = useMemo(
    () =>
      Math.max(
        Number.MIN_VALUE,
        ...(representative?.bins.map(
          (bin) => bin.fractionalThroughputResponseWeight,
        ) ?? []),
      ),
    [representative],
  );
  const style = {
    "--atlas-v386-grid": tokens.metrologyGridOpacity,
    "--atlas-v386-signal": tokens.authorityGateLuminance,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-cyan-100/15 bg-[radial-gradient(circle_at_77%_0%,rgba(252,211,77,.08),transparent_32%),linear-gradient(110deg,rgba(2,12,14,.99),rgba(4,8,9,.99)_58%,rgba(17,11,2,.98))] p-3 text-[8px] text-white/56"
      data-atlas-visible-photon-sensitivity-v386
      data-atlas-v386-phase={phase}
      data-atlas-v386-sensitivity-qualified="true"
      data-atlas-v386-source-rank="1"
      data-atlas-v386-covariance-available="false"
      data-atlas-v386-uncertainty-projection="false"
      data-atlas-v386-unknown-as-zero="false"
      data-atlas-v386-science-payload-mutation="false"
      data-atlas-v386-cinematic-consumer="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v386-grid)] [background-image:linear-gradient(90deg,rgba(207,250,254,.05)_1px,transparent_1px),linear-gradient(rgba(207,250,254,.035)_1px,transparent_1px)] [background-size:25px_100%,100%_19px]"
      />
      <header className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.25em] text-cyan-100/42">
            v386 · calibration response backplane
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[19px] font-light uppercase tracking-[.09em] text-cyan-50/90">
            Spectral breaker bus
          </h3>
        </div>
        <div className="border-l border-amber-100/20 pl-3 text-right font-mono text-[7px] uppercase tracking-[.12em] text-amber-100/60">
          12 throughput lanes
          <br />1 identifiable source mode
        </div>
      </header>

      <div className="relative mt-3 grid gap-2 md:grid-cols-[1.4fr_.6fr]">
        <div className="border border-cyan-100/10 bg-black/28 p-2.5">
          <div className="flex items-center justify-between font-mono text-[6px] uppercase tracking-[.15em] text-cyan-100/38">
            <span>∂ ln N / ∂ ln throughput · wavelength lanes</span>
            <span>400–700 nm</span>
          </div>
          <div className="mt-3 grid h-[94px] grid-cols-12 items-end gap-[3px] border-b border-cyan-100/16 px-1">
            {(representative?.bins ?? []).map((bin) => {
              const height = Math.max(
                5,
                (bin.fractionalThroughputResponseWeight / maximumWeight) * 100,
              );
              return (
                <div
                  key={bin.index}
                  className="group relative h-full"
                  title={`${(bin.lowerWavelengthM * 1e9).toFixed(0)}–${(bin.upperWavelengthM * 1e9).toFixed(0)} nm · ${bin.fractionalThroughputResponseWeight.toExponential(4)}`}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 border-t border-cyan-100/70 bg-[linear-gradient(to_top,rgba(34,211,238,.08),rgba(103,232,249,.5))] shadow-[0_-4px_14px_rgba(34,211,238,.09)] transition-[filter] group-hover:brightness-150"
                    style={{ height: `${height}%` }}
                  />
                  <div className="absolute inset-x-0 -bottom-3 text-center font-mono text-[5px] text-white/24">
                    {bin.index % 2 === 0
                      ? (bin.lowerWavelengthM * 1e9).toFixed(0)
                      : ""}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap justify-between gap-2 font-mono text-[6px] text-cyan-50/44">
            <span>
              Σw = {representative?.throughputWeightSum.toFixed(15) ?? phase}
            </span>
            <span>global scale response = 1</span>
            <span>covariance socket · open</span>
          </div>
        </div>

        <div className="border border-amber-100/14 bg-amber-200/[.025] p-2.5">
          <div className="font-mono text-[6px] uppercase tracking-[.15em] text-amber-100/44">
            source Jacobian · rank 1
          </div>
          <div className="mt-3 flex items-center gap-2">
            <SensitivityCell
              label="ln T"
              value={representative?.logTemperatureSensitivity}
            />
            <div className="font-mono text-[13px] text-amber-100/35">≡</div>
            <SensitivityCell
              label="ln g"
              value={representative?.logRedshiftSensitivity}
            />
          </div>
          <div className="mt-3 border-l-2 border-amber-100/28 bg-black/22 px-2 py-2">
            <div className="font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[13px] uppercase tracking-[.08em] text-amber-50/72">
              Only ln(gT) is visible
            </div>
            <p className="m-0 mt-1 font-mono text-[6px] leading-relaxed text-amber-100/38">
              单一黑体可见波段无法分别识别有效温度与红移。局部灵敏度合格，参数协方差与跨块协方差仍缺失。
            </p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-px bg-white/8 font-mono text-center text-[6px] uppercase tracking-[.08em]">
            <Socket label="12×12" state="throughput" />
            <Socket label="2×2" state="source" />
            <Socket label="12×2" state="cross" />
          </div>
        </div>
      </div>

      {artifact ? (
        <div className="relative mt-3 grid gap-px bg-white/8 sm:grid-cols-4">
          <Metric label="rays" value="4 / 4" />
          <Metric label="coefficients" value="56" />
          <Metric
            label="Python oracle Δrel"
            value={artifact.maxima.pythonOracleRelativeDifference.toExponential(
              3,
            )}
          />
          <Metric
            label="CSV SHA"
            value={`${artifact.export.csvFileSha256.slice(0, 16)}…`}
          />
        </div>
      ) : null}

      <footer className="relative mt-3 flex flex-wrap items-start justify-between gap-3 font-mono text-[7px] leading-relaxed">
        <p className="m-0 max-w-[78ch] text-cyan-50/48">
          该矩阵是冻结 Planck 薄盘代理模型附近的局部响应，不是置信区间。只有导入可追溯的 throughput、source 与 cross covariance 后，才允许投影科学不确定度。
        </p>
        <p className="m-0 text-right uppercase tracking-[.1em] text-red-100/48">
          no covariance · no projection
          <br />
          science buffer untouched
        </p>
      </footer>
    </section>
  );
}

function SensitivityCell({
  label,
  value,
}: Readonly<{ label: string; value?: number }>) {
  return (
    <div className="min-w-0 flex-1 border border-amber-100/12 bg-black/30 px-2 py-2 font-mono">
      <div className="text-[6px] uppercase tracking-[.12em] text-white/28">
        {label}
      </div>
      <div className="mt-1 truncate text-[11px] text-amber-50/72">
        {value?.toFixed(8) ?? "—"}
      </div>
    </div>
  );
}

function Socket({ label, state }: Readonly<{ label: string; state: string }>) {
  return (
    <div className="bg-black/36 px-1 py-2 text-white/35">
      <div className="text-amber-100/65">{label}</div>
      <div className="mt-1 text-[5px]">{state} · missing</div>
    </div>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-black/32 px-2 py-2 font-mono">
      <div className="text-[6px] uppercase tracking-[.12em] text-white/28">
        {label}
      </div>
      <div className="mt-0.5 truncate text-[8px] text-cyan-50/68">
        {value}
      </div>
    </div>
  );
}
