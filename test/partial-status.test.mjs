// #85: a multi-file patch must not report `applied` when one of its target
// files exists but never matched. #57 is the case that exposed it.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  ALL_PATCHES,
  patchStatus,
  patchStatusDetail,
  patchDrift,
  patchStatusReady,
} from "../lib/core.js";
import { tallyPatchStatus, rollupLayers } from "../lib/selfcheck.js";
import { removeTreeNoFollowSync } from "../lib/remove-tree.js";

const MARK = "// [dsh-purge] developer role allowlist: openai/azure";
const PATCHED_LINE = `const instructionRole = model.reasoning && compat?.supportsDeveloperRole !== false && (String(model.baseUrl || "").toLowerCase().includes("api.openai.com") || String(model.baseUrl || "").toLowerCase().includes("azure.com")) ? "developer" : "system"; ${MARK}`;
const UNPATCHED_LINE =
  'const role = model.reasoning && compat?.supportsDeveloperRole !== false ? "developer" : "system";';

function fixture({ completions, responses }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-partial-"));
  const app = path.join(root, "app");
  const host = path.join(app, "node_modules/@deepseek-ai");
  const home = path.join(root, "home");
  const pi = path.join(app, "node_modules/@earendil-works/pi-ai/dist/api");
  fs.mkdirSync(host, { recursive: true });
  fs.mkdirSync(pi, { recursive: true });
  fs.mkdirSync(home);
  fs.writeFileSync(path.join(pi, "openai-completions.js"), completions);
  fs.writeFileSync(path.join(pi, "openai-responses-shared.js"), responses);
  return { root, host, home, close: () => removeTreeNoFollowSync(root) };
}

const patches = ALL_PATCHES.filter((p) => p.id === 57);

test("one applied file plus one missed file is partial, not applied", async () => {
  const f = fixture({ completions: PATCHED_LINE, responses: UNPATCHED_LINE });
  try {
    const opts = { dshHome: f.home, surface: "desktop" };
    const status = await patchStatus(f.host, patches, opts);
    assert.equal(status[57], "partial");
    assert.equal(patchStatusReady("partial", patches[0]), false);

    const report = await patchStatusDetail(f.host, patches, opts);
    const files = report.files[57];
    assert.equal(files.length, 2);
    assert.deepEqual(files.map((x) => x.status).sort(), ["applied", "skipped"]);
    assert.ok(
      files.some(
        (x) =>
          x.key === "pi-ai-responses-shared" &&
          x.path.endsWith("openai-responses-shared.js"),
      ),
    );
  } finally {
    f.close();
  }
});

test("a partial patch is reported as drift instead of hiding behind the applied file", async () => {
  const f = fixture({ completions: PATCHED_LINE, responses: UNPATCHED_LINE });
  try {
    const drift = await patchDrift(f.host, patches, {
      dshHome: f.home,
      surface: "desktop",
    });
    assert.equal(drift.drifted.length, 0);
    assert.equal(
      drift.optionalDrift.length,
      1,
      "optional patch must show up in optionalDrift",
    );
    const row = drift.optionalDrift[0];
    assert.equal(row.id, 57);
    assert.equal(row.status, "partial");
    assert.equal(row.reason, "partial_drift");
    assert.ok(
      row.anchors.some((a) => a.file.endsWith("openai-responses-shared.js")),
    );
  } finally {
    f.close();
  }
});

test("selfcheck counts the partial patch and marks its layer as broken", async () => {
  const f = fixture({ completions: PATCHED_LINE, responses: UNPATCHED_LINE });
  try {
    const opts = { dshHome: f.home, surface: "desktop" };
    const status = await patchStatus(f.host, patches, opts);
    const tally = tallyPatchStatus(status, patches);
    assert.equal(tally.partial, 1);
    assert.equal(tally.applied, 0);
    const layer = rollupLayers(status, true, { patches }).find((l) =>
      l.ids.includes(57),
    );
    assert.ok(layer, "patch 57 must belong to a layer");
    assert.equal(layer.state, "broken");
    assert.ok(
      layer.broken.some((row) => row.id === 57 && row.status === "partial"),
    );
  } finally {
    f.close();
  }
});

test("both files applied stays applied; both missed stays skipped", async () => {
  const both = fixture({ completions: PATCHED_LINE, responses: PATCHED_LINE });
  const none = fixture({
    completions: UNPATCHED_LINE,
    responses: UNPATCHED_LINE,
  });
  try {
    assert.equal(
      (
        await patchStatus(both.host, patches, {
          dshHome: both.home,
          surface: "desktop",
        })
      )[57],
      "applied",
    );
    assert.equal(
      (
        await patchStatus(none.host, patches, {
          dshHome: none.home,
          surface: "desktop",
        })
      )[57],
      "skipped",
    );
  } finally {
    both.close();
    none.close();
  }
});

test("patches without the opt-in keep the old aggregate behaviour", async () => {
  // Legacy multi-file patches may lose one target between host versions; only a
  // patch that declares fileAllRequired is held to every-file accounting.
  const f = fixture({
    completions: PATCHED_LINE,
    responses: "export const unrelated = 1;\n",
  });
  try {
    const opts = { dshHome: f.home, surface: "desktop" };
    const legacy = [{ ...patches[0], id: 957, fileAllRequired: false }];
    const status = await patchStatus(f.host, legacy, opts);
    assert.equal(status[957], "applied");
    const files = (await patchStatusDetail(f.host, legacy, opts)).files[957];
    assert.deepEqual(files.map((x) => x.status).sort(), ["applied", "skipped"]);
  } finally {
    f.close();
  }
});

test("fileOptional keeps a knowingly stale target from turning the patch red", async () => {
  // #32/#36/#62 in rc.3: one target no longer carries the behaviour at all
  // (legacy matching constant, wording owned by another patch, code moved).
  // Those keys are declared fileOptional so the remaining target still decides.
  const f = fixture({
    completions: PATCHED_LINE,
    responses: "export const unrelated = 1;\n",
  });
  try {
    const opts = { dshHome: f.home, surface: "desktop" };
    const declared = [
      {
        ...patches[0],
        id: 958,
        fileAllRequired: true,
        fileOptional: ["pi-ai-responses-shared"],
      },
    ];
    const status = await patchStatus(f.host, declared, opts);
    assert.equal(status[958], "applied");
    assert.equal(patchStatusReady(status[958], declared[0]), true);
  } finally {
    f.close();
  }
});


test("shared counters preserve required errors and explicit applicability", async () => {
  const {tallyDisplayPatches, groupPatchesForDisplay, rollupDisplayStatus} = await import("../lib/core/verify.mjs");
  for (const patch of [{id:90},{id:71},{id:3,optional:true},{id:4,settleWhenAbsent:true},{id:76}]) {
    for (const status of ["applied","already","partial","pending","missing_file","unreadable","unknown","skipped","disabled","off","na","not_needed","future_error",undefined]) {
      const rows=[{...patch,status}];
      const display=tallyDisplayPatches(rows);
      const self=tallyPatchStatus({[patch.id]:status},[patch]);
      const inactive = ["disabled","off","na"].includes(status) ||
        (status==="missing_file" && patch.optional===true) ||
        (status==="skipped" && patch.settleWhenAbsent===true) ||
        (status==="not_needed" && patch.id===76);
      const applied = status==="applied" || status==="already";
      assert.equal(display.total,inactive?0:1,JSON.stringify(rows));
      assert.equal(display.ready,applied?1:0,JSON.stringify(rows));
      assert.equal(display.total,self.total);
      assert.equal(display.ready,self.applied);
      assert.equal(display.skipped,self.skipped);
      const grouped=groupPatchesForDisplay([patch],{[patch.id]:status},"desktop");
      if(status && status!=="na")assert.equal(grouped[0].status,status);
    }
  }
  for(const status of ["partial","missing_file","unknown","unreadable","future_error"])
    assert.notEqual(rollupDisplayStatus(["applied",status]),"applied");
});
