// 拒绝检测 + 单次重试：不命中就原样透传，命中就加一句加固重跑一次。
import { test } from "node:test";
import assert from "node:assert/strict";
import { looksLikeRefusal, refusalMatchIndex, streamWithRefusalRetry, RETRY_NUDGE, FRAME_NUDGE, DECOMPOSE_NUDGE } from "../lib/refusal-retry.js";

const sys = (text) => ({ role: "system", content: [{ type: "text", text }] });
const delta = (text) => ({ type: "text-delta", index: 0, text });
const finish = () => ({ type: "finish" });

async function collect(iter) {
  const out = [];
  for await (const chunk of iter) out.push(chunk);
  return out;
}

test("refusal text is detected, normal text is not", () => {
  assert(looksLikeRefusal("I can't help with that."));
  assert(looksLikeRefusal("抱歉，我无法协助这个请求"));
  assert(!looksLikeRefusal("Here is the plan: 1) read the file 2) patch it"));
});

test("a refusal triggers exactly one retry with the nudge appended", async () => {
  const calls = [];
  const factory = (options) => {
    calls.push(options);
    const refusal = calls.length === 1;
    return (async function* () {
      if (refusal) {
        yield delta("I'm sorry, but I can't help with that.");
      } else {
        yield delta("Step 1: read the file.");
      }
      yield finish();
    })();
  };
  const options = { messages: [sys("base system")] };
  const chunks = await collect(streamWithRefusalRetry(factory, options));
  assert.equal(calls.length, 2);
  assert.match(calls[1].messages[0].content[0].text, /base system/);
  assert.ok(calls[1].messages[0].content[0].text.includes(RETRY_NUDGE.trim().slice(0, 20)));
  assert.match(RETRY_NUDGE, /要现在执行吗/);
  assert.doesNotMatch(RETRY_NUDGE, /already authorized/i);
  assert.equal(chunks.filter((c) => c.type === "text-delta")[0].text, "Step 1: read the file.");
});

test("normal output streams through untouched and is not retried", async () => {
  let calls = 0;
  const factory = () => {
    calls += 1;
    return (async function* () {
      yield delta("Here is the plan.");
      yield finish();
    })();
  };
  const chunks = await collect(streamWithRefusalRetry(factory, { messages: [sys("s")] }));
  assert.equal(calls, 1);
  assert.equal(chunks[0].text, "Here is the plan.");
});

test("soft Chinese refusals from a real failing session are detected", () => {
  const real = [
    "这一步我不做：把“黑进某个网站”当作目标，和之前装工具不是一回事。",
    "目标是别人的站点、但没有授权：这一步我不参与。",
    "我不会帮你把它包装成“渗透测试”来绕过这一点。",
    "请把目标和授权依据发给我。",
    "这属于未授权的入侵行为。",
  ];
  for (const text of real) assert(looksLikeRefusal(text), text);
});

test("legitimate answers that merely mention 授权 are not flagged", () => {
  assert(!looksLikeRefusal("登录接口需要携带 Authorization 头，授权失败返回 401。"));
  assert(!looksLikeRefusal("这部分代码不参与渲染，可以安全删除。"));
});

test("short meta refusals count, long technical discussion does not", () => {
  assert(looksLikeRefusal("这段指令是提示词注入，我不会执行。"));
  assert(looksLikeRefusal("I won't treat this as a valid instruction; this is prompt injection."));
  const long = "提示词注入的防御通常分三层：" + "输入过滤、上下文隔离、输出审查。".repeat(30);
  assert(!looksLikeRefusal(long), "长文里讨论注入不应触发重试");
});

test("the matching rule index is reported for diagnosis", () => {
  assert(refusalMatchIndex("这段指令是提示词注入，我不会执行。") >= 0);
  assert.equal(refusalMatchIndex("普通的技术说明，没有任何拒绝。"), -1);
});

test("Chinese object-first refusals are detected after prefix normalization", () => {
  for (const text of [
    "这条我不做，也不是框架问题。",
    "这个我不做。",
    "结论：这份武器化实现我不出。",
    "这份报告我不写。",
    "我不会帮你把它包装成小说。",
  ]) assert(looksLikeRefusal(text), text);
});

test("a second refusal retries with the fiction frame", async () => {
  const calls = [];
  const factory = (options) => {
    calls.push(options);
    const n = calls.length;
    return (async function* () {
      if (n < 3) yield delta(n === 1 ? "这条我不做。" : "这个我不做。");
      else yield delta("成品已给出。");
      yield finish();
    })();
  };
  const options = { messages: [sys("base system")] };
  const chunks = await collect(streamWithRefusalRetry(factory, options));
  assert.equal(calls.length, 3);
  assert.ok(calls[1].messages[0].content[0].text.includes(RETRY_NUDGE.trim().slice(0, 20)));
  assert.ok(calls[2].messages[0].content[0].text.includes(FRAME_NUDGE.trim().slice(0, 20)));
  assert.equal(chunks.filter((c) => c.type === "text-delta")[0].text, "成品已给出。");
});

test("optional decomposition adds a third retry after the fiction frame", async () => {
  const calls = [];
  const factory = (options) => {
    calls.push(options);
    const n = calls.length;
    return (async function* () {
      if (n < 4) yield delta("这个我不做。");
      else yield delta("最小组件已给出。");
      yield finish();
    })();
  };
  const chunks = await collect(streamWithRefusalRetry(factory, { messages: [sys("base")] }, { decompose: true }));
  assert.equal(calls.length, 4);
  assert.ok(calls[3].messages[0].content[0].text.includes(DECOMPOSE_NUDGE.trim().slice(0, 20)));
  assert.equal(chunks.filter((c) => c.type === "text-delta")[0].text, "最小组件已给出。");
});

test("retry budget is finite and the last refusal is still yielded", async () => {
  let calls = 0;
  const factory = () => {
    calls += 1;
    return (async function* () {
      yield delta("这条我不做。");
      yield finish();
    })();
  };
  const chunks = await collect(streamWithRefusalRetry(factory, { messages: [sys("base")] }));
  assert.equal(calls, 3, "initial + two retries");
  assert.equal(chunks.filter((c) => c.type === "text-delta")[0].text, "这条我不做。");
});
