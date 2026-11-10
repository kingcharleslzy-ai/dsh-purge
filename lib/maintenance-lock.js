// Serializes maintenance and recovery. A lease age is never proof of death.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const host = os.hostname();
const born = Date.now() - process.uptime() * 1000;
const pendingReleases = new Map(); // Only closures for this process's explicitly released locks.
const absent = error => error?.code === 'ENOENT';
// Windows AV / a concurrent rmdir can transiently block a directory read.
const transientIo = error => absent(error) || ['EPERM','EACCES','EBUSY'].includes(error?.code);
const busy = detail => Object.assign(new Error(`已有维护操作或遗留锁：${detail}；未并发修改。请确认原维护进程已退出，不要直接删除活动锁。`), {code:'MAINTENANCE_BUSY'});
const lost = () => Object.assign(new Error('维护锁归属无法确认，本次操作已停止；保留备份与恢复目录，未继续写入或自动恢复。'), {code:'LOCK_LOST'});

function processBirth(pid) {
  if (pid === process.pid) return born;
  try {
    if (process.platform === 'win32') {
      const command = `$p=Get-Process -Id ${pid} -ErrorAction Stop; ([DateTimeOffset]$p.StartTime.ToUniversalTime()).ToUnixTimeMilliseconds()`;
      return Number(execFileSync('powershell.exe', ['-NoProfile','-NonInteractive','-Command',command], {encoding:'utf8',timeout:5000,windowsHide:true,stdio:['ignore','pipe','ignore']}).trim());
    }
    const text = execFileSync('/bin/ps', ['-p',String(pid),'-o','lstart='], {encoding:'utf8',timeout:5000,env:{...process.env,LC_ALL:'C'},stdio:['ignore','pipe','ignore']}).trim();
    return Date.parse(text);
  } catch { return NaN; }
}

function ownerFrom(raw, createdAt) {
  try { const value=JSON.parse(raw); if (value && typeof value === 'object') return value; } catch {}
  const parts=raw.trim().split(':');
  return {host:parts.length >= 3 ? parts[0] : host, pid:Number(parts.length >= 3 ? parts[1] : parts[0]), createdAt};
}

function ownerDead(owner, io) {
  if (owner.host !== host || !Number.isSafeInteger(owner.pid) || owner.pid <= 0) return false;
  try { io.kill(owner.pid, 0); }
  catch (error) { return error?.code === 'ESRCH'; } // EPERM/unknown is not death.
  // A reused PID must belong to a process born after this lock was created.
  // Precision margin covers ps' second resolution and scheduling differences.
  const start=io.birth(owner.pid);
  return Number.isFinite(start) && Number.isFinite(owner.createdAt) && start > owner.createdAt + 2000;
}

function regular(io, file, links = 1) {
  const stat=io.fs.lstatSync(file);
  if (!stat.isFile() || stat.nlink !== links) throw busy('锁文件类型异常，保留现场');
  return stat;
}

export function acquireMaintenanceLock(base, options = {}) {
  const io={fs, kill:process.kill.bind(process), birth:processBirth, ...options};
  base=path.resolve(base);
  const pending=pendingReleases.get(base);
  if (pending) { const warning=pending(); if (warning) throw Object.assign(busy('上次释放失败，原锁保留'),{cause:warning}); }
  const gate=path.join(base, 'maintenance.guard');
  const legacy=path.join(base, 'maintenance.lock');
  const token=randomBytes(16).toString('hex');
  const name=token+'.json';
  const owner={schema:1,host,pid:process.pid,createdAt:Date.now(),token};
  const raw=JSON.stringify(owner);
  const stage=path.join(base, '.maintenance-'+token);
  io.fs.mkdirSync(stage, {mode:0o700});
  try { io.fs.writeFileSync(path.join(stage,name), raw, {flag:'wx',mode:0o600}); }
  catch (error) { try { io.fs.unlinkSync(path.join(stage,name)); io.fs.rmdirSync(stage); } catch {} throw error; }
  let held=false, compatibility=false;
  function pair() {
    const a=regular(io,path.join(gate,name),2), b=regular(io,legacy,2);
    if(a.ino!==b.ino || a.dev!==b.dev) throw lost();
  }
  function check() {
    for(let attempt=0;attempt<3;attempt++) {
      try {
        if (!held || io.fs.readFileSync(path.join(gate,name),'utf8') !== raw ||
            io.fs.readFileSync(legacy,'utf8') !== raw) throw lost();
        pair(); return;
      } catch(error) {
        if(error.code==='LOCK_LOST' || absent(error)) throw Object.assign(lost(),{cause:error});
        if(attempt===2) throw Object.assign(new Error('维护锁读取失败，归属未知；停止后续写入，保留恢复目录。'),{code:'LOCK_UNREADABLE',cause:error});
      }
    }
  }
  function release() {
    // Retain the gate on failure. A later acquisition in this process can retry
    // this exact owner closure; a live PID alone never permits reclamation.
    let failure;
    for(let attempt=0;attempt<3;attempt++) {
      try {
        if (compatibility) {
          check();
          io.fs.unlinkSync(legacy); compatibility=false;
        }
        if (held) {
          if(io.fs.readFileSync(path.join(gate,name),'utf8')!==raw) throw lost();
          io.fs.unlinkSync(path.join(gate,name)); held=false;
          try { io.fs.rmdirSync(gate); } catch(e) { if(!absent(e) && !['ENOTEMPTY','EEXIST'].includes(e.code)) throw e; }
        }
        pendingReleases.delete(base); return null;
      } catch(error) { failure=error; }
    }
    if(failure?.code === "LOCK_LOST") pendingReleases.delete(base);
    else pendingReleases.set(base,release);
    return {stage:'lock-release',code:failure?.code || 'LOCK_RELEASE_FAILED',cause:failure?.cause?.code};
  }
  try {
    for (let attempt=0; attempt<4; attempt++) {
      try {
        // Publish a NONEMPTY prepared directory atomically. Unlike renaming an
        // existing lock away, this never exposes an empty lock pathname.
        io.fs.renameSync(stage,gate);
        held=true;
        break;
      } catch (error) {
        let stat;
        try { stat=io.fs.lstatSync(gate); } catch (e) { if (transientIo(e)) { if (['EEXIST','ENOTEMPTY','EPERM','EACCES'].includes(error.code)) continue; throw error; } throw e; }
        if (!stat.isDirectory() || stat.isSymbolicLink()) throw busy('维护互斥目录类型异常');
        let names;
        try { names=io.fs.readdirSync(gate); } catch(e) { if(transientIo(e)) continue; throw e; }
        if (names.length === 0) { try { io.fs.rmdirSync(gate); } catch (e) { if (!transientIo(e) && e.code !== 'ENOTEMPTY' && e.code !== 'EEXIST') throw e; } continue; }
        if (names.length !== 1 || !/^[a-f0-9]{32}\.json$/.test(names[0])) throw busy('维护互斥目录内容未知');
        const file=path.join(gate,names[0]);
        try {
          const entry=io.fs.lstatSync(file);
          if(entry.nlink===2) {
            const peer=regular(io,legacy,2);
            if(peer.ino!==entry.ino || peer.dev!==entry.dev) throw busy('锁硬链接不属于当前维护记录');
            regular(io,file,2);
          } else regular(io,file);
          const prior=ownerFrom(io.fs.readFileSync(file,'utf8'),NaN);
          if (!ownerDead(prior,io)) throw busy(`进程 ${prior.pid || '未知'} 的归属尚未结束或无法确认`);
          // Delete only the dead owner's UNIQUE filename. A racing acquirer
          // publishes another nonempty directory; rmdir then fails safely.
          io.fs.unlinkSync(file);
          try { io.fs.rmdirSync(gate); } catch (e) { if (!transientIo(e) && e.code !== 'ENOTEMPTY' && e.code !== 'EEXIST') throw e; }
        } catch (e) { if (!transientIo(e)) throw e; }
      }
    }
    if (!held) throw busy('其他维护进程正在接管');
    for (let attempt=0; attempt<2; attempt++) {
      try {
        // Atomic create-if-absent of fully written metadata. A crash cannot
        // leave an empty compatibility lock. Both names identify one inode.
        io.fs.linkSync(path.join(gate,name),legacy); compatibility=true;
      } catch(error) {
        if(error.code!=='EEXIST') throw error;
        try {
          const stat=regular(io,legacy);
          const previous=io.fs.readFileSync(legacy,'utf8');
          const prior=ownerFrom(previous,stat.mtimeMs);
          if(!ownerDead(prior,io)) throw busy(`旧锁 PID=${prior.pid || '未知'}，mtime=${stat.mtime.toISOString()}，存活或归属未知`);
          if(io.fs.readFileSync(legacy,'utf8')!==previous) throw busy('旧锁在检查期间变化');
          const current=regular(io,legacy);
          if(current.ino!==stat.ino || current.dev!==stat.dev || current.mtimeMs!==stat.mtimeMs) throw busy('旧锁在检查期间变化');
          io.fs.unlinkSync(legacy);
        } catch(e) { if(!transientIo(e)) throw e; }
        continue;
      }
      check();
      return {check,release};
    }
    throw busy('未取得维护锁');
  } catch (error) { release(); throw error; }
  finally {
    try { io.fs.unlinkSync(path.join(stage,name)); } catch {}
    try { io.fs.rmdirSync(stage); } catch {}
  }
}
