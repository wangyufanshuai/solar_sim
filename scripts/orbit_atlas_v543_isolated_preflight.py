from __future__ import annotations

import argparse
import hashlib
import json
import runpy
import sys
from pathlib import Path
from typing import Any


TRANSIENT = {
    "generatedAt",
    "artifactSha256",
    "payloadSha256",
    "evidenceSha256",
    "pointerSha256",
    "stageChainSha256",
    "columnSha256",
    "receiptSha256",
    "resultSha256",
    "environmentSha256",
    "preflightSha256",
    "matrixSha256",
    "isolatedReceiptSha256",
    "executionMatrixSha256",
}


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def canonical_sha(value: Any) -> str:
    payload = json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode()
    return hashlib.sha256(payload).hexdigest()


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--validator", required=True)
    parser.add_argument("--kit", required=True)
    parser.add_argument("--validation-receipt", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    validator = Path(args.validator)
    output = Path(args.output)
    raw_output = Path("v542-raw-preflight.json")
    paths = [validator, Path(args.kit), Path(args.validation_receipt), output, raw_output]
    if any(path.is_absolute() for path in paths):
        raise RuntimeError("v543-relative-paths-required")
    if sys.flags.isolated != 1 or sys.flags.no_site != 1 or "site" in sys.modules:
        raise RuntimeError("v543-python-isolation-flags")
    site_package_path_count = sum(1 for entry in sys.path if "site-packages" in entry.lower() or "dist-packages" in entry.lower())
    if site_package_path_count != 0 or "numpy" in sys.modules or "astropy" in sys.modules:
        raise RuntimeError("v543-site-package-isolation")

    original_argv = sys.argv
    try:
        sys.argv = [str(validator), "--kit", args.kit, "--validation-receipt", args.validation_receipt, "--validator", args.validator, "--output", str(raw_output)]
        runpy.run_path(str(validator), run_name="__main__")
    finally:
        sys.argv = original_argv
    if "site" in sys.modules or "numpy" in sys.modules or "astropy" in sys.modules:
        raise RuntimeError("v543-dependency-import-after-preflight")
    raw = json.loads(raw_output.read_text(encoding="utf-8"))
    raw_output.unlink()
    if raw.get("status") != "package-integrity-qualified-science-replay-still-requires-locked-dependencies" or canonical_sha(raw) != raw.get("preflightSha256"):
        raise RuntimeError("v543-raw-preflight")
    if raw["qualification"]["stdlibPackagePreflightQualified"] is not True or raw["qualification"]["exactDependencyTupleDetected"] is not False or raw["qualification"]["scientificReplayQualifiedByThisPreflight"] is not False:
        raise RuntimeError("v543-raw-qualification")
    if raw["observedRuntime"]["numpyVersion"] != "unavailable" or raw["observedRuntime"]["astropyVersion"] != "unavailable" or raw["checks"]["numpyImported"] is not False or raw["checks"]["astropyImported"] is not False:
        raise RuntimeError("v543-no-site-distributions")

    unsigned = {
        "version": "v543-isolated-stdlib-preflight-receipt-v1",
        "generatedAt": "2026-08-02T00:00:00Z",
        "status": "isolated-package-preflight-qualified-science-replay-unavailable-no-site-packages",
        "source": {
            "v542PreflightValidatorFileSha256": file_sha(validator),
            "v542RawPreflightSha256": raw["preflightSha256"],
            "v541KitFileSha256": raw["source"]["v541KitFileSha256"],
            "v541ValidationResultSha256": raw["source"]["v541ValidationResultSha256"],
        },
        "execution": {
            "pythonIsolatedFlag": sys.flags.isolated,
            "pythonNoSiteFlag": sys.flags.no_site,
            "siteModuleLoaded": "site" in sys.modules,
            "sitePackagePathCount": site_package_path_count,
            "numpyModuleLoaded": "numpy" in sys.modules,
            "astropyModuleLoaded": "astropy" in sys.modules,
            "commandFlags": ["-I", "-S"],
        },
        "observedRuntime": raw["observedRuntime"],
        "packageChecks": raw["checks"],
        "compatibility": {
            "packagePreflightExecuted": True,
            "packagePreflightQualified": True,
            "exactScienceDependencyTupleDetected": False,
            "scienceReplayExecuted": False,
            "scienceReplayQualified": False,
            "reason": "numpy-and-astropy-unavailable-under-no-site-packages",
        },
        "qualification": {
            "isolatedStdlibPreflightQualified": True,
            "scienceReplayQualified": False,
            "crossOperatingSystemQualified": False,
            "crossEnvironmentScienceQualified": False,
            "scienceImageQualified": False,
            "productionPromotionQualified": False,
        },
        "boundary": {
            "workspaceImportCount": 0,
            "networkAttemptCount": raw["checks"]["networkAttemptCount"],
            "scienceDependencyImportCount": 0,
            "fitsSemanticValidationPerformed": False,
            "denseCampaignStatus": "incomplete-0-of-49",
            "formalProductPointer": "v263",
            "formalDefaultKernel": "legacy-eih-1pn",
        },
        "rawPreflight": raw,
    }
    receipt = {**unsigned, "isolatedReceiptSha256": canonical_sha(unsigned)}
    output.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="")


if __name__ == "__main__":
    main()
