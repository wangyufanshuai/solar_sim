"""Offline contract tests for the post-v593 SIMBAD intake parser."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path
from typing import Any


SCRIPT_PATH = Path(__file__).with_name(
    "intake-post-v593-simbad-stellar-sources.py"
)
SPEC = importlib.util.spec_from_file_location("stellar_simbad_intake", SCRIPT_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"cannot load intake module: {SCRIPT_PATH}")
INTAKE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INTAKE)


class FakeRow(dict[str, Any]):
    @property
    def colnames(self) -> list[str]:
        return list(self.keys())


class FakeClient:
    def __init__(self, rows: list[FakeRow] | None = None) -> None:
        self.rows = rows
        self.requested_fields: tuple[str, ...] = ()

    def add_votable_fields(self, *fields: str) -> None:
        self.requested_fields = fields

    def query_object(self, _query_id: str) -> list[FakeRow] | None:
        return self.rows


def complete_row() -> FakeRow:
    return FakeRow(
        {
            "main_id": "* alf Lyr",
            "otype": "V*",
            "ra": 279.23473479,
            "dec": 38.78368896,
            "ids": "Vega|* alf Lyr",
            "coo_err_maj": 0.1,
            "coo_err_min": 0.05,
            "coo_err_angle": 37.0,
            "coo_wavelength": "O",
            "coo_bibcode": "2007A&A...474..653V",
            "plx_value": 130.23,
            "plx_err": 0.36,
            "plx_bibcode": "2007A&A...474..653V",
            "sp_type": "A0Va",
            "sp_qual": "C",
            "sp_bibcode": "1989ApJS...71..245K",
            "pmra": 200.94,
            "pmdec": 286.23,
            "pm_err_maj": 0.2,
            "pm_err_min": 0.2,
        }
    )


class SimbadIntakeContractTest(unittest.TestCase):
    def test_requests_every_optional_field_consumed_by_parser(self) -> None:
        client = FakeClient()
        INTAKE.configure_simbad_client(client)
        self.assertEqual(client.requested_fields, INTAKE.SIMBAD_VOTABLE_FIELDS)
        self.assertIn("coo_err_angle", client.requested_fields)
        self.assertIn("coo_wavelength", client.requested_fields)

    def test_parses_requested_coordinate_angle_and_wavelength_offline(self) -> None:
        record = INTAKE.query_target(
            FakeClient([complete_row()]),
            "vega",
            "Vega",
            "exact-named-star",
        )
        self.assertEqual(record["queryStatus"], "resolved")
        self.assertEqual(record["coordinate"]["errorAngleDeg"], 37.0)
        self.assertEqual(record["coordinate"]["wavelength"], "O")
        self.assertEqual(record["identifiers"], ["* alf Lyr", "Vega"])

    def test_missing_parser_column_blocks_instead_of_keyerror_or_zero(self) -> None:
        row = complete_row()
        del row["coo_err_angle"]
        del row["coo_wavelength"]
        record = INTAKE.query_target(
            FakeClient([row]),
            "vega",
            "Vega",
            "exact-named-star",
        )
        self.assertEqual(
            record["queryStatus"],
            "blocked-missing-required-votable-fields",
        )
        self.assertEqual(
            record["missingVotableFields"],
            ["coo_err_angle", "coo_wavelength"],
        )
        self.assertIsNone(record["mainId"])
        self.assertNotIn("coordinate", record)
        self.assertNotEqual(record.get("errorAngleDeg"), 0)


if __name__ == "__main__":
    unittest.main()
