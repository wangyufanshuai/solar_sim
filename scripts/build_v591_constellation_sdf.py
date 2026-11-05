"""Build a deterministic, candidate-owned signed-distance-field label atlas."""

from __future__ import annotations

import hashlib
import io
import json
import math
import os
import tempfile
from pathlib import Path

import fontTools
import numpy as np
import PIL
import scipy
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import distance_transform_edt


ROOT = Path(__file__).resolve().parents[1]
FROZEN_BINDINGS = ROOT / "public/data/celestial-art-v589/constellation-gaia-bindings-v589.json"
FONT_WOFF = ROOT / "node_modules/@fontsource/ibm-plex-sans-condensed/files/ibm-plex-sans-condensed-latin-500-normal.woff"
ATLAS_PATH = ROOT / "public/textures/candidate-v591/constellations/labels-sdf.png"
METADATA_PATH = ROOT / "public/data/celestial-convergence-v591/constellation-label-atlas-v591.json"
EXPECTED_BINDING_FILE_SHA256 = "6c5aefed75d78f566fa598a2fe15bad5482af41f7a600d055c1554544012f5f5"
EXPECTED_FONT_WOFF_SHA256 = "1f3dfe7ded9f9491c08039c73359a11b98266165539ad2060506f87db3d173d3"
ATLAS_WIDTH = 2048
FONT_SIZE = 44
PADDING = 14
SPREAD = 10.0


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.part")
    temporary.write_bytes(data)
    os.replace(temporary, path)


def next_power_of_two(value: int) -> int:
    return 1 << max(0, value - 1).bit_length()


def render_label(font: ImageFont.FreeTypeFont, text: str) -> np.ndarray:
    bbox = font.getbbox(text, stroke_width=0)
    width = max(1, bbox[2] - bbox[0]) + PADDING * 2
    height = max(1, bbox[3] - bbox[1]) + PADDING * 2
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    draw.text((PADDING - bbox[0], PADDING - bbox[1]), text, font=font, fill=255)
    inside = np.asarray(mask, dtype=np.uint8) >= 128
    inside_distance = distance_transform_edt(inside)
    outside_distance = distance_transform_edt(~inside)
    signed_distance = inside_distance - outside_distance
    encoded = np.clip(0.5 + signed_distance / (2.0 * SPREAD), 0.0, 1.0)
    return np.rint(encoded * 255.0).astype(np.uint8)


def main() -> None:
    frozen_bytes = FROZEN_BINDINGS.read_bytes()
    if sha256(frozen_bytes) != EXPECTED_BINDING_FILE_SHA256:
        raise RuntimeError("v591-constellation-sdf-frozen-binding-sha")
    bindings = json.loads(frozen_bytes.decode("utf-8"))["bindings"]
    if len(bindings) != 88:
        raise RuntimeError("v591-constellation-sdf-binding-count")
    font_bytes = FONT_WOFF.read_bytes()
    if sha256(font_bytes) != EXPECTED_FONT_WOFF_SHA256:
        raise RuntimeError("v591-constellation-sdf-font-sha")

    with tempfile.TemporaryDirectory(prefix="orbit-atlas-v591-sdf-") as temporary:
        ttf_path = Path(temporary) / "ibm-plex-sans-condensed-500.ttf"
        font_file = TTFont(io.BytesIO(font_bytes), recalcBBoxes=False, recalcTimestamp=False)
        font_file.flavor = None
        font_file.save(ttf_path, reorderTables=False)
        font = ImageFont.truetype(str(ttf_path), FONT_SIZE, layout_engine=ImageFont.Layout.BASIC)

        labels = [(binding["iauCode"], binding["name"], render_label(font, binding["name"])) for binding in bindings]
        placements: list[tuple[str, str, np.ndarray, int, int]] = []
        cursor_x = 0
        cursor_y = 0
        row_height = 0
        for code, name, raster in labels:
            height, width = raster.shape
            if width > ATLAS_WIDTH:
                raise RuntimeError(f"v591-constellation-sdf-label-width:{code}")
            if cursor_x > 0 and cursor_x + width > ATLAS_WIDTH:
                cursor_x = 0
                cursor_y += row_height
                row_height = 0
            placements.append((code, name, raster, cursor_x, cursor_y))
            cursor_x += width
            row_height = max(row_height, height)
        used_height = cursor_y + row_height
        atlas_height = next_power_of_two(used_height)
        atlas = np.zeros((atlas_height, ATLAS_WIDTH), dtype=np.uint8)
        entries: list[dict[str, object]] = []
        for code, name, raster, x, y in placements:
            height, width = raster.shape
            atlas[y : y + height, x : x + width] = raster
            entries.append(
                {
                    "iauCode": code,
                    "name": name,
                    "pixelRect": [x, y, width, height],
                    "uvRect": [
                        x / ATLAS_WIDTH,
                        1.0 - (y + height) / atlas_height,
                        (x + width) / ATLAS_WIDTH,
                        1.0 - y / atlas_height,
                    ],
                    "aspect": width / height,
                }
            )

        image = Image.fromarray(atlas, mode="L")
        image_bytes = io.BytesIO()
        image.save(image_bytes, format="PNG", optimize=False, compress_level=9)
        png = image_bytes.getvalue()
        atomic_write(ATLAS_PATH, png)
        metadata = {
            "version": "v591-constellation-label-sdf-atlas-v1",
            "status": "generated-from-admitted-local-font",
            "source": {
                "bindingPath": str(FROZEN_BINDINGS.relative_to(ROOT)).replace("\\", "/"),
                "bindingFileSha256": EXPECTED_BINDING_FILE_SHA256,
                "fontPath": str(FONT_WOFF.relative_to(ROOT)).replace("\\", "/"),
                "fontBytes": len(font_bytes),
                "fontSha256": EXPECTED_FONT_WOFF_SHA256,
                "fontLicense": "OFL-1.1",
            },
            "atlas": {
                "path": "/textures/candidate-v591/constellations/labels-sdf.png",
                "bytes": len(png),
                "sha256": sha256(png),
                "width": ATLAS_WIDTH,
                "height": atlas_height,
                "usedHeight": used_height,
                "channels": 1,
                "format": "png-l8-signed-distance-field",
                "fontSizePx": FONT_SIZE,
                "spreadPx": SPREAD,
                "paddingPx": PADDING,
                "entryCount": len(entries),
            },
            "entries": entries,
            "tools": {
                "fontTools": fontTools.__version__,
                "numpy": np.__version__,
                "pillow": PIL.__version__,
                "scipy": scipy.__version__,
            },
            "policy": {
                "presentationOnly": True,
                "externalNetworkRequest": False,
                "runtimeFontWorkerRequired": False,
                "runtimeAtlasOwnedBy": "v591-celestial-convergence",
            },
        }
        metadata_bytes = (json.dumps(metadata, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8")
        atomic_write(METADATA_PATH, metadata_bytes)
        print(
            json.dumps(
                {
                    "status": metadata["status"],
                    "atlasPath": str(ATLAS_PATH.relative_to(ROOT)).replace("\\", "/"),
                    "atlasBytes": len(png),
                    "atlasSha256": metadata["atlas"]["sha256"],
                    "atlasSize": [ATLAS_WIDTH, atlas_height],
                    "entryCount": len(entries),
                    "metadataPath": str(METADATA_PATH.relative_to(ROOT)).replace("\\", "/"),
                    "metadataSha256": sha256(metadata_bytes),
                },
                indent=2,
            )
        )


if __name__ == "__main__":
    main()
