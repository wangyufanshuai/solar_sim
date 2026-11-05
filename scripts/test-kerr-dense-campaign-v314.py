from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/run-kerr-dense-campaign-v314.py"


def load_module():
    spec = importlib.util.spec_from_file_location("orbit_atlas_kerr_v314_tests", SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v314 controller")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V314 = load_module()


class KerrDenseCampaignV314Tests(unittest.TestCase):
    def test_plan_state_and_aggregate_are_fail_closed(self) -> None:
        state_before = V314.STATE.read_bytes()
        state = json.loads(state_before)
        plan = V314.read_verified(V314.PLAN, "planSha256")
        with self.assertRaisesRegex(RuntimeError, "v313 envelope source manifest drift"):
            V314.status()
        with self.assertRaisesRegex(RuntimeError, "v313 envelope source manifest drift"):
            V314.aggregate_check()
        self.assertEqual(V314.STATE.read_bytes(), state_before)
        self.assertEqual(state["status"], "incomplete-0-of-49")
        self.assertEqual(state["controllerImplementation"], "v312-v313-locked-streaming-ndjson-v1")
        self.assertFalse(state["attemptConsumed"])
        self.assertFalse(state["runNextAvailable"])
        self.assertEqual(len(plan["rays"]), 3097)
        self.assertEqual(len(plan["shards"]), 49)

    def test_authorization_dry_run_never_mutates_state(self) -> None:
        state_before = V314.STATE.read_bytes()
        with self.assertRaisesRegex(RuntimeError, "v313 envelope source manifest drift"):
            V314.run_next_dry_run(None)
        with self.assertRaisesRegex(RuntimeError, "v313 envelope source manifest drift"):
            V314.run_next_dry_run("v314-shard-0-attempt-1")
        self.assertEqual(V314.STATE.read_bytes(), state_before)

    def test_corrected_capture_and_disk_fixtures_use_distinct_solver_tolerances(self) -> None:
        plan = V314.read_verified(V314.PLAN, "planSha256")
        capture = V314.evaluate_ray(plan["rays"][0])
        disk = V314.evaluate_ray(next(ray for ray in plan["rays"] if ray["rayId"] == "disk-00"))
        for result in (capture, disk):
            self.assertEqual(result["executionCount"], 8)
            self.assertEqual({row["formulation"] for row in result["executions"]}, {V314.CARTER_FORMULATION, V314.KS_FORMULATION})
            self.assertEqual(len({row["solverTolerance"] for row in result["executions"]}), 2)
            self.assertEqual(result["authority"], {"fullShort": V314.FULL_SHORT_AUTHORITY_SHA, "geometry": V314.EXPECTED_GEOMETRY_SHA, "polarization": V314.EXPECTED_POLARIZATION_SHA})
        applicable = [row["polarization"] for row in disk["executions"] if row["polarization"]["applicability"] == "applicable-disk-hit"]
        self.assertEqual(len(applicable), 4)
        self.assertLess(max(row["evpaDifferenceDeg"] for row in applicable), 0.5)
        self.assertFalse(V314.SHARDS.exists())


if __name__ == "__main__":
    unittest.main()
