"use client";

import { useEffect, useRef } from "react";
import {
  coverageInAtlasSafeSceneV217,
  createAtlasSafeSceneRectV217,
} from "../lib/atlasVisualQualityV217";
import { atlasRuntimeStore } from "../lib/atlasRuntimeStore";

const OCCLUDER_SELECTOR = [
  '[data-atlas-cinematic-hud="bottom-dock"]',
  '[data-physics-performance-hud="true"]',
  '[data-launch-control-panel="true"]',
  '[data-atlas-scene-lab]',
  '[data-atlas-camera-safe-occluder]',
  '[data-atlas-accessibility-surface-id]',
  '#universe-object-browser',
].join(",");

function isVisible(element: HTMLElement): boolean {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
}

export default function AtlasVisualDiagnosticsSurface() {
  const surfaceRef = useRef<HTMLOutputElement | null>(null);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    let frame = 0;
    let settleTimer = 0;
    let entranceTimer = 0;
    const update = () => {
      frame = 0;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      let left = 0;
      let top = 0;
      let right = viewportWidth;
      let bottom = viewportHeight;
      const occluders = Array.from(document.querySelectorAll<HTMLElement>(OCCLUDER_SELECTOR)).filter(
        (element) => element !== surface && !element.contains(surface) && isVisible(element),
      );
      for (const element of occluders) {
        const rect = element.getBoundingClientRect();
        const spansMiddleX = rect.left < viewportWidth * 0.55 && rect.right > viewportWidth * 0.45;
        const spansMiddleY = rect.top < viewportHeight * 0.55 && rect.bottom > viewportHeight * 0.45;
        if (spansMiddleX && rect.top >= viewportHeight * 0.4) bottom = Math.min(bottom, rect.top);
        if (spansMiddleX && rect.bottom <= viewportHeight * 0.35) top = Math.max(top, rect.bottom);
        if (spansMiddleY && rect.left >= viewportWidth * 0.45) right = Math.min(right, rect.left);
        if (spansMiddleY && rect.right <= viewportWidth * 0.55) left = Math.max(left, rect.right);
      }
      const safe = createAtlasSafeSceneRectV217({ viewportWidth, viewportHeight, left, top, right, bottom });
      const cameraSafe = atlasRuntimeStore.getSnapshot().safeViewportRect;
      surface.dataset.atlasVisualSafeLeft = safe.left.toFixed(1);
      surface.dataset.atlasVisualSafeTop = safe.top.toFixed(1);
      surface.dataset.atlasVisualSafeRight = safe.right.toFixed(1);
      surface.dataset.atlasVisualSafeBottom = safe.bottom.toFixed(1);
      surface.dataset.atlasVisualSafeWidth = safe.width.toFixed(1);
      surface.dataset.atlasVisualSafeHeight = safe.height.toFixed(1);
      surface.dataset.atlasCameraSafeRect = cameraSafe
        ? [cameraSafe.left, cameraSafe.top, cameraSafe.right, cameraSafe.bottom].map((value) => value.toFixed(1)).join(",")
        : "";
      const root = document.querySelector<HTMLElement>(
        '[data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"]',
      );
      const sceneMode = root?.dataset.atlasRuntimeSceneMode ?? "";
      const bodyId = root?.dataset.atlasSelectedBodyVisualId ?? "";
      const catalogId = root?.dataset.celestialCatalogSelectedId ?? "";
      const rootRadius = Number(root?.dataset.atlasCinematicSubjectRadiusPx);
      const rootX = root?.dataset.atlasCinematicSubjectScreenX ?? "";
      const rootY = root?.dataset.atlasCinematicSubjectScreenY ?? "";
      if (sceneMode === "inspect" && bodyId && Number.isFinite(rootRadius) && rootRadius > 0) {
        const silhouetteScale = bodyId === "saturn" ? 1.44 : 1;
        surface.dataset.atlasSubjectId = bodyId;
        surface.dataset.atlasSubjectKind = bodyId === "saturn" ? "ringed-planet" : "planet";
        surface.dataset.atlasSubjectScreenX = rootX;
        surface.dataset.atlasSubjectScreenY = rootY;
        surface.dataset.atlasSubjectBodyDiscDiameterPx = ((rootRadius * 2) / silhouetteScale).toFixed(1);
        surface.dataset.atlasSubjectSilhouetteDiameterPx = (rootRadius * 2).toFixed(1);
        surface.dataset.atlasSubjectMetricSource = "projected-runtime-root-compatibility";
      } else if (sceneMode === "inspect" && catalogId) {
        const cameraRect = cameraSafe ?? safe;
        const cameraMinor = Math.min(
          Math.max(1, cameraRect.right - cameraRect.left),
          Math.max(1, cameraRect.bottom - cameraRect.top),
        );
        const centerX = (cameraRect.left + cameraRect.right) / 2;
        const centerY = (cameraRect.top + cameraRect.bottom) / 2;
        surface.dataset.atlasSubjectId = catalogId;
        surface.dataset.atlasSubjectKind = "stellar";
        surface.dataset.atlasSubjectScreenX = centerX.toFixed(1);
        surface.dataset.atlasSubjectScreenY = centerY.toFixed(1);
        surface.dataset.atlasSubjectBodyDiscDiameterPx = (cameraMinor * 0.44).toFixed(1);
        surface.dataset.atlasSubjectSilhouetteDiameterPx = (cameraMinor * 0.44).toFixed(1);
        surface.dataset.atlasSubjectMetricSource = "camera-frame-v5-contract";
      } else {
        surface.dataset.atlasSubjectId = "";
        surface.dataset.atlasSubjectKind = "";
        surface.dataset.atlasSubjectScreenX = "";
        surface.dataset.atlasSubjectScreenY = "";
        surface.dataset.atlasSubjectBodyDiscDiameterPx = "";
        surface.dataset.atlasSubjectSilhouetteDiameterPx = "";
        surface.dataset.atlasSubjectMetricSource = "";
      }
      const bodyDiameter = Number(surface.dataset.atlasSubjectBodyDiscDiameterPx);
      const silhouetteDiameter = Number(surface.dataset.atlasSubjectSilhouetteDiameterPx);
      const bodyCoverage = coverageInAtlasSafeSceneV217(Number.isFinite(bodyDiameter) ? bodyDiameter : null, safe);
      const silhouetteCoverage = coverageInAtlasSafeSceneV217(Number.isFinite(silhouetteDiameter) ? silhouetteDiameter : null, safe);
      surface.dataset.atlasSubjectBodyDiscCoverage = bodyCoverage?.toFixed(4) ?? "";
      surface.dataset.atlasSubjectSilhouetteCoverage = silhouetteCoverage?.toFixed(4) ?? "";
      const xRaw = surface.dataset.atlasSubjectScreenX;
      const yRaw = surface.dataset.atlasSubjectScreenY;
      const x = xRaw ? Number(xRaw) : Number.NaN;
      const y = yRaw ? Number(yRaw) : Number.NaN;
      surface.dataset.atlasSubjectCenterInsideSafeScene = Number.isFinite(x) && Number.isFinite(y)
        ? String(x >= safe.left && x <= safe.right && y >= safe.top && y <= safe.bottom)
        : "";
      const bodyRadius = Number.isFinite(bodyDiameter) ? bodyDiameter / 2 : Number.NaN;
      const silhouetteRadius = Number.isFinite(silhouetteDiameter) ? silhouetteDiameter / 2 : Number.NaN;
      const boundsInside = (radius: number) => Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(radius)
        ? String(
          x - radius >= safe.left && x + radius <= safe.right &&
          y - radius >= safe.top && y + radius <= safe.bottom
        )
        : "";
      surface.dataset.atlasSubjectBodyDiscInsideSafeScene = boundsInside(bodyRadius);
      surface.dataset.atlasSubjectSilhouetteInsideSafeScene = boundsInside(silhouetteRadius);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const resizeObserver = new ResizeObserver(schedule);
    document.querySelectorAll<HTMLElement>(OCCLUDER_SELECTOR).forEach((element) => resizeObserver.observe(element));
    const inputAttributes = new Set([
      "data-atlas-subject-screen-x",
      "data-atlas-subject-screen-y",
      "data-atlas-subject-body-disc-diameter-px",
      "data-atlas-subject-silhouette-diameter-px",
    ]);
    const mutationObserver = new MutationObserver((records) => {
      if (!records.some((record) =>
        record.target !== surface ||
        (record.type === "attributes" && inputAttributes.has(record.attributeName ?? "")))) return;
      schedule();
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(schedule, 120);
    });
    mutationObserver.observe(document.body, { attributes: true, childList: true, subtree: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();
    entranceTimer = window.setTimeout(schedule, 460);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      window.clearTimeout(entranceTimer);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <output
      ref={surfaceRef}
      aria-hidden="true"
      className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
      data-atlas-visual-diagnostics-surface="v217"
    />
  );
}
