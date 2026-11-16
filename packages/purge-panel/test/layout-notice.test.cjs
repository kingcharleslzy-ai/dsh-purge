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
  assert.match(legacy, /load source is unconfirmed/);
  assert.doesNotMatch(legacy, /current process still loads/);
  const unpacked = render({
    asar_still_sealed: false,
    host_layout: {
      state: "unpacked_entry",
      process: { matches_target: true },
      note: "The entry location cannot prove that later writes have been reloaded.",
      disk: { archive_exists: false },
    },
  });
  // Collapsed details retain the explanation without asserting runtime reload.
  assert.match(unpacked, /cannot prove/);
  assert.match(unpacked, /Started from the unpacked directory/);
  assert.doesNotMatch(unpacked, /loaded app\.asar/);
  const different = render({
    asar_still_sealed: true,
    host_layout: {
      note: "The current service entry differs from the selected target installation.",
      disk: { archive_exists: true },
    },
  });
  assert.match(different, /differs from the selected target installation/);
  assert.match(different, /app.asar remains on the target disk/);
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
    assert.doesNotMatch(html, /handoff complete/i);
    assert.match(html, /183/);
    assert.match(html, /&lt;failure&gt;/);
  }
});

test("only a confirmed Web target without desktop evidence or failures gets a neutral notice", () => {
  const web = {
    ok: true,
    surface: "web",
    desktop_exe: "",
    desktop_install: "",
    host_layout: {
      state: "unknown_runtime",
      disk: { surface: "web", archive_exists: null, unpacked_exists: null },
      process: { entry_layout: "unknown", matches_target: null },
    },
    asar_handoff: { phase: "unknown_target" },
  };
  const render = (info) =>
    renderToStaticMarkup(React.createElement(LayoutNotice, { info }));
  const html = render(web);
  assert.match(html, /not applicable \(web host\)/);
  assert.match(html, /unknown_runtime/);
  assert.doesNotMatch(html, /dshpp-warn|handoff complete/i);
  for (const info of [
    { ...web, surface: "desktop" },
    { ...web, desktop_exe: "host.exe" },
    { ...web, asar_still_sealed: true },
    { ...web, host_layout: { ...web.host_layout, state: "unknown_target" } },
    {
      ...web,
      host_layout: {
        ...web.host_layout,
        disk: { ...web.host_layout.disk, archive_exists: true },
      },
    },
    {
      ...web,
      host_layout: { ...web.host_layout, errors: [{ code: "EACCES" }] },
    },
    { ...web, asar_handoff: { phase: "failed", detail: "access denied" } },
    { ...web, surface: undefined },
  ]) {
    assert.match(render(info), /dshpp-warn/);
    assert.doesNotMatch(render(info), /not applicable \(web host\)/);
  }
});
