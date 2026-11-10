// Loaded by the official Cordis loader, in a disposable profile with one
// ordinary notes preset and an empty tool list.
import { profileOwnsPreset } from "../../../lib/preset-compat.js";

export function apply(ctx) {
  if (profileOwnsPreset(ctx, "notes")) return;
  ctx.effect(() => ctx.get("agentPresets").register({ id: "notes", name: "fallback", plugins: [] }), "fixture declaration");
}
