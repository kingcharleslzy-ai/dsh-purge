import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { preferences, savePreferences, updateStatus, updateEnv, publicPreferences, createUpdateController } from "../lib/update-policy.js";
import { rememberUpdate } from "../lib/update.js";

function setup(extra = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-updates-"));
  const waits = new Map(); let checks = 0, installs = 0, seq = 0, diskVersion = "1.6.4";
  const c = createUpdateController({ home, runningVersion: "1.6.4", readInstalledVersion: () => diskVersion,
    check: async () => { checks++; return { ok: true, hasUpdate: true, remoteVersion: "1.6.5" }; },
    install: async () => { installs++; diskVersion = "1.6.5"; return { ok: true, applied: true, localVersion: "1.6.5" }; },
    timers: { setTimeout(fn, delay) { const id = ++seq; waits.set(id, { fn, delay }); return id; }, clearTimeout(id) { waits.delete(id); } },
    ...extra,
  });
  return { home, c, waits, counts: () => ({ checks, installs }), close() { c.stop(); fs.rmSync(home, { recursive: true, force: true }); } };
}
test("preferences default to check-only and preserve legacy automatic-install intent without migration writes", () => {
  const f = setup(); try {
    assert.deepEqual(preferences(f.home), { autoCheck: true, autoInstall: false, intervalHours: 6, proxyUrl: "", githubToken: "" });
    assert.equal(preferences(f.home, { autoUpdateOnStart: true }).autoInstall, true);
    assert.deepEqual(fs.readdirSync(f.home), []);
    fs.writeFileSync(path.join(f.home, "cordis.patch.yml"), "CURRENT SETTINGS");
    savePreferences(f.home, { intervalHours: 12 }, { autoUpdateOnStart: true });
    assert.equal(preferences(f.home).autoInstall, true);
    assert.equal(fs.readFileSync(path.join(f.home, "cordis.patch.yml"), "utf8"), "CURRENT SETTINGS");
    assert.throws(() => savePreferences(f.home, { autoApplyOnStart: true }), /未知字段/);
    assert.throws(() => savePreferences(f.home, { intervalHours: 0 }), /1–168/);
    assert.throws(() => savePreferences(f.home, { autoInstall: "true" }), /开关/);
  } finally { f.close(); }
});
test("checking runs independently from autoApplyOnStart and never installs by default", async () => {
  const f = setup({ legacy: { autoApplyOnStart: false } }); try {
    f.c.start(); assert.equal([...f.waits.values()][0].delay, 30000);
    await [...f.waits.values()][0].fn();
    assert.deepEqual(f.counts(), { checks: 1, installs: 0 });
    assert([...f.waits.values()].some((v) => v.delay === 6 * 3600000));
    assert.equal(updateStatus(f.home).hasUpdate, true);
  } finally { f.close(); }
});
test("switches are saved independently; disabling checks pauses installation and timers", async () => {
  const f = setup(); try {
    savePreferences(f.home, { autoCheck: false, autoInstall: true }); f.c.start(); await f.c.run();
    assert.equal(f.waits.size, 0); assert.deepEqual(f.counts(), { checks: 0, installs: 0 });
    assert.equal(preferences(f.home).autoInstall, true);
    savePreferences(f.home, { autoCheck: true, intervalHours: 1 }); f.c.refresh();
    await f.c.run(); assert.deepEqual(f.counts(), { checks: 1, installs: 1 });
  } finally { f.close(); }
});
test("a completed install stays pending until a new runtime loads it and is never repeated", async () => {
  const f = setup(); try {
    savePreferences(f.home, { autoInstall: true }); f.c.start(); await f.c.run(); await f.c.run();
    assert.deepEqual(f.counts(), { checks: 2, installs: 1 });
    assert.equal(updateStatus(f.home).pendingVersion, "1.6.5");
    assert.equal(updateStatus(f.home).restartRequired, true);
    f.c.stop();
    const next = createUpdateController({ home: f.home, runningVersion: "1.6.5", readInstalledVersion: () => "1.6.5", check: async () => ({}), install: async () => assert.fail(), timers: { setTimeout() {}, clearTimeout() {} } });
    next.start(); next.stop();
    assert.equal(updateStatus(f.home).restartRequired, false);
  } finally { f.close(); }
});
test("a pinned target or failed check cannot trigger an install", async () => {
  for (const result of [{ ok: true, hasUpdate: true, channel: "beta" }, { ok: true, hasUpdate: true, pinned: true }, { ok: false, hasUpdate: true, error: "offline" }]) {
    const f = setup({ check: async () => result }); try {
      savePreferences(f.home, { autoInstall: true }); f.c.start(); await f.c.run();
      assert.equal(f.counts().installs, 0);
    } finally { f.close(); }
  }
});
test("late checks after disposal or switching install off do not install", async () => {
  for (const dispose of [true, false]) {
    let resolve; const f = setup({ check: () => new Promise((r) => { resolve = r; }) }); try {
      savePreferences(f.home, { autoInstall: true }); f.c.start(); const job = f.c.run();
      if (dispose) f.c.stop(); else savePreferences(f.home, { autoInstall: false });
      resolve({ ok: true, hasUpdate: true }); await job;
      assert.equal(f.counts().installs, 0);
    } finally { f.close(); }
  }
});
test("overlapping checks share one operation, and partial installs retain restart evidence", async () => {
  let resolve, calls = 0; const f = setup({
    check: () => { calls++; return new Promise((r) => { resolve = r; }); },
    install: async () => ({ ok: false, applied: true, localVersion: "1.6.5", error: "one profile failed" }),
  }); try {
    savePreferences(f.home, { autoInstall: true }); f.c.start();
    const a = f.c.run(), b = f.c.run(); resolve({ ok: true, hasUpdate: true }); await Promise.all([a,b]);
    assert.equal(calls, 1); assert.equal(updateStatus(f.home).restartRequired, true);
    assert.match(updateStatus(f.home).error, /profile failed/);
  } finally { f.close(); }
});
test("corrupt preferences fail closed; network failures remain visible without changing settings", async () => {
  const f = setup({ check: async () => { throw Error("network down"); } }); try {
    savePreferences(f.home, { autoInstall: true }); f.c.start(); await f.c.run();
    assert.match(updateStatus(f.home).error, /network down/);
    fs.writeFileSync(path.join(f.home, "dsh-purge/update-preferences.json"), "broken");
    await f.c.run(); assert.equal(f.counts().installs, 0);
    assert.equal(fs.readFileSync(path.join(f.home, "dsh-purge/update-preferences.json"), "utf8"), "broken");
  } finally { f.close(); }
});
test("all updater results suppress automatic restart and client reload requests", () => {
  const result = rememberUpdate({ ok: true, restartAfter: true, reloadClient: true, needRestart: true });
  assert.equal(result.restartAfter, false); assert.equal(result.reloadClient, false); assert.equal(result.needRestart, true);
});

test("an uninstalled file: dependency is reported as skipped, not silently ignored", async () => {
  // issue #118 的真实症状：profile 里有 file:<tgz> 依赖但没落地时，
  // 旧 planUpdates() 直接 continue，面板看起来"更新成功但什么都没变"。
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-plan-"));
  const prev = process.env.DSH_HOME;
  try {
    const profile = path.join(home, "profiles/desktop");
    fs.mkdirSync(path.join(profile, "node_modules"), { recursive: true });
    fs.writeFileSync(path.join(home, "x.tgz"), "x");
    fs.writeFileSync(
      path.join(profile, "package.json"),
      JSON.stringify({
        name: "profile",
        private: true,
        dependencies: { "dsh-purge-community": `file:${path.join(home, "x.tgz")}` },
        dsh: { profile: { bundles: ["dsh-purge-community"] } },
      }),
    );
    process.env.DSH_HOME = home;
    const { planUpdates } = await import("../lib/update.js");
    const plan = planUpdates();
    assert(Array.isArray(plan.skipped), "plan exposes skipped sites");
    const hit = plan.skipped.find((s) => s.package === "dsh-purge-community");
    assert(hit, "the file: dependency is surfaced");
    assert.match(hit.reason, /没有安装目录/);
    assert(hit.spec.startsWith("file:"), "the offending spec is included");
  } finally {
    if (prev === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = prev;
    fs.rmSync(home, { recursive: true, force: true });
  }
});

// ---- update channel env + preference validation -----------------------------
const TOKEN = "ghp_" + "a".repeat(36);
function tempHome() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-env-"));
  return {
    home,
    prefs: path.join(home, "dsh-purge/update-preferences.json"),
    channel: path.join(home, "dsh-purge/update-channel.json"),
    done() { fs.rmSync(home, { recursive: true, force: true }); },
  };
}
const readRaw = (f) => JSON.parse(fs.readFileSync(f.prefs, "utf8"));
// 通道凭据单独落盘，密钥相关断言必须读这个文件。
const readChannel = (f) => JSON.parse(fs.readFileSync(f.channel, "utf8"));

test("updateEnv exposes only the channel proxy and token, never the host environment", () => {
  const f = tempHome(); try {
    assert.deepEqual(updateEnv(f.home, {}, {}), {}, "nothing configured means no overrides at all");
    savePreferences(f.home, { proxyUrl: "socks5://127.0.0.1:1080" });
    assert.deepEqual(updateEnv(f.home, {}, {}), { PURGE_HTTPS_PROXY: "socks5://127.0.0.1:1080" });
    savePreferences(f.home, { githubToken: TOKEN });
    assert.deepEqual(updateEnv(f.home, {}, {}), { PURGE_HTTPS_PROXY: "socks5://127.0.0.1:1080", GITHUB_TOKEN: TOKEN },
      "proxy and token coexist");
    assert.equal(Object.keys(updateEnv(f.home, {}, {})).length, 2, "no unrelated variables leak into the update channel");
    savePreferences(f.home, { proxyUrl: "" });
    assert.deepEqual(updateEnv(f.home, {}, {}), { GITHUB_TOKEN: TOKEN }, "an emptied proxyUrl drops PURGE_HTTPS_PROXY");
    savePreferences(f.home, { clearGithubToken: true });
    assert.deepEqual(updateEnv(f.home, {}, {}), {}, "a cleared token drops GITHUB_TOKEN");

  } finally { f.done(); }
});

test("updateEnv preserves inherited proxies and fails visibly on damaged settings", () => {
  const f=tempHome();try {
    const inherited={HTTPS_PROXY:'http://existing.invalid:8080',NO_PROXY:'localhost',GH_TOKEN:'inherited'};
    savePreferences(f.home,{githubToken:TOKEN});
    assert.deepEqual(updateEnv(f.home,{},inherited),{...inherited,GITHUB_TOKEN:TOKEN});
    assert.equal(inherited.GITHUB_TOKEN,undefined);
    fs.writeFileSync(f.channel,'broken json');assert.throws(()=>updateEnv(f.home),/无法读取/);
  } finally {f.done();}
});

test("savePreferences rejects unsupported proxies, missing hosts and malformed tokens", () => {
  const f = tempHome(); try {
    assert.throws(() => savePreferences(f.home, { proxyUrl: "ftp://127.0.0.1:21" }), /仅支持 http \/ https \/ socks5 协议/);
    assert.throws(() => savePreferences(f.home, { proxyUrl: "socks5://" }), /缺少主机名/);
    assert.throws(() => savePreferences(f.home, { proxyUrl: "127.0.0.1:7890" }), /地址无效/);
    assert.throws(() => savePreferences(f.home, { proxyUrl: 7890 }), /必须为字符串/);
    assert.throws(() => savePreferences(f.home, { githubToken: TOKEN.slice(0, 10) }), /密钥格式无效/);
    assert.throws(() => savePreferences(f.home, { githubToken: TOKEN + " b" }), /密钥格式无效/);
    assert.throws(() => savePreferences(f.home, { githubToken: "x".repeat(256) }), /密钥格式无效/);
    assert.throws(() => savePreferences(f.home, { githubToken: null }), /必须为字符串/);
    assert.equal(fs.existsSync(f.prefs), false, "a rejected patch writes nothing");
    for (const proxyUrl of ["http://127.0.0.1:7890", "https://proxy.example:8443", "socks5://127.0.0.1:1080", "socks5h://user:pw@127.0.0.1:1080", "socks://127.0.0.1:1080"]) {
      assert.equal(savePreferences(f.home, { proxyUrl }).proxyUrl, proxyUrl, `${proxyUrl} is accepted`);
    }
    assert.equal(savePreferences(f.home, { githubToken: TOKEN }).githubToken, TOKEN, "a 40 character token is accepted");
  } finally { f.done(); }
});

test("an empty githubToken keeps the stored secret; clearGithubToken is the only way to drop it", () => {
  const f = tempHome(); try {
    savePreferences(f.home, { githubToken: TOKEN });
    // The panel never echoes the secret back, so an empty field means "unchanged".
    assert.equal(savePreferences(f.home, { githubToken: "" }).githubToken, TOKEN);
    assert.equal(preferences(f.home).githubToken, TOKEN);
    assert.equal(savePreferences(f.home, { autoCheck: false }).githubToken, TOKEN, "an omitted field also keeps the secret");
    assert.equal(savePreferences(f.home, { githubToken: undefined }).githubToken, TOKEN);
    assert.equal(readChannel(f).githubToken, TOKEN, "the untouched secret is still on disk");
    assert.equal(preferences(f.home).autoCheck, false, "the unrelated field still took effect");

    assert.equal(savePreferences(f.home, { clearGithubToken: true }).githubToken, "", "clearGithubToken wipes the secret");
    assert.equal(preferences(f.home).githubToken, "");
    assert.equal(readChannel(f).githubToken, "", "the wipe is persisted, not just returned");
    assert.equal("clearGithubToken" in readChannel(f), false, "the control flag itself is never persisted");
    assert.deepEqual(updateEnv(f.home, {}, {}), {}, "updateEnv stops sending the removed token");

    assert.equal(savePreferences(f.home, { clearGithubToken: false }).githubToken, "");
    assert.equal(savePreferences(f.home, { githubToken: TOKEN, clearGithubToken: true }).githubToken, "",
      "clear wins when both are sent in one patch");
    assert.deepEqual(updateEnv(f.home, {}, {}), {}, "the same patch cannot re-add the token it clears");
    savePreferences(f.home, { githubToken: TOKEN });
    assert.deepEqual(updateEnv(f.home, {}, {}), { GITHUB_TOKEN: TOKEN }, "a new token can be set again afterwards");
    // A non-boolean clear flag is rejected outright instead of being silently
    // ignored: otherwise the panel could show "cleared" while the token survives.
    assert.throws(() => savePreferences(f.home, { githubToken: TOKEN, clearGithubToken: "yes" }), /布尔/,
      "a non-boolean clearGithubToken is rejected");
    assert.throws(() => savePreferences(f.home, { clearGithubToken: 1 }), /布尔/,
      "a numeric clearGithubToken is rejected");
    assert.equal(updateEnv(f.home, {}, {}).GITHUB_TOKEN, TOKEN, "a rejected patch leaves the stored token untouched");
    assert.equal(savePreferences(f.home, { clearGithubToken: true }).githubToken, "");
    assert.equal("clearGithubToken" in readChannel(f), false, "the control flag itself is never persisted");
  } finally { f.done(); }
});

test('channel secrets are not returned by the public preferences projection',()=>{
 const f=tempHome();try {
  const saved=savePreferences(f.home,{proxyUrl:'socks5://user:secret@proxy.test:1080',githubToken:TOKEN});
  const visible=publicPreferences(saved);
  assert.equal(visible.proxyUrl,'socks5://proxy.test:1080');assert.equal(visible.githubToken,'');
  assert(visible.hasGithubToken && visible.hasProxyCredentials);
  if(process.platform!=='win32')assert.equal(fs.statSync(f.channel).mode&0o777,0o600);
  savePreferences(f.home,{intervalHours:24});assert.equal(preferences(f.home).proxyUrl,saved.proxyUrl);
 }finally{f.done();}
});


test('malformed channel credentials produce a redacted error rather than JSON parser plaintext',()=>{
  const home=fs.mkdtempSync(path.join(os.tmpdir(),'purge-malformed-channel-'));
  try {
    fs.mkdirSync(path.join(home,'dsh-purge'));
    fs.writeFileSync(path.join(home,'dsh-purge','update-channel.json'),'SENSITIVE_FAKE_TOKEN_NOT_JSON');
    assert.throws(()=>preferences(home),e=>/JSON/.test(e.message)&&!e.message.includes('SENSITIVE'));
  }finally{fs.rmSync(home,{recursive:true,force:true});}
});
