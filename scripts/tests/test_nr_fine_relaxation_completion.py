from copy import deepcopy
from pathlib import Path
import runpy

import pytest

RUN = runpy.run_path(str(Path(__file__).resolve().parents[1]/"finish-nr-k3-fine-relaxation.py"))
BASE = RUN["BASE"]


def stopped():
    return {"schema_version": "nr-k3-fine-relaxation-v1", "completed": False,
        "convergence_passed": False, "serial_direct_restart_equal": False, "seconds": 1800.1,
        "errors": [{"type": "TimeoutExpired"}],
        "commands": [{"returncode": 0} for _ in range(23)] + [{"label": RUN["MISSING"].label+"-t0.25",
            "returncode": None, "timed_out": True, "timeout_seconds": 52., "seconds": 52.1}],
        "cases": [{**BASE["metadata"](c), "samples": [{"time": t, "metrics": {
            name: {"l2": 0., "linf": 0.} for name in BASE["FLOORS"]}}
            for t in ([0., .125] if c == RUN["MISSING"] else BASE["TIMES"])]} for c in BASE["CASES"]]}


def test_exact_resource_stop_prefix_is_nonmutating():
    value = stopped()
    before = deepcopy(value)
    RUN["validate_stop"](value)
    assert value == before


@pytest.mark.parametrize("change", ("passed", "completed", "replay", "error", "short",
    "per_command_timeout", "command_failure", "wrong_command", "extra_sample", "missing_sample",
    "duplicate", "missing_constraint", "case_identity"))
def test_other_failures_or_unreviewed_prefixes_rejected(change):
    p = stopped()
    if change in ("passed", "completed", "replay"):
        p[{"passed": "convergence_passed", "completed": "completed", "replay": "serial_direct_restart_equal"}[change]] = True
    elif change == "error":
        p["errors"][0]["type"] = "ValueError"
    elif change == "short":
        p["seconds"] = 500.
    elif change == "per_command_timeout":
        p["commands"][-1]["timeout_seconds"] = 180.
    elif change == "command_failure":
        p["commands"][0]["returncode"] = 2
    elif change == "wrong_command":
        p["commands"][-1]["label"] = "invented"
    elif change == "extra_sample":
        p["cases"][-1]["samples"].append({"time": .25, "metrics": {}})
    elif change == "missing_sample":
        p["cases"][0]["samples"].pop()
    elif change == "duplicate":
        p["cases"][-1] = p["cases"][0]
    elif change == "missing_constraint":
        del p["cases"][0]["samples"][0]["metrics"]["H"]
    else:
        p["cases"][0]["spatial_order"] = 4
    with pytest.raises(ValueError):
        RUN["validate_stop"](p)


def test_completion_adds_only_runner_and_test():
    assert len(RUN["NEW"]) == 2
    assert all(p.startswith("scripts/") for p in RUN["NEW"])
    assert RUN["PARENT_SHA"] == "8425a85ee03170aafef3236a43c07c1e46c8021b8477c6a733e940189bee0fb5"
