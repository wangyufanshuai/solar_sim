"use client";

import { nebulaLoadStatusTextV638, type NebulaLoadAttemptV638 } from "../lib/mainlineANebulaLoadV638";
import { mainlineANebulaImageNoteM3 } from "../lib/mainlineANebulaImageNotesM3";
import styles from "./MainlineANebulaSceneCaption.module.css";

type CaptionAsset = Readonly<{
  objectId: string;
  bands: readonly string[];
  credit: string;
  sourcePage: string;
  licenseUrl: string;
  license: string;
}>;

export default function MainlineANebulaSceneCaption({ asset, title, attempt, expanded, onToggle, onCancel, onRetry, onOpenViewer, canOpenViewer = false }: {
  asset: CaptionAsset;
  title: string;
  attempt: NebulaLoadAttemptV638;
  expanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onOpenViewer?: () => void;
  canOpenViewer?: boolean;
}) {
  const busy = attempt.status === "loading" || attempt.status === "decoded";
  const retryable = attempt.status === "failed" || attempt.status === "cancelled";
  const detailsId = `mainline-a-nebula-caption-${asset.objectId}`;
  return (
    <figcaption className={styles.content} data-mainline-a-nebula-caption-content data-mainline-a-nebula-caption-expanded={String(expanded)}>
      <div className={styles.summary}>
        <strong className={styles.title} title={title}>{title}</strong>
        <span className={styles.dimension} title="候选二维观测图，不表示三维深度">2D</span>
        <span className={styles.rights} data-mainline-a-scene-rights-note title="本地候选预览；逐图版权签署仍待完成。">版权待审</span>
        <a className={styles.source} href={asset.sourcePage} target="_blank" rel="noreferrer" aria-label="官方来源与完整图像">来源 ↗</a>
        {onOpenViewer ? <button type="button" className={styles.toggle} aria-label="放大观测图"
          disabled={!canOpenViewer || attempt.status !== "ready"} onClick={onOpenViewer} title="完整构图、局部放大与来源">放大</button> : null}
        <button type="button" className={styles.toggle} aria-expanded={expanded} aria-controls={detailsId}
          aria-label={expanded ? "收起观测图说明与署名" : "展开观测图说明与署名"} onClick={onToggle}>
          {expanded ? "收起" : "说明"}<span aria-hidden="true">{expanded ? " −" : " +"}</span>
        </button>
      </div>
      <p hidden data-mainline-a-nebula-caption-scroll-hint className={styles.hint}>空间有限，可上下滚动查看完整说明、版权与来源。</p>
      <p role="status" aria-live="polite" className={attempt.status === "ready" && !expanded ? styles.visuallyHidden : styles.status}>
        {nebulaLoadStatusTextV638(attempt)}
      </p>
      {busy ? <div className={styles.actions}>
        <button type="button" onClick={onCancel}>取消加载观测图</button>
        <span>单次请求最多 {attempt.timeoutMs / 1000} 秒</span>
      </div> : null}
      {retryable ? <div className={styles.actions}>
        <button type="button" onClick={onRetry}>重试加载观测图</button>
        <span>已重试 {attempt.retryCount} 次</span>
      </div> : null}
      <div id={detailsId} hidden={!expanded} className={styles.details}>
        <p className={styles.bands}>{asset.bands.join(" · ")} <span>· 官方构图保留</span></p>
        <p>{mainlineANebulaImageNoteM3(asset.objectId)}</p>
        <p>保留官方构图与配色。二维图像不表示三维深度、目录角径或肉眼色彩。</p>
        <p className={styles.rights}>本地候选预览；来源许可标记已记录，逐图版权签署仍待完成。</p>
        <p className={styles.credit} data-mainline-a-scene-image-credit>{asset.credit}</p>
        <a className={styles.license} href={asset.licenseUrl} target="_blank" rel="noreferrer">{asset.license}</a>
      </div>
    </figcaption>
  );
}
