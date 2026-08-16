# Delta Spec — 0.8.3 发布

## Added

- 版本 `0.8.3`（stable）：包含 canonical 清单 OS 元数据容忍、manualChunks 循环初始化修复，以及 v0.8.2 之后合入的性能优化（定向工作区同步、FTS 触发器收窄、单事务创建、markdown memo、流式节流、jsx-runtime 分包、web 缓存压缩等）。
- CHANGELOG / 发布说明含 verbatim macOS 未签名 fork 安全说明。

## Scenarios

- 0.8.2 的 auto-update 客户端在稳定通道收到 0.8.3 升级。
- 曾因浏览数据目录触发 `.DS_Store` 白屏的用户升级后可正常启动。
