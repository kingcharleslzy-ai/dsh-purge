// 注入层配置的读写逻辑：只动白名单字段，非法输入不破坏现有配置。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeInjectConfig, describeInjectConfig, findPluginEntry, writeInjectConfig } from '../lib/inject-config.js';

test('mergeInjectConfig：只写白名单字段，其它配置原样保留', () => {
  const current = {
    enabled: true,
    postPrompt: 'custom',
    autoRetry: false,
    excludePresets: ['a'],
  };
  const next = mergeInjectConfig(current, { excludeSessions: ['s1'], layers: { boost: false } });
  assert.equal(next.enabled, true, '未提交的字段不变');
  assert.equal(next.postPrompt, 'custom');
  assert.equal(next.autoRetry, false);
  assert.deepEqual(next.excludePresets, ['a'], '未提交则保留原值');
  assert.deepEqual(next.excludeSessions, ['s1']);
  assert.deepEqual(next.layers, { boost: false });
});

test('mergeInjectConfig：忽略白名单外的恶意字段', () => {
  const current = { enabled: true };
  const next = mergeInjectConfig(current, { enabled: false, postPrompt: 'hacked', evil: 1 });
  assert.equal(next.enabled, true, 'enabled 不在白名单内，不得被 UI 改');
  assert.equal(next.postPrompt, undefined, 'postPrompt 不在白名单内');
  assert.equal(next.evil, undefined);
});

test('mergeInjectConfig：列表去空白、去重、预设转小写', () => {
  const next = mergeInjectConfig({}, {
    excludePresets: [' Minimal ', 'minimal', '', 'PT C', 123],
    excludeSessions: [' s1 ', 's1', ''],
  });
  assert.deepEqual(next.excludePresets, ['minimal', 'pt c']);
  assert.deepEqual(next.excludeSessions, ['s1']);
});

test('mergeInjectConfig：非法类型不覆盖已有值', () => {
  const current = { excludePresets: ['keep'], excludeSessions: ['keep-s'] };
  const next = mergeInjectConfig(current, {
    excludePresets: 'not-array',
    excludeSessions: { oops: true },
    layers: 'not-object',
  });
  assert.deepEqual(next.excludePresets, ['keep']);
  assert.deepEqual(next.excludeSessions, ['keep-s']);
  assert.equal(next.layers, undefined);
});

test('mergeInjectConfig：layers 合并而非整体替换，未写字段保持原值', () => {
  const current = { layers: { main: false, boost: true } };
  const next = mergeInjectConfig(current, { layers: { boost: false } });
  assert.deepEqual(next.layers, { main: false, boost: false }, 'main 未被提交，保持 false');
});

test('mergeInjectConfig：layers 的非法键被丢弃', () => {
  const next = mergeInjectConfig({}, { layers: { main: false, bogus: false, __proto__: false } });
  assert.deepEqual(next.layers, { main: false });
});

test('mergeInjectConfig：cur 为空或非法时返回干净对象', () => {
  assert.deepEqual(mergeInjectConfig(null, { excludeSessions: ['a'] }), { excludeSessions: ['a'] });
  assert.deepEqual(mergeInjectConfig('bad', {}), {});
  assert.deepEqual(mergeInjectConfig({}, null), {});
});

test('describeInjectConfig：未分层时 layers 为 null，三层都跟随 enabled', () => {
  const d = describeInjectConfig({ enabled: true, excludePresets: ['X'] });
  assert.equal(d.enabled, true);
  assert.equal(d.layers, null);
  assert.deepEqual(d.excludePresets, ['x']);
  assert.deepEqual(d.layersActive, { main: true, boost: true, protocol: true });
});

test('describeInjectConfig：分层后的逐层状态', () => {
  const d = describeInjectConfig({ enabled: true, layers: { boost: false } });
  assert.deepEqual(d.layers, { main: true, boost: false, protocol: true });
  assert.deepEqual(d.layersActive, { main: true, boost: false, protocol: true });
});

test('describeInjectConfig：空配置的默认呈现', () => {
  const d = describeInjectConfig(undefined);
  assert.equal(d.enabled, true, 'enabled 默认 true，与旧行为一致');
  assert.deepEqual(d.excludePresets, []);
  assert.deepEqual(d.excludeSessions, []);
  assert.equal(d.layers, null);
  assert.equal(d.preset, '');
});

test('findPluginEntry：没有 loader 时安全返回 undefined', () => {
  assert.equal(findPluginEntry(undefined), undefined);
  assert.equal(findPluginEntry({}), undefined);
  assert.equal(findPluginEntry({ get: () => undefined }), undefined);
  assert.equal(findPluginEntry({ get: () => ({ entries: () => [] }) }), undefined);
});

test('findPluginEntry：按包名命中，跳过 disabled', () => {
  const live = { options: { name: 'dsh-purge-community' }, disabled: false };
  const dead = { options: { name: 'dsh-purge-community' }, disabled: true };
  const other = { options: { name: 'some-other-plugin' }, disabled: false };

  const ctxDeadFirst = { get: () => ({ entries: () => [dead, other, live] }) };
  assert.equal(findPluginEntry(ctxDeadFirst), live, '跳过 disabled 的那条');

  const ctxNone = { get: () => ({ entries: () => [dead, other] }) };
  assert.equal(findPluginEntry(ctxNone), undefined);
});

test('writes only the owner entry; ambiguous, stale and unaddressable entries never write', async () => {
  const old = { options: { name: 'dsh-purge' } };
  const own = { options: { name: 'dsh-purge-community' } };
  for (const entries of [[old, own], [own, old]]) {
    const edits = [];
    const editor = {
      entries: () => entries,
      async edit(entry, change) {
        edits.push([entry, change({}, { unrelated: 'inherited-only' })]);
      },
    };
    const ctx = { fiber: { entry: own }, get: k => k === 'loader' ? { entries: () => entries } : editor };
    const patch = { excludeSessions: ['example'] };
    assert.equal((await writeInjectConfig(ctx, patch)).ok, true);
    assert.deepEqual(edits, [[own, patch]]);
    ctx.fiber.entry = old;
    assert.equal((await writeInjectConfig(ctx, patch)).ok, true);
    assert.equal(edits[1][0], old);
    for (const owner of [null, { options: own.options }]) {
      ctx.fiber.entry = owner;
      assert.equal((await writeInjectConfig(ctx, patch)).ok, false);
    }
    ctx.fiber.entry = own;
    editor.entries = () => [];
    assert.equal((await writeInjectConfig(ctx, patch)).ok, false);
    assert.equal(edits.length, 2);
  }
});
