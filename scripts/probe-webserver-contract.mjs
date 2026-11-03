/** Harmless HTTP/service contract probe; never loads the main plugin or user profile. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const root = process.env.PURGE_TEST_HTTP_SERVER_ROOT;
if (!root || !path.isAbsolute(root)) throw Error('Select an isolated dependency directory using PURGE_TEST_HTTP_SERVER_ROOT.');
const require = createRequire(path.join(root, 'probe.cjs'));
const load = name => import(pathToFileURL(require.resolve(name)).href);
const meta = JSON.parse(fs.readFileSync(require.resolve('@deepseek-ai/dsh-host-webserver/package.json'), 'utf8'));
const {Context} = await load('@deepseek-ai/cordis');
const {default:Server} = await load('@deepseek-ai/dsh-host-webserver');
const ctx = new Context();
let activated = false, result, url;
ctx.inject(['webServer'], () => {activated = true;});
try {
  await ctx.plugin(Server, {host:'127.0.0.1', port:0});
  let server;
  for (let i=0; i<100; i++) {
    server = ctx.get('webServer') || ctx.get('httpServer');
    if (server?.port) break;
    await new Promise(resolve => setTimeout(resolve,10));
  }
  assert.ok(server?.port, 'isolated server did not listen');
  url = `http://127.0.0.1:${server.port}/compat-test`;
  const remove = server.register({kind:'exact', path:'/compat-test', handler(req,res) {
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end('{"ok":true}');
  }});
  assert.deepEqual(await (await fetch(url, {signal:AbortSignal.timeout(2000)})).json(), {ok:true});
  remove();
  assert.equal((await fetch(url, {signal:AbortSignal.timeout(2000)})).status, 404);
  result = {package:meta.name, version:meta.version, webServer:!!ctx.get('webServer'), httpServer:!!ctx.get('httpServer'), consumerActivated:activated, routeRemoved:true};
} finally {
  await ctx.fiber.dispose();
}
await assert.rejects(fetch(url, {signal:AbortSignal.timeout(2000)}));
console.log(JSON.stringify({...result, listenerClosed:true}));
// A working HTTP socket is not enough: the consumer's declared service must resolve.
if (!result.webServer || !result.consumerActivated) process.exitCode = 2;
