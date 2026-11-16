// The upstream repository was deleted and replaced with an unrelated project: the release source must point at this repo, or the beta/zip channels 404.
import { test } from "node:test";
import assert from "node:assert/strict";
import { SOURCE_REPO, UPSTREAM_REPO, archiveZipUrl, archiveTarballUrl } from "../lib/update-net.js";
import { REPOSITORY } from "../lib/community.js";

test("update sources point at this repository", () => {
  assert.equal(SOURCE_REPO, "kingcharleslzy-ai/dsh-purge");
  assert.equal(UPSTREAM_REPO, SOURCE_REPO);
  assert.equal(REPOSITORY, SOURCE_REPO);
});

test("archive URLs never reference the removed upstream", () => {
  for (const url of [archiveZipUrl("v1.6.36"), archiveTarballUrl("v1.6.36")]) {
    assert.match(url, /kingcharleslzy-ai\/dsh-purge/);
    assert.doesNotMatch(url, /YuJunZhiXue/);
  }
});
