"""Build the local Universe Sandbox style 8K sky sphere texture.

Sources:
- NASA SVS Deep Star Maps 2020, celestial coordinates:
  https://svs.gsfc.nasa.gov/4851
- ESO/S. Brunier Milky Way panorama:
  https://www.eso.org/public/images/eso0932a/

The script downloads source assets into public/textures/sky/_sources and writes:
public/textures/sky/universe-sandbox-sky-8k.jpg
"""

from __future__ import annotations

import os
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SKY_DIR = ROOT / "public" / "textures" / "sky"
SOURCE_DIR = ROOT / ".cache" / "sky-sources"
OUT_PATH = SKY_DIR / "universe-sandbox-sky-8k.jpg"

NASA_MILKYWAY_URL = "https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/milkyway_2020_8k.exr"
NASA_BRIGHT_STARS_URL = "https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/hiptyc_2020_8k.exr"
ESO_LARGE_URL = "https://cdn.eso.org/images/large/eso0932a.jpg"


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 1024 * 1024:
        print(f"cached {dest.name} ({dest.stat().st_size / 1024 / 1024:.1f} MB)")
        return
    tmp = dest.with_suffix(dest.suffix + ".part")
    print(f"download {url}")
    with urllib.request.urlopen(url, timeout=120) as src, tmp.open("wb") as out:
        total = int(src.headers.get("content-length") or 0)
        done = 0
        while True:
            chunk = src.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)
            done += len(chunk)
            if total:
                print(f"\r  {done / total * 100:5.1f}%", end="")
    if total:
        print()
    tmp.replace(dest)


def read_exr(path: Path) -> np.ndarray:
    os.environ.setdefault("OPENCV_IO_ENABLE_OPENEXR", "1")
    try:
        import cv2  # type: ignore

        arr = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
        if arr is not None:
            if arr.ndim == 2:
                arr = np.repeat(arr[..., None], 3, axis=2)
            arr = arr[..., :3][:, :, ::-1]
            return np.nan_to_num(arr.astype(np.float32), nan=0.0, posinf=0.0, neginf=0.0)
    except Exception as exc:
        print(f"opencv EXR read failed for {path.name}: {exc}")

    try:
        import imageio.v3 as iio  # type: ignore

        arr = iio.imread(path)
        if arr.ndim == 2:
            arr = np.repeat(arr[..., None], 3, axis=2)
        return np.nan_to_num(arr[..., :3].astype(np.float32), nan=0.0, posinf=0.0, neginf=0.0)
    except Exception as exc:
        raise RuntimeError(f"Unable to read EXR {path}: {exc}") from exc


def normalize_hdr(arr: np.ndarray) -> np.ndarray:
    arr = np.maximum(arr, 0.0)
    arr = arr / (np.percentile(arr, 99.92) + 1e-6)
    return np.clip(arr, 0.0, 12.0)


def resize_rgb(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    return img.convert("RGB").resize(size, Image.Resampling.LANCZOS)


def smooth_mask(gray: np.ndarray, lo: float, hi: float) -> np.ndarray:
    t = np.clip((gray - lo) / max(hi - lo, 1e-6), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def build() -> None:
    SKY_DIR.mkdir(parents=True, exist_ok=True)
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)

    milkyway_path = SOURCE_DIR / "milkyway_2020_8k.exr"
    bright_path = SOURCE_DIR / "hiptyc_2020_8k.exr"
    eso_path = SOURCE_DIR / "eso0932a_large.jpg"

    download(NASA_MILKYWAY_URL, milkyway_path)
    download(NASA_BRIGHT_STARS_URL, bright_path)
    download(ESO_LARGE_URL, eso_path)

    print("read NASA EXR layers")
    milky = normalize_hdr(read_exr(milkyway_path))
    bright = normalize_hdr(read_exr(bright_path))
    h, w, _ = milky.shape
    if (w, h) != (8192, 4096):
        raise RuntimeError(f"Expected NASA 8K EXR to be 8192x4096, got {w}x{h}")

    print("prepare ESO texture layer")
    eso_img = resize_rgb(Image.open(eso_path), (w, h))
    eso_img = ImageEnhance.Contrast(eso_img).enhance(1.18)
    eso_img = ImageEnhance.Color(eso_img).enhance(0.72)
    eso = np.asarray(eso_img).astype(np.float32) / 255.0

    eso_luma = eso @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    eso_band = smooth_mask(eso_luma, 0.045, 0.36)
    eso_band = np.asarray(
        Image.fromarray(np.uint8(np.clip(eso_band, 0, 1) * 255))
        .filter(ImageFilter.GaussianBlur(5))
    ).astype(np.float32) / 255.0

    # Tone-map NASA layers separately so the Milky Way keeps texture and bright stars stay compact.
    milky_tone = 1.0 - np.exp(-milky * 1.55)
    bright_tone = np.power(np.clip(1.0 - np.exp(-bright * 2.4), 0.0, 1.0), 1.35)

    # Suppress oversized white star blobs but keep dense catalog detail.
    bright_luma = bright_tone @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    compact_stars = bright_tone * np.clip(0.18 + bright_luma[..., None] * 1.25, 0.0, 0.95)

    # ESO is galactic-coordinate style, so use it as a soft visual enhancer rather than as geometry.
    eso_cool = eso * np.array([0.62, 0.74, 0.95], dtype=np.float32)
    enhanced_band = eso_cool * eso_band[..., None] * 0.18

    base = milky_tone * np.array([0.62, 0.74, 1.0], dtype=np.float32)
    img = base * 0.92 + compact_stars * 0.78 + enhanced_band

    # Deep-space floor and cinematic contrast without making the whole sky gray.
    luma = img @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    floor = smooth_mask(luma, 0.015, 0.09)
    img *= (0.18 + floor[..., None] * 0.92)
    img = np.clip(img, 0.0, 1.0)
    img = img / (img + 0.46)
    img = np.power(np.clip(img, 0.0, 1.0), 0.86)

    # Mild vignette at projection poles hides unavoidable equirectangular stretching.
    yy = np.linspace(-1.0, 1.0, h, dtype=np.float32)[:, None]
    pole = np.clip(1.0 - np.abs(yy), 0.0, 1.0) ** 0.16
    img *= (0.55 + pole[..., None] * 0.45)

    out = Image.fromarray(np.uint8(np.clip(img, 0.0, 1.0) * 255))
    out.save(OUT_PATH, quality=92, subsampling=1, optimize=True)
    print(f"wrote {OUT_PATH} ({OUT_PATH.stat().st_size / 1024 / 1024:.1f} MB)")


if __name__ == "__main__":
    try:
        build()
    except Exception as exc:
        print(f"build failed: {exc}", file=sys.stderr)
        sys.exit(1)
