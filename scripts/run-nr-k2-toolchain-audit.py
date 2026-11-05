"""Audit the currently callable CPU/GPU toolchains for NR-K2/K4 gates.

Finding a compiler executable is not enough: this probe also compiles a tiny
C++17 translation unit and a tiny OpenMP translation unit.  The result is an
environment receipt only; it never promotes a solver or claims CUDA support.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile


def _source_digest() -> str:
    path = Path(__file__).resolve()
    digest = hashlib.sha256()
    digest.update(path.name.encode("utf-8"))
    digest.update(path.read_bytes())
    return digest.hexdigest()


def _run_version(command: str) -> dict[str, object]:
    executable = shutil.which(command)
    if executable is None:
        return {"path": None, "version_returncode": None, "version": "missing"}
    result = subprocess.run(
        [executable, "--version"],
        capture_output=True,
        text=True,
        check=False,
        timeout=20,
    )
    output = (result.stdout or result.stderr).strip().splitlines()
    return {
        "path": str(Path(executable).resolve()),
        "version_returncode": int(result.returncode),
        "version": output[0] if output else "",
    }


def _compile_probe(executable: str | None, *, openmp: bool) -> dict[str, object]:
    if executable is None:
        return {"available": False, "returncode": None, "stderr": "missing"}
    with tempfile.TemporaryDirectory(prefix="nr-k2-toolchain-") as directory:
        root = Path(directory)
        source = root / "probe.cpp"
        binary = root / "probe.exe"
        if openmp:
            source.write_text(
                "#include <omp.h>\n"
                "int main() {\n"
                "#ifdef _OPENMP\n"
                "  return omp_get_max_threads() > 0 ? 0 : 1;\n"
                "#else\n"
                "  return 1;\n"
                "#endif\n"
                "}\n",
                encoding="utf-8",
            )
        else:
            # Keep the C++17 gate independent from OpenMP headers/libraries.
            # A compiler may support the language standard while OpenMP is
            # unavailable; conflating the probes would hide that useful fact.
            source.write_text(
                "#include <array>\n"
                "int main() {\n"
                "  constexpr std::array<int, 2> value{1, 2};\n"
                "  return value[0] + value[1] == 3 ? 0 : 1;\n"
                "}\n",
                encoding="utf-8",
            )
        command = [executable, "-std=c++17"]
        if openmp:
            command.append("-fopenmp")
        command.extend([str(source), "-o", str(binary)])
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=False,
            timeout=60,
        )
        error = (result.stderr or result.stdout).strip()
        return {
            "available": result.returncode == 0 and binary.is_file(),
            "returncode": int(result.returncode),
            "stderr": error[:500],
        }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    gxx = _run_version("g++")
    clangxx = _run_version("clang++")
    cl = _run_version("cl")
    nvcc = _run_version("nvcc")
    gxx_path = gxx["path"]
    gxx_executable = str(gxx_path) if isinstance(gxx_path, str) else None
    cpp17 = _compile_probe(gxx_executable, openmp=False)
    openmp = _compile_probe(gxx_executable, openmp=True)
    receipt = {
        "benchmark": "nr-k2-k4-toolchain-audit",
        "schema_version": "nr-k2-toolchain-audit-v2-independent-probes",
        "source_digest": _source_digest(),
        "compilers": {
            "g++": gxx,
            "clang++": clangxx,
            "cl": cl,
            "nvcc": nvcc,
        },
        "probes": {
            "cpp17_compile": cpp17,
            "openmp_compile": openmp,
        },
        "validation": {
            "cpp17_toolchain_usable": bool(cpp17["available"]),
            "openmp_toolchain_usable": bool(openmp["available"]),
            "cuda_toolchain_usable": bool(
                nvcc["path"] is not None and nvcc["version_returncode"] == 0
            ),
            "promotion": "blocked-pending-current-cpu-toolchain-validation",
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(receipt, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "output": str(args.output.resolve()),
                "cpp17_toolchain_usable": receipt["validation"]["cpp17_toolchain_usable"],
                "openmp_toolchain_usable": receipt["validation"]["openmp_toolchain_usable"],
                "cuda_toolchain_usable": receipt["validation"]["cuda_toolchain_usable"],
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
