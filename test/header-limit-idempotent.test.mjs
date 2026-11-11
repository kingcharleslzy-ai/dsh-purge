// #92 used to append --max-http-header-size on every apply because the anchor
// stayed present after the first write. Match the list once and collapse any
// copies an older version already left behind.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_PATCHES, applyReplacementsToText } from "../lib/core.js";

const patch = ALL_PATCHES.find((p) => p.id === 92);
const PRISTINE = '\t\t\t"--expose-internals",\n\t\t\tentry,';
const DUPED = '\t\t\t"--expose-internals", /* [dsh-purge] raise-host-header-limit */ "--max-http-header-size=262144", /* [dsh-purge] raise-host-header-limit */ "--max-http-header-size=262144", /* [dsh-purge] raise-host-header-limit */ "--max-http-header-size=262144",\n\t\t\tentry,';
const count = (text) => (text.match(/--max-http-header-size=262144/g) || []).length;

test("#92 inserts one header-size argument and stays idempotent", () => {
  const once = applyReplacementsToText(PRISTINE, patch, "main.js");
  assert.equal(once.changed, true);
  assert.equal(count(once.text), 1);
  const twice = applyReplacementsToText(once.text, patch, "main.js");
  assert.equal(count(twice.text), 1);
  assert.equal(twice.text, once.text);
});

test("#92 collapses duplicates left by the old non-idempotent patch", () => {
  const fixed = applyReplacementsToText(DUPED, patch, "main.js");
  assert.equal(fixed.changed, true);
  assert.equal(count(fixed.text), 1);
  assert.match(fixed.text, /"--expose-internals", \/\* \[dsh-purge\] raise-host-header-limit \*\/ "--max-http-header-size=262144",/);
});
