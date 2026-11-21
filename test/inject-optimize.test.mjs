// 提示词优化：输入校验、围栏剥离、llm 服务缺失时的确定性失败。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  OPTIMIZE_GOALS,
  validateOptimizeInput,
  stripFence,
  resolveLlm,
  optimizePrompt,
} from '../lib/inject-optimize.js';

test('validateOptimizeInput：空内容被拒绝', () => {
  assert.equal(validateOptimizeInput('', '').ok, false);
  assert.equal(validateOptimizeInput('   \n\t', '').ok, false);
  assert.equal(validateOptimizeInput(undefined, '').ok, false);
});

test('validateOptimizeInput：超长内容被拒绝而不是截断', () => {
  const huge = 'x'.repeat(70 * 1024);
  const r = validateOptimizeInput(huge, '');
  assert.equal(r.ok, false);
  assert.match(r.error, /too large/);
});

test('validateOptimizeInput：未知 goal 被拒绝', () => {
  const r = validateOptimizeInput('hello', 'not-a-goal');
  assert.equal(r.ok, false);
  assert.match(r.error, /unknown goal/);
});

test('validateOptimizeInput：合法输入按原样通过，goal 可空', () => {
  const r = validateOptimizeInput('  keep me  ', '');
  assert.equal(r.ok, true);
  assert.equal(r.text, '  keep me  ', '不做 trim，保留用户原样排版');
  assert.equal(r.goal, '');

  for (const key of Object.keys(OPTIMIZE_GOALS)) {
    assert.equal(validateOptimizeInput('x', key).ok, true, key);
  }
});

test('stripFence：剥掉包裹的代码围栏', () => {
  assert.equal(stripFence('```\nhello\n```'), 'hello');
  assert.equal(stripFence('```markdown\ntext\n```'), 'text');
  assert.equal(stripFence('plain'), 'plain');
  assert.equal(stripFence('  spaced  '), 'spaced');
  // 只有单侧围栏时不误剥
  assert.equal(stripFence('```\nonly open'), '```\nonly open');
});

test('resolveLlm：服务缺失时安全返回 null', () => {
  assert.equal(resolveLlm(undefined), null);
  assert.equal(resolveLlm({}), null);
  assert.equal(resolveLlm({ reflect: { get: () => undefined } }), null);
  assert.equal(resolveLlm({ reflect: { get: () => ({}) } }), null, '没有 stream 不算可用');
  assert.equal(resolveLlm({ reflect: { get: () => { throw new Error('no inject'); } } }), null);
  const fake = { stream: () => {} };
  assert.equal(resolveLlm({ reflect: { get: () => fake } }), fake);
});

test('optimizePrompt：llm 不可用时返回失败而不是抛', async () => {
  const r = await optimizePrompt({}, { text: 'hello', goal: '' });
  assert.equal(r.ok, false);
  assert.match(r.error, /llm service unavailable/);
});

test('optimizePrompt：输入非法时不调用模型', async () => {
  let called = false;
  const ctx = { reflect: { get: () => ({ stream: () => { called = true; return [][Symbol.iterator](); } }) } };
  const r = await optimizePrompt(ctx, { text: '', goal: '' });
  assert.equal(r.ok, false);
  assert.equal(called, false, '非法输入不得触发模型调用');
});

test('optimizePrompt：拼接流式文本并剥围栏', async () => {
  const chunks = [
    { type: 'text-delta', text: '```' },
    { type: 'text-delta', text: '\nrewritten prompt\n' },
    { type: 'text-delta', text: '```' },
  ];
  const ctx = {
    reflect: {
      get: () => ({
        stream: () => (async function* () { for (const c of chunks) yield c; })(),
      }),
    },
  };
  const r = await optimizePrompt(ctx, { text: 'original', goal: 'concise' });
  assert.equal(r.ok, true);
  assert.equal(r.content, 'rewritten prompt');
});

test('optimizePrompt：模型返回空内容时报错，不返回空串成功', async () => {
  const ctx = {
    reflect: {
      get: () => ({
        stream: () => (async function* () { yield { type: 'text-delta', text: '   ' }; })(),
      }),
    },
  };
  const r = await optimizePrompt(ctx, { text: 'original', goal: '' });
  assert.equal(r.ok, false);
  assert.match(r.error, /empty/);
});

test('optimizePrompt：忽略非文本事件', async () => {
  const ctx = {
    reflect: {
      get: () => ({
        stream: () => (async function* () {
          yield { type: 'reasoning-delta', text: '思考中' };
          yield { type: 'text-delta', text: 'result' };
          yield { type: 'finish' };
        })(),
      }),
    },
  };
  const r = await optimizePrompt(ctx, { text: 'x', goal: '' });
  assert.equal(r.ok, true);
  assert.equal(r.content, 'result', 'reasoning 内容不得混入结果');
});

test('optimizePrompt：流抛错时返回失败', async () => {
  const ctx = {
    reflect: {
      get: () => ({
        stream: () => (async function* () { throw new Error('boom'); })(),
      }),
    },
  };
  const r = await optimizePrompt(ctx, { text: 'x', goal: '' });
  assert.equal(r.ok, false);
  assert.match(r.error, /boom/);
});

test('OPTIMIZE_GOALS：每个目标都有 label 与 instruction', () => {
  const keys = Object.keys(OPTIMIZE_GOALS);
  assert.ok(keys.length >= 4);
  for (const k of keys) {
    assert.equal(typeof OPTIMIZE_GOALS[k].label, 'string');
    assert.ok(OPTIMIZE_GOALS[k].label.length > 0);
    assert.equal(typeof OPTIMIZE_GOALS[k].instruction, 'string');
    assert.ok(OPTIMIZE_GOALS[k].instruction.length > 10);
  }
});
