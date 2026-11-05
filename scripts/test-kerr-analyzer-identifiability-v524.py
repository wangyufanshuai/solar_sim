from __future__ import annotations
import hashlib,json,unittest
from pathlib import Path
from typing import Any
ROOT=Path.cwd(); ARTIFACT=ROOT/"dist/science/kerr-analyzer-identifiability-v524/identifiability.json"; TRANSIENT={"generatedAt","artifactSha256","payloadSha256","evidenceSha256","pointerSha256","stageChainSha256"}
def canonicalize(value:Any)->Any:
    if isinstance(value,list): return [canonicalize(entry) for entry in value]
    if isinstance(value,dict): return {key:canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value
def canonical_sha(value:Any)->str: return hashlib.sha256(json.dumps(canonicalize(value),ensure_ascii=False,separators=(",",":"),sort_keys=True).encode("utf-8")).hexdigest()
class KerrAnalyzerIdentifiabilityV524Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls)->None: cls.artifact=json.loads(ARTIFACT.read_text(encoding="utf-8"))
    def test_canonical_matrix_and_svd_coverage(self)->None:
        a=self.artifact; self.assertEqual(canonical_sha(a),a["artifactSha256"]); self.assertEqual(a["counts"]["matrixCount"],3); self.assertEqual(a["counts"]["svdCount"],3); self.assertEqual(a["counts"]["singularValueCount"],9)
    def test_ideal_operators_are_full_rank_and_well_conditioned(self)->None:
        d=self.artifact["diagnostics"]; self.assertEqual(d["idealDualBeam8x3"]["rank"],3); self.assertEqual(d["idealDualBeam8x3"]["nullity"],0); self.assertAlmostEqual(float(d["idealDualBeam8x3"]["conditionNumber"]),2**0.5); self.assertEqual(d["normalizedDifference4x2"]["rank"],2); self.assertEqual(float(d["normalizedDifference4x2"]["conditionNumber"]),1.0)
    def test_uncalibrated_bias_operator_exposes_two_dimensional_nullspace(self)->None:
        d=self.artifact["diagnostics"]["uncalibratedBiasAugmented4x6"]; self.assertEqual(d["rank"],4); self.assertEqual(d["nullity"],2); self.assertFalse(d["jointScienceAndBiasIdentifiable"]); self.assertEqual(self.artifact["nullspace"]["basisColumnCount"],2); self.assertTrue(self.artifact["nullspace"]["measuredCalibrationRequired"])
    def test_measurement_and_product_boundaries_remain_closed(self)->None:
        a=self.artifact; self.assertFalse(a["qualification"]["jointScienceCalibrationIdentifiabilityQualified"]); self.assertFalse(a["boundary"]["measuredCalibrationAvailable"]); self.assertEqual(a["counts"]["measuredCalibrationFileCount"],0); self.assertEqual(a["boundary"]["denseCampaignStatus"],"incomplete-0-of-49"); self.assertEqual(a["boundary"]["formalProductPointer"],"v263")
if __name__=="__main__": unittest.main()
