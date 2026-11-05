"""Derive deterministic presentation maps from NASA PDS4 Ceres products."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image
import tifffile


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def canonical(value: object) -> object:
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value)}
    if isinstance(value, list):
        return [canonical(item) for item in value]
    return value


def number(value: float) -> str:
    return format(float(value), ".12g")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--albedo", required=True)
    parser.add_argument("--albedo-label", required=True)
    parser.add_argument("--radius", required=True)
    parser.add_argument("--radius-label", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--receipt", required=True)
    args = parser.parse_args()

    root = Path.cwd().resolve()
    albedo_path = Path(args.albedo).resolve()
    albedo_label_path = Path(args.albedo_label).resolve()
    radius_path = Path(args.radius).resolve()
    radius_label_path = Path(args.radius_label).resolve()
    output_root = Path(args.output).resolve()
    receipt_path = Path(args.receipt).resolve()
    for path in (albedo_path, albedo_label_path, radius_path, radius_label_path):
        if not path.is_file():
            raise SystemExit(f"v591-ceres-texture-source-missing:{path}")

    with albedo_path.open("rb") as handle:
        handle.seek(65536)
        albedo = np.fromfile(handle, dtype="<f4", count=2222 * 1111).reshape(1111, 2222).astype(np.float64)
    radius = np.asarray(tifffile.imread(radius_path), dtype=np.float64)
    if albedo.shape != (1111, 2222) or radius.shape != (1111, 2222) or not np.isfinite(albedo).all() or not np.isfinite(radius).all():
        raise SystemExit("v591-ceres-texture-layout")
    albedo_minimum, albedo_maximum = float(albedo.min()), float(albedo.max())
    radius_minimum, radius_maximum = float(radius.min()), float(radius.max())
    if albedo_minimum != 0.2021164894104004 or albedo_maximum != 1.6633118391036987:
        raise SystemExit(f"v591-ceres-albedo-range:{albedo_minimum}:{albedo_maximum}")
    if radius_minimum != 442618.25 or radius_maximum != 486849.59375:
        raise SystemExit(f"v591-ceres-radius-range:{radius_minimum}:{radius_maximum}")

    lower, upper = (float(value) for value in np.percentile(albedo, [0.5, 99.5]))
    normalized_albedo = np.clip((albedo - lower) / (upper - lower), 0.0, 1.0)
    luminance = 0.20 + 0.61 * np.power(normalized_albedo, 0.64)
    warm = np.stack((luminance * 1.018, luminance * 0.991, luminance * 0.952), axis=-1)
    albedo_rgb = np.rint(np.clip(warm, 0.0, 1.0) * 255.0).astype(np.uint8)

    pixel_resolution_m = 1325.89504822739991
    latitude = np.linspace(0.5 * np.pi, -0.5 * np.pi, radius.shape[0], dtype=np.float64)[:, None]
    cos_latitude = np.maximum(np.abs(np.cos(latitude)), 0.055)
    dx = (np.roll(radius, -1, axis=1) - np.roll(radius, 1, axis=1)) / (2.0 * pixel_resolution_m * cos_latitude)
    dy = np.empty_like(radius)
    dy[1:-1] = (radius[:-2] - radius[2:]) / (2.0 * pixel_resolution_m)
    dy[0] = (radius[0] - radius[1]) / pixel_resolution_m
    dy[-1] = (radius[-2] - radius[-1]) / pixel_resolution_m
    tangent_normal = np.stack((-dx, dy, np.ones_like(radius)), axis=-1)
    tangent_normal /= np.linalg.norm(tangent_normal, axis=-1, keepdims=True)
    normal_rgb = np.rint(np.clip(tangent_normal * 0.5 + 0.5, 0.0, 1.0) * 255.0).astype(np.uint8)

    slope = np.sqrt(dx * dx + dy * dy)
    slope_normalized = np.clip(slope / float(np.percentile(slope, 99.5)), 0.0, 1.0)
    roughness = np.clip(0.79 + slope_normalized * 0.13 - normalized_albedo * 0.035, 0.72, 0.96)
    roughness_u8 = np.rint(roughness * 255.0).astype(np.uint8)
    height = np.clip((radius - radius_minimum) / (radius_maximum - radius_minimum), 0.0, 1.0)
    height_u8 = np.rint(height * 255.0).astype(np.uint8)

    output_root.mkdir(parents=True, exist_ok=True)
    outputs = {
        "ceres-albedo": (albedo_rgb, "RGB"),
        "ceres-normal": (normal_rgb, "RGB"),
        "ceres-roughness": (roughness_u8, "L"),
        "ceres-height": (height_u8, "L"),
    }
    records = []
    for asset_id, (data, mode) in outputs.items():
        path = output_root / f"{asset_id}.png"
        Image.fromarray(data, mode=mode).save(path, format="PNG", compress_level=9, optimize=False)
        records.append({"id": asset_id, "path": path.resolve().relative_to(root).as_posix(), "bytes": path.stat().st_size, "sha256": digest(path), "width": 2222, "height": 1111, "mode": mode})

    unsigned = {
        "version": "v591-ceres-pds-texture-derivation-receipt-v1",
        "body": "ceres",
        "sources": {
            "albedo": {"path": albedo_path.relative_to(root).as_posix(), "bytes": albedo_path.stat().st_size, "sha256": digest(albedo_path), "labelPath": albedo_label_path.relative_to(root).as_posix(), "labelSha256": digest(albedo_label_path), "width": 2222, "height": 1111, "dataType": "IEEE754LSBSingle", "units": "relative-albedo", "minimum": number(albedo_minimum), "maximum": number(albedo_maximum), "percentile005": number(lower), "percentile995": number(upper)},
            "radius": {"path": radius_path.relative_to(root).as_posix(), "bytes": radius_path.stat().st_size, "sha256": digest(radius_path), "labelPath": radius_label_path.relative_to(root).as_posix(), "labelSha256": digest(radius_label_path), "width": 2222, "height": 1111, "dataType": "IEEE754LSBSingle", "units": "meter-from-body-center", "minimum": number(radius_minimum), "maximum": number(radius_maximum), "pixelResolutionMeters": number(pixel_resolution_m)},
        },
        "outputs": records,
        "derivation": {
            "tool": f"python-numpy-{np.__version__}+pillow-{Image.__version__}+tifffile-{tifffile.__version__}",
            "parameters": "pds-relative-albedo-percentile-transfer-to-bounded-neutral-ceres-presentation-color;radius-central-difference-planetocentric-tangent-normal;radius-slope-bounded-roughness;radius-minmax-8bit-presentation-height;no-randomness;no-ai;no-synthetic-craters",
            "albedoColorClaim": "bounded-neutral-presentation-transfer-not-measured-optical-color",
            "normalSource": "pds-global-radius-geotiff-only",
            "syntheticDetailAdded": False,
        },
        "authorityState": {"presentationOnly": True, "scientificAuthorityChanged": False, "scientificPayloadWriteback": False, "measuredPhotometryClaim": False, "measuredAuthorityGranted": False},
    }
    receipt = {**unsigned, "receiptSha256": hashlib.sha256(json.dumps(canonical(unsigned), separators=(",", ":")).encode("utf8")).hexdigest()}
    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    partial = receipt_path.with_suffix(receipt_path.suffix + ".part")
    partial.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf8")
    partial.replace(receipt_path)
    print(json.dumps({"outputs": records, "albedoRange": [albedo_minimum, albedo_maximum], "radiusRangeMeters": [radius_minimum, radius_maximum], "receiptSha256": receipt["receiptSha256"]}, indent=2))


if __name__ == "__main__":
    main()
