// Historical output is identified by digest. This module can only copy native
// text from an existing local backup; it contains no forward patch recipes.
import { createHash } from "node:crypto";
import fs from "node:fs";
import { assertWithinRoots } from "./path-boundary.js";
import { pathsOf } from "./core/shared.mjs";
const rules = JSON.parse(
  fs.readFileSync(new URL("./retired-permissions.json", import.meta.url)),
);
const hash = (text) => createHash("sha256").update(text).digest("hex");
function matches(text, signature) {
  if (signature.regex)
    return [...text.matchAll(new RegExp(signature.regex, "g"))].map((m) => ({
      at: m.index,
      text: m[0],
    }));
  const found = [];
  for (
    let at = text.indexOf(signature.prefix);
    at >= 0;
    at = text.indexOf(signature.prefix, at + 1)
  ) {
    const value = text.slice(at, at + signature.size);
    if (value.length === signature.size && hash(value) === signature.sha256)
      found.push({ at, text: value });
  }
  return found;
}
const normalize = (text) => text.replace(/\r\n/g, "\n");
function hasContext(base, stock, live, old) {
  const left = base.slice(Math.max(0, stock.at - 48), stock.at);
  const right = base.slice(
    stock.at + stock.text.length,
    stock.at + stock.text.length + 48,
  );
  return (
    live.slice(0, old.at).endsWith(left) &&
    live.slice(old.at + old.text.length).startsWith(right) &&
    (left.length === 48 || old.at === stock.at) &&
    (right.length === 48 ||
      live.length - old.at - old.text.length === right.length)
  );
}
export function recoverRetiredPermissions(
  baseline,
  current,
  applicable,
  file,
  isKnownRemainder,
) {
  const base = baseline === null ? null : normalize(baseline),
    live = normalize(current);
  const marked = (text) =>
    applicable.some((rule) =>
      rule.markers.some((sig) => matches(text, sig).length),
    );
  if (base !== null && marked(base))
    throw Error("backup already contains a retired permission marker");
  const groups = new Map();
  for (const rule of applicable)
    for (const edit of rule.edits) {
      if (!groups.has(edit.old.sha256))
        groups.set(edit.old.sha256, { old: edit.old, stock: [] });
      groups.get(edit.old.sha256).stock.push(edit.stock);
    }
  const changes = [];
  for (const group of groups.values()) {
    const found = matches(live, group.old);
    if (!found.length) continue;
    if (base === null) {
      throw Error("missing backup for possible retired permission edit");
    }
    const already = matches(base, group.old);
    const stock = group.stock.flatMap((sig) => matches(base, sig));
    if (already.length && !stock.length)
      throw Error(
        "backup contains historical output without a native reference",
      );
    if (
      found.length === already.length &&
      stock.every((s) => live.includes(s.text))
    )
      continue;
    for (const old of found) {
      if (already.some((s) => hasContext(base, s, live, old))) continue;
      let choices = stock
        .filter((s) => hasContext(base, s, live, old))
        .map((s) => s.text);
      // Adjacent edits may change the context; whole-file verification below
      // is still mandatory even if only one native replacement exists.
      if (!choices.length && !already.length)
        choices = stock.map((s) => s.text);
      const unique = [...new Set(choices)];
      if (unique.length !== 1)
        throw Error("backup does not uniquely identify the retired edit");
      changes.push({ at: old.at, length: old.text.length, stock: unique[0] });
    }
  }
  let candidate = live,
    end = live.length;
  for (const change of changes.sort((a, b) => b.at - a.at)) {
    if (change.at + change.length > end)
      throw Error("overlapping retired edits");
    candidate =
      candidate.slice(0, change.at) +
      change.stock +
      candidate.slice(change.at + change.length);
    end = change.at;
  }
  if (marked(candidate)) throw Error("incomplete retired permission edit");
  if (!changes.length) {
    if (base !== null && base !== live) {
      for (const { stock } of groups.values())
        for (const sig of stock) {
          const native = matches(base, sig);
          if (matches(live, sig).length >= native.length) continue;
          for (const entry of native) {
            const left = base.slice(Math.max(0, entry.at - 48), entry.at);
            const right = base.slice(
              entry.at + entry.text.length,
              entry.at + entry.text.length + 48,
            );
            const start = left ? live.indexOf(left) : 0;
            if (start < 0 || (left && live.indexOf(left, start + 1) >= 0))
              continue;
            const from = start + left.length;
            const stop = right ? live.indexOf(right, from) : live.length;
            if (stop < from || stop - from > entry.text.length + 512) continue;
            if (
              live.slice(from, stop) !== entry.text &&
              !isKnownRemainder?.(base, live, file)
            )
              throw Error(
                "native permission anchor changed without an exact historical match",
              );
          }
        }
    }
    return current;
  }
  if (candidate === base) return baseline;
  if (!isKnownRemainder?.(base, candidate, file))
    throw Error(
      "unrelated changes differ from the backup; original files preserved",
    );
  if (current.includes("\r\n") && /(?<!\r)\n/.test(current))
    throw Error("mixed line endings in changed file");
  return current.includes("\r\n")
    ? candidate.replace(/\n/g, "\r\n")
    : candidate;
}
export function retiredRulesFor(keys) {
  return rules.filter((rule) => rule.keys.some((key) => keys.includes(key)));
}
function readRegular(file) {
  if (!fs.lstatSync(file).isFile()) throw Error("expected a regular file");
  const bytes = fs.readFileSync(file),
    value = bytes.toString("utf8");
  if (!Buffer.from(value).equals(bytes)) throw Error("invalid UTF-8");
  return value;
}
export async function inspectRetiredPermissions({
  files,
  roots,
  save,
  isKnownRemainder,
}) {
  const targets = new Map(),
    planned = [];
  for (const rule of rules)
    for (const key of rule.keys)
      for (const file of pathsOf(files, key)) {
        if (!file) continue;
        if (!targets.has(file)) targets.set(file, new Set());
        targets.get(file).add(rule);
      }
  for (const [file, items] of targets) {
    try {
      assertWithinRoots(file, roots);
      const current = readRegular(file);
      let backup = null;
      try {
        backup = readRegular(file + ".dshpurge.bak");
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
      const next = recoverRetiredPermissions(
        backup,
        current,
        [...items],
        file,
        isKnownRemainder,
      );
      if (current !== next) planned.push({ file, next, current });
    } catch (cause) {
      throw Error(
        "Legacy permission migration: " + file + ": " + cause.message,
        { cause },
      );
    }
  }
  if (save)
    for (const row of planned) await save(row.file, row.next, row.current);
  return planned.map((row) => row.file);
}
