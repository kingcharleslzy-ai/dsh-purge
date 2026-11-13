// UI derived from YuJunZhiXue/dsh-purge 1.1.71 (MIT). See LICENSE.
import { h, react } from "./shared/react.js";
import { DETAIL_CARD_CSS, NATIVE_CSS, PURGE_CSS } from "./styles/index.js";
import { useDock, startGrantSync } from "./state/dock.js";
import { AuthGate } from "./components/auth.js";
import { NS, setTranslate, zh, en } from "./shared/locale.js";
import { StatusSection, RowConfig } from "./components/detail-page.js";
import { PatchBadge, BUNDLE_NAME, ROW_ID } from "./components/detail-info.js";
import { bindSessionContext } from "./state/session-context.js";
import { bindPresetMenu } from "./state/preset-menu.js";
import { installLegacyVisibility } from "./state/legacy-visibility.js";
import { installRewindUi } from "./components/rewind.js";
import { WelcomeNotice } from "./components/welcome.js";
import { EnvAdaptSendGate } from "./components/env-gate.js";

export const name = __COMMUNITY__ ? "dsh-purge-community" : "dsh-purge-panel";

export const inject = ["slots", "locale"];

export function PurgeIcon({ size = 20 } = {}) {
  return h(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.6,
      "aria-hidden": true,
    },
    h("path", { d: "M4 7h16M4 17h16" }),
    h("circle", { cx: 9, cy: 7, r: 3, fill: "none" }),
    h("circle", { cx: 15, cy: 17, r: 3, fill: "none" }),
  );
}

export function PanelOverlays() {
  const st = useDock();
  return h(
    react.Fragment,
    null,
    h("style", null, PURGE_CSS),
    // Restored from 1.1.71 apply(): shell.overlay carried the welcome notice
    // and the red-team environment gate next to the dock.
    h(WelcomeNotice, {
      repo: __COMMUNITY__
        ? "https://github.com/kingcharleslzy-ai/dsh-purge"
        : undefined,
    }),
    h(EnvAdaptSendGate),
    st.authOpen ? h(AuthGate, { pending: st.pending }) : null,
  );
}

export function apply(ctx) {
  ctx.effect(() => installLegacyVisibility(), "panel legacy visibility");
  // One stylesheet for every surface this plugin paints (panel, detail page,
  // config page). Installing it with the fiber keeps it out of the render tree:
  // two pages open at once still share one <style>, the way the host packages and
  // dsh-ops do it. Registered after the legacy visibility gate so that gate keeps
  // being the first effect this plugin installs.
  ctx.effect(() => {
    // Host-side harnesses apply this module without a DOM; styling is a browser
    // concern and must not make those runs fail.
    if (typeof document === "undefined" || !document.head) return () => {};
    const el = document.createElement("style");
    el.setAttribute("data-dsh-purge-styles", "1");
    el.textContent = PURGE_CSS + "\n" + NATIVE_CSS + "\n" + DETAIL_CARD_CSS;
    document.head.append(el);
    return () => el.remove();
  }, "dsh-purge styles");
  ctx.inject(["sessions", "uiWorkspace"], (host) => {
    host.effect(() => bindSessionContext(host), "panel session context");
  });
  ctx.inject(["remote", "remote.agentPresets"], (host) =>
    host.effect(
      () => bindPresetMenu(document, () => host.remote.agentPresets.list()),
      "preset menu aliases",
    ),
  );
  ctx.effect(startGrantSync, "panel grant sync");
  // Restored from 1.1.71 apply(): conversation.input.right rewind button.
  ctx.inject(["sessions", "uiWorkspace", "conversation"], (host) =>
    installRewindUi(host),
  );
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "panel locale");
  const t = ctx.locale.bind(NS);
  setTranslate(t);
  ctx.slots.inject("shell.overlay", () =>
    ctx.slots.register(
      {
        name: "shell.overlay",
        id: "dsh-purge-panel-overlays",
        order: 60,
      },
      PanelOverlays,
    ),
  );
  // 状态区走 detail.section（与 dsh-ops 同一处），bundle 页不再有配置面。
  ctx.slots.inject("plugins.detail.section", () =>
    ctx.slots.register(
      {
        name: "plugins.detail.section",
        id: "dsh-purge-status",
        order: 50,
        inject: () => ({ t }),
      },
      StatusSection,
    ),
  );
  // 行页：summary 一行摘要，page = 状态 + 业务 + 配置（宿主按我们的行 id 派发）。
  ctx.slots.inject("plugins.row.config", () =>
    ctx.slots.register(
      {
        name: "plugins.row.config",
        key: BUNDLE_NAME + "#" + ROW_ID,
        inject: () => ({ t }),
      },
      RowConfig,
    ),
  );
  // 标题旁补丁计数；detail.* 会广播到每个插件页，组件自己过滤。
  ctx.slots.inject("plugins.detail.badge", () =>
    ctx.slots.register(
      {
        name: "plugins.detail.badge",
        id: "dsh-purge-patches",
        order: 10,
        inject: () => ({ t }),
      },
      PatchBadge,
    ),
  );
}
