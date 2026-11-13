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
  root.unmount();
};
