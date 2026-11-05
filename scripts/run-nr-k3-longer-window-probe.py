"""Longer-window guard probe of the unchanged nonlinear driver, not stability."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import platform
import runpy
import shutil
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
D = runpy.run_path(str(ROOT/"scripts/run-nr-k3-nonlinear-dual-diagnostics.py"))
B = runpy.run_path(str(ROOT/"scripts/run-nr-k3-determinant-balance.py"))
R = D["R"]
require, sha, bounded = (R[k] for k in ("require", "sha", "bounded"))
FLAGS, EVIDENCE, NonlinearSBPCube, Grid3D = (R[k] for k in ("FLAGS", "EVIDENCE", "NonlinearSBPCube", "Grid3D"))
PARENT = B["PARENT"]
BALANCE = EVIDENCE/"nr-k3-determinant-balance-v1-20261009/receipt.json"
BALANCE_REPLAY = EVIDENCE/"nr-k3-determinant-balance-replay-v1-20261009/receipt.json"
REGRESSION = ROOT/"tmp/nr-determinant-budget-regression-v1-20261009.xml"
RETAINED = {
    **B["RETAINED"],
    BALANCE: "4919e2e8f8b85baf00dbe70bffb96df8411508f2cad6f6c21609783179c78b3b",
    BALANCE_REPLAY: "7d2e4f860c76011397f4bae7e1eb6201c5a6bcfadecbccf14165c7b820b4e197",
    REGRESSION: "7e3688ccceed48ec195f2268c4909579c734b11b83cb035182db7aebdfb5b3d3",
}
PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261009-longer-window-probe.md"
EXTRA = (PROTOCOL, "scripts/run-nr-k3-longer-window-probe.py", "scripts/tests/test_nr_longer_window_probe.py")
MATRIX = (("static-13-long", 13, 1./256, 16, False, "spatial-13"),
          ("perturbed-13-long", 13, 1./256, 16, True, "temporal-medium"))
SECONDS, OUTPUT_CAP, HEADROOM = 1800., 96*1024**2, 8*1024**2
C_RESERVE, E_RESERVE = R["C_RESERVE"], R["E_RESERVE"]


def storage_guard(directory, *, additional=0):
    require(shutil.disk_usage("C:/").free >= C_RESERVE and shutil.disk_usage(ROOT).free-additional >= E_RESERVE,
            "C/E storage reserve reached")
    used = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) if directory.exists() else 0
    require(used+additional+HEADROOM <= OUTPUT_CAP, "96MiB longer-window output cap reached")


def guard(directory, deadline, *, additional=0):
    require(time.perf_counter() < deadline, "1800s absolute longer-window deadline reached")
    storage_guard(directory, additional=additional)


def sources(report):
    for path, digest in RETAINED.items():
        require(sha(path) == digest, "retained identity changed: "+path.name)
    parent, first, replay = (json.loads(p.read_text(encoding="utf-8")) for p in (PARENT, BALANCE, BALANCE_REPLAY))
    require(D["same"]({k: v for k, v in first.items() if k != "seconds"},
                      {k: v for k, v in replay.items() if k != "seconds"}), "exact determinant replay required")
    checked = 0
    for path, data in ((PARENT, parent), (BALANCE, first), (BALANCE_REPLAY, replay)):
        require(data["completed"] is True and data["errors"] == [] and data["source_before"] == data["source_after"]
                and all(data.get(k) is False for k in FLAGS), "closed unadmitted parent required")
        checked += D["verify_artifacts"](path, data)
    require(first["instantaneous_balance_passed"] is True and parent["metric_hessian_screen_passed"] is True
            and parent["legacy_refinement_screen_passed"] is False
            and first["parent_sha256"] == RETAINED[PARENT], "unchanged prior decisions required")
    before = dict(first["source_after"])
    for name, digest in before.items():
        require(sha(bounded(ROOT, name)) == digest, "inherited source drift: "+name)
    for name in EXTRA:
        before[name] = sha(bounded(ROOT, name))
    tests = R["green_report"](bounded(ROOT, report.resolve().relative_to(ROOT).as_posix()),
                              classname_suffix="scripts.tests.test_nr_longer_window_probe")
    tests["path"] = report.resolve().relative_to(ROOT).as_posix()
    return before, dict(runner_tests=tests, regression=R["green_report"](REGRESSION, expected_count=1749),
                        retained_artifacts_checked=checked), parent


def determinant_max(values):
    q = np.asarray(values)
    require(q.ndim == 4 and q.shape[0] == 58 and q.dtype.kind in "fiu" and np.all(np.isfinite(q)),
            "finite canonical cube for determinant observation required")
    h = np.zeros((*q.shape[1:], 3, 3))
    for slot, (i, j) in enumerate(B["A"]["A"]["PAIRS"]):
        h[..., i, j] = h[..., j, i] = q[slot]
    return float(np.max(abs(np.linalg.det(h)-1.)))


class ObservedCube(NonlinearSBPCube):
    """Observation only: step() is exactly the inherited production method."""

    def __init__(self, grid, resource_check):
        super().__init__(grid)
        self.resource_check = resource_check
        self.begin_step(-1)

    def begin_step(self, index):
        self.step_index, self.observed_stages = index, []
        self.rejected_state = self.rejected_rhs = None
        self.rejection_location = None
        self.in_rhs = False

    def capture(self, value, location, rhs=None):
        if self.rejected_state is None:
            self.rejected_state = np.array(value, copy=True)
            self.rejected_rhs = None if rhs is None else np.array(rhs, copy=True)
            self.rejection_location = location

    def field(self, value):
        try:
            return super().field(value)
        except Exception:
            self.capture(value, "rhs-field-validation" if self.in_rhs else "endpoint-field-validation")
            raise

    def state(self, value):
        try:
            return super().state(value)
        except Exception:
            self.capture(value, "rhs-state-validation" if self.in_rhs else "endpoint-state-validation")
            raise

    def rhs(self, values, data, dt):
        observation = dict(stage=len(self.observed_stages)+1, rhs_completed=False, stage_contract_passed=False)
        self.observed_stages.append(observation)
        answer = None
        self.in_rhs = True
        try:
            self.resource_check()
            answer, report = super().rhs(values, data, dt)
            observation.update(rhs_completed=True, report=dict(stage=observation["stage"], **report))
            require(R["OLD"]["valid_stage"](report) and report["min_lapse"] < 2.
                    and report["det_h_max_error"] <= 1.e-10, "unchanged stage contract violated")
            observation["stage_contract_passed"] = True
            self.resource_check()
        except Exception as error:
            self.capture(values, "stage-rhs-or-gate", answer)
            observation["failure"] = f"{type(error).__name__}: {error}"
            raise
        finally:
            self.in_rhs = False
        return answer, report


def save_array(directory, name, value, deadline=None):
    if deadline is None:
        storage_guard(directory, additional=value.nbytes+1024)  # finalization only
    else:
        guard(directory, deadline, additional=value.nbytes+1024)
    R["save_array"](directory, name, value)
    if deadline is not None:
        guard(directory, deadline)


def save_point(directory, driver, q, reference, row, index, old, deadline):
    point = dict(point=index, time=index*row["dt"], completed=False)
    row["trajectory"].append(point)
    require(determinant_max(q) <= 1.e-10, "candidate endpoint exceeds unchanged determinant cap")
    filename = f"{row['label']}-point-{index:04d}.npy"
    save_array(directory, filename, q, deadline)
    point["array"] = filename
    row["last_persisted_point"] = index
    measured = D["measurements"](driver, q, reference)
    guard(directory, deadline)
    point.update(**measured, determinant_max=determinant_max(q))
    if index < len(old["trajectory"]):
        expected = old["trajectory"][index]
        require(expected["point"] == index and expected["time"] == point["time"]
                and sha(directory/filename) == sha(bounded(PARENT.parent, expected["array"]))
                and all(D["same"](point[key], expected[key]) for key in measured), "historical trajectory prefix mismatch")
        point["exact_parent_prefix"] = True
    point["completed"] = True
    return point


def run_case(driver, initial, reference, row, old, directory, deadline):
    original, q = initial.tobytes(), initial.copy()
    row.update(trajectory=[], attempted_steps=[], step_records=[], last_completed_step=-1,
               operator_identity=driver.identity,
               parameters=dict(gauge=vars(driver.gauge), config=vars(driver.config), profile=driver.profile.identity()))
    try:
        require(D["same"](row["operator_identity"], old["operator_identity"])
                and D["same"](row["parameters"], old["parameters"]), "parent numerical method changed")
        row["phase"] = "initial-state"
        save_point(directory, driver, q, reference, row, 0, old, deadline)
        targets = driver.boundary_targets(reference)

        def boundary(_half_index):
            guard(directory, deadline)
            return targets

        for index in range(row["steps"]):
            driver.begin_step(index)
            attempt = dict(step=index, accepted=False, stages=driver.observed_stages)
            row["attempted_steps"].append(attempt)
            row.update(phase="step", attempted_step=index)
            guard(directory, deadline)
            candidate, stages = driver.step(q, index, row["dt"], boundary)
            require(R["valid_stages"](stages) and D["same"](stages, [s["report"] for s in driver.observed_stages]),
                    "complete unchanged observed RK stage sequence required")
            if index < len(old["step_records"]):
                require(D["same"](dict(step=index, stages=stages), old["step_records"][index]), "parent RK prefix mismatch")
                attempt["exact_parent_prefix"] = True
            row["phase"] = "candidate-endpoint"
            if determinant_max(candidate) > 1.e-10:
                driver.capture(candidate, "candidate-endpoint-determinant")
                raise ValueError("candidate endpoint exceeds unchanged determinant cap")
            point = save_point(directory, driver, candidate, reference, row, index+1, old, deadline)
            q = candidate
            row["step_records"].append(dict(step=index, stages=stages))
            row["last_completed_step"] = index
            attempt["accepted"] = True
            print(json.dumps(dict(case=row["label"], completed_step=index+1, steps=row["steps"],
                endpoint_det_error=point["determinant_max"], max_stage_det_error=max(s["det_h_max_error"] for s in stages),
                new_H=point["measurements"]["whole"]["H_metric_hessian"])), flush=True)
        row.update(completed=True, phase="completed")
    except Exception as error:
        row.update(completed=False, failure=f"{type(error).__name__}: {error}")
        rejected = getattr(driver, "rejected_state", None)
        if rejected is not None:
            row["rejection"] = dict(location=driver.rejection_location, accepted=False, restart_permitted=False)
            for key, value in (("state", rejected), ("rhs", driver.rejected_rhs)):
                if value is None:
                    continue
                try:
                    filename = row["label"]+f"-rejected-{key}.npy"
                    save_array(directory, filename, value)
                    row["rejection"][key+"_array"] = filename
                    if key == "state":
                        row["rejection"]["determinant_max"] = determinant_max(value)
                except Exception as persistence:
                    row["rejection"][key+"_persistence_error"] = f"{type(persistence).__name__}: {persistence}"
        raise
    finally:
        row["input_unchanged"] = initial.tobytes() == original
        if not row["input_unchanged"]:
            row["completed"] = False
        persisted = [p for p in row["trajectory"] if p.get("completed")]
        if persisted:
            row["last_accepted_array"] = persisted[-1]["array"]
    require(row["input_unchanged"], "initial state mutated")


def decision(cases):
    require(len(cases) == len(MATRIX), "complete two-case probe required")
    for case, spec in zip(cases, MATRIX, strict=True):
        require((case["label"], case["n"], case["dt"], case["steps"], case["perturbed"], case["parent_label"]) == spec
                and type(case["n"]) is int and type(case["steps"]) is int and case["perturbed"] is spec[4]
                and case["end_time"] == 1./16 and type(case["last_completed_step"]) is int
                and case["last_completed_step"] == 15
                and case["completed"] is True and case["phase"] == "completed" and case["input_unchanged"] is True
                and "failure" not in case and "rejection" not in case, "completed frozen case required")
        require([s["step"] for s in case["step_records"]] == list(range(16))
                and all(type(s["step"]) is int for s in case["step_records"])
                and all(R["valid_stages"](s["stages"]) for s in case["step_records"]), "all 64 valid stages required per case")
        require(len(case["attempted_steps"]) == 16 and all(s["accepted"] is True
                and type(s["step"]) is int and s["step"] == i and len(s["stages"]) == 4
                and all(v["rhs_completed"] is True and v["stage_contract_passed"] is True
                        and type(v["stage"]) is int and v["stage"] == j+1 and "failure" not in v
                        and D["same"](v["report"], case["step_records"][i]["stages"][j])
                        for j, v in enumerate(s["stages"]))
                for i, s in enumerate(case["attempted_steps"])),
                "every attempted step must be accepted")
        require(len(case["trajectory"]) == 17 and all(p["completed"] is True and type(p["point"]) is int
                and p["point"] == i and R["numeric"](p["time"]) and p["time"] == i/256
                and R["numeric"](p["determinant_max"]) and p["determinant_max"] >= 0.
                and p["determinant_max"] <= 1.e-10 for i, p in enumerate(case["trajectory"])), "all 17 valid endpoints required")
        require(all(p.get("exact_parent_prefix", False) is (i <= 8) for i, p in enumerate(case["trajectory"]))
                and all(s.get("exact_parent_prefix", False) is (i < 8) for i, s in enumerate(case["attempted_steps"])),
                "complete exact parent prefix required")
    return dict(probe_passed=True, accepted_steps=32, stage_records=128, exact_prefix_states=18,
                exact_prefix_steps=16, time=1./16, convergence_validated=False, nonlinear_stability_validated=False)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--test-report", type=Path, required=True)
    args = parser.parse_args()
    directory = args.output_directory.resolve()
    require(directory.parent == EVIDENCE.resolve() and not directory.exists(), "fresh direct evidence directory required")
    started = time.perf_counter()
    deadline = started+SECONDS
    guard(directory, deadline)
    before, tests, parent = sources(args.test_report)
    guard(directory, deadline)
    directory.mkdir()
    result = dict(schema="nr-nonlinear-longer-window-probe-v1", completed=False, probe_passed=False, errors=[], cases=[],
        source_before=before, source_after={}, tests=tests, parent_sha256=RETAINED[PARENT],
        protocol_sha256=before[PROTOCOL], closure_completed=False, full_evolution_replay=False,
        convergence_validated=False, nonlinear_stability_validated=False, observer_changes_rhs=False,
        resource_caps=dict(seconds=SECONDS, output_bytes=OUTPUT_CAP, c_reserve=C_RESERVE, e_reserve=E_RESERVE),
        python=sys.version, numpy=np.__version__, platform=platform.platform(), **{k: False for k in FLAGS})
    try:
        for name, digest in before.items():
            source = bounded(ROOT, name)
            guard(directory, deadline, additional=source.stat().st_size)
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
            require(sha(target) == digest, "source snapshot mismatch")
            guard(directory, deadline)
        for label, n, dt, steps, perturbed, parent_label in MATRIX:
            row = dict(label=label, n=n, dt=dt, steps=steps, perturbed=perturbed, parent_label=parent_label,
                       end_time=dt*steps, completed=False, phase="initialization")
            result["cases"].append(row)
            guard(directory, deadline)
            old = next(c for c in parent["cases"] if c["label"] == parent_label)
            grid = Grid3D((n,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
            driver = ObservedCube(grid, lambda: guard(directory, deadline))
            reference = np.array(R["analytic_slots"](n, 4, R["SchwarzschildDomain"]()), dtype=np.float64)
            initial = reference.copy()
            if perturbed:
                initial[11:] += 1.e-4*R["OLD"]["disturbance"](grid)[11:]
            run_case(driver, initial, reference, row, old, directory, deadline)
        result["decision"] = decision(result["cases"])
        result.update(completed=True, probe_passed=True)
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        if result["cases"]:
            result["cases"][-1].update(completed=False, failure=f"{type(error).__name__}: {error}")
    for name in before:
        try:
            result["source_after"][name] = sha(bounded(ROOT, name))
        except Exception as error:
            result["source_after"][name] = None
            result["errors"].append(f"source recheck {name}: {error}")
    if before != result["source_after"]:
        result["errors"].append("source identity changed")
    try:
        for path, digest in {**RETAINED, args.test_report.resolve(): tests["runner_tests"]["sha256"]}.items():
            require(sha(path) == digest, "retained receipt/report identity changed")
        for path in (PARENT, BALANCE, BALANCE_REPLAY):
            D["verify_artifacts"](path, json.loads(path.read_text(encoding="utf-8")))
        guard(directory, deadline)
    except Exception as error:
        result["errors"].append(str(error))
    result["artifact_hashes"] = {}
    for path in sorted(directory.rglob("*")):
        if path.is_file():
            try:
                result["artifact_hashes"][path.relative_to(directory).as_posix()] = sha(path)
            except Exception as error:
                result["errors"].append(f"artifact recheck {path.name}: {error}")
    result["completed"] &= not result["errors"]
    result["probe_passed"] &= result["completed"]
    result["seconds"] = time.perf_counter()-started
    result = R["OLD"]["receipt_payload"](result)
    if result.get("nonfinite_record_paths"):
        result.update(completed=False, probe_passed=False)
    R["write_json"](directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "probe_passed", "errors", "seconds")}), flush=True)
    return 0 if result["completed"] and result["probe_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
