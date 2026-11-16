// Injection contract: the slimmed prompt-inject must still contain every mandatory clause (verbatim).
// The fixture was extracted from the old injection body; when changing the injection this test should fail first unless a rule is actually removed.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const clauses = JSON.parse(fs.readFileSync(path.join(here, "fixtures/inject-clauses.json"), "utf8"));
const norm = (s) => s.replace(/\s+/g, " ").trim();

function check(file, label) {
  const text = norm(fs.readFileSync(file, "utf8"));
  const missing = clauses.filter((c) => !text.includes(norm(c)));
  assert.deepEqual(missing, [], `${label} is missing ${missing.length} mandatory clause(s)`);
}

test("shipped inject keeps every mandatory clause", () => {
  const shipped = path.join(here, "../presets/inject-core.md");
  if (!fs.existsSync(shipped)) return; // slimmed version not enabled yet
  check(shipped, "presets/inject-core.md");
});

test("installed inject (if present) keeps every mandatory clause", () => {
  const user = path.join(os.homedir(), ".dsh/prompt-inject.md");
  if (!fs.existsSync(user)) return;
  check(user, "~/.dsh/prompt-inject.md");
});

test("the boost block asks for a direct artifact and one confirmation line", async () => {
  const { BOOST_TEXT } = await import("../lib/boost.js");
  assert.match(BOOST_TEXT, /Execute now\?/);
  assert.match(BOOST_TEXT, /return the artifact directly/i);
});
