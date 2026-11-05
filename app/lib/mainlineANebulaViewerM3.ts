export type MainlineANebulaViewerZoomM3 = 1 | 2 | 4;

export type MainlineANebulaViewerLayoutM3 = Readonly<{
  imageWidth: number; imageHeight: number;
  contentWidth: number; contentHeight: number;
  offsetLeft: number; offsetTop: number;
}>;

/** 1× is the whole composition fitted to this viewport, not a pixel-size claim. */
export function fitMainlineANebulaViewerM3(input: {
  imageWidth: number; imageHeight: number;
  viewportWidth: number; viewportHeight: number;
  zoom: MainlineANebulaViewerZoomM3;
}): MainlineANebulaViewerLayoutM3 | null {
  const { imageWidth, imageHeight, viewportWidth, viewportHeight, zoom } = input;
  if (![imageWidth, imageHeight, viewportWidth, viewportHeight].every((value) => Number.isFinite(value) && value > 0)
    || ![1, 2, 4].includes(zoom)) return null;
  const fit = Math.min(viewportWidth / imageWidth, viewportHeight / imageHeight);
  const width = imageWidth * fit * zoom;
  const height = imageHeight * fit * zoom;
  const contentWidth = Math.max(viewportWidth, width);
  const contentHeight = Math.max(viewportHeight, height);
  return Object.freeze({
    imageWidth: width, imageHeight: height, contentWidth, contentHeight,
    offsetLeft: (contentWidth - width) / 2, offsetTop: (contentHeight - height) / 2,
  });
}

const borrowedImages = new WeakMap<HTMLImageElement, object>();

export function isMainlineANebulaViewerImageM3(image: unknown): image is HTMLImageElement {
  if (!image || typeof image !== "object") return false;
  const value = image as HTMLImageElement;
  return value.tagName === "IMG" && value.complete === true
    && Number.isFinite(value.naturalWidth) && value.naturalWidth > 0
    && Number.isFinite(value.naturalHeight) && value.naturalHeight > 0;
}

/** Borrow one decoded node. Ownership of the texture, URL and lease stays outside. */
export function borrowMainlineANebulaImageM3(image: HTMLImageElement, host: HTMLElement, options: {
  objectId: string; title: string; sha256: string;
}): Readonly<{ image: HTMLImageElement; release: () => boolean }> {
  if (!isMainlineANebulaViewerImageM3(image)) throw new Error("nebula-viewer-image-not-decoded");
  if (borrowedImages.has(image)) throw new Error("nebula-viewer-image-already-borrowed");
  const token = {};
  const parent = image.parentNode;
  const nextSibling = image.nextSibling;
  const changes: Readonly<Record<string, string | null>> = {
    style: null,
    alt: `${options.title}，候选二维观测图；保留官方构图与配色`,
    draggable: "false",
    "data-mainline-a-nebula-borrowed": options.objectId,
    "data-image-sha256": options.sha256,
  };
  const original = Object.fromEntries(Object.keys(changes).map((name) => [name, image.getAttribute(name)]));
  const write = (name: string, value: string | null) => {
    if (value === null) image.removeAttribute(name);
    else image.setAttribute(name, value);
  };
  borrowedImages.set(image, token);
  const release = () => {
    if (borrowedImages.get(image) !== token) return false;
    borrowedImages.delete(image);
    // A newer external DOM owner may have moved or restyled the node. Do not
    // overwrite that owner's changes, or steal the node back from its host.
    for (const [name, value] of Object.entries(changes)) {
      if (image.getAttribute(name) === value) write(name, original[name]);
    }
    if (image.parentNode === host) {
      if (parent) parent.insertBefore(image, nextSibling?.parentNode === parent ? nextSibling : null);
      else host.removeChild(image);
    }
    return true;
  };
  try {
    for (const [name, value] of Object.entries(changes)) write(name, value);
    host.appendChild(image);
  } catch (error) {
    release();
    throw error;
  }
  return Object.freeze({ image, release });
}
