from __future__ import annotations
import importlib.util,json
from pathlib import Path
SPEC=importlib.util.spec_from_file_location("v535",Path("scripts/run-kerr-bandpass-shift-jacobian-oracle-v535.py"));assert SPEC and SPEC.loader
MODULE=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(MODULE)
ORACLE=Path("dist/science/kerr-bandpass-shift-jacobian-v535/python-oracle.json");ATLAS=Path("dist/science/kerr-bandpass-shift-jacobian-v535/atlas.json")
def read(path:Path):return json.loads(path.read_text(encoding="utf-8"))
def test_oracle_canonical_and_complete():
    value=read(ORACLE);assert MODULE.canonical_sha(value)==value["artifactSha256"];assert value["counts"]["jacobianRowCount"]==4;assert value["diagnosticBoundary"]["centralDifferenceQualifiedAsAuthority"]is False
def test_independent_jacobians_agree():
    value=read(ATLAS);assert value["counts"]["analyticJacobianCount"]==4;assert value["counts"]["independentOracleJacobianCount"]==4;assert value["maxima"]["jacobianAbsoluteDifference"]<2e-6
def test_finite_shift_remainder_is_explicit():
    value=read(ATLAS);assert all(row["nonlinearRemainderFractionOfActual"]>=0 for row in value["rows"]);assert value["counts"]["nonlinearRemainderCount"]==4
def test_missing_uncertainty_is_not_zero():
    value=read(ATLAS);assert all(row["measuredWavelengthCalibrationSigmaLn"]is None for row in value["rows"]);assert all(row["totalScientificUncertaintyRelative"]=="unavailable" for row in value["rows"]);assert value["counts"]["physicalUncertaintyIntervalCount"]==0
