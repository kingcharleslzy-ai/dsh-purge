---
name: passive-recon
description: Passive information gathering: do not contact target hosts, use only public data sources
whenToUse: When you need to collect target asset intelligence without exposing yourself
role: recon
enabled: true
---

## Data sources
- Certificate transparency logs (crt.sh): `curl -s "https://crt.sh/?q=%25.<domain>&output=json" | jq -r '.[].name_value' | sort -u`
- DNS records: `dig +short <domain> A/AAAA/MX/TXT/NS`
- whois: registrant, network block, ASN
- Search engines and code hosting platforms: leaked subdomains, keys, internal addresses
- Public port-mapping data (Shodan/Censys/FOFA etc., requires authorized API)

## Record requirements
For each finding call redteam_asset_upsert, set provenance to `passive`, and record the specific data source in tool.
