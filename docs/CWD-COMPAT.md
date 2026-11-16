# `cwd` Template Compatibility Fix

This fix has been included in Purge Community `1.2.0`; the original local compatibility package was `1.1.71-compat.cwd.1`. This release only fixes a missing-variable error during prompt rendering and does not extend or reapply host patches.

Related to upstream issue #114 and PR #115 (the original upstream repository is no longer accessible; the numbers are kept only as historical references). Local DSH 0.2.1-rc.1 also registers only provider/model, so injecting `Your working directory is {{cwd}}.` causes an error before the request is sent.

- The configuration-template `personaSuffix` is empty to avoid requiring a non-existent variable at the configuration layer.
- At runtime, a dynamic suffix or a static fallback is selected based on whether `cwd` exists and is not `undefined` in `assembled.variables`.
- User prompt files are not modified, non-default custom suffixes are not overwritten, and the host assembly is not changed in place; repeated processing is idempotent.
- Model interfaces, other identity/rule-processing logic, existing settings, and standalone UI plugins are not changed.

Run regression tests using the real `system-prompt` module from the target DSH:

```sh
node test/cwd-compat.mjs /absolute/path/to/dsh-system-prompt/lib/index.js
```

The tests cover missing, `undefined`, valid path, and empty-string cases; each is also tested with no suffix, the old `cwd` suffix, and a custom suffix, for 12 scenarios total. Passing render tests does not mean all Purge patches have been verified for compatibility with the new DSH version; native conversation acceptance must be checked separately after reloading the plugin.
