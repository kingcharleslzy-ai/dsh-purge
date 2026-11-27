import React from "react";
import * as ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";

const slots = new Map();
window.__ModuleLoader__ = {
  load({ factory }) {
    const plugin = factory((name) => (name === "react" ? React : ReactDOM));
    plugin.apply({
      locale: { register() {}, bind: () => (key) => key },
      slots: {
        inject: (_, fn) => fn(),
        register: (spec, component) =>
          slots.set(spec.name + ":" + (spec.key || spec.id), component),
      },
      inject() {},
      effect() {},
    });
  },
};

const pause = () => new Promise((resolve) => setTimeout(resolve, 20));
async function until(check, label) {
  for (let i = 0; i < 200; i++) {
    if (check()) return;
    await pause();
  }
  throw Error(label);
}

window.testEntries = async () => {
  const root = createRoot(document.querySelector("main"));
  const select = (id) =>
    document.querySelector("#" + id + ' select[aria-label="更新检查间隔"]');
  const entry = (id, key) =>
    React.createElement(
      "div",
      { id, key: id },
      React.createElement(slots.get(key), { view: "page" }),
    );
  if (!slots.get("sidebar.panellist:dsh-purge"))
    throw Error("missing sidebar link");
  const sidebar = entry("sidebar", "main:dsh-purge");
  const bundle = entry("bundle", "plugins.bundle.config:dsh-purge-community");
  const row = entry("row", "plugins.row.config:dsh-purge-community#dsh-purge");
  root.render([sidebar, bundle]);
  await until(
    () => select("sidebar")?.value === "6" && select("bundle")?.value === "6",
    "initial load",
  );
  async function change(from, to, hours) {
    select(from).value = hours;
    select(from).dispatchEvent(new Event("change", { bubbles: true }));
    await until(
      () => select(to)?.value === hours && !select(from)?.disabled,
      from + " → " + to,
    );
  }
  await change("sidebar", "bundle", "12");
  await change("bundle", "sidebar", "24");
  root.render(row);
  await until(() => select("row")?.value === "24", "row detail after remount");
  // Exercise the shipped page, not just the count helpers. Tab return and
  // manual refresh must update both displays from the same request.
  const originalFetch = window.fetch;
  let second = "pending";
  let editableReads = 0;
  window.fetch = (input, init) => {
    const path = new URL(input, location.href).pathname;
    if (path.endsWith("/override") || path.endsWith("/own-servers"))
      editableReads++;
    if (!path.endsWith("/dsh-purge/status")) return originalFetch(input, init);
    return Promise.resolve(
      Response.json(
        second === "error"
          ? { ok: false, error: "test-read-failure" }
          : {
              ok: true,
              ai_base: "fixture",
              patch_status: { 1: "applied", 2: second },
            },
      ),
    );
  };
  try {
    const tabs = document.querySelectorAll("#row [role=tab]");
    const scan = () => document.querySelector("#row .dshpp-scan").click();
    const both = (n) =>
      document
        .querySelector("#row .dshpp-strip")
        ?.textContent.includes(n + "/2") &&
      document.querySelector("#row .dshpp-fold-n")?.textContent === n + " / 2";
    scan();
    await until(() => both(1), "initial 1/2");
    tabs[2].click();
    await until(
      () => tabs[2].getAttribute("aria-selected") === "true",
      "left status",
    );
    second = "applied";
    tabs[0].click();
    await until(() => both(2), "return refreshed header and detail together");
    second = "error";
    scan();
    await until(
      () =>
        document
          .querySelector("#row .dshpp-strip")
          ?.textContent.includes("evidence.unknown") &&
        document.querySelector("#row .dshpp-fold-n")?.textContent ===
          "detail.unknown",
      "failed refresh invalidates both views",
    );
    second = "pending";
    scan();
    await until(() => both(1), "successful retry");
    if (editableReads !== 0)
      throw Error("status refresh reloaded editable fields");
  } finally {
    window.fetch = originalFetch;
  }
  root.unmount();
};
