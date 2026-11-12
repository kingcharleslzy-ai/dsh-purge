import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const helper=path.join(here,'..','lib','restart-web.js');

function freePort(){
  return new Promise((resolve,reject)=>{
    const server=net.createServer();
    server.once('error',reject);
    server.listen(0,'127.0.0.1',()=>{
      const port=server.address().port;
      server.close(()=>resolve(port));
    });
  });
}

function isAlive(pid){
  if(process.platform==='win32'){
    const r=spawnSync('tasklist',['/FI',`PID eq ${pid}`],{encoding:'utf8'});
    return String(r.stdout||'').includes(String(pid));
  }
  try{process.kill(pid,0);return true;}catch{return false;}
}

test('Restart helper keeps the replacement server alive after the helper exits',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-restart-helper-'));
  const pidFile=path.join(root,'child.pid');
  const fake=path.join(root,'fake-dsh.mjs');
  fs.writeFileSync(fake,`
import fs from "node:fs";
fs.writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));
console.log("dsh web: http://127.0.0.1:1/?token=test");
// Keep writing after the helper exits: with the old pipe wiring this write
// hits a closed stdout and the process dies with EPIPE.
setInterval(() => console.log("tick"), 100);
setTimeout(() => process.exit(0), 30000);
`);
  try{
    const port=await freePort();
    const payload={
      kind:'web',
      execPath:process.execPath,
      argv:[fake],
      cwd:os.tmpdir(),
      host:'127.0.0.1',
      port,
      pid:0,
      openBrowser:false,
    };
    const exit=await new Promise((resolve,reject)=>{
      const child=spawn(process.execPath,[helper],{
        env:{...process.env,DSH_PURGE_RESTART:JSON.stringify(payload)},
        stdio:['ignore','ignore','pipe'],
      });
      let stderr='';
      child.stderr.on('data',(d)=>{stderr+=String(d);});
      const timer=setTimeout(()=>{child.kill();reject(new Error('helper did not exit: '+stderr));},20000);
      child.on('exit',(code)=>{clearTimeout(timer);resolve(code);});
      child.on('error',reject);
    });
    assert.equal(exit,0,'helper should exit cleanly');
    // Give the replacement a few heartbeats after the helper exited.
    await new Promise((resolve)=>setTimeout(resolve,2500));
    const pid=Number(fs.readFileSync(pidFile,'utf8'));
    const alive=isAlive(pid);
    try{process.kill(pid);}catch{}
    assert.equal(alive,true,'replacement server must survive the 重启助手 exits');
  }finally{
    for(let i=0;i<20;i++){
      try{fs.rmSync(root,{recursive:true,force:true});break;}
      catch{await new Promise((resolve)=>setTimeout(resolve,200));}
    }
  }
});

test('browser mode drains late server output in memory and exits when the server exits', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'restart-streams-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const server = path.join(dir, 'server.mjs');
  fs.writeFileSync(server, `
    import fs from "node:fs";
    setTimeout(() => {
      process.stdout.write("late stdout\\n");
      process.stderr.write("late stderr\\n", () => fs.writeFileSync("finished", "yes"));
    }, 1800);
  `);
  const info = { execPath: process.execPath, argv: [server], cwd: dir, port: await freePort(), openBrowser: true };
  const child = spawn(process.execPath, [helper], {
    env: { ...process.env, TMPDIR: dir, TEMP: dir, TMP: dir, DSH_PURGE_RESTART: JSON.stringify(info) },
    stdio: 'ignore',
  });
  const exit = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.kill(); reject(new Error('helper still running after server exit')); }, 10000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); resolve(code); });
  });
  assert.equal(exit, 0);
  assert.equal(fs.readFileSync(path.join(dir, 'finished'), 'utf8'), 'yes');
  assert.equal(fs.readdirSync(dir).some(name => name.endsWith('.log')), false);
});
