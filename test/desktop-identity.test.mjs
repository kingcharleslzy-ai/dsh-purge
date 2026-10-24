import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { diskFs } from "../lib/extract-asar.js";
import {
  desktopIdentity,
  hasDesktopIdentity,
  clearDesktopIdentityCache,
} from "../lib/desktop-identity.js";
import { clearDesktopLocateCache } from "../lib/desktop.js";

const fs = diskFs();

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge identity "));
  const resources = path.join(root, "resources");
  const host = path.join(resources, "app", "dsh", "node_modules", "@deepseek-ai", "dsh-desktop-host");
  fs.mkdirSync(path.join(host, "lib"), { recursive: true });
  fs.writeFileSync(path.join(host, "package.json"), JSON.stringify({ name: "@deepseek-ai/dsh-desktop-host" }));
  fs.writeFileSync(path.join(host, "lib", "cli.js"), "// entry\n");
  return { root, resources, close: () => fs.rmSync(root, { recursive: true, force: true }) };
}

test("宿主身份证据按 resources 记忆，清缓存后才重新读盘", () => {
  const f = fixture();
  try {
    clearDesktopIdentityCache();
    const first = desktopIdentity(f.resources);
    assert.equal(first.kind, "bundled-host");
    assert.equal(desktopIdentity(f.resources), first);
    assert.equal(hasDesktopIdentity(f.resources, "bundled-host"), true);

    clearDesktopIdentityCache();
    const fresh = desktopIdentity(f.resources);
    assert.equal(fresh.kind, "bundled-host");
    assert.notEqual(fresh, first);
  } finally {
    clearDesktopIdentityCache();
    f.close();
  }
});

test("新出现的 app.asar 不会沿用旧的目录结论", () => {
  const f = fixture();
  try {
    clearDesktopIdentityCache();
    assert.equal(desktopIdentity(f.resources).kind, "bundled-host");
    fs.writeFileSync(path.join(f.resources, "app.asar"), "not an asar");
    assert.throws(() => desktopIdentity(f.resources));
    assert.equal(hasDesktopIdentity(f.resources, "bundled-host"), false);
  } finally {
    clearDesktopIdentityCache();
    f.close();
  }
});

test("clearDesktopLocateCache 会一并丢弃身份证据", () => {
  const f = fixture();
  try {
    clearDesktopIdentityCache();
    const first = desktopIdentity(f.resources);
    assert.equal(first.kind, "bundled-host");
    clearDesktopLocateCache();
    const after = desktopIdentity(f.resources);
    assert.equal(after.kind, "bundled-host");
    assert.notEqual(after, first);
  } finally {
    clearDesktopIdentityCache();
    f.close();
  }
});

test("非宿主目录不产生可记忆的结论", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge identity none "));
  try {
    const resources = path.join(root, "resources");
    fs.mkdirSync(path.join(resources, "app"), { recursive: true });
    clearDesktopIdentityCache();
    assert.equal(desktopIdentity(resources), null);
    assert.equal(hasDesktopIdentity(resources), false);
    const host = path.join(resources, "app", "dsh", "node_modules", "@deepseek-ai", "dsh-desktop-host");
    fs.mkdirSync(path.join(host, "lib"), { recursive: true });
    fs.writeFileSync(path.join(host, "package.json"), JSON.stringify({ name: "@deepseek-ai/dsh-desktop-host" }));
    fs.writeFileSync(path.join(host, "lib", "cli.js"), "// entry\n");
    assert.equal(desktopIdentity(resources).kind, "bundled-host");
  } finally {
    clearDesktopIdentityCache();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
