# DSH 自定义市场索引

正式源地址：**https://kingcharleslzy-ai.github.io/dsh-purge/index.json**

DSH「插件 → 实验性插件 → 更多 → 自定义插件市场」开启后，在「发现 → 添加索引源」粘贴该地址。没有这个功能的旧宿主仍可通过 GitHub Release 安装。

索引遵循官方 format 1，收录 Purge（从 1.6.5 起）、DSH-Spicy 和 Breeze Voice 的正式版本；源码安装固定到完整 Git 提交，不指向可变分支。发布工作流成功后生成并部署 GitHub Pages，不需要手改索引。

每个条目分别声明其已验证的宿主版本范围，不声称其他宿主已验证。市场展示不代表 DeepSeek 官方背书，也不会自动应用宿主补丁。

社区目录收录与自建源是两件事：自建源由用户添加；社区目录需提交条目并等待维护者审核。

官方规范：https://deepseek-harness.github.io/deepseek-harness/en/guide/plugin-market

发布新版 Breeze Voice 后，将发行包的预编译 Git 快照提交、发布时间和宿主兼容范围登记在 `market/breeze-voice.json`，验证后部署索引。
