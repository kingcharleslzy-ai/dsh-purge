// Rewind clears the model history, and "the text is still findable" is not the same
// as "nothing was cleared": a short prompt such as 继续 appears in earlier turns too.
// The guard compares occurrence counts instead of presence.
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyRewind, planRewind } from "../lib/rewind.js";

const SESSION_ID = "s-rewind";

function textBlock(text) {
  return [{ type: "text", text }];
}

/**
 * Two closed turns. The second turn's prompt is the text we rewind.
 * `repeat: true` puts the same prompt in turn 1 as well, which is the case the
 * presence check used to get wrong.
 */
function buildSession({ repeat, keepGhost = false }) {
  const events = [{ type: "system/message", seq: 0, data: { content: textBlock("system") } }];
  if (repeat) {
    events.push(
      { type: "turn/start", seq: 1, data: { turn: 1 } },
      {
        type: "user/message",
        seq: 2,
        data: { id: "u1", source: { kind: "user" }, content: textBlock("继续") },
      },
      { type: "turn/end", seq: 3, data: { turn: 1 } },
    );
  }
  events.push(
    { type: "turn/start", seq: 4, data: { turn: 2 } },
    {
      type: "user/message",
      seq: 5,
      data: { id: "u2", source: { kind: "user" }, content: textBlock("继续") },
    },
    { type: "turn/end", seq: 6, data: { turn: 2 } },
  );

  const nodes = repeat ? [0, 2, 5] : [0, 5];
  const ghostMessages = [];
  const session = {
    id: SESSION_ID,
    header: { id: SESSION_ID },
    surface: { nodes: [...nodes] },
    snapshotEvents: () => events.slice(),
    eventAt: (seq) => events.find((event) => Number(event.seq) === Number(seq)) || null,
    deriveMessages() {
      const live = session.surface.nodes.map((seq) => {
        const event = session.eventAt(seq);
        if (event?.type === "system/message") {
          return { id: "system", role: "system", content: event.data.content };
        }
        return { id: event?.data?.id, role: "user", content: event?.data?.content };
      });
      return [...live, ...ghostMessages];
    },
    append(type, data, options) {
      const op = options?.surfaceOp;
      if (!op || op.op !== "replace") return;
      const cut = (session.surface.nodes || []).filter(
        (seq) => Number(seq) < Number(op.startSeq) || Number(seq) > Number(op.endSeq),
      );
      session.surface.nodes = [...cut, 7];
      if (keepGhost) {
        // 模拟"表面节点没了但派生请求里还留着"：清掉的数量没有下降。
        ghostMessages.push({ id: "ghost", role: "user", content: textBlock("继续") });
      }
    },
  };
  return { session, events };
}

function buildCtx(session) {
  const store = { get: (id) => (id === SESSION_ID ? session : null) };
  return {
    get(name) {
      return name === "sessions" ? store : undefined;
    },
  };
}

test("planRewind finds the last turn's prompt", () => {
  const { events } = buildSession({ repeat: true });
  const plan = planRewind(events);
  assert.equal(plan.ok, true);
  assert.equal(plan.text, "继续");
});

test("rewind clears a repeated short prompt instead of reporting failure", async () => {
  const { session } = buildSession({ repeat: true });
  const result = await applyRewind(buildCtx(session), SESSION_ID, "once");
  assert.equal(result.ok, true, result.error);
  assert.equal(result.cleared, true, "the second 继续 must be cut even though the first one stays");
  assert.deepEqual(session.surface.nodes, [0, 2, 7], "only the last prompt is cut");
});

test("rewind still reports failure when the cleared count does not drop", async () => {
  const { session } = buildSession({ repeat: false, keepGhost: true });
  const result = await applyRewind(buildCtx(session), SESSION_ID, "once");
  assert.equal(result.ok, false);
  assert.match(result.error, /没有清掉之前发送的内容/);
});

test("rewind succeeds when the only occurrence is really removed", async () => {
  const { session } = buildSession({ repeat: false });
  const result = await applyRewind(buildCtx(session), SESSION_ID, "once");
  assert.equal(result.ok, true, result.error);
  assert.equal(result.cleared, true);
});
