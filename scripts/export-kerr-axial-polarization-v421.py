from __future__ import annotations

import csv
import hashlib
import json
import os
from pathlib import Path

import numpy as np
from astropy.io import fits
from astropy.wcs import WCS
from PIL import Image, ImageDraw, ImageFont


ROOT = Path.cwd()
OUT = ROOT / "dist/science/kerr-axial-polarization-vectors-v421"
ARTIFACT = OUT / "axial-vector-catalog.json"
CSV_PATH = OUT / "axial-vector-catalog.csv"
FITS_PATH = OUT / "axial-vector-endpoints-WCS.fits"
PNG_PATH = OUT / "corrected-sparse-axial-quiver.png"
MANIFEST = OUT / "export-manifest.json"


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def atomic(path: Path, payload: bytes) -> None:
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    temporary.write_bytes(payload)
    temporary.replace(path)


def validate_csv() -> None:
    with CSV_PATH.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) != 4:
        raise RuntimeError("v421-csv-row-count")
    if any(
        row["intensity"]
        or row["stokes_amplitude"]
        or row["interpolation_allowed"] != "false"
        for row in rows
    ):
        raise RuntimeError("v421-csv-science-boundary")


def create_wcs() -> WCS:
    wcs = WCS(naxis=2)
    wcs.wcs.crpix = [192.5, 192.5]
    wcs.wcs.cdelt = np.asarray([44.0 / 384.0, 32.0 / 384.0], dtype=float)
    wcs.wcs.crval = [0.0, 0.0]
    wcs.wcs.ctype = ["LINEAR", "LINEAR"]
    wcs.wcs.cname = ["KERR_ALPHA", "KERR_BETA"]
    wcs.wcs.name = "KERR_FINITE_ZAMO_OBSERVER_PLANE"
    return wcs


def write_fits(view: dict[str, object]) -> None:
    rows = view["rows"]
    wcs = create_wcs()
    primary = fits.PrimaryHDU(header=wcs.to_header(relax=True))
    primary.header["WCSAXES"] = 2
    primary.header["KERRUNIT"] = ("GM/c^2", "Geometrized observer-screen length")
    primary.header["OBSERVER"] = "FINITE ZAMO"
    primary.header["R_OBS"] = (30.0, "Observer radius in GM/c^2")
    primary.header["INCL_DEG"] = (70.0, "Observer inclination in degrees")
    primary.header["HASIMAGE"] = (False, "Primary HDU contains no raster values")
    primary.header["AXIAL"] = (True, "EVPA is modulo 180 degrees")
    primary.header["INTENS"] = (False, "No intensity or Stokes amplitude")
    primary.header["INTERPOL"] = (False, "Four vectors are not interpolated")
    columns = [
        fits.Column(name="RAY_INDEX", format="J", array=np.asarray([row["rayIndex"] for row in rows], dtype=np.int32)),
        fits.Column(name="RAY_ID", format="8A", array=np.asarray([row["rayId"] for row in rows], dtype="S8")),
        fits.Column(name="SPIN_A", format="D", array=np.asarray([row["spinA"] for row in rows], dtype=np.float64)),
        fits.Column(name="EVPA_DEG", format="D", unit="deg", array=np.asarray([row["authorityEvpaDeg"] for row in rows], dtype=np.float64)),
        fits.Column(name="TENSOR_C", format="D", array=np.asarray([row["axialOrientationTensor"]["cosTwoChi"] for row in rows], dtype=np.float64)),
        fits.Column(name="TENSOR_S", format="D", array=np.asarray([row["axialOrientationTensor"]["sinTwoChi"] for row in rows], dtype=np.float64)),
        fits.Column(name="DIR_ALPHA", format="D", array=np.asarray([row["worldDirectionUnit"]["alpha"] for row in rows], dtype=np.float64)),
        fits.Column(name="DIR_BETA", format="D", array=np.asarray([row["worldDirectionUnit"]["beta"] for row in rows], dtype=np.float64)),
        fits.Column(name="NEG_ALPHA", format="D", unit="M", array=np.asarray([row["presentationGlyph"]["negative"]["alphaM"] for row in rows], dtype=np.float64)),
        fits.Column(name="NEG_BETA", format="D", unit="M", array=np.asarray([row["presentationGlyph"]["negative"]["betaM"] for row in rows], dtype=np.float64)),
        fits.Column(name="NEG_PIX_X", format="D", array=np.asarray([row["presentationGlyph"]["negative"]["pixelX"] for row in rows], dtype=np.float64)),
        fits.Column(name="NEG_PIX_Y", format="D", array=np.asarray([row["presentationGlyph"]["negative"]["pixelY"] for row in rows], dtype=np.float64)),
        fits.Column(name="POS_ALPHA", format="D", unit="M", array=np.asarray([row["presentationGlyph"]["positive"]["alphaM"] for row in rows], dtype=np.float64)),
        fits.Column(name="POS_BETA", format="D", unit="M", array=np.asarray([row["presentationGlyph"]["positive"]["betaM"] for row in rows], dtype=np.float64)),
        fits.Column(name="POS_PIX_X", format="D", array=np.asarray([row["presentationGlyph"]["positive"]["pixelX"] for row in rows], dtype=np.float64)),
        fits.Column(name="POS_PIX_Y", format="D", array=np.asarray([row["presentationGlyph"]["positive"]["pixelY"] for row in rows], dtype=np.float64)),
        fits.Column(name="INTENSITY", format="D", array=np.full(4, np.nan, dtype=np.float64)),
        fits.Column(name="STOKESAMP", format="D", array=np.full(4, np.nan, dtype=np.float64)),
    ]
    table = fits.BinTableHDU.from_columns(columns, name="AXIAL_VECTORS")
    table.header["EVPAZERO"] = "+BETA"
    table.header["EVPAPOS"] = "+ALPHA"
    table.header["GLYPHLEN"] = (4.0, "Fixed display length in M, not amplitude")
    table.header["DENSE"] = (False, "Dense campaign remains 0/49")
    temporary = FITS_PATH.with_name(f"{FITS_PATH.name}.{os.getpid()}.part")
    fits.HDUList([primary, table]).writeto(temporary, overwrite=True)
    temporary.replace(FITS_PATH)
    with fits.open(FITS_PATH) as opened:
        if (
            len(opened) != 2
            or opened[0].data is not None
            or opened[0].header["HASIMAGE"]
            or not opened[0].header["AXIAL"]
            or opened[0].header["INTENS"]
            or opened[0].header["INTERPOL"]
            or len(opened[1].data) != 4
        ):
            raise RuntimeError("v421-fits-boundary")
        header = opened[0].header.copy()
        header["NAXIS"] = 2
        header["NAXIS1"] = 384
        header["NAXIS2"] = 384
        recovered_wcs = WCS(header)
        endpoints = np.asarray(
            [
                [
                    [row["presentationGlyph"]["negative"]["alphaM"], row["presentationGlyph"]["negative"]["betaM"]],
                    [row["presentationGlyph"]["positive"]["alphaM"], row["presentationGlyph"]["positive"]["betaM"]],
                ]
                for row in rows
            ],
            dtype=float,
        ).reshape(-1, 2)
        expected = np.asarray(
            [
                [
                    [row["presentationGlyph"]["negative"]["pixelX"], row["presentationGlyph"]["negative"]["pixelY"]],
                    [row["presentationGlyph"]["positive"]["pixelX"], row["presentationGlyph"]["positive"]["pixelY"]],
                ]
                for row in rows
            ],
            dtype=float,
        ).reshape(-1, 2)
        if float(np.max(np.abs(recovered_wcs.all_world2pix(endpoints, 1) - expected))) >= 1e-10:
            raise RuntimeError("v421-fits-WCS-endpoints")


def write_png(view: dict[str, object]) -> None:
    rows = view["rows"]
    width, height = 1440, 840
    image = Image.new("RGB", (width, height), (2, 7, 10))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    left, top, right, bottom = 118, 112, 1350, 712

    draw.rectangle((0, 0, width - 1, height - 1), outline=(62, 103, 111), width=1)
    draw.text((40, 30), "V421 KERR WCS-AWARE AXIAL POLARIZATION VECTORS", fill=(216, 242, 237), font=font)
    draw.text((40, 52), "EVPA 0 DEG = +BETA / POSITIVE TOWARD +ALPHA / PRIOR V419-V420 PNG ORIENTATION WITHDRAWN", fill=(250, 190, 92), font=font)
    draw.rectangle((left, top, right, bottom), fill=(3, 13, 17), outline=(51, 88, 98), width=1)

    def xy(alpha: float, beta: float) -> tuple[float, float]:
        x = left + (alpha + 22.0) / 44.0 * (right - left)
        y = bottom - (beta + 16.0) / 32.0 * (bottom - top)
        return x, y

    for alpha in range(-20, 21, 4):
        x, _ = xy(float(alpha), -16.0)
        draw.line((x, top, x, bottom), fill=(12, 35, 42), width=1)
        draw.text((x - 10, bottom + 12), str(alpha), fill=(79, 133, 141), font=font)
    for beta in range(-16, 17, 4):
        _, y = xy(-22.0, float(beta))
        draw.line((left, y, right, y), fill=(12, 35, 42), width=1)
        draw.text((left - 36, y - 5), str(beta), fill=(79, 133, 141), font=font)
    draw.line((*xy(0.0, -14.0), *xy(0.0, -10.0)), fill=(117, 238, 219), width=4)
    draw.text((xy(0.0, -10.0)[0] + 10, xy(0.0, -10.0)[1] - 4), "+beta / EVPA 0 deg", fill=(142, 224, 212), font=font)
    draw.line((*xy(-2.0, -12.0), *xy(2.0, -12.0)), fill=(117, 238, 219), width=4)
    draw.text((xy(2.0, -12.0)[0] + 10, xy(2.0, -12.0)[1] - 4), "+alpha / EVPA 90 deg", fill=(142, 224, 212), font=font)

    for row in rows:
        center_alpha = (
            row["presentationGlyph"]["negative"]["alphaM"]
            + row["presentationGlyph"]["positive"]["alphaM"]
        ) / 2.0
        center_beta = (
            row["presentationGlyph"]["negative"]["betaM"]
            + row["presentationGlyph"]["positive"]["betaM"]
        ) / 2.0
        center = xy(center_alpha, center_beta)
        negative = xy(
            row["presentationGlyph"]["negative"]["alphaM"],
            row["presentationGlyph"]["negative"]["betaM"],
        )
        positive = xy(
            row["presentationGlyph"]["positive"]["alphaM"],
            row["presentationGlyph"]["positive"]["betaM"],
        )
        draw.line((*negative, *positive), fill=(104, 237, 213), width=5)
        draw.ellipse((center[0] - 6, center[1] - 6, center[0] + 6, center[1] + 6), fill=(248, 184, 86), outline=(255, 226, 160), width=1)
        draw.text((center[0] - 44, center[1] + 22), row["rayId"], fill=(203, 232, 226), font=font)
        draw.text((center[0] - 62, center[1] + 39), f"EVPA {float(row['authorityEvpaDeg']):.5f} deg", fill=(111, 190, 184), font=font)

    draw.text((40, 772), "Fixed 4M glyph length is display scale, not polarization amplitude. No intensity, Stokes amplitude or interpolation.", fill=(127, 164, 166), font=font)
    draw.text((40, 793), "Finite ZAMO r=30M i=70deg | FITS 1-based continuous WCS | dense campaign 0/49 | science raster unavailable", fill=(109, 146, 151), font=font)
    temporary = PNG_PATH.with_name(f"{PNG_PATH.name}.{os.getpid()}.part")
    image.save(temporary, format="PNG", optimize=False, compress_level=9)
    temporary.replace(PNG_PATH)


def main() -> None:
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    view = artifact.get("view", {})
    if (
        artifact.get("version") != "v421-kerr-axial-polarization-vector-artifact-v1"
        or len(view.get("rows", [])) != 4
        or view.get("priorDisplayAudit", {}).get("historicalFilesOverwritten") is not False
    ):
        raise RuntimeError("v421-artifact-boundary")
    validate_csv()
    write_fits(view)
    write_png(view)
    manifest = {
        "version": "v421-kerr-axial-polarization-export-manifest-v1",
        "artifactSha256": artifact["artifactSha256"],
        "exports": {
            "json": {"path": ARTIFACT.name, "sha256": file_sha(ARTIFACT), "semantic": "WCS-aware-axial-vector-catalog"},
            "csv": {"path": CSV_PATH.name, "sha256": file_sha(CSV_PATH), "semantic": "four-ray-axial-vector-endpoint-catalog"},
            "fits": {"path": FITS_PATH.name, "sha256": file_sha(FITS_PATH), "semantic": "primary-WCS-plus-axial-vector-binary-table-no-image-data"},
            "png": {"path": PNG_PATH.name, "sha256": file_sha(PNG_PATH), "semantic": "corrected-sparse-axial-quiver-not-raster-science-image"},
        },
        "evpaZeroDirection": "plus-beta",
        "evpaPositiveDirection": "toward-plus-alpha",
        "priorV419V420PngOrientation": "withdrawn-display-only-90-degree-convention-mismatch",
        "fitsImage": "unavailable-no-raster-science-values",
        "intensity": "unavailable",
        "stokesAmplitude": "unavailable",
        "interpolationAllowed": False,
        "historicalFilesOverwritten": False,
        "denseShardExecuted": False,
    }
    atomic(MANIFEST, (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))
    print(json.dumps({
        "status": "exported-v421-corrected-axial-vector-products",
        "artifactSha256": artifact["artifactSha256"],
        "fits": manifest["exports"]["fits"]["semantic"],
        "png": manifest["exports"]["png"]["semantic"],
        "historicalFilesOverwritten": False,
    }, indent=2))


if __name__ == "__main__":
    main()
