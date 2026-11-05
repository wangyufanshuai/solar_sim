/** Read only existing DOM telemetry. This helper has no app/store/camera mutation capability. */
export async function readActualCameraObservation(page) {
  return page.evaluate(() => {
    const shell = document.querySelector("[data-atlas-app-shell]");
    const marker = document.querySelector("[data-atlas-browser-acceptance-version]");
    const value = (name) => marker?.getAttribute(`data-atlas-camera-${name}`) ?? null;
    const vector = (name) => { const raw = value(`actual-${name}`); return raw === null ? null : raw.split(",").map(Number); };
    const scalar = (name) => { const raw = value(`actual-${name}`); return raw === null ? null : Number(raw); };
    return { at: new Date().toISOString(), selectedId: shell?.getAttribute("data-celestial-catalog-selected-id") ?? null,
      focusState: shell?.getAttribute("data-atlas-camera-focus-state") ?? null,
      focusKind: shell?.getAttribute("data-atlas-camera-focus-kind") ?? null,
      focusProgress: shell?.getAttribute("data-atlas-camera-focus-progress") ?? null,
      position: vector("position"), target: vector("target"), direction: vector("direction"), up: vector("up"),
      quaternion: vector("quaternion"), fov: scalar("fov"), zoom: scalar("zoom"),
      targetDistance: value("target-distance") === null ? null : Number(value("target-distance")),
      source: "read-only-actual-camera-dom-markers" };
  });
}

export function inspectCameraLock(sample, selectedId) {
  const issues = [];
  if (sample?.selectedId !== selectedId || sample?.focusState !== "locked") issues.push("actual-focus-not-locked-on-selection");
  for (const field of ["position", "target", "direction", "up", "quaternion"]) {
    if (!Array.isArray(sample?.[field]) || sample[field].length !== (field === "quaternion" ? 4 : 3)
      || !sample[field].every(Number.isFinite)) issues.push(`actual-camera-${field}-unavailable`);
  }
  if (!Number.isFinite(sample?.fov) || sample.fov <= 0 || sample.fov >= 180
    || !Number.isFinite(sample?.zoom) || sample.zoom <= 0
    || !Number.isFinite(sample?.targetDistance) || sample.targetDistance <= 0) issues.push("actual-camera-scalars-unavailable");
  return issues;
}

export function cameraPoseStable(first, last, tolerance = .001) {
  if (!first || !last || inspectCameraLock(first, last.selectedId).length || inspectCameraLock(last, first.selectedId).length) return false;
  for (const field of ["position", "target", "direction", "up", "quaternion"]) {
    const signs = field === "quaternion" ? [1, -1] : [1];
    const delta = Math.min(...signs.map((sign) => Math.max(...first[field].map((value, index) => Math.abs(value - sign * last[field][index])))));
    if (delta > tolerance) return false;
  }
  return ["fov", "zoom", "targetDistance"].every((field) => Math.abs(first[field] - last[field]) <= tolerance);
}

export async function waitForActualCameraStable(page, selectedId, { timeoutMs = 20_000, stableMs = 750, intervalMs = 150, tolerance = .001 } = {}) {
  const start = Date.now(); const samples = []; let anchor = null; let stableAt = 0;
  while (Date.now() - start < timeoutMs) {
    const current = await readActualCameraObservation(page); samples.push(current);
    if (inspectCameraLock(current, selectedId).length || !cameraPoseStable(anchor, current, tolerance)) {
      anchor = inspectCameraLock(current, selectedId).length ? null : current; stableAt = Date.now();
    } else if (Date.now() - stableAt >= stableMs) {
      return { status: "actual-focus-locked-and-pose-stable", selectedId, stableMs, tolerance,
        elapsedMs: Date.now() - start, samples, final: current };
    }
    await page.waitForTimeout(intervalMs);
  }
  const error = new Error(`actual-camera-stability-timeout:${selectedId}:${JSON.stringify(samples.at(-1))}`);
  error.cameraEvidence = { selectedId, timeoutMs, stableMs, tolerance, samples }; throw error;
}

/** A canvas plane has no image DOM rectangle. Report that absence rather than treating its caption as the image. */
export async function readNebulaDisplayObservation(page, id) {
  return page.evaluate((objectId) => {
    const figure = document.querySelector(`[data-mainline-a-scene-nebula="${objectId}"]`);
    const image = document.querySelector(`[data-mainline-a-nebula-borrowed="${objectId}"]`);
    const canvas = document.querySelector("canvas");
    const box = (node) => node?.getBoundingClientRect().toJSON() ?? null;
    return { source: "read-only-DOM-rectangles", canvasBounds: box(canvas), captionBounds: box(figure),
      sceneImageBounds: null, sceneImageBoundsEvidence: "WebGL plane has no image DOM rectangle or published projection rectangle",
      viewerImageBounds: box(image), viewerNaturalSize: image ? [image.naturalWidth, image.naturalHeight] : null,
      projectionAttributes: figure ? Object.fromEntries([...figure.attributes]
        .filter((attribute) => /projection|projected|image-bounds|image-width|image-height/.test(attribute.name))
        .map((attribute) => [attribute.name, attribute.value])) : {},
      visibleOccluders: [...document.querySelectorAll("[data-atlas-camera-safe-occluder]")]
        .filter((node) => node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0)
        .map((node) => ({ role: node.getAttribute("data-atlas-camera-safe-occluder"), bounds: box(node) })) };
  }, id);
}
