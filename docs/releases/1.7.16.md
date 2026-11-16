# 1.7.16

- **dsh-go 宿主锚点（#238）**：手机本机引擎在 `steer` 分支前插入生命周期闸门后，`#90` 的三行锚点不再匹配。现在同时接受裸分支与带闸门分支，`#90` 不再误报失败；`#74` 的同类锚点一并识别。
- **DSH NEXT 归档换包（#235）**：家族探测只在当前 resources 目录内进行，官方路径仍只从 exe 推导；判活改为 `acknowledged / gone / unknown` 三值，只有 `ObjectNotFound` 算确实退出，超时与过期状态文件不会被误当确认。
- **桌面红队工具（#230）**：`dsh-tools` 从 `argv[1]`、`argv[2]`、`PURGE_DSH_CLI` 指向的宿主树逐级解析，桌面版 `out/main/host.js` 布局可命中；红队预设恢复挂载，CLI 候选顺序不变。
- 权限、提示词注入和既有宿主补丁行为不变。

验证：691 项测试通过 / 30 平台跳过；面板 0 失败；客户端一致性、UI、发行包 smoke 通过。

完整历史见 [release-notes.md](https://github.com/kingcharleslzy-ai/dsh-purge/blob/master/release-notes.md)。
