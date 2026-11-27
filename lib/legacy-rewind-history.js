// Empty user markers were appended by older Purge versions when a turn was removed.
function isLegacyMarker(message) {
  return message?.role === "user" && typeof message.id === "string" &&
    message.id.startsWith("rewind-") && Array.isArray(message.content) && message.content.length === 0;
}

export function wrapSessionDeriveMessages(session) {
  if (typeof session?.deriveMessages !== "function" || session.__dshPurgeRewindDerive) return session;
  const events = session.snapshotEvents?.();
  if (!Array.isArray(events) || !events.some(event => event?.type === "user/message" && isLegacyMarker(event.data))) return session;
  const original = session.deriveMessages;
  session.deriveMessages = function (...args) {
    const messages = original.apply(this, args);
    return Array.isArray(messages) ? messages.filter(message => !isLegacyMarker(message)) : messages;
  };
  session.__dshPurgeRewindDerive = true;
  return session;
}
