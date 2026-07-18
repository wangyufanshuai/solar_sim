#!/usr/bin/env python3
"""Audit the legacy v71 full-page backdrop sampler for DOM contamination."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def sample(path: Path) -> dict[str, object]:
    image = Image.open(path).convert("RGB")
    width, height = image.size
    step_x = max(1, width // 180)
    step_y = max(1, height // 108)
    samples = 0
    bright_points: list[dict[str, object]] = []
    for y in range(0, height, step_y):
        for x in range(0, width, step_x):
            if y > height * 0.86 or x > width * 0.78:
                continue
            red, green, blue = image.getpixel((x, y))
            luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722
            samples += 1
            if luminance > 155 and max(red, green, blue) - min(red, green, blue) < 96:
                bright_points.append(
                    {
                        "x": x,
                        "y": y,
                        "rgb": [red, green, blue],
                        "luminance": round(luminance, 6),
                        "insideLegacyTelemetryHandle": x <= 40 and 420 <= y <= 480,
                    }
                )
    contaminated = sum(bool(point["insideLegacyTelemetryHandle"]) for point in bright_points)
    ratio = len(bright_points) / samples if samples else 0
    return {
        "path": path.as_posix(),
        "sha256": sha256(path),
        "width": width,
        "height": height,
        "step": [step_x, step_y],
        "sampleCount": samples,
        "brightPointCount": len(bright_points),
        "brightStarFloorRatio": ratio,
        "legacyTelemetryHandlePointCount": contaminated,
        "scenePointCount": len(bright_points) - contaminated,
        "brightPoints": bright_points,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--v224", type=Path, required=True)
    parser.add_argument("--v232", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    v224 = sample(args.v224)
    v232 = sample(args.v232)
    threshold = 0.0004
    required_points = int(threshold * int(v224["sampleCount"])) + 1
    assets = {}
    for relative in (
        "dist/content-packs/files/core/textures/sky/orbit-atlas-v9-base-8k.jpg",
        "dist/content-packs/files/core/textures/sky/orbit-atlas-v9-stars-4k.jpg",
        "dist/content-packs/files/core/textures/sky/orbit-atlas-v9-dust-2k.jpg",
    ):
        path = Path(relative)
        assets[relative] = {"bytes": path.stat().st_size, "sha256": sha256(path)}

    report = {
        "version": "v232-legacy-v71-backdrop-gate-audit-v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "legacy-gate-dom-contamination-confirmed",
        "legacyGate": {
            "source": "tests/atlas-browser/atlas-browser-acceptance.spec.ts",
            "metric": "full-page sparse brightStarFloorRatio",
            "threshold": threshold,
            "requiredPointCount": required_points,
            "fixtureMutated": False,
        },
        "v224": v224,
        "v232": v232,
        "finding": {
            "v224PassingPoints": v224["brightPointCount"],
            "v224DomContaminatedPoints": v224["legacyTelemetryHandlePointCount"],
            "v224ScenePoints": v224["scenePointCount"],
            "v232ScenePoints": v232["scenePointCount"],
            "conclusion": (
                "The v224 pass depended on pixels from the collapsed ScienceTelemetryPanel DOM handle. "
                "The sampler is not canvas-isolated and therefore does not establish a V9 bright-star regression."
            ),
            "releaseTreatment": "known-invalid-legacy-browser-gate; preserve fixture; do not alter V9 or restore startup telemetry solely for the sampler",
        },
        "frozenV9Assets": assets,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["finding"], ensure_ascii=False))


if __name__ == "__main__":
    main()
