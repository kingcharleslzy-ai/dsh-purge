/** Run only read-only diagnostic tests in an explicitly selected isolated runtime. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {removeTreeNoFollowSync} from '../lib/remove-tree.js';

if (process.versions.electron) throw Error('Use ordinary Node as the parent so archive cleanup occurs outside Electron.');
const binary = process.env.PURGE_ELECTRON_EXEC;
if (!binary || !path.isAbsolute(binary) || !fs.statSync(binary).isFile()) {
  throw Error('PURGE_ELECTRON_EXEC must explicitly select an isolated Electron executable; no application fallback.');
}
const repo = fileURLToPath(new URL('..', import.meta.url));
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'diagnostic-runtime-owner-'));
let result;
try {
  const home = path.join(root, 'home');
  fs.mkdirSync(home);
  result = spawnSync(binary, ['--test', 'test/http-handlers-target.test.mjs', 'test/instance-partial-evidence.test.mjs', 'test/host-layout-unknown.test.mjs'], {
    cwd:repo, encoding:'utf8', timeout:60000,
    env:{...process.env, ELECTRON_RUN_AS_NODE:'1', PURGE_TEST_HTTP_PARENT_DIR:root,
      DSH_HOME:home, HOME:home, USERPROFILE:home, DSH_BASE:'', PURGE_DSH_CLI:'', DSH_PROFILE:'desktop'},
  });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(`Diagnostic child failed: exit=${result.status}, signal=${result.signal}`);
} finally {
  // No detached deletion or success-by-timeout: parent cleanup is part of the result.
  removeTreeNoFollowSync(root, {maxRetries:2});
  if (fs.existsSync(root)) throw Error('Diagnostic fixture cleanup did not complete.');
}
console.log(JSON.stringify({diagnosticChildExit:result.status, fixturesRemoved:true, formalApplicationStarted:false}));
