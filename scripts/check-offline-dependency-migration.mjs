// Run with the path to the actual pnpm JS entry. The fixture uses no registry.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Maintenance, PACKAGE} from '../lib/community.js';

const pnpm = path.resolve(process.argv[2]);
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-offline-'));
const profile = path.join(root, 'profiles/web');
fs.mkdirSync(profile, {recursive:true});
const source = (name) => {
  const dir = path.join(root,name,'package');
  fs.mkdirSync(dir,{recursive:true});
  const meta = {name,version:'1.0.0',main:'index.js',repository:{url:'https://github.com/kingcharleslzy-ai/dsh-purge.git'}};
  fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify(meta));
  fs.writeFileSync(path.join(dir,'index.js'),'module.exports = {};');
  const tgz=path.join(root,name+'.tgz');
  execFileSync('tar',['-czf',tgz,'-C',path.dirname(dir),'package']);
  return tgz;
};
const add = file => execFileSync(process.execPath,[pnpm,'add','--offline','--ignore-scripts','--store-dir',path.join(root,'store'),file],{cwd:profile,encoding:'utf8',env:{...process.env,CI:'true',COREPACK_ENABLE_PROJECT_SPEC:'0'},stdio:'pipe'});
const manifest=path.join(profile,'package.json');
const read = () => JSON.parse(fs.readFileSync(manifest));
try {
  const pkg=source(PACKAGE), other=source('another-fixture-plugin');
  fs.writeFileSync(manifest,JSON.stringify({name:'qa-profile',private:true,dsh:{profile:{bundles:['another-bundle']}}}));
  fs.writeFileSync(path.join(profile,'cordis.patch.yml'),'[]\n# user patch\n');
  add(pkg);
  const prior=read();
  prior.dependencies[PACKAGE]='https://github.com/kingcharleslzy-ai/dsh-purge/releases/latest/download/dsh-purge-community.tgz';
  fs.writeFileSync(manifest,JSON.stringify(prior));
  // Re-resolve the legacy floating spec without allowing network access.
  assert.throws(()=>add(other),error=>/offline|NO_OFFLINE|NO_TARBALL|network mode/i.test(String(error.stdout)+String(error.stderr)));
  const manager=new Maintenance({home:root,profile,aiBase:null,root:path.join(profile,'node_modules',PACKAGE),installer:async file=>add(file)});
  await manager.install(pkg);
  fs.unlinkSync(pkg);
  add(other);
  const spec=read().dependencies[PACKAGE];
  assert.match(spec,/^file:/);
  assert(fs.existsSync(path.resolve(profile,spec.slice(5))));
  assert.deepEqual(read().dsh.profile.bundles,['another-bundle']);
  assert.equal(fs.readFileSync(path.join(profile,'cordis.patch.yml'),'utf8'),'[]\n# user patch\n');
  console.log('PASS: stale floating dependency blocks offline add; migrated disabled profile installs unrelated package offline');
} finally {fs.rmSync(root,{recursive:true,force:true});}
