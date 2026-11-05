"""Fresh, single-enumeration scan candidate for bounded owned controls.

This additive candidate leaves the original supervisor and Budget unchanged.
It counts logical bytes per file entry, including separate hard links. Directory
identity checks reject observed replacement; a pathname scan is not an atomic
snapshot or protection against arbitrary concurrent/adversarial replacement.
"""

from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path
import shutil
import stat
import time

import nr_owned_control as G


@dataclass(frozen=True)
class ScanSnapshot:
    used_bytes: int
    files: int
    directories: int
    file_paths: tuple[str, ...]


class ScanError(ValueError):
    """An incomplete or unsupported scan must never become a byte total."""


def _failure(operation, path, error=None):
    label = str(path)
    if len(label) > 160:
        label = "..." + label[-157:]
    suffix = ""
    if error is not None:
        suffix = f" ({type(error).__name__}, errno={getattr(error, 'errno', None)})"
    return ScanError(f"scan rejected: {operation}: {label}{suffix}")


def _fresh_stat(path):
    try:
        return os.stat(path, follow_symlinks=False)
    except OSError as error:
        raise _failure("state unavailable", path, error) from None


def _kind(info, path):
    # Checking the fresh result avoids DirEntry's potentially cached metadata.
    if stat.S_ISLNK(info.st_mode) or (
        getattr(info, "st_file_attributes", 0)
        & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
    ):
        raise _failure("symlink or reparse point", path)
    if stat.S_ISDIR(info.st_mode):
        return "directory"
    if stat.S_ISREG(info.st_mode):
        return "file"
    raise _failure("unsupported file type", path)


def _directory_identity(info, path):
    if _kind(info, path) != "directory":
        raise _failure("directory required", path)
    # ctime is deliberately excluded: on some systems ordinary writes change it.
    # Windows birthtime, when available, strengthens the device/inode witness.
    if info.st_ino <= 0 or info.st_dev < 0:
        raise _failure("directory identity unavailable", path)
    return (info.st_dev, info.st_ino, getattr(info, "st_birthtime_ns", None))


def _same_directory(path, expected):
    identity = _directory_identity(_fresh_stat(path), path)
    if identity != expected:
        raise _failure("directory identity changed", path)


def _child_name(name, path):
    # Native directory entries cannot contain these; reject malformed injected
    # entries too, rather than allowing a lexical escape from the scan root.
    if (
        not isinstance(name, str)
        or not name
        or name in (".", "..")
        or any(character in name for character in ("/", "\\", ":", "\0"))
    ):
        raise _failure("invalid directory entry name", path)
    return name


def scan_tree(directory, *, check=None, collect_paths=False) -> ScanSnapshot:
    """Count an existing plain directory tree with fresh metadata each call.

    Each directory is enumerated once; every enumerated entry receives one
    fresh no-follow stat. Additional directory stats check identity before and
    after enumeration. Read failures, observed disappearance/replacement and
    reparse/unknown entries fail closed. ``check`` is called at root, directory
    and entry boundaries and its exceptions propagate without retry.

    Changes outside these observation windows cannot be detected reliably.
    Independent supervision and pre-write budgeting remain necessary.
    """
    if check is not None and not callable(check):
        raise TypeError("scan check must be callable or None")
    if type(collect_paths) is not bool:
        raise TypeError("collect_paths must be a bool")

    def checkpoint():
        if check is not None:
            check()

    checkpoint()
    root = Path(os.path.abspath(directory))
    root_identity = _directory_identity(_fresh_stat(root), root)
    stack = [(root, Path(), root_identity)]
    used_bytes = files = directories = 0
    file_paths = []
    while stack:
        checkpoint()
        current, relative, identity = stack.pop()
        _same_directory(current, identity)
        checkpoint()
        try:
            iterator = os.scandir(current)
        except OSError as error:
            raise _failure("directory unreadable", current, error) from None
        with iterator:
            while True:
                checkpoint()
                try:
                    entry = next(iterator)
                except StopIteration:
                    break
                except OSError as error:
                    raise _failure("enumeration failed", current, error) from None
                checkpoint()
                name = _child_name(entry.name, current)
                child, child_relative = current / name, relative / name
                info = _fresh_stat(child)
                kind = _kind(info, child)
                if kind == "directory":
                    directories += 1
                    stack.append(
                        (child, child_relative, _directory_identity(info, child))
                    )
                else:
                    if type(info.st_size) is not int or info.st_size < 0:
                        raise _failure("invalid logical size", child)
                    used_bytes += info.st_size
                    files += 1
                    if collect_paths:
                        file_paths.append(child_relative.as_posix())
                checkpoint()
        _same_directory(current, identity)
        checkpoint()
    # Also catch an observed root replacement while descendants were processed.
    _same_directory(root, root_identity)
    checkpoint()
    paths = tuple(sorted(file_paths)) if collect_paths else ()
    checkpoint()
    return ScanSnapshot(used_bytes, files, directories, paths)


class SingleScanBudget(G.Budget):
    """Original limits/write methods with fresh scanning and lifecycle checks.

    Only directory identity and whether the root has been seen are retained;
    byte totals, entry metadata and directory iterators never cross guard calls.
    The initial absent root is allowed for ``supervise``'s creation sequence.
    Once observed, a missing or replaced root is a failure. A creation/deletion
    entirely between observations is outside this bounded monitoring contract.
    """

    def __init__(
        self,
        directory,
        limits=G.Limits(),
        *,
        clock=time.monotonic,
        disk_usage=shutil.disk_usage,
    ):
        self._root_identity = None
        super().__init__(directory, limits, clock=clock, disk_usage=disk_usage)
        self.directory = Path(os.path.abspath(self.directory))
        self._observe_root()

    def _observe_root(self):
        try:
            info = os.stat(self.directory, follow_symlinks=False)
        except FileNotFoundError as error:
            if self._root_identity is None:
                return False
            raise _failure("observed root disappeared", self.directory, error) from None
        except OSError as error:
            raise _failure("root state unavailable", self.directory, error) from None
        identity = _directory_identity(info, self.directory)
        if self._root_identity is not None and identity != self._root_identity:
            raise _failure("root identity changed", self.directory)
        self._root_identity = identity
        return True

    def _check_deadline(self):
        if self.clock() >= self.deadline:
            raise G.ResourceLimit("registered control deadline reached")

    def guard(self, additional=0):
        if type(additional) is not int or additional < 0:
            raise ValueError("additional must be a nonnegative integer")
        self._check_deadline()
        present = self._observe_root()
        used = (
            scan_tree(self.directory, check=self._check_deadline).used_bytes
            if present
            else 0
        )
        if present:
            self._observe_root()
        self._check_deadline()
        if used + additional + self.limits.headroom > self.limits.cap:
            raise G.ResourceLimit("registered control artifact budget reached")
        self.disk_check(additional)
        remaining = self.deadline - self.clock()
        # The original guard could return a negative remainder after a slow
        # scan/disk query. Rejecting it here is a documented conservative change.
        if remaining <= 0:
            raise G.ResourceLimit("registered control deadline reached")
        return remaining
