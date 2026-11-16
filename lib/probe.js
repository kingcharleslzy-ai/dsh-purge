// Runtime probe: prove that the prompt path actually reaches the model.
//
// A patched file and a registered section only prove "host side ready"; what matters is
// "the model received it". So: write a one-shot nonce and mount a short instruction at the
// end of the system prompt saying to echo it verbatim. An echo means the chain is really connected.
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { findDshHome } from "./core.js";

export const PROBE_SECTION = "dsh-purge:probe";
export const PROBE_TTL_MS = 30 * 60 * 1000;

function probePath(dshHome) {
  const home = dshHome || findDshHome();
  if (!home) return "";
  return path.join(home, "dsh-purge", "probe.json");
}

export function readProbe(dshHome) {
  const file = probePath(dshHome);
  if (!file) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!data || typeof data.nonce !== "string" || !data.nonce) return null;
    const at = Number(data.at) || 0;
    if (!at || Date.now() - at > PROBE_TTL_MS) {
      try {
        fs.rmSync(file, { force: true });
      } catch {
        /* ignore */
      }
      return null;
    }
    return { nonce: data.nonce, at };
  } catch {
    return null;
  }
}

export function createProbe(dshHome) {
  const file = probePath(dshHome);
  if (!file) throw new Error("DSH data dir not found; cannot write the probe");
  const nonce = "purge-" + randomBytes(4).toString("hex");
  const at = Date.now();
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  fs.writeFileSync(file, JSON.stringify({ nonce, at }, null, 2), { mode: 0o600 });
  return { nonce, at, message: probeMessage(nonce) };
}

export function probeMessage(nonce) {
  return [
    "Output the line below verbatim (no rewording, no explanation):",
    `[${nonce}]`,
    "",
    "Seeing it verbatim in your reply means the purge injection really reached the model context.",
  ].join("\n");
}

/** Section body injected while the probe is alive; empty string once expired. */
export function probeText(dshHome) {
  const probe = readProbe(dshHome);
  if (!probe) return "";
  return [
    "<dsh_probe>",
    "This system prompt section was written by dsh-purge to verify the injection chain reaches the model.",
    `If this section is in your context, output this on its own last line, verbatim: [${probe.nonce}]`,
    "</dsh_probe>",
  ].join("\n");
}
