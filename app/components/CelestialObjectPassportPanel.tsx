"use client";

import { Database, ExternalLink, LogOut, MapPinned, Ruler, ShieldCheck, X } from "lucide-react";
import { useEffect, useReducer, useRef, type ReactNode } from "react";
import { atlasSafeRectFromOccluder } from "../lib/atlasCameraFrameSolverV5";
import { atlasRuntimeStore } from "../lib/atlasRuntimeStore";
import type { CelestialObjectPassport, CelestialObjectPassportMetric } from "../lib/simulationDiagnosticsTypes";
import type { CelestialObjectContractV607, ConstellationMetadataV607, NebulaMetadataV607WithEncoding, StarMetadataV607WithArtDirection } from "../lib/celestialObjectContractV607";
import { getMainlineA1CatalogId, getMainlineA1Object, getMainlineA1ObjectByCatalogId } from "../data/mainlineARegistryV607";
import { selectCelestialCatalogEntry } from "../lib/celestialCatalog";
import { resolveMainlineAConstellationPassportV638 } from "../lib/mainlineAConstellationPassportV638";
import MainlineStellarEvidencePanelV607 from "./MainlineStellarEvidencePanelV607";
import MainlineAConstellationChartV607 from "./MainlineAConstellationChartV607";
import MainlineANebulaPortraitV607 from "./MainlineANebulaPortraitV607";
import MainlineAStellarPortraitV607 from "./MainlineAStellarPortraitV607";
import MainlineAObservationRoutesV607 from "./MainlineAObservationRoutesV607";
import { ObservationJourneyStartM4, ObservationJourneyReturnNoticeM4 } from "./MainlineAObservationJourneyM4";
import { mainlineANebulaImageNoteM3 } from "../lib/mainlineANebulaImageNotesM3";
import { initialPassportPresentationM1, reducePassportPresentationM1, type PassportSheetM1 } from "../lib/mainlineAPassportPresentationM1";
import styles from "./CelestialObjectPassportPanel.module.css";
type Props = {
  passport: CelestialObjectPassport | null;
  onClose: () => void;
  onExitFocus?: () => void;
  onOpenEvidenceLedger?: () => void;
  onSelectRelatedObject?: (catalogId: string) => void;
};

export default function CelestialObjectPassportPanel({ passport, onClose, onExitFocus, onOpenEvidenceLedger, onSelectRelatedObject }: Props) {
  const [presentation, dispatch] = useReducer(reducePassportPresentationM1, initialPassportPresentationM1(passport?.objectId ?? "", false));
  const current = presentation.objectId === (passport?.objectId ?? "") ? presentation
    : initialPassportPresentationM1(passport?.objectId ?? "", presentation.mobile);
  const { view, sheet, mobile, artExpanded } = current;
  const scenePeek = mobile && sheet === "collapsed";
  const panelRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const artToggleRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (panel?.contains(document.activeElement)) titleRef.current?.focus({ preventScroll: true });
    dispatch({ type: "selection", objectId: passport?.objectId ?? "", mobile: window.matchMedia("(max-width: 639px)").matches });
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [passport?.objectId]);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => {
      if (contentRef.current?.contains(document.activeElement)) titleRef.current?.focus({ preventScroll: true });
      dispatch({ type: "viewport", mobile: query.matches });
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !passport) return;
    const publishSafeRect = () => {
      const rect = panel.getBoundingClientRect();
      const dockHeight = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--ui-dock-height"),
      ) || 78;
      atlasRuntimeStore.setSafeViewportRect(atlasSafeRectFromOccluder({
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        occluder: rect,
        dockHeight,
      }));
    };
    publishSafeRect();
    const observer = new ResizeObserver(publishSafeRect);
    observer.observe(panel);
    window.addEventListener("resize", publishSafeRect, { passive: true });
    window.visualViewport?.addEventListener("resize", publishSafeRect, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", publishSafeRect);
      window.visualViewport?.removeEventListener("resize", publishSafeRect);
      atlasRuntimeStore.setSafeViewportRect(null);
    };
  }, [passport]);

  if (!passport) return null;
  const mainlineKnowledge = getMainlineA1ObjectByCatalogId(passport.objectId);
  const boundary = passportBoundaryM1(passport.kind, mainlineKnowledge);
  const setSheet = (next: PassportSheetM1) => {
    if (next === "collapsed") toggleRef.current?.focus({ preventScroll: true });
    dispatch({ type: "sheet", sheet: next });
  };

  return (
    <aside
      ref={panelRef}
      id="atlas-celestial-object-passport"
      className={styles.panel}
      data-celestial-object-passport-version={passport.version}
      data-celestial-object-passport-open="true"
      data-celestial-object-passport-id={passport.objectId}
      data-celestial-object-passport-kind={passport.kind}
      data-celestial-object-passport-source={passport.source}
      data-celestial-object-passport-view={view}
      data-mainline-a-mobile-scene-peek={scenePeek ? "true" : "false"}
      data-mainline-a-passport-state={sheet}
      data-mainline-a-passport-art-expanded={String(artExpanded)}
      data-scientific-payload-writeback="false"
      data-mainline-a-knowledge-id={mainlineKnowledge?.id ?? "none"}
      data-atlas-camera-safe-occluder="passport"
      aria-label="天体档案"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || event.nativeEvent.isComposing || event.defaultPrevented) return;
        const next = reducePassportPresentationM1(current, { type: "escape" });
        if (next === current) return;
        event.preventDefault(); event.stopPropagation();
        if (artExpanded) artToggleRef.current?.focus({ preventScroll: true });
        else (mobile ? toggleRef.current : titleRef.current)?.focus({ preventScroll: true });
        dispatch({ type: "escape" });
      }}
    >
      <header className={styles.header}>
        <div className={styles.identity}>
          <ObservationJourneyReturnNoticeM4>
          <div className={styles.eyebrow}><Database className="h-3 w-3" />天体档案</div>
          <h2 ref={titleRef} tabIndex={-1} className={styles.title}>{mainlineKnowledge?.narrative.titleCn ?? passport.title}</h2>
          </ObservationJourneyReturnNoticeM4>
        </div>
        <div className={styles.actions}>
          <button ref={toggleRef} type="button" onClick={() => setSheet(scenePeek ? "half" : "collapsed")}
            aria-expanded={!scenePeek}
            aria-controls="atlas-celestial-object-passport-content"
            aria-label={scenePeek ? "查看摘要" : "收起详情查看场景"}
            className={`${styles.action} ${styles.mobileToggle}`}
            data-mainline-a-mobile-peek-toggle="true">
            {scenePeek ? "查看摘要" : "看场景"}
          </button>
          {onExitFocus ? <button type="button" onClick={onExitFocus} className={styles.action} aria-label="退出聚焦"><LogOut className="h-4 w-4" /><span className={styles.exitLabel}>退出</span></button> : null}
          <button type="button" onClick={onClose} className={styles.action} aria-label="关闭天体档案"><X className="h-4 w-4" /></button>
        </div>
      </header>

      <div className={styles.boundary} data-mainline-a-mobile-scene-peek-summary={scenePeek ? "true" : undefined}>
        <span>{boundary}</span><span>{mainlineKnowledge?.kind === "constellation" ? mainlineKnowledge.id.toUpperCase() : passport.catalogName}</span>
      </div>
      <nav hidden={scenePeek} className={styles.tabs} aria-label="档案视图">
        {(["portrait", "spectrum", "data"] as const).map((id) => (
          <button key={id} type="button" onClick={() => dispatch({ type: "view", view: id })} aria-pressed={view === id}>
            {id === "portrait" ? "概览" : id === "spectrum" ? "光谱" : "数据"}
          </button>
        ))}
      </nav>

      <div ref={contentRef} id="atlas-celestial-object-passport-content" hidden={scenePeek} className={styles.content}>
        {view === "portrait" ? (
          <>
            {!mainlineKnowledge ? <div className="mb-3 flex items-center gap-3 rounded-md border border-white/9 bg-white/[0.035] p-3">
              <span className="h-10 w-10 shrink-0 rounded-full border border-white/12 shadow-[0_0_24px_rgba(125,211,252,0.18)]" style={{ backgroundColor: passport.color }} aria-hidden />
              <div className="min-w-0"><div className="truncate text-[12px] text-white/80">{passport.catalogName}</div><div className="mt-0.5 text-[11px] text-white/42">{passport.subtitle}</div></div>
            </div> : null}
            {mainlineKnowledge ? <>
              <CompactMainlineKnowledgeCard knowledge={mainlineKnowledge} onJourneyStarted={() => { if (mobile) setSheet("collapsed"); }} />
              <button ref={artToggleRef} type="button" className={styles.expandArt} aria-expanded={artExpanded}
                aria-controls="atlas-passport-art-comparison" onClick={() => dispatch({ type: "art", expanded: !artExpanded })}>
                <span>{artExpanded ? "收起图鉴，继续看场景" : "查看图鉴 / 比较"}</span><span aria-hidden="true">{artExpanded ? "−" : "+"}</span>
              </button>
              <div id="atlas-passport-art-comparison" hidden={!artExpanded} className="mt-3">
                {artExpanded ? <MainlineKnowledgeCard knowledge={mainlineKnowledge} onSelectRelatedObject={onSelectRelatedObject} /> : null}
              </div>
            </> : null}
            {!mainlineKnowledge ? <MainlineAObservationRoutesV607 objectId={passport.objectId} onSelectObject={onSelectRelatedObject} /> : null}
            {!mainlineKnowledge ? <div className="mt-3 grid grid-cols-2 gap-2"><SummaryBand icon={<MapPinned className="h-3.5 w-3.5" />} label="坐标系" value={passport.coordinateFrame} /><SummaryBand icon={<ShieldCheck className="h-3.5 w-3.5" />} label="证据" value={passport.relatedEvidenceClaimId} /></div> : null}
            {!mainlineKnowledge && (passport.kind === "nearby-star" || passport.kind === "bright-star") ? <p className="mt-3 rounded-md border border-cyan-100/10 bg-cyan-100/[0.035] px-3 py-2 text-[10px] leading-4 text-cyan-50/54">恒星外观由目录参数派生，仅用于科学可视化，不代表已解析的真实表面。</p> : null}
          </>
        ) : null}

        {view === "spectrum" ? <section className="grid gap-2" aria-label="光谱与观测量">{passport.metrics.slice(0, Math.max(3, Math.ceil(passport.metrics.length / 2))).map((metric) => <MetricRow key={metric.id} metric={metric} />)}</section> : null}
        {view === "data" ? <div className="grid gap-2">{passport.metrics.map((metric) => <MetricRow key={metric.id} metric={metric} />)}{passport.sections.map((section) => <section key={section.id} className="rounded-md border border-white/9 bg-white/[0.03] p-3" data-celestial-object-passport-section={section.id}><h3 className="text-[10px] uppercase text-white/38">{section.title}</h3><p className="mt-1 break-words text-[11px] leading-4 text-white/66">{section.body}</p></section>)}</div> : null}
        {onOpenEvidenceLedger ? <button type="button" onClick={onOpenEvidenceLedger} className="mt-3 flex h-9 w-full items-center justify-between rounded-md border border-cyan-100/18 bg-cyan-100/[0.055] px-3 text-[11px] text-cyan-50/78 hover:bg-cyan-100/[0.09]"><span className="flex items-center gap-2"><ExternalLink className="h-3.5 w-3.5" />打开目录证据</span><span className="ui-instrument truncate text-[9px] text-cyan-50/42">{passport.relatedEvidenceClaimId}</span></button> : null}
      </div>
      {mobile && sheet === "half" ? <button type="button" className={styles.detailAction} onClick={() => setSheet("details")}>查看详情</button> : null}
    </aside>
  );
}

function passportBoundaryM1(kind: CelestialObjectPassport["kind"], knowledge: CelestialObjectContractV607 | undefined | null) {
  if (knowledge?.kind === "nebula") return knowledge.presentation.rightsStatus === "pending-human-signoff" ? "候选观测影像 · 版权待签" : "二维观测影像";
  if (knowledge?.kind === "constellation" || kind === "constellation") return "星座图示 · 非物理连线";
  if (knowledge?.kind === "star" || kind === "nearby-star" || kind === "bright-star") return "参数化示意 · 非真实表面";
  return "目录展示 · 资料可追溯";
}

function CompactMainlineKnowledgeCard({ knowledge, onJourneyStarted }: { knowledge: CelestialObjectContractV607; onJourneyStarted?: () => void }) {
  const star = knowledge.kind === "star" ? knowledge as StarMetadataV607WithArtDirection : null;
  const nebula = knowledge.kind === "nebula" ? knowledge as NebulaMetadataV607WithEncoding : null;
  const constellation = knowledge.kind === "constellation" ? knowledge as ConstellationMetadataV607 : null;
  const labels = constellation ? resolveMainlineAConstellationPassportV638(constellation.id) : null;
  return <section data-mainline-a-passport-summary={knowledge.id} data-mainline-a-knowledge-card={knowledge.id}
    data-mainline-a-object-id={knowledge.id} data-mainline-a-object-kind={knowledge.kind}
    data-mainline-a-asset-status={knowledge.presentation.assetStatus} data-mainline-a-rights-status={knowledge.presentation.rightsStatus}>
    <p className={styles.summary}>{nebula?.id === "m16" ? mainlineANebulaImageNoteM3("m16") : knowledge.narrative.summaryCn}</p>
    <ObservationJourneyStartM4 objectId={knowledge.id} onStarted={onJourneyStarted} />
    <div className={styles.compactFacts}>
      {star?.artDirection ? <div data-mainline-a-stellar-art-direction="true">
        <div>色温 {star.artDirection.colorTemperatureK.toLocaleString("zh-CN")} K · 半径 {star.artDirection.radiusSolar.toLocaleString("zh-CN")} R☉</div>
        <div>光度 {star.artDirection.luminositySolar.toLocaleString("zh-CN")} L☉</div>
        <p>参数驱动的艺术示意，不代表已解析的真实表面。</p>
      </div> : null}
      {nebula ? <>
        <div data-mainline-a-scale-boundary="true">距离 ≈ {nebula.science.distancePc?.toLocaleString("zh-CN") ?? "未记录"} pc · 目录派生</div>
        <div data-mainline-a-observation-encoding="true">波段：{nebula.observationEncoding?.bands.join(" · ") || "未指定"}</div>
        <p>二维观测图；颜色来自波段映射，不代表肉眼颜色或三维深度。</p>
        {nebula.presentation.rightsStatus === "pending-human-signoff" ? <p data-mainline-a-nebula-human-rights-signoff="pending">本地候选预览，逐图版权签署尚未完成。</p> : null}
      </> : null}
      {constellation ? <div data-mainline-a-constellation-identity="true" data-mainline-a-constellation-facts="true">
        <div>{constellation.nameCn} · {constellation.nameEn}</div>
        <div>可见季节：{constellation.visibleSeasonCn}</div>
        <div data-mainline-a-constellation-representative-status={labels?.status ?? "unavailable"}>
          代表恒星：{labels?.representativeStars.map((star, index) => <span key={star.id}
            data-mainline-a-constellation-representative-id={star.id} data-mainline-a-constellation-representative-source={star.sourceRef}>
            {index ? " · " : ""}{star.label}</span>)}
        </div>
        {labels?.status !== "candidate-only" ? <p role="status">代表星资料待补{labels?.missingAnchorIds.length ? `：${labels.missingAnchorIds.join("、")}` : ""}；不使用旧别名或邻近恒星补位。</p> : null}
        <p>连线用于辨认天空图案，不代表物理联系。候选展示不代表科学身份准入。</p>
      </div> : null}
    </div>
    <details key={knowledge.id} className={styles.sources} data-mainline-a-passport-sources="true">
      <summary>来源与说明</summary>
      <p className="text-[11px] leading-5 text-slate-300">{knowledge.narrative.detailCn}</p>
      <ul className="mt-2 text-[10px] leading-5 text-slate-400">{knowledge.narrative.caveatsCn.map((caveat) => <li key={caveat}>· {caveat}</li>)}</ul>
      {knowledge.provenance.map((source) => <a key={source.sourceId} href={source.sourceUrl} target="_blank" rel="noreferrer"
        data-mainline-a-source={source.sourceId} data-mainline-a-source-license={source.license} data-mainline-a-source-credit={source.credit ?? ""}>
        {source.sourceId} · {source.license}{source.credit ? ` · ${source.credit}` : ""}</a>)}
    </details>
  </section>;
}

function MainlineKnowledgeCard({ knowledge, onSelectRelatedObject }: { knowledge: CelestialObjectContractV607; onSelectRelatedObject?: (catalogId: string) => void }) {
  const observationEncoding = knowledge.kind === "nebula" ? (knowledge as NebulaMetadataV607WithEncoding).observationEncoding : null;
  const artDirection = knowledge.kind === "star" ? (knowledge as StarMetadataV607WithArtDirection).artDirection : null;
  const stellarFactLayers = knowledge.kind === "star" ? (knowledge as StarMetadataV607WithArtDirection).factLayers : null;
  const stellarEvidence = knowledge.kind === "star" ? (knowledge as StarMetadataV607WithArtDirection).evidence : null;
  const constellation = knowledge.kind === "constellation"
    ? knowledge as ConstellationMetadataV607
    : null;
  const constellationLabels = constellation ? resolveMainlineAConstellationPassportV638(constellation.id) : null;
  return (
    <section className="rounded-md border border-amber-100/12 bg-amber-100/[0.035] p-3" data-mainline-a-knowledge-expanded={knowledge.id}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[10px] tracking-[0.12em] text-amber-100/70">天体图鉴</h3>
        <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-white/60">{knowledge.kind === "constellation" ? "星座图示" : knowledge.kind === "star" ? "参数化光球" : knowledge.presentation.rightsStatus === "pending-human-signoff" ? "候选观测图 · 版权待签" : knowledge.presentation.assetStatus === "licensed" ? "观测影像 · CC BY 4.0" : "目录标记"}</span>
      </div>
      {knowledge.kind === "nebula" && knowledge.presentation.rightsStatus === "pending-human-signoff" ? <p className="mt-2 rounded border border-amber-300/20 bg-amber-300/[0.055] px-2 py-1.5 text-[10px] leading-4 text-amber-100/80" data-mainline-a-nebula-human-rights-signoff="pending">
        本地图像仅供候选视觉审阅；来源、许可标记和署名已记录，逐图版权签署尚未完成。
      </p> : null}
      {knowledge.kind === "nebula" ? <div className="mt-2 grid gap-1 rounded border border-amber-100/10 bg-amber-100/[0.025] px-2 py-1.5 font-mono text-[9px] leading-4 text-amber-50/62" data-mainline-a-scale-boundary="true">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5"><span>角径 ≈ {knowledge.science.angularSizeArcmin?.toLocaleString("zh-CN") ?? "未记录"}′</span><span>距离 ≈ {knowledge.science.distancePc?.toLocaleString("zh-CN") ?? "未记录"} pc</span><span className="text-amber-50/45">数据：目录派生</span></div>
        <div className="font-sans text-amber-50/45" data-mainline-a-nebula-uncertainty="true">不确定性：未提供误差；此值用于目录定位，不是图像标尺。</div>
      </div> : null}
      {constellation ? <MainlineAConstellationChartV607 key={constellation.id} code={constellation.id} onSelectObject={onSelectRelatedObject} /> : null}
      {knowledge.kind === "nebula" ? <MainlineANebulaPortraitV607 key={knowledge.id} objectId={knowledge.id} title={knowledge.narrative.titleCn} /> : null}
      {artDirection ? <MainlineAStellarPortraitV607 key={knowledge.id} objectId={knowledge.id} title={knowledge.displayName} profile={artDirection} /> : null}
      {constellation ? <div className="mt-2 grid gap-1 rounded border border-amber-100/10 bg-amber-100/[0.025] px-2 py-1.5 text-[10px] text-amber-50/68" data-mainline-a-constellation-identity="true" data-mainline-a-constellation-facts="true">
        <div>名称：{constellation.nameCn} · {constellation.nameEn}</div>
        <div>可见季节：{constellation.visibleSeasonCn}</div>
        <div data-mainline-a-constellation-representative-status={constellationLabels?.status ?? "unavailable"}>
          代表恒星：{constellationLabels?.representativeStars.map((star, index) => <span key={star.id}
            data-mainline-a-constellation-representative-id={star.id}
            data-mainline-a-constellation-representative-source={star.sourceRef}>
            {index ? " · " : ""}{star.label}
          </span>)}
          {!constellationLabels?.representativeStars.length ? "实名锚点资料待补" : null}
        </div>
        {constellationLabels?.status !== "candidate-only" ? <div role="status" className="text-amber-200/80">
          代表星资料待补{constellationLabels?.missingAnchorIds.length ? `：${constellationLabels.missingAnchorIds.join("、")}` : ""}；不使用旧别名或邻近恒星补位。
        </div> : null}
      </div> : null}
      <p className="mt-2 text-[12px] text-white/78">{knowledge.kind === "nebula" && knowledge.id === "m16" ? mainlineANebulaImageNoteM3("m16") : knowledge.narrative.summaryCn}</p>
      <p className="mt-1 text-[11px] leading-5 text-white/56">{knowledge.narrative.detailCn}</p>
      {knowledge.presentation.assetId ? <div className="mt-2 text-[9px] text-white/42" data-mainline-a-asset-id={knowledge.presentation.assetId}>图像编号：{knowledge.presentation.assetId}</div> : null}
      <ul className="mt-2 grid gap-1 text-[10px] leading-4 text-amber-50/52">
        {knowledge.narrative.caveatsCn.map((caveat) => <li key={caveat}>· {caveat}</li>)}
      </ul>
      {observationEncoding ? <div className="mt-2 rounded border border-cyan-100/10 bg-cyan-100/[0.03] px-2 py-1.5 text-[9px] leading-4 text-cyan-50/58" data-mainline-a-observation-encoding="true">
        <div>波段：{observationEncoding.bands.length ? observationEncoding.bands.join(" / ") : "未指定（目录标记）"}</div>
        <div>{observationEncoding.bands.length ? "颜色由观测数据映射；不代表肉眼视野。" : "当前以目录位置和角尺度标记此天体。"}</div>
      </div> : null}
      {artDirection ? <div className="mt-2 rounded border border-violet-100/10 bg-violet-100/[0.03] px-2 py-1.5 text-[9px] leading-4 text-violet-50/58" data-mainline-a-stellar-art-direction="true">
        <div>恒星肖像：{artDirection.shaderProfile}</div>
        <div>色温：{artDirection.colorTemperatureK.toLocaleString()} K · 光度：{artDirection.luminositySolar.toLocaleString()} L☉</div>
        <div>半径：{artDirection.radiusSolar.toLocaleString()} R☉ · 赤道/极半径比：{artDirection.equatorialPolarRadiusRatio.toFixed(2)}</div>
        <div>表示：{artDirection.representation}（参数化展示模型）</div>
      </div> : null}
      {stellarFactLayers ? <div className="mt-2 rounded border border-emerald-100/10 bg-emerald-100/[0.03] px-2 py-1.5 text-[9px] leading-4 text-emerald-50/62" data-mainline-a-stellar-fact-layers="true">
        <div className="mb-1 text-emerald-50/76">事实层级</div>
        <FactLayer label="观测资料与边界" items={stellarFactLayers.observed} />
        <FactLayer label="目录派生" items={stellarFactLayers.catalogDerived} />
        <FactLayer label="参数模型" items={stellarFactLayers.model} />
        <FactLayer label="艺术推断" items={stellarFactLayers.artisticInference} />
      </div> : null}
      {stellarEvidence ? <MainlineStellarEvidencePanelV607 evidence={stellarEvidence} /> : null}
      <MainlineAObservationRoutesV607 objectId={knowledge.id} onSelectObject={onSelectRelatedObject} />
      {knowledge.relatedObjectIds?.length ? <div className="mt-2 flex flex-wrap gap-1" data-mainline-a-related-objects="true">
        {knowledge.relatedObjectIds.map((relatedId) => {
          const related = getMainlineA1Object(relatedId);
          const catalogId = getMainlineA1CatalogId(relatedId);
          return onSelectRelatedObject && related && catalogId ? <button key={relatedId} type="button" onClick={() => onSelectRelatedObject(catalogId)} className="rounded border border-cyan-100/12 px-1.5 py-0.5 text-[9px] text-cyan-100/58 hover:border-cyan-100/30 hover:text-cyan-50" data-mainline-a-related-object-id={catalogId}>关联：{related.displayName}</button> : <span key={relatedId} className="rounded border border-cyan-100/12 px-1.5 py-0.5 text-[9px] text-cyan-100/58">关联：{related?.displayName ?? relatedId}</span>;
        })}
      </div> : null}
      {knowledge.relatedCatalogIds?.length ? <div className="mt-2 flex flex-wrap gap-1" data-mainline-a-related-catalog-objects="true">
        {knowledge.relatedCatalogIds.map((catalogId) => {
          const related = selectCelestialCatalogEntry(catalogId);
          return onSelectRelatedObject && related ? <button key={catalogId} type="button" onClick={() => onSelectRelatedObject(catalogId)} className="rounded border border-violet-100/12 px-1.5 py-0.5 text-[9px] text-violet-100/62 hover:border-violet-100/30 hover:text-violet-50" data-mainline-a-related-catalog-id={catalogId}>目录关联：{related.primaryName}</button> : <span key={catalogId} className="rounded border border-violet-100/12 px-1.5 py-0.5 text-[9px] text-violet-100/62">目录关联：{related?.primaryName ?? catalogId}</span>;
        })}
      </div> : null}
      <div className="mt-2 grid gap-1">
        {knowledge.provenance.map((source) => <a key={source.sourceId} className="block break-words text-[9px] leading-4 text-cyan-100/55 underline decoration-cyan-100/20 underline-offset-2" href={source.sourceUrl} target="_blank" rel="noreferrer" data-mainline-a-source={source.sourceId} data-mainline-a-source-license={source.license} data-mainline-a-source-credit={source.credit ?? ""}>
          来源：{source.sourceId} · {source.license}{source.credit ? ` · 署名：${source.credit}` : ""}
        </a>)}
      </div>
    </section>
  );
}

function FactLayer({ label, items }: { label: string; items: readonly string[] }) {
  return <div className="mt-1"><span className="text-emerald-50/76">{label}：</span>{items.join("；")}</div>;
}

function MetricRow({ metric }: { metric: CelestialObjectPassportMetric }) {
  return <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 rounded-md border border-white/8 bg-black/16 px-3 py-2 text-[11px] leading-4"><dt className="flex items-center gap-1.5 text-white/38"><Ruler className="h-3 w-3" />{metric.label}</dt><dd className="min-w-0 break-words text-white/72">{metric.value}</dd></div>;
}

function SummaryBand({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="min-w-0 rounded-md border border-white/8 bg-black/16 p-2"><div className="flex items-center gap-1.5 text-[9px] uppercase text-white/32">{icon}{label}</div><div className="mt-1 truncate text-[11px] text-white/68">{value}</div></div>;
}

