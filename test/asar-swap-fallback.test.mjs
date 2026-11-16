// PR #11 recovery, strengthened to assert the lifecycle and execute the real PS
// helper on Windows. A pending marker alone is never considered success.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { spawn, spawnSync } from 'node:child_process';
import { WINDOWS_ASAR_HANDOFF_PS1 as script, scheduleWindowsAsarHandoff, readWindowsAsarHandoff } from '../lib/windows-asar-handoff.js';
const temp = () => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'purge handoff 中文 ')));
const powershell=process.env.PURGE_TEST_POWERSHELL || 'powershell.exe';
const wait = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms=12000) { const end=Date.now()+ms; while(Date.now()<end) { if(fn())return; await wait(100); } throw Error('handoff timeout'); }
function fixture() { const root=temp(); fs.mkdirSync(path.join(root,'app'));fs.writeFileSync(path.join(root,'app/package.json'),'{}');const asar=path.join(root,'app.asar');fs.writeFileSync(asar,'original archive');return {root,asar}; }

test('Windows handoff requests manual quit without exit, kill, or relaunch', () => {
  assert.doesNotMatch(script, /Stop-Process|Start-Process|taskkill|Remove-Item.*\$backup/);
  const f=fixture();const child=new EventEmitter();child.unref=()=>{};let args;
  try {
    const result=scheduleWindowsAsarHandoff({exe:'test.exe',asar:f.asar},{spawn:(...a)=>{args=a;return child;}});
    assert.equal(result.manualQuit,true);assert.equal(result.restarting,false);assert.equal(result.handoff.phase,'starting');
    assert.equal(args[0],'powershell.exe'); assert.equal(fs.readFileSync(f.asar,'utf8'),'original archive');
    assert.equal(args[2].detached,false);assert.equal(args[2].windowsHide,true);
    child.emit('error',Error('spawn blocked'));assert.equal(readWindowsAsarHandoff(f.asar).phase,'failed');
    assert.equal(fs.readFileSync(f.asar,'utf8'),'original archive');
  } finally {fs.rmSync(f.root,{recursive:true,force:true});}
});

test('stale legacy pending marker does not suppress a new worker',()=>{
  const f=fixture();try {fs.writeFileSync(f.asar+'.rename-pending','stale');const child=new EventEmitter();child.unref=()=>{};let called=0;scheduleWindowsAsarHandoff({exe:'test.exe',asar:f.asar},{spawn:()=>{called++;return child;}});assert.equal(called,1);
  fs.writeFileSync(f.asar+'.purge-handoff.json',JSON.stringify({phase:'waiting_for_quit',pid:2147483647,updated_at:'2000-01-01'}));assert.equal(readWindowsAsarHandoff(f.asar).phase,'helper_stopped');
  }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});

test('synchronous helper launch failure is recorded without changing the archive',()=>{
 const f=fixture();try {
  assert.throws(()=>scheduleWindowsAsarHandoff({exe:'test.exe',asar:f.asar},{spawn:()=>{throw Error('launch denied');}}),/launch denied/);
  assert.equal(readWindowsAsarHandoff(f.asar).phase,'failed');
  assert.equal(fs.readFileSync(f.asar,'utf8'),'original archive');
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});

test('real Windows PowerShell: wait for process, preserve archive, complete without restarting',{skip:process.platform!=='win32'},async()=>{
  const f=fixture();const exe=path.join(f.root,'holder.exe');fs.copyFileSync(process.execPath,exe);
  const ready=path.join(f.root,'holder-ready');
  const holder=spawn(exe,['-e',"require('node:fs').writeFileSync(process.argv[1],'ready');setInterval(()=>{},1000)",ready],{stdio:'ignore'});
  const ps=path.join(f.root,'handoff.ps1');fs.writeFileSync(ps,script);const state=f.asar+'.purge-handoff.json';let helper;
  try {
    await until(()=>fs.existsSync(ready));
    helper=spawn(powershell,['-NoProfile','-File',ps,'-ExePath',exe,'-AsarPath',f.asar,'-StatePath',state,'-Token','test','-TimeoutSeconds','10','-PollMilliseconds','100'],{stdio:'pipe'});
    let stderr='';helper.stderr.on('data',b=>stderr+=b);
    await until(()=>readWindowsAsarHandoff(f.asar)?.phase==='waiting_for_quit',30000).catch(e=>{throw Error(e.message+' exit='+helper.exitCode+' state='+JSON.stringify(readWindowsAsarHandoff(f.asar))+' '+stderr)});
    assert.ok(fs.existsSync(f.asar));assert.equal(holder.exitCode,null);
    holder.kill();await until(()=>readWindowsAsarHandoff(f.asar)?.phase==='complete');
    assert.equal(fs.existsSync(f.asar),false);assert.equal(fs.readFileSync(f.asar+'.purge-test.bak','utf8'),'original archive');assert.equal(stderr,'');
  }finally {holder.kill();helper?.kill();await wait(200);fs.rmSync(f.root,{recursive:true,force:true});}
});

test('real Windows PowerShell: missing unpacked app fails visibly, leaves original',{skip:process.platform!=='win32'},()=>{
 const f=fixture();try{fs.rmSync(path.join(f.root,'app'),{recursive:true});const ps=path.join(f.root,'handoff.ps1');fs.writeFileSync(ps,script);const r=spawnSync(powershell,['-NoProfile','-File',ps,'-ExePath',path.join(f.root,'missing.exe'),'-AsarPath',f.asar,'-StatePath',f.asar+'.purge-handoff.json','-Token','missing'],{encoding:'utf8'});assert.equal(r.status,1);assert.equal(readWindowsAsarHandoff(f.asar).phase,'failed');assert.equal(fs.readFileSync(f.asar,'utf8'),'original archive');}finally{fs.rmSync(f.root,{recursive:true,force:true});}
});

test('real Windows PowerShell: missing unpacked runtime blocks handoff and retains archive',{skip:process.platform!=='win32'},()=>{
 const f=fixture();try {
  const entry=path.join(f.root,'runtime/primary-runtime/dependencies/pnpm/bin/pnpm.mjs');fs.mkdirSync(path.dirname(entry),{recursive:true});fs.writeFileSync(entry,'runtime');
  const ps=path.join(f.root,'handoff.ps1');fs.writeFileSync(ps,script);
  const r=spawnSync(powershell,['-NoProfile','-File',ps,'-ExePath',path.join(f.root,'missing.exe'),'-AsarPath',f.asar,'-StatePath',f.asar+'.purge-handoff.json','-Token','runtime'],{encoding:'utf8'});
  assert.equal(r.status,1);assert.match(readWindowsAsarHandoff(f.asar).detail,/app\/runtime is unavailable/);assert.equal(fs.readFileSync(f.asar,'utf8'),'original archive');
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});


test('real Windows PowerShell: locked archive retries, timeout and changed archive remain visible',{skip:process.platform!=='win32'},async()=>{
 const f=fixture();const ps=path.join(f.root,'handoff.ps1');fs.writeFileSync(ps,script);
 const state=f.asar+'.purge-handoff.json';const ready=path.join(f.root,'locker-ready');
 const quote=s=>"'"+s.replaceAll("'","''")+"'";
 const lockerScript=`$f=[IO.File]::Open(${quote(f.asar)},[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::Read);[IO.File]::WriteAllText(${quote(ready)},'ready');Start-Sleep -Seconds 30`;
 const locker=spawn(powershell,['-NoProfile','-EncodedCommand',Buffer.from(lockerScript,'utf16le').toString('base64')],{stdio:'ignore'});
 let helper;
 try {
  await until(()=>fs.existsSync(ready));
  helper=spawn(powershell,['-NoProfile','-File',ps,'-ExePath',path.join(f.root,'none.exe'),'-AsarPath',f.asar,'-StatePath',state,'-Token','locked','-TimeoutSeconds','1','-PollMilliseconds','100'],{stdio:'ignore'});
  await until(()=>readWindowsAsarHandoff(f.asar)?.phase==='expired');
  // Save-State publishes JSON before appending its log. A terminal phase is
  // not proof that PowerShell has closed the log handle (Windows sharing lock).
  await until(()=>helper.exitCode!==null || helper.signalCode!==null);
  assert.equal(helper.exitCode,2,'expired helper must finish with its timeout exit code');
  assert.equal(fs.readFileSync(f.asar,'utf8'),'original archive');assert.match(fs.readFileSync(state+'.log','utf8'),/waiting_for_unlock/);
  locker.kill();helper.kill();await wait(300);
  // Keep a known executable alive so we can replace the archive between ready
  // and quit, simulating an official update during the handoff window.
  const exe=path.join(f.root,'holder.exe');fs.copyFileSync(process.execPath,exe);const holderReady=path.join(f.root,'holder-ready');const holder=spawn(exe,['-e',"require('node:fs').writeFileSync(process.argv[1],'ready');setInterval(()=>{},1000)",holderReady],{stdio:'ignore'});
  fs.rmSync(state);helper=spawn(powershell,['-NoProfile','-File',ps,'-ExePath',exe,'-AsarPath',f.asar,'-StatePath',state,'-Token','changed','-TimeoutSeconds','10','-PollMilliseconds','100'],{stdio:'ignore'});
  try {await until(()=>fs.existsSync(holderReady));await until(()=>readWindowsAsarHandoff(f.asar)?.phase==='waiting_for_quit');fs.writeFileSync(f.asar,'new official archive');holder.kill();await until(()=>readWindowsAsarHandoff(f.asar)?.phase==='failed');assert.match(readWindowsAsarHandoff(f.asar).detail,/Archive changed/);assert.equal(fs.readFileSync(f.asar,'utf8'),'new official archive');}
  finally{holder.kill();}
 }finally{locker.kill();helper?.kill();await wait(300);fs.rmSync(f.root,{recursive:true,force:true});}
});

test('a broker PID alone cannot keep a never-acknowledged attempt pending', () => {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'handoff-startup-'));
 try {
   const asar=path.join(root,'app.asar');
   fs.writeFileSync(asar,'fixture');
   for(const updated_at of ['2000-01-01','invalid']){
     fs.writeFileSync(asar+'.purge-handoff.json', JSON.stringify({token:'probe',phase:'starting',pid:process.pid,updated_at}));
     assert.equal(readWindowsAsarHandoff(asar).phase,'helper_stopped');
   }
   assert.equal(fs.readFileSync(asar,'utf8'),'fixture');
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('an unreadable attempt does not start a second Windows handoff', t => {
  const {root, asar} = fixture();
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const state = asar + '.purge-handoff.json';
  fs.writeFileSync(state, '{truncated');
  assert.equal(readWindowsAsarHandoff(asar), null);
  assert.throws(() => scheduleWindowsAsarHandoff({exe: 'unused.exe', asar}), SyntaxError);
  assert.equal(fs.readFileSync(state, 'utf8'), '{truncated');
  assert.equal(fs.existsSync(asar + '.rename-pending'), false);
});

// The broker is a PowerShell string built inside scheduleWindowsAsarHandoff and handed to
// powershell.exe as -EncodedCommand base64; it is not exported. Capture it from the injected
// spawn so these assertions read the script that actually runs, never a reimplementation.
function capturedBroker() {
  const f = fixture();
  const child = new EventEmitter();
  child.unref = () => {};
  let brokerScript = '';
  try {
    scheduleWindowsAsarHandoff({ exe: 'test.exe', asar: f.asar }, {
      spawn(command, args) {
        const encoded = args[args.indexOf('-EncodedCommand') + 1];
        brokerScript = Buffer.from(encoded, 'base64').toString('utf16le');
        return child;
      },
    });
  } finally {
    fs.rmSync(f.root, { recursive: true, force: true });
  }
  return brokerScript;
}

test('broker separates acknowledged, gone and unknown instead of treating them alike', () => {
  const s = capturedBroker();
  assert.ok(s.length > 0, 'the broker must be encoded into the spawn args');

  // 1. acknowledged: the state file gate is present and comes FIRST.
  const ack = s.indexOf("$row.phase -ne 'starting'");
  assert.ok(ack >= 0, 'the state file must still gate acknowledgement');

  // 2. gone: only ObjectNotFound proves absence.
  assert.ok(s.includes('NoProcessFoundForGivenId'), 'absence must be identified by its own error id');
  assert.ok(s.includes('ObjectNotFound'), 'absence must be identified by category too');
  assert.ok(s.includes('$gone'), 'the loop must track a distinct gone signal');

  // 3. unknown: a bare catch that assumes death is the defect being fixed.
  assert.ok(
    !s.includes('no longer observable before acknowledging startup'),
    'the handle-based abort must be gone',
  );
  assert.ok(
    !/\} catch \{ \$alive=\$false \}/.test(s),
    'a blanket catch that marks the helper dead would recreate the same misjudgement',
  );

  // Ordering: acknowledgement must be decided before liveness is even asked.
  const gone = s.indexOf('$gone=$true');
  assert.ok(ack < gone, 'acknowledgement must be checked before absence');
});

test('broker still bounds the wait and keeps a timeout verdict', () => {
  const s = capturedBroker();
  // Timeout case: the wait must be bounded and must end in its own verdict.
  // Match the shape, not the literal number. Hard-coding 20s would break this test
  // the day someone tunes the budget, which is a legitimate change.
  assert.match(s, /\$deadline=\[DateTime\]::UtcNow\.AddSeconds\(\d+\)/, "the wait must stay bounded");
  assert.match(
    s,
    /did not acknowledge startup within \d+ seconds/,
    "a helper that never acknowledges must end in a timeout verdict",
  );
  // The timeout verdict must be the post-loop fallthrough, not a mid-loop throw:
  // otherwise a slow-but-healthy helper would be failed instead of waited for.
  const loopEnd = s.lastIndexOf("} while ([DateTime]::UtcNow -lt $deadline)");
  const timeoutThrow = s.lastIndexOf("did not acknowledge startup within");
  assert.ok(loopEnd >= 0 && timeoutThrow > loopEnd, "the timeout verdict must come after the loop");
});

test('broker ignores a state file left behind by a previous attempt', () => {
  const s = capturedBroker();
  // Stale state case: token mismatch means this file belongs to an older handoff.
  assert.ok(
    s.includes('$row.token -ne'),
    'a foreign token must be recognised as stale rather than as acknowledgement',
  );
  const stale = s.indexOf('$row.token -ne');
  const ack = s.indexOf("$row.phase -ne 'starting'");
  assert.ok(stale < ack, 'the token check must run before the phase check');
});

test('broker reports a real early exit with the helper exit code when readable', () => {
  const s = capturedBroker();
  // Early exit case: gone + readable handle must surface the real exit code.
  assert.ok(s.includes('exited before acknowledging startup'), 'an early exit must be reported as such');
  assert.ok(s.includes('$observed.HasExited'), 'the real exit code must be read when the handle allows it');
  assert.ok(s.includes("$childCode='unknown'"), 'an unreadable handle must be reported as unknown, not invented');
});
