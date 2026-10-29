"use client";

import { useId, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import type { MainlineANebulaVisualAssetV607 } from "../data/mainlineANebulaVisualAssetsV607.generated";
import { mainlineANebulaImageNoteM3 } from "../lib/mainlineANebulaImageNotesM3";
import {
  borrowMainlineANebulaImageM3, fitMainlineANebulaViewerM3,
  type MainlineANebulaViewerZoomM3,
} from "../lib/mainlineANebulaViewerM3";
import styles from "./MainlineANebulaViewerM3.module.css";

export default function MainlineANebulaViewerM3({ asset, title, image, onClose }: {
  asset: MainlineANebulaVisualAssetV607;
  title: string;
  image: HTMLImageElement;
  onClose: () => void;
}) {
  const headingId = useId();
  const hintId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [zoom, setZoom] = useState<MainlineANebulaViewerZoomM3>(1);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [borrowError, setBorrowError] = useState<string | null>(null);
  const centerRef = useRef({ x: 0.5, y: 0.5 });
  const dragRef = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null);
  const layout = useMemo(() => fitMainlineANebulaViewerM3({
    imageWidth: image.naturalWidth, imageHeight: image.naturalHeight,
    viewportWidth: viewport.width, viewportHeight: viewport.height, zoom,
  }), [image, viewport, zoom]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    if (dialog && !dialog.open) dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    try {
      const borrowed = borrowMainlineANebulaImageM3(image, host, { objectId: asset.objectId, title, sha256: asset.sha256 });
      setBorrowError(null);
      return () => { borrowed.release(); };
    } catch {
      setBorrowError("当前观测图暂时无法放大，请关闭后重新打开。来源与署名仍可查看。");
    }
  }, [asset.objectId, asset.sha256, image, title]);

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const measure = () => setViewport((previous) => {
      const width = element.clientWidth; const height = element.clientHeight;
      return previous.width === width && previous.height === height ? previous : { width, height };
    });
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element || !layout) return;
    element.scrollLeft = zoom === 1 ? 0 : layout.offsetLeft + layout.imageWidth * centerRef.current.x - element.clientWidth / 2;
    element.scrollTop = zoom === 1 ? 0 : layout.offsetTop + layout.imageHeight * centerRef.current.y - element.clientHeight / 2;
  }, [layout, zoom]);

  function rememberCenter() {
    const element = viewportRef.current;
    if (!element || !layout) return;
    centerRef.current = {
      x: (element.scrollLeft + element.clientWidth / 2 - layout.offsetLeft) / layout.imageWidth,
      y: (element.scrollTop + element.clientHeight / 2 - layout.offsetTop) / layout.imageHeight,
    };
  }

  function changeZoom(next: MainlineANebulaViewerZoomM3) {
    rememberCenter();
    if (next === 1) centerRef.current = { x: 0.5, y: 0.5 };
    setZoom(next);
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (zoom === 1 || event.pointerType === "touch" || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function stopDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.id !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    rememberCenter();
  }

  if (typeof document === "undefined") return null;
  return createPortal(<dialog ref={dialogRef} className={styles.dialog}
    aria-labelledby={headingId} aria-describedby={hintId}
    data-mainline-a-nebula-viewer={asset.objectId} data-mainline-a-nebula-viewer-zoom={zoom}
    data-image-sha256={asset.sha256} data-image-source={asset.sourcePage}
    data-mainline-a-scientific-payload-writeback="false"
    onCancel={(event) => { event.preventDefault(); event.stopPropagation(); onClose(); }}
    onKeyDown={(event) => {
      event.stopPropagation();
      if (event.key === "Escape" && !event.nativeEvent.isComposing) { event.preventDefault(); onClose(); }
    }}
    onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}
    onPointerUp={(event) => event.stopPropagation()} onPointerMove={(event) => event.stopPropagation()}
    onPointerCancel={(event) => event.stopPropagation()} onWheel={(event) => event.stopPropagation()}
  >
    <header className={styles.header}>
      <div className={styles.identity}><span>观测图放大 · 2D</span><h2 id={headingId}>{title}</h2></div>
      <span className={styles.rights}>候选预览 · 版权待审</span>
      <button ref={closeRef} className={styles.close} type="button" onClick={onClose} aria-label="关闭观测图放大">关闭 ×</button>
    </header>
    <div className={styles.toolbar} aria-label="观测图缩放">
      {([1, 2, 4] as const).map((value) => <button key={value} type="button" aria-pressed={zoom === value}
        onClick={() => changeZoom(value)}>{value}× {value === 1 ? "完整构图" : "局部"}</button>)}
      <button type="button" onClick={() => changeZoom(1)}>恢复全图</button>
      <span className={styles.zoomStatus} role="status" aria-live="polite">{zoom === 1 ? "完整构图 · 等比适配" : `${zoom}× 局部放大 · 可平移`}</span>
    </div>
    <p id={hintId} className={styles.hint}>1× 显示完整构图；放大后拖动、滚动或使用方向键查看局部。按 Esc 返回场景。</p>
    <div ref={viewportRef} className={styles.viewport} tabIndex={0} role="region" aria-label="可滚动的观测图，方向键平移"
      data-mainline-a-nebula-viewer-viewport data-zoomed={zoom > 1}
      onPointerDown={startDrag}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag || drag.id !== event.pointerId) return;
        event.currentTarget.scrollLeft = drag.left - (event.clientX - drag.x);
        event.currentTarget.scrollTop = drag.top - (event.clientY - drag.y);
      }}
      onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={() => { dragRef.current = null; }}
      onDragStart={(event) => event.preventDefault()} onScroll={rememberCenter}
      onKeyDown={(event) => {
        const offsets: Record<string, readonly [number, number]> = { ArrowLeft: [-64, 0], ArrowRight: [64, 0], ArrowUp: [0, -64], ArrowDown: [0, 64] };
        const delta = offsets[event.key];
        if (!delta) return;
        event.preventDefault();
        event.currentTarget.scrollBy({ left: delta[0], top: delta[1], behavior: "instant" });
      }}>
      <div className={styles.content} style={{ width: layout?.contentWidth ?? "100%", height: layout?.contentHeight ?? "100%" }}>
        <div ref={hostRef} className={styles.host} data-mainline-a-nebula-viewer-image-host
          style={{ width: layout?.imageWidth ?? 0, height: layout?.imageHeight ?? 0, left: layout?.offsetLeft ?? 0, top: layout?.offsetTop ?? 0 }} />
      </div>
      {borrowError ? <p className={styles.error} role="alert">{borrowError}</p> : null}
    </div>
    <details className={styles.details} data-mainline-a-nebula-viewer-provenance>
      <summary>来源、波段与完整署名</summary>
      <div className={styles.metadata}>
        <p>{mainlineANebulaImageNoteM3(asset.objectId)}</p>
        <p>波段：{asset.bands.join(" · ")}。二维观测合成图不表示三维深度、目录角径或肉眼色彩。</p>
        <p data-mainline-a-nebula-viewer-credit>{asset.credit}</p>
        <p className={styles.rights}>本地候选预览；来源许可标记已记录，逐图版权签署仍待完成。</p>
        <div className={styles.links}><a href={asset.sourcePage} target="_blank" rel="noreferrer">官方来源 ↗</a><a href={asset.licenseUrl} target="_blank" rel="noreferrer">{asset.license}</a></div>
      </div>
    </details>
  </dialog>, document.body);
}
