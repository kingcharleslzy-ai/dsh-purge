# 只读宿主：iOS 下让补丁真正落盘的可行做法

> 适用：DSH 跑在 iOS app 内，引擎依赖树位于 `/opt/dsh/nodejs-project/node_modules` 且不可写。
> 实测环境：`dsh-purge-community` 1.7.20 · DSH 0.2.2-rc.4 · iOS 内嵌引擎。
> 结果：面板 `5/69 applied, 59 pending` →`71 applied / 0 pending`，只读安装树**零字节改动**。

本文只描述方法，不改任何现有代码；配套的可运行脚本放在
[1941462688/dsh-purge-ios-writable-host](https://github.com/1941462688/dsh-purge-ios-writable-host)。

---

## 1. 现象

点「应用」报：

```
Error: Host backup failed (65 files); patch writes cancelled.
```

面板长期停在 `3/69 applied, 62 pending`。注意这是 **`EPERM`（策略层拦截）**，不是 `EROFS`：

```bash
$ stat -c '%A %U:%G' /opt/dsh/nodejs-project/node_modules/@deepseek-ai
drwxr-xr-x user group          # 权限位看起来完全可写

$ touch /opt/dsh/nodejs-project/node_modules/@deepseek-ai/.probe
touch: cannot touch '.../.probe': EPERM
```

逐层探测边界：`/` `/opt` `/home/dsh` `/tmp` 可写，`/opt/dsh` 及其以下只读。

## 2. 根因

补丁引擎在写任何补丁前，会把每个目标文件备份到**源文件旁边**（`<file>.dshpurge.bak`）。目标全在只读区 → 备份全部失败 → 整体取消，一条也写不进去。所以提权、改权限位、重装插件都无效。

## 3. 思路：不改只读的树，改「谁被读取」

引擎的模块解析里，**profile 目录优先于 bundle 内的安装树**。这正是 `runtime/module-redirects.mjs` 注释描述的行为：

> The plugin manager finds their bundle there, but the loader imports their components from the profile folder, which holds none of them: a lookup that fails there is tried again from the engine's folder. **A copy the profile installed itself still wins, being found first.**

于是：把 `@deepseek-ai` / `@earendil-works` 镜像到 `$DSH_HOME/profiles/<name>/node_modules`（可写），让插件的补丁目标根指向副本，补丁打在副本上，引擎读的也是副本。

三个前提，缺一条这条路就死：

1. 引擎模块解析 profile 优先（引擎自带）
2. profile 在可写区（`$DSH_HOME` 从来可写）
3. 插件本身装在 profile 里（所以插件代码可改）

## 4. 需要改的七处目标根

`lib/core.js` 两处：

- `findAiBase()`：web 分支原本直接 `findAiBaseWeb()` → `resolveInstance()` → `/opt`，改为副本优先（`findAiBaseFromDshHome(findDshHome())`，这是插件**自带**函数，本来就支持 profile 位置，只是 web 模式未优先调用）。
- `enumeratePatchAiBases()`：不拦截则仍返回 `/opt`（`process-entry` 判定优先），需在 `resolveInstance()` 之前插入副本分支。

`lib/index.js` 五处（状态、诊断、自检、维护按钮的目标根）：

```js
// 必须是模块顶层函数声明：状态端点在 installWebServer() 里，
// 与 apply() 是两个独立作用域，函数内定义够不到（会 ReferenceError）
function patchHost() {
  try { const shadow = core.findAiBase(); if (shadow) return shadow; } catch {}
  return resolveInstance().host;
}
```

替换：`compatibility(patchHost())`、`new Maintenance({ aiBase: patchHost() })`、`const target = patchHost()`（×2）、`selfCheck(patchHost(), …)`。
其中 `Maintenance` 最关键——它是面板「应用 / 还原 / 卸载」三个按钮真正写到哪里。

> ⚠️ 锚点随版本漂。升级插件后必须先核对两处 `core.js` 文本与 `index.js` 的 `export function apply(ctx, config) {`，否则静默注入失败。

## 5. 在独立进程落补丁

`purge_apply` 走的是进程内已加载的模块，改磁盘无效。需要一个独立 node 进程调用 `core.applyPatchesAllHosts(core.ALL_PATCHES, { hosts })`，并在调用前断言目标根不在 `/opt/`（否则 `exit 2`，不静默空转）。

一次跑完归一后的典型分布（rc.4 实测）：

```
applied       64   #1,#4,#5,#6,#7,#8,#13…#96
already        7   #2,#3,#12,#21,#50,#73,#90
na             7   #45,#46,#82,#83,#84,#91,#92      平台不适用
missing_file   5   #28,#30,#31,#64,#65             目标包未安装 / 文件不存在
skipped        3   #35,#76,#80                     条件跳过
disabled       2   #18,#19                          配置层主动关
```

## 6. 验证：文件被改 ≠ 代码在跑

1. 副本完整性（包数与引擎一致）、补丁标记落地（`grep -rl 'dsh-purge' <副本>` > 0）。
2. **原件零污染**：`grep -rl 'dsh-purge' /opt/.../@deepseek-ai | wc -l` 必须为 `0`。
3. 面板接口：`curl -s http://127.0.0.1:3080/dsh-purge/status` → `ai_base` 指向 profile，`patches_pending: 0`。
4. **行为探针（决定性）**：#22 `READ_CAPS_RAISED` 把 `dsh-tool-fs` 单行上限从 `2e3` 改为 `1e4`。造一个 6007 字符单行：

   ```bash
   python3 -c "open('/tmp/probe.txt','w').write('X'*6000+'ENDMARK')"
   ```

   用读取工具读它：在 2000 字符处截断、看不到 `ENDMARK` → 补丁未生效；整行读完、末尾出现 `ENDMARK` → 引擎确实在加载副本。

重启前后各测一次，对照才有意义（进程内会缓存目标根）。

## 7. 数字口径

- 工具 `purge_status`：只统计可写入子集 → `64/69 applied, 0 pending`
- 面板 / 接口：按 surface 统计 76 项（含 skipped，排除 na）→ `71 applied, 0 pending`

两者都是 0 pending 即正确，不必追求数字相同。`missing_file`、`na`、`skipped`、`disabled` 都不是失败。

## 8. 维护与回滚

| 触发 | 处理 |
|---|---|
| 插件升级 | 七处注入被覆盖 → 重跑恢复脚本，重启 |
| App / 引擎更新 | 先删副本再重建，否则引擎一直读旧副本 |
| `pnpm install` 或清过 node_modules | 副本被删 → 重建 |
| 面板突然大量 pending | 先跑 `--check` 定位是重定向丢了还是副本不全 |

回滚零风险（副本是纯拷贝，原件一字节未动）：

```bash
cp <plugin>/lib/core.js.bak-shadow-*  <plugin>/lib/core.js
cp <plugin>/lib/index.js.bak-shadow-* <plugin>/lib/index.js
rm -rf $DSH_HOME/profiles/web/node_modules/@deepseek-ai
rm -rf $DSH_HOME/profiles/web/node_modules/@earendil-works
```

## 9. 代价

- 磁盘：副本 ≈ 116M（rc.4，336 个包）
- 副本不受 `pnpm` 管理：插件升级要手重跑脚本
- `pnpm add` 可能重写 `package.json` 并删掉/补进 `dsh.profile.bundles` 条目，装完核对再重启
- shim（`dsh` / `dsh.cmd` / `dsh.ps1`）在 iOS 引擎里本来就没有，面板会一直挂 ✗，不影响功能

## 10. 与其它路线的对比

| 路线 | 适用 | 代价 |
|---|---|---|
| 改解析（本文） | 宿主只读、不可重签，但引擎留了「用户层优先」通道 | 副本占盘，升级后要重建 |
| 改文件（patch-package / pnpm patch） | 目标 node_modules 可写 | 不适用于 EPERM |
| 改安装包（自签 IPA / TrollStore） | 能自行签名 | 版本与插件要跟着重打 |
| 改运行时（Frida / fishhook） | 有注入能力 | 门槛高，对签名 App 通常不可行 |
