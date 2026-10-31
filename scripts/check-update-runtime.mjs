// Use a separately downloaded Electron. Never launch a user's DSH installation.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const binary=process.env.PURGE_ELECTRON_EXEC;
if(!binary || !fs.existsSync(binary))throw Error('Set PURGE_ELECTRON_EXEC to the isolated Electron runtime');
const env={...process.env,ELECTRON_RUN_AS_NODE:'1'};delete env.NODE_TEST_CONTEXT;
console.log(execFileSync(binary,['-p','JSON.stringify({electron:process.versions.electron,node:process.versions.node,platform:process.platform})'],{env,encoding:'utf8',timeout:10000}).trim());
let result;
try {result=execFileSync(binary,['--test','--test-reporter=tap','--test-concurrency=2',
  'test/update-http.test.mjs','test/update-policy.test.mjs','test/update-resilience.test.mjs','test/update-secrets.test.mjs','test/update-proxy-runtime.test.mjs'],
{env,encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024,windowsHide:true});}
catch(e){console.log(String(e.stdout || ''));console.log(JSON.stringify({error:e.code || 'TEST_FAILED',status:e.status,stderr:String(e.stderr || '')}));process.exit(1);}
if(!/# fail 0/.test(result))throw Error('Electron update tests did not finish successfully');
console.log(result.trim());
