import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

function collectTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectTsxFiles(path);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [path] : [];
  });
}

describe("v256 authored React line budget", () => {
  it("keeps every app TSX surface at or below 600 lines", () => {
    const appRoot = resolve(process.cwd(), "app");
    const offenders = collectTsxFiles(appRoot)
      .map((file) => ({
        file: relative(process.cwd(), file).replaceAll("\\", "/"),
        lines: readFileSync(file, "utf8").split(/\r?\n/).length,
      }))
      .filter(({ lines }) => lines > 600);

    expect(offenders).toEqual([]);
  });
});
