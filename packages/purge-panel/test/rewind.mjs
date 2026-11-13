// Verifies the restored composer rewind UI: the button posts
// /dsh-purge/rewind with the original mode payload, then puts the text back
// into the composer (armed fill) and clears the stored draft.
import assert from "node:assert/strict";
import React from "react";
import { create, act } from "react-test-renderer";
import { zh } from "../src/shared/locale.js";
import {
  ARM_KEY,
  DRAFT_KEY,
  armComposerFill,
  bindRewindHost,
} from "../src/state/rewind-draft.js";
import { RewindSetting } from "../src/components/rewind-setting.js";
import { RewindSafe } from "../src/components/rewind.js";

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
const t = (key) => zh[key] || key;
const posts = [];
let visible = false;
let saveFails = false;
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
globalThis.fetch = async (url, init = {}) => {
  const path = new URL(url).pathname;
  const method = (init.method || "GET").toUpperCase();
  if (path === "/dsh-purge/boost") {
    if (method === "POST") {
      if (saveFails)
        return {
          ok: false,
          status: 500,
          text: async () => JSON.stringify({ error: "save failed" }),
        };
      assert.deepEqual(Object.keys(JSON.parse(init.body)), ["rewind"]);
      visible = JSON.parse(init.body).rewind;
    }
    return {
      ok: true,
      text: async () => JSON.stringify({ ok: true, rewind: visible }),
    };
  }
  if (path === "/dsh-purge/rewind" && method === "POST") {
    posts.push(JSON.parse(init.body));
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () =>
        JSON.stringify({
          ok: true,
          sessionId: "s2",
          parentId: "s1",
          text: "hello again",
          at: Date.now(),
          cleared: true,
        }),
    };
  }
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    text: async () => JSON.stringify({ ok: true }),
  };
};
const flush = () => act(async () => new Promise((r) => setTimeout(r, 12)));
const render = async (props) => {
  let tree;
  await act(async () => {
    tree = create(React.createElement(RewindSafe, { t, ...props }));
  });
  return tree;
};

// 1) button opens the two original menu entries
let tree = await render({ sessionId: "s1", inputActions });
const rewindButton = () =>
  tree.root.findAll(
    (x) => x.type === "button" && x.props.className === "dshp-rewind",
  )[0];
assert.equal(tree.toJSON(), null, "hidden slot renders no placeholder");
let settings;
await act(async () => {
  settings = create(React.createElement(RewindSetting));
});
const toggle = () => settings.root.findByProps({ role: "switch" });
const set = (checked) =>
  act(async () => toggle().props.onChange({ target: { checked } }));
assert.equal(toggle().props.checked, false);
await set(true);
assert.equal(toggle().props.checked, true);
saveFails = true;
await set(false);
assert(settings.root.findByProps({ role: "alert" }));
assert.equal(toggle().props.checked, true);
assert(rewindButton());
saveFails = false;
await set(false);
assert.equal(tree.toJSON(), null);
await set(true);
await act(async () => settings.unmount());
assert.equal(rewindButton().props.disabled, false);
assert(rewindButton().props.children.join("").includes("回退"));
await act(async () => rewindButton().props.onClick());
const items = () =>
  tree.root.findAll(
    (x) => x.type === "button" && x.props.className === "dshp-rewind-item",
  );
assert.equal(items().length, 2, "menu keeps 回退一次 / 回退上一轮");

// 2) "回退一次" posts {sessionId, mode:"once"} and refills the composer
await act(async () =>
  items()[0].props.onClick({ preventDefault() {}, stopPropagation() {} }),
);
await flush();
assert.deepEqual(posts, [{ sessionId: "s1", mode: "once" }]);
assert.deepEqual(opened, ["s2"], "rewound session is opened");
assert.equal(store.get(DRAFT_KEY + "s2"), "hello again");
assert.equal(drafts.get("s2"), "hello again", "host draft receives the text");

// 2b) the rewound session's composer mounts and takes the armed text
await act(async () => tree.unmount());
box = "";
composerActions.length = 0;
tree = await render({ sessionId: "s2", inputActions });
await flush();
assert.equal(box, "hello again", "armed text lands in the slot composer");
assert.equal(drafts.get("s2"), "hello again");
await act(async () => tree.unmount());

// 3) a rewind from the host (arm) fills the box when the slot mounts
store.clear();
drafts.clear();
visible = false;
armComposerFill("s2", "restored from host");
assert.equal(store.get(ARM_KEY + "s2") !== undefined, true);
box = "";
composerActions.length = 0;
tree = await render({ sessionId: "s2", inputActions });
await flush();
assert.equal(drafts.get("s2"), "restored from host");
assert.equal(tree.toJSON(), null, "hidden button still restores drafts");
assert.equal(box, "restored from host", "armed text lands in the composer");
assert.equal(store.has(ARM_KEY + "s2"), false, "armed fill is consumed");
await act(async () => tree.unmount());
console.log(
  "PASS: rewind menu payload, rewound session open, armed draft refill into the composer, armed marker consumption",
);
