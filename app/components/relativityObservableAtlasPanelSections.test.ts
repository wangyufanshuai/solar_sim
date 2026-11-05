import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import {
  RELATIVITY_OBSERVABLE_ATLAS_PANEL_SOURCE_FILES,
  readProjectSourceBundle,
} from "../test-utils/sourceBundles";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("v252 Relativity Observable Atlas sections", () => {
  it("preserves the public props contract and default export", () => {
    const file = "app/components/RelativityObservableAtlasPanel.tsx";
    const source = read(file);
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const props = sourceFile.statements.find(
      (node): node is ts.TypeAliasDeclaration =>
        ts.isTypeAliasDeclaration(node) && node.name.text === "RelativityObservableAtlasPanelProps",
    );
    expect(props && ts.isTypeLiteralNode(props.type)).toBe(true);
    const names = props && ts.isTypeLiteralNode(props.type)
      ? props.type.members.map((member) => member.name?.getText(sourceFile))
      : [];

    expect(names).toHaveLength(45);
    expect(createHash("sha256").update(JSON.stringify(names)).digest("hex"))
      .toBe("257b0332726c7cdf697c72d8b24354f26cd75071b6c826185522069563b64888");
    expect(source).toContain("export default function RelativityObservableAtlasPanel(");
  });

  it("preserves every historical DOM marker across the composed source", () => {
    const source = readProjectSourceBundle("app/components/RelativityObservableAtlasPanel.tsx");
    const markers = [...source.matchAll(/\bdata-[a-z0-9-]+/g)]
      .map((match) => match[0])
      .sort();

    expect(markers).toHaveLength(405);
    expect(new Set(markers).size).toBe(403);
    expect(createHash("sha256").update(JSON.stringify(markers)).digest("hex"))
      .toBe("4c4b92b399e95d5014d9f05797b962e6d649c56fed57263a0629a46404429761");
  });

  it("keeps section budgets and the research workspace lazy boundary", () => {
    const main = read("app/components/RelativityObservableAtlasPanel.tsx");
    const workspace = read("app/components/RelativityResearchWorkspaceSection.tsx");
    expect(main.split(/\r?\n/).length).toBeLessThanOrEqual(500);
    for (const file of RELATIVITY_OBSERVABLE_ATLAS_PANEL_SOURCE_FILES) {
      expect(read(file).split(/\r?\n/).length).toBeLessThanOrEqual(600);
    }
    expect(read("app/components/RelativityObservableReadoutSection.tsx").split(/\r?\n/).length)
      .toBeLessThanOrEqual(350);
    expect(main).not.toContain('import("./RelativityResearchWorkspaceV9")');
    expect(workspace).toContain('lazy(() => import("./RelativityResearchWorkspaceV9"))');
    expect(RELATIVITY_OBSERVABLE_ATLAS_PANEL_SOURCE_FILES).toHaveLength(9);
  });
});
