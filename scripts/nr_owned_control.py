"""Windows-owned process supervision and preallocated, fail-closed terminals.

Stdlib only: importing this module must not load any scientific kernel. A pipe
handshake prevents the bootstrap from starting work before Job Object assignment.
This is a bounded runner, not an adversarial sandbox or real-time OS guarantee.
"""

from __future__ import annotations

import ctypes
from ctypes import wintypes as W
from dataclasses import dataclass
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "tmp/nr-shadow-evidence"
C_RESERVE = 3 * 1024**3
E_RESERVE = 4 * 1024**3 + 32 * 1024**2
CAP = 64 * 1024**2
HEADROOM = 2 * 1024**2
SLOT_BYTES = HEADROOM // 2
SCHEMA = "nr-owned-control-v1"


def require(condition, message):
    if not condition:
        raise ValueError(message)


def encoded(value):
    return (
        json.dumps(value, sort_keys=True, allow_nan=False, separators=(",", ":")) + "\n"
    ).encode()


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for block in iter(lambda: stream.read(1024**2), b""):
            digest.update(block)
    return digest.hexdigest()


def contained(root, name):
    root, part = Path(root).resolve(), Path(name)
    require(
        not part.is_absolute()
        and not part.drive
        and ".." not in part.parts
        and ":" not in str(part),
        "plain contained relative path required",
    )
    path = root / part
    require(path.resolve().is_relative_to(root), "path escapes evidence root")
    for item in (path, *path.parents):
        if item == root.parent:
            break
        require(
            not item.is_symlink() and not item.is_junction(),
            "reparse evidence forbidden",
        )
    return path


@dataclass(frozen=True)
class Limits:
    seconds: float = 600
    cap: int = CAP
    headroom: int = HEADROOM


class ResourceLimit(RuntimeError):
    pass


class Budget:
    def __init__(
        self,
        directory,
        limits=Limits(),
        *,
        clock=time.monotonic,
        disk_usage=shutil.disk_usage,
    ):
        require(
            0 < limits.seconds <= 600 and 0 < limits.headroom < limits.cap <= CAP,
            "bounded control limits required",
        )
        self.directory = Path(directory)
        self.limits, self.clock, self.disk_usage = limits, clock, disk_usage
        self.started = clock()
        self.deadline = self.started + limits.seconds
        self.disk_check(limits.cap)

    def disk_check(self, additional=0):
        if (
            self.disk_usage("C:/").free < C_RESERVE
            or self.disk_usage(ROOT).free - additional < E_RESERVE
        ):
            raise ResourceLimit("original C/E reserve reached")

    def guard(self, additional=0):
        if self.clock() >= self.deadline:
            raise ResourceLimit("registered control deadline reached")
        used = (
            sum(p.stat().st_size for p in self.directory.rglob("*") if p.is_file())
            if self.directory.exists()
            else 0
        )
        if used + additional + self.limits.headroom > self.limits.cap:
            raise ResourceLimit("registered control artifact budget reached")
        self.disk_check(additional)
        return self.deadline - self.clock()

    def save(self, name, raw):
        self.guard(len(raw))
        path = contained(self.directory, name)
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("xb") as stream:
            stream.write(raw)

    def record(self, name, value):
        self.save(name, encoded(value))


def kernel():
    require(os.name == "nt", "Windows-native owned controls required")
    return ctypes.WinDLL("kernel32", use_last_error=True)


def api(lib, name, args, result=W.BOOL):
    call = getattr(lib, name)
    call.argtypes, call.restype = args, result
    return call


def checked(value):
    if not value:
        raise ctypes.WinError(ctypes.get_last_error())
    return value


class BasicLimits(ctypes.Structure):
    _fields_ = [
        ("process_time", ctypes.c_longlong),
        ("job_time", ctypes.c_longlong),
        ("flags", W.DWORD),
        ("min_ws", ctypes.c_size_t),
        ("max_ws", ctypes.c_size_t),
        ("active_limit", W.DWORD),
        ("affinity", ctypes.c_size_t),
        ("priority", W.DWORD),
        ("scheduling", W.DWORD),
    ]


class ExtendedLimits(ctypes.Structure):
    _fields_ = [
        ("basic", BasicLimits),
        ("io", ctypes.c_ulonglong * 6),
        ("process_memory", ctypes.c_size_t),
        ("job_memory", ctypes.c_size_t),
        ("peak_process", ctypes.c_size_t),
        ("peak_job", ctypes.c_size_t),
    ]


class Accounting(ctypes.Structure):
    _fields_ = [
        ("times", ctypes.c_longlong * 4),
        ("faults", W.DWORD),
        ("total", W.DWORD),
        ("active", W.DWORD),
        ("terminated", W.DWORD),
    ]


class StandardInfo(ctypes.Structure):
    _fields_ = [
        ("allocation", ctypes.c_longlong),
        ("length", ctypes.c_longlong),
        ("links", W.DWORD),
        ("delete_pending", ctypes.c_ubyte),
        ("directory", ctypes.c_ubyte),
    ]


class WindowsJob:
    def __init__(self):
        self.lib = kernel()
        self.close_handle = api(self.lib, "CloseHandle", [W.HANDLE])
        self.handle = checked(
            api(self.lib, "CreateJobObjectW", [ctypes.c_void_p, W.LPCWSTR], W.HANDLE)(
                None, None
            )
        )
        try:
            limits = ExtendedLimits()
            limits.basic.flags = (
                0x2000  # JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE; no breakaway.
            )
            checked(
                api(
                    self.lib,
                    "SetInformationJobObject",
                    [W.HANDLE, ctypes.c_int, ctypes.c_void_p, W.DWORD],
                )(self.handle, 9, ctypes.byref(limits), ctypes.sizeof(limits))
            )
        except BaseException:
            self.close()
            raise

    def assign(self, child):
        process = checked(
            api(self.lib, "OpenProcess", [W.DWORD, W.BOOL, W.DWORD], W.HANDLE)(
                0x0100 | 0x0001, False, child.pid
            )
        )
        try:
            checked(
                api(self.lib, "AssignProcessToJobObject", [W.HANDLE, W.HANDLE])(
                    self.handle, process
                )
            )
        finally:
            self.close_handle(process)

    def active(self):
        data = Accounting()
        checked(
            api(
                self.lib,
                "QueryInformationJobObject",
                [W.HANDLE, ctypes.c_int, ctypes.c_void_p, W.DWORD, ctypes.c_void_p],
            )(self.handle, 1, ctypes.byref(data), ctypes.sizeof(data), None)
        )
        return int(data.active)

    def stop(self):
        before = self.active()
        if before:
            checked(
                api(self.lib, "TerminateJobObject", [W.HANDLE, W.UINT])(
                    self.handle, 125
                )
            )
        deadline = time.monotonic() + 5
        while self.active():
            if time.monotonic() >= deadline:
                raise RuntimeError("owned process cleanup did not complete")
            time.sleep(0.02)
        return before

    def close(self):
        if self.handle:
            checked(self.close_handle(self.handle))
            self.handle = None


def dense_file(stream, path):
    """Disable only this NEW terminal file's inherited compression, before allocation."""
    import msvcrt

    lib = kernel()
    handle = W.HANDLE(msvcrt.get_osfhandle(stream.fileno()))
    attributes = api(lib, "GetFileAttributesW", [W.LPCWSTR], W.DWORD)(str(path))
    require(
        attributes != 0xFFFFFFFF and not attributes & 0x200,
        "non-sparse terminal required",
    )
    if attributes & 0x800:
        mode, returned = W.WORD(0), W.DWORD()
        checked(
            api(
                lib,
                "DeviceIoControl",
                [
                    W.HANDLE,
                    W.DWORD,
                    ctypes.c_void_p,
                    W.DWORD,
                    ctypes.c_void_p,
                    W.DWORD,
                    ctypes.POINTER(W.DWORD),
                    ctypes.c_void_p,
                ],
            )(
                handle,
                0x9C040,
                ctypes.byref(mode),
                ctypes.sizeof(mode),
                None,
                0,
                ctypes.byref(returned),
                None,
            )
        )


def allocation(stream):
    import msvcrt

    data = StandardInfo()
    checked(
        api(
            kernel(),
            "GetFileInformationByHandleEx",
            [W.HANDLE, ctypes.c_int, ctypes.c_void_p, W.DWORD],
        )(
            W.HANDLE(msvcrt.get_osfhandle(stream.fileno())),
            1,
            ctypes.byref(data),
            ctypes.sizeof(data),
        )
    )
    return int(data.allocation)


def seal(record):
    data = dict(record)
    require("terminal_sha256" not in data, "terminal checksum is supervisor-owned")
    data["terminal_sha256"] = hashlib.sha256(encoded(data)).hexdigest()
    return encoded(data)


def read_terminal(path):
    data = json.loads(Path(path).read_bytes())
    digest = data.pop("terminal_sha256")
    require(
        digest == hashlib.sha256(encoded(data)).hexdigest(),
        "terminal checksum mismatch",
    )
    return data


def recover_terminal(directory, name="qualification-gate.json"):
    """A damaged terminal only falls back to prepared/incomplete, never to success."""
    directory = Path(directory)
    prepared = read_terminal(directory / (name + ".prepared.json"))
    require(
        prepared["passed"] is False and prepared["completed"] is False,
        "incomplete prepared terminal required",
    )
    try:
        current = read_terminal(directory / name)
        require(
            current["run_id"] == prepared["run_id"], "terminal run identity mismatch"
        )
        return current
    except (ValueError, KeyError, OSError):
        return prepared


class ReservedTerminal:
    def __init__(
        self, budget, initial, name="qualification-gate.json", slot_bytes=SLOT_BYTES
    ):
        require(
            type(slot_bytes) is int
            and 4096 <= slot_bytes
            and 2 * slot_bytes <= budget.limits.headroom,
            "bounded terminal slots required",
        )
        budget.guard(2 * slot_bytes)
        self.path = contained(budget.directory, name)
        self.backup = contained(budget.directory, name + ".prepared.json")
        self.size, self.stream = slot_bytes, None
        raw = seal(initial)
        require(len(raw) <= slot_bytes, "initial terminal exceeds reserved slot")
        try:
            for path in (self.backup, self.path):
                with path.open("x+b", buffering=0) as stream:
                    dense_file(stream, path)
                    self._write(stream, raw.ljust(slot_bytes, b" "))
                    require(
                        allocation(stream) >= slot_bytes,
                        "terminal storage not physically allocated",
                    )
            self.stream = self.path.open("r+b", buffering=0)
            self.identity = os.fstat(self.stream.fileno())
        except BaseException:
            self.close()
            raise

    @staticmethod
    def _write(stream, raw):
        stream.seek(0)
        view = memoryview(raw)
        while view:
            written = stream.write(view)
            if not written:
                raise OSError("short terminal write")
            view = view[written:]
        stream.flush()
        os.fsync(stream.fileno())

    def finish(self, record):
        raw = seal(record)
        require(len(raw) <= self.size, "terminal exceeds reserved slot")
        current = self.path.stat()
        require(
            os.path.samestat(self.identity, current)
            and current.st_size == self.size
            and allocation(self.stream) >= self.size,
            "reserved terminal identity/allocation changed",
        )
        # No new file, rename, truncate, quota bypass or reduced physical reserve.
        # Only overwrite already allocated bytes; underlying I/O can still fail.
        self._write(self.stream, raw.ljust(self.size, b" "))
        require(read_terminal(self.path) == record, "terminal readback mismatch")

    def close(self):
        if self.stream is not None:
            self.stream.close()
            self.stream = None


def inventory(directory, excluded, budget):
    result = {}
    for index, path in enumerate(sorted(Path(directory).rglob("*"))):
        if index % 32 == 0:
            budget.guard()
        if path.is_file() and path != Path(directory) / excluded:
            relative = path.relative_to(directory).as_posix()
            result[relative] = sha(contained(directory, relative))
    return result


def supervise(
    command,
    directory,
    *,
    prepare=None,
    finalizer=None,
    limits=Limits(),
    allowed_parent=EVIDENCE,
    slot_bytes=SLOT_BYTES,
    fault=None,
    budget_factory=Budget,
):
    # Keep lexical ancestors until reparse checks have run; resolve() first
    # would hide a junction pointing back inside the evidence tree.
    directory, allowed_parent = (
        Path(os.path.abspath(directory)),
        Path(os.path.abspath(allowed_parent)),
    )
    require(
        allowed_parent.is_relative_to(EVIDENCE)
        and directory.parent == allowed_parent
        and not directory.exists(),
        "fresh contained control directory required",
    )
    contained(EVIDENCE, directory.relative_to(EVIDENCE))
    require(
        isinstance(command, list)
        and command
        and all(isinstance(s, str) for s in command),
        "explicit command vector required",
    )
    budget = budget_factory(directory, limits)
    directory.mkdir()
    initial = dict(
        schema=SCHEMA,
        run_id=str(uuid.uuid4()),
        completed=False,
        passed=False,
        phase="prepared",
        errors=[],
        scientificPayloadWriteback=False,
    )
    terminal = ReservedTerminal(budget, initial, slot_bytes=slot_bytes)
    state = dict(
        initial,
        phase="intake",
        command=command,
        returncode=None,
        child_pid=None,
        job_assigned=False,
        cleanup_verified=False,
        active_before_cleanup=0,
        active_after_cleanup=None,
        interrupted=False,
        injected=fault is not None,
        retries=0,
        resource_caps=dict(
            seconds=limits.seconds,
            output_bytes=limits.cap,
            headroom=limits.headroom,
            c_reserve=C_RESERVE,
            e_reserve=E_RESERVE,
        ),
    )
    child = job = log = None
    try:
        if prepare is not None:
            prepare(directory, budget)
        budget.guard()
        job = WindowsJob()
        log = (directory / "owned-worker.log").open("xb")
        env = dict(
            os.environ,
            PYTHONDONTWRITEBYTECODE="1",
            PYTEST_DISABLE_PLUGIN_AUTOLOAD="1",
            OPENBLAS_NUM_THREADS="1",
            OMP_NUM_THREADS="1",
            MKL_NUM_THREADS="1",
            TEMP=str(directory),
            TMP=str(directory),
            NR_OWNED_CONTROL_RUN_ID=state["run_id"],
        )
        bootstrap = [
            sys.executable,
            "-B",
            str(Path(__file__).resolve()),
            "--bootstrap",
            *command,
        ]
        child = subprocess.Popen(
            bootstrap,
            cwd=ROOT,
            env=env,
            stdin=subprocess.PIPE,
            stdout=log,
            stderr=subprocess.STDOUT,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        state["child_pid"] = child.pid
        job.assign(child)
        state["job_assigned"] = True
        budget.record(
            "owned-process.json",
            dict(
                pid=child.pid,
                command=command,
                supervisor_pid=os.getpid(),
                run_id=state["run_id"],
                owned=True,
            ),
        )
        if fault:
            fault("assigned", budget, state)
        budget.guard()
        child.stdin.write(b"R")
        child.stdin.close()
        state["phase"] = "running"
        print(
            json.dumps(
                dict(
                    status="owned-control-running",
                    pid=child.pid,
                    directory=str(directory),
                )
            ),
            flush=True,
        )
        while child.poll() is None:
            if fault:
                fault("poll", budget, state)
            budget.guard()
            time.sleep(0.05)
        state["returncode"] = child.returncode
        budget.guard()
        require(child.returncode == 0, "owned worker failed; no automatic retry")
        require(job.active() == 0, "owned descendants outlived worker")
        state["phase"] = "worker-complete"
    except BaseException as error:
        state["errors"].append(f"{type(error).__name__}: {error}")
        state["interrupted"] = isinstance(error, (KeyboardInterrupt, SystemExit))
        state["phase"] = "interrupted" if state["interrupted"] else "failed"
    finally:
        try:
            if job is not None:
                state["active_before_cleanup"] = job.stop()
                state["active_after_cleanup"] = job.active()
            if child is not None:
                if child.poll() is None:
                    child.kill()  # Unassigned bootstrap cannot have crossed the pipe barrier.
                child.wait(timeout=5)
                state["returncode"] = child.returncode
                if child.stdin is not None and not child.stdin.closed:
                    child.stdin.close()
            state["cleanup_verified"] = (
                job is None or state["active_after_cleanup"] == 0
            ) and (child is None or child.poll() is not None)
        except BaseException as error:
            state["errors"].append(f"cleanup {type(error).__name__}: {error}")
        finally:
            if job is not None:
                try:
                    job.close()  # OS kill-on-close also protects abrupt supervisor termination.
                except BaseException as error:
                    state["errors"].append(f"job close {type(error).__name__}: {error}")
            if log is not None:
                try:
                    log.close()
                except BaseException as error:
                    state["errors"].append(f"log close {type(error).__name__}: {error}")
    record = {}
    try:
        if not state["errors"] and state["cleanup_verified"]:
            budget.guard()
            record = finalizer(directory, budget) if finalizer is not None else {}
            require(
                isinstance(record, dict)
                and not {"supervisor", "terminal_sha256"}.intersection(record),
                "unambiguous supervisor-owned terminal required",
            )
            require(
                all(
                    record[key] is True
                    for key in ("completed", "passed")
                    if key in record
                )
                and not record.get("errors"),
                "finalizer did not qualify its result",
            )
            state["artifact_hashes"] = inventory(directory, terminal.path.name, budget)
            budget.guard()
            state.update(completed=True, passed=True, phase="complete")
    except BaseException as error:
        state["errors"].append(f"finalization {type(error).__name__}: {error}")
        state["interrupted"] = state["interrupted"] or isinstance(
            error, (KeyboardInterrupt, SystemExit)
        )
        state["phase"] = "interrupted" if state["interrupted"] else "failed"
        if not isinstance(record, dict):
            record = {}
    state["seconds"] = time.monotonic() - budget.started
    state["passed"] = bool(
        state["passed"] and state["cleanup_verified"] and not state["errors"]
    )
    record.pop("terminal_sha256", None)
    record.update(
        run_id=state["run_id"],
        completed=state["passed"],
        passed=state["passed"],
        errors=list(state["errors"]),
        supervisor=state,
        artifact_hashes=state.get("artifact_hashes", {}),
        physical_gate=False,
        live_admission=False,
        scientificPayloadWriteback=False,
    )
    if not state["passed"]:
        record.update(
            fixed_projector_energy_validated=False,
            physical_gate=False,
            live_admission=False,
            scientificPayloadWriteback=False,
        )
    try:
        try:
            terminal.finish(record)
        except ValueError as error:
            # Oversized metadata must not turn a successful worker into admission.
            state.update(passed=False, completed=False, phase="failed")
            state["errors"].append(f"terminal {type(error).__name__}: {error}")
            compact = {
                key: value for key, value in state.items() if key != "artifact_hashes"
            }
            record = dict(
                schema=SCHEMA,
                run_id=state["run_id"],
                completed=False,
                passed=False,
                errors=state["errors"],
                supervisor=compact,
                physical_gate=False,
                live_admission=False,
                scientificPayloadWriteback=False,
                fixed_projector_energy_validated=False,
            )
            terminal.finish(record)
    finally:
        terminal.close()
    return record


def bootstrap(command):
    # No command can execute before the parent has assigned this process to its job.
    if sys.stdin.buffer.read(1) != b"R":
        return 126
    return subprocess.call(
        command,
        cwd=ROOT,
        stdin=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NO_WINDOW,
    )


if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] != "--bootstrap":
        raise SystemExit("internal pipe-gated bootstrap only")
    raise SystemExit(bootstrap(sys.argv[2:]))
