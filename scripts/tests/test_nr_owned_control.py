"""Runner safety only; no scientific package import or numerical experiment."""

import importlib.util
import os
from pathlib import Path
import runpy
import subprocess
import sys
import time
from types import SimpleNamespace

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
import nr_owned_control as G  # noqa: E402

SMALL = G.Limits(seconds=15, cap=2 * 1024**2, headroom=128 * 1024)
SLOT = SMALL.headroom // 2
CHILD = ROOT / "scripts/tests/nr_owned_control_child.py"
ENERGY = ROOT / "scripts/run-nr-k3-constraint-energy-controls.py"


def ample(_):
    return SimpleNamespace(free=100 * 1024**3)


def run(tmp_path, mode="success", **kwargs):
    directory = tmp_path / "owned"
    result = G.supervise(
        [sys.executable, "-B", str(CHILD), mode, str(directory)],
        directory,
        allowed_parent=tmp_path,
        limits=kwargs.pop("limits", SMALL),
        slot_bytes=SLOT,
        **kwargs,
    )
    assert G.recover_terminal(directory) == result
    assert result["supervisor"]["cleanup_verified"]
    assert result["supervisor"]["active_after_cleanup"] in (0, None)
    assert result["scientificPayloadWriteback"] is False
    assert result["physical_gate"] is result["live_admission"] is False
    return result, directory


def ready_fault(directory, action):
    def inject(phase, budget, state):
        if phase == "poll" and (directory / "ready.json").exists():
            action(budget, state)

    return inject


def fail(error):
    raise error


def initial():
    return dict(run_id="fixture", passed=False, completed=False, phase="prepared")


def test_original_limits():
    assert G.Limits() == G.Limits(600, 64 * 1024**2, 2 * 1024**2)
    assert G.C_RESERVE == 3 * 1024**3
    assert G.E_RESERVE == 4 * 1024**3 + 32 * 1024**2


@pytest.mark.parametrize(
    "seconds,cap,headroom",
    [(0, 100, 1), (601, 100, 1), (1, 67108865, 1), (1, 100, 0), (1, 100, 100)],
)
def test_invalid_limits(tmp_path, seconds, cap, headroom):
    with pytest.raises(ValueError):
        G.Budget(tmp_path, G.Limits(seconds, cap, headroom), disk_usage=ample)


@pytest.mark.parametrize("drive", ["C", "E"])
def test_preflight_floor_rejects_before_creation(tmp_path, drive):
    def factory(directory, limits):
        def free(path):
            floor = (
                G.C_RESERVE if str(path).startswith("C:") else G.E_RESERVE + limits.cap
            )
            return SimpleNamespace(
                free=floor - 1
                if str(path).startswith(drive + ":")
                else ample(path).free
            )

        return G.Budget(directory, limits, disk_usage=free)

    with pytest.raises(G.ResourceLimit):
        run(tmp_path, budget_factory=factory)
    assert not (tmp_path / "owned").exists()


@pytest.mark.parametrize("reason", ["deadline", "cap", "C", "E"])
def test_runtime_guards(tmp_path, reason):
    ticks = [0.0]
    budget = G.Budget(tmp_path, SMALL, clock=lambda: ticks[0], disk_usage=ample)
    additional = 0
    if reason == "deadline":
        ticks[0] = SMALL.seconds
    elif reason == "cap":
        additional = SMALL.cap
    else:
        budget.disk_usage = lambda path: SimpleNamespace(
            free=0 if str(path).startswith(reason + ":") else ample(path).free
        )
    with pytest.raises(G.ResourceLimit):
        budget.guard(additional)


@pytest.mark.parametrize(
    "name", ["../escape", "E:/escape", "C:escape", "a/../../escape", "a/x:stream"]
)
def test_containment(tmp_path, name):
    with pytest.raises(ValueError):
        G.contained(tmp_path, name)


def test_reparse_rejected(tmp_path, monkeypatch):
    monkeypatch.setattr(Path, "is_junction", lambda self: self.name == "junction")
    with pytest.raises(ValueError, match="reparse"):
        G.contained(tmp_path, "junction/result.json")


def test_full_terminal_allocation_and_low_space_finish(tmp_path):
    budget = G.Budget(tmp_path, disk_usage=ample)
    terminal = G.ReservedTerminal(budget, initial())
    try:
        before = terminal.path.stat()
        allocated = G.allocation(terminal.stream)
        assert allocated >= 1024**2 and before.st_size == 1024**2
        budget.disk_usage = lambda _: SimpleNamespace(free=0)
        with pytest.raises(G.ResourceLimit):
            budget.record("forbidden.json", {})
        record = dict(initial(), phase="failed", errors=["synthetic reserve reached"])
        terminal.finish(record)
        after = terminal.path.stat()
        assert os.path.samestat(before, after) and after.st_size == before.st_size
        assert G.allocation(terminal.stream) == allocated
        assert G.recover_terminal(tmp_path) == record
        assert not (tmp_path / "forbidden.json").exists()
    finally:
        terminal.close()


@pytest.mark.parametrize("damage", ["json", "checksum", "run_id"])
def test_torn_or_wrong_terminal_falls_back(tmp_path, damage):
    budget = G.Budget(tmp_path, SMALL, disk_usage=ample)
    terminal = G.ReservedTerminal(budget, initial(), slot_bytes=SLOT)
    try:
        if damage == "run_id":
            raw = G.seal(dict(initial(), run_id="wrong", passed=True, completed=True))
        elif damage == "checksum":
            raw = G.seal(dict(initial(), passed=True)).replace(
                b'"passed":true', b'"passed":null'
            )
        else:
            raw = b"{broken"
        terminal._write(terminal.stream, raw.ljust(SLOT, b" "))
        assert G.recover_terminal(tmp_path) == initial()
    finally:
        terminal.close()


def test_oversized_terminal_stays_prepared(tmp_path):
    terminal = G.ReservedTerminal(
        G.Budget(tmp_path, SMALL, disk_usage=ample), initial(), slot_bytes=SLOT
    )
    try:
        with pytest.raises(ValueError, match="exceeds"):
            terminal.finish(dict(initial(), payload="x" * SLOT))
        assert G.recover_terminal(tmp_path) == initial()
    finally:
        terminal.close()


def test_inventory_excludes_only_root_terminal(tmp_path):
    budget = G.Budget(tmp_path, SMALL)
    budget.record("qualification-gate.json", {})
    budget.record("nested/qualification-gate.json", {})
    assert set(G.inventory(tmp_path, "qualification-gate.json", budget)) == {
        "nested/qualification-gate.json"
    }


def test_real_job_success(tmp_path):
    result, directory = run(tmp_path)
    assert result["passed"] is result["completed"] is True
    assert result["supervisor"]["job_assigned"]
    for name, digest in result["artifact_hashes"].items():
        assert G.sha(G.contained(directory, name)) == digest


def test_nonzero_child_rejected(tmp_path):
    result, _ = run(tmp_path, "nonzero")
    assert not result["passed"] and result["supervisor"]["returncode"] == 7
    assert any("worker failed" in error for error in result["errors"])


def test_hung_replay_deadline(tmp_path):
    start = time.monotonic()
    result, directory = run(
        tmp_path, "sleep", limits=G.Limits(2, SMALL.cap, SMALL.headroom)
    )
    assert (directory / "ready.json").exists()
    assert not result["passed"] and any(
        "deadline" in error for error in result["errors"]
    )
    assert result["supervisor"]["active_before_cleanup"] >= 2
    assert time.monotonic() - start < 10


@pytest.mark.parametrize("exception", [KeyboardInterrupt, SystemExit])
def test_interruption_cleans_tree(tmp_path, exception):
    inject = ready_fault(tmp_path / "owned", lambda *_: fail(exception("injected")))
    result, _ = run(tmp_path, "tree", fault=inject)
    assert not result["passed"] and result["supervisor"]["interrupted"]
    assert result["supervisor"]["active_before_cleanup"] >= 3


@pytest.mark.parametrize("drive", ["C", "E"])
def test_low_space_leaves_failure_terminal(tmp_path, drive):
    def lower(budget, _):
        budget.disk_usage = lambda path: SimpleNamespace(
            free=0 if str(path).startswith(drive + ":") else ample(path).free
        )

    result, directory = run(
        tmp_path, "sleep", fault=ready_fault(tmp_path / "owned", lower)
    )
    assert not result["passed"] and any(
        "reserve" in error for error in result["errors"]
    )
    assert (directory / "qualification-gate.json").stat().st_size == SLOT


def test_assignment_failure_never_releases_work(tmp_path, monkeypatch):
    monkeypatch.setattr(
        G.WindowsJob, "assign", lambda *_: fail(OSError("assignment injection"))
    )
    result, directory = run(tmp_path)
    assert not result["passed"] and not result["supervisor"]["job_assigned"]
    assert not (directory / "ready.json").exists()


@pytest.mark.parametrize("mode", ["raise", "invalid", "failed"])
def test_finalizer_failure_never_passes(tmp_path, mode):
    def finish(*_):
        if mode == "raise":
            raise ValueError("verification injection")
        return [] if mode == "invalid" else dict(passed=False)

    result, _ = run(tmp_path, finalizer=finish)
    assert not result["passed"] and result["errors"]


def test_oversized_finalizer_becomes_compact_failure(tmp_path):
    result, _ = run(tmp_path, finalizer=lambda *_: dict(payload="x" * SLOT))
    assert not result["passed"] and any(
        "exceeds" in error for error in result["errors"]
    )
    assert "payload" not in result


def test_outliving_descendant_rejected_and_stopped(tmp_path):
    result, _ = run(tmp_path, "orphan")
    assert not result["passed"] and any(
        "outlived" in error for error in result["errors"]
    )
    assert result["supervisor"]["active_before_cleanup"] >= 1


def test_unrelated_owned_fixture_survives_inner_cleanup(tmp_path):
    other = subprocess.Popen(
        [sys.executable, "-B", "-c", "import time; time.sleep(30)"],
        creationflags=subprocess.CREATE_NO_WINDOW,
    )
    try:
        inject = ready_fault(
            tmp_path / "owned", lambda *_: fail(KeyboardInterrupt("injected"))
        )
        result, _ = run(tmp_path, "tree", fault=inject)
        assert not result["passed"] and other.poll() is None
    finally:
        if other.poll() is None:
            other.kill()
        other.wait(timeout=5)


def test_interruption_before_release(tmp_path):
    result, directory = run(
        tmp_path, fault=lambda *_: fail(KeyboardInterrupt("before release"))
    )
    assert not result["passed"] and result["supervisor"]["interrupted"]
    assert not (directory / "ready.json").exists()


def test_prepare_failure_has_terminal_without_child(tmp_path):
    result, _ = run(tmp_path, prepare=lambda *_: fail(ValueError("prepare injection")))
    assert not result["passed"] and result["supervisor"]["child_pid"] is None


def test_existing_directory_untouched(tmp_path):
    (tmp_path / "owned").mkdir()
    with pytest.raises(ValueError, match="fresh"):
        run(tmp_path)
    assert not list((tmp_path / "owned").iterdir())


def test_energy_import_is_stdlib_only():
    before = set(sys.modules)
    runpy.run_path(str(ENERGY))
    assert not any(
        name == "numpy" or name.startswith("science.")
        for name in set(sys.modules) - before
    )


def energy_module():
    spec = importlib.util.spec_from_file_location("guarded_energy_fixture", ENERGY)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_energy_entry_delegates_every_phase(tmp_path, monkeypatch):
    module = energy_module()
    calls = []

    def capture(command, directory, **kwargs):
        calls.append((command, directory, kwargs))
        return dict(completed=True, passed=True, errors=[])

    monkeypatch.setattr(module.G, "supervise", capture)
    assert module.main(["--output-directory", str(tmp_path / "unused")]) == 0
    assert len(calls) == 1 and "--guard-worker" in calls[0][0]
    assert calls[0][2]["finalizer"] is module.finalizer
    assert not (tmp_path / "unused").exists()


def test_energy_worker_requires_supervisor_before_import(tmp_path, monkeypatch):
    module = energy_module()
    monkeypatch.delenv("NR_OWNED_CONTROL_RUN_ID", raising=False)
    monkeypatch.setattr(
        module,
        "initialize_worker",
        lambda: fail(AssertionError("kernel import forbidden")),
    )
    with pytest.raises(ValueError, match="supervisor required"):
        module.main(["--guard-worker", "--output-directory", str(tmp_path)])
