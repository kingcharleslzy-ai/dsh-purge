import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtempSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {allowOwnerRequest} from '../lib/owner-admission.js';
import {installWebServer} from '../lib/index.js';
import {apply as installRedteam} from '../lib/redteam/ui.js';

const owner = () => ({peer:{principal:{kind:'owner'}}});
const response = () => ({
  status:undefined,body:undefined,headers:undefined,
  writeHead(status,headers){this.status=status;this.headers=headers;},
  end(body){this.body=String(body??'');},
});
const decide = connection => {
  const res=response();
  return {allowed:allowOwnerRequest({get:()=>connection},{headers:{}},res),...res};
};

test('only the Host owner is admitted, using the original service receiver and request',()=>{
  const req={headers:{host:'localhost',cookie:'fixture-owner'}};
  const connection={admit(value){assert.equal(this,connection);assert.equal(value,req);return owner();}};
  const res=response();
  assert.equal(allowOwnerRequest({get:()=>connection},req,res),true);
  assert.equal(res.status,undefined);
  assert.equal(decide({admit:()=>({peer:{principal:{kind:'operator'}}})}).status,403);
  for(const status of [401,403])assert.equal(decide({admit:()=>({rejection:status})}).status,status);
});

test('missing, throwing and malformed authentication fail closed without exposing errors',()=>{
  for(const connection of [undefined,null,{}, {admit:true}, {admit(){throw Error('PRIVATE_FIXTURE');}},
    ...[undefined,null,false,{}, {peer:{}}, {peer:{principal:{}}}, {rejection:undefined},
      {rejection:200}, {rejection:'401'},Promise.resolve(owner()),Promise.reject(Error("PRIVATE_FIXTURE"))].map(value=>({admit:()=>value}))]){
    const result=decide(connection);
    assert.equal(result.allowed,false);
    assert.equal(result.status,503);
    assert.equal(result.headers['cache-control'],'no-store');
    assert.doesNotMatch(result.body,/PRIVATE_FIXTURE/);
  }
  const res=response();
  assert.equal(allowOwnerRequest({get(){throw Error('PRIVATE_FIXTURE');}}, {},res),false);
  assert.equal(res.status,503);
  assert.doesNotMatch(res.body,/PRIVATE_FIXTURE/);
});

function fixture(t,initial={admit:()=>({rejection:401})}){
  const home=mkdtempSync(join(tmpdir(),'purge-owner-http-'));
  const routes=new Map(),stops=[];
  let connection=initial,bodyReads=0,businessReads=0;
  const ctx={
    webServer:{host:'192.168.1.50',register(spec){routes.set(spec.path,spec);return ()=>routes.delete(spec.path);}},
    get(name){return name==='connection'?connection:undefined;},
    inject(_names,callback){return callback(ctx);},
    effect(callback){const stop=callback();if(typeof stop==='function')stops.push(stop);},
    __dshpEnvAdaptPreStep:true,
    redteam:{get root(){businessReads++;return home;}},
  };
  installWebServer(ctx,{});
  installRedteam(ctx);
  t.after(()=>{for(const stop of stops.reverse())stop();rmSync(home,{recursive:true,force:true});});
  const call=async(path,{method='POST',headers={},body,unreadable=true}={})=>{
    const facts={method,url:path,headers:{host:'192.168.1.50:43120',...headers},socket:{remoteAddress:'127.0.0.1'}};
    const req=unreadable?{...facts,
      [Symbol.asyncIterator](){bodyReads++;throw Error('unauthorized body read');},
      on(){bodyReads++;throw Error('unauthorized body read');},
    }:Object.assign(Readable.from([Buffer.from(JSON.stringify(body??{}))]),facts);
    const res=response();await routes.get(path).handler(req,res);return res;
  };
  return {routes,home,call,setConnection(value){connection=value;},counters:()=>({bodyReads,businessReads})};
}

test('every registered management route rejects anonymous requests before body or business work',async t=>{
  const f=fixture(t);
  assert.ok(f.routes.size>=20,'exercise the production registration table');
  for(const path of f.routes.keys()){
    for(const method of ['GET','POST']){
      const res=await f.call(path,{method});
      assert.equal(res.status,401,`${method} ${path}`);
    }
  }
  assert.deepEqual(f.counters(),{bodyReads:0,businessReads:0});
});

test('aliases and the independent redteam loopback path cannot bypass owner admission',async t=>{
  const f=fixture(t);
  for(const path of ['/dsh-purge/skills','/dsh-purge/skill','/dsh-purge/rules','/redteam/api']){
    for(const headers of [
      {origin:'http://192.168.1.50:43120','sec-fetch-site':'same-origin'},
      {host:'localhost:43120'},
      {origin:'https://untrusted.example','sec-fetch-site':'cross-site','content-type':'text/plain'},
      {origin:'null'},
    ])assert.ok([401,403].includes((await f.call(path,{headers})).status),path);
  }
  assert.deepEqual(f.counters(),{bodyReads:0,businessReads:0});
});

test('valid non-owner Peers and service failures cannot dispatch any management route',async t=>{
  const f=fixture(t);
  for(const [service,status] of [
    [{admit:()=>({peer:{principal:{kind:'operator'}}})},403],
    [undefined,503],
    [{admit(){throw Error('PRIVATE_FIXTURE');}},503],
    [{admit:()=>({})},503],
  ]){
    f.setConnection(service);
    for(const path of f.routes.keys()){
      const res=await f.call(path);
      assert.equal(res.status,status,path);
      assert.doesNotMatch(res.body,/PRIVATE_FIXTURE/);
    }
  }
  assert.deepEqual(f.counters(),{bodyReads:0,businessReads:0});
});

test('authenticated controls retain original dispatch and resolve replacement services per request',async t=>{
  const f=fixture(t,{admit:owner});
  // Wrong methods reach existing 405 handling, without performing Host mutations.
  assert.equal((await f.call('/dsh-purge/apply',{method:'GET'})).status,405);
  for(const path of ['/dsh-purge/skills','/dsh-purge/skill','/dsh-purge/rules']){
    assert.equal((await f.call(path,{method:'PUT'})).status,405);
  }
  const before=readdirSync(f.home);
  const redteam=await f.call('/redteam/api',{unreadable:false,body:{op:'platformEnvAdaptStatus'}});
  assert.equal(redteam.status,200);
  assert.equal(JSON.parse(redteam.body).ok,true);
  assert.ok(f.counters().businessReads>0);
  assert.deepEqual(readdirSync(f.home),before,'read-only fixture creates no state');
  f.setConnection(undefined);
  assert.equal((await f.call('/dsh-purge/apply',{method:'GET'})).status,503);
  f.setConnection({admit:()=>({rejection:401})});
  assert.equal((await f.call('/dsh-purge/apply',{method:'GET'})).status,401);
  f.setConnection({admit:owner});
  assert.equal((await f.call('/dsh-purge/apply',{method:'GET'})).status,405);
});

test('0.2.3 resolves connection.authentication through the calling fiber',()=>{
  const ownerPeer={peer:{principal:{kind:'owner'}}};
  const working={admit:()=>ownerPeer};
  const bare={admit(){throw Error('cannot get property "connection.authentication" without inject');}};
  const requested=[];
  const ctx={
    get(name){return name==='connection'?bare:undefined;},
    inject(names,callback){requested.push(names);return callback({get:()=>working});},
  };
  const res=response();
  assert.equal(allowOwnerRequest(ctx,{headers:{}},res),true);
  assert.equal(res.status,undefined);
  assert.deepEqual(requested,[['connection','connection.authentication']]);
});

test('bare lookup still serves deployments without an inject fork',()=>{
  const connection={admit:()=>({peer:{principal:{kind:'owner'}}})};
  for(const ctx of [{get:()=>connection},{get:()=>connection,inject(){throw Error('no fiber');}},{connection}]){
    const res=response();
    assert.equal(allowOwnerRequest(ctx,{headers:{}},res),true);
    assert.equal(res.status,undefined);
  }
});

test('a delayed or reloaded owner service uses one subscription and no root fallback',()=>{
  let attach,count=0;
  const ctx={root:{connection:{admit:owner}},inject(names,fn){count++;attach=fn;}};
  const check=(status)=>{const res=response();assert.equal(allowOwnerRequest(ctx,{},res),status===undefined);assert.equal(res.status,status);};
  check(503);check(503);
  const detach=attach({connection:{admit:owner}});check(undefined);detach();check(503);
  attach({connection:{admit:()=>({peer:{principal:{kind:'operator'}}})}});check(403);
  assert.equal(count,1);
});
