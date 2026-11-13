// A single preference shared by the settings and composer slots in this client.
import { apiJson } from "../api/client.js";

let visible = false;
let pendingRead;
const listeners = new Set();

export function subscribeRewind(listener) {
  listeners.add(listener);
  listener(visible);
  return () => listeners.delete(listener);
}

function publish(value) {
  visible = value;
  for (const listener of listeners) listener(value);
  return value;
}

function valueFrom(reply) {
  if (reply?.ok !== true || typeof reply.rewind !== "boolean")
    throw new Error(reply?.error || "无法读取回退按钮设置");
  return reply.rewind;
}

export function readRewindVisibility() {
  if (pendingRead) return pendingRead;
  const request = apiJson("/dsh-purge/boost")
    .then((reply) =>
      pendingRead === request ? publish(valueFrom(reply)) : visible,
    )
    .finally(() => {
      if (pendingRead === request) pendingRead = undefined;
    });
  pendingRead = request;
  return request;
}

export async function saveRewindVisibility(value) {
  const reply = await apiJson("/dsh-purge/boost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rewind: value }),
  });
  const saved = valueFrom(reply);
  pendingRead = undefined;
  return publish(saved);
}
