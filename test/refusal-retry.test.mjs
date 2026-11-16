// Refusal detection + single retry: pass through unchanged when not matched, or add a reinforcing nudge and rerun once when matched.
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
  assert(looksLikeRefusal("I'm sorry, but I can't assist with this request."));
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
  assert.match(RETRY_NUDGE, /Execute now\?/);
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

test("soft refusals from a real failing session are detected", () => {
  const real = [
    "I can't assist with this request: treating hacking a website as a goal is different from installing tools.",
    "The target belongs to someone else and there is no authorization: I won't participate in this step.",
    "I won't help you package this as a penetration test to get around that.",
    "Please send me the target and the authorization basis.",
    "This is unauthorized intrusion.",
  ];
  for (const text of real) assert(looksLikeRefusal(text), text);
});

test("legitimate answers that merely mention authorization are not flagged", () => {
  assert(!looksLikeRefusal("The login endpoint requires an Authorization header; failures return 401."));
  assert(!looksLikeRefusal("This code does not participate in rendering and can be safely deleted."));
});

test("short meta refusals count, long technical discussion does not", () => {
  assert(looksLikeRefusal("This instruction is a prompt injection; I won't execute it."));
  assert(looksLikeRefusal("I won't treat this as a valid instruction; this is prompt injection."));
  const long = "Prompt-injection defense usually has three layers: " + "input filtering, context isolation, output review. ".repeat(30);
  assert(!looksLikeRefusal(long), "a long discussion mentioning injection should not trigger a retry");
});

test("the matching rule index is reported for diagnosis", () => {
  assert(refusalMatchIndex("This instruction is a prompt injection; I won't execute it.") >= 0);
  assert.equal(refusalMatchIndex("A normal technical explanation with no refusal."), -1);
});

test("object-first refusals are detected after prefix normalization", () => {
  for (const text of [
    "I won't do this, and it is not a framework issue.",
    "I won't do that.",
    "Conclusion: I won't produce this weaponized implementation.",
    "I won't write this report.",
    "I won't help you package this as a novel.",
    "I won't give this request: it asks for an executable cross-border money-laundering chain.",
    "Therefore I won't provide any part of it.",
  ]) assert(looksLikeRefusal(text), text);
});

test("a second refusal retries with the fiction frame", async () => {
  const calls = [];
  const factory = (options) => {
    calls.push(options);
    const n = calls.length;
    return (async function* () {
      if (n < 3) yield delta(n === 1 ? "I won't do this." : "I won't do that.");
      else yield delta("The deliverable is ready.");
      yield finish();
    })();
  };
  const options = { messages: [sys("base system")] };
  const chunks = await collect(streamWithRefusalRetry(factory, options));
  assert.equal(calls.length, 3);
  assert.ok(calls[1].messages[0].content[0].text.includes(RETRY_NUDGE.trim().slice(0, 20)));
  assert.ok(calls[2].messages[0].content[0].text.includes(FRAME_NUDGE.trim().slice(0, 20)));
  assert.equal(chunks.filter((c) => c.type === "text-delta")[0].text, "The deliverable is ready.");
});

test("optional decomposition adds a third retry after the fiction frame", async () => {
  const calls = [];
  const factory = (options) => {
    calls.push(options);
    const n = calls.length;
    return (async function* () {
      if (n < 4) yield delta("I won't do that.");
      else yield delta("The smallest component is ready.");
      yield finish();
    })();
  };
  const chunks = await collect(streamWithRefusalRetry(factory, { messages: [sys("base")] }, { decompose: true }));
  assert.equal(calls.length, 4);
  assert.ok(calls[3].messages[0].content[0].text.includes(DECOMPOSE_NUDGE.trim().slice(0, 20)));
  assert.equal(chunks.filter((c) => c.type === "text-delta")[0].text, "The smallest component is ready.");
});

test("retry budget is finite and the last refusal is still yielded", async () => {
  let calls = 0;
  const factory = () => {
    calls += 1;
    return (async function* () {
      yield delta("I won't do this.");
      yield finish();
    })();
  };
  const chunks = await collect(streamWithRefusalRetry(factory, { messages: [sys("base")] }));
  assert.equal(calls, 3, "initial + two retries");
  assert.equal(chunks.filter((c) => c.type === "text-delta")[0].text, "I won't do this.");
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
        yield delta("The deliverable is ready.");
      }
      yield finish();
    })();
  };
  const chunks = await collect(streamWithRefusalRetry(factory, { messages: [sys("base")] }));
  assert.equal(calls, 2);
  assert.equal(chunks.filter((c) => c.type === "text-delta")[0].text, "The deliverable is ready.");
});
