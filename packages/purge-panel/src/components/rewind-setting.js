import { h, useEffect, useState } from "../shared/react.js";
import { useT } from "../shared/locale.js";
import {
  readRewindVisibility,
  saveRewindVisibility,
  subscribeRewind,
} from "../state/rewind-visibility.js";

export function RewindSetting() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeRewind(setVisible);
    readRewindVisibility().then(
      () => {
        if (active) setReady(true);
      },
      (e) => {
        if (active) setError(e.message);
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [attempt]);
  async function change(event) {
    const checked = event.target.checked;
    setBusy(true);
    setError("");
    try {
      await saveRewindVisibility(checked);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return h(
    "section",
    { className: "dshpp-composer-settings" },
    h("h3", null, t("rewind.settings")),
    h(
      "label",
      { className: "dshpp-setting-row" },
      t("rewind.show"),
      h("input", {
        type: "checkbox",
        role: "switch",
        checked: visible,
        disabled: !ready || busy,
        onChange: change,
      }),
    ),
    error &&
      h(
        "div",
        { role: "alert" },
        error,
        !ready &&
          h(
            "button",
            {
              type: "button",
              onClick: () => {
                setError("");
                setAttempt(attempt + 1);
              },
            },
            t("rewind.readAgain"),
          ),
      ),
  );
}
