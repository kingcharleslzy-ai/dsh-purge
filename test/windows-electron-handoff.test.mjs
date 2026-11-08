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
    assert.equal(fs.readFileSync(path.join(fixtureRoot,'collision.asar'),'utf8'),'original fixture');
  } finally {
    fs.rmSync(root,{recursive:true,force:true});
    if(fixtureRoot) fs.rmSync(fixtureRoot,{recursive:true,force:true});
  }
});

test('Windows reports a created helper that exits before its first acknowledgement', {
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
      fs.writeFileSync(helper, 'exit 0\n');
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
  assert.equal(fs.readFileSync(asar, 'utf8'), 'original');
});
