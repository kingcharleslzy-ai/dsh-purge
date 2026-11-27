// Headless compatibility for callers using the existing rewind HTTP API.
import { useEffect } from "../shared/react.js";
import { apiJson } from "../api/client.js";
import {
  armComposerFill,
  bindRewindHost,
  currentSessionId,
  getRewindSeenAt,
  hostSessions,
  isPluginDraft,
  noteRewindAt,
  openRewoundSession,
  scheduleComposerFill,
  scheduleEchoClear,
  takeArmedFill,
} from "../state/rewind-draft.js";

export function RewindDraftSync({ sessionId: slotSession, inputActions }) {
  const sessionId = slotSession || currentSessionId(hostSessions());
  useEffect(() => {
    if (!sessionId) return;
    const armed = takeArmedFill(sessionId);
    if (armed) {
      scheduleComposerFill(sessionId, armed, inputActions);
      return;
    }
    scheduleEchoClear(sessionId, inputActions);
  }, [sessionId, inputActions]);

  return null;
}

export function installRewindWatch(ctx) {
  const sessions = (ctx && ctx.sessions) || hostSessions();
  if (!sessions) return () => {};
  const tick = async () => {
    try {
      const data = await apiJson("/dsh-purge/rewind");
      if (!data || !data.sessionId || !data.at || data.at <= getRewindSeenAt())
        return;
      noteRewindAt(data.at);
      const current = currentSessionId(sessions);
      if (current && current !== data.parentId) return;
      const text = isPluginDraft(data.text) ? "" : data.text || "";
      armComposerFill(data.sessionId, text);
      scheduleComposerFill(data.sessionId, text);
      await openRewoundSession(sessions, data.sessionId);
      scheduleComposerFill(data.sessionId, text);
    } catch {
      /* ignore */
    }
  };
  const timer =
    typeof window !== "undefined" && window.setInterval
      ? window.setInterval(tick, 1200)
      : null;
  return () => {
    if (timer && typeof window !== "undefined" && window.clearInterval)
      window.clearInterval(timer);
  };
}

export function installRewindDraftSync(ctx) {
  bindRewindHost(ctx);
  ctx.slots.inject("conversation.input.right", () =>
    ctx.slots.register(
      {
        name: "conversation.input.right",
        id: "dsh-purge-draft-sync",
        order: 20,
        inject: (sessionId) => ({ sessionId }),
      },
      RewindDraftSync,
    ),
  );
  ctx.effect(() => installRewindWatch(ctx), "dsh-purge: rewind watch");
}
