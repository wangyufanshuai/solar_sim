"""Finite, stdlib-only fault fixture; never imports or evolves an NR state."""

import json
import os
from pathlib import Path
import subprocess
import sys
import time


def main():
    mode, directory = sys.argv[1], Path(sys.argv[2])
    child = None
    if mode in ("tree", "orphan"):
        child = subprocess.Popen(
            [sys.executable, "-B", "-c", "import time; time.sleep(30)"],
            stdin=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
    with (directory / "ready.json").open("x", encoding="utf-8") as stream:
        json.dump(
            dict(pid=os.getpid(), descendant=child.pid if child else None), stream
        )
    if mode in ("sleep", "tree"):
        time.sleep(30)
    if mode == "nonzero":
        return 7
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
