from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest

RUN = runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-schwarzschild-window-completion.py"))
W = RUN["WINDOW"]


def saved(path, t, order=2, n=17):
    return {"path": path, "bounded_window": True, "diagnostics": {"time": t,
        "core": {m: {"l2": (1./(n-1))**order} for m in W["METRICS"]}}}


def complete_fixture():
    """Synthetic coverage fixture; deliberately not numerical evidence."""
    rows = [{"order": o, "n": n, "samples": [saved(f"main-{o}-{n}-{t}", t, o, n)
             for t in W["TIMES"]]} for o in (2, 4) for n in (17, 25, 33)]
    return {"cases": rows, "assessment": W["assess"](rows),
        "intermediate_samples": [saved(f"split-{i}", .375) for i in range(30)],
        "expanded_samples": [saved(f"expanded-{t}", t) for t in W["TIMES"]],
        "boundary_comparisons": [{"time": t, "metrics": {m: {
            "rms_difference": .1, "baseline_error": 1., "ratio_to_baseline": .1,
            "resolved_above_floor": True} for m in W["METRICS"]}} for t in W["TIMES"]],
        "time_samples": [saved(f"time-{t}", t) for t in (.25, .5, 1.)],
        "time_controls": [{"time": t, "passed": True, "metrics": {m: {
            "rms_difference": .01, "coarse_norm": 1., "fine_norm": .99,
            "ratio": .01, "passed": True} for m in W["METRICS"]}} for t in (.25, .5, 1.)],
        "execution_split": saved("time-.75", .75), "deterministic_replay": True,
        "initial_shared_fields_byte_equal": True}


def test_complete_coverage_requires_every_control_and_62_distinct_samples():
    value = complete_fixture()
    assert len(RUN["observations"](value)) == 62
    assert RUN["full_assessment"](value) == {"bounded_window": True, "window_passed": True}


@pytest.mark.parametrize("defect", ["case", "boundary-time", "boundary-metric", "boundary-nan",
    "shared", "time", "time-metric", "time-ratio", "time-verdict", "split", "duplicate", "replay"])
def test_missing_or_contradictory_evidence_is_rejected(defect):
    value = complete_fixture()
    if defect == "case":
        value["cases"].pop()
    elif defect == "boundary-time":
        value["boundary_comparisons"].pop()
    elif defect == "boundary-metric":
        del value["boundary_comparisons"][0]["metrics"]["A"]
    elif defect == "boundary-nan":
        value["boundary_comparisons"][0]["metrics"]["A"]["rms_difference"] = float("nan")
    elif defect == "shared":
        value["initial_shared_fields_byte_equal"] = False
    elif defect == "time":
        value["time_samples"].pop()
    elif defect == "time-metric":
        del value["time_controls"][0]["metrics"]["A"]
    elif defect == "time-ratio":
        value["time_controls"][0]["metrics"]["A"]["ratio"] = .02
    elif defect == "time-verdict":
        value["time_controls"][0]["passed"] = False
    elif defect == "split":
        value["execution_split"]["diagnostics"]["time"] = .5
    elif defect == "duplicate":
        value["intermediate_samples"][-1] = value["intermediate_samples"][0]
    else:
        value["deterministic_replay"] = False
    with pytest.raises(ValueError):
        RUN["full_assessment"](value)


@pytest.mark.parametrize("failure", ["convergence", "bound", "timestep"])
def test_numerical_failure_stays_false_without_becoming_execution_error(failure):
    value = complete_fixture()
    if failure == "convergence":
        value["cases"][3]["samples"][-1]["diagnostics"]["core"]["H"]["l2"] = 1.e-10
        value["assessment"] = W["assess"](value["cases"])
    elif failure == "bound":
        value["intermediate_samples"][0]["bounded_window"] = False
    else:
        metric = value["time_controls"][0]["metrics"]["A"]
        metric.update(rms_difference=.1, ratio=.1, passed=False)
        value["time_controls"][0]["passed"] = False
    assert not RUN["full_assessment"](value)["window_passed"]


@pytest.mark.parametrize("start,target,dt,expected", [(.125, .25, 1./256, [32]),
    (.25, .5, 1./256, [32, 32]), (.5, 1., 1./256, [32]*4),
    (.125, .25, 1./512, [32, 32]), (.75, 1., 1./512, [32]*4)])
def test_segments_preserve_exact_steps(start, target, dt, expected):
    assert RUN["segment_counts"](start, target, dt) == expected


@pytest.mark.parametrize("start,target,dt", [(0., 0., .1), (1., 0., .1), (0., .01, 1./256),
    (0., 1., 0.), (0., 1., float("nan")), (0., float("inf"), .1)])
def test_invalid_segments_rejected(start, target, dt):
    with pytest.raises(ValueError):
        RUN["segment_counts"](start, target, dt)


def test_strict_halo_bytes_distinguish_signed_zero():
    left, right = RUN["seed"](9, 4), RUN["seed"](9, 4)
    right.slots[1][0, 0, 0] = -0.
    assert np.array_equal(left.slots, right.slots)
    assert RUN["halo_bytes"](left) != RUN["halo_bytes"](right)


def test_segmented_runner_retains_every_intermediate_without_retry(monkeypatch, tmp_path):
    calls = []

    class FakeRunner:
        def native(self, binary, label, data, path, steps):
            calls.append((label, steps))
            end = SimpleNamespace(header={**data.header, "time": data.header["time"]+steps*data.header["dt"]})
            return end, tmp_path/(label+".bin"), None

    monkeypatch.setitem(RUN["segmented"].__globals__, "sample", lambda d, p: saved(str(p), d.header["time"]))
    receipt = {"binary": "unused.exe", "intermediate_samples": []}
    data = SimpleNamespace(header={"time": .5, "dt": 1./256})
    end, _, result = RUN["segmented"](FakeRunner(), receipt, "fd4-n33", data, tmp_path/"start.bin", 1.)
    assert [s for _, s in calls] == [32]*4
    assert [s["diagnostics"]["time"] for s in receipt["intermediate_samples"]] == [.625, .75, .875]
    assert end.header["time"] == result["diagnostics"]["time"] == 1.


def test_segment_execution_error_is_not_retried(monkeypatch, tmp_path):
    calls = []

    class BrokenRunner:
        def native(self, *args):
            calls.append(args)
            raise RuntimeError("intentional failure")

    with pytest.raises(RuntimeError, match="intentional"):
        RUN["segmented"](BrokenRunner(), {"binary": "unused", "intermediate_samples": []}, "test",
            SimpleNamespace(header={"time": .5, "dt": 1./256}), tmp_path/"start.bin", 1.)
    assert len(calls) == 1


@pytest.mark.parametrize("c_free,e_free,accepted", [
    (3*1024**3, 4*1024**3+32*1024**2, True),
    (3*1024**3-1, 5*1024**3, False),
    (4*1024**3, 4*1024**3+32*1024**2-1, False),
])
def test_user_approved_storage_floors_are_exact(monkeypatch, tmp_path, c_free, e_free, accepted):
    runner = RUN["Runner"](tmp_path, {}, "fd4", 0.)
    monkeypatch.setattr(RUN["shutil"], "disk_usage",
                        lambda p: SimpleNamespace(free=c_free if Path(p)==RUN["ANCHOR"].parent else e_free))
    if accepted:
        assert runner.budget() == 180.
    else:
        with pytest.raises(ValueError, match="reserve reached"):
            runner.budget()
