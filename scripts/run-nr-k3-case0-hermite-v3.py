"""One authorized64 MiB/600s case0 Hermite-v3 control batch; no evolution."""

from __future__ import annotations

import argparse
from decimal import Decimal, localcontext
import importlib.util
import io
import json
import os
from pathlib import Path
import sys
import time

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
for folder in (ROOT, ROOT / "scripts"):
    if str(folder) not in sys.path:
        sys.path.insert(0, str(folder))
import nr_owned_control as G  # noqa: E402

METHOD = "nr-case0-hermite-v3-controls-v1"
PREVIOUS = G.EVIDENCE / "nr-k3-case0-exact-v2-controls-v1-20261013"
GATE_SHA = "9c54c0b6bbdcc2674209f95ec64726f66ba9d219f536cfd90572608caad37772"
WORKER_SHA = "c66d70a8383e55d1c9624c312b84d93cc65896664382485e8f953fc217087aba"
GUARD_SHA = "58d535413f7aca0c088c085994bb7eaf507dd41a1dd6b1df1f2a471d41e5bba1"
HELPER_SHA = "830e91c6e499c5f0d025609eef07bb904804ef7ef33b404f612359d03ac536a7"
EXTRA = (
    "science/numerical_relativity/constraint_projector_energy_v3.py",
    "scripts/run-nr-k3-case0-hermite-v3.py",
    "science/numerical_relativity/DERIVATION-20261013-case0-hermite-v3.md",
    "science/numerical_relativity/EXPERIMENT-20261013-case0-hermite-v3.md",
    "science/numerical_relativity/RESULTS-20261013-case0-exact-v2.md",
    "science/numerical_relativity/AUDIT-20261013-case0-v3-input-contract.md",
)


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def ancestor_helper():
    path = ROOT / "scripts/run-nr-k3-case0-exact-v2.py"
    G.require(G.sha(path) == HELPER_SHA, "frozen ancestry helper changed")
    spec = importlib.util.spec_from_file_location("nr_v2_ancestry_only", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sources(old, budget):
    G.require(
        G.sha(PREVIOUS / "qualification-gate.json") == GATE_SHA
        and G.sha(PREVIOUS / "worker-result.json") == WORKER_SHA,
        "frozen v2 failure changed",
    )
    gate = G.read_terminal(PREVIOUS / "qualification-gate.json")
    worker = read(PREVIOUS / "worker-result.json")
    G.require(
        gate["passed"] is worker["passed"] is worker["case0_v2_validated"] is False
        and worker["nominal_case0_gates_passed"] is True
        and worker["case0_rounding_robustness"] is False,
        "v2 nominal pass and robustness failure must both be retained",
    )
    base = worker["source_before"]
    G.require(
        len(base) == 515 and base == worker["source_after"] == old.sources(budget),
        "515 unchanged inherited sources required",
    )
    for name, digest in base.items():
        budget.guard()
        G.require(
            G.sha(G.contained(ROOT, name))
            == G.sha(G.contained(PREVIOUS / "source-snapshot", name))
            == digest,
            "v2 source or snapshot drift: " + name,
        )
    G.require(not set(base).intersection(EXTRA), "new sources must be additive")
    return dict(base, **{name: G.sha(G.contained(ROOT, name)) for name in EXTRA})


def ancestors(old, budget):
    result = {}
    for path, count in ((PREVIOUS, 582), (old.PARENT, 567), (old.FAILED, 532)):
        result[path.name] = old.inventory(path, budget)
        G.require(len(result[path.name]) == count, "ancestor file set changed")
    prior = G.read_terminal(old.PARENT / "qualification-gate.json")
    G.require(
        {
            k: v
            for k, v in result[old.PARENT.name].items()
            if k != "qualification-gate.json"
        }
        == prior["artifact_hashes"],
        "qualified diagnostic inventory drift",
    )
    G.require(
        result[old.FAILED.name] == read(old.PARENT / "parent-artifacts-after.json"),
        "original failure inventory drift",
    )
    return result


def scalar_controls(nodes):
    """Scalar product/derivative recurrence, independent of matrix evaluation."""
    with localcontext() as ctx:
        ctx.prec = 70

        def evaluate(index, z):
            a, value, derivative, slope = (
                nodes[index],
                Decimal(1),
                Decimal(0),
                Decimal(0),
            )
            for j, b in enumerate(nodes):
                if j != index:
                    factor = (z - b) / (a - b)
                    derivative, value = (
                        derivative * factor + value / (a - b),
                        value * factor,
                    )
                    slope += 1 / (a - b)
            factor = 1 - 2 * slope * (z - a)
            return (
                factor * value** 2,
                -2 * slope * value** 2 + 2 * factor * value * derivative,
            )

        value_error = derivative_error = partition_error = Decimal(0)
        for i in range(13):
            for j, a in enumerate(nodes):
                value, derivative = evaluate(i, a)
                value_error = max(value_error, abs(value - int(i == j)))
                derivative_error = max(derivative_error, abs(derivative))
        probes = (Decimal(1) / 7, -Decimal(1) / 7, Decimal(1) / 2, -Decimal(1) / 2)
        for z in probes:
            partition_error = max(
                partition_error, abs(sum(evaluate(i, z)[0] for i in range(13)) - 1)
            )
        result = dict(
            value_error=str(value_error),
            derivative_error=str(derivative_error),
            partition_error=str(partition_error),
            node_pairs=169,
            off_node_probes=4,
            arithmetic_tolerance="1e-40",
        )
        G.require(
            max(value_error, derivative_error, partition_error) <= Decimal("1e-40"),
            "scalar Hermite identities failed",
        )
        return result


def worker(directory):
    token = G.read_terminal(directory / "qualification-gate.json.prepared.json")
    G.require(
        token["run_id"] == os.environ.get("NR_OWNED_CONTROL_RUN_ID")
        and token["passed"] is False,
        "owned process required",
    )
    G.require(
        directory.parent == G.EVIDENCE and directory.is_dir(),
        "prepared evidence child required",
    )
    G.require(
        all(
            os.environ.get(k) == "1"
            for k in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS")
        ),
        "single-thread control required",
    )
    budget, started = G.Budget(directory), time.monotonic()
    old = ancestor_helper()
    false_flags = (*old.FALSE_FLAGS, "case0_v2_validated")
    result = dict(
        schema=METHOD,
        passed=False,
        completed=False,
        errors=[],
        stages=[],
        phase="intake",
        source_before={},
        source_after={},
        case_indices=[0],
        integration_steps=0,
        native_calls=0,
        retries=0,
        original_threshold=2e-12,
        rank_thresholds=[1e-9, 1e-10, 1e-11],
        case0_v3_validated=False,
        nominal_case0_gates_passed=False,
        case0_rounding_robustness=False,
        case0_exact_replay=False,
        coefficients_checked=False,
        analytical_nodes_checked=False,
        parent_gate_sha256=GATE_SHA,
        parent_worker_sha256=WORKER_SHA,
        resource_caps=dict(
            seconds=600,
            output_bytes=G.CAP,
            headroom=G.HEADROOM,
            source_snapshot_bytes=8 * 1024**2,
            c_reserve=G.C_RESERVE,
            e_reserve=G.E_RESERVE,
        ),
        **{key: False for key in false_flags},
    )
    budget.record("attempt.json", result)

    def stage(name, **fields):
        budget.guard()
        result["phase"] = name
        row = dict(stage=name, seconds=time.monotonic() - started, **fields)
        budget.record(f"stage-{len(result['stages']):02d}-{name}.json", row)
        result["stages"].append(row)
        print(json.dumps(row), flush=True)

    try:
        table = sources(old, budget)
        result["source_before"] = table
        ancestry = ancestors(old, budget)
        budget.record("ancestry-before.json", ancestry)
        result["snapshot_bytes"] = old.save_snapshot(budget, table)
        stage("intake-verified", sources=len(table), ancestor_files=1681)

        # Numerical imports and ALL numerical execution remain inside the owned job.
        import numpy as np
        import nr_case0_exact_coefficients as Q
        from science.numerical_relativity import constraint_energy_controls as C
        from science.numerical_relativity import constraint_projector_energy_v3 as V

        result["environment"] = dict(
            python=sys.version, numpy=np.__version__, threads=1
        )
        G.require(
            C.TOLERANCE == V.TOLERANCE == 2e-12
            and list(C.P.RANK_TOLERANCES) == result["rank_thresholds"],
            "original thresholds changed",
        )
        arrays = {}
        for name, shape in C.SHAPES.items():
            path = G.contained(old.FAILED, f"case-0-{name}.npy")
            a = np.load(path, allow_pickle=False)
            G.require(
                a.shape == shape and a.dtype == np.float64 and np.isfinite(a).all(),
                "complete finite saved case0 required",
            )
            arrays[name] = a
            budget.save("inputs/" + path.name, path.read_bytes())
        baseline = {name: a.copy() for name, a in arrays.items()}
        q = np.zeros(58)
        q[[0, 3, 5]] = 1
        G.require(
            np.array_equal(q, arrays["cell"])
            and np.array_equal(arrays["normal"], [1.0, 0.0, 0.0]),
            "case0 flat x only",
        )
        G.require(
            np.array_equal(arrays["main"], arrays["main_intrinsic"]),
            "case0 zero shift required",
        )
        report = C.metrics(arrays, 0)
        observation = read(old.FAILED / "observations.json")["cases"][0]
        G.require(
            report == {k: v for k, v in observation.items() if k != "index"},
            "original metrics drift",
        )
        budget.record("original-metrics.json", report)
        previous = read(PREVIOUS / "worker-result.json")
        budget.record(
            "retained-v2-outcome.json",
            dict(
                nominal=previous["candidate_metrics"],
                sensitivity=previous["sensitivity"],
                passed=False,
                rerun=False,
            ),
        )

        def npy(name, a):
            buffer = io.BytesIO()
            np.save(buffer, a, allow_pickle=False)
            budget.save(name, buffer.getvalue())

        stage("coefficient-source-start")
        exact, geometric = (
            Q.matrix(guard=budget.guard),
            Q.matrix(geometric=True, guard=budget.guard),
        )
        G.require(
            np.array_equal(exact, geometric)
            and not np.any(exact[:11])
            and not np.any(exact[:, :11]),
            "exact source geometry/ODE mismatch",
        )
        encoded = Q.encode(exact)
        G.require(
            encoded == read(PREVIOUS / "principal-rational-simplified.json"),
            "exact source changed",
        )
        budget.record("principal-rational-source.json", encoded)
        comparison, _ = Q.compare(arrays["main"], exact)
        budget.record("coefficient-source-comparison.json", comparison)
        G.require(
            comparison == read(PREVIOUS / "coefficient-comparison.json")
            and comparison["relative"] <= C.TOLERANCE,
            "coefficient witnesses changed",
        )
        annihilator = Q.annihilator(exact[11:, 11:], guard=budget.guard)
        budget.record("exact-source-annihilator.json", Q.encode(annihilator))
        G.require(
            not np.any(annihilator) and V.case0_squared() == Q.SQUARED,
            "source spectrum mismatch",
        )
        result["coefficients_checked"] = True
        result["coefficient_scope"] = (
            "independent58/47 only; frozen43 reduction not rederived"
        )
        stage("coefficient-source-complete", relative=comparison["relative"])

        stage("analytical-node-source-start")
        node_rows = []
        for precision in (50, 70):
            with localcontext() as ctx:
                ctx.prec = precision
                roots = V.case0_nodes(precision=precision)
                error = max(
                    abs(a * a - Decimal(s.numerator) / Decimal(s.denominator))
                    for a, s in zip(roots[7:], Q.SQUARED, strict=True)
                )
                limit = Decimal(10) ** (-precision + 4)
                G.require(
                    error <= limit
                    and np.array_equal(
                        np.array([float(a) for a in roots]), arrays["roots"]
                    ),
                    "analytical node origin/rounding mismatch",
                )
                if precision == 70:
                    historical = tuple(
                        Decimal(a)
                        for a in read(old.PARENT / "node-input-comparison.json")[
                            "analytic_decimal_roots"
                        ]
                    )
                    G.require(roots == historical, "analytical70 nodes changed")
                node_rows.append(
                    dict(
                        precision=precision,
                        roots=[str(a) for a in roots],
                        square_error=str(error),
                        arithmetic_tolerance=str(limit),
                        matches_saved_binary64=True,
                    )
                )
        budget.record(
            "analytical-node-source.json",
            dict(
                squared=[str(s) for s in Q.SQUARED],
                rows=node_rows,
                fitted=False,
                saved_matrix_replaced=False,
            ),
        )
        result["analytical_nodes_checked"] = True
        budget.record("scalar-hermite-controls.json", scalar_controls(V.case0_nodes()))
        result["scalar_controls_passed"] = True
        stage("analytical-node-source-complete")

        stage("known-controls-start")
        controls = []
        roots = tuple(Decimal(i) for i in range(-6, 7))
        labels_float = np.arange(-6.0, 7.0)
        for dimension, ode_count in ((43, 11), (47, 0)):
            pde = np.diag(np.r_[np.zeros(ode_count), np.ones(dimension - ode_count)])
            labels = np.arange(dimension - ode_count) % 13
            base = np.diag(np.r_[np.zeros(ode_count), labels_float[labels]])
            for nonnormal in (False, True):
                nilpotent = np.zeros((dimension, dimension))
                if nonnormal:
                    nilpotent[ode_count, ode_count + 1] = 1
                transform, inverse = (
                    np.eye(dimension) + nilpotent,
                    np.eye(dimension) - nilpotent,
                )
                matrix = transform @ base @ inverse
                known = np.stack(
                    [
                        transform
                        @ np.diag(
                            np.r_[np.zeros(ode_count), (labels == j).astype(float)]
                        )
                        @ inverse
                        for j in range(13)
                    ]
                )
                if nonnormal:
                    G.require(
                        not np.array_equal(matrix, base),
                        "nonnormal control must change input",
                    )
                for precision in (50, 70):
                    actual = V.hermite_projectors(
                        matrix, pde, roots, precision=precision, pulse=budget.guard
                    )
                    error = max(
                        C.S.relative(a, b) for a, b in zip(actual, known, strict=True)
                    )
                    row = dict(
                        dimension=dimension,
                        nonnormal=nonnormal,
                        precision=precision,
                        relative=error,
                        passed=error <= C.TOLERANCE,
                    )
                    controls.append(row)
                    G.require(row["passed"], "known Hermite projector mismatch")
        budget.record("known-projector-controls.json", controls)
        result["known_projector_controls"] = len(controls)
        valid = dict(matrix=np.eye(47), pde=np.eye(47), roots=roots, precision=70)
        bad_matrix, bad_p = np.eye(47), np.eye(47)
        bad_matrix[0, 0], bad_p[0, 0] = np.nan, 0.5
        repeated = tuple(Decimal(0) for _ in roots)
        invalid = []
        for label, change in (
            ("nonfinite", dict(matrix=bad_matrix)),
            ("shape", dict(pde=np.eye(46))),
            ("nonprojector", dict(pde=bad_p)),
            ("duplicate-roots", dict(roots=repeated)),
            ("precision", dict(precision=51)),
            ("dimension", dict(matrix=np.eye(42), pde=np.eye(42))),
            ("float-roots", dict(roots=tuple(float(a) for a in roots))),
            ("root-count", dict(roots=roots[:-1])),
        ):
            try:
                V.hermite_projectors(**dict(valid, **change))
            except ValueError as error:
                invalid.append(dict(label=label, rejected=True, reason=str(error)))
            else:
                raise ValueError("invalid input accepted: " + label)
        budget.record("invalid-input-controls.json", invalid)
        result["invalid_input_controls"] = len(invalid)
        stage("known-controls-complete", known=len(controls), invalid=len(invalid))

        def candidate(precision=70):
            values = {name: a.copy() for name, a in arrays.items()}
            roots = V.case0_nodes(precision=precision)
            values["projectors"] = V.hermite_projectors(
                values["intrinsic"],
                np.eye(43) - values["ode"],
                roots,
                precision=precision,
                pulse=budget.guard,
            )
            values["full_projectors"] = np.zeros((13, 58, 58))
            values["full_projectors"][:, 11:, 11:] = V.hermite_projectors(
                values["main_intrinsic"][11:, 11:],
                np.eye(47),
                roots,
                precision=precision,
                pulse=budget.guard,
            )
            values["energy"] = C.E.energy(values["ode"], values["projectors"])
            values["energy_eigenvalues"] = np.linalg.eigvalsh(values["energy"])
            return values

        stage("candidate-case0-start")
        values = candidate()
        for name, value in values.items():
            npy(f"v3-case-0-{name}.npy", value)
        report = C.metrics(values, 0)
        budget.record("v3-case0-metrics.json", report)
        result["candidate_metrics"] = report
        try:
            C.require_gates(report)
        except ValueError as error:
            result["errors"].append("nominal case0: " + str(error))
        else:
            result["nominal_case0_gates_passed"] = True
        stage(
            "candidate-case0-checked",
            passed=result["nominal_case0_gates_passed"],
            action=report["full_state"]["action_relative"],
        )
        replay = candidate()
        G.require(
            all(np.array_equal(a, replay[name]) for name, a in values.items())
            and C.metrics(replay, 0) == report,
            "nominal exact replay mismatch",
        )
        second = candidate(50)
        precision_errors = {
            name: max(
                C.S.relative(a, b)
                for a, b in zip(values[name], second[name], strict=True)
            )
            for name in ("projectors", "full_projectors")
        }
        G.require(
            all(error <= C.TOLERANCE for error in precision_errors.values()),
            "precision50/70 disagreement",
        )
        budget.record(
            "nominal-replay-precision.json",
            dict(
                arrays_exact=14, metrics_exact=True, precision_relative=precision_errors
            ),
        )
        result["case0_exact_replay"] = True
        stage("candidate-replay-complete")

        stage("end-to-end-perturbations-start")
        raw = arrays["main"][11:, 11:]
        step = np.where(raw != 0, abs(np.spacing(raw)), 0.0)
        sensitivity = []
        nominal = values["full_projectors"][:, 11:, 11:]
        for sign in (-1, 1):
            changed = raw + sign * step
            saved = np.load(PREVIOUS / f"one-ulp-{sign}-matrix.npy", allow_pickle=False)
            G.require(
                np.array_equal(changed, saved), "old perturbation pattern changed"
            )
            original_input = changed.copy()
            e = V.hermite_projectors(
                changed, np.eye(47), V.case0_nodes(), pulse=budget.guard
            )
            G.require(
                np.array_equal(changed, original_input),
                "candidate mutated perturbed input",
            )
            metrics = C.projector_metrics(
                changed, np.zeros((47, 47)), e, arrays["roots"]
            )
            violations = [
                key
                for key, value in metrics.items()
                if key.endswith("_relative")
                and (not np.isfinite(value) or value > C.TOLERANCE)
            ]
            ranks = np.array(metrics["ranks"])
            if not (
                ranks.shape == (13, 3)
                and np.all(ranks == ranks[:, :1])
                and np.all(ranks.sum(axis=0) == 47)
            ):
                violations.append("stable_complete_ranks")
            npy(f"one-ulp-{sign}-matrix.npy", changed)
            npy(f"one-ulp-{sign}-projectors.npy", e)
            row = dict(
                sign=sign,
                metrics=metrics,
                violations=violations,
                passed=not violations,
                input_matches_old_pattern=True,
                rebuilt_from_changed_input=True,
                physical_scenario=False,
                output_entries_different_from_nominal=int(
                    np.count_nonzero(e != nominal)
                ),
                max_output_difference_from_nominal=float(np.max(abs(e - nominal))),
            )
            budget.record(f"one-ulp-{sign}-metrics.json", row)
            again = V.hermite_projectors(
                changed, np.eye(47), V.case0_nodes(), pulse=budget.guard
            )
            G.require(
                np.array_equal(e, again)
                and C.projector_metrics(
                    changed, np.zeros((47, 47)), again, arrays["roots"]
                )
                == metrics,
                "perturbation exact replay mismatch",
            )
            row["exact_replay"] = True
            sensitivity.append(row)
            if violations:
                result["errors"].append(f"one-ULP sign{sign}: " + ", ".join(violations))
            stage(
                "one-ulp-minus" if sign < 0 else "one-ulp-plus",
                passed=row["passed"],
                violations=violations,
            )
        budget.record(
            "end-to-end-sensitivity.json",
            dict(
                rows=sensitivity, threshold=C.TOLERANCE, fixed_projectors_reused=False
            ),
        )
        result["sensitivity"] = sensitivity
        result["case0_rounding_robustness"] = all(row["passed"] for row in sensitivity)

        stage("final-integrity")
        G.require(
            all(np.array_equal(a, baseline[name]) for name, a in arrays.items()),
            "original in-memory evidence mutated",
        )
        G.require(sources(old, budget) == table, "source drift")
        for name, digest in table.items():
            budget.guard()
            G.require(
                G.sha(G.contained(directory / "source-snapshot", name)) == digest,
                "snapshot drift",
            )
        after = ancestors(old, budget)
        budget.record("ancestry-after.json", after)
        G.require(after == ancestry, "historical artifact drift")
        result.update(
            source_after=table,
            old_artifacts_unchanged=True,
            original_inputs_unchanged=True,
            case0_v3_validated=not result["errors"],
            passed=not result["errors"],
            completed=not result["errors"],
        )
        stage(
            "complete" if result["passed"] else "failed-gate", passed=result["passed"]
        )
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(passed=False, completed=False, case0_v3_validated=False)
    result["seconds"] = time.monotonic() - started
    budget.record("worker-result.json", result)
    print(
        json.dumps(
            {
                key: result[key]
                for key in (
                    "passed",
                    "case0_v3_validated",
                    "phase",
                    "seconds",
                    "errors",
                )
            }
        ),
        flush=True,
    )
    return 0 if result["passed"] else 1


def finalizer(directory, budget):
    budget.guard()
    old = ancestor_helper()
    result = read(directory / "worker-result.json")
    G.require(
        result["schema"] == METHOD
        and result["passed"]
        is result["completed"]
        is result["case0_v3_validated"]
        is True
        and not result["errors"],
        "all candidate controls required",
    )
    G.require(
        all(result[key] is False for key in (*old.FALSE_FLAGS, "case0_v2_validated")),
        "no scientific or retrospective admission",
    )
    G.require(
        result["case_indices"] == [0]
        and result["native_calls"]
        == result["integration_steps"]
        == result["retries"]
        == 0,
        "bounded case0 only",
    )
    G.require(
        result["known_projector_controls"] == result["invalid_input_controls"] == 8,
        "all registered controls required",
    )
    G.require(
        all(
            result[key] is True
            for key in (
                "coefficients_checked",
                "analytical_nodes_checked",
                "scalar_controls_passed",
                "nominal_case0_gates_passed",
                "case0_rounding_robustness",
                "case0_exact_replay",
                "old_artifacts_unchanged",
                "original_inputs_unchanged",
            )
        ),
        "missing candidate gates",
    )
    G.require(
        [row["sign"] for row in result["sensitivity"]] == [-1, 1]
        and all(
            row["exact_replay"]
            and row["rebuilt_from_changed_input"]
            and row["input_matches_old_pattern"]
            and row["passed"]
            and not row["violations"]
            for row in result["sensitivity"]
        ),
        "original end-to-end perturbations required",
    )
    table = sources(old, budget)
    G.require(
        len(table) == 521
        and table == result["source_before"] == result["source_after"],
        "521 frozen sources required",
    )
    for name, digest in table.items():
        budget.guard()
        G.require(
            G.sha(G.contained(directory / "source-snapshot", name)) == digest,
            "final snapshot drift",
        )
    G.require(
        read(directory / "ancestry-before.json")
        == read(directory / "ancestry-after.json")
        == ancestors(old, budget),
        "final ancestry drift",
    )
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--guard-worker", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    directory = Path(os.path.abspath(args.output_directory))
    if args.guard_worker:
        return worker(directory)
    G.require(
        G.sha(ROOT / "scripts/nr_owned_control.py") == GUARD_SHA,
        "frozen supervisor required",
    )
    result = G.supervise(
        [
            sys.executable,
            "-B",
            str(Path(__file__).resolve()),
            "--guard-worker",
            "--output-directory",
            str(directory),
        ],
        directory,
        finalizer=finalizer,
    )
    print(
        json.dumps({key: result[key] for key in ("passed", "completed", "errors")}),
        flush=True,
    )
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
