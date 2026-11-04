// Explicit isolated Electron only. spawnSync waits for GUI executables on Windows.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const binary=process.env.PURGE_ELECTRON_EXEC;
assert(binary && fs.existsSync(binary), 'Set PURGE_ELECTRON_EXEC to an isolated Electron runtime');
assert(!fs.realpathSync(binary).startsWith('/Applications/'), 'Do not use the formal application');
assert(process.env.PURGE_TEST_HOST, 'Set PURGE_TEST_HOST to the isolated official prompt packages');
const env={...process.env,ELECTRON_RUN_AS_NODE:'1'};
for (const args of [
  ['--test','--test-reporter=tap','test/native-input-integrity.test.mjs','test/agent-loop-022-contract.test.mjs'],
  ['scripts/check-native-prompt-integrity.mjs'],
]) {
  const result=spawnSync(binary,args,{env,encoding:'utf8',timeout:60000,windowsHide:true});
  process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
  assert.ifError(result.error);assert.equal(result.status,0,'Electron child must actually exit successfully');
  if(args[0]==='--test') {
    assert.match(result.stdout,/# pass 13\b/);assert.match(result.stdout,/# fail 0\b/);
  } else {
    const report=JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1));
    assert(report.electron,'actual Electron required');assert.equal(report.checks.length,7);
    assert.equal(report.modelCalls,0);assert.equal(report.productionProfileLoaded,false);
  }
}
