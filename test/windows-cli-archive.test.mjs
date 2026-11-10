import test from 'node:test';
import assert from 'node:assert/strict';
import { patchOfficialCliCmdText } from '../lib/desktop.js';
import { checkWindowsLayouts } from './fixtures/windows-cli-layout.mjs';

const tail = String.raw`dsh\node_modules\@deepseek-ai\dsh-desktop-host\lib\cli.js`;
const nl = '\r\n';
const invocation = '"%TEST_ELECTRON%" ';
const head = '@echo off' + nl + 'set ELECTRON_RUN_AS_NODE=1' + nl;
const original = head + invocation + '"%~dp0app.asar\\' + tail + '" %*' + nl;
const shim = patchOfficialCliCmdText(original);

test('original and previously patched cmd shims converge to the same archive-aware block', () => {
  const old = [
    'REM dsh-purge cli entry begin',
    `set "entry=%~dp0app.asar\\${tail}"`,
    `if not exist "%entry%" set "entry=%~dp0app.asar.unpacked\\${tail}"`,
    `if not exist "%entry%" set "entry=%~dp0app\\${tail}"`,
    'REM dsh-purge cli entry end',
  ].join(nl);
  const upgraded = patchOfficialCliCmdText(head + old + nl + invocation + '"%entry%" %*' + nl);
  assert.ok(shim.changed && upgraded.changed);
  assert.equal(upgraded.text, shim.text);
  assert.ok(shim.text.includes('if not exist "%~dp0app.asar" ('));
  assert.equal(shim.text.includes('if not exist "%entry%"'), false);
  assert.equal(patchOfficialCliCmdText(shim.text).already, true);
});

test('cmd runs a real Electron archive entry, forwards arguments and propagates errors', {
  skip: process.platform !== 'win32' || !process.env.PURGE_ELECTRON_EXEC,
}, () => checkWindowsLayouts(shim.text, process.env.PURGE_ELECTRON_EXEC));
