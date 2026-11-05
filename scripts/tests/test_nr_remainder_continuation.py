from copy import deepcopy
import os
from pathlib import Path
import runpy

import pytest


@pytest.fixture(scope="module")
def driver():
    return runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-remainder-continuation.py"))


def rows(driver):
    return [{"family": f, "points": n, "amplitude": a, "steps": steps, "dt": 1./steps,
             "samples": [{"time": t, "step": int(t*steps)} for t in driver["TIMES"]]}
            for f, n, a, steps in driver["CASES"]]


def test_live_parent_cannot_be_restarted(driver):
    with pytest.raises(RuntimeError, match="still alive"):
        driver["require_stopped"](123, alive=lambda _: True)
    driver["require_stopped"](123, alive=lambda _: False)


@pytest.mark.parametrize("pid", (-1, 0, True, 2**32, 3.5))
def test_invalid_parent_pid_rejected(driver, pid):
    with pytest.raises(ValueError):
        driver["require_stopped"](pid, alive=lambda _: False)


def test_process_observation_error_is_not_a_termination(driver):
    def failed(_):
        raise OSError("access denied")
    with pytest.raises(OSError):
        driver["require_stopped"](123, alive=failed)


@pytest.mark.skipif(os.name != "nt", reason="Windows-native process contract")
def test_actual_windows_process_probe_recognizes_this_live_test_process(driver):
    assert driver["windows_process_alive"](os.getpid())


def test_completed_prefix_and_last_partial_prefix_allowed(driver):
    data = rows(driver)
    for count in range(1, 8):
        for samples in range(1, 10):
            partial = deepcopy(data[:count])
            partial[-1]["samples"] = partial[-1]["samples"][:samples]
            driver["validate_prefix"](partial)


@pytest.mark.parametrize("mutation", ("hole", "duplicate", "nonterminal_partial", "sample_gap", "wrong_dt", "wrong_step", "empty"))
def test_reordered_missing_or_incompatible_parent_data_rejected(driver, mutation):
    data = rows(driver)
    if mutation == "hole":
        data.pop(2)
    elif mutation == "duplicate":
        data[1] = deepcopy(data[0])
    elif mutation == "nonterminal_partial":
        data[0]["samples"].pop()
    elif mutation == "sample_gap":
        data[-1]["samples"].pop(3)
    elif mutation == "wrong_dt":
        data[-1]["dt"] *= 2
    elif mutation == "wrong_step":
        data[-1]["samples"][-1]["step"] -= 1
    else:
        data[-1]["samples"] = []
    with pytest.raises(ValueError):
        driver["validate_prefix"](data)


def test_parent_hash_mismatch_rejected_before_loading_untrusted_metadata(driver, tmp_path):
    path = tmp_path/"parent.json"
    path.write_text("{}", encoding="utf-8")
    with pytest.raises(ValueError, match="hash mismatch"):
        driver["validate_parent"](path, "0"*64)
