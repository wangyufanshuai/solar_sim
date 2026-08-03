from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/run-kerr-gpu-shadow-v580.py"


def load_module():
    spec = importlib.util.spec_from_file_location("orbit_atlas_gpu_v580_tests", SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v580 GPU shadow")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V580 = load_module()


class KerrGpuShadowV580Tests(unittest.TestCase):
    def test_preflight_is_bound_to_qualified_v579_aggregate(self) -> None:
        gate = V580.preflight()
        self.assertEqual(gate["cpuAuthorityNamespace"], "v579")
        self.assertEqual(gate["gpuShadowNamespace"], "v580")
        self.assertTrue(gate["eligible"])
        self.assertFalse(gate["gpuScientificPayloadWritebackAllowed"])

    def test_paths_use_new_namespaces(self) -> None:
        self.assertEqual(V580.CAMPAIGN.name, "kerr-campaign-v579")
        self.assertEqual(V580.OUT.name, "kerr-gpu-shadow-v580")
        self.assertEqual(V580.ENGINE.AGGREGATE, V580.AGGREGATE)
        self.assertEqual(V580.ENGINE.RECEIPT, V580.RECEIPT)

    def test_float64_thresholds_remain_unchanged(self) -> None:
        self.assertLessEqual(V580.ENGINE.THRESHOLDS["energyAbs"], 5e-13)
        self.assertLessEqual(V580.ENGINE.THRESHOLDS["carterAbs"], 5e-11)
        self.assertIn("double", V580.ENGINE.CUDA_SOURCE)
        self.assertNotIn("float ", V580.ENGINE.CUDA_SOURCE)


if __name__ == "__main__":
    unittest.main()
