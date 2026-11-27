// Read-only support for empty markers saved by older releases.
export function isRewindDerivedMessage(message) {
  if (!message) return true;
  const id = message.id;
  return message.role === "user" && typeof id === "string" && id.startsWith("rewind-") &&
    Array.isArray(message.content) && message.content.length === 0;
}

export function wrapSessionDeriveMessages(session) {
  if (!session || typeof session.deriveMessages !== "function" || session.__dshPurgeRewindDerive) return session;
  const orig = session.deriveMessages.bind(session);
  session.deriveMessages = function deriveMessagesWithoutRewind() {
    // 抛错不能改成空数组。空历史仍会发出请求，界面停在进行中，模型没有可答的内容。
    const messages = orig();
    if (!Array.isArray(messages)) return [];
    return messages.filter((message) => !isRewindDerivedMessage(message));
  };
  session.__dshPurgeRewindDerive = true;
  return session;
}

