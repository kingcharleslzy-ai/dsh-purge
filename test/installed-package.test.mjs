import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {installedCommunityPackage,COMMUNITY_PACKAGE as name} from '../lib/installed-package.js';
import {installedYaml} from '../lib/market-migration.js';
import {Maintenance} from '../lib/community.js';
import {removeTreeNoFollowSync} from '../lib/remove-tree.js';
function fixture(t) {
  const home=fs.mkdtempSync(path.join(os.tmpdir(),'purge-alias-')),profile=path.join(home,'profiles/web');
  fs.mkdirSync(profile,{recursive:true});
  const manifest=bundles=>fs.writeFileSync(path.join(profile,'package.json'),JSON.stringify({dependencies:{[name]:'file:fixture','dsh-purge':'file:fixture'},dsh:{profile:{bundles}}}));
  const add=(alias,version='1.6.47',packageName=name)=>{
    const root=path.join(profile,'node_modules',alias);fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({name:packageName,version}));return root;
  };
  t.after(()=>removeTreeNoFollowSync(home));return{home,profile,manifest,add};
}
for(const alias of [name,'dsh-purge'])test('resolve installed metadata and YAML from physical package: '+alias,t=>{
  const f=fixture(t);f.manifest([alias]);const root=f.add(alias);
  // Isolated pnpm-shaped store: parser lives beside the real package, not at profile root.
  const store=path.join(f.profile,'node_modules/.pnpm/fixture/node_modules');fs.mkdirSync(store,{recursive:true});fs.renameSync(root,path.join(store,name));
  fs.symlinkSync(path.join(store,name),root,process.platform==='win32'?'junction':'dir');
  fs.mkdirSync(path.join(store,'yaml'));fs.writeFileSync(path.join(store,'yaml/index.js'),'module.exports={sentinel:"physical parser"};');
  const found=installedCommunityPackage(f.profile);
  assert.equal(found.package.version,'1.6.47');assert.equal(found.dependencyName,alias);
  assert.equal(installedYaml(f.profile).sentinel,'physical parser');
});
test('selected alias beats stale inactive canonical package; ambiguous bundles fail',t=>{
  const f=fixture(t);f.add(name,'1.6.40');f.add('dsh-purge');f.manifest(['dsh-purge']);
  assert.equal(installedCommunityPackage(f.profile).package.version,'1.6.47');
  f.manifest([name,'dsh-purge']);assert.throws(()=>installedCommunityPackage(f.profile),/multiple/);
});
test('missing, wrong identity, damaged metadata and absent selected package stay errors',t=>{
  const f=fixture(t);f.manifest(['dsh-purge']);
  assert.throws(()=>installedCommunityPackage(f.profile),{code:'ENOENT'});
  f.add(name);const root=f.add('dsh-purge','1.6.47','impostor');
  assert.throws(()=>installedCommunityPackage(f.profile),/identity/);
  fs.writeFileSync(path.join(root,'package.json'),'{broken');assert.throws(()=>installedCommunityPackage(f.profile),SyntaxError);
});
test('alias backup records actual package identity and preserves user files',async t=>{
  const f=fixture(t);f.manifest(['dsh-purge']);f.add('dsh-purge');
  fs.writeFileSync(path.join(f.home,'prompt-inject.md'),'PRIVATE KEEP');
  const m=new Maintenance({home:f.home,profile:f.profile});const saved=await m.backup();
  const {m:manifest}=m.verify(saved.id);
  assert.equal(manifest.plugins[0].name,'dsh-purge');assert.equal(manifest.plugins[0].packageName,name);
  assert.equal(fs.readFileSync(path.join(f.home,'prompt-inject.md'),'utf8'),'PRIVATE KEEP');
});
test('selected missing alias is not masked by an inactive canonical installation',t=>{
  const f=fixture(t);f.add(name);f.manifest(['dsh-purge']);
  assert.throws(()=>installedCommunityPackage(f.profile),{code:'ENOENT'});
});
