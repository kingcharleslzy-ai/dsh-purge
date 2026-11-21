// 会话级 / 一次性覆盖：查找顺序、路径安全、默认行为不变。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  safeSessionKey,
  sessionOverridePath,
  readSessionOverride,
  writeSessionOverride,
  removeSessionOverride,
  listSessionOverrides,
  setOneShotOverride,
  readOneShotOverride,
  clearOneShotOverride,
  lookupOverride,
  __resetOneShot,
} from '../lib/inject-scope.js';

function home() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-scope-'));
  return { root, close: () => fs.rmSync(root, { recursive: true, force: true }) };
}

test('safeSessionKey：拒绝路径穿越与空值', () => {
  assert.equal(safeSessionKey(''), '');
  assert.equal(safeSessionKey('   '), '');
  assert.equal(safeSessionKey('.'), '');
  assert.equal(safeSessionKey('..'), '');
  assert.equal(safeSessionKey('../../etc/passwd'), '.._.._etc_passwd', '斜杠被折叠，无分隔符');
  assert.equal(safeSessionKey('sess-123'), 'sess-123');
  assert.equal(safeSessionKey('a/b\\c'), 'a_b_c');
  assert.equal(safeSessionKey('x'.repeat(300)).length, 128, '长度截断');
});

test('sessionOverridePath：非法 id 返回空串，路径不越界', () => {
  const h = home();
  try {
    assert.equal(sessionOverridePath(h.root, ''), '');
    assert.equal(sessionOverridePath(h.root, '..'), '');
    const p = sessionOverridePath(h.root, 'sess-1');
    assert.ok(p.endsWith(path.join('dsh-purge-sessions', 'sess-1.inject.md')));
    const win = sessionOverridePath(h.root, '../../evil');
    // 斜杠被折成下划线；剩余的 ".." 只是文件名里的普通字符，不构成目录引用。
    assert.equal(path.basename(win), '.._.._evil.inject.md');
    assert.equal(
      path.dirname(win),
      path.join(h.root, 'dsh-purge-sessions'),
      '结果仍落在 home 下的固定目录，不越界',
    );
  } finally {
    h.close();
  }
});

test('会话级覆盖：写入后可读回，空内容等价删除', () => {
  const h = home();
  try {
    assert.equal(readSessionOverride(h.root, 's1'), '', '默认无覆盖');

    const w = writeSessionOverride(h.root, 's1', '  hello override  \n');
    assert.equal(w.ok, true);
    assert.equal(readSessionOverride(h.root, 's1'), '  hello override  \n');

    const w2 = writeSessionOverride(h.root, 's1', '');
    assert.equal(w2.ok, true);
    assert.equal(w2.removed, true);
    assert.equal(readSessionOverride(h.root, 's1'), '');
  } finally {
    h.close();
  }
});

test('会话级覆盖：只对目标会话生效，其它会话无影响', () => {
  const h = home();
  try {
    writeSessionOverride(h.root, 's1', 'only for s1');
    assert.equal(readSessionOverride(h.root, 's1'), 'only for s1');
    assert.equal(readSessionOverride(h.root, 's2'), '');
  } finally {
    h.close();
  }
});

test('会话级覆盖：超长内容被拒绝而不是截断写入', () => {
  const h = home();
  try {
    const huge = 'x'.repeat(300 * 1024);
    const w = writeSessionOverride(h.root, 's1', huge);
    assert.equal(w.ok, false);
    assert.match(String(w.error), /too large/);
    assert.equal(readSessionOverride(h.root, 's1'), '', '拒绝后不得留下残片');
  } finally {
    h.close();
  }
});

test('listSessionOverrides：只列已存在的会话', () => {
  const h = home();
  try {
    assert.deepEqual(listSessionOverrides(h.root), []);
    writeSessionOverride(h.root, 'a', 'A');
    writeSessionOverride(h.root, 'b', 'B');
    assert.deepEqual(listSessionOverrides(h.root).sort(), ['a', 'b']);
    removeSessionOverride(h.root, 'a');
    assert.deepEqual(listSessionOverrides(h.root), ['b']);
  } finally {
    h.close();
  }
});

test('一次性覆盖：纯内存、可读可清，非法 id 被拒绝', () => {
  __resetOneShot();
  assert.equal(readOneShotOverride('s1'), '', '默认无');
  assert.equal(setOneShotOverride('s1', 'temp text').ok, true);
  assert.equal(readOneShotOverride('s1'), 'temp text');
  assert.equal(clearOneShotOverride('s1'), true);
  assert.equal(readOneShotOverride('s1'), '');

  assert.equal(setOneShotOverride('..', 'x').ok, false);
  assert.equal(setOneShotOverride('s1', '   ').ok, true, '空白等价删除，不算失败');
  assert.equal(readOneShotOverride('s1'), '');
  __resetOneShot();
});

test('查找顺序：一次性 > 会话级 > 全局（全局不在此模块内）', () => {
  const h = home();
  try {
    __resetOneShot();
    // 三级都没有 → 空，调用方回落全局（关键：默认行为不变）
    assert.deepEqual(lookupOverride(h.root, 's1'), { text: '', source: '' });

    // 只有会话级
    writeSessionOverride(h.root, 's1', 'SESSION');
    assert.deepEqual(lookupOverride(h.root, 's1'), { text: 'SESSION', source: 'session' });

    // 一次性压过会话级
    setOneShotOverride('s1', 'ONE-SHOT');
    assert.deepEqual(lookupOverride(h.root, 's1'), { text: 'ONE-SHOT', source: 'one-shot' });

    // 清掉一次性 → 回落会话级
    clearOneShotOverride('s1');
    assert.deepEqual(lookupOverride(h.root, 's1'), { text: 'SESSION', source: 'session' });

    // 换会话 → 什么都不命中
    assert.deepEqual(lookupOverride(h.root, 'other'), { text: '', source: '' });
  } finally {
    __resetOneShot();
    h.close();
  }
});

test('一次性覆盖独立于会话级：不同会话互不影响', () => {
  const h = home();
  try {
    __resetOneShot();
    setOneShotOverride('a', 'for A');
    writeSessionOverride(h.root, 'b', 'for B');
    assert.equal(lookupOverride(h.root, 'a').text, 'for A');
    assert.equal(lookupOverride(h.root, 'b').text, 'for B');
    assert.equal(lookupOverride(h.root, 'c').text, '');
  } finally {
    __resetOneShot();
    h.close();
  }
});

test('无 home 时不抛，静默返回空（回落全局）', () => {
  __resetOneShot();
  assert.equal(readSessionOverride('', 's1'), '');
  assert.deepEqual(lookupOverride('', 's1'), { text: '', source: '' });
  const w = writeSessionOverride('', 's1', 'x');
  assert.equal(w.ok, false);
});
