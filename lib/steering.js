// Restore only known Purge rewrites of ordinary message delivery. No profile,
// prompt, permissions, or live Agent state is read or written by this module.
export const NATIVE_QUEUE_GUARD =
  '\t\tif (request.action.kind === "steer" && (target !== "next-turn" || agent.status !== "running")) throw new RemoteError("session/steer-unavailable", "current turn no longer accepts steering", { itemId: request.itemId });';
export const NATIVE_PROMPT =
  '\t\t\t\t\tif (request.mode === "steer") agent.steer(message);\n\t\t\t\t\telse agent.followup(message);';
export const NATIVE_QUEUE_CASE =
  '\t\t\tcase "steer":\n\t\t\t\tagent.inbox.remove(request.itemId);\n\t\t\t\tagent.steer(message);';
export const NATIVE_STEER =
  '\tsteer(input) {\n\t\tthis.send(input, "next-step", true);\n\t}';
export const OLD_QUEUE_FALLBACK =
  '\t\tif (request.action.kind === "steer" && (target !== "next-turn" || agent.status !== "running")) {\n' +
  "\t\t\t// [dsh-purge] steer degrades to followup instead of failing\n" +
  "\t\t\tagent.inbox.remove(request.itemId);\n" +
  "\t\t\tagent.followup(message);\n" +
  '\t\t\treturn { accepted: true, degraded: "followup" };\n' +
  "\t\t}";
export const OLD_PROMPT =
  "\t\t\t\t\tagent.followup(message); // [dsh-purge-85] user prompt always next-turn (kill steer→next-step race)";
export const OLD_QUEUE_CASE =
  '\t\t\tcase "steer":\n\t\t\t\tagent.inbox.remove(request.itemId);\n\t\t\t\tagent.followup(message); // [dsh-purge-86] queue steer → next-turn';
export const OLD_STEER =
  '\tsteer(input) {\n\t\tthis.send(input, "next-turn", true); // [dsh-purge-86] user steer always next-turn\n\t}';
export const UPSTREAM_RECOVERED_STEER =
  '\tsteer(input) {\n\t\tthis.send(input, "next-step", true); // [dsh-purge-86] steer() stays next-step for send_message\n\t}';
// Since 0.2.2-rc.1 the dsh-go mobile engine inserts a lifecycle gate line before case "steer"
// (dshGoDeletion?.assertAdmit). The native branch is intact, just preceded by one line,
// so claim "case + gate line + remove + steer" as a whole, not the bare branch.
export const HOST_QUEUE_CASE_GATED =
  '\t\t\tcase "steer":\n\t\t\t\tthis.ctx.get("sessionPersistence")?.dshGoDeletion?.assertAdmit(agent.id);\n\t\t\t\tagent.inbox.remove(request.itemId);\n\t\t\t\tagent.steer(message);';
// Old #86 leftovers may carry the gate line too; claim and convert them to native as well.
export const OLD_QUEUE_CASE_GATED =
  '\t\t\tcase "steer":\n\t\t\t\tthis.ctx.get("sessionPersistence")?.dshGoDeletion?.assertAdmit(agent.id);\n\t\t\t\tagent.inbox.remove(request.itemId);\n\t\t\t\tagent.followup(message); // [dsh-purge-86] queue steer → next-turn';

export const STEERING_RESTORE_PATCH = {
  id: 90,
  name: "RESTORE_NATIVE_STEERING",
  layer: "Code",
  layer_en: "Code",
  desc: "Restore native steering and queue order; migrate old #85/#86/#90",
  file: ["api-session-controller", "agent-loop"],
  // Not optional: steering is user-visible behavior, so an anchor mismatch must be reported
  // and never soft-ok swallowed like an optional patch (strictFiles hard-failure semantics hold).
  strictFiles: true,
  requireAllTargets: true,
  forbid: [
    "[dsh-purge-85]",
    "[dsh-purge-86]",
    "[dsh-purge] steer degrades to followup",
  ],
  replacements: [
    { pattern: OLD_QUEUE_FALLBACK, replace: NATIVE_QUEUE_GUARD },
    { pattern: OLD_PROMPT, replace: NATIVE_PROMPT },
    { pattern: OLD_QUEUE_CASE, replace: NATIVE_QUEUE_CASE },
    { pattern: OLD_QUEUE_CASE_GATED, replace: HOST_QUEUE_CASE_GATED },
    { pattern: OLD_STEER, replace: NATIVE_STEER },
    { pattern: UPSTREAM_RECOVERED_STEER, replace: NATIVE_STEER },
  ],
};

// A marker on one branch cannot certify a whole controller. Unknown or partial
// rewrites stay unmodified and are reported by strictFiles, not silently settled.
export function nativeSteeringRestored(text) {
  const source = String(text).replace(/\r\n/g, "\n");
  if (STEERING_RESTORE_PATCH.forbid.some((marker) => source.includes(marker)))
    return false;
  const controller = source.includes("async updateQueue(");
  const loop = source.includes("\tsteer(input) {");
  if (!controller && !loop) return false;
  return (
    (!controller ||
      ([NATIVE_QUEUE_GUARD, NATIVE_PROMPT].every((part) =>
        source.includes(part),
      ) &&
        [NATIVE_QUEUE_CASE, HOST_QUEUE_CASE_GATED].some((part) =>
          source.includes(part),
        ))) &&
    (!loop || source.includes(NATIVE_STEER))
  );
}
