---
name: fofa-recon
description: Use the FOFA API for bulk asset mapping of a target (domain/IP/port/title/fingerprint); includes a rate-limited client with strict single-threading, minimum intervals, and backoff retries to avoid triggering 45012
whenToUse: During reconnaissance when you need to quickly map the internet-facing asset surface of an organization/domain
role: recon
enabled: true
---

# FOFA asset mapping (rate-limit-safe)

## Credentials
- API Key: read from environment variable `FOFA_KEY` (**never write any key into the repository**; all scripts in this skill read only from environment variables)
- Endpoint: `GET https://fofa.info/api/v1/search/all`
- Parameters: `key`, `qbase64` (base64 of query statement), `size`, `page`, `fields`

## Official limits (fofa.info/vip, verified 2026-09)

| Plan | Query requests | Data volume | **Query API concurrency** |
|---|---|---|---|
| Registered user (free) | No API (300 page queries/month) | 3,000 page records/month | — |
| Personal | 10,000/month | 100,000/month | **1 request/sec** |
| Professional | 80,000/month | 800,000/month | **1 request/sec** |
| Business | 900,000/month | 9,000,000/month | **2 requests/sec** |
| Enterprise V2 | 5,000,000/month | 50,000,000/month | **5 requests/sec** |

## Observed behavior (tested)
- Rapid consecutive requests → **HTTP 429**, body `{"error":true,"errmsg":"[45012] Request too fast"}`
- Invalid key → HTTP 200 + `{"error":true,"errmsg":"[-700] Account invalid"}`
- Single page with `size` up to 1000 works; consecutive requests succeed when interval ≥1 second
- Conclusion: **execute conservatively at 1 request/sec, never concurrently**; on 45012 you must back off, do not retry immediately

## Usage discipline (important)
1. **Precise queries first**: narrow with `domain=` / `cert=` / `org=` before considering broad statements like `body=` / `title=`. Broad queries returning hundreds of thousands of results are meaningless and burn quota.
2. **Do not page through everything**: by default take only the first 1–3 pages (100 records each) to get mapping entry points.
3. **Single process, single thread**: run only one collection task at a time; queue multiple queries sequentially.
4. **Cache results to disk**: do not re-fetch the same query; check `runs/fofa-*.jsonl` first.
5. **Run long tasks in background**: use `run_in_background` so the conversation is not blocked.
6. When quota is exhausted or rate-limited, switch to other sources (certificate transparency, DNS, search engines); do not keep forcing it.

## Rate-limited client (use this; do not hand-write curl loops)
```bash
cat > runs/fofa_client.py <<'PY'
#!/usr/bin/env python3
"""FOFA collection (rate-limit-safe): single-thread + minimum interval + exponential backoff + result cache.

Usage:
  python3 runs/fofa_client.py 'domain="example.com"' --pages 2 --size 100 --interval 2.0
Output:
  runs/fofa-<slug>.jsonl   one asset per line {host,ip,port,title,domain,server,protocol}
"""
import argparse, base64, hashlib, json, os, sys, time, urllib.error, urllib.parse, urllib.request

KEY = os.environ["FOFA_KEY"]
API = "https://fofa.info/api/v1/search/all"
FIELDS = "host,ip,port,title,domain,server,protocol"
RETRY_BACKOFF = [5, 15, 45]          # backoff seconds on 45012
HARD_BUDGET = 30                      # max requests per run


def fetch(query, page, size, timeout=30):
    qs = urllib.parse.urlencode({
        "key": KEY, "qbase64": base64.b64encode(query.encode()).decode(),
        "size": size, "page": page, "fields": FIELDS,
    })
    req = urllib.request.Request(API + "?" + qs, headers={"User-Agent": "redteam-recon/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "ignore")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"error": True, "errmsg": body[:200]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("query")
    ap.add_argument("--pages", type=int, default=2, help="max pages (default 2)")
    ap.add_argument("--size", type=int, default=100, help="records per page (default 100, do not increase)")
    ap.add_argument("--interval", type=float, default=2.0, help="minimum request interval in seconds (default 2.0)")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    slug = hashlib.md5(args.query.encode()).hexdigest()[:8]
    out = args.out or f"runs/fofa-{slug}.jsonl"
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)

    if os.path.exists(out) and os.path.getsize(out) > 0:
        print(f"[cache] {out} already exists ({os.path.getsize(out)} bytes); delete it first to re-fetch", file=sys.stderr)
        return 0

    seen, rows, requests_made, last_ts = set(), [], 0, 0.0
    for page in range(1, args.pages + 1):
        # ---- rate limit: ensure at least interval seconds between requests ----
        wait = args.interval - (time.time() - last_ts)
        if wait > 0:
            time.sleep(wait)

        status, data = None, None
        for attempt, backoff in enumerate([0] + RETRY_BACKOFF):
            if attempt:
                print(f"[backoff] waiting {backoff}s before retry (page={page})", file=sys.stderr)
                time.sleep(backoff)
            last_ts = time.time()
            requests_made += 1
            if requests_made > HARD_BUDGET:
                print(f"[stop] reached request budget {HARD_BUDGET}", file=sys.stderr)
                break
            status, data = fetch(args.query, page, args.size)
            if status == 200 and not data.get("error"):
                break
            errmsg = str(data.get("errmsg", ""))
            if "45012" in errmsg or status == 429:
                continue                      # rate limit → backoff retry
            print(f"[stop] non-retryable error http={status} {errmsg}", file=sys.stderr)
            data = None
            break
        if data is None:
            break

        results = data.get("results") or []
        print(f"[page {page}] {len(results)} records (size={data.get('size')}, consumed_fpoint={data.get('consumed_fpoint')})", file=sys.stderr)
        for item in results:
            if isinstance(item, str):
                item = [item]
            host = item[0] if len(item) > 0 else ""
            ip = item[1] if len(item) > 1 else ""
            port = item[2] if len(item) > 2 else ""
            key = (host, ip, port)
            if key in seen:
                continue
            seen.add(key)
            rows.append({
                "host": host, "ip": ip, "port": port,
                "title": item[3] if len(item) > 3 else "",
                "domain": item[4] if len(item) > 4 else "",
                "server": item[5] if len(item) > 5 else "",
                "protocol": item[6] if len(item) > 6 else "",
            })
        if len(results) < args.size:
            break                              # reached last page

    with open(out, "w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"[done] {len(rows)} assets → {out} ({requests_made} requests total)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
PY
```

### Usage
```bash
mkdir -p runs
python3 runs/fofa_client.py 'domain="example.com"' --pages 2 --size 100 --interval 2.0
python3 runs/fofa_client.py 'cert="example.com"' --pages 3 --interval 2.0
python3 runs/fofa_client.py 'org="Example Technology Co., Ltd."' --pages 2 --interval 2.0
```

### Record to database
Read `runs/fofa-*.jsonl` and `redteam_asset_add` each record: `provenance="passive"`, `tool="fofa"`, include `url=host`, `title`, `product=server` for ports; add domains to `names`.

## Common query statements
| Purpose | Query |
|---|---|
| All assets for a domain | `domain="example.com"` |
| Certificate contains domain | `cert="example.com"` |
| A CIDR block | `ip="203.0.113.0/24"` |
| Organization name | `org="Example Technology Co., Ltd."` |
| Find admin panels by title | `title="Login" && domain="example.com"` |
| By body signature | `body="/seeyon/"` |
| Specific port | `ip="203.0.113.0/24" && port="3306"` |

> Broad queries (using `body=` / `title=` alone) return large result sets and consume quota quickly; always constrain with domain or IP.
