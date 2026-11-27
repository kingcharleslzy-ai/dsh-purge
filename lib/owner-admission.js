/** Keep privileged HTTP operations behind the Host's authenticated owner Peer. */
export function allowOwnerRequest(ctx, request, response) {
  let admission;
  try {
    // Optional lookup keeps CLI and non-HTTP activation independent of Connection.
    // Resolve on every request so a disposed or replaced service cannot stay trusted.
    const connection = typeof ctx?.get === "function" ? ctx.get("connection") : ctx?.connection;
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

function reject(response, status, error) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify({ ok: false, error }));
  return false;
}
