from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import numpy as np
from astropy.io import fits

ROOT = Path(__file__).resolve().parents[1]
ATLAS = ROOT / "dist/science/kerr-response-aware-sparse-fits-v537/atlas.json"
FITS = ROOT / "dist/science/kerr-response-aware-sparse-fits-v537/response-aware-sparse-table.fits"
SOURCE = ROOT / "dist/science/kerr-response-aware-sparse-image-v536/atlas.json"
TRANSIENT = {"generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"}


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def canonical_sha(value: Any) -> str:
    payload = json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode()
    return hashlib.sha256(payload).hexdigest()


def test_v537_fits_binary_table_is_deterministic_and_not_an_image() -> None:
    atlas = json.loads(ATLAS.read_text(encoding="utf-8"))
    assert canonical_sha(atlas) == atlas["artifactSha256"]
    assert hashlib.sha256(FITS.read_bytes()).hexdigest() == atlas["fits"]["fileSha256"]
    with fits.open(FITS, checksum=True, memmap=False) as hdus:
        hdus.verify("exception")
        assert len(hdus) == 2
        assert hdus[0].data is None
        assert hdus[0].header["NAXIS"] == 0
        assert hdus[0].header["HASIMAGE"] is False
        assert isinstance(hdus[1], fits.BinTableHDU)
        assert not any(isinstance(hdu, fits.ImageHDU) for hdu in hdus)
        assert len(hdus[1].data) == 4
        assert list(hdus[1].columns.names) == ["RAY_ID", "RAY_INDEX", "SPIN_A", "X_CONT", "Y_CONT", "ALPHA_M", "BETA_M", "REDSHIFT", "EVPA_DEG", "Q_HAT", "U_HAT", "PHOT_RAD", "RESP_J", "NONLIN", "PHYS_UNC", "PIXEL", "ROW_SHA"]
        assert not np.any(hdus[1].data["PHYS_UNC"])
        assert not np.any(hdus[1].data["PIXEL"])
        assert all(hdu.verify_checksum() == 1 and hdu.verify_datasum() == 1 for hdu in hdus)
        assert all("2026-08-02T00:00:00" in hdu.header.comments["CHECKSUM"] for hdu in hdus)


def test_v537_rows_replay_v536_identity_and_sha() -> None:
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    with fits.open(FITS, checksum=True, memmap=False) as hdus:
        table = hdus[1].data
        for index, row in enumerate(source["rows"]):
            assert int(table["RAY_INDEX"][index]) == row["rayIndex"]
            assert str(table["RAY_ID"][index]).strip() == row["rayId"]
            assert str(table["ROW_SHA"][index]).strip() == row["rowSha256"]
            assert float(table["X_CONT"][index]) == row["coordinate"]["continuousPixelX"]
            assert float(table["Y_CONT"][index]) == row["coordinate"]["continuousPixelY"]
            assert float(table["PHOT_RAD"][index]) == row["responseAwareRadiometry"]["observerBandpassPhotonRadiancePerSM2Sr"]
