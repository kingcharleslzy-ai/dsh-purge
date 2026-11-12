# 面板 Host 校验与归档链接条目

本轮修两处「名字合法、内容越界」的缺陷：面板路由只比较 Origin 与 Host 的字符串相等，以及归档解压只看条目名、不看条目类型。两处都不改动用户配置、提示词、预设或既有安装，也不需要重启。

## 1. `/dsh-purge/*` 的 Host 归属校验

### 根因

`allowPluginRequest()` 原来的唯一校验是「Origin 的 host == Host 头」。DNS rebinding 场景里浏览器把两个头都写成攻击者域名、`sec-fetch-site` 仍是 `same-origin`，这组自比较全部通过。面板路由自身没有鉴权，宿主 `@deepseek-ai/dsh-client-connection` 的 `/api` 浏览器信任围栏只覆盖 `/api` 前缀，`/dsh-purge/*` 走 `webServer.register` 的普通路由，拿不到那层保护。

宿主禁止 wildcard 绑定（`dsh-host-webserver` 对 `0.0.0.0` 直接抛错），所以面板必然监听在一个具体地址上 —— rebinding 正好对应这条路线。

### 修复

准入顺序改为「先认 Host 归属，再认浏览器同源标记」：

1. Host 必须属于本机：回环（`localhost` / `::1` / 任意 `127/8`）或监听器自己的绑定地址（`webServer.host`，从配置读取，不信任请求头）；
2. 非回环部署（局域网、反向代理）用 `PURGE_TRUSTED_HOSTS` 显式追加允许的主机名，逗号/分号/空白分隔；
3. 之后保持原有的 `sec-fetch-site` / `Origin` 判定不变。

回环判定与宿主 `isLoopbackHostname()` 同一口径。缺少 Host 头一律拒绝，与宿主 `/api` 围栏一致。

### 边界

- 不改端口、不扩大 Cookie 域、不合并多实例；绑定地址仍来自 `webServer` 配置。
- `PURGE_TRUSTED_HOSTS` 是显式选择，不设置就没有额外放行；它不覆盖 TLS、SHA256 或任何更新通道校验。
- 本机 CLI 直接调用 handler（不经 HTTP）不在此层，行为不变。

## 2. 归档链接条目

### 根因

`safeZipName()` 与 `isUnsafeArchiveEntry()` 只过滤名字里的 `..`、绝对路径和盘符。但 zip 条目还带着两样没被检查的东西：**内容**是链接目标，**unix mode** 写着它是符号链接。名字 `pkg/link` 完全合法，外部 `tar` 却会把它建成真实链接，随后 `pkg/link/xxx` 就写到解压根之外。

这与 `update-install.js` 里「Node extraction creates only regular files, never archive symlinks」的假设冲突：该假设对 Node 自实现分支成立，对 `extractZipArchive` 平台首选的外部工具分支不成立。tar/tar.gz 路径同理 —— `tar -tf` 只列名字，看不到 `typeflag=1/2`。

### 修复

- `readZipEntries()` 补读中央目录 external attributes（`>>> 16` 取高 16 位 unix mode），新增 `assertNoArchiveSymlinks()`：解压前扫一遍，命中符号链接条目即整份拒收。
- 新增 `assertNoTarSymlinks()`：只用 Node 读 512 字节头块，typeflag `1`（硬链接）与 `2`（符号链接）都拒收；扩展头（`x`/`g`/`L`/`K`）按其长度跳过。
- 两处都发生在写盘**之前**：测试断言解压目录保持为空。

### tar 大小字段：必须认两种编码，认不出就拒收

扫描靠「头部 512 字节 + 按 size 跳过数据块」推进。size 读错会让游标停在数据块中间，之后把数据当头部读——**反而可能整段跳过后面的链接条目**，让校验失效。

因此 `tarEntrySize()` 同时支持：

- 八进制 ASCII（POSIX ustar 常规写法）；
- base-256（首字节最高位置 1，其后大端二进制；GNU/bsdtar 对大于 8GB 的条目会用它）。

**认不出就抛错，不当成 0 继续扫**。回归里有一条样本专门把 `77777777777` 写进数据块偏移 124：旧实现把数据块当头部，按这个伪大小跳过 4GB，直接漏掉紧随其后的链接条目（实测漏检，且外部 tar 确实建出了那个链接）。

### tar.gz 的解压后上限

归档本身限 12MB，但 gzip 压缩比不受此约束：几十 KB 的 tar.gz 可以解出上百 MB。无上限的 `gunzipSync()` 会在任何后续大小检查生效前先吃光内存（实测 49KB → 50MB）。

`tarBytesForInspection()` 现在带 `maxOutputLength: MAX_UNPACKED_BYTES`，超限抛 `ERR_BUFFER_TOO_LARGE` 并转成明确的「解压后超过 50MB」。未压缩 tar 同样按读入字节数检查。

### 边界

- 合法归档不受影响：普通文件、可执行位、目录条目、子目录、扩展头、base-256 大小都放行（有回归覆盖）。
- 只用 Node 内建模块，不新增依赖，不调用日志外的外部命令。
- 拒收是整份失败，不做「跳过链接条目继续解压」—— 静默丢弃会让 skill 残缺且用户看到「导入成功」。

## 测试

新增三组，均登记进 `npm test`：

- `test/archive-symlink-guard.test.mjs`（14 例）—— zip 符号链接、tar typeflag 1/2、base-256 大小、无法识别的大小字段、负大小
- `test/plugin-request-host-fence.test.mjs`（13 例）—— 含 `PURGE_TRUSTED_HOSTS` 的实际解析与清空后回落
- `test/skills-archive-limit.test.mjs`（4 例）—— gzip 炸弹被拒、正常包不受影响、接近上限的包不误伤

`PURGE_TRUSTED_HOSTS` 的用例走 `allowPluginRequest` 的**默认参数**路径，即真的从环境变量读，而不是测一个内部函数。早先那版测试在函数未导出时直接 `return`，等于一个断言都没跑——已删除。

`test/plugin-lifecycle.test.mjs` 与 `test/http-handlers-target.test.mjs` 里直接调用 handler 的夹具补了 `host: 127.0.0.1:3080`：这两个夹具绕过 HTTP 层、不带 Host 头，而真实 HTTP/1.1 请求必有 Host。宿主 `/api` 围栏同样对缺 Host 的请求返回 false，所以这是夹具问题，不是放宽准入。

## 复现与验收

```sh
node --test test/archive-symlink-guard.test.mjs test/plugin-request-host-fence.test.mjs test/skills-archive-limit.test.mjs
npm test                      # 全量
npm run check:docs            # 版本行一致性
```

面板行为可用真实 socket 验证：Host 为 `rebind.<任意域名>` 时 `/dsh-purge/*` 返回 403，`127.0.0.1`/`localhost`/`[::1]` 正常返回 200。
