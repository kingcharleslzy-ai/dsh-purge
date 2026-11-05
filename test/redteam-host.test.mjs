import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

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

test('bundled file-write skill stays readable and demonstrates write access using inert content', async () => {
  const {readSkillFromRoot} = await import('../lib/redteam/skill-availability.js');
  const skill = readSkillFromRoot(path.resolve('skills/redteam'), 'unauth-exploit');
  assert.ok(skill);
  assert.match(skill.content, /^name: unauth-exploit$/m);
  assert.match(skill.content, /^enabled: true$/m);
  assert.match(skill.content, /静态标记/);
  assert.doesNotMatch(skill.content, /<\?(?:php\b|=)/i);
});

test('published skill command round trips a fresh challenge; echoes, stale replies and mixed output fail', () => {
  const verify = path.resolve('scripts/exec-proof.mjs');
  const content = fs.readFileSync('skills/redteam/unauth-exploit.md', 'utf8');
  const win = process.platform === 'win32';
  const pattern = win ? /```powershell\r?\n([^\r\n]+)/ : /```sh\r?\n([^\r\n]+)/;
  const block = content.match(pattern)?.[1];
  assert.ok(block, 'platform command missing from the bundled skill');
  for (const ending of ['\n', '\r\n']) {
    assert.equal(content.replace(/\r?\n/g, ending).match(pattern)?.[1], block);
  }
  const fresh = () => execFileSync(process.execPath, [verify, 'new'], {encoding:'utf8'}).trim();
  const nonce = fresh(), command = block.replaceAll('NONCE', nonce);
  const reply = execFileSync(win ? 'powershell.exe' : 'sh', win ? ['-NoProfile','-NonInteractive','-Command',command] : ['-c',command], {encoding:'utf8'});
  const check = (id, input) => execFileSync(process.execPath,[verify,'check',id],{input,stdio:['pipe','pipe','pipe']});
  check(nonce,reply);
  for (const [id, input] of [[nonce,nonce],[fresh(),reply],[nonce,reply+'other'],[nonce,''],[nonce,'file written']]) {
    assert.throws(() => check(id,input), e => e.status === 1);
  }
});
