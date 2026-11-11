// Run CHROME_BIN=<Chrome executable> node test/rewind-browser.mjs.
// Use a disposable profile and the real panel components. No DSH is started.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildSync } from "esbuild";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "rewind-menu-"));
const html = path.join(root, "index.html");
try {
  buildSync({
    stdin: {
      contents: `
        import React from "react";
        import {checkPresetMenu} from "./test/preset-menu.fixture.js";
        import {createRoot} from "react-dom/client";
        import {flushSync} from "react-dom";
        import {RewindButton, RewindFallback} from "./src/components/rewind.js";
        import {EnvironmentDialog} from "./src/components/env-gate.js";
        const slot = document.querySelector("#slot");
        const root = createRoot(slot);
        const scroll = document.querySelector("main");
        for (const View of [RewindButton, RewindFallback]) {
          scroll.scrollTop = 0;
          flushSync(() => root.render(React.createElement(View, {sessionId:"fixture"})));
          flushSync(() => slot.querySelector("button").click());
          for (const y of [0, 90]) {
            scroll.scrollTop = y;
            flushSync(() => scroll.dispatchEvent(new Event("scroll")));
            const menu = document.querySelector("[role=menu]");
            const anchor = slot.querySelector("button").getBoundingClientRect();
            const box = menu.getBoundingClientRect();
            if (menu.parentElement !== document.body || Math.abs(anchor.top-box.bottom-8)>1 ||
                Math.abs(anchor.right-box.right)>1) throw Error("menu misplaced at scrollTop=" + y);
          }
          flushSync(() => document.body.dispatchEvent(new MouseEvent("mousedown",{bubbles:true})));
          if(document.querySelector("[role=menu]")) throw Error("menu did not dismiss");
          flushSync(() => root.render(null));
        }
        const roster = document.createElement("ul");
        document.body.append(roster);
        function card(id, title, pressed = false, broken = false) {
          const row = document.createElement("li");
          row.dataset.agentPresetId = id;
          const btn = document.createElement("button");
          btn.setAttribute("aria-pressed", String(pressed));
          btn.setAttribute("aria-disabled", String(broken));
          const label = document.createElement("span");
          label.title = title;
          btn.append(label);
          row.append(btn);
          roster.append(row);
          return row;
        }
        const name = "普通笔记 · 子任务";
        const historical = name + "（历史兼容 · aaaaaaaaaa）";
        const alias = card("unrestricted-child-aaaaaaaaaa", historical);
        const secondAlias = card("unrestricted-child-eeeeeeeeee", name + "（历史兼容 · eeeeeeeeee）");
        const aliases = [alias, secondAlias];
        const visible = row => getComputedStyle(row).display !== "none";
        if (!aliases.every(visible)) throw Error("historical rows hidden before current child loads");
        const stable = card("unrestricted-child-bbbbbbbbbb", name);
        if (aliases.some(visible) || !visible(stable)) throw Error("duplicate historical cards in settings (#188)");
        for (const row of [card("unrestricted-child-cccccccccc", historical, true),
          card("unrestricted-child-dddddddddd", historical, false, true),
          card("user-notes", historical)]) if (!visible(row)) throw Error("protected row hidden");
        stable.firstChild.setAttribute("aria-disabled","true");
        if (!aliases.every(visible)) throw Error("broken canonical child hides working alias");
        stable.firstChild.setAttribute("aria-disabled", "false");
        stable.remove();
        if (!aliases.every(visible) || !aliases.every(row => roster.contains(row))) {
          throw Error("removing current child did not restore both historical cards");
        }
        roster.remove();
        const settings = document.createElement("dialog");
        document.body.append(settings);
        settings.showModal();
        let closed = false;
        flushSync(() => root.render(React.createElement(EnvironmentDialog, {
          title: "Environment", onDismiss: () => { closed = true; },
        }, React.createElement("button", null, "Dismiss"))));
        const modal = slot.querySelector("dialog");
        const box = modal.getBoundingClientRect();
        if (!modal.matches(":modal") || Math.abs(box.x + box.width / 2 - innerWidth / 2) > 2 ||
            Math.abs(box.y + box.height / 2 - innerHeight / 2) > 2 ||
            !modal.contains(document.elementFromPoint(innerWidth / 2, innerHeight / 2))) {
          throw Error("environment dialog obscured by settings or outside viewport center");
        }
        modal.dispatchEvent(new Event("cancel", { cancelable: true }));
        if (!closed) throw Error("environment dialog did not receive cancel");
        flushSync(() => root.render(null));
        if (!settings.matches(":modal")) throw Error("underlying settings unexpectedly closed");
        settings.close();
        checkPresetMenu(document).then(() => {document.querySelector("output").textContent="passed";},
          err => {document.querySelector("output").textContent=err.message;});
      `,
      resolveDir: fileURLToPath(new URL("../", import.meta.url)),
    },
    bundle: true,
    define: { "process.env.NODE_ENV": '"production"' },
    outfile: path.join(root, "fixture.js"),
  });
  fs.writeFileSync(
    html,
    `<!doctype html><meta charset="utf-8"><style>
    ${fs.readFileSync(new URL("../src/styles/base.css", import.meta.url), "utf8")}
    main{height:500px;overflow:auto}section{height:1200px;padding:300px 0 0 460px}
    #slot{width:max-content;will-change:transform}
    </style><main><section><div id="slot"></div></section></main>
    <output>pending</output><script src="fixture.js"></script>`,
  );
  const dom = execFileSync(
    process.env.CHROME_BIN || "google-chrome",
    [
      "--headless",
      "--disable-extensions",
      "--no-first-run",
      "--user-data-dir=" + path.join(root, "profile"),
      "--window-size=1000,700",
      "--virtual-time-budget=1000",
      "--dump-dom",
      pathToFileURL(html).href,
    ],
    { encoding: "utf8", timeout: 30000 },
  );
  assert.match(dom, /<output>passed<\/output>/);
  console.log(
    "PASS: both rewind menus follow the anchor through nested scrolling and dismiss outside",
  );
} finally {
  fs.rmSync(root, {
    recursive: true,
    force: true,
    maxRetries: 3,
    retryDelay: 100,
  });
}
