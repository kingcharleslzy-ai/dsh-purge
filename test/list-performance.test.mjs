import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {RedteamStore,dispatch} from '../lib/redteam/store-core.js';

test('metadata bootstrap opens no SQLite databases; full statistics remain available and failures visible',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-list-'));const store=new RedteamStore(root);
 try{
  for(let i=0;i<20;i++){const dir=path.join(store.engagementsDir,`fixture-${i}`);fs.mkdirSync(dir);fs.writeFileSync(store.dbPathOf(`fixture-${i}`),'deliberately invalid SQLite');}
  const light=dispatch(store,{op:'bootstrap'});assert.equal(light.ok,true);assert.equal(light.engagements.length,20);assert.equal(store.handles.size,0);
  assert(light.engagements.every(x=>x.stats===null));
  const full=store.listEngagements();assert(full.every(x=>x.stats_error));assert.equal(full.length,20);
 }finally{store.close();fs.rmSync(root,{recursive:true,force:true});}
});

test('batched detail evidence preserves legacy JSON, clipping, order, empty lists and limits on real SQLite',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-evidence-'));const store=new RedteamStore(root);
 try{
  const db=store.db('fixture',{create:true});const long='x'.repeat(61000);db.exec('BEGIN');
  for(let i=1;i<=451;i++){
   db.prepare('INSERT INTO vuln (id,title,severity) VALUES (?,?,?)').run(i,`ordinary fixture ${i}`,'low');
   for(let j=0;j<2;j++)db.prepare('INSERT INTO http_evidence(vuln_id,label,request,response) VALUES(?,?,?,?)').run(i,`record-${j}`,'GET /fixture',i===1?long:'ordinary response');
  }db.exec('COMMIT');
  const result=store.listVulns('fixture',{limit:500});assert.equal(result.total,451);assert.equal(result.items.length,451);
  const clipped=t=>t==null?null:String(t).length>60000?String(t).slice(0,60000)+'\n…（截断）':String(t);
  for(const item of result.items){const expected=db.prepare('SELECT id,label,method,url,status,request,response,note,captured_by,captured_at FROM http_evidence WHERE vuln_id=? ORDER BY id').all(item.id).map(e=>({...e,request:clipped(e.request),response:clipped(e.response)}));assert.deepEqual(item.http_evidence,expected);}
  assert.equal(store.listVulns('fixture',{q:'absent'}).items.length,0);
  assert.equal(store.listVulns('fixture',{limit:1}).items.length,1);
 }finally{store.close();fs.rmSync(root,{recursive:true,force:true});}
});
