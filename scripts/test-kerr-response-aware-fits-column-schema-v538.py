from __future__ import annotations

import csv
import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
from astropy.io import fits

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "dist/science/kerr-response-aware-fits-column-schema-v538/atlas.json"
CSV_PATH = ROOT / "dist/science/kerr-response-aware-fits-column-schema-v538/column-schema.csv"
FITS_PATH = ROOT / "dist/science/kerr-response-aware-sparse-fits-v537/response-aware-sparse-table.fits"
BUILDER_PATH = ROOT / "scripts/build-kerr-response-aware-fits-column-schema-v538.py"
SPEC = importlib.util.spec_from_file_location("v538_builder", BUILDER_PATH)
assert SPEC and SPEC.loader
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


def test_v538_column_schema_is_canonical_complete_and_ordered() -> None:
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    assert BUILDER.canonical_sha(artifact) == artifact["artifactSha256"]
    assert len(artifact["columns"]) == 17
    assert [column["name"] for column in artifact["columns"]] == [entry["name"] for entry in BUILDER.COLUMNS]
    assert all(BUILDER.canonical_sha({key: value for key, value in column.items() if key != "columnSha256"}) == column["columnSha256"] for column in artifact["columns"])
    assert all(column["formatQualified"] and column["unitQualified"] and column["domainQualified"] for column in artifact["columns"])
    with CSV_PATH.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    assert len(rows) == 17
    assert [row["name"] for row in rows] == [column["name"] for column in artifact["columns"]]
    assert hashlib.sha256(CSV_PATH.read_bytes()).hexdigest() == artifact["export"]["csvFileSha256"]


def test_v538_cross_column_science_boundaries_replay_independently() -> None:
    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    with fits.open(FITS_PATH, checksum=True, memmap=False) as hdus:
        table = hdus[1].data
        q = np.asarray(table["Q_HAT"], dtype=np.float64)
        u = np.asarray(table["U_HAT"], dtype=np.float64)
        residual = float(np.max(np.abs(q * q + u * u - 1)))
        assert residual == artifact["invariants"]["maximumOrientationUnitNormResidual"]
        assert residual < artifact["invariants"]["orientationUnitNormLimit"]
        assert not np.any(table["PHYS_UNC"])
        assert not np.any(table["PIXEL"])
        assert np.all(np.asarray(table["REDSHIFT"]) > 0)
    assert artifact["invariants"]["physicalUncertaintyFalseMeansZeroUncertainty"] is False
    assert artifact["invariants"]["pixelFalseMeansZeroValuedPixel"] is False
    assert artifact["boundary"]["measuredCalibrationFiles"] == 0
    assert artifact["counts"]["physicalUncertaintyValueCount"] == 0


def test_v538_domain_mutations_fail_closed() -> None:
    assert BUILDER.domain_valid("REDSHIFT", np.asarray([1.0, -0.1])) is False
    assert BUILDER.domain_valid("PHYS_UNC", np.asarray([False, True])) is False
    assert BUILDER.domain_valid("PIXEL", np.asarray([False, True])) is False
    assert BUILDER.domain_valid("ROW_SHA", np.asarray(["0" * 64, "not-a-sha", "1" * 64, "2" * 64])) is False
