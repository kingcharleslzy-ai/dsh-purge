import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as wait } from 'node:timers/promises';
import { WINDOWS_ASAR_HANDOFF_PS1, readWindowsAsarHandoff } from '../lib/windows-asar-handoff.js';

// 夹具用 import.meta.url 定位：Windows 上 cwd 可能被外层脚本改掉，
// 用 cwd 拼接时（path.resolve 相对写法）会指向不存在的路径。
const FIXTURE_ERRORS = fileURLToPath(new URL('./fixtures/windows-handoff-errors.ps1', import.meta.url));

const electron = process.env.PURGE_ELECTRON_EXEC;
test('real Windows Electron: helper executes and survives its launcher exiting', {
  skip: process.platform !== 'win32' || !electron,
}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'purge electron 中文 '));
  const exe = path.join(root, 'holder.exe'), asar = path.join(root, 'app.asar');
  fs.copyFileSync(process.execPath, exe);
  fs.mkdirSync(path.join(root, 'app'));
  fs.writeFileSync(path.join(root, 'app/package.json'), '{}');
  fs.writeFileSync(asar, 'original archive');
  const holder = spawn(exe, ['-e', 'setInterval(()=>{},1000)'], { stdio: 'ignore' });
  const launcher = path.join(root, 'launcher.mjs');
  fs.writeFileSync(launcher, `
    import {setTimeout as wait} from 'node:timers/promises';
    import {scheduleWindowsAsarHandoff,readWindowsAsarHandoff} from ${JSON.stringify(new URL('../lib/windows-asar-handoff.js', import.meta.url).href)};
    if(!process.versions.electron) throw Error('actual Electron required');
    const asar=${JSON.stringify(asar)};
    scheduleWindowsAsarHandoff({exe:${JSON.stringify(exe)},asar});
    for(let i=0;i<100;i++){
      await wait(100);
      const s=readWindowsAsarHandoff(asar);
      if(s?.phase==='waiting_for_quit') { console.log(JSON.stringify({electron:process.versions.electron,phase:s.phase})); break; }
      if(s?.phase==='failed'||i===99) throw Error(JSON.stringify(s));
    }
  `);
  let helperPid;
  try {
    const out = execFileSync(electron, [launcher], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', DSH_HOME: path.join(root, 'home') },
      encoding: 'utf8', timeout: 15000,
    });
    assert.equal(JSON.parse(out.trim()).phase, 'waiting_for_quit');
    helperPid = readWindowsAsarHandoff(asar).pid;
    await wait(1000);
    assert.doesNotThrow(() => process.kill(helperPid, 0), 'helper must outlive its Electron launcher');
    assert.equal(fs.readFileSync(asar, 'utf8'), 'original archive');
    holder.kill();
    for(let i=0;i<100 && readWindowsAsarHandoff(asar)?.phase!=='complete';i++) await wait(100);
    const state = readWindowsAsarHandoff(asar);
    assert.equal(state.phase, 'complete');
    assert.equal(fs.existsSync(asar), false);
    assert.equal(fs.readFileSync(state.backup, 'utf8'), 'original archive');
  } finally {
    holder.kill();
    if(helperPid)try { process.kill(helperPid); } catch {}
    await wait(300);
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('Windows native sharing violation retries, permanent collision fails without overwriting', {
  skip: process.platform !== 'win32',
}, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-error-test-'));
  const helper = path.join(root,'helper.ps1');
  let fixtureRoot;
  try {
    fs.writeFileSync(helper,WINDOWS_ASAR_HANDOFF_PS1,'utf8');
    const output=execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',
      FIXTURE_ERRORS,'-Helper',helper],{encoding:'utf8',timeout:75000});
    const result=JSON.parse(output.replace(/^\uFEFF/,'')); fixtureRoot=result.root;
    const locked=result.results.find(r=>r.scenario==='locked');
    assert.equal(locked.exited,true,JSON.stringify(locked));
    assert.equal(locked.observed.phase,'waiting_for_unlock');
    assert.equal(locked.observed.error.win32_code,32);
    assert.equal(locked.final.phase,'complete');
    assert.equal(locked.exitCode,0);
    assert.equal(locked.backupExists,true,'备份文件必须存在，否则换包没真正发生');
    assert.equal(locked.backupText,'original fixture');
    assert.equal(locked.originalExists,false);
    const collision=result.results.find(r=>r.scenario==='collision');
    assert.equal(collision.exited,true,JSON.stringify(collision));
    assert.equal(collision.final?.phase,'failed',JSON.stringify(collision));
    assert.equal(collision.observed.phase,'failed');
    assert.equal(collision.exitCode,1);
    assert.equal(collision.observed.error.win32_code,183);
    assert.equal(collision.backupText,'existing backup');
    assert.equal(collision.originalExists,true);
    const blocked=result.results.find(r=>r.scenario==='locked_state');
    assert.equal(blocked.exited,true);
    assert.equal(blocked.exitCode,1);
    assert.equal(blocked.final?.phase,'starting','no acknowledgement was persisted');
    assert.equal(blocked.backupExists,false);
    assert.equal(fs.readFileSync(path.join(fixtureRoot,'locked_state.asar'),'utf8'),'original fixture');
    const diagnostic=fs.readFileSync(path.join(fixtureRoot,'locked_state.asar.json.log'),'utf8');
    assert.match(diagnostic,/failed_to_save_failure primary_hresult=-?\d+ primary_win32=\d+ state_write_hresult=-?\d+/);
    assert.equal(fs.readFileSync(path.join(fixtureRoot,'collision.asar'),'utf8'),'original fixture');
  } finally {
    fs.rmSync(root,{recursive:true,force:true});
    if(fixtureRoot) fs.rmSync(fixtureRoot,{recursive:true,force:true});
  }
});

for (const [scenario, script, exitCode] of [
  ['script exits normally', 'exit 0', 0],
  ['script returns nonzero to PowerShell', 'exit 5', 1],
  ['PowerShell process exits with 5', '[Environment]::Exit(5)', 5],
]) test(`Windows reports the helper process exit separately: ${scenario}`, {
  skip: process.platform !== 'win32',
}, async t => {
  const {scheduleWindowsAsarHandoff} = await import('../lib/windows-asar-handoff.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-no-ack-'));
  t.after(() => fs.rmSync(dir, {recursive:true, force:true}));
  const asar = path.join(dir, 'app.asar');
  fs.writeFileSync(asar, 'original');
  const statePath = asar + '.purge-handoff.json';
  scheduleWindowsAsarHandoff({exe:process.execPath, asar}, {
    spawn(command, args, options) {
      const {token} = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      const helper = path.join(os.tmpdir(), 'dsh-purge-handoff-' + token + '.ps1');
      t.after(() => fs.rmSync(helper, {force:true}));
      fs.writeFileSync(helper, script + '\n');
      return spawn(command, args, options);
    }
  });
  let state;
  for (let i = 0; i < 200; i++) {
    await wait(200);
    state = readWindowsAsarHandoff(asar);
    if (state?.phase === 'failed') break;
  }
  assert.equal(state?.phase, 'failed', JSON.stringify(state));
  const log = fs.readFileSync(statePath + '.broker.log', 'utf8');
  assert.match(log, /child_pid=[1-9]\d*/);
  assert.match(log, /before acknowledging startup|did not acknowledge startup/);
  assert.match(state.detail, /broker_exit_code=1/);
  // On locked-down systems a short-lived helper may disappear before a handle opens.
  const observed = /child_exit_code=(\d+|unknown)/.exec(log)?.[1];
  assert.ok(observed === String(exitCode) || observed === 'unknown', log);
  assert.equal(fs.readFileSync(asar, 'utf8'), 'original');
});

test('concurrent state readers see complete JSON through archive lock retries and offline rollback', {
  skip: process.platform !== 'win32',
}, t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-state-json-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const helper = path.join(root, 'helper.ps1');
  fs.writeFileSync(helper, WINDOWS_ASAR_HANDOFF_PS1, 'utf8');
  const fixture = fileURLToPath(new URL('./fixtures/windows-handoff-state-reader.ps1', import.meta.url));
  const stdout = execFileSync('powershell.exe', ['-NoProfile', '-File', fixture, '-Helper', helper],
    { encoding: 'utf8', timeout: 40000 });
  const result = JSON.parse(stdout);
  assert.ok(result.reads >= 3);
  assert.equal(result.lockCycles, 3);
  assert.equal(result.rollback, true);
});
