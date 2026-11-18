# Host owner access for the HTTP panels

The Purge panels manage Host files, prompts, rules, Skills, updates and backups.
Their HTTP endpoints require an authenticated Host owner through
`connection.admit(request)`. This includes `/dsh-purge/*`, the separate
`/dsh-purge/community` maintenance endpoint, and `/redteam/api`.

Normal HTTP(S) Desktop and Web pages reuse the Host's existing browser-session
cookie. No additional Purge password, API key or client header is introduced.
Existing endpoint names, request bodies and business operations are unchanged.
The client continues to use its existing same-origin requests and mount paths.

The existing Host/Origin checks remain additional restrictions. A listener bind
address, `--trusted-host`, `PURGE_TRUSTED_HOSTS` or a loopback socket is not a
login credential. A reverse proxy must preserve the Host's authentication flow;
adding a proxy hostname only to `PURGE_TRUSTED_HOSTS` does not grant owner access.

HTTP failures are explicit and do not fall back to anonymous access:

- `401`: the Host rejected the session, for example an absent or expired cookie.
  Reopen the Host through its normal launch/login flow.
- `403`: the Host rejected the origin, or the authenticated Peer is not the owner.
  The official `/connect` API session has an owner principal and remains allowed;
  a different authenticated principal does not grant Host maintenance access.
- `503`: Connection is absent, cannot decide, or returns an unsupported result.
  Use a Host providing owner admission and retry after the service is active.

Connection is looked up on each request. A late-mounted or replaced service can
recover without replacing the routes; a disposed service does not retain access.
It is not added as a required activation dependency. CLI commands, process-local
tools and configured background tasks retain their existing behavior and do not
need an HTTP request or browser cookie.

There are intentional compatibility limits. A legacy composition without owner
admission no longer exposes its HTTP panels anonymously. Historical `app:` or
`file:` pages and opaque origins are accepted only if the Host itself admits
them; a loopback exception cannot substitute for authentication. These cases
need Host-side authentication support rather than an insecure Purge fallback.

The focused regression tests use fake services, request streams and temporary
data. They cover all production HTTP registration paths, authenticated controls,
denial before body parsing, service replacement and route/command lifecycles.
Separate before/after packages built from 1.7.20 were installed with the official
CLI in isolated DSH Web 0.2.2-rc.3 profiles. Real signed sessions, synthetic rule
and Skill CRUD, browser page loading and read-only CLI checks passed. Anonymous
rule writes succeeded before the change and were rejected without writing after
it. The 403 non-owner and 503 unavailable-service checks remain fixture coverage.
Native Desktop, proxies, Host apply/restart/update/backup/restore, model tasks
and the full test suite were not exercised.
