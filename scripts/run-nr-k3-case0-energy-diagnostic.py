"""One owned, bounded diagnosis of saved case 0; no matrix campaign or repair."""

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
for directory_path in (ROOT, ROOT / "scripts"):
    if str(directory_path) not in sys.path:
        sys.path.insert(0, str(directory_path))
import nr_owned_control as G  # noqa: E402

METHOD = "nr-case0-energy-diagnostic-v1"
PARENT = G.EVIDENCE / "nr-k3-constraint-energy-controls-v1-20261012"
GUARD_SHA = "58d535413f7aca0c088c085994bb7eaf507dd41a1dd6b1df1f2a471d41e5bba1"
PINNED = {
    "qualification-gate.json": "786b3b86ae9d4fd9035ae05e0bc6058b03147c27e2c9dfbad336a85db673b370",
    "worker-result.json": "bbe9016ed01a0d359f662c50219e4dfa498d5ef9fced378245bf0e1b3f4a2651",
    "observations.json": "4bab8f10b4aba5c0af54998af514f484f550cb1a57b9409c71a311af49ebf1a0",
    "tests.xml": "cc7e8b51b8ee3ff4ea82e8e2738727e2239610734e4cd04ce267f6c1a6859291",
    "tests.log": "9cdf6f609c9589343d68b48901513ed1c2b580659d416b21f17f401ff09e25c2",
    "owned-worker.log": "6feb27c66e2bc9ba181b1cde0348023fa2ae16714ee9aac868332bfdbf195a37",
}
EXTRA = (
    "scripts/nr_case0_energy_diagnostic.py",
    "scripts/run-nr-k3-case0-energy-diagnostic.py",
    "science/numerical_relativity/EXPERIMENT-20261013-case0-energy-diagnostic.md",
)
FALSE_FLAGS = (
    "fixed_projector_energy_validated",
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


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def inventory(root, budget):
    return G.inventory(root, "__exclude_no_file__", budget)


def source_table(budget):
    for name, digest in PINNED.items():
        G.require(
            G.sha(G.contained(PARENT, name)) == digest, "pinned failure drift: " + name
        )
    terminal = G.read_terminal(PARENT / "qualification-gate.json")
    G.require(
        terminal["passed"] is terminal["completed"] is False,
        "original failure required",
    )
    G.require(
        terminal["run_id"] == "4be28d75-f12e-41bd-a65f-c7ee23459ea6",
        "original run identity",
    )
    worker = read_json(PARENT / "worker-result.json")
    old = worker["source_before"]
    G.require(
        len(old) == 507 and old == worker["source_after"],
        "507 unchanged source ancestors",
    )
    G.require(not set(EXTRA).intersection(old), "diagnostic sources must be new")
    for name, digest in old.items():
        budget.guard()
        G.require(
            G.sha(G.contained(ROOT, name)) == digest, "current source drift: " + name
        )
        G.require(
            G.sha(G.contained(PARENT / "source-snapshot", name)) == digest,
            "old snapshot drift: " + name,
        )
    G.require(
        G.sha(ROOT / "scripts/nr_owned_control.py") == GUARD_SHA,
        "frozen supervisor drift",
    )
    return dict(old, **{name: G.sha(G.contained(ROOT, name)) for name in EXTRA})


def save_snapshot(budget, table):
    size = sum(G.contained(ROOT, name).stat().st_size for name in table)
    G.require(size <= 8 * 1024**2, "source snapshot cap")
    for name, digest in table.items():
        path = G.contained(ROOT, name)
        raw = path.read_bytes()
        G.require(G.sha(path) == digest, "snapshot input drift")
        budget.save("source-snapshot/" + name, raw)
        G.require(
            G.sha(G.contained(budget.directory / "source-snapshot", name)) == digest,
            "snapshot copy drift",
        )
    return size


def worker(directory):
    token = G.read_terminal(directory / "qualification-gate.json.prepared.json")
    G.require(
        token["run_id"] == os.environ.get("NR_OWNED_CONTROL_RUN_ID")
        and token["passed"] is False,
        "owned supervisor required",
    )
    G.require(
        directory.parent == G.EVIDENCE and directory.is_dir(),
        "prepared contained evidence directory",
    )
    G.require(
        all(
            os.environ.get(key) == "1"
            for key in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS")
        ),
        "single-thread arithmetic required",
    )
    budget, started = G.Budget(directory), time.monotonic()
    result = dict(
        schema=METHOD,
        completed=False,
        passed=False,
        diagnostic_completed=False,
        original_candidate_passed=False,
        errors=[],
        phase="intake",
        stages=[],
        case_indices=[0],
        integration_steps=0,
        native_calls=0,
        retries=0,
        original_threshold=2e-12,
        source_before={},
        source_after={},
        parent_gate_sha256=PINNED["qualification-gate.json"],
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
    table, old_inventory = {}, {}
    budget.record("attempt.json", result)

    def stage(name, **fields):
        budget.guard()
        result["phase"] = name
        row = dict(stage=name, seconds=time.monotonic() - started, **fields)
        budget.record(f"stage-{len(result['stages']):02d}-{name}.json", row)
        result["stages"].append(row)
        print(json.dumps(row), flush=True)

    try:
        table = source_table(budget)
        result["source_before"] = table
        old_inventory = inventory(PARENT, budget)
        G.require(len(old_inventory) == 532, "original batch file count changed")
        budget.record("parent-artifacts-before.json", old_inventory)
        result["snapshot_bytes"] = save_snapshot(budget, table)
        stage("intake-verified", sources=len(table), parent_files=len(old_inventory))

        # No scientific library is imported until the owned process is established
        # and the complete frozen candidate source closure is verified.
        import numpy as np
        import nr_case0_energy_diagnostic as D
        from science.numerical_relativity import constraint_energy_controls as C
        from science.numerical_relativity import constraint_projector_energy as E

        result["environment"] = dict(
            python=sys.version, numpy=np.__version__, threads=1
        )
        arrays = {}
        for name, shape in C.SHAPES.items():
            path = G.contained(PARENT, f"case-0-{name}.npy")
            arrays[name] = np.load(path, allow_pickle=False)
            G.require(
                arrays[name].shape == shape
                and arrays[name].dtype == np.float64
                and np.isfinite(arrays[name]).all(),
                "finite saved case0 input",
            )
            budget.save("inputs/" + path.name, path.read_bytes())
        observations = read_json(PARENT / "observations.json")
        G.require(
            [row["index"] for row in observations["cases"]] == [0], "only saved case0"
        )
        G.require(
            all(observations[key] is False for key in C.FALSE_FLAGS), "old scope flags"
        )
        G.require(
            C.TOLERANCE == D.TOLERANCE == result["original_threshold"],
            "original tolerance unchanged",
        )
        q = np.zeros(58)
        q[[0, 3, 5]] = 1
        G.require(
            np.array_equal(arrays["cell"], q)
            and np.array_equal(arrays["normal"], [1.0, 0.0, 0.0]),
            "flat x-direction diagnostic only",
        )
        G.require(
            np.array_equal(arrays["main"], arrays["main_intrinsic"]),
            "case0 zero-shift identity",
        )
        G.require(
            not np.any(arrays["main"][:11]) and not np.any(arrays["main"][:, :11]),
            "zero first11 ODE rows/columns",
        )
        reproduced = C.metrics(arrays, 0)
        G.require(
            reproduced
            == {
                key: value
                for key, value in observations["cases"][0].items()
                if key != "index"
            },
            "exact old metric reproduction failed",
        )
        budget.record("original-metrics-reproduced.json", reproduced)
        stage("original-metrics-reproduced")

        controls = D.synthetic_controls()
        G.require(
            len(controls) == 6 and all(row["passed"] for row in controls),
            "six diagnostic self-controls",
        )
        budget.record("synthetic-controls.json", controls)
        result["synthetic_controls"] = 6
        stage("synthetic-controls", passed=6)
        k_float = arrays["main"][11:, 11:]
        original_roots = arrays["roots"]
        saved = arrays["full_projectors"][:, 11:, 11:]
        candidate = {}
        for precision in (50, 70):
            candidate[precision] = E.polynomial_projectors(
                k_float, np.eye(47), original_roots, precision=precision
            )
            if precision == 50:
                G.require(
                    np.array_equal(candidate[50], saved),
                    "exact saved projector reproduction failed",
                )
            stage("frozen-candidate-" + str(precision))

        def save_npy(name, value):
            stream = io.BytesIO()
            np.save(stream, value, allow_pickle=False)
            budget.save(name, stream.getvalue())

        variants, decimal_results, annihilators = {}, {}, {}
        with localcontext() as ctx:
            ctx.prec = 70
            k, roots = D.exact(k_float), D.exact(original_roots)
            positive = list(roots[7:])
            exact_squared = [
                Decimal(1) / 20,
                Decimal(1) / 10,
                Decimal(1),
                Decimal(2),
                Decimal(3),
                Decimal(4),
            ]
            analytic_positive = [s.sqrt() for s in exact_squared]
            analytic_roots = D.symmetric_roots(analytic_positive)
            budget.record(
                "node-input-comparison.json",
                dict(
                    saved_decimal_roots=D.decimal_strings(roots),
                    analytic_decimal_roots=D.decimal_strings(analytic_roots),
                    saved_squared=D.decimal_strings(
                        np.array([a * a for a in positive])
                    ),
                    analytical_squared=[str(s) for s in exact_squared],
                    squared_difference=[
                        str(a * a - s)
                        for a, s in zip(positive, exact_squared, strict=True)
                    ],
                    matrix_modified=False,
                    fitted=False,
                ),
            )
            with localcontext() as first_context:
                first_context.prec = 50
                first_decimal = D.paired(k, positive, style="expanded")
            G.require(
                np.array_equal(np.asarray(first_decimal, dtype=float), candidate[50]),
                "independent Decimal50 reproduction",
            )
            for name, style, values, squared in (
                ("expanded70-saved", "expanded", roots, None),
                ("factored70-saved", "factored", roots, None),
                ("lagrange70-saved", "lagrange", roots, None),
                (
                    "factored70-analytic-nodes",
                    "factored",
                    analytic_roots,
                    exact_squared,
                ),
            ):
                stage(name + "-start")
                projections = (
                    D.lagrange(k, values)
                    if style == "lagrange"
                    else D.paired(k, list(values[7:]), style=style, squared=squared)
                )
                converted = np.asarray(projections, dtype=float)
                G.require(np.isfinite(converted).all(), "finite projector diagnostic")
                if name == "expanded70-saved":
                    G.require(
                        np.array_equal(converted, candidate[70]),
                        "independent Decimal70 reproduction",
                    )
                decimal_results[name] = projections

                def pulse(i):
                    budget.guard()
                    if i % 4 == 0:
                        print(
                            json.dumps(dict(stage=name, projector=i, total=13)),
                            flush=True,
                        )

                high = D.metrics(k, projections, values, pulse=pulse)
                m, explanation = D.residual_identity(
                    k,
                    projections,
                    values,
                    kind="lagrange" if style == "lagrange" else "paired",
                    squared=squared,
                )
                annihilators[name] = m
                embedded = np.zeros((13, 58, 58))
                embedded[:, 11:, 11:] = converted
                float_values = np.asarray(values, dtype=float)
                low = C.projector_metrics(
                    arrays["main"], C.STATE_ODE, embedded, float_values
                )
                cast_delta = D.exact(converted) - projections
                cast_action = max(
                    D.infnorm(k @ delta - a * delta)
                    for a, delta in zip(values, cast_delta, strict=True)
                )
                row = dict(
                    variant=name,
                    matrix_modified=False,
                    nodes_modified=squared is not None,
                    before_cast=high,
                    after_cast_binary64=low,
                    cast_projector_relative=str(
                        D.stack_difference(D.exact(converted), projections)
                    ),
                    cast_action_residual_change_infinity_norm=str(cast_action),
                    residual_identity=explanation,
                    physical_gate=False,
                    original_candidate_passed=False,
                )
                variants[name] = row
                budget.record(name + ".json", row)
                budget.record(
                    name + "-decimal-projectors.json",
                    dict(
                        precision=70,
                        shape=[13, 47, 47],
                        values=D.decimal_strings(projections),
                    ),
                )
                budget.record(
                    name + "-annihilator.json",
                    dict(shape=[47, 47], values=D.decimal_strings(m)),
                )
                save_npy(name + "-projectors.npy", converted)
                stage(name + "-complete", metrics=high["values"])

            expanded = decimal_results["expanded70-saved"]
            comparison = dict(
                candidate50_to70_binary64_exact=np.array_equal(
                    candidate[50], candidate[70]
                ),
                candidate50_to70_decimal_relative=str(
                    D.stack_difference(first_decimal, expanded)
                ),
                expanded_to_factored_decimal_relative=str(
                    D.stack_difference(expanded, decimal_results["factored70-saved"])
                ),
                expanded_to_lagrange_decimal_relative=str(
                    D.stack_difference(expanded, decimal_results["lagrange70-saved"])
                ),
                saved_to_analytic_nodes_decimal_relative=str(
                    D.stack_difference(
                        decimal_results["factored70-saved"],
                        decimal_results["factored70-analytic-nodes"],
                    )
                ),
                saved_node_annihilator_inf=str(
                    D.infnorm(annihilators["factored70-saved"])
                ),
                analytic_node_annihilator_inf=str(
                    D.infnorm(annihilators["factored70-analytic-nodes"])
                ),
                node_encoding_annihilator_difference_inf=str(
                    D.infnorm(
                        annihilators["factored70-saved"]
                        - annihilators["factored70-analytic-nodes"]
                    )
                ),
                eigenvalue_fitting=False,
                matrix_rationalization=False,
                interpretation="Finite-precision saved-matrix/node compatibility diagnostic; not an independently derived exact principal matrix or scientific acceptance.",
            )
            budget.record("arithmetic-comparison.json", comparison)
        result["comparison"] = comparison
        result["variants"] = {
            name: dict(
                before_cast=row["before_cast"]["values"],
                after_cast=row["after_cast_binary64"],
            )
            for name, row in variants.items()
        }
        stage("diagnostic-comparisons-complete", variants=4)

        G.require(source_table(budget) == table, "source identity changed")
        for name, digest in table.items():
            budget.guard()
            G.require(
                G.sha(G.contained(directory / "source-snapshot", name)) == digest,
                "new snapshot drift",
            )
        after = inventory(PARENT, budget)
        budget.record("parent-artifacts-after.json", after)
        G.require(after == old_inventory, "old failure evidence changed")
        result.update(
            source_after=table,
            old_artifacts_unchanged=True,
            original_metrics_exact=True,
            original_projectors_exact=True,
            diagnostic_completed=True,
            completed=True,
            passed=True,
        )
        stage("complete", old_files_unchanged=len(after))
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(passed=False, completed=False, diagnostic_completed=False)
    result["seconds"] = time.monotonic() - started
    budget.record("worker-result.json", result)
    print(
        json.dumps(
            {
                key: result[key]
                for key in (
                    "passed",
                    "diagnostic_completed",
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
    result = read_json(directory / "worker-result.json")
    G.require(
        result["schema"] == METHOD
        and result["passed"]
        is result["completed"]
        is result["diagnostic_completed"]
        is True
        and not result["errors"],
        "complete diagnostic required",
    )
    G.require(
        result["case_indices"] == [0]
        and result["native_calls"]
        == result["integration_steps"]
        == result["retries"]
        == 0,
        "saved case0-only scope",
    )
    G.require(
        result["original_threshold"] == 2e-12
        and result["synthetic_controls"] == 6
        and len(result["variants"]) == 4,
        "registered diagnostic comparisons",
    )
    G.require(
        all(result[key] is False for key in FALSE_FLAGS)
        and result["original_candidate_passed"] is False,
        "no scientific admission",
    )
    G.require(
        result["source_before"] == result["source_after"]
        and len(result["source_after"]) == 510,
        "510 frozen sources required",
    )
    for name, digest in result["source_after"].items():
        budget.guard()
        G.require(
            G.sha(G.contained(ROOT, name))
            == G.sha(G.contained(directory / "source-snapshot", name))
            == digest,
            "final source drift",
        )
    before = read_json(directory / "parent-artifacts-before.json")
    G.require(
        before
        == read_json(directory / "parent-artifacts-after.json")
        == inventory(PARENT, budget),
        "final old evidence drift",
    )
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", required=True, type=Path)
    parser.add_argument("--guard-worker", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    directory = Path(os.path.abspath(args.output_directory))
    if args.guard_worker:
        return worker(directory)
    G.require(
        G.sha(ROOT / "scripts/nr_owned_control.py") == GUARD_SHA,
        "frozen supervisor required",
    )
    command = [
        sys.executable,
        "-B",
        str(Path(__file__).resolve()),
        "--guard-worker",
        "--output-directory",
        str(directory),
    ]
    result = G.supervise(command, directory, finalizer=finalizer)
    print(
        json.dumps({key: result[key] for key in ("completed", "passed", "errors")}),
        flush=True,
    )
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
