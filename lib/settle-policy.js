/** During official desktop startup Fiber._reload is still mounting desktop-office; settle must not unpack or kill. */

export const DESKTOP_SETTLE_DELAY_MS = 4000;

export function isInactiveContextError(error) {
  if (!error) return false;
  if (error.code === "INACTIVE_EFFECT") return true;
  return /inactive context/i.test(String(error.message || error));
}

export function watchContextLife(ctx) {
  const life = { alive: true };
  if (!ctx || typeof ctx.effect !== "function") return life;
  try {
    ctx.effect(() => () => {
      life.alive = false;
    });
  } catch (error) {
    if (isInactiveContextError(error)) {
      life.alive = false;
      return life;
    }
    throw error;
  }
  return life;
}

export function settleDelayMs(surface) {
  return surface === "desktop" ? DESKTOP_SETTLE_DELAY_MS : 0;
}

/** Desktop startup self-heal must not requestRestart / taskkill, or Cordis hits INACTIVE_EFFECT. */
export function settleMayRestart({ surface, sealed = false } = {}) {
  if (surface === "desktop") return false;
  if (sealed) return false;
  return true;
}

/** Extracting/swapping in place on a sealed asar races the official Host's Fiber._reload for the lock. */
export function settleMayReapply({ surface, sealed = false } = {}) {
  if (surface === "desktop" && sealed) return false;
  return true;
}

/**
 * Whether to restart after Apply. Web and desktop share one rule:
 * restart when the prompt was written or patches were written; code patches that do not match the current version do not cancel it.
 * A sealed package only adds the swap; no separate decision.
 * No cooldown here, or a first restart that failed to swap asar makes the second Apply look cancelled.
 */
export function applyShouldRestart({
  complete = false,
  sealed = false,
  appliedCount = 0,
  promptReady = false,
} = {}) {
  // Sealed desktop: Apply requires a full quit to swap asar / load resources/app, regardless of the applied flag.
  if (sealed) return true;
  if (complete || promptReady) return true;
  return Number(appliedCount) > 0;
}
