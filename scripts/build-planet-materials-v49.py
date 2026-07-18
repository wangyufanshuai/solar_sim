from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
HD = ROOT / "public" / "textures" / "planets" / "hd"
OUT = ROOT / "public" / "textures" / "planets" / "v49"


def load_rgb(name: str) -> Image.Image | None:
    path = HD / name
    if not path.exists():
        print(f"skip missing {path}")
        return None
    return Image.open(path).convert("RGB")


def save_jpg(image: Image.Image, name: str, quality: int = 90) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    image.convert("RGB").save(path, quality=quality, optimize=True, progressive=True)
    print(f"wrote {path.relative_to(ROOT)} ({path.stat().st_size / 1024 / 1024:.1f} MB)")


def to_luma(image: Image.Image) -> Image.Image:
    return ImageOps.grayscale(image)


def local_contrast(image: Image.Image, radius: float = 1.2, amount: float = 1.35) -> Image.Image:
    blur = image.filter(ImageFilter.GaussianBlur(radius))
    return Image.blend(blur, image, amount)


def enhance_albedo(
    image: Image.Image,
    *,
    color: float,
    contrast: float,
    sharpness: float,
    brightness: float = 1.0,
) -> Image.Image:
    out = local_contrast(image, radius=1.0, amount=1.22)
    out = ImageEnhance.Color(out).enhance(color)
    out = ImageEnhance.Contrast(out).enhance(contrast)
    out = ImageEnhance.Sharpness(out).enhance(sharpness)
    out = ImageEnhance.Brightness(out).enhance(brightness)
    return out


def roughness_from_luma(image: Image.Image, *, invert: bool = False, contrast: float = 1.4) -> Image.Image:
    luma = ImageOps.autocontrast(to_luma(image), cutoff=0.5)
    if invert:
        luma = ImageOps.invert(luma)
    luma = ImageEnhance.Contrast(luma).enhance(contrast)
    luma = ImageEnhance.Brightness(luma).enhance(0.92)
    return luma


def band_mask(image: Image.Image) -> Image.Image:
    arr = np.asarray(image.resize((2048, 1024), Image.Resampling.LANCZOS).convert("RGB"), dtype=np.float32)
    luma = arr @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    row_mean = luma.mean(axis=1, keepdims=True)
    bands = np.clip((luma - row_mean) * 2.4 + 128.0, 0, 255).astype(np.uint8)
    mask = Image.fromarray(bands).filter(ImageFilter.GaussianBlur(0.45))
    return ImageOps.autocontrast(mask, cutoff=0.75)


def cloud_alpha(image: Image.Image) -> Image.Image:
    luma = ImageOps.autocontrast(to_luma(image), cutoff=1.0)
    luma = ImageEnhance.Contrast(luma).enhance(1.65)
    luma = ImageEnhance.Brightness(luma).enhance(0.92)
    return luma


def night_mask(image: Image.Image) -> Image.Image:
    luma = ImageOps.autocontrast(to_luma(image), cutoff=0.2)
    luma = ImageEnhance.Contrast(luma).enhance(1.8)
    return luma.filter(ImageFilter.GaussianBlur(0.35))


def ring_alpha(size: tuple[int, int] = (2048, 2048)) -> Image.Image:
    w, h = size
    y, x = np.mgrid[0:h, 0:w]
    dx = (x - w / 2) / (w / 2)
    dy = (y - h / 2) / (h / 2)
    r = np.sqrt(dx * dx + dy * dy)
    alpha = np.zeros_like(r, dtype=np.float32)
    alpha += ((r > 0.45) & (r < 0.57)) * 0.22
    alpha += ((r >= 0.57) & (r < 0.73)) * 0.74
    alpha += ((r >= 0.73) & (r < 0.765)) * 0.18
    alpha += ((r >= 0.795) & (r < 0.91)) * 0.58
    alpha += ((r >= 0.92) & (r < 0.985)) * 0.24
    cassini = ((r >= 0.765) & (r < 0.795)) * 0.95
    banding = 0.86 + np.sin(r * 210.0) * 0.07 + np.sin(r * 520.0) * 0.035
    alpha = np.clip(alpha * banding - cassini * 0.18, 0, 1)
    return Image.fromarray((alpha * 255).astype(np.uint8))


def ring_color(alpha: Image.Image) -> Image.Image:
    a = np.asarray(alpha, dtype=np.float32) / 255.0
    h, w = a.shape
    y, x = np.mgrid[0:h, 0:w]
    r = np.sqrt(((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2)
    inner = np.array([122, 110, 88], dtype=np.float32)
    outer = np.array([214, 198, 162], dtype=np.float32)
    t = np.clip((r - 0.45) / 0.54, 0, 1)[..., None]
    rgb = inner * (1 - t) + outer * t
    rgb *= (0.78 + a[..., None] * 0.42)
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))


def build() -> None:
    earth = load_rgb("earth.jpg")
    if earth:
        save_jpg(enhance_albedo(earth, color=1.08, contrast=1.18, sharpness=1.18, brightness=0.96), "earth-albedo.jpg")
        save_jpg(roughness_from_luma(earth, invert=True, contrast=1.25), "earth-roughness.jpg")

    clouds = load_rgb("earth-clouds.jpg")
    if clouds:
        save_jpg(enhance_albedo(clouds, color=0.74, contrast=1.18, sharpness=1.1, brightness=0.94), "earth-clouds.jpg")
        save_jpg(cloud_alpha(clouds), "earth-cloud-alpha.jpg")

    night = load_rgb("earth-night.jpg")
    if night:
        save_jpg(enhance_albedo(night, color=1.18, contrast=1.15, sharpness=1.08, brightness=0.92), "earth-night.jpg")
        save_jpg(night_mask(night), "earth-night-mask.jpg")

    for body, params in {
        "jupiter": dict(color=1.08, contrast=1.24, sharpness=1.32, brightness=0.94),
        "saturn": dict(color=1.04, contrast=1.2, sharpness=1.28, brightness=0.93),
        "mars": dict(color=1.1, contrast=1.22, sharpness=1.22, brightness=0.96),
        "moon": dict(color=0.84, contrast=1.2, sharpness=1.26, brightness=0.92),
        "sun": dict(color=1.08, contrast=1.32, sharpness=1.36, brightness=0.88),
    }.items():
        src = load_rgb(f"{body}.jpg")
        if not src:
            continue
        save_jpg(enhance_albedo(src, **params), f"{body}-albedo.jpg")
        save_jpg(roughness_from_luma(src, invert=body in {"jupiter", "saturn", "sun"}, contrast=1.35), f"{body}-roughness.jpg")
        if body in {"jupiter", "saturn"}:
            save_jpg(band_mask(src), f"{body}-band-mask.jpg")

    alpha = ring_alpha()
    save_jpg(alpha, "saturn-ring-alpha.jpg")
    save_jpg(ring_color(alpha), "saturn-ring-color.jpg")


if __name__ == "__main__":
    build()
