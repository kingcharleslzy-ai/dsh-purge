import { bindPresetMenu } from "../src/state/preset-menu.js";

export async function checkPresetMenu(doc) {
  const parent = doc.createElement("div");
  doc.body.append(parent);
  parent.innerHTML =
    '<button aria-haspopup="menu" aria-expanded="false" class="scope_seat"><span class="scope_seatLabel">普通笔记</span></button>';
  const trigger = parent.firstChild;
  const name = "笔记 · 子任务";
  const rows = [
    { id: "unrestricted-child-aaaaaaaaaa", name, description: "笔记" },
    ...["bbbbbbbbbb", "cccccccccc", "dddddddddd"].map((hash) => ({
      id: "unrestricted-child-" + hash,
      name: name + "（历史兼容 · " + hash + "）",
      description: "笔记",
    })),
    {
      id: "user-mode",
      name: name + "（历史兼容 · eeeeeeeeee）",
      description: "笔记",
    },
  ];
  rows[2].isDefault = true;
  const menu = doc.createElement("div");
  menu.setAttribute("role", "menu");
  function render() {
    menu.replaceChildren(
      ...rows.map((row) => {
        const b = doc.createElement("button");
        b.setAttribute("role", "menuitem");
        b.innerHTML =
          '<span class="scope_itemName"></span><span class="scope_itemDesc"></span>';
        b.firstChild.textContent = row.name;
        b.lastChild.textContent = row.description;
        return b;
      }),
    );
  }
  trigger.onclick = () => {
    trigger.setAttribute("aria-expanded", "true");
    render();
    doc.body.append(menu);
  };
  const stop = bindPresetMenu(doc, async () => ({
    ok: true,
    value: { presets: rows },
  }));
  const tick = () => new Promise((resolve) => setTimeout(resolve, 5));
  try {
    trigger.firstChild.textContent = rows[3].name;
    trigger.click();
    await tick();
    const hidden = menu.children[1];
    if (!hidden.disabled || getComputedStyle(hidden).display !== "none")
      throw Error("menu alias in keyboard or visual roster");
    if ([0, 2, 3, 4].some((i) => menu.children[i].disabled))
      throw Error("protected menu option hidden");
    hidden.previousElementSibling.remove();
    await tick();
    if (hidden.disabled)
      throw Error("only available alias hidden after refresh");
    render();
    await tick();
    stop();
    if (menu.querySelector("button:disabled, [data-purge-collapsed-alias]"))
      throw Error("disposal did not restore menu");
  } finally {
    stop();
    menu.remove();
    parent.remove();
  }
}
