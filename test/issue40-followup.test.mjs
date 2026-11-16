import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ALL_PATCHES, patchStatus, patchDrift } from "../lib/core.js";
import { detectSurface } from "../lib/surface.js";
import { hostSurface } from "../lib/instance.js";
import { liangshenPresence } from "../lib/preset-presence.js";
import { tallyPatchStatus } from "../lib/selfcheck.js";
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-40-"));
  const home = path.join(root, "home"),
    app = path.join(root, "any-name.app/Contents/Resources/app"),
    host = path.join(app, "dsh/node_modules/@deepseek-ai");
  fs.mkdirSync(home);
  fs.mkdirSync(host, { recursive: true });
  return {
    root,
    home,
    app,
    host,
    close() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}
const patches = ALL_PATCHES.filter((p) => [71, 83].includes(p.id));
test("#40 terminal desktop target uses its own shell, missing real shell remains broken", async () => {
  const f = fixture();
  try {
    fs.mkdirSync(path.join(f.app, "lib"));
    fs.writeFileSync(
      path.join(f.app, "lib/main.js"),
      patches.find((p) => p.id === 83).markers.join("\n"),
    );
    assert.equal(
      detectSurface({
        env: { PURGE_DSH_CLI: f.host + "/dsh-desktop-host/lib/cli.js" },
        argv: [],
        execPath: "/usr/bin/node",
        resourcesPath: "",
      }),
      "web",
    );
    const opts = { dshHome: f.home, surface: hostSurface(f.host) };
    assert.equal((await patchStatus(f.host, patches, opts))[83], "applied");
    assert.equal((await patchDrift(f.host, patches, opts)).missing.length, 0);
    fs.unlinkSync(path.join(f.app, "lib/main.js"));
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
test("#40 absent third-party family is na; installed-but-damaged stays missing", async () => {
  const f = fixture();
  try {
    const opts = { dshHome: f.home, surface: "desktop" };
    const status = await patchStatus(f.host, patches, opts);
    assert.equal(status[71], "na");
    assert.equal(
      tallyPatchStatus({ 71: status[71] }, [patches.find((p) => p.id === 71)])
        .total,
      0,
    );
    const preset = path.join(f.home, ".agent-presets/liangshen");
    fs.mkdirSync(preset, { recursive: true });
    assert.equal(
      (await patchStatus(f.host, patches, opts))[71],
      "missing_file",
    );
    fs.writeFileSync(path.join(preset, "agent.cordis.yml"), "malformed: [");
    assert.equal((await patchStatus(f.host, patches, opts))[71], "unmatched");
    fs.rmSync(preset, { recursive: true });
    const profile = path.join(f.home, "profiles/custom");
    fs.mkdirSync(profile, { recursive: true });
    fs.writeFileSync(
      path.join(profile, "package.json"),
      JSON.stringify({ dependencies: { "@linxin666/dsh-liangshen": "1" } }),
    );
    assert.equal(
      (await patchStatus(f.host, patches, opts))[71],
      "missing_file",
    );
    fs.writeFileSync(path.join(profile, "package.json"), "{broken");
    assert.equal((await patchStatus(f.host, patches, opts))[71], "unknown");
    const denied = {
      readdirSync() {
        throw Object.assign(Error("denied"), { code: "EACCES" });
      },
    };
    assert.equal(liangshenPresence(f.home, denied), "unknown");
  } finally {
    f.close();
  }
});
