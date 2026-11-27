let host = null;

export function bindConversationAccess(ctx) {
  host = ctx;
  return () => {
    if (host === ctx) host = null;
  };
}

export function hostSessions() {
  return (host && host.sessions) || null;
}

export function currentSessionId(sessions) {
  try {
    const selected = host?.uiWorkspace?.selection?.getSnapshot?.()?.sessionId;
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

function conversationFace() {
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
