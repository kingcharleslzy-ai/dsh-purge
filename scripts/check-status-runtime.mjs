// Read-only status route acceptance in a marked disposable Desktop/Electron fixture.
// Does not start the desktop UI, apply patches or use a production profile.
// Args: <fixture> <official cli.js>
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const [fixture,cli]=process.argv.slice(2).map(p=>fs.realpathSync(p));
assert(fs.existsSync(path.join(fixture,'.purge-install-test-fixture')));
const inside=p=>{const rel=path.relative(fixture,p);return rel&&!rel.startsWith('..')&&!path.isAbsolute(rel);};
assert(inside(fs.realpathSync(process.execPath))&&inside(cli),'Only the disposable Electron and CLI are allowed');
if(process.platform==='darwin'){
  assert(!process.execPath.split('/').some(p=>p.endsWith('.app')));
  assert(!fs.existsSync(path.resolve(process.execPath,'../../Info.plist')));
}
const home=fs.mkdtempSync(path.join(os.tmpdir(),'purge-status-runtime-'));
const res=path.join(fixture,process.platform==='darwin'?'Contents/Resources':'resources');
Object.assign(process.env,{DSH_HOME:home,DSH_PROFILE:'desktop',DSH_SURFACE:'desktop',HOME:home,USERPROFILE:home,DSH_APP:process.execPath,DSH_BASE:path.join(res,'app/dsh/node_modules/@deepseek-ai')});
const require=createRequire(cli);
const {Context,Service}=await import(pathToFileURL(require.resolve('@deepseek-ai/cordis')));
const {installWebServer}=await import('../lib/index.js');
const {gatherState}=await import('../lib/core.js');
class TestConnection extends Service {
  constructor(ctx){super(ctx,'connection');}
  admit(req){return req.headers.authorization === 'Bearer fixture-owner' ? {peer:{principal:{kind:'owner'}}} : {rejection:401};}
}
class Web extends Service {
  constructor(ctx){super(ctx,'webServer');this.routes=new Map();}
  register(spec){assert(!this.routes.has(spec.path));this.routes.set(spec.path,spec);return()=>this.routes.delete(spec.path);}
}
const ctx=new Context();let server;
try{
  await ctx.plugin(TestConnection);
  await ctx.plugin(Web);
  await ctx.plugin({name:'purge-status-read-test',apply(child){installWebServer(child,{});}});
  await new Promise(r=>setImmediate(r));
  const route=ctx.webServer.routes.get('/dsh-purge/status');assert(route);
  server=http.createServer((req,res)=>{if(req.url!=='/dsh-purge/status'||req.method!=='GET'){res.writeHead(405);res.end();return;}route.handler(req,res).catch(e=>{res.writeHead(500);res.end(String(e));});});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${server.address().port}/dsh-purge/status`;
  assert.equal((await fetch(url)).status,401);
  const read=()=>fetch(url,{headers:{authorization:"Bearer fixture-owner"},signal:AbortSignal.timeout(60000)});
  const expected=await gatherState({aiBase:process.env.DSH_BASE,dshHome:home,surface:'desktop'});
  for(let n=0;n<3;n++){
    const start=performance.now();const response=await read();assert.equal(response.status,200);
    const data=await response.json();assert.equal(data.ok,true);assert.equal(data.ai_base,process.env.DSH_BASE);assert.deepEqual(data.patch_status,expected.patch_status);
    console.log(JSON.stringify({request:n,ms:performance.now()-start,status:response.status,counts:[data.patches_applied,data.patches_total]}));
  }
  // Two HTTP clients exercise concurrent async diagnostic scopes on the same instance.
  const pair=await Promise.all([read(),read()]);assert(pair.every(r=>r.status===200));
  const states=await Promise.all(pair.map(r=>r.json()));assert.deepEqual(states[0].patch_status,states[1].patch_status);
  console.log('PASS: actual registered status route over HTTP, sequential and concurrent reads; no apply/restart');
}finally{if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}await ctx.fiber.dispose();}
