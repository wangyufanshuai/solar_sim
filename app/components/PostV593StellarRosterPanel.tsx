"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import MainlineAStellarAtlasV608 from "./MainlineAStellarAtlasV608";
import MainlineANebulaAtlasV609 from "./MainlineANebulaAtlasV609";
import MainlineANebulaReviewPanelV610 from "./MainlineANebulaReviewPanelV610";
import MainlineABetaHeroReviewPanelV611 from "./MainlineABetaHeroReviewPanelV611";
import MainlineAWebSkyExplorerV656 from "./MainlineAWebSkyExplorerV656";
import MainlineAPerformancePanelV625 from "./MainlineAPerformancePanelV625";
import {
  STELLAR_HERO_BY_ID_V592,
  STELLAR_HEROES_V592,
  type StellarHeroIdV592,
} from "../lib/stellarHeroesV592";
import {
  STELLAR_HERO_SELECTOR_BY_ID_V593,
  STELLAR_HERO_SELECTOR_VERSION_V593,
} from "../lib/stellarHeroSelectorV593";
import { createStellarArchetypeProfileV1 } from "../lib/stellarArchetypeProfileV1";
import {
  STELLAR_PHENOMENOLOGY_V1_VERSION,
  createStellarPhenomenologyV1,
} from "../lib/stellarPhenomenologyV1";
import { MAINLINE_A_BETA_HERO_COVERAGE, MAINLINE_A_BETA_HERO_ROSTER } from "../data/mainlineABetaHeroRosterV607";
import { useMainlineAPanelNavigationV637 } from "../lib/useMainlineAPanelNavigationV637";
import type { MainlineAPanelIdV637 } from "../lib/mainlineAPanelNavigationV637";
import styles from "./MainlineAWorkspaceNavigationV637.module.css";

function directionForHero(hero: { raDeg: number; decDeg: number }): [number, number, number] {
  const ra = hero.raDeg * Math.PI / 180;
  const dec = hero.decDeg * Math.PI / 180;
  return [Math.cos(dec) * Math.cos(ra), Math.sin(dec), Math.cos(dec) * Math.sin(ra)];
}

export default function PostV593StellarRosterPanel({
  selectedCatalogId,
  onFocus,
  onOpenPerformance,
}: Readonly<{
  selectedCatalogId: string;
  onFocus: (direction: [number, number, number], catalogId?: string) => void;
  onOpenPerformance?: () => void;
}>) {
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const toolsId = useId();
  const rosterHeadingId = useId();
  const navigation = useMainlineAPanelNavigationV637({ fallbackFocus: () => moreRef.current });
  const { activePanel, closePanel, boundaryRef } = navigation;
  const open = activePanel === "roster";

  useEffect(() => {
    if (!toolsExpanded) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !toolbarRef.current?.contains(event.target)) {
        setToolsExpanded(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      setToolsExpanded(false);
      moreRef.current?.focus();
    };
    document.addEventListener("pointerdown", dismiss, true);
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("pointerdown", dismiss, true);
      document.removeEventListener("keydown", escape, true);
    };
  }, [toolsExpanded]);

  function openPanel(id: MainlineAPanelIdV637, opener: HTMLButtonElement) {
    navigation.openPanel(id, toolsExpanded ? moreRef.current : opener);
    setToolsExpanded(false);
  }

  function openPerformance(opener: HTMLButtonElement) {
    setToolsExpanded(false);
    if (onOpenPerformance) {
      closePanel("navigation");
      onOpenPerformance();
    } else {
      navigation.openPanel("performance", moreRef.current ?? opener);
    }
  }
  const selectedId = selectedCatalogId.startsWith("stellar-hero:")
    ? selectedCatalogId.slice("stellar-hero:".length)
    : selectedCatalogId;
  const selectedProfile = useMemo(() => {
    const hero = STELLAR_HERO_BY_ID_V592[selectedId as StellarHeroIdV592];
    return hero ? createStellarArchetypeProfileV1(hero) : null;
  }, [selectedId]);
  const selectedPhenomenology = useMemo(() => {
    const hero = STELLAR_HERO_BY_ID_V592[selectedId as StellarHeroIdV592];
    return hero ? createStellarPhenomenologyV1(hero) : null;
  }, [selectedId]);

  return (
    <div
      className={styles.tools}
      data-mainline-a-active-panel={activePanel ?? "none"}
      data-post-v593-stellar-roster="true"
      data-post-v593-stellar-selector-version={STELLAR_HERO_SELECTOR_VERSION_V593}
      data-post-v593-stellar-roster-count={STELLAR_HEROES_V592.length}
      data-post-v593-stellar-phenomenology-version={STELLAR_PHENOMENOLOGY_V1_VERSION}
      data-post-v593-stellar-phenomenology-presentation-only="true"
      data-post-v593-stellar-phenomenology-measurement-authority="false"
      data-post-v593-stellar-phenomenology-payload-writeback="false"
    >
      <div ref={toolbarRef}>
        <div className={styles.primaryActions} aria-label="图集与工具">
          <button type="button" aria-haspopup="dialog" onClick={(event) => openPanel("stellar-atlas", event.currentTarget)} className={styles.action}>恒星图集</button>
          <button type="button" aria-haspopup="dialog" onClick={(event) => openPanel("nebula-atlas", event.currentTarget)} className={styles.action}>星云候选</button>
          <button ref={moreRef} type="button" data-mainline-a-tools-toggle="true" aria-controls={toolsId} aria-expanded={toolsExpanded}
            onClick={() => setToolsExpanded((value) => !value)} className={styles.action}>工具 <span aria-hidden="true">{toolsExpanded ? "−" : "+"}</span></button>
        </div>
        <div id={toolsId} hidden={!toolsExpanded} className={styles.secondaryActions} aria-label="更多图集工具">
          <button type="button" onClick={(event) => openPanel("roster", event.currentTarget)} className={styles.action} aria-haspopup="dialog">恒星名录 · 24</button>
          <button type="button" onClick={(event) => openPanel("web-sky", event.currentTarget)} className={styles.action} aria-haspopup="dialog">星空导览 · 24+12</button>
          <button type="button" onClick={(event) => openPanel("nebula-review", event.currentTarget)} className={styles.action} aria-haspopup="dialog">清权审查</button>
          <button type="button" onClick={(event) => openPanel("hero-review", event.currentTarget)} className={styles.action} aria-haspopup="dialog">恒星补齐</button>
          <button type="button" onClick={(event) => openPerformance(event.currentTarget)} className={styles.action}>性能生命周期</button>
          <p className={styles.toolsHint}>候选资料与审核记录可在这里查看。性能观察可以收起后继续选择天体。</p>
        </div>
      </div>
      <div ref={boundaryRef}>
      {activePanel === "stellar-atlas" ? <MainlineAStellarAtlasV608 onClose={() => closePanel("close-button", "stellar-atlas")} onFocus={onFocus} /> : null}
      {activePanel === "web-sky" ? <MainlineAWebSkyExplorerV656 onClose={() => closePanel("close-button", "web-sky")} onFocus={onFocus} /> : null}
      {activePanel === "nebula-atlas" ? <MainlineANebulaAtlasV609 onClose={() => closePanel("close-button", "nebula-atlas")} /> : null}
      {activePanel === "nebula-review" ? <MainlineANebulaReviewPanelV610 onClose={() => closePanel("close-button", "nebula-review")} /> : null}
      {activePanel === "hero-review" ? <MainlineABetaHeroReviewPanelV611 onClose={() => closePanel("close-button", "hero-review")} /> : null}
      {activePanel === "performance" ? <MainlineAPerformancePanelV625 onClose={() => closePanel("close-button", "performance")} /> : null}
      {open ? (
        <div className={styles.rosterBackdrop}>
        <section className={`${styles.rosterDialog} overflow-x-hidden`} role="dialog" aria-modal="true" aria-labelledby={rosterHeadingId} tabIndex={-1} data-mainline-a-hero-roster-scroll="true">
          <header className={styles.rosterHeading}>
            <h2 id={rosterHeadingId}>恒星名录 · 24</h2>
            <button type="button" onClick={() => closePanel("close-button", "roster")} className={styles.rosterClose}>关闭名录 ×</button>
          </header>
          <div className="mb-2 rounded border border-amber-100/15 bg-amber-100/[0.035] px-2 py-1.5 text-[7px] uppercase leading-4 tracking-[.1em] text-amber-50/60" data-mainline-a-hero-coverage="true">
            Mainline A · {MAINLINE_A_BETA_HERO_COVERAGE.runtimeCleared}/{MAINLINE_A_BETA_HERO_COVERAGE.sourceCount} runtime · {MAINLINE_A_BETA_HERO_COVERAGE.evidencePending} evidence pending
          </div>
          <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[6px] uppercase tracking-[.1em] text-white/45" data-mainline-a-hero-status-legend="true">
            <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-emerald-200/75" aria-hidden="true" />runtime cleared</span>
            <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-amber-100/65" aria-hidden="true" />evidence pending</span>
          </div>
          <div className="mb-2 border-b border-white/10 pb-2 text-[7px] uppercase leading-4 tracking-[.12em] text-white/42">
            Presentation-only close-up profiles · provenance admission remains fail-closed
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-1">
            {STELLAR_HEROES_V592.map((hero) => {
              const entry = STELLAR_HERO_SELECTOR_BY_ID_V593[hero.id];
              const betaStatus = MAINLINE_A_BETA_HERO_ROSTER.find((candidate) => candidate.id === hero.id)?.status ?? "evidence-pending";
              const profile = createStellarArchetypeProfileV1(hero);
              const phenomenology = createStellarPhenomenologyV1(hero);
              const active = selectedId === hero.id;
              return (
                <button
                  key={hero.id}
                  type="button"
                  onClick={(event) => {
                    if (betaStatus !== "runtime-cleared") {
                      openPanel("hero-review", event.currentTarget);
                      return;
                    }
                    onFocus(directionForHero(hero), `stellar-hero:${hero.id}`);
                    closePanel("scene-focus", "roster");
                  }}
                  aria-pressed={active}
                  data-post-v593-stellar-target={hero.id}
                  data-mainline-a-hero-status={betaStatus}
                  data-mainline-a-hero-action={betaStatus === "runtime-cleared" ? "focus-existing" : "review-hold"}
                  data-post-v593-stellar-variability-state={phenomenology.variability.state}
                  data-post-v593-stellar-pulsation-state={phenomenology.pulsation.state}
                  data-post-v593-stellar-pulsation-enabled={String(phenomenology.pulsation.enabled)}
                  data-post-v593-stellar-binary-state={phenomenology.binary.state}
                  data-post-v593-stellar-binary-companion-count={phenomenology.binary.companionIds.length}
                  data-post-v593-stellar-presentation-only="true"
                  className={`min-h-14 min-w-0 border px-2 py-1.5 text-left transition-colors ${active ? "border-cyan-100/55 bg-cyan-100/10 text-cyan-50" : "border-white/10 text-white/58 hover:border-white/30 hover:text-white/85"}`}
                >
                  <span className="block truncate text-[9px]">{hero.name}</span>
                  <span
                    className={`mt-0.5 block truncate text-[6px] uppercase tracking-[.08em] ${betaStatus === "runtime-cleared" ? "text-emerald-200/75" : "text-amber-100/65"}`}
                    data-mainline-a-hero-status-label={betaStatus}
                  >
                    {betaStatus === "runtime-cleared" ? "runtime cleared" : "evidence pending"}
                  </span>
                  <span className="mt-1 block truncate text-[6px] uppercase tracking-[.08em] opacity-60">{profile.archetype}</span>
                  <span className="mt-0.5 block truncate text-[6px] uppercase tracking-[.06em] opacity-45">{entry.identityStatus} · {entry.provenanceAdmission === "admitted" ? "source-admitted" : "source-blocked"}</span>
                  <span className="mt-0.5 block truncate text-[6px] uppercase tracking-[.06em] opacity-45">var · {phenomenology.variability.state} · pulse off · companion {phenomenology.binary.state === "binary-presentation-only" ? "presentation" : "unknown"}</span>
                </button>
              );
            })}
          </div>
          {selectedProfile ? (
            <div
              className="mt-2 border-t border-white/10 pt-2 text-[7px] leading-4 text-white/45"
              data-post-v593-stellar-selected-phenomenology="true"
              data-post-v593-stellar-selected-variability-state={selectedPhenomenology?.variability.state}
              data-post-v593-stellar-selected-pulsation-state={selectedPhenomenology?.pulsation.state}
              data-post-v593-stellar-selected-pulsation-enabled={String(selectedPhenomenology?.pulsation.enabled ?? false)}
              data-post-v593-stellar-selected-binary-state={selectedPhenomenology?.binary.state}
              data-post-v593-stellar-selected-binary-companion-count={selectedPhenomenology?.binary.companionIds.length ?? 0}
              data-post-v593-stellar-selected-presentation-only="true"
              data-post-v593-stellar-selected-orbit-claim="false"
            >
              <div className="text-cyan-50/72">{STELLAR_HERO_BY_ID_V592[selectedId as StellarHeroIdV592]?.name}</div>
              <div>archetype · {selectedProfile.archetype}</div>
              <div>identity · {selectedProfile.identityStatus}</div>
              <div>variability · {selectedPhenomenology?.variability.state}{selectedPhenomenology?.variability.objectType ? ` · ${selectedPhenomenology.variability.objectType}` : ""}</div>
              <div>pulsation · disabled · no admitted amplitude or period</div>
              <div>companions · {selectedPhenomenology?.binary.state} · {selectedPhenomenology?.binary.companionIds.length ?? 0} presentation-only</div>
              <div>photosphere · generated presentation model, not observation texture</div>
            </div>
          ) : null}
        </section>
        </div>
      ) : null}
      </div>
    </div>
  );
}
