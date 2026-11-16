// The probe is the only check that can prove the model actually received the
// inject, so its lifetime and text must be predictable.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createProbe, readProbe, probeText, probeMessage, PROBE_TTL_MS } from "../lib/probe.js";

test("a probe is single-valued, expires, and disappears from the prompt text", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-probe-"));
  try {
    assert.equal(readProbe(home), null, "no probe by default");
    assert.equal(probeText(home), "", "no probe section without a probe");

    const created = createProbe(home);
    assert.match(created.nonce, /^purge-[0-9a-f]{8}$/);
    assert.equal(readProbe(home).nonce, created.nonce);
    const text = probeText(home);
    assert(text.includes(created.nonce), "probe nonce is in the injected text");
    assert(text.includes("dsh_probe"));

    // expires automatically
    const file = path.join(home, "dsh-purge", "probe.json");
    fs.writeFileSync(file, JSON.stringify({ nonce: created.nonce, at: Date.now() - PROBE_TTL_MS - 1000 }));
    assert.equal(readProbe(home), null);
    assert.equal(probeText(home), "");

    // a corrupt file must not throw
    fs.writeFileSync(file, "{oops");
    assert.equal(readProbe(home), null);
    assert(probeMessage("purge-deadbeef").includes("purge-deadbeef"));
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
