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
  parseMeasuredAuthorityIdentityAuditV381,
  type MeasuredAuthorityIdentityAuditV381,
  type MeasuredAuthorityIdentityLaneV381,
} from "../lib/measuredAuthorityIdentityAuditV381";

const RANGE_LABEL: Readonly<
  Record<MeasuredAuthorityIdentityLaneV381["bandId"], string>
> = Object.freeze({
  visible: "400–700 nm",
  euv: "12.4–121 nm",
  "soft-x-ray": "0.62–12.4 nm",
});

export default function MeasuredAuthorityIdentitySurfaceV381() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <IdentityPatchBay />;
}

function IdentityPatchBay() {
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  );
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  if (!tokens) throw new Error("v381-v11-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "MeasuredAuthorityIdentitySurfaceV381",
    tokenSignature: createAtlasVisualTokenSignatureV300(
      profile.runtimeTokens.hud,
    ),
  });
  const [artifact, setArtifact] =
    useState<MeasuredAuthorityIdentityAuditV381 | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      "/api/atlas/relativity-evidence/v381/measured-authority-identity",
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const value = (await response.json()) as {
          available?: boolean;
          artifact?: unknown;
        };
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v381-identity-audit-unavailable");
        }
        return parseMeasuredAuthorityIdentityAuditV381(value.artifact);
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
    "--atlas-v381-grid": tokens.metrologyGridOpacity,
    "--atlas-v381-alert": tokens.authorityGateLuminance,
    "--atlas-v381-scan": tokens.unavailableScanOpacity,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-2 overflow-hidden rounded-[12px] border border-cyan-100/14 bg-[radial-gradient(circle_at_18%_0%,rgba(21,98,107,.17),transparent_38%),linear-gradient(112deg,rgba(3,14,17,.99),rgba(5,8,10,.99)_61%,rgba(22,7,4,.98))] p-3 text-[8px] text-white/56"
      data-atlas-measured-authority-identity-v381
      data-atlas-v381-phase={phase}
      data-atlas-v381-qualified-lanes={
        artifact?.correctedModel.qualifiedBandLaneCount ?? "loading"
      }
      data-atlas-v381-cross-band-identity="false"
      data-atlas-v381-authority-promotion="false"
      data-atlas-v381-science-buffer-mutation="false"
      data-atlas-v381-cinematic-consumer="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v381-grid)] [background-image:linear-gradient(rgba(207,250,254,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(207,250,254,.04)_1px,transparent_1px)] [background-size:100%_18px,12.5%_100%]"
      />
      <header className="relative flex flex-wrap items-end justify-between gap-3 border-b border-cyan-100/10 pb-2">
        <div>
          <div className="font-mono text-[7px] uppercase tracking-[.24em] text-cyan-100/42">
            v381 · spectral authority patch bay
          </div>
          <h3 className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[18px] font-light uppercase tracking-[.08em] text-cyan-50/90">
            One band. One instrument identity.
          </h3>
        </div>
        <div className="border-l border-red-100/15 pl-3 text-right font-mono text-[7px] uppercase tracking-[.13em] text-red-100/58">
          {artifact
            ? `${artifact.correctedModel.qualifiedBandLaneCount}/${artifact.correctedModel.bandLaneCount} patched`
            : phase}
          <br />
          legacy 7/7 = structural only
        </div>
      </header>

      <div className="relative mt-3 grid gap-2 md:grid-cols-3">
        {(artifact?.lanes ?? []).map((lane, index) => (
          <article
            key={lane.bandId}
            className="group relative min-h-[104px] overflow-hidden border border-white/10 bg-black/24 p-2.5"
          >
            <div
              aria-hidden="true"
              className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-cyan-200/70 via-cyan-200/15 to-red-300/65"
            />
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-[7px] tracking-[.18em] text-white/34">
                  CHANNEL 0{index + 1}
                </div>
                <div className="mt-0.5 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[16px] uppercase tracking-[.12em] text-white/86">
                  {lane.label}
                </div>
              </div>
              <div className="h-2.5 w-2.5 rotate-45 border border-red-200/60 bg-red-500/10 shadow-[0_0_12px_rgba(248,113,113,var(--atlas-v381-alert))]" />
            </div>
            <div className="mt-2 h-px bg-gradient-to-r from-cyan-100/45 via-cyan-100/10 to-transparent" />
            <div className="mt-2 flex items-center justify-between font-mono text-[7px] uppercase tracking-[.1em]">
              <span className="text-cyan-100/62">{RANGE_LABEL[lane.bandId]}</span>
              <span className="text-red-100/62">open circuit</span>
            </div>
            <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-1 text-center font-mono text-[6px] uppercase tracking-[.09em] text-white/32">
              <span className="border border-white/8 px-1 py-1">detector</span>
              <span className="text-red-200/55">×</span>
              <span className="border border-white/8 px-1 py-1">geometry</span>
            </div>
          </article>
        ))}
        {phase !== "ready" ? (
          <div className="col-span-full border border-dashed border-white/10 p-4 text-center font-mono text-[7px] uppercase tracking-[.16em] text-white/35">
            {phase === "loading"
              ? "reading content-addressed identity audit"
              : "identity audit unavailable · no fallback"}
          </div>
        ) : null}
      </div>

      <footer className="relative mt-3 grid gap-2 border-t border-cyan-100/10 pt-2 font-mono text-[7px] leading-relaxed md:grid-cols-[1.25fr_.75fr]">
        <p className="m-0 text-cyan-50/52">
          同一波段内 detector 与 geometry 必须身份一致；不同波段不再被强迫伪装成同一台仪器。
          三路完整前，Science image、observed counts 与 authority promotion 均保持 unavailable。
        </p>
        <p className="m-0 text-right uppercase tracking-[.1em] text-red-100/52">
          next · one traceable detector + geometry pair
          <br />
          no synthetic bridge · no cross-band alias
        </p>
      </footer>
    </section>
  );
}
