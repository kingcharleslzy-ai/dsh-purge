import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  resolveDesktopEntry,
  SHELL_MAIN_CANDIDATES,
} from "../lib/desktop-entry.js";
import {
  ALL_PATCHES,
  targetFiles,
  patchStatus,
  patchDrift,
} from "../lib/core.js";
import { rollupLayers } from "../lib/selfcheck.js";
import { removeTreeNoFollowSync } from "../lib/remove-tree.js";
const patches = ALL_PATCHES.filter((p) => [82, 83, 84].includes(p.id));
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-entry-"));
  const app = path.join(root, "Chosen Desktop", "resources", "app"),
    host = path.join(app, "node_modules/@deepseek-ai"),
    home = path.join(root, "home");
  fs.mkdirSync(host, { recursive: true });
  fs.mkdirSync(home);
  return {
    root,
    app,
    host,
    home,
    write(rel, text = patches.flatMap((p) => p.markers).join("\n")) {
      const f = path.join(app, rel);
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, text);
      return f;
    },
    close() {
      removeTreeNoFollowSync(root);
    },
  };
}
for (const layout of SHELL_MAIN_CANDIDATES)
  test(`shell layout ${layout}: status and diagnostics use selected target`, async () => {
    const f = fixture();
    try {
      const file = f.write(layout),
        opts = { dshHome: f.home, surface: "desktop" };
      assert.equal(resolveDesktopEntry(f.app).file, file);
      assert.equal(targetFiles(f.host, f.home)["desktop-shell"], file);
      const status = await patchStatus(f.host, patches, opts);
      assert.deepEqual(status, { 82: "applied", 83: "applied", 84: "applied" });
      const layer = rollupLayers(status, true, { patches }).find(
        (l) => l.title === "desktop host startup fallback",
      );
      assert.equal(layer.state, "ok");
      assert.equal(layer.applied, 3);
      const drift = await patchDrift(f.host, patches, opts);
      assert.equal(drift.desktop_entry.file, file);
      assert.equal(drift.missing.length, 0);
      fs.unlinkSync(file);
      assert.equal(
        (await patchStatus(f.host, patches, opts))[83],
        "missing_file",
      );
      assert(
        (await patchDrift(f.host, patches, opts)).missing.some(
          (p) => p.id === 83,
        ),
      );
    } finally {
      f.close();
    }
  });
test("declared main wins over stale candidates, including custom .cjs and backslashes", () => {
  const f = fixture();
  try {
    for (const n of SHELL_MAIN_CANDIDATES) f.write(n);
    const file = f.write("build/entry.cjs");
    f.write("package.json", JSON.stringify({ main: "./build\\entry.cjs" }));
    assert.equal(resolveDesktopEntry(f.app).file, file);
  } finally {
    f.close();
  }
});
test("broken explicit main never falls back to a valid stale main", () => {
  const f = fixture();
  try {
    f.write("main.js");
    for (const [main, state] of [
      ["missing.js", "missing_entry"],
      ["../outside.js", "outside_app"],
      ["/outside.js", "invalid_main"],
      ["C:\\outside.js", "invalid_main"],
      ["\\\\server\\share\\main.js", "invalid_main"],
      ["C:relative.js", "invalid_main"],
      ["", "invalid_main"],
      [null, "invalid_main"],
      ["out", "not_file"],
    ]) {
      fs.mkdirSync(path.join(f.app, "out"), { recursive: true });
      f.write("package.json", JSON.stringify({ main }));
      assert.equal(
        resolveDesktopEntry(f.app).state,
        state,
        JSON.stringify(main),
      );
      assert.equal(resolveDesktopEntry(f.app).file, "");
    }
    for (const value of ["{bad", "null", "[]", "42"]) {
      f.write("package.json", value);
      assert.equal(resolveDesktopEntry(f.app).state, "invalid_manifest");
    }
  } finally {
    f.close();
  }
});
test("missing declaration permits one candidate; ambiguity stays visible", () => {
  const f = fixture();
  try {
    f.write("package.json", "{}");
    assert.equal(resolveDesktopEntry(f.app).state, "missing_entry");
    f.write("main.js");
    assert.equal(resolveDesktopEntry(f.app).state, "resolved");
    f.write("out/main/index.js");
    assert.equal(resolveDesktopEntry(f.app).state, "ambiguous_entry");
  } finally {
    f.close();
  }
});
test("junction escaping selected app and IO errors cannot produce a valid entry", () => {
  const f = fixture();
  try {
    const outside = path.join(f.root, "outside");
    fs.mkdirSync(outside);
    fs.writeFileSync(path.join(outside, "index.js"), "external");
    fs.symlinkSync(
      outside,
      path.join(f.app, "out"),
      process.platform === "win32" ? "junction" : "dir",
    );
    f.write("package.json", JSON.stringify({ main: "out/index.js" }));
    assert.equal(resolveDesktopEntry(f.app).state, "outside_app");
    const reader = {
      ...fs,
      readFileSync() {
        throw Object.assign(Error("denied"), { code: "EACCES" });
      },
    };
    assert.equal(resolveDesktopEntry(f.app, reader).code, "EACCES");
  } finally {
    f.close();
  }
});
test("another app cannot satisfy missing selected shell; unsupported source remains drifted", async () => {
  const f = fixture();
  try {
    const other = path.join(f.root, "other/resources/app");
    fs.mkdirSync(other, { recursive: true });
    fs.writeFileSync(path.join(other, "main.js"), "other");
    assert.equal(targetFiles(f.host, f.home)["desktop-shell"], undefined);
    f.write("out/main/index.js", "// unsupported bundle");
    const drift = await patchDrift(f.host, patches, {
      dshHome: f.home,
      surface: "desktop",
    });
    assert(drift.drifted.some((p) => p.id === 83));
    assert.equal(drift.desktop_entry.state, "resolved");
  } finally {
    f.close();
  }
});
