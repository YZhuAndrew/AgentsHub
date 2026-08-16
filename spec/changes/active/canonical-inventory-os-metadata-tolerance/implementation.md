# Implementation

## 缺陷复现（用户实测）

- 用户安装本地测试 DMG（0.8.2 + 性能改动）后窗口空白；`pnpm electron:dev` 正常（dev 使用独立用户数据目录）。
- `~/Library/Application Support/PromptHub/logs/startup.log` 中 16:49 起每次启动记录 `startup:bootstrap_workspace_failed: "canonical graph file inventory count mismatch: .DS_Store"`。
- 用户数据目录实测存在 `data/.DS_Store`（根）与 20 个 `data/skills/<id>/files/.DS_Store`——Finder 浏览工作区目录所致。
- 根因：`packages/core/src/prompt-canonical-import.ts` 的 `inventoryRoot` 清单遍历未应用仓库既有的 OS 元数据忽略约定（`storage-inventory.ts` 已忽略 `.DS_Store`/`Thumbs.db`），根目录任何多余文件都会使 canonical 导入抛错、启动链中断。属既有缺陷（0.8.2 发布版同样存在），非本轮性能改动引入。

## 修复

- `storage-inventory.ts`：私有 `IGNORED_EMPTY_ENTRIES` 提升为导出 `OS_METADATA_FILE_NAMES`（单一事实来源，原常量别名引用保持不变）。
- `prompt-canonical-import.ts`：`inventoryRoot` 遍历时按该集合跳过（任意目录层级）；不进入清单、不参与未声明文件判定与文件数上限。
- 容忍面严格限定两个固定文件名：未声明的普通文件（如 `notes.txt`）仍抛 `inventory count mismatch`（回归测试锁定）。

## 验证记录

| 项 | 结果 |
| --- | --- |
| `packages/core/tests/prompt-canonical-import-os-metadata.test.ts`（新增） | 2/2：两层级 `.DS_Store`/`Thumbs.db` 下导入成功且 prompt/folder 数据完整；普通未声明文件仍拒绝（实现前第一项精确复现用户报错后失败） |
| core 全量 | 53 文件 / 516 测试通过 |
| desktop canonical 相关（startup/authority/checkpoint/historical-canonical-rebuild） | 18/18 |
| desktop typecheck + 根 lint（含 file-size 门禁） | 通过 |
| 交付 | 重建 `apps/desktop/dist/AgentsHub-0.8.2-arm64.dmg`（含本修复 + 全部性能改动），用户数据目录无需任何清理——`.DS_Store` 被忽略而非删除 |

## Follow-up

- `resource-bundle.ts` 导入侧对 OS 元数据保持严格（本产品生成的传输格式不应混入 OS 文件）；若未来出现用户手工打包 skill 目录带 `.DS_Store` 导入失败，再按实测决定是否放宽。
