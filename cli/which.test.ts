import { describe, test, expect } from "bun:test";
import { mkdtempSync, writeFileSync, symlinkSync, rmSync, mkdirSync, realpathSync } from "fs";
import { tmpdir } from "os";
import { delimiter, join } from "path";
import { stableNodePath } from "./which.ts";

if (process.platform !== "win32") {
  describe("stableNodePath", () => {
    test("returns the candidate stable path if it points to the same real binary as the execPath", () => {
      const tmp = mkdtempSync(join(tmpdir(), "petsonality-node-test-"));
      try {
        const binDir = join(tmp, "bin");
        const cellarDir = join(tmp, "Cellar", "node", "25.8.0", "bin");
        mkdirSync(binDir, { recursive: true });
        mkdirSync(cellarDir, { recursive: true });

        const realNode = join(cellarDir, "node");
        writeFileSync(realNode, "dummy binary content");

        const stableNode = join(binDir, "node");
        symlinkSync(realpathSync(realNode), stableNode);

        const resolved = stableNodePath(realNode, [stableNode]);
        expect(resolved).toBe(stableNode);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    test("returns the PATH node when it points to the same real binary as the execPath", () => {
      const tmp = mkdtempSync(join(tmpdir(), "petsonality-node-test-"));
      const originalPath = process.env.PATH;
      try {
        const binDir = join(tmp, "bin");
        const cellarDir = join(tmp, "Cellar", "node", "25.8.0", "bin");
        mkdirSync(binDir, { recursive: true });
        mkdirSync(cellarDir, { recursive: true });

        const realNode = join(cellarDir, "node");
        writeFileSync(realNode, "real node");

        const pathNode = join(binDir, "node");
        symlinkSync(realpathSync(realNode), pathNode);
        process.env.PATH = [binDir, originalPath].filter(Boolean).join(delimiter);

        const resolved = stableNodePath(realNode);
        expect(resolved).toBe(pathNode);
      } finally {
        if (originalPath === undefined) delete process.env.PATH;
        else process.env.PATH = originalPath;
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    test("falls back to the original path if candidates do not point to the same binary", () => {
      const tmp = mkdtempSync(join(tmpdir(), "petsonality-node-test-"));
      try {
        const binDir = join(tmp, "bin");
        const cellarDir = join(tmp, "Cellar", "node", "25.8.0", "bin");
        mkdirSync(binDir, { recursive: true });
        mkdirSync(cellarDir, { recursive: true });

        const realNode = join(cellarDir, "node");
        writeFileSync(realNode, "real node");

        const differentNode = join(binDir, "node");
        writeFileSync(differentNode, "different node file");

        const resolved = stableNodePath(realNode, [differentNode]);
        expect(resolved).toBe(realNode);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    test("falls back to the original path if stable path candidate does not exist", () => {
      const tmp = mkdtempSync(join(tmpdir(), "petsonality-node-test-"));
      try {
        const cellarDir = join(tmp, "Cellar", "node", "25.8.0", "bin");
        mkdirSync(cellarDir, { recursive: true });

        const realNode = join(cellarDir, "node");
        writeFileSync(realNode, "real node");

        const nonExistentNode = join(tmp, "bin", "non-existent-node");

        const resolved = stableNodePath(realNode, [nonExistentNode]);
        expect(resolved).toBe(realNode);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });
}
