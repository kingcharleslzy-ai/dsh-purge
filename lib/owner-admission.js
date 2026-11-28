/** Keep privileged HTTP operations behind the Host's authenticated owner Peer. */
export function allowOwnerRequest(ctx, request, response) {
  let admission;
  try {
    // Optional lookup keeps CLI and non-HTTP activation independent of Connection.
    // Resolve on every request so a disposed or replaced service cannot stay trusted.
    const connection = ownerConnection(ctx);
    if (!connection || typeof connection.admit !== "function") {
      return reject(response, 503, "Host owner authentication is unavailable.");
    }
    admission = connection.admit(request);
    if (typeof admission?.then === "function") {
      // An unsupported asynchronous decision must neither admit nor cause an unhandled rejection.
      Promise.resolve(admission).catch(() => {});
      return reject(response, 503, "Host owner authentication is unavailable.");
    }
    if (!admission || typeof admission !== "object") {
      return reject(response, 503, "Host owner authentication is unavailable.");
    }
    if ("rejection" in admission) {
      const status = admission.rejection;
      return reject(response, status === 401 || status === 403 ? status : 503,
        "Host owner authentication required.");
    }
    if (!admission.peer?.principal || typeof admission.peer.principal.kind !== "string") {
      return reject(response, 503, "Host owner authentication is unavailable.");
    }
    if (admission.peer.principal.kind !== "owner") {
      return reject(response, 403, "Host owner access required.");
    }
  } catch {
    // Neither an unavailable service nor an exception is permission to mutate the Host.
    return reject(response, 503, "Host owner authentication is unavailable.");
  }
  return true;
}

/**
 * Resolve the Connection service on the fiber that will call `admit()`.
 *
 * DSH 0.2.3 resolves a service's own sub-services through the *calling* fiber:
 * `admit()` touches `connection.authentication`, so a bare `ctx.get("connection")`
 * from a sibling plugin throws `cannot get property "connection.authentication"
 * without inject` and every privileged route fails closed with 503. Ask for a
 * scope that injects both names, cache it per context, and keep the bare lookup
 * as the fallback for older releases and non-web profiles.
 * @param ctx - plugin or route context the request is served from.
 * @returns the Connection service, or undefined when the deployment has none.
 */
function ownerConnection(ctx) {
  const scoped = pickConnection(scopeOf(ctx));
  if (scoped !== undefined) return scoped;
  return pickConnection(ctx);
}

/** Read the service through the property (fiber-bound) before the lookup. */
function pickConnection(candidate) {
  if (!candidate) return undefined;
  try {
    if (candidate.connection) return candidate.connection;
  } catch {}
  try {
    if (typeof candidate.get === "function") {
      const found = candidate.get("connection");
      if (found) return found;
    }
  } catch {}
  return undefined;
}

/** One injected scope per context; created on first use and dropped on disposal. */
const ownerScopes = new WeakMap();
function scopeOf(ctx) {
  if (!ctx || typeof ctx.inject !== "function") return undefined;
  const cached = ownerScopes.get(ctx);
  if (cached) return cached.child;
  const state = {};
  ownerScopes.set(ctx, state);
  try {
    ctx.inject(["connection", "connection.authentication"], (child) => {
      state.child = child;
      return () => { if (state.child === child) state.child = undefined; };
    });
  } catch {
    ownerScopes.delete(ctx);
  }
  return state.child;
}

/**
 * Prime the injected scope at mount so the first privileged request already
 * resolves it instead of failing once and succeeding afterwards.
 * @param ctx - the plugin context passed to `apply`.
 */
export function primeOwnerScope(ctx) {
  scopeOf(ctx);
}

function reject(response, status, error) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify({ ok: false, error }));
  return false;
}
