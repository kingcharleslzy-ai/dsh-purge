import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { applyReplacementsToText } from "../lib/core.js";
import { STABILITY_PATCHES } from "../lib/patches/stability.mjs";

for (const patch of STABILITY_PATCHES) {
  test(patch.file + ": only an oversized Cordis tree is dropped, with the previous frame retained", () => {
    const [budget, overflow] = patch.replacements;
    const source = `// ${budget.pattern}
      (function setState(topic, record) {
        const previous = this.state.get(topic);
        this.state.set(topic, record);
        if (!this.stateFits()) {
          if (previous === void 0) this.state.delete(topic);
          ${overflow.pattern}
        }
        this.enqueue(record);
      })`;
    const {text} = applyReplacementsToText(source, patch);
    for (const marker of patch.markers) assert.ok(text.includes(marker));
    assert.equal(applyReplacementsToText(text, patch).text, text);
    const set = runInNewContext(text);
    const queued = [];
    const buffer = {state: new Map(), stateFits: () => true, enqueue: x => queued.push(x)};
    const topic = "cordis/tree";
    set.call(buffer, topic, 1);
    buffer.stateFits = () => false;
    set.call(buffer, topic, 2);
    assert.equal(buffer.state.get(topic), 1);
    buffer.state.clear();
    set.call(buffer, topic, 3);
    assert.equal(buffer.state.size, 0);
    assert.deepEqual(queued, [1]);
    assert.throws(() => set.call(buffer, "other", 4), /source state exceeds/);
    const error = new Error("serialization failed");
    buffer.stateFits = () => { throw error; };
    assert.throws(() => set.call(buffer, topic, 5), e => e === error);
    buffer.stateFits = () => true;
    buffer.enqueue = () => { throw error; };
    assert.throws(() => set.call(buffer, topic, 6), e => e === error);
  });
}
