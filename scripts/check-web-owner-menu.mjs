// Exercise real host admission and merged command menus, with no model key or desktop profile.
// Argument: temporary npm prefix containing pinned DSH, rewind and playwright-core.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp, mkdir, writeFile, symlink, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {setTimeout as delay} from 'node:timers/promises';

const prefix=path.resolve(process.argv[2]);
const ownerOnly=process.argv.includes("--owner-only");
const require=createRequire(path.join(prefix,'package.json'));
const {chromium}=require('playwright-core');
const cli=path.join(prefix,'node_modules','@deepseek-ai','dsh','lib','bin.js');
const dir=await mkdtemp(path.join(tmpdir(),'purge-web-menu-'));
const home=path.join(dir,'dsh'), modules=path.join(home,'profiles','web','node_modules');
let child, exited, browser;
try {
  // Register only the published plugin's command and management-route implementations.
  // The harness does not enable host patching, model tasks or update installation.
  const probe=path.join(modules,'purge-acceptance');
  await mkdir(probe,{recursive:true});
  await writeFile(path.join(probe,'package.json'),JSON.stringify({name:'purge-acceptance',type:'module',main:'main.mjs'}));
  await writeFile(path.join(probe,'main.mjs'),`import {installCommands,installWebServer} from ${JSON.stringify(new URL('../lib/index.js',import.meta.url).href)};
export const name='purge-acceptance'; export function apply(ctx){
  installCommands(ctx,{});installWebServer(ctx,{});
  ctx.inject(['workspaceRegistry'], async host => {
    await host.workspaceRegistry.create(${JSON.stringify(path.join(dir,'menu-acceptance-workspace'))});
  });
}`);
  if (!ownerOnly) await symlink(path.join(prefix,'node_modules','dsh-rewind-plugin'),path.join(modules,'dsh-rewind-plugin'),process.platform==='win32'?'junction':'dir');
  await mkdir(path.join(dir,'menu-acceptance-workspace'));
  const patch=path.join(dir,'fixture.yml');
  await writeFile(patch,'- insert:\n    - id: purge-acceptance\n      name: purge-acceptance\n'+(ownerOnly?'':'    - id: dsh-rewind-plugin\n      name: dsh-rewind-plugin\n'));
  child=spawn(process.execPath,[cli,'--profile','web','--patch',patch,'--no-open','--host','127.0.0.1','--port','0'],{cwd:dir,env:{...process.env,DSH_HOME:home,HOME:dir,USERPROFILE:dir},stdio:['ignore','pipe','pipe']});
  exited=once(child,'exit');
  let output='';
  for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{output=(output+chunk).slice(-65536);});
  let launch;
  for(let i=0;i<300;i++){
    launch=output.match(/http:\/\/127\.0\.0\.1:\d+[^\s]*\s/)?.[0]?.trim();
    if(launch)break;
    if(child.exitCode!==null)throw Error('Isolated web host exited: '+child.exitCode);
    await delay(100);
  }
  assert.ok(launch,'isolated host did not announce a loopback URL');
  assert.equal((await fetch(new URL('/dsh-purge/apply',launch))).status,401);
  browser=await chromium.launch({channel:'chrome'});
  const page=await browser.newPage({locale:'zh-CN'});page.setDefaultTimeout(12000);
  // Never print the launch URL: it carries the disposable browser session bootstrap.
  await page.goto(launch);
  const ownerStatus=()=>page.evaluate(async()=> (await fetch('/dsh-purge/apply')).status);
  await page.waitForFunction(async()=> (await fetch('/dsh-purge/apply')).status===405);
  assert.equal(await ownerStatus(),405);
  if(ownerOnly) {
    assert.equal(await page.evaluate(async()=> (await fetch('/dsh-purge/status')).status),200);
    console.log('PASS: real host anonymous 401, authenticated owner 200');
  } else {
  const next=page.getByRole('button',{name:/^(继续|continue)$/i});
  await next.click({timeout:3000}).catch(()=>{});
  await page.getByRole('dialog').getByRole('button',{name:/^(关闭|close)$/i}).click({timeout:3000}).catch(()=>{});
  // A cold host deliberately disables the composer until a workspace/session is selected.
  const workspace = page.getByRole('treeitem', {name:'menu-acceptance-workspace', exact:true});
  await workspace.waitFor({timeout:30000});
  await workspace.hover();
  await page.getByRole('button',{name:/在“menu-acceptance-workspace”中新建会话|new session in menu-acceptance-workspace/i}).click();
  await page.getByRole('button',{name:/选择工作区|choose workspace/i}).filter({hasText:'menu-acceptance-workspace'}).waitFor();
  const add=page.getByRole('button',{name:/添加文件或调用指令|add files or (run|invoke) commands/i});
  await page.locator('[data-conversation-session]:not([data-conversation-session=""])').waitFor();
  await add.click();
  const menu=page.getByRole('listbox');
  await menu.getByText('rewind',{exact:true}).waitFor();
  assert.equal(await menu.getByText('purge-rewind',{exact:true}).count(),0);
  const chooser=page.waitForEvent('filechooser');
  await menu.getByText(/^(文件|file)$/i).first().click();
  await chooser;
  await page.keyboard.press('Escape');
  await page.locator('[contenteditable=true],textarea').first().click();await page.keyboard.type('/');
  await menu.getByText('rewind',{exact:true}).waitFor();
  assert.equal(await menu.getByText('purge-rewind',{exact:true}).count(),0);
  console.log('PASS: anonymous 401, owner reaches handler; + and / preserve independent rewind; file chooser opens.');
  }
} finally {
  try {await browser?.close();}
  finally {
    if(child && child.exitCode===null && child.signalCode===null){child.kill();await exited;}
    await rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:200});
  }
}
