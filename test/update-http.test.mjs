import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestUpdate,proxyFor,windowsProxy,bypassProxy,httpFailure} from '../lib/update-http.js';

test('authentication is API-only and removed on every cross-host redirect',async()=>{
  const calls=[];
  const result=await requestUpdate('https://api.github.com/repos/test/test/releases',{
    env:{GH_TOKEN:'fixture-secret'},
    fetch:async(url,options)=>{
      calls.push({url:String(url),headers:options.headers});
      return calls.length===1 ? new Response(null,{status:302,headers:{location:'https://release-assets.githubusercontent.com/asset'}}) : new Response('ok');
    },
  });
  assert.equal(result.body.toString(),'ok');
  assert.equal(calls[0].headers.authorization,'Bearer fixture-secret');
  assert.equal(calls[1].headers.authorization,undefined);
});

test('proxy precedence, bypass and read-only Windows static proxy parsing',async()=>{
  const url=new URL('https://api.github.com/x');
  const discover=async()=> 'http://127.0.0.1:9000';
  assert.equal((await proxyFor(url,{HTTPS_PROXY:'http://127.0.0.1:9001'},discover)).port,'9001');
  assert.equal((await proxyFor(url,{},discover)).port,'9000');
  assert.equal(await proxyFor(url,{HTTPS_PROXY:'http://invalid',NO_PROXY:'.github.com'},discover),'');
  assert.equal(await proxyFor(url,{PURGE_HTTPS_PROXY:''},discover),'');
  assert.equal(windowsProxy({ProxyEnable:1,ProxyServer:'http=127.0.0.1:8001;https=127.0.0.1:8002'},url),'http://127.0.0.1:8002');
  assert.equal(windowsProxy({ProxyEnable:0,ProxyServer:'127.0.0.1:8002'},url),'');
  assert(bypassProxy(url,'api.github.com:443'));
  assert(!bypassProxy(url,'api.github.com:80'));
});

test('rate limits, auth failures and missing resources are distinct',async()=>{
  assert.match(httpFailure(403,{'x-ratelimit-remaining':'0','x-ratelimit-reset':'1790000000'}),/额度耗尽.*重置时间/);
  assert.match(httpFailure(401),/认证失败/);
  assert.match(httpFailure(404),/不存在或无访问权限/);
  await assert.rejects(requestUpdate('https://api.github.com/x',{fetch:async()=>new Response('SECRET RESPONSE',{status:403,headers:{'x-ratelimit-remaining':'0'}})}),e=>e.message.includes('额度耗尽')&&!e.message.includes('SECRET'));
});

test('same transport enforces redirect allowlist, size cap, and total timeout',async()=>{
  await assert.rejects(requestUpdate('https://github.com/x',{fetch:async()=>new Response(null,{status:302,headers:{location:'https://evil.example/x'}})}),/来源无效/);
  await assert.rejects(requestUpdate('https://github.com/x',{maxBytes:2,fetch:async()=>new Response('large')}),/过大/);
  await assert.rejects(requestUpdate('https://github.com/x',{timeout:20,fetch:async(_url,{signal})=>new Promise((_ok,no)=>{const timer=setTimeout(()=>no(Error('should abort first')),100);signal.addEventListener('abort',()=>{clearTimeout(timer);no(Error('aborted'));});})}),/超时/);
});

test('API and Atom failures remain visible, including when a cached list is used',async()=>{
  const {listForkReleases}=await import('../lib/update.js');
  const unavailable={releases:async()=>{throw Error('GitHub API 额度耗尽');},atom:async()=>({tags:[],error:'更新代理连接超时'})};
  const failed=await listForkReleases({fresh:true,services:unavailable});
  assert.match(failed.error,/额度耗尽/);assert.match(failed.degraded,/代理连接超时/);
  const fallback=await listForkReleases({fresh:true,services:{...unavailable,atom:async()=>({tags:['v1.6.28'],error:''}),verify:async item=>item}});
  assert.match(fallback.degraded,/releases.atom/);
  const cached=await listForkReleases();assert(cached.cached);assert.match(cached.degraded,/releases.atom/);
  const stale=await listForkReleases({fresh:true,services:unavailable});assert(stale.stale);assert.match(stale.degraded,/代理连接超时/);
});

test('concurrent update contexts keep independent credentials across awaits and redirects',async()=>{
 const {withUpdateEnvironment}=await import('../lib/update-http.js');
 const {setTimeout:pause}=await import('node:timers/promises');
 const seen=[];
 await Promise.all(['first','second'].map((token,i)=>withUpdateEnvironment({GITHUB_TOKEN:token},async()=>{
  await pause(i?1:5);
  await requestUpdate('https://api.github.com/repos/example/test',{fetch:async(url,options)=>{
    seen.push(options.headers.authorization);
    return new Response('ok',{status:200});
  }});
 })));
 assert.deepEqual(seen.sort(),['Bearer first','Bearer second']);
});

test('SOCKS handshake rejects unoffered authentication, invalid versions, abort and oversized credentials',async()=>{
 const net=await import('node:net');const {socksTunnel}=await import('../lib/update-socks.js');
 for(const response of [[5,4],[4,0],[5,2]]) {
  const sockets=[];const server=net.createServer(socket=>{sockets.push(socket);socket.once('data',()=>socket.end(Buffer.from(response)));});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {await assert.rejects(socksTunnel(new URL(`socks5://127.0.0.1:${server.address().port}`),'api.github.com',443,new AbortController().signal),/认证方式/);}
  finally {sockets.forEach(s=>s.destroy());await new Promise(resolve=>server.close(resolve));}
 }
 const aborted=new AbortController();aborted.abort();
 await assert.rejects(socksTunnel(new URL('socks5://127.0.0.1:1'),'api.github.com',443,aborted.signal),/超时/);
 await assert.rejects(socksTunnel(new URL('socks5://'+ 'a'.repeat(256)+':p@127.0.0.1:1'),'api.github.com',443,new AbortController().signal),/长度/);
 await assert.rejects(socksTunnel(new URL('socks5://%zz:p@127.0.0.1:1'),'api.github.com',443,new AbortController().signal),/编码/);
});

test("oversized and slow release lists retain both source errors and cannot confirm a version", async t => {
  const { listForkReleases, checkUpdate } = await import('../lib/update.js');
  const { download } = await import('../lib/community.js');
  const { LIST_BUDGET_MS } = await import('../lib/update-net.js');
  const url = 'https://api.github.com/repos/example/test/releases?per_page=20';
  const primary = () => download(url, 2 * 1024 * 1024, async () =>
    new Response(Buffer.alloc(2 * 1024 * 1024 + 1))).then(() => []);
  const atom = async () => ({ tags: [], error: '备用源超时' });
  const large = await listForkReleases({fresh:true, services:{releases:primary, atom}});
  assert.match([large.error, large.degraded].join(' '), /上限 2097152 B，响应至少 2097153 B/);
  assert.match(large.degraded, /备用源超时/);
  t.mock.timers.enable({apis:['setTimeout']});
  const pending = listForkReleases({fresh:true, services:{releases:()=>new Promise(()=>{}), atom}});
  t.mock.timers.tick(LIST_BUDGET_MS);
  const slow = await pending;
  assert.match([slow.error, slow.degraded].join(' '), /读取发行列表超时/);
  assert.match(slow.degraded, /备用源超时/);
  for (const listing of [large, slow]) {
    const result = await checkUpdate({listVersions:async()=>({
      versions:[], releases:[], error:listing.error, degraded:listing.degraded, stale:listing.stale,
    }), installSites:()=>[], readPublishedVersion:async()=>"1.7.11"});
    assert.equal(result.ok, false);
    assert.equal(result.hasUpdate, null);
    assert.match(result.error, /备用源超时/);
    assert.equal(result.publishedVersion, "1.7.11");
    assert.deepEqual(result.releases, []);
  }
});


test('oversized Content-Length is reported before reading the release body', async () => {
  const headers = { 'content-length': '3000000' };
  await assert.rejects(requestUpdate('https://api.github.com/x', {
    maxBytes: 2097152,
    fetch: async () => new Response('short fixture', { headers }),
  }), /上限 2097152 B，响应至少 3000000 B/);
});

test('metadata-only version check requires the official published tag and never follows redirects', async () => {
  const { readPublishedVersion } = await import('../lib/update.js');
  const repo = 'kingcharleslzy-ai/dsh-purge';
  const release = { tag_name:'v1.7.11', draft:false, prerelease:false, html_url:`https://github.com/${repo}/releases/tag/v1.7.11` };
  const fetch = override => async url => {
    assert.equal(url.href, `https://api.github.com/repos/${repo}/releases/latest`);
    return Response.json({...release,...override});
  };
  assert.equal(await readPublishedVersion(fetch({})), '1.7.11');
  for (const override of [{draft:true},{prerelease:true},{html_url:'https://example.com/release'},{tag_name:'main'}])
    await assert.rejects(readPublishedVersion(fetch(override)), /元数据不匹配/);
  let calls=0;
  await assert.rejects(readPublishedVersion(async()=>{ calls++; return Response.redirect('https://example.com'); }));
  assert.equal(calls,1);
});
