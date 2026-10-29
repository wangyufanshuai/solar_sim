"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  resolveAtlasVisualProfileV299,
  sampleAtlasCinematicDetailV299,
} from "../lib/atlasVisualProfileV299";
import {
  createAtlasVisualTokenSignatureV300,
  useAtlasVisualRuntimeConsumerV300,
} from "../lib/atlasVisualRuntimeConsumptionV300";
import {
  parseMeasuredExpectationAuthorityInspectV375,
  type MeasuredExpectationAuthorityInspectV375,
} from "../lib/measuredExpectationAuthorityInspectV375";
import {
  parseExpectedElectronScienceImageInspectV376,
  type ExpectedElectronScienceImageInspectV376,
} from "../lib/expectedElectronScienceImageInspectV376";

type LabState = Readonly<{
  expectation: MeasuredExpectationAuthorityInspectV375 | null;
  image: ExpectedElectronScienceImageInspectV376 | null;
  phase: "loading" | "ready" | "unavailable";
}>;

export default function MeasurementLabSurfaceV377() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377) return null;
  return <Panel />;
}

function Panel() {
  const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V377);
  const tokens = profile.runtimeTokens.hud.measurementLabV11;
  const gravity = profile.runtimeTokens.strongGravityV11;
  if (!tokens || !gravity) throw new Error("v377-measurement-lab-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "MeasurementLabSurfaceV377",
    tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud),
  });
  const [state, setState] = useState<LabState>({
    expectation: null,
    image: null,
    phase: "loading",
  });
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      const [expectationResponse, imageResponse] = await Promise.all([
        fetch("/api/atlas/relativity-evidence/v375/measured-expectation", {
          cache: "no-store",
          signal: controller.signal,
        }),
        fetch("/api/atlas/relativity-evidence/v376/expected-electron-image", {
          cache: "no-store",
          signal: controller.signal,
        }),
      ]);
      const expectationValue = (await expectationResponse.json()) as {
        available?: boolean;
        artifact?: unknown;
      };
      const imageValue = (await imageResponse.json()) as {
        available?: boolean;
        artifact?: unknown;
      };
      if (
        !expectationResponse.ok ||
        !imageResponse.ok ||
        expectationValue.available !== true ||
        imageValue.available !== true ||
        !expectationValue.artifact ||
        !imageValue.artifact
      ) {
        return null;
      }
      return {
        expectation: parseMeasuredExpectationAuthorityInspectV375(
          expectationValue.artifact,
        ),
        image: parseExpectedElectronScienceImageInspectV376(imageValue.artifact),
      };
    };
    void load()
      .then((value) => {
        if (controller.signal.aborted) return;
        setState(
          value
            ? { ...value, phase: "ready" }
            : { expectation: null, image: null, phase: "unavailable" },
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ expectation: null, image: null, phase: "unavailable" });
        }
      });
    return () => controller.abort();
  }, []);
  const columns = useMemo(
    () =>
      Object.freeze(
        Array.from({ length: 12 }, (_, index) => ({
          height: 18 + sampleAtlasCinematicDetailV299(tokens.detailSeed, index, 1) * 58,
          opacity:
            tokens.electronColumnOpacity *
            (0.34 + sampleAtlasCinematicDetailV299(tokens.detailSeed, index, 2) * 0.46),
        })),
      ),
    [tokens],
  );
  const style = {
    "--atlas-v377-panel": tokens.panelOpacity,
    "--atlas-v377-grid": tokens.metrologyGridOpacity,
    "--atlas-v377-halo": tokens.uncertaintyHaloOpacity,
    "--atlas-v377-rail": tokens.shaRailOpacity,
    "--atlas-v377-gate": tokens.authorityGateLuminance,
    "--atlas-v377-scan": tokens.unavailableScanOpacity,
  } as CSSProperties;
  const presentInputs = state.expectation?.presentInputCount ?? 0;
  const imageCells = state.image?.imageAvailable ? 12 : 0;

  return (
    <section
      style={style}
      className="relative mt-2 isolate overflow-hidden rounded-[14px] border border-cyan-100/20 bg-[linear-gradient(118deg,rgba(2,18,24,var(--atlas-v377-panel))_0%,rgba(3,10,17,.98)_48%,rgba(18,12,4,.96)_100%)] p-4 text-[9px] text-cyan-50/62 shadow-[inset_0_1px_0_rgba(207,250,254,.08),0_22px_60px_rgba(0,0,0,.34)]"
      data-atlas-measurement-lab-v377
      data-atlas-v11-token-consumer="measurement-lab"
      data-atlas-v11-profile={profile.id}
      data-atlas-v377-science-display="identity-linear-float64"
      data-atlas-v377-science-exposure={gravity.scienceExposure}
      data-atlas-v377-science-bloom={gravity.scienceBloom}
      data-atlas-v377-science-noise={gravity.scienceNoise}
      data-atlas-v377-science-buffer-mutation="false"
      data-atlas-v377-cinematic-buffer-mutation="false"
      data-atlas-v377-default-applied="false"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--atlas-v377-grid)] [background-image:linear-gradient(rgba(207,250,254,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(207,250,254,.08)_1px,transparent_1px)] [background-size:19px_19px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full border border-cyan-100/15 opacity-[var(--atlas-v377-halo)] shadow-[inset_0_0_64px_rgba(103,232,249,.18),0_0_80px_rgba(103,232,249,.08)]"
      />
      <div className="relative grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-['IBM_Plex_Mono','Cascadia_Code',monospace] text-[7px] uppercase tracking-[.32em] text-cyan-100/48">
                Science Cinematic V11 · Measurement Lab
              </div>
              <h3 className="mt-1 font-['Bahnschrift_Condensed','Arial_Narrow',sans-serif] text-[21px] font-light uppercase tracking-[.08em] text-cyan-50/94">
                Cryogenic photon ledger
              </h3>
            </div>
            <div className="border-l border-cyan-100/20 pl-3 text-right font-mono text-[7px] uppercase tracking-[.16em] text-cyan-100/46">
              {state.phase}
              <br />authority open circuit
            </div>
          </div>

          <div className="mt-4 grid grid-cols-[5px_1fr] gap-3">
            <div
              aria-hidden="true"
              className="rounded-full bg-gradient-to-b from-cyan-100/80 via-cyan-300/20 to-amber-200/70 opacity-[var(--atlas-v377-rail)] shadow-[0_0_12px_rgba(103,232,249,.28)]"
            />
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[9px] border border-cyan-100/10 bg-cyan-100/10 sm:grid-cols-4">
              <Metric label="input bus" value={`${String(presentInputs).padStart(2, "0")} / 08`} />
              <Metric label="photon field" value={state.expectation?.photonInputQualified ? "LOCKED" : "CHECK"} />
              <Metric label="electron cells" value={`${String(imageCells).padStart(2, "0")} / 12`} />
              <Metric label="observed counts" value="UNAVAILABLE" warning />
            </div>
          </div>

          <div className="mt-4 flex h-24 items-end gap-1 border-b border-cyan-100/15 px-1 pb-1" aria-hidden="true">
            {columns.map((column, index) => (
              <i
                key={index}
                className="min-w-0 flex-1 bg-gradient-to-t from-cyan-300/5 via-cyan-200/35 to-cyan-50/90 shadow-[0_0_10px_rgba(103,232,249,.08)]"
                style={{ height: `${column.height}%`, opacity: column.opacity }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between font-mono text-[6px] uppercase tracking-[.2em] text-cyan-100/28">
            <span>decorative scan / no pixel payload</span>
            <span>seed 377</span>
          </div>
        </div>

        <aside className="relative overflow-hidden rounded-[10px] border border-amber-100/15 bg-amber-100/[.025] p-3">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-100/70 to-transparent opacity-[var(--atlas-v377-scan)]"
          />
          <div className="font-mono text-[7px] uppercase tracking-[.24em] text-amber-100/48">
            Authority gate
          </div>
          <div className="mt-3 text-[24px] font-light tracking-[-.04em] text-amber-50/[var(--atlas-v377-gate)]">
            0 × 0
          </div>
          <div className="text-[7px] uppercase tracking-[.18em] text-amber-100/38">
            detector × geometry
          </div>
          <div className="mt-5 space-y-2 font-mono text-[7px] text-white/38">
            <Rail label="photon SHA" value="qualified" active />
            <Rail label="detector authority" value="missing" />
            <Rail label="geometry authority" value="missing" />
            <Rail label="science image" value="withheld" />
          </div>
          <div className="mt-4 border-t border-amber-100/10 pt-2 text-[7px] leading-3 text-amber-50/34">
            Decorative electron columns never encode expectation, variance, classification, redshift, EVPA or intensity. Science remains immutable Float64 authority data.
          </div>
        </aside>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  warning = false,
}: Readonly<{ label: string; value: string; warning?: boolean }>) {
  return (
    <div className="bg-[#051117] px-2.5 py-2.5">
      <div className="font-mono text-[6px] uppercase tracking-[.2em] text-cyan-100/30">{label}</div>
      <div className={`mt-1 font-mono text-[10px] ${warning ? "text-amber-100/78" : "text-cyan-50/78"}`}>
        {value}
      </div>
    </div>
  );
}

function Rail({
  label,
  value,
  active = false,
}: Readonly<{ label: string; value: string; active?: boolean }>) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/[.05] pb-1.5">
      <span>{label}</span>
      <span className={active ? "text-cyan-100/70" : "text-amber-100/58"}>{value}</span>
    </div>
  );
}
