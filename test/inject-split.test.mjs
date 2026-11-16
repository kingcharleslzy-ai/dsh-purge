// The heading in the injection body is "CTF Core Contract"; the constant is all caps.
// Compare by whole line, case-insensitively: must not fail due to case, and must not accidentally affect the same words inside body text.
import { test } from "node:test";
import assert from "node:assert/strict";
import { splitRedteamInject, withoutCtfContract } from "../lib/identity.js";

const REAL = "Preface paragraph\n\nCTF Core Contract\n\nCTF Scope and Evidence\n\nCompetition sandbox agreement\n";

test("the real mixed-case heading is split off", () => {
  const { common, ctfTail } = splitRedteamInject(REAL);
  assert.equal(common.trim(), "Preface paragraph");
  assert.match(ctfTail, /Competition sandbox agreement/);
});

test("user prose mentioning the words inline is untouched", () => {
  const prose = "The heading in our document is the CTF Core Contract section, explained below.";
  assert.equal(splitRedteamInject(prose).ctfTail, "");
  assert.equal(withoutCtfContract(prose), prose);
});

test("a fenced example is not treated as a structural marker", () => {
  const fenced = "Preface\n\n```\nCTF Core Contract\n```\n\nFollowing body text\n";
  assert.equal(splitRedteamInject(fenced).ctfTail, "");
});
