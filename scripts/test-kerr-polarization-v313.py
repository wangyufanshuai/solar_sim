from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/run-kerr-polarization-v313.py"
ARTIFACT = ROOT / "dist/science/kerr-reference-v313/polarization-short-gate.json"


def load_module():
    spec = importlib.util.spec_from_file_location("orbit_atlas_kerr_v313_tests", SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v313 authority")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V313 = load_module()


class KerrPolarizationV313Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.authority = json.loads(ARTIFACT.read_text(encoding="utf-8"))

    def test_canonical_and_geometry_lock(self) -> None:
        unsigned = {key: value for key, value in self.authority.items() if key != "evidenceSha256"}
        self.assertEqual(V313.value_sha(unsigned), self.authority["evidenceSha256"])
        self.assertEqual(self.authority["geometryEvidenceSha256"], V313.EXPECTED_V312_EVIDENCE_SHA)
        self.assertEqual(self.authority["evidenceSha256"], "e4b6044ed828f31b7eb511b4e722bc474414acdcab8cedbdf16484b20216ae6f")

    def test_applicability_and_branch_determinism(self) -> None:
        payloads = self.authority["payloads"]
        self.assertEqual(len(payloads), 16)
        self.assertEqual(self.authority["captureEscapeNotApplicableCount"], 96)
        groups: dict[tuple[str, str], list[dict]] = {}
        for row in payloads:
            self.assertEqual(row["applicability"], "applicable-disk-hit")
            self.assertTrue(row["passed"])
            groups.setdefault((row["rayId"], row["toleranceClass"]), []).append(row)
        self.assertEqual(len(groups), 8)
        for pair in groups.values():
            self.assertEqual(len(pair), 2)
            left = {key: value for key, value in pair[0].items() if key != "branch"}
            right = {key: value for key, value in pair[1].items() if key != "branch"}
            self.assertEqual(left, right)

    def test_thresholds_and_release_boundary(self) -> None:
        self.assertTrue(all(self.authority["gates"].values()))
        self.assertLess(self.authority["thresholds"]["maxReleaseEvpaDifferenceDeg"], 0.5)
        self.assertLess(self.authority["thresholds"]["maxInternalEvpaDifferenceDeg"], 0.1)
        self.assertGreater(self.authority["resource"]["peakRssGiB"], 0)
        self.assertLess(self.authority["resource"]["peakRssGiB"], 2)
        self.assertEqual(self.authority["release"]["formalProductPointer"], "v263")
        self.assertFalse(self.authority["release"]["correctedDenseCampaignCreated"])
        self.assertFalse(self.authority["release"]["correctedDenseShardExecuted"])


if __name__ == "__main__":
    unittest.main()
