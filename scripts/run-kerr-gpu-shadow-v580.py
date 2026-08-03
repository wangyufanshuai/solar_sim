"""v580 CUDA float64 shadow bound to the qualified v579 CPU authority."""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
V569_SOURCE = ROOT / "scripts/run-kerr-gpu-shadow-v569.py"


def load_v569():
    spec = importlib.util.spec_from_file_location("orbit_atlas_v569_for_v580", V569_SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v569 GPU shadow implementation")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


ENGINE = load_v569()
CAMPAIGN = ROOT / "dist/science/kerr-campaign-v579"
STATE = CAMPAIGN / "campaign-state.json"
PLAN = CAMPAIGN / "ray-plan.json"
AGGREGATE = CAMPAIGN / "dense-aggregate.json"
OUT = ROOT / "dist/science/kerr-gpu-shadow-v580"
RECEIPT = OUT / "gpu-differential.json"

ENGINE.CAMPAIGN = CAMPAIGN
ENGINE.STATE = STATE
ENGINE.PLAN = PLAN
ENGINE.AGGREGATE = AGGREGATE
ENGINE.OUT = OUT
ENGINE.RECEIPT = RECEIPT


def preflight() -> dict[str, Any]:
    gate = ENGINE.preflight()
    return {
        **gate,
        "version": "v580-kerr-cuda-shadow-preflight-v1",
        "cpuAuthorityNamespace": "v579",
        "gpuShadowNamespace": "v580",
    }


def run() -> dict[str, Any]:
    gate = preflight()
    if not gate["eligible"]:
        raise RuntimeError("v580 GPU shadow refused until v579 CPU authority is 49/49 complete")
    receipt = ENGINE.run()
    unsigned = {key: value for key, value in receipt.items() if key != "receiptSha256"}
    unsigned.update({
        "version": "v580-kerr-cuda-float64-shadow-differential-v1",
        "cpuAuthorityNamespace": "v579",
        "gpuShadowNamespace": "v580",
        "cudaRuntimeProvision": "explicit-process-path-to-torch-bundled-cuda-12.8-dlls",
        "priorRuntimeBlockedAttempt": "nvrtc-dll-not-discoverable-no-receipt-written",
    })
    unsigned["boundary"] = {
        **unsigned["boundary"],
        "denseAuthorityNamespace": "v579",
        "gpuShadowNamespace": "v580",
        "v568V569V575EvidenceModified": False,
    }
    unsigned["sourceManifest"] = [
        *unsigned["sourceManifest"],
        {
            "path": Path(__file__).resolve().relative_to(ROOT).as_posix(),
            "sha256": ENGINE.file_sha(Path(__file__).resolve()),
        },
    ]
    qualified = {**unsigned, "receiptSha256": ENGINE.value_sha(unsigned)}
    ENGINE.atomic_json(RECEIPT, qualified)
    return qualified


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v580 Kerr CUDA shadow")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--preflight", action="store_true")
    group.add_argument("--run", action="store_true")
    args = parser.parse_args()
    value = preflight() if args.preflight else run()
    print(json.dumps(value, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
