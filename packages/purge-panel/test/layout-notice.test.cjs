const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const vm = require("node:vm");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { buildSync } = require("esbuild");
const code = buildSync({
  entryPoints: [path.join(__dirname, "../src/components/page.js")],
  bundle: true,
  write: false,
  format: "cjs",
  platform: "browser",
  loader: { ".css": "text" },
  external: ["react", "react-dom"],
  define: { __PANEL_VERSION__: '"test"', __COMMUNITY__: "true" },
}).outputFiles[0].text;
const sandbox = { module: { exports: {} }, require, console };
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(code, sandbox);
const { LayoutNotice } = sandbox.module.exports;
test("layout notice never equates a disk archive or absent archive with loaded code", () => {
  const render = (info) =>
    renderToStaticMarkup(React.createElement(LayoutNotice, { info }));
  const legacy = render({ asar_still_sealed: true });
  assert.match(legacy, /加载来源尚未确认/);
  assert.doesNotMatch(legacy, /当前进程仍加载/);
  const unpacked = render({
    asar_still_sealed: false,
    host_layout: {
      state: "unpacked_entry",
      process: { matches_target: true },
      note: "入口位置不能证明之后写入的内容已重新加载。",
      disk: { archive_exists: false },
    },
  });
  // 换包正常时说明折进 details，但内容仍在，绝不能出现"已加载"这种断言
  assert.match(unpacked, /不能证明/);
  assert.match(unpacked, /已从解包目录启动/);
  assert.doesNotMatch(unpacked, /已加载 app\.asar/);
  const different = render({
    asar_still_sealed: true,
    host_layout: {
      note: "当前服务入口与所选目标安装不同。",
      disk: { archive_exists: true },
    },
  });
  assert.match(different, /安装不同/);
  assert.match(different, /目标磁盘仍有 app.asar/);
});

test("unknown, different and unreadable layouts never claim handoff completion", () => {
  for (const state of ["unknown_runtime", "different_instance", "unreadable"]) {
    const html = renderToStaticMarkup(
      React.createElement(LayoutNotice, {
        info: {
          asar_still_sealed: false,
          host_layout: {
            state,
            process: { matches_target: state !== "different_instance" },
            disk: { archive_exists: false },
            note: state,
          },
          asar_handoff: {
            phase: "failed",
            detail: "<failure>",
            error: { win32_code: 183 },
          },
        },
      }),
    );
    assert.doesNotMatch(html, /换包完成/);
    assert.match(html, /183/);
    assert.match(html, /&lt;failure&gt;/);
  }
});
