"""Independent filesystem and owned-process controls; no scientific imports.

Run only inside the explicitly registered outer owned batch.  The stable-tree
oracle uses os.walk plus stat, not the candidate's traversal or accounting.
"""

from collections import Counter
import itertools
import json
import os
from pathlib import Path
import stat
import sys
from types import SimpleNamespace

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
import nr_owned_control as G  # noqa: E402
import nr_single_scan_control as S  # noqa: E402

SMALL = G.Limits(seconds=15, cap=1024**2, headroom=128 * 1024)
CHILD = ROOT / "scripts/tests/nr_single_scan_child.py"
SCAN_ERRORS = (ValueError, OSError, G.ResourceLimit)
CASE_SEQUENCE = itertools.count(1)


@pytest.fixture
def tmp_path(request):
    """Retained ordinary directories, without pytest's '*current' symlinks.

    The outer supervisor scans this tree concurrently.  No teardown deletes
    are allowed; the caller owns later retention/cleanup policy.
    """
    configured = request.config.option.basetemp
    assert configured, "explicit owned --basetemp required"
    base = Path(configured)
    assert base.is_absolute()
    assert base.resolve().is_relative_to(G.EVIDENCE.resolve())
    G.contained(G.EVIDENCE, base.relative_to(G.EVIDENCE))
    base.mkdir(parents=True, exist_ok=True)
    directory = base / f"case-{next(CASE_SEQUENCE):04d}"
    directory.mkdir()
    return directory


def ample(_):
    return SimpleNamespace(free=100 * 1024**3)


def key(path):
    return os.path.normcase(os.path.abspath(os.fsdecode(path)))


def baseline(directory):
    """Independent reference for stable, ordinary test directories only."""
    used, directories, names = 0, 0, []
    for current, child_directories, files in os.walk(directory, followlinks=False):
        directories += len(child_directories)
        for name in files:
            path = Path(current) / name
            metadata = os.stat(path, follow_symlinks=False)
            assert stat.S_ISREG(metadata.st_mode)
            used += metadata.st_size
            names.append(path.relative_to(directory).as_posix())
    return used, len(names), directories, tuple(sorted(names))


def assert_snapshot(directory, *, collect_paths=True):
    expected = baseline(directory)
    result = S.scan_tree(directory, collect_paths=collect_paths)
    assert (result.used_bytes, result.files, result.directories) == expected[:3]
    assert isinstance(result.file_paths, tuple)
    assert tuple(sorted(result.file_paths)) == (expected[3] if collect_paths else ())
    return result


def altered(metadata, **changes):
    values = {
        name: getattr(metadata, name)
        for name in dir(metadata)
        if name.startswith("st_")
    }
    values.update(changes)
    return SimpleNamespace(**values)


class VisibleEntries:
    """Controlled deletion observation; underlying owned files are retained.

    This proves fresh accounting when a new scan no longer observes an entry.
    It deliberately does not claim live concurrent filesystem deletion safety.
    """

    def __init__(self, iterator, omitted):
        self.iterator, self.omitted = iterator, omitted

    def __enter__(self):
        return self

    def __iter__(self):
        return self

    def __next__(self):
        while True:
            entry = next(self.iterator)
            if key(entry.path) not in self.omitted:
                return entry

    def __exit__(self, *_):
        self.iterator.close()


@pytest.mark.parametrize("shape", ["empty", "deep", "unicode-hidden-extensionless"])
def test_stable_tree_matches_independent_walk_stat(tmp_path, shape):
    if shape == "deep":
        current = tmp_path
        for depth in range(18):
            current = current / "d"
            current.mkdir()
            (current / "entry").write_bytes(bytes([depth]) * (depth + 1))
        (tmp_path / "empty-directory").mkdir()
    elif shape == "unicode-hidden-extensionless":
        for name, payload in [
            (".hidden", b"h"),
            ("extensionless", b"abc"),
            ("数据/结果.Ω", b"unicode"),
            ("nested/a.tar.gz", b"\0" * 17),
            ("zero", b""),
        ]:
            path = tmp_path / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(payload)
    assert_snapshot(tmp_path)
    assert_snapshot(tmp_path, collect_paths=False)


def test_hardlink_entries_each_count_their_logical_bytes(tmp_path):
    source = tmp_path / "original.bin"
    source.write_bytes(b"1234567")
    os.link(source, tmp_path / "second-name.bin")
    result = assert_snapshot(tmp_path)
    assert (result.used_bytes, result.files) == (14, 2)


def test_windows_hidden_attribute_does_not_hide_accounting(tmp_path, monkeypatch):
    target = tmp_path / "hidden-attribute.bin"
    target.write_bytes(b"hidden data")
    real_stat = os.stat

    def hidden_stat(path, *args, **kwargs):
        metadata = real_stat(path, *args, **kwargs)
        if not isinstance(path, int) and key(path) == key(target):
            return altered(
                metadata,
                st_file_attributes=getattr(metadata, "st_file_attributes", 0) | 0x2,
            )
        return metadata

    with monkeypatch.context() as patch:
        patch.setattr(S.os, "stat", hidden_stat)
        result = S.scan_tree(tmp_path, collect_paths=True)
    assert (result.used_bytes, result.files, result.file_paths) == (
        11,
        1,
        (target.name,),
    )


def test_each_scan_refreshes_real_writes_and_controlled_deletion_visibility(
    tmp_path, monkeypatch
):
    first = tmp_path / "data"
    first.write_bytes(b"a" * 5)
    assert assert_snapshot(tmp_path).used_bytes == 5
    with first.open("ab") as stream:
        stream.write(b"b" * 8)
    assert assert_snapshot(tmp_path).used_bytes == 13
    with first.open("r+b") as stream:
        stream.truncate(2)
    assert assert_snapshot(tmp_path).used_bytes == 2
    second = tmp_path / "new"
    second.write_bytes(b"c" * 17)
    assert assert_snapshot(tmp_path).used_bytes == 19
    # Keep the actual files for the enclosing live scanner.  Expected totals
    # below are independently fixed from the two known payload sizes.
    real_scandir, omitted = os.scandir, set()
    with monkeypatch.context() as patch:
        patch.setattr(
            S.os, "scandir", lambda path: VisibleEntries(real_scandir(path), omitted)
        )
        omitted.add(key(first))
        result = S.scan_tree(tmp_path)
        assert (result.used_bytes, result.files) == (17, 1)
        omitted.add(key(second))
        result = S.scan_tree(tmp_path)
        assert (result.used_bytes, result.files) == (0, 0)


def test_single_enumeration_and_fresh_regular_file_stats(tmp_path, monkeypatch):
    (tmp_path / "nested").mkdir()
    (tmp_path / "empty").mkdir()
    for name in ["plain", ".hidden", "nested/数据.json"]:
        (tmp_path / name).write_bytes(b"123")
    expected = baseline(tmp_path)
    real_stat, real_scandir = os.stat, os.scandir
    stats, scans = Counter(), Counter()

    def counted_stat(path, *args, **kwargs):
        if not isinstance(path, int):
            stats[key(path)] += 1
        return real_stat(path, *args, **kwargs)

    def counted_scandir(path):
        scans[key(path)] += 1
        return real_scandir(path)

    with monkeypatch.context() as patch:
        patch.setattr(S.os, "stat", counted_stat)
        patch.setattr(S.os, "scandir", counted_scandir)
        result = S.scan_tree(tmp_path, collect_paths=True)
    assert (result.used_bytes, result.files, result.directories) == expected[:3]
    assert scans == Counter(
        {key(tmp_path): 1, key(tmp_path / "nested"): 1, key(tmp_path / "empty"): 1}
    )
    for name in expected[3]:
        assert stats[key(tmp_path / name)] == 1
    # Additional directory identity checks are required safety work, not a
    # duplicate scan; regular-file metadata must never come from DirEntry cache.
    for directory in (tmp_path, tmp_path / "nested", tmp_path / "empty"):
        assert stats[key(directory)] >= 1


@pytest.mark.parametrize("error", [PermissionError, FileNotFoundError, OSError])
def test_entry_stat_error_never_returns_partial_snapshot(tmp_path, monkeypatch, error):
    target = tmp_path / "unreadable"
    target.write_bytes(b"not-zero")
    real_stat = os.stat

    def refused(path, *args, **kwargs):
        if not isinstance(path, int) and key(path) == key(target):
            raise error("owned stat injection")
        return real_stat(path, *args, **kwargs)

    with monkeypatch.context() as patch:
        patch.setattr(S.os, "stat", refused)
        with pytest.raises(SCAN_ERRORS):
            S.scan_tree(tmp_path)


def test_entry_disappearance_observation_after_enumeration_fails(tmp_path, monkeypatch):
    target = tmp_path / "vanishing-file"
    target.write_bytes(b"owned temporary data")
    real_stat = os.stat

    def disappear(path, *args, **kwargs):
        if not isinstance(path, int) and key(path) == key(target):
            raise FileNotFoundError("owned post-enumeration disappearance observation")
        return real_stat(path, *args, **kwargs)

    with monkeypatch.context() as patch:
        patch.setattr(S.os, "stat", disappear)
        with pytest.raises(SCAN_ERRORS):
            S.scan_tree(tmp_path)
    assert target.read_bytes() == b"owned temporary data"


@pytest.mark.parametrize("phase", ["open", "iteration"])
def test_scandir_failure_never_returns_partial_snapshot(tmp_path, monkeypatch, phase):
    (tmp_path / "one").write_bytes(b"x")
    real_scandir = os.scandir

    class InterruptedIterator:
        def __init__(self, iterator):
            self.iterator, self.read = iterator, False

        def __enter__(self):
            return self

        def __iter__(self):
            return self

        def __next__(self):
            if self.read:
                raise OSError("owned enumeration interruption")
            self.read = True
            return next(self.iterator)

        def __exit__(self, *_):
            self.iterator.close()

    def refused(path):
        if key(path) == key(tmp_path):
            if phase == "open":
                raise PermissionError("owned enumeration refusal")
            return InterruptedIterator(real_scandir(path))
        return real_scandir(path)

    with monkeypatch.context() as patch:
        patch.setattr(S.os, "scandir", refused)
        with pytest.raises(SCAN_ERRORS):
            S.scan_tree(tmp_path)


@pytest.mark.parametrize(
    "entry_kind", ["symlink", "reparse-file", "reparse-directory", "unknown-fifo"]
)
def test_unsafe_metadata_fails_without_following_or_skipping(
    tmp_path, monkeypatch, entry_kind
):
    # Metadata fault injection avoids host symlink privilege requirements and
    # touches no object outside the pytest-owned directory.
    target = tmp_path / "unsafe"
    target.mkdir() if entry_kind == "reparse-directory" else target.write_bytes(b"x")
    real_stat = os.stat

    def unsafe_stat(path, *args, **kwargs):
        metadata = real_stat(path, *args, **kwargs)
        if not isinstance(path, int) and key(path) == key(target):
            if entry_kind == "symlink":
                return altered(metadata, st_mode=stat.S_IFLNK | 0o777)
            if entry_kind == "unknown-fifo":
                return altered(metadata, st_mode=stat.S_IFIFO | 0o600)
            return altered(
                metadata,
                st_file_attributes=getattr(metadata, "st_file_attributes", 0) | 0x400,
            )
        return metadata

    with monkeypatch.context() as patch:
        patch.setattr(S.os, "stat", unsafe_stat)
        with pytest.raises(SCAN_ERRORS):
            S.scan_tree(tmp_path)


def test_callback_deadline_stops_before_complete_traversal(tmp_path):
    for index in range(40):
        (tmp_path / f"f{index:02}").write_bytes(b"x")
    calls = []

    def deadline():
        calls.append(None)
        if len(calls) == 9:
            raise G.ResourceLimit("injected traversal deadline")

    with pytest.raises(G.ResourceLimit, match="traversal deadline"):
        S.scan_tree(tmp_path, check=deadline)
    assert len(calls) == 9


def test_budget_deadline_checked_during_scan(tmp_path, monkeypatch):
    for index in range(25):
        (tmp_path / f"f{index:02}").write_bytes(b"x")
    ticks, entries = [0.0], []
    budget = S.SingleScanBudget(
        tmp_path, G.Limits(1, 1024, 128), clock=lambda: ticks[0], disk_usage=ample
    )
    real_stat = os.stat

    def advance(path, *args, **kwargs):
        metadata = real_stat(path, *args, **kwargs)
        if stat.S_ISREG(metadata.st_mode):
            entries.append(str(path))
            ticks[0] += 0.26
        return metadata

    with monkeypatch.context() as patch:
        patch.setattr(S.os, "stat", advance)
        with pytest.raises(G.ResourceLimit, match="deadline"):
            budget.guard()
    assert 0 < len(entries) < 25


def test_budget_deadline_rechecked_after_slow_disk_query(tmp_path):
    ticks = [0.0]
    budget = S.SingleScanBudget(
        tmp_path, G.Limits(1, 1024, 128), clock=lambda: ticks[0], disk_usage=ample
    )

    def slow_disk(_):
        ticks[0] = 1.0
        return ample(None)

    budget.disk_usage = slow_disk
    with pytest.raises(G.ResourceLimit, match="deadline"):
        budget.guard()


def test_original_limits_are_not_weakened():
    assert issubclass(S.SingleScanBudget, G.Budget)
    assert G.Limits() == G.Limits(600, 64 * 1024**2, 2 * 1024**2)
    assert G.C_RESERVE == 3 * 1024**3
    assert G.E_RESERVE == 4 * 1024**3 + 32 * 1024**2


@pytest.mark.parametrize(
    "seconds,cap,headroom",
    [(0, 100, 1), (601, 100, 1), (1, 67108865, 1), (1, 100, 0), (1, 100, 100)],
)
def test_invalid_limits_rejected(tmp_path, seconds, cap, headroom):
    with pytest.raises(ValueError):
        S.SingleScanBudget(tmp_path, G.Limits(seconds, cap, headroom), disk_usage=ample)


@pytest.mark.parametrize("additional", [-1, 0.5, True, "1"])
def test_invalid_additional_cannot_reduce_or_bypass_budget(tmp_path, additional):
    budget = S.SingleScanBudget(tmp_path, G.Limits(15, 1024, 128), disk_usage=ample)
    with pytest.raises(ValueError):
        budget.guard(additional)


def test_cap_equal_plus_one_additional_headroom_and_fresh_size(tmp_path, monkeypatch):
    target = tmp_path / "data"
    target.write_bytes(b"x" * 111)
    budget = S.SingleScanBudget(
        tmp_path, G.Limits(15, 128, 16), clock=lambda: 0, disk_usage=ample
    )
    assert budget.guard(1) == 15
    with pytest.raises(G.ResourceLimit):
        budget.guard(2)
    with target.open("ab") as stream:
        stream.write(b"xx")
    with pytest.raises(G.ResourceLimit):
        budget.guard()
    with target.open("r+b") as stream:
        stream.truncate(112)
    assert budget.guard() == 15
    real_scandir = os.scandir
    with monkeypatch.context() as patch:
        patch.setattr(
            S.os,
            "scandir",
            lambda path: VisibleEntries(real_scandir(path), {key(target)}),
        )
        assert budget.guard(112) == 15
        with pytest.raises(G.ResourceLimit):
            budget.guard(113)


@pytest.mark.parametrize("drive", ["C", "E"])
def test_original_drive_floor_equal_and_one_byte_below(tmp_path, drive):
    limits = G.Limits(15, 1024, 128)
    free = {"C": G.C_RESERVE, "E": G.E_RESERVE + limits.cap}

    def disk(path):
        return SimpleNamespace(free=free["C" if str(path).startswith("C:") else "E"])

    budget = S.SingleScanBudget(tmp_path, limits, clock=lambda: 0, disk_usage=disk)
    assert budget.guard() == 15
    free[drive] = (G.C_RESERVE if drive == "C" else G.E_RESERVE) - 1
    with pytest.raises(G.ResourceLimit, match="reserve"):
        budget.guard()


def test_e_drive_floor_reserves_requested_additional_bytes(tmp_path):
    budget = S.SingleScanBudget(
        tmp_path, G.Limits(15, 1024, 128), clock=lambda: 0, disk_usage=ample
    )
    budget.disk_usage = lambda path: SimpleNamespace(
        free=G.C_RESERVE if str(path).startswith("C:") else G.E_RESERVE + 7
    )
    assert budget.guard(7) == 15
    with pytest.raises(G.ResourceLimit, match="reserve"):
        budget.guard(8)


def test_initial_missing_root_allowed_then_disappearance_observation_fails(
    tmp_path, monkeypatch
):
    directory = tmp_path / "not-created-yet"
    budget = S.SingleScanBudget(
        directory, G.Limits(15, 1024, 128), clock=lambda: 0, disk_usage=ample
    )
    assert budget.guard() == 15
    assert not directory.exists()
    directory.mkdir()
    assert budget.guard() == 15
    real_stat = os.stat

    def absent(path, *args, **kwargs):
        if not isinstance(path, int) and key(path) == key(directory):
            raise FileNotFoundError("owned missing-root observation")
        return real_stat(path, *args, **kwargs)

    with monkeypatch.context() as patch:
        patch.setattr(S.os, "stat", absent)
        with pytest.raises(SCAN_ERRORS):
            budget.guard()
    assert directory.is_dir()


def test_root_identity_replacement_observation_fails(tmp_path, monkeypatch):
    directory = tmp_path / "root"
    directory.mkdir()
    budget = S.SingleScanBudget(
        directory, G.Limits(15, 1024, 128), clock=lambda: 0, disk_usage=ample
    )
    budget.guard()
    real_stat = os.stat

    def replaced(path, *args, **kwargs):
        metadata = real_stat(path, *args, **kwargs)
        if not isinstance(path, int) and key(path) == key(directory):
            return altered(metadata, st_ino=metadata.st_ino + 1)
        return metadata

    with monkeypatch.context() as patch:
        patch.setattr(S.os, "stat", replaced)
        with pytest.raises(SCAN_ERRORS):
            budget.guard()


def test_scan_missing_or_regular_file_root_fails(tmp_path):
    with pytest.raises(SCAN_ERRORS):
        S.scan_tree(tmp_path / "missing")
    target = tmp_path / "ordinary-file"
    target.write_bytes(b"x")
    with pytest.raises(SCAN_ERRORS):
        S.scan_tree(target)


def test_root_stat_permission_failure_not_interpreted_as_absence(tmp_path, monkeypatch):
    directory = tmp_path / "root"
    real_stat = os.stat

    def refused(path, *args, **kwargs):
        if not isinstance(path, int) and key(path) == key(directory):
            raise PermissionError("owned root permission injection")
        return real_stat(path, *args, **kwargs)

    budget = S.SingleScanBudget(
        directory, G.Limits(15, 1024, 128), clock=lambda: 0, disk_usage=ample
    )
    with monkeypatch.context() as patch:
        patch.setattr(S.os, "stat", refused)
        with pytest.raises(SCAN_ERRORS):
            budget.guard()


def run_owned(tmp_path, mode, *, limits=SMALL):
    # The outer owned batch must place pytest basetemp inside G.EVIDENCE.
    assert os.name == "nt"
    assert tmp_path.resolve().is_relative_to(G.EVIDENCE.resolve())
    directory = tmp_path / "candidate-owned"
    result = G.supervise(
        [sys.executable, "-B", str(CHILD), mode, str(directory)],
        directory,
        allowed_parent=tmp_path,
        limits=limits,
        slot_bytes=SMALL.headroom // 2,
        budget_factory=S.SingleScanBudget,
    )
    assert G.recover_terminal(directory) == result
    assert result["supervisor"]["job_assigned"]
    assert result["supervisor"]["cleanup_verified"]
    assert result["supervisor"]["active_after_cleanup"] == 0
    assert result["scientificPayloadWriteback"] is False
    assert result["physical_gate"] is result["live_admission"] is False
    ready = json.loads((directory / "ready.json").read_text(encoding="utf-8"))
    assert ready["budget_class"] == "SingleScanBudget"
    assert ready["scientific_modules_imported"] == []
    return result, directory


def test_real_owned_success_uses_candidate_in_parent_and_child(tmp_path):
    result, directory = run_owned(tmp_path, "success")
    assert result["completed"] is result["passed"] is True
    assert "child-result.json" in result["artifact_hashes"]
    for name, digest in result["artifact_hashes"].items():
        assert G.sha(G.contained(directory, name)) == digest


def test_real_owned_timeout_cleans_child_and_descendant(tmp_path):
    result, directory = run_owned(
        tmp_path, "timeout", limits=G.Limits(2, SMALL.cap, SMALL.headroom)
    )
    assert result["completed"] is result["passed"] is False
    assert any("deadline" in error for error in result["errors"])
    assert result["supervisor"]["active_before_cleanup"] >= 2
    ready = json.loads((directory / "ready.json").read_text(encoding="utf-8"))
    assert isinstance(ready["descendant"], int)


def test_real_owned_crash_leaves_recoverable_failure(tmp_path):
    result, _ = run_owned(tmp_path, "crash")
    assert result["completed"] is result["passed"] is False
    assert result["supervisor"]["returncode"] == 7
    assert any("worker failed" in error for error in result["errors"])


def test_real_owned_child_runtime_refusal_keeps_failure_terminal(tmp_path):
    result, directory = run_owned(tmp_path, "runtime-refusal")
    assert result["completed"] is result["passed"] is False
    assert result["supervisor"]["returncode"] == 9
    assert "original C/E reserve reached" in (directory / "owned-worker.log").read_text(
        encoding="utf-8"
    )
    assert not (directory / "forbidden-after-refusal.json").exists()
