"""Build local Orbit Atlas sky textures.

Default output is a low-memory 4K equirectangular JPG:
  public/textures/sky/nasa_milkyway_2020_4k_balanced.jpg

Set BUILD_SKY_8K=1 to also attempt the heavier EXR-based 8K output:
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
OUT_4K_PATH = SKY_DIR / "nasa_milkyway_2020_4k_balanced.jpg"
OUT_8K_PATH = SKY_DIR / "universe-sandbox-sky-8k.jpg"

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


def smooth_mask(gray: np.ndarray, lo: float, hi: float) -> np.ndarray:
    t = np.clip((gray - lo) / max(hi - lo, 1e-6), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def hash_noise(width: int, height: int, seed: int = 19) -> np.ndarray:
    rng = np.random.default_rng(seed)
    return rng.random((height, width), dtype=np.float32)


def add_catalog_style_stars(img: np.ndarray) -> np.ndarray:
    h, w, _ = img.shape
    n = hash_noise(w, h, 73)
    tiny = np.power(smooth_mask(n, 0.9983, 1.0), 3.6)
    bright = np.power(smooth_mask(n, 0.99972, 1.0), 2.0)
    stars = tiny[..., None] * np.array([0.45, 0.55, 0.78], dtype=np.float32)
    stars += bright[..., None] * np.array([1.0, 0.92, 0.72], dtype=np.float32)
    return np.clip(img + stars * 0.34, 0.0, 1.0)


def build_4k(eso_path: Path) -> None:
    print("build 4K balanced sky")
    w, h = 4096, 2048
    eso_img = Image.open(eso_path).convert("RGB")
    eso_img = ImageEnhance.Contrast(eso_img).enhance(1.22)
    eso_img = ImageEnhance.Color(eso_img).enhance(0.62)
    eso_img = ImageEnhance.Brightness(eso_img).enhance(0.98)
    eso_img = eso_img.resize((w, h), Image.Resampling.LANCZOS)
    eso = np.asarray(eso_img).astype(np.float32) / 255.0

    luma = eso @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    band = smooth_mask(luma, 0.034, 0.34)
    band = np.asarray(
        Image.fromarray(np.uint8(np.clip(band, 0, 1) * 255)).filter(
            ImageFilter.GaussianBlur(3)
        )
    ).astype(np.float32) / 255.0

    cool = eso * np.array([0.52, 0.66, 0.92], dtype=np.float32)
    dust = np.power(np.clip(band, 0.0, 1.0), 1.18)
    img = cool * (0.42 + dust[..., None] * 0.98)

    # Cold dark lanes and projection-pole attenuation keep the Orbit Atlas center readable.
    dark_lane = smooth_mask(1.0 - luma, 0.35, 0.82) * np.power(dust, 0.9)
    img *= 1.0 - dark_lane[..., None] * 0.22
    yy = np.linspace(-1.0, 1.0, h, dtype=np.float32)[:, None]
    pole = np.clip(1.0 - np.abs(yy), 0.0, 1.0) ** 0.18
    img *= 0.66 + pole[..., None] * 0.34

    img = add_catalog_style_stars(img)
    img = img / (img + 0.28)
    img = np.power(np.clip(img, 0.0, 1.0), 0.84)
    img = np.clip(img * 1.02, 0.0, 1.0)

    out = Image.fromarray(np.uint8(img * 255))
    out.save(OUT_4K_PATH, quality=92, subsampling=1, optimize=True)
    print(f"wrote {OUT_4K_PATH} ({OUT_4K_PATH.stat().st_size / 1024 / 1024:.1f} MB)")


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
    raise RuntimeError(f"Unable to read EXR {path}")


def normalize_hdr(arr: np.ndarray) -> np.ndarray:
    arr = np.maximum(arr, 0.0)
    arr = arr / (np.percentile(arr, 99.92) + 1e-6)
    return np.clip(arr, 0.0, 12.0)


def build_8k(milkyway_path: Path, bright_path: Path, eso_path: Path) -> None:
    print("attempt EXR-based 8K sky")
    milky = normalize_hdr(read_exr(milkyway_path))
    bright = normalize_hdr(read_exr(bright_path))
    h, w, _ = milky.shape
    if (w, h) != (8192, 4096):
        raise RuntimeError(f"Expected NASA 8K EXR to be 8192x4096, got {w}x{h}")

    eso_img = Image.open(eso_path).convert("RGB").resize((w, h), Image.Resampling.LANCZOS)
    eso_img = ImageEnhance.Contrast(eso_img).enhance(1.18)
    eso_img = ImageEnhance.Color(eso_img).enhance(0.68)
    eso = np.asarray(eso_img).astype(np.float32) / 255.0

    milky_tone = 1.0 - np.exp(-milky * 1.55)
    bright_tone = np.power(np.clip(1.0 - np.exp(-bright * 2.4), 0.0, 1.0), 1.35)
    bright_luma = bright_tone @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    compact_stars = bright_tone * np.clip(0.18 + bright_luma[..., None] * 1.25, 0.0, 0.95)
    eso_luma = eso @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    eso_band = smooth_mask(eso_luma, 0.045, 0.36)

    img = milky_tone * np.array([0.56, 0.68, 0.96], dtype=np.float32) * 0.92
    img += compact_stars * 0.78
    img += eso * np.array([0.52, 0.64, 0.88], dtype=np.float32) * eso_band[..., None] * 0.12
    luma = img @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    floor = smooth_mask(luma, 0.015, 0.09)
    img *= 0.18 + floor[..., None] * 0.92
    img = img / (img + 0.46)
    img = np.power(np.clip(img, 0.0, 1.0), 0.86)

    yy = np.linspace(-1.0, 1.0, h, dtype=np.float32)[:, None]
    pole = np.clip(1.0 - np.abs(yy), 0.0, 1.0) ** 0.16
    img *= 0.55 + pole[..., None] * 0.45

    out = Image.fromarray(np.uint8(np.clip(img, 0.0, 1.0) * 255))
    out.save(OUT_8K_PATH, quality=92, subsampling=1, optimize=True)
    print(f"wrote {OUT_8K_PATH} ({OUT_8K_PATH.stat().st_size / 1024 / 1024:.1f} MB)")


def build() -> None:
    SKY_DIR.mkdir(parents=True, exist_ok=True)
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    eso_path = SOURCE_DIR / "eso0932a_large.jpg"
    download(ESO_LARGE_URL, eso_path)
    build_4k(eso_path)

    if os.environ.get("BUILD_SKY_8K", "").strip().lower() not in {"1", "true", "yes"}:
        return

    milkyway_path = SOURCE_DIR / "milkyway_2020_8k.exr"
    bright_path = SOURCE_DIR / "hiptyc_2020_8k.exr"
    download(NASA_MILKYWAY_URL, milkyway_path)
    download(NASA_BRIGHT_STARS_URL, bright_path)
    build_8k(milkyway_path, bright_path, eso_path)


if __name__ == "__main__":
    try:
        build()
    except Exception as exc:
        print(f"build failed: {exc}", file=sys.stderr)
        sys.exit(1)
