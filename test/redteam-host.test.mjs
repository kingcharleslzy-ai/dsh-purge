import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {apply as applyRedteamUi, inject as redteamUiInject, name as redteamUiName} from '../lib/redteam/ui.js';

test('drill tools resolve their native framework in a copied official host outside node_modules',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-drill-host-'));
 try{
  const host=path.join(root,'owned-dsh'),cli=path.join(host,'lib/bin.js'),framework=path.join(host,'node_modules/@deepseek-ai/dsh-tools');
  fs.mkdirSync(path.dirname(cli),{recursive:true});fs.mkdirSync(framework,{recursive:true});
  fs.writeFileSync(cli,'// official entry fixture');fs.writeFileSync(path.join(host,'package.json'),JSON.stringify({name:'@deepseek-ai/dsh',bin:{dsh:'lib/bin.js'}}));
  fs.writeFileSync(path.join(framework,'package.json'),'{"main":"index.cjs"}');fs.writeFileSync(path.join(framework,'index.cjs'),'exports.defineTool=(tool)=>tool;');
  const moduleUrl=pathToFileURL(path.resolve('lib/redteam/tools.js')).href;
  const script=`process.argv[1]=${JSON.stringify(cli)};const m=await import(${JSON.stringify(moduleUrl)});console.log(m.name);`;
  assert.equal(execFileSync(process.execPath,['--input-type=module','-e',script],{cwd:root,env:{...process.env,HOME:root,DSH_HOME:path.join(root,'home'),DSH_PROFILE:'custom-profile',PURGE_DSH_CLI:''},encoding:'utf8',stdio:'pipe'}).trim(),'dsh-purge-redteam-tools');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('RedTeam UI declares the Host webServer contract and registers its loopback route', async()=>{
 assert.equal(redteamUiName,'dsh-purge-redteam-ui');
 assert.deepEqual(redteamUiInject,['redteam','webServer']);

 const patch=fs.readFileSync(new URL('../cordis.patch.yml',import.meta.url),'utf8');
 const providerAt=patch.indexOf('- id: dsh-purge-webserver');
 const uiAt=patch.indexOf('- id: dsh-purge-redteam-ui');
 assert.ok(providerAt>=0 && uiAt>providerAt,'the fallback provider must precede the UI consumer');
 const provider=patch.slice(providerAt,uiAt);
 assert.ok(provider.includes("name: '@deepseek-ai/dsh-host-webserver'"));
 assert.ok(provider.includes("require.resolve('@deepseek-ai/dsh-host-webserver/package.json')"));
 assert.ok(provider.includes("entry.options.id !== 'dsh-purge-webserver'"));
 assert.ok(provider.includes("entry.options.name === '@deepseek-ai/dsh-host-webserver'"));
 assert.ok(provider.includes('host: 127.0.0.1') && provider.includes('port: 0'));
 const ui=patch.slice(uiAt);
 assert.ok(ui.includes('disabled: !!js'));
 assert.ok(ui.includes("require.resolve('@deepseek-ai/dsh-host-webserver/package.json')"));

 const extractDisabledExpression=(rowId)=>{
  const start=patch.indexOf(`- id: ${rowId}`);
  const disabledAt=patch.indexOf('disabled: !!js >-',start);
  assert.ok(start>=0 && disabledAt>start,`${rowId} must have a JS disabled expression`);
  const after=patch.slice(disabledAt).split(/\r?\n/u).slice(1);
  const body=[];
  for(const line of after){
   if(!/^ {8}/u.test(line))break;
   body.push(line.slice(8));
  }
  return body.join('\n');
 };
 const providerExpr=extractDisabledExpression('dsh-purge-webserver');
 const uiExpr=extractDisabledExpression('dsh-purge-redteam-ui');
 const hostRoot=fs.mkdtempSync(path.join(os.tmpdir(),'purge-webserver-host-'));
 const hostPackage=path.join(hostRoot,'node_modules/@deepseek-ai/dsh-host-webserver');
 fs.mkdirSync(hostPackage,{recursive:true});
 fs.writeFileSync(path.join(hostPackage,'package.json'),'{"name":"@deepseek-ai/dsh-host-webserver","version":"0.2.1-rc.5"}');
 const baseUrl=pathToFileURL(path.join(hostRoot,'host.js')).href;
 const evaluate=(expression,entries,url=baseUrl)=>new Function('ctx',`return ${expression}`)({
  baseUrl:url,
  loader:{entries:()=>entries},
 });
 const ownProvider=[{options:{id:'dsh-purge-webserver',name:'@deepseek-ai/dsh-host-webserver'},disabled:false}];
 const activeOfficial=[{options:{id:'webserver',name:'@deepseek-ai/dsh-host-webserver'},disabled:false}];
 const disabledOfficial=[{options:{id:'webserver',name:'@deepseek-ai/dsh-host-webserver'},disabled:true}];
 assert.equal(evaluate(providerExpr,[]),false,'fallback provider should start when no Host provider exists');
 assert.equal(evaluate(providerExpr,ownProvider),false,'fallback provider must not disable itself');
 assert.equal(evaluate(providerExpr,activeOfficial),true,'fallback provider must yield to an active official provider');
 assert.equal(evaluate(providerExpr,disabledOfficial),false,'a disabled official provider does not satisfy webServer');
 assert.equal(evaluate(uiExpr,ownProvider),false,'RedTeam UI should stay enabled with the fallback provider');
 const missingRoot=fs.mkdtempSync(path.join(os.tmpdir(),'purge-webserver-missing-'));
 const missingBase=pathToFileURL(path.join(missingRoot,'host.js')).href;
 assert.equal(evaluate(providerExpr,[],missingBase),true,'fallback provider should be disabled when the Host package is absent');
 assert.equal(evaluate(uiExpr,[],missingBase),true,'RedTeam UI should be disabled when no Host webServer can be provided');
 fs.rmSync(hostRoot,{recursive:true,force:true});
 fs.rmSync(missingRoot,{recursive:true,force:true});

 const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-redteam-webserver-'));
 const routes=[];
 const cleanups=[];
 const ctx={
  redteam:{root},
  webServer:{register(route){routes.push(route);return ()=>{};}},
  effect(effect){const cleanup=effect();if(typeof cleanup==='function')cleanups.push(cleanup);},
  on(){return ()=>{};},
 };
 try{
  applyRedteamUi(ctx);
  assert.equal(routes.length,1);
  assert.equal(routes[0].kind,'exact');
  assert.equal(routes[0].path,'/redteam/api');
  const response={
   writeHead(status,headers){this.status=status;this.headers=headers;},
   end(body){this.body=body;},
  };
  await routes[0].handler({method:'GET',headers:{},socket:{remoteAddress:'127.0.0.1'}},response);
  assert.equal(response.status,405);
  assert.deepEqual(JSON.parse(response.body),{ok:false,error:'POST only'});
 }finally{
  for(const cleanup of cleanups.reverse())cleanup();
  fs.rmSync(root,{recursive:true,force:true});
 }
});
