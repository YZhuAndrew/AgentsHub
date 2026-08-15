# Delta Spec — 数据库热路径（packages/db）

## Added

- `PromptDB.create` 应为原子操作：prompt 行插入与初始版本（version 1）写入在同一事务内提交。事务外的观察者不应看到"prompt 行存在但 initial version 缺失"的中间状态。
- 既有安装应通过幂等迁移（`schema_migrations` 记录 `narrow_prompts_fts_update_trigger_v1`）将 `prompts_au` 触发器从 `AFTER UPDATE ON prompts` 替换为 `AFTER UPDATE OF title, description, system_prompt, user_prompt, tags ON prompts`。

## Modified

- `prompts_fts` 的 update 触发器只应在 FTS 索引列（title、description、system_prompt、user_prompt、tags）出现在 UPDATE 的 SET 子句时重写对应 FTS 行；`usage_count`、`is_favorite`、`current_version`、`sort_order` 等非索引列更新不应触发 FTS 行重写。

## Scenarios

- 用户在任意入口复制 prompt（`incrementUsage`：`UPDATE prompts SET usage_count = usage_count + 1`），随后以该 prompt 的标题关键字全文检索，应仍能命中；FTS 行内容与检索行为与变更前一致。
- 用户编辑 prompt 标题或 tags（SET 子句包含索引列），全文检索应立即反映新值。
- 用户创建 prompt，随后进程在任意时刻崩溃或被杀死，数据库中的该 prompt 要么连同 initial version 一起存在，要么一起不存在。
- 从旧版本升级的既有数据库执行 `initDatabase` 后，`sqlite_master` 中的 `prompts_au` 定义应包含 `AFTER UPDATE OF` 子句，且 `schema_migrations` 含 `narrow_prompts_fts_update_trigger_v1`；重复执行 init 不产生副作用。
