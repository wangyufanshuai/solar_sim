"""Single bounded case-0 exact-source audit and v2 shadow controls."""

from __future__ import annotations

import argparse
from decimal import Decimal, localcontext
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

METHOD = "nr-case0-exact-v2-controls-v1"
PARENT = G.EVIDENCE / "nr-k3-case0-energy-diagnostic-v1-20261013"
FAILED = G.EVIDENCE / "nr-k3-constraint-energy-controls-v1-20261012"
PARENT_SHA = "4407d9c2fa7d6ddfd2c627b524c5cf2d31611e3e64778c34038ca8ed4049584f"
FAILED_SHA = "786b3b86ae9d4fd9035ae05e0bc6058b03147c27e2c9dfbad336a85db673b370"
GUARD_SHA = "58d535413f7aca0c088c085994bb7eaf507dd41a1dd6b1df1f2a471d41e5bba1"
EXTRA = (
    "scripts/nr_case0_exact_coefficients.py",
    "scripts/run-nr-k3-case0-exact-v2.py",
    "science/numerical_relativity/constraint_projector_energy_v2.py",
    "science/numerical_relativity/DERIVATION-20261013-case0-exact.md",
    "science/numerical_relativity/EXPERIMENT-20261013-case0-exact-v2.md",
)
FALSE_FLAGS = (
    "fixed_projector_energy_validated",
    "original_candidate_passed",
    "physical_gate",
    "live_admission",
    "scientificPayloadWriteback",
    "historical_results_regraded",
    "full_scientific_matrix_executed",
    "new_scientific_evolution",
    "uniform_strong_hyperbolicity_validated",
    "common_symmetrizer_validated",
    "physical_boundary_validated",
    "nonlinear_stability_validated",
    "constraint_convergence_validated",
    "off_definition_fo_closure_validated",
)


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def inventory(path, budget):
    return G.inventory(path, "__exclude_no_file__", budget)


def sources(budget):
    G.require(
        G.sha(PARENT / "qualification-gate.json") == PARENT_SHA,
        "pinned diagnostic changed",
    )
    G.require(
        G.sha(FAILED / "qualification-gate.json") == FAILED_SHA,
        "pinned failure changed",
    )
    parent = G.read_terminal(PARENT / "qualification-gate.json")
    failed = G.read_terminal(FAILED / "qualification-gate.json")
    G.require(
        parent["passed"] is parent["diagnostic_completed"] is True
        and not parent["errors"],
        "qualified diagnostic required",
    )
    G.require(
        failed["passed"] is False and parent["original_candidate_passed"] is False,
        "original failure retained",
    )
    base = parent["source_before"]
    G.require(
        len(base) == 510
        and base == parent["source_after"]
        and not set(EXTRA).intersection(base),
        "510 immutable ancestors plus new sources",
    )
    for name, digest in base.items():
        budget.guard()
        G.require(
            G.sha(G.contained(ROOT, name))
            == G.sha(G.contained(PARENT / "source-snapshot", name))
            == digest,
            "source drift: " + name,
        )
    G.require(
        G.sha(ROOT / "scripts/nr_owned_control.py") == GUARD_SHA, "frozen supervisor"
    )
    return dict(base, **{name: G.sha(G.contained(ROOT, name)) for name in EXTRA})


def save_snapshot(budget, table):
    total = sum(G.contained(ROOT, name).stat().st_size for name in table)
    G.require(total <= 8 * 1024**2, "source snapshot cap")
    for name, digest in table.items():
        path = G.contained(ROOT, name)
        raw = path.read_bytes()
        G.require(G.sha(path) == digest, "snapshot input drift")
        budget.save("source-snapshot/" + name, raw)
        G.require(
            G.sha(G.contained(budget.directory / "source-snapshot", name)) == digest,
            "snapshot output drift",
        )
    return total


def worker(directory):
    token = G.read_terminal(directory / "qualification-gate.json.prepared.json")
    G.require(
        token["run_id"] == os.environ.get("NR_OWNED_CONTROL_RUN_ID")
        and token["passed"] is False,
        "owned process required",
    )
    G.require(
        directory.parent == G.EVIDENCE and directory.is_dir(),
        "prepared direct evidence child",
    )
    G.require(
        all(
            os.environ.get(key) == "1"
            for key in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS")
        ),
        "single-thread controls",
    )
    budget, started = G.Budget(directory), time.monotonic()
    result = dict(
        schema=METHOD,
        completed=False,
        passed=False,
        errors=[],
        phase="intake",
        stages=[],
        case_indices=[0],
        source_before={},
        source_after={},
        integration_steps=0,
        native_calls=0,
        retries=0,
        original_threshold=2e-12,
        rank_thresholds=[1e-9, 1e-10, 1e-11],
        case0_v2_validated=False,
        nominal_case0_gates_passed=False,
        case0_rounding_robustness=False,
        exact_coefficients_checked=False,
        parent_gate_sha256=PARENT_SHA,
        original_failure_sha256=FAILED_SHA,
        resource_caps=dict(
            seconds=600,
            output_bytes=G.CAP,
            headroom=G.HEADROOM,
            source_snapshot_bytes=8 * 1024**2,
            c_reserve=G.C_RESERVE,
            e_reserve=G.E_RESERVE,
        ),
        **{key: False for key in FALSE_FLAGS},
    )
    budget.record("attempt.json", result)
    table, ancestry = {}, {}

    def stage(name, **fields):
        budget.guard()
        result["phase"] = name
        row = dict(stage=name, seconds=time.monotonic() - started, **fields)
        budget.record(f"stage-{len(result['stages']):02d}-{name}.json", row)
        result["stages"].append(row)
        print(json.dumps(row), flush=True)

    try:
        table = sources(budget)
        result["source_before"] = table
        for path, count in ((PARENT, 567), (FAILED, 532)):
            ancestry[path.name] = inventory(path, budget)
            G.require(len(ancestry[path.name]) == count, "ancestry file count changed")
        parent_gate = G.read_terminal(PARENT / "qualification-gate.json")
        G.require(
            {
                name: digest
                for name, digest in ancestry[PARENT.name].items()
                if name != "qualification-gate.json"
            }
            == parent_gate["artifact_hashes"],
            "parent inventory changed",
        )
        G.require(
            ancestry[FAILED.name] == read(PARENT / "parent-artifacts-after.json"),
            "original failure inventory changed",
        )
        budget.record("ancestry-before.json", ancestry)
        result["snapshot_bytes"] = save_snapshot(budget, table)
        stage("intake-verified", sources=len(table), old_files=1099)

        # All exact arithmetic and scientific imports stay inside the owned job.
        import numpy as np
        import nr_case0_exact_coefficients as Q
        from science.numerical_relativity import constraint_projector_energy_v2 as V
        from science.numerical_relativity import constraint_energy_controls as C

        result["environment"] = dict(
            python=sys.version, numpy=np.__version__, threads=1
        )
        G.require(
            C.TOLERANCE == V.TOLERANCE == 2e-12
            and list(C.P.RANK_TOLERANCES) == result["rank_thresholds"],
            "unchanged physics gates",
        )
        arrays = {}
        for name, shape in C.SHAPES.items():
            path = G.contained(FAILED, f"case-0-{name}.npy")
            a = np.load(path, allow_pickle=False)
            G.require(
                a.shape == shape and a.dtype == np.float64 and np.isfinite(a).all(),
                "finite complete saved case0",
            )
            arrays[name] = a
            budget.save("inputs/" + path.name, path.read_bytes())
        q = np.zeros(58)
        q[[0, 3, 5]] = 1
        G.require(
            np.array_equal(q, arrays["cell"])
            and np.array_equal(arrays["normal"], [1.0, 0.0, 0.0]),
            "case0 flat x direction only",
        )
        old_report = C.metrics(arrays, 0)
        observation = read(FAILED / "observations.json")["cases"][0]
        G.require(
            old_report
            == {key: value for key, value in observation.items() if key != "index"},
            "original metric reproduction",
        )
        budget.record("original-metrics.json", old_report)

        def npy(name, a):
            buffer = io.BytesIO()
            np.save(buffer, a, allow_pickle=False)
            budget.save(name, buffer.getvalue())

        stage("exact-coefficients-start")
        exact = Q.matrix(guard=budget.guard)
        geometric = Q.matrix(geometric=True, guard=budget.guard)
        budget.record("principal-rational-simplified.json", Q.encode(exact))
        budget.record("principal-rational-geometric.json", Q.encode(geometric))
        G.require(
            np.array_equal(exact, geometric), "two rational curvature routes disagree"
        )
        G.require(
            not np.any(exact[:11]) and not np.any(exact[:, :11]),
            "exact ODE rows/columns",
        )
        comparison, saved_rational = Q.compare(arrays["main"], exact)
        budget.record("coefficient-comparison.json", comparison)
        G.require(
            comparison["relative"] <= C.TOLERANCE,
            "saved coefficients disagree with exact source",
        )
        m_exact = Q.annihilator(exact[11:, 11:], guard=budget.guard)
        m_saved = Q.annihilator(saved_rational[11:, 11:], guard=budget.guard)
        budget.record("annihilator-rational-source.json", Q.encode(m_exact))
        budget.record("annihilator-saved-binary64-exact.json", Q.encode(m_saved))
        G.require(
            not np.any(m_exact),
            "independent exact principal violates prescribed spectrum",
        )
        with localcontext() as ctx:
            ctx.prec = 70
            convert = np.vectorize(
                lambda v: Decimal(v.numerator) / Decimal(v.denominator), otypes=[object]
            )
            previous = np.array(
                read(PARENT / "factored70-analytic-nodes-annihilator.json")["values"],
                dtype=object,
            )
            previous = np.vectorize(Decimal, otypes=[object])(previous)
            residual = max(
                sum(abs(v) for v in row) for row in convert(m_saved) - previous
            )
            G.require(
                residual <= Decimal("1e-50"),
                "exact saved polynomial disagrees with old Decimal diagnostic",
            )
        audit = dict(
            curvature_routes_equal=True,
            coefficient_relative=comparison["relative"],
            entries_compared=comparison["entries_compared"],
            nonzero_exact_differences=comparison["nonzero_exact_differences"],
            unequal_to_correctly_rounded_entries=comparison[
                "unequal_to_correctly_rounded_entries"
            ],
            max_ulps_from_nearest_nonzero=comparison["max_ulps_from_nearest_nonzero"],
            max_exact_zero_entry_error=comparison["max_exact_zero_entry_error"],
            exact_source_annihilator_zero=True,
            saved_annihilator_infinity_norm=str(Q.infnorm(m_saved)),
            prior_decimal_annihilator_difference=str(residual),
            saved_matrix_replaced=False,
        )
        budget.record("exact-coefficient-audit.json", audit)
        result.update(exact_coefficients_checked=True, coefficient_audit=audit)
        stage(
            "exact-coefficients-complete",
            relative=comparison["relative"],
            exact_zero_annihilator=True,
        )

        stage("candidate-controls-start")
        control_rows = []
        roots = np.arange(-6.0, 7.0)
        for dimension, ode_count in ((43, 11), (47, 0)):
            p = np.diag(np.r_[np.zeros(ode_count), np.ones(dimension - ode_count)])
            labels = np.arange(dimension - ode_count) % 13
            base = np.diag(np.r_[np.zeros(ode_count), roots[labels]])
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
                for precision in (50, 70):
                    budget.guard()
                    actual = V.polynomial_projectors(
                        matrix, p, roots, precision=precision
                    )
                    error = max(
                        C.S.relative(x, y) for x, y in zip(actual, known, strict=True)
                    )
                    row = dict(
                        dimension=dimension,
                        nonnormal=nonnormal,
                        precision=precision,
                        relative=error,
                        passed=error <= C.TOLERANCE,
                    )
                    control_rows.append(row)
                    G.require(row["passed"], "known projector control failed")
        budget.record("known-projector-controls.json", control_rows)
        result["known_projector_controls"] = len(control_rows)
        valid = dict(
            matrix=np.eye(47), pde=np.eye(47), roots=roots.copy(), precision=70
        )
        invalid = []
        bad_matrix = np.eye(47)
        bad_matrix[0, 0] = np.nan
        bad_p = np.eye(47)
        bad_p[0, 0] = 0.5
        bad_roots = roots.copy()
        bad_roots[7] = 0
        for label, change in (
            ("nonfinite", dict(matrix=bad_matrix)),
            ("shape", dict(pde=np.eye(46))),
            ("nonprojector", dict(pde=bad_p)),
            ("duplicate-roots", dict(roots=bad_roots)),
            ("precision", dict(precision=51)),
            ("dimension", dict(matrix=np.eye(42), pde=np.eye(42))),
        ):
            try:
                V.polynomial_projectors(**dict(valid, **change))
            except ValueError as error:
                invalid.append(dict(label=label, rejected=True, reason=str(error)))
            else:
                raise ValueError("invalid input was accepted: " + label)
        budget.record("invalid-input-controls.json", invalid)
        result["invalid_input_controls"] = len(invalid)
        stage(
            "candidate-controls-complete",
            known=len(control_rows),
            rejected=len(invalid),
        )

        def candidate(precision=70):
            values = {name: value.copy() for name, value in arrays.items()}
            values["projectors"] = V.polynomial_projectors(
                values["intrinsic"],
                np.eye(43) - values["ode"],
                values["roots"],
                precision=precision,
            )
            values["full_projectors"] = np.zeros((13, 58, 58))
            values["full_projectors"][:, 11:, 11:] = V.polynomial_projectors(
                values["main_intrinsic"][11:, 11:],
                np.eye(47),
                values["roots"],
                precision=precision,
            )
            values["energy"] = C.E.energy(values["ode"], values["projectors"])
            values["energy_eigenvalues"] = np.linalg.eigvalsh(values["energy"])
            return values

        stage("candidate-case0-start")
        values = candidate()
        for name, value in values.items():
            npy(f"v2-case-0-{name}.npy", value)
        report = C.metrics(values, 0)
        budget.record("v2-case0-metrics.json", report)
        C.require_gates(report)
        prior = np.load(PARENT / "lagrange70-saved-projectors.npy", allow_pickle=False)
        G.require(
            np.array_equal(values["full_projectors"][:, 11:, 11:], prior),
            "v2 differs from prior direct diagnostic",
        )
        result["nominal_case0_gates_passed"] = True
        result["candidate_metrics"] = report
        stage(
            "candidate-case0-gates-passed",
            action=report["full_state"]["action_relative"],
            state_map=report["projector_state_map_relative"],
        )
        replay = candidate()
        G.require(
            all(np.array_equal(value, replay[name]) for name, value in values.items()),
            "case0 exact candidate replay failed",
        )
        G.require(C.metrics(replay, 0) == report, "case0 metric replay failed")
        second = candidate(50)
        precision = {
            name: max(
                C.S.relative(x, y)
                for x, y in zip(values[name], second[name], strict=True)
            )
            for name in ("projectors", "full_projectors")
        }
        budget.record(
            "case0-replay-and-precision.json",
            dict(arrays_exact=14, metrics_exact=True, precision_relative=precision),
        )
        G.require(
            all(value <= C.TOLERANCE for value in precision.values()),
            "v2 50/70 precision disagreement",
        )
        result["case0_exact_replay"] = True
        stage("candidate-replay-complete")

        stage("one-ulp-sensitivity-start")
        raw = arrays["main"][11:, 11:]
        step = np.where(raw != 0, abs(np.spacing(raw)), 0.0)
        sensitivity = []
        for sign in (-1, 1):
            budget.guard()
            changed = raw + sign * step
            e = V.polynomial_projectors(changed, np.eye(47), arrays["roots"])
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
            row = dict(
                sign=sign,
                metrics=metrics,
                violations=violations,
                passed=not violations,
                physical_scenario=False,
            )
            sensitivity.append(row)
            npy(f"one-ulp-{sign}-matrix.npy", changed)
            npy(f"one-ulp-{sign}-projectors.npy", e)
            budget.record(f"one-ulp-{sign}-metrics.json", row)
            stage(
                "one-ulp-minus" if sign < 0 else "one-ulp-plus",
                passed=row["passed"],
                violations=violations,
            )
        result["sensitivity"] = sensitivity
        budget.record(
            "one-ulp-sensitivity.json", dict(rows=sensitivity, threshold=C.TOLERANCE)
        )
        result["case0_rounding_robustness"] = all(row["passed"] for row in sensitivity)
        if not result["case0_rounding_robustness"]:
            result["errors"].append(
                "case0 one-ULP sensitivity gate failed; no qualification or automatic retry"
            )

        stage("final-integrity")
        G.require(sources(budget) == table, "source table drift")
        for name, digest in table.items():
            budget.guard()
            G.require(
                G.sha(G.contained(directory / "source-snapshot", name)) == digest,
                "snapshot drift",
            )
        after = {path.name: inventory(path, budget) for path in (PARENT, FAILED)}
        budget.record("ancestry-after.json", after)
        G.require(after == ancestry, "historical evidence changed")
        result.update(
            source_after=table,
            old_artifacts_unchanged=True,
            case0_v2_validated=not result["errors"],
            completed=not result["errors"],
            passed=not result["errors"],
        )
        stage(
            "complete" if result["passed"] else "failed-gate", passed=result["passed"]
        )
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(completed=False, passed=False, case0_v2_validated=False)
    result["seconds"] = time.monotonic() - started
    budget.record("worker-result.json", result)
    print(
        json.dumps(
            {
                key: result[key]
                for key in (
                    "passed",
                    "case0_v2_validated",
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
    result = read(directory / "worker-result.json")
    G.require(
        result["schema"] == METHOD
        and result["passed"]
        is result["completed"]
        is result["case0_v2_validated"]
        is True
        and not result["errors"],
        "complete bounded candidate required",
    )
    G.require(
        all(result[key] is False for key in FALSE_FLAGS), "no scientific admission"
    )
    G.require(
        result["case_indices"] == [0]
        and result["native_calls"]
        == result["integration_steps"]
        == result["retries"]
        == 0,
        "case0-only scope",
    )
    G.require(
        result["known_projector_controls"] == 8
        and result["invalid_input_controls"] == 6
        and result["case0_exact_replay"] is result["case0_rounding_robustness"] is True,
        "all registered controls required",
    )
    G.require(
        result["source_before"] == result["source_after"]
        and len(result["source_before"]) == 515,
        "515 frozen sources required",
    )
    for name, digest in result["source_after"].items():
        budget.guard()
        G.require(
            G.sha(G.contained(ROOT, name))
            == G.sha(G.contained(directory / "source-snapshot", name))
            == digest,
            "final source drift",
        )
    before = read(directory / "ancestry-before.json")
    G.require(
        before
        == read(directory / "ancestry-after.json")
        == {path.name: inventory(path, budget) for path in (PARENT, FAILED)},
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
