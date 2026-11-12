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

### 所有路由必须走同一口径

`/dsh-purge/community` 在 `apply()` 里单独注册，不走 `installWebServer` 的 `registerPluginRoute` 包装，因此一度漏掉了 `trustedHostnames(webServer.host)` 这个参数。后果是非回环绑定时**只有这一条路由返回 403**，其余正常：

```
绑定 192.168.1.50，PURGE_TRUSTED_HOSTS 未设置
  Host: 192.168.1.50:43120  →  其他路由 200 / community 403
```

`allowPluginRequest` 的第三个参数默认值是 `trustedHostnames()`（不含绑定地址），所以任何新增路由只要忘了传，就会复现这个不一致。回归用两组断言钉住：直接对照「传 / 不传」，以及驱动真实注册的 handler 确认绑定地址不再 403、rebinding 仍 403。

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

### PAX 扩展头：size 覆盖会改变布局

PAX 的 `size` 记录会覆盖紧随条目头部声明的大小，解压器按**覆盖值**读取。扫描器若仍按头部原值推进，两边对归档结构就分叉了。

实测样本：PAX 写 `size=1024`，头部写 512，其后一个符号链接。

```
系统 tar 的解读:  pkg/file.txt (1024B)   pkg/link -> ../../../victim
旧实现:           ❌ 未检出
外部 tar 解压:    pkg/file.txt 实际 1024 字节（PAX 生效）  pkg/link 是符号链接: true
```

现在 `parsePaxRecords()` 解析 `x` 扩展头并采用生效值；`g`（全局）头若覆盖 size 则整份拒绝——无法安全地把一个覆盖值套用到任意多条后续条目上。

**一个必须注意的实现细节**：PAX 记录长度以**字节**计，含记录自身。UTF-8 文件名上一个字符占多字节，按解码后的字符下标切片会与实际长度错位。这一版最初就是这样写的，被「中文名 skill 包」的真实归档测出误拦——`技能/说明.md` 的 `path` 记录解析失败。现在全程在 Buffer 上按字节推进。

回归里有四条真实 tar 产出的归档（普通、超长路径、中文名、空文件）确保不被误拦，另有 `linkpath` 记录、损坏记录、无换行记录、全局 size 覆盖五条负向用例。

### 与解压器不一致的格式，一律拒绝而不是猜

扫描器必须与解压器对归档结构得出同一个结论。凡是没有可依赖规范、或两边可能分叉的布局，宁可整份拒绝：

| 布局 | 处理 | 依据 |
|---|---|---|
| 连续多个 `x` PAX 头 | 拒绝 | bsdtar 直接报 `Redundant 'x' header` 并拒绝解压；合并/覆盖语义无规范可依 |
| `S`（GNU sparse 旧格式） | 拒绝 | 头部之后额外跟 4 个映射块，只按头部 size 推进会落在映射块中间 |
| `L` / `K`（GNU 长文件名 / 长链接名） | 拒绝 | 内容是为下一条目保留的名字，与 size 语义无关，合并方式无规范 |
| `g` 全局 PAX 覆盖 size | 拒绝 | 一个覆盖值无法安全套用到任意多条后续条目 |

这几类在真实 skill 包里不会出现——本机 bsdtar 的 `-cS` 根本不产 `S` 类型，而是把稀疏文件写成完整普通文件。因此拒绝不误伤正常归档，回归里有真实归档对照。

### ZIP 的 EOCD 不能只认第一个签名

归档注释可容纳任意字节。尾部向前扫描时，注释里一段伪造 EOCD（「0 条目、中央目录偏移 0」）会被选中，于是符号链接条目被完全跳过 —— 扫描器放行，解压器照旧读取。

校验分两层，缺一不可：

1. **候选自洽**（`eocdIsSelfConsistent`）：`centralOffset + centralSize` 必须**恰好等于**该 EOCD 的位置（中间不留空隙）；条目数为 0 时要求 `centralOffset === 0` 且 `centralSize === 0`；逐条走完中央目录记录（46 字节固定头 + 名称/extra/注释），走完必须正好用掉声明的长度。
2. **候选唯一**：任何两个通过的候选都不共存，整份拒绝。

第 2 层不能省。曾经只比「中央目录偏移是否不同」，于是伪造候选只要**抄真实偏移**就能与真实候选并存 —— 选谁取决于扫描顺序，这是把安全判定建在迭代顺序上。第 1 层的「0 条目要求偏移为 0」让这类抄偏移的空壳候选在候选阶段就出局，第 2 层则兜住「归档被拼接」这类两个候选各自都说得通的情况。

### ZIP 的解压后上限分两道

tar/tar.gz 在扫描前就把字节读进内存，上限由 `maxOutputLength` 收口。ZIP 走外部工具时，写入磁盘发生在实际字节统计之前：

- **第一道** `assertDeclaredUnpackedWithin()`：解压前按中央目录声明的未压缩大小求和，超限即拒。
- **第二道** `assertActualTreeWithin()`：外部工具返回后实测磁盘占用（不跟随链接），超限即失败。

实测两个解压器（`Expand-Archive`、bsdtar）都按声明值**截断输出**：声明 1KB 的 60MB 炸弹，磁盘上只有 1024 字节。所以正常路径下第二道不触发 —— 它挡的是「解压器不遵守声明值」这种实现差异，那时只有量磁盘才发现。两道不能互相替代：声明值由归档自己写，可能造假。

### tar.gz 的解压后上限

归档本身限 12MB，但 gzip 压缩比不受此约束：几十 KB 的 tar.gz 可以解出上百 MB。无上限的 `gunzipSync()` 会在任何后续大小检查生效前先吃光内存（实测 49KB → 50MB）。

`tarBytesForInspection()` 现在带 `maxOutputLength: MAX_UNPACKED_BYTES`，超限抛 `ERR_BUFFER_TOO_LARGE` 并转成明确的「解压后超过 50MB」。未压缩 tar 同样按读入字节数检查。

### 边界

- 合法归档不受影响：普通文件、可执行位、目录条目、子目录、扩展头、base-256 大小都放行（有回归覆盖）。
- 只用 Node 内建模块，不新增依赖，不调用日志外的外部命令。
- 拒收是整份失败，不做「跳过链接条目继续解压」—— 静默丢弃会让 skill 残缺且用户看到「导入成功」。

## 测试

新增三组，均登记进 `npm test`：

- `test/archive-symlink-guard.test.mjs`（29 例，1 例按平台跳过）—— zip 符号链接、tar typeflag 1/2、base-256 大小、无法识别的大小字段、负大小、PAX size 覆盖、PAX linkpath、PAX 损坏记录、UTF-8 记录、连续 `x` 头、`S`/`L`/`K` 类型、伪造 EOCD、声明大小超限、真实 tar 归档不误拦
- `test/plugin-request-host-fence.test.mjs`（13 例）—— 含 `PURGE_TRUSTED_HOSTS` 的实际解析与清空后回落
- `test/community-route-admission.test.mjs`（4 例）—— `/dsh-purge/community` 与其他路由的准入一致性
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
