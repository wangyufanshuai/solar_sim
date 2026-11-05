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
  parseMeasuredVisiblePhotonErrorBudgetArtifactV385,
  type MeasuredVisiblePhotonErrorBudgetArtifactV385,
} from "../lib/measuredVisiblePhotonErrorBudgetV385";

const COMPONENT_LABEL = Object.freeze({
  "v328-photon-quadrature": "photon quadrature",
  "v383-throughput-normalization": "throughput normalization",
  "v384-band-reconstruction": "band reconstruction",
  "v384-cross-domain-integration": "λ / ν integration",
});

export default function MeasuredVisiblePhotonErrorBudgetSurfaceV385() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <UncertaintyLadder />;
}

function UncertaintyLadder() {
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  );
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v385-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "MeasuredVisiblePhotonErrorBudgetSurfaceV385",
    tokenSignature: createAtlasVisualTokenSignatureV300(
      profile.runtimeTokens.hud,
    ),
  });
  const [artifact, setArtifact] =
    useState<MeasuredVisiblePhotonErrorBudgetArtifactV385 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      "/api/atlas/relativity-evidence/v385/visible-photon-error-budget",
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v385-visible-photon-error-budget-unavailable");
        }
        return parseMeasuredVisiblePhotonErrorBudgetArtifactV385(value.artifact);
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
  const componentMaximum = useMemo(
    () =>
      Math.max(
        Number.MIN_VALUE,
        ...(representative?.quantifiedComponents.map(
          (component) => component.relativeUpperBound,
        ) ?? []),
      ),
    [representative],
  );
  const style = {
    "--atlas-v385-grid": tokens.metrologyGridOpacity,
    "--atlas-v385-alert": tokens.authorityGateLuminance,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-cyan-100/15 bg-[linear-gradient(112deg,rgba(3,13,15,.99),rgba(5,8,9,.99)_57%,rgba(25,9,2,.98))] p-3 text-[8px] text-white/56"
      data-atlas-visible-photon-error-budget-v385
      data-atlas-v385-phase={phase}
      data-atlas-v385-computational-budget="true"
      data-atlas-v385-scientific-budget="false"
      data-atlas-v385-rss="false"
      data-atlas-v385-unknown-as-zero="false"
      data-atlas-v385-measured-authority="false"
      data-atlas-v385-observed-counts="false"
      data-atlas-v385-cinematic-consumer="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v385-grid)] [background-image:linear-gradient(rgba(207,250,254,.045)_1px,transparent_1px)] [background-size:100%_17px]"
      />
      <header className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.24em] text-cyan-100/42">
            v385 · uncertainty breaker ladder
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[18px] font-light uppercase tracking-[.08em] text-cyan-50/90">
            Small numerics do not erase unknown physics.
          </h3>
        </div>
        <div className="border-l border-cyan-100/15 pl-3 text-right font-mono text-[7px] uppercase tracking-[.13em] text-cyan-100/58">
          {artifact
            ? `${(artifact.maxima.knownComputationalUpperBoundRelative * 1e6).toFixed(6)} ppm known`
            : phase}
          <br />
          total scientific interval · unavailable
        </div>
      </header>

      <div className="relative mt-3 grid gap-2 md:grid-cols-[1.2fr_.8fr]">
        <div className="border border-cyan-100/10 bg-black/24 p-2.5">
          <div className="mb-2 font-mono text-[6px] uppercase tracking-[.15em] text-cyan-100/38">
            quantified · linear upper bounds
          </div>
          <div className="space-y-2">
            {(representative?.quantifiedComponents ?? []).map((component) => {
              const width = Math.max(
                1,
                (component.relativeUpperBound / componentMaximum) * 100,
              );
              return (
                <div key={component.id}>
                  <div className="flex items-center justify-between font-mono text-[6px] uppercase tracking-[.08em] text-white/40">
                    <span>{COMPONENT_LABEL[component.id]}</span>
                    <span>{component.relativeUpperBound.toExponential(3)}</span>
                  </div>
                  <div className="mt-1 h-[2px] bg-white/5">
                    <div
                      className="h-full bg-cyan-200/65 shadow-[0_0_9px_rgba(103,232,249,.28)]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-cyan-100/10 pt-2 font-mono text-[7px] text-cyan-50/55">
            <span>Σ linear · no independence proof</span>
            <span>
              {artifact
                ? artifact.maxima.knownComputationalUpperBoundRelative.toExponential(
                    4,
                  )
                : "—"}
            </span>
          </div>
        </div>

        <div className="border border-red-100/12 bg-red-400/[.025] p-2.5">
          <div className="mb-2 font-mono text-[6px] uppercase tracking-[.15em] text-red-100/42">
            unresolved · circuit open
          </div>
          {(representative?.unavailableSystematics ?? []).map((component) => (
            <div
              key={component.id}
              className="mb-2 border-l-2 border-red-200/28 bg-black/20 px-2 py-2"
            >
              <div className="font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[13px] uppercase tracking-[.08em] text-red-50/66">
                {component.id.replaceAll("-", " ")}
              </div>
              <div className="mt-1 font-mono text-[6px] leading-relaxed text-red-100/34">
                unavailable · no numerical placeholder
              </div>
            </div>
          ))}
          <div className="mt-3 border border-dashed border-red-100/16 p-2 text-center font-mono text-[6px] uppercase tracking-[.11em] text-red-100/42">
            absolute scientific budget not qualified
          </div>
        </div>
      </div>

      {artifact ? (
        <div className="relative mt-3 grid gap-px bg-white/8 md:grid-cols-3">
          <Metric label="rays" value="4 / 4" />
          <Metric
            label="Decimal oracle Δrel"
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
          已知项无独立性证明，故采用保守线性和。该区间只是计算上界，不是 confidence interval；calibration covariance 与 v328 source-model systematic 缺失，因此总科学不确定度不能签发。
        </p>
        <p className="m-0 text-right uppercase tracking-[.1em] text-red-100/48">
          RSS prohibited
          <br />
          unknown ≠ zero
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
