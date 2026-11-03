# PR #127: provider selection and dependency error follow-up

The fallback now respects an existing provider entry, including an explicit
user disable. The UI remains enabled for an existing enabled provider and
leaves its startup/error reporting to the native service lifecycle. No second
listener is selected simply because a provider is disabled or pending.

Only MODULE_NOT_FOUND naming the exact optional package metadata means absent.
Permission/I/O errors, malformed manifests, exports restrictions and missing
other dependencies propagate; they are not silently converted into disabled UI.
The tests parse the actual YAML scalar with its !!js tag before evaluation.

## Verified on 2026-11-04

- Three new dependency/policy tests pass on macOS and Windows 11, under ordinary
  Node and isolated Electron. The two existing route-registration tests also
  pass on macOS Node and Electron; they are not described as a full server boot.
- A separately installed public @deepseek-ai/dsh-host-webserver 0.0.1-rc.1 plus
  Cordis 4.0.5 was actually started on both systems, under Node and Electron.
  A harmless HTTP route returned 200; removal returned 404; the process disposed
  the server. This provider registers httpServer, not webServer, and the consumer
  requiring webServer remained inactive.
- This is an outstanding ABI issue, not a complete acceptance pass. It does not
  establish that the submitter's bundled provider has the same version/contract.
  The submitter has been asked for precise host/package versions and any alias
  provider. Do not merge merely because a package resolves or a GET returns 405.

The reproducible generic probe loads only the explicitly selected isolated
server dependency directory, never the main plugin, private skills or a user
profile:

```sh
PURGE_TEST_HTTP_SERVER_ROOT='/absolute/path/to/isolated/dependencies' node scripts/probe-webserver-contract.mjs
```

It verifies a real loopback route, route removal and closed listener; it exits 2
when the webServer consumer contract is not satisfied. This deliberate failure
must not be turned into a successful compatibility result. No adapter for an
unverified service ABI is added in this follow-up. Existing features, prompts,
settings and formal DSH processes remain unchanged.

## CI follow-up: Windows handoff test ordering

The Windows full-suite job exposed a test race: Save-State publishes its JSON
before Add-Content closes the log. Reading the log immediately after observing
`expired` can fail with EBUSY. The test now waits for the helper process to exit
and asserts timeout exit code 2 before reading the log. No runtime helper code
or error assertion is removed. All seven handoff tests passed in three repeated
runs on the Windows 11 acceptance machine using real Windows PowerShell.
