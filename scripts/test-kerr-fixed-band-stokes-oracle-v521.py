from __future__ import annotations

import hashlib
import json
import unittest
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
ARTIFACT = ROOT / "dist/science/kerr-fixed-band-stokes-oracle-v521/oracle.json"
TRANSIENT = {
    "generatedAt",
    "artifactSha256",
    "payloadSha256",
    "evidenceSha256",
    "pointerSha256",
    "stageChainSha256",
}


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {
            key: canonicalize(value[key])
            for key in sorted(value)
            if key not in TRANSIENT
        }
    return value


def canonical_sha(value: Any) -> str:
    return hashlib.sha256(
        json.dumps(
            canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True
        ).encode("utf-8")
    ).hexdigest()


class KerrFixedBandStokesOracleV521Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))

    def test_canonical_identity_and_direct_integral_coverage(self) -> None:
        artifact = self.artifact
        self.assertEqual(canonical_sha(artifact), artifact["artifactSha256"])
        self.assertEqual(artifact["counts"]["rowCount"], 24)
        self.assertEqual(artifact["counts"]["directAdaptiveIntegralCount"], 144)
        self.assertEqual(len(artifact["rows"]), 24)
        self.assertFalse(artifact["oracle"]["v520IntegratedValuesConsumedAsInputs"])
        self.assertTrue(artifact["oracle"]["v520ValuesUsedForComparisonOnly"])

    def test_all_six_component_differences_are_below_limit(self) -> None:
        maxima = self.artifact["maxima"]
        limit = float(self.artifact["limits"]["directVsV520ComponentRelative"])
        for key in (
            "directVsV520EnergyIRelative",
            "directVsV520EnergyQRelative",
            "directVsV520EnergyURelative",
            "directVsV520PhotonIRelative",
            "directVsV520PhotonQRelative",
            "directVsV520PhotonURelative",
        ):
            self.assertLess(float(maxima[key]), limit)

    def test_componentwise_uncertainty_never_claims_independence_or_rss(self) -> None:
        policy = self.artifact["uncertaintyPolicy"]
        self.assertTrue(policy["componentwiseOnly"])
        self.assertFalse(policy["crossChannelIndependenceProven"])
        self.assertFalse(policy["rssApplied"])
        self.assertFalse(policy["scalarTotalAvailable"])
        for row in self.artifact["rows"]:
            envelope = row["uncertaintyEnvelope"]
            self.assertFalse(envelope["crossChannelIndependenceProven"])
            self.assertFalse(envelope["rssApplied"])
            self.assertFalse(envelope["scalarTotalAvailable"])

    def test_measurement_dense_and_product_boundaries_remain_closed(self) -> None:
        artifact = self.artifact
        self.assertEqual(artifact["counts"]["measuredStokesRowCount"], 0)
        self.assertEqual(artifact["counts"]["circularStokesRowCount"], 0)
        self.assertFalse(artifact["boundary"]["measuredPolarimeterAvailable"])
        self.assertFalse(artifact["boundary"]["scienceRasterAuthorityAvailable"])
        self.assertEqual(artifact["boundary"]["denseCampaignStatus"], "incomplete-0-of-49")
        self.assertEqual(artifact["boundary"]["formalProductPointer"], "v263")


if __name__ == "__main__":
    unittest.main()
