from __future__ import annotations

import hashlib
import json
import unittest
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
ARTIFACT = ROOT / "dist/science/kerr-polarization-frequency-sensitivity-v522/envelope.json"
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


class KerrPolarizationFrequencySensitivityV522Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))

    def test_canonical_scenario_and_integral_coverage(self) -> None:
        artifact = self.artifact
        self.assertEqual(canonical_sha(artifact), artifact["artifactSha256"])
        self.assertEqual(artifact["counts"]["scenarioCount"], 9)
        self.assertEqual(artifact["counts"]["scenarioRowCount"], 216)
        self.assertEqual(artifact["counts"]["envelopeRowCount"], 24)
        self.assertEqual(artifact["counts"]["directAdaptiveIntegralCount"], 888)
        self.assertEqual(canonical_sha(artifact["scenarioPlan"]), artifact["scenarioPlanSha256"])

    def test_baseline_reconstructs_v521_below_frozen_limit(self) -> None:
        maxima = self.artifact["maxima"]
        limit = float(self.artifact["limits"]["baselineVsV521ComponentRelative"])
        for key in (
            "baselineVsV521EnergyIRelative",
            "baselineVsV521EnergyQRelative",
            "baselineVsV521EnergyURelative",
            "baselineVsV521PhotonIRelative",
            "baselineVsV521PhotonQRelative",
            "baselineVsV521PhotonURelative",
        ):
            self.assertLess(float(maxima[key]), limit)

    def test_sensitivity_is_not_promoted_to_probability_or_physical_prior(self) -> None:
        artifact = self.artifact
        self.assertEqual(artifact["model"]["perturbationCalibration"], "unavailable")
        self.assertEqual(artifact["model"]["physicalPrior"], "unavailable")
        self.assertFalse(artifact["qualification"]["physicalPriorQualified"])
        self.assertFalse(artifact["qualification"]["scienceAuthorityPromotionAllowed"])
        self.assertFalse(artifact["uncertaintyPolicy"]["probabilityDistributionAvailable"])
        self.assertFalse(artifact["uncertaintyPolicy"]["rssApplied"])
        self.assertFalse(artifact["uncertaintyPolicy"]["scalarTotalAvailable"])

    def test_measurement_dense_and_product_boundaries_remain_closed(self) -> None:
        artifact = self.artifact
        self.assertEqual(artifact["counts"]["measuredStokesRowCount"], 0)
        self.assertFalse(artifact["boundary"]["measuredPolarimeterAvailable"])
        self.assertFalse(artifact["boundary"]["scienceRasterAuthorityAvailable"])
        self.assertEqual(artifact["boundary"]["denseCampaignStatus"], "incomplete-0-of-49")
        self.assertEqual(artifact["boundary"]["formalProductPointer"], "v263")


if __name__ == "__main__":
    unittest.main()
