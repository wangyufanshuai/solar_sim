"""Build layered Orbit Atlas sky textures from cached NASA/ESO sources.

Outputs:
  orbit-atlas-v9-base-8k.jpg   8192x4096
  orbit-atlas-v9-base-4k.jpg   4096x2048
  orbit-atlas-v9-stars-4k.jpg  4096x2048 additive layer
  orbit-atlas-v9-stars-2k.jpg  2048x1024 mobile additive layer
  orbit-atlas-v9-dust-2k.jpg   2048x1024 grayscale modulation mask
  orbit-atlas-v48-base-8k.jpg  8192x4096 reference-grade base
  orbit-atlas-v48-base-4k.jpg  4096x2048 reference-grade mobile/fallback base
  orbit-atlas-v48-stars-4k.jpg 4096x2048 sparse primary-star layer
  orbit-atlas-v48-stars-2k.jpg 2048x1024 mobile sparse primary-star layer
  orbit-atlas-v48-dust-2k.jpg  2048x1024 dark-lane modulation mask
  orbit-atlas-v48-negative-space-2k.jpg 2048x1024 subject/backdrop noise restraint mask
  orbit-atlas-v56-base-8k.jpg  8192x4096 cinematic deep-space base
  orbit-atlas-v56-base-4k.jpg  4096x2048 cinematic mobile/fallback base
  orbit-atlas-v56-stars-4k.jpg 4096x2048 sparse primary + faint distant stars
  orbit-atlas-v56-stars-2k.jpg 2048x1024 mobile sparse primary + faint distant stars
  orbit-atlas-v56-dust-2k.jpg  2048x1024 high-contrast Milky Way dark-lane mask
  orbit-atlas-v56-nebula-haze-2k.jpg 2048x1024 soft statistical nebula haze layer
  orbit-atlas-v56-negative-space-2k.jpg 2048x1024 close-up subject backdrop matte
  orbit-atlas-v57-base-8k.jpg  8192x4096 sparse deep-space base from 16K input
  orbit-atlas-v57-base-4k.jpg  4096x2048 sparse deep-space mobile/fallback base
  orbit-atlas-v57-primary-stars-4k.jpg 4096x2048 sparse primary-star layer
  orbit-atlas-v57-primary-stars-2k.jpg 2048x1024 mobile sparse primary-star layer
  orbit-atlas-v57-distant-stars-4k.jpg 4096x2048 ultra-faint distant-star layer
  orbit-atlas-v57-distant-stars-2k.jpg 2048x1024 mobile ultra-faint distant-star layer
  orbit-atlas-v57-dust-4k.jpg  4096x2048 deep Milky Way dark-lane mask
  orbit-atlas-v57-dust-2k.jpg  2048x1024 mobile dark-lane mask
  orbit-atlas-v57-nebula-haze-4k.jpg 4096x2048 barely visible nebula haze layer
  orbit-atlas-v57-nebula-haze-2k.jpg 2048x1024 mobile nebula haze layer
  orbit-atlas-v57-negative-space-4k.jpg 4096x2048 selected-body negative-space matte
  orbit-atlas-v57-negative-space-2k.jpg 2048x1024 mobile negative-space matte
  orbit-atlas-v59-base-8k.jpg 8192x4096 restrained peripheral Milky Way base
  orbit-atlas-v59-base-4k.jpg 4096x2048 restrained mobile/fallback base
  orbit-atlas-v59-primary-stars-4k.jpg 4096x2048 sparse primary-star layer
  orbit-atlas-v59-primary-stars-2k.jpg 2048x1024 mobile sparse primary-star layer
  orbit-atlas-v59-distant-stars-4k.jpg 4096x2048 reduced distant-star layer
  orbit-atlas-v59-distant-stars-2k.jpg 2048x1024 mobile reduced distant-star layer
  orbit-atlas-v59-dust-4k.jpg 4096x2048 restrained dark-lane mask
  orbit-atlas-v59-dust-2k.jpg 2048x1024 mobile dark-lane mask
  orbit-atlas-v59-nebula-haze-4k.jpg 4096x2048 near-black haze layer
  orbit-atlas-v59-nebula-haze-2k.jpg 2048x1024 mobile near-black haze layer
  orbit-atlas-v59-negative-space-4k.jpg 4096x2048 strong subject negative-space matte
  orbit-atlas-v59-negative-space-2k.jpg 2048x1024 mobile subject negative-space matte
  orbit-atlas-v60-base-4k.jpg 4096x2048 visible low-noise balanced background
  orbit-atlas-v60-base-2k.jpg 2048x1024 mobile visible low-noise background
  orbit-atlas-v60-primary-stars-4k.jpg 4096x2048 close-up safe primary-star haze
  orbit-atlas-v60-primary-stars-2k.jpg 2048x1024 mobile close-up safe primary-star haze
  orbit-atlas-v60-dust-2k.jpg 2048x1024 low-cost dark-lane mask
  orbit-atlas-v60-negative-space-2k.jpg 2048x1024 subject matte with visible low-luma floor
  orbit-atlas-v61-base-4k.jpg 4096x2048 visual-reset readable deep-space base
  orbit-atlas-v61-base-2k.jpg 2048x1024 mobile visual-reset base
  orbit-atlas-v61-primary-stars-4k.jpg 4096x2048 readable primary-star layer
  orbit-atlas-v61-primary-stars-2k.jpg 2048x1024 mobile readable primary-star layer
  orbit-atlas-v61-dust-2k.jpg 2048x1024 visual-reset dark-lane mask
  orbit-atlas-v61-negative-space-2k.jpg 2048x1024 lighter subject matte
  orbit-atlas-v67-galactic-depth-base-4k.jpg 4096x2048 cinematic sky-lock base
  orbit-atlas-v67-galactic-depth-base-2k.jpg 2048x1024 mobile cinematic sky-lock base
  orbit-atlas-v67-primary-stars-4k.jpg 4096x2048 dense primary-star layer
  orbit-atlas-v67-primary-stars-2k.jpg 2048x1024 mobile dense primary-star layer
  orbit-atlas-v67-dust-2k.jpg 2048x1024 same-source dust modulation mask
  orbit-atlas-v67-negative-space-2k.jpg 2048x1024 same-source subject matte
  orbit-atlas-v68-reference-backdrop-base-4k.jpg 4096x2048 centered reference-backdrop base
  orbit-atlas-v68-reference-backdrop-base-2k.jpg 2048x1024 mobile centered reference-backdrop base
  orbit-atlas-v68-reference-primary-stars-4k.jpg 4096x2048 dense filtered primary-star layer
  orbit-atlas-v68-reference-primary-stars-2k.jpg 2048x1024 mobile dense filtered primary-star layer
  orbit-atlas-v68-reference-dust-2k.jpg 2048x1024 same-source dust modulation mask
  orbit-atlas-v68-reference-negative-space-2k.jpg 2048x1024 same-source subject matte

The two NASA EXR files are processed sequentially to avoid holding both HDR
arrays in memory. v56 adds one optional NASA SVS Elsewhere Starfield EXR input.
v57 adds optional NASA SVS 16K inputs, downsampled before shaping runtime layers.
Source downloads remain cached under .cache/sky-sources.
"""

from __future__ import annotations

import gc
import os
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SKY_DIR = ROOT / "public" / "textures" / "sky"
SOURCE_DIR = ROOT / ".cache" / "sky-sources"

BASE_8K = SKY_DIR / "orbit-atlas-v9-base-8k.jpg"
BASE_4K = SKY_DIR / "orbit-atlas-v9-base-4k.jpg"
STARS_4K = SKY_DIR / "orbit-atlas-v9-stars-4k.jpg"
STARS_2K = SKY_DIR / "orbit-atlas-v9-stars-2k.jpg"
DUST_2K = SKY_DIR / "orbit-atlas-v9-dust-2k.jpg"
V48_BASE_8K = SKY_DIR / "orbit-atlas-v48-base-8k.jpg"
V48_BASE_4K = SKY_DIR / "orbit-atlas-v48-base-4k.jpg"
V48_STARS_4K = SKY_DIR / "orbit-atlas-v48-stars-4k.jpg"
V48_STARS_2K = SKY_DIR / "orbit-atlas-v48-stars-2k.jpg"
V48_DUST_2K = SKY_DIR / "orbit-atlas-v48-dust-2k.jpg"
V48_NEGATIVE_SPACE_2K = SKY_DIR / "orbit-atlas-v48-negative-space-2k.jpg"
V56_BASE_8K = SKY_DIR / "orbit-atlas-v56-base-8k.jpg"
V56_BASE_4K = SKY_DIR / "orbit-atlas-v56-base-4k.jpg"
V56_STARS_4K = SKY_DIR / "orbit-atlas-v56-stars-4k.jpg"
V56_STARS_2K = SKY_DIR / "orbit-atlas-v56-stars-2k.jpg"
V56_DUST_2K = SKY_DIR / "orbit-atlas-v56-dust-2k.jpg"
V56_NEBULA_HAZE_2K = SKY_DIR / "orbit-atlas-v56-nebula-haze-2k.jpg"
V56_NEGATIVE_SPACE_2K = SKY_DIR / "orbit-atlas-v56-negative-space-2k.jpg"
V57_BASE_8K = SKY_DIR / "orbit-atlas-v57-base-8k.jpg"
V57_BASE_4K = SKY_DIR / "orbit-atlas-v57-base-4k.jpg"
V57_PRIMARY_STARS_4K = SKY_DIR / "orbit-atlas-v57-primary-stars-4k.jpg"
V57_PRIMARY_STARS_2K = SKY_DIR / "orbit-atlas-v57-primary-stars-2k.jpg"
V57_DISTANT_STARS_4K = SKY_DIR / "orbit-atlas-v57-distant-stars-4k.jpg"
V57_DISTANT_STARS_2K = SKY_DIR / "orbit-atlas-v57-distant-stars-2k.jpg"
V57_DUST_4K = SKY_DIR / "orbit-atlas-v57-dust-4k.jpg"
V57_DUST_2K = SKY_DIR / "orbit-atlas-v57-dust-2k.jpg"
V57_NEBULA_HAZE_4K = SKY_DIR / "orbit-atlas-v57-nebula-haze-4k.jpg"
V57_NEBULA_HAZE_2K = SKY_DIR / "orbit-atlas-v57-nebula-haze-2k.jpg"
V57_NEGATIVE_SPACE_4K = SKY_DIR / "orbit-atlas-v57-negative-space-4k.jpg"
V57_NEGATIVE_SPACE_2K = SKY_DIR / "orbit-atlas-v57-negative-space-2k.jpg"
V59_BASE_8K = SKY_DIR / "orbit-atlas-v59-base-8k.jpg"
V59_BASE_4K = SKY_DIR / "orbit-atlas-v59-base-4k.jpg"
V59_PRIMARY_STARS_4K = SKY_DIR / "orbit-atlas-v59-primary-stars-4k.jpg"
V59_PRIMARY_STARS_2K = SKY_DIR / "orbit-atlas-v59-primary-stars-2k.jpg"
V59_DISTANT_STARS_4K = SKY_DIR / "orbit-atlas-v59-distant-stars-4k.jpg"
V59_DISTANT_STARS_2K = SKY_DIR / "orbit-atlas-v59-distant-stars-2k.jpg"
V59_DUST_4K = SKY_DIR / "orbit-atlas-v59-dust-4k.jpg"
V59_DUST_2K = SKY_DIR / "orbit-atlas-v59-dust-2k.jpg"
V59_NEBULA_HAZE_4K = SKY_DIR / "orbit-atlas-v59-nebula-haze-4k.jpg"
V59_NEBULA_HAZE_2K = SKY_DIR / "orbit-atlas-v59-nebula-haze-2k.jpg"
V59_NEGATIVE_SPACE_4K = SKY_DIR / "orbit-atlas-v59-negative-space-4k.jpg"
V59_NEGATIVE_SPACE_2K = SKY_DIR / "orbit-atlas-v59-negative-space-2k.jpg"
V60_BASE_4K = SKY_DIR / "orbit-atlas-v60-base-4k.jpg"
V60_BASE_2K = SKY_DIR / "orbit-atlas-v60-base-2k.jpg"
V60_PRIMARY_STARS_4K = SKY_DIR / "orbit-atlas-v60-primary-stars-4k.jpg"
V60_PRIMARY_STARS_2K = SKY_DIR / "orbit-atlas-v60-primary-stars-2k.jpg"
V60_DUST_2K = SKY_DIR / "orbit-atlas-v60-dust-2k.jpg"
V60_NEGATIVE_SPACE_2K = SKY_DIR / "orbit-atlas-v60-negative-space-2k.jpg"
V61_BASE_4K = SKY_DIR / "orbit-atlas-v61-base-4k.jpg"
V61_BASE_2K = SKY_DIR / "orbit-atlas-v61-base-2k.jpg"
V61_PRIMARY_STARS_4K = SKY_DIR / "orbit-atlas-v61-primary-stars-4k.jpg"
V61_PRIMARY_STARS_2K = SKY_DIR / "orbit-atlas-v61-primary-stars-2k.jpg"
V61_DUST_2K = SKY_DIR / "orbit-atlas-v61-dust-2k.jpg"
V61_NEGATIVE_SPACE_2K = SKY_DIR / "orbit-atlas-v61-negative-space-2k.jpg"
V61_RESET_BASE_4K = SKY_DIR / "orbit-atlas-v61-reset-base-4k.jpg"
V61_RESET_BASE_2K = SKY_DIR / "orbit-atlas-v61-reset-base-2k.jpg"
V61_RESET_PRIMARY_STARS_4K = SKY_DIR / "orbit-atlas-v61-reset-primary-stars-4k.jpg"
V61_RESET_PRIMARY_STARS_2K = SKY_DIR / "orbit-atlas-v61-reset-primary-stars-2k.jpg"
V61_RESET_DUST_2K = SKY_DIR / "orbit-atlas-v61-reset-dust-2k.jpg"
V61_RESET_NEGATIVE_SPACE_2K = SKY_DIR / "orbit-atlas-v61-reset-negative-space-2k.jpg"
V66_SOURCE_4K = SKY_DIR / "nasa_milkyway_2020_4k_balanced.jpg"
V66_BASE_4K = SKY_DIR / "orbit-atlas-v66-milky-way-depth-base-4k.jpg"
V66_BASE_2K = SKY_DIR / "orbit-atlas-v66-milky-way-depth-base-2k.jpg"
V67_BASE_4K = SKY_DIR / "orbit-atlas-v67-galactic-depth-base-4k.jpg"
V67_BASE_2K = SKY_DIR / "orbit-atlas-v67-galactic-depth-base-2k.jpg"
V67_PRIMARY_STARS_4K = SKY_DIR / "orbit-atlas-v67-primary-stars-4k.jpg"
V67_PRIMARY_STARS_2K = SKY_DIR / "orbit-atlas-v67-primary-stars-2k.jpg"
V67_DUST_2K = SKY_DIR / "orbit-atlas-v67-dust-2k.jpg"
V67_NEGATIVE_SPACE_2K = SKY_DIR / "orbit-atlas-v67-negative-space-2k.jpg"
V68_BASE_4K = SKY_DIR / "orbit-atlas-v68-reference-backdrop-base-4k.jpg"
V68_BASE_2K = SKY_DIR / "orbit-atlas-v68-reference-backdrop-base-2k.jpg"
V68_PRIMARY_STARS_4K = SKY_DIR / "orbit-atlas-v68-reference-primary-stars-4k.jpg"
V68_PRIMARY_STARS_2K = SKY_DIR / "orbit-atlas-v68-reference-primary-stars-2k.jpg"
V68_DUST_2K = SKY_DIR / "orbit-atlas-v68-reference-dust-2k.jpg"
V68_NEGATIVE_SPACE_2K = SKY_DIR / "orbit-atlas-v68-reference-negative-space-2k.jpg"

NASA_MILKYWAY_URL = "https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/milkyway_2020_8k.exr"
NASA_BRIGHT_STARS_URL = "https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/hiptyc_2020_8k.exr"
NASA_RANDOM_STARFIELD_URL = "https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004856/starmap_random_2020_8k_gal.exr"
NASA_MILKYWAY_16K_URL = "https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/milkyway_2020_16k.exr"
NASA_BRIGHT_STARS_16K_URL = "https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/hiptyc_2020_16k.exr"
NASA_RANDOM_STARFIELD_16K_URL = "https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004856/starmap_random_2020_16k_gal.exr"


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 1024 * 1024:
        print(f"cached {dest.name} ({dest.stat().st_size / 1024 / 1024:.1f} MB)")
        return
    tmp = dest.with_suffix(dest.suffix + ".part")
    print(f"download {url}")
    with urllib.request.urlopen(url, timeout=180) as src, tmp.open("wb") as out:
        while chunk := src.read(1024 * 1024):
            out.write(chunk)
    tmp.replace(dest)


def read_exr(path: Path) -> np.ndarray:
    os.environ.setdefault("OPENCV_IO_ENABLE_OPENEXR", "1")
    import cv2  # type: ignore

    arr = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if arr is None:
        raise RuntimeError(f"Unable to read EXR {path}")
    if arr.ndim == 2:
        arr = np.repeat(arr[..., None], 3, axis=2)
    arr = arr[..., :3][:, :, ::-1].astype(np.float32, copy=False)
    np.nan_to_num(arr, copy=False, nan=0.0, posinf=0.0, neginf=0.0)
    return arr


def normalize_hdr_in_place(arr: np.ndarray, percentile: float) -> None:
    np.maximum(arr, 0.0, out=arr)
    scale = float(np.percentile(arr, percentile)) + 1e-6
    arr /= scale
    np.clip(arr, 0.0, 10.0, out=arr)


def save_rgb_jpg(arr: np.ndarray, path: Path, quality: int = 92) -> None:
    rgb8 = np.uint8(np.clip(arr, 0.0, 1.0) * 255.0)
    Image.fromarray(rgb8).save(path, quality=quality, subsampling=1, optimize=True)
    print(f"wrote {path.name} ({path.stat().st_size / 1024 / 1024:.1f} MB)")


def save_gray_jpg(arr: np.ndarray, path: Path, quality: int = 92) -> None:
    gray8 = np.uint8(np.clip(arr, 0.0, 1.0) * 255.0)
    Image.fromarray(gray8).save(path, quality=quality, optimize=True)
    print(f"wrote {path.name} ({path.stat().st_size / 1024 / 1024:.1f} MB)")


def resize_rgb(arr: np.ndarray, width: int, height: int) -> np.ndarray:
    import cv2  # type: ignore

    return cv2.resize(arr, (width, height), interpolation=cv2.INTER_AREA)


def luma_of(arr: np.ndarray) -> np.ndarray:
    return arr[..., 0] * 0.2126 + arr[..., 1] * 0.7152 + arr[..., 2] * 0.0722


def smoothstep(edge0: float, edge1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - edge0) / max(edge1 - edge0, 1e-6), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def build_v66_milky_way_depth_layers() -> None:
    import cv2  # type: ignore

    if not V66_SOURCE_4K.exists():
        raise RuntimeError(f"Missing local NASA source {V66_SOURCE_4K}")

    print("build Orbit Atlas v66 low-frequency Milky Way depth base")
    source = np.asarray(Image.open(V66_SOURCE_4K).convert("RGB"), dtype=np.float32) / 255.0
    broad = cv2.GaussianBlur(source, (0, 0), 1.4)
    dust_detail = np.clip(source - broad, -0.045, 0.032)
    low_frequency = np.clip(broad + dust_detail * 0.48, 0.0, 1.0)
    low_frequency = np.minimum(low_frequency, np.percentile(low_frequency, 99.8))
    filmic = low_frequency / (low_frequency + 0.42)
    gray = luma_of(filmic)
    filmic = gray[..., None] + (filmic - gray[..., None]) * 0.48

    floor = np.zeros_like(filmic)
    floor[..., 0] = 0.0045
    floor[..., 1] = 0.0060
    floor[..., 2] = 0.0090
    base4 = floor + filmic * np.array([0.34, 0.38, 0.46], dtype=np.float32)
    np.clip(base4, 0.0, 0.28, out=base4)
    save_rgb_jpg(base4, V66_BASE_4K, quality=92)
    base2 = resize_rgb(base4, 2048, 1024)
    save_rgb_jpg(base2, V66_BASE_2K, quality=91)


def build_v67_galactic_depth_layers() -> None:
    import cv2  # type: ignore

    if not V66_SOURCE_4K.exists():
        raise RuntimeError(f"Missing local NASA source {V66_SOURCE_4K}")

    print("build Orbit Atlas v67 galactic dust and starfield depth layers")
    source = np.asarray(Image.open(V66_SOURCE_4K).convert("RGB"), dtype=np.float32) / 255.0
    source = np.clip(source, 0.0, 1.0)
    luma = luma_of(source)
    broad = cv2.GaussianBlur(source, (0, 0), 7.5)
    mid = cv2.GaussianBlur(source, (0, 0), 1.1)
    detail = np.clip(mid - broad, -0.09, 0.16)
    star_local = np.clip(source - cv2.GaussianBlur(source, (0, 0), 0.72), 0.0, 1.0)
    star_local_luma = luma_of(star_local)
    broad_luma = luma_of(broad)
    band = smoothstep(0.018, 0.27, broad_luma)

    star_mask = smoothstep(0.022, 0.12, star_local_luma) * smoothstep(0.12, 0.56, luma)
    star_mask *= 1.0 - smoothstep(0.48, 0.86, broad_luma) * 0.72
    y = np.linspace(0.0, 1.0, source.shape[0], dtype=np.float32)[:, None]
    pole_guard = smoothstep(0.025, 0.105, y) * (1.0 - smoothstep(0.895, 0.975, y))
    star_mask *= pole_guard
    star_mask = cv2.GaussianBlur(star_mask.astype(np.float32), (0, 0), 0.12)

    base = broad + detail * 0.68 - star_mask[..., None] * source * 0.18
    base = np.clip(base, 0.0, np.percentile(base, 99.72))
    base = base / (base + 0.39)
    gray = luma_of(base)
    base = gray[..., None] + (base - gray[..., None]) * 0.48
    base = base * np.array([0.31, 0.34, 0.41], dtype=np.float32)
    base += np.array([0.0024, 0.0031, 0.0049], dtype=np.float32)
    base *= 1.0 - smoothstep(0.42, 0.88, broad_luma)[..., None] * 0.24
    np.clip(base, 0.0, 0.24, out=base)

    primary_stars = source * np.power(np.clip(star_mask, 0.0, 1.0), 1.08)[..., None] * 2.05
    primary_stars = gray[..., None] * 0.0 + primary_stars
    primary_stars = np.clip(primary_stars, 0.0, 1.0)

    fine_luma = luma_of(mid)
    local_shadow = np.clip((broad_luma - fine_luma + 0.035) / 0.18, 0.0, 1.0)
    dust = np.clip((0.16 + local_shadow * 0.88) * band, 0.0, 1.0)
    dust = cv2.GaussianBlur(dust.astype(np.float32), (0, 0), 0.65)

    negative = (1.0 - smoothstep(0.018, 0.24, broad_luma)) * 0.64
    negative += smoothstep(0.5, 0.95, star_mask) * 0.08
    negative += smoothstep(0.46, 0.95, band) * 0.12
    negative = cv2.GaussianBlur(np.clip(negative, 0.0, 1.0).astype(np.float32), (0, 0), 1.2)

    save_rgb_jpg(base, V67_BASE_4K, quality=93)
    save_rgb_jpg(resize_rgb(base, 2048, 1024), V67_BASE_2K, quality=92)
    save_rgb_jpg(primary_stars, V67_PRIMARY_STARS_4K, quality=92)
    save_rgb_jpg(resize_rgb(primary_stars, 2048, 1024), V67_PRIMARY_STARS_2K, quality=91)
    save_gray_jpg(resize_rgb(dust[..., None].repeat(3, axis=2), 2048, 1024)[..., 0], V67_DUST_2K, quality=91)
    save_gray_jpg(resize_rgb(negative[..., None].repeat(3, axis=2), 2048, 1024)[..., 0], V67_NEGATIVE_SPACE_2K, quality=91)


def build_v68_reference_backdrop_layers() -> None:
    import cv2  # type: ignore

    if not V66_SOURCE_4K.exists():
        raise RuntimeError(f"Missing local NASA source {V66_SOURCE_4K}")

    print("build Orbit Atlas v68 centered reference backdrop layers")
    source = np.asarray(Image.open(V66_SOURCE_4K).convert("RGB"), dtype=np.float32) / 255.0
    source = np.clip(source, 0.0, 1.0)
    luma = luma_of(source)
    broad = cv2.GaussianBlur(source, (0, 0), 6.2)
    mid = cv2.GaussianBlur(source, (0, 0), 0.86)
    fine = cv2.GaussianBlur(source, (0, 0), 0.34)
    broad_luma = luma_of(broad)
    mid_luma = luma_of(mid)
    fine_luma = luma_of(fine)
    band = smoothstep(0.014, 0.235, broad_luma)
    mid_cloud = np.clip(mid - broad, -0.11, 0.19)
    dark_lane = np.clip((broad_luma - mid_luma + 0.032) / 0.155, 0.0, 1.0)
    dark_lane = cv2.GaussianBlur(dark_lane.astype(np.float32), (0, 0), 0.7)

    star_local = np.clip(source - cv2.GaussianBlur(source, (0, 0), 0.58), 0.0, 1.0)
    star_local_luma = luma_of(star_local)
    star_mask = smoothstep(0.014, 0.088, star_local_luma) * smoothstep(0.06, 0.46, luma)
    star_mask *= 1.0 - smoothstep(0.18, 0.52, broad_luma) * 0.84
    star_mask *= 1.0 - smoothstep(0.48, 0.86, np.abs(fine_luma - mid_luma)) * 0.24
    y = np.linspace(0.0, 1.0, source.shape[0], dtype=np.float32)[:, None]
    pole_guard = smoothstep(0.024, 0.11, y) * (1.0 - smoothstep(0.89, 0.976, y))
    star_mask *= pole_guard
    star_mask = cv2.GaussianBlur(star_mask.astype(np.float32), (0, 0), 0.1)

    base = broad + mid_cloud * 0.86
    base *= 1.0 - dark_lane[..., None] * band[..., None] * 0.38
    base *= 1.0 - smoothstep(0.012, 0.062, star_local_luma)[..., None] * 0.46
    base = np.clip(base, 0.0, np.percentile(base, 99.78))
    base = base / (base + 0.34)
    gray = luma_of(base)
    base = gray[..., None] * np.array([0.56, 0.66, 0.9], dtype=np.float32) + (base - gray[..., None]) * 0.14
    base *= np.array([0.68, 0.76, 0.96], dtype=np.float32)
    base += np.array([0.0042, 0.0056, 0.0085], dtype=np.float32)
    highlight_guard = smoothstep(0.24, 0.68, broad_luma)
    base *= 1.0 - highlight_guard[..., None] * 0.32
    lane_guard = smoothstep(0.32, 0.74, band) * (1.0 - dark_lane * 0.58)
    base *= 1.0 - lane_guard[..., None] * 0.14
    np.clip(base, 0.0, 0.28, out=base)

    primary_stars = source * np.power(np.clip(star_mask, 0.0, 1.0), 1.04)[..., None] * 1.75
    primary_stars *= (1.0 - smoothstep(0.18, 0.54, broad_luma) * 0.78)[..., None]
    primary_stars *= (0.62 + dark_lane[..., None] * 0.34)
    np.clip(primary_stars, 0.0, 1.0, out=primary_stars)

    dust = np.clip((0.18 + dark_lane * 0.9) * band, 0.0, 1.0)
    dust = cv2.GaussianBlur(dust.astype(np.float32), (0, 0), 0.58)

    negative = (1.0 - smoothstep(0.016, 0.24, broad_luma)) * 0.5
    negative += smoothstep(0.7, 0.96, star_mask) * 0.06
    negative += smoothstep(0.58, 0.96, band) * 0.08
    negative = cv2.GaussianBlur(np.clip(negative, 0.0, 1.0).astype(np.float32), (0, 0), 1.05)

    save_rgb_jpg(base, V68_BASE_4K, quality=93)
    save_rgb_jpg(resize_rgb(base, 2048, 1024), V68_BASE_2K, quality=92)
    save_rgb_jpg(primary_stars, V68_PRIMARY_STARS_4K, quality=92)
    save_rgb_jpg(resize_rgb(primary_stars, 2048, 1024), V68_PRIMARY_STARS_2K, quality=91)
    save_gray_jpg(resize_rgb(dust[..., None].repeat(3, axis=2), 2048, 1024)[..., 0], V68_DUST_2K, quality=91)
    save_gray_jpg(resize_rgb(negative[..., None].repeat(3, axis=2), 2048, 1024)[..., 0], V68_NEGATIVE_SPACE_2K, quality=91)


def build_base_and_dust(milkyway_path: Path) -> None:
    print("build Orbit Atlas v9 base and dust")
    base = read_exr(milkyway_path)
    if base.shape[:2] != (4096, 8192):
        raise RuntimeError(f"Expected 8192x4096 source, got {base.shape[1]}x{base.shape[0]}")
    normalize_hdr_in_place(base, 99.94)

    # Filmic HDR compression that keeps dust structure instead of a white band.
    np.multiply(base, -1.28, out=base)
    np.exp(base, out=base)
    np.subtract(1.0, base, out=base)
    base[..., 0] *= 0.68
    base[..., 1] *= 0.76
    base[..., 2] *= 0.88

    luma = (
        base[..., 0] * 0.2126
        + base[..., 1] * 0.7152
        + base[..., 2] * 0.0722
    )
    lane = np.clip((0.36 - luma) / 0.31, 0.0, 1.0)
    band = np.clip((luma - 0.018) / 0.24, 0.0, 1.0)
    dust = np.power(lane * band, 0.72)
    base *= (1.0 - dust[..., None] * 0.31)

    # Gentle global tone curve; runtime shader only performs final calibration.
    base /= base + 0.44
    np.power(np.clip(base, 0.0, 1.0), 0.94, out=base)
    save_rgb_jpg(base, BASE_8K, quality=93)

    base4 = resize_rgb(base, 4096, 2048)
    save_rgb_jpg(base4, BASE_4K, quality=92)
    del base4

    dust2 = resize_rgb(dust, 2048, 1024)
    save_gray_jpg(dust2, DUST_2K, quality=91)
    del dust2, dust, lane, band, luma, base
    gc.collect()


def build_reference_grade_base_and_masks(milkyway_path: Path) -> None:
    print("build Orbit Atlas v48 reference-grade base, dust and negative-space masks")
    base = read_exr(milkyway_path)
    if base.shape[:2] != (4096, 8192):
        raise RuntimeError(f"Expected 8192x4096 source, got {base.shape[1]}x{base.shape[0]}")
    normalize_hdr_in_place(base, 99.92)

    # Darker filmic compression than v9: keep the Milky Way as a layered band,
    # not a bright wall, while leaving final exposure to the runtime shader.
    np.multiply(base, -1.02, out=base)
    np.exp(base, out=base)
    np.subtract(1.0, base, out=base)
    base[..., 0] *= 0.56
    base[..., 1] *= 0.68
    base[..., 2] *= 0.9

    luma = luma_of(base)
    bright_grain = np.clip((luma - 0.038) / 0.26, 0.0, 1.0)
    bright_grain = np.power(bright_grain, 1.35)
    dark_lane = np.clip((0.31 - luma) / 0.28, 0.0, 1.0)
    band = np.clip((luma - 0.014) / 0.22, 0.0, 1.0)
    dust = np.power(dark_lane * band, 0.64)
    negative_space = np.clip(bright_grain * 0.62 + dust * 0.48, 0.0, 1.0)

    base *= 1.0 - dust[..., None] * 0.34
    base *= 1.0 - bright_grain[..., None] * 0.26
    base /= base + 0.62
    np.power(np.clip(base, 0.0, 1.0), 1.04, out=base)

    save_rgb_jpg(base, V48_BASE_8K, quality=93)
    base4 = resize_rgb(base, 4096, 2048)
    save_rgb_jpg(base4, V48_BASE_4K, quality=92)
    del base4

    dust2 = resize_rgb(dust, 2048, 1024)
    save_gray_jpg(dust2, V48_DUST_2K, quality=91)
    del dust2

    negative2 = resize_rgb(negative_space, 2048, 1024)
    save_gray_jpg(negative2, V48_NEGATIVE_SPACE_2K, quality=91)
    del negative2, negative_space, dust, dark_lane, band, bright_grain, luma, base
    gc.collect()


def build_cinematic_backdrop_base_and_masks(milkyway_path: Path) -> None:
    print("build Orbit Atlas v56 cinematic deep-space base, dust, nebula haze and negative-space masks")
    base = read_exr(milkyway_path)
    if base.shape[:2] != (4096, 8192):
        raise RuntimeError(f"Expected 8192x4096 source, got {base.shape[1]}x{base.shape[0]}")
    normalize_hdr_in_place(base, 99.9)

    # v56 pushes the background closer to a sparse cinematic scientific
    # backdrop: colder dark floor, clearer dust lanes and fewer bright walls.
    np.multiply(base, -0.86, out=base)
    np.exp(base, out=base)
    np.subtract(1.0, base, out=base)
    base[..., 0] *= 0.46
    base[..., 1] *= 0.58
    base[..., 2] *= 0.86

    luma = luma_of(base)
    bright_wall = np.clip((luma - 0.035) / 0.22, 0.0, 1.0)
    bright_wall = np.power(bright_wall, 1.62)
    dark_lane = np.clip((0.34 - luma) / 0.3, 0.0, 1.0)
    band = np.clip((luma - 0.01) / 0.2, 0.0, 1.0)
    dust = np.power(dark_lane * band, 0.58)
    nebula_haze = np.power(np.clip((luma - 0.018) / 0.18, 0.0, 1.0), 1.18)
    nebula_haze *= 1.0 - np.power(dust, 1.4) * 0.62
    negative_space = np.clip(bright_wall * 0.58 + dust * 0.58 + nebula_haze * 0.2, 0.0, 1.0)

    base *= 1.0 - dust[..., None] * 0.42
    base *= 1.0 - bright_wall[..., None] * 0.34
    base += nebula_haze[..., None] * np.array([0.0025, 0.004, 0.007], dtype=np.float32)
    base /= base + 0.78
    np.power(np.clip(base, 0.0, 1.0), 1.08, out=base)

    save_rgb_jpg(base, V56_BASE_8K, quality=93)
    base4 = resize_rgb(base, 4096, 2048)
    save_rgb_jpg(base4, V56_BASE_4K, quality=92)
    del base4, base

    dust2 = resize_rgb(dust, 2048, 1024)
    save_gray_jpg(dust2, V56_DUST_2K, quality=91)
    del dust2

    haze2 = resize_rgb(nebula_haze, 2048, 1024)
    save_gray_jpg(haze2, V56_NEBULA_HAZE_2K, quality=91)
    del haze2

    negative2 = resize_rgb(negative_space, 2048, 1024)
    save_gray_jpg(negative2, V56_NEGATIVE_SPACE_2K, quality=91)
    del negative2, negative_space, nebula_haze, dust, dark_lane, band, bright_wall, luma
    gc.collect()


def build_bright_stars(bright_path: Path) -> None:
    print("build Orbit Atlas v9 bright-star layers")
    stars = read_exr(bright_path)
    if stars.shape[:2] != (4096, 8192):
        raise RuntimeError(f"Expected 8192x4096 source, got {stars.shape[1]}x{stars.shape[0]}")
    normalize_hdr_in_place(stars, 99.985)

    # Resize before expensive shaping: the source catalog contains compact stars.
    stars = resize_rgb(stars, 4096, 2048)
    np.multiply(stars, -2.8, out=stars)
    np.exp(stars, out=stars)
    np.subtract(1.0, stars, out=stars)
    luma = (
        stars[..., 0] * 0.2126
        + stars[..., 1] * 0.7152
        + stars[..., 2] * 0.0722
    )
    gate = np.clip((luma - 0.045) / 0.31, 0.0, 1.0)
    gate = np.power(gate, 1.7)
    stars *= gate[..., None]
    stars[..., 0] *= 1.02
    stars[..., 1] *= 0.96
    stars[..., 2] *= 0.88
    np.clip(stars, 0.0, 1.0, out=stars)
    save_rgb_jpg(stars, STARS_4K, quality=92)

    stars2 = resize_rgb(stars, 2048, 1024)
    save_rgb_jpg(stars2, STARS_2K, quality=91)
    del stars2, stars, luma, gate
    gc.collect()


def build_reference_grade_stars(bright_path: Path) -> None:
    print("build Orbit Atlas v48 sparse primary-star layers")
    stars = read_exr(bright_path)
    if stars.shape[:2] != (4096, 8192):
        raise RuntimeError(f"Expected 8192x4096 source, got {stars.shape[1]}x{stars.shape[0]}")
    normalize_hdr_in_place(stars, 99.99)

    stars = resize_rgb(stars, 4096, 2048)
    np.multiply(stars, -3.15, out=stars)
    np.exp(stars, out=stars)
    np.subtract(1.0, stars, out=stars)
    luma = luma_of(stars)
    primary_gate = np.clip((luma - 0.075) / 0.34, 0.0, 1.0)
    primary_gate = np.power(primary_gate, 2.35)
    shoulder_gate = np.clip((luma - 0.18) / 0.46, 0.0, 1.0)
    shoulder_gate = np.power(shoulder_gate, 0.82)
    gate = np.clip(primary_gate * 0.78 + shoulder_gate * 0.24, 0.0, 1.0)
    stars *= gate[..., None]
    stars[..., 0] *= 0.94
    stars[..., 1] *= 0.96
    stars[..., 2] *= 1.03
    np.clip(stars, 0.0, 1.0, out=stars)
    save_rgb_jpg(stars, V48_STARS_4K, quality=92)

    stars2 = resize_rgb(stars, 2048, 1024)
    save_rgb_jpg(stars2, V48_STARS_2K, quality=91)
    del stars2, stars, luma, primary_gate, shoulder_gate, gate
    gc.collect()


def build_cinematic_backdrop_stars(bright_path: Path, random_starfield_path: Path) -> None:
    print("build Orbit Atlas v56 sparse primary-star and faint distant-field layers")
    primary = read_exr(bright_path)
    if primary.shape[:2] != (4096, 8192):
        raise RuntimeError(f"Expected 8192x4096 source, got {primary.shape[1]}x{primary.shape[0]}")
    normalize_hdr_in_place(primary, 99.992)
    primary = resize_rgb(primary, 4096, 2048)
    np.multiply(primary, -3.55, out=primary)
    np.exp(primary, out=primary)
    np.subtract(1.0, primary, out=primary)
    primary_luma = luma_of(primary)
    primary_gate = np.clip((primary_luma - 0.1) / 0.36, 0.0, 1.0)
    primary_gate = np.power(primary_gate, 2.85)
    shoulder_gate = np.clip((primary_luma - 0.24) / 0.5, 0.0, 1.0)
    shoulder_gate = np.power(shoulder_gate, 0.92)
    primary *= np.clip(primary_gate * 0.86 + shoulder_gate * 0.16, 0.0, 1.0)[..., None]
    primary[..., 0] *= 0.86
    primary[..., 1] *= 0.93
    primary[..., 2] *= 1.08

    distant = read_exr(random_starfield_path)
    if distant.shape[:2] != (4096, 8192):
        raise RuntimeError(f"Expected 8192x4096 source, got {distant.shape[1]}x{distant.shape[0]}")
    normalize_hdr_in_place(distant, 99.98)
    distant = resize_rgb(distant, 4096, 2048)
    np.multiply(distant, -2.05, out=distant)
    np.exp(distant, out=distant)
    np.subtract(1.0, distant, out=distant)
    distant_luma = luma_of(distant)
    distant_gate = np.clip((distant_luma - 0.12) / 0.44, 0.0, 1.0)
    distant_gate = np.power(distant_gate, 2.2)
    distant *= distant_gate[..., None] * 0.12
    distant[..., 0] *= 0.72
    distant[..., 1] *= 0.82
    distant[..., 2] *= 1.0

    stars = np.clip(primary + distant, 0.0, 1.0)
    save_rgb_jpg(stars, V56_STARS_4K, quality=92)
    stars2 = resize_rgb(stars, 2048, 1024)
    save_rgb_jpg(stars2, V56_STARS_2K, quality=91)
    del stars2, stars, distant_luma, distant_gate, distant, primary_luma, primary_gate, shoulder_gate, primary
    gc.collect()


def read_16k_downsampled(path: Path, width: int, height: int) -> np.ndarray:
    source = read_exr(path)
    if source.shape[:2] != (8192, 16384):
        raise RuntimeError(f"Expected 16384x8192 source, got {source.shape[1]}x{source.shape[0]}")
    reduced = resize_rgb(source, width, height)
    del source
    gc.collect()
    return reduced


def build_sparse_deep_space_base_and_masks(milkyway_path: Path) -> None:
    print("build Orbit Atlas v57 sparse deep-space base, dust, nebula haze and negative-space masks")
    base = read_16k_downsampled(milkyway_path, 8192, 4096)
    normalize_hdr_in_place(base, 99.88)

    # v57 uses 16K source detail but outputs a restrained runtime backdrop:
    # colder floor, stronger dark-lane separation, and less bright-wall energy.
    np.multiply(base, -0.72, out=base)
    np.exp(base, out=base)
    np.subtract(1.0, base, out=base)
    base[..., 0] *= 0.38
    base[..., 1] *= 0.52
    base[..., 2] *= 0.82

    luma = luma_of(base)
    bright_wall = np.clip((luma - 0.028) / 0.18, 0.0, 1.0)
    bright_wall = np.power(bright_wall, 1.95)
    dark_lane = np.clip((0.36 - luma) / 0.32, 0.0, 1.0)
    band = np.clip((luma - 0.008) / 0.19, 0.0, 1.0)
    dust = np.power(dark_lane * band, 0.54)
    nebula_haze = np.power(np.clip((luma - 0.014) / 0.16, 0.0, 1.0), 1.35)
    nebula_haze *= 1.0 - np.power(dust, 1.28) * 0.74
    nebula_haze *= 0.72
    negative_space = np.clip(bright_wall * 0.66 + dust * 0.68 + nebula_haze * 0.14, 0.0, 1.0)

    base *= 1.0 - dust[..., None] * 0.5
    base *= 1.0 - bright_wall[..., None] * 0.42
    base += nebula_haze[..., None] * np.array([0.0012, 0.0022, 0.0048], dtype=np.float32)
    base /= base + 0.94
    np.power(np.clip(base, 0.0, 1.0), 1.14, out=base)

    save_rgb_jpg(base, V57_BASE_8K, quality=94)
    base4 = resize_rgb(base, 4096, 2048)
    save_rgb_jpg(base4, V57_BASE_4K, quality=93)
    del base4, base

    dust4 = resize_rgb(dust, 4096, 2048)
    save_gray_jpg(dust4, V57_DUST_4K, quality=92)
    dust2 = resize_rgb(dust4, 2048, 1024)
    save_gray_jpg(dust2, V57_DUST_2K, quality=91)
    del dust2, dust4, dust

    haze4 = resize_rgb(nebula_haze, 4096, 2048)
    save_gray_jpg(haze4, V57_NEBULA_HAZE_4K, quality=92)
    haze2 = resize_rgb(haze4, 2048, 1024)
    save_gray_jpg(haze2, V57_NEBULA_HAZE_2K, quality=91)
    del haze2, haze4, nebula_haze

    negative4 = resize_rgb(negative_space, 4096, 2048)
    save_gray_jpg(negative4, V57_NEGATIVE_SPACE_4K, quality=92)
    negative2 = resize_rgb(negative4, 2048, 1024)
    save_gray_jpg(negative2, V57_NEGATIVE_SPACE_2K, quality=91)
    del negative2, negative4, negative_space, dark_lane, band, bright_wall, luma
    gc.collect()


def build_sparse_primary_stars(bright_path: Path) -> None:
    print("build Orbit Atlas v57 sparse primary-star layers")
    primary = read_16k_downsampled(bright_path, 4096, 2048)
    normalize_hdr_in_place(primary, 99.994)
    np.multiply(primary, -4.15, out=primary)
    np.exp(primary, out=primary)
    np.subtract(1.0, primary, out=primary)
    luma = luma_of(primary)
    core_gate = np.clip((luma - 0.13) / 0.38, 0.0, 1.0)
    core_gate = np.power(core_gate, 3.35)
    shoulder_gate = np.clip((luma - 0.32) / 0.5, 0.0, 1.0)
    shoulder_gate = np.power(shoulder_gate, 1.08)
    primary *= np.clip(core_gate * 0.92 + shoulder_gate * 0.12, 0.0, 1.0)[..., None]
    primary[..., 0] *= 0.82
    primary[..., 1] *= 0.92
    primary[..., 2] *= 1.1
    np.clip(primary, 0.0, 1.0, out=primary)
    save_rgb_jpg(primary, V57_PRIMARY_STARS_4K, quality=92)
    primary2 = resize_rgb(primary, 2048, 1024)
    save_rgb_jpg(primary2, V57_PRIMARY_STARS_2K, quality=91)
    del primary2, primary, luma, core_gate, shoulder_gate
    gc.collect()


def build_sparse_distant_stars(random_starfield_path: Path) -> None:
    print("build Orbit Atlas v57 ultra-faint distant-star layers")
    distant = read_16k_downsampled(random_starfield_path, 4096, 2048)
    normalize_hdr_in_place(distant, 99.982)
    np.multiply(distant, -1.72, out=distant)
    np.exp(distant, out=distant)
    np.subtract(1.0, distant, out=distant)
    luma = luma_of(distant)
    gate = np.clip((luma - 0.18) / 0.44, 0.0, 1.0)
    gate = np.power(gate, 2.75)
    distant *= gate[..., None] * 0.065
    distant[..., 0] *= 0.62
    distant[..., 1] *= 0.76
    distant[..., 2] *= 1.0
    np.clip(distant, 0.0, 1.0, out=distant)
    save_rgb_jpg(distant, V57_DISTANT_STARS_4K, quality=92)
    distant2 = resize_rgb(distant, 2048, 1024)
    save_rgb_jpg(distant2, V57_DISTANT_STARS_2K, quality=91)
    del distant2, distant, luma, gate
    gc.collect()


def read_rgb_jpg(path: Path) -> np.ndarray:
    if not path.exists():
        raise RuntimeError(f"Missing local source layer {path}")
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.float32) / 255.0


def read_gray_jpg(path: Path) -> np.ndarray:
    if not path.exists():
        raise RuntimeError(f"Missing local source layer {path}")
    return np.asarray(Image.open(path).convert("L"), dtype=np.float32) / 255.0


def build_v59_from_v57_layers() -> None:
    """Re-grade checked-in v57 layers without downloading source EXRs."""
    import cv2  # type: ignore

    print("build Orbit Atlas v59 restrained background from local v57 layers")
    base = read_rgb_jpg(V57_BASE_8K)
    smooth = cv2.GaussianBlur(base, (0, 0), 1.35)
    luma = luma_of(base)
    smooth_luma = luma_of(smooth)
    grain = np.clip(luma - smooth_luma, 0.0, 1.0)
    bright_wall = np.power(np.clip((smooth_luma - 0.025) / 0.2, 0.0, 1.0), 1.35)
    base = base * 0.62 + smooth * 0.38
    base *= (1.0 - bright_wall[..., None] * 0.38)
    base *= (1.0 - grain[..., None] * 0.72)
    gray = luma_of(base)
    base = gray[..., None] + (base - gray[..., None]) * 0.48
    base *= np.array([0.68, 0.75, 0.88], dtype=np.float32)
    np.power(np.clip(base * 0.98, 0.0, 1.0), 1.08, out=base)
    save_rgb_jpg(base, V59_BASE_8K, quality=93)
    base4 = resize_rgb(base, 4096, 2048)
    save_rgb_jpg(base4, V59_BASE_4K, quality=92)
    del base4, base, smooth, luma, smooth_luma, grain

    primary = read_rgb_jpg(V57_PRIMARY_STARS_4K)
    primary_luma = luma_of(primary)
    primary_gate = np.power(np.clip((primary_luma - 0.045) / 0.6, 0.0, 1.0), 1.2)
    primary *= primary_gate[..., None] * 0.72
    np.clip(primary, 0.0, 1.0, out=primary)
    save_rgb_jpg(primary, V59_PRIMARY_STARS_4K, quality=91)
    primary2 = resize_rgb(primary, 2048, 1024)
    save_rgb_jpg(primary2, V59_PRIMARY_STARS_2K, quality=90)
    del primary2, primary, primary_luma, primary_gate

    distant = read_rgb_jpg(V57_DISTANT_STARS_4K)
    distant_luma = luma_of(distant)
    distant_gate = np.power(np.clip((distant_luma - 0.012) / 0.2, 0.0, 1.0), 1.45)
    distant *= distant_gate[..., None] * 0.34
    np.clip(distant, 0.0, 1.0, out=distant)
    save_rgb_jpg(distant, V59_DISTANT_STARS_4K, quality=90)
    distant2 = resize_rgb(distant, 2048, 1024)
    save_rgb_jpg(distant2, V59_DISTANT_STARS_2K, quality=89)
    del distant2, distant, distant_luma, distant_gate

    dust = read_gray_jpg(V57_DUST_4K)
    dust = np.power(np.clip(dust, 0.0, 1.0), 0.86)
    save_gray_jpg(dust, V59_DUST_4K, quality=91)
    dust2 = cv2.resize(dust, (2048, 1024), interpolation=cv2.INTER_AREA)
    save_gray_jpg(dust2, V59_DUST_2K, quality=90)

    haze = read_gray_jpg(V57_NEBULA_HAZE_4K)
    haze = np.power(np.clip(haze, 0.0, 1.0), 1.3) * 0.32
    save_gray_jpg(haze, V59_NEBULA_HAZE_4K, quality=90)
    haze2 = cv2.resize(haze, (2048, 1024), interpolation=cv2.INTER_AREA)
    save_gray_jpg(haze2, V59_NEBULA_HAZE_2K, quality=89)

    negative = read_gray_jpg(V57_NEGATIVE_SPACE_4K)
    bright_wall4 = cv2.resize(bright_wall, (4096, 2048), interpolation=cv2.INTER_AREA)
    negative = np.clip(np.power(negative, 0.72) * 0.78 + dust * 0.3 + bright_wall4 * 0.24, 0.0, 1.0)
    negative = cv2.GaussianBlur(negative, (0, 0), 1.1)
    save_gray_jpg(negative, V59_NEGATIVE_SPACE_4K, quality=91)
    negative2 = cv2.resize(negative, (2048, 1024), interpolation=cv2.INTER_AREA)
    save_gray_jpg(negative2, V59_NEGATIVE_SPACE_2K, quality=90)
    del dust2, dust, haze2, haze, negative2, negative, bright_wall4, bright_wall
    gc.collect()


def build_v60_from_v59_layers() -> None:
    """Build a lower-cost v60 profile with a close-up-visible luminance floor."""
    import cv2  # type: ignore

    print("build Orbit Atlas v60 visible low-noise background from local v59/v57 layers")
    base4 = read_rgb_jpg(V59_BASE_4K)
    smooth = cv2.GaussianBlur(base4, (0, 0), 2.2)
    luma = luma_of(base4)
    smooth_luma = luma_of(smooth)
    structure = np.power(np.clip((smooth_luma - 0.012) / 0.18, 0.0, 1.0), 1.18)
    grain = np.clip(luma - smooth_luma, 0.0, 1.0)

    neutral_floor = np.zeros_like(base4)
    neutral_floor[..., 0] = 0.010
    neutral_floor[..., 1] = 0.012
    neutral_floor[..., 2] = 0.016
    base4 = base4 * 0.68 + smooth * 0.32
    base4 *= 1.0 - grain[..., None] * 0.52
    base4 += neutral_floor * (0.58 + structure[..., None] * 0.38)
    gray = luma_of(base4)
    base4 = gray[..., None] + (base4 - gray[..., None]) * 0.34
    base4 *= np.array([0.78, 0.84, 0.94], dtype=np.float32)
    np.clip(base4, 0.0, 1.0, out=base4)
    save_rgb_jpg(base4, V60_BASE_4K, quality=91)
    base2 = resize_rgb(base4, 2048, 1024)
    save_rgb_jpg(base2, V60_BASE_2K, quality=90)

    primary = read_rgb_jpg(V59_PRIMARY_STARS_4K)
    primary_luma = luma_of(primary)
    haze_gate = np.power(np.clip((primary_luma - 0.018) / 0.42, 0.0, 1.0), 1.08)
    primary = primary * haze_gate[..., None] * 0.92
    primary += neutral_floor * np.clip(primary_luma[..., None] * 0.16, 0.0, 0.018)
    np.clip(primary, 0.0, 1.0, out=primary)
    save_rgb_jpg(primary, V60_PRIMARY_STARS_4K, quality=90)
    primary2 = resize_rgb(primary, 2048, 1024)
    save_rgb_jpg(primary2, V60_PRIMARY_STARS_2K, quality=89)

    dust = read_gray_jpg(V59_DUST_2K)
    dust = np.clip(np.power(dust, 0.92) * 0.86, 0.0, 1.0)
    save_gray_jpg(dust, V60_DUST_2K, quality=89)

    negative = read_gray_jpg(V59_NEGATIVE_SPACE_2K)
    negative = np.clip(np.power(negative, 0.9) * 0.68 + dust * 0.2, 0.0, 1.0)
    negative = cv2.GaussianBlur(negative, (0, 0), 1.4)
    save_gray_jpg(negative, V60_NEGATIVE_SPACE_2K, quality=89)
    del base2, base4, smooth, luma, smooth_luma, structure, grain
    del primary2, primary, primary_luma, haze_gate, dust, negative, neutral_floor
    gc.collect()


def build_v61_visual_reset_layers() -> None:
    """Build a more readable visual-reset sky without returning to 8K defaults."""
    import cv2  # type: ignore

    print("build Orbit Atlas v61 visual-reset sky from local v57/v48 layers")
    sparse = read_rgb_jpg(V57_BASE_4K)
    reference = read_rgb_jpg(V48_BASE_4K)
    sparse_smooth = cv2.GaussianBlur(sparse, (0, 0), 1.1)
    reference_smooth = cv2.GaussianBlur(reference, (0, 0), 2.0)
    luma = luma_of(sparse_smooth)
    ref_luma = luma_of(reference_smooth)
    structure = np.power(np.clip((ref_luma - 0.018) / 0.24, 0.0, 1.0), 1.16)
    wall_gate = np.power(np.clip((luma - 0.055) / 0.28, 0.0, 1.0), 1.35)
    dark_lane = np.power(np.clip((0.20 - ref_luma) / 0.18, 0.0, 1.0), 0.86)
    x = np.linspace(0.0, 1.0, sparse.shape[1], dtype=np.float32)[None, :]
    y = np.linspace(0.0, 1.0, sparse.shape[0], dtype=np.float32)[:, None]
    left_view_guard = np.power(np.clip((0.42 - x) / 0.42, 0.0, 1.0), 0.68)
    lower_right_guard = np.power(
        np.clip((x - 0.54) / 0.46, 0.0, 1.0) *
        np.clip((y - 0.45) / 0.55, 0.0, 1.0),
        0.52,
    )

    floor = np.zeros_like(sparse)
    floor[..., 0] = 0.011
    floor[..., 1] = 0.014
    floor[..., 2] = 0.020
    base4 = sparse_smooth * 0.42 + reference_smooth * 0.18 + floor * (1.04 + structure[..., None] * 0.22)
    base4 *= 1.0 - wall_gate[..., None] * 0.62
    base4 *= 1.0 - left_view_guard[..., None] * np.clip(0.34 + wall_gate[..., None] * 0.28, 0.0, 0.58)
    base4 *= 1.0 - lower_right_guard[..., None] * np.clip(0.38 + structure[..., None] * 0.36, 0.0, 0.68)
    base4 *= 1.0 - dark_lane[..., None] * structure[..., None] * 0.12
    gray = luma_of(base4)
    base4 = gray[..., None] + (base4 - gray[..., None]) * 0.56
    base4 *= np.array([0.80, 0.88, 1.02], dtype=np.float32)
    np.power(np.clip(base4, 0.0, 1.0), 0.92, out=base4)
    save_rgb_jpg(base4, V61_RESET_BASE_4K, quality=92)
    base2 = resize_rgb(base4, 2048, 1024)
    save_rgb_jpg(base2, V61_RESET_BASE_2K, quality=91)

    dust57 = read_gray_jpg(V57_DUST_2K)
    dust48 = read_gray_jpg(V48_DUST_2K)
    dust = np.clip(np.power(dust57 * 0.54 + dust48 * 0.24, 1.08) * 0.74, 0.0, 1.0)
    save_gray_jpg(dust, V61_RESET_DUST_2K, quality=90)

    primary57 = read_rgb_jpg(V57_PRIMARY_STARS_4K)
    primary48 = read_rgb_jpg(V48_STARS_4K)
    primary = primary57 * 0.64 + primary48 * 0.28
    primary_luma = luma_of(primary)
    primary_gate = np.power(np.clip((primary_luma - 0.014) / 0.46, 0.0, 1.0), 1.02)
    primary = primary * primary_gate[..., None] * 1.08
    dust4 = resize_rgb(dust57, 4096, 2048)
    primary *= 1.0 - np.clip(
        dust4[..., None] * 0.32 +
        wall_gate[..., None] * 0.34 +
        left_view_guard[..., None] * 0.42 +
        lower_right_guard[..., None] * 0.48,
        0.0,
        0.78,
    )
    primary += floor * np.clip(primary_luma[..., None] * 0.22, 0.0, 0.02)
    np.clip(primary, 0.0, 1.0, out=primary)
    save_rgb_jpg(primary, V61_RESET_PRIMARY_STARS_4K, quality=91)
    primary2 = resize_rgb(primary, 2048, 1024)
    save_rgb_jpg(primary2, V61_RESET_PRIMARY_STARS_2K, quality=90)

    negative57 = read_gray_jpg(V57_NEGATIVE_SPACE_2K)
    negative48 = read_gray_jpg(V48_NEGATIVE_SPACE_2K)
    lower_right_guard2 = cv2.resize(lower_right_guard, (2048, 1024), interpolation=cv2.INTER_AREA)
    negative = np.clip(negative57 * 0.36 + negative48 * 0.18 + dust * 0.12 + lower_right_guard2 * 0.18, 0.0, 1.0)
    negative = cv2.GaussianBlur(negative, (0, 0), 1.0)
    save_gray_jpg(negative, V61_RESET_NEGATIVE_SPACE_2K, quality=90)
    del sparse, reference, sparse_smooth, reference_smooth, luma, ref_luma, structure, wall_gate, dark_lane, x, y, left_view_guard, lower_right_guard
    del floor, base4, base2, primary57, primary48, primary, primary_luma, primary_gate
    del primary2, dust4, dust57, dust48, dust, lower_right_guard2, negative57, negative48, negative
    gc.collect()


def build() -> None:
    if "--v66-milky-way-depth" in sys.argv:
        SKY_DIR.mkdir(parents=True, exist_ok=True)
        build_v66_milky_way_depth_layers()
        return
    if "--v67-galactic-depth" in sys.argv:
        SKY_DIR.mkdir(parents=True, exist_ok=True)
        build_v67_galactic_depth_layers()
        return
    if "--v68-reference-backdrop" in sys.argv:
        SKY_DIR.mkdir(parents=True, exist_ok=True)
        build_v68_reference_backdrop_layers()
        return
    if "--v61-visual-reset" in sys.argv:
        SKY_DIR.mkdir(parents=True, exist_ok=True)
        build_v61_visual_reset_layers()
        return
    if "--v60-from-v59" in sys.argv:
        SKY_DIR.mkdir(parents=True, exist_ok=True)
        build_v60_from_v59_layers()
        return
    if "--v59-from-v57" in sys.argv:
        SKY_DIR.mkdir(parents=True, exist_ok=True)
        build_v59_from_v57_layers()
        return
    SKY_DIR.mkdir(parents=True, exist_ok=True)
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    milkyway_path = SOURCE_DIR / "milkyway_2020_8k.exr"
    bright_path = SOURCE_DIR / "hiptyc_2020_8k.exr"
    random_starfield_path = SOURCE_DIR / "starmap_random_2020_8k_gal.exr"
    milkyway_16k_path = SOURCE_DIR / "milkyway_2020_16k.exr"
    bright_16k_path = SOURCE_DIR / "hiptyc_2020_16k.exr"
    random_starfield_16k_path = SOURCE_DIR / "starmap_random_2020_16k_gal.exr"
    download(NASA_MILKYWAY_URL, milkyway_path)
    download(NASA_BRIGHT_STARS_URL, bright_path)
    download(NASA_RANDOM_STARFIELD_URL, random_starfield_path)
    download(NASA_MILKYWAY_16K_URL, milkyway_16k_path)
    download(NASA_BRIGHT_STARS_16K_URL, bright_16k_path)
    download(NASA_RANDOM_STARFIELD_16K_URL, random_starfield_16k_path)
    build_base_and_dust(milkyway_path)
    build_reference_grade_base_and_masks(milkyway_path)
    build_cinematic_backdrop_base_and_masks(milkyway_path)
    build_sparse_deep_space_base_and_masks(milkyway_16k_path)
    build_bright_stars(bright_path)
    build_reference_grade_stars(bright_path)
    build_cinematic_backdrop_stars(bright_path, random_starfield_path)
    build_sparse_primary_stars(bright_16k_path)
    build_sparse_distant_stars(random_starfield_16k_path)


if __name__ == "__main__":
    try:
        build()
    except Exception as exc:
        print(f"build failed: {exc}", file=sys.stderr)
        sys.exit(1)
