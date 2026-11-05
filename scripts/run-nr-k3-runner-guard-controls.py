"""One preregistered 64 MiB / 600 second runner-only fault batch."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

import nr_owned_control as G

ROOT = G.ROOT
PARENT = G.EVIDENCE / "nr-k3-longitudinal-controls-v1-20261012"
PARENT_SHA = "ffb93ab382da9d28019586e0e3b674ca414c1a4b577c261bdf3ee74f3461438a"
TESTS = 44
EXTRA = (
    "science/numerical_relativity/constraint_projector_energy.py",
    "science/numerical_relativity/constraint_energy_controls.py",
    "science/numerical_relativity/EXPERIMENT-20261012-constraint-energy.md",
    "scripts/tests/test_nr_constraint_energy.py",
    "scripts/run-nr-k3-constraint-energy-controls.py",
    "scripts/nr_owned_control.py",
    "scripts/tests/test_nr_owned_control.py",
    "scripts/tests/nr_owned_control_child.py",
    "scripts/run-nr-k3-runner-guard-controls.py",
    "science/numerical_relativity/EXPERIMENT-20261013-runner-guard-controls.md",
)
MATH = {
    EXTRA[0]: "83249c66a10f2484245c406f48abab3ce909a25abbc7d1d604c42b26515fafc8",
    EXTRA[1]: "d134f2f9330b72d90c26315f55835f919d4125b396a54790029bcd816a313eeb",
    EXTRA[3]: "15f542dffe881fc63849deb5e75b3872bc95143922b8da0d38bf550c3496dafb",
}


def sources(budget):
    G.require(
        G.sha(PARENT / "qualification-gate.json") == PARENT_SHA,
        "frozen parent gate drift",
    )
    gate = json.loads((PARENT / "qualification-gate.json").read_text(encoding="utf-8"))
    inherited = gate["source_before"]
    G.require(
        gate["passed"] is gate["completed"] is True and not gate["errors"],
        "parent not qualified",
    )
    G.require(
        len(inherited) == 501
        and inherited == gate["source_after"]
        and not set(inherited).intersection(EXTRA),
        "501 unchanged parent sources required",
    )
    for index, (name, digest) in enumerate(inherited.items()):
        if index % 16 == 0:
            budget.guard()
        G.require(
            G.sha(G.contained(ROOT, name)) == digest,
            "current frozen source drift: " + name,
        )
        G.require(
            G.sha(G.contained(PARENT / "source-snapshot", name)) == digest,
            "frozen snapshot drift: " + name,
        )
    for index, (name, digest) in enumerate(gate["artifact_hashes"].items()):
        if index % 16 == 0:
            budget.guard()
        G.require(
            G.sha(G.contained(PARENT, name)) == digest, "parent artifact drift: " + name
        )
    extra = {name: G.sha(ROOT / name) for name in EXTRA}
    G.require(
        all(extra[name] == digest for name, digest in MATH.items()),
        "unfrozen mathematics changed",
    )
    return dict(inherited, **extra)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    directory = parser.parse_args().output_directory.resolve()
    before = {}

    def prepare(_, budget):
        before.update(sources(budget))
        size = sum((ROOT / name).stat().st_size for name in before)
        G.require(size <= 8 * 1024**2, "original 8 MiB snapshot cap exceeded")
        budget.record(
            "attempt.json",
            dict(
                tests=TESTS,
                source_before=before,
                parent_gate_sha256=PARENT_SHA,
                source_snapshot_bytes=size,
                physical_gate=False,
                live_admission=False,
                scientificPayloadWriteback=False,
                native_calls=0,
                integration_steps=0,
                energy_cases_executed=0,
                automatic_retries=0,
            ),
        )
        for name in before:
            budget.save("source-snapshot/" + name, (ROOT / name).read_bytes())

    def finalizer(_, budget):
        after = sources(budget)
        G.require(after == before, "control source drift")
        for index, (name, digest) in enumerate(before.items()):
            if index % 16 == 0:
                budget.guard()
            G.require(
                G.sha(G.contained(directory / "source-snapshot", name)) == digest,
                "new snapshot drift",
            )
        xml = ET.parse(directory / "runner-tests.xml")
        cases = list(xml.iter("testcase"))
        suites = list(xml.iter("testsuite"))
        G.require(
            len(cases) == TESTS
            and sum(int(s.attrib["tests"]) for s in suites) == TESTS,
            "registered test count mismatch",
        )
        G.require(
            all(
                c.attrib.get("classname") == "scripts.tests.test_nr_owned_control"
                for c in cases
            ),
            "unexpected test scope",
        )
        G.require(
            all(not list(c) for c in cases)
            and all(
                int(s.attrib.get(k, 0)) == 0
                for s in suites
                for k in ("failures", "errors", "skipped")
            ),
            "runner controls did not all pass",
        )
        return dict(
            schema="nr-runner-guard-controls-v1",
            tests=TESTS,
            runner_controls_validated=True,
            source_before=before,
            source_after=after,
            parent_gate_sha256=PARENT_SHA,
            xml_sha256=G.sha(directory / "runner-tests.xml"),
            physical_gate=False,
            live_admission=False,
            scientificPayloadWriteback=False,
            native_calls=0,
            integration_steps=0,
            energy_cases_executed=0,
            fixed_projector_energy_validated=False,
            uniform_strong_hyperbolicity_validated=False,
            common_symmetrizer_validated=False,
            constraint_convergence_validated=False,
        )

    command = [
        sys.executable,
        "-B",
        "-m",
        "pytest",
        "-q",
        "--maxfail=1",
        "--rootdir",
        str(ROOT),
        "--confcutdir",
        str(ROOT / "scripts/tests"),
        "-c",
        str(ROOT / "scripts/nr-curved-constraint-tests.ini"),
        "--basetemp",
        str(directory / "test-temp"),
        "--junitxml",
        str(directory / "runner-tests.xml"),
        "scripts/tests/test_nr_owned_control.py",
    ]
    result = G.supervise(command, directory, prepare=prepare, finalizer=finalizer)
    print(
        json.dumps(
            dict(
                passed=result["passed"],
                completed=result["completed"],
                errors=result["errors"],
                tests=result.get("tests", 0),
                directory=str(directory),
            )
        ),
        flush=True,
    )
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
