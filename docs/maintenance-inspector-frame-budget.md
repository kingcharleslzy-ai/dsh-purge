# Inspector 的 Cordis 树快照超限

部分 Inspector 构建按 payload 大小剪枝，但在写入 state 时会连同 topic、时间戳等一起计量。树接近字节上限时，即使剪枝成功，写入仍可能超限。

宿主和渲染端各预留 1 KiB 给记录外壳。如果 Cordis 树仍因 state 超限而被退回，缓冲区保留上一帧，下一次更新仍可发布。其它 topic 的超限、采集器错误、序列化错误和监听器异常继续按宿主原有语义报告。实现只匹配回滚后的超限分支，未包装整个发布回调。

回归测试执行缓冲区的方法，覆盖正常入队、超限后保留旧值、无旧值时撤回、其它 topic 超限和异常传播。可运行 `node --test test/inspector-budget.test.mjs`。
