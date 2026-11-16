// UI derived from YuJunZhiXue/dsh-purge 1.1.71 (MIT). See LICENSE.
import { runtimeRepairDetails } from "../shared/runtime-error.js";

export function clientGuessSurface() {
  try {
    if (
      typeof navigator !== "undefined" &&
      /electron/i.test(navigator.userAgent || "")
    )
      return "desktop";
    if (typeof location !== "undefined") {
      const port = String(location.port || "");
      if (port === "43120") return "desktop";
      const host = String(location.hostname || "");
      if (
        host &&
        host !== "127.0.0.1" &&
        host !== "localhost" &&
        /dsh desktop/i.test(String(location.href || ""))
      )
        return "desktop";
    }
  } catch {
    /* ignore */
  }
  return "";
}

export function hostSurfaceOf(s) {
  return (s && s.surface) || clientGuessSurface() || "web";
}

export function hostText(t, key, surface) {
  if (surface && surface !== "web") {
    const specific = key + "." + surface;
    const hit = t(specific);
    if (hit && hit !== specific) return hit;
  }
  return t(key);
}

// The loaded plugin URL is the strongest evidence of the host mount point.
// An unrelated/cross-origin <base> must never receive authenticated API calls.
export function apiUrl(p, context = {}) {
  try {
    const loc =
      context.href || window.location.href || window.location.origin + "/";
    const page = new URL(loc);
    const module = new URL(
      context.moduleUrl ||
        (typeof __PURGE_MODULE_URL__ !== "undefined" && __PURGE_MODULE_URL__) ||
        page.href,
      page,
    );
    let base;
    const marker = module.pathname.indexOf("/plugins/");
    if (module.origin === page.origin && marker >= 0) {
      base = new URL(module.pathname.slice(0, marker + 1), page);
    } else {
      const declared =
        context.baseURI ||
        (typeof document !== "undefined" && document.baseURI);
      const candidate = declared && new URL(declared, page);
      base = candidate && candidate.origin === page.origin ? candidate : page;
      base = new URL(base.href);
      // Host routes are client-side hash routes; a slashless mount is a directory.
      if (!base.pathname.endsWith("/")) base.pathname += "/";
    }
    base.search = "";
    base.hash = "";
    if (typeof p !== "string" || !p.startsWith("/") || p.startsWith("//"))
      return p;
    return new URL(p.slice(1), base).toString();
  } catch {
    return p;
  }
}

export function apiTimeoutMs(p, init) {
  const path = String(p || "");
  const method = String((init && init.method) || "GET").toUpperCase();
  if (path.indexOf("/dsh-purge/community") !== -1)
    return method === "POST" ? 600000 : 20000;
  if (path.indexOf("/dsh-purge/update") !== -1)
    return method === "POST" ? 180000 : 45000;
  if (path.indexOf("/dsh-purge/uninstall") !== -1) return 90000;
  if (path.indexOf("/dsh-purge/skill") !== -1)
    return method === "POST" ? 120000 : 20000;
  // Synchronous writes during Apply block status; the default 20s timeout is too short.
  if (path.indexOf("/dsh-purge/status") !== -1) return 60000;
  if (path.indexOf("/dsh-purge/apply") !== -1) return 240000;
  if (path.indexOf("/dsh-purge/revert") !== -1) return 120000;
  if (path.indexOf("/dsh-purge/restart") !== -1) return 60000;
  return 20000;
}

export function isAbortError(e) {
  const msg = String((e && e.message) || e || "");
  return (e && e.name === "AbortError") || /aborted|abort/i.test(msg);
}

function apiError(message, status) {
  return Object.assign(new Error(message), { status });
}

// Share only an identical in-flight status GET; never reuse a settled result.
// A mutation starts a new generation so its following refresh cannot join an old read.
let pendingStatus = null;
export function apiJson(p, init) {
  const method = String(init?.method || "GET").toUpperCase();
  if (method !== "GET") pendingStatus = null;
  if (p !== "/dsh-purge/status" || init) return requestJson(p, init);
  if (pendingStatus) return pendingStatus;
  const request = requestJson(p, init);
  pendingStatus = request;
  const clear = () => {
    if (pendingStatus === request) pendingStatus = null;
  };
  request.then(clear, clear);
  return request;
}
export function unavailableStatus(error) {
  return {
    ok: false,
    error: String(error?.message || error || "bad response"),
  };
}
async function requestJson(p, init) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), apiTimeoutMs(p, init));
  try {
    const r = await fetch(
      apiUrl(p),
      Object.assign(
        { cache: "no-store", credentials: "same-origin", signal: ctrl.signal },
        init || {},
      ),
    );
    const text = await r.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw apiError(r.status + " non-json: " + text.slice(0, 120), r.status);
    }
    if (!r.ok) {
      const runtimeDetails = runtimeRepairDetails(data?.cli_repair);
      const message =
        (data && (data.error || data.message)) || r.status + " " + r.statusText;
      throw Object.assign(
        apiError([message, ...runtimeDetails].join("\n"), r.status),
        { runtimeDetails },
      );
    }
    return data;
  } catch (e) {
    if (isAbortError(e)) throw new Error("timeout");
    const msg = String((e && e.message) || e || "");
    if (!e?.status && /failed to fetch|networkerror|load failed/i.test(msg)) {
      throw new Error(
        "Cannot reach the API. Check that DSH is running, then press Ctrl+F5",
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export function promptBoxEmpty(text) {
  return !String(text || "").trim();
}

export function responseNeedsPrompt(d) {
  return Boolean(d && (d.needPrompt || d.injectSource === "none"));
}

export function warnNeedPrompt(d, tr) {
  if (!responseNeedsPrompt(d)) return false;
  window.alert(tr("need.prompt"));
  return true;
}

export async function bothInjectEmpty(overrideText, defaultText) {
  if (!promptBoxEmpty(overrideText)) return false;
  if (!promptBoxEmpty(defaultText)) return false;
  return true;
}

export function rulesApi(op, extra) {
  return apiJson("/dsh-purge/rules", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(Object.assign({ op: op }, extra || {})),
  });
}

export function skillsRouteMissing(e) {
  // Retry the legacy route only for a missing endpoint. A server error or
  // malformed success response may follow a completed write: never replay it.
  return e?.status === 404 || e?.status === 405;
}

export function skillsApi(op, extra) {
  const init = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(Object.assign({ op: op }, extra || {})),
  };
  return apiJson("/dsh-purge/skills", init).catch((e) => {
    if (!skillsRouteMissing(e)) throw e;
    return apiJson("/dsh-purge/skill", init);
  });
}
