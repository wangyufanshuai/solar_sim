from __future__ import annotations

import hashlib
import json
import os
from decimal import Decimal, getcontext
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path.cwd()
SOURCE = ROOT / "dist/staging/measured-authority-v382-visible/raw/svo-hst-wfc3-uvis1-f350lp.xml"
OUTPUT = ROOT / "dist/science/measured-visible-throughput-v383/python-oracle.json"
LOWER = Decimal("4000")
UPPER = Decimal("7000")
getcontext().prec = 50


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def canonical(value):
    if isinstance(value, list):
        return [canonical(entry) for entry in value]
    if isinstance(value, dict):
        return {
            key: canonical(value[key])
            for key in sorted(value)
            if key not in {"generatedAt", "artifactSha256"}
        }
    return value


def trapezoid(rows, selector):
    total = Decimal(0)
    for left, right in zip(rows, rows[1:]):
        total += (
            (right[0] - left[0])
            * (selector(left) + selector(right))
            / Decimal(2)
        )
    return total


def decimal_text(value: Decimal) -> str:
    return format(value, ".40g")


def main() -> None:
    source = SOURCE.read_bytes()
    if not source or len(source) > 4 * 1024 * 1024:
        raise RuntimeError("v383-python-source-size")
    root = ElementTree.fromstring(source)
    rows = []
    for element in root.iter():
        if element.tag.rsplit("}", 1)[-1].upper() != "TR":
            continue
        cells = [
            child
            for child in list(element)
            if child.tag.rsplit("}", 1)[-1].upper() == "TD"
        ]
        if len(cells) != 2 or cells[0].text is None or cells[1].text is None:
            raise RuntimeError("v383-python-row-schema")
        wavelength_text = cells[0].text.strip()
        throughput_text = cells[1].text.strip()
        wavelength = Decimal(wavelength_text)
        throughput = Decimal(throughput_text)
        if wavelength <= 0 or throughput < 0 or throughput > 1:
            raise RuntimeError("v383-python-row-values")
        rows.append((wavelength, throughput, wavelength_text, throughput_text))
    if len(rows) != 8705:
        raise RuntimeError(f"v383-python-source-count:{len(rows)}")
    if any(right[0] <= left[0] for left, right in zip(rows, rows[1:])):
        raise RuntimeError("v383-python-source-monotonic")
    visible = [row for row in rows if LOWER <= row[0] <= UPPER]
    if len(visible) != 3301 or visible[0][0] != LOWER or visible[-1][0] != UPPER:
        raise RuntimeError("v383-python-visible-boundary")
    equivalent_width = trapezoid(visible, lambda row: row[1])
    first_moment = trapezoid(visible, lambda row: row[1] * row[0])
    reciprocal_moment = trapezoid(visible, lambda row: row[1] / row[0])
    mean_throughput = equivalent_width / (UPPER - LOWER)
    weighted_mean = first_moment / equivalent_width
    pivot = (first_moment / reciprocal_moment).sqrt()
    source_row_text = "".join(
        f"{row[2]},{row[3]}\n" for row in visible
    ).encode("utf-8")
    unsigned = {
        "version": "v383-visible-throughput-python-decimal-oracle-v1",
        "status": "qualified-independent-xml-decimal-oracle",
        "input": {
            "path": "dist/staging/measured-authority-v382-visible/raw/svo-hst-wfc3-uvis1-f350lp.xml",
            "sha256": sha256_bytes(source),
        },
        "parser": "python-xml-etree-elementtree-namespace-independent",
        "arithmetic": "python-decimal-50-digit-trapezoid-and-square-root",
        "sourceRowCanonicalSha256": sha256_bytes(source_row_text),
        "metrics": {
            "rowCount": len(visible),
            "lowerWavelengthAngstrom": decimal_text(visible[0][0]),
            "upperWavelengthAngstrom": decimal_text(visible[-1][0]),
            "minimumThroughput": decimal_text(min(row[1] for row in visible)),
            "maximumThroughput": decimal_text(max(row[1] for row in visible)),
            "equivalentWidthAngstrom": decimal_text(equivalent_width),
            "meanThroughput": decimal_text(mean_throughput),
            "throughputWeightedMeanWavelengthAngstrom": decimal_text(weighted_mean),
            "pivotWavelengthAngstrom": decimal_text(pivot),
        },
        "strictlyIncreasing": True,
        "duplicateWavelengthCount": 0,
        "interpolationApplied": False,
        "networkAttempted": False,
        "authorityGranted": False,
        "observedCountsAvailable": False,
        "denseCampaignStatus": "incomplete-0-of-49",
    }
    artifact = {
        **unsigned,
        "artifactSha256": sha256_bytes(
            json.dumps(
                canonical(unsigned),
                ensure_ascii=False,
                separators=(",", ":"),
                sort_keys=True,
            ).encode("utf-8")
        ),
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUTPUT.with_name(f"{OUTPUT.name}.{os.getpid()}.part")
    temporary.write_text(
        json.dumps(artifact, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    os.replace(temporary, OUTPUT)
    print(
        json.dumps(
            {
                "status": artifact["status"],
                "artifactSha256": artifact["artifactSha256"],
                "sourceRowCanonicalSha256": artifact[
                    "sourceRowCanonicalSha256"
                ],
                "rows": artifact["metrics"]["rowCount"],
                "equivalentWidthAngstrom": artifact["metrics"][
                    "equivalentWidthAngstrom"
                ],
                "pivotWavelengthAngstrom": artifact["metrics"][
                    "pivotWavelengthAngstrom"
                ],
                "authorityGranted": False,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
