// Fixture paths must bind to the test file, not be joined from cwd: on the Windows runner an outer script changes cwd,
// and path.resolve('test/fixtures/x.ps1') points at a nonexistent absolute path and throws FileNotFoundException.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

test("every fixture referenced by a test resolves from the test file, not the cwd", () => {
  const offenders = [];
  for (const name of fs.readdirSync(here).filter((f) => f.endsWith(".test.mjs"))) {
    if (name === "fixture-paths.test.mjs") continue; // this file's own pattern literals do not count
    const source = fs.readFileSync(path.join(here, name), "utf8");
    // only real call shapes: path.resolve('test/...') / join(process.cwd(), 'test/...')
    for (const m of source.matchAll(/path\.resolve\(\s*['"]test\//g)) offenders.push(`${name}: path.resolve('test/...')`);
    for (const m of source.matchAll(/process\.cwd\(\)[^;\n]*['"]test\//g)) offenders.push(`${name}: process.cwd() + 'test/...'`);
  }
  assert.deepEqual(offenders, [], "fixture paths must resolve relative to import.meta.url");
});

test("the Windows handoff fixture exists where the test looks for it", () => {
  const fixture = path.join(root, "test", "fixtures", "windows-handoff-errors.ps1");
  assert.ok(fs.existsSync(fixture), `missing fixture: ${fixture}`);
});
