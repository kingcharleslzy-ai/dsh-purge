import { Readable } from "node:stream";
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Context, Service } from "@deepseek-ai/cordis";
import { installCommands, installWebServer } from "../lib/index.js";

const tick = () => new Promise(resolve => setImmediate(resolve));
class Commands extends Service {
  constructor(ctx) {super(ctx,"commands");this.entries=new Map([["rewind",{name:"rewind",owner:"external"}]]);}
  register(def) {
    if(this.entries.has(def.name))throw Error(`command "${def.name}" is already registered`);
    return this.ctx.effect(() => {this.entries.set(def.name,def);return () => this.entries.delete(def.name);});
  }
}
class Web extends Service {
  constructor(ctx) {super(ctx,"webServer");this.routes=new Map();}
  register(spec) {
    assert(!this.routes.has(spec.path),`no duplicate ${spec.path}`);
    this.routes.set(spec.path,spec);
    return () => this.routes.delete(spec.path);
  }
}
test("real Cordis late service, replacement and parent reload retain commands and routes without global polling", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "purge-lifecycle-"));
  const previous = process.env.DSH_HOME;
  process.env.DSH_HOME = tmp;
  const root = new Context();
  const mount = () => root.plugin({name:"purge-lifecycle-test",apply(ctx) {installWebServer(ctx,{});installCommands(ctx,{});}});
  try {
    const owner = mount(); await owner;
    const commands = root.plugin(Commands);await commands;await tick();
    assert.equal(root.commands.entries.get("rewind").owner,"external");
    for(const name of ["purge","rules","skills","purge-rewind"])assert(root.commands.entries.has(name));
    let web = root.plugin(Web);await web;await tick();
    const routes = root.webServer.routes;
    assert(routes.has("/dsh-purge/status"));
    // The diagnostic route reads disk state only and must not wait forever for connection/loader.
    assert(!root.get("connection"));
    const response = {writeHead(code) {this.code=code;},end(body) {this.body=body;}};
    await routes.get("/dsh-purge/status").handler({method:"GET",headers:{}},response);
    assert.equal(response.code,200);
    assert.equal(JSON.parse(response.body).ready,true);
    // Both independently registered update handlers must use their own scoped
    // settings reader; malformed channel config must never become direct traffic.
    fs.mkdirSync(path.join(tmp,"dsh-purge"),{recursive:true});
    fs.writeFileSync(path.join(tmp,"dsh-purge/update-channel.json"),"FAKE_SECRET_broken_json");
    for(const method of ["GET","POST"]) {
      const req=Object.assign(Readable.from(["{}"]),{method,headers:{}});
      const res={writeHead(code){this.code=code;},end(body){this.body=body;}};
      await routes.get("/dsh-purge/update").handler(req,res);
      assert.equal(res.code,500);assert.match(JSON.parse(res.body).error,/无法读取更新密钥设置.*JSON/);assert(!res.body.includes("FAKE_SECRET"));
    }
    fs.unlinkSync(path.join(tmp,"dsh-purge/update-channel.json"));
    await web.dispose();await tick();assert.equal(routes.size,0);
    web = root.plugin(Web);await web;await tick();
    assert(root.webServer.routes.has("/dsh-purge/status"));
    const secondRoutes=root.webServer.routes;
    await owner.restart();await tick();
    assert(secondRoutes.has("/dsh-purge/status"));
    assert(root.commands.entries.has("purge-rewind"));
    await owner.dispose();await tick();
    assert.equal(secondRoutes.size,0);
    assert.deepEqual([...root.commands.entries.keys()],["rewind"]);
    await web.dispose();
    web = root.plugin(Web);await web;await tick();
    assert.equal(root.webServer.routes.size,0,"disposed parent must never resurrect routes");
  } finally {
    await root.fiber.dispose();
    if(previous === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = previous;
    fs.rmSync(tmp,{recursive:true,force:true});
  }
});
