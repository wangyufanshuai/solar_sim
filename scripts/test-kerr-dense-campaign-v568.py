from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/run-kerr-dense-campaign-v568.py"


def load_module():
    spec = importlib.util.spec_from_file_location("orbit_atlas_kerr_v568_tests", SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v568 controller")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V568 = load_module()


class KerrDenseCampaignV568Tests(unittest.TestCase):
    def test_envelope_preserves_science_authority_and_classifies_only_two_drifts(self) -> None:
        state = V568.status()
        envelope = V568.read_verified(V568.ENVELOPE, "envelopeSha256")
        drifts = {row["path"] for row in envelope["sourceManifest"] if row["status"] != "historical-match"}
        self.assertEqual(drifts, set(V568.ALLOWED_NON_NUMERICAL_DRIFT))
        self.assertEqual(envelope["numericalAuthoritySourceDriftCount"], 0)
        self.assertEqual(state["formalProductPointer"], "v263")
        self.assertFalse(state["automaticRetryApplied"])

    def test_state_and_published_shards_are_a_valid_serial_prefix(self) -> None:
        state = V568.status()
        plan = V568.read_verified(V568.PLAN, "planSha256")
        completed = V568.completed_shards({**state, "completedShardIndices": None}, plan)
        self.assertEqual(completed, list(range(len(completed))))
        self.assertEqual(state["completedShardIndices"], completed)
        self.assertEqual(state["completedShardCount"], len(completed))
        self.assertEqual(len(plan["rays"]), 3097)
        self.assertEqual(len(plan["shards"]), 49)

    def test_evaluation_is_deterministic_and_does_not_mutate_campaign_state(self) -> None:
        state_before = V568.STATE.read_bytes()
        plan = V568.read_verified(V568.PLAN, "planSha256")
        row_a = V568.evaluate_ray(plan["rays"][0])
        row_b = V568.evaluate_ray(plan["rays"][0])
        self.assertEqual(row_a["raySha256"], row_b["raySha256"])
        self.assertEqual(row_a["executionCount"], 8)
        self.assertEqual(V568.STATE.read_bytes(), state_before)

    def test_partial_aggregate_is_refused_without_state_mutation(self) -> None:
        state = json.loads(V568.STATE.read_text(encoding="utf-8"))
        if state["completedShardCount"] < 49:
            state_before = V568.STATE.read_bytes()
            with self.assertRaisesRegex(RuntimeError, "partial aggregate refused"):
                V568.aggregate()
            self.assertEqual(V568.STATE.read_bytes(), state_before)


if __name__ == "__main__":
    unittest.main()
