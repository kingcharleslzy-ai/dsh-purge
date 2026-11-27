// Optional integration against the selected Desktop's real Cordis and CommandRuntime.
// Run with ELECTRON_RUN_AS_NODE=1 and PURGE_TEST_HOST=<.../node_modules/@deepseek-ai>.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const base = process.env.PURGE_TEST_HOST;
if (!base || !process.versions.electron) throw Error("Select a Desktop host and run this with its actual Electron binary");
const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-desktop-registration-"));
process.env.DSH_HOME = home;
process.env.DSH_SURFACE = "desktop";
process.env.DSH_BASE = path.join(home,"no-host");
const load = file => import(pathToFileURL(file).href);
const {Context,Service} = await load(path.join(base,"cordis/lib/index.js"));
const {CommandRuntime} = await load(path.join(base,"dsh-commands/lib/index.js"));
const purge = await load(process.env.PURGE_TEST_PLUGIN || path.resolve("lib/index.js"));
class Tools extends Service {
  constructor(ctx) {super(ctx,"tools");this.defs=[];}
  register(def) {this.defs.push(def);return () => {};}
}
class Prompt extends Service {
  constructor(ctx) {super(ctx,"systemPrompt");this.sections=[];}
  section(def) {this.sections.push(def);return () => {};}
}
class Web extends Service {
  constructor(ctx) {super(ctx,"webServer");this.routes=new Map();}
  register(spec) {assert(!this.routes.has(spec.path));this.routes.set(spec.path,spec);return () => this.routes.delete(spec.path);}
}
const ctx = new Context();
try {
  await ctx.plugin(CommandRuntime);await ctx.plugin(Tools);await ctx.plugin(Prompt);await ctx.plugin(Web);
  const original = () => ({kind:"success",text:"original owner"});
  ctx.commands.register({name:"rewind",description:"acceptance fixture",handler:original});
  const fiber = ctx.plugin(purge,{autoApplyOnStart:false,autoUpdateOnStart:false});
  await fiber;
  await new Promise(resolve => setImmediate(resolve));
  const names=ctx.commands.list(undefined).map(d=>d.name);
  assert(names.includes("rewind") && !names.includes("purge-rewind"));
  assert.deepEqual(ctx.tools.defs.map(d=>d.name),["purge_status","purge_apply","purge_revert"]);
  assert(ctx.systemPrompt.sections.some(d=>d.name==="dsh-purge"));
  for(const route of ["status","community","audit","boost","own-servers","selfcheck"])assert(ctx.webServer.routes.has(`/dsh-purge/${route}`));
  await fiber.dispose();
  assert.equal(ctx.webServer.routes.size,0);
  assert.deepEqual(ctx.commands.list(undefined).map(d=>d.name),["rewind"]);
  console.log(JSON.stringify({electron:process.versions.electron,commands:names,tools:3,promptRegistered:true,routes:6,cleanDispose:true}));
} finally {await ctx.fiber.dispose();fs.rmSync(home,{recursive:true,force:true});}
