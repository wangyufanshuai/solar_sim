from __future__ import annotations

import importlib.util
import io
import json
import socket
import warnings
import zipfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_PATH = ROOT / "dist/science/kerr-response-aware-offline-replay-v540/atlas.json"
RECEIPT_PATH = ROOT / "dist/science/kerr-response-aware-offline-replay-v540/replay-receipt.json"
CRATE_PATH = ROOT / "dist/science/kerr-response-aware-portable-crate-v539/orbit-atlas-kerr-response-aware-v539.zip"
BUILDER_PATH = ROOT / "scripts/build-kerr-response-aware-offline-replay-v540.py"
SPEC = importlib.util.spec_from_file_location("v540_builder", BUILDER_PATH)
assert SPEC and SPEC.loader
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


def test_v540_receipt_is_canonical_deterministic_and_workspace_independent() -> None:
    artifact = json.loads(ARTIFACT_PATH.read_text(encoding="utf-8"))
    receipt = json.loads(RECEIPT_PATH.read_text(encoding="utf-8"))
    assert BUILDER.canonical_sha(artifact) == artifact["artifactSha256"]
    assert BUILDER.canonical_sha(receipt) == receipt["receiptSha256"]
    replay = BUILDER.replay_crate_bytes(CRATE_PATH.read_bytes())
    assert replay == receipt
    assert artifact["receiptExport"]["canonicalSha256"] == receipt["receiptSha256"]
    assert artifact["boundary"]["replayInputIsOnlyV539Crate"] is True
    assert artifact["boundary"]["workspaceSourceFilesUsedDuringReplay"] == 0
    assert receipt["sandbox"]["absolutePathStored"] is False
    assert receipt["sandbox"]["temporaryDirectoryRemoved"] is True


def test_v540_replay_closes_fits_schema_and_provenance_without_network() -> None:
    receipt = json.loads(RECEIPT_PATH.read_text(encoding="utf-8"))
    assert receipt["sandbox"]["networkGuardInstalled"] is True
    assert receipt["sandbox"]["networkAttemptCount"] == 0
    assert receipt["integrity"]["manifestReplayCount"] == 8
    assert receipt["fits"] == {"hduCount": 2, "primaryNaxis": 0, "binaryTableHduCount": 1, "imageHduCount": 0, "rowCount": 4, "columnCount": 17, "checksumCardCount": 4, "checksumReplayQualified": True, "physicalUncertaintyTrueCount": 0, "pixelTrueCount": 0, "rowShaReplayCount": 4}
    assert receipt["schema"]["columnShaReplayCount"] == 17
    assert receipt["provenance"]["canonicalReplayCount"] == 4
    assert receipt["provenance"]["sourceLinkReplayCount"] == 6


def test_v540_corruption_path_traversal_and_duplicate_members_fail_closed() -> None:
    original_connect = socket.socket.connect
    corrupted = bytearray(CRATE_PATH.read_bytes())
    corrupted[512] ^= 0x01
    with pytest.raises(Exception):
        BUILDER.replay_crate_bytes(bytes(corrupted))
    assert socket.socket.connect is original_connect

    traversal = io.BytesIO()
    with zipfile.ZipFile(traversal, "w") as archive:
        archive.writestr("../escape.txt", b"forbidden")
    with pytest.raises(Exception):
        BUILDER.replay_crate_bytes(traversal.getvalue())
    assert socket.socket.connect is original_connect

    duplicate = io.BytesIO()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        with zipfile.ZipFile(duplicate, "w") as archive:
            archive.writestr("README.md", b"one")
            archive.writestr("README.md", b"two")
    with pytest.raises(Exception):
        BUILDER.replay_crate_bytes(duplicate.getvalue())
    assert socket.socket.connect is original_connect
