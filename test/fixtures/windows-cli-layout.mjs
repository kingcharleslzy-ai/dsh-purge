import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const tail = 'dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js';
function entry(layout) {
  return Buffer.from(`console.log(JSON.stringify([${JSON.stringify(layout)}, ...process.argv.slice(2)])); process.exitCode = 17;`);
}

// Single-file ASAR with a Chromium pickle header, read by Electron itself.
function archive(body) {
  const header = { files: {} };
  const parts = tail.split('/');
  let node = header;
  for (const part of parts.slice(0, -1)) node = node.files[part] = { files: {} };
  node.files[parts.at(-1)] = { size: body.length, offset: '0' };
  const json = Buffer.from(JSON.stringify(header));
  const padded = Math.ceil(json.length / 4) * 4;
  const pre = Buffer.alloc(16 + padded);
  [4, padded + 8, padded + 4, json.length].forEach((n, i) => pre.writeUInt32LE(n, i * 4));
  json.copy(pre, 16);
  return Buffer.concat([pre, body]);
}

export function checkWindowsLayouts(shim, electron) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'DSH CLI 空格 '));
  try {
    fs.writeFileSync(path.join(root, 'dsh.cmd'), shim);
    const app = path.join(root, 'app', tail);
    const unpacked = path.join(root, 'app.asar.unpacked', tail);
    const asar = path.join(root, 'app.asar');
    function run(layout) {
      const result = spawnSync(process.env.ComSpec, ['/d', '/c', 'dsh.cmd --version "two words"'], {
        cwd: root, windowsVerbatimArguments: true, encoding: 'utf8', timeout: 20000, env: { ...process.env, TEST_ELECTRON: electron },
      });
      if (result.error) throw result.error;
      if (layout === 'missing') {
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /MODULE_NOT_FOUND|Cannot find module/);
      } else {
        assert.equal(result.status, 17, result.stderr);
        assert.deepEqual(JSON.parse(result.stdout.trim()), [layout, '--version', 'two words']);
      }
    }
    fs.writeFileSync(asar, archive(entry('sealed')));
    run('sealed');
    for (const [file, name] of [[app, 'app'], [unpacked, 'unpacked']]) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, entry(name));
    }
    run('sealed');
    fs.writeFileSync(asar, Buffer.from('invalid archive'));
    run('missing');
    fs.unlinkSync(asar);
    run('unpacked');
    fs.unlinkSync(unpacked);
    run('app');
    fs.unlinkSync(app);
    run('missing');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
