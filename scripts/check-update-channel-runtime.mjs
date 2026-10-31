// Read-only public metadata request plus real Windows proxy discovery. Test
// credentials and permissions live only in node:test temporary directories.
import assert from 'node:assert/strict';
import {readWindowsProxy} from '../lib/update-system-proxy.js';
import {requestUpdate} from '../lib/update-http.js';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
const result={platform:process.platform,node:process.versions.node,electron:process.versions.electron || null};
if(process.platform==='win32') {
  let before=await readWindowsProxy();const durations=[];
  for(let n=0;n<3;n++){const start=Date.now();assert.deepEqual(await readWindowsProxy(),before);durations.push(Date.now()-start);}
  const fallback=await readWindowsProxy({run:(exe,args,options)=>exe.endsWith('reg.exe')?Promise.reject(Error('fixture forces actual PowerShell fallback')):exec(exe,args,options)});
  for(const key of ['ProxyEnable','ProxyServer','ProxyOverride','AutoConfigURL'])assert.equal(fallback[key] || '',before[key] || '');
  result.proxy={registryReadMs:durations,powershellFallbackMatches:true};
}
const start=Date.now();
const response=await requestUpdate('https://api.github.com/repos/kingcharleslzy-ai/dsh-purge/releases/latest',{timeout:30000,maxBytes:1024*1024});
const release=JSON.parse(response.body.toString());assert.match(release.tag_name,/^v\d+\.\d+\.\d+/);
result.publicMetadata={status:response.status,tag:release.tag_name,elapsedMs:Date.now()-start};
console.log(JSON.stringify(result));
