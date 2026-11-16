# Inspector Cordis Tree Snapshot Over Budget

Some Inspector builds prune by payload size, but when writing state they account for topic, timestamp, etc. together with it. When the tree is near the byte limit, a write may still exceed the limit even if pruning succeeded.

Both host and renderer reserve 1 KiB for the record envelope. If the Cordis tree is still rolled back due to state exceeding the limit, the buffer keeps the previous frame and the next update can still be published. Over-limit conditions for other topics, collector errors, serialization errors, and listener exceptions continue to be reported according to the host's original semantics. The implementation matches only the over-limit branch after rollback and does not wrap the entire publish callback.

Regression tests exercise buffer methods, covering normal enqueue, retaining the old value after over-limit, retracting when no old value exists, over-limit on other topics, and exception propagation. Run `node --test test/inspector-budget.test.mjs`.
