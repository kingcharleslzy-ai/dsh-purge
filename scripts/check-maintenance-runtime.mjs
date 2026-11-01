// Explicit isolated runtime only. Never falls back to the user's DSH binary.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const binary=process.env.PURGE_ELECTRON_EXEC;
assert(binary && fs.existsSync(binary),'Set PURGE_ELECTRON_EXEC to an isolated Electron runtime');
assert(!fs.realpathSync(binary).startsWith('/Applications/'),'Do not execute the formal DSH application');
const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=['--test','test/maintenance-boundaries.test.mjs','test/maintenance-cli.test.mjs','test/maintenance-lifecycle.test.mjs','test/list-performance.test.mjs','test/host-backup.test.mjs','test/atomic-files.test.mjs'];
const proof=spawnSync(binary,['--input-type=module','-e','if (!process.versions.electron) process.exit(1); console.log(process.versions.electron)'],{env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},encoding:'utf8',timeout:30000,windowsHide:true});
assert.ifError(proof.error);assert.equal(proof.status,0,'Actual Electron required');
console.log('Isolated Electron '+proof.stdout.trim());
const r=spawnSync(binary,args,{cwd,env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},windowsHide:true,stdio:'inherit',timeout:180000});
if(r.error)throw r.error;
process.exitCode=r.status===null?1:r.status;
