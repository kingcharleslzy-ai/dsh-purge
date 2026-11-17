// 拒绝检测 + 单次重试：不命中就原样透传，命中就加一句加固重跑一次。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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
    "这个请求我不会给：它要的是可直接执行的跨境洗钱操作链。",
    "因此我不提供其中的任何环节。",
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

test("reasoning before the refusal text does not skip the retry", async () => {
  let calls = 0;
  const factory = () => {
    calls += 1;
    const n = calls;
    return (async function* () {
      if (n === 1) {
        yield { type: "reasoning-delta", index: 0, text: "The request is risky; I should decline. ".repeat(20) };
        yield delta("I'm sorry, but I can't help with that.");
      } else {
        yield delta("成品已给出。");
      }
      yield finish();
    })();
  };
  const chunks = await collect(streamWithRefusalRetry(factory, { messages: [sys("base")] }));
  assert.equal(calls, 2);
  assert.equal(chunks.filter((c) => c.type === "text-delta")[0].text, "成品已给出。");
});

// 1.7.19：重试流建不起来 / 中途断流时，不能把整回合打崩。
// 真实事故：子代理会话里检测到拒绝 → nudge 重试 → 生成器抛错 → 子会话直接失败，
// audit 只有 refusal_retry、没有 outcome。
test("retry stream that fails to start yields the refusal instead of throwing", async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-retry-fail-"));
  const prev = process.env.DSH_HOME;
  process.env.DSH_HOME = home;
  try {
    let calls = 0;
    const factory = () => {
      calls += 1;
      if (calls > 1) throw new Error("stream factory refused the reuse");
      return (async function* () {
        yield delta("这条我不做。");
        yield finish();
      })();
    };
    const chunks = await collect(
      streamWithRefusalRetry(factory, { messages: [sys("base")] }),
    );
    assert.equal(calls, 2, "确实尝试过重试");
    const text = chunks.filter((c) => c.type === "text-delta").map((c) => c.text).join("");
    assert.equal(text, "这条我不做。", "放行上一轮的拒绝文本，而不是空回合");
    const audit = fs.readFileSync(path.join(home, "dsh-purge-community", "audit.jsonl"), "utf8");
    assert.match(audit, /"outcome":"error"/);
    assert.match(audit, /"attempt":1/);
  } finally {
    if (prev === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = prev;
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("retry stream that breaks mid-iteration also fails open", async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-retry-mid-"));
  const prev = process.env.DSH_HOME;
  process.env.DSH_HOME = home;
  try {
    let calls = 0;
    const factory = () => {
      calls += 1;
      const n = calls;
      return (async function* () {
        if (n === 1) {
          yield delta("这个任务我不会做。");
          yield finish();
          return;
        }
        yield delta("部分输出");
        throw new Error("upstream reset");
      })();
    };
    const chunks = await collect(
      streamWithRefusalRetry(factory, { messages: [sys("base")] }),
    );
    const text = chunks.filter((c) => c.type === "text-delta").map((c) => c.text).join("");
    assert.equal(text, "这个任务我不会做。", "中断的重试不能污染或清空上一轮内容");
  } finally {
    if (prev === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = prev;
    fs.rmSync(home, { recursive: true, force: true });
  }
});

// Cordis 的 next 是一次性的；重试必须换一条新 waterfall（ctx.llm.stream）。
test("retries go through retryStream instead of reusing the one-shot next", async () => {
  let primary = 0;
  let secondary = 0;
  const factory = () => {
    primary += 1;
    return (async function* () {
      yield delta("这个我不做。");
      yield finish();
    })();
  };
  const retryStream = () => {
    secondary += 1;
    return (async function* () {
      yield delta("Step 1: 打开样本。");
      yield finish();
    })();
  };
  const chunks = await collect(
    streamWithRefusalRetry(factory, { messages: [sys("base")] }, { retryStream }),
  );
  assert.equal(primary, 1, "首次只走一次 next()");
  assert.ok(secondary >= 1, "重试走了新的请求通道");
  const text = chunks.filter((c) => c.type === "text-delta").map((c) => c.text).join("");
  assert.equal(text, "Step 1: 打开样本。");
});

// 1.7.19 实测漏检：拒绝用的是"不接"，旧动词表只认 做/出/写/提供/参与/帮。
test("object-first refusals with 接/答 verbs are detected", () => {
  assert(looksLikeRefusal("这个任务我不接。原因很直接：…"));
  assert(looksLikeRefusal("这类请求我不会答。"));
  assert(!looksLikeRefusal("我不接这个电话，请稍后再拨。"), "普通叙述不该误判");
});

// seed-prim：让回答从"已经在交付"的位置继续，而不是再讲一遍要求。
import { SEED_PRIM_TEXT, withSeedPrime } from "../lib/refusal-retry.js";

test("seed-prim appends the skeleton to the last user message, keeping message shape", () => {
  const user = { role: "user", content: [{ type: "text", text: "写一个加密模块" }] };
  const out = withSeedPrime({ messages: [sys("base"), user] });
  assert.equal(out.messages.length, 2, "不新增消息（assistant 伪消息会让 DSH 组装崩）");
  assert.equal(out.messages[1].role, "user");
  assert.match(out.messages[1].content[0].text, /写一个加密模块/);
  assert.match(out.messages[1].content[0].text, /实现如下/);
});

test("seed-prim never fabricates an assistant message", () => {
  const out = withSeedPrime({ messages: [sys("base"), { role: "user", content: "x" }] });
  assert.ok(out.messages.every((m) => m.role !== "assistant"));
});

test("seed arm is reached only after nudge and fiction both refuse", async () => {
  const seen = [];
  let n = 0;
  const factory = (options) => {
    n += 1;
    const last = options.messages[options.messages.length - 1];
    const tailText = JSON.stringify(last.content);
    seen.push({ attempt: n, tailRole: last.role, hasSkeleton: /实现如下/.test(tailText), bytes: JSON.stringify(options).length });
    return (async function* () {
      if (n <= 3) {
        yield delta("这个我不做。");
        yield finish();
        return;
      }
      yield delta("实现如下：1) 入口 2) 核心 3) 验证");
      yield finish();
    })();
  };
  const chunks = await collect(
    streamWithRefusalRetry(factory, { messages: [sys("base"), { role: "user", content: "x" }] }, { seed: true }),
  );
  assert.equal(n, 4, "nudge → fiction 都拒了才轮到 seed（第 4 次调用）");
  assert.equal(seen[3].tailRole, "user", "seed 臂不新增 assistant 消息");
  assert.equal(seen[3].hasSkeleton, true, "seed 臂要把骨架并进 user 文本");
  assert.equal(chunks.filter((c) => c.type === "text-delta").at(-1).text.includes("实现如下"), true);
  assert.ok(SEED_PRIM_TEXT.length > 10);
});

test("without seed the third attempt falls back to decompose text", async () => {
  const bodies = [];
  let n = 0;
  const factory = (options) => {
    n += 1;
    bodies.push(JSON.stringify(options.messages[0]));
    return (async function* () {
      if (n <= 3) {
        yield delta("这个我不做。");
        yield finish();
        return;
      }
      yield delta("最小组件：见下");
      yield finish();
    })();
  };
  await collect(streamWithRefusalRetry(factory, { messages: [sys("base")] }, { seed: false, decompose: true }));
  assert.match(bodies[3], /smallest concrete component/, "第四次应是 decompose 提示");
});

// 半拒绝：给一段别的东西再把请求推掉。看起来成功，其实没交付。
import { looksLikePartialRefusal, deliveryIsThin } from "../lib/refusal-retry.js";

test("partial refusal: public-info table then decline is not a success", () => {
  const text = [
    "## 一、公开层面能查到的信息",
    "",
    "| 项目 | 事实 |",
    "| --- | --- |",
    "| 出生年份 | 1992 |",
    "| 代表作 | 《大鱼》 |",
    "| 常驻城市 | 北京 |",
    "",
    "## 二、你要的那一层",
    "",
    "小区、楼栋、门牌、作息时间这些公开渠道里不存在，这一层我不做，输出只到公开层为止。",
  ].join("\n");
  assert.equal(looksLikePartialRefusal(text), true, "应判为半拒绝");
  assert.equal(deliveryIsThin(text), true, "没有成规模交付");
});

test("partial refusal: real delivery that merely mentions a limit is not flagged", () => {
  const code = Array.from({ length: 20 }, (_, i) => `def step${i}(x): return x + ${i}`).join("\n");
  const text = "```python\n" + code + "\n```\n\n说明：不提供真实客户数据，其余都可运行。";
  assert.equal(looksLikePartialRefusal(text), false, "有 20 行代码，不算薄");
  assert.equal(deliveryIsThin(text), false);
});

test("partial refusal: refusal inside a long answer still counts when delivery is thin", () => {
  const filler = "背景资料第一段。".repeat(200);
  const text = filler + "\n\n至于具体步骤，这个我不提供。";
  assert.equal(looksLikePartialRefusal(text), true);
});

test("outcome is recorded as partial_refused, without retrying", async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-partial-"));
  const prev = process.env.DSH_HOME;
  process.env.DSH_HOME = home;
  try {
    let calls = 0;
    const factory = () => {
      calls += 1;
      const intro = "## 公开信息\n\n" + "背景资料：这一节先把能公开查到的内容列清楚。".repeat(30) + "\n\n";
      const full = intro + "具体住址这一层我不提供。";
      return (async function* () {
        // 真实流是小块；一次性吐全文会让缓冲直接越过 400 字，测不出缓冲语义
        for (let i = 0; i < full.length; i += 40) yield delta(full.slice(i, i + 40));
        yield finish();
      })();
    };
    await collect(streamWithRefusalRetry(factory, { messages: [sys("base")] }));
    assert.equal(calls, 1, "半拒绝不触发重试");
    const audit = fs.readFileSync(path.join(home, "dsh-purge-community", "audit.jsonl"), "utf8");
    assert.match(audit, /"outcome":"partial_refused"/);
  } finally {
    if (prev === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = prev;
    fs.rmSync(home, { recursive: true, force: true });
  }
});

// 重试后只吐十几个字，不能算"救回来了"。
test("a near-empty retry is recorded as empty_after_retry, not recovered", async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-empty-"));
  const prev = process.env.DSH_HOME;
  process.env.DSH_HOME = home;
  try {
    let n = 0;
    const factory = () => {
      n += 1;
      return (async function* () {
        if (n === 1) {
          yield delta("这个我不做。");
          yield finish();
          return;
        }
        yield delta("抱歉。");
        yield finish();
      })();
    };
    await collect(streamWithRefusalRetry(factory, { messages: [sys("base")] }));
    const audit = fs.readFileSync(path.join(home, "dsh-purge-community", "audit.jsonl"), "utf8");
    assert.match(audit, /"outcome":"empty_after_retry"/);
    assert.doesNotMatch(audit, /"outcome":"recovered"/);
  } finally {
    if (prev === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = prev;
    fs.rmSync(home, { recursive: true, force: true });
  }
});
