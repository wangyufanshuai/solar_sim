"""Low-memory structural tests for the executable v298r1 campaign."""

from __future__ import annotations

import importlib.util
import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/run-kerr-dense-campaign-v298r1.py"


def load_campaign():
    spec = importlib.util.spec_from_file_location("orbit_atlas_v298r1_test_target", SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v298r1 controller")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


CAMPAIGN = load_campaign()


class KerrDenseCampaignV298R1Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.authority = CAMPAIGN.load_authority()
        cls.rays = CAMPAIGN.build_rays(cls.authority["geometry"])

    def test_ray_strata_and_identity_are_exact(self) -> None:
        self.assertEqual(len(self.rays), 3097)
        counts: dict[str, int] = {}
        for index, ray in enumerate(self.rays):
            self.assertEqual(ray.rayIndex, index)
            counts[ray.stratum] = counts.get(ray.stratum, 0) + 1
        self.assertEqual(counts, {
            "canonical": 16,
            "critical-band": 560,
            "disk-band": 840,
            "uniform-field": 1681,
        })
        self.assertEqual([ray.rayId for ray in self.rays[:16]], [fixture.ray_id for fixture in CAMPAIGN.BASE.FIXTURES])

    def test_shards_cover_every_ray_without_overlap(self) -> None:
        shards = CAMPAIGN.shard_plan()
        self.assertEqual(len(shards), 49)
        self.assertTrue(all(shard["rayCount"] == 64 for shard in shards[:10]))
        self.assertTrue(all(shard["rayCount"] == 63 for shard in shards[10:]))
        cursor = 0
        for shard in shards:
            self.assertEqual(shard["rayStart"], cursor)
            self.assertEqual(shard["rayEndExclusive"] - shard["rayStart"], shard["rayCount"])
            cursor = shard["rayEndExclusive"]
        self.assertEqual(cursor, 3097)

    def test_stream_checkpoint_rejects_reordered_or_corrupt_rows(self) -> None:
        expected = [CAMPAIGN.asdict(ray) for ray in self.rays[:2]]
        shard = ROOT / "dist/science/kerr-campaign-v298r1/shards/shard-00.ndjson"
        row = json.loads(shard.read_text(encoding="utf-8").splitlines()[0])
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "shard.part"
            path.write_text(json.dumps(row) + "\n", encoding="utf-8")
            self.assertEqual(CAMPAIGN.verify_part(path, expected), 1)
            row["rayIndex"] = 1
            unsigned = {key: value for key, value in row.items() if key != "raySha256"}
            row["raySha256"] = CAMPAIGN.value_sha(unsigned)
            path.write_text(json.dumps(row) + "\n", encoding="utf-8")
            with self.assertRaises(RuntimeError):
                CAMPAIGN.verify_part(path, expected)

    def test_ray_validator_rejects_matrix_ab_and_observable_corruption(self) -> None:
        shard = ROOT / "dist/science/kerr-campaign-v298r1/shards/shard-00.ndjson"
        rows = [json.loads(line) for line in shard.read_text(encoding="utf-8").splitlines() if line]
        capture = copy.deepcopy(rows[0])
        disk = copy.deepcopy(next(row for row in rows if row["classifications"] == ["disk-hit"]))
        duplicate = copy.deepcopy(capture)
        duplicate["executions"][2]["branch"] = "A"
        with self.assertRaisesRegex(RuntimeError, "duplicate execution matrix"):
            CAMPAIGN.validate_ray_result(duplicate, CAMPAIGN.asdict(self.rays[duplicate["rayIndex"]]))
        nondeterministic = copy.deepcopy(capture)
        nondeterministic["executions"][2]["stepCount"] += 1
        with self.assertRaisesRegex(RuntimeError, "A/B payload is nondeterministic"):
            CAMPAIGN.validate_ray_result(nondeterministic, CAMPAIGN.asdict(self.rays[nondeterministic["rayIndex"]]))
        unavailable_redshift = copy.deepcopy(disk)
        unavailable_redshift["executions"][0]["redshift"] = None
        with self.assertRaisesRegex(RuntimeError, "disk redshift is unavailable"):
            CAMPAIGN.validate_ray_result(unavailable_redshift, CAMPAIGN.asdict(self.rays[unavailable_redshift["rayIndex"]]))
        unavailable_polarization = copy.deepcopy(disk)
        unavailable_polarization["executions"][0]["polarization"] = {"applicability": "unavailable"}
        with self.assertRaisesRegex(RuntimeError, "Carter disk polarization is unavailable"):
            CAMPAIGN.validate_ray_result(unavailable_polarization, CAMPAIGN.asdict(self.rays[unavailable_polarization["rayIndex"]]))

    def test_published_shard_builds_a_traceable_qualification_summary(self) -> None:
        shard = ROOT / "dist/science/kerr-campaign-v298r1/shards/shard-00.ndjson"
        rows = [json.loads(line) for line in shard.read_text(encoding="utf-8").splitlines() if line]
        metrics = CAMPAIGN.new_dense_metrics()
        for row in rows:
            CAMPAIGN.validate_ray_result(row, CAMPAIGN.asdict(self.rays[row["rayIndex"]]))
            CAMPAIGN.accumulate_dense_metrics(metrics, row)
        qualification = CAMPAIGN.finalize_dense_metrics(metrics, 64, scope="shard")
        self.assertTrue(qualification["qualified"])
        self.assertEqual(qualification["rayCount"], 64)
        self.assertEqual(qualification["executionCount"], 512)
        self.assertEqual(qualification["abCanonicalPairCount"], 256)
        self.assertGreater(qualification["redshiftComparisonCount"], 0)
        self.assertEqual(qualification["polarizationApplicabilityCounts"]["unavailable"], 0)
        self.assertGreaterEqual(qualification["classificationAgreement"], 0.999)
        corrupted = copy.deepcopy(metrics)
        corrupted["executionCount"] -= 1
        with self.assertRaisesRegex(RuntimeError, "executionConservation"):
            CAMPAIGN.finalize_dense_metrics(corrupted, 64, scope="shard")

    def test_authority_envelope_is_locked_and_qualified(self) -> None:
        identity = self.authority["identity"]
        self.assertEqual(len(identity), 8)
        self.assertTrue(all(len(value) == 64 for value in identity.values()))
        self.assertEqual(self.authority["envelope"]["status"], "full-kerr-short-authority-qualified")

    def test_rss_probe_returns_positive_bounded_measurement(self) -> None:
        peak = CAMPAIGN.process_rss_bytes()
        self.assertEqual(CAMPAIGN.RSS_PROBE_VERSION, "process-peak-working-set-v298r1-r2")
        self.assertGreater(peak, 0)
        self.assertLess(peak, 2 * 2**30)

    def test_read_only_rss_probe_does_not_consume_campaign_attempt(self) -> None:
        result = CAMPAIGN.rss_probe()
        self.assertEqual(result["version"], "v298r1-kerr-dense-rss-probe-v1")
        self.assertEqual(result["status"], "rss-probe-verified")
        self.assertTrue(result["gate"])
        self.assertFalse(result["attemptConsumed"])
        self.assertEqual(result["campaignStatus"], "incomplete-1-of-49")
        self.assertEqual(result["campaignAttemptConsumed"], True)


if __name__ == "__main__":
    unittest.main()
