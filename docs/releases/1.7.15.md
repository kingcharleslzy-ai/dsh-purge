# 1.7.15

- **保留宿主权限（#240）**：新会话沿用 DSH 选择的权限。14 条会改变权限默认值或执行边界的补丁改为显式选择，只有 `tuning.extraPatches` 明确启用才生效。
- **旧版权限迁移（#240）**：点「应用」时用旧版备份重演，逐字节一致才只撤回插件写入的权限改动，保留同文件其他补丁；备份可疑、锚点冲突或缺少备份时保留原文件并报告。profile 和历史会话的权限选择保留。
- **Windows 签名 sidecar（#241）**：在归档换包前，把 ASAR 清单指纹和相对路径绑定到 20 个签名 sidecar 的完整 SHA256；等长替换、追加数据、截断签名都会失败。未知大小例外继续停止 staging。
- **包图标（#232）**：声明 `icon.png`，插件卡片/详情页显示原图；侧栏用同图的 alpha 线稿跟随主题色。
- **清理（#233）**：移除已被共享详情页取代的 `settings-shell.js`；客户端产物不变。

验证：659 项测试通过 / 29 平台跳过；面板 0 失败；权限迁移、隔离文件/进程边界、签名 sidecar 回归通过；macOS 与 Windows 11 实测见 PR 记录。

完整历史见 [release-notes.md](https://github.com/kingcharleslzy-ai/dsh-purge/blob/master/release-notes.md)。
