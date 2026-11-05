#!/usr/bin/env python3
"""Build the v272 exact 10m Gaia presentation pack with bounded external sorts."""

from __future__ import annotations

import argparse
import ctypes
import importlib.util
import json
import math
import os
import shutil
import sys
from pathlib import Path

from gaia_presentation_external_sort_v272 import create_sorted_work, write_source_index

VERSION = "v272-gaia-dr3-presentation-10000000-v10m-v1"
ID = "gaia-dr3-presentation-10000000-v9"
TARGET_ROWS = 10_000_000
DEFAULT_MIN_FREE_MEMORY_GIB = 6.0
LOW_MEMORY_OVERRIDE_FLOOR_GIB = 3.0
DEFAULT_MIN_FREE_MEMORY_BYTES = int(DEFAULT_MIN_FREE_MEMORY_GIB * 1024**3)
MIN_FREE_DISK_BYTES = 30 * 1024**3
LOW_MEMORY_BUILD_AUTHORIZATION = "user-authorized-current-memory-build"


def load_v9_builder():
    path = Path(__file__).with_name("build-gaia-presentation-v9.py")
    spec = importlib.util.spec_from_file_location("orbit_atlas_gaia_presentation_v9_base", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load the verified Gaia presentation v9 pack writer")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def free_physical_memory() -> int:
    if os.name == "nt":
        class MemoryStatus(ctypes.Structure):
            _fields_ = [
                ("length", ctypes.c_ulong), ("memory_load", ctypes.c_ulong),
                ("total_physical", ctypes.c_ulonglong), ("available_physical", ctypes.c_ulonglong),
                ("total_page_file", ctypes.c_ulonglong), ("available_page_file", ctypes.c_ulonglong),
                ("total_virtual", ctypes.c_ulonglong), ("available_virtual", ctypes.c_ulonglong),
                ("available_extended_virtual", ctypes.c_ulonglong),
            ]
        status = MemoryStatus()
        status.length = ctypes.sizeof(MemoryStatus)
        if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
            raise OSError("GlobalMemoryStatusEx failed")
        return int(status.available_physical)
    return int(os.sysconf("SC_AVPHYS_PAGES") * os.sysconf("SC_PAGE_SIZE"))


def parse_minimum_free_memory_gib(value: str) -> float:
    try:
        minimum_gib = float(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("minimum free memory must be a number in GiB") from error
    if not math.isfinite(minimum_gib) or not LOW_MEMORY_OVERRIDE_FLOOR_GIB <= minimum_gib <= DEFAULT_MIN_FREE_MEMORY_GIB:
        raise argparse.ArgumentTypeError(
            f"minimum free memory must be between {LOW_MEMORY_OVERRIDE_FLOOR_GIB:g} and {DEFAULT_MIN_FREE_MEMORY_GIB:g} GiB"
        )
    return minimum_gib


def resource_preflight(path: Path, requested_memory_bytes: int) -> dict[str, int]:
    memory = free_physical_memory()
    disk = shutil.disk_usage(path).free
    if memory < requested_memory_bytes:
        raise RuntimeError(f"resource-preflight-memory:{memory}<{requested_memory_bytes}")
    if disk < MIN_FREE_DISK_BYTES:
        raise RuntimeError(f"resource-preflight-disk:{disk}<{MIN_FREE_DISK_BYTES}")
    return {"freePhysicalMemoryBytes": memory, "freeDiskBytes": disk}


def update_manifest(base, staging: Path, preflight: dict[str, int], requested_memory_bytes: int) -> dict[str, object]:
    manifest_path = staging / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["version"] = VERSION
    manifest["id"] = ID
    manifest["builder"] = {
        "script": "scripts/build-gaia-presentation-v272.py",
        "externalSort": "order3-spools-bounded-runs-kway-merge-and-source-high-byte-spools",
        "maximumRunRows": 250_000,
        "python": f"{sys.version_info.major}.{sys.version_info.minor}",
        "numpy": base.np.__version__,
        "astropyHealpix": base.astropy_healpix.__version__,
    }
    manifest["resourcePreflight"] = {
        **preflight,
        "defaultRequiredPhysicalMemoryBytes": DEFAULT_MIN_FREE_MEMORY_BYTES,
        "requestedPhysicalMemoryBytes": requested_memory_bytes,
        "requiredPhysicalMemoryBytes": requested_memory_bytes,
        "requiredDiskBytes": MIN_FREE_DISK_BYTES,
        "overrideApplied": requested_memory_bytes < DEFAULT_MIN_FREE_MEMORY_BYTES,
        "authorization": LOW_MEMORY_BUILD_AUTHORIZATION,
    }
    manifest["canonical"] = True
    manifest["presentationOnly"] = True
    manifest["surveyCompletenessClaim"] = "not-applied"
    manifest["livePhysicsMutation"] = "not-applied"
    manifest["workerPhysicsMutation"] = "not-applied"
    manifest["manifestSha256"] = base.canonical_sha({key: value for key, value in manifest.items() if key not in {"generatedAt", "manifestSha256"}})
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint-root", type=Path, default=Path("tools/asset-cache/gaia-dr3-presentation-v272-shards"))
    parser.add_argument("--output", type=Path, default=Path(f"dist/{ID}"))
    parser.add_argument("--public", type=Path, default=Path(f"public/data/{ID}"))
    parser.add_argument("--no-public", action="store_true")
    parser.add_argument("--bright", action="append", type=Path, default=[Path("public/data/gaia-dr3-nearby-46000-v255.json"), Path("public/data/gaia-dr3-bright-5000.json")])
    parser.add_argument(
        "--minimum-free-memory-gib",
        type=parse_minimum_free_memory_gib,
        default=DEFAULT_MIN_FREE_MEMORY_GIB,
        help="Explicit build preflight threshold in GiB (default 6; user-authorized floor 3)",
    )
    args = parser.parse_args()
    output = args.output.resolve()
    public = None if args.no_public else args.public.resolve()
    if output.exists():
        raise RuntimeError(f"Refusing to overwrite existing Gaia presentation output: {output}")
    output.parent.mkdir(parents=True, exist_ok=True)
    requested_memory_bytes = int(args.minimum_free_memory_gib * 1024**3)
    preflight = resource_preflight(output.parent, requested_memory_bytes)
    base = load_v9_builder()
    base.VERSION = VERSION
    base.ID = ID
    base.create_sorted_work = create_sorted_work
    base.write_source_index = write_source_index
    staging = output.with_name(output.name + ".v272-staged")
    if staging.exists():
        raise RuntimeError(f"Unresolved v272 staged output requires inspection: {staging}")
    build_args = argparse.Namespace(
        checkpoint_root=args.checkpoint_root,
        output=staging,
        public=None,
        target_rows=TARGET_ROWS,
        bright=args.bright,
    )
    base.build(build_args)
    manifest = update_manifest(base, staging, preflight, requested_memory_bytes)
    os.replace(staging, output)
    if public is not None:
        base.hardlink_tree(output, public)
    print(json.dumps({
        "passed": True,
        "version": manifest["version"],
        "rows": manifest["counts"]["presentation"],
        "archiveBytes": manifest["archive"]["byteLength"],
        "manifestSha256": manifest["manifestSha256"],
    }, indent=2))


if __name__ == "__main__":
    main()
