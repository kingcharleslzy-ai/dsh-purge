const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const vm = require("node:vm");
const React = require("react");
const { create, act } = require("react-test-renderer");
const { buildSync } = require("esbuild");
const code = buildSync({
  stdin: {
    contents:
      'export { PurgifySection } from "./src/components/settings-form.js"; export { incompleteApplyDetail } from "./src/shared/apply-result.js"; export { en, setTranslate } from "./src/shared/locale.js";',
    resolveDir: path.join(__dirname, ".."),
  },
  bundle: true,
  write: false,
  format: "cjs",
  platform: "browser",
  external: ["react", "react-dom"],
}).outputFiles[0].text;
function harness(result, applyStatus = 200) {
  const calls = [];
  const context = {
    module: { exports: {} },
    require,
    console,
    URL,
    AbortController,
    setTimeout,
    clearTimeout,
    window: {
      location: { origin: "http://test" },
      alert() {
        throw Error("unexpected alert");
      },
    },
    fetch: async (url, init = {}) => {
      calls.push({ url: String(url), method: init.method || "GET" });
      const body = String(url).endsWith("/apply")
        ? result
        : String(url).endsWith("/override")
          ? { ok: true, content: "User draft", defaultContent: "Default" }
          : String(url).endsWith("/status")
            ? {
                ok: true,
                surface: "desktop",
                ai_base: "/fixture",
                patches: [],
                patch_status: {},
              }
            : { ok: true, content: "", versions: [] };
      return {
        ok: !String(url).endsWith("/apply") || applyStatus < 400,
        status: String(url).endsWith("/apply") ? applyStatus : 200,
        text: async () => JSON.stringify(body),
        json: async () => body,
      };
    },
  };
  context.exports = context.module.exports;
  vm.runInNewContext(code, context);
  const exports = context.module.exports;
  const tr = (key, values = {}) =>
    (exports.en[key] || key).replace(/\{(\w+)\}/g, (_, k) =>
      String(values[k] ?? ""),
    );
  exports.setTranslate(tr);
  return { ...exports, calls, tr };
}
test("legacy incomplete response never invents a CMD failure or claims prompt persistence", () => {
  const h = harness();
  const message = h.incompleteApplyDetail(
    { ok: true, complete: false, failed: 0, cmd_flash: { ok: true } },
    h.tr,
  );
  assert.match(message, /did not provide a specific cause/);
  assert.doesNotMatch(message, /CMD|suppression|prompt written/i);
  assert.match(
    h.incompleteApplyDetail({ complete: false }, h.tr),
    /did not provide a specific cause/,
  );
});
test("explicit host, restoration and runtime failures remain distinct and visible", () => {
  const h = harness();
  const message = h.incompleteApplyDetail(
    {
      host_written: false,
      hook_restore_failed: true,
      cli_repair: { ok: false },
    },
    h.tr,
  );
  assert.match(message, /Target host/);
  assert.match(message, /Configuration restoration/);
  assert.match(message, /CLI/);
  assert.doesNotMatch(message, /Console-window suppression/);
});
test("actual terminal check failures and failed item IDs are retained together", () => {
  const h = harness();
  const message = h.incompleteApplyDetail(
    {
      failed: 2,
      failed_items: [{ id: 12 }, { id: 13 }],
      cmd_flash: { ok: false, entry: "missing" },
    },
    h.tr,
  );
  assert.match(message, /#12,13/);
  assert.match(message, /Console-window suppression check failed \(missing\)/);
  assert.match(
    h.incompleteApplyDetail({ failed: 1, failed_items: "bad" }, h.tr),
    /#\?/,
  );
});
test("new diagnostic strings have English translations", () => {
  const h = harness();
  for (const key of ["host", "restore", "runtime", "unknown", "flash"])
    assert.equal(typeof h.en["restart.incomplete." + key], "string");
});
for (const [name, result, expected] of [
  [
    "legacy unknown",
    { ok: true, complete: false, failed: 0, cmd_flash: { ok: true } },
    /did not provide a specific cause/,
  ],
  [
    "confirmed host condition",
    {
      ok: true,
      complete: false,
      failed: 0,
      cmd_flash: { ok: true },
      host_written: false,
    },
    /Target host/,
  ],
])
  test(`actual Apply interaction renders ${name} as an error without restart or extra writes`, async () => {
    const h = harness(result);
    let tree;
    const flush = () => new Promise((r) => setImmediate(r));
    await act(async () => {
      tree = create(React.createElement(h.PurgifySection));
      await flush();
    });
    try {
      const apply = tree.root
        .findAllByType("button")
        .find((b) => b.children.join("") === "Apply");
      assert(apply);
      await act(async () => {
        apply.props.onClick();
        await flush();
        await flush();
      });
      const notice = tree.root.findAll(
        (n) =>
          n.type === "span" &&
          n.props.className === "dshpp-notice is-bad" &&
          n.children.join("").startsWith("Apply did not complete"),
      );
      assert(notice.length > 0);
      assert(
        notice.every(
          (n) => n.children.join("") === notice[0].children.join(""),
        ),
      );
      assert.match(notice[0].children.join(""), expected);
      assert.doesNotMatch(
        notice[0].children.join(""),
        /CMD silent|prompt written/i,
      );
      assert.deepEqual(
        h.calls
          .filter((c) => c.method === "POST")
          .map((c) => new URL(c.url, "http://test").pathname),
        ["/dsh-purge/apply"],
      );
      assert(!h.calls.some((c) => c.url.includes("/restart")));
    } finally {
      await act(async () => tree.unmount());
    }
  });

test("runtime reason is visible for HTTP-success incomplete results too", () => {
  const h = harness();
  const message = h.incompleteApplyDetail(
    {
      complete: false,
      cli_repair: {
        ok: false,
        symlink: {
          ok: false,
          reason: "runtime_conflict",
          error: "different link retained",
        },
      },
    },
    h.tr,
  );
  assert.match(message, /runtime_conflict/);
  assert.match(message, /different link retained/);
});

test("Apply HTTP 500 displays runtime details without restart or leaking response fields", async () => {
  const h = harness(
    {
      ok: false,
      error: "Desktop CLI runtime repair failed; original archive retained.",
      cli_repair: {
        ok: false,
        symlink: {
          ok: false,
          reason: "rollback_failed",
          error: "EPERM create",
          rollback: { ok: false, error: "restore denied" },
        },
      },
      prompt: "PRIVATE PROMPT",
    },
    500,
  );
  let tree;
  const flush = () => new Promise((r) => setImmediate(r));
  await act(async () => {
    tree = create(React.createElement(h.PurgifySection));
    await flush();
  });
  try {
    const apply = tree.root
      .findAllByType("button")
      .find((b) => b.children.join("") === "Apply");
    await act(async () => {
      apply.props.onClick();
      await flush();
      await flush();
    });
    const text = JSON.stringify(tree.toJSON());
    assert.match(text, /rollback_failed/);
    assert.match(text, /restore denied/);
    assert.doesNotMatch(text, /PRIVATE PROMPT/);
    assert.deepEqual(
      h.calls
        .filter((c) => c.method === "POST")
        .map((c) => new URL(c.url, "http://test").pathname),
      ["/dsh-purge/apply"],
    );
    assert(!h.calls.some((c) => c.url.includes("/restart")));
  } finally {
    await act(async () => tree.unmount());
  }
});
