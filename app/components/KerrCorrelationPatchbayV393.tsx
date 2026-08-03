"use client";

import { useEffect, useState, type CSSProperties } from "react";
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
  parseKerrCovarianceSourceAdmissionArtifactV393,
  type KerrCovarianceSourceAdmissionArtifactV393,
} from "../lib/kerrCovarianceSourceDossierV393";

const SOURCES = Object.freeze([
  ["P", "photon radiance", "detector calibration"],
  ["G", "Kerr redshift", "geometry validation"],
  ["F", "Page–Thorne flux", "disk-model validation"],
] as const);

export default function KerrCorrelationPatchbayV393() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <CorrelationPatchbay />;
}

function CorrelationPatchbay() {
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  );
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v393-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "KerrCorrelationPatchbayV393",
    tokenSignature: createAtlasVisualTokenSignatureV300(
      profile.runtimeTokens.hud,
    ),
  });
  const [artifact, setArtifact] =
    useState<KerrCovarianceSourceAdmissionArtifactV393 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v393/covariance-sources", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v393-covariance-sources-unavailable");
        }
        return parseKerrCovarianceSourceAdmissionArtifactV393(value.artifact);
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
  const style = {
    "--atlas-v393-grid": tokens.metrologyGridOpacity,
    "--atlas-v393-signal": tokens.authorityGateLuminance,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-teal-100/15 bg-[radial-gradient(circle_at_16%_18%,rgba(45,212,191,.10),transparent_24%),radial-gradient(circle_at_88%_82%,rgba(245,158,11,.07),transparent_28%),linear-gradient(128deg,#020908,#060807_54%,#090702)] p-3 text-[8px] text-white/56"
      data-atlas-correlation-patchbay-v393
      data-atlas-v393-phase={phase}
      data-atlas-v393-dossier-validator-qualified="true"
      data-atlas-v393-physical-dossier-available="false"
      data-atlas-v393-component-sources="0-of-3"
      data-atlas-v393-cross-sources="0-of-3"
      data-atlas-v393-production-pack-built="false"
      data-atlas-v393-production-projection="false"
      data-atlas-v393-missing-correlation-independent="false"
      data-atlas-v393-probability-content="false"
      data-atlas-v393-science-payload-mutation="false"
      data-atlas-v393-cinematic-consumer="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v393-grid)] [background-image:linear-gradient(60deg,rgba(153,246,228,.035)_1px,transparent_1px),linear-gradient(-60deg,rgba(253,230,138,.025)_1px,transparent_1px)] [background-size:31px_31px]"
      />
      <header className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.25em] text-teal-100/45">
            v393 · source dossier / correlation topology
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[20px] font-light uppercase tracking-[.12em] text-teal-50/92">
            Correlation patchbay
          </h3>
          <p className="mt-1 max-w-[74ch] font-mono text-[6px] leading-relaxed text-white/35">
            Three physical source rails and three cross-source links must close
            before the covariance pack can reach the v392 interlock.
          </p>
        </div>
        <div className="border border-teal-100/12 bg-black/38 px-3 py-2 font-mono text-right">
          <div className="text-[6px] uppercase tracking-[.14em] text-white/27">
            production topology
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[.12em] text-amber-100/64">
            0 / 6 links present
          </div>
        </div>
      </header>

      <div className="relative mt-3 grid gap-2 lg:grid-cols-[1.28fr_.72fr]">
        <div className="relative min-h-[172px] border border-teal-100/10 bg-black/30 p-3">
          <div aria-hidden="true" className="absolute inset-0">
            <span className="absolute left-[23%] top-[48%] h-px w-[54%] rotate-[1deg] bg-gradient-to-r from-teal-100/16 via-amber-100/18 to-teal-100/16" />
            <span className="absolute left-[25%] top-[35%] h-px w-[42%] origin-left rotate-[33deg] bg-gradient-to-r from-teal-100/15 to-amber-100/18" />
            <span className="absolute right-[25%] top-[35%] h-px w-[42%] origin-right rotate-[-33deg] bg-gradient-to-l from-teal-100/15 to-amber-100/18" />
          </div>
          <div className="relative grid grid-cols-3 gap-3">
            {SOURCES.map(([code, label, authority], index) => (
              <div
                key={code}
                className={`border border-teal-100/12 bg-[#030a09]/95 p-2 font-mono ${index === 1 ? "mt-16" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full border border-teal-100/24 text-[11px] text-teal-100/68">
                    {code}
                  </span>
                  <span className="text-[5px] uppercase tracking-[.12em] text-amber-100/42">
                    source open
                  </span>
                </div>
                <div className="mt-2 text-[7px] text-white/55">{label}</div>
                <div className="mt-0.5 text-[5px] leading-tight text-white/26">
                  {authority}
                </div>
              </div>
            ))}
          </div>
          <div className="relative mt-2 grid grid-cols-3 gap-1 font-mono text-[5px] uppercase tracking-[.08em] text-white/30">
            <span>P ↔ G unavailable</span>
            <span className="text-center">P ↔ F unavailable</span>
            <span className="text-right">G ↔ F unavailable</span>
          </div>
        </div>

        <div className="border border-amber-100/10 bg-amber-100/[.018] p-2.5 font-mono">
          <div className="text-[6px] uppercase tracking-[.15em] text-amber-100/42">
            validator proving ground
          </div>
          <div className="mt-2 grid grid-cols-2 gap-px bg-white/7">
            <Metric
              label="attacks rejected"
              value={artifact ? `${artifact.validator.rejectedAdversarialFixtureCount}/9` : "—"}
              tone="teal"
            />
            <Metric
              label="synthetic control"
              value={artifact ? `${artifact.validator.acceptedControlFixtureCount}/1` : "—"}
              tone="amber"
            />
            <Metric
              label="component rails"
              value={artifact ? String(artifact.selfTest.componentSourceCount) : "—"}
              tone="neutral"
            />
            <Metric
              label="cross links"
              value={artifact ? String(artifact.selfTest.crossSourceCount) : "—"}
              tone="neutral"
            />
          </div>
          <div className="mt-2 border-l-2 border-amber-200/28 bg-amber-200/[.03] px-2 py-2 text-[6px] leading-relaxed text-amber-50/48">
            A zero correlation is not an independence proof. Missing links remain
            open unless a joint estimator or explicit independence evidence is
            SHA-locked.
          </div>
        </div>
      </div>

      {phase !== "ready" ? (
        <div className="relative mt-2 border border-white/7 bg-black/25 px-2 py-3 font-mono text-[7px] uppercase tracking-[.14em] text-white/30">
          {phase === "loading"
            ? "Tracing source dossier topology…"
            : "Covariance source artifact unavailable"}
        </div>
      ) : null}

      <footer className="relative mt-3 flex flex-wrap items-end justify-between gap-3 font-mono text-[7px] leading-relaxed">
        <p className="m-0 max-w-[84ch] text-teal-50/46">
          合成控制样本只证明三条标准差来源和三条相关性边能够确定性组装为 PSD covariance。生产端目前没有任何真实来源 dossier；缺失项不会被设为零，也不会被解释为相互独立。
        </p>
        <p className="m-0 text-right uppercase tracking-[.12em] text-amber-100/42">
          topology qualified
          <br />
          physical rails open
        </p>
      </footer>
    </section>
  );
}

function Metric({
  label,
  value,
  tone,
}: Readonly<{
  label: string;
  value: string;
  tone: "teal" | "amber" | "neutral";
}>) {
  const color =
    tone === "teal"
      ? "text-teal-100/67"
      : tone === "amber"
        ? "text-amber-100/63"
        : "text-white/52";
  return (
    <div className="bg-black/34 px-2 py-2">
      <div className="text-[5px] uppercase tracking-[.11em] text-white/27">
        {label}
      </div>
      <div className={`mt-0.5 truncate text-[8px] ${color}`}>{value}</div>
    </div>
  );
}
