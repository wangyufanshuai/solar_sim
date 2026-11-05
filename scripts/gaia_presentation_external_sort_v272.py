"""Bounded-memory external sort helpers for the v272 Gaia 10m builder."""

from __future__ import annotations

import heapq
from collections import OrderedDict
from pathlib import Path

import numpy as np
from astropy import units as u
from astropy.coordinates import ICRS
from astropy_healpix import HEALPix

ORDER8_CELLS = 12 * (2**8) ** 2
ORDER3_CELLS = 12 * (2**3) ** 2
RUN_ROWS = 250_000
IO_ROWS = 100_000
MAX_OPEN_SPOOLS = 32

WORK_DTYPE = np.dtype([
    ("cell", "<u4"), ("random_index", "<u4"), ("source_id", "<u8"),
    ("ra_quant", "<u4"), ("dec_quant", "<u4"), ("g_quant", "<u2"),
    ("color_quant", "<i2"), ("parallax", "<f4"),
], align=False)
SOURCE_DTYPE = np.dtype([("source_id", "<u8"), ("cell", "<u4"), ("ordinal", "<u4")], align=False)


class AppendHandleCache:
    def __init__(self, maximum: int = MAX_OPEN_SPOOLS) -> None:
        self.maximum = maximum
        self.handles: OrderedDict[Path, object] = OrderedDict()

    def write(self, path: Path, payload: bytes) -> None:
        handle = self.handles.pop(path, None)
        if handle is None:
            path.parent.mkdir(parents=True, exist_ok=True)
            handle = path.open("ab")
        self.handles[path] = handle
        handle.write(payload)
        if len(self.handles) > self.maximum:
            _, oldest = self.handles.popitem(last=False)
            oldest.close()

    def close(self) -> None:
        for handle in self.handles.values():
            handle.close()
        self.handles.clear()


def sorted_order(rows: np.ndarray, key_fields: tuple[str, ...]) -> np.ndarray:
    # np.lexsort consumes keys from least to most significant.
    return np.lexsort(tuple(rows[field] for field in reversed(key_fields)))


def write_sorted_runs(spool: Path, dtype: np.dtype, key_fields: tuple[str, ...], run_root: Path) -> list[Path]:
    row_count = spool.stat().st_size // dtype.itemsize
    source = np.memmap(spool, dtype=dtype, mode="r", shape=(row_count,))
    runs: list[Path] = []
    for run_index, start in enumerate(range(0, row_count, RUN_ROWS)):
        end = min(row_count, start + RUN_ROWS)
        chunk = np.array(source[start:end], copy=True)
        order = sorted_order(chunk, key_fields)
        run = run_root / f"{spool.stem}.run-{run_index:03d}.bin"
        chunk[order].tofile(run)
        runs.append(run)
        del order, chunk
    source._mmap.close()
    return runs


def merge_runs_into(
    runs: list[Path],
    dtype: np.dtype,
    key_fields: tuple[str, ...],
    destination: np.memmap,
    destination_offset: int,
) -> int:
    mapped = [np.memmap(path, dtype=dtype, mode="r") for path in runs]
    indexes = [0] * len(mapped)
    heap: list[tuple[object, ...]] = []
    for run_index, rows in enumerate(mapped):
        if len(rows):
            row = rows[0]
            heapq.heappush(heap, (*[int(row[field]) for field in key_fields], run_index))
    output = np.empty(IO_ROWS, dtype=dtype)
    used = written = 0
    while heap:
        entry = heapq.heappop(heap)
        run_index = int(entry[-1])
        row_index = indexes[run_index]
        output[used] = mapped[run_index][row_index]
        used += 1
        written += 1
        row_index += 1
        indexes[run_index] = row_index
        if row_index < len(mapped[run_index]):
            row = mapped[run_index][row_index]
            heapq.heappush(heap, (*[int(row[field]) for field in key_fields], run_index))
        if used == len(output):
            destination[destination_offset + written - used:destination_offset + written] = output
            used = 0
    if used:
        destination[destination_offset + written - used:destination_offset + written] = output[:used]
    for rows in mapped:
        rows._mmap.close()
    return written


def external_sort_spools(
    spool_root: Path,
    prefix: str,
    bucket_count: int,
    dtype: np.dtype,
    key_fields: tuple[str, ...],
    destination: np.memmap,
) -> int:
    offset = 0
    run_root = spool_root / "runs"
    run_root.mkdir(parents=True, exist_ok=True)
    for bucket in range(bucket_count):
        spool = spool_root / f"{prefix}-{bucket:03d}.bin"
        if not spool.exists():
            continue
        runs = write_sorted_runs(spool, dtype, key_fields, run_root)
        written = merge_runs_into(runs, dtype, key_fields, destination, offset)
        offset += written
        for run in runs:
            run.unlink()
        spool.unlink()
    run_root.rmdir()
    destination.flush()
    return offset


def create_sorted_work(connection, work_root: Path, target_rows: int) -> np.memmap:
    candidate_count = int(connection.execute("SELECT COUNT(*) FROM rows").fetchone()[0])
    if candidate_count < target_rows:
        raise RuntimeError(f"Gaia presentation candidates are insufficient: {candidate_count:,}/{target_rows:,}")
    hp8 = HEALPix(nside=2**8, order="nested", frame=ICRS())
    spool_root = work_root / "order3-spools"
    spool_root.mkdir()
    handles = AppendHandleCache()
    cursor = connection.execute(
        "SELECT random_index,source_id,ra,dec,g,color,parallax FROM rows ORDER BY random_index,source_id LIMIT ?",
        (target_rows,),
    )
    loaded = 0
    try:
        while loaded < target_rows:
            rows = cursor.fetchmany(min(IO_ROWS, target_rows - loaded))
            if not rows:
                break
            count = len(rows)
            ra = np.asarray([row[2] for row in rows], dtype=np.float64)
            dec = np.asarray([row[3] for row in rows], dtype=np.float64)
            chunk = np.empty(count, dtype=WORK_DTYPE)
            chunk["cell"] = hp8.lonlat_to_healpix(ra * u.deg, dec * u.deg).astype(np.uint32)
            chunk["random_index"] = np.asarray([row[0] for row in rows], dtype=np.uint32)
            chunk["source_id"] = np.asarray([row[1] for row in rows], dtype=np.uint64)
            chunk["ra_quant"] = np.floor((ra % 360) / 360 * (2**32)).astype(np.uint64).astype(np.uint32)
            chunk["dec_quant"] = np.rint(((dec + 90) / 180) * np.iinfo(np.uint32).max).astype(np.uint32)
            chunk["g_quant"] = np.rint((np.clip(np.asarray([row[4] for row in rows]), -5, 60) + 5) * 1000).astype(np.uint16)
            colors = np.asarray([row[5] if row[5] is not None else np.nan for row in rows], dtype=np.float64)
            chunk["color_quant"] = -32768
            valid_color = np.isfinite(colors)
            chunk["color_quant"][valid_color] = np.rint(np.clip(colors[valid_color], -32.767, 32.767) * 1000).astype(np.int16)
            chunk["parallax"] = np.asarray([row[6] if row[6] is not None else np.nan for row in rows], dtype=np.float32)
            parents = chunk["cell"] >> 10
            for parent in np.unique(parents):
                handles.write(spool_root / f"spatial-{int(parent):03d}.bin", chunk[parents == parent].tobytes(order="C"))
            loaded += count
            print(f"v272 spool {loaded:,}/{target_rows:,}", flush=True)
    finally:
        handles.close()
    if loaded != target_rows:
        raise RuntimeError("Gaia presentation deterministic selection ended early")
    sorted_path = work_root / "selected.sorted.bin"
    sorted_rows = np.memmap(sorted_path, dtype=WORK_DTYPE, mode="w+", shape=(target_rows,))
    written = external_sort_spools(spool_root, "spatial", ORDER3_CELLS, WORK_DTYPE, ("cell", "g_quant", "source_id"), sorted_rows)
    spool_root.rmdir()
    if written != target_rows:
        raise RuntimeError(f"Gaia external spatial sort lost rows: {written}/{target_rows}")
    return sorted_rows


def write_source_index(root: Path, rows: np.memmap) -> dict[str, Path]:
    target_rows = len(rows)
    cells = rows["cell"]
    counts = np.bincount(cells, minlength=ORDER8_CELLS).astype(np.uint32)
    starts = np.zeros(ORDER8_CELLS, dtype=np.uint64)
    starts[1:] = np.cumsum(counts[:-1], dtype=np.uint64)
    spool_root = root / "source-spools"
    spool_root.mkdir()
    handles = AppendHandleCache()
    try:
        for start in range(0, target_rows, IO_ROWS):
            end = min(target_rows, start + IO_ROWS)
            source = np.empty(end - start, dtype=SOURCE_DTYPE)
            source["source_id"] = rows["source_id"][start:end]
            source["cell"] = cells[start:end]
            ordinals = np.arange(start, end, dtype=np.uint64) - starts[source["cell"]]
            source["ordinal"] = ordinals.astype(np.uint32)
            buckets = (source["source_id"] >> np.uint64(56)).astype(np.uint8)
            for bucket in np.unique(buckets):
                handles.write(spool_root / f"source-{int(bucket):03d}.bin", source[buckets == bucket].tobytes(order="C"))
    finally:
        handles.close()
    sorted_path = root / "source.sorted.bin"
    sorted_rows = np.memmap(sorted_path, dtype=SOURCE_DTYPE, mode="w+", shape=(target_rows,))
    written = external_sort_spools(spool_root, "source", 256, SOURCE_DTYPE, ("source_id",), sorted_rows)
    spool_root.rmdir()
    if written != target_rows:
        raise RuntimeError(f"Gaia external source sort lost rows: {written}/{target_rows}")
    data_path = root / "source.index.bin"
    directory_path = root / "source.directory.bin"
    last_source = -1
    with data_path.open("wb") as data, directory_path.open("wb") as directory:
        for start in range(0, target_rows, 4096):
            end = min(target_rows, start + 4096)
            chunk = np.asarray(sorted_rows[start:end])
            first_source = int(chunk["source_id"][0])
            final_source = int(chunk["source_id"][-1])
            if first_source <= last_source or np.any(chunk["source_id"][1:] <= chunk["source_id"][:-1]):
                raise RuntimeError("Gaia presentation source index is not unique and ordered")
            data.write(chunk.tobytes(order="C"))
            directory.write(np.asarray([(first_source, final_source, start * SOURCE_DTYPE.itemsize, len(chunk))], dtype=np.dtype([
                ("first", "<u8"), ("last", "<u8"), ("offset", "<u4"), ("count", "<u4"),
            ])).tobytes())
            last_source = final_source
    sorted_rows._mmap.close()
    sorted_path.unlink()
    if data_path.stat().st_size != target_rows * SOURCE_DTYPE.itemsize:
        raise RuntimeError("Gaia presentation source index length changed")
    return {"data": data_path, "directory": directory_path}
