"""One bounded, non-retrying qualification batch; NOT a scientific matrix runner."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from science.numerical_relativity import native_campaign as N  # noqa: E402
from science.numerical_relativity import native_continuation as C  # noqa: E402

SECONDS, CAP, HEADROOM = 600, 64 * 1024**2, 2 * 1024**2
EXPECTED_TESTS = 52


def stop_owned(child):
    """Only the owned pytest tree; never enumerate or stop unrelated Python jobs."""
    if child.poll() is not None:
        return
    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/PID", str(child.pid), "/T", "/F"],
            capture_output=True,
            check=False,
            timeout=10,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
    else:
        child.kill()
    child.wait(timeout=10)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    directory = args.output_directory.resolve()
    N.require(
        directory.parent == N.EVIDENCE and not directory.exists(),
        "fresh direct control evidence directory required",
    )
    budget = N.Budget(directory, seconds=SECONDS, cap=CAP, headroom=HEADROOM)
    before = {name: N.sha(ROOT / name) for name in C.CONTROL_SOURCES}
    directory.mkdir()
    started = time.monotonic()
    xml = directory / "tests.xml"
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
        str(ROOT / "scripts/nr-native-continuation-tests.ini"),
        "--basetemp",
        str(directory / "pytest-temp"),
        "--junitxml",
        str(xml),
        "scripts/tests/test_nr_native_continuation.py",
    ]
    result = dict(
        schema="nr-native-continuation-control-gate-v1",
        completed=False,
        passed=False,
        command=command,
        source_before=before,
        source_after={},
        errors=[],
        returncode=None,
        expected_tests=EXPECTED_TESTS,
        tests=0,
        full_scientific_campaign_executed=False,
        resource_caps=dict(
            seconds=SECONDS,
            output_bytes=CAP,
            headroom=HEADROOM,
            c_reserve=N.C_RESERVE,
            e_reserve=N.E_RESERVE,
        ),
        **C.FLAGS,
    )
    budget.record("attempt.json", result)
    child = None
    try:
        environment = dict(
            os.environ,
            NR_CONTINUATION_TEST_ROOT=str(directory),
            PYTHONDONTWRITEBYTECODE="1",
            PYTEST_DISABLE_PLUGIN_AUTOLOAD="1",
            OPENBLAS_NUM_THREADS="1",
            OMP_NUM_THREADS="1",
            MKL_NUM_THREADS="1",
            TEMP=str(ROOT / "tmp"),
            TMP=str(ROOT / "tmp"),
        )
        with (directory / "pytest.log").open("xb") as log:
            child = subprocess.Popen(
                command,
                cwd=ROOT,
                env=environment,
                stdout=log,
                stderr=subprocess.STDOUT,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
            )
            budget.record("process.json", dict(pid=child.pid, owned=True, retries=0))
            print(
                json.dumps(
                    dict(
                        status="control-tests-running",
                        pid=child.pid,
                        seconds_cap=SECONDS,
                        bytes_cap=CAP,
                    )
                ),
                flush=True,
            )
            while child.poll() is None:
                budget.guard()
                time.sleep(0.5)
            result["returncode"] = child.returncode
        budget.guard()
        N.require(
            child.returncode == 0, "control subprocess failed; retained without retry"
        )
        testcases = list(ET.parse(xml).getroot().iter("testcase"))
        result["tests"] = len(testcases)
        N.require(
            len(testcases) == EXPECTED_TESTS
            and len({t.get("name") for t in testcases}) == EXPECTED_TESTS,
            "exact complete unique continuation controls required",
        )
        N.require(
            {t.get("classname") for t in testcases}
            == {"scripts.tests.test_nr_native_continuation"}
            and not any(
                x.tag in ("failure", "error", "skipped") for t in testcases for x in t
            ),
            "zero-skip green source-bound controls required",
        )
        receipt_path = directory / "control-receipt.json"
        receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
        N.require(
            receipt["source_before"] == receipt["source_after"]
            and receipt["native_unchanged"] is True
            and receipt["parent_unchanged"] is True,
            "control identity drift",
        )
        for name, digest in receipt["source_after"].items():
            N.require(
                N.sha(N.contained(ROOT, name)) == digest,
                "current qualification source drift",
            )
        for key in (
            "real_even_continuation",
            "real_odd_continuation",
            "real_failure_prefix",
        ):
            N.require(
                receipt.get(key) is True, "missing actual continuation control: " + key
            )
        for key in (*C.FLAGS, "full_scientific_campaign_executed"):
            N.require(
                receipt.get(key) is False, "control cannot promote scientific scope"
            )
        result.update(
            completed=True,
            passed=True,
            control_receipt_sha256=N.sha(receipt_path),
            xml_sha256=N.sha(xml),
        )
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        if child is not None and child.poll() is None:
            print(
                json.dumps(
                    dict(status="stopping-owned-control-tree", reason=str(error))
                ),
                flush=True,
            )
            stop_owned(child)
        if child is not None:
            result["returncode"] = child.returncode
    finally:
        result["seconds"] = time.monotonic() - started
        result["source_after"] = {name: N.sha(ROOT / name) for name in before}
        if before != result["source_after"]:
            result["errors"].append("new control source identity changed")
        result["passed"] = bool(result["passed"] and not result["errors"])
        result["artifact_hashes"] = {
            p.relative_to(directory).as_posix(): N.sha(p)
            for p in sorted(directory.rglob("*"))
            if p.is_file()
        }
        budget.record("qualification-gate.json", result, finalizing=True)
    print(
        json.dumps(
            {
                k: result[k]
                for k in (
                    "completed",
                    "passed",
                    "tests",
                    "seconds",
                    "errors",
                    "returncode",
                )
            }
        ),
        flush=True,
    )
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
