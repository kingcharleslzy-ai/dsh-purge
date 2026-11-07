# 上游技能同步：23 → 41

## 来源与许可

- 上游：[`Jueze-2019/dsh-redteam-mode`](https://github.com/Jueze-2019/dsh-redteam-mode)，**MIT**（`LICENSE`，Copyright (c) 2026 Jueze-2019）。
- 固定版本：**v0.15.8**（commit `7b3de2d`，`skills/` 共 41 份）。
- 本仓库早已随包携带该上游的 `docs/redteam-upstream-LICENSE` 与 `docs/redteam-upstream-DISCLOSURE`；本次只是补齐源文件，**没有新增许可义务**。
- 不取自任何非 MIT 的分支或第三方再分发包。

## 本次追加的 18 份

`ad-attack`、`ai-agent-attack`、`api-data-exfil`、`asset-deep-scan`、`c2-infra`、
`campaign-planning`、`cloud-k8s`、`deepseek-web-intel`、`host-post-exploit`、`icp-query`、
`mobile-code-recon`、`netspy-recon`、`network-device`、`oob-verify`、`opsec-hygiene`、
`score-coverage`、`specialist-paths`、`supply-chain`。

原有 23 份**一个字节都没改**——上游同名文件的不同版本不覆盖本地内容，避免冲掉 `skill-fixes.js` 里已有的修正记录。

## 角色分布

| `role` | 份数 | 说明 |
| --- | --- | --- |
| `recon` | 11 | 侦察 |
| `internal` | 13 | 内网 |
| `exploit` | 8 | 利用 |
| `vuln-scan` | 6 | 漏洞扫描 |
| `plan` | 2 | `campaign-planning`、`redteam-setup` |
| `assess` | 1 | `specialist-paths` |

`assess` 是预设里已声明的合法角色码（`presets/redteam/agent.cordis.yml` 第 61 行），不是新增枚举。

## 验收

1. `skills/redteam` 下 `.md` 共 41 份，全部以 `---` 开头（front matter 完整）。
2. 与上游 v0.15.8 的 `skills/` 逐字节一致：本次追加文件均为 `Copy-Item` 直接拷贝，未做改写。
3. 技能由 `lib/redteam/index.js` 的 `skills/redteam` 目录发现，无需登记清单。
4. `docs/redteam-upstream-DISCLOSURE` 的技能计数同步改为 41。

## 不做的事

- 不改 `presets/redteam`，不为新技能新增 worker 角色组合。
- 不改 `skill-fixes.js` 的既有修正。
- 不引入上游的 `packages/redteam-bundle`（那是另一套分发形态，本仓库只取技能正文）。
