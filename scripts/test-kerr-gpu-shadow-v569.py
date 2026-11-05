from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/run-kerr-gpu-shadow-v569.py"


def load_module():
    spec = importlib.util.spec_from_file_location("orbit_atlas_gpu_v569_tests", SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v569 GPU shadow")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V569 = load_module()


class KerrGpuShadowV569Tests(unittest.TestCase):
    def test_preflight_is_tied_to_exact_dense_completion(self) -> None:
        gate = V569.preflight()
        self.assertEqual(gate["eligible"], gate["completedShardCount"] == 49 and gate["aggregateAvailable"] is True)
        self.assertFalse(gate["gpuScientificPayloadWritebackAllowed"])

    def test_thresholds_are_preregistered_and_float64_strict(self) -> None:
        self.assertLessEqual(V569.THRESHOLDS["energyAbs"], 5e-13)
        self.assertLessEqual(V569.THRESHOLDS["carterAbs"], 5e-11)
        self.assertIn("double", V569.CUDA_SOURCE)
        self.assertNotIn("float ", V569.CUDA_SOURCE)


if __name__ == "__main__":
    unittest.main()
