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
  parseMeasuredVisiblePhotonObservableArtifactV384,
  type MeasuredVisiblePhotonObservableArtifactV384,
} from "../lib/measuredVisiblePhotonObservableV384";

export default function MeasuredVisiblePhotonObservableSurfaceV384() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <PhotonIntegratingSphere />;
}

function PhotonIntegratingSphere() {
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  );
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v384-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "MeasuredVisiblePhotonObservableSurfaceV384",
    tokenSignature: createAtlasVisualTokenSignatureV300(
      profile.runtimeTokens.hud,
    ),
  });
  const [artifact, setArtifact] =
    useState<MeasuredVisiblePhotonObservableArtifactV384 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      "/api/atlas/relativity-evidence/v384/visible-photon-observable",
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v384-visible-photon-observable-unavailable");
        }
        return parseMeasuredVisiblePhotonObservableArtifactV384(value.artifact);
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
  const maximumWeighted = useMemo(
    () =>
      Math.max(
        1,
        ...(artifact?.rows.map(
          (row) => row.throughputWeightedPhotonRadiancePerSM2Sr,
        ) ?? []),
      ),
    [artifact],
  );
  const style = {
    "--atlas-v384-grid": tokens.metrologyGridOpacity,
    "--atlas-v384-alert": tokens.authorityGateLuminance,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-cyan-100/15 bg-[radial-gradient(circle_at_13%_18%,rgba(165,243,252,.12),transparent_25%),linear-gradient(118deg,rgba(2,12,15,.99),rgba(4,8,10,.99)_58%,rgba(16,8,3,.98))] p-3 text-[8px] text-white/56"
      data-atlas-visible-photon-observable-v384
      data-atlas-v384-phase={phase}
      data-atlas-v384-rows={artifact?.rows.length ?? "loading"}
      data-atlas-v384-integration-domain-independent={
        artifact?.algorithms.integrationDomainIndependent ?? "loading"
      }
      data-atlas-v384-photon-observable="true"
      data-atlas-v384-electron-expectation="false"
      data-atlas-v384-observed-counts="false"
      data-atlas-v384-science-image="false"
      data-atlas-v384-cinematic-consumer="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v384-grid)] [background-image:radial-gradient(circle,rgba(207,250,254,.12)_1px,transparent_1px)] [background-size:18px_18px]"
      />
      <header className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.24em] text-cyan-100/42">
            v384 · photon integrating sphere
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[18px] font-light uppercase tracking-[.08em] text-cyan-50/90">
            Photons weighted. Electrons withheld.
          </h3>
        </div>
        <div className="border-l border-cyan-100/15 pl-3 text-right font-mono text-[7px] uppercase tracking-[.13em] text-cyan-100/58">
          {artifact ? "4 authority disk rays" : phase}
          <br />
          λ trapezoid ↔ ν Simpson
        </div>
      </header>

      <div className="relative mt-3 grid gap-1 md:grid-cols-4">
        {(artifact?.rows ?? []).map((row) => {
          const level =
            (row.throughputWeightedPhotonRadiancePerSM2Sr / maximumWeighted) *
            100;
          return (
            <article
              key={row.rayIndex}
              className="relative overflow-hidden border border-white/9 bg-black/28 px-2 pb-2 pt-2 font-mono"
            >
              <div
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-[2px] bg-cyan-200/65 shadow-[0_0_12px_rgba(103,232,249,.35)]"
                style={{ width: `${level}%` }}
              />
              <div className="flex items-center justify-between text-[6px] uppercase tracking-[.12em] text-white/30">
                <span>ray {row.rayIndex}</span>
                <span>a={row.spinA.toFixed(1)}</span>
              </div>
              <div className="mt-2 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[15px] font-light tracking-[.04em] text-cyan-50/78">
                {row.throughputWeightedPhotonRadiancePerSM2Sr.toExponential(5)}
              </div>
              <div className="mt-0.5 text-[5px] tracking-[.08em] text-white/30">
                photons s⁻¹ m⁻² sr⁻¹
              </div>
              <div className="mt-2 flex items-center justify-between text-[6px] text-amber-100/50">
                <span>η band</span>
                <span>{(row.effectiveBandThroughput * 100).toFixed(5)}%</span>
              </div>
            </article>
          );
        })}
        {phase !== "ready" ? (
          <div className="col-span-full border border-dashed border-white/10 p-4 text-center font-mono text-[7px] uppercase tracking-[.14em] text-white/34">
            {phase === "loading"
              ? "integrating immutable photon observable"
              : "observable unavailable · no synthetic fallback"}
          </div>
        ) : null}
      </div>

      {artifact ? (
        <div className="relative mt-3 grid gap-px bg-white/8 md:grid-cols-3">
          <Metric
            label="v328 reconstruction Δrel"
            value={artifact.maxima.unweightedReconstructionRelativeDifference.toExponential(
              3,
            )}
          />
          <Metric
            label="Python oracle Δrel"
            value={artifact.maxima.pythonOracleRelativeDifference.toExponential(
              3,
            )}
          />
          <Metric
            label="export SHA"
            value={`${artifact.export.csvFileSha256.slice(0, 16)}…`}
          />
        </div>
      ) : null}

      <footer className="relative mt-3 flex flex-wrap items-start justify-between gap-3 font-mono text-[7px] leading-relaxed">
        <p className="m-0 max-w-[74ch] text-cyan-50/48">
          本层只计算 ∫NνT(λ)dν。未应用 collecting area、pixel solid angle、exposure、gain、dark、background 或 read noise；因此这些数值不能标记为 electron expectation 或 observed counts。
        </p>
        <p className="m-0 text-right uppercase tracking-[.1em] text-red-100/48">
          photon observable qualified
          <br />
          detector authority open circuit
        </p>
      </footer>
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-black/32 px-2 py-2 font-mono">
      <div className="text-[6px] uppercase tracking-[.12em] text-white/28">
        {label}
      </div>
      <div className="mt-0.5 text-[8px] text-cyan-50/68">{value}</div>
    </div>
  );
}
