import { removeTreeNoFollowSync } from "../lib/remove-tree.js";
/** Read-only diagnostics in a disposable, real Electron ASAR fixture. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const binary = process.env.PURGE_ELECTRON_EXEC || "/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness";
const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "purge-diagnostic-")));
try {
  const resources = path.join(tmp, "Example.app/Contents/Resources");
  const relative = "dsh/node_modules/@deepseek-ai";
  const host = path.join(resources, "app", relative);
  const files = {
    "package.json": JSON.stringify({main:"main.js"}),
    "main.js": "// sealed old shell must not win",
    [`${relative}/dsh-desktop-host/package.json`]: '{"name":"@deepseek-ai/dsh-desktop-host","version":"0.2.1-rc.2"}',
    [`${relative}/dsh-desktop-host/lib/index.js`]: "// fixture",
    [`${relative}/dsh-agent-instructions/package.json`]: '{"name":"@deepseek-ai/dsh-agent-instructions"}',
    [`${relative}/dsh-agent-instructions/lib/index.js`]: "// diagnostic fixture",
  };
  const header = { files: {} }, buffers = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(resources, "app", name)), { recursive: true });
    fs.writeFileSync(path.join(resources, "app", name), text);
    const parts = name.split("/"); let cursor = header;
    for (const part of parts.slice(0, -1)) cursor = (cursor.files[part] ||= { files: {} });
    const buffer = Buffer.from(text);
    cursor.files[parts.at(-1)] = { size: buffer.length, offset: String(offset) };
    buffers.push(buffer); offset += buffer.length;
  }
  const json = Buffer.from(JSON.stringify(header)), padded = Math.ceil(json.length / 4) * 4;
  const prefix = Buffer.alloc(16 + padded);
  prefix.writeUInt32LE(4, 0); prefix.writeUInt32LE(8 + padded, 4);
  prefix.writeUInt32LE(4 + padded, 8); prefix.writeUInt32LE(json.length, 12); json.copy(prefix, 16);
  fs.writeFileSync(path.join(resources, "app.asar"), Buffer.concat([prefix, ...buffers]));
  fs.mkdirSync(path.join(resources, "app/out/main"), {recursive:true});
  fs.writeFileSync(path.join(resources, "app/package.json"), JSON.stringify({main:"out/main/index.js"}));
  fs.writeFileSync(path.join(resources, "app/out/main/index.js"), "// [dsh-purge] signal kill");
  const home = path.join(tmp, "home"), profile = path.join(home, "profiles/desktop");
  fs.mkdirSync(profile, {recursive:true});
  const preserved = {
    [path.join(profile, "package.json")]: '{"name":"isolated-profile"}',
    [path.join(profile, "cordis.patch.yml")]: '- id: permission-presets\n  config:\n    defaultPreset: workspace-write\n    presets:\n      workspace-write:\n        sandbox: workspace-write\n        approval: on-request\n',
    [path.join(home, "prompt-inject.md")]: "Private fixture text; diagnostic reads only.\n",
  };
  for (const [file, text] of Object.entries(preserved)) fs.writeFileSync(file, text);
  const source = `
    import assert from 'node:assert/strict';
    import path from 'node:path';
    import {currentHost} from ${JSON.stringify(pathToFileURL(path.join(root, "lib/instance.js")).href)};
    import {resolveHost,hostLayoutLayer} from ${JSON.stringify(pathToFileURL(path.join(root, "lib/selfcheck.js")).href)};
    import {patchStatus,targetFiles,ALL_PATCHES} from ${JSON.stringify(pathToFileURL(path.join(root, "lib/core.js")).href)};
    const host=process.env.PURGE_TEST_HOST;
    const sealed=host.replace(path.sep+'app'+path.sep,path.sep+'app.asar'+path.sep);
    const options={env:{},argv:['electron',sealed+'/dsh-desktop-host/lib/index.js']};
    const running=currentHost(options);
    assert.equal(running,sealed);
    const patches=[{id:999,file:'agent-instructions',markers:['diagnostic fixture'],replacements:[]}];
    const disk=await patchStatus(host,patches,{surface:'desktop'});
    const old=await patchStatus(running,patches,{surface:'desktop'});
    assert.equal(disk[999],'applied');
    assert.equal(old[999],'missing_file');
    const selected=resolveHost('',options);
    console.log(JSON.stringify({electron:process.versions.electron,
      oldArchiveStatus:old[999],diskStatus:disk[999],sameTarget:selected===host,
      sealedWarning:hostLayoutLayer(selected).state}));
    if(!process.env.PURGE_REPRO_BASELINE) {
      assert.equal(selected,host);
      assert.equal(targetFiles(selected)['desktop-shell'],path.join(process.env.PURGE_TEST_HOST,'../../..','out/main/index.js'));
      assert.equal((await patchStatus(selected,ALL_PATCHES.filter(p=>p.id===83),{surface:'desktop'}))[83],'applied');
      assert.equal((await patchStatus(selected,patches,{surface:'desktop'}))[999],'applied');
      assert.equal(hostLayoutLayer(selected).state,'broken','remaining archive must stay visible');
      // Exercise both production HTTP handlers with real Cordis, not mocked status.
      process.env.DSH_BASE=sealed;
      process.env.DSH_PROFILE='desktop';
      process.env.DSH_SURFACE='desktop';
      const {Context,Service}=await import(${JSON.stringify(pathToFileURL(path.join(root, "node_modules/@deepseek-ai/cordis/lib/index.js")).href)});
      const {installWebServer}=await import(${JSON.stringify(pathToFileURL(path.join(root, "lib/index.js")).href)});
      class Web extends Service {
        constructor(ctx){super(ctx,'webServer');this.routes=new Map();}
        register(spec){this.routes.set(spec.path,spec);return ()=>this.routes.delete(spec.path);}
      }
      const ctx=new Context();
      try {
        await ctx.plugin(Web);
        installWebServer(ctx,{});
        await new Promise(resolve=>setImmediate(resolve));
        const read=async name=>{
          const response={writeHead(code){this.code=code;},end(body){this.body=body;}};
          await ctx.webServer.routes.get('/dsh-purge/'+name).handler({method:'GET',headers:{host:'127.0.0.1:3080'}},response);
          assert.equal(response.code,200,response.body);
          return JSON.parse(response.body);
        };
        const status=await read('status'), check=await read('selfcheck'), diagnose=await read('diagnose');
        assert.equal(status.ai_base,host);
        assert.equal(check.host,host);
        assert.equal(diagnose.ai_base,host);
        assert.equal(status.asar_still_sealed,true,'headline uses the same archive evidence');
        for(const layer of check.layers.filter(l=>l.kind==='host')) {
          for(const row of layer.broken) assert.equal(row.status,status.patch_status[row.id]);
        }
        assert(check.layers.some(l=>l.kind==='host'&&l.state==='broken'),'incomplete real fixture stays broken');
        assert.equal(check.layers.find(l=>l.kind==='layout').state,'broken');
        assert.equal(check.layers.find(l=>l.kind==='config').state,'broken','intentional permission mismatch must stay visible');
        console.log(JSON.stringify({http:'status/selfcheck/diagnose same physical target',missingFilesVisible:true}));
      } finally {await ctx.fiber.dispose();}
    }
  `;
  console.log(execFileSync(binary, ["--input-type=module", "-e", source], {
    encoding: "utf8", timeout: 30000,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", DSH_HOME: path.join(tmp, "home"), PURGE_TEST_HOST: host },
  }).trim());
  for (const [file, text] of Object.entries(preserved)) {
    if (fs.readFileSync(file, "utf8") !== text) throw Error("Diagnostics changed fixture settings");
  }
} finally {
  removeTreeNoFollowSync(tmp);
}
