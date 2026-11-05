from __future__ import annotations

import hashlib
import json
import urllib.parse
import urllib.request
from pathlib import Path

import trimesh

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "models" / "spacecraft"
RAW = ROOT / "tools" / "asset-cache" / "spacecraft"
REPO = "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/"
ASSETS = [
    ("sls-block-1", "3D Printing/Space Launch System (SLS) Block 1/Space Launch System (SLS) Block 1.stl", "stl", False),
    ("orion-capsule", "3D Printing/Orion Capsule/Orion Capsule (no fbc).stl", "stl", True),
    ("cubesat-1ru", "3D Models/CubeSat - 1 RU Generic/CubeSat - 1 RU Generic.glb", "glb", True),
    ("gateway-core", "3D Models/Gateway/Gateway Core.glb", "glb", True),
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download(source_path: str, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.stat().st_size > 0:
        return
    url = REPO + urllib.parse.quote(source_path, safe="/()")
    with urllib.request.urlopen(url, timeout=180) as response, target.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest_assets = []
    for asset_id, source_path, kind, deferred in ASSETS:
        raw_path = RAW / f"{asset_id}.{kind}"
        output_path = OUT / f"{asset_id}.glb"
        download(source_path, raw_path)
        if kind == "stl":
            mesh = trimesh.load_mesh(raw_path, process=True)
            mesh.export(output_path, file_type="glb")
        elif not output_path.exists():
            output_path.write_bytes(raw_path.read_bytes())
        manifest_assets.append({
            "id": asset_id,
            "path": f"/models/spacecraft/{output_path.name}",
            "bytes": output_path.stat().st_size,
            "sha256": sha256(output_path),
            "source": f"NASA-3D-Resources/{source_path}",
            "sourceUrl": REPO + urllib.parse.quote(source_path, safe="/()"),
            "license": "NASA Images and Media Usage Guidelines",
            "deferred": deferred,
        })
        print(f"{asset_id}: {output_path.stat().st_size} bytes")

    initial_bytes = sum(asset["bytes"] for asset in manifest_assets if not asset["deferred"])
    manifest = {
        "version": "v118-launch-asset-manifest",
        "source": "NASA 3D Resources official GitHub mirror",
        "usageGuidelines": "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        "initialAssetBytes": initial_bytes,
        "initialAssetLimitBytes": 25 * 1024 * 1024,
        "assets": manifest_assets,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    if initial_bytes > manifest["initialAssetLimitBytes"]:
        raise RuntimeError("Initial launch assets exceed 25 MB")


if __name__ == "__main__":
    main()
