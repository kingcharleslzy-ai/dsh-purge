import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import https from 'node:https';import http from 'node:http';import net from 'node:net';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {requestUpdate} from '../lib/update-http.js';
import {prepareRelease,PACKAGE,REPOSITORY} from '../lib/community.js';
import {createHash} from 'node:crypto';
const exec=promisify(execFile);

test('real CONNECT tunnel validates TLS, scopes credentials and respects total timeout',async t=>{
  if(!process.env.PURGE_PROXY_TEST_CHILD) {
    const tmp=process.env.PURGE_TEST_TLS_DIR || fs.mkdtempSync(path.join(os.tmpdir(),'purge-tls-'));
    if(!process.env.PURGE_TEST_TLS_DIR) {
      try {await exec('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',path.join(tmp,'key.pem'),'-out',path.join(tmp,'cert.pem'),'-days','1','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost,DNS:api.github.com,DNS:release-assets.githubusercontent.com,DNS:mirror.example']);}
      catch(e) {if(process.platform==='win32' && e.code==='ENOENT'){t.skip('Provide PURGE_TEST_TLS_DIR when OpenSSL is unavailable');return;}throw e;}
    }
    try {
      const env={...process.env,PURGE_PROXY_TEST_CHILD:'1',PURGE_TEST_TLS_DIR:tmp,NODE_EXTRA_CA_CERTS:path.join(tmp,'cert.pem')};
      delete env.NODE_TEST_CONTEXT;
      const result=await exec(process.execPath,['--test','--test-reporter=tap',fileURLToPath(import.meta.url)],{
        timeout:30000,maxBuffer:1024*1024,env,
      }).catch(e=>{throw Error(e.message+'\n'+e.stdout+'\n'+e.stderr);});
      assert.match(result.stdout,/# fail 0/);
    } finally {if(!process.env.PURGE_TEST_TLS_DIR)fs.rmSync(tmp,{recursive:true,force:true});}
    return;
  }
  const dir=process.env.PURGE_TEST_TLS_DIR;const requests=[],connects=[];const sockets=new Set();
  const packageDir=path.join(dir,'package');fs.mkdirSync(packageDir,{recursive:true});
  fs.writeFileSync(path.join(packageDir,'package.json'),JSON.stringify({name:PACKAGE,version:'9.9.9',repository:{url:`https://github.com/${REPOSITORY}.git`}}));
  const packed=path.join(dir,'fixture.tgz');
  await exec('tar',['-czf',packed,'-C',dir,'package']);
  const bytes=fs.readFileSync(packed),digest='sha256:'+createHash('sha256').update(bytes).digest('hex');
  const release={ref:'v9.9.9',version:'9.9.9',asset:`https://github.com/${REPOSITORY}/releases/download/v9.9.9/${PACKAGE}-9.9.9.tgz`,sums:`https://github.com/${REPOSITORY}/releases/download/v9.9.9/SHA256SUMS.txt`};
  let tamper=false;const counts=new Map();

  const server=https.createServer({key:fs.readFileSync(path.join(dir,'key.pem')),cert:fs.readFileSync(path.join(dir,'cert.pem'))},(req,res)=>{
    requests.push({url:req.url,headers:req.headers});
    counts.set(req.url,(counts.get(req.url)||0)+1);
    if(req.url==='/reset' && counts.get(req.url)===1){req.socket.destroy();return;}
    if(req.url==='/partial' && counts.get(req.url)===1){res.writeHead(200,{'content-length':'100'});res.write('discard-me');setTimeout(()=>req.socket.destroy(),10);return;}
    if(req.url==='/unauthorized'){res.writeHead(401);res.end();return;}
    if(req.url==='/reset-always'){req.socket.destroy();return;}
    if(req.url===`/repos/${REPOSITORY}/releases/tags/v9.9.9`){res.setHeader('content-type','application/json');res.end(JSON.stringify({tag_name:release.ref,assets:[{name:PACKAGE+'-9.9.9.tgz',browser_download_url:release.asset,digest}]}));}
    else if(req.url==='/'+release.asset){res.writeHead(200);const data=tamper?Buffer.from('tampered'):bytes;let n=0;const timer=setInterval(()=>{res.write(data.subarray(n,n+32));n+=32;if(n>=data.length){clearInterval(timer);res.end();}},20);res.on('close',()=>clearInterval(timer));}
    else if(req.url==='/redirect'){res.writeHead(302,{location:`https://release-assets.githubusercontent.com:${server.address().port}/asset`});res.end();}
    else if(req.url==='/stream'){res.writeHead(200);let n=0;const timer=setInterval(()=>{res.write('x');if(++n===6){clearInterval(timer);res.end();}},40);res.on('close',()=>clearInterval(timer));}
    else if(req.url==='/slow'){res.writeHead(200);res.write('x');}
    else if(req.url==='/large'){res.end('too many bytes');}
    else res.end('verified');
  });
  const proxy=http.createServer();
  proxy.on('connect',(req,socket,head)=>{
    connects.push({url:req.url,headers:req.headers});
    const upstream=net.connect(server.address().port,'127.0.0.1',()=>{socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');if(head.length)upstream.write(head);socket.pipe(upstream).pipe(socket);});
    sockets.add(upstream);upstream.on('error',()=>socket.destroy());socket.on('error',()=>upstream.destroy());socket.on('close',()=>upstream.destroy());
  });
  const socks=net.createServer(socket=>{
    let buffer=Buffer.alloc(0),stage='greet';
    const data=chunk=>{
      buffer=Buffer.concat([buffer,chunk]);
      while(true) {
        if(stage==='greet'){
          if(buffer.length<2 || buffer.length<2+buffer[1])return;
          buffer=buffer.subarray(2+buffer[1]);socket.write(Buffer.from([5,2]));stage='auth';
        }else if(stage==='auth'){
          if(buffer.length<2 || buffer.length<3+buffer[1])return;
          const u=buffer[1],p=buffer[2+u];if(buffer.length<3+u+p)return;
          assert.equal(buffer.subarray(2,2+u).toString(),'user');
          assert.equal(buffer.subarray(3+u,3+u+p).toString(),'fixture');
          buffer=buffer.subarray(3+u+p);socket.write(Buffer.from([1,0]));stage='connect';
        }else{
          if(buffer.length<5 || buffer.length<7+buffer[4])return;
          assert.equal(buffer[3],3);
          buffer=buffer.subarray(7+buffer[4]);socket.off('data',data);
          const upstream=net.connect(server.address().port,'127.0.0.1',()=>{
            socket.write(Buffer.from([5,0,0,1,127,0,0,1,0,0]));
            if(buffer.length)upstream.write(buffer);socket.pipe(upstream).pipe(socket);
          });
          sockets.add(upstream);upstream.on('error',()=>socket.destroy());socket.on('error',()=>upstream.destroy());socket.on('close',()=>upstream.destroy());return;
        }
      }
    };socket.on('data',data);
  });
  for(const s of [server,proxy,socks]){s.on('connection',socket=>sockets.add(socket));await new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));}
  try {
    const env={HTTPS_PROXY:`http://user:fixture@127.0.0.1:${proxy.address().port}`,GH_TOKEN:'test-token'};
    const base=`https://api.github.com:${server.address().port}`;
    assert.equal((await requestUpdate(base+'/redirect',{env})).body.toString(),'verified');
    assert.equal(requests[0].headers.authorization,'Bearer test-token');
    assert.equal(requests[1].headers.authorization,undefined);
    assert.equal(requests[0].headers['proxy-authorization'],undefined);
    assert(connects.every(r=>!r.headers.authorization && r.headers['proxy-authorization']==='Basic '+Buffer.from('user:fixture').toString('base64')));
    await assert.rejects(requestUpdate(`https://github.com:${server.address().port}/asset`,{env}),/网络连接失败/);
    await assert.rejects(requestUpdate(base+'/large',{env,maxBytes:2}),/过大/);
    for(const route of ['/reset','/partial']) {
      assert.equal((await requestUpdate(base+route,{env})).body.toString(),'verified');
      assert.equal(counts.get(route),2,'real reset/partial body retries exactly once');
    }
    await assert.rejects(requestUpdate(base+'/unauthorized',{env}),/HTTP 401/);assert.equal(counts.get('/unauthorized'),1);
    await assert.rejects(requestUpdate(base+'/reset-always',{env}),/ECONNRESET.*尝试 3 次/);assert.equal(counts.get('/reset-always'),3);
    const socksEnv={PURGE_HTTPS_PROXY:`socks5h://user:fixture@127.0.0.1:${socks.address().port}`,GITHUB_TOKEN:'socks-token'};
    const begin=requests.length;
    assert.equal((await requestUpdate(base+'/redirect',{env:socksEnv})).body.toString(),'verified');
    assert.equal(requests[begin].headers.authorization,'Bearer socks-token');
    assert.equal(requests[begin+1].headers.authorization,undefined);
    assert.equal(requests[begin].headers['proxy-authorization'],undefined);
    await assert.rejects(requestUpdate(`https://github.com:${server.address().port}/asset`,{env:socksEnv}),/网络连接失败/);
    await assert.rejects(requestUpdate(base+'/slow',{env:socksEnv,timeout:100}),/超时/);

    // Actual HTTPS -> CONNECT -> mirror byte stream -> official digest -> tar identity check.
    Object.assign(process.env,env,{PURGE_HTTPS_PROXY:env.HTTPS_PROXY,NO_PROXY:'',no_proxy:'',GITHUB_TOKEN:'test-token',PURGE_GH_MIRROR:'https://mirror.example/'});
    const offset=requests.length;
    const prepared=await prepareRelease({base:path.join(dir,'cache')},release);
    assert.deepEqual(fs.readFileSync(prepared),bytes);
    assert.equal(requests[offset].headers.authorization,'Bearer test-token');
    assert.equal(requests[offset+1].headers.authorization,undefined);
    assert(!requests.slice(offset).some(r=>r.url.includes('SHA256SUMS')));
    tamper=true;
    await assert.rejects(prepareRelease({base:path.join(dir,'cache')},release),/SHA256/);
    assert.deepEqual(fs.readFileSync(prepared),bytes,'tampered response cannot replace validated cache');
    assert.equal((await requestUpdate(base+'/stream',{env,timeout:1000})).body.toString(),'xxxxxx');
    await assert.rejects(requestUpdate(base+'/stream',{env,timeout:100}),/超时/);
    await assert.rejects(requestUpdate(base+'/slow',{env,timeout:100}),/超时/);
  } finally {for(const socket of sockets)socket.destroy();await Promise.all([server,proxy,socks].map(s=>new Promise(resolve=>s.close(resolve))));}
});
