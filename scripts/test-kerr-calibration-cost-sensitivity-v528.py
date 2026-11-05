from __future__ import annotations
import hashlib,json,unittest
from pathlib import Path
from typing import Any
ROOT=Path.cwd();ARTIFACT=ROOT/"dist/science/kerr-calibration-cost-sensitivity-v528/sensitivity.json";TRANSIENT={"generatedAt","artifactSha256","payloadSha256","evidenceSha256","pointerSha256","stageChainSha256"}
def canonicalize(value:Any)->Any:
    if isinstance(value,list):return[canonicalize(entry)for entry in value]
    if isinstance(value,dict):return{key:canonicalize(value[key])for key in sorted(value)if key not in TRANSIENT}
    return value
def canonical_sha(value:Any)->str:return hashlib.sha256(json.dumps(canonicalize(value),ensure_ascii=False,separators=(",",":"),sort_keys=True).encode("utf-8")).hexdigest()
class KerrCalibrationCostSensitivityV528Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls)->None:cls.artifact=json.loads(ARTIFACT.read_text(encoding="utf-8"))
    def test_canonical_counts(self)->None:a=self.artifact;self.assertEqual(canonical_sha(a),a["artifactSha256"]);self.assertEqual(a["counts"]["costSensitivitySampleCount"],34);self.assertEqual(a["counts"]["optimizerIterationCount"],17408)
    def test_equal_cost_anchor_is_balanced(self)->None:
        s=self.artifact["stochasticCostSensitivity"]["samples"][8];d=self.artifact["deterministicCostSensitivity"]["samples"][8];self.assertEqual(float(s["calibrationToScienceCostWeight"]),1);self.assertAlmostEqual(float(s["scienceVarianceFraction"]),.5);self.assertAlmostEqual(float(s["calibrationVarianceFraction"]),.5);self.assertAlmostEqual(float(d["scienceBoundPerTargetBound"])+float(d["calibrationBoundPerTargetBound"])/(2**.5),1)
    def test_cost_ratio_monotonically_shifts_budget(self)->None:
        rows=self.artifact["stochasticCostSensitivity"]["samples"];self.assertTrue(all(float(rows[i]["scienceVarianceFraction"])>float(rows[i+1]["scienceVarianceFraction"])for i in range(len(rows)-1)))
    def test_cost_law_and_selection_remain_unqualified(self)->None:a=self.artifact;self.assertFalse(a["assumedCostLaw"]["inverseSquareLawValidatedForInstrument"]);self.assertIsNone(a["stochasticCostSensitivity"]["selectedSampleIndex"]);self.assertFalse(a["selectionBoundary"]["recommendedAllocationAvailable"]);self.assertFalse(a["qualification"]["operationalCostModelQualified"]);self.assertEqual(a["acquisitionBoundary"]["readyMeasuredFileCount"],0)
if __name__=="__main__":unittest.main()
