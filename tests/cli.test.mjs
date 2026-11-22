import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

test("the built wizard rejects non-interactive use without writing a config", () => {
  const directory = mkdtempSync(join(tmpdir(), "uio-opencode-test-"));
  try {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("../dist/index.js", import.meta.url))], {
      cwd: directory,
      encoding: "utf8",
    });
    assert.ifError(result.error);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Interactive setup requires a terminal/);
    assert.deepEqual(readdirSync(directory), []);
  } finally {
    rmdirSync(directory);
  }
});
