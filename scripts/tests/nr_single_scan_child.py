"""Finite owned child for candidate controls; stdlib and runner imports only."""

import os
from pathlib import Path
import subprocess
import sys
import time
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
import nr_owned_control as G  # noqa: E402
import nr_single_scan_control as S  # noqa: E402


def main():
    G.require(
        bool(os.environ.get("NR_OWNED_CONTROL_RUN_ID")), "owned supervisor required"
    )
    mode, directory = sys.argv[1], Path(sys.argv[2])
    G.require(
        mode in {"success", "timeout", "crash", "runtime-refusal"},
        "known control mode required",
    )
    budget = S.SingleScanBudget(directory, G.Limits(15, 1024**2, 128 * 1024))
    descendant = None
    if mode == "timeout":
        descendant = subprocess.Popen(
            [sys.executable, "-B", "-c", "import time; time.sleep(30)"],
            stdin=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
    budget.record(
        "ready.json",
        dict(
            pid=os.getpid(),
            descendant=descendant.pid if descendant else None,
            budget_class=type(budget).__name__,
            scientific_modules_imported=sorted(
                name
                for name in sys.modules
                if name in {"numpy", "scipy", "science"}
                or name.startswith(("numpy.", "scipy.", "science."))
            ),
        ),
    )
    if mode == "timeout":
        time.sleep(30)
        return 3
    if mode == "crash":
        os._exit(7)
    if mode == "runtime-refusal":
        # Only this owned child's dependency is injected; the enclosing
        # supervisors continue enforcing actual host free-space reserves.
        budget.disk_usage = lambda _: SimpleNamespace(free=0)
        try:
            budget.record("forbidden-after-refusal.json", dict(forbidden=True))
        except G.ResourceLimit as error:
            print(str(error), flush=True)
            return 9
        return 10
    budget.record(
        "child-result.json", dict(passed=True, scientificPayloadWriteback=False)
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
