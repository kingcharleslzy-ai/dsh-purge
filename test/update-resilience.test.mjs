import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestUpdate} from '../lib/update-http.js';
import {parseRegistryProxy,readWindowsProxy} from '../lib/update-system-proxy.js';
const url='https://api.github.com/repos/example/fixture';
const response=()=>new Response('ok');
const reset=()=>Object.assign(Error('secret proxy URL must not appear'),{code:'ECONNRESET'});

test('registry fast path parses static settings, rejects encoding/type corruption',()=>{
  assert.deepEqual(parseRegistryProxy('HKEY_CURRENT_USER\\Software\\fixture\r\n    ProxyEnable    REG_DWORD    0x1\r\n    ProxyServer    REG_SZ    https=127.0.0.1:1234\r\n    ProxyOverride    REG_SZ    <local>;*.example'),{ProxyEnable:1,ProxyServer:'https=127.0.0.1:1234',ProxyOverride:'<local>;*.example'});
  for(const s of ['bad','HKEY_CURRENT_USER\\\n ProxyServer REG_SZ 中文','HKEY_CURRENT_USER\\\n ProxyEnable REG_SZ 1'])assert.throws(()=>parseRegistryProxy(s));
});
test('registry uses fast path, fallback errors remain proxy-stage errors and never expose command output',async()=>{
  let calls=0;
  assert.deepEqual(await readWindowsProxy({run:async(exe)=>{calls++;assert.match(exe,/reg.exe$/);return {stdout:'HKEY_CURRENT_USER\\fixture\n ProxyEnable REG_DWORD 0x0'};}}),{ProxyEnable:0});assert.equal(calls,1);
  calls=0;
  assert.deepEqual(await readWindowsProxy({run:async(exe)=>{if(++calls===1)throw Error('cold registry');assert.match(exe,/powershell.exe$/);return {stdout:'{"ProxyEnable":1,"ProxyServer":"localhost:7890"}'};}}),{ProxyEnable:1,ProxyServer:'localhost:7890'});
  await assert.rejects(readWindowsProxy({run:async()=>{throw Object.assign(Error('TOKEN_SECRET'),{code:'EACCES'});}}),e=>/代理探测失败.*EACCES.*尚未发送/.test(e.message)&&!e.message.includes('TOKEN_SECRET'));
});
test('transient errors retry at most twice and preserve authorization on each attempt',async()=>{
  let calls=0;
  const res=await requestUpdate(url,{env:{GH_TOKEN:'fixture'},fetch:async(_,options)=>{assert.equal(options.headers.authorization,'Bearer fixture');if(++calls<3)throw new TypeError('fetch failed',{cause:reset()});return response();}});
  assert.equal(res.body.toString(),'ok');assert.equal(calls,3);
  calls=0;await assert.rejects(requestUpdate(url,{fetch:async()=>{calls++;throw reset();}}),/ECONNRESET.*尝试 3 次/);assert.equal(calls,3);
});
test('HTTP, TLS, proxy probe and size failures are not retried or downgraded to direct',async()=>{
  for(const status of [401,403,407,429,500,503]){
    let calls=0;await assert.rejects(requestUpdate(url,{fetch:async()=>{calls++;return new Response('',{status});}}),new RegExp('HTTP '+status));assert.equal(calls,1);
  }
  let calls=0;await assert.rejects(requestUpdate(url,{fetch:async()=>{calls++;throw Object.assign(Error('certificate'),{code:'CERT_HAS_EXPIRED'});}}),/CERT_HAS_EXPIRED/);assert.equal(calls,1);
  calls=0;await assert.rejects(requestUpdate(url,{env:{},discoverProxy:async()=>{calls++;throw reset();}}),e=>/代理.*ECONNRESET/.test(e.message)&&!e.message.includes('secret proxy'));assert.equal(calls,1);
  calls=0;await assert.rejects(requestUpdate(url,{maxBytes:1,fetch:async()=>{calls++;return response();}}),/过大/);assert.equal(calls,1);
});
test('retry delays and discovery share the original total deadline',async()=>{
  let calls=0;const start=Date.now();
  await assert.rejects(requestUpdate(url,{timeout:90,fetch:async()=>{calls++;throw reset();}}),/超时/);
  assert.equal(calls,1);assert(Date.now()-start<500);
  const keepAlive=setTimeout(()=>{},1000);
  try{await assert.rejects(requestUpdate(url,{env:{},timeout:30,discoverProxy:async(_,opts)=>new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(Error('stopped'))))}),/代理探测超时.*尚未发送/);}finally{clearTimeout(keepAlive);}
});
test('redirect plus retries share budget and never leak API token to asset host',async()=>{
  let api=0,asset=0;
  await requestUpdate(url,{env:{GH_TOKEN:'fixture'},fetch:async(target,{headers})=>{
    if(target.hostname==='api.github.com'){api++;if(api===1)throw reset();return new Response('',{status:302,headers:{location:'https://release-assets.githubusercontent.com/fixture'}});}
    assert.equal(headers.authorization,undefined);if(++asset===1)throw reset();return response();
  }});assert.equal(api,2);assert.equal(asset,2);
});
