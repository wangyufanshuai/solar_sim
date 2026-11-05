from __future__ import annotations

import importlib.util
import json
from pathlib import Path

SPEC = importlib.util.spec_from_file_location(
    "v534_oracle",
    Path("scripts/run-kerr-bandpass-redshift-commutator-oracle-v534.py"),
)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
ORACLE = Path("dist/science/kerr-bandpass-redshift-commutator-v534/python-oracle.json")
ATLAS = Path("dist/science/kerr-bandpass-redshift-commutator-v534/atlas.json")


def read(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def test_oracle_is_canonical_and_complete():
    oracle = read(ORACLE)
    assert MODULE.canonical_sha(oracle) == oracle["artifactSha256"]
    assert oracle["counts"] == {
        "rayCount": 4,
        "exactIntegralCount": 4,
        "frozenIntegralCount": 4,
        "unitIdentityFixtureCount": 4,
    }
    assert oracle["formulation"]["quadrature"] == "fixed-simpson-262144"


def test_redshift_and_response_do_not_commute_for_authority_rays():
    atlas = read(ATLAS)
    rows = atlas["rows"]
    assert len(rows) == 4
    assert all(row["redshiftBandpassCommutatorRelative"] > 0 for row in rows)
    assert all(row["unitRedshiftIdentityResidual"] < 1e-12 for row in rows)
    assert max(row["pythonFrequencyDomainRelativeDifference"] for row in rows) < 1e-7
    assert max(row["pythonCommutatorAbsoluteDifference"] for row in rows) < 1e-7


def test_operator_has_physical_units_and_single_response_application():
    atlas = read(ATLAS)
    assert atlas["operator"]["responseAppliedExactlyOnce"] is True
    assert atlas["operator"]["photonFrequencyTransform"].startswith("N_nu_observer=g_squared")
    assert atlas["qualification"]["bandpassRedshiftOperatorQualified"] is True
    assert atlas["qualification"]["nonCommutativityDetected"] is True


def test_measurement_and_product_boundaries_remain_closed():
    atlas = read(ATLAS)
    assert atlas["boundary"]["sourceDossierStatus"] == "incomplete-1-of-7"
    assert atlas["boundary"]["measuredCalibrationFiles"] == 0
    assert atlas["counts"]["electronExpectationRowCount"] == 0
    assert atlas["counts"]["observedCountRowCount"] == 0
    assert atlas["counts"]["sciencePixelRowCount"] == 0
    assert atlas["boundary"]["formalProductPointer"] == "v263"
    assert atlas["boundary"]["denseCampaignStatus"] == "incomplete-0-of-49"
