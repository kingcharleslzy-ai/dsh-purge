import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readWindowsAsarHandoff } from '../lib/windows-asar-handoff.js';

// A 'starting' state older than 30s is reported as helper_stopped. The new
// helper_ran flag says whether the helper actually executed: its own .log is
// written by the Save-State('ready') that opens the script body, so an absent
// .log means the launcher never started a script-bearing PowerShell.

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-handoff-diag-'));
  const asar = path.join(dir, 'app.asar');
  const statePath = `${asar}.purge-handoff.json`;
  const writeState = (extra = {}) => fs.writeFileSync(statePath, JSON.stringify({
    token: 'test-token',
    phase: 'starting',
    updated_at: new Date(Date.now() - 60000).toISOString(),
    ...extra,
  }));
  return { dir, asar, statePath, writeState };
}

test('stale starting state without a helper log reports that no helper ran', () => {
  const f = fixture();
  try {
    f.writeState();
    const state = readWindowsAsarHandoff(f.asar);
    assert.equal(state.phase, 'helper_stopped');
    assert.equal(state.helper_ran, false);
    assert.match(state.detail, /never ran/);
  } finally {
    fs.rmSync(f.dir, { recursive: true, force: true });
  }
});

test('stale starting state with a helper log reports that the helper ran', () => {
  const f = fixture();
  try {
    f.writeState();
    fs.writeFileSync(`${f.statePath}.log`, 'ready \n', 'utf8');
    const state = readWindowsAsarHandoff(f.asar);
    assert.equal(state.phase, 'helper_stopped');
    assert.equal(state.helper_ran, true);
    assert.match(state.detail, /wrote its own log/);
  } finally {
    fs.rmSync(f.dir, { recursive: true, force: true });
  }
});

test('a fresh starting state is returned unchanged and carries no helper_ran verdict', () => {
  const f = fixture();
  try {
    f.writeState({ updated_at: new Date().toISOString() });
    const state = readWindowsAsarHandoff(f.asar);
    assert.equal(state.phase, 'starting');
    assert.equal(state.helper_ran, undefined);
  } finally {
    fs.rmSync(f.dir, { recursive: true, force: true });
  }
});

test('a completed handoff stays complete and is not reclassified', () => {
  const f = fixture();
  try {
    f.writeState({ phase: 'complete', detail: 'Archive preserved.' });
    const state = readWindowsAsarHandoff(f.asar);
    assert.equal(state.phase, 'complete');
    assert.equal(state.helper_ran, undefined);
  } finally {
    fs.rmSync(f.dir, { recursive: true, force: true });
  }
});

test('no state file yields null', () => {
  const f = fixture();
  try {
    assert.equal(readWindowsAsarHandoff(f.asar), null);
  } finally {
    fs.rmSync(f.dir, { recursive: true, force: true });
  }
});
