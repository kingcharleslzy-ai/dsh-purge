// Composer draft / rewind plumbing ported from YuJunZhiXue/dsh-purge 1.1.71
// (MIT). Original block: client.js 1.1.71 lines 2854-3121, from
// DRAFT_KEY .. openRewoundSession(), plus the module-level host references.
import { apiJson } from "../api/client.js";

export const DRAFT_KEY = "dshp-rewind-draft:";
export const ARM_KEY = "dshp-rewind-arm:";
export const FILL_DELAYS = [0, 50, 180, 400, 800];
export const ARM_TTL_MS = 45 * 1000;

let seenAt = 0;
let host = null;
let workspace = null;
let conversation = null;
let pendingComposer = { sessionId: "", text: "", at: 0 };
let armedFill = { sessionId: "", text: "", at: 0 };

function storage() {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

/** Called from installRewindUi(ctx); mirrors rewindHost/rewindSessions assignment. */
export function bindRewindHost(ctx) {
  host = ctx || null;
  workspace = (ctx && ctx.uiWorkspace) || null;
  conversation = (ctx && ctx.conversation) || null;
}

export function rewindHost() {
  return host;
}

export function hostSessions() {
  return (host && host.sessions) || null;
}

export function rewindWorkspace() {
  return workspace;
}

export function getRewindSeenAt() {
  return seenAt;
}

export function noteRewindAt(at) {
  if (at) seenAt = at;
}

export function rewindText(t, key, fallback) {
  try {
    if (typeof t === "function") {
      const value = t(key);
      if (value && value !== key) return value;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function currentSessionId(sessions) {
  try {
    const selected = workspace?.selection?.getSnapshot?.()?.sessionId;
    if (typeof selected === "string" && selected) return selected;
  } catch {
    /* ignore */
  }
  try {
    const snap = (sessions?.list || host?.sessions?.list)?.getSnapshot?.();
    if (typeof snap?.current === "string" && snap.current) return snap.current;
  } catch {
    /* ignore */
  }
  return "";
}

export function sessionKnown(sessions, sessionId) {
  try {
    const snap = sessions?.list?.getSnapshot?.();
    if (!snap || !sessionId) return false;
    if (snap.byId && Object.prototype.hasOwnProperty.call(snap.byId, sessionId))
      return true;
    if (Array.isArray(snap.ids) && snap.ids.includes(sessionId)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function waitMs(ms) {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.setTimeout)
      window.setTimeout(resolve, ms);
    else setTimeout(resolve, ms);
  });
}

export function isPluginDraft(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  return (
    /^\[MNEMON\]/i.test(value) ||
    /MNEMON RUNTIME MEMORY SNAPSHOT/i.test(value) ||
    /^MNEMON VIEW TOOLS/im.test(value)
  );
}

export function writeDraft(sessionId, text) {
  if (!sessionId) return;
  const value = isPluginDraft(text) ? "" : text || "";
  pendingComposer = { sessionId, text: value, at: Date.now() };
  try {
    storage()?.setItem(DRAFT_KEY + sessionId, value);
  } catch {
    /* ignore */
  }
}

export function peekDraft(sessionId) {
  if (!sessionId) return "";
  if (pendingComposer.sessionId === sessionId && pendingComposer.text)
    return pendingComposer.text;
  try {
    return storage()?.getItem(DRAFT_KEY + sessionId) || "";
  } catch {
    return "";
  }
}

export function clearStoredDraft(sessionId) {
  if (!sessionId) return;
  if (pendingComposer.sessionId === sessionId)
    pendingComposer = { sessionId: "", text: "", at: 0 };
  try {
    storage()?.removeItem(DRAFT_KEY + sessionId);
  } catch {
    /* ignore */
  }
  try {
    storage()?.removeItem(ARM_KEY + sessionId);
  } catch {
    /* ignore */
  }
}

export function armComposerFill(sessionId, text) {
  if (!sessionId || !text || isPluginDraft(text)) return;
  const at = Date.now();
  armedFill = { sessionId, text, at };
  writeDraft(sessionId, text);
  try {
    storage()?.setItem(ARM_KEY + sessionId, String(at));
  } catch {
    /* ignore */
  }
}

export function takeArmedFill(sessionId) {
  if (!sessionId) return "";
  let text = "";
  let at = 0;
  if (armedFill.sessionId === sessionId && armedFill.text) {
    text = armedFill.text;
    at = armedFill.at;
  } else {
    text = peekDraft(sessionId);
    try {
      at = Number(storage()?.getItem(ARM_KEY + sessionId) || 0);
    } catch {
      at = 0;
    }
  }
  if (!text || !at || Date.now() - at > ARM_TTL_MS) {
    if (text && (!at || Date.now() - at > ARM_TTL_MS))
      clearStoredDraft(sessionId);
    return "";
  }
  clearStoredDraft(sessionId);
  armedFill = { sessionId: "", text: "", at: 0 };
  return text;
}

export function conversationFace() {
  if (conversation) return conversation;
  if (host?.conversation) return host.conversation;
  if (typeof host?.get === "function") {
    try {
      return host.get("conversation");
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function conversationInput(sessionId) {
  try {
    const input = conversationFace()?.input;
    if (!input || !sessionId) return null;
    if (typeof input.shell === "function") {
      try {
        return input.shell(sessionId);
      } catch {
        /* session not retained yet */
      }
    }
    const sessions = host?.sessions;
    const actx =
      typeof sessions?.scope === "function"
        ? sessions.scope(sessionId)
        : undefined;
    if (typeof input.for === "function" && actx) return input.for(actx);
    return null;
  } catch {
    return null;
  }
}

export function liveDraft(sessionId, inputActions) {
  try {
    const fromActions = inputActions?.state?.getSnapshot?.()?.draft;
    if (typeof fromActions === "string") return fromActions;
  } catch {
    /* ignore */
  }
  try {
    const draft = conversationInput(sessionId)?.state?.getSnapshot?.()?.draft;
    if (typeof draft === "string") return draft;
  } catch {
    /* ignore */
  }
  return "";
}

export function hostSetDraft(sessionId, text) {
  if (!sessionId) return false;
  try {
    const input = conversationInput(sessionId);
    if (input && typeof input.setDraft === "function") {
      input.setDraft(text || "");
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function fillComposer(inputActions, text) {
  if (inputActions && typeof inputActions.setDraft === "function") {
    try {
      inputActions.setDraft(text || "");
    } catch {
      /* ignore */
    }
  }
}

export function scheduleComposerFill(sessionId, text, inputActions) {
  if (!sessionId || !text || isPluginDraft(text)) return () => {};
  let stopped = false;
  let filled = false;
  const timers = [];
  const setTimer =
    typeof window !== "undefined" && window.setTimeout
      ? (fn, ms) => window.setTimeout(fn, ms)
      : (fn, ms) => setTimeout(fn, ms);
  const clearTimer =
    typeof window !== "undefined" && window.clearTimeout
      ? (id) => window.clearTimeout(id)
      : (id) => clearTimeout(id);
  const tryFill = () => {
    if (stopped) return;
    const current = liveDraft(sessionId, inputActions);
    if (filled && current !== text) {
      stopped = true;
      return;
    }
    if (current && current !== text) {
      stopped = true;
      return;
    }
    fillComposer(inputActions, text);
    hostSetDraft(sessionId, text);
    filled = true;
  };
  for (const ms of FILL_DELAYS) timers.push(setTimer(tryFill, ms));
  return () => {
    stopped = true;
    for (const id of timers) {
      try {
        clearTimer(id);
      } catch {
        /* ignore */
      }
    }
  };
}

export function scheduleEchoClear(sessionId, inputActions) {
  if (!sessionId) return () => {};
  let last = "";
  let stopped = false;
  const timers = [];
  const setTimer =
    typeof window !== "undefined" && window.setTimeout
      ? (fn, ms) => window.setTimeout(fn, ms)
      : (fn, ms) => setTimeout(fn, ms);
  const clearTimer =
    typeof window !== "undefined" && window.clearTimeout
      ? (id) => window.clearTimeout(id)
      : (id) => clearTimeout(id);
  const tryClear = () => {
    if (stopped || !last) return;
    const current = String(liveDraft(sessionId, inputActions) || "").trim();
    if (!current) {
      stopped = true;
      return;
    }
    if (current !== last) return;
    fillComposer(inputActions, "");
    hostSetDraft(sessionId, "");
    clearStoredDraft(sessionId);
    stopped = true;
  };
  apiJson("/dsh-purge/last-user?sessionId=" + encodeURIComponent(sessionId))
    .then((data) => {
      if (stopped) return;
      last = String(data?.text || "").trim();
      if (!last || isPluginDraft(last)) return;
      tryClear();
      for (const ms of [0, 50, 180, 400]) timers.push(setTimer(tryClear, ms));
    })
    .catch(() => {});
  return () => {
    stopped = true;
    for (const id of timers) {
      try {
        clearTimer(id);
      } catch {
        /* ignore */
      }
    }
  };
}

export async function dropInheritedQueue(sessions, sessionId) {
  if (!sessions || !sessionId) return;
  const drop = async () => {
    try {
      const actx =
        typeof sessions.scope === "function"
          ? sessions.scope(sessionId)
          : undefined;
      const face =
        typeof sessions.sessionOf === "function"
          ? sessions.sessionOf(actx)
          : undefined;
      const queue = face?.getSnapshot?.()?.queue || [];
      for (const item of queue) {
        const id = item?.id || item?.itemId;
        if (!id) continue;
        try {
          await face.updateQueue?.(id, { kind: "remove" });
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
  };
  await drop();
  if (typeof window !== "undefined" && window.setTimeout)
    window.setTimeout(() => {
      drop();
    }, 80);
}

export async function openRewoundSession(sessions, sessionId) {
  if (!sessionId) return;
  let lastError = null;
  for (let attempt = 0; attempt < 25; attempt += 1) {
    if (
      sessions &&
      typeof sessions.refresh === "function" &&
      !sessionKnown(sessions, sessionId)
    ) {
      try {
        await sessions.refresh();
      } catch (error) {
        lastError = error;
      }
    }
    const known = sessionKnown(sessions, sessionId);
    if (known || typeof sessions?.open === "function") {
      try {
        if (workspace && typeof workspace.openSession === "function") {
          workspace.openSession(sessionId);
        } else if (typeof sessions?.open === "function") {
          sessions.open(sessionId);
        } else {
          throw new Error("打不开回退后的会话");
        }
        const selected = workspace?.selection?.getSnapshot?.()?.sessionId;
        if (!workspace || selected === sessionId) {
          await dropInheritedQueue(sessions, sessionId);
          if (typeof window !== "undefined" && window.setTimeout)
            window.setTimeout(() => {
              dropInheritedQueue(sessions, sessionId);
            }, 250);
          return;
        }
      } catch (error) {
        lastError = error;
      }
    }
    await waitMs(120);
  }
  throw new Error((lastError && lastError.message) || "回退后的会话没有打开");
}
