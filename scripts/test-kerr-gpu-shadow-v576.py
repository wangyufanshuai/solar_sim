from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/run-kerr-gpu-shadow-v576.py"


def load_module():
    spec = importlib.util.spec_from_file_location("orbit_atlas_gpu_v576_tests", SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v576 GPU shadow")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V576 = load_module()


class KerrGpuShadowV576Tests(unittest.TestCase):
    def test_preflight_is_bound_to_v575_completion(self) -> None:
        gate = V576.preflight()
        self.assertEqual(gate["cpuAuthorityNamespace"], "v575")
        self.assertEqual(gate["gpuShadowNamespace"], "v576")
        self.assertEqual(
            gate["eligible"],
            gate["completedShardCount"] == 49
            and gate["aggregateAvailable"] is True
            and V576.AGGREGATE.is_file(),
        )
        self.assertFalse(gate["gpuScientificPayloadWritebackAllowed"])

    def test_paths_do_not_reuse_v568_or_v569_namespace(self) -> None:
        self.assertEqual(V576.CAMPAIGN.name, "kerr-campaign-v575")
        self.assertEqual(V576.OUT.name, "kerr-gpu-shadow-v576")
        self.assertEqual(V576.ENGINE.AGGREGATE, V576.AGGREGATE)
        self.assertEqual(V576.ENGINE.RECEIPT, V576.RECEIPT)

    def test_float64_thresholds_remain_unchanged(self) -> None:
        self.assertLessEqual(V576.ENGINE.THRESHOLDS["energyAbs"], 5e-13)
        self.assertLessEqual(V576.ENGINE.THRESHOLDS["carterAbs"], 5e-11)
        self.assertIn("double", V576.ENGINE.CUDA_SOURCE)
        self.assertNotIn("float ", V576.ENGINE.CUDA_SOURCE)


if __name__ == "__main__":
    unittest.main()
