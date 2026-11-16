---
name: asset-correlation
description: Asset correlation: graph relationships across domain ↔ IP ↔ CIDR block ↔ certificate ↔ service
whenToUse: When closing out an information-gathering phase and you need an asset relationship view
role: recon
enabled: true
---

## Correlation rules
- Domain resolution → `resolves` edge (domain → asset)
- CIDR block ownership → `contains` edge (segment → asset)
- Open port → `exposes` edge (asset → port)
- Shared certificate SAN → `shares_cert` edge

## Record requirements
Write to the edge table via redteam_asset_link; duplicate relationships must be idempotent.
