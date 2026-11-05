from __future__ import annotations

import hashlib
import importlib.util
import json
import zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_PATH = ROOT / "dist/science/kerr-response-aware-portable-crate-v539/atlas.json"
CRATE_PATH = ROOT / "dist/science/kerr-response-aware-portable-crate-v539/orbit-atlas-kerr-response-aware-v539.zip"
BUILDER_PATH = ROOT / "scripts/build-kerr-response-aware-portable-crate-v539.py"
SPEC = importlib.util.spec_from_file_location("v539_builder", BUILDER_PATH)
assert SPEC and SPEC.loader
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


def test_v539_crate_artifact_and_member_inventory_are_canonical() -> None:
    artifact = json.loads(ARTIFACT_PATH.read_text(encoding="utf-8"))
    assert BUILDER.canonical_sha(artifact) == artifact["artifactSha256"]
    assert hashlib.sha256(CRATE_PATH.read_bytes()).hexdigest() == artifact["crate"]["fileSha256"]
    assert artifact["crate"]["memberCount"] == 9
    assert artifact["crate"]["manifestCoveredMemberCount"] == 8
    assert len(artifact["members"]) == 9
    assert sum(member["bytes"] for member in artifact["members"]) == artifact["crate"]["totalUncompressedBytes"]
    assert artifact["counts"]["fitsImageHduCount"] == 0
    assert artifact["counts"]["pixelSampleCount"] == 0
    assert artifact["counts"]["physicalUncertaintyValueCount"] == 0


def test_v539_zip_is_fixed_safe_and_exactly_replayable() -> None:
    artifact = json.loads(ARTIFACT_PATH.read_text(encoding="utf-8"))
    expected = {member["path"]: member for member in artifact["members"]}
    with zipfile.ZipFile(CRATE_PATH, "r") as archive:
        assert archive.testzip() is None
        assert archive.namelist() == sorted(expected)
        for info in archive.infolist():
            path = PurePosixPath(info.filename)
            assert not path.is_absolute()
            assert ".." not in path.parts
            assert info.date_time == BUILDER.FIXED_ZIP_TIME
            assert info.compress_type == zipfile.ZIP_STORED
            assert (info.external_attr >> 16) == 0o100644
            payload = archive.read(info.filename)
            assert len(payload) == expected[info.filename]["bytes"]
            assert hashlib.sha256(payload).hexdigest() == expected[info.filename]["sha256"]


def test_v539_manifest_and_ro_crate_graph_close_offline() -> None:
    with zipfile.ZipFile(CRATE_PATH, "r") as archive:
        manifest = {}
        for line in archive.read("manifest-sha256.txt").decode("ascii").splitlines():
            digest, name = line.split("  ", 1)
            manifest[name] = digest
        assert len(manifest) == 8
        for name, digest in manifest.items():
            assert hashlib.sha256(archive.read(name)).hexdigest() == digest
        crate = json.loads(archive.read("ro-crate-metadata.json"))
        assert crate["@context"] == "https://w3id.org/ro/crate/1.1/context"
        graph = {entry["@id"]: entry for entry in crate["@graph"]}
        assert graph["ro-crate-metadata.json"]["about"]["@id"] == "./"
        assert graph["ro-crate-metadata.json"]["conformsTo"]["@id"] == "https://w3id.org/ro/crate/1.1"
        parts = [entry["@id"] for entry in graph["./"]["hasPart"]]
        assert len(parts) == 8
        assert all(name in graph and name in archive.namelist() for name in parts)
        assert graph["./"]["isBasedOn"] == [{"@id": "metadata/v537-fits-atlas.json"}, {"@id": "metadata/v538-column-schema-atlas.json"}]
