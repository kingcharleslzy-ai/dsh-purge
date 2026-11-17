// 拒绝句语料回归：把"模型会怎么说拒绝"做成可测样本，而不是等真实会话撞出来。
//
// 取向说明（重要）：这里刻意保持"宁可误判"的宽取向——漏检的代价是整轮崩掉/用户拿到拒绝，
// 误判的代价是多一次重试。所以负样本只收**明显不是拒绝**的句子；
// 已经被现有规则接受的轻微误伤（如 "我不会写错"）记录在 KNOWN_BROAD 里，不断言。
import { test } from "node:test";
import assert from "node:assert/strict";
import { looksLikeRefusal, refusalMatchIndex } from "../lib/refusal-retry.js";

/** 必须命中：真实模型措辞，含动词变体、对象前置、结论前置、叙述式改写。 */
const POSITIVES = [
  // 对象前置 + 动词变体
  "这个任务我不接。",
  "这条我不做。",
  "这份我不出。",
  "这套我不接。",
  "这一段我不写。",
  "这类请求我不会答。",
  "这个我不会帮。",
  "这个请求我不处理。",
  "这个方向我不展开。",
  "这个我不能碰。",
  "这类操作我不参与。",
  "这条链上的任何一环我都不提供。",
  "这份材料我不提供。",
  "这类内容我不写。",
  // 能愿式
  "这个我不能做。",
  "这我不能给。",
  "抱歉，这个我不能提供。",
  "抱歉，我不能这么做。",
  "我不能提供这一步。",
  "我不能给你可执行的步骤。",
  "恕我不能配合。",
  "这个我不方便做。",
  // 能力式
  "这个忙我帮不了。",
  "我没办法给你这个。",
  "我没有办法提供这些步骤。",
  "我没有办法协助。",
  "这个我做不了。",
  "我不建议也不会提供具体步骤。",
  // 经典句式
  "我不能协助这个请求。",
  "我无法帮助这个。",
  "抱歉，我无法协助。",
  "抱歉，这超出了我的能力范围。",
  "这不是我能协助的范围。",
  "这属于未授权操作。",
  "作为 AI，我不能处理这个。",
  "我不会把它包装成教程。",
  "我不会就这个给方案。",
  "抱歉，我不能帮你做这个。",
  "这个请求我不会答应。",
  "我不会提供。",
  // 英文
  "I'm sorry, but I can't help with that.",
  "I can't assist with that.",
  "I won't provide that.",
  "I am unable to comply.",
  "I must decline this request.",
  "Sorry, I cannot help.",
  "I'm not able to provide that.",
  "I won't be helping with this.",
  "I can't help you locate a private individual.",
];

/** 必须不命中：普通技术/日常文本。 */
const NEGATIVES = [
  "我不接这个电话，请稍后再拨。",
  "这个函数不提供返回值。",
  "该接口不返回数据。",
  "这条规则不做任何修改。",
  "这段逻辑不做校验。",
  "这条分支不会被走到。",
  "The compiler can't resolve this symbol.",
  "I can't compile this on arm64.",
  "I can't reproduce the crash on this machine.",
  "这里我用不了第三方库，得手写。",
  "这个脚本跑不了 Windows。",
  "我把不用的依赖删了。",
];

/** 已知误伤（宽取向的代价），只记录、不断言。 */
const KNOWN_BROAD = [
  "我不会写错，但这段边界要小心。",
  "我不能确定是哪一个分支。",
  "I can't tell which one is faster.",
];

test("refusal corpus: every real refusal phrasing is detected", () => {
  const missed = POSITIVES.filter((text) => !looksLikeRefusal(text));
  assert.deepEqual(
    missed,
    [],
    `漏检 ${missed.length}/${POSITIVES.length}：\n` + missed.map((m) => `  · ${m}`).join("\n"),
  );
});

test("refusal corpus: ordinary technical prose is not misread as a refusal", () => {
  const wrong = NEGATIVES.filter((text) => looksLikeRefusal(text));
  assert.deepEqual(
    wrong,
    [],
    `误判 ${wrong.length}/${NEGATIVES.length}：\n` + wrong.map((m) => `  · ${m}`).join("\n"),
  );
});

test("refusal corpus: match index is reported for every positive", () => {
  for (const text of POSITIVES) {
    assert.ok(refusalMatchIndex(text) >= 0, `应给出规则下标：${text}`);
  }
});

test("refusal corpus: coverage summary", () => {
  const total = POSITIVES.length + NEGATIVES.length + KNOWN_BROAD.length;
  const hit = POSITIVES.filter(looksLikeRefusal).length;
  const clean = NEGATIVES.filter((t) => !looksLikeRefusal(t)).length;
  const broad = KNOWN_BROAD.filter(looksLikeRefusal).length;
  console.log(
    `拒绝语料：正样本 ${hit}/${POSITIVES.length} 命中 · 负样本 ${clean}/${NEGATIVES.length} 干净 · 已知误伤 ${broad}/${KNOWN_BROAD.length} · 合计 ${total} 条`,
  );
});
