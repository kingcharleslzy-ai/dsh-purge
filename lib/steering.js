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
// 0.2.2-rc.1 起，dsh-go 手机本机引擎在 case "steer" 前面插入了一行生命周期闸门
// （dshGoDeletion?.assertAdmit）。原生分支原样保留，只是前面多了一行，
// 所以按「case + 闸门行 + remove + steer」整体认领，不再只认裸分支。
export const HOST_QUEUE_CASE_GATED =
  '\t\t\tcase "steer":\n\t\t\t\tthis.ctx.get("sessionPersistence")?.dshGoDeletion?.assertAdmit(agent.id);\n\t\t\t\tagent.inbox.remove(request.itemId);\n\t\t\t\tagent.steer(message);';
// 旧 #86 残留同样可能带着闸门行，一并认领并改成原生。
export const OLD_QUEUE_CASE_GATED =
  '\t\t\tcase "steer":\n\t\t\t\tthis.ctx.get("sessionPersistence")?.dshGoDeletion?.assertAdmit(agent.id);\n\t\t\t\tagent.inbox.remove(request.itemId);\n\t\t\t\tagent.followup(message); // [dsh-purge-86] queue steer → next-turn';

export const STEERING_RESTORE_PATCH = {
  id: 90,
  name: "RESTORE_NATIVE_STEERING",
  layer: "代码",
  layer_en: "Code",
  desc: "恢复原生插话与队列顺序，迁移旧 #85/#86/#90 / restore native steering and queue order",
  file: ["api-session-controller", "agent-loop"],
  // 不用 optional：插话是用户直接感知的行为，锚点失配必须报出来，
  // 不能像可选补丁那样被 soft-ok 静默吞掉（strictFiles 的硬失败语义保留）。
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
