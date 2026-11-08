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
        import {createRoot} from "react-dom/client";
        import {flushSync} from "react-dom";
        import {RewindButton, RewindFallback} from "./src/components/rewind.js";
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
        document.querySelector("output").textContent="passed";
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
