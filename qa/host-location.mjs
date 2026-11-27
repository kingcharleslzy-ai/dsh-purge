import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as sleep} from 'node:timers/promises';
const root=mkdtempSync(path.join(os.tmpdir(),'official-location-'));
const home=path.join(root,'home'), profile=path.join(home,'profiles','web');
const probe=path.join(profile,'node_modules','location-only'), result=path.join(root,'result.json');
mkdirSync(probe,{recursive:true});
const repoModule=new URL('../lib/instance.js',import.meta.url).href;
writeFileSync(path.join(probe,'package.json'),JSON.stringify({name:'location-only',type:'module',main:'index.mjs'}));
writeFileSync(path.join(probe,'index.mjs'),"import {resolveInstance} from "+JSON.stringify(repoModule)+";import {writeFileSync} from 'node:fs';export function apply(){const r=resolveInstance();writeFileSync("+JSON.stringify(result)+",JSON.stringify({source:r.source,surface:r.surface,resolved:r.resolved,reason:r.reason}));}");
const patch=path.join(root,'fixture.yml');
writeFileSync(patch,'- insert:\n    - id: location-only\n      name: location-only\n');
const cli=path.join(path.resolve(process.argv[2]),'node_modules','@deepseek-ai','dsh','lib','bin.js');
const env={...process.env,DSH_HOME:home,HOME:root,USERPROFILE:root,LOCALAPPDATA:root,APPDATA:root};delete env.DSH_BASE;delete env.PURGE_DSH_CLI;
const args=[cli,'--profile','web','--patch',patch,'--no-open','--host','127.0.0.1','--port','0'];
const child=spawn(process.execPath,args,{env,cwd:root,stdio:['ignore','pipe','pipe']});const exit=once(child,'exit');
let output='';for(const pipe of [child.stdout,child.stderr])pipe.on('data',chunk=>output=(output+chunk).slice(-12000));
try{
 for(let i=0;i<450&&!existsSync(result)&&child.exitCode===null;i++)await sleep(100);
 if(!existsSync(result))throw Error('observer did not load; exited='+child.exitCode+'; startup log contains module error='+/Cannot find module/.test(output));
 const status=JSON.parse(readFileSync(result));console.log(status);assert.equal(status.resolved,true);assert.equal(status.surface,'web');
}finally{if(child.exitCode===null&&child.signalCode===null)child.kill();await exit;rmSync(root,{recursive:true,force:true,maxRetries:6,retryDelay:100});}
