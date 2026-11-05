"""Disposable data-file Windows API diagnostic; no solver/old evidence mutation."""
import ctypes as c
from ctypes import wintypes as w
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
out = ROOT / "tmp/nr-checkpoint-rename-probe-v1-20261010"
assert not out.exists()
assert shutil.disk_usage("C:/").free >= 3 * 1024**3
assert shutil.disk_usage(ROOT).free >= 4 * 1024**3 + 32 * 1024**2 + 1024**2
out.mkdir()
k = c.WinDLL("kernel32", use_last_error=True)
k.CreateFileW.argtypes = [w.LPCWSTR, w.DWORD, w.DWORD, c.c_void_p, w.DWORD, w.DWORD, w.HANDLE]
k.CreateFileW.restype = w.HANDLE
k.SetFileInformationByHandle.argtypes = [w.HANDLE, c.c_int, c.c_void_p, w.DWORD]
k.SetFileInformationByHandle.restype = w.BOOL
k.CloseHandle.argtypes = [w.HANDLE]


class Rename(c.Structure):
    _fields_ = [("flags", w.DWORD), ("root", w.HANDLE), ("length", w.DWORD), ("name", w.WCHAR * 1)]


rows = []
for locked in (False, True):
    for preferred in (False, True):
        for terminated in (False, True):
            stem = f"{locked}-{preferred}-{terminated}"
            before, after = out / (stem + ".partial"), out / (stem + ".nrck")
            before.write_bytes(b"append-only Windows rename diagnostic; no scientific state")
            dh = k.CreateFileW(str(out), 0x80, 3, None, 3, 0x02200000, None) if locked else None
            h = k.CreateFileW(str(before), 0xC0010000, 0, None, 3, 0x80, None)
            assert h != w.HANDLE(-1).value
            target = str(after) if preferred else after.as_posix()
            size = Rename.name.offset + 2 * (len(target) + int(terminated))
            buf = c.create_string_buffer(size)
            info = Rename.from_buffer(buf)
            info.flags, info.root, info.length = 0, None, len(target) * 2
            c.memmove(c.addressof(buf) + Rename.name.offset, target.encode("utf-16le"), len(target) * 2)
            c.set_last_error(0)
            ok = k.SetFileInformationByHandle(h, 3, buf, size)
            code = c.get_last_error()
            k.CloseHandle(h)
            if dh: k.CloseHandle(dh)
            rows.append(dict(locked=locked, preferred=preferred, terminated=terminated,
                             success=bool(ok), winerror=code, detail=c.FormatError(code),
                             offset=Rename.name.offset, source_remaining=before.exists(), destination_exists=after.exists()))
(out / "results.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
print(json.dumps(rows, indent=2))
