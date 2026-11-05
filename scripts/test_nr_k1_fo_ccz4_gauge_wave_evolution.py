from __future__ import annotations

import importlib.util
from pathlib import Path


_SCRIPT = Path(__file__).with_name("run-nr-k1-fo-ccz4-gauge-wave-evolution.py")
_SPEC = importlib.util.spec_from_file_location("nr_k1_gauge_wave", _SCRIPT)
if _SPEC is None or _SPEC.loader is None:  # pragma: no cover - import contract
    raise RuntimeError("unable to load gauge-wave campaign script")
_MODULE = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(_MODULE)


def test_same_physical_final_time_accepts_refinement_rows() -> None:
    rows = [{"simulated_time": 0.01}, {"simulated_time": 0.01}]
    assert _MODULE._same_physical_final_time(rows, 0.01)


def test_same_physical_final_time_rejects_historical_fixed_step_mismatch() -> None:
    rows = [{"simulated_time": 0.01}, {"simulated_time": 0.008}]
    assert not _MODULE._same_physical_final_time(rows, 0.01)
