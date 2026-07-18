"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import {
  solveAtlasLabelLayout,
  type AtlasLabelLayoutCandidate,
  type AtlasVisualOcclusionRect,
} from "../lib/atlasLabelLayout";

const LABEL_SELECTOR = [
  "[data-orbit-atlas-label]",
  "[data-gaia-star-label]",
  "[data-deep-sky-label-id]",
  "[data-constellation-label]",
].join(",");

const OCCLUDER_SELECTOR = [
  '[data-atlas-cinematic-hud="bottom-dock"]',
  '[data-physics-performance-hud="true"]',
  '[data-launch-control-panel="true"]',
  "[data-atlas-scene-lab]",
  "[data-atlas-accessibility-surface-id]",
  "#universe-object-browser",
].join(",");

function visibleRect(element: HTMLElement): AtlasVisualOcclusionRect | null {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    Number(style.opacity) === 0 ||
    rect.width <= 0 ||
    rect.height <= 0
  ) return null;
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
}

function measurableLabelRect(element: HTMLElement): AtlasVisualOcclusionRect | null {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  if (style.display === "none" || rect.width <= 0 || rect.height <= 0) return null;
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
}

function selectedLabel(element: HTMLElement): boolean {
  return (
    element.dataset.gaiaStarLabelSelected === "true" ||
    element.dataset.deepSkySelectedLabel === "true" ||
    element.dataset.constellationLabelSelected === "true"
  );
}

function labelPriority(element: HTMLElement): number {
  if (selectedLabel(element)) return 100;
  const body = element.dataset.orbitAtlasLabel;
  if (body === "sun" || body === "earth") return 78;
  if (body) return 68;
  if (element.dataset.gaiaStarLabel) return 48;
  if (element.dataset.deepSkyLabelId) return 42;
  return 20;
}

function baseRect(element: HTMLElement): AtlasVisualOcclusionRect | null {
  // Hidden labels remain measurable so a camera move can bring them back.
  // Treating visibility:hidden as unmeasurable made suppression permanent.
  const rect = measurableLabelRect(element);
  if (!rect) return null;
  const previousX = Number(element.dataset.atlasLabelShiftX ?? 0);
  const previousY = Number(element.dataset.atlasLabelShiftY ?? 0);
  return {
    left: rect.left - previousX,
    top: rect.top - previousY,
    right: rect.right - previousX,
    bottom: rect.bottom - previousY,
  };
}

export default function AtlasLabelLayoutCoordinator() {
  const size = useThree((state) => state.size);
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    if (elapsedRef.current < 0.12) return;
    elapsedRef.current = 0;

    const elements = Array.from(document.querySelectorAll<HTMLElement>(LABEL_SELECTOR));
    const candidates: AtlasLabelLayoutCandidate[] = [];
    const elementById = new Map<string, HTMLElement>();
    for (const [index, element] of elements.entries()) {
      const rect = baseRect(element);
      if (!rect) continue;
      if (rect.right < 0 || rect.bottom < 0 || rect.left > size.width || rect.top > size.height) {
        element.style.visibility = "hidden";
        element.style.pointerEvents = "none";
        element.dataset.atlasLabelLayout = "suppressed-offscreen";
        continue;
      }
      const id =
        element.dataset.orbitAtlasLabel ??
        element.dataset.gaiaStarLabel ??
        element.dataset.deepSkyLabelId ??
        element.dataset.constellationLabel ??
        `label-${index}`;
      const uniqueId = `${id}:${index}`;
      candidates.push({
        id: uniqueId,
        priority: labelPriority(element),
        selected: selectedLabel(element),
        rect,
      });
      elementById.set(uniqueId, element);
    }

    const occluders = Array.from(document.querySelectorAll<HTMLElement>(OCCLUDER_SELECTOR))
      .map(visibleRect)
      .filter((rect): rect is AtlasVisualOcclusionRect => rect !== null);
    const results = solveAtlasLabelLayout({
      candidates,
      occluders,
      viewportWidth: size.width,
      viewportHeight: size.height,
      marginPx: size.width < 640 ? 12 : 10,
      collisionPaddingPx: size.width < 640 ? 6 : 4,
      occluderPaddingPx: size.width < 640 ? 16 : 24,
    });

    for (const result of results) {
      const element = elementById.get(result.id);
      if (!element) continue;
      element.style.translate = `${result.shiftX}px ${result.shiftY}px`;
      element.style.visibility = result.visible ? "visible" : "hidden";
      element.style.pointerEvents = result.visible ? "" : "none";
      element.dataset.atlasLabelShiftX = String(result.shiftX);
      element.dataset.atlasLabelShiftY = String(result.shiftY);
      element.dataset.atlasLabelLayout = result.visible ? "placed" : `suppressed-${result.reason}`;
    }
  });

  return null;
}
