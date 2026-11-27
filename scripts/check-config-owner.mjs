// Exercise only config persistence. Both plugin names below are inert test modules.
import assert from "node:assert/strict";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import yaml from "yaml";

const prefix = path.resolve(process.argv[2]);
const root = await mkdtemp(path.join(os.tmpdir(), "config-owner-"));
const home = path.join(root, "home");
const profile = path.join(home, "profiles", "web");
const result = path.join(root, "result.json");
const configModule = new URL("../lib/inject-config.js", import.meta.url).href;
let child, exited;
try {
  const rows = [];
  for (const [id, name] of [["first", "dsh-purge"], ["second", "dsh-purge-community"]]) {
    const dir = path.join(profile, "node_modules", name);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "package.json"), JSON.stringify({name, type:"module", main:"index.js"}));
    const code = name === "dsh-purge" ? "export function apply() {}" : `
      import {writeFileSync} from 'node:fs';
      import {writeInjectConfig} from ${JSON.stringify(configModule)};
      export function apply(ctx) {
        if (globalThis.ownerProbeStarted) return;
        globalThis.ownerProbeStarted = true;
        setTimeout(async () => {
          try {
            const response = await writeInjectConfig(ctx, {excludeSessions:['sample-session']});
            writeFileSync(${JSON.stringify(result)}, JSON.stringify(response));
          } catch (e) {writeFileSync(${JSON.stringify(result)},JSON.stringify({error:e.message}));}
        }, 800);
      }`;
    await writeFile(path.join(dir, "index.js"), code);
    rows.push({id, name, config:{note:id}});
  }
  const fixture = path.join(profile, "cordis.patch.yml");
  await writeFile(fixture, yaml.stringify([{insert:rows}]));
  const cli = path.join(prefix,"node_modules","@deepseek-ai","dsh","lib","bin.js");
  child = spawn(process.execPath,[cli,"--profile","web","--no-open","--host","127.0.0.1","--port","0"],{cwd:root,env:{...process.env,DSH_HOME:home,HOME:root,USERPROFILE:root,APPDATA:root,LOCALAPPDATA:root},stdio:"ignore"});
  exited = once(child,"exit");
  let response;
  for (let i=0;i<450 && child.exitCode===null;i++) {
    try {response = JSON.parse(await readFile(result,"utf8"));break;} catch (e) {if (e.code!=="ENOENT") throw e;}
    await delay(100);
  }
  assert.equal(response?.ok,true,response?.error || "isolated host did not save");
  const patched = yaml.parse(await readFile(path.join(profile,"cordis.patch.yml"),"utf8"));
  assert.equal(patched.some(row=>row.id==="first"),false);
  assert.deepEqual(patched.find(row=>row.id==="second").config,{note:"second",excludeSessions:["sample-session"]});
  assert.deepEqual(patched.filter(row=>row.insert), [{insert:rows}]);
  console.log("PASS: official DSH wrote only the owning profile entry",process.platform);
} finally {
  if (child && child.exitCode===null && child.signalCode===null) child.kill();
  if (exited) await exited;
  await rm(root,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
