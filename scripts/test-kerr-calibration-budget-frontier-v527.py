from __future__ import annotations
import hashlib,json,unittest
from pathlib import Path
from typing import Any
ROOT=Path.cwd(); ARTIFACT=ROOT/"dist/science/kerr-calibration-budget-frontier-v527/frontier.json"; TRANSIENT={"generatedAt","artifactSha256","payloadSha256","evidenceSha256","pointerSha256","stageChainSha256"}
def canonicalize(value:Any)->Any:
    if isinstance(value,list): return [canonicalize(entry) for entry in value]
    if isinstance(value,dict): return {key:canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value
def canonical_sha(value:Any)->str: return hashlib.sha256(json.dumps(canonicalize(value),ensure_ascii=False,separators=(",",":"),sort_keys=True).encode("utf-8")).hexdigest()
class KerrCalibrationBudgetFrontierV527Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls)->None: cls.artifact=json.loads(ARTIFACT.read_text(encoding="utf-8"))
    def test_canonical_frontier_counts(self)->None:
        a=self.artifact; self.assertEqual(canonical_sha(a),a["artifactSha256"]); self.assertEqual(a["counts"]["stochasticFrontierSampleCount"],33); self.assertEqual(a["counts"]["deterministicFrontierSampleCount"],33); self.assertEqual(a["counts"]["correlationSurfaceRowCount"],165); self.assertEqual(a["counts"]["vertexEvaluations"],2112)
    def test_stochastic_frontier_preserves_unit_target_variance(self)->None:
        for row in self.artifact["stochasticVarianceFrontier"]["samples"]: self.assertAlmostEqual(float(row["qVariancePerTargetVariance"]),1.0); self.assertAlmostEqual(float(row["uVariancePerTargetVariance"]),1.0); self.assertFalse(row["physicalScaleAvailable"])
    def test_deterministic_frontier_preserves_unit_target_bound(self)->None:
        for row in self.artifact["deterministicBoundFrontier"]["samples"]: self.assertAlmostEqual(float(row["maximumQPerTargetBound"]),1.0); self.assertAlmostEqual(float(row["maximumUPerTargetBound"]),1.0); self.assertAlmostEqual(float(row["maximumJointL2PerTargetBound"]),2**0.5); self.assertEqual(row["vertexCount"],64)
    def test_no_allocation_or_physical_authority_is_invented(self)->None:
        a=self.artifact; self.assertIsNone(a["stochasticVarianceFrontier"]["selectedSampleIndex"]); self.assertIsNone(a["deterministicBoundFrontier"]["selectedSampleIndex"]); self.assertFalse(a["allocationBoundary"]["recommendedAllocationAvailable"]); self.assertFalse(a["qualification"]["physicalBudgetQualified"]); self.assertEqual(a["acquisitionBoundary"]["readyMeasuredFileCount"],0)
if __name__=="__main__": unittest.main()
