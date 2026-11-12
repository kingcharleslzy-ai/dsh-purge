import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { importArchive, readSkill } from "../lib/skills.js";

// Produce ordinary archives with an independent standard-library writer on all three CI platforms.
const fixtures = `
import io, os, sys, tarfile, zipfile
root = sys.argv[1]
doc = b"---\\nname: sample-art\\ndescription: Test fixture\\n---\\n\\nExample\\n"
for fmt, label in [(tarfile.USTAR_FORMAT, "ustar"), (tarfile.PAX_FORMAT, "pax"), (tarfile.GNU_FORMAT, "gnu")]:
    with tarfile.open(os.path.join(root, label + ".tgz"), "w:gz", format=fmt) as bundle:
        for name, data in [("pkg/SKILL.md", doc), ("pkg/" + "a" * 90 + "/" + "b" * 35, b"sample")]:
            entry = tarfile.TarInfo(name)
            entry.size = len(data)
            bundle.addfile(entry, io.BytesIO(data))
with tarfile.open(os.path.join(root, "link.tar"), "w") as bundle:
    entry = tarfile.TarInfo("pkg/alias")
    entry.type = tarfile.SYMTYPE
    entry.linkname = "SKILL.md"
    bundle.addfile(entry)
for kind in ("normal", "link", "many"):
    with zipfile.ZipFile(os.path.join(root, kind + ".zip"), "w", zipfile.ZIP_DEFLATED) as bundle:
        bundle.writestr("pkg/SKILL.md", doc)
        if kind == "link":
            entry = zipfile.ZipInfo("pkg/alias")
            entry.create_system = 3
            entry.external_attr = 0o120777 << 16
            bundle.writestr(entry, "SKILL.md")
        if kind == "many":
            for n in range(205):
                bundle.writestr("pkg/file" + str(n), b"x")
`;

test("skill imports preserve long paths, reject links and enforce the entry limit before installation", async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "skill-archive-import-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  execFileSync(process.platform === "win32" ? "python" : "python3", ["-c", fixtures, root]);
  for (const name of ["ustar.tgz", "pax.tgz", "gnu.tgz", "normal.zip"]) {
    const home = path.join(root, "home-" + name);
    await importArchive(home, fs.readFileSync(path.join(root, name)), name);
    const result = await readSkill(home, "sample-art");
    assert.equal(result.id, "sample-art");
    if (name.endsWith(".tgz")) {
      const extra = path.join(path.dirname(result.path), "a".repeat(90), "b".repeat(35));
      assert.equal(fs.readFileSync(extra, "utf8"), "sample");
    }
  }
  for (const name of ["link.tar", "link.zip", "many.zip"]) {
    const home = path.join(root, "rejected-" + name);
    await assert.rejects(importArchive(home, fs.readFileSync(path.join(root, name)), name), /仅支持普通文件|链接条目|文件太多/);
    assert.equal(fs.existsSync(home), false);
  }
});
