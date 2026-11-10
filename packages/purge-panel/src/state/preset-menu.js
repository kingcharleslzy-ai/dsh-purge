// The native menu is portalled. Its arrow-key handler walks enabled buttons,
// so a visually collapsed row must also leave that walk.
export function bindPresetMenu(doc, listPresets) {
  let turn = 0;
  let cleanup = () => {};
  function open(event) {
    const trigger = event.target.closest?.('button[aria-haspopup="menu"]');
    const label = trigger?.querySelector('[class$="_seatLabel"]');
    if (!label || trigger.getAttribute("aria-expanded") !== "false") return;
    const prefix = [...label.classList]
      .find((x) => x.endsWith("_seatLabel"))
      ?.slice(0, -"_seatLabel".length);
    if (!prefix || !trigger.classList.contains(prefix + "_seat")) return;
    const revision = ++turn;
    cleanup();
    doc.defaultView.setTimeout(async () => {
      if (revision !== turn || trigger.getAttribute("aria-expanded") !== "true")
        return;
      const menus = [...doc.querySelectorAll('[role="menu"]')].filter(
        (menu) => menu.getElementsByClassName(prefix + "_itemName").length,
      );
      if (menus.length !== 1) return;
      const menu = menus[0];
      let rows;
      try {
        rows = (await listPresets())?.value?.presets;
      } catch {
        return;
      }
      if (
        !Array.isArray(rows) ||
        revision !== turn ||
        !menu.isConnected ||
        trigger.getAttribute("aria-expanded") !== "true"
      )
        return;
      const hidden = new Set();
      function restore(button) {
        button.disabled = false;
        button.removeAttribute("data-purge-collapsed-alias");
        hidden.delete(button);
      }
      function reconcile() {
        const rendered = new Map();
        for (const button of menu.querySelectorAll('button[role="menuitem"]')) {
          const name = button.getElementsByClassName(prefix + "_itemName")[0]
            ?.textContent;
          const description = button.getElementsByClassName(
            prefix + "_itemDesc",
          )[0]?.textContent;
          const matches = rows.filter(
            (row) => row.name === name && row.description === description,
          );
          if (matches.length === 1) rendered.set(button, matches[0]);
        }
        const collapse = new Set();
        for (const [button, row] of rendered) {
          const suffix = /^unrestricted-child-([a-f0-9]{10})$/.exec(
            row.id,
          )?.[1];
          const marker = "（历史兼容 · " + suffix + "）";
          if (
            !suffix ||
            !row.name?.endsWith(marker) ||
            row.broken !== undefined ||
            row.isDefault ||
            row.name === label.textContent ||
            button.contains(doc.activeElement) ||
            (button.disabled && !hidden.has(button))
          )
            continue;
          const canonical = row.name.slice(0, -marker.length);
          if (
            canonical.endsWith(" · 子任务") &&
            [...rendered.values()].some(
              (other) =>
                /^unrestricted-child-[a-f0-9]{10}$/.test(other.id) &&
                other.name === canonical &&
                other.description === row.description &&
                other.broken === undefined,
            )
          )
            collapse.add(button);
        }
        for (const button of hidden) if (!collapse.has(button)) restore(button);
        for (const button of collapse) {
          button.disabled = true;
          button.setAttribute("data-purge-collapsed-alias", "");
          hidden.add(button);
        }
      }
      reconcile();
      const observer = new doc.defaultView.MutationObserver(() => {
        if (
          !menu.isConnected ||
          trigger.getAttribute("aria-expanded") !== "true"
        )
          cleanup();
        else reconcile();
      });
      observer.observe(menu, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      observer.observe(trigger, {
        attributes: true,
        attributeFilter: ["aria-expanded"],
      });
      observer.observe(doc.body, { childList: true });
      cleanup = () => {
        observer.disconnect();
        for (const button of hidden) restore(button);
        cleanup = () => {};
      };
    });
  }
  doc.addEventListener("click", open, true);
  return () => {
    turn++;
    cleanup();
    doc.removeEventListener("click", open, true);
  };
}
