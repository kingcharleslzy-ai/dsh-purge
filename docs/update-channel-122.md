# #122：更新网络与密钥文件权限

本次只修改更新通道和凭据文件处理，不修改宿主补丁、提示词、权限选择或自动更新开关。不自动重启 DSH，也不改系统代理、TUN、Defender 或白名单。

## 行为

- Windows 静态 WinINET 配置优先通过系统 `reg.exe` 只读获取；失败、编码或格式不明确时，使用系统 Windows PowerShell 5.1 以 UTF-8 读取。成功结果缓存 30 秒，失败不缓存；不执行 PAC/WPAD。两个 Windows 助手只在自己的子进程内使用 Windows PowerShell 5.1 系统模块，避免继承 PowerShell 7 模块路径导致 Get-Acl 等命令加载失败；父进程及系统环境不变。
- 保留原有显式更新代理、环境变量和 `NO_PROXY` 优先级。代理探测失败明确标注 HTTP 尚未发送，不静默改走直连；发行列表降级也保留原原因，不再统称 GitHub API 不可用。
- `ECONNRESET`、`ECONNREFUSED`、`EPIPE`、`ETIMEDOUT`、`EAI_AGAIN`、`ENETUNREACH`、`EHOSTUNREACH` 最多重试两次，退避 150/300 毫秒。重定向共用重试预算；探测、传输和退避都受原请求总超时约束。收到不完整正文后重试会丢弃该正文。
- HTTP 错误、认证失败、证书错误、代理配置错误、来源限制、文件过大和 SHA256 不匹配不会被这层重试掩盖。既有 Atom/缓存/归档备用通道策略不变；token 仍仅发送到 GitHub API。
- Windows 的 `update-channel.json` 在首次读取时收紧旧文件 DACL，但不修改内容；新文件先在受保护的暂存目录中以受保护 DACL 创建，再写入明文和原子替换。只允许当前进程用户、SYSTEM、Administrators，不继承普通 Users 权限。凭据经子进程 stdin 传递，不进命令参数、环境变量或报错输出。
- macOS/Linux 保持文件 `0600` 和原子替换。行为偏好与凭据分开存储；只改检查间隔不重写 token。空 token 表示保留，显式清除才删除。异常 JSON 只报格式错误，不输出原文。
- 文件被占用、只读、保护助手执行失败等情况明确失败并保留旧凭据。只清理本轮的精确暂存文件和目录，不递归清理链接目标。

## 测试入口

```sh
node --test test/update-http.test.mjs test/update-resilience.test.mjs test/update-secrets.test.mjs test/update-policy.test.mjs test/update-proxy-runtime.test.mjs
# 另行下载的 Electron，不能指向正式 DSH
PURGE_ELECTRON_EXEC=/path/to/isolated/Electron node scripts/check-update-runtime.mjs
# 只读真实 WinINET 与公开 GitHub 发行信息，不输出代理或密钥值
node scripts/check-update-channel-runtime.mjs
```

Windows 对应在当前测试进程设置 `PURGE_ELECTRON_EXEC` 后运行相同 Node 脚本。TLS 测试用临时自签 CA，仅通过子进程 `NODE_EXTRA_CA_CERTS` 信任；不关闭 TLS 校验、不改系统证书。没有 OpenSSL 时提供包含 `key.pem` / `cert.pem` 的 `PURGE_TEST_TLS_DIR`，否则该项明确跳过，不能声称已验收。

## 实测范围与边界

- macOS、本机 Windows 11 4090：实际公开 GitHub 请求返回 HTTP 200；4090 三次真实 `reg.exe` 探测约 9–11 ms，实际 PowerShell 备用读取与之相符。这不是所有机器的性能保证。
- 两平台隔离 Electron 44.7.0：真实 HTTPS → CONNECT / SOCKS、连接重置、半途断流、超时、凭据重定向隔离和下载 SHA256 校验；Windows 真实继承 ACL、旧文件迁移、只读文件失败、文件占用失败及释放后恢复。假 token 与所有修改均在临时目录内。
- 4090 另用实际 PowerShell 7.6.5 模块路径重现：旧助手 Get-Acl 加载失败，修正子进程模块路径后成功；另覆盖实际 8.3 短路径和不兼容模块的自动回归。
- 此次未在报告者 Windows 10 19041 / 特定 Clash TUN fakeIP 环境实机复测；仍请报告者更新后确认原来的失败是否消失。不要因此宣布其代理、DNS 或所有网络故障都已解决。
- ACL 是本机访问控制，不是加密；不能保护凭据免受同一用户进程、SYSTEM 或管理员读取。共用 profile 的服务必须使用正确的运行账户；不要为了通过测试扩大 ACL。读取权限检查按文件身份和元数据缓存，不是持续文件监控。
