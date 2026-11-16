// Red-team mode detection + composer send-control matching, ported from
// YuJunZhiXue/dsh-purge 1.1.71 (MIT). Original block: client.js 1.1.71
// lines 7994-8132: isRedteamPresetId / readSessionAgentPreset /
// isRedteamModeActive / looksLikeSendControl.
import { currentSessionId, hostSessions } from "./rewind-draft.js";

export function isRedteamPresetId(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  if (text === "redteam") return true;
  if (/^red[\s_-]*team$/i.test(text)) return true;
  const label = text
    .replace(/not\s+red[\s_-]*team/gi, "")
    .replace(/non[- ]?red[\s_-]*team/gi, "");
  if (/red[\s_-]*team/i.test(label)) return true;
  return false;
}

export function readSessionAgentPreset(sess) {
  if (!sess || typeof sess !== "object") return "";
  try {
    const pv = sess.projectionValues;
    if (pv && typeof pv.agentPreset === "string") return pv.agentPreset;
  } catch {
    /* ignore */
  }
  try {
    if (typeof sess.agentPreset === "string") return sess.agentPreset;
  } catch {
    /* ignore */
  }
  try {
    const header = sess.header;
    if (header && typeof header.agentPreset === "string")
      return header.agentPreset;
  } catch {
    /* ignore */
  }
  return "";
}

export function isRedteamModeActive() {
  try {
    const sessions = hostSessions();
    const sid = currentSessionId(sessions);
    if (sid && sessions) {
      try {
        const snap =
          typeof sessions.list?.getSnapshot === "function"
            ? sessions.list.getSnapshot()
            : null;
        const sess = snap && snap.byId ? snap.byId[sid] : null;
        if (isRedteamPresetId(readSessionAgentPreset(sess))) return true;
      } catch {
        /* ignore */
      }
      try {
        const actx =
          typeof sessions.scope === "function"
            ? sessions.scope(sid)
            : undefined;
        const face =
          typeof sessions.sessionOf === "function"
            ? sessions.sessionOf(actx)
            : undefined;
        const faceSnap =
          face && typeof face.getSnapshot === "function"
            ? face.getSnapshot()
            : face;
        if (isRedteamPresetId(readSessionAgentPreset(faceSnap))) return true;
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
  if (typeof document === "undefined" || !document.querySelector) return false;
  /* New sessions may select a preset before persisting it to the session.
   * Prefer semantic data attributes, then class and text fallbacks. */
  try {
    const semantic = document.querySelector(
      "[data-agent-preset='redteam'], [data-preset-id='redteam'], [data-mode='redteam']",
    );
    if (semantic) return true;
    const nodes = document.querySelectorAll(
      "[class*='seat' i][class*='label' i], [class*='seatLabel' i], button[class*='seat' i], [role='button'][class*='seat' i]",
    );
    for (const el of nodes) {
      const text = String(el.textContent || "")
        .replace(/\s+/g, " ")
        .trim();
      if (/red ?team(?: mode)?/i.test(text) || /^RedTeam\b/i.test(text))
        return true;
    }
  } catch {
    /* ignore */
  }
  try {
    const labels = document.querySelectorAll(
      "[class*='label' i][class*='preset' i], [class*='presetLabel' i], [title*='Red Team' i], [title*='RedTeam']",
    );
    for (const el of labels) {
      const text = String(el.textContent || "").trim();
      if (/red ?team(?: mode)?/i.test(text) || /^RedTeam\b/i.test(text))
        return true;
      if (isRedteamPresetId(text)) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function looksLikeSendControl(el) {
  if (!el || el.nodeType !== 1) return false;
  const btn = el.closest("button, [role='button']");
  if (!btn) return false;
  if (btn.closest(".dshp-dock, .dshp-auth-mask, .rt-dock, .dshp-env-gate"))
    return false;
  const label = [
    btn.getAttribute("aria-label"),
    btn.getAttribute("title"),
    btn.getAttribute("data-testid"),
    btn.textContent,
  ]
    .filter(Boolean)
    .join(" ");
  if (/\bStop\b/i.test(label) && !/\bSend\b/i.test(label))
    return false;
  if (/\bSubmit\b|Send(?!\s*feedback)/i.test(label)) return true;
  /* Primary composer button inside data-composer-card. */
  try {
    const card = btn.closest("[data-composer-card], [data-composer-seat]");
    if (card) {
      const cls = String(btn.className || "");
      if (/primary/i.test(cls) && btn.querySelector("svg")) return true;
    }
  } catch {
    /* ignore */
  }
  if (btn.type === "submit") {
    const form = btn.closest("form");
    if (form && form.querySelector("textarea, [contenteditable='true']"))
      return true;
  }
  return false;
}
