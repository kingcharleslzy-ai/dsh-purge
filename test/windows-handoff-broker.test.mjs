import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { windowsHandoffBrokerScript } from '../lib/windows-asar-handoff.js';

// 帮手的就绪信号只认状态文件：broker 的职责是"把它拉起来并证明它起来了"，
// 不是"创建进程成功即算成功"。PowerShell 经本地 WMI 提供者创建时可能立刻退出，
// 这条路径必须被验证并回退，否则宿主十秒后只能报一句笼统的"帮手已停止"。

const fixture = (root) => ({
  script: path.join(root, 'helper.ps1'),
  exe: path.join(root, 'holder.exe'),
  asar: path.join(root, 'app.asar'),
  statePath: path.join(root, 'app.asar.purge-handoff.json'),
  token: '11111111-2222-3333-4444-555555555555',
  launchLog: path.join(root, 'app.asar.purge-handoff.json.launch.log'),
  brokerLog: path.join(root, 'app.asar.purge-handoff.json.broker.log'),
});

const READY_HELPER = String.raw`param(
  [string]$ExePath,
  [string]$AsarPath,
  [string]$StatePath,
  [string]$Token,
  [int]$TimeoutSeconds = 1800,
  [int]$PollMilliseconds = 500
)
$state = @{ token = $Token; pid = $PID; phase = 'waiting_for_quit'; updated_at = [DateTime]::UtcNow.ToString('o') }
[IO.File]::WriteAllText($StatePath, ($state | ConvertTo-Json -Compress), [Text.UTF8Encoding]::new($false))
`;

const SILENT_HELPER = String.raw`param(
  [string]$ExePath,
  [string]$AsarPath,
  [string]$StatePath,
  [string]$Token,
  [int]$TimeoutSeconds = 1800,
  [int]$PollMilliseconds = 500
)
# Never reports a phase: models a helper that was created but died at startup.
exit 0
`;

function prepare(root, helperText) {
  const f = fixture(root);
  fs.writeFileSync(f.script, helperText, 'utf8');
  fs.writeFileSync(f.asar, 'original archive', 'utf8');
  fs.writeFileSync(f.statePath, JSON.stringify({ token: f.token, phase: 'starting', updated_at: new Date().toISOString() }), 'utf8');
  return f;
}

function runBroker(f, timeouts = {}) {
  const ps = windowsHandoffBrokerScript({ ...f, ...timeouts });
  const encoded = Buffer.from(ps, 'utf16le').toString('base64');
  const result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded], {
    encoding: 'utf8',
    timeout: 60000,
  });
  const log = fs.existsSync(f.brokerLog) ? fs.readFileSync(f.brokerLog, 'utf8') : '';
  const state = JSON.parse(fs.readFileSync(f.statePath, 'utf8'));
  return { result, log, state };
}

test('broker script verifies helper readiness and falls back before failing', () => {
  const ps = windowsHandoffBrokerScript(fixture('C:\\tmp\\purge-broker-fixture'));
  assert.match(ps, /function Wait-Helper/, 'helper readiness must be polled, not assumed');
  assert.match(ps, /never reported ready/);
  assert.match(ps, /ShellExecute/, 'a blocked launch path must fall back to a shell launch');
  assert.match(ps, /function Fail-State/, 'a dead helper must leave a precise failure behind');
  assert.match(ps, /never started/);
  assert.doesNotMatch(ps, /schtasks/i, 'no scheduled task is created');
  assert.doesNotMatch(ps, /RunAs/i, 'no elevation is requested');
  assert.doesNotMatch(ps, /\$\{/, 'no unsubstituted template placeholder may reach the helper');
  assert.match(ps, /'C:\\tmp\\purge-broker-fixture\\app\.asar\.purge-handoff\.json'/, 'state path must be quoted for the shell');
});

test('broker exits 0 once the helper reports ready', { skip: process.platform !== 'win32' }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-broker-ready-'));
  try {
    const f = prepare(root, READY_HELPER);
    const { result, log, state } = runBroker(f, { readyTimeoutMs: 2500, fallbackTimeoutMs: 8000 });
    assert.equal(result.status, 0, result.stderr || log);
    assert.equal(state.phase, 'waiting_for_quit', 'the helper owns the state file once it is ready');
    assert.match(log, /helper reached waiting_for_quit/);
    assert.equal(fs.readFileSync(f.asar, 'utf8'), 'original archive');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('broker records why no helper started instead of leaving "starting" behind', { skip: process.platform !== 'win32' }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-broker-dead-'));
  try {
    const f = prepare(root, SILENT_HELPER);
    const { result, log, state } = runBroker(f, { readyTimeoutMs: 600, fallbackTimeoutMs: 600 });
    assert.equal(result.status, 1, 'a helper that never reported ready is a failure');
    assert.equal(state.phase, 'failed');
    assert.match(state.detail, /Handoff helper never started/);
    assert.match(log, /falling back to a shell launch/);
    assert.match(log, /never reported ready/);
    assert.equal(fs.readFileSync(f.asar, 'utf8'), 'original archive', 'the archive stays untouched');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('broker leaves a newer attempt alone', { skip: process.platform !== 'win32' }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-broker-superseded-'));
  try {
    const f = prepare(root, SILENT_HELPER);
    fs.writeFileSync(f.statePath, JSON.stringify({ token: 'newer-attempt', phase: 'starting', updated_at: new Date().toISOString() }), 'utf8');
    const { state } = runBroker(f, { readyTimeoutMs: 400, fallbackTimeoutMs: 400 });
    assert.equal(state.token, 'newer-attempt', 'a superseded broker must not fail the live attempt');
    assert.equal(state.phase, 'starting');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
