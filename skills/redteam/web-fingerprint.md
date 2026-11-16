---
name: web-fingerprint
description: Web service fingerprinting: framework, middleware, CMS, component versions
whenToUse: When an HTTP/HTTPS service is discovered and you need to identify its tech stack
role: recon
enabled: true
---

## Method
1. Response headers: `Server`, `X-Powered-By`, `Set-Cookie` characteristics.
2. Page features: favicon hash, static asset paths, error pages, robots.txt.
3. Active probing: nuclei technology-detection templates `nuclei -u <url> -tags tech`; for HTTP liveness and tech-stack summaries use `~/.local/bin/pd-httpx -l urls.txt -tech-detect -title -status-code -web-server` (**ProjectDiscovery's version must be `pd-httpx`; `/usr/bin/httpx` is the Python library CLI**).
4. For bulk fingerprinting across large segments use skill `gogo-intranet` (`gogo -i <cidr> -p top2 -v --af`; active fingerprinting requires `-v`).
5. Version comparison: infer product and version from fingerprints to prepare vulnerability checks.

## Record requirements
Write to the fingerprint table: category (framework/middleware/CMS/component), vendor, product, version, evidence.
