"""Bounded nonlinear SBP volume campaign; no boundary or evolution admission."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import platform
import shutil
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity import fo_ccz4_sbp_volume as V  # noqa: E402
from science.numerical_relativity.ccz4_reference import GaugeConfig  # noqa: E402
from science.numerical_relativity.fo_ccz4_checkpoint import state_slots  # noqa: E402
from science.numerical_relativity.fo_ccz4_frozen_symbol import frozen_fo_ccz4_principal_matrix_3d  # noqa: E402
from science.numerical_relativity.fo_ccz4_gauge_profile import FOCCZ4GaugeProfile  # noqa: E402
from science.numerical_relativity.fo_ccz4_principal_symbol import _rhs_components  # noqa: E402
from science.numerical_relativity.fo_ccz4_rhs import (  # noqa: E402
    FOCCZ4Config, FOCCZ4State3D, _fo_ccz4_volume_rhs_3d,
    advance_fo_ccz4_rk4_3d, fo_ccz4_rhs_3d,
)
from science.numerical_relativity.fo_ccz4_sbp_frozen import source_matrix  # noqa: E402
from science.numerical_relativity.fo_ccz4_schwarzschild import (  # noqa: E402
    SchwarzschildDomain, analytic_ricci_and_kretschmann, analytic_slots, initial_state,
)
from science.numerical_relativity.nr3d import BSSNState3D, Grid3D  # noqa: E402

EVIDENCE = ROOT / "tmp/nr-shadow-evidence"
PARENT = EVIDENCE / "nr-k3-sbp-cube-v1-20261008/receipt.json"
PARENT_SHA = "395e3068455ad9939e476d424b401794e82bb61aea50ebf4d589816dbdc7b886"
ORIGINAL_PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261008-sbp-volume.md"
ORIGINAL_PROTOCOL_SHA = "7dbfb75490a40d8ff6579afe94be4c9c2919f60c93ae481e2d33d8c622586bd6"
PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261008-sbp-volume-v2.md"
FAILED = EVIDENCE / "nr-k3-sbp-volume-v1-20261008/receipt.json"
FAILED_SHA = "f0c13f0e90ec3cfca14fd769fd1c771bb03d8eea2d66550a9ff1041b61576a93"
TRANSITIONS = {
    "science/numerical_relativity/fo_ccz4_rhs.py": "9f46de1be40409b4ee5412684df3ebb77cc96f2fc72ba9db43c42da9a883fdc3",
    "science/numerical_relativity/nr3d.py": "07a88b18da845c5c77d048d1de8694b6b54719de1b4179ca360221511a819451",
}
EXTRA = (
    ORIGINAL_PROTOCOL, PROTOCOL, "science/numerical_relativity/fo_ccz4_sbp_volume.py",
    "science/numerical_relativity/test_fo_ccz4_sbp_volume.py",
    "scripts/run-nr-k3-sbp-volume.py", "scripts/tests/test_nr_sbp_volume.py",
)
NATIVE = Path("C:/Users/86137/NRShadowEvidence/nr-k3-schwarzschild-domain-v1-20261007/native-build/Release/nr-k2-fo-ccz4-shadow.exe")
NATIVE_SHA = "fc7ffb4eb3b40fbe8547c7178eb3f274f5ccbc6f6fa5d5f1decd1e2f1f761cbc"
GAUGE = GaugeConfig(shift_coefficient=1., shift_damping=0., theta_coupling=2.)
PROFILE = FOCCZ4GaugeProfile()
CONFIG = FOCCZ4Config(tau_inverse=1.)
FLOOR, ARITHMETIC_LIMIT = 2.e-12, 2.e-11
OUTPUT_CAP, C_RESERVE, E_RESERVE = 96*1024**2, 3*1024**3, 4*1024**3+32*1024**2


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(path):
    with Path(path).open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def source_path(name):
    path = (ROOT / name).resolve()
    require(path.is_relative_to(ROOT) and path.is_file(), "bounded source file required: "+name)
    return path


def source_identity():
    require(sha(PARENT) == PARENT_SHA, "parent receipt changed")
    require(sha(FAILED) == FAILED_SHA and sha(ROOT/ORIGINAL_PROTOCOL) == ORIGINAL_PROTOCOL_SHA,
            "retained failed attempt or original protocol changed")
    failed = json.loads(FAILED.read_text(encoding="utf-8"))
    require(not failed["completed"] and not failed["volume_gate_passed"] and not failed["curved"],
            "failed attempt must remain failed before curved execution")
    for name, digest in failed["artifact_hashes"].items():
        target = (FAILED.parent/name).resolve()
        require(target.is_relative_to(FAILED.parent.resolve()) and sha(target) == digest,
                "retained failed artifact changed: "+name)
    parent = json.loads(PARENT.read_text(encoding="utf-8"))
    require(parent["completed"] and parent["cube_gate_passed"] and not parent["errors"], "completed parent gate required")
    require(all(parent[k] is False for k in V.FLAGS), "parent admission flags changed")
    transitions = {}
    for name, old in parent["source_after"].items():
        require(sha(PARENT.parent/"source-snapshot"/name) == old, "parent snapshot changed: "+name)
        current = sha(source_path(name))
        if name in TRANSITIONS:
            require(old == TRANSITIONS[name] and current != old, "explicit changed-source transition required")
            transitions[name] = {"old_sha256": old, "new_sha256": current}
        else:
            require(current == old, "unauthorized inherited source drift: "+name)
    require(set(transitions) == set(TRANSITIONS), "complete transition set required")
    require(sha(NATIVE) == NATIVE_SHA, "native rollback binary changed")
    names = sorted(set(parent["source_after"]) | set(EXTRA))
    return {name: sha(source_path(name)) for name in names}, transitions


def load_old_rhs():
    name = "science.numerical_relativity._sbp_volume_archived_rhs"
    path = PARENT.parent/"source-snapshot/science/numerical_relativity/fo_ccz4_rhs.py"
    require(sha(path) == TRANSITIONS["science/numerical_relativity/fo_ccz4_rhs.py"], "archived RHS changed")
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def packed_rhs(rhs):
    return np.array(_rhs_components(rhs), dtype=np.float64)


def zero_derivative(values, _state, _axis):
    return np.zeros_like(values)


def dense_sbp_matrix(points, spacing):
    """Independent direct-row arithmetic; no production SBP apply/matrix call."""
    require(type(points) is int and points >= 9 and math.isfinite(spacing) and spacing > 0., "valid dense SBP grid required")
    # Independently transcribed rational rows, not imported from SBP42.
    rows = (
        (-24/17, 59/34, -4/17, -3/34), (-1/2, 0., 1/2),
        (4/43, -59/86, 0., 59/86, -4/43),
        (3/98, 0., -59/98, 0., 32/49, -4/49),
    )
    matrix = np.zeros((points, points))
    for i, row in enumerate(rows):
        matrix[i, :len(row)] = row
        matrix[-1-i, -len(row):] = -np.asarray(row)[::-1]
    for i in range(4, points-4):
        matrix[i, i-2:i+3] = np.array((1., -8., 0., 8., -1.))/12.
    return matrix/spacing


def dense_derivative(grid):
    matrices = tuple(dense_sbp_matrix(n, dx) for n, dx in zip(grid.shape, grid.spacing, strict=True))

    def derivative(values, state, axis):
        require(state.grid == grid and type(axis) is int and axis in (0, 1, 2), "dense grid/axis mismatch")
        moved = np.moveaxis(values, axis, 0)
        result = (matrices[axis] @ moved.reshape((grid.shape[axis], -1))).reshape(moved.shape)
        return np.moveaxis(result, 0, axis)

    return derivative


def grid(points, lower=1., upper=3.):
    return Grid3D((points,)*3, (lower,)*3, (upper,)*3, boundary=V.BOUNDARY, spatial_order=4)


def smooth_direction(mesh):
    """Fixed independent58-slot, nonparallel three-dimensional direction."""
    x, y, z = mesh.coordinates
    result = []
    for slot in range(58):
        phase = .17*slot
        result.append((np.sin(x+2*y+3*z+phase)
                       + .5*np.cos(2*x-y+z-.3*phase)
                       + .25*np.sin(x-3*y+2*z+.7*phase))/1.75)
    return np.asarray(result)


def schwarzschild(points):
    mesh = grid(points)
    return V.state_from_slots(mesh, analytic_slots(points, 4, SchwarzschildDomain()),
                              metadata={"initial_data": "analytic-Schwarzschild-no-frozen-halo", "mass": 1.})


def rms(array):
    return float(np.sqrt(np.mean(np.asarray(array)**2)))


def norms(operator, values):
    """Values have three leading grid dimensions and optional component tails."""
    q = np.asarray(values)
    require(q.shape[:3] == operator.grid.shape and np.all(np.isfinite(q)), "finite grid-aligned norm input required")
    squared = np.mean(q.reshape((*operator.grid.shape, -1))**2, axis=-1)
    weights = np.einsum("i,j,k->ijk", *(axis.norm_weights for axis in operator.axes))
    whole = float(np.sqrt(np.sum(weights*squared)/np.sum(weights)))
    faces = np.concatenate([np.take(q, side, axis=axis).ravel()
                            for axis in range(3) for side in (0, -1)])
    indices = []
    for lo, dx in zip(operator.grid.lower, operator.grid.spacing, strict=True):
        real = (np.array((1.5, 1.75, 2., 2.25, 2.5))-lo)/dx
        rounded = np.rint(real).astype(int)
        require(np.max(abs(real-rounded)) <= 1.e-12, "core nodes must align without interpolation")
        require(np.all((rounded >= 4) & (rounded < operator.grid.shape[len(indices)]-4)), "core must avoid SBP boundary rows")
        indices.append(rounded)
    core = q[np.ix_(*indices)]
    return {"core_rms": rms(core), "whole_sbp_rms": whole, "six_faces_rms": rms(faces)}


def order_pair(coarse, fine, coarse_h, fine_h):
    require(all(math.isfinite(v) and v >= 0. for v in (coarse, fine)), "finite nonnegative errors required")
    require(coarse_h > fine_h > 0., "strict refinement required")
    if min(coarse, fine) <= FLOOR:
        return {"order": None, "measurable": False, "decreasing": fine < coarse}
    return {"order": math.log(coarse/fine)/math.log(coarse_h/fine_h),
            "measurable": True, "decreasing": fine < coarse}


def assess_curved(rows):
    require([row["points"] for row in rows] == [17, 25, 33], "complete frozen curved matrix required")
    checks = []
    for metric in ("rhs", "ricci_error"):
        for region in ("core_rms", "whole_sbp_rms", "six_faces_rms"):
            for left, right in zip(rows[:-1], rows[1:], strict=True):
                result = order_pair(left[metric][region], right[metric][region], left["spacing"], right["spacing"])
                passed = result["measurable"] and result["decreasing"]
                if region == "core_rms":
                    passed &= result["order"] is not None and result["order"] >= 3.
                checks.append({"metric": metric, "region": region, "points": [left["points"], right["points"]],
                               **result, "passed": bool(passed)})
    return {"checks": checks, "passed": all(row["passed"] for row in checks)}


def legacy_state(boundary, order):
    if boundary == "schwarzschild-dirichlet":
        return initial_state(9, order)
    require(boundary in ("periodic", "sommerfeld-proxy"), "declared legacy boundary required")
    mesh = Grid3D((9,)*3, (0.,)*3, (1.,)*3,
                  boundary="periodic" if boundary == "periodic" else "sommerfeld", spatial_order=order)
    if boundary == "periodic":
        base = BSSNState3D.gauge_wave(mesh, amplitude=.001)
    else:
        base = BSSNState3D.minkowski(mesh)
        x, y, z = mesh.coordinates
        phase = 2.*np.pi*(x+2.*y+3.*z)
        base.lapse[:] = np.exp(.001*np.sin(phase))
        base.chi[:] = np.exp(.0006*np.cos(phase))
        for axis in range(3):
            base.shift[..., axis] = .0001*np.sin(phase+.2*axis)
            base.a[..., axis, axis] = .0002*np.cos(phase-.3*axis)
        base.metadata = {"initial_data": "synthetic-nonperiodic-legacy-rollback-fixture"}
    return FOCCZ4State3D.from_bssn_state(base)


def legacy_equivalence():
    old = load_old_rhs()
    results = []
    for boundary, order, profile, rate in (
        ("periodic", 2, None, 0.), ("periodic", 4, PROFILE, 1.),
        ("sommerfeld-proxy", 2, PROFILE, 1.), ("schwarzschild-dirichlet", 4, PROFILE, 1.),
    ):
        state = legacy_state(boundary, order)
        config = FOCCZ4Config(tau_inverse=rate)
        parameters = dict(gauge=GAUGE, config=config, gauge_profile=profile, boundary_mode=boundary)
        first, second = packed_rhs(old.fo_ccz4_rhs_3d(state, **parameters)), packed_rhs(fo_ccz4_rhs_3d(state, **parameters))
        before = np.array(state_slots(state))
        evolved_old = old.advance_fo_ccz4_rk4_3d(state, 1.e-4, steps=2, **parameters)
        evolved_new = advance_fo_ccz4_rk4_3d(state, 1.e-4, steps=2, **parameters)
        old_values, new_values = np.array(state_slots(evolved_old)), np.array(state_slots(evolved_new))
        row = {"boundary": boundary, "spatial_order": order, "profile": profile is not None, "tau_inverse": rate,
               "rhs_byte_equal": first.tobytes() == second.tobytes(),
               "rk_byte_equal": old_values.tobytes() == new_values.tobytes(),
               "input_unchanged": before.tobytes() == np.array(state_slots(state)).tobytes(),
               "rhs_max_difference": float(np.max(abs(first-second))),
               "rk_max_difference": float(np.max(abs(old_values-new_values)))}
        row["passed"] = row["rhs_byte_equal"] and row["rk_byte_equal"] and row["input_unchanged"]
        results.append(row)
    return results


def curved_case(points):
    state = schwarzschild(points)
    operator = V.SBPVolumeOperator(state.grid)
    q = np.array(state_slots(state))
    rhs = packed_rhs(operator.rhs(state, gauge=GAUGE, config=CONFIG, gauge_profile=PROFILE))
    ricci = operator.geometry(state)[4]
    expected, _ = analytic_ricci_and_kretschmann(state.grid, 1.)
    row = {"points": points, "spacing": state.grid.spacing[0],
           "rhs": norms(operator, np.moveaxis(rhs, 0, -1)),
           "ricci_error": norms(operator, ricci-expected),
           "analytic_ricci_max_abs": float(np.max(abs(expected))),
           "surface_rhs_max_abs": float(max(np.max(abs(np.take(rhs, side, axis=axis+1)))
                                             for axis in range(3) for side in (0, -1))),
           "input_unchanged": q.tobytes() == np.array(state_slots(state)).tobytes()}
    return row, (q, rhs, ricci)


def nonlinear_decomposition():
    initial = schwarzschild(9)
    q = np.array(state_slots(initial)) + .005*smooth_direction(initial.grid)
    state = V.state_from_slots(initial.grid, q)
    q = np.array(state_slots(state))
    operator = V.SBPVolumeOperator(state.grid)
    parameters = dict(gauge=GAUGE, config=CONFIG, gauge_profile=PROFILE)
    actual = packed_rhs(operator.rhs(state, **parameters))
    dense = packed_rhs(_fo_ccz4_volume_rhs_3d(state, first_derivative=dense_derivative(state.grid), **parameters))
    source = packed_rhs(_fo_ccz4_volume_rhs_3d(state, first_derivative=zero_derivative, **parameters))
    gradients = [operator.axes[axis].derivative(q, axis=axis+1) for axis in range(3)]
    points = ((0, 0, 0), (0, 4, 8), (4, 4, 4), (8, 8, 8), (7, 3, 1))
    checks = []
    for point in points:
        predicted = np.zeros(58)
        for axis in range(3):
            matrix = frozen_fo_ccz4_principal_matrix_3d(
                state.base.h[point], state.base.chi[point], state.base.lapse[point],
                state.base.shift[point], np.eye(3)[axis], **parameters,
            )
            predicted += matrix @ gradients[axis][(slice(None), *point)]
        observed = (actual-source)[(slice(None), *point)]
        checks.append({"point": list(point), "max_difference": float(np.max(abs(observed-predicted))),
                       "ode_principal_max_abs": float(np.max(abs(observed[:11]))),
                       "source_max_abs": float(np.max(abs(source[(slice(None), *point)])))})
    dense_error = float(np.max(abs(actual-dense)))
    row = {"dense_max_difference": dense_error, "principal_checks": checks,
           "input_unchanged": q.tobytes() == np.array(state_slots(state)).tobytes(),
           "passed": dense_error <= ARITHMETIC_LIMIT and all(c["max_difference"] <= ARITHMETIC_LIMIT
                          and c["ode_principal_max_abs"] == 0. for c in checks)}
    row["passed"] &= row["input_unchanged"]
    return row, q, actual


def flat_linearization():
    mesh = grid(9, -1., 1.)
    operator = V.SBPVolumeOperator(mesh)
    background = np.zeros((58, *mesh.shape))
    background[[0, 3, 5]] = 1.
    direction = smooth_direction(mesh)
    parameters = dict(gauge=GAUGE, config=CONFIG, gauge_profile=PROFILE)
    predicted = np.einsum("ab,bijk->aijk", source_matrix(1.), direction)
    for axis in range(3):
        matrix = frozen_fo_ccz4_principal_matrix_3d(np.eye(3), 1., 1., np.zeros(3), np.eye(3)[axis], **parameters)
        predicted += np.einsum("ab,bijk->aijk", matrix, operator.axes[axis].derivative(direction, axis=axis+1))
    rows = []
    for amplitude in (1.e-3, 5.e-4, 2.5e-4):
        plus, minus = (V.state_from_slots(mesh, background+sign*amplitude*direction) for sign in (1., -1.))
        quotient = (packed_rhs(operator.rhs(plus, **parameters))-packed_rhs(operator.rhs(minus, **parameters)))/(2.*amplitude)
        rows.append({"amplitude": amplitude, "remainder_rms": rms(quotient-predicted)})
    orders = [order_pair(a["remainder_rms"], b["remainder_rms"], a["amplitude"], b["amplitude"])
              for a, b in zip(rows[:-1], rows[1:], strict=True)]
    return {"rows": rows, "orders": orders,
            "passed": all(o["measurable"] and o["order"] >= 1.8 for o in orders)}


def fresh_output(path):
    directory = path.resolve()
    require(directory.parent == EVIDENCE.resolve() and not directory.exists(), "fresh direct evidence subdirectory required")
    return directory


def guard(directory, started):
    require(time.perf_counter()-started <= 1200., "1200s volume campaign cap reached")
    require(shutil.disk_usage("C:/").free >= C_RESERVE and shutil.disk_usage(ROOT).free >= E_RESERVE,
            "C/E storage reserve reached")
    used = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) if directory.exists() else 0
    require(used <= OUTPUT_CAP-4*1024**2, "96MiB output cap reached")


def save_array(directory, name, values):
    with (directory/name).open("xb") as handle:
        np.save(handle, values, allow_pickle=False)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    directory = fresh_output(args.output_directory)
    started = time.perf_counter()
    guard(directory, started)
    before, transitions = source_identity()
    directory.mkdir()
    result = {"schema": "nr-nonlinear-sbp-volume-campaign-v1", "completed": False, "volume_gate_passed": False,
              "scope": "actual-nonlinear-FO-CCZ4-volume-only;no-IBVP-or-new-evolution",
              "parent_sha256": PARENT_SHA, "native_sha256": NATIVE_SHA,
              "retained_failure_sha256": FAILED_SHA, "original_protocol_sha256": ORIGINAL_PROTOCOL_SHA,
              "source_transition": transitions, "source_before": before, "protocol_sha256": sha(ROOT/PROTOCOL),
              "python": sys.version, "platform": platform.platform(), "numpy": np.__version__,
              "resource_caps": {"seconds": 1200, "output_bytes": OUTPUT_CAP, "c_reserve": C_RESERVE, "e_reserve": E_RESERVE},
              "parameters": {"gauge": vars(GAUGE), "config": vars(CONFIG), "profile": PROFILE.identity()},
              "legacy": [], "curved": [], "errors": [], **{key: False for key in V.FLAGS}}
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source_path(name), target)
            require(sha(target) == digest, "new source snapshot mismatch")
        result["legacy"] = legacy_equivalence()
        print(json.dumps({"case": "legacy", "passed": all(r["passed"] for r in result["legacy"])}), flush=True)
        for points in (17, 25, 33):
            guard(directory, started)
            row, arrays = curved_case(points)
            result["curved"].append(row)
            for label, values in zip(("state", "rhs", "ricci"), arrays, strict=True):
                save_array(directory, f"schwarzschild-n{points}-{label}.npy", values)
            print(json.dumps({"case": "curved", **row}), flush=True)
            del arrays, values
        result["curved_assessment"] = assess_curved(result["curved"])
        guard(directory, started)
        result["nonlinear_decomposition"], q, actual = nonlinear_decomposition()
        save_array(directory, "nonlinear-n9-state.npy", q)
        save_array(directory, "nonlinear-n9-rhs.npy", actual)
        result["flat_linearization"] = flat_linearization()
        result["operator_identity"] = V.SBPVolumeOperator(grid(9)).identity
        guard(directory, started)
        result["completed"] = True
        result["volume_gate_passed"] = (all(row["passed"] for row in result["legacy"])
            and all(row["input_unchanged"] and row["surface_rhs_max_abs"] > FLOOR for row in result["curved"])
            and result["curved_assessment"]["passed"] and result["nonlinear_decomposition"]["passed"]
            and result["flat_linearization"]["passed"])
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["source_after"] = {name: sha(source_path(name)) for name in before}
    if (before != result["source_after"] or sha(PARENT) != PARENT_SHA or sha(NATIVE) != NATIVE_SHA
            or sha(FAILED) != FAILED_SHA):
        result["errors"].append("source/parent/native identity drift")
    result["completed"] &= not result["errors"]
    result["volume_gate_passed"] &= result["completed"]
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    result["seconds"] = time.perf_counter()-started
    encoded = json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False)
    require(len(encoded.encode("utf-8")) <= 4*1024**2, "receipt reserve exceeded")
    with (directory/"receipt.json").open("x", encoding="utf-8", newline="\n") as handle:
        handle.write(encoded+"\n")
    print(json.dumps({k: result[k] for k in ("completed", "volume_gate_passed", "errors", "seconds")}), flush=True)
    return 0 if result["volume_gate_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
