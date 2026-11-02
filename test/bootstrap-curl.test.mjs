import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import https from 'node:https';import http from 'node:http';import net from 'node:net';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {curlReleaseRequest,downloadReleaseFile} from '../scripts/bootstrap-install.mjs';
const exec=promisify(execFile);
test('real system curl: CONNECT/TLS, binary body, redirect validation, limits, timeout and curlrc isolation',async()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'purge-bootstrap-tls-'));
  const defaultOpenSsl=path.join(process.env.ProgramFiles||'C:\\Program Files','Git/usr/bin/openssl.exe');
  // PortableGit and developer-managed Git installations may live outside Program Files.
  // Prefer the conventional path when present, otherwise resolve openssl from PATH.
  const openssl=process.platform==='win32'&&fs.existsSync(defaultOpenSsl)?defaultOpenSsl:(process.platform==='win32'?'openssl.exe':'openssl');
  await exec(openssl,['req','-x509','-newkey','rsa:2048','-nodes','-keyout',path.join(tmp,'key.pem'),'-out',path.join(tmp,'cert.pem'),'-days','1','-subj','/CN=github.com','-addext','subjectAltName=DNS:github.com,DNS:release-assets.githubusercontent.com']);
  const sockets=new Set(),requests=[];
  const binary=Buffer.from([0,255,10,13,128,1,2]);
  const server=https.createServer({key:fs.readFileSync(path.join(tmp,'key.pem')),cert:fs.readFileSync(path.join(tmp,'cert.pem'))},(req,res)=>{
    requests.push(req.url);
    if(req.url==='/redirect'){res.writeHead(302,{location:'https://release-assets.githubusercontent.com/binary?signature=PRIVATE'});res.end();}
    else if(req.url==='/evil'){res.writeHead(302,{location:'https://evil.example/never'});res.end();}
    else if(req.url==='/large'){res.writeHead(200);res.end('x'.repeat(100000));}
    else if(req.url==='/slow'){res.writeHead(200);res.write('x');}
    else if(req.url==='/interim'){res.writeContinue();res.end(binary);}
    else res.end(binary);
  });
  const proxy=http.createServer();
  proxy.on('connect',(req,socket,head)=>{
    const upstream=net.connect(server.address().port,'127.0.0.1',()=>{socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');if(head.length)upstream.write(head);socket.pipe(upstream).pipe(socket);});
    sockets.add(upstream);upstream.on('error',()=>socket.destroy());socket.on('error',()=>upstream.destroy());socket.on('close',()=>upstream.destroy());
  });
  for(const s of [server,proxy]){s.on('connection',socket=>sockets.add(socket));await new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));}
  const proxyURL=`http://127.0.0.1:${proxy.address().port}`;
  // Only child-process environment is changed; never system or user proxy settings.
  const env={...process.env,HTTPS_PROXY:proxyURL,https_proxy:proxyURL,NO_PROXY:'',no_proxy:'',CURL_HOME:tmp,CURL_CA_BUNDLE:path.join(tmp,'cert.pem'),SSL_CERT_FILE:path.join(tmp,'cert.pem')};
  fs.writeFileSync(path.join(tmp,'.curlrc'),'url = "https://evil.example/curlrc-must-not-load"\nlocation\ninsecure\n');
  const transport=(url,opts)=>curlReleaseRequest(url,{...opts,env});
  try {
    const result=await transport('https://github.com/binary',{timeout:5000,limit:20});assert.deepEqual(result.body,binary);
    const interim=await transport('https://github.com/interim',{timeout:5000,limit:20});assert.deepEqual(interim.body,binary);
    const request=async()=>{throw Object.assign(Error('fixture fetch failure'),{code:'ECONNRESET'});};
    assert.deepEqual(await downloadReleaseFile('https://github.com/redirect',20,{request,curlRequest:transport,sleep:async()=>{},log:()=>{}}),binary);
    await assert.rejects(downloadReleaseFile('https://github.com/evil',20,{request,curlRequest:transport,sleep:async()=>{},log:()=>{}}),/UNTRUSTED/);
    assert(!requests.some(x=>x.includes('never')||x.includes('curlrc')));
    await assert.rejects(transport('https://github.com/large',{timeout:5000,limit:20}),/TOO_LARGE/);
    await assert.rejects(transport('https://github.com/slow',{timeout:200,limit:20}),/CURL_EXIT_28|CURL_TIMEOUT/);
    const untrusted={...env};delete untrusted.CURL_CA_BUNDLE;delete untrusted.SSL_CERT_FILE;
    await assert.rejects(curlReleaseRequest('https://github.com/binary',{timeout:5000,limit:20,env:untrusted}),/CURL_EXIT_60/);
  } finally {for(const s of sockets)s.destroy();await Promise.all([server,proxy].map(s=>new Promise(resolve=>s.close(resolve))));fs.rmSync(tmp,{recursive:true,force:true});}
});
