// Generic installation acceptance only: never loads plugin apply() or starts DSH UI.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {runInstallLifecycle} from './install-lifecycle-scenarios.mjs';
assert.equal(process.argv.length,6,'fixture cli previous.tgz candidate.tgz required');
const [fixture,cli,previous,candidate]=process.argv.slice(2).map(v=>path.resolve(v));
assert(fs.existsSync(path.join(fixture,'.purge-install-test-fixture')),'Explicit isolated marker required');
const inside=file=>{const rel=path.relative(fs.realpathSync(fixture),fs.realpathSync(file));return rel&&!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel);};
assert(inside(process.execPath)&&inside(cli),'Both runtime and CLI must belong to the marked fixture');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'purge130-lifecycle-'));
if(process.platform==='darwin' && process.env.PURGE_TEST_SANDBOX_ACTIVE!=='1') {
 assert(!process.execPath.startsWith('/Applications/')&&!process.execPath.split(path.sep).some(s=>s.endsWith('.app')),'Use a CLI-only fixture');
 const sb=path.join(temp,'readonly-production.sb');
 const protectedPaths=['/Applications',path.join(os.homedir(),'.dsh'),path.join(os.homedir(),'Library/Application Support/@deepseek-ai'),path.join(os.homedir(),'Library/Logs/DeepSeek Harness')];
 fs.writeFileSync(sb,'(version 1)\n(allow default)\n(deny file-write* '+protectedPaths.map(p=>'(subpath '+JSON.stringify(p)+')').join(' ')+')\n(deny process-exec (subpath "/Applications/DeepSeek Harness.app"))\n');
 execFileSync('/usr/bin/sandbox-exec',['-f',sb,process.execPath,...process.argv.slice(1)],{env:{...process.env,ELECTRON_RUN_AS_NODE:'1',PURGE_TEST_SANDBOX_ACTIVE:'1'},stdio:'inherit',timeout:1800000});process.exit(0);
}
console.log('EVIDENCE '+temp);
const reports=await runInstallLifecycle({runtime:process.execPath,cli,legacy:previous,previous,archive:candidate,temp,scenarios:['bootstrap-first-install','community-upgrade','alias-upgrade']});
console.log(JSON.stringify({platform:process.platform,electron:process.versions.electron,reports,productionTouched:false}));
fs.writeFileSync(path.join(temp,'result.json'),JSON.stringify(reports,null,2));
