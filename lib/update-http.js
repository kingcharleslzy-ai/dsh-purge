// One transport for release lists, metadata and verified archives. Proxy choices
// are local to these requests; never change global agents or OS proxy settings.
import http from 'node:http';
import {mirrorTarget} from './update-mirror.js';
import {AsyncLocalStorage} from 'node:async_hooks';
import {socksTunnel} from './update-socks.js';
const updateContext=new AsyncLocalStorage();
export const currentUpdateEnvironment=()=>updateContext.getStore() || process.env;
export const withUpdateEnvironment=(env,fn)=>updateContext.run({...env},fn);
import https from 'node:https';
import tls from 'node:tls';
import net from 'node:net';
import {readWindowsProxy} from './update-system-proxy.js';
import {setTimeout as delay} from 'node:timers/promises';
export const UPDATE_HOSTS = new Set(['github.com','codeload.github.com','api.github.com','raw.githubusercontent.com','objects.githubusercontent.com','release-assets.githubusercontent.com','cdn.jsdelivr.net']);
let systemCache;

export function bypassProxy(url, rule = '') {
  const host = url.hostname.toLowerCase(), port = url.port || (url.protocol === 'https:' ? '443' : '80');
  return rule.split(/[;,]/).some(raw => {
    const item = raw.trim().toLowerCase();
    if (!item) return false;
    if (item === '*') return true;
    if (item === '<local>') return !host.includes('.');
    const match = /^(.*?)(?::(\d+))?$/.exec(item);
    const target = match[1].replace(/^\*?\./,'');
    return (!match[2] || match[2] === port) && (host === target || host.endsWith('.' + target));
  });
}
export function windowsProxy(config, url) {
  if (!config?.ProxyEnable || !config.ProxyServer || bypassProxy(url, config.ProxyOverride)) return '';
  const parts = String(config.ProxyServer).split(';');
  const value = parts.find(p => p.startsWith(url.protocol.slice(0,-1) + '='))?.split('=').slice(1).join('=')
    || (parts.length === 1 && !parts[0].includes('=') ? parts[0] : '');
  return value ? (/^https?:\/\//i.test(value) ? value : 'http://' + value) : '';
}
async function systemProxy(url, {signal}={}) {
  if (process.platform !== 'win32') return '';
  if (!systemCache || Date.now() - systemCache.at > 30000) {
    systemCache = {at:Date.now(),value:await readWindowsProxy({signal})};
  }
  if (systemCache.value.AutoConfigURL && !systemCache.value.ProxyEnable) throw Error('the update proxy uses PAC; set PURGE_HTTPS_PROXY or HTTPS_PROXY for update requests');
  return windowsProxy(systemCache.value,url);
}
export async function proxyFor(url, env = process.env, discover = systemProxy, signal) {
  if (bypassProxy(url, env.no_proxy ?? env.NO_PROXY)) return '';
  const explicit = env.PURGE_HTTPS_PROXY ?? env.https_proxy ?? env.HTTPS_PROXY ?? env.http_proxy ?? env.HTTP_PROXY;
  const value = explicit !== undefined ? explicit : await discover(url,{signal});
  if (!value) return '';
  let proxy;
  try { proxy = new URL(value); } catch { throw Error('invalid update proxy address'); }
  if (!['http:','https:','socks:','socks5:','socks5h:'].includes(proxy.protocol)) throw Error('the update proxy supports HTTP/HTTPS CONNECT or SOCKS5 only');
  return proxy;
}
export function githubHeaders(url, extra = {}, env = process.env) {
  const headers = {'user-agent':'dsh-purge-community-update',accept:'*/*',...extra};
  for (const key of Object.keys(headers)) if (/^(authorization|proxy-authorization)$/i.test(key)) delete headers[key];
  const token = env.GITHUB_TOKEN || env.GH_TOKEN;
  if (url.protocol === 'https:' && url.hostname === 'api.github.com' && token) headers.authorization = 'Bearer ' + token;
  return headers;
}
export function httpFailure(status, headers = {}) {
  if ((status === 403 || status === 429) && String(headers['x-ratelimit-remaining']) === '0') {
    const epoch = Number(headers['x-ratelimit-reset']);
    return `GitHub API quota exhausted (HTTP ${status})${epoch > 0 && epoch < 1e12 ? ', resets at ' + new Date(epoch*1000).toISOString() : ''}; wait or configure GITHUB_TOKEN / GH_TOKEN`;
  }
  if (status === 401) return 'GitHub authentication failed (HTTP 401); check the token';
  if (status === 403 || status === 429) return `GitHub rejected the request (HTTP ${status}); check access rights or retry limits`;
  if (status === 404) return 'GitHub resource missing or not accessible (HTTP 404)';
  if (status === 407) return 'update proxy authentication failed (HTTP 407)';
  return `update request failed: HTTP ${status}`;
}
function proxyAgent(proxy, signal) {
  const agent = new https.Agent({keepAlive:false});
  agent.createConnection = (options, callback) => {
    const host = options.hostname || options.host;
    if(['socks:','socks5:','socks5h:'].includes(proxy.protocol)) {
      socksTunnel(proxy,host,options.port||443,signal).then(socket=>{
        if(signal.aborted){socket.destroy();callback(Error('update request timed out'));return;}
        const secure=tls.connect({socket,servername:net.isIP(host)?undefined:host,rejectUnauthorized:true});
        const abort=()=>secure.destroy(Error('update request timed out'));
        signal.addEventListener('abort',abort,{once:true});
        secure.once('close',()=>signal.removeEventListener('abort',abort));
        callback(null,secure);
      },callback);
      return;
    }
    const authority = `${net.isIP(host) === 6 ? '['+host+']' : host}:${options.port || 443}`;
    const headers = {host:authority};
    if (proxy.username || proxy.password) headers['proxy-authorization'] = 'Basic ' + Buffer.from(decodeURIComponent(proxy.username) + ':' + decodeURIComponent(proxy.password)).toString('base64');
    const transport = proxy.protocol === 'https:' ? https : http;
    const endpoint = new URL(proxy); endpoint.username=''; endpoint.password='';
    const req = transport.request(endpoint, {method:'CONNECT',path:authority,headers,signal,agent:false});
    req.once('connect',(res,socket,head) => {
      if (res.statusCode !== 200) { socket.destroy(); callback(Error(httpFailure(res.statusCode))); return; }
      if (head.length) socket.unshift(head);
      const secure = tls.connect({socket,servername:net.isIP(host) ? undefined : host, rejectUnauthorized:true});
      const abort = () => secure.destroy(Error('update request timed out'));
      signal.addEventListener('abort',abort,{once:true});
      secure.once('close',() => signal.removeEventListener('abort',abort));
      callback(null,secure);
    });
    req.once('error',callback);
    req.end();
  };
  return agent;
}
function oversized(limit, observed) {
  return Error(`update file too large (limit ${limit} B, response at least ${observed} B)`);
}
async function once(url, headers, signal, maxBytes, options) {
  if (options.fetch) {
    const res = await options.fetch(url,{headers,signal,redirect:'manual'});
    if (res.status >= 300 && res.status < 400 || !res.ok) {
      await res.body?.cancel?.().catch(()=>{});
      return {status:res.status,headers:Object.fromEntries(res.headers),body:Buffer.alloc(0)};
    }
    if (Number(res.headers.get('content-length')) > maxBytes) { await res.body?.cancel?.().catch(()=>{}); throw oversized(maxBytes, Number(res.headers.get('content-length'))); }
    let size=0; const chunks=[];
    for await (const chunk of res.body) { size+=chunk.length; if(size>maxBytes) throw oversized(maxBytes, size); chunks.push(Buffer.from(chunk)); }
    return {status:res.status,headers:Object.fromEntries(res.headers),body:Buffer.concat(chunks)};
  }
  options.phase='proxy';
  let proxy;
  try {proxy = await proxyFor(url,options.env || process.env, options.discoverProxy, signal);}
  catch(e) {throw Object.assign(Error('update proxy config or probe failed: '+ (e.code ? String(e.code).replace(/[^A-Z0-9_]/g,'') : e.message)),{stage:'proxy'});}
  if (signal.aborted) throw Error('update request timed out');
  options.phase='network';
  if (proxy && url.protocol !== 'https:') throw Error('the update proxy is used for HTTPS downloads only');
  const agent = proxy ? proxyAgent(proxy,signal) : false;
  try {
    return await new Promise((resolve,reject)=>{
      const req = (url.protocol === 'https:' ? https : http).request(url,{method:'GET',headers,signal,agent},res=>{
        const status=res.statusCode||0;
        if (status<200 || status>=300) { res.destroy(); resolve({status,headers:res.headers,body:Buffer.alloc(0)}); return; }
        if(Number(res.headers['content-length'])>maxBytes) {req.destroy(oversized(maxBytes, Number(res.headers['content-length'])));return;}
        let size=0; const chunks=[];
        res.on('data',chunk=>{size+=chunk.length;if(size>maxBytes)req.destroy(oversized(maxBytes, size));else chunks.push(chunk);});
        res.on('end',()=>resolve({status,headers:res.headers,body:Buffer.concat(chunks)}));
        res.on('error',reject);
      });
      req.on('error',reject);req.end();
    });
  } finally { if(agent) agent.destroy(); }
}
function withinSignal(promise, signal) {
  return new Promise((resolve,reject) => {
    const abort = () => reject(Error('update request timed out'));
    if(signal.aborted) { promise.catch(()=>{}); abort(); return; }
    signal.addEventListener('abort',abort,{once:true});
    promise.then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort));
  });
}
const transientCodes=new Set(['ECONNRESET','ECONNREFUSED','EPIPE','ETIMEDOUT','EAI_AGAIN','ENETUNREACH','EHOSTUNREACH']);
function networkCode(error) {
  for(let i=0;error && i<4;i++,error=error.cause) if(error.code) return String(error.code);
  return '';
}
export async function requestUpdate(url, {timeout=12000,maxBytes=50*1024*1024,headers={},redirects=5,allowedHosts=UPDATE_HOSTS,...options}={}) {
  options.env=options.env || updateContext.getStore() || process.env;
  // Validate the original destination before rewriting it. A mirror never expands
  // the allowed source set, and authoritative metadata explicitly bypasses it.
  const original = new URL(url);
  if (original.protocol !== 'https:' || original.username || original.password || !allowedHosts.has(original.hostname)) throw Error('invalid update download source');
  const mirrored = options.authoritative ? null : mirrorTarget(url, options.env);
  if (mirrored) { url = mirrored.href; allowedHosts = new Set([...allowedHosts, mirrored.hostname]); }
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout); timer.unref?.();
  let retries=0;
  try {
    for(let n=0;n<=redirects;n++) {
      const target=new URL(url);
      if(target.protocol!=='https:' || target.username || target.password || !allowedHosts.has(target.hostname)) throw Error('invalid update download source');
      let res;
      while(true) {
        try {res=await withinSignal(once(target,githubHeaders(target,headers,mirrored ? {...options.env,GITHUB_TOKEN:"",GH_TOKEN:""} : options.env),controller.signal,maxBytes,options),controller.signal);break;}
        catch(e) {
          if(e.stage==='proxy' || controller.signal.aborted || !transientCodes.has(networkCode(e)) || retries>=2) throw e;
          // One retry budget across redirects, and the original deadline covers
          // discovery, streaming and backoff. Never switch proxy/direct routes.
          await delay(150 * 2**retries++,undefined,{signal:controller.signal});
        }
      }
      if([301,302,303,307,308].includes(res.status)) {
        if(!res.headers.location) throw Error('invalid update redirect');
        url=new URL(res.headers.location,target).href;continue;
      }
      if(res.status<200 || res.status>=300) throw Error(httpFailure(res.status,res.headers));
      return res;
    }
    throw Error('too many update redirects');
  } catch(e) {
    if(controller.signal.aborted || e.name==='AbortError' || e.name==='TimeoutError') throw Error(options.phase==='proxy'?'update proxy probe timed out (the HTTP request was not sent)':'update request timed out; check the update proxy or network');
    // Do not include URL credentials, tokens, proxy addresses or response bodies.
    if(networkCode(e)) throw Error(`update network connection failed (${networkCode(e).replace(/[^A-Z0-9_]/g,'')}, attempt ${retries+1}); check the update proxy or network`);
    throw e;
  } finally {clearTimeout(timer);}
}
