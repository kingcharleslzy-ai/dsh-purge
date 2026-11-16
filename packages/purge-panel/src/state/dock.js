import { apiUrl } from "../api/client.js";
// UI derived from YuJunZhiXue/dsh-purge 1.1.71 (MIT). See LICENSE.
import { useState, useEffect } from "../shared/react.js";
import { __dshPurgeDrill } from "../vendor/drill.js";

export const AUTH_KEY = "dsh-purge-drill-auth";

export let drillGrantGen = 0;

export let drillGrantPosting = 0;

export let drillGrantState = { ready: false, granted: false };

export let drillSyncRetryTimer = null;

export function readDrillAuth() {
  if (drillGrantState.ready) return drillGrantState.granted;
  try {
    return window.localStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

export function setDrillAuthLocal(ok) {
  try {
    if (ok) window.localStorage.setItem(AUTH_KEY, "1");
    else window.localStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
  drillGrantState = { ready: true, granted: !!ok };
}

export function writeDrillAuth(ok) {
  drillGrantGen += 1;
  const gen = drillGrantGen;
  setDrillAuthLocal(ok);
  if (!ok) return;
  drillGrantPosting += 1;
  fetch(apiUrl("/dsh-purge/drill-grant"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  })
    .then((r) => r.json())
    .then((saved) => {
      if (gen !== drillGrantGen) return;
      setDrillAuthLocal(!!(saved && saved.granted));
    })
    .catch(() => {
      /* Remember locally until the next sync writes to this installation. */
    })
    .finally(() => {
      drillGrantPosting = Math.max(0, drillGrantPosting - 1);
    });
}

export function startGrantSync() {
  syncDrillGrant();
  return () => {
    drillGrantGen += 1;
    if (drillSyncRetryTimer) clearTimeout(drillSyncRetryTimer);
    drillSyncRetryTimer = null;
  };
}

export function syncDrillGrant(attempt) {
  const n = attempt || 0;
  const gen = drillGrantGen;
  /* Reset the previous retry timer to avoid overlapping writeDrillAuth chains. */
  if (drillSyncRetryTimer) {
    try {
      clearTimeout(drillSyncRetryTimer);
    } catch {
      /* ignore */
    }
    drillSyncRetryTimer = null;
  }
  fetch(apiUrl("/dsh-purge/drill-grant"), { method: "GET" })
    .then((r) => r.json())
    .then((r) => {
      if (gen !== drillGrantGen) return;
      if (!r || r.ok === false) throw new Error("grant");
      if (r.granted) {
        setDrillAuthLocal(true);
        if (dockBus.authOpen) setDock({ authOpen: false });
        return;
      }
      if (drillGrantPosting > 0) return;
      setDrillAuthLocal(false);
      if (dockBus.authOpen || dockBus.tab === "drill") {
        setDock({
          open: true,
          tab: "drill",
          authOpen: true,
          pending: dockBus.pending || "tab",
        });
      }
    })
    .catch(() => {
      if (gen !== drillGrantGen) return;
      if (n < 5) {
        drillSyncRetryTimer = window.setTimeout(() => {
          drillSyncRetryTimer = null;
          syncDrillGrant(n + 1);
        }, 400);
      }
    });
}

export let dockBus = {
  open: false,
  tab: "clean",
  authOpen: false,
  pending: "tab",
  listeners: new Set(),
};

export function setDock(patch) {
  dockBus = Object.assign({}, dockBus, patch);
  if (patch.open && nativeSidebar) {
    try {
      nativeSidebar.openTab("dsh-purge");
    } catch {}
  }
  dockBus.listeners.forEach((fn) => {
    try {
      fn(dockBus);
    } catch {
      /* ignore */
    }
  });
}

export function useDock() {
  const [st, setSt] = useState(dockBus);
  useEffect(() => {
    const fn = (next) => setSt(next);
    dockBus.listeners.add(fn);
    return () => {
      dockBus.listeners.delete(fn);
    };
  }, []);
  return st;
}

export function requestDrill(kind) {
  const pending = kind || "tab";
  const openEnv = () => {
    try {
      if (__dshPurgeDrill && __dshPurgeDrill.setUI) {
        __dshPurgeDrill.setUI({ open: true, tab: "env" });
      }
    } catch {
      /* ignore */
    }
  };
  if (readDrillAuth()) {
    setDock({ open: true, tab: "drill", authOpen: false, pending: "tab" });
    try {
      if (__dshPurgeDrill && __dshPurgeDrill.setUI)
        __dshPurgeDrill.setUI({ open: true });
    } catch {
      /* ignore */
    }
    if (pending === "env") openEnv();
    if (pending === "full") {
      try {
        window.open(
          window.location.href.split("#")[0] + "#redteam-full",
          "_blank",
          "noopener",
        );
      } catch {
        /* ignore */
      }
    }
    return;
  }
  /* Open the drill tab and authorization dialog so the action is visibly acknowledged. */
  setDock({ open: true, tab: "drill", authOpen: true, pending: pending });
}

/* Original requestDrillEnv(): open the drill console straight on the Env tab. */
export function requestDrillEnv() {
  requestDrill("env");
}

export let nativeSidebar = null;

export function setNativeSidebar(sidebar) {
  nativeSidebar = sidebar;
}

export function clearNativeSidebar(sidebar) {
  if (nativeSidebar === sidebar) nativeSidebar = null;
}
