# DSH custom marketplace index

Official source URL: **https://kingcharleslzy-ai.github.io/dsh-purge/index.json**

In DSH, enable `Plugins → Experimental Plugins → More → Custom Plugin Marketplace`, then paste this URL in `Discover → Add Index Source`. Older hosts without this feature can still install via GitHub Releases.

The index follows the official format 1 and lists official versions of Purge (from 1.6.5 onward), DSH-Spicy, and Breeze Voice. Source installs are pinned to full Git commits, not mutable branches. After the release workflow succeeds, GitHub Pages is generated and deployed automatically; no manual index editing is required.

Each entry declares its own verified host version range and does not claim verification for other hosts. Marketplace listing does not imply DeepSeek endorsement and does not automatically apply host patches.

Community directory listings and self-hosted sources are different things: users add self-hosted sources themselves; community directory entries must be submitted and reviewed by maintainers.

Official specification: https://deepseek-harness.github.io/deepseek-harness/en/guide/plugin-market

After releasing a new Breeze Voice version, record the release package's prebuilt Git snapshot commit, release time, and host compatibility range in `market/breeze-voice.json`, verify it, then deploy the index.
