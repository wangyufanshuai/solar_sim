from __future__ import annotations

import importlib.util
import math
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[1]


def load(name: str, file: str):
    path = ROOT / "scripts" / file
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot import {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


V8 = load("atlas_kerr_dense_v8_contract", "run-kerr-dense-shards-v8.py")
GATE = load("atlas_kerr_gate_v8_contract", "run-kerr-science-gate-v8.py")


class KerrDenseV8ContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.args = SimpleNamespace(profile="release", watchdog_seconds=180)
        cls.plan = V8.build_plan(cls.args)

    def test_plan_identity_and_counts(self) -> None:
        self.assertEqual(self.plan["version"], "v248-kerr-dense-finite-observer-sharded-v8")
        self.assertEqual(len(self.plan["rays"]), 3097)
        self.assertEqual(self.plan["shardCount"], 49)
        self.assertEqual(
            self.plan["finiteObserverScreenManifestSha256"],
            "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037",
        )

    def test_noncritical_ray_inputs_match_v6(self) -> None:
        v6 = V8.V6.build_plan(self.args)
        for current, historical in zip(self.plan["rays"][:2073], v6["rays"][:2073]):
            self.assertEqual(current, historical)

    def test_v8_critical_directions_are_manifest_backed(self) -> None:
        critical = self.plan["rays"][2073:]
        self.assertEqual(len(critical), 1024)
        for index in (0, 1, 256, 257, 512, 513, 768, 769, 1022, 1023):
            ray = critical[index]
            self.assertEqual(ray["direction"], ray["source"]["direction"])
            radius = math.hypot(float(ray["source"]["screenX"]), float(ray["source"]["screenY"]))
            center = math.hypot(float(ray["source"]["centerScreenX"]), float(ray["source"]["centerScreenY"]))
            expected = 2.0 * float(ray["source"]["offsetPx"]) / 900.0
            self.assertLess(abs((radius - center) - expected), 1e-14)

    def test_gate_selection_is_fixed_and_isolated(self) -> None:
        selected = GATE.selected_rays(self.plan)
        self.assertEqual(len(selected), 16)
        self.assertEqual(sum(ray["rayClass"] == "critical-bracket" for ray in selected), 10)
        self.assertEqual({int(ray["source"]["pair"]) for ray in selected if ray["rayClass"] == "critical-bracket"}, {0, 128, 256, 384, 511})


if __name__ == "__main__":
    unittest.main()

