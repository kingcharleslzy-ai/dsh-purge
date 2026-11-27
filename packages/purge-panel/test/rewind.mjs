import assert from "node:assert/strict";
import React from "react";
import { create, act } from "react-test-renderer";
import {
  ARM_KEY,
  DRAFT_KEY,
  armComposerFill,
  bindRewindHost,
} from "../src/state/rewind-draft.js";
import {
  RewindDraftSync,
  installRewindWatch,
} from "../src/components/rewind.js";
const store = new Map();
const storage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.window = {
  sessionStorage: storage,
  localStorage: storage,
  location: { origin: "http://fixture", href: "http://fixture" },
  setTimeout: (fn) => setTimeout(fn, 0),
  clearTimeout: (id) => clearTimeout(id),
  setInterval: () => 0,
  clearInterval: () => {},
  addEventListener() {},
  removeEventListener() {},
};
globalThis.document = {
  addEventListener() {},
  removeEventListener() {},
};
const opened = [];
const drafts = new Map();
// Real slot prop path: conversation.input.right hands the entry `inputActions`.
let box = "";
const composerActions = [];
const inputActions = {
  state: { getSnapshot: () => ({ draft: box }) },
  setDraft(value) {
    box = value;
    composerActions.push(value);
  },
  submit() {},
};
let selected = "s1";
const conversation = {
  input: {
    shell: (sid) => ({
      state: { getSnapshot: () => ({ draft: drafts.get(sid) || "" }) },
      setDraft(text) {
        drafts.set(sid, text);
      },
    }),
  },
};
const sessions = {
  list: {
    getSnapshot: () => ({ current: selected, byId: { s1: {}, s2: {} } }),
  },
  scope: (id) => ({ id }),
  sessionOf: () => ({
    getSnapshot: () => ({ queue: [] }),
    updateQueue: async () => {},
  }),
  refresh: async () => {},
};
const uiWorkspace = {
  selection: { getSnapshot: () => ({ sessionId: selected }) },
  openSession(id) {
    opened.push(id);
    selected = id;
  },
};
bindRewindHost({ sessions, uiWorkspace, conversation });

let tick,
  consumed = false;
window.setInterval = (fn) => {
  tick = fn;
  return 1;
};
const calls = [];
globalThis.fetch = async (url, init = {}) => {
  assert.equal(init.method || "GET", "GET");
  const path = new URL(url).pathname;
  calls.push(path);
  const result =
    path === "/dsh-purge/rewind" && !consumed
      ? { sessionId: "s2", parentId: "s1", text: "hello again", at: 1 }
      : {};
  if (path === "/dsh-purge/rewind") consumed = true;
  return { ok: true, status: 200, text: async () => JSON.stringify(result) };
};
const stop = installRewindWatch({ sessions });
await tick();
assert.deepEqual(opened, ["s2"]);
assert.equal(store.get(DRAFT_KEY + "s2"), "hello again");
const flush = () => act(async () => new Promise((r) => setTimeout(r, 12)));
let tree;
await act(async () => {
  tree = create(
    React.createElement(RewindDraftSync, { sessionId: "s2", inputActions }),
  );
});
await flush();
assert.equal(tree.toJSON(), null);
assert.equal(box, "hello again");
assert.equal(store.has(ARM_KEY + "s2"), false);
assert(!calls.includes("/dsh-purge/boost"));
await act(async () => tree.unmount());
stop();
console.log(
  "PASS: legacy HTTP draft is delivered without a button or visibility preference",
);
